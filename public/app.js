/* Gauge Better Network — client interface for sourcing, project access and independent estimates.
   No demo bids are presented as genuine offers. */
(() => {
  'use strict';
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const usd = cents => Number.isFinite(Number(cents)) ? (Number(cents)/100).toLocaleString('en-US',{style:'currency',currency:'USD'}) : 'Not set';
  const origin = location.origin + location.pathname;
  const toastEl=$('#toast');
  function toast(msg) {toastEl.textContent=msg;toastEl.hidden=false;clearTimeout(toastEl._timer);toastEl._timer=setTimeout(()=>toastEl.hidden=true,4200);}
  function feedback(form,msg,err=false){let target=$('.form-feedback',form);if(target){target.classList.toggle('error',err);target.textContent=msg;} else toast(msg);}
  function setPending(form, pending){const b=$('button[type="submit"]',form);if(b){b.disabled=pending;b.dataset.original ||= b.textContent;b.textContent=pending?'Submitting…':b.dataset.original;}}
  async function api(path,opts={}) {
    let res;
    try {res=await fetch(path,{credentials:'same-origin',...opts,headers:{...(opts.body && !(opts.body instanceof FormData)?{'Content-Type':'application/json'}:{}),...(opts.headers||{})}});}
    catch(e){throw Error('Cannot reach the website server. This feature needs the hosted application, not a local HTML preview.');}
    let value;try{value=await res.json();}catch{value={};}
    if(!res.ok){let detail=value.detail||value.message||'Request failed';if(Array.isArray(detail))detail=detail.map(x=>x.msg).join('; ');throw Error(String(detail));}
    return value;
  }
  const post=(path,obj,headers={})=>api(path,{method:'POST',body:JSON.stringify(obj),headers});
  const put=(path,obj,headers={})=>api(path,{method:'PUT',body:JSON.stringify(obj),headers});
  const ACCEPTED_PLANS=new Set(['pdf','dwg','dxf','ifc','rvt','png','jpg','jpeg']);
  function checkPlanFiles(files){
    if(!files.length)return;
    if(files.length>10)throw Error('Choose at most 10 drawings at a time.');
    if(files.some(f=>!ACCEPTED_PLANS.has(f.name.split('.').pop().toLowerCase())))throw Error('Use PDF, DWG, DXF, IFC, RVT, PNG or JPG plans.');
    if(files.some(f=>!f.size || f.size>25*1024*1024))throw Error('Each plan must be between 1 byte and 25 MB.');
    if(files.reduce((sum,f)=>sum+f.size,0)>100*1024*1024)throw Error('A single upload cannot exceed 100 MB.');
  }
  async function uploadPlans(id,key,files){
    if(!files.length)return {uploaded:0};
    checkPlanFiles(files);
    const form=new FormData();files.forEach(file=>form.append('files',file,file.name));
    return api(`/api/projects/${encodeURIComponent(id)}/plans`,{method:'POST',body:form,headers:{'X-Project-Key':key}});
  }
  function planListHtml(plans){
    return !plans.length?'<p>No drawings uploaded yet. Add PDFs or CAD plans so invited suppliers can prepare accurate estimates.</p>':
       `<ul class="plan-list">${plans.map(p=>`<li><span>▤ <strong>${esc(p.file_name)}</strong><small>${(p.size_bytes/1048576).toFixed(2)} MB</small></span><button type="button" class="copy-button" data-plan-download="${esc(p.id)}" data-plan-name="${esc(p.file_name)}">Download</button></li>`).join('')}</ul>`;
  }
  async function downloadPrivatePlan(path, filename, headers={}){
    const response=await fetch(path,{credentials:'same-origin',headers,cache:'no-store'});
    if(!response.ok)throw Error(response.status===403||response.status===404?'This drawing is unavailable or your private link is invalid.':'Could not download drawing.');
    const blob=await response.blob(),url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download=filename||'project-drawing';document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
  }
  function enablePlanDownload(root,makePath,headers={}){
    $$('[data-plan-download]',root).forEach(button=>button.addEventListener('click',async()=>{
      button.disabled=true;
      try{await downloadPrivatePlan(makePath(button.dataset.planDownload),button.dataset.planName,headers);}
      catch(e){toast(e.message);}finally{button.disabled=false;}
    }));
  }
  let paypalSdkLoading;
  function loadPayPalSdk(clientId){
    if(window.paypal?.Buttons)return Promise.resolve();
    if(!paypalSdkLoading){
      paypalSdkLoading=new Promise((resolve,reject)=>{
        const script=document.createElement('script');
        script.src='https://www.paypal.com/sdk/js?client-id='+encodeURIComponent(clientId)+'&currency=USD&intent=capture';
        script.onload=()=>window.paypal?.Buttons?resolve():reject(Error('PayPal checkout failed to load'));
        script.onerror=()=>{paypalSdkLoading=null;reject(Error('Could not load PayPal. Check your connection or blockers.'));};
        document.head.appendChild(script);
      });
    }
    return paypalSdkLoading;
  }
  const fields=form=>Object.fromEntries(new FormData(form).entries());
  function openDialog(id){const d=document.getElementById(id);if(d&&!d.open)d.showModal();$('#navLinks')?.classList.remove('is-open');$('#menuToggle')?.setAttribute('aria-expanded','false');}
  $$('[data-open]').forEach(btn=>btn.addEventListener('click',()=>openDialog(btn.dataset.open)));
  if(new URLSearchParams(location.search).get('request')==='estimate'){openDialog('projectRequest');}
  $$('.close-modal').forEach(btn=>btn.addEventListener('click',()=>btn.closest('dialog').close()));
  $$('dialog').forEach(d=>d.addEventListener('click',ev=>{if(ev.target===d)d.close();}));
  const navToggle=$('#menuToggle');navToggle?.addEventListener('click',()=>{const open=$('#navLinks').classList.toggle('is-open');navToggle.setAttribute('aria-expanded',String(open));});
  $$('#navLinks a').forEach(a=>a.addEventListener('click',()=>{$('#navLinks').classList.remove('is-open');navToggle.setAttribute('aria-expanded','false');}));
  const buildingSearch = $('#buildingSearch');
  const chips = $$('.chip[data-filter]');
  function showBuildings(category, query = '') {
    chips.forEach(chip => {
      const active = chip.dataset.filter === category;
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
    let count = 0;
    $$('#buildingGrid [data-category]').forEach(tile => {
      tile.hidden = (category !== 'all' && tile.dataset.category !== category) ||
        !tile.textContent.toLowerCase().includes(query.toLowerCase());
      if (!tile.hidden) count++;
    });
    $('#emptyBuildings').hidden = count > 0;
  }
  chips.forEach(chip => chip.addEventListener('click', () => {
    buildingSearch.value = '';
    showBuildings(chip.dataset.filter);
  }));
  buildingSearch.addEventListener('input', () => showBuildings('all', buildingSearch.value.trim()));
  const catalogTabs = $('.catalog-tabs');
  const categories = $$('[data-group-filter]');
  const categoryLabel = document.createElement('label');
  categoryLabel.className = 'catalog-select';
  categoryLabel.textContent = 'Material category';
  const categorySelect = document.createElement('select');
  categories.forEach(button => {
    categorySelect.add(new Option(button.textContent, button.dataset.groupFilter));
  });
  categoryLabel.append(categorySelect);
  catalogTabs.before(categoryLabel);

  function filterCatalog(group) {
    categorySelect.value = group;
    categories.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.groupFilter === group));
    });
    $$('.product-card[data-group]').forEach(card => {
      card.hidden = group !== 'all' && card.dataset.group !== group;
    });
  }
  categories.forEach(button => button.addEventListener('click', () => filterCatalog(button.dataset.groupFilter)));
  categorySelect.addEventListener('change', () => filterCatalog(categorySelect.value));
  $$('#buildingGrid [data-type]').forEach(tile=>tile.addEventListener('click',()=>{
    $('#projectType').value=tile.dataset.type;openDialog('projectRequest');
  }));
  const materials={
    'CFS-STUD':'Galvanized CFS studs', 'CFS-TRACK':'Galvanized CFS track',
    'CFS-JOIST':'Steel joists and roof trusses','CFS-PANEL':'Prefabricated wall and roof panels',
    'STEEL-KIT':'Building frame packages','CFS-CONNECT':'Connections and bracing',
    "STRUCT-W":"Wide-flange beams & shapes",
    "STRUCT-HSS":"Hollow structural sections",
    "STRUCT-PL":"Plate, bar & fabricated steel",
    "RC-BAR":"Rebar & welded wire reinforcement",
    "STEEL-PEMB":"Pre-engineered metal buildings",
    "STEEL-MOD":"Volumetric modular units",
    "STEEL-LONG":"Open-web joists & long-span trusses",
    "STEEL-DECK":"Floor, roof & composite deck",
    "STEEL-CLAD":"Steel roofing & wall cladding",
    "STEEL-SECOND":"Purlins, girts & eave struts",
    "STEEL-SPECIAL":"Specialty grades & finishes",
    "MAT-CARBON": "Carbon & mild steel",
    "MAT-HSLA": "High-strength low-alloy steel",
    "MAT-ALLOY": "Alloy & heat-treated steel",
    "MAT-STAINLESS": "Stainless steel",
    "MAT-WEATHER": "Weathering steel",
    "MAT-COATED": "Metallic-coated & prefinished steel",
    "FOUND-PILE": "Piles & earth-retention steel",
    "RC-TENDON": "Prestressing strand & tension systems",
    "RC-FIBER": "Steel fiber reinforcement",
    "STRUCT-BOLT": "Bolts, anchors & shear connectors",
    "ARCH-GRID": "Grating, mesh & architectural steel",
    "ARCH-OPEN": "Steel doors, frames & openings",
    "MEP-PIPE": "Steel pipe, tubing & conduit",
    "MEP-DUCT": "Ductwork & sheet-metal accessories"
  };
  let cart=[];
  function renderCart(){
    $('#cartCount').textContent=String(cart.length);
    $('#floatingCart').hidden=cart.length===0;
    $('#cartItems').innerHTML=cart.length ? cart.map((row,i)=>`<div class="cart-row" data-cart-index="${i}"><strong>${esc(materials[row.sku])}</strong><input type="number" min="0.01" step="any" max="1000000" aria-label="Quantity for ${esc(materials[row.sku])}" value="${esc(row.quantity)}" data-qty="${i}"/><select aria-label="Unit for ${esc(materials[row.sku])}" data-unit="${i}"><option value="pieces" ${row.unit==='pieces'?'selected':''}>pieces</option><option value="linear ft" ${row.unit==='linear ft'?'selected':''}>linear ft</option><option value="sq ft" ${row.unit==='sq ft'?'selected':''}>sq ft</option><option value="packages" ${row.unit==='packages'?'selected':''}>packages</option></select><button type="button" data-remove="${i}" aria-label="Remove ${esc(materials[row.sku])}">×</button></div>`).join('') : '<p class="small-note">Add at least one item to request supplier pricing.</p>';
    $$('[data-qty]', $('#cartItems')).forEach(input=>input.addEventListener('change',()=>{cart[Number(input.dataset.qty)].quantity=Number(input.value);}));
    $$('[data-unit]', $('#cartItems')).forEach(el=>el.addEventListener('change',()=>{cart[Number(el.dataset.unit)].unit=el.value;}));
    $$('[data-remove]', $('#cartItems')).forEach(el=>el.addEventListener('click',()=>{cart.splice(Number(el.dataset.remove),1);renderCart();}));
  }
  function addItem(sku){
    if(!materials[sku])return;
    if(!cart.some(x=>x.sku===sku))cart.push({sku,quantity:1,unit:'pieces'});
    renderCart();toast('Added to your sourcing list');
  }
  $$('.add-item').forEach(btn=>btn.addEventListener('click',()=>addItem(btn.dataset.sku)));
  $('#addMaterial')?.addEventListener('click',()=>addItem($('#addProductSelect').value));
  $('#floatingCart button')?.addEventListener('click',()=>openDialog('materialRequest'));
  renderCart();
  $('#materialForm')?.addEventListener('submit', async e=>{
    e.preventDefault();const form=e.currentTarget;
    if(!cart.length){feedback(form,'Please add at least one material.',true);return;}
    if(cart.some(x=>!(x.quantity>0)&&x.quantity<=1000000)){feedback(form,'Please enter valid quantities.',true);return;}
    const data={...fields(form),items:cart};setPending(form,true);
    try{const r=await post('/api/materials/requests',data);feedback(form,`Request ${r.id} received. Save this reference. A supplier match is not guaranteed.`);form.reset();cart=[];renderCart();}
    catch(err){feedback(form,err.message,true);}finally{setPending(form,false);}
  });
  $('#supplierForm')?.addEventListener('submit',async e=>{
    e.preventDefault();const form=e.currentTarget;setPending(form,true);
    try{const r=await post('/api/suppliers/apply',fields(form));feedback(form,`Application ${r.id} submitted for manual review.`);form.reset();}
    catch(err){feedback(form,err.message,true);}finally{setPending(form,false);}
  });
  $('#installerForm')?.addEventListener('submit',async e=>{
    e.preventDefault();const form=e.currentTarget;setPending(form,true);
    try{
      const data=fields(form);
      for(const key of ['crew_size','experience_years']){
        if(!data[key])data[key]=null;else data[key]=Number(data[key]);
      }
      const r=await post('/api/installers/apply',data);
      feedback(form,`Profile ${r.id} received. Credentials and availability require independent verification.`);form.reset();
    }catch(err){feedback(form,err.message,true);}finally{setPending(form,false);}
  });
  const projectState={id:'',key:''};
  const builderHeaders=()=>({'X-Project-Key':projectState.key});
  const projectUrl=(id,key)=>`${origin}#project=${encodeURIComponent(id)}&key=${encodeURIComponent(key)}`;
  const inviteUrl=(token)=>`${origin}#invite=${encodeURIComponent(token)}`;
  async function copyText(value){try{await navigator.clipboard.writeText(value);toast('Link copied. Keep private access links secure.');}catch{prompt('Copy this link:',value);}}
  function setProjectState(id,key){projectState.id=id.trim();projectState.key=key.trim();$('#viewProjectId').value=projectState.id;$('#viewProjectKey').value=projectState.key;}
  $('#projectForm')?.addEventListener('submit',async e=>{
    e.preventDefault();const form=e.currentTarget;setPending(form,true);
    try{
      const drawings=[...$('#projectPlanFiles').files];
      checkPlanFiles(drawings);
      const obj=fields(form);if(obj.steel_system) obj.notes = [obj.notes, 'Steel system: ' + obj.steel_system].filter(Boolean).join('\n'); delete obj.steel_system;obj.area_sqft=Number(obj.area_sqft);obj.terms_accepted=Boolean(form.querySelector('[name=terms_accepted]')?.checked);obj.plan_share_consent=Boolean(form.querySelector('[name=plan_share_consent]')?.checked);
      const data=await post('/api/projects',obj);
      setProjectState(data.id,data.key);
      let uploadWarning='';
      if(drawings.length){
        try{await uploadPlans(data.id,data.key,drawings);}catch(e){uploadWarning=`Project created, but plans were not uploaded: ${e.message} Add them from your private workspace.`;}
      }
      form.reset();feedback(form,`Project ${data.id} created. Save your private link; the access key cannot be recovered later.`);
      await showBuilderProject();openDialog('projectView');
      if(uploadWarning){$('#additionalPlanStatus').textContent=uploadWarning;$('#additionalPlanStatus').classList.add('error');toast('Project created. Plans need to be uploaded again.');}
      else toast(drawings.length?`Project created with ${drawings.length} drawing(s). Save your private link.`:'Your private project was created. Copy and save its access link.');
    }catch(err){feedback(form,err.message,true);}finally{setPending(form,false);}
  });
  $('#loadProject')?.addEventListener('click',async()=>{
    setProjectState($('#viewProjectId').value,$('#viewProjectKey').value);
    await showBuilderProject();
  });
  function quoteTable(quotes,anonymous=false){
    if(!quotes.length)return '<p>No approved estimates are available yet.</p>';
    const heads=anonymous?['Supplier','Materials','Freight','Labor','Other','Total','Lead time']:['Supplier','Materials','Freight','Labor','Other','Total','Lead time'];
    return `<div style="overflow:auto"><table class="quote-table"><thead><tr>${heads.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${quotes.map((q,i)=>`<tr><td>${anonymous?'Supplier '+(i+1):esc(q.supplier_name)}</td><td>${usd(q.materials_cents)}</td><td>${usd(q.freight_cents)}</td><td>${usd(q.labor_cents)}</td><td>${usd(q.other_cents)}</td><td><strong>${usd(q.total_cents)}</strong></td><td>${esc(q.lead_weeks)} wk</td></tr>`).join('')}</tbody></table></div>`+
      (anonymous?'':quotes.map(q=>`<div class="quote-detail"><strong>${esc(q.supplier_name)}</strong><p>Contact: ${esc(q.supplier_email || 'Not provided')}</p><p>Specifications: ${esc(q.specifications || 'Not specified')}</p><p>Exclusions: ${esc(q.exclusions || 'Not specified')}</p><p>Valid through: ${esc(q.validity || 'Ask supplier')}</p></div>`).join(''));
  }
  function installerQuoteTable(quotes){
    if(!quotes.length)return '<p>No approved installation estimates yet. You can request installer matching below.</p>';
    return `<div style="overflow:auto"><table class="quote-table"><thead><tr><th>Installation contractor</th><th>Labor</th><th>Equipment</th><th>Mobilization</th><th>Other</th><th>Total</th><th>Duration</th></tr></thead><tbody>${quotes.map(q=>`<tr><td>${esc(q.company)}<small style="display:block">License: ${esc(q.license_number)} (verify independently)</small></td><td>${usd(q.labor_cents)}</td><td>${usd(q.equipment_cents)}</td><td>${usd(q.mobilization_cents)}</td><td>${usd(q.other_cents)}</td><td><strong>${usd(q.total_cents)}</strong></td><td>${esc(q.duration_days)} days</td></tr>`).join('')}</tbody></table></div>`+
      quotes.map(q=>`<div class="installer-quote"><strong>${esc(q.company)}</strong> · ${esc(q.contact_email)} · Start: ${esc(q.earliest_start||'Confirm with contractor')}<p>Included: ${esc(q.inclusions||'Ask contractor')}</p><p>Exclusions: ${esc(q.exclusions||'Confirm scope')}</p></div>`).join('')+
      '<p class="small-note">Installation offers are not guarantees of licensure, insurance, availability or performance. Check credentials, compare scope and contract directly with the contractor.</p>';
  }
  async function showBuilderProject(){
    const out=$('#projectDashboard'),status=$('#projectStatus');status.textContent='Loading project…';
    try{
      const r=await api(`/api/projects/${encodeURIComponent(projectState.id)}`,{headers:builderHeaders()});
      const [q,planData,iq]=await Promise.all([
        api(`/api/projects/${encodeURIComponent(projectState.id)}/quotes`,{headers:builderHeaders()}),
        api(`/api/projects/${encodeURIComponent(projectState.id)}/plans`,{headers:builderHeaders()}),
        api(`/api/projects/${encodeURIComponent(projectState.id)}/installer-quotes`,{headers:builderHeaders()})
      ]);
      const p=r.project,link=projectUrl(projectState.id,projectState.key);
      const feeText=p.fee_cents===null?'The access fee has not been assigned yet.':p.fee_cents===0?'This project has free comparison access.':`Your project-specific comparison fee: ${usd(p.fee_cents)}.`;
      out.innerHTML=`<div class="portal-banner"><strong>${esc(p.title)} · ${esc(p.id)}</strong>${esc(p.location)} · ${esc(p.project_type)} · ${esc(p.area_sqft).toLocaleString?.()||esc(p.area_sqft)} sq. ft.</div>
        <div class="portal-card"><h3>Keep your project link</h3><p>Anyone with this private link can view the project; do not post it publicly.</p><p class="share-link">${esc(link)}</p><div class="portal-actions"><button class="copy-button" data-action="copy-project">Copy private link</button><a class="btn btn-dark" href="tel:+19512018809">Ask Gauge Better Network to invite suppliers ↗</a></div><div id="newInvite"></div></div>
        <div class="portal-card"><h3>Project plans &amp; construction drawings</h3><p>Private documents for quote preparation. You, Gauge Better Network staff, and suppliers with an invitation link to this project can access these drawings. Do not share invitations with unauthorized parties.</p>
        ${planListHtml(planData.plans)}
        <form id="additionalPlansForm" class="additional-plans"><label for="additionalPlanFiles">Add more plans or updated drawings</label><input type="file" id="additionalPlanFiles" accept=".pdf,.dwg,.dxf,.ifc,.rvt,.png,.jpg,.jpeg" multiple required/><p>Up to 10 files per upload, 25 MB each; maximum 20 files and 200 MB per project. PDFs, DWG/DXF, IFC, RVT, JPG and PNG.</p><button class="btn btn-dark" type="submit">Upload drawings ↗</button><div class="form-feedback" id="additionalPlanStatus" role="status"></div></form></div>
        <div class="portal-card"><h3>Installation contractor matching</h3><p>Request a firm to estimate labor independently from the steel materials. Only the licensed contractor and builder negotiate construction terms; we make introductions.</p>
        <div class="form-grid"><label class="install-choice"><input id="portalNeedsInstaller" type="checkbox" ${p.needs_installation?'checked':''}/>I want independent contractor estimates</label><label class="install-choice"><input id="portalShareInstallerPlans" type="checkbox" ${p.share_plans_installers?'checked':''}/>Allow specifically invited installers to access my plans</label><label class="wide">Installation scope<textarea id="portalInstallerScope" rows="2" maxlength="700" placeholder="Framing, crew requirements, dates, equipment…">${esc(p.installation_scope||'')}</textarea></label></div><button class="copy-button" type="button" data-action="save-installer-preference">Save installation preferences</button><div class="form-feedback" id="installerPreferencesStatus"></div>
        <p>${esc(r.installer_quote_count)} approved contractor installation estimate(s).</p>${iq.locked?'<p class="small-note">Approved installation comparisons are shown after project comparison access is unlocked.</p>':installerQuoteTable(iq.quotes)}</div>
        <div class="portal-card"><h3>Independent supplier estimates</h3><p>${esc(r.quote_count)} approved quote(s). ${feeText} ${r.pending_review_count?'Some quotes are pending owner review.':''}</p>
        <p>Comparison access is charged only when an owner-set fee is shown before checkout. Payment unlocks approved bids; it does not guarantee bids will exist.</p>
        ${q.locked?`<div class="portal-banner"><strong>Quotes are locked</strong>${esc(feeText)}</div><button class="btn btn-lime" data-action="checkout" ${p.fee_cents===null?'disabled':''}>${p.fee_cents===null?'Fee pending':p.fee_cents===0?'Open free comparison':'Pay '+usd(p.fee_cents)+' with PayPal ↗'}</button><div class="paypal-panel" id="paypalPanel" hidden><p><strong>Secure PayPal checkout</strong> — one-time access to this project's approved estimates. No recurring subscription.</p><div id="paypalButtons"></div><div class="form-feedback" id="paypalStatus" role="status"></div></div>`:quoteTable(q.quotes)}</div>`;
      out.hidden=false;status.textContent='';
      enablePlanDownload(out,fileId=>`/api/projects/${encodeURIComponent(projectState.id)}/plans/${encodeURIComponent(fileId)}`,builderHeaders());
      $('#additionalPlansForm',out)?.addEventListener('submit',async event=>{
        event.preventDefault();const form=event.currentTarget,status=$('#additionalPlanStatus',out),files=[...$('#additionalPlanFiles',out).files];
        const button=$('button[type="submit"]',form);button.disabled=true;status.classList.remove('error');status.textContent='Uploading drawings…';
        try{const uploaded=await uploadPlans(projectState.id,projectState.key,files);toast(`${uploaded.uploaded} drawing(s) uploaded securely.`);await showBuilderProject();}
        catch(e){status.textContent=e.message;status.classList.add('error');}finally{button.disabled=false;}
      });
      $('[data-action="save-installer-preference"]',out)?.addEventListener('click',async()=>{
        const status=$('#installerPreferencesStatus',out);
        try{
          const settings={needs_installation:$('#portalNeedsInstaller',out).checked,share_plans_installers:$('#portalShareInstallerPlans',out).checked,installation_scope:$('#portalInstallerScope',out).value};
          await put(`/api/projects/${encodeURIComponent(projectState.id)}/installer-sharing`,settings,builderHeaders());
          status.textContent='Saved. New invitation links and drawing access follow these preferences.';toast('Installation preferences updated');
        }catch(e){status.textContent=e.message;status.classList.add('error');}
      });
      $('[data-action="copy-project"]',out)?.addEventListener('click',()=>copyText(link));
      if(q.locked && p.fee_cents!==null && p.fee_cents>0){
        const checkoutButton=$('[data-action="checkout"]',out);
        const paypalPanel=$('#paypalPanel',out);
        checkoutButton?.addEventListener('click',async()=>{
          checkoutButton.disabled=true;
          try{
            if(!paypalPanel.dataset.ready){
              const config=await api('/api/paypal/config');
              if(!config.enabled)throw Error('PayPal checkout is not connected yet. Please contact Gauge Better Network.');
              await loadPayPalSdk(config.client_id);
              const status=$('#paypalStatus',paypalPanel);
              paypalPanel.hidden=false; // PayPal button iframe must render into a visible element
              paypal.Buttons({
                style:{layout:'vertical',shape:'rect',label:'paypal'},
                createOrder:async()=>{
                  status.textContent='Preparing your secure PayPal checkout…';
                  const r=await post(`/api/projects/${encodeURIComponent(projectState.id)}/paypal/order`,{},builderHeaders());
                  if(r.already_unlocked){await showBuilderProject();throw Error('Access already unlocked');}
                  return r.id;
                },
                onApprove:async(data)=>{
                  status.textContent='Confirming completed payment with PayPal…';
                  try{
                    await post(`/api/projects/${encodeURIComponent(projectState.id)}/paypal/capture`,{order_id:data.orderID},builderHeaders());
                    status.textContent='Payment verified. Your estimates are now available.';
                    await showBuilderProject();
                  }catch(err){status.textContent=err.message;status.classList.add('error');}
                },
                onCancel:()=>{status.textContent='Checkout cancelled. No charge has been confirmed.';},
                onError:()=>{status.textContent='PayPal checkout could not complete. Please try again.';status.classList.add('error');}
              }).render('#paypalButtons');
              paypalPanel.dataset.ready='true';
            }
            paypalPanel.hidden=false;
            checkoutButton.hidden=true;
          }catch(err){toast(err.message);checkoutButton.disabled=false;}
        });
      }else{
        $('[data-action="checkout"]',out)?.addEventListener('click',async()=>{
          try{const result=await post(`/api/projects/${encodeURIComponent(projectState.id)}/paypal/order`,{},builderHeaders());
            if(result.already_unlocked)await showBuilderProject();}
          catch(err){toast(err.message);}
        });
      }
    }catch(err){out.hidden=true;status.textContent=err.message;status.classList.add('error');}
  }
  async function openInvite(token){
    openDialog('inviteView');const box=$('#inviteContent');box.textContent='Loading invitation…';
    try{
      const [r,planData]=await Promise.all([api(`/api/invites/${encodeURIComponent(token)}`),api(`/api/invites/${encodeURIComponent(token)}/plans`)]),p=r.project;
      box.innerHTML=`<div class="portal-banner"><strong>${esc(p.title)}</strong>${esc(p.project_type)} · ${esc(p.location)} · ${esc(p.area_sqft)} sq. ft. · ${esc(p.scope)}</div><div class="portal-card"><h3>Construction plans for your estimate</h3><p>Confidential project drawings supplied for preparing this quote only. Do not redistribute.</p>${planListHtml(planData.plans)}</div><p class="small-note">Suppliers: submit actual prices, not placeholders. Use zero for excluded cost categories and explain exclusions. Your bid will not appear in comparisons until reviewed.</p>
        <form id="quoteForm" class="modal-form" style="padding:0"><div class="form-grid"><label>Supplier company<input name="supplier_name" required maxlength="140"/></label><label>Business email<input name="supplier_email" type="email" required/></label>
        <label>Materials + fabrication ($)<input name="materials" type="number" step=".01" min="0" required value="0"/></label><label>Freight / delivery ($)<input name="freight" type="number" step=".01" min="0" required value="0"/></label>
        <label>Labor / installation ($)<input name="labor" type="number" step=".01" min="0" required value="0"/></label><label>Other costs ($)<input name="other" type="number" step=".01" min="0" required value="0"/></label>
        <label>Lead time, weeks<input name="lead_weeks" type="number" min="0" max="520" value="4" required/></label><label>Offer valid through<input name="validity" placeholder="e.g. 30 days" maxlength="80"/></label>
        <label class="wide">Technical specifications<textarea name="specifications" rows="3" placeholder="Framing specifications, recycled-content documentation, coatings, fabrication process…"></textarea></label><label class="wide">Exclusions<textarea name="exclusions" rows="3" placeholder="Engineering, freight, taxes, installation, cranes, insulation, fixtures…"></textarea></label>
        <label class="wide" style="flex-direction:row;align-items:flex-start"><input type="checkbox" name="opt_in_share" style="width:auto;margin-top:3px"/> I consent to an anonymized price breakdown being visible to other invited suppliers if the project owner enables a comparison board. My name, email and notes will not be shared on that board.</label>
        </div><button class="btn btn-lime form-submit" type="submit">Submit quote for review ↗</button><div class="form-feedback" role="status"></div></form>
        <div id="sharedBoard" class="portal-card"><h3>Supplier comparison board</h3><p>Only approved, opted-in estimates are shown here after the builder unlocks comparisons and the owner enables sharing.</p></div>`;
      enablePlanDownload(box,fileId=>`/api/invites/${encodeURIComponent(token)}/plans/${encodeURIComponent(fileId)}`);
      const form=$('#quoteForm');form.addEventListener('submit',async e=>{
        e.preventDefault();setPending(form,true);
        const obj=fields(form);
        const cents=name=>Math.round(Number(obj[name])*100);
        const data={supplier_name:obj.supplier_name,supplier_email:obj.supplier_email,
          materials_cents:cents('materials'),freight_cents:cents('freight'),labor_cents:cents('labor'),other_cents:cents('other'),
          lead_weeks:Number(obj.lead_weeks),specifications:obj.specifications,exclusions:obj.exclusions,validity:obj.validity,opt_in_share:!!obj.opt_in_share};
        try{const res=await post(`/api/invites/${encodeURIComponent(token)}/quotes`,data);feedback(form,`Quote ${res.id} received and pending owner review. Thank you.`);form.reset();}
        catch(err){feedback(form,err.message,true);}finally{setPending(form,false);}
      });
      try{const s=await api(`/api/invites/${encodeURIComponent(token)}/shared`);
        if(s.available)$('#sharedBoard').innerHTML='<h3>Anonymized supplier quotes</h3>'+quoteTable(s.quotes,true);
      }catch{/* optional comparison board */}
    }catch(err){box.innerHTML=`<p class="form-feedback error">${esc(err.message)}</p>`;}
  }
  async function openInstallerInvite(token){
    openDialog('installerInviteView');const box=$('#installerInviteContent');box.textContent='Loading installation invitation…';
    try{
      const [r,plans]=await Promise.all([api(`/api/installer-invites/${encodeURIComponent(token)}`),api(`/api/installer-invites/${encodeURIComponent(token)}/plans`)]);
      const pr=r.project;
      box.innerHTML=`<div class="portal-banner"><strong>${esc(pr.title)}</strong>${esc(pr.location)} · ${esc(pr.area_sqft)} sq. ft. · ${esc(pr.project_type)}<p>Installation scope: ${esc(pr.installation_scope||pr.scope)}</p></div>
      <div class="portal-card"><h3>Construction drawings</h3><p>${plans.consent_required?'The builder has not authorized installer access to plans. Ask Gauge Better Network to request consent.':'Plans are confidential and for preparing this specific quote only.'}</p>${planListHtml(plans.plans)}</div>
      <p class="small-note">Provide a genuine, itemized estimate only if you hold the applicable contractor license for this scope. Your quoted terms are directly between your firm and the builder. Gauge Better Network is not the installer or prime contractor.</p>
      <form id="installerQuoteForm" class="modal-form" style="padding:0"><div class="form-grid"><label>Contractor company<input name="company" required maxlength="140"/></label><label>Contact email<input type="email" name="contact_email" required/></label><label>Contractor license number<input name="license_number" maxlength="40" required/></label><label>Earliest possible start<input name="earliest_start" maxlength="100" placeholder="e.g. 2 weeks after permit"/></label><label>Labor / installation ($)<input name="labor" type="number" min="0" step=".01" value="0" required/></label><label>Equipment / crane ($)<input name="equipment" type="number" min="0" step=".01" value="0" required/></label><label>Mobilization ($)<input name="mobilization" type="number" min="0" step=".01" value="0" required/></label><label>Other charges ($)<input name="other" type="number" min="0" step=".01" value="0" required/></label><label>Installation duration (days)<input name="duration_days" type="number" min="1" max="3650" required/></label><label class="wide">Scope included<textarea name="inclusions" rows="3" placeholder="Steel framing and/or panel assembly, engineering responsibilities, connections, lift equipment…"></textarea></label><label class="wide">Exclusions / assumptions<textarea name="exclusions" rows="2" placeholder="Permits, inspections, materials, site work, deliveries…"></textarea></label></div><button type="submit" class="btn btn-lime form-submit">Submit installation estimate ↗</button><div class="form-feedback" role="status"></div></form>`;
      if(!plans.consent_required)enablePlanDownload(box,id=>`/api/installer-invites/${encodeURIComponent(token)}/plans/${encodeURIComponent(id)}`);
      $('#installerQuoteForm',box).addEventListener('submit',async e=>{
        e.preventDefault();const form=e.currentTarget;setPending(form,true);
        try{
          const v=fields(form),cents=k=>Math.round(Number(v[k])*100);
          const data={company:v.company,contact_email:v.contact_email,license_number:v.license_number,earliest_start:v.earliest_start,
            labor_cents:cents('labor'),equipment_cents:cents('equipment'),mobilization_cents:cents('mobilization'),other_cents:cents('other'),
            duration_days:Number(v.duration_days),inclusions:v.inclusions,exclusions:v.exclusions};
          const res=await post(`/api/installer-invites/${encodeURIComponent(token)}/quotes`,data);
          feedback(form,`Installation estimate ${res.id} received for review.`);form.reset();
        }catch(e){feedback(form,e.message,true);}finally{setPending(form,false);}
      });
    }catch(e){box.innerHTML=`<p class="form-feedback error">${esc(e.message)}</p>`;}
  }
  async function openPrivateInvoice(token){
    openDialog('privatePayView');const box=$('#privatePayContent');box.textContent='Loading private invoice…';
    try{
      const invoice=await api(`/api/private-pay/${encodeURIComponent(token)}`);
      box.innerHTML=`<div class="portal-banner"><strong>${esc(invoice.service_type)}</strong>Project ${esc(invoice.project_id)} · ${esc(invoice.payer_side)}<h3 style="font-size:32px;margin:10px 0">${usd(invoice.amount_cents)}</h3></div>
        <p class="small-note">This payment is for a separately negotiated Gauge Better Network sourcing / introduction service. It does not pay a steel supplier or construction contractor. Only pay if this matches your written agreement and disclosed fee.</p>
        ${invoice.paid?'<div class="portal-banner"><strong>Paid — thank you.</strong>This invoice has been recorded as paid.</div>':invoice.paypal_enabled?'<div id="privatePaypalButtons"></div><div class="form-feedback" id="privatePaypalStatus"></div>':'<p class="form-feedback error">Online payment has not been connected yet. Please contact Gauge Better Network.</p>'}`;
      if(invoice.paid||!invoice.paypal_enabled)return;
      const cfg=await api('/api/paypal/config');if(!cfg.enabled)return;
      await loadPayPalSdk(cfg.client_id);
      paypal.Buttons({
        style:{layout:'vertical',shape:'rect',label:'paypal'},
        createOrder:async()=>{const r=await post(`/api/private-pay/${encodeURIComponent(token)}/paypal/order`,{});if(r.already_paid)throw Error('Invoice already paid');return r.id;},
        onApprove:async data=>{const status=$('#privatePaypalStatus',box);try{await post(`/api/private-pay/${encodeURIComponent(token)}/paypal/capture`,{order_id:data.orderID});status.textContent='Payment completed and verified. Thank you.';await openPrivateInvoice(token);}catch(e){status.textContent=e.message;status.classList.add('error');}},
        onCancel:()=>{$('#privatePaypalStatus',box).textContent='Checkout was cancelled.';},
        onError:()=>{$('#privatePaypalStatus',box).textContent='PayPal checkout failed. Please contact Gauge Better Network.';}
      }).render('#privatePaypalButtons');
    }catch(e){box.innerHTML=`<p class="form-feedback error">${esc(e.message)}</p>`;}
  }
  // Owner console: only reachable with an owner-provided server password.
  const ownerContent=$('#ownerContent');
  async function loadOwner(){
    ownerContent.innerHTML='<p>Loading the owner console…</p>';
    try{
      const [projects,inbox]=await Promise.all([api('/api/admin/projects'),api('/api/admin/inbox')]);
      const materialHtml=inbox.materials.map(m=>`<details><summary>${esc(m.id)} · ${esc(m.contact_name)} · ${esc(m.project_location)}</summary><p>Email: ${esc(m.email)} · ${esc(m.company)} · ${esc(m.phone)}</p><p>Materials: ${m.items.map(i=>esc(materials[i.sku]||i.sku)+' ('+esc(i.quantity)+' '+esc(i.unit)+')').join('; ')}</p><p>Need by: ${esc(m.needs_by)} · ${esc(m.notes)}</p></details>`).join('')||'<p>No requests yet.</p>';
      const supplierHtml=inbox.suppliers.map(s=>`<details><summary>${esc(s.id)} · ${esc(s.company)} · ${esc(s.regions)} · ${s.approved?'APPROVED':'PENDING'}</summary><p>Contact: ${esc(s.contact_name)} · ${esc(s.email)} · ${esc(s.phone)}</p><p>Capabilities: ${esc(s.capabilities)}</p><p>Notes: ${esc(s.notes)}</p><button class="copy-button" data-supplier-review="${esc(s.id)}" data-approved="${s.approved?'false':'true'}">${s.approved?'Remove network approval':'Approve supplier for matching'}</button></details>` ).join('')||'<p>No supplier applications yet.</p>';
      const installersHtml=inbox.installers.map(a=>`<details><summary>${esc(a.id)} · ${esc(a.applicant_type==='craft_professional'?'Craft professional':'Contractor firm')} · ${esc(a.company)} · ${esc(a.regions)}</summary><p>Contact: ${esc(a.contact_name)} · ${esc(a.email)} · ${esc(a.phone)}</p><p>License: ${esc(a.license_number||'Not listed')} · ${esc(a.license_state)} · ${esc(a.license_classification||'')}. Status: ${esc(a.status)} — verify independently before approval.</p><p>Trades: ${esc(a.specialties)} · Team: ${esc(a.crew_size||'N/A')} · Availability: ${esc(a.available_from||'Unspecified')}</p><p>Insurance: ${esc(a.insurance||'Not supplied')} · Notes: ${esc(a.notes||'')}</p>${a.applicant_type==='licensed_contractor'?`<button class="copy-button" data-installer-verify="${esc(a.id)}" data-verified="${a.status==='verified'?'false':'true'}">${a.status==='verified'?'Revoke verified status':'I have checked CSLB, insurance and workers comp — mark verified'}</button>`:''}</details>`).join('')||'<p>No installer profiles yet.</p>';
      ownerContent.innerHTML=`<div class="portal-actions"><strong>Owner dashboard</strong><button type="button" class="copy-button" id="refreshOwner">Refresh</button><button type="button" class="copy-button" id="logoutOwner">Sign out</button></div><div class="owner-inbox"><details><summary>Materials sourcing leads (${inbox.materials.length})</summary>${materialHtml}</details><details><summary>Supplier applications (${inbox.suppliers.length})</summary>${supplierHtml}</details><details><summary>Installer &amp; skilled trade profiles (${inbox.installers.length})</summary>${installersHtml}</details></div>
      <h3 style="margin:20px 0 8px">Project requests (${projects.projects.length})</h3>
      ${projects.projects.map(p=>`<section class="owner-project" data-project="${esc(p.id)}"><h3>${esc(p.title)} <small class="small-status">${esc(p.id)}</small></h3><p>${esc(p.builder_name)} · ${esc(p.builder_email)} · ${esc(p.builder_phone)} · ${esc(p.location)} · ${esc(p.area_sqft)} sq. ft.</p><p>Scope: ${esc(p.scope)} · ${esc(p.project_type)} · ${esc(p.start_date)}</p><p>Installer matching: ${p.needs_installation?'REQUESTED':'Not requested'} · Plans permission: ${p.share_plans_installers?'YES':'NO'} · ${esc(p.installation_scope||'No scope supplied')}</p><p>Notes: ${esc(p.notes||'None')}</p>
      <div class="owner-plan-files"><strong>Construction plans (${p.plans.length})</strong>${planListHtml(p.plans)}</div><details class="invitation-log"><summary>Supplier and installer invitations (${(p.active_invites||[]).length})</summary>${(p.active_invites||[]).map(inv=>`<div class="owner-quote"><strong>${esc(inv.kind)}</strong> · ${esc(inv.recipient_email||'Legacy invite')} · ${inv.revoked?'Revoked':esc(inv.expires_at||'Legacy expired')}<button class="copy-button" type="button" data-revoke-invite="${esc(inv.token_fingerprint)}" data-invite-kind="${esc(inv.kind)}" ${inv.revoked?'disabled':''}>Revoke this invitation</button></div>`).join('')||'<p>No invitations issued yet.</p>'}</details>
      <div class="owner-controls"><label>Comparison fee ($)<input data-fee="${esc(p.id)}" type="number" min="0" step=".50" value="${p.fee_cents===null?'':(p.fee_cents/100).toFixed(2)}" placeholder="e.g. 49.00"/></label><label class="checkline"><input type="checkbox" data-sharing="${esc(p.id)}" ${p.shared_board?'checked':''}/>Enable opted-in supplier-to-supplier comparison</label><button type="button" class="btn btn-dark" data-save="${esc(p.id)}">Set fee & sharing</button><button type="button" class="copy-button" data-show-matches="${esc(p.id)}">Find suitable suppliers & installers</button><button type="button" class="copy-button" data-admin-invite="${esc(p.id)}">Invite supplier by email</button><button type="button" class="copy-button" data-installer-invite="${esc(p.id)}" ${p.needs_installation?'':'disabled'}>Invite installer by email</button></div><div class="form-feedback" data-owner-status="${esc(p.id)}"></div><div class="partner-matches" data-match-results="${esc(p.id)}"></div>
      <p><strong>${p.quotes.length} supplier quotes</strong> · ${p.unlocked?'Builder comparison unlocked':'Builder comparison locked'}</p>
      ${p.quotes.map(q=>`<div class="owner-quote"><strong>${esc(q.supplier_name)} — ${usd(q.total_cents)}</strong> · <small class="small-status ${q.approved?'':'pending'}">${q.approved?'Approved':'Pending'}</small><p>${esc(q.supplier_email)} · Lead: ${esc(q.lead_weeks)} wk · Opt-in board: ${q.opt_in_share?'yes':'no'}</p><p>Specs: ${esc(q.specifications||'Not provided')} · Exclusions: ${esc(q.exclusions||'None')}</p><button type="button" class="copy-button" data-approval="${esc(q.id)}" data-approved="${q.approved?'false':'true'}">${q.approved?'Withdraw approval':'Approve quote'}</button></div>`).join('')||'<p>No quotes yet.</p>'}
      <div class="private-ledger"><h4>Independent installation estimates (${p.installer_quotes.length})</h4>
      ${p.installer_quotes.map(q=>`<div class="owner-quote"><strong>${esc(q.company)} — ${usd(q.total_cents)}</strong> · License claimed: ${esc(q.license_number)} · ${q.approved?'Approved':'Pending review'}<p>${esc(q.contact_email)} · Labor ${usd(q.labor_cents)} · Equipment ${usd(q.equipment_cents)} · Mobilization ${usd(q.mobilization_cents)} · ${esc(q.duration_days)} days</p><p>Inclusions: ${esc(q.inclusions||'None')} · Exclusions: ${esc(q.exclusions||'None')}</p><button type="button" class="copy-button" data-installer-approval="${esc(q.id)}" data-approved="${q.approved?'false':'true'}">${q.approved?'Withdraw':'Approve'} installer estimate</button></div>`).join('')||'<p>No installer bids received.</p>'}
      </div>
      <div class="private-ledger"><h4>Private bilateral revenue agreements — OWNER ONLY</h4><p class="small-note">Builder sourcing and supplier compensation are separately negotiated by phone and recorded here. Do not assume installation referral compensation is permitted; have your agreements legally reviewed. No rate appears on public pages.</p>
      ${p.private_fees.map(f=>`<div class="owner-quote"><strong>${esc(f.payer_side)} · ${esc(f.service_type)}</strong> · ${f.fee_basis==='flat'?usd(f.flat_amount_cents):((f.rate_basis_points||0)/100).toFixed(2)+'% of '+usd(f.contract_value_cents)} · ${esc(f.status)} <p>Agreement: ${esc(f.reference||'Not entered')} · ${esc(f.notes||'')}</p><button type="button" class="copy-button" data-private-invoice="${esc(f.id)}" ${f.payer_side==='installer'||!['agreed','invoiced'].includes(f.status)||!f.reference?'disabled':''}>Create private PayPal invoice link</button><label>Update status<select data-fee-status="${esc(f.id)}"><option value="proposed" ${f.status==='proposed'?'selected':''}>Proposed</option><option value="agreed" ${f.status==='agreed'?'selected':''}>Agreed</option><option value="invoiced" ${f.status==='invoiced'?'selected':''}>Invoiced</option><option value="paid" ${f.status==='paid'?'selected':''}>Paid</option><option value="waived" ${f.status==='waived'?'selected':''}>Waived</option></select></label></div>`).join('')}
      <form data-private-fee="${esc(p.id)}" class="form-grid"><label>Who pays?<select name="payer_side"><option value="builder">Builder / project requester</option><option value="supplier">Steel supplier</option><option value="installer">Installation firm (legal review required)</option></select></label><label>Service<input name="service_type" placeholder="e.g. Material sourcing services" required/></label><label>Private fee basis<select name="fee_basis"><option value="flat">Flat project fee</option><option value="percent">Negotiated percentage</option></select></label><label>Flat fee ($)<input type="number" min="0" step=".01" name="flat_amount" value="0"/></label><label>Percentage (if selected)<input type="number" min="0" max="100" step=".01" name="percent" placeholder="Enter agreed rate"/></label><label>Material order value ($, if %)<input type="number" min="0" step=".01" name="contract_value" placeholder="Steel order value"/></label><label>Status<select name="status"><option value="proposed">Proposed</option><option value="agreed">Agreed in writing</option><option value="invoiced">Invoiced</option><option value="paid">Paid</option></select></label><label>Agreement reference<input name="reference" placeholder="Signed contract / invoice ID"/></label><label class="wide">Private notes<input name="notes" placeholder="Agreed by phone, pending written disclosure, milestone…"/></label><div class="wide"><button class="btn btn-dark" type="submit">Save private fee record</button><div class="form-feedback"></div></div></form></div>
      </section>`).join('')||'<p>No projects have been submitted.</p>'}`;
      if(window.GBNNetwork)window.GBNNetwork.initOwner(ownerContent,projects);
      $$('[data-project]',ownerContent).forEach(section=>{
        const pid=section.dataset.project;
        enablePlanDownload(section,fileId=>`/api/admin/projects/${encodeURIComponent(pid)}/plans/${encodeURIComponent(fileId)}`);
      });
      $('#refreshOwner').addEventListener('click',loadOwner);
      $('#logoutOwner').addEventListener('click',async()=>{await post('/api/admin/logout',{});showOwnerLogin();});
      $$('[data-revoke-invite]',ownerContent).forEach(btn=>btn.addEventListener('click',async()=>{
        if(!confirm('Immediately revoke this project invitation? This does not erase files already downloaded.'))return;
        try{await post(`/api/admin/invitations/${encodeURIComponent(btn.dataset.inviteKind)}/${encodeURIComponent(btn.dataset.revokeInvite)}/revoke`,{});await loadOwner();}
        catch(e){toast(e.message);}
      }));
      $$('[data-save]',ownerContent).forEach(el=>el.addEventListener('click',async()=>{
        const id=el.dataset.save,fee=$(`[data-fee="${CSS.escape(id)}"]`,ownerContent),share=$(`[data-sharing="${CSS.escape(id)}"]`,ownerContent);
        const status=$(`[data-owner-status="${CSS.escape(id)}"]`,ownerContent);const amount=Number(fee.value);
        if(fee.value===''||!Number.isFinite(amount)||amount<0){status.textContent='Enter a valid fee (or 0 for no charge).';return;}
        try{await put(`/api/admin/projects/${encodeURIComponent(id)}/fee`,{fee_cents:Math.round(amount*100),shared_board:share.checked});toast('Project fee and sharing settings saved');loadOwner();}
        catch(e){status.textContent=e.message;}
      }));
      $$('[data-approval]',ownerContent).forEach(el=>el.addEventListener('click',async()=>{
        try{await put(`/api/admin/quotes/${encodeURIComponent(el.dataset.approval)}/approval?approved=${el.dataset.approved}`,{});loadOwner();}
        catch(e){toast(e.message);}
      }));
      $$('[data-installer-approval]',ownerContent).forEach(el=>el.addEventListener('click',async()=>{
        try{await put(`/api/admin/installer-quotes/${encodeURIComponent(el.dataset.installerApproval)}/approval?approved=${el.dataset.approved}`,{});loadOwner();}
        catch(e){toast(e.message);}
      }));
      async function issueInvitation(pid,kind,email,applicationId=''){
        const endpoint=kind==='installer'?'installer-invite':'invite';
        const r=await post(`/api/admin/projects/${encodeURIComponent(pid)}/${endpoint}`,
            {recipient_email:email,application_id:applicationId,days_valid:7});
        const url=kind==='installer'?`${origin}#installer=${encodeURIComponent(r.token)}`:inviteUrl(r.token);
        await copyText(url);toast(`${kind==='installer'?'Installer':'Supplier'} invite for ${email} copied. Expires ${r.expires_at}. Share only with that recipient.`);
      }
      $$('[data-installer-invite]',ownerContent).forEach(el=>el.addEventListener('click',async()=>{
        const email=prompt('Installer business email (private invitation):');if(!email)return;
        try{await issueInvitation(el.dataset.installerInvite,'installer',email.trim());}catch(e){toast(e.message);}
      }));
      $$('[data-show-matches]',ownerContent).forEach(el=>el.addEventListener('click',async()=>{
        const pid=el.dataset.showMatches;const panel=$(`[data-match-results="${CSS.escape(pid)}"]`,ownerContent);
        panel.textContent='Comparing partner service areas and capabilities…';
        try{
          const m=await api(`/api/admin/projects/${encodeURIComponent(pid)}/matches`);
          const group=(rows,kind)=>rows.length?rows.map(r=>`<div class="owner-quote"><strong>${esc(r.company)}</strong> · ${esc(r.score)}/100 compatibility<br/>${esc(r.email)} · ${esc(r.regions)}<p>${esc(r.reasons.join(' · '))}</p><button class="copy-button" data-invite-match="${esc(pid)}" data-kind="${kind}" data-email="${esc(r.email)}" data-application-id="${esc(r.id)}">Create private 7-day invitation</button></div>`).join(''):'<p>No approved partners match this service area yet. Review applications or add partners.</p>';
          panel.innerHTML=`<div class="portal-card"><h4>Review-only partner suggestions</h4><p>${esc(m.note)}</p><h4>Steel suppliers (${m.supplier_matches.length})</h4>${group(m.supplier_matches,'supplier')}<h4>Installation firms (${m.installer_matches.length})</h4>${group(m.installer_matches,'installer')}</div>`;
          $$('[data-invite-match]',panel).forEach(b=>b.addEventListener('click',async()=>{
            if(!confirm(`Allow ${b.dataset.email} to view this project using a private, time-limited link?`))return;
            try{await issueInvitation(b.dataset.inviteMatch,b.dataset.kind,b.dataset.email,b.dataset.applicationId);}catch(e){toast(e.message);}
          }));
        }catch(e){panel.textContent=e.message;}
      }));
      $$('[data-supplier-review]',ownerContent).forEach(btn=>btn.addEventListener('click',async()=>{
        if(btn.dataset.approved==='true'&&!confirm('Approve this supplier for matching only after validating the business?'))return;
        try{await put(`/api/admin/suppliers/${encodeURIComponent(btn.dataset.supplierReview)}/approval`,{approved:btn.dataset.approved==='true'});await loadOwner();}catch(e){toast(e.message);}
      }));
      $$('[data-installer-verify]',ownerContent).forEach(btn=>btn.addEventListener('click',async()=>{
        if(btn.dataset.verified==='true'&&!confirm('Have you actually verified this contractor license, classification, insurance and workers compensation?'))return;
        try{await put(`/api/admin/installers/${encodeURIComponent(btn.dataset.installerVerify)}/verification`,{verified:btn.dataset.verified==='true'});await loadOwner();}catch(e){toast(e.message);}
      }));
      $$('[data-private-fee]',ownerContent).forEach(form=>form.addEventListener('submit',async e=>{
        e.preventDefault();setPending(form,true);
        try{const v=fields(form),pct=v.fee_basis==='percent';
          if(pct&&(!v.percent||!v.contract_value))throw Error('Enter both negotiated percentage and material order value.');
          const payload={project_id:form.dataset.privateFee,payer_side:v.payer_side,service_type:v.service_type,fee_basis:v.fee_basis,
            rate_basis_points:pct?Math.round(Number(v.percent)*100):null,contract_value_cents:pct?Math.round(Number(v.contract_value)*100):null,
            flat_amount_cents:pct?null:Math.round(Number(v.flat_amount)*100),status:v.status,reference:v.reference,notes:v.notes};
          await post('/api/admin/private-fees',payload);toast('Private fee agreement record saved');await loadOwner();
        }catch(err){feedback(form,err.message,true);}finally{setPending(form,false);}
      }));
      $$('[data-private-invoice]',ownerContent).forEach(btn=>btn.addEventListener('click',async()=>{
        try{const r=await post(`/api/admin/private-fees/${encodeURIComponent(btn.dataset.privateInvoice)}/payment-link`,{});
            await copyText(`${origin}#pay=${encodeURIComponent(r.token)}`);toast(`Private payment link ready for ${usd(r.amount_cents)}. Share only with the party who agreed to the fee.`);
        }catch(e){toast(e.message);}
      }));
      $$('[data-fee-status]',ownerContent).forEach(sel=>sel.addEventListener('change',async()=>{
        try{await put(`/api/admin/private-fees/${encodeURIComponent(sel.dataset.feeStatus)}/status`,{status:sel.value});toast('Private fee status updated');}
        catch(e){toast(e.message);}
      }));
      $$('[data-admin-invite]',ownerContent).forEach(el=>el.addEventListener('click',async()=>{
        const email=prompt('Supplier business email (private invitation):');if(!email)return;
        try{await issueInvitation(el.dataset.adminInvite,'supplier',email.trim());}catch(e){toast(e.message);}
      }));
    }catch(err){ownerContent.innerHTML=`<p class="form-feedback error">${esc(err.message)}</p><button type="button" class="btn btn-dark" id="retryOwner">Try again</button>`;$('#retryOwner').addEventListener('click',loadOwner);}
  }
  function showOwnerLogin(){
    ownerContent.innerHTML=`<form id="ownerForm"><label>Owner password<input id="ownerPassword" type="password" autocomplete="current-password" required /></label><button class="btn btn-lime form-submit" type="submit">Sign in ↗</button><div class="form-feedback" role="status"></div></form>`;
    $('#ownerForm').addEventListener('submit',async e=>{
      e.preventDefault();const form=e.currentTarget;setPending(form,true);
      try{await post('/api/admin/login',{password:$('#ownerPassword').value});await loadOwner();}
      catch(err){feedback(form,err.message,true);}finally{setPending(form,false);}
    });
  }
  $('#ownerLogin')?.addEventListener('click',async()=>{
    if(!$('#ownerContent'))return;
    try{const r=await api('/api/admin/me');if(r.signed_in){if($('#ownerForm'))await loadOwner();}else if(!$('#ownerForm'))showOwnerLogin();}
    catch{};
  });
  showOwnerLogin();
  // Private links use the URL fragment: browser never sends the access key in HTTP request paths.
  function handleHash(){const h=location.hash.slice(1);if(h.startsWith('project=')){
      const args=new URLSearchParams(h);setProjectState(args.get('project')||'',args.get('key')||'');openDialog('projectView');if(projectState.id&&projectState.key)showBuilderProject();
    }else if(h.startsWith('pay=')){
      const args=new URLSearchParams(h),token=args.get('pay');if(token)openPrivateInvoice(token);
    }else if(h.startsWith('installer=')){
      const args=new URLSearchParams(h),token=args.get('installer');if(token)openInstallerInvite(token);
    }else if(h.startsWith('invite=')){
      const args=new URLSearchParams(h),token=args.get('invite');if(token)openInvite(token);
    }
  }
  window.addEventListener('hashchange',handleHash);
  handleHash();
})();
