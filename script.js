/* script.js
Consolidated JS for all pages (Part 2 of 4).
- Option A: all JS in one file
- Requires: <script src="https://www.youtube.com/iframe_api"></script> loaded on pages that need video gating
*/

/* ===== Helpers ===== */
function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $all(sel, ctx = document) { return Array.from((ctx || document).querySelectorAll(sel)); }
function onReady(fn) {
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
else fn();
}

/* ===== Adult Warning Modal (shared across pages) ===== */
onReady(() => {
const modal = document.getElementById('adultWarningModal');
const contBtn = document.getElementById('adult-warning-continue');
if (!modal) return;

const KEY = 'linksphere_adult_ack_v1';

function openModal() {
modal.classList.add('active');
modal.setAttribute('aria-hidden', 'false');
contBtn?.focus();
document.body.style.overflow = 'hidden';
}
function closeModal() {
modal.classList.remove('active');
modal.setAttribute('aria-hidden', 'true');
document.body.style.overflow = '';
}

const acknowledged = localStorage.getItem(KEY);
if (!acknowledged) openModal();

contBtn?.addEventListener('click', () => {
localStorage.setItem(KEY, '1');
closeModal();
});
});

/* ===== Index-page adult confirmation modal (index.html only) ===== */
onReady(() => {
const modal = document.getElementById('index-adult-modal');
if (!modal) return;

const proceedBtn = document.getElementById('index-adult-proceed');
const cancelBtns = modal.querySelectorAll('.modal-close');
let storedHref = '';
let lastFocusedEl = null;

function openModal(href) {
storedHref = href;
lastFocusedEl = document.activeElement;
modal.classList.add('active');
modal.setAttribute('aria-hidden', 'false');
proceedBtn?.focus();
document.body.style.overflow = 'hidden';
}
function closeModal() {
modal.classList.remove('active');
modal.setAttribute('aria-hidden', 'true');
document.body.style.overflow = '';
if (lastFocusedEl) lastFocusedEl.focus();
}

// attach behaviour to adult links on index page that point to adult-content
const adultBtns = document.querySelectorAll('a.btn.adult-btn[href]');
adultBtns.forEach(btn => {
const href = btn.getAttribute('href');
// Limit to links going to adult-content.html to avoid interfering with other pages
if (!href || !href.includes('adult-content')) return;
btn.addEventListener('click', function (e) {
e.preventDefault();
openModal(href);
});
});

proceedBtn?.addEventListener('click', function () {
if (!storedHref) return closeModal();
window.location.href = storedHref;
});

cancelBtns.forEach(btn => btn.addEventListener('click', () => closeModal()));

modal.addEventListener('click', function (e) {
if (e.target === modal) closeModal();
});

document.addEventListener('keydown', function (e) {
if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
});
});

/* ===== Melimtx page logic (collections + gate + pagination + arrows) ===== */
onReady(() => {
// Only run on pages marked as melimtx-page
if (!document.body.classList.contains('melimtx-page')) {
return;
}

/* Config */
const REQUIRED_SECONDS = 30; // require 30 seconds watched to unlock
const GATE_VIDEO_ID_FALLBACK = 'dQw4w9WgXcQ'; // replace with your desired default
const PAGE_BASE_NAME = 'Melimtx'; // base filename: Melimtx.html -> page1, Melimtx2.html -> page2

/* Utility to parse current page number from filename */
function getCurrentMelimtxPageNumber() {
const path = (location.pathname || '').split('/').pop() || '';
const match = path.match(new RegExp(`^${PAGE_BASE_NAME}(\\d*)\\.html$`, 'i'));
if (!match) return 1; // fallback if not match
// match[1] empty means Melimtx.html -> page 1
return match[1] ? parseInt(match[1], 10) : 1;
}

const currentPageNumber = getCurrentMelimtxPageNumber();

/* Create Prev / Next page nav at bottom of main content */
function createPrevNextNav() {
const main = document.querySelector('main');
if (!main) return;

const navWrap = document.createElement('div');
navWrap.className = 'page-nav';
navWrap.setAttribute('aria-label', 'Page navigation');

// previous button
const prevBtn = document.createElement('a');
prevBtn.className = 'nav-btn';
prevBtn.textContent = '← Previous';
prevBtn.href = currentPageNumber > 1
? (currentPageNumber === 2 ? `${PAGE_BASE_NAME}.html` : `${PAGE_BASE_NAME}${currentPageNumber - 1}.html`)
: '#';
if (currentPageNumber === 1) {
prevBtn.setAttribute('aria-disabled', 'true');
prevBtn.style.opacity = '0.45';
prevBtn.addEventListener('click', e => e.preventDefault());
}

// page label
const pageLabel = document.createElement('div');
pageLabel.textContent = `Page ${currentPageNumber}`;
pageLabel.style.color = '#fff';
pageLabel.style.fontWeight = '700';
pageLabel.style.display = 'inline-flex';
pageLabel.style.alignItems = 'center';
pageLabel.style.gap = '10px';

// next button
const nextBtn = document.createElement('a');
nextBtn.className = 'nav-btn primary';
nextBtn.textContent = 'Next Page →';
// next page filename: Melimtx2.html for page 2, Melimtx3.html for page 3, etc.
const nextPageNum = currentPageNumber + 1;
nextBtn.href = nextPageNum === 1 ? `${PAGE_BASE_NAME}.html` : `${PAGE_BASE_NAME}${nextPageNum}.html`;

navWrap.appendChild(prevBtn);
navWrap.appendChild(pageLabel);
navWrap.appendChild(nextBtn);

main.appendChild(navWrap);
}

createPrevNextNav();

/* Elements used by gate */
const gateModal = document.getElementById('gateModal');
const closeGateBtn = document.getElementById('closeGate');
const adButtons = $all('.ad-btn');
const playAdVideoBtn = document.getElementById('playAdVideo');
const videoWrapper = document.querySelector('.ad-video-wrapper');
const adIframe = document.getElementById('adgateYoutube');
const proceedBtn = document.getElementById('proceed-btn');

let currentTargetLink = null;
let unlockState = { adsViewed: 0, totalAds: 0, videoPlayTime: 0, videoUnlocked: false, unlocked: false };
let ytPlayer = null;
let ytTimerInterval = null;
let ytApiAttached = false;

/* Gate open/close logic */
function openGateForLink(link) {
if (!gateModal) {
// fallback: open directly if gate missing
window.open(link, '_blank', 'noopener');
return;
}
currentTargetLink = link;
unlockState = { adsViewed: 0, totalAds: 0, videoPlayTime: 0, videoUnlocked: false, unlocked: false };
// reset UI
if (proceedBtn) {
proceedBtn.disabled = true;
proceedBtn.classList.remove('active');
proceedBtn.setAttribute('aria-disabled', 'true');
proceedBtn.innerText = 'Choose an option';
}
adButtons.forEach(b => { b.classList.remove('viewed'); b.removeAttribute('data-viewed'); });
if (videoWrapper) videoWrapper.style.display = 'none';
if (adIframe) adIframe.setAttribute('src', '');
unlockState.totalAds = adButtons.length;
gateModal.classList.add('active');
gateModal.setAttribute('aria-hidden', 'false');
document.body.style.overflow = 'hidden';
// focus first interactive control
if (adButtons && adButtons[0]) adButtons[0].focus();
}

function closeGate() {
gateModal.classList.remove('active');
gateModal.setAttribute('aria-hidden', 'true');
document.body.style.overflow = '';
// cleanup YT player/timers
if (ytPlayer && typeof ytPlayer.stopVideo === 'function') {
try { ytPlayer.stopVideo(); } catch (err) {}
}
if (ytTimerInterval) { clearInterval(ytTimerInterval); ytTimerInterval = null; }
unlockState.videoPlayTime = 0;
unlockState.adsViewed = 0;
adButtons.forEach(btn => btn.classList.remove('viewed'));
if (proceedBtn) {
proceedBtn.disabled = true;
proceedBtn.classList.remove('active');
proceedBtn.setAttribute('aria-disabled', 'true');
proceedBtn.innerText = 'Choose an option';
}
currentTargetLink = null;
}

closeGateBtn?.addEventListener('click', closeGate);
gateModal?.addEventListener('click', function (e) {
if (e.target === gateModal) closeGate();
});
document.addEventListener('keydown', function (e) {
if (e.key === 'Escape' && gateModal.classList.contains('active')) closeGate();
});

/* Hook collection tabs: click opens gate */
const collectionTabs = $all('.collection-tab');
collectionTabs.forEach(tab => {
tab.addEventListener('click', function (e) {
const link = this.dataset.link;
if (!link) return;
openGateForLink(link);
});
tab.addEventListener('keydown', function (e) {
if (e.key === 'Enter' || e.key === ' ') {
e.preventDefault();
const link = this.dataset.link;
if (!link) return;
openGateForLink(link);
}
});
});

/* Ad buttons logic - open ad link in new tab and mark viewed */
adButtons.forEach(btn => {
btn.addEventListener('click', function () {
const url = this.dataset.url;
if (!url) return;
window.open(url, '_blank', 'noopener');
this.classList.add('viewed');
this.setAttribute('data-viewed', '1');
const viewedCount = adButtons.filter(b => b.getAttribute('data-viewed') === '1').length;
unlockState.adsViewed = viewedCount;
checkIfUnlocked();
});
});

/* Play video flow - sets iframe src and shows player area */
function showVideoPlayer() {
if (!videoWrapper || !adIframe) return;
videoWrapper.style.display = 'block';
const vid = adIframe.dataset.videoId || GATE_VIDEO_ID_FALLBACK;
// set iframe src to embed with enablejsapi=1 so we can use YT API
adIframe.setAttribute('src', `https://www.youtube.com/embed/${vid}?enablejsapi=1&rel=0&playsinline=1`);
// attach YT API if available; the global onYouTubeIframeAPIReady callback will create the player
// but we may need to attempt create if API already loaded
tryAttachYTPlayer();
}

playAdVideoBtn?.addEventListener('click', function () {
showVideoPlayer();
// focus iframe for keyboard users
adIframe && adIframe.focus();
});

/* Proceed button - opens the collection when unlocked */
proceedBtn?.addEventListener('click', function () {
if (!currentTargetLink) return;
if (!proceedBtn.classList.contains('active')) return;
window.open(currentTargetLink, '_blank', 'noopener');
closeGate();
});

function checkIfUnlocked() {
if (unlockState.unlocked) return true;
if (unlockState.videoUnlocked || (unlockState.videoPlayTime >= REQUIRED_SECONDS)) {
unlockState.unlocked = true;
}
if (unlockState.totalAds > 0 && unlockState.adsViewed >= unlockState.totalAds) {
unlockState.unlocked = true;
}
if (unlockState.unlocked) {
if (proceedBtn) {
proceedBtn.disabled = false;
proceedBtn.classList.add('active');
proceedBtn.setAttribute('aria-disabled', 'false');
proceedBtn.innerText = 'Proceed to collection';
}
return true;
} else {
if (proceedBtn) {
proceedBtn.disabled = true;
proceedBtn.classList.remove('active');
proceedBtn.setAttribute('aria-disabled', 'true');
proceedBtn.innerText = 'Choose an option';
}
return false;
}
}

/* ===== YouTube IFrame API Integration ===== */
// Called by YouTube API when it's ready
window.onYouTubeIframeAPIReady = function () {
// Only create a player if the gate iframe exists and its src includes enablejsapi=1
const frame = document.getElementById('adgateYoutube');
if (!frame) return;
// Avoid creating multiple players
if (ytApiAttached) return;
try {
ytPlayer = new YT.Player('adgateYoutube', {
events: {
onReady: function () { /* player ready */ },
onStateChange: onPlayerStateChange
}
});
ytApiAttached = true;
} catch (err) {
// fail gracefully — the iframe embed may still play, but we may not track time precisely
console.warn('YT player attach failed:', err);
}
};

function tryAttachYTPlayer() {
// If API already loaded, attach immediately
if (window.YT && typeof window.YT.Player === 'function' && !ytApiAttached) {
try {
ytPlayer = new YT.Player('adgateYoutube', {
events: { onReady: function () {}, onStateChange: onPlayerStateChange }
});
ytApiAttached = true;
} catch (err) {
// ignore
}
}
// Otherwise, if API not loaded, the global callback (onYouTubeIframeAPIReady) will create the player
}

function onPlayerStateChange(e) {
// YT state: 1 = playing, 2 = paused, 0 = ended
const state = e.data;
if (state === YT?.PlayerState?.PLAYING || state === 1) {
// start timer (1s ticks)
if (ytTimerInterval) clearInterval(ytTimerInterval);
ytTimerInterval = setInterval(() => {
unlockState.videoPlayTime += 1;
if (unlockState.videoPlayTime >= REQUIRED_SECONDS) {
unlockState.videoUnlocked = true;
checkIfUnlocked();
clearInterval(ytTimerInterval);
ytTimerInterval = null;
}
}, 1000);
} else if (state === YT?.PlayerState?.PAUSED || state === 2) {
if (ytTimerInterval) {
clearInterval(ytTimerInterval);
ytTimerInterval = null;
}
} else if (state === YT?.PlayerState?.ENDED || state === 0) {
unlockState.videoUnlocked = true;
checkIfUnlocked();
if (ytTimerInterval) { clearInterval(ytTimerInterval); ytTimerInterval = null; }
}
}

/* Note: If API can't be used due to cross-origin, timer fallback is limited. The implementation above
is the recommended approach for reliable play-time tracking. */

/* ===== Scroll arrows wiring (per collections section) ===== */
function wireArrowsForSection(section) {
const left = section.querySelector('.left-arrow');
const right = section.querySelector('.right-arrow');
const container = section.querySelector('.collections-container');
if (!container) return;

function scrollAmount(dir) {
const amount = Math.max(container.clientWidth * 0.8, 300);
container.scrollBy({ left: dir * amount, behavior: 'smooth' });
}

left?.addEventListener('click', () => scrollAmount(-1));
right?.addEventListener('click', () => scrollAmount(1));
// keyboard support
left?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollAmount(-1); } });
right?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollAmount(1); } });
}

const collectionSections = document.querySelectorAll('section.collections');
collectionSections.forEach(sec => wireArrowsForSection(sec));

/* ===== Page-controls handling (if present on the page, toggles containers) ===== */
const pageButtons = $all('.page-controls .page-btn');
const containers = $all('.collections-container');

if (pageButtons.length && containers.length) {
pageButtons.forEach(btn => {
btn.addEventListener('click', function () {
const targetPage = this.dataset.targetPage;
if (!targetPage) return;
pageButtons.forEach(b => {
const active = b === this;
b.classList.toggle('active', active);
b.setAttribute('aria-pressed', active ? 'true' : 'false');
});
containers.forEach(c => {
if (c.classList.contains(`page-${targetPage}`)) {
c.classList.remove('hidden');
c.setAttribute('aria-hidden', 'false');
c.scrollTo({ left: 0, behavior: 'smooth' });
} else {
c.classList.add('hidden');
c.setAttribute('aria-hidden', 'true');
}
});
});
});
// initial state: show page-1, hide others
containers.forEach(c => {
if (c.classList.contains('page-1')) { c.classList.remove('hidden'); c.setAttribute('aria-hidden', 'false'); }
else { c.classList.add('hidden'); c.setAttribute('aria-hidden', 'true'); }
});
}

/* ===== Accessibility: ensure keyboard focus stays inside gate modal when open (basic trap) ===== */
document.addEventListener('focus', function (ev) {
if (!gateModal || !gateModal.classList.contains('active')) return;
// if focus is outside the modal, bring it back to the modal
if (!gateModal.contains(ev.target)) {
// focus first interactive element
const first = gateModal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
if (first) first.focus();
}
}, true);

/* End of melimtx logic */
});

* Your original script.js content remains unchanged above this line */
/* --------------------------------------------------------------- */
/* NEW — Age Verification (Homepage Only) */

document.getElementById("open-nsfw")?.addEventListener("click", () => {
document.getElementById("ageModal").style.display = "flex";
});

document.getElementById("confirmAge")?.addEventListener("click", () => {
localStorage.setItem("ageVerified", "true");
window.location.href = "LustSphere.html";
});

document.getElementById("denyAge")?.addEventListener("click", () => {
document.getElementById("ageModal").style.display = "none";
});


