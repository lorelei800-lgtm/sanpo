# SANPO 散歩

> Your map of beautiful accidents.
> あなただけの、よりみちの記録。

A town-discovery app. Pin the unexpected things you find while walking —
hidden shrines, quirky signs, cats on walls, retro vending machines — onto
a shared city map. Over time you build a personal atlas of your walks,
and collectively we accumulate a living cultural-landscape dataset in
Re:Earth CMS.

Fun first, data as byproduct.

## Live

https://lorelei800-lgtm.github.io/sanpo/

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS (serif, cream palette)
- MapLibre GL + Stamen Toner-lite (OSM fallback)
- Re:Earth CMS (optional — the app runs with mock data if not configured)
- GitHub Pages deploy

## Local development

```bash
cd app
npm install
npm run dev
```

Opens at `http://localhost:5173/sanpo/`.

With no CMS configured, the app uses 8 mock spots around Tokyo so it looks
populated from the first load.

## Re:Earth CMS setup (optional)

Create one model named `sanpo-spot` with these fields:

| Key | Type | Notes |
|---|---|---|
| `title` | Text | one-line caption |
| `description` | Text | optional longer note |
| `lat` | Number | latitude |
| `lng` | Number | longitude |
| `photo_url` | Text | URL of uploaded image asset |
| `category` | Select | one of: `shrine`, `sign`, `cat`, `vending`, `alley`, `building`, `flower`, `other` |
| `discovered_at` | Date | ISO timestamp |
| `discoverer_name` | Text | |
| `address_hint` | Text | optional |
| `vibe` | Select | optional — `quiet`, `lively`, `forgotten`, `timeless` |

Then fill `app/.env`:

```
VITE_CMS_BASE_URL=https://cms.example.com
VITE_CMS_PROJECT=workspace/project
VITE_CMS_SPOT_MODEL=sanpo-spot
VITE_CMS_TOKEN=...          # only for seeding / writes; leave out of public builds
```

Seed the CMS with the 8 starter spots:

```bash
cd app
npm run seed
```

## Deploy

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds with
`VITE_CMS_BASE_URL` and `VITE_CMS_PROJECT` from repo secrets (no token — the
public build is read-only).

## Design notes

- Warm cream `#FDFBF7` background, terracotta `#C4612F` accent.
- Playfair Display (EN) + Noto Serif JP (JA), mixed on the same line.
- Polaroid-style photo markers on the map (3px white border, drop shadow,
  slight rotation). This is the signature visual.
- Bilingual-native copy: English main text, small Japanese subtitles.
