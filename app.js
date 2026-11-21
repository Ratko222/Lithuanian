async function startApp(CATS, GRAMMAR, FORMS){
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const memoryStore = {};
  const store = {
    get(k){ try{ return localStorage.getItem(k); }catch(e){ return k in memoryStore ? memoryStore[k] : null; } },
    set(k,v){ try{ localStorage.setItem(k,v); }catch(e){ memoryStore[k]=v; } },
    del(k){ try{ localStorage.removeItem(k); }catch(e){ delete memoryStore[k]; } }
  };
  const shuffle = a => { a = a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
  const yesterday = () => { const d = new Date(Date.now() - 864e5); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };

  const WORDS = [], SENTS = [], FULL = [], GR = [];
  const categoryById = Object.fromEntries(CATS.map(c => [c.id, c]));
  const aliasOf = {};
  CATS.forEach(c => {
    c.words.forEach((w,i) => { if(w[3]){ if(w[4]) aliasOf[c.id+':'+i] = w[4]; return; } WORDS.push({key:c.id+':'+i, cat:c.id, catName:c.name, lt:w[0], pr:w[1], en:w[2], rt:w[5]||''}); });
    c.sents.forEach((s,i) => { if(s.x) return; SENTS.push({key:c.id+':'+i, cat:c.id, catName:c.name, t:s.t, a:s.a, n:s.n||'', p:s.p||[c.id], m:s.m||'', o:s.o||null}); });
    (c.full||[]).forEach((f,i) => FULL.push({key:c.id+':'+i, cat:c.id, catName:c.name, lt:f.lt, en:f.en, toks:[], alt:f.alt || [], gloss:f.gloss || {}}));
  });
  GRAMMAR.forEach(g => g.items.forEach((it,i) => GR.push({key:g.id+':'+i, cat:g.id, catName:g.name, intro:g.intro, q:it.q, en:it.en, opts:it.opts, a:it.a, why:it.why})));
  const wordsByKey = Object.fromEntries(WORDS.map(w => [w.key, w]));
  const sentencesByKey = Object.fromEntries(SENTS.map(s => [s.key, s]));
  const fullByKey = Object.fromEntries(FULL.map(s => [s.key, s]));
  const grammarByKey = Object.fromEntries(GR.map(s => [s.key, s]));
  const cleanToken = t => t.replace(/^[„"“(]+/, '').replace(/[.,!?;:…"”)]+$/, '');
  const LTMAP = new Map();
  WORDS.forEach(w => { const k = w.lt.toLowerCase(); if(!/\s/.test(k) && !LTMAP.has(k)) LTMAP.set(k, w.en); });
  FULL.forEach(f => {
    const parts = categoryById[f.cat].full[+f.key.split(':')[1]].lt.split(/\s+/).filter(Boolean).map(cleanToken).filter(Boolean);
    const first = parts[0];
    if(first) parts[0] = first.toLowerCase();
    f.toks = parts;
  });
  function findWord(lt, cat){
    const c = categoryById[cat], hit = c && c.words.find(w => w[0] === lt);
    if(hit) return {lt:hit[0], pr:hit[1], en:hit[2]};
    return WORDS.find(w => w.lt === lt) || {lt, pr:'', en:''};
  }
  function rootLine(w){ return w.rt ? `<div class="root"><b>Root</b> ${esc(w.rt)}</div>` : ''; }
  function breakdown(lt){
    const parts = lt.replace(/[?.!,…]/g,' ').split(/\s+/).filter(Boolean);
    if(parts.length < 2) return '';
    const rows = [];
    for(const p of parts){ const en = LTMAP.get(p.toLowerCase()); if(!en) return ''; rows.push([p,en]); }
    return '<div class="bd">' + rows.map(r => `<div><span class="serif">${esc(r[0])}</span><span>${esc(r[1])}</span></div>`).join('') + '</div>';
  }
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();
  const strict = s => s.toLowerCase().replace(/[.?!…]+$/,'').replace(/\s+/g,' ').trim();

  const hasTTS = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  let ltVoice = null, voiceWarned = false, onVoicesReady = null;
  function pickVoice(){ if(!hasTTS) return; try{ ltVoice = speechSynthesis.getVoices().find(v => /^lt/i.test(v.lang)) || null; }catch(e){}
    if(onVoicesReady) onVoicesReady();
  }
  if(hasTTS){ pickVoice(); try{ speechSynthesis.addEventListener('voiceschanged', pickVoice); }catch(e){} }
  function speak(t){
    if(!hasTTS || !t) return;
    try{
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t); u.lang = 'lt-LT'; u.rate = .85;
      if(ltVoice) u.voice = ltVoice;
      speechSynthesis.speak(u);
      if(!ltVoice && !voiceWarned){ voiceWarned = true; const v = $('#voicenote'); if(v) v.textContent = 'No Lithuanian voice was found on this device, so audio may not sound right.'; }
    }catch(e){}
  }
  const EXAM = initExam({user: () => user, words: WORDS, esc, speak, hasTTS, pictures: ['iylt', 'natscene'].map(id => { const c = CATS.find(x => x.id === id); return c && c.image ? {id, title: id === 'iylt' ? 'Family at home' : 'Nature scene', img: c.image, sentences: (c.full || []).map(f => ({lt: f.lt, en: f.en}))} : null; }).filter(Boolean)});
  const SPK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54z"/></svg>';
  const spk = (t, lg) => hasTTS ? `<button type="button" class="spk ${lg?'lg':''}" data-act="speak" data-t="${esc(t)}" aria-label="Play audio">${SPK_ICON}</button>` : '';

  let prefs = {auto:false, theme:'auto'};
  try{ prefs = Object.assign(prefs, JSON.parse(store.get('lt_prefs') || '{}')); }catch(e){}
  const savePrefs = () => store.set('lt_prefs', JSON.stringify(prefs));
  const applyTheme = () => { if(prefs.theme === 'light' || prefs.theme === 'dark') document.documentElement.dataset.theme = prefs.theme; else delete document.documentElement.dataset.theme; };
  applyTheme();
  let weekOpen = false;
  function weekPanel(){
    const days = [];
    for(let i = 6; i >= 0; i--){ const d = new Date(); d.setDate(d.getDate() - i); const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); days.push({k, n: progress.hist[k] || 0, label: d.toLocaleDateString('en', {weekday:'short'})}); }
    const total = days.reduce((a, d) => a + d.n, 0), active = days.filter(d => d.n).length, max = Math.max(progress.goal, ...days.map(d => d.n));
    const known = Object.values(progress.flash).filter(x => x.mastered).length;
    return `<div class="weekpanel"><div class="weekbars">${days.map(d => `<div class="wk"><i style="height:${Math.round(d.n / max * 100)}%" class="${d.n >= progress.goal ? 'met' : ''}"></i><span>${d.label}</span><b>${d.n}</b></div>`).join('')}</div>
      <div class="sub2">Last 7 days: <b>${total}</b> answers on <b>${active}</b> of 7 days. Streak: <b>${progress.streak.n}</b>. Words known: <b>${known}</b>. Due for review: <b>${dueKeys().length}</b>.</div></div>`;
  }

  let user = null, authMode = 'login', pendingExam = null;
  const blank = () => ({flash:{}, sent:{}, full:{}, listen:{}, gram:{}, match:{}, scramble:{}, kseen:{}, miss:{}, srs:{}, hist:{}, daily:{date:'', count:0}, streak:{n:0, last:''}, goal:20, updatedAt:0});
  let progress = blank();
  const progKey = () => 'lt_prog_' + (user || 'guest');
  const isDateString = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const boundedInt = (v, lo, hi, fallback) => (typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi) ? v : fallback;
  const plainObject = v => (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
  const KEY_PATTERN = /^[a-z][a-z0-9-]*:\d{1,5}$/;
  const SCOPE_PATTERN = /^(all|g:[a-z]+|[a-z][a-z0-9-]*)$/;
  function sanitizeProgress(raw){
    const src = plainObject(raw), out = blank();
    out.goal = boundedInt(src.goal, 1, 1000, 20);
    const day = plainObject(src.daily);
    out.daily = {date: isDateString(day.date) ? day.date : '', count: boundedInt(day.count, 0, 100000, 0)};
    const streak = plainObject(src.streak);
    out.streak = {n: boundedInt(streak.n, 0, 100000, 0), last: isDateString(streak.last) ? streak.last : ''};
    out.updatedAt = (typeof src.updatedAt === 'number' && Number.isFinite(src.updatedAt)) ? src.updatedAt : 0;
    for(const [k, v] of Object.entries(plainObject(src.flash))){
      if(!KEY_PATTERN.test(k)) continue;
      const e = plainObject(v);
      out.flash[k] = {phase: e.phase === 'type' ? 'type' : 'recognize', knowCount: boundedInt(e.knowCount, 0, 8, 0), typeCount: boundedInt(e.typeCount, 0, 8, 0), mastered: e.mastered === true};
    }
    for(const m of ['sent', 'full', 'listen', 'gram']){
      for(const [k, v] of Object.entries(plainObject(src[m]))) if(KEY_PATTERN.test(k)) out[m][k] = boundedInt(v, 0, 3, 0);
    }
    for(const [k, v] of Object.entries(plainObject(src.miss))) if(KEY_PATTERN.test(k)){ const n = boundedInt(v, 0, 1000, 0); if(n) out.miss[k] = n; }
    for(const [k, v] of Object.entries(plainObject(src.kseen))) if(KEY_PATTERN.test(k) && typeof v === 'number' && Number.isFinite(v)) out.kseen[k] = v;
    for(const [k, v] of Object.entries(plainObject(src.srs))){
      if(!KEY_PATTERN.test(k)) continue;
      const e = plainObject(v);
      if(typeof e.due === 'number' && Number.isFinite(e.due)) out.srs[k] = {step: boundedInt(e.step, 0, 5, 0), due: e.due};
    }
    const hist = Object.entries(plainObject(src.hist)).filter(([k, v]) => isDateString(k) && boundedInt(v, 0, 100000, -1) >= 0).sort().slice(-60);
    for(const [k, v] of hist) out.hist[k] = v;
    for(const m of ['match', 'scramble']){
      for(const [k, v] of Object.entries(plainObject(src[m]))) if(SCOPE_PATTERN.test(k) && typeof v === 'number' && Number.isFinite(v)) out[m][k] = v;
    }
    return out;
  }
  function mergeAliases(p){
    for(const [dup, canon] of Object.entries(aliasOf)){
      const a = p.flash[dup], b = p.flash[canon];
      if(a){
        if(!b || (a.mastered && !b.mastered) || (!b.mastered && a.knowCount + a.typeCount > b.knowCount + b.typeCount)) p.flash[canon] = a;
        delete p.flash[dup];
      }
      if(p.srs[dup]){ if(!p.srs[canon] || p.srs[dup].step > p.srs[canon].step) p.srs[canon] = p.srs[dup]; delete p.srs[dup]; }
      for(const m of ['listen', 'miss', 'kseen']){
        if(p[m][dup] != null){ p[m][canon] = Math.max(p[m][canon] || 0, p[m][dup]); delete p[m][dup]; }
      }
    }
    return p;
  }
  const fixProg = raw => mergeAliases(sanitizeProgress(raw));
  const hasProgress = p => !!p && (Object.keys(p.flash).length > 0 || Object.keys(p.sent).length > 0 || Object.keys(p.full).length > 0 || Object.keys(p.listen).length > 0 || Object.keys(p.gram).length > 0 || p.daily.count > 0);
  const progressSummary = p => `${Object.values(p.flash).filter(x => x.mastered).length} words known, ${Object.keys(p.sent).length + Object.keys(p.full).length} sentences practised, ${p.streak.n}-day streak`;
  function loadProg(){
    let p = null;
    try{ p = JSON.parse(store.get(progKey()) || 'null'); }catch(e){}
    progress = fixProg(p);
  }
  let syncTimer = null;
  function save(){
    progress.updatedAt = Date.now();
    try{ store.set(progKey(), JSON.stringify(progress)); }catch(e){ note('Couldn’t save — will retry'); return; }
    note('Saved'); clearTimeout(syncTimer); syncTimer = setTimeout(() => note(''), 1500);
  }
  function note(t){ const e = $('#syncnote'); if(e) e.textContent = t; }
  async function sha(s){
    try{
      const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
      return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2,'0')).join('');
    }catch(e){ let h = 5381; for(const c of s) h = ((h<<5)+h+c.charCodeAt(0))|0; return 'x'+(h>>>0).toString(16); }
  }
  const users = () => { try{ return JSON.parse(store.get('lt_users') || '{}'); }catch(e){ return {}; } };
  function renderAccountPicker(){
    const names = Object.values(users()).map(u => u.name).filter(Boolean).sort((a, b) => a.localeCompare(b));
    const box = $('#au-accounts'), pick = $('#au-pick');
    box.hidden = authMode === 'signup' || names.length === 0;
    pick.innerHTML = '<option value="">Choose an account…</option>' + names.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
  }
  function setAuthMode(m){
    authMode = m;
    $('#tab-login').classList.toggle('on', m==='login'); $('#tab-signup').classList.toggle('on', m==='signup');
    $('#au-submit').textContent = m==='login' ? 'Log in' : m==='signup' ? 'Create account' : 'Set new password';
    $('#au-pass').autocomplete = m==='login' ? 'current-password' : 'new-password';
    $('#au-pass').placeholder = m==='reset' ? 'New password, at least 4 characters' : 'At least 4 characters';
    $('#au-forgot').textContent = m==='reset' ? 'Back to log in' : 'Forgot password?';
    $('#au-forgot').hidden = m==='signup';
    $('#au-err').textContent = '';
    renderAccountPicker();
    $('#au-note').textContent = m==='reset' ? 'Enter your username and a new password. If this device has no login with that name, one is created here and your saved progress loads.' : 'Accounts and progress are stored in this browser only.';
  }
  document.addEventListener('change', e => {
    if(e.target.id !== 'au-pick' || !e.target.value) return;
    $('#au-user').value = e.target.value; $('#au-err').textContent = ''; $('#au-pass').focus();
  });
  async function submitAuth(e){
    if(e) e.preventDefault();
    const name = $('#au-user').value.trim(), pass = $('#au-pass').value, err = $('#au-err');
    err.textContent = '';
    if(!/^[A-Za-z0-9_-]{3,24}$/.test(name)){ err.textContent = 'Username must be 3-24 letters, numbers, _ or -.'; return; }
    if(pass.length < 4){ err.textContent = 'Password needs at least 4 characters.'; return; }
    const key = name.toLowerCase(), all = users();
    if(authMode === 'reset'){
      const salt = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(x => x.toString(16).padStart(2,'0')).join('');
      all[key] = Object.assign(all[key] || {name}, {salt, hash: await sha(salt + pass)});
      store.set('lt_users', JSON.stringify(all));
      enter(key); return;
    }
    if(authMode === 'signup'){
      if(all[key]){ err.textContent = 'That username is taken. Try logging in instead.'; return; }
      const salt = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(x => x.toString(16).padStart(2,'0')).join('');
      all[key] = {name, salt, hash: await sha(salt + pass)};
      store.set('lt_users', JSON.stringify(all));
      enter(key);
    }else{
      const u = all[key];
      if(!u){
        const names = Object.values(users()).map(x => x.name).filter(Boolean);
        err.textContent = names.length
          ? `No account named “${name}” exists in this browser. Accounts here: ${names.join(', ')}. Pick one from the list, or tap Sign up to create “${name}”.`
          : `There are no accounts in this browser yet, so “${name}” can’t be found. Tap Sign up to create it.`;
        return;
      }
      if(await sha(u.salt + pass) !== u.hash){ err.textContent = 'Wrong password.'; return; }
      enter(key);
    }
  }
  function enter(key){
    user = key; EXAM.reset();
    if(key) store.set('lt_remember', key);
    $('#auth').hidden = true; $('#app').hidden = false;
    loadProg(); pendingBackup = null; pendingExam = null; backupOpen = false; weekOpen = false; resetAsk = false; guestOffer = null; restartAsk = false;
    if(key){
      let g = null;
      try{ g = fixProg(JSON.parse(store.get('lt_prog_guest') || 'null')); }catch(e){}
      if(hasProgress(g) && !hasProgress(progress)) guestOffer = g;
    }
    mode = 'flash'; catId = 'all'; groupId = 'all'; statusF = ''; resetAsk = false; activeTask = null; searchQ = ''; $('#search').value = '';
    rebuild(); render();
  }
  function logout(){
    store.del('lt_remember'); user = null; EXAM.reset(); stopTimer(); resetAsk = false; backupOpen = false; pendingBackup = null; pendingExam = null; weekOpen = false;
    $('#app').hidden = true; $('#auth').hidden = false;
    $('#au-pass').value = ''; setAuthMode('login');
  }

  const MODES = {exam:'Exam prep', flash:'Flashcards', sent:'Build sentences', full:'Full sentences', photos:'Photos', match:'Speed match', scramble:'Word scramble', gram:'Grammar'};
  const isGame = () => mode === 'match' || mode === 'scramble';
  const NOUN = {flash:'word', sent:'sentence', full:'sentence', listen:'word', gram:'question', match:'word', scramble:'word'};
  let mode = 'flash', catId = 'all', groupId = 'all', statusF = '', queue = [], activeTask = null, matchGame = null, scrambleGame = null, timerId = null, restartAsk = false, pendingBackup = null, guestOffer = null, listenAnyway = false, resetAsk = false, searchQ = '', backupOpen = false, topicOpen = false, searchOpen = false;
  const REVIEW_MIN_GAP = 30, REVIEW_CHANCE = 0.1, REVIEW_COOLDOWN_DAYS = 3;
  let sinceReview = 0;
  const srcFor = m => m === 'sent' ? SENTS : m === 'full' ? FULL : m === 'gram' ? GR : WORDS;
  const flashState = k => progress.flash[k] || (progress.flash[k] = {phase:'recognize', knowCount:0, typeCount:0, mastered:false});
  const level = k => (progress[mode][k]) || 0;
  const isMastered = k => mode === 'flash' ? !!(progress.flash[k] && progress.flash[k].mastered) : level(k) >= 3;
  const GROUPS = [
    {id:'basics', name:'Basics', cats:['greetings','phrases','numbers','colors','days','months','time']},
    {id:'pictures', name:'Photos', cats:['iylt','natscene']},
    {id:'reading', name:'Reading', cats:['reading1']},
    {id:'people', name:'People', cats:['family','identity','relationships']},
    {id:'food', name:'Food', cats:['food','meat','fish','dairy','bakery','vegetables','fruits','canned','meals','dining']},
    {id:'shopping', name:'Shopping & Services', cats:['supermarket','shopping','shopping-phrases','commerce','services']},
    {id:'home', name:'Home & Daily Life', cats:['home','housing','household','dailylife','clothing']},
    {id:'world', name:'World & Leisure', cats:['nature','animals','travel','directions','leisure']},
    {id:'health', name:'Health & Learning', cats:['health','education']}
  ];
  const GOF = {};
  GROUPS.forEach(g => g.cats.forEach(c => { GOF[c] = g.id; }));
  CATS.forEach(c => { if(!GOF[c.id]){ GOF[c.id] = 'more'; let g = GROUPS.find(x => x.id === 'more'); if(!g){ g = {id:'more', name:'More', cats:[]}; GROUPS.push(g); } g.cats.push(c.id); } });
  const groupOf = id => GROUPS.find(g => g.id === id);
  function scopeCats(){
    if(catId !== 'all') return [catId];
    if(mode !== 'gram' && groupId !== 'all'){ const g = groupOf(groupId); return g ? g.cats : null; }
    return null;
  }
  const inScope = cat => { const s = scopeCats(); return !s || s.includes(cat); };
  const scopeKey = () => catId !== 'all' ? catId : (mode !== 'gram' && groupId !== 'all') ? 'g:' + groupId : 'all';
  const knownKeys = () => WORDS.filter(w => inScope(w.cat) && progress.flash[w.key] && progress.flash[w.key].mastered).map(w => w.key);
  const troubleKeys = () => Object.keys(progress.miss).filter(k => wordsByKey[k] && progress.miss[k] > 0 && inScope(wordsByKey[k].cat));
  const missW = k => { progress.miss[k] = (progress.miss[k] || 0) + 1; };
  const hitW = k => { if(progress.miss[k]){ progress.miss[k]--; if(!progress.miss[k]) delete progress.miss[k]; } };
  const DAY = 864e5, SRS_DAYS = [1, 3, 7, 14, 30, 60];
  function srsSet(k, how){
    const cur = progress.srs[k], step = how === 'new' ? 0 : how === 'already' ? 1 : how ? Math.min(5, (cur ? cur.step : 0) + 1) : 0;
    progress.srs[k] = {step, due: Date.now() + SRS_DAYS[step] * DAY};
    progress.kseen[k] = Date.now();
  }
  const isDue = k => { const e = progress.srs[k]; return (e ? e.due : (progress.kseen[k] || 0) + 3 * DAY) <= Date.now(); };
  const dueKeys = () => knownKeys().filter(isDue);
  const special = () => statusF !== '';
  function deckKeys(){
    if(statusF === 'known') return knownKeys();
    if(statusF === 'due') return dueKeys();
    if(statusF === 'trouble') return troubleKeys();
    return srcFor(mode).filter(x => inScope(x.cat)).map(x => x.key);
  }
  function catsWithContent(){
    if(mode === 'gram') return GRAMMAR.map(g => ({id:g.id, name:g.name}));
    const key = mode === 'sent' ? 'sents' : mode === 'full' ? 'full' : 'words';
    return CATS.filter(c => (c[key] || []).length).map(c => ({id:c.id, name:c.name}));
  }
  function topicsForMode(){
    const all = catsWithContent();
    if(mode === 'gram' || groupId === 'all') return all;
    const order = GROUPS.find(g => g.id === groupId).cats;
    return all.filter(c => GOF[c.id] === groupId).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }
  function validCat(){
    if(mode === 'gram') groupId = 'all';
    else if(groupId !== 'all' && !catsWithContent().some(c => GOF[c.id] === groupId)) groupId = 'all';
    if(!(mode === 'flash' || mode === 'listen')) statusF = '';
    if(mode === 'listen' && statusF === 'due') statusF = '';
    if(catId !== 'all' && !topicsForMode().some(t => t.id === catId)) catId = 'all';
  }
  function rebuild(){
    stopTimer(); activeTask = null; matchGame = null; scrambleGame = null;
    if(isGame()) return;
    restartAsk = false;
    if(inOrderedDeck()) queue = deckKeys().sort((a, b) => +a.split(':')[1] - +b.split(':')[1]);
    else queue = special() ? shuffle(deckKeys()) : shuffle(deckKeys().filter(k => !isMastered(k)));
  }
  function inOrderedDeck(){
    const c = catId !== 'all' ? categoryById[catId] : null;
    return mode === 'full' && !statusF && !!(c && c.ordered);
  }
  function tick(n){
    const d = today();
    if(progress.daily.date !== d) progress.daily = {date:d, count:0};
    progress.daily.count += (n || 1);
    progress.hist[d] = progress.daily.count;
    const hk = Object.keys(progress.hist).sort(); while(hk.length > 60) delete progress.hist[hk.shift()];
    awardStreak();
  }
  function awardStreak(){
    const d = today();
    if(progress.daily.date === d && progress.daily.count >= progress.goal && progress.streak.last !== d){
      progress.streak = {n: progress.streak.last === yesterday() ? progress.streak.n + 1 : 1, last: d};
    }
  }
  function hintNote(s){
    const m = (s.n||'').match(/^"[^"]*" means "(.*)"\.?$/);
    return m ? 'Meaning: ' + m[1] : (s.n||'');
  }
  function streakNow(){ const s = progress.streak; return (s.last === today() || s.last === yesterday()) ? s.n : 0; }

  function stagePhotos(){
    const pics = CATS.filter(c => c.image);
    const card = c => {
      const ks = FULL.filter(x => x.cat === c.id), done = ks.filter(x => (progress.full[x.key] || 0) >= 3).length;
      return `<div class="photo-card"><img src="${esc(c.image)}" alt="${esc(c.imageAlt || c.name)}" loading="lazy"><div class="photo-body"><h3>${esc(c.name)}</h3><p>${done}/${ks.length} sentences mastered</p><div class="photo-btns"><button type="button" class="btn green" data-act="photo" data-v="${esc(c.id)}|full">Full sentences</button><button type="button" class="btn" data-act="photo" data-v="${esc(c.id)}|sent">Build sentences</button></div></div></div>`;
    };
    return `<div class="photos"><h2>Photos</h2><p class="sub">Describe what you see, one sentence at a time. Pick a picture to practise its sentences.</p><div class="photo-grid">${pics.map(card).join('')}</div></div>`;
  }
  const SHORT = {exam:'Exam', flash:'Cards', sent:'Build', full:'Full', photos:'Photos', match:'Match', scramble:'Scramble', gram:'Grammar'};
  function renderChrome(){
    const inExam = mode === 'exam' || mode === 'photos';
    ['#goal', '.bar', '#topicbtn'].forEach(sel => { const el = $(sel); if(el) el.hidden = inExam; });
    $('.tiers').hidden = inExam || !topicOpen;
    $('#search').hidden = !(searchOpen || searchQ);
    $('#searchbtn').setAttribute('aria-expanded', String(!$('#search').hidden));
    $('#topicbtn').setAttribute('aria-expanded', String(!inExam && topicOpen));
    $('.stat').hidden = inExam;
    if(inExam){
      $('#tabs').innerHTML = Object.keys(MODES).map(m => `<button type="button" class="${m===mode?'on':''}" data-act="mode" data-v="${m}"><span class="lg">${MODES[m]}</span><span class="sh">${SHORT[m]}</span></button>`).join('');
      renderFooter();
      return;
    }
    validCat();
    $('#tabs').innerHTML = Object.keys(MODES).map(m => `<button type="button" class="${m===mode?'on':''}" data-act="mode" data-v="${m}"><span class="lg">${MODES[m]}</span><span class="sh">${SHORT[m]}</span></button>`).join('');
    const src = srcFor(mode), list = topicsForMode(), grp = groupOf(groupId);
    const cnt = pred => { const ks = src.filter(pred).map(x => x.key); return isGame() ? ks.length : [ks.filter(isMastered).length, ks.length]; };
    const badge = c => isGame() ? `${c} words` : `${c[0]}/${c[1]}`;
    const chipH = (act, id, label, b, on, cls) => `<button type="button" class="chip ${cls || ''} ${on ? 'on' : ''}" data-act="${act}" data-v="${id}" ${act === 'stat' ? `aria-pressed="${on}"` : ''}>${esc(label)}${b !== '' ? `<small>${b}</small>` : ''}</button>`;
    const allLabel = mode === 'gram' ? 'All grammar' : (mode === 'sent' || mode === 'full') ? 'All sentences' : 'All words';
    $('#row1').hidden = mode === 'gram';
    if(mode !== 'gram'){
      let h1 = chipH('grp', 'all', allLabel, badge(cnt(() => true)), groupId === 'all');
      GROUPS.forEach(g => { const tot = src.filter(x => GOF[x.cat] === g.id).length; if(tot) h1 += chipH('grp', g.id, g.name, badge(cnt(x => GOF[x.cat] === g.id)), groupId === g.id); });
      $('#chips').innerHTML = h1;
      const on1 = $('#chips .on'); if(on1) $('#chips').scrollLeft = Math.max(0, on1.offsetLeft - 24);
    }
    const showT2 = mode === 'gram' || groupId !== 'all';
    $('#row2').hidden = !showT2;
    $('#row2 .tierlabel').textContent = mode === 'gram' ? 'Topic' : 'Subcategory';
    if(showT2){
      const inGrp = x => mode === 'gram' || GOF[x.cat] === groupId;
      let h2 = chipH('cat', 'all', mode === 'gram' ? allLabel : 'All ' + (grp ? grp.name : ''), badge(cnt(inGrp)), catId === 'all', 't2');
      h2 += list.map(t2 => chipH('cat', t2.id, t2.name, badge(cnt(x => x.cat === t2.id)), catId === t2.id, 't2')).join('');
      $('#chips2').innerHTML = h2;
      const on2 = $('#chips2 .on'); if(on2) $('#chips2').scrollLeft = Math.max(0, on2.offsetLeft - 24);
    }
    const showT3 = mode === 'flash' || mode === 'listen';
    $('#row3').hidden = !showT3;
    if(showT3){
      const sc = statusF; statusF = ''; const kn = knownKeys().length, tr = troubleKeys().length, du = mode === 'flash' ? dueKeys().length : 0; statusF = sc;
      $('#chips3').innerHTML = (mode === 'flash' ? chipH('stat', 'due', 'Due now', du, statusF === 'due', 't3') : '') + chipH('stat', 'known', 'Know it', kn, statusF === 'known', 't3') + chipH('stat', 'trouble', 'Trouble words', tr, statusF === 'trouble', 't3');
    }
    {
      const parts = [];
      if(mode !== 'gram' && groupId !== 'all' && grp) parts.push(grp.name);
      if(catId !== 'all'){ const t2 = list.find(t => t.id === catId); if(t2) parts.push(t2.name); }
      const stl = {due:'Due now', known:'Know it', trouble:'Trouble words'}[statusF];
      const lab = parts.length ? parts.join(' \u203a ') : allLabel;
      $('#topicbtn').innerHTML = `<span class="tk">${mode === 'gram' ? 'Topic' : 'Category'}</span><span class="tv">${esc(lab)}</span>${stl ? `<span class="tf">${stl}</span>` : ''}<span class="car" aria-hidden="true">${topicOpen ? '\u25b4' : '\u25be'}</span>`;
    }
    let n, c, pct = 0;
    const scopeWords = WORDS.filter(w => inScope(w.cat)).length;
    if(mode === 'scramble'){ const b = progress.scramble[scopeKey()]; n = b != null ? b + ' / 50' : '\u2014'; c = 'best score'; }
    else if(mode === 'match'){ const b = progress.match[scopeKey()]; n = b ? b.toFixed(1) + 's' : '\u2014'; c = 'best time'; }
    else if(statusF === 'known'){ const kn2 = knownKeys().length; n = String(kn2); c = 'words known'; pct = scopeWords ? kn2 / scopeWords * 100 : 0; }
    else if(statusF === 'due'){ n = String(dueKeys().length); c = 'words due for review'; }
    else if(statusF === 'trouble'){ n = String(troubleKeys().length); c = 'trouble words'; }
    else{
      const keys = deckKeys(), m = keys.filter(isMastered).length;
      n = `${m} / ${keys.length}`; c = mode === 'listen' ? 'words recognized by ear' : mode === 'gram' ? 'questions mastered' : NOUN[mode] + 's mastered'; pct = keys.length ? m / keys.length * 100 : 0;
    }
    $('#stat-n').textContent = n; $('#stat-c').textContent = c; $('#barfill').style.width = pct + '%';
    const d = today(), cnt0 = progress.daily.date === d ? progress.daily.count : 0, met = cnt0 >= progress.goal, st = streakNow();
    $('#goal').innerHTML = `<span>Today <b>${cnt0}</b>/${esc(String(progress.goal))}</span><span class="gbar ${met?'met':''}" role="progressbar" aria-valuemin="0" aria-valuemax="${progress.goal}" aria-valuenow="${Math.min(cnt0, progress.goal)}"><i style="width:${Math.min(100, cnt0 / progress.goal * 100)}%"></i></span>${st ? `<span><b>${st}</b>-day streak</span>` : ''}<button type="button" class="linkbtn" data-act="goal">Edit goal</button>`;
    renderFooter();
  }
  function renderFooter(){
    renderOffer();
    $('#sync').innerHTML = (user ? `Signed in as ${esc(user)} · <button type="button" class="linkbtn" data-act="logout">Log out</button>`
      : `Playing as guest (progress is kept on this device) · <button type="button" class="linkbtn" data-act="exit">Log in or sign up</button>`)
      + (/^https?:$/.test(location.protocol) && !((window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone) ? ` · <button type="button" class="linkbtn" data-act="installhelp">Install on your phone</button>` : '')
      + ` · Saved on this device · Pronunciation guide: capitals mark the stressed syllable; use the audio button as the reference.`;
    $('#prefs').innerHTML = (hasTTS ? `<div class="prefrow"><label><input type="checkbox" id="auto" ${prefs.auto?'checked':''}> Play audio automatically on flashcards</label></div>` : '')
      + `<div class="prefrow"><label>Theme <select id="theme"><option value="auto" ${prefs.theme==='auto'?'selected':''}>Match device</option><option value="light" ${prefs.theme==='light'?'selected':''}>Light</option><option value="dark" ${prefs.theme==='dark'?'selected':''}>Dark</option></select></label> · <button type="button" class="linkbtn" data-act="week">${weekOpen ? 'Hide weekly summary' : 'Weekly summary'}</button></div>` + (weekOpen ? weekPanel() : '');
    const label = {exam:'exam practice', flash:'flashcard', sent:'sentence', full:'full-sentence', listen:'listening', match:'speed-match', scramble:'word-scramble', gram:'grammar'}[mode];
    $('#reset').innerHTML = mode === 'photos' ? '' : resetAsk
      ? `<div class="rrow"><span>Wipe all ${label} progress?</span><button type="button" class="btn red" data-act="resetyes">Yes, reset</button><button type="button" class="btn green" data-act="resetno">Cancel</button></div>`
      : `<button type="button" class="linkbtn" data-act="resetask">Reset ${label} progress</button>`;
    $('#backup').innerHTML = backupOpen
      ? `<div class="bkpanel"><div class="sub2">Save your progress as a file you can keep or send. Anyone can load it into their own copy of the app, with or without an account.</div>
          <div class="rrow"><button type="button" class="btn amber" data-act="bkdl">Download progress file</button><button type="button" class="btn green" data-act="bkpick">Load progress file</button></div>
          ${pendingBackup ? `<div class="rrow warnrow"><span><b>Replace your current progress?</b><br>Now: ${esc(progressSummary(progress))}.<br>From the file: ${esc(progressSummary(pendingBackup))}.</span><button type="button" class="btn red" data-act="bkapply">Replace</button><button type="button" class="btn green" data-act="bkcancel">Cancel</button></div>` : ''}
          <input type="file" id="bkfile" accept=".json,application/json,text/plain" hidden>
          <textarea id="bk" aria-label="Progress backup text" spellcheck="false" placeholder="Backup text appears here. You can also paste a backup here."></textarea>
          <div class="rrow"><button type="button" class="linkbtn" data-act="bkshow">Show backup text</button><button type="button" class="linkbtn" data-act="bkrestore">Restore from text</button><button type="button" class="linkbtn" data-act="bkclose">Close</button></div><div id="bkmsg" class="note" aria-live="polite"></div></div>`
      : `<button type="button" class="linkbtn" data-act="bkopen">Save or load progress file</button>`;
  }
  function renderOffer(){
    const box = $('#offer'); if(!box) return;
    box.innerHTML = guestOffer
      ? `<div class="offer"><span>You have progress from playing as a guest on this device (${esc(progressSummary(guestOffer))}). Move it into this account?</span><button type="button" class="btn amber" data-act="offeryes">Move it</button><button type="button" class="linkbtn" data-act="offerno">No thanks</button></div>` : '';
  }
  function render(){ renderChrome(); renderStage(); }
  onVoicesReady = () => { if(mode === 'listen' && !$('#app').hidden && !activeTask) renderStage(); };
  function renderStage(){
    const st = $('#stage');
    if(mode !== 'match' && mode !== 'scramble') stopTimer();
    const timed = mode === 'match' ? matchGame : mode === 'scramble' ? scrambleGame : null;
    if(timed && !timed.finished){
      if(searchQ && !timed.pausedAt) timed.pausedAt = performance.now();
      else if(!searchQ && timed.pausedAt){ timed.start += performance.now() - timed.pausedAt; timed.pausedAt = null; }
    }
    if(searchQ){ st.innerHTML = stageSearch(); return; }
    if(mode === 'exam'){ EXAM.mount(st); return; }
    if(mode === 'photos'){ st.innerHTML = stagePhotos(); return; }
    st.innerHTML = ({flash:stageFlash, sent:stageSent, full:stageFull, listen:stageListen, match:stageMatch, scramble:stageScramble, gram:stageGram})[mode]();
    const inp = $('#tin'); if(inp && !inp.disabled) inp.focus({preventScroll:true});
    if(activeTask && !activeTask.spoken){
      if(mode === 'listen'){ activeTask.spoken = true; speak(wordsByKey[activeTask.key].lt); }
      else if(mode === 'flash' && prefs.auto && activeTask.dir === 'lt'){ activeTask.spoken = true; speak(wordsByKey[activeTask.key].lt); }
    }
  }
  function caught(){
    const what = NOUN[mode];
    const total = deckKeys().length;
    if(restartAsk) return `<div class="done"><div class="ic">⚠️</div><h2>Start over?</h2><p>This clears your progress on the ${total} ${what}${total === 1 ? '' : 's'} in this selection. It can’t be undone.</p><div class="rrow"><button type="button" class="btn red" data-act="reviewyes">Yes, start over</button><button type="button" class="btn green" data-act="reviewno">Cancel</button></div></div>`;
    return `<div class="done"><div class="ic">🌾</div><h2>All caught up</h2><p>You’ve marked every ${what} in this selection as learned. You can start over to practise them from scratch.</p><button type="button" class="btn amber" data-act="reviewask">Start over…</button></div>`;
  }
  const dots = L => `<div class="dots" aria-label="Level ${L} of 3">${[0,1,2].map(i => `<i class="${i < L ? 'on' : ''}"></i>`).join('')}</div>`;
  function optGrid(labels, picked, correct, act){
    const done = picked !== null;
    return `<div class="opts">` + labels.map((l,i) => {
      let c = '';
      if(done){ if(i === correct) c = 'right'; else if(i === picked) c = 'wrong'; }
      return `<button type="button" class="opt ${c}" data-act="${act}" data-v="${i}" ${done?'disabled':''}>${esc(l)}</button>`;
    }).join('') + `</div>`;
  }

  function stageSearch(){
    const n = norm(searchQ);
    if(n.length < 1) return `<div class="done"><h2>No matches</h2><p>Nothing found for “${esc(searchQ)}”. Search with English words or Lithuanian letters.</p></div>`;
    const wm = WORDS.filter(w => norm(w.lt).includes(n) || norm(w.en).includes(n)).slice(0, 60);
    const fm = FULL.filter(f => norm(f.lt).includes(n) || norm(f.en).includes(n)).slice(0, 20);
    if(!wm.length && !fm.length) return `<div class="done"><h2>No matches</h2><p>Nothing found for “${esc(searchQ)}”. Try an English word or a Lithuanian word without diacritics.</p></div>`;
    const wr = wm.map(w => {
      const tags = (progress.flash[w.key] && progress.flash[w.key].mastered ? ' · known' : '') + (progress.miss[w.key] ? ' · trouble' : '');
      return `<div class="res"><div class="tx"><div class="meta">${esc(w.catName)}${tags}</div><div class="lt">${esc(w.lt)} <span class="pron">[${esc(w.pr)}]</span></div><div class="en">${esc(w.en)}</div>${rootLine(w)}</div>${spk(w.lt)}</div>`;
    }).join('');
    const fr = fm.map(f => `<div class="res"><div class="tx"><div class="meta">${esc(f.catName)} · sentence</div><div class="lt">${esc(f.lt)}</div><div class="en">${esc(f.en)}</div></div>${spk(f.lt)}</div>`).join('');
    return `<div class="results">${wr}${fr}</div>`;
  }

  function stageFlash(){
    const plain = special();
    if(!queue.length){
      if(statusF === 'due') return '<div class="done"><div class="ic">\ud83c\udf3e</div><h2>Nothing due</h2><p>You are caught up. Known words come back after 1, 3, 7, 14, 30 and 60 days, as long as you keep getting them right.</p></div>';
      if(statusF === 'known'){
        if(knownKeys().length) return '<div class="done"><div class="ic">\ud83c\udf3e</div><h2>Reviewed them all</h2><p>You\u2019ve spelled every known word in this selection. Start again whenever you like.</p><button type="button" class="btn amber" data-act="requeue">Start again</button></div>';
        return '<div class="done"><div class="ic">\ud83c\udf3e</div><h2>Nothing here yet</h2><p>Words land here after you type them correctly 8 times, or when you tap \u201cI already know this word\u201d.</p></div>';
      }
      if(statusF === 'trouble') return '<div class="done"><div class="ic">\ud83c\udf3e</div><h2>No trouble words</h2><p>Words you miss are collected here until you get them right again.</p></div>';
      return caught();
    }
    if(!activeTask){
      let key = queue[0], review = plain;
      if(!plain){
        sinceReview++;
        const dueAll = dueKeys();
        if(sinceReview >= (dueAll.length ? 6 : REVIEW_MIN_GAP) && Math.random() < (dueAll.length ? 0.4 : REVIEW_CHANCE)){
          const due = dueAll.sort((a, b) => (progress.srs[a] ? progress.srs[a].due : 0) - (progress.srs[b] ? progress.srs[b].due : 0)).slice(0, 8);
          if(due.length){ key = due[Math.floor(Math.random() * due.length)]; review = true; sinceReview = 0; }
        }
      }
      activeTask = {key, review, dir: Math.random() < .5 ? 'lt' : 'en', flipped:false, result:null, val:''};
    }
    const w = wordsByKey[activeTask.key], s = flashState(activeTask.key);
    if(s.mastered) return stageType(w, s, true);
    if(!activeTask.review && s.phase === 'type') return stageType(w, s, false);
    const front = activeTask.dir === 'lt' ? w.lt : w.en, back = activeTask.dir === 'lt' ? w.en : w.lt;
    const hint = activeTask.dir === 'lt' ? 'tap the card to reveal' : 'tap the card to reveal the Lithuanian word';
    const bdg = activeTask.review ? 'Trouble' : s.knowCount + ' / 8 known';
    const top = `<div class="top"><span class="tag">${esc(w.catName)}</span><span class="badge">${bdg}</span></div>`;
    const frontSpk = activeTask.dir === 'lt' ? spk(w.lt) : '', backSpk = activeTask.dir === 'en' ? spk(w.lt) : '';
    return `<div class="flipwrap"><div class="flip ${activeTask.flipped?'flipped':''}" id="flip" role="button" tabindex="0" aria-label="Flip card" data-act="flip">
      <div class="face">${top}<div class="big">${esc(front)}</div>${frontSpk}<div class="hint">${hint}</div></div>
      <div class="face back">${top}<div class="big">${esc(back)}</div>${backSpk}<div class="pron">${esc(w.pr)}</div>${rootLine(w)}${breakdown(w.lt)}</div>
    </div></div>
    <div class="actions ${activeTask.seen?'show':''}" id="acts"><button type="button" class="btn red" data-act="dont">Don’t know it</button><button type="button" class="btn green" data-act="know">I know it!</button></div>
    ${activeTask.review ? '' : '<button type="button" class="linkbtn" data-act="already">I already know this word</button>'}`;
  }
  function already(){
    const key = queue.shift(), s = flashState(key);
    s.phase = 'type'; s.knowCount = 8; s.typeCount = 8; s.mastered = true; hitW(key); srsSet(key, 'already');
    activeTask = null; save(); render();
  }
  function recordRecognition(known){
    if(activeTask.review){
      const key = activeTask.key, s = flashState(key);
      srsSet(key, !!known);
      if(statusF === 'due'){ if(known) hitW(key); else missW(key); if(!known){ s.mastered = false; s.phase = 'recognize'; s.knowCount = 4; s.typeCount = 0; } queue.shift(); tick(); activeTask = null; save(); render(); return; }
      if(known){
        hitW(key);
        if(statusF === 'known') queue.push(queue.shift());
        else if(statusF === 'trouble'){ if(progress.miss[key]) queue.push(queue.shift()); else queue.shift(); }
      }else{
        missW(key);
        if(statusF === 'trouble') queue.push(queue.shift());
        else{
          s.mastered = false; s.phase = 'recognize'; s.knowCount = 4; s.typeCount = 0;
          if(statusF === 'known') queue = queue.filter(k => k !== key); else queue.splice(Math.min(queue.length, 2), 0, key);
        }
      }
      tick(); activeTask = null; save(); render(); return;
    }
    const key = queue.shift(), s = flashState(key);
    if(known){ hitW(key); s.knowCount = Math.min(8, s.knowCount + 1); if(s.knowCount >= 8){ s.phase = 'type'; s.typeCount = 0; } }
    else{ missW(key); s.knowCount = Math.max(0, s.knowCount - 1); }
    queue.splice(Math.min(queue.length, known ? 2 + s.knowCount * 3 : 2), 0, key);
    tick(); activeTask = null; save(); render();
  }
  const LT_LETTERS = ['ą','č','ę','ė','į','š','ų','ū','ž'];
  function stageType(w, s, known){
    const r = activeTask.result;
    let badge = known ? 'Know it' : `${s.typeCount} / 8 typed`, fb = '', cls = '';
    if(r){
      const n = r.ok ? Math.min(8, s.typeCount + 1) : Math.max(0, s.typeCount - 1);
      if(!known) badge = n >= 8 ? 'Mastered!' : `${n} / 8 typed`;
      cls = r.ok ? 'ok' : 'no';
      fb = r.ok
        ? `Correct! ${esc(w.lt)} (${esc(w.pr)})` + (r.lenient ? ' — watch the diacritics.' : '')
        : `Not quite. The answer is ${esc(w.lt)} (${esc(w.pr)})`;
    }
    return `<div class="scard"><div class="top"><span class="tag">${esc(w.catName)}</span><span class="badge">${badge}</span></div>
      <div class="big">${esc(w.en)}</div>
      <div class="snote">${known ? 'Spell it: type the Lithuanian word for a word you already know.' : 'Type the Lithuanian word — you’ve known this one 8 times, time to recall it from scratch.'}</div>
      <input id="tin" class="tinput ${cls}" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Lithuanian word" value="${esc(activeTask.val)}" ${r?'disabled':''}>
      ${r ? '' : `<div class="dia" aria-label="Lithuanian letters">${LT_LETTERS.map(c => `<button type="button" data-act="dia" data-v="${c}" aria-label="Insert ${c}">${c}</button>`).join('')}</div>`}
      <div class="fb ${cls}">${fb}</div>${r ? spk(w.lt) + rootLine(w) + breakdown(w.lt) : ''}
      ${r ? '<button type="button" class="btn amber" data-act="typenext">Next</button>' : '<button type="button" class="btn amber" data-act="check">Check</button>'}
    </div>`;
  }
  function check(){
    if(activeTask.result) return;
    const inp = $('#tin'), val = inp.value; if(!val.trim()) return;
    const w = wordsByKey[activeTask.key];
    const cands = WORDS.filter(x => x.en.toLowerCase() === w.en.toLowerCase());
    const exact = cands.some(x => strict(x.lt) === strict(val));
    const lenient = !exact && cands.some(x => norm(x.lt) === norm(val));
    activeTask.val = val; activeTask.result = {ok: exact || lenient, lenient};
    renderStage();
  }
  function typeNext(){
    const key0 = activeTask.key, s0 = flashState(key0), ok0 = activeTask.result.ok;
    if(s0.mastered){
      if(ok0){ hitW(key0); srsSet(key0, true); }
      else{
        missW(key0); srsSet(key0, false);
        if(progress.miss[key0] >= 2){ s0.mastered = false; s0.phase = 'recognize'; s0.knowCount = 4; s0.typeCount = 0; }
      }
      if(queue[0] === key0){
        if(ok0 && !progress.miss[key0]) queue.shift();
        else if(!ok0 && !s0.mastered) queue.shift();
        else queue.push(queue.shift());
      }
      tick(); activeTask = null; save(); render(); return;
    }
    const key = queue.shift(), s = flashState(key), ok = activeTask.result.ok;
    s.typeCount = ok ? Math.min(8, s.typeCount + 1) : Math.max(0, s.typeCount - 1);
    if(ok) hitW(key); else missW(key);
    if(s.typeCount >= 8){ s.mastered = true; srsSet(key, 'new'); } else queue.splice(Math.min(queue.length, ok ? 3 + s.typeCount * 3 : 2), 0, key);
    tick(); activeTask = null; save(); render();
  }

  function makeOpts(s){
    if(s.o) return shuffle([{lt:s.a, en:s.m}, ...s.o.map(([lt, en]) => ({lt, en}))]);
    const ans = findWord(s.a, s.cat);
    const seen = new Set([s.a.toLowerCase()]);
    const pool = shuffle(WORDS.filter(w => s.p.includes(w.cat)));
    const decoys = [];
    for(const w of pool){ const k = w.lt.toLowerCase(); if(!seen.has(k)){ seen.add(k); decoys.push({lt:w.lt, en:w.en}); if(decoys.length === 3) break; } }
    if(decoys.length < 3) for(const w of shuffle(WORDS)){ const k = w.lt.toLowerCase(); if(!seen.has(k)){ seen.add(k); decoys.push({lt:w.lt, en:w.en}); if(decoys.length === 3) break; } }
    return shuffle([{lt:s.a, en:ans.en}, ...decoys]);
  }
  function stageSent(){
    if(!queue.length) return caught();
    const key = queue[0], s = sentencesByKey[key];
    if(!activeTask) activeTask = {key, opts: makeOpts(s), picked:null};
    const done = activeTask.picked !== null, ok = done && activeTask.opts[activeTask.picked].lt === s.a;
    const parts = s.t.split('______');
    const mid = done ? `<span class="fill">${esc(s.a)}</span>` : '<span class="blank">&nbsp;</span>';
    const sentence = parts.map(esc).join(mid);
    const L = level(key), pr = findWord(s.a, s.cat).pr;
    let fb = '';
    if(done){
      fb = ok ? `<div class="fb ok">Correct! ${esc(s.a)}${pr ? ' (' + esc(pr) + ')' : ''}</div>`
        : `<div class="fb no">${esc(activeTask.opts[activeTask.picked].lt)} means ‘${esc(activeTask.opts[activeTask.picked].en)}’ — not what fits here.</div>`;
    }
    const correct = activeTask.opts.findIndex(o => o.lt === s.a);
    return `<div class="scard"><div class="top"><span class="tag">${esc(s.catName)}</span>${dots(L)}</div>
      <div class="big sent">${sentence}</div><div class="snote">${esc(done ? s.n : hintNote(s))}</div>${fb}${done ? spk(s.t.replace('______', s.a)) + breakdown(s.a) : ''}</div>
      ${optGrid(activeTask.opts.map(o => o.lt), activeTask.picked, correct, 'opt')}
      ${done ? '<button type="button" class="btn amber" data-act="sentnext">Next</button>' : ''}`;
  }
  function pickOpt(i){
    if(activeTask.picked !== null) return;
    const s = sentencesByKey[activeTask.key]; activeTask.picked = i;
    const ok = activeTask.opts[i].lt === s.a;
    progress.sent[activeTask.key] = ok ? Math.min(3, level(activeTask.key) + 1) : 0;
    activeTask.ok = ok; tick(); save(); renderStage(); renderChrome();
  }
  function sentNext(){
    const key = queue.shift(), L = level(key);
    if(L < 3) queue.splice(Math.min(queue.length, activeTask.ok ? 3 + L * 4 : 3), 0, key);
    activeTask = null; render();
  }

  function stageFull(){
    if(!queue.length) return caught();
    const key = queue[0], f = fullByKey[key];
    if(!activeTask){
      let bank = shuffle(f.toks.map((t,i) => ({id:i, t})));
      for(let n = 0; n < 6 && f.toks.length > 1 && bank.map(b => b.t).join(' ') === f.toks.join(' '); n++) bank = shuffle(bank);
      activeTask = {key, bank, ans:[], done:false, ok:false};
    }
    const L = level(key), used = new Set(activeTask.ans.map(a => a.id));
    const ansHtml = activeTask.ans.map(a => `<button type="button" class="tile" data-act="untile" data-v="${a.id}" ${activeTask.done?'disabled':''}>${esc(a.t)}</button>`).join('');
    const bankHtml = activeTask.bank.filter(b => !used.has(b.id)).map(b => `<button type="button" class="tile" data-act="tile" data-v="${b.id}">${esc(b.t)}</button>`).join('');
    let fb = '';
    if(activeTask.done) fb = activeTask.ok ? `<div class="fb ok">Correct!${activeTask.exact ? '' : ` Another accepted order. The main version: <span class="serif">${esc(f.lt)}</span>`}</div>` : `<div class="fb no">Not quite. The sentence is: <span class="serif">${esc(f.lt)}</span></div>`;
    const ready = activeTask.ans.length === f.toks.length;
    const cat = categoryById[f.cat];
    const scene = cat.image ? `<img class="scene" src="${esc(cat.image)}" alt="${esc(cat.imageAlt || '')}">` : '';
    return `<div class="scard"><div class="top"><span class="tag">${esc(f.catName)}</span>${dots(L)}</div>
      ${scene}<div class="big sent">${esc(f.en)}</div>
      <div class="snote">${activeTask.done ? 'Tap the speaker to hear it.' : 'Tap the Lithuanian words in the right order.'}</div>
      <div class="ansline ${activeTask.done ? (activeTask.ok ? 'ok' : 'no') : ''}" aria-label="Your sentence">${ansHtml}</div>
      ${fb}${activeTask.done ? tappableSentence(f) + spk(f.lt) : ''}</div>
      ${activeTask.done ? '' : `<div class="tiles" aria-label="Words">${bankHtml}</div>`}
      ${activeTask.done ? '<button type="button" class="btn amber" data-act="fullnext">Next</button>'
        : `<div class="row"><button type="button" class="btn red" data-act="fullclear" ${activeTask.ans.length?'':'disabled'}>Clear</button><button type="button" class="btn amber" data-act="fullcheck" ${ready?'':'disabled'}>Check</button></div>`}`;
  }
  function wordMeaning(f, word){
    const w = word.toLowerCase();
    return f.gloss[w] || FORMS[w] || LTMAP.get(w) || null;
  }
  function tappableSentence(f){
    const parts = f.lt.split(/\s+/).filter(Boolean).map(raw => {
      const m = raw.match(/^([„"“(]*)(.*?)([.,!?;:…"”)]*)$/);
      const core = m[2], on = activeTask.gloss === core.toLowerCase() ? ' on' : '';
      return `${esc(m[1])}<button type="button" class="wordtap${on}" data-act="wordtap" data-w="${esc(core)}">${esc(core)}</button>${esc(m[3])}`;
    }).join(' ');
    let box = '<div class="glossbox hint">Tap a word to see what it means.</div>';
    if(activeTask.gloss){
      const meaning = wordMeaning(f, activeTask.gloss);
      box = `<div class="glossbox"><span class="serif">${esc(activeTask.glossShown)}</span> ${meaning ? '= ' + esc(meaning) : '<span class="soft">(no translation stored for this form)</span>'}</div>`;
    }
    return `<div class="meaning"><div class="tapsent serif">${parts}</div><div class="en">${esc(f.en)}</div></div>${box}`;
  }
  const BOUND_PREPS = new Set(['į','iš','su','be','ant','po','prie','per','už','nuo','apie','pas','dėl','iki','virš','pro','pagal','prieš','tarp','pas','ne','nė']);
  const FIRST_FIXED = new Set(['ar','kas','ką','kur','kada','kaip','kiek','kodėl','kuris','kuri','koks','kokia','kokį','kokią','kokie','kokios','kam','ko','kieno','kuo','bet','o','kad','jei','nes','ir']);
  function unitsOf(tokens){
    const out = [];
    for(let i = 0; i < tokens.length; i++){
      let u = tokens[i];
      if(BOUND_PREPS.has(u) && i + 1 < tokens.length){ u += ' ' + tokens[++i]; }
      out.push(u);
    }
    return out;
  }
  function sameUnits(expected, got){
    if(expected.length !== got.length || expected.length < 2) return false;
    const e = unitsOf(expected), g = unitsOf(got);
    if(e.length !== g.length) return false;
    if(FIRST_FIXED.has(expected[0]) && e[0] !== g[0]) return false;
    return e.slice().sort().join('|') === g.slice().sort().join('|');
  }
  function fullCheck(){
    const f = fullByKey[activeTask.key];
    const got = activeTask.ans.map(a => a.t.toLowerCase()).join(' ');
    const accepted = [f.toks.map(t => t.toLowerCase()).join(' ')].concat(f.alt.map(a => a.split(/\s+/).filter(Boolean).map(t => cleanToken(t).toLowerCase()).join(' ')));
    activeTask.exact = got === accepted[0];
    activeTask.ok = accepted.includes(got) || sameUnits(f.toks.map(t => t.toLowerCase()), activeTask.ans.map(a => a.t.toLowerCase()));
    activeTask.done = true;
    progress.full[activeTask.key] = activeTask.ok ? Math.min(3, level(activeTask.key) + 1) : 0;
    tick(); save(); renderStage(); renderChrome();
  }
  function fullNext(){
    const key = queue.shift(), L = level(key);
    if(inOrderedDeck()) queue.push(key);
    else if(L < 3) queue.splice(Math.min(queue.length, activeTask.ok ? 3 + L * 4 : 3), 0, key);
    activeTask = null; render();
  }

  function stageListen(){
    if(!hasTTS) return '<div class="done"><h2>Audio isn’t available here</h2><p>Your browser doesn’t offer speech playback, so Listening can’t run. Flashcards, sentences and the other modes still work.</p></div>';
    if(!ltVoice && !listenAnyway) return '<div class="done"><div class="ic">🔇</div><h2>No Lithuanian voice on this device</h2><p>Listening is read aloud by your device. Without a Lithuanian voice the words are spoken with the wrong accent, so this mode would teach you the wrong sounds. Install a Lithuanian voice in your system settings, or try this on a phone.</p><div class="rrow"><button type="button" class="btn green" data-act="mode" data-v="flash">Back to flashcards</button><button type="button" class="linkbtn" data-act="listenanyway">Use it anyway</button></div></div>';
    if(!queue.length){
      if(statusF === 'trouble') return '<div class="done"><div class="ic">🌾</div><h2>No trouble words</h2><p>Words you miss are collected here until you get them right again.</p></div>';
      if(statusF === 'known'){
        const n = knownKeys().length;
        if(n) return `<div class="done"><div class="ic">🌾</div><h2>That was every known word</h2><p>You listened to all ${n} known word${n === 1 ? '' : 's'} in this selection.</p><button type="button" class="btn amber" data-act="requeue">Go through them again</button></div>`;
        return '<div class="done"><div class="ic">🌾</div><h2>Nothing here yet</h2><p>Words you know show up here for listening practice.</p></div>';
      }
      return caught();
    }
    const key = queue[0], w = wordsByKey[key];
    if(!activeTask){
      const seen = new Set([w.en.toLowerCase()]), dec = [];
      const same = shuffle(WORDS.filter(x => x.cat === w.cat));
      for(const x of same.concat(shuffle(WORDS))){ const k = x.en.toLowerCase(); if(!seen.has(k)){ seen.add(k); dec.push(x.en); if(dec.length === 3) break; } }
      activeTask = {key, opts: shuffle([w.en, ...dec]), picked:null, spoken:false};
    }
    const done = activeTask.picked !== null, ok = done && activeTask.opts[activeTask.picked] === w.en;
    let reveal = '';
    if(done) reveal = `<div class="big">${esc(w.lt)}</div><div class="pron">${esc(w.pr)}</div>${rootLine(w)}<div class="fb ${ok?'ok':'no'}">${ok ? 'Correct!' : 'Not quite.'} ${esc(w.lt)} means ‘${esc(w.en)}’.</div>`;
    return `<div class="scard"><div class="top"><span class="tag">${esc(w.catName)}</span>${dots(level(key))}</div>
      ${spk(w.lt, true)}
      <div class="snote">${done ? '' : 'Listen, then choose the meaning.'}</div>${reveal}</div>
      ${optGrid(activeTask.opts, activeTask.picked, activeTask.opts.indexOf(w.en), 'lopt')}
      ${done ? '<button type="button" class="btn amber" data-act="listennext">Next</button>' : ''}`;
  }
  function pickListen(i){
    if(activeTask.picked !== null) return;
    const w = wordsByKey[activeTask.key]; activeTask.picked = i;
    const ok = activeTask.opts[i] === w.en; activeTask.ok = ok;
    progress.listen[activeTask.key] = ok ? Math.min(3, level(activeTask.key) + 1) : 0;
    if(ok) hitW(activeTask.key); else missW(activeTask.key);
    tick(); save(); renderStage(); renderChrome();
  }
  function listenNext(){
    const key = queue.shift(), L = level(key);
    if(special()){ if(!activeTask.ok || progress.miss[key]) queue.push(key); }
    else if(L < 3) queue.splice(Math.min(queue.length, activeTask.ok ? 3 + L * 4 : 3), 0, key);
    activeTask = null; render();
  }

  function stageGram(){
    if(!queue.length) return caught();
    const key = queue[0], g = grammarByKey[key];
    if(!activeTask) activeTask = {key, opts: shuffle(g.opts.map((t,i) => ({t, c: i === g.a}))), picked:null};
    const done = activeTask.picked !== null, correct = activeTask.opts.findIndex(o => o.c);
    const ok = done && activeTask.opts[activeTask.picked].c;
    const parts = g.q.split('______');
    const sentence = parts.map(esc).join(done ? `<span class="fill">${esc(g.opts[g.a])}</span>` : '<span class="blank">&nbsp;</span>');
    const fb = done ? `<div class="fb ${ok?'ok':'no'}">${ok ? 'Correct!' : 'Not quite.'} ${esc(g.why)}</div>` : '';
    return `<div class="scard"><div class="top"><span class="tag">${esc(g.catName)}</span>${dots(level(key))}</div>
      <div class="big sent">${sentence}</div><div class="snote">${esc(g.en)}</div>${fb}${done ? spk(g.q.replace('______', g.opts[g.a])) : ''}</div>
      <div class="sub2">${esc(g.intro || '')}</div>
      ${optGrid(activeTask.opts.map(o => o.t), activeTask.picked, correct, 'gopt')}
      ${done ? '<button type="button" class="btn amber" data-act="gramnext">Next</button>' : ''}`;
  }
  function pickGram(i){
    if(activeTask.picked !== null) return;
    activeTask.picked = i; const ok = activeTask.opts[i].c; activeTask.ok = ok;
    progress.gram[activeTask.key] = ok ? Math.min(3, level(activeTask.key) + 1) : 0;
    tick(); save(); renderStage(); renderChrome();
  }
  function gramNext(){
    const key = queue.shift(), L = level(key);
    if(L < 3) queue.splice(Math.min(queue.length, activeTask.ok ? 3 + L * 4 : 3), 0, key);
    activeTask = null; render();
  }

  function newMatch(){
    stopTimer();
    let pool = WORDS.filter(w => inScope(w.cat));
    if(pool.length < 4) pool = WORDS;
    const used = new Set(), pairs = [];
    for(const w of shuffle(pool)){
      if(used.has(w.lt.toLowerCase()) || used.has('en:' + w.en.toLowerCase())) continue;
      used.add(w.lt.toLowerCase()); used.add('en:' + w.en.toLowerCase());
      pairs.push({lt:w.lt, en:w.en}); if(pairs.length === 4) break;
    }
    matchGame = {pairs, left:shuffle([0,1,2,3]), right:shuffle([0,1,2,3]), done:new Set(), selL:null, selR:null, bad:null, start:performance.now(), finished:false, elapsed:0, newBest:false};
    timerId = setInterval(() => { const t = $('#timer'); if(t && matchGame && !matchGame.finished && !matchGame.pausedAt) t.textContent = ((performance.now() - matchGame.start) / 1000).toFixed(1) + 's'; }, 100);
  }
  function stopTimer(){ if(timerId){ clearInterval(timerId); timerId = null; } }
  function stageMatch(){
    if(!matchGame) newMatch();
    if(matchGame.finished){
      return `<div class="done"><div class="ic">⚡</div><div class="timer">${matchGame.elapsed.toFixed(1)}s</div>
        <p>${matchGame.newBest ? 'New best time for this set!' : `Your best for this set is still ${progress.match[scopeKey()].toFixed(1)}s.`}</p>
        <button type="button" class="btn amber" data-act="again">Play again</button></div>`;
    }
    const col = (order, side, sel, key) => order.map(i => {
      let c = '';
      if(matchGame.done.has(i)) c = 'ok'; else if(matchGame.bad && matchGame.bad[side] === i) c = 'bad'; else if(sel === i) c = 'sel';
      return `<button type="button" class="mbtn ${c}" data-act="m" data-side="${side}" data-i="${i}" ${matchGame.done.has(i)?'disabled':''}>${esc(matchGame.pairs[i][key])}</button>`;
    }).join('');
    return `<div class="timer" id="timer">${((performance.now() - matchGame.start) / 1000).toFixed(1)}s</div>
      <div class="mgrid"><div class="mcol">${col(matchGame.left,'L',matchGame.selL,'lt')}</div><div class="mcol">${col(matchGame.right,'R',matchGame.selR,'en')}</div></div>`;
  }
  function matchClick(side, i){
    if(!matchGame || matchGame.finished || matchGame.bad || matchGame.done.has(i)) return;
    if(side === 'L') matchGame.selL = matchGame.selL === i ? null : i; else matchGame.selR = matchGame.selR === i ? null : i;
    if(matchGame.selL !== null && matchGame.selR !== null){
      if(matchGame.selL === matchGame.selR){
        matchGame.done.add(matchGame.selL); matchGame.selL = matchGame.selR = null;
        if(matchGame.done.size === 4){
          matchGame.finished = true; matchGame.elapsed = Math.round((performance.now() - matchGame.start) / 100) / 10; stopTimer();
          const b = progress.match[scopeKey()];
          if(b === undefined || matchGame.elapsed < b){ progress.match[scopeKey()] = matchGame.elapsed; matchGame.newBest = true; }
          tick(4); save(); renderChrome();
        }
      }else{
        matchGame.bad = {L:matchGame.selL, R:matchGame.selR}; matchGame.selL = matchGame.selR = null;
        const m = matchGame; setTimeout(() => { if(matchGame === m){ matchGame.bad = null; renderStage(); } }, 450);
      }
    }
    renderStage();
  }


  const SC_LEN = 5;
  function newScramble(){
    stopTimer();
    const ok = w => /^\p{L}{4,10}$/u.test(w.lt.normalize('NFC'));
    let pool = WORDS.filter(w => inScope(w.cat) && ok(w));
    if(pool.length < SC_LEN) pool = WORDS.filter(ok);
    const seen = new Set(), picks = [];
    for(const w of shuffle(pool)){ const k = w.lt.toLowerCase(); if(seen.has(k)) continue; seen.add(k); picks.push(w.key); if(picks.length === SC_LEN) break; }
    scrambleGame = {picks, i:0, score:0, start:performance.now(), finished:false, elapsed:0, newBest:false, solved:0};
    nextScrambleWord();
    timerId = setInterval(() => { const t = $('#timer'); if(t && scrambleGame && !scrambleGame.finished && !scrambleGame.pausedAt) t.textContent = ((performance.now() - scrambleGame.start) / 1000).toFixed(1) + 's'; }, 100);
  }
  function nextScrambleWord(){
    const w = wordsByKey[scrambleGame.picks[scrambleGame.i]], target = w.lt.normalize('NFC').toLowerCase();
    const letters = Array.from(target);
    let tiles = shuffle(letters.map((ch,id) => ({id, ch})));
    for(let n = 0; n < 8 && tiles.map(x => x.ch).join('') === target; n++) tiles = shuffle(tiles);
    scrambleGame.target = target; scrambleGame.tiles = tiles; scrambleGame.ans = []; scrambleGame.hints = 0; scrambleGame.state = 'play'; scrambleGame.bad = false; scrambleGame.pts = 0;
  }
  function stageScramble(){
    if(!scrambleGame) newScramble();
    if(scrambleGame.finished){
      return `<div class="done"><div class="ic">\ud83d\udd24</div><div class="timer">${scrambleGame.score} / ${SC_LEN * 10}</div>
        <p>${scrambleGame.newBest ? 'New best score for this set!' : `Your best score for this set is ${progress.scramble[scopeKey()]} / ${SC_LEN * 10}.`} ${scrambleGame.solved} of ${scrambleGame.picks.length} words solved in ${scrambleGame.elapsed.toFixed(1)}s.</p>
        <button type="button" class="btn amber" data-act="sc-again">Play again</button></div>`;
    }
    const w = wordsByKey[scrambleGame.picks[scrambleGame.i]], used = new Set(scrambleGame.ans.map(a => a.id));
    const ansHtml = scrambleGame.ans.map(a => `<button type="button" class="tile" data-act="sc-untile" data-v="${a.id}" ${scrambleGame.state !== 'play' ? 'disabled' : ''}>${esc(a.ch)}</button>`).join('');
    const bankHtml = scrambleGame.tiles.filter(x => !used.has(x.id)).map(x => `<button type="button" class="tile" data-act="sc-tile" data-v="${x.id}">${esc(x.ch)}</button>`).join('');
    let fb = '';
    if(scrambleGame.state === 'right') fb = `<div class="fb ok">Correct! ${esc(w.lt)} (${esc(w.pr)}) +${scrambleGame.pts}</div>${rootLine(w)}`;
    else if(scrambleGame.state === 'skip') fb = `<div class="fb no">The word is ${esc(w.lt)} (${esc(w.pr)})</div>${rootLine(w)}`;
    else if(scrambleGame.bad) fb = `<div class="fb no">Not quite. Change the order and try again.</div>`;
    const cls = scrambleGame.state === 'right' ? 'ok' : (scrambleGame.state === 'skip' || scrambleGame.bad) ? 'no' : '';
    const over = scrambleGame.state !== 'play';
    const last = scrambleGame.i === scrambleGame.picks.length - 1;
    return `<div class="timer" id="timer">${((performance.now() - scrambleGame.start) / 1000).toFixed(1)}s</div>
      <div class="sub2">Word ${scrambleGame.i + 1} of ${scrambleGame.picks.length} \u00b7 Score ${scrambleGame.score}</div>
      <div class="scard"><div class="top"><span class="tag">${esc(w.catName)}</span><span class="badge">${scrambleGame.target.length} letters</span></div>
        <div class="big">${esc(w.en)}</div>
        <div class="snote">${over ? '' : 'Tap the letters to spell the Lithuanian word.'}</div>
        <div class="ansline ${cls}" aria-label="Your word">${ansHtml}</div>
        ${fb}${over ? spk(w.lt) : ''}</div>
      ${over ? '' : `<div class="tiles" aria-label="Letters">${bankHtml}</div>`}
      ${over ? `<button type="button" class="btn amber" data-act="sc-next">${last ? 'See score' : 'Next word'}</button>`
        : `<div class="row"><button type="button" class="btn red" data-act="sc-clear" ${scrambleGame.ans.length ? '' : 'disabled'}>Clear</button><button type="button" class="btn green" data-act="sc-hint">Hint (-3)</button><button type="button" class="linkbtn" data-act="sc-skip">Skip</button></div>`}`;
  }
  function checkScramble(){
    if(scrambleGame.ans.length !== scrambleGame.tiles.length) return;
    const got = scrambleGame.ans.map(a => a.ch).join('');
    if(got === scrambleGame.target){
      scrambleGame.pts = Math.max(1, 10 - 3 * scrambleGame.hints); scrambleGame.score += scrambleGame.pts; scrambleGame.solved++; scrambleGame.state = 'right'; scrambleGame.bad = false; tick(); save();
      speak(wordsByKey[scrambleGame.picks[scrambleGame.i]].lt);
    }else scrambleGame.bad = true;
  }
  function finishScramble(){
    scrambleGame.finished = true; scrambleGame.elapsed = Math.round((performance.now() - scrambleGame.start) / 100) / 10; stopTimer();
    const b = progress.scramble[scopeKey()];
    if(b == null || scrambleGame.score > b){ progress.scramble[scopeKey()] = scrambleGame.score; scrambleGame.newBest = true; }
    save();
  }
  function scrambleHint(){
    let k = 0;
    while(k < scrambleGame.ans.length && scrambleGame.ans[k].ch === scrambleGame.target[k]) k++;
    scrambleGame.ans = scrambleGame.ans.slice(0, k);
    const used = new Set(scrambleGame.ans.map(a => a.id));
    const t = scrambleGame.tiles.find(x => !used.has(x.id) && x.ch === scrambleGame.target[k]);
    if(t){ scrambleGame.ans.push(t); scrambleGame.hints++; scrambleGame.bad = false; checkScramble(); }
  }

  const backupMessage = s => { const m = $('#bkmsg'); if(m) m.textContent = s; };
  function showBackupText(){ const t = $('#bk'); if(!t) return; t.value = JSON.stringify({app:'lietuviu-kalba', version:1, profile:user || 'guest', progress:progress, exam:EXAM.exportData()}); t.focus(); t.select(); backupMessage('Copy this text and keep it somewhere safe.'); }
  function applyBackup(text){
    let d;
    try{ d = JSON.parse(text); }catch(e){ return 'That isn\u2019t a valid backup. Use a file saved from this app, or paste the whole backup text.'; }
    const p = d && d.progress ? d.progress : d;
    if(!p || typeof p !== 'object' || !p.flash || !p.sent) return 'That doesn\u2019t look like a progress backup from this app.';
    pendingBackup = fixProg(p); pendingExam = (d && d.exam && typeof d.exam === 'object') ? d.exam : null;
    renderChrome();
    return 'Check the comparison below, then choose Replace or Cancel.';
  }
  function confirmBackup(){
    if(!pendingBackup) return;
    progress = pendingBackup; pendingBackup = null;
    if(pendingExam){ EXAM.importData(pendingExam); pendingExam = null; }
    save(); activeTask = null; matchGame = null; rebuild(); render();
    backupMessage('Progress loaded: ' + progressSummary(progress) + '.');
  }
  function restoreBackupText(){ const t = $('#bk'); const msg = applyBackup(t ? t.value : ''); backupMessage(msg); }
  function loadBackupFile(file){
    if(!file) return;
    const r = new FileReader();
    r.onload = () => { const msg = applyBackup(String(r.result || '')); backupMessage(msg); };
    r.onerror = () => backupMessage('Couldn\u2019t read that file.');
    r.readAsText(file);
  }
  async function exportProgress(){
    const profile = user || 'guest';
    const data = JSON.stringify({app:'lietuviu-kalba', version:1, profile, exportedAt:new Date().toISOString(), progress:progress, exam:EXAM.exportData()}, null, 1);
    const filename = `lietuviu-kalba-progress-${profile}-${today()}.json`;
    try{
      const url = URL.createObjectURL(new Blob([data], {type:'application/json'})), a = document.createElement('a');
      a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      backupMessage('Downloading ' + filename + '. If nothing happens, use \u201cShow backup text\u201d and copy it instead.');
    }catch(e){ backupMessage('Your browser blocked the download. Use \u201cShow backup text\u201d and copy it instead.'); }
  }

  document.addEventListener('mousedown', e => { if(e.target.closest('.dia button')) e.preventDefault(); });
  document.addEventListener('change', e => {
    if(e.target.id === 'auto'){ prefs.auto = e.target.checked; savePrefs(); }
    if(e.target.id === 'theme'){ prefs.theme = e.target.value; savePrefs(); applyTheme(); }
    else if(e.target.id === 'bkfile'){ const f = e.target.files && e.target.files[0]; loadBackupFile(f); e.target.value = ''; }
  });
  document.addEventListener('input', e => {
    if(e.target.id === 'search'){ searchQ = e.target.value.trim(); renderStage(); }
  });
  const clickActions = {
    'authtab': (v, t) => { setAuthMode(v); },
    'forgot': (v, t) => { setAuthMode(authMode === 'reset' ? 'login' : 'reset'); },
    'guest': (v, t) => { enter(null); },
    'speak': (v, t) => { speak(t.dataset.t); },
    'topic': () => { topicOpen = !topicOpen; renderChrome(); },
    'searchtoggle': () => { searchOpen = !searchOpen; if(!searchOpen && searchQ){ searchQ = ''; $('#search').value = ''; renderStage(); } renderChrome(); if(searchOpen) $('#search').focus(); },
    'mode': (v, t) => { topicOpen = false; resetAsk = false; mode = v; searchQ = ''; $('#search').value = ''; if(v !== 'exam' && v !== 'photos'){ validCat(); rebuild(); } render(); },
    'photo': (v, t) => { const [id, m] = v.split('|'); mode = m; groupId = 'pictures'; catId = id; topicOpen = false; searchQ = ''; $('#search').value = ''; validCat(); rebuild(); render(); },
    'grp': (v, t) => { if(v === 'all') topicOpen = false; groupId = v; catId = 'all'; searchQ = ''; $('#search').value = ''; rebuild(); render(); },
    'cat': (v, t) => { topicOpen = false; catId = v; searchQ = ''; $('#search').value = ''; rebuild(); render(); },
    'week': () => { weekOpen = !weekOpen; renderChrome(); },
    'stat': (v, t) => { topicOpen = false; statusF = (statusF === v ? '' : v); searchQ = ''; $('#search').value = ''; rebuild(); render(); },
    'flip': (v, t) => { if(!activeTask) return; const first = !activeTask.seen; activeTask.flipped = !activeTask.flipped; activeTask.seen = true; $('#flip').classList.toggle('flipped', activeTask.flipped); $('#acts').classList.add('show'); if(first && activeTask.flipped && prefs.auto && activeTask.dir === 'en') speak(wordsByKey[activeTask.key].lt); },
    'know': (v, t) => { recordRecognition(true); },
    'dont': (v, t) => { recordRecognition(false); },
    'requeue': (v, t) => { rebuild(); render(); },
    'already': (v, t) => { already(); },
    'check': (v, t) => { check(); },
    'typenext': (v, t) => { typeNext(); },
    'dia': (v, t) => { const inp = $('#tin'); if(inp && !inp.disabled){ const s = inp.selectionStart ?? inp.value.length, en = inp.selectionEnd ?? s; inp.setRangeText(v, s, en, 'end'); inp.focus(); } },
    'opt': (v, t) => { pickOpt(+v); },
    'sentnext': (v, t) => { sentNext(); },
    'tile': (v, t) => { const f = fullByKey[activeTask.key]; const b = activeTask.bank.find(x => x.id === +v); if(b && !activeTask.ans.some(x => x.id === b.id)){ activeTask.ans.push(b); renderStage(); } },
    'untile': (v, t) => { activeTask.ans = activeTask.ans.filter(x => x.id !== +v); renderStage(); },
    'fullclear': (v, t) => { activeTask.ans = []; renderStage(); },
    'fullcheck': (v, t) => { fullCheck(); },
    'fullnext': (v, t) => { fullNext(); },
    'lopt': (v, t) => { pickListen(+v); },
    'listennext': (v, t) => { listenNext(); },
    'gopt': (v, t) => { pickGram(+v); },
    'gramnext': (v, t) => { gramNext(); },
    'm': (v, t) => { matchClick(t.dataset.side, +t.dataset.i); },
    'sc-tile': (v, t) => { const x = scrambleGame && scrambleGame.tiles.find(z => z.id === +v); if(x && scrambleGame.state === 'play' && !scrambleGame.ans.some(a => a.id === x.id)){ scrambleGame.ans.push(x); scrambleGame.bad = false; checkScramble(); renderStage(); renderChrome(); } },
    'sc-untile': (v, t) => { if(scrambleGame && scrambleGame.state === 'play'){ scrambleGame.ans = scrambleGame.ans.filter(a => a.id !== +v); scrambleGame.bad = false; renderStage(); } },
    'sc-clear': (v, t) => { if(scrambleGame && scrambleGame.state === 'play'){ scrambleGame.ans = []; scrambleGame.bad = false; renderStage(); } },
    'sc-hint': (v, t) => { if(scrambleGame && scrambleGame.state === 'play'){ scrambleHint(); renderStage(); } },
    'sc-skip': (v, t) => { if(scrambleGame && scrambleGame.state === 'play'){ scrambleGame.state = 'skip'; scrambleGame.ans = Array.from(scrambleGame.target).map((ch,i) => ({id:-1 - i, ch})); scrambleGame.bad = false; renderStage(); } },
    'sc-next': (v, t) => { if(scrambleGame){ if(scrambleGame.i >= scrambleGame.picks.length - 1){ finishScramble(); renderChrome(); } else { scrambleGame.i++; nextScrambleWord(); } renderStage(); } },
    'sc-again': (v, t) => { scrambleGame = null; renderStage(); },
    'again': (v, t) => { matchGame = null; renderStage(); },
    'reviewask': (v, t) => { restartAsk = true; renderStage(); },
    'reviewno': (v, t) => { restartAsk = false; renderStage(); },
    'reviewyes': (v, t) => {
      restartAsk = false;
      deckKeys().forEach(k => { if(mode === 'flash') delete progress.flash[k]; else delete progress[mode][k]; });
      save(); rebuild(); render();
    },
    'goal': (v, t) => { const g = [10, 20, 30, 50, 100]; progress.goal = g[(g.indexOf(progress.goal) + 1) % g.length]; awardStreak(); save(); renderChrome(); },
    'resetask': (v, t) => { resetAsk = true; renderChrome(); },
    'resetno': (v, t) => { resetAsk = false; renderChrome(); },
    'resetyes': (v, t) => { if(mode === 'exam'){ EXAM.clearData(); resetAsk = false; render(); return; } if(mode === 'photos'){ resetAsk = false; renderChrome(); return; } progress[mode] = {}; if(mode === 'flash') progress.miss = {};
        resetAsk = false; save(); rebuild(); render(); },
    'bkopen': (v, t) => { backupOpen = true; renderChrome(); },
    'bkclose': (v, t) => { backupOpen = false; pendingBackup = null; pendingExam = null; renderChrome(); },
    'bkshow': (v, t) => { showBackupText(); },
    'bkrestore': (v, t) => { restoreBackupText(); },
    'offeryes': (v, t) => { progress = guestOffer; guestOffer = null; store.del('lt_prog_guest'); save(); rebuild(); render(); },
    'offerno': (v, t) => { guestOffer = null; renderOffer(); },
    'listenanyway': (v, t) => { listenAnyway = true; renderStage(); },
    'wordtap': (v, t) => { if(!activeTask) return; activeTask.gloss = t.dataset.w.toLowerCase(); activeTask.glossShown = t.dataset.w; renderStage(); },
    'bkapply': (v, t) => { confirmBackup(); },
    'bkcancel': (v, t) => { pendingBackup = null; pendingExam = null; renderChrome(); backupMessage('Nothing was changed.'); },
    'bkdl': (v, t) => { exportProgress(); },
    'bkpick': (v, t) => { const f = $('#bkfile'); if(f) f.click(); },
    'logout': (v, t) => { logout(); },
    'exit': (v, t) => { $('#app').hidden = true; $('#auth').hidden = false; stopTimer(); setAuthMode('login'); },
  };
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-act]'); if(!t) return;
    const handler = clickActions[t.dataset.act];
    if(handler) handler(t.dataset.v, t);
  });
  document.addEventListener('keydown', e => {
    if(e.target.id === 'tin' && e.key === 'Enter'){ e.preventDefault(); check(); }
    else if(e.target.id === 'flip' && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); e.target.click(); }
    else if(e.target.id !== 'tin' && e.target.id !== 'search' && e.key === 'Enter' && activeTask && activeTask.result && document.activeElement === document.body){ const b = $('[data-act="typenext"]'); if(b) b.click(); }
  });
  $('#authform').addEventListener('submit', submitAuth);
  $('#au-submit').addEventListener('click', () => submitAuth());
  ['#au-user', '#au-pass'].forEach(sel => $(sel).addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); submitAuth(); } }));

  (function boot(){
    const r = store.get('lt_remember');
    if(r){
      if(users()[r]){ enter(r); return; }
      $('#au-note').textContent = 'Couldn’t find your saved account — log in or continue as guest.';
    }
    setAuthMode('login');
  $('#auth').hidden = false;
  })();
}

Promise.all(['data.json', 'grammar.json', 'forms.json'].map(f => fetch(f).then(r => { if(!r.ok) throw new Error(f); return r.json(); })))
  .then(([cats, grammar, forms]) => startApp(cats, grammar, forms))
  .catch(() => {
    const box = document.createElement('div');
    box.className = 'loaderror';
    box.innerHTML = '<h2>The app could not load its data</h2><p>This page needs to be served from a web server, because browsers block loading data files when you open <code>index.html</code> straight from disk.</p><p>Run <code>python3 -m http.server</code> in this folder and open <code>http://localhost:8000</code>, or open <code>lithuanian-flashcards.html</code>, which works without a server.</p>';
    document.body.prepend(box);
  });

/* Add-to-home-screen helper: one tap on Android, a two-step hint on iPhone */
(function(){
  const box = document.getElementById('install'); if(!box) return;
  if(!/^https?:$/.test(location.protocol)) return;
  const standalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
  const KEY = 'lt_install_dismissed';
  const dismissed = () => { try{ return localStorage.getItem(KEY) === '1'; }catch(e){ return false; } };
  let deferred = null, late = false;
  const android = /android/i.test(navigator.userAgent);
  setTimeout(() => { late = true; show(); }, 3000);
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function show(force){
    if(standalone() || (!force && dismissed())){ box.innerHTML = ''; return; }
    if(deferred){
      box.innerHTML = '<div class="installbar"><span>Install this app on your phone</span><button type="button" class="btn green" id="inst-go">Install</button><button type="button" class="linkbtn" id="inst-x">Not now</button></div>';
    }else if(ios){
      box.innerHTML = '<div class="installbar"><span>To install: tap <b>Share</b> <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px"><path d="M12 15V3M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>, then <b>Add to Home Screen</b></span><button type="button" class="linkbtn" id="inst-x">Got it</button></div>';
    }else if(force && !ios){
      box.innerHTML = '<div class="installbar"><span>To install: open the browser menu <b>\u22ee</b>, then tap <b>Install app</b> or <b>Add to Home screen</b>. If you only see \u201cAdd to Home screen\u201d, that works too. Brave and Firefox don\u2019t show a one-tap button.</span><button type="button" class="linkbtn" id="inst-x">Got it</button></div>';
    }else if(android && late){
      box.innerHTML = '<div class="installbar"><span>To install: open the browser menu <b>\u22ee</b>, then tap <b>Install app</b> or <b>Add to Home screen</b></span><button type="button" class="linkbtn" id="inst-x">Got it</button></div>';
    }else box.innerHTML = '';
  }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; show(); });
  window.addEventListener('appinstalled', () => { deferred = null; box.innerHTML = ''; });
  box.addEventListener('click', e => {
    if(e.target.id === 'inst-go' && deferred){ deferred.prompt(); deferred.userChoice.finally(() => { deferred = null; box.innerHTML = ''; }); }
    if(e.target.id === 'inst-x'){ try{ localStorage.setItem(KEY, '1'); }catch(err){} box.innerHTML = ''; }
  });
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-act=installhelp]'); if(b){ try{ localStorage.removeItem(KEY); }catch(err){} show(true); window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'}); } });
  new MutationObserver(() => document.body.classList.toggle('has-install', !!box.firstElementChild)).observe(box, {childList: true});
  show();
})();

/* Anonymous visit/install counting (GoatCounter). Set GC_CODE to your site code to turn it on; leave '' to send nothing. */
(function(){
  const GC_CODE = 'lithuanian';
  if(!GC_CODE || !/^https?:$/.test(location.protocol)) return;
  const note = document.getElementById('au-stats'); if(note) note.hidden = false;
  const sc = document.createElement('script');
  sc.async = true; sc.src = 'https://gc.zgo.at/count.js';
  sc.dataset.goatcounter = 'https://' + GC_CODE + '.goatcounter.com/count';
  document.head.appendChild(sc);
  window.addEventListener('appinstalled', () => {
    try{ window.goatcounter && window.goatcounter.count({path:'app-installed', title:'App installed', event:true}); }catch(e){}
  });
  if(navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches)){
    sc.addEventListener('load', () => { try{ window.goatcounter.count({path:'opened-as-app', title:'Opened as installed app', event:true}); }catch(e){} });
  }
})();
