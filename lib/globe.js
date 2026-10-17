// A globe you can turn: the camera, mouse, touch and keyboard controls, and
// the maths to put a latitude and longitude on screen. Pages paint the planet
// their own way; Globe.webgl() runs a fragment shader that paints the sphere,
// with GLSL helpers to read lib/planet.js fields at any point.
//
//   const g = new Globe(element, { lat, lon, zoom, minZoom, maxZoom, spin });
//   g.layout(cx, cy, radius)       where the globe sits, in CSS pixels
//   g.tick(dt)                     each frame: drift after a fling and idle spin
//   g.project(lat, lon)            -> { x, y, z }: on screen, facing us when z > 0
//   g.ontap(x, y), g.onhover(x, y) callbacks
//   Globe.labels()                 point labels that never cover each other
(function (root) {
  'use strict';

  const RAD = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wrap = (lon) => ((((lon + 180) % 360) + 360) % 360) - 180;

  class Globe {
    constructor(el, opts) {
      const o = opts || {};
      this.el = el;
      this.lat = o.lat != null ? o.lat : 20;
      this.lon = o.lon != null ? o.lon : 0;
      this.zoom = o.zoom || 1;
      this.minZoom = o.minZoom || 0.85;
      this.maxZoom = o.maxZoom || 4;
      this.maxLat = o.maxLat || 70;
      this.spin = o.spin != null ? o.spin : 3;   // degrees per second when nobody is turning it
      this.hold = false;                          // true stops the idle spin
      this.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.cx = 0; this.cy = 0; this.r0 = 100;
      this.vlon = 0; this.vlat = 0;               // drift after a fling, degrees per second
      this.idle = 10;                             // seconds since the last touch
      this.ontap = null; this.onhover = null;
      this._pointers = new Map();
      this._bind();
    }

    get radius() { return this.r0 * this.zoom; }
    layout(cx, cy, r0) { this.cx = cx; this.cy = cy; this.r0 = r0; }

    // Unit vector of a place, turned so the centre of view is +z.
    view(lat, lon) {
      const la = lat * RAD, lo = (lon - this.lon) * RAD, p = this.lat * RAD;
      const x = Math.cos(la) * Math.sin(lo), y0 = Math.sin(la), z0 = Math.cos(la) * Math.cos(lo);
      return [x, y0 * Math.cos(p) - z0 * Math.sin(p), y0 * Math.sin(p) + z0 * Math.cos(p)];
    }
    project(lat, lon) {
      const v = this.view(lat, lon), r = this.radius;
      return { x: this.cx + v[0] * r, y: this.cy - v[1] * r, z: v[2] };
    }
    // View-to-world rotation for a shader, column-major. World: x = cos(lat) sin(lon),
    // y = sin(lat), z = cos(lat) cos(lon).
    matrix() {
      const L = this.lon * RAD, p = this.lat * RAD, cL = Math.cos(L), sL = Math.sin(L), c = Math.cos(p), s = Math.sin(p);
      return new Float32Array([cL, 0, -sL, -sL * s, c, -cL * s, sL * c, s, cL * c]);
    }

    zoomBy(f) {
      this.zoom = clamp(this.zoom * f, this.minZoom, this.maxZoom);
      this.idle = 0;
    }
    turn(dlon, dlat) {
      this.lon = wrap(this.lon + dlon);
      this.lat = clamp(this.lat + dlat, -this.maxLat, this.maxLat);
      this.idle = 0;
    }

    // Advance dt seconds. Returns true when the view changed.
    tick(dt) {
      dt = Math.min(dt, 0.1);
      this.idle += dt;
      if (this._pointers.size) return false;
      if (Math.abs(this.vlon) > 0.05 || Math.abs(this.vlat) > 0.05) {
        this.lon = wrap(this.lon + this.vlon * dt);
        this.lat = clamp(this.lat + this.vlat * dt, -this.maxLat, this.maxLat);
        const k = Math.exp(-dt * 2.6);
        this.vlon *= k; this.vlat *= k;
        return true;
      }
      if (!this.reduce && !this.hold && this.spin && this.idle > 2.5) {
        this.lon = wrap(this.lon + this.spin * dt * Math.min(1, (this.idle - 2.5) / 1.5));
        return true;
      }
      return false;
    }

    _bind() {
      const el = this.el, P = this._pointers;
      const local = (e) => { const r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      let start = null, last = null, pinch = null;
      el.addEventListener('pointerdown', (e) => {
        if (e.button > 0) return;
        const [x, y] = local(e);
        P.set(e.pointerId, [x, y]);
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
        this.vlon = this.vlat = 0; this.idle = 0;
        if (P.size === 1) { start = { x, y, t: performance.now(), moved: false }; last = { x, y, t: performance.now() }; }
        if (P.size === 2) {
          const [a, b] = [...P.values()];
          pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, zoom: this.zoom };
          start = null;
        }
      });
      el.addEventListener('pointermove', (e) => {
        const [x, y] = local(e);
        if (!P.has(e.pointerId)) { if (e.pointerType === 'mouse' && this.onhover) this.onhover(x, y); return; }
        P.set(e.pointerId, [x, y]);
        this.idle = 0;
        if (pinch && P.size === 2) {
          const [a, b] = [...P.values()];
          this.zoom = clamp(pinch.zoom * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d, this.minZoom, this.maxZoom);
          return;
        }
        if (!last) return;
        const dx = x - last.x, dy = y - last.y, now = performance.now();
        if (start && Math.hypot(x - start.x, y - start.y) > 6) start.moved = true;
        if (start && !start.moved) return;
        const k = 1 / this.radius / RAD;
        this.lon = wrap(this.lon - dx * k);
        this.lat = clamp(this.lat + dy * k, -this.maxLat, this.maxLat);
        const dt = Math.max(1, now - last.t) / 1000;
        this.vlon = 0.7 * this.vlon + 0.3 * (-dx * k / dt);
        this.vlat = 0.7 * this.vlat + 0.3 * (dy * k / dt);
        last = { x, y, t: now };
        el.classList.add('is-dragging');
      });
      const end = (e) => {
        if (!P.has(e.pointerId)) return;
        P.delete(e.pointerId);
        el.classList.remove('is-dragging');
        if (P.size < 2) pinch = null;
        if (start && !start.moved && e.type === 'pointerup' && this.ontap) {
          const [x, y] = local(e);
          this.vlon = this.vlat = 0;
          this.ontap(x, y);
        }
        if (last && performance.now() - last.t > 80) { this.vlon = this.vlat = 0; }
        start = null; last = null;
        if (P.size === 1) { const [p] = [...P.values()]; last = { x: p[0], y: p[1], t: performance.now() }; }
      };
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
      el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && this.onhover && !P.size) this.onhover(null, null); });
      el.addEventListener('keydown', (e) => {
        const step = 12 / this.zoom;
        const keys = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
        if (keys[e.key]) { e.preventDefault(); this.turn(keys[e.key][0], keys[e.key][1]); }
        else if (e.key === '+' || e.key === '=') { e.preventDefault(); this.zoomBy(1.25); }
        else if (e.key === '-' || e.key === '_') { e.preventDefault(); this.zoomBy(0.8); }
      });
    }
  }

  // ---------- WebGL ----------

  // Helpers every globe shader can use. The page's shader adds uniforms of its
  // own and a main() that paints each pixel.
  const GLSL = `
precision highp float;
uniform vec2 u_res;          // canvas size, device pixels
uniform vec2 u_center;       // globe centre, device pixels from the top left
uniform float u_radius;      // globe radius, device pixels
uniform mat3 u_rot;          // view to world
uniform sampler2D u_planet;  // lib/planet.js fields
uniform sampler2D u_fine;    // lib/planet.js fine land map
uniform float u_time;        // seconds
uniform float u_molten, u_land, u_green, u_ice;
uniform vec3 u_sky;
const float PI = 3.14159265;

// Position in globe units: the disc is radius 1, y up.
vec2 globeQ() { return vec2(gl_FragCoord.x - u_center.x, (u_res.y - gl_FragCoord.y) - u_center.y) / u_radius * vec2(1.0, -1.0); }
vec3 viewNormal(vec2 q) { return vec3(q, sqrt(max(0.0, 1.0 - dot(q, q)))); }
vec2 lonLat(vec3 w) { return vec2(atan(w.x, w.z), asin(clamp(w.y, -1.0, 1.0))); }
vec2 uvOf(vec3 w) { vec2 ll = lonLat(w); return vec2(ll.x / (2.0 * PI) + 0.5, 0.5 - ll.y / PI); }
vec4 fields(vec3 w) { return texture2D(u_planet, uvOf(w)); }
// Degrees from today's coast, + inland and - at sea: the distance field,
// sharpened near the coast by the finer land map.
float coastDeg(vec4 f, vec3 w) {
  float c = (f.r * 255.0 - 128.0) / 8.0 * (360.0 / 1024.0);
  float cf = (texture2D(u_fine, uvOf(w)).r - 0.5) * 0.75;
  return mix(cf, c, smoothstep(0.3, 0.75, abs(c)));
}

float hash3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise3(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1, 0, 0)), f.x), mix(hash3(i + vec3(0, 1, 0)), hash3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0, 0, 1)), hash3(i + vec3(1, 0, 1)), f.x), mix(hash3(i + vec3(0, 1, 1)), hash3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * noise3(p); p = p * 2.03 + 0.17; a *= 0.5; } return s; }

// Height above the sea at time "now", in degrees from the coast. Young Earth
// was nearly all ocean: only the oldest cores of continents and volcanic
// islands stood above it.
float heightAt(vec4 f, vec3 w) {
  float c = coastDeg(f, w);
  float e = c > 4.5 ? max(c, f.g * 25.0) : c;
  float young = 1.0 - u_land;
  if (young < 0.001) return e;
  float need = pow(young, 1.15) * 24.0;
  float n = (fbm(w * 6.0) - 0.5) * 7.0 * young;
  float k = smoothstep(0.0, 0.3, young);
  float isl = (fbm(w * 11.0 + 3.1) - 0.72) * 30.0 * k - 30.0 * (1.0 - k);
  return max(e - need + n, isl);
}
// Ice cover, 0..1, from the latitude and whether it is land.
float iceAt(vec3 w, float land) {
  float lat = abs(asin(clamp(w.y, -1.0, 1.0))) * 180.0 / PI;
  float edge = mix(90.0, -10.0, pow(u_ice, 1.3)) + (1.0 - land) * 7.0 + (noise3(w * 9.0) - 0.5) * 8.0;
  return smoothstep(edge - 1.5, edge + 1.5, lat);
}
`;

  const VERT = 'attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }';

  // A full-screen pass. Returns null when WebGL is not available.
  //   const gl = Globe.webgl(canvas, fragmentSource);
  //   gl.texture(planet.texture()); gl.texture(planet.fine(), 'u_fine');
  //   gl.draw({ u_time: 1, ... });
  Globe.webgl = function (canvas, frag) {
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return null;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); return null; }
      return s;
    };
    const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, GLSL + frag);
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); return null; }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {};
    const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(prog, i);
      uniforms[info.name] = { loc: gl.getUniformLocation(prog, info.name), type: info.type };
    }
    const set = (name, v) => {
      const u = uniforms[name];
      if (!u) return;
      switch (u.type) {
        case gl.FLOAT: gl.uniform1f(u.loc, v); break;
        case gl.FLOAT_VEC2: gl.uniform2fv(u.loc, v); break;
        case gl.FLOAT_VEC3: gl.uniform3fv(u.loc, v); break;
        case gl.FLOAT_VEC4: gl.uniform4fv(u.loc, v); break;
        case gl.FLOAT_MAT3: gl.uniformMatrix3fv(u.loc, false, v); break;
        case gl.INT: case gl.SAMPLER_2D: gl.uniform1i(u.loc, v); break;
        default: break;
      }
    };
    const units = {};
    let ready = false;
    return {
      gl,
      ready: () => ready,
      // A lib/planet.js texture: texture(p.texture()) for u_planet, texture(p.fine(), 'u_fine').
      texture(t, name) {
        const key = name || 'u_planet';
        if (!units[key]) units[key] = { tex: gl.createTexture(), unit: Object.keys(units).length };
        const u = units[key], fmt = t.format === 'luminance' ? gl.LUMINANCE : gl.RGBA;
        gl.activeTexture(gl.TEXTURE0 + u.unit);
        gl.bindTexture(gl.TEXTURE_2D, u.tex);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, fmt, t.width, t.height, 0, fmt, gl.UNSIGNED_BYTE, t.data);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        set(key, u.unit);
        ready = !!units.u_planet && !!units.u_fine;
      },
      draw(values) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        if (!ready) return;
        for (const k in values) set(k, values[k]);
        for (const k in units) { gl.activeTexture(gl.TEXTURE0 + units[k].unit); gl.bindTexture(gl.TEXTURE_2D, units[k].tex); }
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
    };
  };

  // The planet's look (SystemCatalogue.look) as shader uniforms.
  Globe.lookUniforms = function (look) {
    return {
      u_molten: look.molten, u_land: look.land, u_green: look.green, u_ice: look.ice,
      u_sky: look.sky.map((v) => v / 255),
    };
  };

  // Labels beside points that never cover each other or another point: each
  // goes right of its point if there is room, else left, else it is left out.
  // A label keeps last frame's side while that still fits, so it does not
  // flick from side to side as the globe turns.
  //   const place = Globe.labels();
  //   place(items, { pad, bounds: [left, right] })
  // items, most important first: { key, x, y, w, h, pad? }. Each gets side:
  // 1 right, -1 left, 0 left out; the label's left edge is at item.lx.
  Globe.labels = function () {
    const last = new Map();
    return function place(items, opts) {
      const o = opts || {}, b = o.bounds, taken = [];
      const free = (x0, y0, x1, y1) => (!b || (x0 >= b[0] && x1 <= b[1]))
        && taken.every((r) => x1 <= r[0] || x0 >= r[2] || y1 <= r[1] || y0 >= r[3]);
      for (const it of items) taken.push([it.x - 4, it.y - 4, it.x + 4, it.y + 4]);
      for (const it of items) {
        const pad = it.pad || o.pad || 11, y0 = it.y - it.h / 2, y1 = it.y + it.h / 2, prev = last.get(it.key) || 1;
        it.side = 0;
        for (const side of [prev, -prev]) {
          const x0 = side > 0 ? it.x + pad : it.x - pad - it.w;
          if (free(x0, y0, x0 + it.w, y1)) { it.side = side; it.lx = x0; taken.push([x0, y0, x0 + it.w, y1]); break; }
        }
        if (it.side) last.set(it.key, it.side);
      }
      return items;
    };
  };

  Globe.wrap = wrap;
  root.Globe = Globe;
})(typeof self !== 'undefined' ? self : this);
