/* =======================================================
   LINKSPHERE — CORE SCRIPT (CLEAN + STABLE)
   ======================================================= */

/* ================= CONFIG ================= */

const CONFIG = {
  REQUIRED_SECONDS: 30,
  REQUIRED_ADS: 3,
  GATE_VIDEOS: [
    "iYQNU54cM_8",
    "8xUX3D_GxBQ",
    "qRYmz6k3bR8"
  ]
};

/* ================= HELPERS ================= */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* =======================================================
   HORIZONTAL SCROLL
   ======================================================= */

function setupHorizontalScroll() {

  const rows = document.querySelectorAll(".collection-row");

  rows.forEach(row => {

    const container = row.querySelector(".collections-container");
    const leftArrow = row.querySelector(".left-arrow");
    const rightArrow = row.querySelector(".right-arrow");

    if(!container || !leftArrow || !rightArrow) return;

    const scrollAmount = 600;

    rightArrow.addEventListener("click", () => {
      container.scrollBy({
        left: scrollAmount,
        behavior: "smooth"
      });
    });

    leftArrow.addEventListener("click", () => {
      container.scrollBy({
        left: -scrollAmount,
        behavior: "smooth"
      });
    });

    container.addEventListener("scroll", () => {

      if(container.scrollLeft <= 0){
        leftArrow.style.opacity = "0.3";
      } else {
        leftArrow.style.opacity = "1";
      }

      if(container.scrollLeft + container.clientWidth >= container.scrollWidth){
        rightArrow.style.opacity = "0.3";
      } else {
        rightArrow.style.opacity = "1";
      }

    });

  });

}

/* =======================================================
   AGE CONFIRMATION
   ======================================================= */

function setupAgeConfirmation() {

  const ageModal = $("#ageModal");
  const ageConfirm = $("#ageConfirm");
  const ageDecline = $("#ageDecline");
  const openBtn = $("#open-nsfw");

  if (!ageModal || !openBtn) return;

  openBtn.addEventListener("click", (e) => {
    e.preventDefault();
    ageModal.style.display = "flex";
    document.body.style.overflow = "hidden";
  });

  ageConfirm?.addEventListener("click", () => {
    document.body.style.overflow = "";
    window.location.href = "LustSphere.html";
  });

  ageDecline?.addEventListener("click", () => {
    ageModal.style.display = "none";
    document.body.style.overflow = "";
  });

}

/* =======================================================
   FOOTER MODALS
   ======================================================= */

function setupFooterModals() {

  const infoModal = $("#infoModal");
  const infoTitle = $("#infoTitle");
  const infoText = $("#infoText");
  const infoClose = $("#infoClose");

  if (!infoModal) return;

  const content = {

    about:{
      title:"About LinkSphere",
      text:`<p>LinkSphere is a curated link directory designed to cut through the noise. We organize quality online content into streamlined, accessible collections.</p>`
    },

    privacy:{
      title:"Privacy Policy",
      text:`
      <p>LinkSphere respects your privacy.</p>

      <h3>1. Information We Collect</h3>
      <p>We may collect anonymous usage statistics.</p>

      <h3>2. Cookies</h3>
      <p>Basic cookies may be used for site functionality.</p>

      <h3>3. Third-Party Links</h3>
      <p>We are not responsible for external site privacy policies.</p>

      <h3>4. Data Security</h3>
      <p>Reasonable security measures are implemented.</p>
      `
    },

    terms:{
      title:"Terms & Conditions",
      text:`
      <p>By accessing LinkSphere you agree to the following:</p>

      <h3>1. Use of Site</h3>
      <p>LinkSphere is a curated directory and does not host third-party content.</p>

      <h3>2. Age Restrictions</h3>
      <p>Some categories contain adult content and require users to be 18+.</p>

      <h3>3. External Content</h3>
      <p>We do not control third-party sites linked on this platform.</p>

      <h3>4. Intellectual Property</h3>
      <p>All original design and branding belong to LinkSphere.</p>

      <h3>5. Liability</h3>
      <p>LinkSphere is provided “as is” without warranties.</p>
      `
    },

    contact:{
      title:"Contact",
      text:`<p>linksph3r3@gmail.com</p>`
    }

  };

  $$(".info-links a").forEach(link=>{

    link.addEventListener("click",(e)=>{

      e.preventDefault();

      const key = link.dataset.modal;

      if(!content[key]) return;

      infoTitle.textContent = content[key].title;
      infoText.innerHTML = content[key].text;

      infoModal.style.display="flex";
      document.body.style.overflow="hidden";

    });

  });

  infoClose?.addEventListener("click",()=>{

    infoModal.style.display="none";
    document.body.style.overflow="";

  });

}

/* =======================================================
   COLLECTION TABS
   ======================================================= */

function setupCollections(){

  document.querySelectorAll(".collection-tab").forEach(tab=>{

    const img = tab.querySelector("img");

    if(img){

      tab.style.backgroundImage=`url(${img.src})`;
      tab.style.backgroundSize="cover";
      tab.style.backgroundPosition="center";

      img.remove();

    }

    tab.addEventListener("click",()=>{

      const link = tab.dataset.link;

      if(link){
        openAdGate(link);
      }

    });

  });

}

/* =======================================================
   ADGATE
   ======================================================= */

function openAdGate(link){

  const gate = document.getElementById("adGate");

  if(!gate) return;

  gate.style.display="flex";
  gate.dataset.target=link;

}

/* =======================================================
   PAGINATION
   ======================================================= */

function goToPage(url){
  window.location.href=url;
}

/* =======================================================
   INIT
   ======================================================= */

document.addEventListener("DOMContentLoaded",()=>{

  setupHorizontalScroll();
  setupAgeConfirmation();
  setupFooterModals();
  setupCollections();

});