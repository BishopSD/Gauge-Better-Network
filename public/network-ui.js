/* Additive GBN features: owner partner CRM and public sourcing guide. */
(()=>{
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const qs=(s,root=document)=>root.querySelector(s);
 const fetchJson=async(url,options={})=>{
   const r=await fetch(url,{credentials:'same-origin',headers:{'Content-Type':'application/json'},...options});
   let obj={};try{obj=await r.json();}catch(e){}
   if(!r.ok)throw Error(obj.detail||'Request failed');return obj;
 };
 const statusOptions=['prospect','review','approved','all_star','paused'];
 const kindOptions=['builder','manufacturer','supplier','fabricator','installer','logistics','engineering'];
 const options=(items,val)=>items.map(x=>`<option value="${x}" ${x===val?'selected':''}>${esc(x.replaceAll('_',' '))}</option>`).join('');
 const formFields=(co={})=>`<input type="hidden" name="record_id" value="${esc(co.id||'')}">
 <label>Company name<input name="company" maxlength="160" required value="${esc(co.company||'')}"></label>
 <label>Category<select name="kind">${options(kindOptions,co.kind||'supplier')}</select></label>
 <label>Company country (verify before approval)<input name="country" value="${esc(co.country??'United States')}" placeholder="United States"></label>
 <label>Services / shipping regions<input name="regions" placeholder="California, Riverside, San Diego" value="${esc(co.regions||'')}"></label>
 <label class="wide">Materials and specialties<textarea name="capabilities" rows="2">${esc(co.capabilities||'')}</textarea></label>
 <label>Contact name<input name="contact_name" value="${esc(co.contact_name||'')}"></label>
 <label>Business email<input type="email" name="email" value="${esc(co.email||'')}"></label>
 <label>Phone<input name="phone" value="${esc(co.phone||'')}"></label>
 <label>Website<input type="url" name="website" value="${esc(co.website||'')}"></label>
 <label class="wide">Research source URL<input type="url" name="source_url" value="${esc(co.source_url||'')}"></label>
 <label class="wide">Steel source / imports (private owner notes)<textarea name="steel_origin_notes" rows="2" placeholder="Imported steel is permitted. Record claims or documentation, if available">${esc(co.steel_origin_notes||'')}</textarea></label>
 <label>Relationship status<select name="status">${options(statusOptions,co.status||'prospect')}</select></label>
 <label class="checkline"><input name="exception_approved" type="checkbox" ${co.exception_approved?'checked':''}>I explicitly authorize a non-U.S. supplier exception (China excluded)</label>
 <label class="wide">Reason for overseas exception (20+ characters to approve)<textarea name="exception_reason" rows="2">${esc(co.exception_reason||'')}</textarea></label>
 <label class="checkline"><input name="verified" type="checkbox" ${co.verified?'checked':''}>I verified this company's credentials and capabilities</label>
 <label class="checkline"><input name="public_visible" type="checkbox" ${co.public_visible?'checked':''}>Show this approved partner in public directory</label>
 <label class="wide">Private owner notes<textarea name="notes" rows="2">${esc(co.notes||'')}</textarea></label>
 <div class="wide"><button class="btn btn-dark" type="submit">${co.id?'Save updates':'Add company to my network'}</button> <button class="copy-button" id="gbnResetCompany" type="button">Clear form</button><p class="form-feedback" id="gbnCompanyFeedback" role="status"></p></div>`;
 async function initOwner(ownerContent,projects){
   const widget=document.createElement('section');widget.id='gbnNetworkAdmin';widget.className='gbn-admin';
   const h=qs('h3',ownerContent); if(h)h.before(widget);else ownerContent.appendChild(widget);
   let companies=[];
   async function reload(){
      const payload=await fetchJson('/api/admin/network/companies'); companies=payload.companies;
      draw();
   }
   function draw(){
    widget.innerHTML=`<details open><summary><strong>All-Star Network + AI Prospect Discovery (${companies.length})</strong></summary>
      <p class="small-note">U.S. firms are preferred and may offer imported steel. Overseas (non-China) exceptions require your approval and written reason. Only verified U.S. partners can become All-Stars.</p>
      <form id="gbnCompanyForm" class="form-grid">${formFields()}</form>
      <details><summary>Search for new potential partners (owner-only)</summary><p class="small-note">Uses the optional Brave Search API to find U.S. prospects. Search hits remain unverified and may not be American companies. No outreach occurs automatically. China/Alibaba discovery remains disabled. U.S. importers are eligible for review.</p>
      <form id="gbnDiscoverForm" class="form-grid">
        <label class="wide">Search keywords<input name="query" required value="US based cold formed steel framing manufacturers California"></label>
        <label>Category<select name="kind">${options(kindOptions,'manufacturer')}</select></label>
        <label>Country<input name="country" value="United States" readonly></label>
        <button type="submit" class="btn btn-dark">Discover prospects</button><span id="gbnDiscoveryStatus" class="form-feedback" role="status"></span>
      </form></details>
      <label>Filter network <input id="gbnCompanyFilter" placeholder="Company, status, country, capabilities"></label>
      <div id="gbnCompanyList"></div>
      <details><summary>Get matches for a builder's project</summary><p>Matches are suggestions; no plan or contact data is shared by this search.</p>
      <select id="gbnProjectSelect"><option value="">Select a project</option>${projects.projects.map(p=>`<option value="${esc(p.id)}">${esc(p.title)} (${esc(p.location)})</option>`).join('')}</select>
      <button type="button" id="gbnRecommend" class="copy-button">Rank network companies</button><div id="gbnMatchResults" role="status"></div></details>
    </details>`;
    const form=qs('#gbnCompanyForm',widget);
    function renderList(){
      const term=qs('#gbnCompanyFilter',widget).value.toLowerCase();
      const matching=companies.filter(c=>[c.company,c.kind,c.status,c.capabilities,c.regions,c.country].join(' ').toLowerCase().includes(term));
      qs('#gbnCompanyList',widget).innerHTML=matching.slice(0,125).map(c=>`<div class="gbn-admin-company"><strong>${esc(c.company)}</strong> · ${esc(c.kind)} · ${esc(c.country||'Country unverified')} <small>${esc(c.status.replaceAll('_',' ').toUpperCase())}${c.exception_approved?' · OWNER EXCEPTION':''}</small>
        <div class="small-note">${esc(c.capabilities||'Capabilities to be verified')} · ${esc(c.regions||'Coverage unknown')}</div>
        <button type="button" class="copy-button" data-edit-company="${esc(c.id)}">Edit / verify / promote</button>
        ${c.source_url?`<a href="${esc(c.source_url)}" target="_blank" rel="noopener noreferrer">Source ↗</a>`:''}</div>`).join('')||'<p>No matching network records.</p>';
      widget.querySelectorAll('[data-edit-company]').forEach(button=>button.addEventListener('click',()=>{
         const found=companies.find(c=>c.id===button.dataset.editCompany);if(!found)return;
         form.innerHTML=formFields(found); form.scrollIntoView({behavior:'smooth',block:'nearest'});
         qs('#gbnResetCompany',form).onclick=()=>{form.innerHTML=formFields();wireReset();};
      }));
    }
    function wireReset(){qs('#gbnResetCompany',form).onclick=()=>{form.innerHTML=formFields();wireReset();};}
    wireReset();renderList();
    qs('#gbnCompanyFilter',widget).oninput=renderList;
    form.onsubmit=async e=>{
      e.preventDefault();const f=new FormData(form);const data={};
      ['company','kind','country','regions','capabilities','contact_name','email','phone','website','source_url','status','notes','exception_reason','steel_origin_notes'].forEach(k=>data[k]=String(f.get(k)||''));
      data.verified=f.has('verified');data.public_visible=f.has('public_visible');data.exception_approved=f.has('exception_approved');
      try{
        const id=f.get('record_id');await fetchJson(id?'/api/admin/network/companies/'+encodeURIComponent(id):'/api/admin/network/companies',
         {method:id?'PUT':'POST',body:JSON.stringify(data)});await reload();
      }catch(err){qs('#gbnCompanyFeedback',form).textContent=err.message;}
    };
    qs('#gbnDiscoverForm',widget).onsubmit=async e=>{
      e.preventDefault();const f=new FormData(e.currentTarget),box=qs('#gbnDiscoveryStatus',widget);
      box.textContent='Checking provider…';
      try{const result=await fetchJson('/api/admin/network/discover',{method:'POST',body:JSON.stringify(Object.fromEntries(f))});await reload();
      // reload replaces UI, so show result in new panel.
      qs('#gbnDiscoveryStatus',widget).textContent=`${result.added} unverified leads added`;
      }catch(err){box.textContent=err.message;}
    };
    qs('#gbnRecommend',widget).onclick=async()=>{
      const pid=qs('#gbnProjectSelect',widget).value, box=qs('#gbnMatchResults',widget);if(!pid)return;
      box.textContent='Matching…';
      try{const data=await fetchJson('/api/admin/network/projects/'+encodeURIComponent(pid)+'/matches');
        box.innerHTML=data.matches.map(m=>`<div class="gbn-admin-company"><strong>${esc(m.company)}</strong> · ${esc(m.kind)} · ${m.score}/100 ${m.all_star?'★ All-Star':''}${m.owner_exception?' · Approved overseas exception':''}<div class="small-note">${esc(m.reasons.join(' · '))}</div></div>`).join('')||'<p>No verified, approved partners match the project yet.</p>';
      }catch(err){box.textContent=err.message;}
    };
   }
   try{await reload();}catch(err){widget.textContent='Partner directory unavailable: '+err.message;}
 }
 async function renderPublicDirectory(){
    const box=qs('#gbnDirectoryList'); if(!box)return;
    try{
      const data=await fetchJson('/api/network/public-companies');
      if(!data.companies.length){box.innerHTML='<p>Our approved partner directory is growing. Contact us to discuss a project.</p>';return;}
      box.innerHTML=data.companies.map(c=>`<div class="gbn-public-company"><strong>${esc(c.company)}</strong><small>${esc(c.kind)}${c.country?' · '+esc(c.country):''}</small><p>${esc(c.capabilities||'Products and specialties available on request')}</p><span>${esc(c.regions||'Service area available on request')}</span>${c.website?`<a rel="noopener noreferrer" target="_blank" href="${esc(c.website)}">Company website ↗</a>`:''}</div>`).join('');
    }catch(err){box.textContent='Partner listings are temporarily unavailable.';}
 }
 function initChat(){
   const frame=document.createElement('section');frame.className='gbn-chat';
   frame.innerHTML=`<button class="gbn-chat-button" aria-expanded="false" aria-controls="gbnChatPanel" aria-label="Ask GBN Guide"><span class="guide-desktop">Ask GBN Guide</span><span class="guide-mobile">Guide</span></button>
   <div class="gbn-chat-panel" id="gbnChatPanel" hidden>
     <div class="gbn-chat-header"><strong>GBN Guide</strong> <button type="button" aria-label="Close chat" id="gbnCloseChat">×</button></div>
     <p class="small-note">Ask about materials sourcing, estimates, suppliers or installation. Please don't share confidential plans or personal details here.</p>
     <div id="gbnMessages" class="gbn-chat-messages" role="log" aria-live="polite"><p><strong>GBN Guide:</strong> What would you like to know about Gauge Better Network?</p></div>
     <form id="gbnChatForm"><label for="gbnQuestion">Your question</label><textarea id="gbnQuestion" rows="2" minlength="2" maxlength="1200" required placeholder="How do I get a steel framing estimate?"></textarea><button type="submit" class="btn btn-dark">Ask</button></form>
   </div>`;
   document.body.appendChild(frame);
   const button=qs('.gbn-chat-button',frame),panel=qs('.gbn-chat-panel',frame),messages=qs('#gbnMessages',frame);
   function toggle(open){panel.hidden=!open;button.setAttribute('aria-expanded',String(open));}
   button.onclick=()=>toggle(panel.hidden);qs('#gbnCloseChat',frame).onclick=()=>toggle(false);
   qs('#gbnChatForm',frame).onsubmit=async e=>{
     e.preventDefault();const input=qs('#gbnQuestion',frame),message=input.value.trim();if(!message)return;
     input.value='';const q=document.createElement('p');q.textContent='You: '+message;messages.appendChild(q);
     const ans=document.createElement('p');ans.textContent='GBN Guide: Checking…';messages.appendChild(ans);messages.scrollTop=messages.scrollHeight;
     try{const r=await fetchJson('/api/network/chat',{method:'POST',body:JSON.stringify({message})});
       ans.textContent='GBN Guide: '+r.reply;
     }catch(err){ans.textContent='GBN Guide: Unable to answer right now. Please use the project form or call us.';}
     messages.scrollTop=messages.scrollHeight;
   };
 }
 window.GBNNetwork={initOwner};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{initChat();renderPublicDirectory();});else{initChat();renderPublicDirectory();}
})();
