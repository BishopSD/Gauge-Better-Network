const content=document.querySelector('#content'),status=document.querySelector('#status');
const find=new URLSearchParams(location.search).get('view')==='find';
document.querySelectorAll('nav a')[Number(find)].setAttribute('aria-current','page');
async function api(path,options){const r=await fetch('/api/labor/'+path,options);const value=await r.json();if(!r.ok)throw Object.assign(new Error(value.error),{code:r.status});return value;}
function element(tag,text,parent){const n=document.createElement(tag);n.textContent=text;parent.append(n);return n;}
function wire(form,action){form.onsubmit=async e=>{e.preventDefault();const button=form.querySelector('button');button.disabled=true;try{await action(new FormData(form));}catch(e){status.textContent=e.message;}finally{button.disabled=false;}};}
async function render(){
 const s=await api('session');content.replaceChildren();
 if(!find){
 content.innerHTML='<form><h2>Apply to join a skilled crew</h2><p>Enter your contact details, requested hourly pay and résumé. Worker registration is free.</p></form>';
 const form=content.querySelector('form');
 for(const [n,title,type] of [['name','Full name','text'],['trade','Trade or specialty','text'],['area','California cities or counties served','text'],['availability','Availability or earliest start date','text'],['rate','Requested hourly pay (USD per hour)','number'],['email','Contact email','email'],['phone','Phone (optional)','tel'],['resume','Résumé (PDF, up to 5 MB)','file']]){const l=element('label',title,form),i=element('input','',l);i.type=type;i.name=n;i.required=n!=='phone';if(n==='rate'){i.min='0.01';i.step='0.01';i.max='99999.99';}else if(type==='file')i.accept='application/pdf';else i.maxLength=100;}
 form.insertAdjacentHTML('beforeend','<label class="check"><input type="checkbox" required name="consent"> I agree to share my résumé and contact information with GBN and approved builders for crew opportunities.</label><button class="btn btn-lime">Save worker profile</button>');
 wire(form,async data=>{await api('apply',{method:'POST',body:data});status.textContent='Profile saved and available to approved builders.';await render();});
 if(s.applied||s.draft){const box=element('article','',content);element('p',s.draft?'Your previous draft is private. Submit the form above to share a profile with approved builders for free.':'Your profile is available to approved builders. Submit a new application to replace it, or withdraw it below.',box);const f=element('form','',box);element('button','Withdraw profile and résumé',f);wire(f,async()=>{await api('apply',{method:'DELETE'});status.textContent='Profile and résumé withdrawn.';await render();});}return;
 }
 if(!s.approved){if(s.requested){element('article','GBN is reviewing your builder access request.',content);return;}
 content.innerHTML='<form><h2>Request builder access</h2><p>GBN reviews builder requests before sharing worker contact details and résumés.</p><label>Company name<input name="company" maxlength="120" required></label><button class="btn btn-lime">Request access</button></form>';wire(content.firstChild,async data=>{await api('builder',{method:'POST',body:JSON.stringify(Object.fromEntries(data))});await render();});return;}
 content.innerHTML='<section class="panel"><h2>Find skilled workers</h2><label>Filter by trade, service area or availability<input type="search" placeholder="e.g. ironworker, Riverside"></label><div id="results"></div></section>';
 const rows=await api('workers'),input=content.querySelector('input'),out=content.querySelector('#results');
 function filter(){out.replaceChildren();const terms=input.value.toLowerCase().split(/[\s,]+/).filter(Boolean);const match=rows.filter(w=>terms.every(t=>[w.trade,w.area,w.availability].join(' ').toLowerCase().includes(t)));if(!match.length)element('p',rows.length?'No workers match this search.':'No worker profiles have been submitted yet.',out);
 for(const w of match){const card=element('article','',out);element('h3',w.name,card);element('p',w.trade+' · '+w.area,card);element('p','Availability: '+w.availability,card);if(w.rate)element('p','Requested pay: $'+w.rate+' per hour',card);element('p',[w.email,w.phone].filter(Boolean).join(' · '),card);element('a','Download résumé',card).href='/api/labor/resume/'+w.id;}}
 input.oninput=filter;filter();
 if(s.admin){
  const pricing=await api('pricing');
  const form=element('form','',content);
  element('h2','Worker registration pricing',form);
  element('p','Signup is free. Save a proposed fee here for future use. Collecting payments requires a separate checkout update.',form);
  const label=element('label','Proposed one-time fee (USD)',form),amount=element('input','',label);
  Object.assign(amount,{type:'number',name:'amount',min:'0',max:'99999.99',step:'0.01',required:true,value:pricing.amount});
  element('button','Save proposed fee',form);
  wire(form,async data=>{await api('pricing',{method:'POST',body:JSON.stringify(Object.fromEntries(data))});status.textContent='Proposed fee saved. Signup is free.';});
  const requests=await api('requests');const box=element('section','',content);element('h2','Builder access requests',box);if(!requests.length)element('p','No pending requests.',box);for(const b of requests){const f=element('form','',box);element('p',b.company+' · '+b.email,f);element('button','Approve builder access',f);wire(f,async()=>{await api('approve/'+b.id,{method:'POST'});await render();});}}
}
render().catch(e=>{status.textContent=e.message;if(e.code===401){const a=element('a','Sign in with ChatGPT',content);a.target='_top';a.href='/signin-with-chatgpt?return_to='+encodeURIComponent(location.pathname+location.search);}});
