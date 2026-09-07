const API_BASE = 'https://jygcabtudptfhpcfoyko.supabase.co/functions/v1/app-api';
const SESSION_KEY = 'wedding_admin_session';
const VISITOR_STORAGE_KEY = 'wedding_visitor_id';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

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

const siteContentForm = document.querySelector('#site-content-form');
const heroImage = document.querySelector('#hero-image');
const storyImage = document.querySelector('#story-image');
const heroImagePreview = document.querySelector('#hero-image-preview');
const storyImagePreview = document.querySelector('#story-image-preview');
const heroImagePreviewWrap = document.querySelector('#hero-image-preview-wrap');
const storyImagePreviewWrap = document.querySelector('#story-image-preview-wrap');
const removeHeroImage = document.querySelector('#remove-hero-image');
const removeStoryImage = document.querySelector('#remove-story-image');
const storyLead = document.querySelector('#story-lead');
const storyText = document.querySelector('#story-text');
const verseText = document.querySelector('#verse-text');
const verseReference = document.querySelector('#verse-reference');
const saveSiteContentButton = document.querySelector('#save-site-content-button');
const siteContentFeedback = document.querySelector('#site-content-feedback');

let loadedGifts = [];
let originalGiftImageValue = null;
let originalGiftPreviewUrl = null;
let imageRemoved = false;
let giftPreviewObjectUrl = null;
let siteSettings = null;
let heroPreviewObjectUrl = null;
let storyPreviewObjectUrl = null;

function getVisitorId() {
  let id = localStorage.getItem(VISITOR_STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_STORAGE_KEY, id);
  }
  return id;
}

const visitorId = getVisitorId();

function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}

function setSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

async function apiFetch(path, options = {}, requiresAuth = true) {
  const headers = new Headers(options.headers || {});
  headers.set('x-visitor-id', visitorId);
  if (options.body && !headers.has('content-type')) headers.set('content-type', 'application/json');

  if (requiresAuth) {
    const session = getSession();
    if (!session?.access_token) throw new Error('Sessão administrativa ausente.');
    headers.set('authorization', `Bearer ${session.access_token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    if (requiresAuth && response.status === 401) {
      clearSession();
      loginPanel.hidden = false;
      dashboard.hidden = true;
    }
    throw new Error(payload?.error || 'Não foi possível concluir a operação.');
  }

  return payload;
}

function auditPageVisit() {
  fetch(`${API_BASE}/public/visit`, {
    method: 'POST',
    keepalive: true,
    headers: { 'Content-Type': 'application/json', 'x-visitor-id': visitorId },
    body: JSON.stringify({ visitor_id: visitorId, path: `${location.pathname}${location.search}`, title: document.title }),
  }).catch(() => {});
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const money = (value) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dateTime = (value) => new Date(value).toLocaleString('pt-BR');

function setTab(name) {
  document.querySelectorAll('.tab').forEach((button) => button.classList.toggle('active', button.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.toggle('active', panel.id === `tab-${name}`));
  if (name === 'audit') loadAudit().catch((error) => window.alert(error.message));
}

document.querySelectorAll('.tab').forEach((button) => button.addEventListener('click', () => setTab(button.dataset.tab)));

function validateImageFile(file) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error('Use uma imagem JPG, PNG ou WebP.');
  if (file.size > MAX_FILE_SIZE) throw new Error('A imagem deve ter no máximo 5 MB.');
}

async function fileToBase64(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function uploadImage(file, bucket, folder) {
  validateImageFile(file);
  return apiFetch('/admin/upload-image', {
    method: 'POST',
    body: JSON.stringify({
      bucket,
      folder,
      mime_type: file.type,
      data_base64: await fileToBase64(file),
    }),
  });
}

async function deleteImage(value) {
  if (!value || !String(value).includes('storage')) return;
  try {
    await apiFetch('/admin/delete-image', { method: 'POST', body: JSON.stringify({ value }) });
  } catch (error) {
    console.warn('Não foi possível remover a imagem anterior:', error.message);
  }
}

function clearGiftPreviewObjectUrl() {
  if (giftPreviewObjectUrl) {
    URL.revokeObjectURL(giftPreviewObjectUrl);
    giftPreviewObjectUrl = null;
  }
}

function showGiftImagePreview(url) {
  clearGiftPreviewObjectUrl();
  if (!url) {
    giftImagePreview.removeAttribute('src');
    giftImagePreviewWrap.hidden = true;
    return;
  }
  giftImagePreview.src = url;
  giftImagePreviewWrap.hidden = false;
}

function resetGiftForm() {
  clearGiftPreviewObjectUrl();
  giftForm.reset();
  giftId.value = '';
  giftActive.checked = true;
  giftImage.value = '';
  originalGiftImageValue = null;
  originalGiftPreviewUrl = null;
  imageRemoved = false;
  giftImagePreview.removeAttribute('src');
  giftImagePreviewWrap.hidden = true;
  cancelEdit.hidden = true;
  saveGiftButton.disabled = false;
  saveGiftButton.textContent = 'Salvar presente';
}

async function loadGifts() {
  loadedGifts = await apiFetch('/admin/gifts');
  const list = document.querySelector('#gifts-list');
  list.innerHTML = loadedGifts.map((gift) => `
    <article class="admin-card">
      ${gift.preview_url ? `<img class="admin-gift-thumb" src="${escapeHtml(gift.preview_url)}" alt="${escapeHtml(gift.name)}" />` : '<div class="admin-gift-thumb admin-gift-thumb-empty">Sem foto</div>'}
      <div class="admin-card-main"><span class="badge">${escapeHtml(gift.category || 'Sem categoria')}</span><h3>${escapeHtml(gift.name)}</h3><p>${escapeHtml(gift.description || 'Sem descrição')}</p></div>
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
      originalGiftImageValue = gift.image_url || null;
      originalGiftPreviewUrl = gift.preview_url || null;
      imageRemoved = false;
      showGiftImagePreview(originalGiftPreviewUrl);
      cancelEdit.hidden = false;
      giftName.focus();
    });
  });

  list.querySelectorAll('[data-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!window.confirm('Excluir este presente?')) return;
      try {
        await apiFetch(`/admin/gifts/${Number(button.dataset.delete)}`, { method: 'DELETE' });
        await Promise.all([loadGifts(), loadAudit()]);
      } catch (error) {
        window.alert(error.message);
      }
    });
  });
}

async function loadSiteContent() {
  const data = await apiFetch('/admin/site-settings');
  siteSettings = data;
  heroImage.value = '';
  storyImage.value = '';
  storyLead.value = data.story_lead || '';
  storyText.value = data.story_text || '';
  verseText.value = data.verse_text || '';
  verseReference.value = data.verse_reference || '';
  showSitePreview('hero', data.hero_preview_url || null);
  showSitePreview('story', data.story_preview_url || null);
}

function revokeSitePreview(kind) {
  if (kind === 'hero' && heroPreviewObjectUrl) {
    URL.revokeObjectURL(heroPreviewObjectUrl);
    heroPreviewObjectUrl = null;
  }
  if (kind === 'story' && storyPreviewObjectUrl) {
    URL.revokeObjectURL(storyPreviewObjectUrl);
    storyPreviewObjectUrl = null;
  }
}

function showSitePreview(kind, url) {
  revokeSitePreview(kind);
  const preview = kind === 'hero' ? heroImagePreview : storyImagePreview;
  const wrap = kind === 'hero' ? heroImagePreviewWrap : storyImagePreviewWrap;
  if (!url) {
    preview.removeAttribute('src');
    wrap.hidden = true;
    return;
  }
  preview.src = url;
  wrap.hidden = false;
}

function setSiteFeedback(message, isError = false) {
  siteContentFeedback.textContent = message;
  siteContentFeedback.style.color = isError ? '#a11b36' : '#486342';
}

async function replaceSiteImage(kind, file) {
  validateImageFile(file);
  const column = kind === 'hero' ? 'hero_image_url' : 'story_image_url';
  const folder = kind === 'hero' ? 'hero' : 'story';
  const input = kind === 'hero' ? heroImage : storyImage;
  const preview = kind === 'hero' ? heroImagePreview : storyImagePreview;
  const wrap = kind === 'hero' ? heroImagePreviewWrap : storyImagePreviewWrap;
  const oldValue = siteSettings?.[column] || null;

  revokeSitePreview(kind);
  const localUrl = URL.createObjectURL(file);
  if (kind === 'hero') heroPreviewObjectUrl = localUrl;
  else storyPreviewObjectUrl = localUrl;
  preview.src = localUrl;
  wrap.hidden = false;
  input.disabled = true;
  setSiteFeedback('Enviando imagem...');

  let uploaded = null;
  try {
    uploaded = await uploadImage(file, 'site-images', folder);
    await apiFetch('/admin/site-settings', {
      method: 'PATCH',
      body: JSON.stringify({ [column]: uploaded.value }),
    });
    if (oldValue) await deleteImage(oldValue);
    await loadSiteContent();
    setSiteFeedback('Imagem atualizada e registrada na auditoria.');
    await loadAudit();
  } catch (error) {
    if (uploaded?.value) await deleteImage(uploaded.value);
    showSitePreview(kind, kind === 'hero' ? siteSettings?.hero_preview_url : siteSettings?.story_preview_url);
    setSiteFeedback(error.message || 'Não foi possível atualizar a imagem.', true);
  } finally {
    input.value = '';
    input.disabled = false;
  }
}

async function removeSiteImage(kind) {
  const column = kind === 'hero' ? 'hero_image_url' : 'story_image_url';
  const oldValue = siteSettings?.[column] || null;
  setSiteFeedback('Removendo imagem...');
  try {
    await apiFetch('/admin/site-settings', { method: 'PATCH', body: JSON.stringify({ [column]: null }) });
    if (oldValue) await deleteImage(oldValue);
    await loadSiteContent();
    setSiteFeedback('Imagem removida.');
    await loadAudit();
  } catch (error) {
    setSiteFeedback(error.message || 'Não foi possível remover a imagem.', true);
  }
}

async function loadRsvps() {
  const data = await apiFetch('/admin/rsvps');
  document.querySelector('#rsvps-body').innerHTML = data.map((row) => `
    <tr><td>${escapeHtml(row.guest_name)}</td><td>${row.attending ? 'Confirmado' : 'Não irá'}</td><td>${row.guests_count}</td><td>${dateTime(row.created_at)}</td></tr>
  `).join('');
}

async function loadContributions() {
  const data = await apiFetch('/admin/contributions');
  document.querySelector('#contributions-body').innerHTML = data.map((row) => `
    <tr><td>${escapeHtml(row.contributor_name)}</td><td>${escapeHtml(row.wedding_gifts?.name || '—')}</td><td>${money(row.amount)}</td><td>${escapeHtml(row.status)}</td><td>${dateTime(row.created_at)}</td></tr>
  `).join('');
}

function eventLabel(type) {
  return {
    page_visit: 'Visita ao site',
    api_request: 'API pública',
    admin_auth: 'Login admin',
    admin_api: 'API admin',
    audit_view: 'Consulta de auditoria',
    asset_request: 'Imagem / arquivo',
    security_denied: 'Acesso negado',
    bot_filtered: 'Bot filtrado',
  }[type] || type;
}

function auditWho(row) {
  if (row.actor_email) return `<strong>${escapeHtml(row.actor_email)}</strong>`;
  if (row.visitor_id) return `Visitante <code>${escapeHtml(row.visitor_id.slice(0, 8))}</code>`;
  return 'Anônimo';
}

function compactDetails(details) {
  if (!details || Object.keys(details).length === 0) return '—';
  const text = JSON.stringify(details);
  return escapeHtml(text.length > 260 ? `${text.slice(0, 260)}…` : text);
}

async function loadAudit() {
  const data = await apiFetch('/admin/audit?limit=200');
  document.querySelector('#audit-summary').textContent = `${data.length} registros mais recentes. Cada consulta desta tela também é auditada.`;
  document.querySelector('#audit-body').innerHTML = data.map((row) => `
    <tr>
      <td>${dateTime(row.created_at)}</td>
      <td><strong>${escapeHtml(eventLabel(row.event_type))}</strong></td>
      <td><code>${escapeHtml(row.method)}</code><br><span>${escapeHtml(row.route)}</span></td>
      <td>${auditWho(row)}${row.ip_hash ? `<br><small>IP# ${escapeHtml(row.ip_hash.slice(0, 12))}</small>` : ''}</td>
      <td>${row.status_code ?? '—'}</td>
      <td><small>${compactDetails(row.details)}</small></td>
    </tr>
  `).join('');
}

async function loadDashboard() {
  await Promise.all([loadGifts(), loadSiteContent(), loadRsvps(), loadContributions(), loadAudit()]);
}

async function ensureAdminSession() {
  const session = getSession();
  if (!session?.access_token) {
    loginPanel.hidden = false;
    dashboard.hidden = true;
    return;
  }

  try {
    const data = await apiFetch('/admin/me');
    adminUser.textContent = data.user?.email || session.user?.email || '';
    loginPanel.hidden = true;
    dashboard.hidden = false;
    await loadDashboard();
  } catch (error) {
    clearSession();
    loginFeedback.textContent = error.message || 'Sua sessão expirou. Entre novamente.';
    loginPanel.hidden = false;
    dashboard.hidden = true;
  }
}

document.querySelector('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  loginFeedback.textContent = 'Entrando...';
  const email = document.querySelector('#admin-email').value.trim();
  const password = document.querySelector('#admin-password').value;

  try {
    const session = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false);
    setSession(session);
    document.querySelector('#admin-password').value = '';
    loginFeedback.textContent = '';
    await ensureAdminSession();
  } catch (error) {
    loginFeedback.textContent = error.message || 'Não foi possível entrar.';
  }
});

document.querySelector('#logout-button').addEventListener('click', () => {
  clearSession();
  window.location.reload();
});

giftImage.addEventListener('change', () => {
  const file = giftImage.files?.[0];
  if (!file) {
    showGiftImagePreview(imageRemoved ? null : originalGiftPreviewUrl);
    return;
  }
  try {
    validateImageFile(file);
  } catch (error) {
    giftImage.value = '';
    window.alert(error.message);
    return;
  }
  clearGiftPreviewObjectUrl();
  giftPreviewObjectUrl = URL.createObjectURL(file);
  giftImagePreview.src = giftPreviewObjectUrl;
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
    if (selectedFile) uploaded = await uploadImage(selectedFile, 'wedding-gifts', 'gifts');
    const payload = {
      name: giftName.value.trim(),
      price: Number(giftPrice.value),
      category: giftCategory.value.trim() || null,
      description: giftDescription.value.trim() || null,
      image_url: uploaded?.value || (imageRemoved ? null : originalGiftImageValue),
      is_active: giftActive.checked,
    };

    if (giftId.value) {
      await apiFetch(`/admin/gifts/${Number(giftId.value)}`, { method: 'PATCH', body: JSON.stringify(payload) });
    } else {
      await apiFetch('/admin/gifts', { method: 'POST', body: JSON.stringify(payload) });
    }

    if (originalGiftImageValue && (imageRemoved || uploaded)) await deleteImage(originalGiftImageValue);
    resetGiftForm();
    await Promise.all([loadGifts(), loadAudit()]);
  } catch (error) {
    if (uploaded?.value) await deleteImage(uploaded.value);
    window.alert(error.message || 'Não foi possível salvar o presente.');
    saveGiftButton.disabled = false;
    saveGiftButton.textContent = 'Salvar presente';
  }
});

cancelEdit.addEventListener('click', resetGiftForm);

heroImage.addEventListener('change', () => {
  const file = heroImage.files?.[0];
  if (file) replaceSiteImage('hero', file);
});

storyImage.addEventListener('change', () => {
  const file = storyImage.files?.[0];
  if (file) replaceSiteImage('story', file);
});

removeHeroImage.addEventListener('click', () => removeSiteImage('hero'));
removeStoryImage.addEventListener('click', () => removeSiteImage('story'));

siteContentForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  saveSiteContentButton.disabled = true;
  saveSiteContentButton.textContent = 'Salvando textos...';
  setSiteFeedback('Salvando textos...');
  try {
    await apiFetch('/admin/site-settings', {
      method: 'PATCH',
      body: JSON.stringify({
        story_lead: storyLead.value.trim(),
        story_text: storyText.value.trim(),
        verse_text: verseText.value.trim(),
        verse_reference: verseReference.value.trim(),
      }),
    });
    await loadSiteContent();
    setSiteFeedback('Textos atualizados com sucesso.');
    await loadAudit();
  } catch (error) {
    setSiteFeedback(error.message || 'Não foi possível salvar os textos.', true);
  } finally {
    saveSiteContentButton.disabled = false;
    saveSiteContentButton.textContent = 'Salvar textos';
  }
});

document.querySelector('#refresh-audit').addEventListener('click', () => loadAudit().catch((error) => window.alert(error.message)));

auditPageVisit();
ensureAdminSession();
