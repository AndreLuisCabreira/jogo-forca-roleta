const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../script.js'), 'utf8').split('const ui =')[0];
function rules(random = 0) {
  const context = vm.createContext({ Math: Object.assign(Object.create(Math), { random: () => random }) });
  vm.runInContext(source + '\nglobalThis.rules = GameRules;', context);
  return context.rules;
}
test('posição fatal é fixa e cobre apenas câmaras 2 a 6', () => {
  for (let i = 0; i < 5; i++) {
    const api = rules((i + .1) / 5);
    const r = api.newRound('facil', null);
    assert.equal(r.fatalPosition, i + 2);
    api.guess(r, 'Z');
    assert.equal(r.fatalPosition, i + 2);
    assert.equal(r.status, 'playing');
    assert.equal(r.phase, 'awaiting-trigger');
  }
});
test('erro pendente bloqueia teclado e não contabiliza mais erros', () => {
  const api = rules(); const r = api.newRound('facil', null);
  api.guess(r, 'Z');
  assert.equal(api.guess(r, 'X').kind, 'ignored');
  assert.equal(r.errors, 1);
});
test('letras repetidas e entradas inválidas não penalizam', () => {
  const api = rules(); const r = api.newRound('facil', null);
  api.guess(r, 'a');
  assert.equal(api.guess(r, 'A').kind, 'repeated');
  for (const input of ['12', '', '!', null]) assert.equal(api.guess(r, input).kind, 'ignored');
  assert.equal(r.errors, 0);
});
test('C revela Ç, e completar a palavra encerra uma única vez', () => {
  const api = rules(); const r = api.newRound('facil', null); r.word = 'LAÇO';
  for (const letter of 'LACO') api.guess(r, letter);
  assert.equal(r.status, 'won');
  assert.equal(r.errors, 0);
  assert.equal(api.finish(r, 'lost'), false);
  assert.equal(api.guess(r, 'Z').kind, 'ignored');
});
test('sexto erro ainda aguarda o gatilho, sem derrota antecipada', () => {
  const api = rules(.999); const r = api.newRound('facil', null); r.word = 'CASA';
  for (const letter of 'BDEFGH') { r.phase = 'guess'; api.guess(r, letter); }
  assert.equal(r.errors, 6); assert.equal(r.status, 'playing');
  assert.equal(r.phase, 'awaiting-trigger');
});
