# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Convidados do casamento de Paulo e Priscila, acessando principalmente pelo celular para consultar informações do evento, confirmar presença e, de forma secundária, escolher um presente.

## Product Purpose

Centralizar a experiência digital do casamento: comunicar data, horários e locais com clareza; registrar confirmações de presença; contar a história do casal; e permitir contribuições pela lista de presentes.

## Positioning

Um convite digital pessoal de Paulo e Priscila que une informações práticas, confirmação de presença e presentes em uma experiência única, sem parecer um portal genérico de casamento.

## Operating Context

O site público é acessado por link e publicado no GitHub Pages. Convidados não precisam de login. O casal administra conteúdo, confirmações e presentes por uma área autenticada integrada ao Supabase.

## Capabilities and Constraints

- Conteúdo público em português do Brasil.
- Data do casamento: 19 de dezembro de 2026, às 14h.
- Cerimônia: IEADPE Pau Amarelo Forte, Av. Cláudio José Gueiros Leite, 5481, Pau Amarelo, Paulista/PE.
- Recepção: Cláudio Bial Recepções, Av. Beira Mar, 6209, Pau Amarelo, Paulista/PE.
- RSVP público sem login.
- Lista de presentes carregada pela API do Supabase.
- Pagamentos iniciados no site e concluídos no ambiente seguro do Asaas, com Pix, cartão e boleto.
- Estados de carregamento, indisponibilidade e recuperação da API devem permanecer claros e funcionais.
- A prioridade da página é informação do evento e confirmação de presença; presentes são secundários.

## Brand Commitments

- Exibição dos nomes como “Paulo e Priscila”.
- Preservar a frase “Com a bênção de Deus e de nossos pais, convidamos você para celebrar o nosso casamento.”
- Preservar fotografias do casal e orquídeas em aquarela, usando as flores com contenção.
- Marfim, verde e fúcsia continuam reconhecíveis, sem excesso de rosa.
- A experiência deve parecer pessoal, moderna e editorial, nunca genérica ou com aparência de interface gerada por IA.

## Evidence on Hand

- Fotografias configuradas pela API do site, com imagens padrão de segurança.
- Orquídeas transparentes em `assets/orquideas-canto.webp` e `assets/orquideas-hero.webp`.
- Conteúdo real do evento presente em `index.html`.
- Integrações públicas e fluxo de pagamento presentes em `script.js` e `payment-flow.js`.
- Não há depoimentos, avaliações ou outras provas sociais; não devem ser inventados.

## Product Principles

- Informação prática deve ser encontrada em segundos.
- A confirmação de presença deve continuar disponível mesmo quando outros serviços falharem.
- A estética deve servir à história real do casal, não a tendências genéricas de landing pages.
- Presentes e pagamentos devem transmitir segurança sem dominar a experiência.
- A página deve funcionar com a mesma qualidade em celular e desktop.

## Accessibility & Inclusion

Navegação por teclado, foco visível, conteúdo legível, controles com nomes acessíveis, suporte a movimento reduzido e estados de erro recuperáveis são requisitos permanentes.
