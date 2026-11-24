// A player for film 1's clips (MP4, played by the browser), with the controls
// people know from video sites, in the site's paper look:
//   play and pause, a seek bar marked with the act's shots, time, previous and
//   next act, speed, volume and mute, full screen, and keys:
//   Space or K play/pause · ← → 5 s · J L 10 s · , . previous/next shot ·
//   F full screen · M mute · Shift+N / Shift+P next/previous act.
//
//   const p = ClipPlayer.mount(el, { poster, src, shots: [[start, label], ...],
//                                   duration, onPrev, onNext, onEnded, onShot })
//   p.load({ poster, src, shots, duration }); p.play(); p.seek(t); p.video
//
// Plain JS, no build step. Words go through lib/i18n.js like the rest of the page.
(function (root) {
  'use strict';

  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const fmt = (s) => { s = Math.max(0, s || 0); return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0'); };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const CSS = `
.cp { position: relative; border-radius: 16px; overflow: hidden; background: #e9e2cf; border: 1.5px solid rgba(44,39,35,.2); outline: none; }
.cp:focus-visible { box-shadow: 0 0 0 3px var(--accent, #22728a); }
.cp video { display: block; width: 100%; aspect-ratio: 16 / 9; background: #e9e2cf; cursor: pointer; }
.cp:fullscreen { border-radius: 0; border: 0; display: grid; align-content: center; background: #1d1a17; }
.cp:fullscreen video { max-height: 100vh; }
.cp-big { position: absolute; inset: 0; display: grid; place-items: center; background: none; border: 0; cursor: pointer; }
.cp-big span { display: grid; place-items: center; width: 76px; height: 76px; border-radius: 50%; background: rgba(44,39,35,.82); color: #f5eedc; font-size: 30px; padding-left: 5px; box-shadow: 0 6px 20px rgba(0,0,0,.25); }
.cp-big:hover span { transform: scale(1.06); }
.cp-bar { position: absolute; left: 0; right: 0; bottom: 0; padding: 22px 12px 8px; display: grid; gap: 4px;
  background: linear-gradient(to top, rgba(29,26,23,.78), rgba(29,26,23,0)); color: #f5eedc; font: 500 14px var(--display, system-ui); transition: opacity .25s; }
.cp.idle.playing .cp-bar { opacity: 0; }
.cp.idle.playing { cursor: none; }
.cp-track { position: relative; height: 18px; cursor: pointer; touch-action: none; }
.cp-rail { position: absolute; left: 0; right: 0; top: 7px; height: 4px; border-radius: 2px; background: rgba(245,238,220,.3); }
.cp-buf { position: absolute; left: 0; top: 7px; height: 4px; border-radius: 2px; background: rgba(245,238,220,.45); }
.cp-done { position: absolute; left: 0; top: 7px; height: 4px; border-radius: 2px; background: #f3ae3d; }
.cp-knob { position: absolute; top: 3px; width: 12px; height: 12px; margin-left: -6px; border-radius: 50%; background: #f3ae3d; box-shadow: 0 0 0 2px #2c2723; }
.cp-tick { position: absolute; top: 5px; width: 2px; height: 8px; margin-left: -1px; background: #f5eedc; border-radius: 1px; }
.cp-tip { position: absolute; bottom: 22px; transform: translateX(-50%); background: #fbf7ea; color: #2c2723; border-radius: 7px; padding: 2px 8px; white-space: nowrap; font-size: 13px; pointer-events: none; }
.cp-row { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.cp-row button, .cp-row select { font: 600 14px var(--display, system-ui); color: #f5eedc; background: none; border: 0; border-radius: 8px; padding: 5px 8px; cursor: pointer; min-width: 34px; }
.cp-row select { background: rgba(245,238,220,.12); }
.cp-row select option { color: #2c2723; }
.cp-row button:hover, .cp-row select:hover { background: rgba(245,238,220,.18); }
.cp-row button:focus-visible, .cp-row select:focus-visible, .cp-vol:focus-visible { outline: 2px solid #f3ae3d; outline-offset: 1px; }
.cp-time { font-variant-numeric: tabular-nums; padding: 0 6px; }
.cp-shot { opacity: .85; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 30ch; }
.cp-sp { flex: 1; }
.cp-vol { width: 76px; accent-color: #f3ae3d; }
@media (max-width: 560px) { .cp-vol, .cp-shot { display: none; } .cp-row button { padding: 5px 6px; } }
@media (prefers-reduced-motion: reduce) { .cp-bar { transition: none; } }
`;

  function mount(el, o) {
    if (!document.getElementById('cp-css')) {
      const st = document.createElement('style'); st.id = 'cp-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    el.classList.add('cp');
    el.tabIndex = 0;
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Film player');
    el.innerHTML = `<video playsinline preload="metadata"></video>
      <button class="cp-big" type="button" aria-label="Play"><span aria-hidden="true">▶</span></button>
      <div class="cp-bar">
        <div class="cp-track" role="slider" tabindex="-1" aria-label="Seek" aria-valuemin="0"><div class="cp-rail"></div><div class="cp-buf"></div><div class="cp-done"></div><div class="cp-ticks"></div><div class="cp-knob"></div><div class="cp-tip" hidden></div></div>
        <div class="cp-row">
          <button type="button" class="cp-prev" title="Previous act (Shift+P)" aria-label="Previous act">⏮</button>
          <button type="button" class="cp-play" title="Play (K)" aria-label="Play">▶</button>
          <button type="button" class="cp-next" title="Next act (Shift+N)" aria-label="Next act">⏭</button>
          <button type="button" class="cp-mute" title="Mute (M)" aria-label="Mute">🔊</button>
          <input class="cp-vol" type="range" min="0" max="1" step="0.05" value="1" aria-label="Volume">
          <span class="cp-time">0:00 / 0:00</span>
          <span class="cp-shot"></span>
          <span class="cp-sp"></span>
          <select class="cp-speed" aria-label="Speed" title="Speed">${SPEEDS.map((s) => `<option value="${s}"${s === 1 ? ' selected' : ''}>${s}×</option>`).join('')}</select>
          <button type="button" class="cp-fs" title="Full screen (F)" aria-label="Full screen">⛶</button>
        </div>
      </div>`;
    const $ = (s) => el.querySelector(s);
    const v = $('video'), big = $('.cp-big'), track = $('.cp-track'), done = $('.cp-done'), buf = $('.cp-buf'), knob = $('.cp-knob'),
      ticks = $('.cp-ticks'), tip = $('.cp-tip'), playB = $('.cp-play'), mute = $('.cp-mute'), vol = $('.cp-vol'),
      time = $('.cp-time'), shotEl = $('.cp-shot'), speed = $('.cp-speed'), fs = $('.cp-fs');
    let shots = [], dur = 0, idleT = 0, shotNow = -1;
    // The browser's own controls are not shown; these replace them.
    v.controls = false;

    const total = () => (isFinite(v.duration) && v.duration > 0 ? v.duration : dur);
    function load(c) {
      shots = c.shots || []; dur = c.duration || 0; shotNow = -1;
      v.poster = c.poster || '';
      v.src = c.src;
      v.playbackRate = +speed.value;
      ticks.innerHTML = '';
      el.classList.remove('playing');
      big.hidden = false;
      paint();
    }
    function drawTicks() {
      const T = total();
      ticks.innerHTML = T ? shots.slice(1).map(([s]) => `<span class="cp-tick" style="left:${(s / T * 100).toFixed(2)}%"></span>`).join('') : '';
    }
    function shotAt(t) { let k = 0; shots.forEach(([s], i) => { if (t >= s - 0.05) k = i; }); return k; }
    function paint() {
      const T = total(), t = v.currentTime || 0, f = T ? Math.min(1, t / T) : 0;
      done.style.width = (f * 100) + '%';
      knob.style.left = (f * 100) + '%';
      if (v.buffered.length && T) buf.style.width = (v.buffered.end(v.buffered.length - 1) / T * 100) + '%';
      time.textContent = fmt(t) + ' / ' + fmt(T);
      track.setAttribute('aria-valuemax', String(Math.round(T)));
      track.setAttribute('aria-valuenow', String(Math.round(t)));
      track.setAttribute('aria-valuetext', fmt(t));
      const k = shots.length ? shotAt(t) : -1;
      if (k !== shotNow) { shotNow = k; shotEl.textContent = k >= 0 ? shots[k][1] : ''; if (o.onShot) o.onShot(k); }
      const playing = !v.paused && !v.ended;
      playB.textContent = playing ? '❚❚' : '▶';
      playB.setAttribute('aria-label', playing ? 'Pause' : 'Play');
      mute.textContent = v.muted || v.volume === 0 ? '🔇' : '🔊';
      mute.setAttribute('aria-label', v.muted ? 'Unmute' : 'Mute');
    }
    const play = () => { big.hidden = true; return v.play().catch(() => {}); };
    const toggle = () => (v.paused || v.ended ? play() : v.pause());
    const seek = (t) => { v.currentTime = Math.max(0, Math.min(total() - 0.05, t)); paint(); };
    function seekShot(d) {
      if (!shots.length) return;
      const k = shotAt(v.currentTime);
      // "Previous" from well inside a shot goes back to its start first.
      const target = d < 0 && v.currentTime - shots[k][0] > 1.5 ? k : Math.max(0, Math.min(shots.length - 1, k + d));
      seek(shots[target][0]);
    }
    function wake() {
      el.classList.remove('idle');
      clearTimeout(idleT);
      idleT = setTimeout(() => el.classList.add('idle'), 2200);
    }

    v.addEventListener('loadedmetadata', () => { drawTicks(); paint(); });
    for (const e of ['timeupdate', 'progress', 'volumechange', 'ratechange']) v.addEventListener(e, paint);
    v.addEventListener('play', () => { el.classList.add('playing'); big.hidden = true; wake(); paint(); });
    v.addEventListener('pause', () => { el.classList.remove('playing'); paint(); });
    v.addEventListener('ended', () => { el.classList.remove('playing'); paint(); if (o.onEnded) o.onEnded(); });
    v.addEventListener('error', () => { if (o.onError) o.onError(); });
    v.addEventListener('click', toggle);
    v.addEventListener('dblclick', () => fs.click());
    big.addEventListener('click', play);
    playB.addEventListener('click', toggle);
    $('.cp-prev').addEventListener('click', () => (v.currentTime > 2 || !o.onPrev ? seek(0) : o.onPrev()));
    $('.cp-next').addEventListener('click', () => o.onNext && o.onNext());
    mute.addEventListener('click', () => { v.muted = !v.muted; if (!v.muted && v.volume === 0) v.volume = 0.6; });
    vol.addEventListener('input', () => { v.volume = +vol.value; v.muted = v.volume === 0; });
    speed.addEventListener('change', () => { v.playbackRate = +speed.value; });
    fs.addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
      else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen(); // iPhone
    });

    // Seek by dragging along the bar; show the time and shot under the pointer.
    const at = (e) => { const r = track.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * total(); };
    let drag = false;
    track.addEventListener('pointerdown', (e) => { drag = true; track.setPointerCapture(e.pointerId); seek(at(e)); });
    track.addEventListener('pointermove', (e) => {
      const t = at(e), r = track.getBoundingClientRect();
      tip.hidden = false;
      tip.style.left = (e.clientX - r.left) + 'px';
      tip.textContent = fmt(t) + (shots.length ? ' · ' + shots[shotAt(t)][1] : '');
      if (drag) seek(t);
    });
    track.addEventListener('pointerup', () => { drag = false; });
    track.addEventListener('pointerleave', () => { tip.hidden = true; });
    el.addEventListener('pointermove', wake);

    el.addEventListener('keydown', (e) => {
      if (e.target.closest('select, input')) return;
      const k = e.key;
      if (k === ' ' || k === 'k' || k === 'K') { e.preventDefault(); toggle(); }
      else if (k === 'ArrowRight') { e.preventDefault(); seek(v.currentTime + 5); }
      else if (k === 'ArrowLeft') { e.preventDefault(); seek(v.currentTime - 5); }
      else if (k === 'l' || k === 'L') seek(v.currentTime + 10);
      else if (k === 'j' || k === 'J') seek(v.currentTime - 10);
      else if (k === '.') seekShot(1);
      else if (k === ',') seekShot(-1);
      else if (k === 'f' || k === 'F') fs.click();
      else if (k === 'm' || k === 'M') mute.click();
      else if (k === 'N' && e.shiftKey && o.onNext) o.onNext();
      else if (k === 'P' && e.shiftKey && o.onPrev) o.onPrev();
      else return;
      wake();
    });

    load(o);
    return { video: v, load, play, seek, pause: () => v.pause() };
  }

  root.ClipPlayer = { mount };
})(typeof self !== 'undefined' ? self : this);
