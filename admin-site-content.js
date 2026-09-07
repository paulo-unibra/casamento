import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient(
  'https://jygcabtudptfhpcfoyko.supabase.co',
  'sb_publishable_svnP0WG_s-FD5PuJb_cL5w_0r_7R6jv'
);

const form = document.querySelector('#site-content-form');
const feedback = document.querySelector('#site-content-feedback');
const saveButton = document.querySelector('#save-site-content-button');
const heroInput = document.querySelector('#hero-image');
const storyInput = document.querySelector('#story-image');
const heroPreview = document.querySelector('#hero-image-preview');
const storyPreview = document.querySelector('#story-image-preview');
const heroPreviewWrap = document.querySelector('#hero-image-preview-wrap');
const storyPreviewWrap = document.querySelector('#story-image-preview-wrap');
const removeHeroButton = document.querySelector('#remove-hero-image');
const removeStoryButton = document.querySelector('#remove-story-image');
const storyLead = document.querySelector('#story-lead');
const storyText = document.querySelector('#story-text');
const verseText = document.querySelector('#verse-text');
const verseReference = document.querySelector('#verse-reference');

const SITE_BUCKET = 'site-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function setFeedback(message, isError = false) {
  if (!feedback) return;
  feedback.textContent = message;
  feedback.style.color = isError ? '#a11b36' : '#486342';
}

function validateFile(file) {
  if (!ALLOWED_TYPES.has(file.type)) throw new Error('Use uma imagem JPG, PNG ou WebP.');
  if (file.size > MAX_FILE_SIZE) throw new Error('A imagem deve ter no máximo 5 MB.');
}

function extensionFor(file) {
  return {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }[file.type];
}

function storagePathFromPublicUrl(url) {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${SITE_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length).split('?')[0]);
}

async function getSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('id,hero_image_url,story_image_url')
    .eq('id', 1)
    .single();
  if (error) throw error;
  return data;
}

async function deleteOldImage(url) {
  const path = storagePathFromPublicUrl(url);
  if (!path) return;
  const { error } = await supabase.storage.from(SITE_BUCKET).remove([path]);
  if (error) console.warn('Não foi possível remover a imagem anterior:', error.message);
}

async function uploadAndApply(kind, file) {
  validateFile(file);

  const column = kind === 'hero' ? 'hero_image_url' : 'story_image_url';
  const folder = kind === 'hero' ? 'hero' : 'story';
  const label = kind === 'hero' ? 'Foto principal' : 'Foto de “Nossa história”';
  const input = kind === 'hero' ? heroInput : storyInput;
  const preview = kind === 'hero' ? heroPreview : storyPreview;
  const previewWrap = kind === 'hero' ? heroPreviewWrap : storyPreviewWrap;

  const localPreviewUrl = URL.createObjectURL(file);
  preview.src = localPreviewUrl;
  previewWrap.hidden = false;
  input.disabled = true;
  setFeedback(`Enviando ${label.toLowerCase()}...`);

  let uploadedPath = null;

  try {
    const current = await getSettings();
    const path = `${folder}/${crypto.randomUUID()}.${extensionFor(file)}`;
    uploadedPath = path;

    const { error: uploadError } = await supabase.storage.from(SITE_BUCKET).upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage.from(SITE_BUCKET).getPublicUrl(path);
    const publicUrl = publicData.publicUrl;

    const { error: updateError } = await supabase
      .from('site_settings')
      .update({ [column]: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', 1);
    if (updateError) throw updateError;

    await deleteOldImage(current[column]);

    preview.src = `${publicUrl}?v=${Date.now()}`;
    previewWrap.hidden = false;
    input.value = '';
    setFeedback(`${label} atualizada. A nova imagem já está salva no site.`);
  } catch (error) {
    if (uploadedPath) {
      await supabase.storage.from(SITE_BUCKET).remove([uploadedPath]).catch(() => {});
    }
    setFeedback(`Erro ao trocar a imagem: ${error.message || 'falha desconhecida'}`, true);
  } finally {
    URL.revokeObjectURL(localPreviewUrl);
    input.disabled = false;
  }
}

async function removeImage(kind) {
  const column = kind === 'hero' ? 'hero_image_url' : 'story_image_url';
  const label = kind === 'hero' ? 'Foto principal' : 'Foto de “Nossa história”';
  const preview = kind === 'hero' ? heroPreview : storyPreview;
  const previewWrap = kind === 'hero' ? heroPreviewWrap : storyPreviewWrap;
  const input = kind === 'hero' ? heroInput : storyInput;

  setFeedback(`Removendo ${label.toLowerCase()}...`);
  try {
    const current = await getSettings();
    const { error } = await supabase
      .from('site_settings')
      .update({ [column]: null, updated_at: new Date().toISOString() })
      .eq('id', 1);
    if (error) throw error;

    await deleteOldImage(current[column]);
    input.value = '';
    preview.removeAttribute('src');
    previewWrap.hidden = true;
    setFeedback(`${label} removida.`);
  } catch (error) {
    setFeedback(`Erro ao remover a imagem: ${error.message || 'falha desconhecida'}`, true);
  }
}

heroInput?.addEventListener('change', (event) => {
  event.stopImmediatePropagation();
  const file = heroInput.files?.[0];
  if (file) uploadAndApply('hero', file);
}, true);

storyInput?.addEventListener('change', (event) => {
  event.stopImmediatePropagation();
  const file = storyInput.files?.[0];
  if (file) uploadAndApply('story', file);
}, true);

removeHeroButton?.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopImmediatePropagation();
  removeImage('hero');
}, true);

removeStoryButton?.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopImmediatePropagation();
  removeImage('story');
}, true);

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  event.stopImmediatePropagation();

  saveButton.disabled = true;
  saveButton.textContent = 'Salvando textos...';
  setFeedback('Salvando textos...');

  try {
    const { error } = await supabase
      .from('site_settings')
      .update({
        story_lead: storyLead.value.trim(),
        story_text: storyText.value.trim(),
        verse_text: verseText.value.trim(),
        verse_reference: verseReference.value.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);
    if (error) throw error;
    setFeedback('Textos atualizados com sucesso.');
  } catch (error) {
    setFeedback(`Erro ao salvar os textos: ${error.message || 'falha desconhecida'}`, true);
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = 'Salvar textos';
  }
}, true);
