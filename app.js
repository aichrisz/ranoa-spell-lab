(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const canvas = $("arena"),
    game = Ranoa.Engine.create({
      seed: Math.floor(Math.random() * 4294967296),
    });
  const renderer = Ranoa.Renderer.create(canvas),
    aim = { x: 450, y: 280 };
  const KEY = "ranoa.spell-lab.record.v1";
  let record = 0,
    storageOK = true,
    previousPhase = "",
    previousTime = null,
    pointer = null,
    targetIndex = -1;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw && raw.length < 256) {
      const r = JSON.parse(raw);
      if (
        r &&
        r.version === 1 &&
        Number.isSafeInteger(r.score) &&
        r.score >= 0 &&
        r.score <= 10000000
      )
        record = r.score;
    }
  } catch {
    storageOK = false;
  }
  $("record").textContent = record;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  $("effects").checked = !motion.matches;
  motion.addEventListener("change", () => {
    $("effects").checked = !motion.matches;
  });
  function text(id, value) {
    const node = $(id),
      v = String(value);
    if (node.textContent !== v) node.textContent = v;
  }
  function say(message) {
    text("feedback", message);
  }
  function sync() {
    const s = game.snapshot();
    text("score", s.score);
    text("time", Math.ceil(s.remaining));
    text("combo", s.combo);
    text("multiplier", " ×" + s.multiplier);
    text("accuracy", s.accuracy + "%");
    text("mana", Math.floor(s.mana));
    text("casts", s.casts);
    text("aim", aim.x.toFixed(1) + ", " + aim.y.toFixed(1));
    $("mana-fill").style.width = s.mana + "%";
    document
      .querySelector("[role=meter]")
      .setAttribute("aria-valuenow", Math.floor(s.mana));
    document
      .querySelectorAll("[data-spell]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", b.dataset.spell === s.selected),
      );
    if (previousPhase !== s.phase) {
      previousPhase = s.phase;
      pointer = null;
      canvas.classList.toggle("active", s.phase === "running");
      $("overlay").hidden = s.phase === "running";
      $("pause").disabled = s.phase !== "running";
      text(
        "phase",
        {
          ready: "Siap",
          running: "Berlangsung",
          paused: "Dijeda",
          results: "Selesai",
        }[s.phase],
      );
      $("result").hidden = s.phase !== "results";
      if (s.phase === "running") {
        canvas.focus({ preventScroll: true });
      }
      if (s.phase === "paused") {
        text("overlay-kicker", "ARUS DITAHAN");
        text("overlay-title", "Ambil napas.");
        text(
          "overlay-copy",
          "Waktu, mana, dan rune berhenti. Lanjutkan saat kamu siap.",
        );
        text("action", "Lanjutkan");
        text("overlay-hint", "Tidak ada waktu yang hilang saat jeda.");
        $("action").focus({ preventScroll: true });
        say("Ujian dijeda. Pilih Lanjutkan.");
      }
      if (s.phase === "results") {
        record = Math.max(record, s.score);
        text("record", record);
        try {
          localStorage.setItem(
            KEY,
            JSON.stringify({ version: 1, score: record }),
          );
        } catch {
          storageOK = false;
        }
        text("overlay-kicker", "PRAKTIKUM SELESAI");
        text("overlay-title", "Arus telah menjawab.");
        text(
          "overlay-copy",
          "Skor " +
            s.score +
            " · Akurasi " +
            s.accuracy +
            "% · Kombo terbaik " +
            s.bestCombo,
        );
        text("result", "Rekor lokal " + record);
        text("action", "Ulangi ujian");
        text(
          "overlay-hint",
          storageOK
            ? "Latihan berikutnya dimulai dari nol."
            : "Penyimpanan tidak tersedia; rekor hanya sesi ini.",
        );
        $("action").focus({ preventScroll: true });
        say(
          "Ujian selesai. Skor " +
            s.score +
            ", akurasi " +
            s.accuracy +
            " persen.",
        );
      }
    }
    renderer.draw(s, aim, $("effects").checked);
  }
  function pause() {
    game.pause();
    previousTime = null;
    sync();
  }
  $("action").addEventListener("click", () => {
    if (game.snapshot().phase === "paused") game.resume();
    else {
      game.start();
      aim.x = 450;
      aim.y = 280;
      targetIndex = -1;
      say("Ujian dimulai. Bidik rune yang mengapung.");
    }
    previousTime = null;
    sync();
  });
  $("pause").addEventListener("click", pause);
  document.querySelectorAll("[data-spell]").forEach((b) =>
    b.addEventListener("click", () => {
      game.select(b.dataset.spell);
      sync();
    }),
  );
  function cast() {
    const r = game.cast(aim.x, aim.y);
    if (!r.accepted) {
      say(
        r.reason === "mana"
          ? "Mana belum cukup. Tunggu arus pulih."
          : r.reason === "cooldown"
            ? "Mantra sedang pulih."
            : "Bidik di dalam arena.",
      );
    } else
      say(
        r.hit
          ? r.spell === "frost"
            ? "Dibekukan · 4 detik."
            : "Rune pecah! +" +
              r.destroyed * 100 * game.snapshot().multiplier +
              " poin."
          : "Meleset. Tarik napas, bidik lagi.",
      );
    sync();
  }
  canvas.addEventListener("pointerdown", (e) => {
    if (
      game.snapshot().phase !== "running" ||
      e.button !== 0 ||
      !e.isPrimary ||
      pointer !== null
    )
      return;
    e.preventDefault();
    canvas.focus({ preventScroll: true });
    pointer = e.pointerId;
    Object.assign(aim, renderer.point(e.clientX, e.clientY));
    canvas.setPointerCapture(e.pointerId);
    sync();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (pointer === e.pointerId) {
      e.preventDefault();
      Object.assign(aim, renderer.point(e.clientX, e.clientY));
      sync();
    }
  });
  canvas.addEventListener("pointerup", (e) => {
    if (pointer !== e.pointerId) return;
    pointer = null;
    if (canvas.hasPointerCapture(e.pointerId))
      canvas.releasePointerCapture(e.pointerId);
    const p = renderer.point(e.clientX, e.clientY);
    if (e.button === 0 && p.x >= 0 && p.x <= 900 && p.y >= 0 && p.y <= 560) {
      Object.assign(aim, p);
      cast();
    }
  });
  canvas.addEventListener("pointercancel", () => {
    pointer = null;
  });
  canvas.addEventListener("lostpointercapture", () => {
    pointer = null;
  });
  canvas.addEventListener("contextmenu", (e) => {
    if (game.snapshot().phase === "running") e.preventDefault();
  });
  document.addEventListener("keydown", (e) => {
    const input = e.target.closest("input");
    const editing = e.target.isContentEditable || e.target.closest("textarea") ||
      (input && !["button", "submit", "reset", "checkbox", "radio", "range", "color", "file", "image"].includes(input.type));
    if (editing || game.snapshot().phase !== "running") return;
    const key = e.key.toLowerCase();
    // Pause remains available after selecting a spell, without intercepting typing.
    if (key === "p" || key === "escape") {
      e.preventDefault();
      pause();
      return;
    }
    // Space/Enter on controls must retain native activation, never cast a spell.
    const native = e.target.closest("button,input,select,textarea,a");
    if (native) return;
    if (["1", "2", "3"].includes(key)) {
      game.select(["bolt", "burst", "frost"][Number(key) - 1]);
      sync();
      return;
    }
    if (e.target !== canvas) return;
    if (key === "t") {
      e.preventDefault();
      const ts = game.snapshot().targets;
      if (ts.length) {
        targetIndex = (targetIndex + 1) % ts.length;
        aim.x = ts[targetIndex].x;
        aim.y = ts[targetIndex].y;
        say("Bidik rune " + ts[targetIndex].id + ".");
      }
      sync();
    } else if (key === " ") {
      e.preventDefault();
      if (!e.repeat) cast();
    } else if (key.startsWith("arrow")) {
      e.preventDefault();
      aim.x = Math.max(
        0,
        Math.min(
          900,
          aim.x + (key === "arrowright" ? 18 : key === "arrowleft" ? -18 : 0),
        ),
      );
      aim.y = Math.max(
        0,
        Math.min(
          560,
          aim.y + (key === "arrowdown" ? 18 : key === "arrowup" ? -18 : 0),
        ),
      );
      sync();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
  });
  window.addEventListener("blur", pause);
  window.addEventListener("resize", sync);
  $("effects").addEventListener("change", sync);
  // Exactly one animation chain. Resume resets its timestamp, never catches up hidden time.
  function frame(now) {
    if (previousTime !== null) game.step((now - previousTime) / 1000);
    previousTime = now;
    sync();
    requestAnimationFrame(frame);
  }
  sync();
  requestAnimationFrame(frame);
  // Only offer Start after the real engine, input handlers and first render succeed.
  $("action").disabled = false;
})();
