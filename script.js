/* ================= CONFIG ================= */
const REQUIRED_SECONDS = 30;
const REQUIRED_ADS = 3;

const gateVideos = [
  "iYQNU54cM_8",
  "8xUX3D_GxBQ",
  "qRYmz6k3bR8"
];

/* ================= HELPERS ================= */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* ================= HORIZONTAL SCROLL ================= */
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

/* ================= GATE ELEMENTS ================= */
function gate() {
  return {
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
  };
}

/* ================= STATE ================= */
let state = {
  chosenMethod: null,
  adsViewed: 0,
  targetLink: null,
  ytPlayer: null,
  watchInterval: null
};

/* ================= YOUTUBE API ================= */
function loadYouTubeApi() {
  return new Promise(resolve => {
    if (window.YT && window.YT.Player) return resolve();

    window.onYouTubeIframeAPIReady = resolve;

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  });
}

/* ================= RESET GATE ================= */
function resetGate() {
  const g = gate();
  if (!g.modal) return;

  state = {
    chosenMethod: null,
    adsViewed: 0,
    targetLink: null,
    ytPlayer: null,
    watchInterval: null
  };

  g.adsSection.style.display = "none";
  g.videoSection.style.display = "none";
  g.videoWrapper.style.display = "none";

  g.progressBarWrapper.classList.add("hidden");
  g.progressBar.style.width = "0%";
  g.countdownEl.textContent = REQUIRED_SECONDS;

  g.proceedBtn.disabled = true;
  g.proceedBtn.classList.remove("active");

  g.chooseAds.disabled = false;
  g.chooseVideo.disabled = false;

  g.adBtns.forEach(b => {
    b.classList.remove("viewed");
    b.disabled = false;
  });
}

/* ================= OPEN / CLOSE ================= */
function openGateForLink(link) {
  const g = gate();
  if (!g.modal) return;

  resetGate();
  state.targetLink = link;

  g.modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeGate() {
  const g = gate();
  if (!g.modal) return;

  g.modal.classList.remove("active");
  document.body.style.overflow = "";
  resetGate();
}

/* ================= UNLOCK ================= */
function unlockProceed() {
  const g = gate();
  g.proceedBtn.disabled = false;
  g.proceedBtn.classList.add("active");
}

/* ================= WATCH TIMER ================= */
function startWatchCounting() {
  const g = gate();
  const start = Date.now();

  state.watchInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const remaining = Math.max(0, REQUIRED_SECONDS - elapsed);

    g.countdownEl.textContent = remaining;
    g.progressBar.style.width =
      Math.min(100, (elapsed / REQUIRED_SECONDS) * 100) + "%";

    if (elapsed >= REQUIRED_SECONDS) {
      clearInterval(state.watchInterval);
      unlockProceed();
    }
  }, 1000);
}

/* ================= VIDEO ================= */
async function createGateVideo() {
  const g = gate();
  g.videoWrapper.style.display = "block";

  await loadYouTubeApi();

  const vid = gateVideos[Math.floor(Math.random() * gateVideos.length)];

  state.ytPlayer = new YT.Player(g.placeholder, {
    height: "260",
    width: "100%",
    videoId: vid,
    playerVars: { rel: 0, playsinline: 1 },
    events: {
      onStateChange: e => {
        if (e.data === YT.PlayerState.PLAYING) {
          g.progressBarWrapper.classList.remove("hidden");
          startWatchCounting();
        }
      }
    }
  });
}

/* ================= GATE LOGIC ================= */
function setupGateLogic() {
  const g = gate();
  if (!g.modal) return;

  /* COLLECTION PAGE TABS */
  document.body.addEventListener("click", e => {
    const tab = e.target.closest(".collection-tab");
    if (!tab || !tab.dataset.link) return;

    e.preventDefault();
    openGateForLink(tab.dataset.link);
  });

  /* CATEGORY PAGE TABS */
  document.body.addEventListener("click", e => {
    const tab = e.target.closest(".collections-wrapper .category-tab");
    if (!tab || !tab.getAttribute("href")) return;

    e.preventDefault();
    openGateForLink(tab.getAttribute("href"));
  });

  g.closeBtn.addEventListener("click", closeGate);

  g.modal.addEventListener("click", e => {
    if (e.target === g.modal) closeGate();
  });

  g.chooseAds.addEventListener("click", () => {
    if (state.chosenMethod) return;
    state.chosenMethod = "ads";
    g.adsSection.style.display = "block";
    g.chooseVideo.disabled = true;
  });

  g.chooseVideo.addEventListener("click", async () => {
    if (state.chosenMethod) return;
    state.chosenMethod = "video";
    g.videoSection.style.display = "block";
    g.chooseAds.disabled = true;
    await createGateVideo();
  });

  g.adBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      window.open(btn.dataset.url, "_blank", "noopener");

      if (!btn.classList.contains("viewed")) {
        btn.classList.add("viewed");
        btn.disabled = true;
        state.adsViewed++;

        if (state.adsViewed >= REQUIRED_ADS) unlockProceed();
      }
    });
  });

  g.proceedBtn.addEventListener("click", () => {
    if (!g.proceedBtn.disabled && state.targetLink) {
      window.open(state.targetLink, "_blank", "noopener");
      closeGate();
    }
  });
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  setupHorizontalScroll();
  setupGateLogic();

  /* ================= AGE CONFIRMATION ================= */

const ageModal = document.getElementById("ageModal");
const ageConfirm = document.getElementById("ageConfirm");
const ageDecline = document.getElementById("ageDecline");

let pendingCategoryLink = null;

// Intercept category tab clicks on homepage
document.body.addEventListener("click", e => {
  const tab = e.target.closest(".index-page .category-tab");
  if (!tab) return;

  e.preventDefault();

  pendingCategoryLink = tab.getAttribute("href");
  ageModal.classList.add("active");
  document.body.style.overflow = "hidden";
});

ageConfirm.addEventListener("click", () => {
  ageModal.classList.remove("active");
  document.body.style.overflow = "";

  if (pendingCategoryLink) {
    window.location.href = pendingCategoryLink;
  }
});

ageDecline.addEventListener("click", () => {
  ageModal.classList.remove("active");
  document.body.style.overflow = "";
});
})