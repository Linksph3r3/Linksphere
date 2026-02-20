/* ================= CONFIG ================= */
const REQUIRED_SECONDS = 30;
const REQUIRED_ADS = 3; // Ads required to unlock (video is optional alternative)
const gateVideos = [
  "iYQNU54cM_8",
  "8xUX3D_GxBQ",
  "qRYmz6k3bR8"
];

/* ================= HELPERS ================= */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

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
    telegramBtn: $("#joinTelegram"),
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
  watchSeconds: 0,
  watchInterval: null
};

/* ================= YOUTUBE API ================= */
function loadYouTubeApi() {
  return new Promise(resolve => {
    if (window.YT && window.YT.Player) return resolve();

    if (!window.onYouTubeIframeAPIReady) {
      window.onYouTubeIframeAPIReady = resolve;
    }

    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );

    if (!existingScript) {
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

  state.chosenMethod = null;
  state.adsViewed = 0;
  state.watchSeconds = 0;
  state.targetLink = null;

  clearInterval(state.watchInterval);
  state.watchInterval = null;

  if (state.ytPlayer) {
    try { state.ytPlayer.destroy(); } catch {}
    state.ytPlayer = null;
  }

  g.adsSection && (g.adsSection.style.display = "none");
  g.videoSection && (g.videoSection.style.display = "none");
  g.videoWrapper && (g.videoWrapper.style.display = "none");

  if (g.progressBarWrapper) g.progressBarWrapper.classList.add("hidden");
  if (g.progressBar) g.progressBar.style.width = "0%";
  if (g.countdownEl) g.countdownEl.textContent = REQUIRED_SECONDS;

  if (g.proceedBtn) {
    g.proceedBtn.disabled = true;
    g.proceedBtn.classList.remove("active");
  }

  if (g.chooseAds) g.chooseAds.disabled = false;
  if (g.chooseVideo) g.chooseVideo.disabled = false;

  g.adBtns.forEach(b => {
    b.classList.remove("viewed");
    b.disabled = false;
  });

  if (g.telegramBtn) {
    g.telegramBtn.classList.remove("viewed");
    g.telegramBtn.disabled = false;
  }
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
  if (!g.proceedBtn) return;

  g.proceedBtn.disabled = false;
  g.proceedBtn.classList.add("active");
}

/* ================= WATCH TIMER ================= */
function startWatchCounting() {
  if (state.watchInterval) return;

  const g = gate();
  const startTime = Date.now();

  state.watchInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    state.watchSeconds = elapsed;

    const remaining = Math.max(0, REQUIRED_SECONDS - elapsed);

    if (g.countdownEl) g.countdownEl.textContent = remaining;
    if (g.progressBar) {
      g.progressBar.style.width =
        Math.min(100, (elapsed / REQUIRED_SECONDS) * 100) + "%";
    }

    if (elapsed >= REQUIRED_SECONDS) {
      clearInterval(state.watchInterval);
      state.watchInterval = null;
      unlockProceed();
    }
  }, 1000);
}

function pauseWatchCounting() {
  clearInterval(state.watchInterval);
  state.watchInterval = null;
}

/* ================= VIDEO CREATION ================= */
async function createGateVideo() {
  const g = gate();
  if (!g.videoWrapper || !g.placeholder) return;

  g.videoWrapper.style.display = "block";
  g.placeholder.innerHTML = "";

  await loadYouTubeApi();

  const vid = gateVideos[Math.floor(Math.random() * gateVideos.length)];

  state.ytPlayer = new YT.Player(g.placeholder, {
    height: "260",
    width: "100%",
    videoId: vid,
    playerVars: {
      rel: 0,
      playsinline: 1,
      modestbranding: 1
    },
    events: {
      onStateChange: e => {
        if (e.data === YT.PlayerState.PLAYING) {
          g.progressBarWrapper?.classList.remove("hidden");
          startWatchCounting();
        }

        if (
          e.data === YT.PlayerState.PAUSED ||
          e.data === YT.PlayerState.BUFFERING
        ) {
          pauseWatchCounting();
        }
      }
    }
  });

  g.videoWrapper.addEventListener(
    "click",
    () => {
      try { state.ytPlayer?.playVideo(); } catch {}
    },
    { once: true }
  );
}

/* ================= GATE LOGIC ================= */
function setupGateLogic() {
  const g = gate();
  if (!g.modal) return;

  // Scoped click delegation (safer than document-wide)
  document.body.addEventListener("click", e => {
    const tab = e.target.closest(".collection-tab");
    if (!tab || !tab.dataset.link) return;
    if (tab.id === "open-nsfw") return;

    e.preventDefault();
    openGateForLink(tab.dataset.link);
  });

  g.closeBtn?.addEventListener("click", closeGate);

  g.modal.addEventListener("click", e => {
    if (e.target === g.modal) closeGate();
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
    await createGateVideo();
  });

  // ADS UNLOCK
  g.adBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      window.open(btn.dataset.url, "_blank", "noopener");

      if (!btn.classList.contains("viewed")) {
        btn.classList.add("viewed");
        btn.disabled = true;
        state.adsViewed++;

        if (state.adsViewed >= REQUIRED_ADS) {
          unlockProceed();
        }
      }
    });
  });

  // TELEGRAM OPTIONAL
  if (g.telegramBtn) {
    g.telegramBtn.addEventListener("click", () => {
      window.open(g.telegramBtn.dataset.url, "_blank", "noopener");
      g.telegramBtn.classList.add("viewed");
      g.telegramBtn.disabled = true;
    });
  }

  g.proceedBtn?.addEventListener("click", () => {
    if (!g.proceedBtn.disabled && state.targetLink) {
      window.open(state.targetLink, "_blank", "noopener");
      closeGate();
    }
  });
}

/* ================= DIRECT NSFW REDIRECT ================= */
function setupNSFWRedirect() {
  const nsfwBtn = document.getElementById("open-nsfw");
  if (!nsfwBtn) return;

  nsfwBtn.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = "LustSphere.html";
  });
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  setupGateLogic();
  setupNSFWRedirect();
  animateHomepageTitle();
  setupAgeConfirmation();
  setupNoticeBoard();
});

/* ================= AGE CONFIRMATION ================= */
function setupAgeConfirmation() {
  const modal = document.getElementById("ageConfirmModal");
  const confirmBtn = document.getElementById("ageConfirmBtn");
  const cancelBtn = document.getElementById("ageCancelBtn");

  if (!modal) return;

  let pendingLink = null;

  // Intercept category tab clicks
  document.body.addEventListener("click", (e) => {
    const tab = e.target.closest("#open-nsfw");
    if (!tab) return;

    // If already confirmed in this session, allow navigation
    if (sessionStorage.getItem("ageConfirmed") === "true") return;

    e.preventDefault();
    pendingLink = tab.getAttribute("href") || tab.dataset.link;

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  });

  confirmBtn?.addEventListener("click", () => {
    sessionStorage.setItem("ageConfirmed", "true");
    modal.style.display = "none";
    document.body.style.overflow = "";

    if (pendingLink) {
      window.location.href = pendingLink;
    }
  });

  cancelBtn?.addEventListener("click", () => {
    modal.style.display = "none";
    document.body.style.overflow = "";
    pendingLink = null;
  });
}

/* ================= NOTICE BOARD ================= */

function setupNoticeBoard() {
  const noticeList = document.getElementById("noticeList");
  if (!noticeList) return;

  const collectionLinks = Array.from(
    document.querySelectorAll(".collections-wrapper .category-tab")
  );

  const currentCollections = collectionLinks.map(el => ({
    id: el.dataset.id,
    name: el.textContent.trim()
  }));

  const storedData = JSON.parse(localStorage.getItem("lustSphereSnapshot"));
  let notices = [];
  let newIds = [];

  if (storedData) {
    const storedIds = storedData.collections.map(c => c.id);

    currentCollections.forEach(col => {
      if (!storedIds.includes(col.id)) {
        notices.push(`New Collection Added: ${col.name}`);
        newIds.push(col.id);
      }
    });
  }

  // Save snapshot
  localStorage.setItem("lustSphereSnapshot", JSON.stringify({
    collections: currentCollections
  }));

  // Apply NEW badge
  collectionLinks.forEach(link => {
    if (newIds.includes(link.dataset.id)) {
      link.classList.add("new-badge");
    }
  });

  // Render notices
  if (noticeList) {
    if (notices.length === 0) {
      noticeList.innerHTML = "<li>No recent updates.</li>";
    } else {
      noticeList.innerHTML = notices.map(n => `<li>${n}</li>`).join("");
    }
  }
}
