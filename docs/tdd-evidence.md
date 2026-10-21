# TDD evidence — observed, not simulated

## Slice 1: start contract

Before engine.js existed, `npm run test:unit` returned exit 1: `Cannot find module '../engine.js'`; tests 1, pass 0, fail 1 (59.663461 ms). A minimal real create/start/snapshot implementation then returned tests 1, pass 1, fail 0 (74.163575 ms).

## Slice 2: actual gameplay rules

Added five tests before implementing cast/select/step/pause/resume. `npm run test:unit` returned tests 6, pass 1, fail 5 (85.436035 ms), with `g.cast is not a function`, `g.select is not a function`, and `g.step is not a function`.

Implemented deterministic state, injected RNG, damage/frost, post-increment score, accepted-cast accuracy, mana/cooldowns, target lifecycle, active-time simulation, pause and reset. First run: pass 5, fail 1 because a test compared floating-point slow duration `3.0000000000000036` to exact `3`. Corrected that assertion to a numerical tolerance; did not weaken the four-active-second expiry or movement test. Next run: tests 6, pass 6, fail 0 (107.448595 ms).

## Slice 3: real browser interaction

Wrote browser tests against the intended HTML controls before implementing the UI/controller/renderer. With only a title shell, `npm run test:e2e -- --grep 'real keyboard' --timeout 5000` failed 1/1: waiting for button `Mulai ujian`; test timeout 5000 ms. There was no game controller or synthetic state hook.

After implementation, first full browser run: 4 passed / 3 failed (1.1m). Two tests exceeded 30s while drawing every frame of clock.runFor(61000); another attempted clock.pauseAt in the past. Replaced long frame-by-frame advancement with Playwright fastForward after a first animation tick, preserving real engine dt/timer end. Removed the past timestamp. Next run: 7 passed (16.7s), including all spells, real keyboard/pointer casts, score/miss, pause, results/replay/records, source file://, dist and offline file://.

## Regression expansion / harness correction

Added DPR2 live resize, active pointercancel/outside-release, reduced-motion frame changes, paused-frame equality, mana/cooldown HUD rejection, invalid record schemas and server private-path denials. First targeted run: DPR2 passed; mana assertion failed because a real-running browser clock regenerated mana during test operations. Explicitly paused injected clocks; no production bypass added. The following full run: 8 passed / 1 failed (45.5s): axe itself waited on frozen timers. Accessibility scans now temporarily resume the browser clock and pause it again after the scan. No axe rules or elements excluded.

These extra regressions were coverage expansion against implemented behavior, not claimed as all individually failing-before-code TDD cycles.

## Initial gate snapshot — incomplete coverage, superseded below

`npm test` exit 0:

    Node: tests 6; pass 6; fail 0; duration_ms 196.697338
    Playwright: 9 passed (20.8s), 1 worker

Initial stdout is artifacts/final-tests.txt. This 6-unit/9-browser snapshot was incomplete: it did not establish nonnegative mana under sustained mixed casting, actual standalone styling/resource isolation, simultaneous desktop arena/control visibility, or no-JavaScript behavior. The parent regressions below exposed real failures despite this earlier green run. Initial `npm run check`: syntax and public boundary checks passed, 9 JS files. `npm run build`: 6 allowlisted runtime files. `npm run export`: offline HTML written. `npm audit`: found 0 vulnerabilities (artifacts/audit.txt).

Axe WCAG2A/AA, WCAG2.1AA and best-practice reported zero violations in ready, running, paused and results during the passing browser test. This is automated UI evidence, not a claim of complete nonvisual accessibility of spatial Canvas gameplay. Visibility hidden and blur events are exercised through browser DOM events; real OS app switching is not automated here. Browser coverage is local Chromium, not Safari/Firefox or a physical touch device.

Formatting used one-off pinned Prettier. It formatted HTML/CSS/JS/CJS/JSON/README, then exited 2 because no parser was inferred for SVG. The small original SVG remains readable and was not altered by that formatter. Subsequent syntax/build/tests passed.

## Targeted parent correction: RED → GREEN

Parent wrote and ran tests before this correction pass; the worker did not edit or weaken either regression file. Parent-reported RED:

- tests/mana-invariant.test.cjs: one failure, seed 1, frame 150, mana -1.5987211554602254e-14. Epsilon acceptance allowed tiny negative mana; floor could display -1.
- tests/e2e/delivery.spec.cjs: all three failed. Standalone body background was rgba(0,0,0,0) with a missing neighboring artifacts/styles.css; desktop spell bottom 942.6875 exceeded a 900px viewport after scrolling the lab to the top; no-JavaScript requirement text was missing and Start was enabled.

Production corrections:

- Preserve mana rejection tolerance, clamp mana to zero after accepted spending.
- Export CSS using a formatting-tolerant match for both link forms and whitespace. Require exactly one stylesheet replacement and one of each script; reject leftover non-data resource attributes before writing the standalone file.
- At desktop widths >=1024, move instruments/spells beside the proportionate arena using a two-column layout. Keep the existing mobile stacked layout and controls.
- Add visible noscript requirement text; Start stays disabled in HTML until the real controller finishes wiring handlers, rendering and scheduling its loop.
- Source ZIP allowlist now includes both parent regression files and verification helpers.

Observed GREEN from the final correction command chain (`npm run check && npm run build && npm run export && npm test && npm audit`): exit 0. Check: 10 JS files. Build: 6 runtime files. Unit: 7 passed, 0 failed, 207.675894 ms. Browser: 12 passed, 0 failed, one worker, 18.6s. Audit: 0 vulnerabilities. Full stdout: artifacts/correction-tests.txt. All original tests and axe rules are unchanged.

Standalone regression now checks computed midnight background, zero neighboring/external requests and an actual scored hit. Desktop regression passes at 1440x900 and 1366x768 with canvas and every spell selector visible together after scrolling the lab to top. No-JS regression passes. The existing browser suite regenerated the actual four ready/playing desktop/mobile screenshots.

Additional bounded helper `node scripts/verify-correction.cjs` passed: three stylesheet formatting variants embed CSS, missing/duplicate links throw; ready/paused/results overlays are contained, no horizontal overflow, and world aspect ratio is intact at DPR2 for 320x900, 390x900, 768x1000, 1024x768, 1440x900 and 1366x768. Raw stdout: artifacts/correction-verification.txt. This helper adds verification without altering parent test assertions or suite totals.

The original 6/9 green snapshot was not a sufficient delivery gate. These results are correction evidence, not a ship verdict; parent retains independent verification and fresh review.

## Final keyboard correction: parent RED → worker GREEN

Parent added and ran the `pause shortcuts` delivery regression before this fix. Parent-reported RED: 1 failed; expected `Dijeda`, received `Berlangsung` after Escape/P on a focused spell button. The native-control early return swallowed both pause keys.

Only runtime change: app.js now excludes actual text-editing fields first, then handles Escape/P before the generic native-control guard. Native Space/Enter remain untouched on buttons and other controls; no button activation casts a spell. The delivery test file was reformatted for readability without changing its actions or assertions. Correction 1 history and logs above are preserved.

Observed targeted GREEN: `npm run test:e2e -- tests/e2e/delivery.spec.cjs --grep "pause shortcuts"` → 1 passed (2.0s). It exercises Escape and P after selecting Aqua Burst, resumes through native Space, and verifies casts remain zero. Raw stdout: artifacts/keyboard-targeted-tests.txt.

Observed full gate: `npm run check && npm run build && npm run export && npm test && npm audit` → exit 0. Check: 10 JavaScript files; build: 6 runtime files; unit: 7 passed, 0 failed (201.001181 ms); browser: 13 passed, 0 failed (19.3s), one worker; audit: 0 vulnerabilities. Source, dist and standalone offline checks and all axe states remain green. Raw stdout: artifacts/keyboard-correction-tests.txt. This supersedes the correction 1 total of 7 unit / 12 browser tests, without erasing that historical result.

Parent completed independent acceptance and read-only review on 2026-10-22 (Europe/Berlin). Independent rerun: syntax/build/export passed, 7/7 unit tests and 13/13 browser tests passed (zero skipped/flaky/unexpected); npm audit reported zero vulnerabilities. Additional parent engine suite: 5/5; live-input source browser checks at390/1440 DPR2, fifteen responsive overlay cases, and exported offline styling/resource isolation all passed. An additional Chromium mobile-touch emulation exercised bolt/frost/burst through real touchscreen events with100% accuracy; this is not physical-device testing.

Fresh Astra reviewer session `20261021_235352_43c0d2` returned `ship`, `passed:true`, with empty security/logic arrays. It reran unit tests and inspected browser evidence, rather than claiming its own browser rerun. Before/after complete-tree fingerprints were identical (`b68586fe3348b82d9db2d4d665c8e7308ae81acc5e8b649fd4d8b65df25f030f`), as was the reviewed staged diff (`8267230979b6044402d9ef0a41dd72396ed239f004670053d7dc379f6e617aaf`); review was behaviorally read-only, not OS-sandboxed. Subsequent changes only document these results; runtime code remains as reviewed.

One nonblocking efficiency suggestion remains: stop unnecessary redraw in ready/paused/results while preserving a single rAF chain and reset timestamps. No public repository/deployment was requested or performed. Local offline delivery only; physical devices, Safari/Firefox and complete nonvisual gameplay equivalence remain outside verified scope.
