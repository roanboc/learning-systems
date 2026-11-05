// The film player: a canvas, a soundtrack and a bar, as on the Learning Data
// films (play, seek, chapters, Pause and think, captions, full screen).
//
//   FilmPlayer.mount(el, { film, timing, scenes, lang, chips, clockHours, next, posterAt })
//
// The soundtrack is the clock: the picture follows audio.currentTime. Each
// chapter is drawn by its scene (films/<film>/scenes.js); chapters with
// footage step their real simulation (films/footage.js) once the narration
// reaches their 'sim' line.
//
// Like the Learning Data films: full screen covers the film and its controls;
// a click on the film plays or pauses it and a double click goes full screen;
// Space plays or pauses and F goes full screen while most of the player is on
// screen (arrows seek, C toggles captions). Pause and think holds the film at
// the end of a chapter on an open question and a fact; there is no right answer.
// A device that can't keep up draws at a lower resolution, down to half.
//
// ?render=1 makes the page a frame renderer for the MP4 (films/tools/render.js):
// no sound and no controls, and window.FilmRender.frame(t) draws time t.
(function (root) {
  'use strict';

  const params = new URLSearchParams(location.search);
  const RENDER = params.get('render') === '1';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const fmt = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

  function mount(el, o) {
    const lang = o.lang === 'es' ? 'es' : 'en';
    const L = (t) => (t && typeof t === 'object' ? (t[lang] || t.en) : t);
    const film = o.film, timing = o.timing[lang], SC = o.scenes, W = SC.W, H = SC.H;
    const chapters = film.chapters.map((ch, i) => Object.assign({}, ch, timing.chapters[i], { index: i }));
    const duration = timing.duration;
    const UI = {
      play: L({ en: 'Play', es: 'Reproducir' }), pause: L({ en: 'Pause', es: 'Pausa' }), load: L({ en: 'Loading…', es: 'Cargando…' }),
      fs: L({ en: 'Full screen', es: 'Pantalla completa' }), fsExit: L({ en: 'Exit full screen', es: 'Salir de pantalla completa' }),
    };

    el.innerHTML = `
      <div class="fp-box">
        <div class="fp-stage">
          <canvas class="fp-canvas" aria-label="${esc(L(film.title))}"></canvas>
          <div class="fp-cc" aria-live="off" hidden></div>
          <div class="fp-card" hidden></div>
          <button class="fp-poster" type="button"><span>▶ ${L({ en: 'Play the film', es: 'Ver la película' })} · ${Math.round(duration / 60)} min</span></button>
        </div>
        <div class="fp-bar">
          <button type="button" class="fp-play">${UI.play}</button>
          <input class="fp-seek" type="range" min="0" max="${duration}" step="0.01" value="0" aria-label="${L({ en: 'Seek', es: 'Buscar' })}">
          <span class="fp-time">0:00</span>
          <button type="button" class="fp-think" aria-pressed="true" title="${esc(L({ en: 'Stop at the end of most chapters with a question to wonder about', es: 'Parar al final de casi todos los capítulos con una pregunta para pensar' }))}">${L({ en: 'Pause and think', es: 'Pausa para pensar' })}</button>
          <button type="button" class="fp-ccb" aria-pressed="true">${L({ en: 'Captions', es: 'Subtítulos' })}</button>
          <button type="button" class="fp-fs">${UI.fs}</button>
        </div>
      </div>
      <ol class="fp-chapters" aria-label="${L({ en: 'Chapters', es: 'Capítulos' })}"></ol>`;
    const $ = (s) => el.querySelector(s);
    const box = $('.fp-box'), canvas = $('.fp-canvas'), ctx = canvas.getContext('2d');
    const cc = $('.fp-cc'), card = $('.fp-card'), poster = $('.fp-poster');
    const playB = $('.fp-play'), seek = $('.fp-seek'), timeEl = $('.fp-time'), thinkB = $('.fp-think'), ccB = $('.fp-ccb'), fsB = $('.fp-fs');
    // The player's own text is already in the right language for lib/i18n.js.
    el.setAttribute('data-no-i18n', '');

    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = o.audio[lang];

    let t = 0, lastT = 0, lastTs = 0, playing = false, frameNo = 0, current = -1, waiting = false, thinkOn = true, ccOn = true;
    let asked = new Set(), q = 1, avg = 16, nf = 0, good = 0, inView = true, keysOn = true;
    const states = new Map();

    // Footage in the order the film needs it, so warming follows the story.
    for (const ch of chapters) if (ch.footage) root.Footage.get(ch.footage);

    // ---------- chapters list ----------
    const list = $('.fp-chapters');
    chapters.forEach((ch) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = `<small>${fmt(ch.start)}</small><b>${esc(L(ch.title))}</b>`;
      b.addEventListener('click', () => { goTo(ch.start + 0.01); if (!playing) play(); });
      li.appendChild(b); list.appendChild(li);
    });

    function chapterAt(time) {
      for (let i = chapters.length - 1; i >= 0; i--) if (time >= chapters[i].start) return i;
      return 0;
    }
    const simAt = (ch) => (ch.lines.sim ? ch.lines.sim[0] - ch.start : Infinity);

    // ---------- drawing ----------
    function size() {
      if (RENDER) { const w = +(params.get('w') || 1920); if (canvas.width !== w) { canvas.width = w; canvas.height = Math.round(w * 9 / 16); } return; }
      const r = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      // Letterboxed in full screen: the film keeps 16:9 inside whatever shape the screen is.
      const w = Math.round(Math.min(1920, Math.min(r.width, r.height * 16 / 9) * dpr) * q) || 960;
      if (canvas.width !== w) { canvas.width = w; canvas.height = Math.round(w * 9 / 16); }
    }

    function draw(dt) {
      size();
      const i = chapterAt(t), ch = chapters[i];
      if (i !== current) { states.set(i, {}); current = i; }
      const st = states.get(i);
      const lt = t - ch.start;
      const f = ch.footage ? root.Footage.get(ch.footage) : null;
      const S = {
        t, lt, dt, lang, L, st, frame: frameNo++, len: ch.end - ch.start,
        c: (id) => (ch.lines[id] ? ch.lines[id][0] - ch.start : 1e9),
        ce: (id) => (ch.lines[id] ? ch.lines[id][1] - ch.start : 1e9),
        footage: f,
      };
      ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
      const simulating = f && lt >= simAt(ch);
      if (simulating && !f.ready) {
        ctx.fillStyle = '#05080a'; ctx.fillRect(0, 0, W, H);
        SC.label(ctx, L({ en: 'Preparing the simulation…', es: 'Preparando la simulación…' }) + ' ' + Math.round(root.Footage.progress() * 100) + '%', W / 2, H / 2, { align: 'center', size: 40 });
        return;
      }
      if (simulating) f.advance(dt);
      SC.SCENES[ch.id](ctx, S);
      overlays(ch, S);
      const edge = Math.min(lt, ch.end - t);
      if (edge < 0.45 && i > 0) { ctx.fillStyle = `rgba(5,8,10,${1 - edge / 0.45})`; ctx.fillRect(0, 0, W, H); }
    }

    function overlays(ch, S) {
      const lt = S.lt;
      if (ch.index === 0) {
        // The film's title over the opening.
        const a = sstep(0.1, 0.8, lt) * (1 - sstep(2.2, 2.9, lt));
        SC.label(ctx, L(film.title), W / 2, 130, { align: 'center', size: 84, font: SC.F.serif, alpha: a });
        SC.label(ctx, 'Learning Systems', W / 2, 215, { align: 'center', size: 32, font: SC.F.mono, alpha: a * 0.8, colour: 'rgba(230,240,235,0.8)' });
      } else {
        const a = sstep(0.3, 1.0, lt) * (1 - sstep(3.6, 4.4, lt));
        if (a > 0) {
          SC.label(ctx, L({ en: 'Chapter ', es: 'Capítulo ' }) + ch.index, 70, 860, { size: 28, font: SC.F.mono, alpha: a, colour: 'rgba(230,240,235,0.85)' });
          SC.label(ctx, L(ch.title), 70, 920, { size: 64, font: SC.F.serif, alpha: a });
        }
      }
      // The live chip: this is the real simulation.
      if (S.footage && S.st.live) {
        const f = S.footage;
        const chip = L(o.chips[ch.footage]) + ' · ' + L({ en: 'seed', es: 'semilla' }) + ' ' + root.Footage.SEED + ' · ' + L({ en: 'step', es: 'paso' }) + ' ' + (f.steps + f.lifeSteps);
        ctx.save();
        ctx.font = '500 26px ' + SC.F.mono;
        const w = ctx.measureText(chip).width + 300;
        ctx.fillStyle = 'rgba(8,12,11,0.72)'; ctx.beginPath(); ctx.roundRect(50, 46, w, 58, 29); ctx.fill();
        ctx.fillStyle = '#ff5a4a'; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(S.t * 4); ctx.beginPath(); ctx.arc(84, 75, 10, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        SC.label(ctx, L({ en: 'LIVE SIMULATION', es: 'SIMULACIÓN EN VIVO' }), 106, 76, { size: 26, font: SC.F.mono, weight: 600 });
        SC.label(ctx, chip, 106 + 270, 76, { size: 26, font: SC.F.mono, colour: 'rgba(230,240,235,0.85)' });
      }
      const h = o.clockHours[ch.id];
      if (h != null) {
        const a = sstep(0.3, 1, lt);
        SC.clock(ctx, 1790, 930, 62, h, { alpha: a, label: false });
        SC.label(ctx, SC.clockText(h), 1690, 930, { align: 'right', size: 36, font: SC.F.mono, weight: 600, alpha: a, box: 'rgba(8,12,11,0.6)' });
      }
    }

    // ---------- captions ----------
    let ccText = '';
    function captions() {
      const ch = chapters[chapterAt(t)];
      let text = '';
      if (ccOn && card.hidden) for (const ln of film.chapters[ch.index].lines) {
        const [a, b] = ch.lines[ln.id];
        if (t >= a - 0.05 && t <= b + 0.35) { text = ln[lang]; break; }
      }
      if (text !== ccText) { ccText = text; cc.textContent = text; cc.hidden = !text; }
    }

    // ---------- Pause and think: an open question and a fact ----------
    function think(ch) {
      pause();
      const q2 = ch.think;
      card.hidden = false;
      card.innerHTML = `<p class="fp-k">${L({ en: 'Pause and think', es: 'Pausa para pensar' })} · ${esc(L(ch.title))}</p>
        <h3>${esc(L(q2.q))}</h3>
        <p class="fp-fact"><b>${L({ en: 'A fact to hold on to', es: 'Un dato para quedarse' })}</b> ${esc(L(q2.fact))}</p>
        <div class="fp-opts"><button type="button" class="fp-go primary">${L({ en: 'Keep watching', es: 'Seguir viendo' })} ▶</button></div>`;
      card.querySelector('.fp-go').addEventListener('click', () => { card.hidden = true; play(); });
      card.querySelector('.fp-go').focus({ preventScroll: true });
      captions();
    }

    function end() {
      pause();
      card.hidden = false;
      card.innerHTML = `<p class="fp-k">${L({ en: 'Where next?', es: '¿Y ahora?' })}</p><h3>${L({ en: 'You’ve seen the whole journey. Now explore it yourself.', es: 'Has visto todo el viaje. Ahora explóralo tú.' })}</h3>
        <div class="fp-opts">${o.next.map((n, i) => `<a class="${i ? '' : 'primary'}" href="${esc(n.href)}">${esc(L(n.text))}</a>`).join('')}</div>
        <div class="fp-opts"><button type="button" class="fp-again">${L({ en: 'Watch again', es: 'Ver otra vez' })}</button></div>`;
      card.querySelector('.fp-again').addEventListener('click', () => { card.hidden = true; asked = new Set(); goTo(0); play(); });
      if (document.fullscreenElement) card.querySelector('a').focus({ preventScroll: true });
    }

    // ---------- transport ----------
    function label() { playB.textContent = playing ? (waiting ? UI.load : UI.pause) : UI.play; }
    function play() {
      poster.hidden = true;
      card.hidden = true;
      if (t >= duration - 0.05) goTo(0);
      playing = true;
      label();
      try { audio.currentTime = t; } catch (e) { /* not loaded yet */ }
      const p = audio.play();
      if (p && p.catch) p.catch(() => { /* blocked: the picture keeps time without sound */ });
    }
    function pause() {
      playing = false;
      audio.pause();
      label();
    }
    const toggle = () => (playing ? pause() : play());
    function goTo(time) {
      t = clamp(time, 0, duration);
      lastT = t;
      try { audio.currentTime = t; } catch (e) { /* not loaded yet */ }
      for (const ch of chapters) { if (ch.end <= t) asked.add(ch.index); else asked.delete(ch.index); }
      card.hidden = true;
      poster.hidden = true;
    }

    // Full screen covers the film and its controls.
    const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
    const fsReq = box.requestFullscreen || box.webkitRequestFullscreen;
    function fsToggle() {
      if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else if (fsReq) { const r = fsReq.call(box); if (r && r.catch) r.catch(() => {}); }
    }
    if (!fsReq) fsB.hidden = true;
    ['fullscreenchange', 'webkitfullscreenchange'].forEach((ev) => document.addEventListener(ev, () => { fsB.textContent = fsEl() ? UI.fsExit : UI.fs; }));

    playB.addEventListener('click', toggle);
    poster.addEventListener('click', play);
    canvas.addEventListener('click', toggle);
    canvas.addEventListener('dblclick', (e) => { e.preventDefault(); fsToggle(); });
    fsB.addEventListener('click', fsToggle);
    seek.addEventListener('input', () => goTo(+seek.value));
    thinkB.addEventListener('click', () => { thinkOn = !thinkOn; thinkB.setAttribute('aria-pressed', String(thinkOn)); });
    ccB.addEventListener('click', () => { ccOn = !ccOn; ccB.setAttribute('aria-pressed', String(ccOn)); captions(); });
    audio.addEventListener('waiting', () => { waiting = true; label(); });
    audio.addEventListener('playing', () => { waiting = false; label(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => { const e = es[es.length - 1]; inView = e.isIntersecting; keysOn = e.intersectionRatio >= 0.55; }, { threshold: [0, 0.55] }).observe(box);
    }
    // Keys work while most of the player is on screen (or in full screen) and no other control has focus.
    window.addEventListener('keydown', (e) => {
      if (!keysOn && !fsEl()) return;
      const tg = e.target, own = el.contains(tg);
      if (!own && tg.closest && tg.closest('a,button,input,select,textarea,[contenteditable],[tabindex]')) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.code === 'Space' && tg.tagName !== 'BUTTON' && tg.tagName !== 'INPUT') { e.preventDefault(); toggle(); }
      else if (e.code === 'KeyF') fsToggle();
      else if (e.code === 'KeyC') ccB.click();
      else if (e.code === 'ArrowRight' && tg.tagName !== 'INPUT') goTo(t + 5);
      else if (e.code === 'ArrowLeft' && tg.tagName !== 'INPUT') goTo(t - 5);
    });

    // A device that can't keep up (frames more than 40 ms apart) draws at a lower resolution.
    function pace(ms) {
      avg = avg * 0.9 + Math.min(ms, 250) * 0.1;
      if (++nf < 30) return;
      nf = 0;
      if (avg > 40 && q > 0.5) { q = Math.max(0.5, q * 0.8); good = 0; }
      else if (avg < 20 && q < 1 && ++good >= 10) { q = Math.min(1, q / 0.8); good = 0; }
    }

    // ---------- the loop ----------
    function frame(ts) {
      requestAnimationFrame(frame);
      const ms = lastTs ? ts - lastTs : 16;
      lastTs = ts;
      const ch0 = chapters[chapterAt(t)];
      const needs = ch0.footage && t - ch0.start >= simAt(ch0) - 1 && !root.Footage.get(ch0.footage).ready;
      root.Footage.warm(needs ? 40 : playing ? 6 : 10);
      if (!inView && !fsEl()) return;
      if (playing) {
        pace(ms);
        if (needs) { if (!waiting) { waiting = true; audio.pause(); label(); } }
        else if (waiting && audio.paused) { waiting = false; try { audio.currentTime = t; } catch (e) { /* */ } audio.play().catch(() => {}); label(); }
        else if (!audio.paused) t = audio.currentTime;
        else if (!waiting) t = Math.min(duration, t + Math.min(0.1, ms / 1000));   // no sound allowed: keep time anyway
        // Pause and think, just before the chapter fades, so its world stays behind the question.
        const ch = chapters[chapterAt(lastT)];
        if (thinkOn && ch.think && !asked.has(ch.index) && lastT < ch.end && t >= ch.end - 0.5) {
          asked.add(ch.index); t = ch.end - 0.5; try { audio.currentTime = t; } catch (e) { /* */ } think(ch);
        }
        if (t >= duration - 0.05) { t = duration; end(); }
      }
      const dt = clamp(t - lastT, 0, 0.1);
      lastT = t;
      if (!poster.hidden && o.posterAt != null) {
        // Before the first play, a still from the opening sits behind the button.
        const keep = t; t = o.posterAt; draw(0); t = keep; current = -1;
      } else draw(dt);
      captions();
      if (document.activeElement !== seek) seek.value = t;
      timeEl.textContent = fmt(t) + ' / ' + fmt(duration);
      const on = chapterAt(t);
      [...list.children].forEach((li, i) => li.toggleAttribute('data-on', i === on));
    }

    if (RENDER) {
      el.classList.add('fp-render');
      root.FilmRender = {
        duration,
        fps: 30,
        prepare() { while (!root.Footage.warm(1000)) { /* warm all, synchronously */ } return true; },
        frame(time) { const dt = clamp(time - t, 0, 0.1); t = time; draw(dt); return true; },
      };
      draw(0);
    } else {
      requestAnimationFrame(frame);
    }
    return { play, pause, goTo };
  }

  root.FilmPlayer = { mount, RENDER };
})(typeof self !== 'undefined' ? self : this);
