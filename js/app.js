// SPA + template engine + form validation + localStorage
(function(){
  const app = document.getElementById('app');
  const routes = ['home','projects','form','about'];
  const defaultRoute = 'home';

  function $(sel, root=document){ return root.querySelector(sel); }
  function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

  // Simple template renderer: clones template by id
  function renderTemplate(name, data){
    const tmpl = document.getElementById('tmpl-' + name);
    if(!tmpl) return;
    const clone = tmpl.content.cloneNode(true);
    // if projects template, populate example projects
    if(name==='projects'){
      const list = clone.querySelector('#projects-list');
      const examples = [
        {title:'Landing Page Vitta Joias', desc:'Layout responsivo com CSS customizado.'},
        {title:'Sistema de Biblioteca', desc:'CRUD com SQLite e interface Tkinter (projeto backend).'}
      ];
      examples.forEach(p=>{
        const li = document.createElement('li');
        li.innerHTML = `<strong>${p.title}</strong><div style="font-size:13px;color:var(--muted)">${p.desc}</div>`;
        list.appendChild(li);
      });
    }
    if(name==='form'){
      setUpFormHandlers(clone);
      populateSubmissions(clone);
    }
    app.innerHTML = '';
    app.appendChild(clone);
  }

  // Navigation
  function navigate(route){
    if(!routes.includes(route)) route = defaultRoute;
    history.pushState({route}, '', '#'+route);
    renderTemplate(route);
  }

  window.addEventListener('popstate', (e)=>{
    const route = (e.state && e.state.route) || (location.hash.replace('#','') || defaultRoute);
    renderTemplate(route);
  });

  // init nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> navigate(btn.dataset.route));
  });

  // initial render
  const initial = location.hash.replace('#','') || defaultRoute;
  renderTemplate(initial);

  // Form handling & validation
  function setUpFormHandlers(clone){
    const form = clone.querySelector('#contact-form');
    const submissionsList = clone.querySelector('#submissions');
    const clearBtn = clone.querySelector('#clear-storage');

    function validate(formData){
      const errors = {};
      const name = formData.get('name')?.trim();
      const email = formData.get('email')?.trim();
      const message = formData.get('message')?.trim();

      if(!name) errors.name = 'Nome é obrigatório.';
      if(!email) errors.email = 'E‑mail é obrigatório.';
      else if(!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'E‑mail inválido.';
      if(!message || message.length < 10) errors.message = 'Mensagem deve ter ao menos 10 caracteres.';
      return errors;
    }

    function showErrors(formEl, errors){
      $all('.error', formEl).forEach(s=> s.textContent = '');
      Object.keys(errors).forEach(k=>{
        const el = formEl.querySelector(`small.error[data-for="${k}"]`);
        if(el) el.textContent = errors[k];
      });
    }

    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const fd = new FormData(form);
      const errors = validate(fd);
      if(Object.keys(errors).length){
        showErrors(form, errors);
        showToast('Preencha o formulário corretamente.');
        return;
      }
      // save submission
      const payload = {name: fd.get('name').trim(), email: fd.get('email').trim(), message: fd.get('message').trim(), date: new Date().toISOString()};
      const saved = JSON.parse(localStorage.getItem('submissions_v3') || '[]');
      saved.push(payload);
      localStorage.setItem('submissions_v3', JSON.stringify(saved));
      form.reset();
      populateSubmissions(document);
      showToast('Enviado com sucesso!');
    });

    clearBtn.addEventListener('click', ()=>{
      localStorage.removeItem('submissions_v3');
      populateSubmissions(document);
      showToast('Envios apagados.');
    });
  }

  function populateSubmissions(root){
    const list = root.querySelector('#submissions') || document.getElementById('submissions');
    if(!list) return;
    list.innerHTML = '';
    const saved = JSON.parse(localStorage.getItem('submissions_v3') || '[]');
    if(saved.length===0){
      list.innerHTML = '<li>Nenhum envio ainda.</li>';
      return;
    }
    saved.slice().reverse().forEach(s=>{
      const li = document.createElement('li');
      li.innerHTML = `<strong>${escapeHtml(s.name)}</strong> <small style="color:var(--muted);font-size:12px">(${new Date(s.date).toLocaleString()})</small><div style="margin-top:6px">${escapeHtml(s.message)}</div><div style="font-size:12px;color:var(--muted)">${s.email}</div>`;
      list.appendChild(li);
    });
  }

  function showToast(msg, timeout=2800){
    const t = document.getElementById('toast');
    if(!t) return;
    t.textContent = msg;
    t.style.display = 'block';
    setTimeout(()=> t.style.display = 'none', timeout);
  }

  // small helper
  function escapeHtml(str){ return String(str).replace(/[&<>"]/g, s=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s])); }

})();

