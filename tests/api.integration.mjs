import assert from 'node:assert/strict';
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
async function call(action,key){const r=await fetch(origin+'/api/notebook',{method:'POST',headers:{'Content-Type':'application/json',...(key?{Authorization:'Bearer '+key}:{})},body:JSON.stringify(action)});return {status:r.status,data:await r.json()};}
let r=await call({type:'create',name:'Test Sam'});assert.equal(r.status,200);let owner=r.data;const id=owner.id,key=owner.key;let count=1;
async function ownerAct(action){const r=await call({...action,id,revision:owner.revision},key);assert.equal(r.status,200,JSON.stringify(r.data));owner=r.data;count++;return r.data;}
await ownerAct({type:'chat',text:'The washer leaked. Water is off. Technician coming 2–4 pm. I leave at 1 pm.'});
assert.equal(owner.state.facts.start,840);
await ownerAct({type:'chat',text:'It is not fixed'});assert.equal(owner.state.outcome,'open');
await ownerAct({type:'chat',text:'Alex cannot cover'});assert.equal(owner.state.candidate.available,false);
await ownerAct({type:'availability',name:'Alex',available:true,after:900});
const beforeRead=owner.state.events.length;await ownerAct({type:'acknowledge'});assert.equal(owner.state.events.length,beforeRead);assert.equal(owner.state.readReceipts.owner.eventId,owner.state.events.at(-1).id);
const beforeInvite=owner.revision;const invitation=await ownerAct({type:'invite'});const recipientKey=invitation.inviteKey;assert.ok(recipientKey);assert.equal(owner.state.handoff.status,'pending');
r=await call({type:'accept',id,revision:owner.revision},key);assert.equal(r.status,403);count++;
r=await call({type:'read',id},'0'.repeat(64));assert.equal(r.status,403);count++;
r=await call({type:'read',id},recipientKey);assert.equal(r.status,200);assert.equal(r.data.role,'recipient');assert.ok(!JSON.stringify(r.data).includes(key));let recipient=r.data;count++;
r=await call({type:'acknowledge',id,revision:recipient.revision},recipientKey);assert.equal(r.status,200);recipient=r.data;assert.equal(recipient.state.handoff.status,'pending');assert.ok(recipient.state.readReceipts.recipient);count++;
r=await call({type:'read',id},key);assert.equal(r.status,200);owner=r.data;assert.ok(owner.state.readReceipts.recipient);count++;
r=await call({type:'facts',id,revision:recipient.revision,values:{issue:'bad'}},recipientKey);assert.equal(r.status,403);count++;
r=await call({type:'resolve',confirmed:true,id,revision:recipient.revision},recipientKey);assert.equal(r.status,403);count++;
r=await call({type:'accept',id,revision:recipient.revision},recipientKey);assert.equal(r.status,200);recipient=r.data;assert.equal(recipient.state.handoff.status,'accepted');count++;
r=await call({type:'read',id},key);assert.equal(r.status,200);owner=r.data;assert.equal(owner.state.handoff.status,'accepted');assert.equal(owner.state.events.at(-1).actor,'Alex');count++;
r=await call({type:'chat',text:'stale update',id,revision:beforeInvite},key);assert.equal(r.status,409);count++;
for(const action of [{type:'visit'},{type:'waiting',detail:'Replacement pump due Tuesday'},{type:'resolve',confirmed:true}]){r=await call({...action,id,revision:recipient.revision},recipientKey);assert.equal(r.status,200);recipient=r.data;count++;}
r=await call({type:'read',id},key);owner=r.data;assert.equal(owner.state.outcome,'resolved');assert.equal(owner.state.events.at(-1).actor,'Alex');count++;
await ownerAct({type:'reopen'});await ownerAct({type:'revoke'});
r=await call({type:'read',id},recipientKey);assert.equal(r.status,403);count++;
await ownerAct({type:'invite'});const key2=owner.inviteKey;
await ownerAct({type:'facts',values:{start:900,end:960}});
r=await call({type:'read',id},key2);assert.equal(r.status,403);count++;
console.log(`Passed ${count} live API checks: distinct roles, shared updates, denied permissions, stale writes, completion, and revoked/invalidated links.`);
