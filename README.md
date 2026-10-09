# BandBUDDY

BandBUDDY is a shared setlist workspace for bands. Each event gets its own running order where bandmates can add songs, attach video references, compare an automatically detected source key with the singer's performance key, and keep rehearsal notes in one place.

## Current vertical slice

The first workspace is built around the **Analog Setlist** direction: warm paper surfaces, dark ink, muted stage red, and production-note metadata. It includes a responsive setlist workbench, editable key dropdowns, add/remove song interactions, video links, member presence, a recent-changes rail, band notes, and a shared-state banner.

The Drizzle model and tRPC boundary are ready for persisted collaboration with bands, events, songs, members, and activity. The source-key analyzer is isolated as a server procedure so a production audio/video analysis provider can be connected without changing the editor UI.

## Development

```bash
pnpm install
pnpm dev
```

The app runs on port `3000` by default. Type-check and build with:

```bash
pnpm check
pnpm build
```

The managed database schema can be generated and applied with:

```bash
pnpm db:push
```

## Project map

- `client/src/pages/Home.tsx` — responsive setlist workbench.
- `client/src/index.css` — Analog Setlist visual system.
- `drizzle/schema.ts` — user, band, event, song, membership, and activity tables.
- `server/db.ts` — database helpers.
- `server/routers.ts` — typed setlist procedures.
- `plan.md` — implementation and design decisions.
- `TODO.md` — product outcomes and acceptance clauses.
