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
    watchSeconds: 0,
    watchInterval: null
  };

  g.adsSection && (g.adsSection.style.display = "none");
  g.videoSection && (g.videoSection.style.display = "none");
  g.videoWrapper && (g.videoWrapper.style.display = "none");

  if (g.progressBarWrapper) g.progressBarWrapper.classList.add("hidden");
  if (g.progressBar) g.progressBar.style.width = "0%";
  if (g.countdownEl) g.countdownEl.textContent = REQUIRED_SECONDS;

  g.proceedBtn && (g.proceedBtn.disabled = true);
  g.proceedBtn && g.proceedBtn.classList.remove("active");

  g.chooseAds && (g.chooseAds.disabled = false);
  g.chooseVideo && (g.chooseVideo.disabled = false);

  g.adBtns.forEach(b => {
    b.classList.remove("viewed");
    b.disabled = false;
  });

  g.telegramBtn && g.telegramBtn.classList.remove("viewed");
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

/* ================= VIDEO ================= */
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
    playerVars: { rel: 0, playsinline: 1, modestbranding: 1 },
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
}

/* ================= GATE LOGIC ================= */
function setupGateLogic() {
  const g = gate();
  if (!g.modal) return;

  document.body.addEventListener("click", e => {
    const tab = e.target.closest(".collections-wrapper .category-tab");
    if (!tab || !tab.getAttribute("href")) return;
    if (tab.id === "open-nsfw") return;

    e.preventDefault();
    openGateForLink(tab.getAttribute("href"));
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

  g.proceedBtn?.addEventListener("click", () => {
    if (!g.proceedBtn.disabled && state.targetLink) {
      window.open(state.targetLink, "_blank", "noopener");
      closeGate();
    }
  });
}


/* ================= NOTICE BOARD + NEW BADGE ================= */
function setupNoticeBoard() {
  const noticeList = document.getElementById("noticeList");
  if (!noticeList) return;

  const snapshotKey = "lustSphereSnapshot_v1";

  const collectionLinks = Array.from(
    document.querySelectorAll(".collections-wrapper .category-tab")
  );

  const currentCollections = collectionLinks.map(el => ({
    id: el.dataset.id || el.textContent.trim(),
    name: el.textContent.trim()
  }));

  const storedData = JSON.parse(localStorage.getItem(snapshotKey));
  let notices = [];
  let newIds = [];

  if (storedData && storedData.collections) {
    const storedIds = storedData.collections.map(c => c.id);

    currentCollections.forEach(col => {
      if (!storedIds.includes(col.id)) {
        notices.push(`New Collection Added: ${col.name}`);
        newIds.push(col.id);
      }
    });
  }

  localStorage.setItem(snapshotKey, JSON.stringify({
    collections: currentCollections
  }));

  collectionLinks.forEach(link => {
    const id = link.dataset.id || link.textContent.trim();
    if (newIds.includes(id)) {
      link.classList.add("new-badge");
    }
  });

  noticeList.innerHTML =
    notices.length === 0
      ? "<li>No recent updates.</li>"
      : notices.map(n => `<li>${n}</li>`).join("");
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  setupGateLogic();
  setupNoticeBoard();
});