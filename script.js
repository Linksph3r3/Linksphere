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
  $$(".collections").forEach(row => {
    const container = $(".collections-container", row);
    const leftArrow = $(".left-arrow", row);
    const rightArrow = $(".right-arrow", row);

    if (!container || !leftArrow || !rightArrow) return;

    const scrollAmount = 600;

    leftArrow.addEventListener("click", () => {
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    });

    rightArrow.addEventListener("click", () => {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    });
  });
}

/* =======================================================
   AGE CONFIRMATION (Homepage Only)
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
   FOOTER INFO MODAL
   ======================================================= */

function setupFooterModals() {

  const infoModal = $("#infoModal");
  const infoTitle = $("#infoTitle");
  const infoText = $("#infoText");
  const infoClose = $("#infoClose");

  if (!infoModal) return;

  const content = {
    about: {
      title: "About LinkSphere",
      text: `<p>LinkSphere is a curated link directory designed to cut through the noise.We organize quality online content into streamlined, accessible collections so users can discover what they're looking for quickly and efficiently.</p>`
    },
    privacy: {
     title: "Privacy Policy",
     text: `
     

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
    terms: {
      title: "Terms & Conditions",
      text: `
  <p>By accessing <strong>LinkSphere</strong>, you agree to the following terms:</p>

  <h3>1. Use of Site</h3>
  <p>LinkSphere is a curated directory. We do not host third-party content. 
  Users are responsible for complying with local laws when accessing external links.</p>

  <h3>2. Age Restrictions</h3>
  <p>Some categories may contain adult-oriented material. 
  You must be 18 years or older to access such sections.</p>

  <h3>3. External Content Disclaimer</h3>
  <p>We do not control or endorse third-party websites listed on this platform. 
  Accessing external links is done at your own discretion.</p>

  <h3>4. Intellectual Property</h3>
  <p>All branding, layout design, and original materials on LinkSphere 
  are protected and may not be copied without permission.</p>

  <h3>5. Limitation of Liability</h3>
  <p>LinkSphere is provided “as is” without warranties of any kind. 
  We are not liable for damages resulting from use of external links.</p>
  `
    },
    contact: {
      title: "Contact",
      text: `<p>Reach us at linksph3r3@gmail.com</p>`
    }
  };

  $$(".info-links a").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      const key = link.dataset.modal;
      if (!content[key]) return;

      infoTitle.textContent = content[key].title;
      infoText.innerHTML = content[key].text;

      infoModal.style.display = "flex";
      document.body.style.overflow = "hidden";
    });
  });

  infoClose?.addEventListener("click", () => {
    infoModal.style.display = "none";
    document.body.style.overflow = "";
  });

  infoModal.addEventListener("click", (e) => {
    if (e.target === infoModal) {
      infoModal.style.display = "none";
      document.body.style.overflow = "";
    }
  });
}

/* =======================================================
   GATE MODULE (Collections Pages Only)
   ======================================================= */

const Gate = (() => {

  function init() {

    const gateModal = $("#adGate");
    if (!gateModal) return; // Only run on gate pages

    document.body.addEventListener("click", e => {
      const tab = e.target.closest(".collection-tab");
      if (!tab?.dataset.link) return;

      e.preventDefault();
      window.open(tab.dataset.link, "_blank", "noopener");
    });

  }

  return { init };

})();

/* =======================================================
   CATEGORY PREVIEW COVER
   ======================================================= */

   const tabs = document.querySelectorAll(".category-tab");
const preview = document.getElementById("previewImage");

tabs.forEach(tab => {

  // Hover for desktop
  tab.addEventListener("mouseenter", () => {
    const img = tab.dataset.preview;
    preview.src = img;
    preview.classList.add("active");
  });

  // Click for mobile
  tab.addEventListener("click", (e) => {
    const img = tab.dataset.preview;

    if (preview.src !== img) {
      e.preventDefault();
      preview.src = img;
      preview.classList.add("active");
    }
  });

});


/* =======================================================
   INIT
   ======================================================= */

document.addEventListener("DOMContentLoaded", () => {

  setupHorizontalScroll();
  setupAgeConfirmation();
  setupFooterModals();
  Gate.init();

});