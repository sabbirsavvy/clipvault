const dropzone  = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const fileLabel = document.getElementById('dz-file-label');
const urlToggle = document.getElementById('url-toggle');
const urlField  = document.getElementById('url-field');
const submitBtn = document.getElementById('submit-btn');
const statusEl  = document.getElementById('upload-status');

// ── Dropzone ──────────────────────────────────────────────────────────────────

dropzone.addEventListener('click', e => {
  if (e.target !== fileInput) fileInput.click();
});

fileInput.addEventListener('change', () => {
  const f = fileInput.files[0];
  if (f) fileLabel.textContent = `✓  ${f.name}`;
});

dropzone.addEventListener('dragover', e => {
  e.preventDefault();
  dropzone.classList.add('drag-over');
});

dropzone.addEventListener('dragleave', e => {
  if (!dropzone.contains(e.relatedTarget)) dropzone.classList.remove('drag-over');
});

dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove('drag-over');
  const f = e.dataTransfer.files[0];
  if (f) fileLabel.textContent = `✓  ${f.name}`;
});

// ── Advanced URL toggle ───────────────────────────────────────────────────────

urlToggle.addEventListener('click', () => {
  const open = urlField.classList.toggle('visible');
  urlToggle.textContent = open ? 'Advanced / paste URL ▲' : 'Advanced / paste URL ▾';
});

// ── Submit ────────────────────────────────────────────────────────────────────

document.getElementById('upload-form').addEventListener('submit', async e => {
  e.preventDefault();

  const title      = document.getElementById('title').value.trim();
  const game       = document.getElementById('game').value;
  const blobUrl    = document.getElementById('blobUrl').value.trim();
  const tagsRaw    = document.getElementById('tags').value;
  const visibility = document.querySelector('input[name="visibility"]:checked').value;

  if (!title) {
    setStatus('Please enter a title.', 'error');
    return;
  }

  if (!blobUrl) {
    urlField.classList.add('visible');
    urlToggle.textContent = 'Advanced / paste URL ▲';
    document.getElementById('blobUrl').focus();
    setStatus('Paste a blob URL in the Advanced section to upload.', 'error');
    return;
  }

  // parse hashtag-style tags, strip leading #
  const tags = tagsRaw
    .split(/[\s,]+/)
    .map(t => t.replace(/^#/, '').trim())
    .filter(Boolean);

  // inject game as tag so feed filter chips work
  if (game && game !== 'Other') {
    const norm = game.toLowerCase();
    if (!tags.some(t => t.toLowerCase() === norm)) tags.unshift(game);
  }

  const payload = { title, description: '', blobUrl, tags, game, visibility };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Uploading…';
  setStatus('', '');

  try {
    await createClip(payload);
    setStatus('✓ Clip uploaded!', 'success');
    setTimeout(() => location.href = 'feed.html', 900);
  } catch (err) {
    setStatus(`Upload failed: ${err.message}`, 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Upload Clip';
  }
});

// ── Misc ──────────────────────────────────────────────────────────────────────

document.getElementById('account-btn').addEventListener('click', () =>
  showToast('Profile coming soon'));

function setStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className   = 'upload-status' + (type ? ` ${type}` : '');
}
