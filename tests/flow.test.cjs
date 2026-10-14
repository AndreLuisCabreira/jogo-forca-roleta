// Executa o script real com DOM simulado e relógio controlado; não substitui teste visual.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
class Element {
 constructor(tag='div'){this.tag=tag;this.value='';this.children=[];this.dataset={};this.style={};this.hidden=true;this.disabled=false;this.textContent='';this.events={};this.attrs={};const classes=new Set();this.classList={toggle:(n,v)=>{if(v)classes.add(n);else classes.delete(n);},add:n=>classes.add(n),remove:(...ns)=>ns.forEach(n=>classes.delete(n))};}
 append(...e){this.children.push(...e)}
 replaceChildren(...elements){this.children=elements}
 setAttribute(k,v){this.attrs[k]=v}
 addEventListener(k,v){this.events[k]=v}
 focus(){}
 reset(){}
 querySelectorAll(selector){const all=[];for(const c of this.children){if(c instanceof Element){if(c.tag==='button')all.push(c);all.push(...c.querySelectorAll(selector));}}return all;}
 querySelector(selector){return selector.includes('button')?this.querySelectorAll('button').find(x=>!x.disabled):null;}
}
function app(random=0, storage=new Map(), identify=true){
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const ids=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
 for(const name of ['welcome','menu','game','result','tutorial']) ids[name].dataset.screen=name;
 const menuViews=[];const menuTargets=[];
 for(const match of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)) {
  const tag=match[0];const elem=ids[match[1]];
  for(const [attr,key,list] of [['data-menu-view','menuView',menuViews],['data-menu-target','menuTarget',menuTargets]]) {
   const m=tag.match(new RegExp(attr+'="([^"]+)"'));if(m){elem.dataset[key]=m[1];list.push(elem);}
  }
 }
 const events={};const timers=new Map();let id=0;
 const context=vm.createContext({
  document:{documentElement:new Element(),body:new Element(),getElementById:n=>{assert.ok(ids[n],`missing HTML id ${n}`);return ids[n]},querySelector:()=>new Element('a'),querySelectorAll:s=>s==='[data-screen]'?['welcome','menu','game','result','tutorial'].map(n=>ids[n]):s==='[data-menu-view]'?menuViews:s==='[data-menu-target]'?menuTargets:Array.from({length:6},()=>new Element()),createElement:tag=>new Element(tag),addEventListener:(name,fn)=>events[name]=fn},
  HTMLSelectElement:class {},HTMLInputElement:class {},HTMLTextAreaElement:class {},crypto:require('node:crypto').webcrypto,
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},
  window:{matchMedia:()=>({matches:true}),confirm:()=>true},
  Math:Object.assign(Object.create(Math),{random:()=>random}),
  setTimeout:fn=>{timers.set(++id,fn);return id},clearTimeout:id=>timers.delete(id),
 });
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../script.js'),'utf8'),context);
 if(identify)vm.runInContext('const testPlayer=newPlayer("Dani");profiles.players.push(testPlayer);selectPlayer(testPlayer);',context);
 return {ids,storage,events,run:s=>vm.runInContext(s,context),tick:()=>{for(const [i,fn]of [...timers]){timers.delete(i);fn()}}};
}
test('rodada completa: primeiro erro seguro, segundo fatal e placar único',()=>{
 const a=app();a.run('startRound(); handleGuess("Z");');
 assert.equal(a.ids.trigger.disabled,false);
 assert.ok(a.ids.keyboard.querySelectorAll("button").every(k=>k.disabled));
 a.run('pullTrigger(); pullTrigger(); handleGuess("X");');a.tick();
 assert.equal(a.run('round.shots'),1);assert.equal(a.run('round.status'),'playing');
 assert.equal(a.ids.remaining.textContent,'Risco: 20%');
 a.run('handleGuess("X"); pullTrigger();');a.tick();
 assert.equal(a.run('round.status'),'lost');assert.equal(a.ids.losses.textContent,'01');
 a.run('pullTrigger(); handleGuess("Q");');a.tick();
 assert.equal(a.ids.losses.textContent,'01');
});
test('reiniciar durante a animação cancela a rodada anterior',()=>{
 const a=app();a.run('startRound();handleGuess("Z");pullTrigger();startRound();');a.tick();
 assert.equal(a.run('round.shots'),0);assert.equal(a.run('round.errors'),0);
 assert.equal(a.run('round.phase'),'guess');assert.equal(a.ids.losses.textContent,'01');
});
test('vencer revela todas as ocorrências e salva apenas o placar novo',()=>{
 const a=app();a.run('startRound();for(const letter of "CAS")handleGuess(letter);');
 assert.equal(a.run('round.status'),'won');assert.equal(a.ids.wins.textContent,'01');
 assert.equal(a.ids.result.hidden,false);assert.equal(a.ids.trigger.disabled,true);
 assert.ok(a.storage.has('ultima-letra.jornada.v1'));assert.equal(a.storage.has('palavra.forca.placar'),false);
});
test('câmara seis fatal e risco crescente sem novo sorteio',()=>{
 const a=app(.999);a.run('startRound();');
 const risks=['20%','25%','33%','50%','100%'];
 for(let i=0;i<6;i++){
  a.run('handleGuess([...ALPHABET].find(c=>![...round.word].some(x=>GameRules.normalizeLetter(x)===c)&&!round.guesses.has(c)));pullTrigger();');a.tick();
  assert.equal(a.run('round.shots'),i+1);
  if(i<5){assert.equal(a.run('round.status'),'playing');assert.ok(a.ids.remaining.textContent.includes(risks[i]));}
 }
 assert.equal(a.run('round.status'),'lost');assert.equal(a.ids.losses.textContent,'01');
});
test('trocar dificuldade durante animação contabiliza no nível antigo',()=>{
 const a=app();a.run('startRound();handleGuess("Z");pullTrigger();');
 a.ids.difficulty.value='medio';a.ids.difficulty.events.change();a.tick();
 assert.equal(a.run('score.facil.losses'),1);assert.equal(a.run('score.medio.losses'),0);
 assert.equal(a.run('round.level'),'medio');assert.equal(a.run('round.shots'),0);
});
test('primeiro acesso, formulário, retorno e identificação vazia',()=>{
 const a=app(0,new Map(),false);
 assert.equal(a.run('screen'),'welcome');assert.equal(a.ids['identify-form'].hidden,false);
 a.ids['player-name'].value='   ';a.ids['identify-form'].events.submit({preventDefault(){}});
 assert.equal(a.run('profiles.players.length'),0);
 a.ids['player-name'].value='André';a.ids['player-alias'].value='Sylvie';a.ids['identify-form'].events.submit({preventDefault(){}});
 assert.equal(a.run('screen'),'menu');assert.equal(a.run('player.name'),'André');
 const reopened=app(0,a.storage,false);assert.equal(reopened.ids['welcome-return'].hidden,false);
 assert.equal(reopened.ids['identify-form'].hidden,true);reopened.ids['continue-player'].events.click();
 assert.equal(reopened.run('player.alias'),'Sylvie');assert.equal(reopened.run('screen'),'menu');
});
test('troca de usuário mantém progressos separados e permite retornar',()=>{
 const a=app();a.run('startRound();for(const c of "CAS")handleGuess(c);');
 const points=a.run('player.score');
 a.run('openMenu();showWelcome(true);const other=newPlayer("Rosa");profiles.players.push(other);selectPlayer(other);');
 assert.equal(a.run('player.score'),0);assert.equal(a.run('score.facil.wins'),0);
 a.run('selectPlayer(profiles.players[0]);');assert.equal(a.run('player.score'),points);assert.equal(a.run('score.facil.wins'),1);
});
test('QWERTY, teclado físico e virtual compartilham regras de entrada',()=>{
 const a=app();const rows=a.ids.keyboard.children.map(row=>row.children.map(k=>k.dataset.letter).join(''));
 assert.deepEqual(rows,['QWERTYUIOP','ASDFGHJKL','ZXCVBNM']);
 a.run('startRound();');
 const event=key=>({key,target:new Element(),ctrlKey:false,altKey:false,metaKey:false,repeat:false});
 a.events.keydown(event('c'));a.events.keydown(event('C'));a.events.keydown(event('1'));a.events.keydown(event('!'));
 assert.equal(a.run('round.guesses.size'),1);assert.equal(a.run('round.letterStreak'),1);
 a.ids.keyboard.querySelectorAll('button').find(b=>b.dataset.letter==='A').events.click();
 assert.equal(a.run('round.guesses.size'),2);assert.equal(a.ids['word-percent'].textContent,'75%');
 a.events.keydown({...event('X'),repeat:true});assert.equal(a.run('round.guesses.size'),2);
 a.events.keydown({...event('S'),target:a.run('new HTMLInputElement()')});assert.equal(a.run('round.status'),'playing');
 a.events.keydown(event('s'));assert.equal(a.run('screen'),'result');assert.equal(a.ids['word-percent'].textContent,'100%');
});
test('categorias são selecionáveis e persistem com a dificuldade',()=>{
 const a=app();a.ids.categories.children[3].events.click();
 assert.equal(a.run('player.category'),'tecnologia');
 a.ids['menu-difficulty'].value='dificil';a.ids['menu-difficulty'].events.change();a.ids.play.events.click();
 assert.equal(a.run('round.category'),'tecnologia');assert.equal(a.run('round.level'),'dificil');
 assert.equal(a.run('CATEGORIES.tecnologia.words.dificil.includes(round.word)'),true);
 const b=app(0,a.storage,false);b.ids['continue-player'].events.click();assert.equal(b.run('player.category'),'tecnologia');assert.equal(b.run('selectedLevel'),'dificil');
});
test('pontuação, nível, atividade e conquistas são creditados uma vez',()=>{
 const a=app();a.run('player.score=490;startRound();for(const c of "CAS")handleGuess(c);');
 assert.equal(a.run('player.score'),536);assert.equal(a.run('levelOf(player)'),2);assert.equal(a.run('player.cognitiveScore'),13);
 assert.equal(a.run('player.winStreak'),1);assert.equal(a.run('player.discovered'),4);assert.equal(a.run('player.achievements.includes("first")'),true);
 a.run('recordResult();');assert.equal(a.run('player.score'),536);assert.equal(a.run('player.wins'),1);
 const b=app(0,a.storage,false);assert.equal(b.run('player.score'),536);assert.equal(b.run('player.cognitiveScore'),13);
});
test('sequência de letras zera com erro, vitória aumenta e derrota zera sequência',()=>{
 const a=app();a.run('startRound();for(const c of "CAS")handleGuess(c);startRound();');
 a.run('handleGuess(round.word[0]);');assert.equal(a.run('round.letterStreak'),1);
 a.run('handleGuess("Z");');assert.equal(a.run('round.letterStreak'),0);a.run('pullTrigger();');a.tick();
 a.run('handleGuess("X");pullTrigger();');a.tick();assert.equal(a.run('player.winStreak'),0);assert.equal(a.run('player.bestWins'),1);
});
test('maior dificuldade aumenta pontos e marcos de recompensa',()=>{
 const scores=[];const marks=[];
 for(const level of ['facil','medio','dificil']){const a=app();a.run(`selectedLevel="${level}";startRound();for(const c of [...new Set(round.word)])handleGuess(c);`);scores.push(a.run('player.score'));marks.push(a.run('player.weightedWins'));}
 assert.ok(scores[2]>scores[1]&&scores[1]>scores[0]);assert.deepEqual(marks,[1,2,4]);
});
test('conquistas e recompensas por marcos/sequência não duplicam',()=>{
 const a=app();a.run('player.weightedWins=49;player.winStreak=13;player.wins=9;player.hardWins=9;player.discovered=99;selectedLevel="dificil";startRound();for(const c of [...new Set(round.word)])handleGuess(c);');
 assert.equal(a.run('player.rewards.length'),7);assert.equal(a.run('player.achievements.length'),5);
 a.run('unlockRewards(player);recordResult();');assert.equal(a.run('player.rewards.length'),7);
 a.run('openMenu();');assert.equal(a.ids.rewards.children.length,2);a.ids.rewards.children[0].children[2].events.click();
 assert.match(a.ids['reward-detail'].textContent,/Nenhum cupom/);
});
test('Plus demonstrativo é persistido e só oculta anúncio no resultado',()=>{
 const a=app();a.ids['plus-toggle'].events.click();assert.equal(a.run('player.isPlus'),true);
 a.run('startRound();');assert.equal(a.ids.result.hidden,true);a.run('for(const c of "CAS")handleGuess(c);');
 assert.equal(a.ids['mock-ad'].hidden,true);assert.equal(a.ids.game.hidden,true);
 const b=app(0,a.storage,false);assert.equal(b.run('player.isPlus'),true);
});
test('fechar durante partida conta uma derrota na reabertura, sem premiação',()=>{
 const a=app();a.run('startRound();handleGuess("C");');
 const b=app(0,a.storage,false);assert.equal(b.run('player.stats.facil.losses'),1);assert.equal(b.run('player.score'),0);
 const c=app(0,b.storage,false);assert.equal(c.run('player.stats.facil.losses'),1);
});
test('atividade dos últimos sete dias exclui datas anteriores',()=>{
 const a=app();a.run('player.days={"2026-10-08":10,"2026-10-02":20,"2026-10-01":999};');
 assert.equal(a.run('weeklyActivity(player,new Date(2026,9,8))'),30);
});
test('JSON corrompido e armazenamento bloqueado não impedem iniciar',()=>{
 const data=new Map([['ultima-letra.jornada.v1','{oops']]);const a=app(0,data,false);assert.equal(a.run('profiles.players.length'),0);
 const blocked={get(){throw Error('bloqueado')},set(){throw Error('bloqueado')}};
 const b=app(0,blocked);assert.equal(b.ids['storage-warning'].hidden,false);b.run('startRound();');assert.equal(b.run('round.status'),'playing');
});
test('todos os bancos têm três dificuldades e palavras válidas',()=>{
 const a=app();assert.equal(a.run(`Object.values(CATEGORIES).every(cat=>LEVELS.every(level=>cat.words[level].length>=2&&cat.words[level].every(w=>[...w].every(c=>GameRules.normalizeLetter(c)))))`),true);
});
test('próxima meta avança no limiar e termina sem valores inválidos',()=>{
 const a=app();assert.equal(a.run('rewardOutlook(player).target'),5);
 a.run('player.weightedWins=5;unlockRewards(player);renderMenu();');
 assert.equal(a.run('rewardOutlook(player).target'),10);assert.equal(a.ids['next-reward-bar'].value,5);
 a.run('player.weightedWins=50;player.winStreak=14;unlockRewards(player);renderMenu();');
 assert.equal(a.run('rewardOutlook(player).target'),null);assert.equal(a.run('rewardOutlook(player).streak'),null);
 assert.equal(a.ids['next-reward-bar'].max,1);assert.equal(a.ids['next-reward-bar'].value,1);
 assert.match(a.ids['next-reward-label'].textContent,/Todos os marcos/);
});
test('resultado atualiza placar e meta sem exigir retorno ao menu',()=>{
 const a=app();a.run('startRound();for(const c of "CAS")handleGuess(c);');
 assert.equal(a.ids['result-panorama'].children[0].children[1].textContent,'46');
 assert.equal(a.ids['result-panorama'].children[1].children[1].textContent,'1');
 assert.equal(a.ids['result-next-reward-bar'].value,1);
 assert.match(a.ids['result-presence'].textContent,/Presença simulada/);
 assert.equal(a.run('screen'),'result');
});
test('menu inicia focado em jogar e alterna áreas sem perder progresso',()=>{
 const a=app();assert.equal(a.ids.challenge.hidden,false);assert.equal(a.ids.journey.hidden,true);assert.equal(a.ids['rewards-panel'].hidden,true);
 a.ids['nav-progress'].events.click();assert.equal(a.ids.journey.hidden,false);assert.equal(a.ids.challenge.hidden,true);
 a.ids['nav-support'].events.click();assert.equal(a.ids['support-panel'].hidden,false);assert.equal(a.ids['plus-panel'].hidden,true);a.ids['support-tab-plus'].events.click();assert.equal(a.ids['plus-panel'].hidden,false);assert.equal(a.ids['support-panel'].hidden,true);assert.equal(a.ids.journey.hidden,true);
 a.run('openMenu();');assert.equal(a.ids.challenge.hidden,false);assert.equal(a.run('player.played'),0);
});
test('tutorial percorre os quatro passos e retorna aos desafios sem iniciar partida',()=>{
 const a=app();a.ids['open-tutorial'].events.click();assert.equal(a.run('screen'),'tutorial');assert.equal(a.ids['tutorial-back'].disabled,true);
 for(let i=0;i<3;i++)a.ids['tutorial-next'].events.click();assert.equal(a.ids['tutorial-count'].textContent,'PASSO 4 / 4');
 a.ids['tutorial-back'].events.click();assert.equal(a.ids['tutorial-count'].textContent,'PASSO 3 / 4');
 a.ids['tutorial-next'].events.click();a.ids['tutorial-next'].events.click();assert.equal(a.run('screen'),'menu');assert.equal(a.run('round'),null);assert.equal(a.run('player.played'),0);
});
test('resultado alterna resumo, benefícios e anúncio respeitando Plus',()=>{
 const a=app();a.run('startRound();for(const c of "CAS")handleGuess(c);');
 assert.equal(a.ids['result-summary'].hidden,false);assert.equal(a.ids['result-benefits'].hidden,true);assert.equal(a.ids['mock-ad'].hidden,true);
 a.ids['result-tab-benefits'].events.click();assert.equal(a.ids['result-benefits'].hidden,false);assert.equal(a.ids['result-summary'].hidden,true);
 a.ids['result-tab-ad'].events.click();assert.equal(a.ids['mock-ad'].hidden,false);
 a.run('player.isPlus=true;showResult();setResultView("ad");');assert.equal(a.ids['mock-ad'].hidden,true);assert.equal(a.ids['result-tab-ad'].hidden,true);
 assert.equal(a.run('player.wins'),1);
});
test('paginação permite acessar todos os itens sem perder desbloqueios',()=>{
 const a=app();const names=new Set();
 for(let i=0;i<3;i++){for(const card of a.ids.achievements.children)names.add(card.children[0].textContent);a.ids['achievements-next'].events.click();}
 assert.equal(names.size,5);assert.equal(a.ids['achievements-next'].disabled,true);
 a.run('player.rewards=Array.from({length:7},(_,i)=>({id:"test-"+i,label:"Marco "+i,tier:i%4}));renderMenu();');
 const rewards=new Set();for(let i=0;i<4;i++){for(const card of a.ids.rewards.children)rewards.add(card.children[1].textContent);a.ids['rewards-next'].events.click();}
 assert.equal(rewards.size,7);assert.equal(a.ids['rewards-next'].disabled,true);assert.equal(a.run('player.rewards.length'),7);
 a.ids['rewards-prev'].events.click();assert.equal(a.ids['rewards-page'].textContent,'3 / 4');
});
