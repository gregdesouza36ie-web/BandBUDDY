# BandBUDDY implementation plan

## Product direction

BandBUDDY is a collaborative rehearsal-room workspace for bandmates who need to build the right setlist for a specific event quickly. The first implementation focuses on one clear event workspace: a setlist header, an editable song table, key decisions, member presence, and a lightweight activity rail.

## Design system

- **Design movement:** Analog Setlist — tactile editorial UI inspired by handwritten running orders, cream rehearsal paper, dark ink, and muted red stage markings.
- **Core principles:** calm scanability, tactile control surfaces, musical warmth, and clear hierarchy under rehearsal pressure.
- **Color philosophy:** warm parchment (`#F3E9D2`) makes the workspace feel personal and physical; ink navy/brown supplies dependable contrast; muted stage red (`#A63D40`) is reserved for calls to action and important status; sage and pale blue-green support collaborative/system states without turning the UI into a generic SaaS dashboard.
- **Layout paradigm:** an asymmetric rehearsal desk: a narrow navigation rail, a broad setlist workbench, and a quiet context rail for collaborators and recent edits. On smaller screens the rails collapse into a compact top bar and stacked context sections.
- **Signature elements:** numbered setlist cards with paper-like surfaces, small perforation/divider marks, and key chips that read like annotated music sheets.
- **Interaction philosophy:** direct manipulation first. Song edits stay inline, dropdowns are always close to the song, and feedback is immediate through subtle saved states and activity updates.
- **Animation:** short 160–220ms transitions, gentle row lift on hover, no decorative motion during editing, and a single soft pulse for live collaborator presence.
- **Typography:** Bricolage Grotesque for headings and display labels; IBM Plex Mono for keys, positions, timestamps, and other production-note metadata.
- **Brand essence:** The shared setlist desk for bands who want to walk on stage prepared. Personality: warm, organized, quietly confident.
- **Brand voice:** direct, musical, encouraging. Example lines: “Build the night in order.” / “One setlist, everyone in sync.”
- **Wordmark & logo:** the wordmark uses a bold B monogram with a small red stage mark (a vertical cue line and dot) rather than a plain text-only logo.
- **Signature brand color:** muted stage red `#A63D40`.

## Implementation approach

1. **Workbench UI:** provide a responsive BandBUDDY dashboard for one event setlist. Include navigation, event selector, setlist stats, editable song rows, add-song flow, pasted-video metadata autofill, editable video links, source/manual key dropdowns, Set A/Set B/Set C grouping, native drag/drop and set-aware reorder controls, video links, member avatars, and activity feed.
2. **State model:** keep the first pass usable immediately with local optimistic state for the workbench. Shape all records to match the database model so the UI can move to tRPC persistence without a visual rewrite.
3. **Database foundation:** extend the Drizzle schema with bands, band members, events/setlists, event members, owner-controlled event invitations, songs, song set assignments, and activity records. Keep user identity backed by the starter Manus OAuth flow.
4. **Server boundary:** add typed setlist procedures for listing events, reading an event workspace, creating/updating songs, deleting songs, and recording activity. Add owner-controlled invite procedures with normalized email addresses, pending/accepted/revoked invite state, and member access only after acceptance. Add a public video metadata inspector backed by oEmbed for title/artist/thumbnail, plus client-side YouTube player probing for duration. The source-key analyzer remains a dedicated server procedure boundary so a real audio/video analysis provider can be added without coupling the UI to it.
5. **Routing and runtime:** retain the single `/` workspace route for this first vertical slice and publish `/manus-routes.json` with the complete route set. Use the managed server/database configuration already selected during initialization.
6. **Repository workflow:** develop in the initialized managed project, then sync the working implementation to the BandBUDDY GitHub repository as the canonical project handoff after checks pass.

## Project structure

- `client/src/pages/Home.tsx` — BandBUDDY workspace, drag/drop state, metadata autofill, and invite panel.
- `client/src/App.tsx` — app shell and route manifest surface.
- `client/src/index.css` — Analog Setlist theme tokens, responsive layout, and shared visual language.
- `client/public/manus-routes.json` — route declarations for Preview/publishing.
- `drizzle/schema.ts` — users plus band, event, member, invite, song, and activity tables.
- `server/db.ts` — typed persistence helpers and owner/invite access checks.
- `server/routers.ts` — setlist, collaboration, video metadata, and auth procedures.
- `server/videoMetadata.ts` — provider-neutral title/artist/thumbnail inspection.
- `plan.md` — this implementation and design plan.
- `TODO.md` — outcome-oriented acceptance clauses from the request and Blueprint.

## Product boundaries for this slice

The UI and data shape support collaboration, invitations/presence, video references, source-key suggestions, singer-selected performance keys, native drag/drop reordering, grouped sets, and recent changes. Pasted video URLs autofill title/artist and attempt to fill duration. Musical key remains explicitly marked as pending until a production-grade audio-analysis provider is connected; generic video metadata providers do not expose a trustworthy musical key.

Invite-only access is the rule: no public share link grants event access. The event owner creates pending invitations using email addresses; an authenticated user can accept only an invitation matching their account email, after which the accepted event-member record grants workspace access.

## External metadata notes

- `https://noembed.com/embed?url=...` returns provider-neutral title, author, and thumbnail metadata for supported video links; it does not reliably expose duration or musical key.
- `https://www.youtube.com/iframe_api` is used client-side to attempt duration lookup for YouTube links. Duration can remain unavailable when the player cannot load.
- The source-key field stays pending rather than inventing a key from title metadata; a trustworthy key requires audio analysis of the actual media.
