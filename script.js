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
  telegramJoined: false,
  targetLink: null,
  ytPlayer: null,
  watchSeconds: 0,
  watchInterval: null
};

/* ================= YOUTUBE API ================= */
function loadYouTubeApi() {
  return new Promise(resolve => {
    if (window.YT && YT.Player) return resolve();
    window.onYouTubeIframeAPIReady = resolve;
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
}

/* ================= RESET GATE ================= */
function resetGate() {
  const g = gate();

  state.chosenMethod = null;
  state.adsViewed = 0;
  state.telegramJoined = false;
  state.watchSeconds = 0;

  clearInterval(state.watchInterval);
  state.watchInterval = null;

  if (state.ytPlayer) {
    try { state.ytPlayer.destroy(); } catch {}
    state.ytPlayer = null;
  }

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

  if (g.telegramBtn) {
    g.telegramBtn.classList.remove("viewed");
    g.telegramBtn.disabled = false;
  }
}

/* ================= OPEN / CLOSE ================= */
function openGateForLink(link) {
  resetGate();
  state.targetLink = link;
  gate().modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeGate() {
  gate().modal.classList.remove("active");
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
  if (state.watchInterval) return;

  const g = gate();
  state.watchInterval = setInterval(() => {
    state.watchSeconds++;
    const remaining = Math.max(0, REQUIRED_SECONDS - state.watchSeconds);

    g.countdownEl.textContent = remaining;
    g.progressBar.style.width =
      Math.min(100, (state.watchSeconds / REQUIRED_SECONDS) * 100) + "%";

    if (state.watchSeconds >= REQUIRED_SECONDS) {
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
          g.progressBarWrapper.classList.remove("hidden");
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
      try { state.ytPlayer.playVideo(); } catch {}
    },
    { once: true }
  );
}

/* ================= GATE LOGIC ================= */
function setupGateLogic() {
  const g = gate();

  document.addEventListener("click", e => {
    const tab = e.target.closest(".collection-tab");
    if (tab && tab.id === "open-nsfw") return;
    if (!tab || !tab.dataset.link) return;

    e.preventDefault();
    openGateForLink(tab.dataset.link);
  });

  g.closeBtn?.addEventListener("click", closeGate);

  g.modal?.addEventListener("click", e => {
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
        if (state.adsViewed >= REQUIRED_ADS && state.telegramJoined) {
          unlockProceed();
        }
      }
    });
  });

  if (g.telegramBtn) {
    g.telegramBtn.addEventListener("click", () => {
      window.open(g.telegramBtn.dataset.url, "_blank", "noopener");
      state.telegramJoined = true;
      g.telegramBtn.classList.add("viewed");
      g.telegramBtn.disabled = true;

      if (state.adsViewed >= REQUIRED_ADS) {
        unlockProceed();
      }
    });
  }

  g.proceedBtn?.addEventListener("click", () => {
    if (!g.proceedBtn.disabled && state.targetLink) {
      const link = state.targetLink;
      window.open(link, "_blank", "noopener");
      setTimeout(closeGate, 50);
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
});
