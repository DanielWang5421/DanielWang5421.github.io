# danielwang5421.github.io

Personal portfolio. Plain HTML, CSS, and JavaScript with no build step.

- `index.html`, `styles.css`, `main.js` are the home page and shared code.
- `projects/*.html` are the project detail pages (they share the same CSS and JS).
- `assets/video/` holds the compressed robot video and its poster frame.
- `assets/img/` holds optimized photos (webp with jpg fallback).
- `assets/fonts/` self-hosts Geist and Geist Mono.
- `uploads/resume.pdf` is the resume linked from the hero.

Deploys to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml`.
In the repo settings, Pages source must be set to **GitHub Actions**.

To preview locally, open `index.html` in a browser or run any static server, for example:

```
python -m http.server 8000
```
