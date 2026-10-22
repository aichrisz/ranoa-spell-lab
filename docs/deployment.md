# GitHub Pages deployment — 2026-10-22

## Published targets
- Public repository: https://github.com/aichrisz/ranoa-spell-lab
- Live game: https://aichrisz.github.io/ranoa-spell-lab/
- Source runtime commit: e3bd07572c0296ba52f41fe6964f2a3beea3175c; tag v1.0.0.
- Pages branch/root: gh-pages `/`, legacy Pages build, HTTPS enforced.
- First deployment commit: 843a9662cda77f63b8d0849714e7a68d73b3c804.

Abel explicitly requested GitHub publication and deployment after the local delivery. The original read-only Astra review approved local code delivery; the separate public-host checks below establish actual Pages availability and behavior, not a broader security certification.

## Runtime/source separation
Only the six allowlisted `dist` runtime files and `.nojekyll` were published to the orphan gh-pages branch. Source, tests and development scripts stay on main; node_modules, caches, artifacts and credentials are not tracked. Relative asset paths work under the repository subpath with no Vite base changes or backend.

## Observed preflight
- Clean main, complete history scan: 2 source commits,26 blobs,26 tracked files; no prohibited secret paths or credential-pattern hits.
- npm run check/build/export, npm test and npm audit all exit0. Tests:7unit+13browser. Audit:0vulnerabilities.
- No gameplay runtime code changed for deployment.

## Observed live gate
- GitHub Pages API status built, expected deployment SHA, HTTPS enforced.
- All six live files matched local dist SHA256 exactly.
- Actual public browser sessions1440×900,390×844,320×844,768×1024 at DPR2 passed.390/320 used Chromium touchscreen emulation and reduced motion.
- Every session cast all3spells, scored the first hit100, maintained100% test accuracy, paused with time/mana frozen, reached results, replayed from zero, and retained the real score record across reload.
- No horizontal overflow, application exceptions, failed requests or external runtime requests. Axe WCAG+best-practice: ready on all sessions; running/paused/results additionally on desktop, zero findings.
- Actual live mobile screenshot inspected. Physical devices/Safari/Firefox and full nonvisual Canvas equivalence remain unverified.

Raw local evidence: artifacts/publication-preflight.json, publication-*.txt, github-pages-deployment.json, github-pages-asset-verification.json, github-pages-live-browser.json and github-pages-live-*.png. Generated artifacts are deliberately ignored in Git.

## Subsequent release / rollback
Build and verify before publishing. Copy only the same explicit public-file set to a clean gh-pages worktree, verify the staged runtime and push HEAD explicitly; read back the remote SHA and Pages build SHA, then exercise the public URL. Preserve history rather than force-pushing. For rollback, make a new deployment commit containing a previously verified runtime tree and repeat the same verification. No previously deployed version exists before this first release; disabling Pages would be a separate deliberate takedown action, not an automatic step performed here.
