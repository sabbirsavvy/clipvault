const ALLOWED_TYPES = new Set([
  'video/mp4', 'video/quicktime',
  'image/png', 'image/gif', 'image/jpeg'
]);
const ALLOWED_EXTS = new Set(['mp4', 'mov', 'png', 'gif', 'jpg', 'jpeg']);
const MAX_BYTES    = 100 * 1024 * 1024;

const dropzone  = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const fileLabel = document.getElementById('dz-file-label');
const urlToggle = document.getElementById('url-toggle');
const urlField  = document.getElementById('url-field');
const submitBtn = document.getElementById('submit-btn');
const statusEl  = document.getElementById('upload-status');
const fuStatus  = document.getElementById('file-upload-status');
const fuState   = document.getElementById('fu-state');
const fuBarWrap = document.getElementById('fu-bar-wrap');
const fuBar     = document.getElementById('fu-bar');

let resolvedBlobUrl = null;
let currentAbort    = null; // abort fn for the in-flight XHR

// ── Dropzone ──────────────────────────────────────────────────────────────────

dropzone.addEventListener('click', e => {
  if (e.target !== fileInput) fileInput.click();
});

fileInput.addEventListener('change', () => {
  const f = fileInput.files[0];
  if (f) handleFileSelected(f);
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
  if (f) handleFileSelected(f);
});

// ── File upload state machine ─────────────────────────────────────────────────

async function handleFileSelected(file) {
  // Abort any upload already in flight
  if (currentAbort) {
    currentAbort();
    currentAbort = null;
  }
  resolvedBlobUrl = null;

  const ext = file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_TYPES.has(file.type) && !ALLOWED_EXTS.has(ext)) {
    fileLabel.textContent = '';
    setFileState('File type not supported. Use MP4, MOV, PNG, GIF, or JPG.', 'error');
    fuStatus.hidden = false;
    fuBarWrap.hidden = true;
    return;
  }

  if (file.size > MAX_BYTES) {
    console.warn(`File exceeds 100 MB: ${(file.size / 1024 / 1024).toFixed(1)} MB`);
    fileLabel.textContent = '';
    setFileState('File exceeds the 100 MB limit.', 'error');
    fuStatus.hidden = false;
    fuBarWrap.hidden = true;
    return;
  }

  fileLabel.textContent = file.name;
  submitBtn.disabled = true;
  setFileState('Getting upload URL…', '');
  fuStatus.hidden  = false;
  fuBarWrap.hidden = true;

  let uploadUrl, blobUrl;
  try {
    ({ uploadUrl, blobUrl } = await getSasUrl(file.name));
  } catch (err) {
    setFileState(`Could not get upload URL: ${err.message}`, 'error');
    submitBtn.disabled = false;
    return;
  }

  setFileState('Uploading 0%…', '');
  fuBarWrap.hidden = false;
  fuBar.style.width = '0%';

  const { promise, abort } = uploadFileToBlob(file, uploadUrl, pct => {
    setFileState(`Uploading ${pct}%…`, '');
    fuBar.style.width = `${pct}%`;
  });
  currentAbort = abort;

  try {
    await promise;
    currentAbort    = null;
    resolvedBlobUrl = blobUrl;
    fileLabel.textContent = `✓  ${file.name}`;
    setFileState('Uploaded ✓', 'success');
    fuBar.style.width = '100%';
    submitBtn.disabled = false;
  } catch (err) {
    currentAbort = null;
    if (err.message === 'aborted') return; // new file was selected; let that upload take over
    setFileState(`Upload failed: ${err.message}`, 'error');
    submitBtn.disabled = false;
  }
}

function setFileState(msg, type) {
  fuState.textContent = msg;
  fuState.className   = 'fu-state' + (type ? ` ${type}` : '');
}

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
  const manualUrl  = document.getElementById('blobUrl').value.trim();
  const tagsRaw    = document.getElementById('tags').value;
  const visibility = document.querySelector('input[name="visibility"]:checked').value;
  const blobUrl    = resolvedBlobUrl || manualUrl;

  if (!title) {
    setStatus('Please enter a title.', 'error');
    return;
  }

  if (!blobUrl) {
    urlField.classList.add('visible');
    urlToggle.textContent = 'Advanced / paste URL ▲';
    document.getElementById('blobUrl').focus();
    setStatus('Drop a file to upload it, or paste a blob URL in Advanced.', 'error');
    return;
  }

  const tags = tagsRaw
    .split(/[\s,]+/)
    .map(t => t.replace(/^#/, '').trim())
    .filter(Boolean);

  if (game && game !== 'Other') {
    const norm = game.toLowerCase();
    if (!tags.some(t => t.toLowerCase() === norm)) tags.unshift(game);
  }

  const payload = { title, description: '', blobUrl, tags, game, visibility };

  submitBtn.disabled    = true;
  submitBtn.textContent = 'Saving…';
  setStatus('', '');

  try {
    await createClip(payload);
    setStatus('✓ Clip uploaded!', 'success');
    setTimeout(() => location.href = 'feed.html', 900);
  } catch (err) {
    setStatus(`Failed to save clip: ${err.message}`, 'error');
    submitBtn.disabled    = false;
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
