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
      text: `LinkSphere is a curated link directory designed to cut through the noise.We organize quality online content into streamlined, accessible collections so users can discover what they're looking for quickly and efficiently.`
    },
    privacy: {
     title: "Privacy Policy",
     text: `
     Last updated: 2026

     LinkSphere respects your privacy.

     1. Information We Collect
     We may collect non-personal data such as browser type and anonymous usage statistics.

     2. Cookies
     We may use basic cookies for site functionality and analytics.

     3. Third-Party Links
     We are not responsible for external site privacy practices.

     4. Data Security
     We take reasonable measures to protect site integrity.
     `
     },
    terms: {
      title: "Terms & Conditions",
      text: `By accessing LinkSphere, you agree to the following terms:

1. Use of Site

LinkSphere is a curated directory.
We do not host third-party content.

Users are responsible for complying with local laws when accessing external links.

2. Age Restrictions

Some categories may contain adult-oriented material.
You must be 18 years or older to access such sections.

3. External Content Disclaimer

We do not control or endorse third-party websites listed on this platform.
Accessing external links is done at your own discretion.

4. Intellectual Property

All branding, layout design, and original materials on LinkSphere are protected and may not be copied without permission.

5. Limitation of Liability

LinkSphere is provided “as is” without warranties of any kind.
We are not liable for damages resulting from use of external links.`
    },
    contact: {
      title: "Contact",
      text: "Reach us at linksph3r3@gmail.com"
    }
  };

  $$(".info-links a").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      const key = link.dataset.modal;
      if (!content[key]) return;

      infoTitle.textContent = content[key].title;
      infoText.textContent = content[key].text;

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
   INIT
   ======================================================= */

document.addEventListener("DOMContentLoaded", () => {

  setupHorizontalScroll();
  setupAgeConfirmation();
  setupFooterModals();
  Gate.init();

});