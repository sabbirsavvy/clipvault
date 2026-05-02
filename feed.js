let allClips = [];
let activeFilter = 'all';
let searchQuery = '';

const grid = document.getElementById('clip-grid');
const searchInput = document.getElementById('search-input');

// ── Load ──────────────────────────────────────────────────────────────────────

async function loadClips() {
  grid.innerHTML = '<div class="grid-loading">Loading clips…</div>';
  try {
    allClips = await getClips();
    render();
  } catch (err) {
    grid.innerHTML = `<div class="grid-empty">Could not load clips: ${escapeHtml(err.message)}</div>`;
  }
}

// ── Filter + search ───────────────────────────────────────────────────────────

function filtered() {
  let clips = allClips;

  if (activeFilter !== 'all') {
    clips = clips.filter(c =>
      (c.tags || []).some(t => t.toLowerCase().includes(activeFilter))
    );
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    clips = clips.filter(c =>
      (c.title || '').toLowerCase().includes(q) ||
      (c.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }

  return clips;
}

// ── Render ────────────────────────────────────────────────────────────────────

const IMAGE_EXT = /\.(png|gif|jpe?g|webp|svg)([?#]|$)/i;

function thumbHtml(clip) {
  if (clip.blobUrl && IMAGE_EXT.test(clip.blobUrl)) {
    return `<img src="${escapeHtml(clip.blobUrl)}" alt="" loading="lazy"
              style="width:100%;height:100%;object-fit:cover;">`;
  }
  return '<div class="play-icon">▶</div>';
}

function render() {
  const clips = filtered();

  if (!clips.length) {
    grid.innerHTML = '<div class="grid-empty">No clips found.</div>';
    return;
  }

  grid.innerHTML = clips.map(clip => `
    <div class="clip-card" data-id="${escapeHtml(clip.id)}">
      <div class="clip-thumb">${thumbHtml(clip)}</div>
      <div class="clip-info">
        <div class="clip-title">${escapeHtml(clip.title || '(untitled)')}</div>
        <div class="clip-stats">
          <span>👁 ${clip.views ?? 0}</span>
          <span>❤ ${clip.likes ?? 0}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// ── Events ────────────────────────────────────────────────────────────────────

document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;
    render();
  });
});

searchInput.addEventListener('input', e => {
  searchQuery = e.target.value.trim();
  render();
});

grid.addEventListener('click', e => {
  const card = e.target.closest('.clip-card');
  if (card) window.location.href = `clip.html?id=${encodeURIComponent(card.dataset.id)}`;
});

document.getElementById('account-btn').addEventListener('click', () =>
  showToast('Profile coming soon'));

// ── Init ──────────────────────────────────────────────────────────────────────

loadClips();
