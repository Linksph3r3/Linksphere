/* script.js — cleaned, final version
- Hidden scrollbars (swipe allowed)
- Arrows (hover desktop / always on mobile)
- Ad gate: ads or video (locking)
- Video: random from 3 IDs; mute toggle; countdown starts when PLAYING
- Visual progress bar; proceed unlocked after 30 real seconds
*/

/* ========== CONFIG ========== */
const REQUIRED_SECONDS = 30;
const gateVideos = [
"iYQNU54cM_8",
"8xUX3D_GxBQ",
"qRYmz6k3bR8"
];

/* ========== DOM helpers ========== */
const $ = (sel, ctx = document) => (ctx || document).querySelector(sel);
const $$ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));

/* ========== Gate element resolver ========== */
function gate() {
return {
modal: document.getElementById('adGate'),
proceedBtn: document.getElementById('gateProceed'),
closeBtn: document.getElementById('gateClose'),
chooseAds: document.getElementById('chooseAds'),
chooseVideo: document.getElementById('chooseVideo'),
adsSection: document.getElementById('adsSection'),
videoSection: document.getElementById('videoSection'),
adBtns: $$('.ad-btn'),
muteBtn: document.getElementById('muteToggle'),
videoWrapper: document.getElementById('gateVideoWrapper'),
placeholder: document.getElementById('gateVideoPlaceholder'),
progressBarWrapper: document.getElementById('progressBarWrapper'),
progressBar: document.getElementById('progressBar'),
countdownEl: document.getElementById('countdown')
};
}

/* ========== State ========== */
let state = {
chosenMethod: null, // 'ads' | 'video' | null
adsViewed: 0,
targetLink: null,
ytPlayer: null,
watchSeconds: 0,
watchInterval: null
};

/* ========== YT API loader ========== */
function loadYouTubeApi() {
return new Promise((resolve, reject) => {
if (window.YT && typeof window.YT.Player === 'function') return resolve(window.YT);
if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
// will call onYouTubeIframeAPIReady eventually
window.onYouTubeIframeAPIReady = () => resolve(window.YT);
return;
}
window.onYouTubeIframeAPIReady = () => resolve(window.YT);
const s = document.createElement('script');
s.src = "https://www.youtube.com/iframe_api";
s.async = true;
s.onerror = () => reject(new Error('YT API load failed'));
document.head.appendChild(s);
});
}

/* ========== Gate UI helpers ========== */
function resetGate() {
const g = gate();
state.chosenMethod = null;
state.adsViewed = 0;
state.targetLink = null;
state.watchSeconds = 0;
if (state.watchInterval) { clearInterval(state.watchInterval); state.watchInterval = null; }
if (state.ytPlayer && state.ytPlayer.destroy) { try { state.ytPlayer.destroy(); } catch(e){} state.ytPlayer = null; }
// UI reset
if (g.adsSection) g.adsSection.style.display = 'none';
if (g.videoSection) g.videoSection.style.display = 'none';
if (g.videoWrapper) g.videoWrapper.style.display = 'none';
if (g.progressBarWrapper) g.progressBarWrapper.classList.add('hidden');
if (g.countdownEl) g.countdownEl.textContent = String(REQUIRED_SECONDS);
if (g.proceedBtn) { g.proceedBtn.disabled = true; g.proceedBtn.classList.remove('active'); }
if (g.chooseAds) { g.chooseAds.disabled = false; g.chooseAds.classList.remove('disabled'); }
if (g.chooseVideo) { g.chooseVideo.disabled = false; g.chooseVideo.classList.remove('disabled'); }
g.adBtns.forEach(b => { b.classList.remove('viewed'); b.disabled = false; });
if (g.muteBtn) g.muteBtn.classList.add('hidden');
if (g.progressBar) g.progressBar.style.width = '0%';
}

/* open gate for a given collection link */
function openGateForLink(link) {
const g = gate();
resetGate();
state.targetLink = link;
if (g.modal) { g.modal.classList.add('active'); g.modal.setAttribute('aria-hidden','false'); }
document.body.style.overflow = 'hidden';
if (g.chooseAds) g.chooseAds.focus();
}

/* close gate */
function closeGate() {
const g = gate();
if (g.modal) { g.modal.classList.remove('active'); g.modal.setAttribute('aria-hidden','true'); }
document.body.style.overflow = '';
if (state.watchInterval) { clearInterval(state.watchInterval); state.watchInterval = null; }
if (state.ytPlayer && state.ytPlayer.destroy) { try { state.ytPlayer.destroy(); } catch(e){} state.ytPlayer = null; }
state.chosenMethod = null;
state.adsViewed = 0;
state.targetLink = null;
state.watchSeconds = 0;
}

/* unlock proceed */
function unlockProceed() {
const g = gate();
if (!g.proceedBtn) return;
g.proceedBtn.disabled = false;
g.proceedBtn.classList.add('active');
console.log('Gate unlocked: proceed enabled');
}

/* ========== Scroll Arrows & Row behavior ========== */
function setupRowScrolling() {
$$('.collections').forEach(row => {
const left = row.querySelector('.left-arrow');
const right = row.querySelector('.right-arrow');
const container = row.querySelector('.collections-container');
if (!container) return;
const scrollDistance = Math.max(240, Math.round(container.clientWidth * 0.6));

left?.addEventListener('click', () => {
container.scrollBy({ left: -scrollDistance, behavior: 'smooth' });
});
right?.addEventListener('click', () => {
container.scrollBy({ left: scrollDistance, behavior: 'smooth' });
});

// Keep swipe/drag enabled — do not prevent touchmove
// Desktop dragging support (optional): enable pointer dragging
let isDown = false, startX = 0, startScroll = 0;
container.addEventListener('mousedown', (e) => {
isDown = true;
container.classList.add('dragging');
startX = e.pageX - container.offsetLeft;
startScroll = container.scrollLeft;
});
container.addEventListener('mouseleave', () => { isDown = false; container.classList.remove('dragging'); });
container.addEventListener('mouseup', () => { isDown = false; container.classList.remove('dragging'); });
container.addEventListener('mousemove', (e) => {
if (!isDown) return;
e.preventDefault();
const x = e.pageX - container.offsetLeft;
const walk = (x - startX);
container.scrollLeft = startScroll - walk;
});
});
}

/* ========== Gate logic wiring ========== */
function setupGateLogic() {
const g = gate();

// open gate when a collection-tab clicked
document.addEventListener('click', (ev) => {
const tab = ev.target.closest('.collection-tab');
if (!tab) return;
ev.preventDefault();
const link = tab.dataset?.link || tab.getAttribute('data-link');
if (!link) return;
openGateForLink(link);
});

// close
g.closeBtn?.addEventListener('click', closeGate);
g.modal?.addEventListener('click', (e) => { if (e.target === g.modal) closeGate(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeGate(); });

// choose ads
g.chooseAds?.addEventListener('click', () => {
if (state.chosenMethod) return;
state.chosenMethod = 'ads';
g.adsSection.style.display = 'block';
g.chooseVideo.disabled = true; g.chooseVideo.classList.add('disabled');
});

// choose video
g.chooseVideo?.addEventListener('click', async () => {
if (state.chosenMethod) return;
state.chosenMethod = 'video';
g.videoSection.style.display = 'block';
g.chooseAds.disabled = true; g.chooseAds.classList.add('disabled');

// preload YT API
try {
await loadYouTubeApi();
} catch (err) {
console.warn('YT API failed to load:', err);
}

// create a placeholder player only when user explicitly clicks Play (handled below)
// show Play button by auto creating the player here with autoplay attempt
createAndPlayRandomVideo();
});

// ad buttons
g.adBtns.forEach(btn => {
btn.addEventListener('click', () => {
const url = btn.dataset?.url || '#';
window.open(url, '_blank', 'noopener');
if (!btn.classList.contains('viewed')) {
btn.classList.add('viewed');
btn.disabled = true;
state.adsViewed++;
console.log('Ad viewed, total:', state.adsViewed);
if (state.adsViewed >= 3) unlockProceed();
}
});
});

// proceed
g.proceedBtn?.addEventListener('click', () => {
if (g.proceedBtn.disabled) return;
if (!state.targetLink) return;
window.open(state.targetLink, '_blank', 'noopener');
closeGate();
});

// keyboard proceed when enabled
document.addEventListener('keydown', (ev) => {
if (!g.modal || !g.modal.classList.contains('active')) return;
if ((ev.key === 'Enter' || ev.key === ' ') && g.proceedBtn && !g.proceedBtn.disabled) {
g.proceedBtn.click();
}
});
}

/* ========== YouTube player creation + controls ========== */
async function createAndPlayRandomVideo() {
const g = gate();
// ensure placeholder cleared
g.placeholder.innerHTML = '';
g.videoWrapper.style.display = 'block';
g.muteBtn.classList.add('hidden');

// pick random ID
const vid = gateVideos[Math.floor(Math.random() * gateVideos.length)];
console.log('Selected gate video ID:', vid);

// Create YT player
if (!(window.YT && typeof window.YT.Player === 'function')) {
// If API didn't load for some reason, inject and wait
try {
await loadYouTubeApi();
} catch (err) {
console.warn('YT API load failed (fallback embed will be used):', err);
// fallback to direct embed iframe (may not allow programmatic state detection)
g.placeholder.innerHTML = `<iframe width="100%" height="260" src="https://www.youtube.com/embed/${vid}?rel=0&playsinline=1&autoplay=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
g.progressBarWrapper.classList.remove('hidden');
startFallbackProgress(); // start best-effort timer (since we can't detect PLAY)
return;
}
}

// create player instance bound to placeholder
state.ytPlayer = new YT.Player(g.placeholder, {
height: '260',
width: '100%',
videoId: vid,
playerVars: {
autoplay: 1,
rel: 0,
playsinline: 1,
modestbranding: 1
},
events: {
onReady: (ev) => {
console.log('YT ready, attempting play');
try { ev.target.playVideo(); } catch (e) { console.warn('play attempt failed', e); }
// show mute toggle (default set to muted for autoplay reliability)
try { ev.target.mute(); } catch(e) {}
if (g.muteBtn) {
g.muteBtn.classList.remove('hidden');
g.muteBtn.textContent = 'Mute: ON';
}
},
onStateChange: (e) => {
console.log('YT state change:', e.data);
// PLAYING = 1, PAUSED = 2, ENDED = 0, BUFFERING = 3, UNSTARTED = -1
if (e.data === YT.PlayerState.PLAYING) {
console.log('Playback started: counting real seconds');
startWatchCounting();
} else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.BUFFERING) {
console.log('Playback paused/buffering: pausing count');
pauseWatchCounting();
} else if (e.data === YT.PlayerState.ENDED) {
console.log('Video ended');
// if user already accumulated required seconds, unlock
if (state.watchSeconds >= REQUIRED_SECONDS) unlockProceed();
pauseWatchCounting();
}
}
}
});

// mute toggle
const gMute = g.muteBtn;
if (gMute) {
gMute.classList.remove('hidden');
gMute.addEventListener('click', () => {
if (!state.ytPlayer) return;
try {
if (state.ytPlayer.isMuted()) {
state.ytPlayer.unMute();
gMute.textContent = 'Mute: OFF';
console.log('User unmuted video');
} else {
state.ytPlayer.mute();
gMute.textContent = 'Mute: ON';
console.log('User muted video');
}
} catch (err) { console.warn('Mute toggle error', err); }
});
}
}

/* start counting only while video actually plays */
function startWatchCounting() {
const g = gate();
if (state.watchInterval) return; // already counting
state.watchInterval = setInterval(() => {
state.watchSeconds++;
const remaining = Math.max(0, REQUIRED_SECONDS - state.watchSeconds);
if (g.countdownEl) g.countdownEl.textContent = String(remaining);
if (g.progressBar) g.progressBar.style.width = ((state.watchSeconds / REQUIRED_SECONDS) * 100) + '%';
console.log('Watched seconds:', state.watchSeconds);
if (state.watchSeconds >= REQUIRED_SECONDS) {
clearInterval(state.watchInterval);
state.watchInterval = null;
unlockProceed();
}
}, 1000);
}

/* pause counting */
function pauseWatchCounting() {
if (state.watchInterval) {
clearInterval(state.watchInterval);
state.watchInterval = null;
}
}

/* fallback if API not available — best-effort countdown */
function startFallbackProgress() {
const g = gate();
if (state.watchInterval) return;
let elapsed = 0;
g.progressBarWrapper.classList.remove('hidden');
state.watchInterval = setInterval(() => {
elapsed++;
state.watchSeconds = elapsed;
const remaining = Math.max(0, REQUIRED_SECONDS - elapsed);
if (g.countdownEl) g.countdownEl.textContent = String(remaining);
if (g.progressBar) g.progressBar.style.width = ((elapsed / REQUIRED_SECONDS) * 100) + '%';
console.log('Fallback watched seconds (est):', elapsed);
if (elapsed >= REQUIRED_SECONDS) {
clearInterval(state.watchInterval);
state.watchInterval = null;
unlockProceed();
}
}, 1000);
}

/* ========== Init on DOM ready ========== */
document.addEventListener('DOMContentLoaded', () => {
setupRowScrolling();
setupGateLogic();

// ensure arrows visibility rule: hover shows arrows on desktop; media query handles mobile always-on
// no extra JS needed for arrow visibility
});

document.addEventListener("DOMContentLoaded", () => {
const nsfwBtn = document.getElementById("open-nsfw");
const ageModal = document.getElementById("ageModal");
const confirmAge = document.getElementById("confirmAge");
const denyAge = document.getElementById("denyAge");

// When clicking NSFW -> open modal
nsfwBtn.addEventListener("click", () => {
ageModal.style.display = "flex";
});

// Confirm age -> go to Lustsphere
confirmAge.addEventListener("click", () => {
window.location.href = "LustSphere.html";
});

// Cancel -> close modal
denyAge.addEventListener("click", () => {
ageModal.style.display = "none";
});
});

function goToPage(page) {
window.location.href = page;
}

document.addEventListener("DOMContentLoaded", () => {
const currentFile = window.location.pathname.split("/").pop();

// Map your pages
const pages = [
"Melimtx.html", 
"Melimtx2.html", 
];

const currentIndex = pages.indexOf(currentFile);
const currentPageNumber = currentIndex + 1;

// Highlight active page number
document.querySelectorAll(".page-number").forEach(btn => {
if (parseInt(btn.dataset.page) === currentPageNumber) {
btn.classList.add("active");
}
});

// Set page text
document.querySelector(".current-page").textContent =
`Page ${currentPageNumber}`;

// Set Prev button
document.getElementById("prevPage").onclick = () => {
if (currentIndex > 0) goToPage(pages[currentIndex - 1]);
};

// Set Next button
document.getElementById("nextPage").onclick = () => {
if (currentIndex < pages.length - 1) goToPage(pages[currentIndex + 1]);
};
});

