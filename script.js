/* script.js
All page scripts consolidated here (Option A).
- Handles adult warning modal (all pages)
- Handles index/adult-site modal(s)
- Handles Melimtx interactions: page switching, scroll arrows, click-to-open ad gate, ad-gate unlock logic (3 ads or 30s YouTube)
- Uses YouTube Iframe API to track time watched (30s requirement)
*/

/* ======= Utility helpers ======= */
function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $all(sel, ctx = document) { return Array.from((ctx || document).querySelectorAll(sel)); }

function onReady(fn) {
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
else fn();
}

/* ======= Adult warning modal (shared) ======= */
onReady(() => {
const modal = document.getElementById('adultWarningModal');
const contBtn = document.getElementById('adult-warning-continue');

if (!modal) return;

const KEY = 'adultAcknowledged_v1';

function openModal() {
modal.classList.add('active');
modal.setAttribute('aria-hidden', 'false');
// trap focus simply: focus the button
contBtn?.focus();
document.body.style.overflow = 'hidden';
}
function closeModal() {
modal.classList.remove('active');
modal.setAttribute('aria-hidden', 'true');
document.body.style.overflow = '';
}

const acknowledged = localStorage.getItem(KEY);
if (!acknowledged) {
openModal();
}

contBtn?.addEventListener('click', () => {
localStorage.setItem(KEY, '1');
closeModal();
});
});

/* ======= Index page - adult confirmation modal (index.html only) ======= */
onReady(() => {
const adultBtn = document.querySelector('#index-adult-modal .ad-btn, .btn.adult-btn');
// There is specific index modal with id "index-adult-modal"
const modal = document.getElementById('index-adult-modal');
const proceedBtn = document.getElementById('index-adult-proceed');
const cancelBtns = modal ? modal.querySelectorAll('.modal-close') : [];
let storedHref = '';
let lastFocusedEl = null;

if (!modal) return;

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

// attach to all adult buttons on index pointing to adult page
const adultBtns = document.querySelectorAll('a.btn.adult-btn[href]');
adultBtns.forEach(btn => {
btn.addEventListener('click', function (e) {
// Only scope to index page's modal: if the modal exists, prevent default and open
e.preventDefault();
openModal(this.getAttribute('href'));
});
});

proceedBtn?.addEventListener('click', function () {
if (!storedHref) return closeModal();
// navigate
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

/* ======= Melimtx page logic (collections, page switching, ad gate) ======= */
onReady(() => {
if (!document.body.classList.contains('melimtx-page')) return;

/* Elements */
const pageButtons = $all('.page-controls .page-btn');
const containers = $all('.collections-container');
const leftArrows = $all('.collections .left-arrow');
const rightArrows = $all('.collections .right-arrow');

/* Gate elements */
const gateModal = document.getElementById('gateModal');
const closeGate = document.getElementById('closeGate');
const adButtons = $all('.ad-btn');
const playAdVideoBtn = document.getElementById('playAdVideo');
const videoWrapper = document.querySelector('.ad-video-wrapper');
const adIframe = document.getElementById('adgateYoutube');
const proceedBtn = document.getElementById('proceed-btn');

let currentTargetLink = null;
let unlockState = { adsViewed: 0, totalAds: 0, videoUnlocked: false, videoPlayTime: 0, unlocked: false };
let ytPlayer = null;
let ytTimerInterval = null;
const REQUIRED_SECONDS = 30; // user requested 30 seconds watched

/* Utility for opening and closing gate modal */
function openGateForLink(link) {
if (!gateModal) {
// fallback: direct open
window.open(link, '_blank', 'noopener');
return;
}
currentTargetLink = link;
unlockState = { adsViewed: 0, totalAds: 0, videoUnlocked: false, videoPlayTime: 0, unlocked: false };
proceedBtn.disabled = true;
proceedBtn.classList.remove('active');
proceedBtn.setAttribute('aria-disabled', 'true');
// mark ad buttons unviewed
adButtons.forEach(btn => btn.classList.remove('viewed'));
adButtons.forEach(btn => btn.removeAttribute('data-viewed'));
// hide iframe until user opts for video
if (videoWrapper) videoWrapper.style.display = 'none';
if (adIframe) adIframe.setAttribute('src', '');
// set totalAds
unlockState.totalAds = adButtons.length;
gateModal.classList.add('active');
gateModal.setAttribute('aria-hidden', 'false');
document.body.style.overflow = 'hidden';
// focus first interactive element
if (adButtons[0]) adButtons[0].focus();
}

function closeGate() {
gateModal.classList.remove('active');
gateModal.setAttribute('aria-hidden', 'true');
document.body.style.overflow = '';
// reset state
if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
try { ytPlayer.stopVideo(); } catch (e) {}
}
if (ytTimerInterval) {
clearInterval(ytTimerInterval);
ytTimerInterval = null;
}
unlockState.videoPlayTime = 0;
unlockState.adsViewed = 0;
adButtons.forEach(btn => btn.classList.remove('viewed'));
proceedBtn.disabled = true;
proceedBtn.classList.remove('active');
proceedBtn.setAttribute('aria-disabled', 'true');
currentTargetLink = null;
}

closeGate?.addEventListener('click', closeGate);
gateModal?.addEventListener('click', function(e) {
if (e.target === gateModal) closeGate();
});
document.addEventListener('keydown', function(e){
if (e.key === 'Escape' && gateModal.classList.contains('active')) closeGate();
});

/* Bind collection items: open gate modal on click; Right-click still allowed to copy link by context menu (no overlay anchor here) */
const collectionTabs = $all('.collection-tab');
collectionTabs.forEach(tab => {
// click
tab.addEventListener('click', function (e) {
const link = this.dataset.link;
if (!link) return;
// open gate
openGateForLink(link);
});
// keyboard support: Enter or Space opens
tab.addEventListener('keydown', function (e) {
if (e.key === 'Enter' || e.key === ' ') {
e.preventDefault();
const link = this.dataset.link;
if (!link) return;
openGateForLink(link);
}
});
});

/* Ad buttons: open externally in new tab and mark viewed */
adButtons.forEach(btn => {
btn.addEventListener('click', function (e) {
const url = this.dataset.url;
if (!url) return;
// open in new tab
window.open(url, '_blank', 'noopener');
// mark as viewed
this.classList.add('viewed');
this.setAttribute('data-viewed', '1');
// update state and check unlock
const viewedCount = adButtons.filter(b => b.getAttribute('data-viewed') === '1').length;
unlockState.adsViewed = viewedCount;
checkIfUnlocked();
});
});

/* Play video flow (YouTube) */
function showVideoPlayer() {
if (!videoWrapper || !adIframe) return;
videoWrapper.style.display = 'block';
// set the iframe src to an embeddable video (replace with your chosen ad video id or keep a generic one)
// IMPORTANT: Use a video you have rights to or a public promotional video; here we embed a YT clip placeholder id.
const videoId = adIframe.dataset.videoId || 'dQw4w9WgXcQ'; // replace with your preferred video id if you want
// Use the IFrame API's onYouTubeIframeAPIReady to build a player. For now, set src to a normal embed and let API attach later.
adIframe.setAttribute('src', `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&playsinline=1`);
// After src set, the YT API will create the player if available (onYouTubeIframeAPIReady handles it)
}

playAdVideoBtn?.addEventListener('click', () => {
showVideoPlayer();
// focus iframe (so keyboard users can tab into)
adIframe.focus();
});

/* Proceed button: opens target link in new tab when unlocked */
proceedBtn?.addEventListener('click', function () {
if (!currentTargetLink) return;
if (!this.classList.contains('active')) return;
window.open(currentTargetLink, '_blank', 'noopener');
// close the gate and reset
closeGate();
});

/* checks whether either ads requirement or video requirement satisfied */
function checkIfUnlocked() {
if (unlockState.unlocked) return true;
// If user watched >= REQUIRED_SECONDS
if (unlockState.videoUnlocked || (unlockState.videoPlayTime >= REQUIRED_SECONDS)) {
unlockState.unlocked = true;
}
// If user clicked/viewed all ads
if (unlockState.totalAds > 0 && unlockState.adsViewed >= unlockState.totalAds) {
unlockState.unlocked = true;
}
if (unlockState.unlocked) {
proceedBtn.disabled = false;
proceedBtn.classList.add('active');
proceedBtn.setAttribute('aria-disabled', 'false');
proceedBtn.innerText = 'Proceed to collection';
return true;
} else {
proceedBtn.disabled = true;
proceedBtn.classList.remove('active');
proceedBtn.setAttribute('aria-disabled', 'true');
proceedBtn.innerText = 'Choose an option';
return false;
}
}

/* ======= YouTube IFrame API integration ======= */
// global callback for YT API
window.onYouTubeIframeAPIReady = function() {
const frame = document.getElementById('adgateYoutube');
if (!frame) return;
try {
ytPlayer = new YT.Player('adgateYoutube', {
events: {
onStateChange: onPlayerStateChange,
onReady: onPlayerReady
}
});
} catch (err) {
// API might not be available yet or cross-origin. We'll still keep embed src and use timers fallback.
console.warn('YT Player creation failed:', err);
}
};

function onPlayerReady(event) {
// nothing automatic; user needs to click play
}

function onPlayerStateChange(e) {
// YT player state constants: 1 = playing, 2 = paused, 0 = ended
const state = e.data;
if (state === YT?.PlayerState?.PLAYING || state === 1) {
// start timer
if (ytTimerInterval) clearInterval(ytTimerInterval);
ytTimerInterval = setInterval(() => {
unlockState.videoPlayTime += 1;
// Keep UI updated (optional)
// If hit required seconds, mark unlocked
if (unlockState.videoPlayTime >= REQUIRED_SECONDS) {
unlockState.videoUnlocked = true;
checkIfUnlocked();
clearInterval(ytTimerInterval);
ytTimerInterval = null;
}
}, 1000);
} else if (state === YT?.PlayerState?.PAUSED || state === 2) {
// stop timer
if (ytTimerInterval) {
clearInterval(ytTimerInterval);
ytTimerInterval = null;
}
} else if (state === YT?.PlayerState?.ENDED || state === 0) {
// ended - consider fully watched (also covered by timer)
unlockState.videoUnlocked = true;
checkIfUnlocked();
if (ytTimerInterval) {
clearInterval(ytTimerInterval);
ytTimerInterval = null;
}
}
}

/* Fallback: if YT API not available, try to detect playback by polling iframe's 'src' (limited) */
// Not implemented beyond API integration because cross-origin prevents accurate time detection without the API.

/* ======= Scroll arrows behavior (works per section) ======= */
function wireArrowsForSection(section) {
const left = section.querySelector('.left-arrow');
const right = section.querySelector('.right-arrow');
const container = section.querySelector('.collections-container');

if (!container) return;

// amount to scroll: container width * 0.8
function scrollAmount(dir) {
const amount = Math.max(container.clientWidth * 0.8, 300);
container.scrollBy({ left: dir * amount, behavior: 'smooth' });
}

left?.addEventListener('click', () => scrollAmount(-1));
right?.addEventListener('click', () => scrollAmount(1));
// keyboard support
left?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollAmount(-1); }});
right?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollAmount(1); }});
}

const sections = document.querySelectorAll('section.collections');
sections.forEach(sec => wireArrowsForSection(sec));

/* ======= Page switching controls (bottom center) ======= */
pageButtons.forEach(btn => {
btn.addEventListener('click', function () {
const page = this.dataset.targetPage;
if (!page) return;
// Set active button
pageButtons.forEach(b => { b.classList.toggle('active', b === this); b.setAttribute('aria-pressed', b === this ? 'true' : 'false'); });
// Hide all containers then show the one(s) matching page
containers.forEach(c => {
// determine page from class name "page-1" or via data attribute inside items
if (c.classList.contains(`page-${page}`)) {
c.classList.remove('hidden');
c.setAttribute('aria-hidden', 'false');
} else {
c.classList.add('hidden');
c.setAttribute('aria-hidden', 'true');
}
});
// scroll first visible container to start
const visible = containers.find(c => !c.classList.contains('hidden'));
if (visible) visible.scrollTo({ left: 0, behavior: 'smooth' });
});
});

// ensure initial visible container: show page-1 container (already by markup), hide others
containers.forEach(c => {
if (c.classList.contains('page-1')) {
c.classList.remove('hidden');
c.setAttribute('aria-hidden', 'false');
} else {
c.classList.add('hidden');
c.setAttribute('aria-hidden', 'true');
}
});

});




