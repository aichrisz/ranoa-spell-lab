# Ranoa Spell Lab

Game arcade air 60 detik, tanpa dependensi runtime atau koneksi jaringan.

## API dan arsitektur

`Ranoa.Engine.create({seed, random?})` menghasilkan instance privat:
`start()`, `reset()`, `pause()`, `resume()`, `step(dtSeconds)`, `select('bolt'|'burst'|'frost')`, `cast(x,y)`, `snapshot()`.
Snapshot adalah salinan terpisah; tidak mengekspos state permainan aktif. Cast mengembalikan accepted/hit/destroyed atau reason. Engine juga diekspor CommonJS untuk pengujian Node.

    input HTML → app.js → engine.js (aturan murni)
                            ↓ snapshot
                         renderer.js → Canvas

Skor memakai combo SETELAH increment: hit kelima bernilai x2. Burst menambah combo sekali, walaupun banyak target. Frost memperlambat 35% selama 4 detik aktif, tanpa skor. Miss valid mereset combo; cast ditolak tidak mengubah statistik. Mana 100, regenerasi 12/detik. Biaya/cooldown: Bolt 10/0,15s, Burst 28/0,65s, Frost 22/1,2s. Burst radius 100, Frost 140, world 900×560. Target kedaluwarsa 12 detik; maksimum 12.

## Menjalankan

Node modern: `npm ci --ignore-scripts`, `npm run dev`, buka http://127.0.0.1:4184. Atau buka index.html langsung. `npm run build` menulis dist; `npm run export` menghasilkan artifacts/Ranoa-Spell-Lab.html untuk offline.

`npm run check`, `npm run test:unit`, `npm run test:e2e`, `npm test`, `npm audit`.
CHROMIUM_PATH dapat mengubah executable browser; default mengikuti Chromium lokal yang disetujui. Tes serialized. Tidak ada server publik, telemetry, audio, atau aset remote.

## Kontrol

Klik Mulai ujian. Sentuh/klik lalu lepas di arena untuk cast. 1/2/3 memilih spell; fokus arena, panah menggerakkan bidik, T membidik target berikutnya, Space cast. P/Escape jeda, tombol Lanjutkan untuk melanjutkan. Perpindahan tab/window otomatis jeda. Keyboard pada tombol tetap memakai aktivasi native. Efek dekoratif dapat dinonaktifkan; target tetap bergerak pada reduced motion.

Rekor skor lokal versi 1 disimpan pada ranoa.spell-lab.record.v1, tidak ada PII. Storage rusak/ditolak tidak menghalangi bermain. Canvas spasial belum merupakan pengalaman screen-reader penuh; HUD, kontrol, bidik dan hasil dapat dibaca. Axe bukan sertifikasi aksesibilitas gameplay.

Hasil eksekusi dan batas verifikasi: docs/tdd-evidence.md dan artifacts/implementation-report.md. Screenshot nyata: artifacts/desktop-ready.png, desktop-playing.png, mobile-ready.png, mobile-playing.png.

Fan-made, tidak resmi dan tidak berafiliasi dengan pemilik karya asal. Seluruh ilustrasi arena/rune dibuat khusus memakai Canvas/SVG.

## Rilis lokal 1.0.0 — 2026-10-22

Arcade 60 detik aktif dengan tiga mantra, kombo, mana/cooldown, target bergerak, rekor lokal, jeda otomatis dan hasil/replay. Engine deterministik hanya mengatur aturan; renderer membaca snapshot terpisah dan menggambar dunia; adapter HTML mengelola input, fokus, penyimpanan serta satu clock/rAF. Efek dekoratif tidak mengubah perhitungan gameplay.

Parent menjalankan ulang 7 tes unit dan 13 tes browser: semuanya lulus, tanpa skipped/flaky; audit dependensi nol kerentanan. Lima tes engine independen, tiga mantra lewat emulasi touchscreen Chromium, dan HTML mandiri tanpa permintaan aset tetangga juga lulus. Review Astra dengan konteks baru memberi `ship`; bukti rinci dan batas review ada di docs/tdd-evidence.md. Ini rilis **lokal/offline**, belum dipublikasikan ke GitHub atau hosting. Unduh artifacts/Ranoa-Spell-Lab.html dan buka di browser untuk bermain tanpa instalasi.
