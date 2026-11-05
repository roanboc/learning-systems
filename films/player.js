// The film player: a canvas, a soundtrack and a bar, as on the Learning Data
// films (play, seek, chapters, Pause and think, captions, full screen).
//
//   FilmPlayer.mount(el, { film, timing, scenes, lang, chips, clockHours, next })
//
// The soundtrack is the clock: the picture follows audio.currentTime. Each
// chapter is drawn by its scene (films/<film>/scenes.js); chapters with
// footage step their real simulation (films/footage.js) as film time passes.
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

  function mount(el, o) {
    const lang = o.lang === 'es' ? 'es' : 'en';
    const L = (t) => (t && typeof t === 'object' ? (t[lang] || t.en) : t);
    const film = o.film, timing = o.timing[lang], SC = o.scenes, W = SC.W, H = SC.H;
    const chapters = film.chapters.map((ch, i) => Object.assign({}, ch, timing.chapters[i], { index: i }));
    const duration = timing.duration;

    el.innerHTML = `
      <div class="fp-stage">
        <canvas class="fp-canvas" aria-label="${L(film.title)}"></canvas>
        <div class="fp-cc" aria-live="off"></div>
        <div class="fp-wait" hidden></div>
        <div class="fp-card" hidden></div>
        <button class="fp-poster" type="button"><span>▶ ${L({ en: 'Play the film', es: 'Ver la película' })} · ${Math.round(duration / 60)} min</span></button>
      </div>
      <div class="fp-bar">
        <button type="button" class="fp-play">${L({ en: 'Play', es: 'Reproducir' })}</button>
        <input class="fp-seek" type="range" min="0" max="${duration}" step="0.01" value="0" aria-label="${L({ en: 'Seek', es: 'Buscar' })}">
        <span class="fp-time">0:00</span>
        <button type="button" class="fp-think" aria-pressed="true" title="${L({ en: 'Stop at the end of most chapters, with one question each', es: 'Parar al final de casi todos los capítulos, con una pregunta' })}">${L({ en: 'Pause and think', es: 'Pausa para pensar' })}</button>
        <button type="button" class="fp-ccb" aria-pressed="true">${L({ en: 'Captions', es: 'Subtítulos' })}</button>
        <button type="button" class="fp-fs">${L({ en: 'Full screen', es: 'Pantalla completa' })}</button>
      </div>
      <ol class="fp-chapters"></ol>`;
    const $ = (s) => el.querySelector(s);
    const stage = $('.fp-stage'), canvas = $('.fp-canvas'), ctx = canvas.getContext('2d');
    const cc = $('.fp-cc'), card = $('.fp-card'), wait = $('.fp-wait'), poster = $('.fp-poster');
    const playB = $('.fp-play'), seek = $('.fp-seek'), timeEl = $('.fp-time'), thinkB = $('.fp-think'), ccB = $('.fp-ccb');
    // Mark the page's own text as already in the right language for lib/i18n.js.
    el.setAttribute('data-no-i18n', '');

    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = o.audio[lang];

    let t = 0, lastT = 0, playing = false, frameNo = 0, current = -1, asked = new Set(), waiting = false, thinkOn = true, ccOn = true;
    const states = new Map();

    // Footage in the order the film needs it, so warming follows the story.
    for (const ch of chapters) if (ch.footage) root.Footage.get(ch.footage);

    // ---------- chapters list ----------
    const list = $('.fp-chapters');
    chapters.forEach((ch) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = `<b>${L(ch.title)}</b><small>${fmt(ch.start)}</small>`;
      b.addEventListener('click', () => { goTo(ch.start + 0.01); if (!playing) play(); });
      li.appendChild(b); list.appendChild(li);
    });

    function chapterAt(time) {
      for (let i = chapters.length - 1; i >= 0; i--) if (time >= chapters[i].start) return i;
      return 0;
    }

    // ---------- drawing ----------
    function size() {
      if (RENDER) { const w = +(params.get('w') || 1920); canvas.width = w; canvas.height = Math.round(w * 9 / 16); return; }
      const dpr = Math.min(2, devicePixelRatio || 1);
      const w = Math.min(1920, Math.round(canvas.clientWidth * dpr)) || 960;
      if (canvas.width !== w) { canvas.width = w; canvas.height = Math.round(w * 9 / 16); }
    }

    function draw(dt) {
      size();
      const i = chapterAt(t), ch = chapters[i];
      if (i !== current) { states.set(i, {}); current = i; }
      const st = states.get(i);
      const lt = t - ch.start;
      const S = {
        t, lt, dt, lang, L, st, frame: frameNo++, len: ch.end - ch.start,
        c: (id) => (ch.lines[id] ? ch.lines[id][0] - ch.start : 1e9),
        ce: (id) => (ch.lines[id] ? ch.lines[id][1] - ch.start : 1e9),
        footage: ch.footage ? root.Footage.get(ch.footage) : null,
      };
      ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
      if (S.footage && !S.footage.ready) {
        ctx.fillStyle = '#05080a'; ctx.fillRect(0, 0, W, H);
        SC.label(ctx, L({ en: 'Preparing the simulation…', es: 'Preparando la simulación…' }) + ' ' + Math.round(root.Footage.progress() * 100) + '%', W / 2, H / 2, { align: 'center', size: 40 });
        return false;
      }
      if (S.footage) S.footage.advance(dt);
      SC.SCENES[ch.id](ctx, S);
      overlays(ch, S);
      // Fade through black between chapters.
      const edge = Math.min(lt, ch.end - t);
      if (edge < 0.45 && i > 0) { ctx.fillStyle = `rgba(5,8,10,${1 - edge / 0.45})`; ctx.fillRect(0, 0, W, H); }
      return true;
    }

    function overlays(ch, S) {
      const lt = S.lt;
      // The film's title over the opening.
      if (ch.index === 0) {
        const a = sstep(0.2, 1.2, lt) * (1 - sstep(3.4, 4.4, lt));
        SC.label(ctx, L(film.title), 760, 180, { align: 'center', size: 84, font: SC.F.serif, alpha: a });
        SC.label(ctx, 'Learning Systems', 760, 270, { align: 'center', size: 32, font: SC.F.mono, alpha: a * 0.8, colour: 'rgba(230,240,235,0.8)' });
      } else {
        // Chapter title, lower left.
        const a = sstep(0.3, 1.0, lt) * (1 - sstep(3.6, 4.4, lt));
        if (a > 0) {
          SC.label(ctx, L({ en: 'Chapter ', es: 'Capítulo ' }) + ch.index, 70, 860, { size: 28, font: SC.F.mono, alpha: a, colour: 'rgba(230,240,235,0.85)' });
          SC.label(ctx, L(ch.title), 70, 920, { size: 64, font: SC.F.serif, alpha: a });
        }
      }
      // The live chip: this is the real simulation.
      if (S.footage) {
        const chip = L(o.chips[ch.footage]) + ' · ' + L({ en: 'seed', es: 'semilla' }) + ' ' + root.Footage.SEED + ' · ' + L({ en: 'step', es: 'paso' }) + ' ' + (S.footage.steps + S.footage.lifeSteps);
        ctx.save();
        ctx.font = '500 26px ' + SC.F.mono;
        const w = ctx.measureText(chip).width + 300;
        ctx.fillStyle = 'rgba(8,12,11,0.72)'; ctx.beginPath(); ctx.roundRect(50, 46, w, 58, 29); ctx.fill();
        ctx.fillStyle = '#ff5a4a'; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(S.t * 4); ctx.beginPath(); ctx.arc(84, 75, 10, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        SC.label(ctx, L({ en: 'LIVE SIMULATION', es: 'SIMULACIÓN EN VIVO' }), 106, 76, { size: 26, font: SC.F.mono, weight: 600 });
        SC.label(ctx, chip, 106 + 270, 76, { size: 26, font: SC.F.mono, colour: 'rgba(230,240,235,0.85)' });
      }
      // The day clock in the corner.
      const h = o.clockHours[ch.id];
      if (h != null) SC.clock(ctx, 1790, 990 - 60, 62, h, { alpha: sstep(0.3, 1, lt), label: false });
      if (h != null) SC.label(ctx, SC.clockText(h), 1690, 930, { align: 'right', size: 36, font: SC.F.mono, weight: 600, alpha: sstep(0.3, 1, lt), box: 'rgba(8,12,11,0.6)' });
    }

    // ---------- captions ----------
    let ccText = '';
    function captions() {
      if (RENDER) return;
      const ch = chapters[chapterAt(t)];
      let text = '';
      if (ccOn) for (const ln of ch.lines ? film.chapters[ch.index].lines : []) {
        const [a, b] = ch.lines[ln.id];
        if (t >= a - 0.05 && t <= b + 0.35) { text = ln[lang]; break; }
      }
      if (text !== ccText) { ccText = text; cc.textContent = text; cc.hidden = !text; }
    }

    // ---------- Pause and think ----------
    function think(ch) {
      pause();
      const q = ch.think;
      card.hidden = false;
      card.innerHTML = `<p class="fp-k">${L({ en: 'Pause and think', es: 'Pausa para pensar' })}</p><h3>${L(q.q)}</h3>
        <p class="fp-a" hidden>${L(q.a)}</p>
        <div class="fp-opts"><button type="button" class="fp-reveal">${L({ en: 'Show one answer', es: 'Ver una respuesta' })}</button><button type="button" class="fp-go primary">${L({ en: 'Continue', es: 'Continuar' })} ▶</button></div>`;
      card.querySelector('.fp-reveal').addEventListener('click', (e) => { card.querySelector('.fp-a').hidden = false; e.target.remove(); });
      card.querySelector('.fp-go').addEventListener('click', () => { card.hidden = true; play(); });
      card.querySelector('.fp-go').focus();
    }

    function end() {
      pause();
      card.hidden = false;
      card.innerHTML = `<p class="fp-k">${L({ en: 'Where next?', es: '¿Y ahora?' })}</p><h3>${L({ en: 'You’ve seen the whole journey. Now explore it yourself.', es: 'Has visto todo el viaje. Ahora explóralo tú.' })}</h3>
        <div class="fp-opts">${o.next.map((n, i) => `<a class="${i ? '' : 'primary'}" href="${n.href}">${L(n.text)}</a>`).join('')}</div>
        <div class="fp-opts"><button type="button" class="fp-again">${L({ en: 'Watch again', es: 'Ver otra vez' })}</button></div>`;
      card.querySelector('.fp-again').addEventListener('click', () => { card.hidden = true; asked = new Set(); goTo(0); play(); });
    }

    // ---------- transport ----------
    function play() {
      poster.hidden = true;
      card.hidden = true;
      if (t >= duration - 0.05) goTo(0);
      playing = true;
      playB.textContent = L({ en: 'Pause', es: 'Pausa' });
      audio.currentTime = t;
      const p = audio.play();
      if (p && p.catch) p.catch(() => { /* blocked until a click; the clock still runs from audio when allowed */ });
    }
    function pause() {
      playing = false;
      audio.pause();
      playB.textContent = L({ en: 'Play', es: 'Reproducir' });
    }
    function goTo(time) {
      t = clamp(time, 0, duration);
      lastT = t;
      audio.currentTime = t;
      // Chapters already passed are not asked about again.
      for (const ch of chapters) if (ch.end <= t) asked.add(ch.index);
      for (const ch of chapters) if (ch.end > t) asked.delete(ch.index);
    }

    playB.addEventListener('click', () => (playing ? pause() : play()));
    poster.addEventListener('click', play);
    seek.addEventListener('input', () => { goTo(+seek.value); card.hidden = true; });
    thinkB.addEventListener('click', () => { thinkOn = !thinkOn; thinkB.setAttribute('aria-pressed', String(thinkOn)); });
    ccB.addEventListener('click', () => { ccOn = !ccOn; ccB.setAttribute('aria-pressed', String(ccOn)); captions(); });
    $('.fp-fs').addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (stage.requestFullscreen) stage.requestFullscreen();
    });
    el.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' && e.key !== ' ') return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); playing ? pause() : play(); }
      else if (e.key === 'ArrowRight') goTo(t + 5);
      else if (e.key === 'ArrowLeft') goTo(t - 5);
      else if (e.key === 'c') ccB.click();
    });

    // ---------- the loop ----------
    function frame() {
      requestAnimationFrame(frame);
      const ch0 = chapters[chapterAt(t)];
      const needs = ch0.footage && !root.Footage.get(ch0.footage).ready;
      root.Footage.warm(needs ? 40 : playing ? 6 : 10);
      if (playing) {
        if (needs) { if (!waiting) { waiting = true; audio.pause(); } }
        else if (waiting) { waiting = false; audio.currentTime = t; audio.play(); }
        else if (!audio.paused) t = audio.currentTime;
        else t = Math.min(duration, t + 1 / 60);   // no sound allowed yet: keep time anyway
        // Pause and think at the end of a chapter.
        const ch = chapters[chapterAt(lastT)];
        // It stops just before the fade, so the world stays behind the question.
        if (thinkOn && ch.think && !asked.has(ch.index) && lastT < ch.end && t >= ch.end - 0.5) {
          asked.add(ch.index); t = ch.end - 0.5; audio.currentTime = t; think(ch);
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
      for (const [i, li] of [...list.children].entries()) li.toggleAttribute('data-on', i === chapterAt(t));
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
