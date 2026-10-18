import {clock,gap} from './household.mjs';
const legacyKind=e=>e.kind||(/Repair details updated/.test(e.text)?'facts':/technician confirmed/.test(e.text)?'appointment':/available after|cannot cover/.test(e.text)?'availability':/accepted responsibility/.test(e.text)?'accept':/Handoff offered/.test(e.text)?'invite':/declined/.test(e.text)?'decline':/revoked/.test(e.text)?'revoke':/visited/.test(e.text)?'visit':/Repair still open/.test(e.text)?'waiting':/repair closed/.test(e.text)?'resolve':/reopened/.test(e.text)?'reopen':/approved/.test(e.text)?'approve':null);
export function brief(s,role='owner'){
 const events=s.events||[],latest=(...kinds)=>events.slice().reverse().find(e=>kinds.includes(legacyKind(e)))||null;
 const receipt=s.readReceipts?.[role];const ix=receipt?events.findIndex(e=>e.id===receipt.eventId):-1;
 const unseen=receipt&&ix>=0?events.slice(ix+1):events;
 const owner=s.handoff.status==='accepted'?s.handoff.name:s.ownerName;
 const facts=[{label:'Follow-up owner',value:owner+(s.handoff.status==='accepted'?' · accepted':' · not yet handed over'),source:latest('accept','invite','decline','revoke','availability','facts','appointment')}];
 if(s.facts.start!=null&&s.facts.end!=null)facts.push({label:'Technician window',value:clock(s.facts.start)+'–'+clock(s.facts.end)+(s.appointmentConfirmed?' · confirmation reported':' · recorded appointment'),source:latest('appointment','facts')});
 if(s.candidate)facts.push({label:s.candidate.name,value:s.candidate.available?'Available after '+clock(s.candidate.availableAfter):'Cannot cover',source:latest('availability')});
 if(s.facts.waterOff)facts.push({label:'Water supply',value:'Reported off',source:latest('facts')});
 const open=[];const g=gap(s);if(s.outcome!=='resolved'){
 if(g)open.push({text:`No coverage is recorded from ${clock(g.start)} to ${clock(g.end)}`,source:latest('availability','facts','appointment')});
 if(s.handoff.status==='pending')open.push({text:`${s.handoff.name} hasn’t accepted the handoff yet.`,source:latest('invite')});
 if(s.appointmentRequest==='approved')open.push({text:'The message was approved in the demo, not sent. No later arrival is confirmed.',source:latest('approve')});
 if(s.visit==='visited'&&s.outcome==='open')open.push({text:'The technician visited, but nobody has confirmed the repair worked.',source:latest('visit','reopen')});
 if(s.outcome==='waiting')open.push({text:s.part||'Another repair step is still pending.',source:latest('waiting')});
 if(s.facts.start==null||s.facts.end==null)open.push({text:'The technician’s visit window is missing.',source:null});
 if(s.facts.leave==null)open.push({text:'The coordinator’s departure time is missing; coverage can’t be checked.',source:null});
 }
 const next=s.outcome==='resolved'?'Nothing left to hand over. The repair is confirmed working.':s.outcome==='waiting'?`${owner}: confirm the next repair step and when to follow up.`:s.visit==='visited'?`${owner}: check whether the repair worked before closing it.`:s.handoff.status==='pending'?`${s.handoff.name}: review the brief, then accept or decline. ${s.ownerName} keeps responsibility until acceptance.`:g?`${owner}: arrange coverage or record a confirmed change to the visit window.`:!s.candidate?.available?`${owner}: find someone who can meet the technician.`:s.handoff.status!=='accepted'?`${s.ownerName}: offer the handoff and wait for acceptance.`:`${owner}: meet the technician and report the result.`;
 const speech=[s.title+'.',...facts.map(f=>f.label+': '+f.value+'.'),...open.slice(0,2).map(x=>x.text),'Next: '+next].join(' ');
 return {owner,facts,open,next,unseen,lastRead:receipt?.at||null,resolutionSource:latest('resolve'),historyTruncated:!!receipt&&receipt.eventId!=null&&ix<0&&events.length>0,speech};
}
// The guide observes real record state. It never manufactures a recipient acceptance.
export function tourStep(s){
 if(s.outcome==='resolved')return {index:9,title:'That loose end is tied up.',detail:'The visit, pending part, and named completion are saved for both people.',button:null,action:null};
 if(s.outcome==='waiting')return {index:8,title:'Close the outcome, not the visit.',detail:'For this fictional demo, confirm that the replacement worked. The history keeps the person who confirmed it.',button:'Confirm the demo washer works',action:{type:'resolve',confirmed:true}};
 if(s.visit==='visited')return {index:7,title:'A visit isn’t a fix.',detail:'The repair is still open. Record that a part is pending so the next person knows why.',button:'Record a pending replacement part',action:{type:'waiting',detail:'Replacement pump pending; delivery estimate and return visit needed'}};
 if(s.handoff.status==='accepted')return {index:6,title:'Someone has actually taken over.',detail:s.handoff.name+' accepted through their separate link. In their view, record the visit to continue.',button:'Record the technician’s visit',action:{type:'visit'}};
 if(s.handoff.status==='pending')return {index:5,title:'Now let the other person answer.',detail:'Open the recipient link in a separate tab or send it privately to a tester. They must choose “I’ll take the follow-up”. This guide cannot accept for them.',button:null,action:null};
 if(s.appointmentConfirmed)return {index:4,title:'A confirmed plan can be handed over.',detail:'Create the recipient link. The original person stays responsible until the other person accepts.',button:'Create Alex’s recipient link',action:{type:'invite'}};
 if(s.draft?.status==='approved')return {index:3,title:'Approval is not confirmation.',detail:'Nothing was sent. For this fictional story, record a sample technician reply agreeing to 3–4 p.m.',button:'Record the sample 3–4 p.m. confirmation',action:{type:'appointment',start:900,end:960}};
 if(s.candidate?.available)return {index:2,title:'Put the request in plain words.',detail:'Drafting a request doesn’t change the appointment. Review and approve the specific draft to continue.',button:s.draft?'Approve this demo draft':'Draft the technician request',action:s.draft?{type:'approve',draftId:s.draft.id}:{type:'draft'}};
 if(s.facts.issue)return {index:1,title:'Spot the hour nobody owns.',detail:'Sam leaves at 1. The technician may arrive at 2. Alex is only available after 3.',button:'Record Alex as available after 3',action:{type:'availability',name:'Alex',available:true,after:900}};
 return {index:0,title:'Start with the messy update.',detail:'A leaking washer. A technician window. Someone who has to leave. One person is holding all the context.',button:'Record the washer update',action:{type:'chat',text:'The washer leaked. Water is off. The technician is coming 2–4 pm, but I leave at 1 pm.'}};
}
