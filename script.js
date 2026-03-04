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
      text: "LinkSphere provides curated collections with zero noise."
    },
    privacy: {
      title: "Privacy Policy",
      text: "We respect your privacy and do not sell user data."
    },
    terms: {
      title: "Terms of Service",
      text: "Use of this site constitutes acceptance of our terms."
    },
    contact: {
      title: "Contact",
      text: "Reach us at support@linksphere.com"
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