// Render a film to MP4, frame by frame, from its own page.
//
//   node films/tools/render.js journey en out.mp4 [--w 1920] [--from 0] [--to end] [--shots dir]
//
// Serves the repository, opens films/<film>/index.html?render=1, warms every
// simulation, then draws each frame at exactly 30 fps of film time (so the
// footage is the same on every render) and pipes it to ffmpeg with the
// soundtrack and both caption files as subtitle tracks. --shots saves one PNG
// every 10 seconds instead of making a video (for checking the picture).
// Needs Playwright with Chromium, and ffmpeg.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const [film, lang, out] = args;
const width = +opt('w', 1920), from = +opt('from', 0), shots = opt('shots', null);

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.mp3': 'audio/mpeg', '.srt': 'text/plain', '.png': 'image/png' };
function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(res);
    }).listen(0, () => resolve(srv));
  });
}

(async () => {
  const srv = await serve();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.error('console:', m.text()); });
  const url = `http://localhost:${srv.address().port}/films/${film}/index.html?render=1&lang=${lang}&w=${width}`;
  await page.goto(url);
  await page.waitForFunction(() => window.FilmRender);
  await page.evaluate(() => document.fonts.ready);
  const t0 = Date.now();
  await page.evaluate(() => window.FilmRender.prepare());
  console.error('warmed in', Date.now() - t0, 'ms');
  const duration = await page.evaluate(() => window.FilmRender.duration);
  const to = Math.min(duration, +opt('to', duration));
  const fps = 30;
  const grab = () => page.evaluate(() => document.querySelector('.fp-canvas').toDataURL('image/jpeg', 0.9).split(',')[1]);

  if (shots) {
    fs.mkdirSync(shots, { recursive: true });
    for (let f = Math.round(from * fps); f <= Math.round(to * fps); f++) {
      const t = f / fps;
      await page.evaluate((x) => window.FilmRender.frame(x), t);
      if (f % (fps * 10) === 0 || f === Math.round(to * fps)) {
        fs.writeFileSync(path.join(shots, `${film}-${lang}-${String(Math.round(t)).padStart(3, '0')}.jpg`), Buffer.from(await grab(), 'base64'));
        console.error('shot', t.toFixed(1));
      }
    }
  } else {
    const dir = path.join(ROOT, 'films', film);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error',
      '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-ss', String(from), '-i', path.join(dir, 'audio', lang + '.mp3'),
      '-i', path.join(dir, 'captions', 'en.srt'), '-i', path.join(dir, 'captions', 'es.srt'),
      '-map', '0:v', '-map', '1:a', '-map', '2:s', '-map', '3:s',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '128k', '-c:s', 'mov_text',
      '-metadata:s:s:0', 'language=eng', '-metadata:s:s:1', 'language=spa',
      '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = Math.round(from * fps); f <= Math.round(to * fps); f++) {
      await page.evaluate((x) => window.FilmRender.frame(x), f / fps);
      const buf = Buffer.from(await grab(), 'base64');
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      if (f % (fps * 10) === 0) console.error('frame', f, (f / fps).toFixed(0) + 's');
    }
    ff.stdin.end();
    await new Promise((r) => ff.on('close', r));
    console.error('wrote', out);
  }
  await browser.close();
  srv.close();
})().catch((e) => { console.error(e); process.exit(1); });
