const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.main-navigation');
const toast = document.querySelector('.toast');

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
  showToast.timeout = window.setTimeout(() => toast.classList.remove('visible'), 3200);
}

document.querySelector('#rsvp-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = new FormData(event.currentTarget).get('guest-name').trim();
  const feedback = event.currentTarget.querySelector('.form-feedback');
  feedback.textContent = `Convite de ${name} localizado — demonstração do fluxo.`;
});

document.querySelectorAll('.gift-info button').forEach((button) => {
  button.addEventListener('click', () => showToast('Presente selecionado. A reserva será ativada na próxima etapa.'));
});

document.querySelector('#view-all-gifts').addEventListener('click', () => {
  showToast('A lista completa será conectada ao painel administrativo.');
});

updateCountdown();
window.setInterval(updateCountdown, 1000);
