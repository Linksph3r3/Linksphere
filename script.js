/* ==========================================================
      AD-GATE SYSTEM — VERSION A (MATCHES YOUR HTML EXACTLY)
========================================================== */

/* --------------------
    GLOBAL STATE
--------------------- */
let selectedLink = "";
let chosenMethod = null;  // "ads" or "video"
let adViews = [false, false, false];
let ytPlayer = null;
let countdown = 30;
let countdownInterval = null;
let countdownStarted = false;

/* --------------------
    DOM ELEMENTS
--------------------- */
const gateModal = document.getElementById("gateModal");
const proceedBtn = document.getElementById("proceed-btn");
const playAdVideoBtn = document.getElementById("playAdVideo");
const youtubeFrame = document.getElementById("adgateYoutube");
const gateDescription = document.getElementById("gate-description");
const adButtons = document.querySelectorAll(".ad-btn");


/* ==========================================================
      OPEN AD GATE
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".collection-tab");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            selectedLink = tab.dataset.link || "";
            openAdGate();
        });
    });

    // Add an invisible overlay anchor to each collection tab so users can right-click > Copy Link
    tabs.forEach((tab, index) => {
        // Avoid adding twice
        if (tab.querySelector('.collection-link-overlay')) return;

        const overlay = document.createElement('a');
        overlay.className = 'collection-link-overlay';
        // The shareable link is the current page with a collection query param
        const targetUrl = `${window.location.pathname}?collection=${index + 1}`;
        overlay.href = targetUrl;
        overlay.title = `Share Collection ${index + 1}`;
        overlay.setAttribute('aria-label', `Share link for collection ${index + 1}`);

        // Prevent default navigation and open the gate instead on left click
        overlay.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            selectedLink = tab.dataset.link || "";
            // add collection param to URL while keeping the same path
            window.history.pushState({}, '', targetUrl);
            openAdGate();
        });

        // Make sure the overlay doesn't prevent right-click context menu (copy link)
        overlay.addEventListener('contextmenu', (e) => {
            // Allow default context menu, do not stop propagation
        });

        // Prepend overlay so it doesn't conflict visually
        tab.style.position = tab.style.position || 'relative';
        tab.insertBefore(overlay, tab.firstChild);
    });

    // Auto-open if collection passed in URL
    const params = new URLSearchParams(window.location.search);
    const col = params.get("collection");
    if (col) {
        const target = Array.from(tabs).find(t =>
            t.textContent.toLowerCase().includes(`collection ${col}`)
        );
        if (target) {
            selectedLink = target.dataset.link;
            // switch to the target page if it exists
            const targetPage = target.dataset.page;
            if (targetPage) {
                const pc = target.closest('.collections').querySelector('.page-controls');
                if (pc) {
                    const pageButton = pc.querySelector(`.page-btn[data-target-page="${targetPage}"]`);
                    if (pageButton) pageButton.click();
                }
            }
            openAdGate();
        }
    }

    // Page controls for collections pagination (Melimtx only)
    const pageControls = document.querySelectorAll('.page-controls');
    if (pageControls) {
        pageControls.forEach(pc => {
            const container = pc.closest('.collections').querySelector('.collections-container');
            const btns = pc.querySelectorAll('.page-btn');
            // helper: set a page (1, 2, etc) for the closest .collections parent
            const setCollectionsPage = (page) => {
                // update active buttons on this control
                btns.forEach(b => {
                    const isActive = b.getAttribute('data-target-page') === String(page);
                    b.classList.toggle('active', isActive);
                    b.setAttribute('aria-pressed', isActive);
                });

                // update visibility for containers inside the current .collections parent
                const parent = pc.closest('.collections');
                const containers = parent.querySelectorAll('.collections-container');
                containers.forEach(c => {
                    const isVisible = c.classList.contains('page-' + page);
                    c.style.display = isVisible ? '' : 'none';
                    c.classList.toggle('active-page', isVisible);
                    c.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
                    if (isVisible) c.scrollLeft = 0; // reset scroll to start
                });
            };

            btns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const page = btn.getAttribute('data-target-page');
                    setCollectionsPage(page);
                });
            });
        });
    }
});


/* ==========================================================
      MODAL CONTROL
========================================================== */

function openAdGate() {
    resetGate();

    gateModal.classList.add("active");
    gateModal.setAttribute("aria-hidden", "false");
}

function closeAdGate() {
    gateModal.classList.remove("active");
    gateModal.setAttribute("aria-hidden", "true");

    stopCountdown();

    youtubeFrame.src = ""; // stop video completely
}

document.getElementById("closeGate").addEventListener("click", closeAdGate);


/* ==========================================================
      RESET GATE
========================================================== */

function resetGate() {
    chosenMethod = null;
    adViews = [false, false, false];
    countdown = 30;
    countdownStarted = false;

    proceedBtn.disabled = true;
    proceedBtn.classList.remove("active");
    proceedBtn.textContent = "Wait 30s...";

    stopCountdown();

    // Reset video
    youtubeFrame.src = "";
    playAdVideoBtn.disabled = false;
    playAdVideoBtn.style.opacity = "1";

    gateDescription.textContent =
        "Watch 3 short ads or play a 30-second video to unlock this collection.";

    adButtons.forEach(btn => {
        btn.classList.remove("viewed", "disabled");
    });
}


/* ==========================================================
      METHOD A — VIEW 3 ADS
========================================================== */

adButtons.forEach((btn, index) => {
    btn.addEventListener("click", () => {

        if (chosenMethod === "video") return;

        chosenMethod = "ads";
        lockVideoOption();

        adViews[index] = true;
        btn.classList.add("viewed");

        const url = btn.dataset.url;
        if (url) window.open(url, "_blank");

        if (adViews.every(v => v)) {
            unlockProceed("All 3 ads viewed — you can proceed.");
        }
    });
});

function lockVideoOption() {
    playAdVideoBtn.disabled = true;
    playAdVideoBtn.style.opacity = "0.5";
}


/* ==========================================================
      METHOD B — WATCH VIDEO 30 SECONDS
========================================================== */

playAdVideoBtn.addEventListener("click", () => {
    if (chosenMethod === "ads") return;

    chosenMethod = "video";
    lockAdsOption();

    loadRandomVideo();
});

function lockAdsOption() {
    adButtons.forEach(b => b.classList.add("disabled"));
}


/* ==========================================================
      LOAD RANDOM VIDEO
========================================================== */

function loadRandomVideo() {
    const ids = ["qRYmz6k3bR8", "eimI_VjnPA8", "8xUX3D_GxBQ"];

    let id = ids[Math.floor(Math.random() * ids.length)];

    document.querySelector(".ad-video-wrapper").style.display = "block";

    const src = `https://www.youtube.com/embed/${id}?enablejsapi=1&autoplay=1&controls=1&rel=0`;

    youtubeFrame.src = src;

    // Build player AFTER iframe loads
    setTimeout(() => {
        ytPlayer = new YT.Player("adgateYoutube", {
            events: {
                "onStateChange": onPlayerStateChange
            }
        });
    }, 600);
}


/* ==========================================================
      VIDEO STATE LISTENER — FIXED LOGIC
========================================================== */

function onPlayerStateChange(event) {
    if (chosenMethod !== "video") return;

    switch (event.data) {

        case YT.PlayerState.PLAYING:
            if (!countdownStarted) {
                countdownStarted = true;
                startCountdown(); // ← countdown starts ONLY when the video visually begins
            }
            break;

        case YT.PlayerState.PAUSED:
            stopCountdown(); // pause countdown if user pauses
            break;

        case YT.PlayerState.ENDED:
            finishCountdown(); // instantly unlock if video finishes early
            break;
    }
}


/* ==========================================================
      COUNTDOWN LOGIC — FIXED & STABLE
========================================================== */

function startCountdown() {
    stopCountdown(); // avoid double intervals

    countdownInterval = setInterval(() => {
        countdown--;
        proceedBtn.textContent = `Wait ${countdown}s...`;

        if (countdown <= 0) {
            finishCountdown();
        }
    }, 1000);
}

function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

function finishCountdown() {
    stopCountdown();
    unlockProceed("30-second video watched — you can proceed.");
}


/* ==========================================================
      UNLOCK PROCEED BUTTON
========================================================== */

function unlockProceed(message) {
    proceedBtn.disabled = false;
    proceedBtn.classList.add("active");
    proceedBtn.textContent = "Proceed";
    gateDescription.textContent = message;
}


/* ==========================================================
      PROCEED
========================================================== */

proceedBtn.addEventListener("click", () => {
    if (!proceedBtn.disabled && selectedLink) {
        window.location.href = selectedLink;
    }
});

document.addEventListener("DOMContentLoaded", () => {
    // Select ALL collection rows
    const rows = document.querySelectorAll(".collections");

    rows.forEach((row) => {
        const container = row.querySelector(".collections-container");
        const leftArrow = row.querySelector(".left-arrow");
        const rightArrow = row.querySelector(".right-arrow");

        if (!container || !leftArrow || !rightArrow) return;

        const scrollAmount = 300;

        leftArrow.addEventListener("click", () => {
            container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
        });

        rightArrow.addEventListener("click", () => {
            container.scrollBy({ left: scrollAmount, behavior: "smooth" });
        });

        // Show/hide arrows depending on scroll position
        const updateArrows = () => {
            leftArrow.style.opacity = container.scrollLeft > 10 ? "1" : "0";

            rightArrow.style.opacity =
                container.scrollLeft + container.clientWidth < container.scrollWidth - 10
                    ? "1"
                    : "0";
        };

        container.addEventListener("scroll", updateArrows);
        updateArrows();
    });
});

