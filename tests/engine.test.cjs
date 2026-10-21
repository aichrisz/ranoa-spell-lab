const { test } = require("node:test");
const assert = require("node:assert/strict");
const { create } = require("../engine.js");
const game = () => {
  const g = create({ seed: 7 });
  g.start();
  return g;
};
const hit = (g) => {
  const t = g.snapshot().targets[0];
  return g.cast(t.x, t.y);
};
test("bolt hit, valid miss, cooldown and invalid aim are atomic", () => {
  const g = game();
  assert.equal(hit(g).hit, true);
  assert.equal(g.snapshot().score, 100);
  assert.equal(g.snapshot().combo, 1);
  const before = g.snapshot();
  assert.equal(hit(g).reason, "cooldown");
  assert.equal(g.cast(NaN, 20).accepted, false);
  assert.equal(g.cast(-1, 20).accepted, false);
  assert.deepEqual(g.snapshot(), before);
  g.step(0.2);
  g.cast(0, 0);
  assert.equal(g.snapshot().combo, 0);
  assert.equal(g.snapshot().accuracy, 50);
});
test("burst hits multiple, increments combo once; frost slows for four active seconds", () => {
  const g = create({ random: () => 0.5 });
  g.start();
  g.select("burst");
  const r = g.cast(450, 280);
  assert.ok(r.destroyed >= 2);
  assert.equal(g.snapshot().combo, 1);
  assert.equal(g.snapshot().score, r.destroyed * 100);
  assert.equal(g.snapshot().accuracy, 100);
  g.step(1.1);
  g.select("frost");
  assert.equal(hit(g).hit, true);
  const s = g.snapshot();
  const t = s.targets[0];
  assert.equal(t.slow, 4);
  assert.equal(s.combo, 1);
  g.step(1);
  const u = g.snapshot().targets.find((v) => v.id === t.id);
  assert.ok(Math.abs(u.x - t.x - t.vx * 0.35) < 0.01);
  g.pause();
  g.step(5);
  assert.ok(Math.abs(g.snapshot().targets[0].slow - 3) < 1e-8);
  g.resume();
  g.step(3);
  assert.equal(g.snapshot().targets[0].slow, 0);
});
test("mana rejection, regeneration clamp and inactive casts", () => {
  const g = game();
  g.select("burst");
  for (let i = 0; i < 5; i++) {
    g.cast(0, 0);
    g.step(0.65);
  }
  const s = g.snapshot();
  assert.equal(g.cast(0, 0).reason, "mana");
  assert.deepEqual(g.snapshot(), s);
  g.step(10);
  assert.equal(g.snapshot().mana, 100);
  g.pause();
  assert.equal(hit(g).reason, "inactive");
});
test("post-increment multiplier, best combo and frost miss", () => {
  const g = game();
  for (let i = 0; i < 5; i++) {
    hit(g);
    g.step(1.05);
  }
  assert.equal(g.snapshot().combo, 5);
  assert.equal(g.snapshot().score, 600);
  g.select("frost");
  g.cast(0, 0);
  assert.equal(g.snapshot().combo, 0);
  assert.equal(g.snapshot().bestCombo, 5);
});
test("deterministic dt, bounded spawning, freeze, exact finish and replay reset", () => {
  const g = game();
  const h = game();
  for (const dt of [NaN, -1, Infinity, 0]) g.step(dt);
  assert.deepEqual(g.snapshot(), h.snapshot());
  g.step(8);
  h.step(8);
  assert.deepEqual(g.snapshot(), h.snapshot());
  assert.ok(g.snapshot().targets.length <= 12);
  for (const t of g.snapshot().targets) {
    assert.ok(t.x >= t.radius && t.x <= 900 - t.radius);
    assert.ok(t.y >= t.radius && t.y <= 560 - t.radius);
  }
  g.pause();
  const s = g.snapshot();
  g.step(100);
  assert.deepEqual(g.snapshot(), s);
  g.resume();
  g.step(1000);
  assert.equal(g.snapshot().remaining, 0);
  assert.equal(g.snapshot().phase, "results");
  assert.equal(hit(g).accepted, false);
  const end = g.snapshot();
  g.step(9);
  assert.deepEqual(g.snapshot(), end);
  g.start();
  assert.equal(g.snapshot().remaining, 60);
  assert.equal(g.snapshot().score, 0);
  assert.equal(g.snapshot().casts, 0);
  assert.equal(g.snapshot().effects.length, 0);
  const copy = g.snapshot();
  copy.targets.length = 0;
  assert.ok(g.snapshot().targets.length >= 3);
});
test("ready → start: sixty seconds, full mana, visible targets", () => {
  const g = create({ seed: 7 });
  assert.equal(g.snapshot().phase, "ready");
  g.start();
  const s = g.snapshot();
  assert.equal(s.phase, "running");
  assert.equal(s.remaining, 60);
  assert.equal(s.mana, 100);
  assert.ok(s.targets.length >= 3);
});
