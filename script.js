/* =======================================================
   LINKSPHERE — CORE SCRIPT (Scalable Architecture)
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
   GATE MODULE
   ======================================================= */

const Gate = (() => {

  let state = {
    chosenMethod: null,
    adsViewed: 0,
    targetLink: null,
    ytPlayer: null,
    watchInterval: null
  };

  const elements = () => ({
    modal: $("#adGate"),
    proceedBtn: $("#gateProceed"),
    closeBtn: $("#gateClose"),
    chooseAds: $("#chooseAds"),
    chooseVideo: $("#chooseVideo"),
    adsSection: $("#adsSection"),
    videoSection: $("#videoSection"),
    adBtns: $$(".ad-btn"),
    videoWrapper: $("#gateVideoWrapper"),
    placeholder: $("#gateVideoPlaceholder"),
    progressBarWrapper: $("#progressBarWrapper"),
    progressBar: $("#progressBar"),
    countdownEl: $("#countdown")
  });

  /* ---------- YOUTUBE API ---------- */

  function loadYouTubeApi() {
    return new Promise(resolve => {
      if (window.YT?.Player) return resolve();

      window.onYouTubeIframeAPIReady = resolve;

      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const s = document.createElement("script");
        s.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(s);
      }
    });
  }

  /* ---------- RESET ---------- */

  function reset() {
    const g = elements();
    if (!g.modal) return;

    if (state.watchInterval) {
      clearInterval(state.watchInterval);
    }

    if (state.ytPlayer?.destroy) {
      state.ytPlayer.destroy();
    }

    state = {
      chosenMethod: null,
      adsViewed: 0,
      targetLink: null,
      ytPlayer: null,
      watchInterval: null
    };

    g.adsSection?.style.setProperty("display", "none");
    g.videoSection?.style.setProperty("display", "none");
    g.videoWrapper?.style.setProperty("display", "none");

    if (g.progressBar) g.progressBar.style.width = "0%";
    if (g.progressBarWrapper) g.progressBarWrapper.classList.add("hidden");
    if (g.countdownEl) g.countdownEl.textContent = CONFIG.REQUIRED_SECONDS;

    g.proceedBtn?.classList.remove("active");
    if (g.proceedBtn) g.proceedBtn.disabled = true;

    g.chooseAds && (g.chooseAds.disabled = false);
    g.chooseVideo && (g.chooseVideo.disabled = false);

    g.adBtns.forEach(btn => {
      btn.classList.remove("viewed");
      btn.disabled = false;
    });
  }

  /* ---------- OPEN / CLOSE ---------- */

  function open(link) {
    const g = elements();
    if (!g.modal) return;

    reset();
    state.targetLink = link;

    g.modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function close() {
    const g = elements();
    if (!g.modal) return;

    g.modal.classList.remove("active");
    document.body.style.overflow = "";
    reset();
  }

  /* ---------- UNLOCK ---------- */

  function unlock() {
    const g = elements();
    if (!g.proceedBtn) return;

    g.proceedBtn.disabled = false;
    g.proceedBtn.classList.add("active");
  }

  /* ---------- WATCH TIMER ---------- */

  function startWatchTimer() {
    const g = elements();
    const start = Date.now();

    state.watchInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const remaining = Math.max(0, CONFIG.REQUIRED_SECONDS - elapsed);

      if (g.countdownEl) g.countdownEl.textContent = remaining;
      if (g.progressBar) {
        g.progressBar.style.width =
          Math.min(100, (elapsed / CONFIG.REQUIRED_SECONDS) * 100) + "%";
      }

      if (elapsed >= CONFIG.REQUIRED_SECONDS) {
        clearInterval(state.watchInterval);
        unlock();
      }
    }, 1000);
  }

  /* ---------- VIDEO ---------- */

  async function createVideo() {
    const g = elements();
    if (!g.videoWrapper || !g.placeholder) return;

    g.videoWrapper.style.display = "block";

    await loadYouTubeApi();

    const vid =
      CONFIG.GATE_VIDEOS[Math.floor(Math.random() * CONFIG.GATE_VIDEOS.length)];

    state.ytPlayer = new YT.Player(g.placeholder, {
      height: "260",
      width: "100%",
      videoId: vid,
      playerVars: { rel: 0, playsinline: 1 },
      events: {
        onStateChange: e => {
          if (e.data === YT.PlayerState.PLAYING) {
            g.progressBarWrapper?.classList.remove("hidden");
            startWatchTimer();
          }
        }
      }
    });
  }

  /* ---------- INIT ---------- */

  function init() {
    const g = elements();
    if (!g.modal) return;

    /* Global click delegation */
    document.body.addEventListener("click", e => {

      const collectionTab = e.target.closest(".collection-tab");
      if (collectionTab?.dataset.link) {
        e.preventDefault();
        open(collectionTab.dataset.link);
        return;
      }

      const categoryTab = e.target.closest(".collections-wrapper .category-tab");
      if (categoryTab?.getAttribute("href")) {
        e.preventDefault();
        open(categoryTab.getAttribute("href"));
      }
    });

    g.closeBtn?.addEventListener("click", close);

    g.modal.addEventListener("click", e => {
      if (e.target === g.modal) close();
    });

    g.chooseAds?.addEventListener("click", () => {
      if (state.chosenMethod) return;
      state.chosenMethod = "ads";
      g.adsSection.style.display = "block";
      g.chooseVideo.disabled = true;
    });

    g.chooseVideo?.addEventListener("click", async () => {
      if (state.chosenMethod) return;
      state.chosenMethod = "video";
      g.videoSection.style.display = "block";
      g.chooseAds.disabled = true;
      await createVideo();
    });

    g.adBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        window.open(btn.dataset.url, "_blank", "noopener");

        if (!btn.classList.contains("viewed")) {
          btn.classList.add("viewed");
          btn.disabled = true;
          state.adsViewed++;

          if (state.adsViewed >= CONFIG.REQUIRED_ADS) {
            unlock();
          }
        }
      });
    });

    g.proceedBtn?.addEventListener("click", () => {
      if (!g.proceedBtn.disabled && state.targetLink) {
        window.open(state.targetLink, "_blank", "noopener");
        close();
      }
    });
  }

  return { init };

})();

/* =======================================================
   AGE CONFIRMATION (Homepage Only)
   ======================================================= */

function setupAgeConfirmation() {

  const ageModal = $("#ageModal");
  const ageConfirm = $("#ageConfirm");
  const ageDecline = $("#ageDecline");

  if (!ageModal) return;

  let pendingLink = null;

  document.body.addEventListener("click", e => {
    const tab = e.target.closest(".index-page .category-tab");
    if (!tab) return;

    e.preventDefault();
    pendingLink = tab.getAttribute("href");

    ageModal.classList.add("active");
    document.body.style.overflow = "hidden";
  });

  ageConfirm?.addEventListener("click", () => {
    ageModal.classList.remove("active");
    document.body.style.overflow = "";

    if (pendingLink) {
      window.location.href = pendingLink;
    }
  });

  ageDecline?.addEventListener("click", () => {
    ageModal.classList.remove("active");
    document.body.style.overflow = "";
  });
}

/* =======================================================
   INIT
   ======================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setupHorizontalScroll();
  Gate.init();
  setupAgeConfirmation();
});