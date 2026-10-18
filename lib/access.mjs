// Bearer grants are scoped to one notebook. Raw keys are never stored in D1.
export function roleFor(row,digest,now){
 if(!row||row.expires<=now)return null;
 if(digest===row.owner_hash)return 'owner';
 if(row.recipient_hash&&digest===row.recipient_hash&&row.recipient_expires>now)return 'recipient';
 return null;
}
