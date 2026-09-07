import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient(
  'https://jygcabtudptfhpcfoyko.supabase.co',
  'sb_publishable_svnP0WG_s-FD5PuJb_cL5w_0r_7R6jv'
);

const loginPanel = document.querySelector('#login-panel');
const dashboard = document.querySelector('#dashboard');
const loginFeedback = document.querySelector('#login-feedback');
const adminUser = document.querySelector('#admin-user');
const giftForm = document.querySelector('#gift-form');
const giftId = document.querySelector('#gift-id');
const giftName = document.querySelector('#gift-name');
const giftPrice = document.querySelector('#gift-price');
const giftCategory = document.querySelector('#gift-category');
const giftDescription = document.querySelector('#gift-description');
const giftActive = document.querySelector('#gift-active');
const cancelEdit = document.querySelector('#cancel-edit');

const money = (value) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dateTime = (value) => new Date(value).toLocaleString('pt-BR');

function setTab(name) {
  document.querySelectorAll('.tab').forEach((button) => button.classList.toggle('active', button.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.toggle('active', panel.id === `tab-${name}`));
}

document.querySelectorAll('.tab').forEach((button) => {
  button.addEventListener('click', () => setTab(button.dataset.tab));
});

async function loadGifts() {
  const { data, error } = await supabase
    .from('wedding_gifts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const list = document.querySelector('#gifts-list');
  list.innerHTML = (data || []).map((gift) => `
    <article class="admin-card">
      <div><span class="badge">${gift.category || 'Sem categoria'}</span><h3>${gift.name}</h3><p>${gift.description || 'Sem descrição'}</p></div>
      <div class="card-side"><strong>${money(gift.price)}</strong><span>${gift.is_active ? 'Visível' : 'Oculto'}</span>
        <div class="row-actions">
          <button type="button" class="secondary" data-edit='${JSON.stringify(gift).replaceAll("'", '&#39;')}'>Editar</button>
          <button type="button" class="danger" data-delete="${gift.id}">Excluir</button>
        </div>
      </div>
    </article>
  `).join('');

  list.querySelectorAll('[data-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      const gift = JSON.parse(button.dataset.edit.replaceAll('&#39;', "'"));
      giftId.value = gift.id;
      giftName.value = gift.name;
      giftPrice.value = gift.price;
      giftCategory.value = gift.category || '';
      giftDescription.value = gift.description || '';
      giftActive.checked = gift.is_active;
      cancelEdit.hidden = false;
      giftName.focus();
    });
  });

  list.querySelectorAll('[data-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!window.confirm('Excluir este presente?')) return;
      const { error } = await supabase.from('wedding_gifts').delete().eq('id', Number(button.dataset.delete));
      if (error) return window.alert(error.message);
      await loadGifts();
    });
  });
}

async function loadRsvps() {
  const { data, error } = await supabase
    .from('wedding_rsvps')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  document.querySelector('#rsvps-body').innerHTML = (data || []).map((row) => `
    <tr><td>${row.guest_name}</td><td>${row.attending ? 'Confirmado' : 'Não irá'}</td><td>${row.guests_count}</td><td>${dateTime(row.created_at)}</td></tr>
  `).join('');
}

async function loadContributions() {
  const { data, error } = await supabase
    .from('wedding_contributions')
    .select('id,contributor_name,amount,status,created_at,wedding_gifts(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  document.querySelector('#contributions-body').innerHTML = (data || []).map((row) => `
    <tr><td>${row.contributor_name}</td><td>${row.wedding_gifts?.name || '—'}</td><td>${money(row.amount)}</td><td>${row.status}</td><td>${dateTime(row.created_at)}</td></tr>
  `).join('');
}

async function loadDashboard() {
  await Promise.all([loadGifts(), loadRsvps(), loadContributions()]);
}

async function ensureAdminSession() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    loginPanel.hidden = false;
    dashboard.hidden = true;
    return;
  }

  const { error } = await supabase.from('wedding_rsvps').select('id').limit(1);
  if (error) {
    await supabase.auth.signOut();
    loginFeedback.textContent = 'Esta conta não possui acesso administrativo.';
    loginPanel.hidden = false;
    dashboard.hidden = true;
    return;
  }

  adminUser.textContent = user.email || '';
  loginPanel.hidden = true;
  dashboard.hidden = false;
  await loadDashboard();
}

document.querySelector('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  loginFeedback.textContent = 'Entrando...';
  const email = document.querySelector('#admin-email').value.trim();
  const password = document.querySelector('#admin-password').value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    loginFeedback.textContent = 'E-mail ou senha inválidos, ou conta ainda não confirmada.';
    return;
  }
  loginFeedback.textContent = '';
  await ensureAdminSession();
});

document.querySelector('#signup-button').addEventListener('click', async () => {
  const email = document.querySelector('#admin-email').value.trim();
  const password = document.querySelector('#admin-password').value;
  if (!email || password.length < 8) {
    loginFeedback.textContent = 'Informe um e-mail válido e uma senha com pelo menos 8 caracteres.';
    return;
  }

  loginFeedback.textContent = 'Criando acesso...';
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    loginFeedback.textContent = error.message;
    return;
  }

  if (data.session) {
    loginFeedback.textContent = '';
    await ensureAdminSession();
  } else {
    loginFeedback.textContent = 'Conta criada. Confira seu e-mail para confirmar o acesso e depois entre no painel.';
  }
});

document.querySelector('#logout-button').addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.reload();
});

giftForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    name: giftName.value.trim(),
    price: Number(giftPrice.value),
    category: giftCategory.value.trim() || null,
    description: giftDescription.value.trim() || null,
    is_active: giftActive.checked,
    updated_at: new Date().toISOString(),
  };

  const query = giftId.value
    ? supabase.from('wedding_gifts').update(payload).eq('id', Number(giftId.value))
    : supabase.from('wedding_gifts').insert(payload);

  const { error } = await query;
  if (error) return window.alert(error.message);
  giftForm.reset();
  giftId.value = '';
  giftActive.checked = true;
  cancelEdit.hidden = true;
  await loadGifts();
});

cancelEdit.addEventListener('click', () => {
  giftForm.reset();
  giftId.value = '';
  giftActive.checked = true;
  cancelEdit.hidden = true;
});

ensureAdminSession();
