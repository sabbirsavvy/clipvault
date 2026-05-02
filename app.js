// === ClipVault frontend ===
// Update these four URLs with the values from your urls.txt file.
const CREATE_URL = 'https://prod-17.spaincentral.logic.azure.com:443/workflows/350e34c49bbc4ff9b2ee8dc2c0b997b5/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=3tOUNjgh4x49YQhd9wCVogIEXQZIZu-8ZfwnMI-6w8s';
const READ_URL   = 'https://prod-08.spaincentral.logic.azure.com:443/workflows/9cdeef8283994a0daf80567e413c82ab/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=4w-8D1r72KzydSYtUCCNiRvhJV1Xfvge_7eHOr6orww';
const UPDATE_URL = 'https://prod-31.spaincentral.logic.azure.com:443/workflows/203085e52ddc473ba276c995df9ee259/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=e5ElFCXRZgufNcFJjtE-77pc0wgdW2SnYwqThW4xbqI';
const DELETE_URL = 'https://prod-26.spaincentral.logic.azure.com/workflows/a6cc4a2114ee456cbd00c38f1da04c79/triggers/When_an_HTTP_request_is_received/paths/invoke/{id}?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=va-z0aMv55ItooQj7yqoYgXbUVuoUsUGQQ1NDd10aYA'; // must contain {id} as a literal placeholder

// === Element references ===
const form = document.getElementById('upload-form');
const titleInput = document.getElementById('title');
const descInput = document.getElementById('description');
const blobUrlInput = document.getElementById('blobUrl');
const tagsInput = document.getElementById('tags');
const uploadStatus = document.getElementById('upload-status');
const clipList = document.getElementById('clip-list');
const refreshBtn = document.getElementById('refresh-btn');

// === Load and display all clips ===
async function loadClips() {
    clipList.textContent = 'Loading...';
    try {
        const response = await fetch(READ_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const clips = await response.json();
        renderClips(clips);
    } catch (err) {
        clipList.textContent = `Error loading clips: ${err.message}`;
    }
}

function renderClips(clips) {
    if (!clips.length) {
        clipList.textContent = 'No clips yet. Upload one above.';
        return;
    }
    clipList.innerHTML = clips.map(clip => `
        <div class="clip" data-id="${clip.id}">
            <h3>${escapeHtml(clip.title || '(no title)')}</h3>
            <p class="description">${escapeHtml(clip.description || '')}</p>
            <div class="meta">
                <span>Uploaded: ${new Date(clip.uploadedAt).toLocaleString()}</span>
                ${clip.blobUrl ? `<a href="${clip.blobUrl}" target="_blank">Open file ↗</a>` : ''}
            </div>
            <div class="tags">
                ${(clip.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
            </div>
            <div class="actions">
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </div>
        </div>
    `).join('');
    
    // Attach event listeners to buttons
    clipList.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', e => editClip(e.target.closest('.clip')));
    });
    clipList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', e => deleteClip(e.target.closest('.clip')));
    });
}

// === Upload a new clip ===
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    uploadStatus.textContent = 'Uploading...';
    uploadStatus.className = '';
    
    const payload = {
        title: titleInput.value.trim(),
        description: descInput.value.trim(),
        blobUrl: blobUrlInput.value.trim(),
        tags: tagsInput.value.split(',').map(t => t.trim()).filter(Boolean)
    };
    
    try {
        const response = await fetch(CREATE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        uploadStatus.textContent = '✓ Clip uploaded successfully';
        uploadStatus.className = 'success';
        form.reset();
        loadClips();
    } catch (err) {
        uploadStatus.textContent = `Error: ${err.message}`;
        uploadStatus.className = 'error';
    }
});

// === Edit a clip ===
async function editClip(clipEl) {
    const id = clipEl.dataset.id;
    const currentTitle = clipEl.querySelector('h3').textContent;
    const currentDesc = clipEl.querySelector('.description').textContent;
    
    const newTitle = prompt('New title:', currentTitle);
    if (newTitle === null) return; // user cancelled
    const newDesc = prompt('New description:', currentDesc);
    if (newDesc === null) return;
    
    // Read existing clip details to preserve fields we're not editing
    const allClips = await (await fetch(READ_URL)).json();
    const clip = allClips.find(c => c.id === id);
    if (!clip) {
        alert('Clip not found.');
        return;
    }
    
    const payload = {
        id: clip.id,
        title: newTitle,
        description: newDesc,
        blobUrl: clip.blobUrl,
        tags: clip.tags || []
    };
    
    try {
        const response = await fetch(UPDATE_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        loadClips();
    } catch (err) {
        alert(`Error updating: ${err.message}`);
    }
}

// === Delete a clip ===
async function deleteClip(clipEl) {
    const id = clipEl.dataset.id;
    const title = clipEl.querySelector('h3').textContent;
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    
    try {
        const url = DELETE_URL.replace('{id}', id);
        const response = await fetch(url, { method: 'DELETE' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        loadClips();
    } catch (err) {
        alert(`Error deleting: ${err.message}`);
    }
}

// === Helpers ===
function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

// === Initial load ===
refreshBtn.addEventListener('click', loadClips);
loadClips();