/* Exam preparation: written drills, a mock test and speaking practice.
   initExam(ctx) returns {mount(stageElement)}. It keeps its own state and storage key. */
function initExam(ctx){
  const {esc, speak, hasTTS} = ctx;
  const KEY = 'lt_exam_v1';
  let saved = {best: {}, scripts: {}, mocks: [], name: '', qTeacher: '', runs: {}, last: {}, qa: {}, done: {}, mistakes: {}, qaMiss: {}};
  try{ const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if(s && typeof s === 'object'){ saved.best = s.best || {}; saved.scripts = s.scripts || {}; saved.mocks = Array.isArray(s.mocks) ? s.mocks.slice(-10) : []; ['runs','last','qa','done','mistakes','qaMiss'].forEach(k => { if(s[k] && typeof s[k] === 'object') saved[k] = s[k]; }); if(typeof s.name === 'string') saved.name = s.name; if(typeof s.qTeacher === 'string') saved.qTeacher = s.qTeacher; } }catch(e){}
  const persist = () => { try{ localStorage.setItem(KEY, JSON.stringify(saved)); }catch(e){} };

  /* ---------- helpers ---------- */
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  const shuffle = a => { const b = a.slice(); for(let i = b.length - 1; i > 0; i--){ const j = rnd(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const norm = s => String(s).toLowerCase().replace(/[.,!?;:"'„“”()\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
  function gradeText(input, answers){
    const n = norm(input); if(!n) return 'no';
    let near = false;
    for(const a of answers){ const m = norm(a); if(n === m) return 'ok'; if(fold(n) === fold(m)) near = true; }
    return near ? 'near' : 'no';
  }
  const others = (arr, keep, k) => shuffle(arr.filter(x => x !== keep)).slice(0, k);
  const mcq = (part, prompt, correct, wrong, extra) => {
    const options = shuffle([correct, ...wrong]);
    return Object.assign({part, kind: 'mcq', prompt, options, answer: options.indexOf(correct), show: correct}, extra || {});
  };
  const typed = (part, prompt, answers, extra) => Object.assign({part, kind: 'type', prompt, answers, show: answers[0]}, extra || {});
  const spkBtn = (t, big) => hasTTS ? `<button type="button" class="spk ${big ? 'lg' : ''}" data-ex="say" data-t="${esc(t)}" aria-label="Play audio"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54z"/></svg></button>` : '';

  /* ---------- course material ---------- */
  const MONTHS = [['January','sausis','sausio'],['February','vasaris','vasario'],['March','kovas','kovo'],['April','balandis','balandžio'],['May','gegužė','gegužės'],['June','birželis','birželio'],['July','liepa','liepos'],['August','rugpjūtis','rugpjūčio'],['September','rugsėjis','rugsėjo'],['October','spalis','spalio'],['November','lapkritis','lapkričio'],['December','gruodis','gruodžio']];
  const DAYS = [['Monday','pirmadienis'],['Tuesday','antradienis'],['Wednesday','trečiadienis'],['Thursday','ketvirtadienis'],['Friday','penktadienis'],['Saturday','šeštadienis'],['Sunday','sekmadienis']];
  const COLORS = [['red',['raudona','raudonas']],['blue',['mėlyna','mėlynas']],['green',['žalia','žalias']],['yellow',['geltona','geltonas']],['white',['balta','baltas']],['black',['juoda','juodas']],['pink',['rožinė','rožinis']],['orange',['oranžinė','oranžinis']],['brown',['ruda','rudas']],['grey',['pilka','pilkas']],['purple',['violetinė','violetinis']],['light blue',['žydra','žydras']],['golden',['auksinė','auksinis']],['silver',['sidabrinė','sidabrinis']]];
  const COLOR_SENT = [['Snow is white.','Sniegas yra ____.',['baltas']],['Grass is green.','Žolė yra ____.',['žalia']],['The sky is blue.','Dangus yra ____.',['mėlynas']],['The sun is yellow.','Saulė yra ____.',['geltona']],['A tomato is red.','Pomidoras yra ____.',['raudonas']],['A carrot is orange.','Morka yra ____.',['oranžinė']],['Chocolate is brown.','Šokoladas yra ____.',['rudas']],['A lemon is yellow.','Citrina yra ____.',['geltona']],['The cloud is grey.','Debesis yra ____.',['pilkas']],['Milk is white.','Pienas yra ____.',['baltas']]];
  const ONES = ['nulis','vienas','du','trys','keturi','penki','šeši','septyni','aštuoni','devyni','dešimt','vienuolika','dvylika','trylika','keturiolika','penkiolika','šešiolika','septyniolika','aštuoniolika','devyniolika'];
  const TENS = ['','','dvidešimt','trisdešimt','keturiasdešimt','penkiasdešimt','šešiasdešimt','septyniasdešimt','aštuoniasdešimt','devyniasdešimt'];
  const HUNDREDS = ['','šimtas','du šimtai','trys šimtai','keturi šimtai','penki šimtai','šeši šimtai','septyni šimtai','aštuoni šimtai','devyni šimtai'];
  function numWords(n){
    if(n === 1000) return 'tūkstantis';
    if(n === 0) return 'nulis';
    const parts = [];
    if(n >= 100){ parts.push(HUNDREDS[Math.floor(n / 100)]); n %= 100; }
    if(n >= 20){ parts.push(TENS[Math.floor(n / 10)]); n %= 10; }
    if(n > 0) parts.push(ONES[n]);
    return parts.join(' ');
  }
  const euroWord = n => { const t = n % 100, u = n % 10; return (u === 1 && t !== 11) ? 'euras' : (u === 0 || (t >= 11 && t <= 19)) ? 'eurų' : 'eurai'; };
  const DIR_TYPED = [
    ['left (the noun)', ['kairė']], ['right (the noun)', ['dešinė']], ['straight ahead', ['tiesiai']],
    ['to the left', ['į kairę']], ['to the right', ['į dešinę']], ['on the left', ['kairėje']], ['on the right', ['dešinėje']],
    ['Go straight.', ['Eikite tiesiai']], ['Turn left.', ['Sukite į kairę','Pasukite į kairę']], ['Turn right.', ['Sukite į dešinę','Pasukite į dešinę']],
    ['The station is on the left.', ['Stotis yra kairėje','Kairėje yra stotis']], ['The bank is on the right.', ['Bankas yra dešinėje','Dešinėje yra bankas']],
    ['Where is the station?', ['Kur yra stotis']], ['Excuse me, where is the post office?', ['Atsiprašau, kur yra paštas']],
    ['Is it far?', ['Ar tai toli']], ['Go straight to the traffic light.', ['Eikite tiesiai iki šviesoforo']]
  ];
  const DIR_UNDER = [
    ['Eikite tiesiai iki šviesoforo.','Go straight to the traffic light.'], ['Už kampo sukite į dešinę.','Turn right around the corner.'],
    ['Parduotuvė yra kairėje.','The shop is on the left.'], ['Bankas yra šalia pašto.','The bank is next to the post office.'],
    ['Stotelė yra priešais parduotuvę.','The stop is opposite the shop.'], ['Tai nėra toli.','It is not far.'],
    ['Sankryžoje sukite į kairę.','Turn left at the crossroads.'], ['Eikite tiesiai, paskui sukite į dešinę.','Go straight, then turn right.'],
    ['Muziejus yra netoli aikštės.','The museum is near the square.'], ['Ar tai toli?','Is it far?'], ['Aikštė yra dešinėje.','The square is on the right.'],
    ['Sukite į kairę.','Turn left.'], ['Sukite į dešinę.','Turn right.']
  ];

  /* ---------- question makers ---------- */
  const mk = {};
  mk.cal = () => {
    const t = rnd(8);
    if(t === 0){ const m = pick(MONTHS); return typed('Months and weekdays', `How do you say <b>${m[0]}</b> in Lithuanian?`, [m[1]]); }
    if(t === 1){ const d = pick(DAYS); return typed('Months and weekdays', `How do you say <b>${d[0]}</b> in Lithuanian?`, [d[1]]); }
    if(t === 2){ const m = pick(MONTHS); return mcq('Months and weekdays', `What does <b>${m[1]}</b> mean?`, m[0], others(MONTHS.map(x => x[0]), m[0], 3), {say: m[1]}); }
    if(t === 3){ const d = pick(DAYS); return mcq('Months and weekdays', `What does <b>${d[1]}</b> mean?`, d[0], others(DAYS.map(x => x[0]), d[0], 3), {say: d[1]}); }
    if(t === 4){ const i = rnd(12); return typed('Months and weekdays', `Which month comes <b>after ${MONTHS[i][1]}</b>? Write it in Lithuanian.`, [MONTHS[(i + 1) % 12][1]]); }
    if(t === 5){ const i = rnd(7); return typed('Months and weekdays', `Which day comes <b>before ${DAYS[i][1]}</b>? Write it in Lithuanian.`, [DAYS[(i + 6) % 7][1]]); }
    if(t === 6){ const i = rnd(7); const next = rnd(2); return typed('Months and weekdays', next ? `Šiandien ${DAYS[i][1]}. Rytoj yra ____.` : `Šiandien ${DAYS[i][1]}. Vakar buvo ____.`, [DAYS[(i + (next ? 1 : 6)) % 7][1]], {note: next ? 'Rytoj = tomorrow' : 'Vakar = yesterday'}); }
    const i = rnd(12); return typed('Months and weekdays', `Which month is number <b>${i + 1}</b> of the year? Write it in Lithuanian.`, [MONTHS[i][1]]);
  };
  mk.col = () => {
    const t = rnd(4);
    if(t === 0 || t === 1){ const c = pick(COLORS); return typed('Colours', `How do you say <b>${c[0]}</b> in Lithuanian?`, c[1], {note: 'Both masculine (-as, -is) and feminine (-a, -ė) forms are accepted.'}); }
    if(t === 2){ const c = pick(COLORS); return mcq('Colours', `What colour is <b>${c[1][0]}</b>?`, c[0], others(COLORS.map(x => x[0]), c[0], 3), {say: c[1][0]}); }
    const s = pick(COLOR_SENT); return typed('Colours', `${s[0]}<br><span class="ex-lt">${esc(s[1])}</span>`, s[2], {note: 'The ending must match the noun (masculine -as / feminine -a).'});
  };
  const monthIdx = () => rnd(12);
  const daysIn = (y, m) => new Date(y, m + 1, 0).getDate();
  function dateParts(){ const y = 2024 + rnd(5), m = monthIdx(), d = 1 + rnd(daysIn(y, m)); return {y, m, d}; }
  const dateLt = (p, withYear) => (withYear ? `${p.y} m. ` : '') + `${MONTHS[p.m][2]} ${p.d} d.`;
  const dateEn = (p, withYear) => `${p.d} ${MONTHS[p.m][0]}${withYear ? ' ' + p.y : ''}`;
  function gradeDate(p, withYear){
    return input => {
      const tokens = norm(input).split(' ').filter(t => t && t !== 'm' && t !== 'd');
      const nums = tokens.filter(t => /^\d+$/.test(t)), words = tokens.filter(t => !/^\d+$/.test(t));
      const dayOk = withYear ? (nums.length === 2 && nums[0] === String(p.y) && nums[1] === String(p.d)) : (nums.length === 1 && nums[0] === String(p.d));
      if(!dayOk || words.length !== 1) return 'no';
      if(words[0] === norm(MONTHS[p.m][2])) return 'ok';
      return fold(words[0]) === fold(norm(MONTHS[p.m][2])) ? 'near' : 'no';
    };
  }
  mk.date = () => {
    const t = rnd(5);
    if(t <= 1){ const p = dateParts(), wy = t === 0; return typed('Writing dates', `Write this date in Lithuanian: <b>${dateEn(p, wy)}</b>`, [dateLt(p, wy)], {grade: gradeDate(p, wy), note: 'Pattern: year m. month(genitive) day d. The month is in lowercase.'}); }
    if(t === 2){ const m = monthIdx(); return typed('Writing dates', `Put the month into the form used in dates: <b>${MONTHS[m][1]}</b> → ____ 5 d.`, [MONTHS[m][2]], {note: 'In dates the month is in the genitive: sausis → sausio.'}); }
    if(t === 3){ const p = dateParts(); const wrong = []; while(wrong.length < 3){ const q = dateParts(); const s = dateEn(q, true); if(s !== dateEn(p, true) && !wrong.includes(s)) wrong.push(s); } return mcq('Writing dates', `Which date is this?<br><span class="ex-lt">${esc(dateLt(p, true))}</span>`, dateEn(p, true), wrong); }
    const m = monthIdx(), d = 1 + rnd(daysIn(2026, m)); return typed('Writing dates', `Kada jūsų gimtadienis? Answer with a date: your birthday is <b>${d} ${MONTHS[m][0]}</b>.`, [`${MONTHS[m][2]} ${d} d.`], {grade: gradeDate({y: 0, m, d}, false), note: 'For example: gegužės 5 d.'});
  };
  const pickNum = () => { const r = Math.random(); return r < .55 ? rnd(101) : r < .9 ? 101 + rnd(899) : 1000; };
  mk.num = () => {
    const t = rnd(5);
    if(t <= 1){ const n = pickNum(); return typed('Numbers', `Write <b>${n}</b> in words.`, [numWords(n)]); }
    if(t === 2){ const n = pickNum(); return typed('Numbers', `Write the number in digits:<br><span class="ex-lt">${numWords(n)}</span>`, [String(n)], {say: numWords(n), exact: true}); }
    if(t === 3){ const n = pickNum(); return typed('Numbers', `Listen and write the number in digits.`, [String(n)], {say: numWords(n), exact: true, listen: true, show: String(n) + ' (' + numWords(n) + ')'}); }
    const n = 1 + rnd(99); return typed('Numbers', `Kiek tai kainuoja? Write the price in words: <b>${n} €</b>`, [`${numWords(n)} ${euroWord(n)}`], {note: 'euras (…1), eurai (2–9), eurų (0 and 11–19).'});
  };
  mk.dir = () => {
    const t = rnd(3);
    if(t === 0){ const x = pick(DIR_TYPED); return typed('Directions', `How do you say: <b>${x[0]}</b>`, x[1]); }
    const x = pick(DIR_UNDER);
    if(t === 1) return mcq('Directions', `What does this mean?<br><span class="ex-lt">${esc(x[0])}</span>`, x[1], others(DIR_UNDER.map(y => y[1]), x[1], 3), {say: x[0]});
    return mcq('Directions', `Choose the Lithuanian for: <b>${x[1]}</b>`, x[0], others(DIR_UNDER.map(y => y[0]), x[0], 3), {say: x[0]});
  };
  const CORE = new Set(['greetings','numbers','family','colors','food','days','months','phrases','animals','home','time','directions','identity','relationships','meals','dailylife','shopping-phrases']);
  const vocabPool = () => ctx.words.filter(w => w.en && w.lt && w.en.length < 40 && !/\.\.\./.test(w.lt));
  mk.vocab = () => {
    const all = vocabPool(), core = all.filter(x => CORE.has(x.cat));
    const pool = all, w = pick(Math.random() < .65 && core.length ? core : all);
    if(rnd(2)){
      const same = pool.filter(x => x.en.toLowerCase() === w.en.toLowerCase()).map(x => x.lt);
      return typed('Course vocabulary', `How do you say <b>${esc(w.en)}</b> in Lithuanian?`, same, {note: `Pronunciation: ${w.pr}`, say: null});
    }
    const sameCat = pool.filter(x => x.cat === w.cat && x.en !== w.en);
    const wrong = shuffle(sameCat.length >= 3 ? sameCat : pool).filter(x => x.en !== w.en).slice(0, 3).map(x => x.en);
    return mcq('Course vocabulary', `What does <b>${esc(w.lt)}</b> mean?`, w.en, wrong, {say: w.lt, note: `Pronunciation: ${w.pr}`});
  };

  const SECTIONS = [
    {id: 'cal', title: 'Months and weekdays', sub: 'Names, order, what comes next', make: mk.cal},
    {id: 'col', title: 'Colours', sub: 'Say them and use them in sentences', make: mk.col},
    {id: 'date', title: 'Writing dates', sub: '2026 m. kovo 11 d.', make: mk.date, help: 'date'},
    {id: 'num', title: 'Numbers', sub: 'Digits to words, words to digits, prices', make: mk.num, help: 'num'},
    {id: 'dir', title: 'Directions', sub: 'kairė, dešinė, tiesiai', make: mk.dir},
    {id: 'vocab', title: 'Course vocabulary', sub: 'Random words from every category', make: mk.vocab}
  ];

  /* ---------- speaking material ---------- */
  const today = new Date();
  const todayLt = `${today.getFullYear()} m. ${MONTHS[today.getMonth()][2]} ${today.getDate()} d.`;
  const dayLt = DAYS[(today.getDay() + 6) % 7][1];
  const QA = [
    ['Koks jūsų vardas?', 'What is your name?', 'Mano vardas yra [vardas].', 'My name is [name].'],
    ['Kokia jūsų pavardė?', 'What is your surname?', 'Mano pavardė yra [pavardė].', 'My surname is [surname].'],
    ['Iš kur jūs?', 'Where are you from?', 'Aš esu iš [šalies, pvz. Lenkijos].', 'I am from [country, genitive].'],
    ['Kur jūs gyvenate?', 'Where do you live?', 'Aš gyvenu [mieste, pvz. Vilniuje].', 'I live in [city, locative].'],
    ['Kiek jums metų?', 'How old are you?', 'Man [dvidešimt penkeri] metai. / Man [trisdešimt] metų.', 'I am [25] / [30] years old. (Rule: numbers ending in 0 and 11–19 take “metų”; the others use vieneri, dveji, treji, ketveri, penkeri, šešeri, septyneri, aštuoneri, devyneri + metai.)'],
    ['Kuo jūs dirbate?', 'What do you do for work?', 'Aš dirbu [parduotuvėje]. / Aš esu [studentas].', 'I work in [a shop]. / I am a [student].'],
    ['Ką veikiate savaitgaliais?', 'What do you do at weekends?', 'Savaitgaliais aš ilsiuosi, žiūriu filmus ir susitinku su draugais.', 'At weekends I rest, watch films and meet friends.'],
    ['Kokia jūsų šeima?', 'What is your family like?', 'Mano šeima nedidelė. Turiu mamą, tėtį ir [seserį].', 'My family is small. I have a mum, a dad and a [sister].'],
    ['Ar turite brolių ar seserų?', 'Do you have brothers or sisters?', 'Taip, turiu brolį ir seserį. / Ne, neturiu brolių ir seserų.', 'Yes, I have a brother and a sister. / No, I do not have brothers or sisters.'],
    ['Kaip vadinasi jūsų mama?', 'What is your mother called?', 'Mano mama vadinasi [vardas].', 'My mother is called [name].'],
    ['Kiek žmonių yra jūsų šeimoje?', 'How many people are in your family?', 'Mano šeimoje yra [keturi] žmonės.', 'There are [four] people in my family.'],
    ['Kada jūsų gimtadienis?', 'When is your birthday?', 'Mano gimtadienis yra [gegužės 5 d.].', 'My birthday is on [5 May].'],
    ['Kokia jūsų mėgstamiausia spalva?', 'What is your favourite colour?', 'Mano mėgstamiausia spalva yra [žalia].', 'My favourite colour is [green].'],
    ['Ką mėgstate valgyti?', 'What do you like to eat?', 'Mėgstu valgyti sriubą ir salotas.', 'I like to eat soup and salad.'],
    ['Kokia šiandien diena?', 'What day is it today?', `Šiandien yra ${dayLt}.`, 'Today is ' + DAYS[(today.getDay() + 6) % 7][0] + '.'],
    ['Kuri šiandien data?', 'What is the date today?', `Šiandien yra ${todayLt}`, 'Today is ' + today.getDate() + ' ' + MONTHS[today.getMonth()][0] + ' ' + today.getFullYear() + '.'],
    ['Ar kalbate lietuviškai?', 'Do you speak Lithuanian?', 'Taip, kalbu šiek tiek lietuviškai.', 'Yes, I speak a little Lithuanian.'],
    ['Kaip jums sekasi?', 'How are you doing?', 'Ačiū, gerai. O jums?', 'Thank you, well. And you?'],
    ['Ką norėtumėte gerti?', 'What would you like to drink?', 'Norėčiau kavos, prašau.', 'I would like some coffee, please.'],
    ['Ką veikėte vakar?', 'What did you do yesterday?', 'Vakar dirbau ir žiūrėjau filmą.', 'Yesterday I worked and watched a film.'],
    ['Kur yra stotis?', 'Where is the station?', 'Stotis yra kairėje, netoli aikštės.', 'The station is on the left, near the square.'],
    ['Iš kokios šalies esate?', 'Which country are you from?', 'Esu iš [Lenkijos].', 'I am from [country, genitive].'],
    ['Iš kokio miesto esate?', 'Which city are you from?', 'Esu iš [Varšuvos].', 'I am from [city, genitive].'],
    ['Kokiomis kalbomis kalbate?', 'Which languages do you speak?', 'Kalbu [lenkiškai, angliškai] ir šiek tiek lietuviškai.', 'I speak [Polish, English] and a little Lithuanian.'],
    ['Ką esate šiandien apsirengęs?', 'What are you wearing today? (apsirengusi if you are a woman)', 'Šiandien esu apsirengęs [džinsais ir šiltu megztiniu]. / [apsirengusi]', 'Today I am wearing [jeans and a warm jumper]. (use the instrumental: džinsais, megztiniu)'],
    ['Kaip atvykote į pamoką – mašina ar autobusu?', 'How did you come to class – by car or by bus?', 'Į pamoką atvykau [autobusu]. / [mašina].', 'I came to class [by bus] / [by car].'],
    ['Kur studijuojate?', 'Where do you study?', 'Studijuoju [universitete]. / Nestudijuoju. Aš dirbu [biure].', 'I study [at a university]. / I do not study. I work [in an office].'],
    ['Kur dirbate?', 'Where do you work?', 'Dirbu [parduotuvėje / biure / ligoninėje].', 'I work [in a shop / an office / a hospital].'],
    ['Sesė vyresnė ar jaunesnė?', 'Is your sister older or younger?', 'Mano sesuo yra [vyresnė / jaunesnė] už mane.', 'My sister is [older / younger] than me.'],
    ['Ką mėgsta veikti jūsų sesė / brolis?', 'What does your sister / brother like to do?', 'Mano sesuo mėgsta [skaityti knygas]. / Mano brolis mėgsta [žaisti futbolą].', 'My sister likes [reading books]. / My brother likes [playing football].'],
    ['Koks miestas jums patinka?', 'Which city do you like?', 'Man patinka [Vilnius].', 'I like [Vilnius].'],
    ['Koks maistas jums patinka?', 'Which food do you like?', 'Man patinka [itališkas maistas].', 'I like [Italian food].'],
    ['Kokia jūsų lytis?', 'What is your gender?', 'Aš esu [vyras / moteris].', 'I am [male / female].'],
    ['Kokia jūsų pilietybė?', 'What is your citizenship?', 'Esu [Lenkijos] pilietis. / pilietė.', 'I am a citizen of [Poland]. (pilietis = man, pilietė = woman)'],
    ['Koks jūsų adresas?', 'What is your address?', 'Mano adresas yra [Gedimino prospektas 10, Vilnius].', 'My address is [street and number, city].'],
    ['Koks jūsų telefonas?', 'What is your phone number?', 'Mano telefono numeris yra [+370 6xx xxxxx].', 'My phone number is [number].'],
    ['Kokia jūsų šeiminė padėtis?', 'What is your marital status?', 'Esu [vedęs / ištekėjusi]. / Esu [nevedęs / netekėjusi].', 'I am [married] / [single]. (vedęs / nevedęs = man, ištekėjusi / netekėjusi = woman)']
  ];
  const DIALOGS = [
    {id: 'cafe', title: 'In a café', lines: [
      ['npc', 'Laba diena! Ką norėtumėte?', 'Hello! What would you like?'],
      ['you', 'Laba diena! Norėčiau kavos su pienu, prašau.', 'Hello! I would like a coffee with milk, please.', ['Aš esu studentas.', 'Stotis yra kairėje.']],
      ['npc', 'Ar norėtumėte ko nors valgyti?', 'Would you like something to eat?'],
      ['you', 'Taip, norėčiau sumuštinio su sūriu.', 'Yes, I would like a sandwich with cheese.', ['Mano vardas yra Jonas.', 'Man dvidešimt penkeri metai.']],
      ['npc', 'Gerai. Valgysite čia ar išsinešimui?', 'Fine. Will you eat here or take away?'],
      ['you', 'Čia, prašau.', 'Here, please.', ['Šiandien yra pirmadienis.', 'Dešinėje yra bankas.']],
      ['npc', 'Iš viso šeši eurai.', 'Six euros in total.'],
      ['you', 'Ar galiu sumokėti kortele?', 'Can I pay by card?', ['Man patinka mėlyna spalva.', 'Aš gyvenu Vilniuje.']],
      ['npc', 'Taip, žinoma.', 'Yes, of course.'],
      ['you', 'Ačiū! Viso gero!', 'Thank you! Goodbye!', ['Mano brolis dirba banke.', 'Šiandien labai šalta.']],
      ['npc', 'Prašom. Skanaus!', 'You are welcome. Enjoy!']
    ]},
    {id: 'market', title: 'At the market', lines: [
      ['npc', 'Sveiki! Ko norėtumėte?', 'Hello! What would you like?'],
      ['you', 'Sveiki! Kiek kainuoja obuoliai?', 'Hello! How much are the apples?', ['Mano pavardė yra Kazlauskas.', 'Eikite tiesiai.']],
      ['npc', 'Du eurai už kilogramą.', 'Two euros per kilogram.'],
      ['you', 'Duokite, prašau, kilogramą obuolių.', 'Give me a kilogram of apples, please.', ['Man trisdešimt metų.', 'Kairėje yra parduotuvė.']],
      ['npc', 'Gerai. Ar dar ko nors?', 'Fine. Anything else?'],
      ['you', 'Taip, dar pusę kilogramo pomidorų.', 'Yes, also half a kilogram of tomatoes.', ['Ne, jis vadinasi Tomas.', 'Mano mama dirba mokykloje.']],
      ['npc', 'Iš viso penki eurai.', 'Five euros in total.'],
      ['you', 'Prašom. Viso gero!', 'Here you are. Goodbye!', ['Labas rytas!', 'Kur yra stotis?']],
      ['npc', 'Ačiū! Viso gero!', 'Thank you! Goodbye!']
    ]},
    {id: 'dirs', title: 'Asking for directions', lines: [
      ['you', 'Atsiprašau, kur yra stotis?', 'Excuse me, where is the station?', ['Labai skanu, ačiū.', 'Man dvidešimt metų.']],
      ['npc', 'Eikite tiesiai iki šviesoforo, paskui sukite į kairę.', 'Go straight to the traffic light, then turn left.'],
      ['you', 'Ar tai toli?', 'Is it far?', ['Aš nevalgau mėsos.', 'Mano vardas yra Ona.']],
      ['npc', 'Ne, tik penkios minutės pėsčiomis.', 'No, only five minutes on foot.'],
      ['you', 'Ar galėtumėte pakartoti?', 'Could you repeat that?', ['Aš noriu kavos.', 'Dešimt eurų.']],
      ['npc', 'Eikite tiesiai iki šviesoforo, paskui sukite į kairę. Stotis bus dešinėje.', 'Go straight to the traffic light, then turn left. The station will be on the right.'],
      ['you', 'Dėkoju! Viso gero!', 'Thank you! Goodbye!', ['Atsiprašau, aš nekalbu.', 'Sveiki, aš esu studentas.']],
      ['npc', 'Prašom. Viso gero!', 'You are welcome. Goodbye!']
    ]}
  ];
  const SCRIPTS = {
    intro: {
      title: 'Self-introduction',
      starter: 'Labas! Mano vardas yra [vardas]. Mano pavardė yra [pavardė]. Man [amžius] metai. Aš esu iš [šalies]. Dabar gyvenu [mieste]. Esu [studentas]. Mėgstu [hobis]. Malonu susipažinti!',
      english: 'Hello! My name is [name]. My surname is [surname]. I am [age] years old. I am from [country]. Now I live in [city]. I am a [student]. I like [hobby]. Nice to meet you!',
      tips: ['Replace every [bracket] with your own words.', 'Age: 20, 30, 40… and 11–19 use “metų”; 21 = vieneri, 22 = dveji, 25 = penkeri metai.', 'Country after “iš” is in the genitive: Lenkija → iš Lenkijos; city after “gyvenu” in the locative: Vilnius → Vilniuje.']
    },
    family: {
      title: 'Talking about your family',
      starter: 'Mano šeima nedidelė. Turiu mamą, tėtį ir [seserį]. Mano mama vadinasi [vardas]. Ji dirba [vieta]. Mano tėtis vadinasi [vardas]. Jam [amžius] metų. Mano brolis yra [studentas]. Savaitgaliais mes kartu valgome pietus.',
      english: 'My family is small. I have a mum, a dad and a [sister]. My mother is called [name]. She works [place]. My father is called [name]. He is [age] years old. My brother is a [student]. At weekends we have lunch together.',
      tips: ['Use the accusative after “turiu”: mama → mamą, tėtis → tėtį, sesuo → seserį, brolis → brolį.', 'Family words: mama, tėtis, brolis, sesuo, senelis, senelė, dukra, sūnus, vyras, žmona.']
    }
  };
  const PICTURES = (ctx.pictures || []);
  const PIC_STARTERS = ['Paveikslėlyje matau…', 'Čia yra…', 'Kairėje yra…', 'Dešinėje yra…', 'Viduryje yra…', 'Priekyje yra…', 'Už jo yra…', 'Jis / Ji turi…', 'Jis / Ji yra…'];

  /* ---------- state ---------- */
  let view = 'home', session = null, dlg = null, qa = null, pic = null;
  let root = null;

  const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
  const recordBest = (id, p) => { if(!(saved.best[id] >= p)){ saved.best[id] = p; persist(); } };

  /* ---------- views ---------- */
  function speakTiles(){
    return [['intro', 'Self-introduction', 'Build and rehearse your own answer'], ['family', 'Your family', 'Build and rehearse your own answer'], ['pic', 'Describe a picture', 'Two pictures with model descriptions'], ['dlg:cafe', 'Café dialogue', 'Order and pay'], ['dlg:market', 'Market dialogue', 'Ask prices and buy'], ['dlg:dirs', 'Directions dialogue', 'Ask the way and understand'], ['qa', 'Question practice', 'Koks jūsų vardas? Ką veikiate savaitgaliais?…']]
      .map(t => `<button type="button" class="ex-tile sp" data-ex="speak" data-v="${t[0]}"><b>${t[1]}</b><span>${t[2]}</span></button>`).join('');
  }
  function homeHtml(){
    const b = id => saved.best[id] != null ? `<small>best ${saved.best[id]}%</small>` : '';
    const wr = SECTIONS.map(s => `<button type="button" class="ex-tile" data-ex="practice" data-v="${s.id}"><b>${s.title}</b><span>${s.sub}</span>${b(s.id)}</button>`).join('');
    const sp = speakTiles();
    const last = saved.mocks.length ? saved.mocks[saved.mocks.length - 1] : null;
    return `<div class="ex">
      <h2 class="serif ex-h">Exam preparation</h2>
      <p class="ex-p">Written part first, then the speaking part. Typing without the Lithuanian letters (ą č ę ė į š ų ū ž) counts as half a point in the mock test, so practise the letters.</p>
      <div class="ex-mock"><div><b>Mock written test</b><span>30 questions across all six topics, answer shown after each one${last ? ` · last ${last.score}/${last.total}` : ''}${saved.best.mock != null ? ` · best ${saved.best.mock}%` : ''}</span></div><button type="button" class="btn green" data-ex="mock">Start mock test</button></div>
      <div class="ex-mock"><div><b>Report card for my teacher</b><span>Scores, mock results and speaking progress in one page you can send</span></div><button type="button" class="btn" data-ex="report">Make report</button></div>
      <h3 class="ex-h3">✍️ Written part</h3><div class="ex-grid">${wr}</div>
      <h3 class="ex-h3">🗣️ Speaking part</h3>
      <p class="ex-p">The app cannot hear you, so say every answer out loud, then check it against the model. Use the speaker buttons to hear how it sounds.</p>
      <div class="ex-grid">${sp}</div></div>`;
  }

  /* ---------- report card ---------- */
  const fmtDate = ts => { const d = new Date(ts); return d.toISOString().slice(0, 10); };
  function reportData(){
    const written = SECTIONS.map(x => ({title: x.title, best: saved.best[x.id], last: saved.last[x.id] ? saved.last[x.id].p : null, runs: saved.runs[x.id] || 0}));
    const mocks = saved.mocks.slice().reverse();
    const parts = {}; saved.mocks.forEach(m => { if(m.parts) Object.keys(m.parts).forEach(k => { const a = parts[k] || (parts[k] = [0, 0]); a[0] += m.parts[k][0]; a[1] += m.parts[k][1]; }); });
    const qaDone = Object.keys(saved.qa).filter(q => QA.some(x => x[0] === q)).length;
    const dl = DIALOGS.map(d => ({title: d.title, done: !!saved.done['dlg:' + d.title]}));
    const pics = PICTURES.map(p => ({title: p.title, done: !!saved.done['pic:' + p.title]}));
    const scripts = ['intro', 'family'].map(id => ({title: SCRIPTS[id].title, text: saved.scripts[id] != null && saved.scripts[id].trim() && saved.scripts[id] !== SCRIPTS[id].starter ? saved.scripts[id].trim() : ''}));
    const mistakes = Object.keys(saved.mistakes).map(k => saved.mistakes[k]).sort((a, b) => a.sec.localeCompare(b.sec) || b.at - a.at);
    const qaMiss = Object.keys(saved.qaMiss).filter(q => QA.some(x => x[0] === q));
    return {qTeacher: (saved.qTeacher || '').trim(), mistakes, qaMiss, name: (saved.name || '').trim(), date: fmtDate(Date.now()), written, mocks, parts, bestMock: saved.best.mock, qaDone, qaTotal: QA.length, dl, pics, scripts};
  }
  const todoCount = r => r.written.filter(w => w.best == null).length + (r.mocks.length ? 0 : 1) + r.dl.filter(d => !d.done).length + r.pics.filter(p => !p.done).length + r.scripts.filter(x => !x.text).length;
  function reportText(r){
    const L = []; let n = 0; const tn = () => '[#' + (++n) + '] ';
    L.push('Lithuanian exam practice – report card');
    L.push('Student: ' + (r.name || '(name not entered)'));
    L.push('Date: ' + r.date); L.push('Still to do: ' + todoCount(r) + ' (numbered #1, #2 … below)'); L.push('');
    L.push('WRITTEN PART (best score per topic)');
    r.written.forEach(w => L.push('- ' + (w.best == null ? tn() : '') + w.title + ': ' + (w.best != null ? w.best + '% best' + (w.last != null ? ', last ' + w.last + '%' : '') + ', ' + w.runs + ' ' + (w.runs === 1 ? 'practice' : 'practices') : 'not practised yet')));
    L.push(''); L.push('MOCK WRITTEN TEST (30 questions)');
    if(r.mocks.length){
      L.push('Best: ' + r.bestMock + '%');
      r.mocks.slice(0, 5).forEach(m => L.push('- ' + fmtDate(m.at) + ': ' + m.score + '/' + m.total + ' (' + pct(m.score, m.total) + '%)'));
      const ks = Object.keys(r.parts); if(ks.length){ L.push('Average by part:'); ks.forEach(k => L.push('  ' + k + ': ' + pct(r.parts[k][0], r.parts[k][1]) + '%')); }
    }else L.push('- ' + tn() + 'Mock written test: not taken yet');
    L.push(''); L.push('MISTAKES TO REVIEW (' + r.mistakes.length + ')');
    if(r.mistakes.length){ let cur = ''; r.mistakes.forEach(m => { if(m.sec !== cur){ cur = m.sec; L.push(cur + ':'); } L.push('- ' + m.prompt + ' | my answer: ' + (m.your || '(none)') + ' | correct: ' + m.correct + (m.n > 1 ? ' | missed ' + m.n + ' times' : '')); }); }
    else L.push('No open mistakes.');
    L.push(''); L.push('SPEAKING PART (self-assessed; the app cannot hear speech)');
    L.push('- Questions rehearsed: ' + r.qaDone + ' of ' + r.qaTotal);
    if(r.qaMiss.length){ L.push('- Still to practise:'); r.qaMiss.forEach(q => L.push('  ' + q)); }
    r.dl.forEach(d => L.push('- ' + (d.done ? '' : tn()) + 'Dialogue "' + d.title + '": ' + (d.done ? 'completed' : 'not done yet')));
    r.pics.forEach(p => L.push('- ' + (p.done ? '' : tn()) + 'Picture "' + p.title + '": ' + (p.done ? 'described and checked' : 'not done yet')));
    r.scripts.forEach(sc => { L.push(''); L.push((sc.text ? '' : tn()) + sc.title + ' (my own text):'); L.push(sc.text || '(not written yet)'); });
    if(r.qTeacher){ L.push(''); L.push('MY QUESTIONS FOR THE TEACHER'); L.push(r.qTeacher); }
    L.push(''); L.push("TEACHER'S COMMENTS:"); L.push(''); L.push('');
    return L.join('\n');
  }
  const cssStr = t => String(t).replace(/[\\"]/g, '').replace(/[\r\n]+/g, ' ');
  function reportHtml(r){
    let n = 0; const nb = () => `<b class="rp-n">#${++n}</b> `;
    const row = (a, b, todo) => `<tr><td>${todo ? nb() : ''}${esc(a)}</td><td>${esc(b)}</td></tr>`;
    const w = r.written.map(x => row(x.title, x.best != null ? `${x.best}% best${x.last != null ? ', last ' + x.last + '%' : ''} · ${x.runs} ${x.runs === 1 ? 'practice' : 'practices'}` : 'not practised yet', x.best == null)).join('');
    const m = r.mocks.length ? r.mocks.slice(0, 5).map(x => row(fmtDate(x.at), `${x.score}/${x.total} (${pct(x.score, x.total)}%)`)).join('') + Object.keys(r.parts).map(k => row('Average · ' + k, pct(r.parts[k][0], r.parts[k][1]) + '%')).join('') : row('Mock written test', 'not taken yet', true);
    let cur = '';
    const mi = r.mistakes.length ? r.mistakes.map(m => { const head = m.sec !== cur ? `<tr><td colspan="2" class="rp-sec">${esc(m.sec)}</td></tr>` : ''; cur = m.sec; return head + `<tr><td>${esc(m.prompt)}<br><span class="rp-sub">my answer: ${esc(m.your || '(none)')}${m.n > 1 ? ' · missed ' + m.n + ' times' : ''}</span></td><td><b>${esc(m.correct)}</b></td></tr>`; }).join('') : row('No open mistakes', '');
    const qm = r.qaMiss.length ? `<tr><td colspan="2">Still to practise: ${r.qaMiss.map(esc).join(' · ')}</td></tr>` : '';
    const sp = qm + row('Questions rehearsed', `${r.qaDone} of ${r.qaTotal}`) + r.dl.map(d => row('Dialogue: ' + d.title, d.done ? 'completed' : 'not done yet', !d.done)).join('') + r.pics.map(p => row('Picture: ' + p.title, p.done ? 'described and checked' : 'not done yet', !p.done)).join('');
    const sc = r.scripts.map(x => `<h4>${x.text ? '' : nb()}${esc(x.title)} (my own text)</h4><p class="rp-text">${x.text ? esc(x.text) : '<i>not written yet</i>'}</p>`).join('');
    return `<style>@page{@top-left{content:"${cssStr('Lithuanian exam practice · ' + (r.name || '(name not entered)') + ' · ' + r.date)}";font-size:10px;color:#555}}</style><h2>Lithuanian exam practice</h2><p class="rp-meta"><b>Student:</b> ${esc(r.name || '(name not entered)')} · <b>Date:</b> ${esc(r.date)} · <b>Still to do:</b> ${todoCount(r)}</p>
      <h3>Written part</h3><table>${w}</table>
      <h3>Mock written test${r.bestMock != null ? ` · best ${r.bestMock}%` : ''}</h3><table>${m}</table>
      <h3>Mistakes to review (${r.mistakes.length})</h3><table>${mi}</table>
      <h3>Speaking part</h3><table>${sp}</table>${sc}
      ${r.qTeacher ? `<h3>My questions for the teacher</h3><p class="rp-text">${esc(r.qTeacher)}</p>` : ''}
      <h3>Teacher’s comments</h3><div class="rp-teacher"></div>
      <p class="rp-note">Speaking is self-assessed because the app cannot hear speech.</p>`;
  }
  function reportViewHtml(){
    const r = reportData();
    const canShare = typeof navigator !== 'undefined' && !!navigator.share;
    return `<div class="ex">${backBtn('home')}<h2 class="serif ex-h">Report card</h2>
      <p class="ex-p">Add your name, then send it to your teacher. Everything comes from what you practised on this device.</p>
      <label class="ex-p" for="exname"><b>Your name</b></label>
      <input id="exname" class="ex-in" type="text" autocomplete="name" placeholder="Name and surname" value="${esc(saved.name)}">
      <label class="ex-p" for="exq"><b>Questions for your teacher</b> (optional)</label>
      <textarea id="exq" class="ex-area" rows="3" placeholder="Anything you want to ask or are unsure about">${esc(saved.qTeacher)}</textarea>
      <div class="ex-actions">${canShare ? '<button type="button" class="btn green" data-ex="rshare">Share…</button>' : ''}<button type="button" class="btn ${canShare ? '' : 'green'}" data-ex="rcopy">Copy as text</button><button type="button" class="btn" data-ex="rdl">Download page</button><button type="button" class="btn" data-ex="rprint">Print / save PDF</button><button type="button" class="linkbtn" data-ex="clearmist">Clear mistakes list</button></div>
      <div id="exrnote" class="ex-note" role="status" hidden></div>
      <div class="ex-report" id="exreport">${reportHtml(r)}</div></div>`;
  }
  const rnote = msg => { const n = root.querySelector('#exrnote'); if(n){ n.textContent = msg; n.hidden = false; } };
  function reportFileHtml(r){
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lithuanian exam practice – ${esc(r.name || 'report')}</title><style>body{font:16px/1.5 system-ui,sans-serif;max-width:720px;margin:24px auto;padding:0 16px;color:#222}h2{margin:0 0 4px}h3{margin:22px 0 6px;border-bottom:1px solid #ccc;padding-bottom:4px}h4{margin:16px 0 4px}table{border-collapse:collapse;width:100%}td{padding:5px 8px;border-bottom:1px solid #eee;vertical-align:top}td:last-child{text-align:right}.rp-text{white-space:pre-wrap}.rp-n{color:#b00020}.rp-teacher{border:1px solid #999;min-height:130px;border-radius:4px}h3,h4{break-after:avoid}tr{break-inside:avoid}@page{margin:18mm 14mm 16mm;@bottom-right{content:counter(page) ' / ' counter(pages);font-size:10px;color:#666}}.rp-sec{font-weight:700;background:#f4f4f4}.rp-sub{color:#777;font-size:13px}.rp-note{color:#666;font-size:13px;margin-top:22px}</style></head><body>${reportHtml(r)}</body></html>`;
  }
  async function reportShare(){
    const r = reportData(), text = reportText(r), name = 'lithuanian-report-' + r.date + '.html';
    try{
      const file = new File([reportFileHtml(r)], name, {type: 'text/html'});
      if(navigator.canShare && navigator.canShare({files: [file]})){ await navigator.share({files: [file], title: 'Lithuanian exam practice', text}); return; }
    }catch(e){ if(e && e.name === 'AbortError') return; }
    try{ await navigator.share({title: 'Lithuanian exam practice', text}); }catch(e){}
  }
  async function reportCopy(){
    const text = reportText(reportData());
    try{ await navigator.clipboard.writeText(text); rnote('Copied. Paste it into an email or message.'); }
    catch(e){ const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); rnote('Copied. Paste it into an email or message.'); }catch(err){ rnote('Could not copy. Use Download page instead.'); } ta.remove(); }
  }
  function reportDownload(){
    const r = reportData(), blob = new Blob([reportFileHtml(r)], {type: 'text/html'}), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'lithuanian-report-' + r.date + '.html'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000); rnote('Downloaded. Attach the file to an email.');
  }
  const backBtn = (to) => `<button type="button" class="linkbtn ex-back" data-ex="${to || 'home'}">← Exam preparation</button>`;

  function helpHtml(kind){
    if(kind === 'date') return `<details class="ex-help"><summary>How to write dates</summary><div><p><b>2026 m. kovo 11 d.</b> (m. = metai, d. = diena). Year, then the month in the <b>genitive</b>, then the day number. Months are written in lowercase.</p><div class="ex-months">${MONTHS.map(m => `<span>${m[1]} → <b>${m[2]}</b></span>`).join('')}</div></div></details>`;
    if(kind === 'num') return `<details class="ex-help"><summary>Number cheat sheet</summary><div><p>${ONES.slice(1, 11).join(', ')}</p><p>${ONES.slice(11).join(', ')}</p><p>${TENS.slice(2).join(', ')}</p><p>šimtas, du šimtai, trys šimtai… tūkstantis. Combine: 21 = dvidešimt vienas, 135 = šimtas trisdešimt penki.</p><p>Prices: 1 euras · 2–9 eurai · 10 eurų · 11–19 eurų · 20 eurų · 21 euras.</p></div></details>`;
    return '';
  }

  function qHtml(q, i, total, mock){
    const prog = `<div class="ex-prog"><i style="width:${Math.round(100 * i / total)}%"></i></div><div class="ex-meta">${mock ? q.part + ' · ' : ''}Question ${i + 1} of ${total}</div>`;
    const say = q.say ? spkBtn(q.say) : '';
    let body = `<div class="ex-q">${q.prompt} ${say}</div>`;
    if(q.kind === 'mcq'){
      body += `<div class="ex-opts">${q.options.map((o, k) => `<button type="button" class="ex-opt" data-ex="opt" data-v="${k}">${esc(o)}</button>`).join('')}</div>`;
    }else{
      body += `<div class="ex-ans"><input id="exin" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Your answer" placeholder="${q.exact ? 'digits' : 'Your answer in Lithuanian'}"><button type="button" class="btn green" data-ex="submit">Check</button></div>`;
    }
    return prog + body + '<div id="exfb"></div>';
  }

  function practiceHtml(){
    const s = session;
    if(s.done) return doneHtml(s);
    return `<div class="ex">${backBtn()}<h2 class="serif ex-h">${s.title}</h2>${s.help ? helpHtml(s.help) : ''}${qHtml(s.qs[s.i], s.i, s.qs.length, s.mock)}</div>`;
  }
  function doneHtml(s){
    const p = pct(s.points, s.qs.length);
    const wrong = s.log.filter(x => x.res !== 'ok');
    let byPart = '';
    if(s.mock){
      const parts = {};
      s.log.forEach(x => { const o = parts[x.q.part] = parts[x.q.part] || [0, 0]; o[0] += x.res === 'ok' ? 1 : x.res === 'near' ? .5 : 0; o[1]++; });
      byPart = `<table class="ex-table res">${Object.entries(parts).map(([k, v]) => `<tr><td>${k}</td><td><b>${v[0]}/${v[1]}</b></td></tr>`).join('')}</table>`;
    }
    const rows = wrong.map(x => `<li><div>${x.q.prompt.replace(/<br>/g, ' ')}</div><div class="ex-your">Your answer: ${esc(x.your || '—')}</div><div class="ex-right">Correct: ${esc(x.q.show)}</div></li>`).join('');
    return `<div class="ex">${backBtn()}<div class="done"><div class="ic">${p >= 80 ? '🎉' : '📝'}</div><h2>${s.points}/${s.qs.length} (${p}%)</h2><p>${p >= 90 ? 'Excellent. You are ready.' : p >= 70 ? 'Good. Review the mistakes below and try again.' : 'Keep practising. The mistakes below are what to review.'}</p></div>${byPart}${wrong.length ? `<h3 class="ex-h3">To review</h3><ul class="ex-wrong">${rows}</ul>` : ''}<div class="ex-actions"><button type="button" class="btn green" data-ex="${s.mock ? 'mock' : 'practice'}" data-v="${s.id}">${s.mock ? 'New mock test' : 'Practise again'}</button><button type="button" class="btn" data-ex="home">Back</button></div></div>`;
  }

  function scriptHtml(id){
    const sc = SCRIPTS[id];
    const text = saved.scripts[id] != null ? saved.scripts[id] : sc.starter;
    return `<div class="ex">${backBtn('speaklist')}<h2 class="serif ex-h">${sc.title}</h2>
      <p class="ex-p">Edit the text so it is about you. It saves on this device. Then read it aloud, listen to it, and say it again without looking.</p>
      <textarea id="exscript" class="ex-area" rows="8" spellcheck="false" aria-label="${sc.title}">${esc(text)}</textarea>
      <div class="ex-actions"><button type="button" class="btn green" data-ex="say" data-t="">▶ Listen</button><button type="button" class="btn" data-ex="resetscript" data-v="${id}">Reset to model</button></div>
      <h3 class="ex-h3">English</h3><p class="ex-p">${esc(sc.english)}</p>
      <h3 class="ex-h3">Remember</h3><ul class="ex-list">${sc.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
      <h3 class="ex-h3">Checklist</h3><p class="ex-p">Say it aloud 3 times: once reading, once with a glance, once from memory. Aim for about 30 seconds.</p></div>`;
  }

  function picHtml(){
    if(!PICTURES.length) return `<div class="ex">${backBtn('speaklist')}<p>No pictures are available.</p></div>`;
    const p = PICTURES[pic ? pic.i : 0], i = pic ? pic.i : 0, step = pic ? pic.step : 0;
    const tabs = PICTURES.map((x, k) => `<button type="button" class="chip ${k === i ? 'on' : ''}" data-ex="picsel" data-v="${k}">${esc(x.title)}</button>`).join('');
    const key = 'pic:' + p.id;
    const mine = saved.scripts[key] || '';
    return `<div class="ex">${backBtn('speaklist')}<h2 class="serif ex-h">Describe a picture</h2>
      <div class="chips ex-chips">${tabs}</div>
      <img class="ex-pic" src="${esc(p.img)}" alt="${esc(p.title)}">
      <h3 class="ex-h3">Useful starters</h3><div class="ex-starters">${PIC_STARTERS.map(s => `<button type="button" class="ex-chip" data-ex="say" data-t="${esc(s.replace('…', ''))}">${esc(s)}</button>`).join('')}</div>
      <p class="ex-p">Describe the picture aloud for one minute: who is there, where they are (kairėje, dešinėje, viduryje, priekyje), what they have and what colour it is.</p>
      <textarea id="exscript" class="ex-area" data-key="${esc(key)}" rows="5" placeholder="Optional: write your description here" aria-label="Your description">${esc(mine)}</textarea>
      <div class="ex-actions"><button type="button" class="btn amber" data-ex="picreveal">${step ? 'Hide model' : 'Show model description'}</button></div>
      ${step ? `<div class="ex-model"><div class="ex-actions"><button type="button" class="btn green" data-ex="say" data-t="${esc(p.sentences.map(s => s.lt).join(' '))}">▶ Listen to all</button></div><ol class="ex-sent">${p.sentences.map(s => `<li><span class="ex-lt">${esc(s.lt)}</span> ${spkBtn(s.lt)}<br><small>${esc(s.en)}</small></li>`).join('')}</ol></div>` : ''}</div>`;
  }

  function dlgHtml(){
    const d = dlg.d, line = d.lines[dlg.i];
    let html = `<div class="ex">${backBtn('speaklist')}<h2 class="serif ex-h">${d.title}</h2>`;
    html += `<div class="ex-chat">${d.lines.slice(0, dlg.i).map(l => `<div class="ex-bubble ${l[0]}"><span class="ex-lt">${esc(l[1])}</span> ${spkBtn(l[1])}<br><small>${esc(l[2])}</small></div>`).join('')}`;
    if(dlg.i >= d.lines.length){
      html += `</div><div class="done"><div class="ic">🎉</div><h2>Dialogue complete</h2><p>Now play it again, this time saying your lines out loud before you tap.</p></div><div class="ex-actions"><button type="button" class="btn green" data-ex="speak" data-v="dlg:${d.id}">Play again</button><button type="button" class="btn" data-ex="speaklist">Back</button></div></div>`;
      return html;
    }
    if(line[0] === 'npc'){
      html += `<div class="ex-bubble npc"><span class="ex-lt">${esc(line[1])}</span> ${spkBtn(line[1], true)}<br><small>${dlg.showEn ? esc(line[2]) : ''}</small></div></div><div class="ex-actions"><button type="button" class="btn" data-ex="toggleEn">${dlg.showEn ? 'Hide English' : 'Show English'}</button><button type="button" class="btn green" data-ex="dnext">Continue</button></div></div>`;
      return html;
    }
    html += `</div><p class="ex-p"><b>Your turn.</b> Pick the best reply, then say it aloud.</p><div class="ex-opts">${dlg.opts.map((o, k) => `<button type="button" class="ex-opt ${dlg.picked === k ? (o === line[1] ? 'right' : 'wrong') : ''}" data-ex="dopt" data-v="${k}" ${dlg.picked != null && o === line[1] ? 'data-right="1"' : ''}>${esc(o)}</button>`).join('')}</div>`;
    if(dlg.picked != null){
      const ok = dlg.opts[dlg.picked] === line[1];
      html += `<div class="ex-fb ${ok ? 'ok' : 'no'}">${ok ? 'Correct.' : 'Not that one. Best reply: <b>' + esc(line[1]) + '</b>'}<br><small>${esc(line[2])}</small> ${spkBtn(line[1])}</div><div class="ex-actions"><button type="button" class="btn green" data-ex="dnext">Continue</button></div>`;
    }
    return html + '</div>';
  }

  function qaHtml(){
    const item = QA[qa.order[qa.i]];
    if(qa.i >= qa.order.length){
      return `<div class="ex">${backBtn('speaklist')}<div class="done"><div class="ic">🗣️</div><h2>${qa.ok} of ${qa.order.length} answered confidently</h2><p>Go again on the ones you missed until they come without thinking.</p></div><div class="ex-actions"><button type="button" class="btn green" data-ex="speak" data-v="qa">Again</button><button type="button" class="btn" data-ex="speaklist">Back</button></div></div>`;
    }
    return `<div class="ex">${backBtn('speaklist')}<h2 class="serif ex-h">Question practice</h2>
      <div class="ex-meta">Question ${qa.i + 1} of ${qa.order.length}</div>
      <div class="ex-q"><span class="ex-lt">${qa.listen && !qa.reveal ? '🔊 Listen…' : esc(item[0])}</span> ${spkBtn(item[0], true)}</div>
      <p class="ex-p">Answer out loud first.</p>
      <div class="ex-actions"><button type="button" class="btn" data-ex="qalisten">${qa.listen ? 'Show the question text' : 'Hide the text (listening only)'}</button><button type="button" class="btn amber" data-ex="qareveal">${qa.reveal ? 'Hide model' : 'Show model answer'}</button></div>
      ${qa.reveal ? `<div class="ex-model"><span class="ex-lt">${esc(item[2])}</span> ${spkBtn(item[2].replace(/[\[\]]/g, ''))}<br><small>${esc(item[1])}</small><br><small>${esc(item[3])}</small></div><div class="ex-actions"><button type="button" class="btn green" data-ex="qagot">I said it well</button><button type="button" class="btn" data-ex="qaagain">Need more practice</button></div>` : ''}</div>`;
  }

  function speakListHtml(){
    return `<div class="ex">${backBtn()}<h2 class="serif ex-h">🗣️ Speaking part</h2><p class="ex-p">The app cannot hear you, so say every answer out loud, then check it against the model. Use the speaker buttons to hear how it sounds.</p><div class="ex-grid">${speakTiles()}</div></div>`;
  }

  /* ---------- flow ---------- */
  function startPractice(id){
    const sec = SECTIONS.find(s => s.id === id);
    const qs = []; const seen = new Set();
    let guard = 0;
    while(qs.length < 10 && guard++ < 200){ const q = sec.make(); const k = q.prompt + '|' + q.show; if(!seen.has(k)){ seen.add(k); qs.push(q); } }
    session = {id, title: sec.title, help: sec.help, qs, i: 0, points: 0, log: [], mock: false, done: false, answered: false};
    view = 'practice';
  }
  function startMock(){
    const plan = [['cal', 5], ['col', 4], ['date', 4], ['num', 5], ['dir', 4], ['vocab', 8]];
    const qs = [];
    plan.forEach(([id, n]) => { const sec = SECTIONS.find(s => s.id === id); const seen = new Set(); let g = 0; let c = 0; while(c < n && g++ < 100){ const q = sec.make(); const k = q.prompt + '|' + q.show; if(!seen.has(k)){ seen.add(k); qs.push(q); c++; } } });
    session = {id: 'mock', title: 'Mock written test', qs, i: 0, points: 0, log: [], mock: true, done: false, answered: false};
    view = 'practice';
  }
  function finish(){
    session.done = true;
    const p = pct(session.points, session.qs.length);
    const sid = session.mock ? 'mock' : session.id;
    recordBest(sid, p);
    saved.runs[sid] = (saved.runs[sid] || 0) + 1; saved.last[sid] = {p, at: Date.now()};
    if(session.mock){
      const parts = {};
      session.log.forEach(l => { const k = l.q.part || '?'; const a = parts[k] || (parts[k] = [0, 0]); a[0] += l.res === 'ok' ? 1 : l.res === 'near' ? .5 : 0; a[1]++; });
      saved.mocks.push({score: session.points, total: session.qs.length, at: Date.now(), parts}); saved.mocks = saved.mocks.slice(-10);
    }
    persist();
  }
  function record(res, your){
    const s = session, q = s.qs[s.i];
    s.points += res === 'ok' ? 1 : res === 'near' ? .5 : 0;
    s.log.push({q, res, your});
    const plain = h => String(h == null ? '' : h).replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
    const sec = s.mock ? (q.part || 'Mock test') : (s.title || s.id), prompt = plain(q.prompt) + (q.listen && q.say ? ' (audio: ' + q.say + ')' : ''), correct = plain(q.show), key = sec + '|' + prompt + '|' + correct;
    if(res === 'ok') delete saved.mistakes[key];
    else{
      const old = saved.mistakes[key];
      saved.mistakes[key] = {sec, prompt, correct, your: plain(your), res, at: Date.now(), n: (old ? old.n : 0) + 1};
      const ks = Object.keys(saved.mistakes); if(ks.length > 150){ ks.sort((a, b) => saved.mistakes[a].at - saved.mistakes[b].at).slice(0, ks.length - 150).forEach(k => delete saved.mistakes[k]); }
    }
    persist();
  }
  function advance(){
    session.i++; session.answered = false;
    if(session.i >= session.qs.length) finish();
    draw();
  }
  function startDialog(id){
    const d = DIALOGS.find(x => x.id === id);
    dlg = {d, i: 0, showEn: false, picked: null, opts: []};
    prepLine();
    view = 'dlg';
  }
  function prepLine(){
    const l = dlg.d.lines[dlg.i]; dlg.picked = null;
    dlg.opts = l && l[0] === 'you' ? shuffle([l[1], ...l[3]]) : [];
  }
  function startQa(){ qa = {order: shuffle(QA.map((_, i) => i)), i: 0, ok: 0, reveal: false, listen: false}; view = 'qa'; }

  function draw(){
    if(!root) return;
    let h = '';
    if(view === 'home') h = homeHtml();
    else if(view === 'speaklist') h = speakListHtml();
    else if(view === 'practice') h = practiceHtml();
    else if(view === 'script') h = scriptHtml(root.dataset.script);
    else if(view === 'pic') h = picHtml();
    else if(view === 'dlg') h = dlgHtml();
    else if(view === 'qa') h = qaHtml();
    else if(view === 'report') h = reportViewHtml();
    root.innerHTML = h;
    const inp = root.querySelector('#exin'); if(inp) inp.focus({preventScroll: true});
    if(view === 'practice' && session && !session.done){
      const q = session.qs[session.i];
      if(q.listen && hasTTS) speak(q.say);
    }
  }

  function submitTyped(){
    const s = session, q = s.qs[s.i]; if(s.answered){ advance(); return; }
    const inp = root.querySelector('#exin'); const val = inp ? inp.value : '';
    let res;
    if(q.grade) res = q.grade(val);
    else if(q.exact) res = norm(val) === q.answers[0] ? 'ok' : 'no';
    else res = gradeText(val, q.answers);
    record(res, val);
    s.answered = true;
    inp.disabled = true;
    const fb = root.querySelector('#exfb');
    const note = q.note ? `<div class="ex-note">${q.note}</div>` : '';
    fb.innerHTML = `<div class="ex-fb ${res === 'no' ? 'no' : 'ok'}">${res === 'ok' ? 'Correct.' : res === 'near' ? 'Right word — check the letters: <b>' + esc(q.show) + '</b>' : 'Not quite. Answer: <b>' + esc(q.show) + '</b>' + (q.answers.length > 1 && !q.grade ? ' <small>(also: ' + esc(q.answers.slice(1, 3).join(', ')) + ')</small>' : '')}</div>${note}<div class="ex-actions"><button type="button" class="btn green" data-ex="next">Next</button></div>`;
    root.querySelector('[data-ex="submit"]').hidden = true;
    const nb = fb.querySelector('[data-ex="next"]'); if(nb) nb.focus();
  }
  function chooseOpt(k){
    const s = session, q = s.qs[s.i]; if(s.answered) return;
    const res = k === q.answer ? 'ok' : 'no';
    record(res, q.options[k]);
    s.answered = true;
    root.querySelectorAll('.ex-opt').forEach((b, i) => { b.disabled = true; if(i === q.answer) b.classList.add('right'); else if(i === k) b.classList.add('wrong'); });
    root.querySelector('#exfb').innerHTML = `<div class="ex-fb ${res === 'ok' ? 'ok' : 'no'}">${res === 'ok' ? 'Correct.' : 'Not quite. Answer: <b>' + esc(q.show) + '</b>'}</div>${q.note ? `<div class="ex-note">${esc(q.note)}</div>` : ''}<div class="ex-actions"><button type="button" class="btn green" data-ex="next">Next</button></div>`;
  }

  const actions = {
    home: () => { view = 'home'; draw(); },
    report: () => { view = 'report'; draw(); },
    rshare: () => reportShare(),
    rcopy: () => reportCopy(),
    rdl: () => reportDownload(),
    rprint: () => window.print(),
    speaklist: () => { view = 'speaklist'; draw(); },
    practice: v => { startPractice(v); draw(); },
    mock: () => { startMock(); draw(); },
    submit: () => submitTyped(),
    next: () => advance(),
    opt: v => chooseOpt(+v),
    say: (v, t) => { let txt = t.dataset.t; if(!txt && root.querySelector('#exscript')) txt = root.querySelector('#exscript').value.replace(/[\[\]]/g, ''); speak(txt); },
    speak: v => {
      if(v === 'intro' || v === 'family'){ root.dataset.script = v; view = 'script'; }
      else if(v === 'pic'){ pic = pic || {i: 0, step: 0}; view = 'pic'; }
      else if(v === 'qa') startQa();
      else if(v.startsWith('dlg:')) startDialog(v.slice(4));
      draw();
    },
    clearmist: () => { saved.mistakes = {}; saved.qaMiss = {}; persist(); draw(); },
    resetscript: v => { delete saved.scripts[v]; persist(); draw(); },
    picsel: v => { pic = {i: +v, step: 0}; draw(); },
    picreveal: () => { pic.step = pic.step ? 0 : 1; if(pic.step && PICTURES[pic.i]){ saved.done['pic:' + PICTURES[pic.i].title] = Date.now(); persist(); } draw(); },
    toggleEn: () => { dlg.showEn = !dlg.showEn; draw(); },
    dnext: () => { dlg.i++; dlg.showEn = false; prepLine(); if(dlg.i >= dlg.d.lines.length){ saved.done['dlg:' + dlg.d.title] = Date.now(); persist(); } draw() },
    dopt: v => { if(dlg.picked != null) return; dlg.picked = +v; draw(); },
    qalisten: () => { qa.listen = !qa.listen; draw(); },
    qareveal: () => { qa.reveal = !qa.reveal; draw(); },
    qagot: () => { const qq = QA[qa.order[qa.i]][0]; saved.qa[qq] = Date.now(); delete saved.qaMiss[qq]; persist(); qa.ok++; qa.i++; qa.reveal = false; draw(); },
    qaagain: () => { saved.qaMiss[QA[qa.order[qa.i]][0]] = Date.now(); persist(); qa.i++; qa.reveal = false; draw(); }
  };

  let wired = false;
  function wire(){
    if(wired) return; wired = true;
    root.addEventListener('click', e => {
      const t = e.target.closest('[data-ex]'); if(!t || !root.contains(t)) return;
      const f = actions[t.dataset.ex]; if(f) f(t.dataset.v, t);
    });
    root.addEventListener('keydown', e => {
      if(e.target.id === 'exin' && e.key === 'Enter'){ e.preventDefault(); submitTyped(); }
    });
    root.addEventListener('input', e => {
      if(e.target.id === 'exname'){ saved.name = e.target.value; persist(); const el = root.querySelector('#exreport'); if(el) el.innerHTML = reportHtml(reportData()); return; }
      if(e.target.id === 'exq'){ saved.qTeacher = e.target.value; persist(); const el = root.querySelector('#exreport'); if(el) el.innerHTML = reportHtml(reportData()); return; }
      if(e.target.id === 'exscript'){ const k = e.target.dataset.key || (root.dataset.script); saved.scripts[k] = e.target.value; persist(); }
    });
  }

  return {
    _t: {mk, numWords, euroWord, gradeText, norm},
    mount(stage){
      if(root !== stage){ root = stage; wired = false; }
      wire();
      if(view === 'script' && !root.dataset.script) view = 'home';
      draw();
    }
  };
}
