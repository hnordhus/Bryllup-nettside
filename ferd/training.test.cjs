const {test} = require('node:test');
const assert = require('node:assert/strict');
const {validate,comparison,timeline,aerobicTrend} = require('./training.js');

function fixture() {
  return {
    schemaVersion:1, exportedAt:'2026-11-05T09:00:00+01:00', asOf:'2026-11-05',
    goals:{raceDate:'2027-03-20',testRaceDate:'2027-02-13',testRaceKm:42,testRaceSeconds:10800,fiveKSeconds:null,testDate:'2026-11-06'},
    activities:[{id:'session-1',date:'2026-11-04',sport:'skierg',seconds:1800,distance:null,heartRate:130,skiErgSeconds:900,skiErgHeartRate:125,strengthSeconds:900}],
    plan:[
      {date:'2026-11-03',sport:'running',kind:'run',title:'Padel',detail:'Erstattet',minutes:null,status:'replaced',optional:false,sessionId:null},
      {date:'2026-11-04',sport:'skierg',kind:'easy',title:'Rolig',detail:'Rolig',minutes:30,status:'done',optional:false,actualSeconds:900,actualHeartRate:125,sessionId:'session-1'},
      {date:'2026-11-05',sport:'running',kind:'run',title:'Løp',detail:'Rolig',minutes:25,status:'planned',optional:false,sessionId:null},
    ],
  };
}
test('valid snapshot with SkiErg-only training time',() => {
  const data = validate(fixture()), c = comparison(data,'2026-11-05');
  assert.equal(c.planned,30); assert.equal(c.actual,15);
  assert.equal(c.slots.length,2); assert.equal(c.replaced,1); assert.equal(c.done,1);
});
test('future sessions, optional and rest days do not create a deficit',() => {
  const data = fixture();
  data.plan.push({...data.plan[1],date:'2026-11-01',status:'rest'});
  data.plan.push({...data.plan[1],date:'2026-11-02',optional:true});
  const c = comparison(data,'2026-11-05');
  assert.equal(c.planned,30); assert.equal(c.actual,15);
});
test('old exports stop at the last snapshot date',() => {
  const c = comparison(fixture(),'2026-12-01');
  assert.equal(c.end,'2026-11-05'); assert.equal(c.planned,55);
});
test('unknown actual time is explicit',() => {
  const data = fixture(); data.plan[1].actualSeconds = null;
  assert.equal(comparison(data,'2026-11-05').unknown,1);
});
test('reject secrets and malformed records',() => {
  for (const change of [
    d => {d.garminKey='secret';},
    d => {d.activities[0].coordinates=[60,10];},
    d => {d.activities[0].seconds=-1;},
    d => {d.plan[1].sessionId='missing';},
    d => {d.asOf='2026-02-30';},
    d => {d.activities.push({...d.activities[0]});},
    d => {d.goals.raceDate=123;},
    d => {d.plan[1].title={};},
  ]) {
    const d=fixture(); change(d); assert.throws(() => validate(d));
  }
});
test('calendar timeline extends to the exact Birken date and clamps position',() => {
  const data=fixture(); data.goals.anchor='2026-10-24'; data.goals.snowDate='2027-01-01';
  validate(data);
  const t=timeline(data,'2026-11-05');
  assert.equal(t.end,'2027-03-20'); assert.equal(t.daysLeft,135);
  assert(t.progress>0 && t.progress<0.1);
  assert.equal(timeline(data,'2026-10-01').progress,0);
  assert.equal(timeline(data,'2027-04-01').progress,1);
  data.goals.raceDate=''; assert.equal(timeline(data,'2026-11-05'),null);
});
test('running indicators require measured pace and comparable HR, not elapsed days or minutes',() => {
  const data=fixture();
  data.activities=[];
  for (const [i,date] of ['2026-09-15','2026-09-20','2026-09-25','2026-10-15','2026-10-20','2026-10-25'].entries()) {
    data.activities.push({id:`session-${i+1}`,date,sport:'running',seconds:1200,distance:1200/(i<3?360:330)*1000,heartRate:135});
  }
  const t=aerobicTrend(data,'2026-11-05');
  assert.equal(t.points.length,6); assert.equal(t.comparable,true);
  assert.equal(Math.round(t.paceChange),-30);
  data.activities[0].heartRate=180;
  assert.equal(aerobicTrend(data,'2026-11-05').comparable,false);
});
test('higher HR or substantially different duration prevents a fitness trend claim',() => {
  const data=fixture(); data.activities=[];
  for (const [i,date] of ['2026-09-15','2026-09-20','2026-09-25','2026-10-15','2026-10-20','2026-10-25'].entries()) {
    data.activities.push({id:`session-${i+1}`,date,sport:'running',seconds:1200,distance:3500,heartRate:i<3?130:140});
  }
  assert.equal(aerobicTrend(data,'2026-11-05').comparable,false);
  data.activities.forEach((a,i)=>{a.heartRate=135;if(i>=3)a.seconds=1800;});
  assert.equal(aerobicTrend(data,'2026-11-05').comparable,false);
});
test('no tests or suitable runs means unknown fitness, not zero or a volume-derived score',() => {
  const t=aerobicTrend(fixture(),'2026-11-05');
  assert.equal(t.points.length,0);assert.equal(t.paceChange,null);assert.equal(t.comparable,false);
});
