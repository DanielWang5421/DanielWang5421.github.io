# danielwang5421.github.io

Personal portfolio. Plain HTML, CSS, and JavaScript with no build step.

- `index.html`, `styles.css`, `main.js` are the home page and shared code.
- `projects/*.html` are the project detail pages (they share the same CSS and JS).
- `assets/video/` holds the compressed robot video and its poster frame.
- `assets/img/` holds optimized photos (webp with jpg fallback).
- `assets/fonts/` self-hosts Geist, Geist Mono, and Archivo (headings, SIL Open Font Licence, see `Archivo-OFL.txt`).
- `uploads/resume.pdf` is the resume linked from the hero.
- `assets/vendor/` holds Lenis 1.3.26 (smooth scrolling, MIT) and GSAP 3.15.0 with ScrollTrigger and SplitText (free under the GSAP Standard Licence), self-hosted so there is no CDN dependency.
- `robots.txt`, `sitemap.xml`, and `llms.txt` describe the site to search engines and AI crawlers. Update `sitemap.xml` when a project page is added.

Deploys to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml`.
In the repo settings, Pages source must be set to **GitHub Actions**.

To preview locally with the custom 404 page working like GitHub Pages:

```
python serve.py
```

then open http://127.0.0.1:8765/.
