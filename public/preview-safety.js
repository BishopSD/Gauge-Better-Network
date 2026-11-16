/* This static publication has no application backend. Keep its forms illustrative. */
(() => {
  'use strict';
  const message = 'Preview only: online submissions, uploads, account access and payments are unavailable. Call (951) 201-8809 for assistance. Please do not enter personal information.';
  document.addEventListener('submit', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const feedback = event.target.querySelector('.form-feedback');
    if (feedback) { feedback.textContent = message; feedback.setAttribute('role', 'status'); }
  }, true);
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('dialog').forEach(dialog => {
      const notice = document.createElement('p');
      notice.className = 'preview-status';
      notice.textContent = message;
      Object.assign(notice.style, {padding:'12px 20px', margin:'0', background:'#edf3ed', color:'#17333a', fontSize:'14px', lineHeight:'1.6'});
      const header = dialog.querySelector('.modal-header');
      if (header) header.after(notice); else dialog.prepend(notice);
      dialog.querySelectorAll('input, textarea, select, button[type="submit"], #loadProject').forEach(el => { el.disabled = true; });
    });
  });
})();
