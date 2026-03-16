/* ================= HELPERS ================= */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $all = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* =======================================================
   MODAL MANAGER
======================================================= */

function openModal(modal){

  if(!modal) return;

  modal.classList.add("active");

  document.body.style.overflow = "hidden";

}

function closeModal(modal){

  if(!modal) return;

  modal.classList.remove("active");

  document.body.style.overflow = "";

}

/* =======================================================
   HORIZONTAL SCROLL
======================================================= */

function setupHorizontalScroll(){

const rows = document.querySelectorAll(".collection-row");

rows.forEach(row => {

const container = row.querySelector(".collections-container");
const leftArrow = row.querySelector(".left-arrow");
const rightArrow = row.querySelector(".right-arrow");

if(!container || !leftArrow || !rightArrow) return;

const scrollAmount = 600;

rightArrow.addEventListener("click", () => {

container.scrollBy({
left:scrollAmount,
behavior:"smooth"
});

});

leftArrow.addEventListener("click", () => {

container.scrollBy({
left:-scrollAmount,
behavior:"smooth"
});

});

});

}

/* =======================================================
   AGE CONFIRMATION
======================================================= */

function setupAgeConfirmation(){

const ageModal = $("#ageModal");
const ageConfirm = $("#ageConfirm");
const ageDecline = $("#ageDecline");
const openBtn = $("#open-nsfw");

if(!ageModal || !openBtn) return;

openBtn.addEventListener("click",(e)=>{

e.preventDefault();
openModal(ageModal);

});

ageConfirm?.addEventListener("click",()=>{

closeModal(ageModal);
window.location.href = "LustSphere.html";

});

ageDecline?.addEventListener("click",()=>{

closeModal(ageModal);

});

}

/* =======================================================
   FOOTER INFO MODAL
======================================================= */

function setupFooterModals(){

const infoModal = $("#infoModal");
const infoTitle = $("#infoTitle");
const infoText = $("#infoText");
const infoClose = $("#infoClose");

if (!infoModal) return;

const content = {

about:{
title:"About LinkSphere",
text:`<p>LinkSphere is a curated link directory designed to cut through the noise.We organize quality online content into streamlined, accessible collections so users can discover what they're looking for quickly and efficiently.</p>`
},

privacy:{
title:"Privacy Policy",
text:`
<p>LinkSphere respects your privacy.</p>

<h3>1. Information We Collect</h3>
<p>We may collect non-personal data such as browser type and anonymous usage statistics.</p>

<h3>2. Cookies</h3>
<p>We may use basic cookies for site functionality and analytics.</p>

<h3>3. Third-Party Links</h3>
<p>We are not responsible for external site privacy practices.</p>

<h3>4. Data Security</h3>
<p>We take reasonable measures to protect site integrity.</p>
`
},

terms:{
title:"Terms & Conditions",
text:`
<p>By accessing <strong>LinkSphere</strong>, you agree to the following terms:</p>

<h3>1. Use of Site</h3>
<p>LinkSphere is a curated directory. We do not host third-party content. 
Users are responsible for complying with local laws when accessing external links.</p>

<h3>2. Age Restrictions</h3>
<p>Some categories may contain adult-oriented material. 
You must be 18 years or older to access such sections.</p>

<h3>3. External Content Disclaimer</h3>
<p>We do not control or endorse third-party websites listed on this platform.</p>

<h3>4. Intellectual Property</h3>
<p>All branding, layout design, and original materials on LinkSphere are protected.</p>

<h3>5. Limitation of Liability</h3>
<p>LinkSphere is provided “as is”.</p>
`
},

contact:{
title:"Contact",
text:`<p>Reach us at linksph3r3@gmail.com</p>`
}

};

$all(".info-links a").forEach(link=>{

link.addEventListener("click",(e)=>{

e.preventDefault();

const key = link.dataset.modal;
if(!content[key]) return;

infoTitle.textContent = content[key].title;
infoText.innerHTML = content[key].text;

openModal(infoModal);

});

});

infoClose?.addEventListener("click",()=>{

closeModal(infoModal);

});

infoModal.addEventListener("click",(e)=>{

if(e.target===infoModal){

closeModal(infoModal);

}

});

}

/* =======================================================
   YOUTUBE AD GATE
======================================================= */

const REQUIRED_SECONDS = 30;
const RING_CIRCUMFERENCE = 251;

const gateVideos = [
"iYQNU54cM_8",
"8xUX3D_GxBQ",
"qRYmz6k3bR8"
];

let unlockTarget = null;
let player;
let watchSeconds = 0;
let watchTimer;
let lastTime = 0;
let pauseTimer;

function openAdGate(link){

const modal = document.getElementById("adgate-modal");
const ytGate = document.getElementById("youtube-gate");

unlockTarget = link;

/* SHOW VIDEO CONTAINER FIRST */
ytGate.style.display = "block";

openModal(modal);

/* load youtube player */
loadYouTubeGate();

watchSeconds = 0;
lastTime = 0;

clearInterval(watchTimer);

}

function loadYouTubeGate(){

if(player){
player.destroy();
}

const container = document.getElementById("youtube-gate");

const videoID =
gateVideos[Math.floor(Math.random()*gateVideos.length)];

container.innerHTML = `<div id="yt-player"></div>`;

player = new YT.Player("yt-player",{

height:"220",
width:"100%",
videoId:videoID,

playerVars:{
controls:1,
disablekb:1,
rel:0,
autoplay:1,
mute:1,
modestbranding:1
},

events:{
onStateChange:onPlayerStateChange,
onReady:onPlayerReady
}

});

}

let skipCheck;

function onPlayerReady(event){

clearInterval(skipCheck);
skipCheck = setInterval(checkSkip,1000);

/* Force autoplay */
player.mute();           // required for autoplay in browsers
player.playVideo();      // start playback immediately

setTimeout(()=>{
player.unMute();
},3000);

}

function checkSkip(){

if(!player || !player.getCurrentTime) return;

const currentTime = player.getCurrentTime();

if(currentTime > lastTime + 2){

player.seekTo(lastTime);

}

lastTime = currentTime;

}

function onPlayerStateChange(event){

if(event.data === YT.PlayerState.PLAYING){

clearTimeout(pauseTimer);
startWatchTimer();

}

if(event.data === YT.PlayerState.PAUSED){

clearInterval(watchTimer);

pauseTimer = setTimeout(()=>{

resetGate();

},5000);

}

if(event.data === YT.PlayerState.ENDED){

clearInterval(watchTimer);

}

}

function startWatchTimer(){

const ring = document.querySelector(".ring-progress");
const timeDisplay = document.querySelector(".ring-time");
const progress = document.getElementById("gate-progress");

clearInterval(watchTimer);

watchTimer = setInterval(()=>{

watchSeconds++;

progress.textContent =
`Watch time: ${watchSeconds} / ${REQUIRED_SECONDS}`;

timeDisplay.textContent =
REQUIRED_SECONDS - watchSeconds;

const percent = watchSeconds / REQUIRED_SECONDS;

const offset =
RING_CIRCUMFERENCE * (1 - percent);

ring.style.strokeDashoffset = offset;

if(watchSeconds >= REQUIRED_SECONDS){

clearInterval(watchTimer);

unlockContent();

}

if(watchSeconds >= 30){

clearInterval(watchTimer);

const btn = document.getElementById("proceed-btn");

btn.disabled = false;
btn.classList.add("enabled");

}

},1000);

}

function resetGate(){

watchSeconds = 0;

const ring = document.querySelector(".ring-progress");
const timeDisplay = document.querySelector(".ring-time");

ring.style.strokeDashoffset = RING_CIRCUMFERENCE;

timeDisplay.textContent = REQUIRED_SECONDS;

}

function unlockContent(){

const modal = document.getElementById("adgate-modal");

closeModal(modal);

if(unlockTarget){

window.open(unlockTarget,"_blank");

}

}

document.getElementById("proceed-btn").addEventListener("click",function(){

if(unlockTarget){
window.location.href = unlockTarget;
}

});

/* =======================================================
   INIT
======================================================= */

document.addEventListener("DOMContentLoaded",()=>{

setupHorizontalScroll();
setupAgeConfirmation();
setupFooterModals();

/* category preview */

const tabs = document.querySelectorAll(".category-tab");
const preview = document.getElementById("previewImage");

tabs.forEach(tab=>{

tab.addEventListener("mouseenter",()=>{

const img = tab.dataset.preview;

if(!preview) return;

preview.src = img;
preview.classList.add("active");

});

tab.addEventListener("click",(e)=>{

const img = tab.dataset.preview;

if(preview && preview.src!==img){

e.preventDefault();

preview.src = img;
preview.classList.add("active");

}

});

});

/* collection click → ad gate */

document.querySelectorAll(".collection-tab").forEach(tab=>{

tab.addEventListener("click",()=>{

const link = tab.dataset.link;

if(!link) return;

const ring = document.querySelector(".ring-progress");
const timeDisplay = document.querySelector(".ring-time");

if(ring){
ring.style.strokeDashoffset = RING_CIRCUMFERENCE;
}

if(timeDisplay){
timeDisplay.textContent = REQUIRED_SECONDS;
}

openAdGate(link);

});

});

/* modal close button */

document.querySelectorAll(".modal-close").forEach(btn=>{

btn.addEventListener("click",()=>{

const modal = btn.closest(".modal-overlay, .modal");

closeModal(modal);

clearInterval(watchTimer);

if(player){
player.pauseVideo();
}

});

});

/* click outside modal */

document.addEventListener("click",(e)=>{

if(e.target.classList.contains("modal-overlay") ||
e.target.classList.contains("modal")){

closeModal(e.target);

}

});

});