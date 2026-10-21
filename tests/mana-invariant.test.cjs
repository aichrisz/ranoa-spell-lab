const test = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../engine.js');

test('mana remains within [0, 100] throughout a valid mixed-spell run', () => {
  const game = Engine.create({seed: 1});
  game.start();
  for (let index = 0; index < 1250; index++) {
    game.step(0.05);
    const before = game.snapshot();
    game.select(['bolt', 'burst', 'frost'][index % 3]);
    game.cast(before.targets[0]?.x ?? 450, before.targets[0]?.y ?? 280);
    const after = game.snapshot();
    assert.ok(after.mana >= 0 && after.mana <= 100,
      `Mana must remain clamped: frame=${index}, mana=${after.mana}`);
    assert.ok(after.accuracy >= 0 && after.accuracy <= 100);
    assert.ok(Number.isSafeInteger(after.score) && after.score >= 0);
  }
});
