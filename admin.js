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
const giftImage = document.querySelector('#gift-image');
const giftImagePreview = document.querySelector('#gift-image-preview');
const giftImagePreviewWrap = document.querySelector('#gift-image-preview-wrap');
const removeGiftImage = document.querySelector('#remove-gift-image');
const saveGiftButton = document.querySelector('#save-gift-button');
const cancelEdit = document.querySelector('#cancel-edit');

let originalGiftImageUrl = null;
let imageRemoved = false;
let previewObjectUrl = null;
let loadedGifts = [];

const money = (value) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dateTime = (value) => new Date(value).toLocaleString('pt-BR');

function setTab(name) {
  document.querySelectorAll('.tab').forEach((button) => button.classList.toggle('active', button.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.toggle('active', panel.id === `tab-${name}`));
}

document.querySelectorAll('.tab').forEach((button) => {
  button.addEventListener('click', () => setTab(button.dataset.tab));
});

function clearPreviewObjectUrl() {
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  }
}

function showGiftImagePreview(url) {
  clearPreviewObjectUrl();
  if (!url) {
    giftImagePreview.removeAttribute('src');
    giftImagePreviewWrap.hidden = true;
    return;
  }
  giftImagePreview.src = url;
  giftImagePreviewWrap.hidden = false;
}

function resetGiftForm() {
  clearPreviewObjectUrl();
  giftForm.reset();
  giftId.value = '';
  giftActive.checked = true;
  giftImage.value = '';
  originalGiftImageUrl = null;
  imageRemoved = false;
  giftImagePreview.removeAttribute('src');
  giftImagePreviewWrap.hidden = true;
  cancelEdit.hidden = true;
  saveGiftButton.disabled = false;
  saveGiftButton.textContent = 'Salvar presente';
}

function storagePathFromPublicUrl(url) {
  if (!url) return null;
  const marker = '/storage/v1/object/public/wedding-gifts/';
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
}

async function deleteStorageImage(url) {
  const path = storagePathFromPublicUrl(url);
  if (!path) return;
  const { error } = await supabase.storage.from('wedding-gifts').remove([path]);
  if (error) console.warn('Não foi possível remover a imagem antiga:', error.message);
}

async function uploadGiftImage(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) throw new Error('Use uma imagem JPG, PNG ou WebP.');
  if (file.size > 5 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 5 MB.');

  const extensionByType = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const path = `gifts/${crypto.randomUUID()}.${extensionByType[file.type]}`;
  const { error } = await supabase.storage.from('wedding-gifts').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('wedding-gifts').getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
}

async function loadGifts() {
  const { data, error } = await supabase
    .from('wedding_gifts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  loadedGifts = data || [];
  const list = document.querySelector('#gifts-list');
  list.innerHTML = loadedGifts.map((gift) => `
    <article class="admin-card">
      ${gift.image_url ? `<img class="admin-gift-thumb" src="${gift.image_url}" alt="${gift.name}" />` : '<div class="admin-gift-thumb admin-gift-thumb-empty">Sem foto</div>'}
      <div class="admin-card-main"><span class="badge">${gift.category || 'Sem categoria'}</span><h3>${gift.name}</h3><p>${gift.description || 'Sem descrição'}</p></div>
      <div class="card-side"><strong>${money(gift.price)}</strong><span>${gift.is_active ? 'Visível' : 'Oculto'}</span>
        <div class="row-actions">
          <button type="button" class="secondary" data-edit-id="${gift.id}">Editar</button>
          <button type="button" class="danger" data-delete="${gift.id}">Excluir</button>
        </div>
      </div>
    </article>
  `).join('');

  list.querySelectorAll('[data-edit-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const gift = loadedGifts.find((item) => item.id === Number(button.dataset.editId));
      if (!gift) return;
      giftId.value = gift.id;
      giftName.value = gift.name;
      giftPrice.value = gift.price;
      giftCategory.value = gift.category || '';
      giftDescription.value = gift.description || '';
      giftActive.checked = gift.is_active;
      giftImage.value = '';
      originalGiftImageUrl = gift.image_url || null;
      imageRemoved = false;
      showGiftImagePreview(originalGiftImageUrl);
      cancelEdit.hidden = false;
      giftName.focus();
    });
  });

  list.querySelectorAll('[data-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!window.confirm('Excluir este presente?')) return;
      const gift = loadedGifts.find((item) => item.id === Number(button.dataset.delete));
      const { error } = await supabase.from('wedding_gifts').delete().eq('id', Number(button.dataset.delete));
      if (error) return window.alert(error.message);
      if (gift?.image_url) await deleteStorageImage(gift.image_url);
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

giftImage.addEventListener('change', () => {
  const file = giftImage.files?.[0];
  if (!file) {
    showGiftImagePreview(imageRemoved ? null : originalGiftImageUrl);
    return;
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
    giftImage.value = '';
    window.alert(file.size > 5 * 1024 * 1024 ? 'A imagem deve ter no máximo 5 MB.' : 'Use uma imagem JPG, PNG ou WebP.');
    showGiftImagePreview(imageRemoved ? null : originalGiftImageUrl);
    return;
  }

  clearPreviewObjectUrl();
  previewObjectUrl = URL.createObjectURL(file);
  giftImagePreview.src = previewObjectUrl;
  giftImagePreviewWrap.hidden = false;
  imageRemoved = false;
});

removeGiftImage.addEventListener('click', () => {
  giftImage.value = '';
  imageRemoved = true;
  showGiftImagePreview(null);
});

giftForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  saveGiftButton.disabled = true;
  saveGiftButton.textContent = giftImage.files?.[0] ? 'Enviando foto...' : 'Salvando...';

  const selectedFile = giftImage.files?.[0] || null;
  let uploaded = null;

  try {
    if (selectedFile) uploaded = await uploadGiftImage(selectedFile);

    const payload = {
      name: giftName.value.trim(),
      price: Number(giftPrice.value),
      category: giftCategory.value.trim() || null,
      description: giftDescription.value.trim() || null,
      image_url: uploaded?.publicUrl || (imageRemoved ? null : originalGiftImageUrl),
      is_active: giftActive.checked,
      updated_at: new Date().toISOString(),
    };

    const query = giftId.value
      ? supabase.from('wedding_gifts').update(payload).eq('id', Number(giftId.value))
      : supabase.from('wedding_gifts').insert(payload);

    const { error } = await query;
    if (error) throw error;

    if (originalGiftImageUrl && (imageRemoved || uploaded)) {
      await deleteStorageImage(originalGiftImageUrl);
    }

    resetGiftForm();
    await loadGifts();
  } catch (error) {
    if (uploaded?.path) await supabase.storage.from('wedding-gifts').remove([uploaded.path]);
    window.alert(error.message || 'Não foi possível salvar o presente.');
    saveGiftButton.disabled = false;
    saveGiftButton.textContent = 'Salvar presente';
  }
});

cancelEdit.addEventListener('click', resetGiftForm);

ensureAdminSession();
