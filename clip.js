const KNOWN_GAMES = ['Valorant', 'League of Legends', 'Fortnite', 'Call of Duty', 'Apex Legends'];

let clip = null;

// ── Boot ──────────────────────────────────────────────────────────────────────

const clipId = new URLSearchParams(location.search).get('id');

if (!clipId) {
  showError('No clip ID specified.');
} else {
  loadClip();
}

async function loadClip() {
  try {
    const all = await getClips();
    clip = all.find(c => c.id === clipId) || null;
    if (!clip) { showError('Clip not found.'); return; }
    render();
  } catch (err) {
    showError(`Could not load clip: ${err.message}`);
  }
}

// ── Render ────────────────────────────────────────────────────────────────────

function render() {
  document.title = `ClipVault — ${clip.title || 'Clip'}`;

  const wrap = document.getElementById('video-wrap');
  if (clip.blobUrl) {
    const video = document.createElement('video');
    video.src      = clip.blobUrl;
    video.controls = true;
    video.preload  = 'metadata';
    video.addEventListener('loadedmetadata', () => {
      document.getElementById('meta-duration').textContent =
        formatDuration(video.duration);
    });
    video.addEventListener('error', () => {
      wrap.innerHTML = '<div class="video-placeholder">⚠ Media could not be loaded</div>';
    });
    wrap.innerHTML = '';
    wrap.appendChild(video);
  } else {
    wrap.innerHTML = '<div class="video-placeholder">No media URL attached to this clip</div>';
  }

  document.getElementById('meta-title').textContent  = clip.title || '(untitled)';
  document.getElementById('meta-game').textContent   = detectGame(clip);
  document.getElementById('meta-views').textContent  = clip.views ?? 0;
  document.getElementById('meta-likes').textContent  = clip.likes ?? 0;
}

function detectGame(c) {
  if (c.game) return c.game;
  const tags = c.tags || [];
  return (
    tags.find(t => KNOWN_GAMES.some(g => g.toLowerCase() === t.toLowerCase()))
    ?? tags[0]
    ?? '—'
  );
}

function formatDuration(secs) {
  if (!isFinite(secs) || secs <= 0) return '—';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}m ${s}s`;
}

function showError(msg) {
  document.getElementById('video-wrap').innerHTML =
    `<div class="video-placeholder">${escapeHtml(msg)}</div>`;
  document.getElementById('meta-title').textContent = 'Error';
}

// ── Edit modal ────────────────────────────────────────────────────────────────

const overlay     = document.getElementById('modal-overlay');
const modalStatus = document.getElementById('modal-status');
const saveBtn     = document.getElementById('modal-save');

function openModal() {
  document.getElementById('modal-title-input').value =
    clip.title || '';
  document.getElementById('modal-desc').value =
    clip.description || '';
  document.getElementById('modal-tags').value =
    (clip.tags || []).map(t => `#${t}`).join(' ');
  setModalStatus('', '');
  saveBtn.disabled = false;
  overlay.classList.remove('hidden');
  document.getElementById('modal-title-input').focus();
}

function closeModal() {
  overlay.classList.add('hidden');
}

document.getElementById('edit-btn').addEventListener('click', openModal);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

document.getElementById('modal-form').addEventListener('submit', async e => {
  e.preventDefault();

  const newTitle = document.getElementById('modal-title-input').value.trim();
  const newDesc  = document.getElementById('modal-desc').value.trim();
  const tagsRaw  = document.getElementById('modal-tags').value;

  if (!newTitle) {
    setModalStatus('Title is required.', 'error');
    return;
  }

  const newTags = tagsRaw
    .split(/[\s,]+/)
    .map(t => t.replace(/^#/, '').trim())
    .filter(Boolean);

  const payload = {
    id:          clip.id,
    title:       newTitle,
    description: newDesc,
    blobUrl:     clip.blobUrl     || '',
    tags:        newTags,
    game:        clip.game        || '',
    visibility:  clip.visibility  || 'public'
  };

  saveBtn.disabled = true;
  setModalStatus('Saving…', '');

  try {
    await updateClip(payload);
    location.reload();
  } catch (err) {
    setModalStatus(`Error: ${err.message}`, 'error');
    saveBtn.disabled = false;
  }
});

function setModalStatus(msg, type) {
  modalStatus.textContent = msg;
  modalStatus.className   = 'modal-status' + (type ? ` ${type}` : '');
}

// ── Share ─────────────────────────────────────────────────────────────────────

document.getElementById('share-btn').addEventListener('click', () => {
  if (!clip?.blobUrl) { showToast('No URL to share'); return; }
  navigator.clipboard.writeText(clip.blobUrl)
    .then(()  => showToast('Link copied!'))
    .catch(() => showToast('Could not copy — clipboard access denied'));
});

// ── Delete ────────────────────────────────────────────────────────────────────

document.getElementById('delete-btn').addEventListener('click', async () => {
  if (!confirm(`Delete "${clip.title || 'this clip'}"? This cannot be undone.`)) return;
  try {
    await deleteClip(clip.id);
    location.href = 'feed.html';
  } catch (err) {
    showToast(`Delete failed: ${err.message}`);
  }
});
