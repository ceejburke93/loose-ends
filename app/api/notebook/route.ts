import { env } from 'cloudflare:workers';
import { roleFor } from '../../../lib/access.mjs';
import { act, blank, FlowError } from '../../../lib/household.mjs';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
const hash=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
export async function POST(request:Request){try{
 const db=env.DB;if(!db)return json({error:'Shared storage is unavailable. Please try again later.'},503);
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return json({error:'Use this site to make changes.'},403);
 if(Number(request.headers.get('content-length')||0)>10000)return json({error:'Update is too long.'},413);
 const raw=await request.text();if(raw.length>10000)return json({error:'Update is too long.'},413);let body;try{body=JSON.parse(raw)}catch{return json({error:'Invalid request.'},400)};
 if(!body||typeof body!=='object'||Array.isArray(body)||typeof body.type!=='string')return json({error:'Invalid action.'},400);
 const now=Date.now();
 if(body.type==='create'){
  const ip=request.headers.get('cf-connecting-ip');if(ip){const key=await hash(ip+':'+Math.floor(now/3600000));await db.prepare('INSERT INTO quotas (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').bind(key,now+7200000).run();const q:any=await db.prepare('SELECT count FROM quotas WHERE key=?').bind(key).first();if(q.count>20)return json({error:'Too many demo notebooks created. Please try again later.'},429);}
  // Expired rows are inaccessible immediately; bounded cleanup removes old demo data.
  await db.prepare('DELETE FROM notebooks WHERE id IN (SELECT id FROM notebooks WHERE expires < ? LIMIT 25)').bind(now).run();await db.prepare('DELETE FROM quotas WHERE key IN (SELECT key FROM quotas WHERE expires < ? LIMIT 25)').bind(now).run();
  const id=crypto.randomUUID(),ownerToken=token(),name=String(body.name||'Sam').trim().slice(0,40)||'Sam';const state=blank(name),expires=now+7*86400000;await db.prepare('INSERT INTO notebooks (id,state,revision,owner_hash,expires) VALUES (?,?,0,?,?)').bind(id,JSON.stringify(state),await hash(ownerToken),expires).run();return json({id,key:ownerToken,state,revision:0,role:'owner',name,expires});
 }
 if(typeof body.id!=='string'||body.id.length>50)return json({error:'Notebook not found.'},404);const auth=request.headers.get('authorization')?.replace(/^Bearer /,'');if(!auth||!/^[a-f0-9]{64}$/.test(auth))return json({error:'Open your private notebook link to continue.'},401);
 const row:any=await db.prepare('SELECT * FROM notebooks WHERE id=?').bind(body.id).first();if(!row||row.expires<=now)return json({error:'This notebook has expired or does not exist. Start a new demo.'},410);
 const digest=await hash(auth);const role=roleFor(row,digest,now);if(!role)return json({error:'This link is invalid, revoked, or expired.'},403);
 const name=role==='owner'?JSON.parse(row.state).ownerName:row.recipient_name;const current=JSON.parse(row.state);const view=(state=current,revision=row.revision)=>({id:row.id,state,revision,role,name,expires:row.expires,inviteExpires:row.recipient_expires});if(body.type==='read')return json(view());
 if(body.revision!==row.revision)return json({error:'Someone updated this notebook. The latest version is loaded; please review and try again.',...view()},409);
 if(role==='recipient'&&!['read','chat','accept','decline','visit','waiting','resolve','reopen'].includes(body.type))return json({error:'This link can respond to the handoff, not edit its plan.'},403);
 if(role==='recipient'&&['none','revoked','needs-review'].includes(current.handoff.status))return json({error:'The plan changed. Ask the coordinator for a new handoff link.'},403);
 const state=act(current,body,{role,name},now);let recipientHash=row.recipient_hash,recipientName=row.recipient_name,recipientExpires=row.recipient_expires,inviteKey;
 if(body.type==='invite'){inviteKey=token();recipientHash=await hash(inviteKey);recipientName=state.handoff.name;recipientExpires=Math.min(now+24*3600000,row.expires)}
 // Any plan change invalidates the recipient grant, not merely its on-screen status.
 if(['revoke','availability','appointment'].includes(body.type)||body.type==='facts'&&JSON.stringify(state.facts)!==JSON.stringify(current.facts)||state.handoff.status==='needs-review'||body.type==='chat'&&(state.candidate?.name!==current.candidate?.name||JSON.stringify(state.facts)!==JSON.stringify(current.facts)||JSON.stringify(state.candidate)!==JSON.stringify(current.candidate))){recipientHash=null;recipientName=null;recipientExpires=null;}
 const update=await db.prepare('UPDATE notebooks SET state=?,revision=revision+1,recipient_hash=?,recipient_name=?,recipient_expires=? WHERE id=? AND revision=?').bind(JSON.stringify(state),recipientHash,recipientName,recipientExpires,row.id,row.revision).run();if(update.meta.changes!==1)return json({error:'Another update arrived first. Refresh and try again.'},409);
 return json({...view(state,row.revision+1),inviteExpires:recipientExpires,...(inviteKey?{inviteKey}:{} )});
 }catch(e){if(e instanceof FlowError)return json({error:e.message},e.status);console.error('Notebook request failed');return json({error:'Could not save that update. Your previous saved version is unchanged.'},500)}}
