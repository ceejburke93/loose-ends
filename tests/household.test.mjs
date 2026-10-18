import {test} from 'node:test';
import assert from 'node:assert/strict';
import {act,blank,gap,parseTime} from '../lib/household.mjs';
const sam={role:'owner',name:'Sam'},alex={role:'recipient',name:'Alex'};
const update=(s,text)=>act(s,{type:'chat',text},sam);
function repair(){return update(blank(),'The washer leaked. Water is off. The technician is coming 2–4 pm, but I leave at 1 pm.')}
function available(){return update(repair(),'Alex can cover after 3 pm')}
function accepted(){let s=act(available(),{type:'invite'},sam);return act(s,{type:'accept'},alex)}
test('extracts actual visit, departure and issue instead of inserting defaults',()=>{const s=update(blank(),'The washer leaked. Technician coming 10 am to 12 pm. I leave at 9 am.');assert.equal(s.facts.start,600);assert.equal(s.facts.end,720);assert.equal(s.facts.leave,540);assert.equal(s.facts.waterOff,false);assert.equal(s.facts.issue,'The washer leaked')});
test('washer example captures 2–4, 1 departure and water off',()=>{const s=repair();assert.equal(s.facts.start,840);assert.equal(s.facts.end,960);assert.equal(s.facts.leave,780);assert.equal(s.facts.waterOff,true)});
for(const phrase of ['It is not fixed','It isn’t working again','It does not work','It is still broken','Not sure it is fixed'])test('does not close: '+phrase,()=>assert.notEqual(update(repair(),phrase).outcome,'resolved'));
for(const phrase of ['Alex cannot cover','Alex can’t cover','Alex is not available'])test('does not assign: '+phrase,()=>{const s=update(available(),phrase);assert.equal(s.candidate.available,false);assert.equal(s.handoff.status,'none')});
test('actual availability creates correct gap',()=>assert.deepEqual(gap(available()),{start:840,end:900,whole:false}));
test('availability after the window requests rescheduling rather than an impossible window',()=>{let s=act(repair(),{type:'availability',name:'Jo',available:true,after:1020},sam);s=act(s,{type:'draft'},sam);assert.match(s.draft.text,/later visit/);assert.doesNotMatch(s.draft.text,/between 5 p.m. and 4 p.m./)});
test('yes before a draft cannot approve anything',()=>{const s=update(available(),'yes');assert.equal(s.draft,null);assert.equal(s.appointmentRequest,'none')});
test('approval requires exact pending draft and can happen only once',()=>{let s=act(available(),{type:'draft'},sam);assert.throws(()=>act(s,{type:'approve',draftId:'stale'},sam));s=act(s,{type:'approve',draftId:s.draft.id},sam);assert.equal(s.draft.status,'approved');assert.throws(()=>act(s,{type:'approve',draftId:s.draft.id},sam));assert.equal(s.appointmentConfirmed,false)});
test('negative approval does not approve',()=>{const s=update(act(available(),{type:'draft'},sam),"don't send it");assert.equal(s.draft.status,'pending')});
test('changing availability invalidates a previous approval',()=>{let s=act(available(),{type:'draft'},sam);s=act(s,{type:'approve',draftId:s.draft.id},sam);s=update(s,'Alex can cover after 4 pm');assert.equal(s.draft,null);assert.equal(s.appointmentRequest,'none');assert.equal(s.candidate.availableAfter,960)});
test('owner remains responsible until separate recipient accepts',()=>{let s=act(available(),{type:'invite'},sam);assert.equal(s.handoff.status,'pending');assert.throws(()=>act(s,{type:'accept'},sam));s=act(s,{type:'accept'},alex);assert.equal(s.handoff.status,'accepted');assert.equal(s.events.at(-1).actor,'Alex')});
test('declining retains original owner',()=>{const s=act(act(available(),{type:'invite'},sam),{type:'decline'},alex);assert.equal(s.handoff.status,'declined');assert.equal(s.ownerName,'Sam')});
test('recipient cannot change availability or record outcome before acceptance',()=>{const s=act(available(),{type:'invite'},sam);assert.throws(()=>act(s,{type:'availability',name:'Alex',available:true,after:900},alex));assert.throws(()=>act(s,{type:'resolve',confirmed:true},alex))});
test('visit is not completion, pending part remains open, recipient can close with confirmation',()=>{let s=act(accepted(),{type:'visit'},alex);assert.equal(s.outcome,'open');s=act(s,{type:'waiting',detail:'Pump due Tuesday'},alex);assert.equal(s.outcome,'waiting');assert.throws(()=>act(s,{type:'resolve'},alex));s=act(s,{type:'resolve',confirmed:true},alex);assert.equal(s.outcome,'resolved');assert.equal(s.events.at(-1).actor,'Alex')});
test('plan changes require a new accepted handoff',()=>{const s=act(accepted(),{type:'facts',values:{start:900,end:1020}},sam);assert.equal(s.handoff.status,'needs-review');assert.throws(()=>act(s,{type:'visit'},alex))});
test('revoke removes active responsibility from recipient',()=>{const s=act(accepted(),{type:'revoke'},sam);assert.equal(s.handoff.status,'revoked');assert.throws(()=>act(s,{type:'visit'},alex))});
test('negative outcome reopens a closed repair',()=>{const closed=act(accepted(),{type:'resolve',confirmed:true},alex);assert.equal(update(closed,'It is not fixed').outcome,'open')});
test('question about completion never closes it',()=>assert.equal(update(repair(),'Is it fixed?').outcome,'open'));
test('invalid windows rejected without mutating input',()=>{const s=repair();assert.throws(()=>act(s,{type:'facts',values:{start:1000,end:800}},sam));assert.equal(s.facts.start,840)});
test('unsupported chat adds no invented facts',()=>{const s=update(repair(),'The dog ate my homework');assert.deepEqual(s.facts,repair().facts)});
test('time parsing is explicit for morning and afternoon',()=>{assert.equal(parseTime('9:30 am'),570);assert.equal(parseTime('3 pm'),900);assert.equal(parseTime('25'),null)});
test('coordinator coverage before departure is included in gap detection',()=>{let s=act(repair(),{type:'facts',values:{leave:900}},sam);s=act(s,{type:'availability',name:'Alex',available:true,after:900},sam);assert.equal(gap(s),null);s=act(s,{type:'availability',name:'Alex',available:true,after:930},sam);assert.deepEqual(gap(s),{start:900,end:930,whole:false})});
test('unknown departure is not treated as absent coordinator',()=>{let s=act(repair(),{type:'facts',values:{leave:null}},sam);s=act(s,{type:'availability',name:'Alex',available:true,after:900},sam);assert.equal(gap(s),null);assert.match(s.messages.at(-1).text,/when you leave/)});
