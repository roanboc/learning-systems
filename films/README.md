# Films

Short films that tell the story of Gaia for people who have never opened a simulation, modelled on the Learning Data films (canvas player, Pause and think, captions, synthetic voice). The difference: the moving pictures are the real simulations of this site, run live with fixed seeds, not drawings.

| Film | Folder | Status |
|---|---|---|
| The journey of life (intro, about 4 min) | `journey/` | Prototype |
| Key moments (one result each) | | Planned, see the plan below |

Plan: `films-plan-v1.md` in the project files (`videos/`).

## Parts

- `player.js`, `player.css`: the player (play, seek, chapters, Pause and think, captions, full screen, Where next?). The soundtrack is the clock.
- `footage.js`: the real worlds (Early Earth, First cells, Colonies, Nerve nets, Ecosystems on the Gaia coast), seed 3, warmed a slice at a time and stepped by film time.
- `<film>/script.js`: every line in English and Spanish, and the Pause and think questions.
- `<film>/scenes.js`: the picture for each chapter, keyed to the narration's lines.
- `<film>/timing.js`, `audio/`, `captions/`, `script.md`: made by the tools below. Do not edit by hand.

## Tools

```
pip install kokoro-onnx soundfile numpy          # and ffmpeg
python3 films/tools/narrate.py journey --model DIR   # DIR has kokoro-v1.0.onnx, voices-v1.0.bin
node films/tools/script-md.js journey
node films/tools/gene-curves.js cells speed 12000    # data for the charts
node films/tools/render.js journey en journey-en.mp4 # MP4, needs Playwright and ffmpeg
```

After changing a line in `script.js`, run `narrate.py` and `script-md.js` again: the timing of every scene follows the new soundtrack.

The MP4 is for sharing and downloading; it is not committed (attach it to a GitHub release).
