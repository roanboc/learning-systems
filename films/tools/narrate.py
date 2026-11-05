#!/usr/bin/env python3
"""Make a film's soundtrack, timing and captions from its script.

    python3 films/tools/narrate.py journey --model DIR

Reads films/<film>/script.js (through Node), reads every line with Kokoro
(open source, Apache 2.0) in English and Spanish, lays the lines out with a
beat after each one and a wordless breather at the end of each chapter,
mixes in a quiet synthesised pad, and writes:

    films/<film>/audio/<lang>.mp3     the soundtrack
    films/<film>/timing.js            when every line and chapter starts
    films/<film>/captions/<lang>.srt  captions, for the MP4 and for reading

Needs: pip install kokoro-onnx soundfile numpy; ffmpeg; and the model files
kokoro-v1.0.onnx and voices-v1.0.bin (github.com/thewh1teagle/kokoro-onnx
releases) in DIR.
"""
import argparse, json, os, subprocess, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SR = 24000
LEAD = 1.2        # silence before the first line
CHAPTER_IN = 0.8  # picture before a chapter's first line
GAP = {'en': 0.75, 'es': 0.7}   # beat after each sentence
SPEED = {'en': 0.95, 'es': 0.98}
LANGS = {'en': 'en-us', 'es': 'es'}


def load_script(film):
    js = os.path.join(ROOT, film, 'script.js')
    out = subprocess.check_output(['node', '-e', 'process.stdout.write(JSON.stringify(require(process.argv[1])))', js])
    return json.loads(out)


def pad(seconds, chapters):
    """A soft drone: one slow chord per chapter, crossfaded."""
    n = int(seconds * SR)
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    chords = [[110.0, 164.8, 220.0, 277.2], [98.0, 146.8, 196.0, 246.9], [103.8, 155.6, 207.7, 261.6],
              [87.3, 130.8, 174.6, 220.0], [92.5, 138.6, 185.0, 233.1], [82.4, 123.5, 164.8, 207.7],
              [110.0, 164.8, 220.0, 329.6], [98.0, 146.8, 196.0, 293.7]]
    for ci, (start, end) in enumerate(chapters):
        a, b = int(start * SR), min(n, int((end + 2.5) * SR))
        if b <= a:
            continue
        seg = t[a:b] - start
        env = np.minimum(1, seg / 2.5) * np.minimum(1, np.maximum(0, (end + 2.5 - start - seg) / 2.5))
        for k, f in enumerate(chords[ci % len(chords)]):
            wob = 1 + 0.002 * np.sin(2 * np.pi * (0.07 + 0.03 * k) * seg)
            for side, det in ((0, -0.6), (1, 0.6)):
                ph = 2 * np.pi * (f + det) * np.cumsum(wob) / SR
                out[a:b, side] += env * (0.5 / (k + 1)) * np.sin(ph) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.05 * seg + k))
    out /= max(1e-9, np.abs(out).max())
    return out * 0.07


def srt_time(s):
    ms = int(round(s * 1000))
    return '%02d:%02d:%02d,%03d' % (ms // 3600000, ms // 60000 % 60, ms // 1000 % 60, ms % 1000)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('film')
    ap.add_argument('--model', required=True, help='folder with kokoro-v1.0.onnx and voices-v1.0.bin')
    ap.add_argument('--langs', default='en,es')
    args = ap.parse_args()
    from kokoro_onnx import Kokoro
    kok = Kokoro(os.path.join(args.model, 'kokoro-v1.0.onnx'), os.path.join(args.model, 'voices-v1.0.bin'))
    film = load_script(args.film)
    fdir = os.path.join(ROOT, args.film)
    os.makedirs(os.path.join(fdir, 'audio'), exist_ok=True)
    os.makedirs(os.path.join(fdir, 'captions'), exist_ok=True)
    timing = {}
    for lang in args.langs.split(','):
        voice = film['voice'][lang]
        clips, chapters, srt = [], [], []
        t = LEAD
        for ch in film['chapters']:
            c0 = t - (LEAD if not chapters else 0)
            t += CHAPTER_IN
            lines = {}
            for ln in ch['lines']:
                audio, sr = kok.create(ln[lang], voice=voice, speed=SPEED[lang], lang=LANGS[lang])
                assert sr == SR
                audio = np.trim_zeros(np.asarray(audio, dtype=np.float32), 'fb')
                d = len(audio) / SR
                clips.append((t, audio))
                lines[ln['id']] = [round(t, 3), round(t + d, 3)]
                srt.append((t, t + d, ln[lang]))
                t += d + GAP[lang] + ln.get('hold', 0)
            t += ch.get('breathe', 2)
            chapters.append({'id': ch['id'], 'start': round(c0, 3), 'end': round(t, 3), 'lines': lines})
            print(lang, ch['id'], round(c0, 1), '→', round(t, 1), file=sys.stderr)
        total = t + 0.5
        mix = pad(total, [(c['start'], c['end']) for c in chapters])
        for start, audio in clips:
            a = int(start * SR)
            mix[a:a + len(audio), 0] += audio * 0.9
            mix[a:a + len(audio), 1] += audio * 0.9
        mix = np.clip(mix, -0.99, 0.99)
        wav = os.path.join(fdir, 'audio', lang + '.wav')
        import soundfile as sf
        sf.write(wav, mix, SR)
        mp3 = os.path.join(fdir, 'audio', lang + '.mp3')
        subprocess.check_call(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
                               '-ar', '44100', '-b:a', '96k', mp3])
        os.remove(wav)
        with open(os.path.join(fdir, 'captions', lang + '.srt'), 'w', encoding='utf-8') as f:
            for i, (a, b, text) in enumerate(srt, 1):
                f.write('%d\n%s --> %s\n%s\n\n' % (i, srt_time(a), srt_time(b), text))
        timing[lang] = {'duration': round(total, 3), 'chapters': chapters}
    out = os.path.join(fdir, 'timing.js')
    old = {}
    if os.path.exists(out):
        try:
            src = open(out, encoding='utf-8').read()
            old = json.loads(src[src.index('{'):src.rindex('}') + 1])
        except ValueError:
            old = {}
    old.update(timing)
    with open(out, 'w', encoding='utf-8') as f:
        f.write('// Made by films/tools/narrate.py from script.js: when each chapter and line\n'
                '// starts in the soundtrack, in seconds, per language. Do not edit by hand.\n'
                '(self.FilmTiming = self.FilmTiming || {})[%s] =\n%s;\n' % (json.dumps(args.film), json.dumps(old, indent=1, ensure_ascii=False)))


if __name__ == '__main__':
    main()
