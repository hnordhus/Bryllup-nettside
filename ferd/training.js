/* A private, read-only snapshot. No Garmin endpoints or credentials in this module. */
(() => {
  'use strict';
  const KEY = 'ferd.training.v1';
  const sports = {running:'Løping', skierg:'SkiErg + styrke', cycling:'Sykling', strength:'Styrke', ski:'Ski', recovery:'Restitusjon', other:'Annet'};
  const statuses = {done:'Registrert', missed:'Ikke registrert', planned:'Planlagt', optional:'Valgfri', rest:'Hviledag', replaced:'Erstattet – hard for leggen'};
  const day = d => new Intl.DateTimeFormat('nb-NO', {day:'numeric', month:'short'}).format(new Date(`${d}T12:00:00`));
  const localDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const shift = (d,n) => {
    const x = new Date(`${d}T12:00:00Z`); x.setUTCDate(x.getUTCDate()+n);
    return x.toISOString().slice(0,10);
  };
  const minutes = s => s == null ? 'ukjent tid' : `${Math.round(s/60)} min`;
  function validate(data) {
    const fail = () => { throw new Error('Ugyldig treningseksport. Bruk eksportverktøyet fra Ferd statistikk.'); };
    const object = (o, keys) => {
      if (!o || typeof o !== 'object' || Array.isArray(o) || Object.keys(o).some(k => !keys.includes(k))) fail();
    };
    const validDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) &&
      !Number.isNaN(Date.parse(s)) && new Date(`${s}T12:00:00Z`).toISOString().slice(0,10) === s;
    const number = x => x == null || (typeof x === 'number' && Number.isFinite(x) && x >= 0);
    object(data, ['schemaVersion','exportedAt','asOf','goals','plan','activities']);
    if (data.schemaVersion !== 1 || !validDate(data.asOf) || typeof data.exportedAt !== 'string' ||
        Number.isNaN(Date.parse(data.exportedAt))) fail();
    object(data.goals, ['anchor','snowDate','raceDate','testRaceDate','testRaceKm','testRaceSeconds','fiveKSeconds','testDate']);
    for (const k of ['raceDate','testRaceDate','testDate']) if (data.goals[k] !== '' && !validDate(data.goals[k])) fail();
    for (const k of ['anchor','snowDate']) if (data.goals[k] !== undefined && !validDate(data.goals[k])) fail();
    for (const k of ['testRaceKm','testRaceSeconds','fiveKSeconds']) if (!number(data.goals[k])) fail();
    if (!Array.isArray(data.activities) || data.activities.length > 10000 || !Array.isArray(data.plan) || data.plan.length > 1000) fail();
    const ids = new Set();
    for (const a of data.activities) {
      object(a, ['id','date','sport','seconds','distance','heartRate','skiErgSeconds','skiErgHeartRate','strengthSeconds']);
      if (typeof a.id !== 'string' || !/^session-\d+$/.test(a.id) || ids.has(a.id) || !validDate(a.date) ||
          !Object.hasOwn(sports,a.sport)) fail();
      ids.add(a.id);
      for (const k of ['seconds','distance','heartRate','skiErgSeconds','skiErgHeartRate','strengthSeconds']) if (!number(a[k])) fail();
    }
    const dates = new Set();
    for (const p of data.plan) {
      object(p, ['date','sport','kind','title','detail','minutes','status','optional','actualSeconds','actualHeartRate','sessionId']);
      if (!validDate(p.date) || dates.has(p.date) || !Object.hasOwn(sports,p.sport) ||
          !Object.hasOwn(statuses,p.status) || typeof p.optional !== 'boolean' ||
          !['run','easy','interval','light','vo2','test','long','ski'].includes(p.kind)) fail();
      dates.add(p.date);
      for (const k of ['title','detail']) if (typeof p[k] !== 'string' || p[k].length > 3000) fail();
      for (const k of ['minutes','actualSeconds','actualHeartRate']) if (!number(p[k])) fail();
      if (p.sessionId != null && !ids.has(p.sessionId)) fail();
    }
    return data;
  }
  function comparison(data, today) {
    const end = today < data.asOf ? today : data.asOf;
    const start = shift(end,-6);
    const slots = data.plan.filter(p => p.date >= start && p.date <= end && !p.optional &&
      (p.date < today || p.status === 'done' || p.status === 'replaced') && p.status !== 'rest');
    const measured = slots.filter(p => p.status !== 'replaced' && p.minutes != null);
    let planned = 0, actual = 0;
    const points = [];
    for (let i=0; i<7; i++) {
      const date = shift(start,i);
      for (const p of measured.filter(p => p.date === date)) {
        planned += p.minutes;
        if (p.status === 'done' && p.actualSeconds != null) actual += p.actualSeconds/60;
      }
      points.push({date,planned,actual});
    }
    return {start,end,slots,points,planned,actual,
      done:slots.filter(p => p.status === 'done').length,
      replaced:slots.filter(p => p.status === 'replaced').length,
      unknown:measured.filter(p => p.status === 'done' && p.actualSeconds == null).length};
  }
  function timeline(data,today) {
    const start = data.goals.anchor || data.plan.map(p=>p.date).sort()[0] || data.asOf;
    const end = data.goals.raceDate;
    if (!end || end <= start) return null;
    const days = (Date.parse(end)-Date.parse(start))/86400000;
    return {start,end,daysLeft:Math.max(0,Math.ceil((Date.parse(end)-Date.parse(today))/86400000)),
      progress:Math.max(0,Math.min(1,(Date.parse(today)-Date.parse(start))/(Date.parse(end)-Date.parse(start)))),
      days};
  }
  function aerobicTrend(data,today) {
    // Similar average HR is a comparison filter, not a VO2max estimate.
    const end = today < data.asOf ? today : data.asOf;
    const points = data.activities.filter(a => a.sport === 'running' && a.date >= shift(end,-55) && a.date <= end &&
      a.seconds >= 15*60 && a.distance > 0 && a.heartRate >= 130 && a.heartRate <= 140)
      .map(a => ({date:a.date,pace:a.seconds/a.distance*1000,hr:a.heartRate,minutes:a.seconds/60}))
      .sort((a,b)=>a.date.localeCompare(b.date));
    const earlier = points.filter(p=>p.date < shift(end,-27));
    const recent = points.filter(p=>p.date >= shift(end,-27));
    const mean = (arr,key) => arr.reduce((sum,p)=>sum+p[key],0)/arr.length;
    const enough = earlier.length >= 3 && recent.length >= 3;
    const comparable = enough && Math.abs(mean(earlier,'hr')-mean(recent,'hr')) <= 3 &&
      Math.max(mean(earlier,'minutes'),mean(recent,'minutes'))/
      Math.min(mean(earlier,'minutes'),mean(recent,'minutes')) <= 1.2;
    return {points,earlier:earlier.length,recent:recent.length,comparable,
      paceChange:comparable ? mean(recent,'pace')-mean(earlier,'pace') : null,
      hrChange:comparable ? mean(recent,'hr')-mean(earlier,'hr') : null};
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = {validate,comparison,timeline,aerobicTrend}; return; }
  const root = document.getElementById('training-content');
  const message = document.getElementById('training-message');
  let snapshot = null;
  let loadingPublished = false, publishedCheckedAt = 0;
  const node = (tag, text, cls) => {
    const el = document.createElement(tag); if (text != null) el.textContent = text;
    if (cls) el.className = cls; return el;
  };
  function report(error) {
    console.error('Training snapshot failed',error);
    message.className = 'training-error';
    message.textContent = error.message;
  }
  function svgNode(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg',tag);
    for (const [k,v] of Object.entries(attrs)) el.setAttribute(k,String(v));
    return el;
  }
  function svgText(svg,x,y,text,attrs={}) {
    const el=svgNode('text',{x,y,fill:'white','font-size':14,...attrs});
    el.textContent=text; svg.append(el);
  }
  function drawTimeline(t,today,goals) {
    const svg=svgNode('svg',{viewBox:'0 0 760 245',role:'img','aria-label':`Veien til Birken ${day(t.end)}. ${t.daysLeft} dager igjen. Terrenget er illustrasjon, ikke kondisjonsdata.`});
    const terrain = f => 150-38*Math.sin(f*Math.PI*3)-45*f;
    const coordinates = Array.from({length:81},(_,i)=>`${35+i/80*690},${terrain(i/80)}`);
    svg.append(svgNode('polyline',{points:coordinates.join(' '),fill:'none',stroke:'#ffffff60','stroke-width':3,'stroke-dasharray':'5 5'}));
    const completed = Array.from({length:41},(_,i)=>`${35+i/40*t.progress*690},${terrain(i/40*t.progress)}`);
    svg.append(svgNode('polyline',{points:completed.join(' '),fill:'none',stroke:'#80e4bc','stroke-width':4,class:'training-trail'}));
    const x=35+t.progress*690, y=terrain(t.progress);
    const skier=svgNode('g',{transform:`translate(${x} ${y-8})`,stroke:'#80e4bc','stroke-width':3,fill:'none',class:'training-skier'});
    skier.append(svgNode('circle',{cx:0,cy:-20,r:5}),svgNode('path',{d:'M0 -15 L-8 -5 L5 3 M-8 -5 L-18 3 M-2 -12 L10 -8 L15 5 M-24 8 H17'}));
    svg.append(skier,svgNode('path',{d:`M725 ${terrain(1)} v-50 l-24 6 24 7`,stroke:'white','stroke-width':2,fill:'none'}));
    svgText(svg,35,210,day(t.start),{'font-size':22});
    svgText(svg,725,210,day(t.end),{'text-anchor':'end','font-size':22});
    svgText(svg,Math.max(90,Math.min(655,x)),y-52,'I dag',{'text-anchor':'middle','font-size':24});
    svgText(svg,720,48,'BIRKEN',{'text-anchor':'end','font-weight':700,'font-size':24});
    if (goals.testRaceDate && goals.testRaceDate > t.start && goals.testRaceDate < t.end) {
      const f=(Date.parse(goals.testRaceDate)-Date.parse(t.start))/(Date.parse(t.end)-Date.parse(t.start));
      const sx=35+f*690;
      svg.append(svgNode('circle',{cx:sx,cy:terrain(f),r:5,fill:'white'}));
      svgText(svg,sx,180,'Sjusjøen',{'text-anchor':'middle','font-size':20});
    }
    return svg;
  }
  const paceText = seconds => {
    const rounded=Math.round(seconds);
    return `${Math.floor(rounded/60)}:${String(rounded%60).padStart(2,'0')}`;
  };
  function renderCapacity(today,goals) {
    const card=node('article',null,'training-capacity');
    card.append(node('h2','Kondisjon og stakekapasitet'));
    card.append(node('h3','SkiErg · målt kapasitet mot 18:00'));
    if (goals.fiveKSeconds > 0) {
      const seconds=goals.fiveKSeconds;
      card.append(node('p',`Registrert 5000 m-test: ${paceText(seconds)} (${paceText(seconds/10)}/500 m). Delmål: 18:00 (1:48/500 m). ${seconds > 1080 ? `${paceText(seconds-1080)} gjenstår til delmålet.` : 'Delmålet er nådd.'}`));
      card.append(node('p','Foran/bak en kondisjonsplan krever en datert baseline og avtalte testmål underveis. Denne eksporten har bare siste testresultat, så den dokumenterer ikke en testtrend.'));
    } else {
      card.append(node('p',`Baseline mangler: 5000 m-testen er planlagt ${goals.testDate ? day(goals.testDate) : 'uten dato'}. Etter testen kan vi avtale konkrete testmål frem mot Birken. Foreløpig er kondisjon foran/bak plan ukjent — ikke null fremgang.`));
    }
    card.append(node('p','Sub-18 er et SkiErg-delmål, ikke en garanti for Birken-merket. Sjusjøen og langturene på snø viser om kapasiteten overføres til ski.'));
    const trend=aerobicTrend(snapshot,today);
    card.append(node('h3','Løping · fart ved lignende puls'));
    card.append(node('p',`${trend.points.length} turer siste 8 uker med snittpuls 130–140 bpm og minst 15 min løping. Hvert punkt viser målt snittfart og puls; ingen rett linje fylles inn på dager uten data.`));
    if (trend.points.length) {
      const svg=svgNode('svg',{viewBox:'0 0 640 255',role:'img','aria-label':'Løpetempo ved 130 til 140 bpm. Høyere punkt betyr raskere tempo, ikke en beregnet kondisjonsskår.'});
      const paces=trend.points.map(p=>p.pace);
      const low=Math.min(...paces)-10, high=Math.max(...paces)+10;
      const end=today < snapshot.asOf ? today : snapshot.asOf;
      const start=shift(end,-55);
      for (const v of [low,(low+high)/2,high]) {
        const y=45+(v-low)/(high-low)*135;
        svg.append(svgNode('path',{d:`M65 ${y} H620`,stroke:'#e2e8f0',fill:'none'}));
        svgText(svg,5,y+5,paceText(v),{fill:'#64748b','font-size':20});
      }
      for (const p of trend.points) {
        const x=65+(Date.parse(p.date)-Date.parse(start))/(55*86400000)*555;
        const y=45+(p.pace-low)/(high-low)*135;
        const circle=svgNode('circle',{cx:x,cy:y,r:5,fill:'#236c69'});
        const title=svgNode('title',{});title.textContent=`${day(p.date)}: ${paceText(p.pace)}/km, ${p.hr} bpm`;circle.append(title);svg.append(circle);
      }
      svgText(svg,65,215,day(start),{fill:'#64748b','font-size':20});
      svgText(svg,620,215,day(end),{fill:'#64748b','text-anchor':'end','font-size':20});
      svgText(svg,65,245,'Tempo min/km · høyere = raskere',{fill:'#64748b','font-size':20});
      card.append(svg);
      const latest=node('details');
      latest.append(node('summary','Siste målte løpeturer'));
      for (const p of trend.points.slice(-5).reverse()) latest.append(node('p',`${day(p.date)} · ${paceText(p.pace)}/km · ${p.hr} bpm · ${Math.round(p.minutes)} min`));
      card.append(latest);
    }
    if (trend.comparable) {
      card.append(node('p',`Siste 4 uker mot de 4 før: ${Math.round(Math.abs(trend.paceChange))} sek/km ${trend.paceChange <= 0 ? 'raskere' : 'langsommere'}, snittpulsen endret ${trend.hrChange.toFixed(1)} bpm. Dette er en observasjon, ikke en isolert kondisjonsmåling.`));
    } else card.append(node('p',`Ingen pålitelig periode-sammenligning ennå: ${trend.earlier} turer i første fireukersperiode og ${trend.recent} i siste. Vi krever minst 3 i hver, lignende puls og varighet.`));
    card.append(node('p','Rute, bakker, vær, leggreaksjon, sykdom og disponering påvirker tempoet. Løping og sykling skal ikke omregnes til stakekapasitet. Snakketempo på SkiErg er nyttig kontekst, men en pulsverdi eller én rolig økt gir ikke en kondisjonsprognose.'));
    return card;
  }
  function drawProgress(c) {
    const svg = svgNode('svg',{viewBox:'0 0 640 260',role:'img','aria-label':`Planlagt ${Math.round(c.planned)} minutter, registrert ${Math.round(c.actual)} minutter i sammenlignbare planøkter`});
    const max = Math.max(c.planned,c.actual,1);
    const y = v => 190-v/max*135;
    svg.append(svgNode('path',{d:'M24 190 H616 M24 55 H616',stroke:'#ffffff35',fill:'none'}));
    for (const [key,color] of [['planned','#ffffff90'],['actual','#80e4bc']]) {
      const pts = c.points.map((p,i) => `${24+i*98},${y(p[key])}`);
      svg.append(svgNode('polyline',{points:pts.join(' '),fill:'none',stroke:color,'stroke-width':key === 'actual' ? 4 : 2,'stroke-dasharray':key === 'planned' ? '7 5' : 'none',class:key === 'actual' ? 'training-trail' : ''}));
    }
    // A skier marks the actual line; the flag marks the plan, not race readiness.
    const skier = svgNode('g',{transform:`translate(612 ${y(c.actual)-5})`,stroke:'#80e4bc','stroke-width':3,fill:'none'});
    skier.append(svgNode('circle',{cx:-5,cy:-17,r:4}),svgNode('path',{d:'M-5 -13 L-12 -3 L0 0 M-12 -3 L-22 3 M-8 -9 L4 -5 L8 8 M-27 7 L5 7'}));
    svg.append(skier,svgNode('path',{d:`M610 ${y(c.planned)} v-24 l-14 5 14 5`,stroke:'white',fill:'none','stroke-width':2}));
    for (const [x,text] of [[24,day(c.start)],[540,day(c.end)]]) {
      const label = svgNode('text',{x,y:215,fill:'white','font-size':13}); label.textContent = text; svg.append(label);
    }
    const legend = svgNode('text',{x:24,y:246,fill:'white','font-size':13});
    legend.textContent = 'Grønn: registrert treningstid · stiplet: planlagt'; svg.append(legend);
    return svg;
  }
  function render() {
    root.replaceChildren();
    if (!snapshot) {
      root.append(node('p','Laster publisert treningsplan og økter. Du kan også importere en nyere eksport manuelt.','training-note'));
      return;
    }
    const today = localDate(), c = comparison(snapshot,today), goals = snapshot.goals;
    root.append(node('p',`Oppdatert ${new Date(snapshot.exportedAt).toLocaleString('nb-NO')} · I dag ${day(today)}. Eksporten lastes automatisk; dette er ikke direktesynk med Garmin.`, 'training-note'));
    if (snapshot.asOf < today) root.append(node('p',`Planstatus gjelder til ${day(snapshot.asOf)}. Nyere økter er ikke med før neste import.`, 'training-note'));
    const goal = node('article',null,'training-goal');
    goal.append(node('p',goals.raceDate ? `BIRKEN · ${day(goals.raceDate)} ${goals.raceDate.slice(0,4)}` : 'BIRKEN'),
      node('h2','Målet er merket'));
    const t=timeline(snapshot,today);
    if (t) {
      goal.append(node('p',`${t.daysLeft} dager igjen · ${day(t.start)}–${day(t.end)} ${t.end.slice(0,4)}`));
      const wrap=node('div',null,'training-timeline-wrap');
      wrap.append(drawTimeline(t,today,goals)); goal.append(wrap);
      goal.append(node('p','Skiløperen viser hvor vi er i kalenderen. Bakkene er en illustrasjon, ikke løypeprofil eller beregnet kondisjonsutvikling.'));
    } else goal.append(node('p','Sett Birken-dato i den lokale appen for å se hele tidslinjen.'));
    const milestones=node('div',null,'training-milestones');
    if (goals.testDate) milestones.append(node('p',`${day(goals.testDate)} · 5000 m SkiErg: baseline og senere testmål.`));
    if (goals.snowDate) milestones.append(node('p',`${day(goals.snowDate)} · planlagt overgang til ski: teknikk og lange turer.`));
    if (goals.testRaceDate) milestones.append(node('p',`${day(goals.testRaceDate)} · Sjusjøen ${goals.testRaceKm} km: mål under ${goals.testRaceSeconds/3600} timer.`));
    milestones.append(node('p','Før Birken · SkiErg-delmål 5000 m ≤ 18:00. Datoer for mellomtester avtales etter baseline.'));
    goal.append(milestones);
    const volume=node('details',null,'training-volume');
    volume.append(node('summary','Treningsmengde og gjennomføring · siste 7 dager'),
      node('p',`${c.done} av ${c.slots.length} planplasser registrert${c.replaced ? ` · ${c.replaced} erstattet av annen aktivitet` : ''}, ${day(c.start)}–${day(c.end)}`));
    if (c.planned > 0) {
      const diff = Math.round(c.actual-c.planned);
      volume.append(drawProgress(c),node('p',`${Math.round(c.actual)} / ${Math.round(c.planned)} min i sammenlignbare økter · ${diff < 0 ? `${-diff} min under` : `${diff} min over`} planlagt tid.`));
      if (c.unknown) volume.append(node('p',`${c.unknown} registrerte økter mangler treningstid; sammenligningen er ufullstendig.`));
    }
    volume.append(node('p','Flate partier betyr ingen nye sammenlignbare økter, ikke at kondisjonen står stille. Ekstra sykling, styrke og padel ligger utenfor tidskurven; mer er ikke automatisk bedre.'));
    goal.append(volume);
    root.append(goal,renderCapacity(today,goals));
    root.append(node('h2','Trening siste 7 dager','section'));
    const totals = {};
    for (const a of snapshot.activities.filter(a => a.date >= shift(today,-6) && a.date <= today)) {
      const parts = a.sport === 'skierg' && a.skiErgSeconds != null
        ? [[a.sport,a.skiErgSeconds],['strength',a.strengthSeconds]] : [[a.sport,a.seconds]];
      for (const [sport,seconds] of parts) {
        totals[sport] ??= {seconds:0,distance:0,unknown:0};
        if (seconds == null) totals[sport].unknown++; else totals[sport].seconds += seconds;
        if (sport === a.sport && a.distance != null) totals[sport].distance += a.distance;
      }
    }
    const summary = node('div',null,'training-summary');
    for (const [sport,t] of Object.entries(totals)) {
      const card = node('article');
      card.append(node('p',sport === 'skierg' ? 'SkiErg' : sports[sport]),node('strong',minutes(t.seconds)),
        node('small',`${t.distance ? `${(t.distance/1000).toFixed(1)} km` : 'Ingen distanse registrert'}${t.unknown ? ` · ${t.unknown} med ukjent tid` : ''}`));
      summary.append(card);
    }
    root.append(summary,node('h2','Plan, dag for dag','section'));
    const wheel = node('div',null,'training-days');
    for (const p of snapshot.plan) {
      const card = node('article',null,`training-day${p.date === today ? ' today' : ''}`);
      card.dataset.date = p.date;
      card.append(node('strong',`${p.date === today ? 'I dag · ' : ''}${day(p.date)}`),node('h3',p.title),
        node('p',p.detail),node('p',`${statuses[p.status]}${p.actualSeconds != null ? ` · ${minutes(p.actualSeconds)}` : ''}`));
      wheel.append(card);
    }
    root.append(wheel);
    requestAnimationFrame(() => {
      const card = wheel.querySelector(`[data-date="${today}"]`);
      if (card) wheel.scrollLeft = card.offsetLeft-wheel.firstElementChild.offsetLeft;
    });
    root.append(node('h2','Økter · treningstid, ikke forløpt tid','section'));
    const filter = node('select',null,'training-filter');
    filter.setAttribute('aria-label','Filtrer idrett');
    filter.append(new Option('Alle idretter',''));
    for (const [sport,label] of Object.entries(sports)) filter.append(new Option(label,sport));
    const sessions = node('div',null,'training-sessions');
    const renderSessions = () => {
      sessions.replaceChildren();
      for (const a of snapshot.activities.filter(a => !filter.value || a.sport === filter.value).sort((a,b) => b.date.localeCompare(a.date))) {
        const details = node('details');
        details.append(node('summary',`${day(a.date)} ${a.date.slice(0,4)} · ${sports[a.sport]} · ${minutes(a.seconds)}`));
        details.append(node('p',`Snittpuls: ${a.heartRate == null ? 'ikke tilgjengelig' : `${Math.round(a.heartRate)} bpm`}. Distanse: ${a.distance == null ? 'ikke tilgjengelig' : `${(a.distance/1000).toFixed(2)} km`}.`));
        if (a.skiErgSeconds != null) details.append(node('p',`SkiErg ${minutes(a.skiErgSeconds)} · snittpuls ${a.skiErgHeartRate ?? 'ukjent'} · styrke ${minutes(a.strengthSeconds)}.`));
        details.append(node('p','Puls alene avgjør ikke intensiteten. Snakketest og opplevd anstrengelse gir viktig kontekst. Kart og rådata beholdes i det lokale statistikkverkstedet.'));
        sessions.append(details);
      }
      if (!sessions.children.length) sessions.append(node('p','Ingen økter i dette filteret.','training-note'));
    };
    filter.addEventListener('change',renderSessions); renderSessions();
    root.append(filter,sessions);
  }
  document.getElementById('training-import').addEventListener('click',() => document.getElementById('training-file').click());
  document.getElementById('training-file').addEventListener('change',async event => {
    const file = event.target.files[0]; if (!file) return;
    message.textContent = '';
    try {
      if (file.size > 5*1024*1024) throw new Error('Filen er for stor (maks 5 MB).');
      const incoming = validate(JSON.parse(await file.text()));
      localStorage.setItem(KEY,JSON.stringify(incoming));
      snapshot = incoming; render();
      message.className = 'training-note';
      message.textContent = 'Eksporten er importert og lagret kun i denne nettleseren.';
    } catch (error) { report(error); }
    finally { event.target.value = ''; }
  });
  document.getElementById('training-clear').addEventListener('click',() => {
    if (!confirm('Fjern din lokale import og vis publiserte treningsdata? Andre Ferd-data beholdes.')) return;
    try {
      localStorage.removeItem(KEY); snapshot = null; render();
      message.className = 'training-note'; message.textContent = 'Lokal import fjernet. Henter publiserte data.';
      loadPublished(true);
    }
    catch (error) { report(error); }
  });
  async function loadPublished(force = false) {
    if (loadingPublished || (!force && Date.now()-publishedCheckedAt < 5*60*1000)) return;
    loadingPublished = true;
    const previous = snapshot;
    try {
      const response = await fetch('training-data.json',{cache:'no-store'});
      if (!response.ok) throw new Error(`Kunne ikke hente publiserte treningsdata (HTTP ${response.status}).`);
      const incoming = validate(await response.json());
      // Preserve a manual import made during the request, or one newer than the published file.
      if (snapshot === previous && (!snapshot || Date.parse(incoming.exportedAt) >= Date.parse(snapshot.exportedAt))) {
        snapshot = incoming;
        render();
        message.className = 'training-note';
        message.textContent = 'Publiserte treningsdata er lastet automatisk. Garmin-synk skjer kun lokalt.';
      }
      publishedCheckedAt = Date.now();
    } catch (error) {
      report(new Error(`${error.message} ${snapshot ? 'Tidligere viste data er beholdt.' : 'Prøv igjen ved å åpne Trening-fanen, eller importer en eksport.'}`));
    } finally { loadingPublished = false; }
  }
  try { const stored = localStorage.getItem(KEY); if (stored) snapshot = validate(JSON.parse(stored)); }
  catch (error) { report(error); }
  render();
  loadPublished(true);
  document.addEventListener('visibilitychange',() => { if (!document.hidden) { render(); loadPublished(); } });
  window.addEventListener('ferd-training-open',() => { render(); loadPublished(); });
})();
