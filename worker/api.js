const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
const deny=()=>json({error:'Approved builder access is required.'},403);
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
async function all(bucket,prefix){
 let cursor,items=[];
 do{const page=await bucket.list({prefix,cursor,include:['customMetadata']});items.push(...page.objects);cursor=page.truncated?page.cursor:undefined;}while(cursor);
 return items;
}
async function api(req,bucket,path){
 const id=req.headers.get('oai-authenticated-user-id'),email=req.headers.get('oai-authenticated-user-email')||'';
 if(!id)return json({error:'Sign in to continue.'},401);
 if(req.method!=='GET' && req.headers.get('Origin')!==new URL(req.url).origin)return deny();
 const key=await hash(id),admin=!!email && await hash(email.trim().toLowerCase())===ownerDigest;
 const approved=admin || !!await bucket.head('approved/'+key);
 if(path==='session')return json({admin,approved,draft:!!await bucket.head('drafts/'+key),requested:!!await bucket.head('requests/'+key),applied:!!await bucket.head('profiles/'+key)});
 if(path==='pricing' && admin){
  if(req.method==='GET'){const value=await bucket.get('settings/future-worker-fee');return json({amount:value?await value.text():'39.99'});}
  if(req.method==='POST'){const {amount}=await req.json();if(typeof amount!=='string'||!/^\d{1,5}(?:\.\d{1,2})?$/.test(amount))return json({error:'Enter a valid dollar amount.'},400);await bucket.put('settings/future-worker-fee',Number(amount).toFixed(2));return json({ok:true});}
 }
 if(path==='builder' && req.method==='POST'){
  const {company}=await req.json();if(!company?.trim()||company.length>120)return json({error:'Enter your company name.'},400);
  await bucket.put('requests/'+key,'',{customMetadata:{company:company.trim(),email}});return json({ok:true});
 }
 if(path==='requests' && admin)return json((await all(bucket,'requests/')).map(o=>({...o.customMetadata,id:o.key.split('/')[1]})));
 if(/^approve\/[a-f0-9]{64}$/.test(path)&&req.method==='POST'&&admin){
  const target=path.split('/')[1];if(!await bucket.head('requests/'+target))return json({error:'Request no longer available.'},404);
  await bucket.put('approved/'+target,'yes');await bucket.delete('requests/'+target);return json({ok:true});
 }
 if(path==='apply'&&req.method==='DELETE'){await bucket.delete('drafts/'+key);await bucket.delete('profiles/'+key);return json({ok:true});}
 if(path==='apply'&&req.method==='POST'){
  if(Number(req.headers.get('content-length'))>5300000)return json({error:'Maximum PDF size is 5 MB.'},413);
  const f=await req.formData(),resume=f.get('resume'),meta={};
  for(const n of ['name','trade','area','availability','email','phone']){const v=f.get(n);if(typeof v!=='string'||v.length>100||(!v.trim()&&n!=='phone'))return json({error:'Check the contact and work fields.'},400);meta[n]=v.trim();}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(meta.email)||f.get('consent')!=='on'||!resume?.size||resume.size>5000000||await resume.slice(0,5).text()!=='%PDF-')return json({error:'Check the email, consent and PDF (up to 5 MB).'},400);
  const rate=f.get('rate');if(typeof rate!=='string'||!/^\d{1,5}(?:\.\d{1,2})?$/.test(rate)||Number(rate)<=0)return json({error:'Enter a valid hourly rate.'},400);
  meta.rate=Number(rate).toFixed(2);
  const prefix='profiles/';
  await bucket.put(prefix+key,await resume.arrayBuffer(),{customMetadata:meta});await bucket.delete('drafts/'+key);return json({ok:true});
 }
 if(!approved)return deny();
 if(path==='workers'&&req.method==='GET')return json((await all(bucket,'profiles/')).map(o=>({...o.customMetadata,id:o.key.split('/')[1]})));
 if(/^resume\/[a-f0-9]{64}$/.test(path)&&req.method==='GET'){
  const o=await bucket.get('profiles/'+path.split('/')[1]);return o?new Response(o.body,{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="worker-resume.pdf"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}}):json({error:'Profile withdrawn.'},404);
 }
 return json({error:'Unavailable.'},404);
}
export default {async fetch(req,env){
 let p=new URL(req.url).pathname;if(/^\/labor\/checkout(?:\/index\.html|\/)?$/.test(p))return Response.redirect(new URL('/labor/signup/',req.url),302);if(p.startsWith('/api/labor/')){try{return await api(req,env.BUCKET,p.slice(11));}catch{return json({error:'Unable to complete the request. Please retry.'},503);}}
 if(p.endsWith('/'))p+='index.html';const f=Object.hasOwn(files,p)&&files[p];if(!f)return new Response('Not found',{status:404});
 return new Response(req.method==='HEAD'?null:Uint8Array.from(atob(f[1]),c=>c.charCodeAt(0)),{headers:{'Content-Type':f[0]}});
}};
