// Write films/<film>/script.md from script.js and timing.js, so the script
// people read is always the one the narrator reads.
//   node films/tools/script-md.js journey
'use strict';
const fs = require('fs');
const path = require('path');
const film = process.argv[2] || 'journey';
const dir = path.resolve(__dirname, '..', film);
const F = require(path.join(dir, 'script.js'));
global.self = global;
require(path.join(dir, 'timing.js'));
const T = self.FilmTiming[film];
const fmt = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
const head = fs.existsSync(path.join(dir, 'script-notes.md')) ? fs.readFileSync(path.join(dir, 'script-notes.md'), 'utf8').trim() + '\n\n' : '';
let md = `# ${F.title.en} · ${F.title.es}\n\n`;
md += `Made by \`films/tools/script-md.js\` from \`script.js\`. Runtime ${fmt(T.en.duration)} in English, ${fmt(T.es.duration)} in Spanish. Voices: Kokoro \`${F.voice.en}\` and \`${F.voice.es}\` (open source, Apache 2.0).\n\n` + head;
md += '## Script\n';
F.chapters.forEach((ch, i) => {
  const te = T.en.chapters[i];
  md += `\n### ${i} · ${ch.title.en} · ${fmt(te.start)}–${fmt(te.end)}\n\n*${ch.title.es}*${ch.footage ? ` · footage: \`${ch.footage}\` (live, seed 3)` : ' · drawn scene'}\n\n`;
  md += '| English | Español |\n|---|---|\n';
  for (const ln of ch.lines) md += `| ${ln.en} | ${ln.es} |\n`;
  if (ch.think) md += `\n**Pause and think.** ${ch.think.q.en} A fact: ${ch.think.fact.en}\n\n**Pausa para pensar.** ${ch.think.q.es} Un dato: ${ch.think.fact.es}\n`;
});
fs.writeFileSync(path.join(dir, 'script.md'), md);
console.log('wrote', path.join(dir, 'script.md'));
