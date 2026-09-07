const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.main-navigation');
const toast = document.querySelector('.toast');

const API_BASE = 'https://jygcabtudptfhpcfoyko.supabase.co/functions/v1/app-api';
const VISITOR_STORAGE_KEY = 'wedding_visitor_id';
let allGifts = [];
let showingAllGifts = false;

function getVisitorId() {
  let id = localStorage.getItem(VISITOR_STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_STORAGE_KEY, id);
  }
  return id;
}

const visitorId = getVisitorId();

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('x-visitor-id', visitorId);
  if (options.body && !headers.has('content-type')) headers.set('content-type', 'application/json');

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  let payload = null;
  if (response.status !== 204) {
    payload = await response.json().catch(() => null);
  }

  if (!response.ok) {
    throw new Error(payload?.error || 'Não foi possível concluir a operação.');
  }

  return payload;
}

function auditPageVisit() {
  fetch(`${API_BASE}/public/visit`, {
    method: 'POST',
    keepalive: true,
    headers: { 'Content-Type': 'application/json', 'x-visitor-id': visitorId },
    body: JSON.stringify({
      visitor_id: visitorId,
      path: `${location.pathname}${location.search}`,
      title: document.title,
    }),
  }).catch(() => {});
}

menuButton.addEventListener('click', () => {
  const isOpen = navigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
});

navigation.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navigation.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  });
});

function updateCountdown() {
  const countdown = document.querySelector('.countdown');
  const weddingDate = new Date(countdown.dataset.weddingDate).getTime();
  const difference = Math.max(0, weddingDate - Date.now());
  const units = {
    days: Math.floor(difference / 86400000),
    hours: Math.floor((difference / 3600000) % 24),
    minutes: Math.floor((difference / 60000) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };

  Object.entries(units).forEach(([unit, value]) => {
    document.querySelector(`[data-unit="${unit}"]`).textContent = String(value).padStart(2, '0');
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove('visible'), 3600);
}

function money(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function giftArt(category = '') {
  const value = category.toLowerCase();
  if (value.includes('casa')) return ['gift-art-home', '⌂'];
  if (value.includes('lua')) return ['gift-art-trip', '⌁'];
  return ['gift-art-dinner', '✦'];
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderGifts() {
  const grid = document.querySelector('.gift-grid');
  const gifts = showingAllGifts ? allGifts : allGifts.slice(0, 3);

  grid.innerHTML = gifts.map((gift) => {
    const [artClass, symbol] = giftArt(gift.category || '');
    const safeName = escapeHtml(gift.name);
    const visual = gift.image_url
      ? `<img src="${escapeHtml(gift.image_url)}" alt="${safeName}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit" />`
      : `<span>${symbol}</span>`;

    return `<article class="gift-card">
      <div class="gift-art ${artClass}" ${gift.image_url ? 'style="padding:0;overflow:hidden;background:#f8f3eb"' : ''}>${visual}</div>
      <div class="gift-info">
        <span>${escapeHtml(gift.category || 'Presente')}</span>
        <h3>${safeName}</h3>
        <p>${money(gift.price)}</p>
        <button type="button" data-gift-id="${gift.id}">Escolher presente</button>
      </div>
    </article>`;
  }).join('');

  grid.querySelectorAll('[data-gift-id]').forEach((button) => {
    button.addEventListener('click', () => chooseGift(Number(button.dataset.giftId)));
  });

  const viewAll = document.querySelector('#view-all-gifts');
  viewAll.hidden = allGifts.length <= 3;
  viewAll.textContent = showingAllGifts ? 'Mostrar menos' : 'Ver todos os presentes';
}

async function loadGifts() {
  allGifts = await apiFetch('/public/gifts');
  renderGifts();
}

async function loadSiteSettings() {
  const data = await apiFetch('/public/site-settings');

  const heroPhoto = document.querySelector('#hero-photo');
  const storyPhoto = document.querySelector('#story-photo');
  const storyLead = document.querySelector('#story-lead');
  const storyText = document.querySelector('#story-text');
  const storyVerse = document.querySelector('#story-verse');
  const storyVerseReference = document.querySelector('#story-verse-reference');

  heroPhoto.style.backgroundImage = data.hero_image_url ? `url("${data.hero_image_url}")` : 'none';
  storyPhoto.style.backgroundImage = data.story_image_url
    ? `linear-gradient(rgba(193,59,130,.025),rgba(79,96,72,.08)), url("${data.story_image_url}")`
    : 'none';

  if (data.story_lead) storyLead.textContent = data.story_lead;
  if (data.story_text) storyText.textContent = data.story_text;
  if (data.verse_text) storyVerse.textContent = `“${data.verse_text}”`;
  if (data.verse_reference) storyVerseReference.textContent = data.verse_reference;
}

async function chooseGift(giftId) {
  const gift = allGifts.find((item) => item.id === giftId);
  if (!gift) return;

  const contributorName = window.prompt(`Quem está presenteando “${gift.name}”?\nDigite seu nome completo:`);
  if (!contributorName?.trim()) return;

  try {
    await apiFetch('/public/contribution-test', {
      method: 'POST',
      body: JSON.stringify({
        gift_id: gift.id,
        contributor_name: contributorName.trim(),
      }),
    });
    showToast('Presente registrado em modo de teste. Nenhum pagamento foi cobrado.');
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Não foi possível registrar o presente agora.');
  }
}

async function submitRsvp(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const name = new FormData(form).get('guest-name').trim();
  const feedback = form.querySelector('.form-feedback');
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;

  try {
    await apiFetch('/public/rsvp', {
      method: 'POST',
      body: JSON.stringify({
        guest_name: name,
        attending: true,
        guests_count: 1,
        website: '',
      }),
    });
    feedback.textContent = `Presença de ${name} confirmada com sucesso!`;
    form.reset();
  } catch (error) {
    console.error(error);
    feedback.textContent = error.message || 'Não foi possível confirmar agora. Tente novamente.';
  } finally {
    button.disabled = false;
  }
}

async function init() {
  auditPageVisit();
  try {
    await Promise.all([loadGifts(), loadSiteSettings()]);
    document.querySelector('#rsvp-form').addEventListener('submit', submitRsvp);
  } catch (error) {
    console.error('API init error:', error);
    showToast('A conexão com o site está temporariamente indisponível.');
  }
}

document.querySelector('#view-all-gifts').addEventListener('click', () => {
  showingAllGifts = !showingAllGifts;
  renderGifts();
});

updateCountdown();
window.setInterval(updateCountdown, 1000);
init();
