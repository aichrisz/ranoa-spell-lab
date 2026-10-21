(function (root) {
  "use strict";
  const WORLD = Object.freeze({ width: 900, height: 560 });
  const SPELLS = Object.freeze({
    bolt: Object.freeze({ cost: 10, cooldown: 0.15, radius: 0 }),
    burst: Object.freeze({ cost: 28, cooldown: 0.65, radius: 100 }),
    frost: Object.freeze({ cost: 22, cooldown: 1.2, radius: 140 }),
  });
  function create(options = {}) {
    const initialSeed = options.seed ?? 2026;
    let seed, s, nextId, spawnIn;
    function random() {
      if (options.random)
        return Math.max(0, Math.min(0.999999, options.random()));
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    function spawn() {
      if (s.targets.length >= 12) return;
      const radius = 30 + random() * 14;
      s.targets.push({
        id: nextId++,
        x: 110 + random() * 680,
        y: 100 + random() * 360,
        radius,
        vx: (random() < 0.5 ? -1 : 1) * (22 + random() * 28),
        vy: (random() < 0.5 ? -1 : 1) * (15 + random() * 22),
        life: 12,
        slow: 0,
      });
    }
    function reset() {
      seed = initialSeed >>> 0;
      nextId = 1;
      spawnIn = 1;
      s = {
        phase: "ready",
        remaining: 60,
        elapsed: 0,
        mana: 100,
        score: 0,
        combo: 0,
        bestCombo: 0,
        casts: 0,
        hits: 0,
        selected: "bolt",
        cooldowns: { bolt: 0, burst: 0, frost: 0 },
        targets: [],
        effects: [],
      };
    }
    function start() {
      reset();
      s.phase = "running";
      for (let i = 0; i < 4; i++) spawn();
    }
    function step(dt) {
      if (s.phase !== "running" || !Number.isFinite(dt) || dt <= 0) return;
      // Bounded substeps preserve slow expiry, bounce and spawn behavior for large dt.
      let left = Math.min(dt, s.remaining);
      while (left > 1e-9) {
        const d = Math.min(left, 0.05);
        left -= d;
        s.remaining = Math.max(0, s.remaining - d);
        s.elapsed += d;
        s.mana = Math.min(100, s.mana + 12 * d);
        for (const key of Object.keys(SPELLS))
          s.cooldowns[key] = Math.max(0, s.cooldowns[key] - d);
        for (const t of s.targets) {
          const slowTime = Math.min(d, t.slow);
          const movement = slowTime * 0.35 + d - slowTime;
          t.x += t.vx * movement;
          t.y += t.vy * movement;
          for (const [axis, velocity, max] of [
            ["x", "vx", 900],
            ["y", "vy", 560],
          ]) {
            if (t[axis] < t.radius) {
              t[axis] = t.radius;
              t[velocity] = Math.abs(t[velocity]);
            }
            if (t[axis] > max - t.radius) {
              t[axis] = max - t.radius;
              t[velocity] = -Math.abs(t[velocity]);
            }
          }
          t.slow = Math.max(0, t.slow - d);
          if (t.slow < 1e-8) t.slow = 0;
          t.life -= d;
        }
        s.targets = s.targets.filter((t) => t.life > 0);
        for (const e of s.effects) e.life -= d;
        s.effects = s.effects.filter((e) => e.life > 0);
        spawnIn -= d;
        if (spawnIn <= 1e-8) {
          spawn();
          spawnIn += Math.max(0.55, 1 - s.elapsed / 150);
        }
      }
      if (s.remaining < 1e-8) {
        s.remaining = 0;
        s.phase = "results";
      }
    }
    function cast(x, y) {
      const reject = (reason) => ({ accepted: false, reason });
      if (s.phase !== "running") return reject("inactive");
      if (
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        x < 0 ||
        x > 900 ||
        y < 0 ||
        y > 560
      )
        return reject("aim");
      const spell = SPELLS[s.selected];
      if (s.cooldowns[s.selected] > 1e-8) return reject("cooldown");
      if (s.mana + 1e-8 < spell.cost) return reject("mana");
      // Acceptance tolerates floating-point error; spending must still preserve [0, 100].
      s.mana = Math.max(0, s.mana - spell.cost);
      s.cooldowns[s.selected] = spell.cooldown;
      s.casts++;
      let targets = s.targets.filter(
        (t) => Math.hypot(x - t.x, y - t.y) <= (spell.radius || t.radius + 7),
      );
      if (s.selected === "bolt")
        targets = targets
          .sort(
            (a, b) =>
              Math.hypot(x - a.x, y - a.y) - Math.hypot(x - b.x, y - b.y),
          )
          .slice(0, 1);
      const hit = targets.length > 0;
      let destroyed = 0;
      if (hit) {
        s.hits++;
        if (s.selected === "frost")
          targets.forEach((t) => {
            t.slow = 4;
          });
        else {
          // Post-increment scoring: the fifth consecutive hit earns x2.
          s.combo++;
          s.bestCombo = Math.max(s.bestCombo, s.combo);
          destroyed = targets.length;
          s.score += destroyed * 100 * Math.min(5, 1 + Math.floor(s.combo / 5));
          s.targets = s.targets.filter((t) => !targets.includes(t));
        }
      } else s.combo = 0;
      s.effects.push({
        x,
        y,
        kind: s.selected,
        hit,
        life: 0.65,
        duration: 0.65,
      });
      s.effects = s.effects.slice(-24);
      return { accepted: true, hit, destroyed, spell: s.selected };
    }
    reset();
    return {
      start,
      reset,
      step,
      cast,
      pause() {
        if (s.phase === "running") s.phase = "paused";
      },
      resume() {
        if (s.phase === "paused") s.phase = "running";
      },
      select(key) {
        if (Object.hasOwn(SPELLS, key)) s.selected = key;
      },
      snapshot() {
        return {
          ...structuredClone(s),
          accuracy: s.casts ? Math.round((100 * s.hits) / s.casts) : 0,
          multiplier: Math.min(5, 1 + Math.floor(s.combo / 5)),
        };
      },
    };
  }
  const api = Object.freeze({ create, WORLD, SPELLS });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else (root.Ranoa = root.Ranoa || {}).Engine = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
