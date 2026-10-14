/** Última Letra — forca com tambor. Regras, persistência e interface independentes. */

"use strict";

const WORD_BANK = Object.freeze({

  facil: ["CASA", "LIVRO", "GATO", "RATO", "BOLO", "PATO", "MESA", "VENTO", "NUVEM", "CHUVA", "FOLHA", "PEIXE", "PRAIA", "LAÇO", "POÇO", "FLOR"],

  medio: ["JANELA", "ESCOLA", "CAMINHO", "ABRAÇO", "CAÇULA", "SAPATO", "CADERNO", "COZINHA", "BRINCO", "CACHORRO", "PLANETA", "AMIGOS", "BANANA", "FORMIGA", "TECLADO", "MORANGO"],

  dificil: ["BORBOLETA", "CHOCOLATE", "BICICLETA", "GELADEIRA", "TARTARUGA", "COMPUTADOR", "BRINCADEIRA", "TRAVESSEIRO", "ESCORREGADOR", "JARDINEIRO", "SUPERMERCADO", "FOTOGRAFIA", "ARQUITETURA", "MARAVILHOSO", "PASSARINHO", "DESCOBERTA", "ASTRONAUTA"]
});

const LEVELS = Object.keys(WORD_BANK);

const MAX_ERRORS = 6;

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const ScoreStorage = {

  scoreKey: "palavra.roleta.placar.v1",

  levelKey: "palavra.forca.dificuldade",
  
  emptyScore() {
    
    return Object.fromEntries(LEVELS.map(level => [level, { wins: 0, losses: 0 }]));
  },
  
  readScore() {

    try {

      const saved = JSON.parse(localStorage.getItem(this.scoreKey));
      
      if (!saved || typeof saved !== "object" || !LEVELS.every(level =>
        saved[level] && Number.isSafeInteger(saved[level].wins) && saved[level].wins >= 0 &&
        Number.isSafeInteger(saved[level].losses) && saved[level].losses >= 0)) {

        return this.emptyScore();
      }
      
      return Object.fromEntries(LEVELS.map(level => [level, { wins: saved[level].wins, losses: saved[level].losses }]));

    } catch {
      return this.emptyScore();
    }
  },
  
  readLevel() {

    try {

      const saved = localStorage.getItem(this.levelKey);

      return LEVELS.includes(saved) ? saved : "facil";

    } catch {

      return "facil";
    }
  },
  
  saveScore(score) {

    try { localStorage.setItem(this.scoreKey, JSON.stringify(score)); } catch {  }
  },
  
  saveLevel(level) {

    try { localStorage.setItem(this.levelKey, level); } catch {  }
  }
};

/* CONFIGURAÇÃO: objetos e arrays concentram regras que podem mudar sem tocar no DOM. */
const CONFIG = {
  points: {facil: 40, medio: 120, dificil: 260},
  letterPoints: {facil: 2, medio: 5, dificil: 9},
  activity: {facil: 8, medio: 16, dificil: 28},
  levelStep: 500,
  winsRewards: [5, 10, 25, 50], streakRewards: [3, 7, 14]
};
const CATEGORIES = {
  geral: {name: 'Geral', icon: '✳', description: 'Um pouco de tudo para aquecer.', words: WORD_BANK},
  filmes: {name: 'Filmes', icon: '🎬', description: 'A linguagem das grandes telas.', words: {facil:['CENA','ATOR','ROLO'],medio:['CINEMA','ROTEIRO','DUBLAGEM'],dificil:['FOTOGRAFIA','DOCUMENTARIO','CURTAMETRAGEM']}},
  musica: {name:'Música',icon:'♫',description:'Palavras que dão o ritmo.',words:{facil:['NOTA','SOM','TOM'],medio:['VIOLINO','GUITARRA','MELODIA'],dificil:['INSTRUMENTO','PERCUSSIONISTA','COMPOSITOR']}},
  tecnologia: {name:'Tecnologia',icon:'⌘',description:'Ideias, código e descobertas.',words:{facil:['DADO','REDE','CHIP'],medio:['TECLADO','SISTEMA','ARQUIVO'],dificil:['COMPUTADOR','PROCESSADOR','ALGORITMO']}},
  esportes: {name:'Esportes',icon:'⚽',description:'Entre na disputa com as palavras.',words:{facil:['BOLA','REMO','LUTA'],medio:['FUTEBOL','ATLETA','NATAÇÃO'],dificil:['BASQUETEBOL','CAMPEONATO','VELOCIDADE']}},
  gastronomia: {name:'Gastronomia',icon:'🍋',description:'Ingredientes para pensar melhor.',words:{facil:['BOLO','SAL','ARROZ'],medio:['TEMPERO','COZINHA','MORANGO'],dificil:['CHOCOLATE','FERMENTAÇÃO','CONFEITARIA']}},
  viagens: {name:'Viagens',icon:'✈',description:'Descubra seu próximo destino.',words:{facil:['MALA','MAPA','TREM'],medio:['VIAGEM','PASSAGEM','BAGAGEM'],dificil:['PASSAPORTE','HOSPEDAGEM','EXPLORAÇÃO']}},
  cultura: {name:'Cultura',icon:'◈',description:'Arte e histórias para explorar.',words:{facil:['ARTE','MITO','LIVRO'],medio:['TEATRO','PINTURA','CULTURA'],dificil:['ARQUITETURA','LITERATURA','PATRIMONIO']}},
  negocios: {name:'Negócios',icon:'↗',description:'Uma jornada de boas ideias.',words:{facil:['LOJA','META','LUCRO'],medio:['EMPRESA','MERCADO','PRODUTO'],dificil:['INVESTIMENTO','PLANEJAMENTO','NEGOCIAÇÃO']}}
};
// Acentos são preservados na palavra e normalizados somente na comparação.
const ACHIEVEMENTS = [
 {id:'first',name:'Primeiro acerto',goal:'Acerte uma letra.',check:p=>p.correct>=1},
 {id:'five',name:'Em sintonia',goal:'5 letras certas seguidas.',check:p=>p.bestLetters>=5},
 {id:'ten',name:'Dez vitórias',goal:'Vença 10 partidas.',check:p=>p.wins>=10},
 {id:'hundred',name:'Caçador de letras',goal:'Revele 100 posições de letras.',check:p=>p.discovered>=100},
 {id:'master',name:'Mestre das palavras',goal:'Vença 10 partidas difíceis.',check:p=>p.hardWins>=10}
];
/* DADOS DEMONSTRATIVOS: este adaptador poderá ser substituído por uma API.
   Nenhum nome, presença ou benefício abaixo representa parceiro ou usuário real. */
const DemoData = {
  presence(category) {return {total:1284, category:80 + Object.keys(CATEGORIES).indexOf(category)*23};},
  ranking(points, name) {return [{name:'ANA (demo)',points:9840},{name:'CARLOS (demo)',points:9420},{name:'MARIA (demo)',points:9110},{name,points,current:true}].sort((a,b)=>b.points-a.points);},
  benefit(tier) {return ['Selo de explorador','5% OFF ilustrativo','10% OFF ilustrativo','15% OFF ilustrativo'][tier];}
};
function cleanCount(n) {return Number.isSafeInteger(n) && n>=0 ? n : 0;}
function newPlayer(name, alias='') {
 return {id:globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,name,alias,category:'geral',difficulty:'facil',score:0,wins:0,played:0,winStreak:0,bestWins:0,bestLetters:0,correct:0,discovered:0,hardWins:0,weightedWins:0,cognitiveScore:0,days:{},achievements:[],rewards:[],isPlus:false,stats:ScoreStorage.emptyScore(),pending:null};
}
/* PERSISTÊNCIA: cada perfil tem seu próprio estado. try/catch permite jogar mesmo
   com armazenamento bloqueado; a interface avisa quando o salvamento falha. */
const PlayerStorage = {
 key:'ultima-letra.jornada.v1', failed:false,
 read(){
  try {
   const data=JSON.parse(localStorage.getItem(this.key));
   if(!data || !Array.isArray(data.players)) return {active:null,players:[]};
   const players=data.players.filter(p=>p && typeof p.id==='string' && typeof p.name==='string' && p.name.trim()).map(p=>{
    const base=newPlayer(p.name.slice(0,40),typeof p.alias==='string'?p.alias.slice(0,24):'');base.id=p.id;
    for(const k of ['score','wins','played','winStreak','bestWins','bestLetters','correct','discovered','hardWins','weightedWins','cognitiveScore'])base[k]=cleanCount(p[k]);
    base.category=Object.hasOwn(CATEGORIES,p.category)?p.category:'geral';base.difficulty=LEVELS.includes(p.difficulty)?p.difficulty:'facil';
    base.isPlus=p.isPlus===true;
    base.achievements=Array.isArray(p.achievements)?p.achievements.filter(id=>ACHIEVEMENTS.some(a=>a.id===id)):[];
    base.rewards=Array.isArray(p.rewards)?p.rewards.filter(r=>r&&typeof r.id==='string'&&typeof r.label==='string'&&Number.isInteger(r.tier)&&r.tier>=0&&r.tier<=3).map(r=>({id:r.id,label:r.label.slice(0,90),tier:r.tier})):[];
    for(const level of LEVELS) if(p.stats?.[level]) base.stats[level]={wins:cleanCount(p.stats[level].wins),losses:cleanCount(p.stats[level].losses)};
    base.days={};if(p.days && typeof p.days==='object')for(const [day,n]of Object.entries(p.days))if(/^\d{4}-\d{2}-\d{2}$/.test(day))base.days[day]=cleanCount(n);
    base.pending=p.pending&&LEVELS.includes(p.pending.level)?{level:p.pending.level}:null;
    return base;
   });
   return {active:players.some(p=>p.id===data.active)?data.active:null,players};
  }catch{return {active:null,players:[]};}
 },
 save(){try{localStorage.setItem(this.key,JSON.stringify(profiles));this.failed=false;}catch{this.failed=true;}const warning=document.getElementById('storage-warning');if(warning)warning.hidden=!this.failed;}
};
let profiles=PlayerStorage.read();
let player=profiles.players.find(p=>p.id===profiles.active)||null;
let screen='welcome';
// Uma partida abandonada ao fechar a página conta como derrota, sem gerar prêmios.
for(const p of profiles.players)if(p.pending){p.stats[p.pending.level].losses++;p.played++;p.winStreak=0;p.pending=null;}
function dayKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
function weeklyActivity(p, now=new Date()) {let total=0;for(let i=0;i<7;i++){const d=new Date(now);d.setDate(d.getDate()-i);total+=p.days[dayKey(d)]||0;}return total;}
function levelOf(p){return 1+Math.floor(p.score/CONFIG.levelStep);}
function unlockRewards(p){
 const before=new Set(p.rewards.map(r=>r.id));
 CONFIG.winsRewards.forEach((n,i)=>{if(p.weightedWins>=n&&!p.rewards.some(r=>r.id===`wins-${n}`))p.rewards.push({id:`wins-${n}`,label:`${n} marcos de vitória`,tier:i});});
 CONFIG.streakRewards.forEach((n,i)=>{if(p.winStreak>=n&&!p.rewards.some(r=>r.id===`streak-${n}`))p.rewards.push({id:`streak-${n}`,label:`${n} vitórias seguidas`,tier:i+1});});
 return p.rewards.filter(r=>!before.has(r.id));
}
function progressPlayer(p,r,abandoned=false){
 const won=r.status==='won';
 const correct=[...r.guesses].filter(c=>[...r.word].some(x=>GameRules.normalizeLetter(x)===c)).length;
 const discovered=[...r.word].filter(c=>r.guesses.has(GameRules.normalizeLetter(c))).length;
 const points=abandoned?0:correct*CONFIG.letterPoints[r.level]+(won?CONFIG.points[r.level]+Math.min(p.winStreak,10)*5:0);
 const activity=abandoned?0:(r.guesses.size?2:0)+correct+(won?CONFIG.activity[r.level]:0);
 p.played++;p.wins+=Number(won);p.winStreak=won?p.winStreak+1:0;p.bestWins=Math.max(p.bestWins,p.winStreak);
 p.bestLetters=Math.max(p.bestLetters,r.bestLetters||0);p.correct+=correct;p.discovered+=discovered;
 p.hardWins+=Number(won&&r.level==='dificil');p.weightedWins+=won?{facil:1,medio:2,dificil:4}[r.level]:0;
 p.score+=points;p.cognitiveScore+=activity;p.days[dayKey()]=(p.days[dayKey()]||0)+activity;
 const achievements=ACHIEVEMENTS.filter(a=>!p.achievements.includes(a.id)&&a.check(p));p.achievements.push(...achievements.map(a=>a.id));
 const rewards=unlockRewards(p);p.pending=null;
 return {points,activity,achievements,rewards};
}

const GameRules = {
  
  normalizeLetter(input) {

    if (typeof input !== "string" || !/^[A-Za-zÀ-ÖØ-öø-ÿ]$/.test(input)) return null;

    const normalized = input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    return /^[A-Z]$/.test(normalized) ? normalized : null;
  },
  
  newRound(level, previousWord, category = "geral") {
    
    const choices = CATEGORIES[category].words[level].filter(word => word !== previousWord);

    return { level, category, letterStreak: 0, bestLetters: 0, recorded: false, word: choices[Math.floor(Math.random() * choices.length)], guesses: new Set(), errors: 0, shots: 0, fatalPosition: 2 + Math.floor(Math.random() * 5), phase: "guess", status: "playing" };
  },
  
  finish(round, status) {

    if (!round || round.status !== "playing") return false;

    round.status = status;
    return true;
  },
  
  guess(round, input) {

    const letter = this.normalizeLetter(input);

    if (!round || round.status !== "playing" || round.phase !== "guess" || !letter) return { kind: "ignored" };

    if (round.guesses.has(letter)) return { kind: "repeated" };

    round.guesses.add(letter);
    
    const correct = [...round.word].some(character => this.normalizeLetter(character) === letter);

    if (!correct) { round.errors++; round.letterStreak = 0; round.phase = "awaiting-trigger"; }
    else { round.letterStreak++; round.bestLetters = Math.max(round.bestLetters, round.letterStreak); }

    // A derrota só é decidida ao acionar a câmara pendente.
    if (correct && [...round.word].every(character => round.guesses.has(this.normalizeLetter(character)))) this.finish(round, "won");

    return { kind: correct ? "correct" : "wrong", letter, finished: round.status !== "playing" };
  }
};

const ui = {

  difficulty: document.getElementById("difficulty"), wins: document.getElementById("wins"), losses: document.getElementById("losses"),

  resetScore: document.getElementById("reset-score"), word: document.getElementById("word"), feedback: document.getElementById("feedback"),

  attempted: document.getElementById("attempted"), keyboard: document.getElementById("keyboard"), errors: document.getElementById("error-count"),

  remaining: document.getElementById("remaining"), remainingPill: document.getElementById("remaining-pill"),

  drawingDescription: document.getElementById("drawing-description"), newGame: document.getElementById("new-game"),

  result: document.getElementById("result"), resultIcon: document.getElementById("result-icon"),

  resultKicker: document.getElementById("result-kicker"), resultTitle: document.getElementById("result-title"),

  resultDetail: document.getElementById("result-detail"), resultRestart: document.getElementById("result-restart")
};

let score = ScoreStorage.readScore();

let selectedLevel = ScoreStorage.readLevel();

let round = null;

let previousWord = null;

function renderScore() {

  const current = score[selectedLevel];

  ui.wins.textContent = String(current.wins).padStart(2, "0");
  ui.losses.textContent = String(current.losses).padStart(2, "0");
}

function showFeedback(message, type = "") {

  ui.feedback.textContent = message;
  ui.feedback.className = `feedback ${type}`.trim();
}

function renderWord() {

  if (!round) return;

  const finished = round.status !== "playing";

  ui.word.replaceChildren();

  for (const character of round.word) {

    const discovered = round.guesses.has(GameRules.normalizeLetter(character));

    const slot = document.createElement("span");

    slot.className = `letter-slot${discovered ? " revealed" : ""}${finished && !discovered ? " final-reveal" : ""}`;

    slot.textContent = discovered || finished ? character : "_";
    ui.word.append(slot);
  }

  ui.word.setAttribute("aria-label", finished ? `Palavra: ${round.word}` :
    
    `Palavra de ${round.word.length} letras: ${[...round.word].map(char => round.guesses.has(GameRules.normalizeLetter(char)) ? char : "não revelada").join(", ")}`);
}

function renderKeyboard() {

  for (const key of ui.keyboard.querySelectorAll("button")) {

    const guessed = round?.guesses.has(key.dataset.letter);
    
    const correct = guessed && [...round.word].some(char => GameRules.normalizeLetter(char) === key.dataset.letter);

    key.disabled = !round || round.status !== "playing" || round.phase !== "guess" || guessed;

    key.className = `key${guessed ? correct ? " correct" : " incorrect" : ""}`;

    key.textContent = guessed ? `${key.dataset.letter} ${correct ? "✓" : "×"}` : key.dataset.letter;

    key.setAttribute("aria-label", `Letra ${key.dataset.letter}${guessed ? correct ? ", acerto" : ", erro" : ""}`);
  }
}

function renderRound() {

  renderWord();

  ui.errors.textContent = `Erros: ${round.errors}/${MAX_ERRORS}`;
  renderRoulette();
  ui.attempted.replaceChildren();

  if (round.guesses.size === 0) {

    const empty = document.createElement("span");
    empty.className = "empty-attempts";
    empty.textContent = "Nenhuma letra ainda";
    ui.attempted.append(empty);
  } else {

    for (const letter of round.guesses) {
      
      const correct = [...round.word].some(char => GameRules.normalizeLetter(char) === letter);

      const chip = document.createElement("span");
      chip.className = `attempt-chip ${correct ? "correct" : "incorrect"}`;

      chip.textContent = `${letter} ${correct ? "✓" : "×"}`;

      chip.setAttribute("aria-label", `${letter}: ${correct ? "acerto" : "erro"}`);
      ui.attempted.append(chip);
    }
  }

  renderKeyboard();
  renderGameProgress();
}

// Uma rodada só pode creditar o perfil uma vez, mesmo com cliques repetidos.
function recordResult() {
  if (!player || round.recorded || round.status === "playing") return;
  round.recorded = true;
  const field = round.status === "won" ? "wins" : "losses";
  score[round.level][field]++;
  round.summary = progressPlayer(player, round, round.abandoned);
  player.stats = score;
  PlayerStorage.save();
  renderScore();
}

function showResult() {

  const won = round.status === "won";

  ui.result.hidden = false;

  ui.result.classList.toggle("lost", !won);
  ui.resultIcon.textContent = won ? "✓" : "×";
  ui.resultKicker.textContent = won ? "PALAVRA DESVENDADA" : "FIM DE JOGO";
  ui.resultTitle.textContent = won ? "Você escapou!" : "A sorte acabou.";

  ui.resultDetail.replaceChildren("A palavra era ", Object.assign(document.createElement("strong"), { textContent: round.word }), `. ${won ? "Você venceu o tambor." : "Respire e tente outra vez."}`);
  const summary = round.summary || { points: 0, activity: 0, achievements: [], rewards: [] };
  if (round.abandoned) ui.resultTitle.textContent = "Partida encerrada.";
  el("result-progress").textContent = `+${summary.points} pontos · +${summary.activity} de atividade cognitiva · Nível ${levelOf(player)} · 🔥 ${player.winStreak} vitórias seguidas`;
  el("result-unlocks").replaceChildren();
  if (summary.achievements.length) el("result-unlocks").append(node("p", `🏅 ${summary.achievements.length} nova(s) conquista(s): ${summary.achievements.slice(0,2).map(a=>a.name).join(", ")}${summary.achievements.length>2?"…":""}`));
  if (summary.rewards.length) el("result-unlocks").append(node("p", `🎁 ${summary.rewards.length} recompensa(s) demonstrativa(s) desbloqueada(s).`));
  if (!summary.achievements.length && !summary.rewards.length) el("result-unlocks").append(node("p", "Cada partida conta para sua jornada. Veja sua próxima meta acima."));
  el("result-tab-ad").hidden = player.isPlus;
  setResultView("summary");
  renderResultPanorama();
  showScreen("result");

}

function startRound() {
  if (!player) { showWelcome(); return; }
  clearTimeout(shotTimer);
  shotTimer = null;
  roulette.panel.classList.remove("resolving", "fatal", "escaped");

  const interruptedWord = round?.status === "playing" ? round.word : null;

  if (interruptedWord && GameRules.finish(round, "lost")) { round.abandoned = true; recordResult(); }

  if (round) previousWord = round.word;

  round = GameRules.newRound(selectedLevel, previousWord, player.category);
  player.pending = { level: selectedLevel };
  PlayerStorage.save();
  showScreen("game");

  ui.result.hidden = true;

  ui.newGame.innerHTML = 'Nova partida <span aria-hidden="true">↗</span>';

  showFeedback(interruptedWord ? `Partida anterior encerrada: a palavra era ${interruptedWord}. Nova partida iniciada!` : "Partida iniciada. Escolha uma letra!");

  renderRound();
}

function handleGuess(input) {
  if (screen !== "game") return;

  const result = GameRules.guess(round, input);

  if (result.kind === "ignored" || result.kind === "repeated") return;

  if (result.finished) {

    recordResult();

    showResult();

    showFeedback(round.status === "won" ? `Você escapou! A palavra era ${round.word}.` : `A sorte acabou. A palavra era ${round.word}.`, round.status === "won" ? "success" : "error");
  } else {

    showFeedback(result.kind === "correct" ? `Boa! A letra ${result.letter} está na palavra.` : `Não tem ${result.letter}. Puxe o gatilho para continuar.`, result.kind === "correct" ? "success" : "error");
  }

  renderRound();
  if (round.phase === "awaiting-trigger") roulette.trigger.focus({ preventScroll: true });
}

// Arrays mantêm a ordem QWERTY; ambos os teclados chamam handleGuess.
function buildKeyboard() {
  ui.keyboard.replaceChildren();
  for (const letters of ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"]) {
    const row = document.createElement("div"); row.className = "keyboard-row";
    for (const letter of letters) {
      const button = document.createElement("button");button.type = "button";button.className = "key";
      button.dataset.letter = letter;button.textContent = letter;button.setAttribute("aria-label", `Letra ${letter}`);
      button.addEventListener("click", () => handleGuess(letter));row.append(button);
    }
    ui.keyboard.append(row);
  }
  renderKeyboard();
}

const roulette = {
  panel: document.getElementById("roulette-panel"),
  rotor: document.getElementById("cylinder-rotor"),
  trigger: document.getElementById("trigger"),
  label: document.getElementById("chamber-label"),
  risk: document.getElementById("risk-label"),
  track: document.getElementById("chamber-track"),
  sound: document.getElementById("sound-toggle"),
  chambers: [...document.querySelectorAll(".chamber")]
};
let shotTimer = null;
let soundEnabled = false;
let audioContext;

// Efeitos sintetizados em volume baixo, sem downloads nem reprodução automática.
function playSound(fatal = false) {
  if (!soundEnabled) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    void audioContext.resume().catch(() => {});
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = fatal ? "sawtooth" : "triangle";
    oscillator.frequency.setValueAtTime(fatal ? 105 : 620, now);
    oscillator.frequency.exponentialRampToValueAtTime(35, now + .16);
    gain.gain.setValueAtTime(.065, now);
    gain.gain.exponentialRampToValueAtTime(.001, now + (fatal ? .45 : .09));
    oscillator.connect(gain); gain.connect(audioContext.destination);
    oscillator.start(now); oscillator.stop(now + .5);
  } catch { /* Áudio opcional: uma falha não interrompe a partida. */ }
}

function renderRoulette() {
  const active = round.status === "playing";
  const pending = active && round.phase === "awaiting-trigger";
  const resolving = active && round.phase === "resolving";
  const next = round.shots + 1;
  const risk = next === 1 ? 0 : 1 / (7 - next);
  roulette.trigger.disabled = !pending;
  roulette.trigger.textContent = resolving ? "Girando…" : "Puxar o gatilho";
  roulette.panel.classList.toggle("resolving", resolving);
  roulette.panel.classList.toggle("fatal", round.status === "lost");
  roulette.panel.classList.toggle("escaped", round.status === "won");
  roulette.rotor.style.transform = `rotate(${-60 * Math.max(0, round.shots - (resolving ? 0 : 1))}deg)`;
  roulette.label.textContent = !active ? (round.status === "won" ? "VOCÊ ESCAPOU" : "CÂMARA CARREGADA") : resolving ? "PRENDA A RESPIRAÇÃO" : `CÂMARA ${next} / 6`;
  roulette.risk.textContent = !active ? `${round.shots} ${round.shots === 1 ? "câmara acionada" : "câmaras acionadas"}.` : next === 1 ? "Primeiro erro seguro · risco de 0%." : `Próximo erro: ${Math.round(risk * 100)}% de risco.`;
  ui.remaining.textContent = !active ? (round.status === "won" ? "Você escapou" : "Fim de jogo") : next === 1 ? "1º erro seguro" : `Risco: ${Math.round(risk * 100)}%`;
  ui.remainingPill.classList.toggle("danger", active && risk >= .5);
  roulette.track.replaceChildren();
  roulette.chambers.forEach((chamber, index) => {
    const used = index < round.shots;
    const fatal = used && round.status === "lost" && index === round.shots - 1;
    chamber.classList.toggle("used", used);
    chamber.classList.toggle("loaded", fatal);
    const item = document.createElement("span");
    item.className = `track-dot${used ? " used" : ""}${fatal ? " loaded" : ""}`;
    item.textContent = fatal ? "×" : used ? "✓" : String(index + 1);
    item.setAttribute("aria-label", `Câmara ${index + 1}: ${fatal ? "carregada" : used ? "vazia" : "não acionada"}`);
    roulette.track.append(item);
  });
  ui.drawingDescription.textContent = `${roulette.label.textContent}. ${roulette.risk.textContent}`;
}

function pullTrigger() {
  if (!round || round.status !== "playing" || round.phase !== "awaiting-trigger") return;
  const current = round;
  current.phase = "resolving";
  playSound();
  showFeedback("O mecanismo avança. Um instante de silêncio…");
  renderRound();
  shotTimer = setTimeout(() => {
    shotTimer = null;
    if (round !== current || current.status !== "playing") return;
    current.shots++;
    const fatal = current.shots === current.fatalPosition;
    playSound(fatal);
    if (fatal) {
      GameRules.finish(current, "lost");
      recordResult();
      showResult();
      showFeedback(`Câmara carregada. A palavra era ${current.word}.`, "error");
    } else {
      current.phase = "guess";
      showFeedback("Clique. Câmara vazia. Escolha sua próxima letra.", "success");
    }
    renderRound();
    (fatal ? ui.resultRestart : ui.keyboard.querySelector("button:not(:disabled)"))?.focus({ preventScroll: true });
  }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 250 : 1250);
}
roulette.trigger.addEventListener("click", pullTrigger);
roulette.sound.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  roulette.sound.textContent = `Som: ${soundEnabled ? "ligado" : "desligado"}`;
  roulette.sound.setAttribute("aria-pressed", String(soundEnabled));
  if (soundEnabled) playSound();
});

ui.difficulty.value = selectedLevel;

renderScore();

buildKeyboard();

ui.newGame.addEventListener("click", startRound);

ui.resultRestart.addEventListener("click", startRound);

ui.difficulty.addEventListener("change", () => {

  const wasPlaying = round?.status === "playing";

  selectedLevel = ui.difficulty.value;

  if (player) { player.difficulty = selectedLevel; PlayerStorage.save(); }

  renderScore();

  if (wasPlaying || round) startRound();

  else showFeedback("Nível escolhido. Comece a jogar!");
});

ui.resetScore.addEventListener("click", () => {

  if (!window.confirm("Zerar vitórias e derrotas do placar deste perfil? Pontos e conquistas serão preservados.")) return;

  score = ScoreStorage.emptyScore();

  if (player) { player.stats = score; PlayerStorage.save(); }

  renderScore();

  showFeedback("Placar zerado. A partida atual continua normalmente.");
});

document.addEventListener("keydown", event => {

  if (event.ctrlKey || event.altKey || event.metaKey || event.repeat || event.target instanceof HTMLSelectElement || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target.isContentEditable) return;

  const letter = GameRules.normalizeLetter(event.key);

  if (letter) handleGuess(letter);
});

/* INTERFACE DA JORNADA: textContent insere nomes como texto, nunca como HTML.
   As funções leem o estado e atualizam o DOM, sem inventar pontuações. */
const el=id=>document.getElementById(id);
function node(tag,text,className=''){const n=document.createElement(tag);n.textContent=text;n.className=className;return n;}
function displayName(p){return p.alias||p.name;}
function showScreen(next){
 screen=next;
 for(const section of document.querySelectorAll('[data-screen]'))section.hidden=section.dataset.screen!==next;
 document.body.classList.toggle('is-playing',next==='game');
 document.body.classList.toggle('is-result',next==='result');
 document.body.classList.toggle('is-menu',next==='menu');
 applyViewportLock();
 el('header-player').textContent=player?`${displayName(player)} · NÍVEL ${levelOf(player)}`:'PALAVRAS / PROGRESSO';
 window.scrollTo?.(0,0);
 const title=el(next)?.querySelector('h1, h2');if(title){title.setAttribute('tabindex','-1');title.focus({preventScroll:true});}
}
function showWelcome(choose=false){
 showScreen('welcome');el('welcome-return').hidden=!player||choose;el('identify-form').hidden=!!player&&!choose;
 el('welcome-name').textContent=player?`Olá, ${displayName(player)}!`:'';
 el('saved-profiles').replaceChildren();
 if(choose||!player)for(const p of profiles.players){const b=node('button',`Continuar como ${displayName(p)}`,'secondary');b.type='button';b.addEventListener('click',()=>selectPlayer(p));el('saved-profiles').append(b);}
}
function selectPlayer(p){
 achievementPage=0;rewardPage=0;
 player=p;profiles.active=p.id;score=p.stats;selectedLevel=p.difficulty;round=null;previousWord=null;
 ui.difficulty.value=selectedLevel;el('menu-difficulty').value=selectedLevel;PlayerStorage.save();openMenu();
}
function openMenu(){renderMenu();setMenuView('play');showScreen('menu');}
// O mesmo cálculo alimenta menu e resultado. Nenhuma recompensa é concedida
// pela interface: ela apenas descreve os próximos marcos da configuração.
function rewardOutlook(p) {
 const target=CONFIG.winsRewards.find(n=>n>p.weightedWins);
 const streak=CONFIG.streakRewards.find(n=>!p.rewards.some(r=>r.id===`streak-${n}`));
 return {
  target:target||null, remaining:target?target-p.weightedWins:0,
  value:target?Math.min(p.weightedWins,target):1, max:target||1,
  streak:streak||null, streakRemaining:streak?Math.max(0,streak-p.winStreak):0
 };
}
function renderRewardGoal(prefix) {
 const next=rewardOutlook(player);
 el(`${prefix}reward-label`).textContent=next.target
  ? `Próxima recompensa: ${player.weightedWins}/${next.target} marcos · faltam ${next.remaining}.`
  : 'Todos os marcos de vitória foram conquistados. Continue no seu ritmo.';
 el(`${prefix}reward-bar`).max=next.max;el(`${prefix}reward-bar`).value=next.value;
 el(`${prefix}streak-label`).textContent=next.streak
  ? `Bônus por sequência: ${player.winStreak}/${next.streak} vitórias seguidas · faltam ${next.streakRemaining}.`
  : 'Todos os bônus por sequência foram conquistados.';
}
function renderResultPanorama() {
 const ranking=DemoData.ranking(player.score,displayName(player));
 const position=ranking.findIndex(r=>r.current)+1;
 el('result-panorama').replaceChildren();
 for(const [label,value]of [['Pontos totais',player.score],['Vitórias seguidas',player.winStreak],['Atividade / 7 dias',weeklyActivity(player)],['Ranking demo',`#${position}`]]){
  const card=node('div','','stat-tile');card.append(node('span',label),node('strong',String(value)));el('result-panorama').append(card);
 }
 const online=DemoData.presence(round.category);
 el('result-presence').textContent=`Presença simulada: ${online.total} no total · ${online.category} em ${CATEGORIES[round.category].name}.`;
 renderRewardGoal('result-next-');
}
// Paginação mantém todas as conquistas acessíveis sem esticar o painel.
const LIST_PAGE_SIZE=2;
let achievementPage=0;
let rewardPage=0;
function updatePager(prefix,page,total) {
 const count=Math.max(1,Math.ceil(total/LIST_PAGE_SIZE));
 el(`${prefix}-page`).textContent=`${page+1} / ${count}`;
 el(`${prefix}-prev`).disabled=page===0;el(`${prefix}-next`).disabled=page>=count-1;
}
function setSupportView(view) {
 el('support-panel').hidden=view!=='support';el('plus-panel').hidden=view!=='plus';
 el('support-tab-support').setAttribute('aria-pressed',String(view==='support'));
 el('support-tab-plus').setAttribute('aria-pressed',String(view==='plus'));
}
function renderMenu(){
 if(!player)return;
 el("menu-art-level").textContent=String(levelOf(player)).padStart(2,"0");el("menu-art-score").textContent=String(player.score);
 el('menu-greeting').textContent=`Olá, ${displayName(player)}. Você não está apenas jogando. Está construindo uma sequência.`;
 el('panorama').replaceChildren();
 for(const [label,value]of [['🔥 Vitórias seguidas',player.winStreak],['✦ Pontos',player.score],['🌱 Nível',levelOf(player)],['⌁ Melhor série de letras',player.bestLetters]]){const card=node('div','','stat-tile');card.append(node('span',label),node('strong',String(value)));el('panorama').append(card);}
 el('categories').replaceChildren();
 for(const [id,cat]of Object.entries(CATEGORIES)){
  const b=node('button','','category-card');b.type='button';b.setAttribute('aria-pressed',String(player.category===id));
  b.setAttribute('aria-label',`${cat.name}: ${cat.description}`);
  b.append(node('span',cat.icon,'category-icon'),node('strong',(player.category===id?'✓ ':'')+cat.name));
  b.addEventListener('click',()=>{player.category=id;PlayerStorage.save();renderMenu();el('categories').querySelectorAll('button')[Object.keys(CATEGORIES).indexOf(id)].focus({preventScroll:true});});el('categories').append(b);
 }
 el('menu-difficulty').value=player.difficulty;
 el('selected-challenge').textContent=`Selecionado: ${CATEGORIES[player.category].name} · ${ {facil:'Fácil',medio:'Médio',dificil:'Difícil'}[player.difficulty]} · ${CATEGORIES[player.category].words[player.difficulty].length} palavras neste nível`;
 el('difficulty-reward').textContent=`Vitória: +${CONFIG.points[player.difficulty]} pontos base · ${ {facil:1,medio:2,dificil:4}[player.difficulty]} marco(s). Acertos e sequência dão bônus.`;
 const stages=[['🌱','Semente',1],['🌿','Broto',3],['🌳','Árvore',5],['✨','Florescer',8],['🏆','Domínio',12]];
 el('journey-stages').replaceChildren();for(const [icon,name,level]of stages){const n=node('div',`${icon}\n${name}\nNível ${level}`,levelOf(player)>=level?'stage reached':'stage');el('journey-stages').append(n);}
 el('level-detail').textContent=`Nível ${levelOf(player)} · ${player.score%CONFIG.levelStep}/${CONFIG.levelStep} pontos até o próximo · ${player.played} partidas / ${player.wins} vitórias`;
 el('level-progress').value=player.score%CONFIG.levelStep;
 const week=weeklyActivity(player);const percentage=Math.min(100,Math.round(week/2));el('cognitive-progress').value=percentage;
 el('cognitive-detail').textContent=`${percentage}% da meta lúdica · +${week} pontos nos últimos 7 dias · ${player.cognitiveScore} no total`;
 const online=DemoData.presence(player.category);const ranking=DemoData.ranking(player.score,displayName(player));
 el('presence').textContent=`Demo: ${online.total} jogando · ${online.category} em ${CATEGORIES[player.category].name} · sua posição #${ranking.findIndex(r=>r.current)+1}`;
 el('ranking').replaceChildren();ranking.forEach((r,i)=>{const n=node('li','','ranking-row');if(r.current)n.classList.add('current');n.append(node('span',String(i+1).padStart(2,'0')),node('strong',r.name+(r.current?' (você)':'')),node('span',String(r.points)));el('ranking').append(n);});
 achievementPage=Math.min(achievementPage,Math.max(0,Math.ceil(ACHIEVEMENTS.length/LIST_PAGE_SIZE)-1));
 el('achievements').replaceChildren();for(const a of ACHIEVEMENTS.slice(achievementPage*LIST_PAGE_SIZE,(achievementPage+1)*LIST_PAGE_SIZE)){const earned=player.achievements.includes(a.id);const n=node('article','',earned?'badge earned':'badge');n.append(node('strong',`${earned?'🏅':'○'} ${a.name}`),node('p',a.goal),node('small',earned?'Conquistada':'Em progresso'));el('achievements').append(n);}
 el('reward-progress').textContent=`${player.weightedWins} marcos de vitória · melhor sequência: ${player.bestWins} · ${player.rewards.length} recompensas desbloqueadas`;
 renderRewardGoal('next-');
 el('rewards').replaceChildren();el('reward-detail').textContent='';
 if(!player.rewards.length)el('rewards').append(node('p','Suas recompensas vão aparecer aqui. Primeiro marco: 5.'));
 rewardPage=Math.min(rewardPage,Math.max(0,Math.ceil(player.rewards.length/LIST_PAGE_SIZE)-1));
 for(const r of player.rewards.slice(rewardPage*LIST_PAGE_SIZE,(rewardPage+1)*LIST_PAGE_SIZE)){const n=node('article','','badge earned');n.append(node('strong',`🎁 ${DemoData.benefit(r.tier)}`),node('p',r.label));const b=node('button','Ver recompensa','secondary');b.type='button';b.addEventListener('click',()=>{el('reward-detail').textContent=`${DemoData.benefit(r.tier)} — recompensa demonstrativa. Nenhum cupom, parceiro ou desconto real está disponível.`;});n.append(b);el('rewards').append(n);}
 updatePager('achievements',achievementPage,ACHIEVEMENTS.length);
 updatePager('rewards',rewardPage,player.rewards.length);
 el('plus-toggle').setAttribute('aria-pressed',String(player.isPlus));el('plus-toggle').textContent=player.isPlus?'Desativar Plus demonstrativo':'Experimentar Plus demonstrativo';
 el('plus-detail').textContent=player.isPlus?'Demonstração ativa: o espaço publicitário pós-partida fica oculto. Sem cobrança.':'Prévia gratuita: oculta o anúncio demonstrativo. Demais benefícios são conceitos futuros; não há assinatura ou pagamento.';
 renderScore();
}
function renderGameProgress(){
 const discovered=[...round.word].filter(c=>round.guesses.has(GameRules.normalizeLetter(c))).length;
 const pct=Math.round(discovered/round.word.length*100);el('word-progress').value=pct;el('word-percent').textContent=`${pct}%`;
 el('letter-streak').textContent=`🔥 ${round.letterStreak} letras certas seguidas`;
 el('game-category').textContent=`${CATEGORIES[round.category].name} / ${ {facil:'Fácil',medio:'Médio',dificil:'Difícil'}[round.level]}`;
 el('game-player').textContent=displayName(player);el('game-stats').textContent=`Nível ${levelOf(player)} · ${player.score} pts · 🔥 ${player.winStreak} vitórias`;
}
function leaveGame(){
 if(!round||round.status!=='playing')return;
 if(!window.confirm('Encerrar esta partida? Conta como derrota e zera a sequência de vitórias.'))return;
 clearTimeout(shotTimer);shotTimer=null;round.abandoned=true;GameRules.finish(round,'lost');recordResult();showResult();
}
// Os eventos de formulário cuidam da identificação; o jogo mantém uma única entrada de letras.
el('identify-form').addEventListener('submit',event=>{
 event.preventDefault();const name=el('player-name').value.trim();const alias=el('player-alias').value.trim();
 if(!name){el('identify-error').textContent='Digite seu nome para continuar.';el('player-name').focus();return;}
 const p=newPlayer(name.slice(0,40),alias.slice(0,24));
 // O primeiro perfil herda o placar anterior, sem apagar nem converter vitórias em prêmios.
 if(!profiles.players.length)p.stats=ScoreStorage.readScore();
 profiles.players.push(p);el('identify-form').reset();selectPlayer(p);
});
el('continue-player').addEventListener('click',()=>{if(player)selectPlayer(player);});
el('switch-player').addEventListener('click',()=>showWelcome(true));el('menu-switch').addEventListener('click',()=>showWelcome(true));
el('menu-difficulty').addEventListener('change',()=>{player.difficulty=el('menu-difficulty').value;selectedLevel=player.difficulty;ui.difficulty.value=selectedLevel;PlayerStorage.save();renderMenu();});
el('play').addEventListener('click',startRound);el('leave-game').addEventListener('click',leaveGame);
el('result-menu').addEventListener('click',openMenu);
el('support-toggle').addEventListener('click',()=>{
 const details=el('support-details');details.hidden=!details.hidden;
 el('support-toggle').setAttribute('aria-expanded',String(!details.hidden));
 el('support-toggle').textContent=details.hidden?'Ver área de apoio / QR Code':'Recolher área de apoio';
});
el('plus-toggle').addEventListener('click',()=>{player.isPlus=!player.isPlus;PlayerStorage.save();renderMenu();});
// Evita que o link de marca abandone uma partida silenciosamente.
document.querySelector('.brand').addEventListener('click',event=>{event.preventDefault();if(screen==='game')leaveGame();else if(player)openMenu();else showWelcome();});
// Abas revelam uma área por vez. O conteúdo continua no DOM e as funções
// de progresso continuam atualizando todos os painéis, mesmo quando ocultos.
let menuView='play';
function applyViewportLock() {
 document.documentElement.classList.toggle('viewport-locked',screen==='game'||screen==='result'||screen==='menu');
}
function setMenuView(view) {
 const art={
  play:['Uma letra. Muitas possibilidades.','Escolha um tema e descubra até onde seu vocabulário pode levar você.'],
  progress:['Sua evolução toma forma.','Cada palavra descoberta deixa uma nova marca na sua jornada.'],
  achievements:['Pequenas vitórias. Grandes marcas.','Explore as conquistas que contam a sua história com as palavras.'],
  ranking:['Seu lugar entre as palavras.','Compare seu progresso no placar demonstrativo e jogue no seu ritmo.'],
  rewards:['Seu próximo marco começa aqui.','Conheça as metas da jornada e os benefícios demonstrativos desbloqueados.'],
  support:['Uma ideia feita para continuar.','Explore o apoio ao projeto e a prévia da experiência Plus.']
 };
 const copy=art[view]||art.play;el('menu-art-title').textContent=copy[0];el('menu-art-copy').textContent=copy[1];
 menuView=view;if(view==='support')setSupportView('support');document.body.classList.toggle('menu-play',view==='play');applyViewportLock();
 for (const section of document.querySelectorAll('[data-menu-view]')) section.hidden=section.dataset.menuView!==view;
 for (const button of document.querySelectorAll('[data-menu-target]')) button.setAttribute('aria-pressed',String(button.dataset.menuTarget===view));
}
function setResultView(view) {
 if (view==='ad' && player?.isPlus) view='summary';
 el('result-summary').hidden=view!=='summary';el('result-benefits').hidden=view!=='benefits';el('mock-ad').hidden=view!=='ad';
 for (const name of ['summary','benefits','ad']) el(`result-tab-${name}`).setAttribute('aria-pressed',String(name===view));
}
const TUTORIAL = [
 {icon:'01',title:'Escolha seu desafio.',copy:'Comece por um tema que você gosta. Escolha Fácil, Médio ou Difícil e clique em Começar desafio.',note:'Médio e Difícil dão mais pontos e aceleram as recompensas.'},
 {icon:'02',title:'Uma letra por vez.',copy:'Use seu teclado ou clique nas letras. Um acerto revela todas as ocorrências na palavra. Amarelo e ✓ indicam acerto; vermelho e × indicam erro.',note:'Letras repetidas não penalizam. A barra mostra quanto da palavra você descobriu.'},
 {icon:'03',title:'Errou? Enfrente o tambor.',copy:'Depois de uma letra errada, clique em Puxar o gatilho. A primeira câmara é segura. Se a próxima estiver vazia, você continua; se estiver carregada, a partida termina.',note:'Uma das câmaras de 2 a 6 é sorteada como fatal no início. Complete a palavra para escapar.'},
 {icon:'04',title:'Construa sua jornada.',copy:'Ao terminar, veja seus pontos e a sequência de vitórias. No menu, abra Minha jornada, Conquistas ou Recompensas quando quiser explorar seu progresso.',note:'Perfis ficam neste navegador. Ranking, descontos, anúncio e Plus são demonstrativos. Atividade cognitiva é um indicador lúdico.'}
];
let tutorialStep=0;
function renderTutorial() {
 const step=TUTORIAL[tutorialStep];el('tutorial-count').textContent=`PASSO ${tutorialStep+1} / ${TUTORIAL.length}`;
 el('tutorial-icon').textContent=step.icon;el('tutorial-title').textContent=step.title;el('tutorial-copy').textContent=step.copy;el('tutorial-note').textContent=step.note;
 el('tutorial-back').disabled=tutorialStep===0;el('tutorial-next').textContent=tutorialStep===TUTORIAL.length-1?'Começar minha jornada ↗':'Próximo ↗';
}
for(const button of document.querySelectorAll('[data-menu-target]'))button.addEventListener('click',()=>setMenuView(button.dataset.menuTarget));
for(const view of ['summary','benefits','ad'])el(`result-tab-${view}`).addEventListener('click',()=>setResultView(view));
el('open-tutorial').addEventListener('click',()=>{tutorialStep=0;renderTutorial();showScreen('tutorial');});
el('tutorial-back').addEventListener('click',()=>{tutorialStep=Math.max(0,tutorialStep-1);renderTutorial();});
el('tutorial-next').addEventListener('click',()=>{if(tutorialStep===TUTORIAL.length-1)openMenu();else{tutorialStep++;renderTutorial();el('tutorial-title').focus({preventScroll:true});}});
el('tutorial-close').addEventListener('click',openMenu);
el('achievements-prev').addEventListener('click',()=>{achievementPage=Math.max(0,achievementPage-1);renderMenu();});
el('achievements-next').addEventListener('click',()=>{achievementPage=Math.min(Math.ceil(ACHIEVEMENTS.length/LIST_PAGE_SIZE)-1,achievementPage+1);renderMenu();});
el('rewards-prev').addEventListener('click',()=>{rewardPage=Math.max(0,rewardPage-1);renderMenu();});
el('rewards-next').addEventListener('click',()=>{rewardPage=Math.max(0,Math.min(Math.ceil(player.rewards.length/LIST_PAGE_SIZE)-1,rewardPage+1));renderMenu();});
el('support-tab-support').addEventListener('click',()=>setSupportView('support'));
el('support-tab-plus').addEventListener('click',()=>setSupportView('plus'));
PlayerStorage.save();showWelcome();
