# Hostinger Static Deployment

Use this when deploying only the public marketing site (no login/app/api routes).

## Build

```bash
cd fe
npm run build:static
```

This generates static files in `fe/out`.

Included routes:

- `/`
- `/about`
- `/tokenomics`
- `/buy`
- `/roadmap`
- `/whitepaper`
- `/faq`
- `/blogs`
- `/updates`
- `/legal`
- `/terms`
- `/privacy`
- `/robots.txt`
- `/sitemap.xml`

## Upload to Hostinger

1. Open Hostinger hPanel.
2. Go to `Websites` -> your domain -> `File Manager`.
3. Open `public_html`.
4. Delete existing site files (if replacing the site).
5. Upload all contents from local `fe/out` into `public_html`.

## Important Notes

- This build intentionally excludes authenticated app routes and API routes.
- `Login` is hidden in static export mode.
- Re-run `npm run build:static` after any content/style updates.
