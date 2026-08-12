# Spending Log

A small shared expense tracker for two phones. Static page + Supabase.

- `index.html` / `app.css` / `app.js` — the app
- `config.js` — Supabase URL + publishable key (both safe to publish)
- `schema.sql` — database setup; run once in the Supabase SQL editor
- `sw.js` — service worker, so it opens instantly and works offline

The household code is **not** in this repo. It travels in the private link
(`#h=...`) and is remembered on each phone after the first open.
