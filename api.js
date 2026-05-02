const CREATE_URL = 'https://prod-17.spaincentral.logic.azure.com:443/workflows/350e34c49bbc4ff9b2ee8dc2c0b997b5/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=3tOUNjgh4x49YQhd9wCVogIEXQZIZu-8ZfwnMI-6w8s';
const READ_URL   = 'https://prod-08.spaincentral.logic.azure.com:443/workflows/9cdeef8283994a0daf80567e413c82ab/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=4w-8D1r72KzydSYtUCCNiRvhJV1Xfvge_7eHOr6orww';
const UPDATE_URL = 'https://prod-31.spaincentral.logic.azure.com:443/workflows/203085e52ddc473ba276c995df9ee259/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=e5ElFCXRZgufNcFJjtE-77pc0wgdW2SnYwqThW4xbqI';
const DELETE_URL = 'https://prod-26.spaincentral.logic.azure.com/workflows/a6cc4a2114ee456cbd00c38f1da04c79/triggers/When_an_HTTP_request_is_received/paths/invoke/{id}?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=va-z0aMv55ItooQj7yqoYgXbUVuoUsUGQQ1NDd10aYA';

async function getClips() {
  const res = await fetch(READ_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function createClip(payload) {
  const res = await fetch(CREATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function updateClip(payload) {
  const res = await fetch(UPDATE_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function deleteClip(id) {
  const url = DELETE_URL.replace('{id}', encodeURIComponent(id));
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function showToast(msg, type) {
  const prev = document.querySelector('.toast');
  if (prev) prev.remove();
  const el = Object.assign(document.createElement('div'), {
    className: 'toast' + (type ? ` toast-${type}` : ''),
    textContent: msg
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}
