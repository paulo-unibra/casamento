const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.main-navigation');
const toast = document.querySelector('.toast');

const SUPABASE_URL = 'https://jygcabtudptfhpcfoyko.supabase.co';
const SUPABASE_KEY = 'sb_publishable_svnP0WG_s-FD5PuJb_cL5w_0r_7R6jv';
let supabase;
let allGifts = [];
let showingAllGifts = false;

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

function renderGifts() {
  const grid = document.querySelector('.gift-grid');
  const gifts = showingAllGifts ? allGifts : allGifts.slice(0, 3);

  grid.innerHTML = gifts.map((gift) => {
    const [artClass, symbol] = giftArt(gift.category || '');
    return `<article class="gift-card">
      <div class="gift-art ${artClass}"><span>${symbol}</span></div>
      <div class="gift-info">
        <span>${gift.category || 'Presente'}</span>
        <h3>${gift.name}</h3>
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
  const { data, error } = await supabase
    .from('wedding_gifts')
    .select('id,name,description,price,category,image_url,is_active')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error) throw error;
  allGifts = data || [];
  renderGifts();
}

async function chooseGift(giftId) {
  const gift = allGifts.find((item) => item.id === giftId);
  if (!gift) return;

  const contributorName = window.prompt(`Quem está presenteando “${gift.name}”?\nDigite seu nome completo:`);
  if (!contributorName?.trim()) return;

  const { error } = await supabase.from('wedding_contributions').insert({
    gift_id: gift.id,
    contributor_name: contributorName.trim(),
    amount: gift.price,
    payment_method: 'test',
    status: 'pending',
  });

  if (error) {
    console.error(error);
    showToast('Não foi possível registrar o presente agora.');
    return;
  }

  showToast('Presente registrado em modo de teste. Nenhum pagamento foi cobrado.');
}

async function submitRsvp(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const name = new FormData(form).get('guest-name').trim();
  const feedback = form.querySelector('.form-feedback');
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;

  const { error } = await supabase.from('wedding_rsvps').insert({
    guest_name: name,
    attending: true,
    guests_count: 1,
  });

  button.disabled = false;
  if (error) {
    console.error(error);
    feedback.textContent = 'Não foi possível confirmar agora. Tente novamente.';
    return;
  }

  feedback.textContent = `Presença de ${name} confirmada com sucesso!`;
  form.reset();
}

async function initSupabase() {
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    await loadGifts();
    document.querySelector('#rsvp-form').addEventListener('submit', submitRsvp);
  } catch (error) {
    console.error('Supabase init error:', error);
    showToast('A conexão com a lista de presentes está temporariamente indisponível.');
  }
}

document.querySelector('#view-all-gifts').addEventListener('click', () => {
  showingAllGifts = !showingAllGifts;
  renderGifts();
});

updateCountdown();
window.setInterval(updateCountdown, 1000);
initSupabase();
