# ArunKumar Mohanan — Portfolio v2

A static, data-driven rebuild of [Cinima_profile](https://github.com/Ak2201/Cinima_profile), with an admin console that publishes to GitHub Pages.

## Run locally

```bash
python3 -m http.server 8411
```

Site: http://localhost:8411 · Admin: http://localhost:8411/admin.html

## How it works

| File | Role |
|---|---|
| `content.json` | **The live content.** Every word, image and link on the site. The admin publishes by committing this file. |
| `data/content.js` | Bundled fallback copy of the original content (used if `content.json` can't be fetched) |
| `index.html`, `js/site.js`, `css/site.css` | Public site. `?lens=actor` / `director` / `anchor` reorders it for that visitor |
| `admin.html`, `js/admin.js`, `css/admin.css` | Admin console: dashboard, editors, live preview, publish, version history |
| `js/github.js` | GitHub sign-in check, one-commit publishing, history, Pages deploy status |
| `js/store.js` | Loads `content.json`; keeps the admin's unpublished draft in the browser |
| `comp-card.html` | Printable A4 comp card (Save as PDF) |
| `assets/` | Compressed media. Images uploaded from the admin land in `assets/uploads/` |

## Publishing from the admin

1. Open `/admin.html` on the live site and choose **Connect GitHub**.
2. Paste a **fine-grained personal access token**: only this repository, **Contents: Read and write** (optionally **Pages: Read** for deploy status).
3. Edit, then **Publish**. The admin commits `content.json` (and any new images) as one commit; GitHub Pages redeploys in about a minute.

Version history lists every published version, and any of them can be loaded back into the draft. If someone else published while you were editing, you're asked before anything is overwritten.

## Contact form

Add a free [Web3Forms](https://web3forms.com) access key in **Admin → Contact** to deliver enquiries to your inbox. Without a key, the form opens the visitor's email app with the message filled in.

## Security notes

- `admin.html` is public, but it can only publish with a token that has write access to this repository.
- The token is only sent to `api.github.com`, and is kept in the browser tab, or on the device if "Remember" is ticked. Use an expiry date and revoke it on GitHub if a device is lost.
