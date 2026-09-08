(() => {
  const PAYMENT_ENDPOINT = 'https://jygcabtudptfhpcfoyko.supabase.co/functions/v1/create-asaas-payment';
  const VISITOR_STORAGE_KEY = 'wedding_visitor_id';

  const modal = document.createElement('div');
  modal.className = 'payment-modal';
  modal.id = 'payment-modal';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="payment-modal__backdrop" data-payment-close></div>
    <section class="payment-modal__panel" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
      <button class="payment-modal__close" type="button" aria-label="Fechar" data-payment-close>×</button>

      <div class="payment-modal__heading">
        <span class="payment-modal__eyebrow">Um carinho para o nosso novo lar</span>
        <h2 id="payment-modal-title">Presentear Paulo & Priscila</h2>
        <p>Revise o presente e informe seu nome. Na próxima etapa, o pagamento será concluído no ambiente seguro do Asaas.</p>
      </div>

      <div class="payment-modal__gift">
        <div class="payment-modal__gift-icon" aria-hidden="true">✦</div>
        <div class="payment-modal__gift-copy">
          <span>Presente escolhido</span>
          <strong id="payment-gift-name">—</strong>
        </div>
        <div class="payment-modal__gift-price" id="payment-gift-price">—</div>
      </div>

      <form class="payment-modal__form" id="payment-form">
        <input type="hidden" id="payment-gift-id" />
        <label for="payment-contributor-name">Seu nome</label>
        <input
          id="payment-contributor-name"
          name="contributor-name"
          type="text"
          autocomplete="name"
          minlength="2"
          maxlength="120"
          placeholder="Digite seu nome completo"
          required
        />

        <div class="payment-modal__methods" aria-label="Formas de pagamento disponíveis">
          <span><b>◆</b> Pix</span>
          <span><b>▣</b> Cartão</span>
          <span><b>▤</b> Boleto</span>
        </div>

        <p class="payment-modal__security">
          <span aria-hidden="true">⌁</span>
          Seus dados de pagamento não passam por este site. O checkout é processado diretamente pelo Asaas.
        </p>

        <div class="payment-modal__feedback" id="payment-feedback" role="status" aria-live="polite"></div>

        <button class="payment-modal__submit" type="submit" id="payment-submit">
          <span>Ir para pagamento seguro</span>
          <b aria-hidden="true">→</b>
        </button>
      </form>
    </section>
  `;
  document.body.appendChild(modal);

  const form = modal.querySelector('#payment-form');
  const giftIdInput = modal.querySelector('#payment-gift-id');
  const contributorInput = modal.querySelector('#payment-contributor-name');
  const giftName = modal.querySelector('#payment-gift-name');
  const giftPrice = modal.querySelector('#payment-gift-price');
  const feedback = modal.querySelector('#payment-feedback');
  const submitButton = modal.querySelector('#payment-submit');

  let previousFocus = null;

  function getVisitorId() {
    let id = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_STORAGE_KEY, id);
    }
    return id;
  }

  function openModal(button) {
    const card = button.closest('.gift-card');
    if (!card) return;

    previousFocus = button;
    giftIdInput.value = button.dataset.giftId || '';
    giftName.textContent = card.querySelector('h3')?.textContent?.trim() || 'Presente';
    giftPrice.textContent = card.querySelector('.gift-info > p')?.textContent?.trim() || '';
    contributorInput.value = '';
    feedback.textContent = '';
    feedback.className = 'payment-modal__feedback';
    submitButton.disabled = false;
    submitButton.querySelector('span').textContent = 'Ir para pagamento seguro';

    modal.hidden = false;
    document.body.classList.add('payment-modal-open');
    requestAnimationFrame(() => {
      modal.classList.add('is-visible');
      contributorInput.focus();
    });
  }

  function closeModal() {
    if (submitButton.disabled) return;
    modal.classList.remove('is-visible');
    document.body.classList.remove('payment-modal-open');
    window.setTimeout(() => {
      modal.hidden = true;
      previousFocus?.focus?.();
    }, 180);
  }

  async function createPayment(giftId, contributorName) {
    const response = await fetch(PAYMENT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-visitor-id': getVisitorId(),
      },
      body: JSON.stringify({
        gift_id: Number(giftId),
        contributor_name: contributorName,
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(payload?.error || 'Não foi possível iniciar o pagamento.');
      error.code = payload?.code || null;
      error.status = response.status;
      throw error;
    }

    return payload;
  }

  document.addEventListener('click', (event) => {
    const giftButton = event.target.closest?.('[data-gift-id]');
    if (giftButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openModal(giftButton);
      return;
    }

    if (event.target.closest?.('[data-payment-close]')) {
      event.preventDefault();
      closeModal();
    }
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) closeModal();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const giftId = giftIdInput.value;
    const contributorName = contributorInput.value.trim();

    if (contributorName.length < 2) {
      feedback.textContent = 'Informe seu nome para continuar.';
      feedback.className = 'payment-modal__feedback is-error';
      contributorInput.focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.querySelector('span').textContent = 'Preparando pagamento...';
    feedback.textContent = 'Conectando ao checkout seguro do Asaas…';
    feedback.className = 'payment-modal__feedback is-loading';

    try {
      const result = await createPayment(giftId, contributorName);
      if (!result?.checkout_url) throw new Error('O Asaas não retornou o endereço do checkout.');

      feedback.textContent = 'Tudo certo. Abrindo o pagamento…';
      feedback.className = 'payment-modal__feedback is-success';
      window.location.assign(result.checkout_url);
    } catch (error) {
      console.error('Payment initialization error:', error);

      let message = error.message || 'Não foi possível iniciar o pagamento.';
      if (error.code === 'ASAAS_NOT_CONFIGURED') {
        message = 'A integração com o Asaas ainda não está completamente configurada.';
      } else if (error.status === 429) {
        message = 'Foram feitas muitas tentativas. Aguarde alguns minutos e tente novamente.';
      }

      feedback.textContent = message;
      feedback.className = 'payment-modal__feedback is-error';
      submitButton.disabled = false;
      submitButton.querySelector('span').textContent = 'Tentar novamente';
    }
  });
})();
