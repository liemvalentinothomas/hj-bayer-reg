export type Receipt={id:string;number:string;name:string;phone:string;createdAt:string;eventId:string;slug:string;eventName:string;startsAt:string|null;location:string|null};
export const receiptKey=(slug:string)=>'hj-registration:'+slug;
export const pendingKey=(slug:string)=>'hj-registration-pending:'+slug;
export const randomToken=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
