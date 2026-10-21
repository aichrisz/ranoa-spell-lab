# Ranoa Spell Lab Implementation Plan

> Agentic execution: requested Astra implementation lane, parent independent review and browser acceptance. Approved design is ../specs/2026-10-22-ranoa-arcade-design.md. Execute continuously; no further design interview.

**Goal:** Deliver a real, polished, offline-playable60-second water-magic arcade with three distinct spells, tested scoring/timing and readable source.

**Architecture:** DOM-free deterministic engine→Canvas renderer + semantic HTML controller. Classic script modules/IIFEs enable both source file:// and an embedded standalone export. Build/server share a public-file boundary; Node and browser tests verify separate concerns.

**Tech stack:** HTML/CSS/vanilla JS/Canvas2D; Node built-ins; dev-only @playwright/test1.64.1 and axe-core4.14.0.

## Global constraints
Exact rules, input behavior, safety boundaries and verification in the approved spec apply verbatim. Astra gpt-6-astra only, no fallback/global config, no repo publication/deploy. No third-party artwork or runtime dependencies. All source human-readable with explanatory inline comments at non-obvious invariants.

## File ownership and interfaces
- engine.js: world/constants, run state, create/start/pause/resume/reset/step/select/cast/snapshot; all rules independent of DOM and clock. Pick one coherent exported API and document it in README before controller integration. Tests import the same real engine, no duplicated scoring implementation.
- renderer.js: coordinate mapping, world drawing, water feedback and bounded cosmetic effects. Consume immutable/read-only engine snapshot; no score or timer mutation.
- app.js: semantic controls, gesture/keyboard lifecycle, resize, visibility pause, safe records, one animation loop. Consume actual engine API.
- index.html/styles.css/assets/sigil.svg: complete game shell, ready/pause/results states, instructions, responsive token system and original visual identity.
- scripts/: root-anchored public allowlist, loopback server, build and offline export.
- tests/engine.test.cjs or .mjs; tests/e2e/*.spec.mjs; package/lock/config/.gitignore; README.md; docs/tdd-evidence.md.

## Task1 — Gameplay tracer bullets
- [ ] Write and RUN a failing Node test for creating and starting a60-second full-mana state before engine code. Implement minimum and prove green.
- [ ] Add failing cast/hit/miss/mana/combo tests one behavior at a time before those rules; implement and prove green.
- [ ] Cover burst multi-target accuracy<=100%, frost duration and slow without score inflation, rejected/inactive/cooldown/NaN input, spawn/bounds/cap, pause/resume, exact end, large dt and clean restart. Inject deterministic RNG; never fake outcomes.
- [ ] Document the actual API and invariant ordering. Keep engine tests green while simplifying.

## Task2 — Playable browser vertical slice
- [ ] Write and RUN a failing browser test showing Start does not yet enter real running state. Implement semantic shell/controller/renderer and prove green via real inputs.
- [ ] Implement spell buttons and pointers, keyboard1/2/3/T/Space/arrows, pause/resume and visibility behavior; add failing regression tests before behavior.
- [ ] Play at least one actual cast/hit with keyboard target assist and observe score/hits change; test pointer hits via real rendered coordinates or game-supported reticle, not a fabricated test hook.
- [ ] Test full60-second end with Playwright controlled clock (and inspect actual result state), replay, records across reload, corrupted/denied storage, reduced motion and effects toggle. Pause gameplay must freeze time/mana/target positions.

## Task3 — Polish and delivery gate
- [ ] Responsive ready/running screenshots at320/390/768/1024/1440, DPR2 pointer mapping, portrait controls, keyboard focus and no clipped overlays. Verify no horizontal overflow.
- [ ] Axe WCAG+best-practice ready/running/paused/results, no exclusions merely to hide defects. Console/errors/HTTP/external requests clean during normal use.
- [ ] Build uses explicit runtime file allowlist; file:// one-file export embeds assets/scripts/CSS. Real offline browser test Start, cast and pause, not only static text.
- [ ] Run npm run check, unit/e2e, build, export and audit. Test generated dist too. Preserve JSON or text raw outputs under ignored artifacts/ as appropriate; write honest RED/GREEN history.
- [ ] Provide actual ready/active desktop+mobile screenshots. Parent performs separate visual/gameplay audit and context-fresh review before final commit/package. Do not commit code from worker.
