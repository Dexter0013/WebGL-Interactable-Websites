import { GAMES, resolveGameUrl } from './games.config.js';
import { initMedievalCastle } from './medieval-bg.js';

let selectedId = null;
let castle = null;
const pinEls = new Map();
const dockEls = new Map();

const els = {
    pins: document.getElementById('castle-pins'),
    dock: document.getElementById('castle-dock'),
    overviewBtn: document.getElementById('overview-btn'),
    panel: document.getElementById('game-panel'),
    panelVideo: document.getElementById('panel-video'),
    panelTag: document.getElementById('panel-tag'),
    panelSection: document.getElementById('panel-section'),
    panelTitle: document.getElementById('panel-title'),
    panelDesc: document.getElementById('panel-desc'),
    panelPlay: document.getElementById('panel-play'),
    panelClose: document.getElementById('panel-close'),
    panelPrev: document.getElementById('panel-prev'),
    panelNext: document.getElementById('panel-next')
};

function buildCastleUI() {
    for (const game of GAMES) {
        // 3D-projected pin anchored on the castle
        const pin = document.createElement('button');
        pin.type = 'button';
        pin.className = 'castle-pin';
        pin.dataset.id = game.id;
        pin.innerHTML = `
            <span class="pin-dot" aria-hidden="true"></span>
            <span class="pin-text">
                <span class="pin-section">${game.section}</span>
                <span class="pin-title">${game.title}</span>
            </span>
        `;
        pin.addEventListener('click', (e) => {
            e.stopPropagation();
            selectGame(game.id);
        });
        els.pins.appendChild(pin);
        pinEls.set(game.id, pin);

        // Bottom castle-map dock button (compact single-label)
        const dockBtn = document.createElement('button');
        dockBtn.type = 'button';
        dockBtn.className = 'dock-btn';
        dockBtn.dataset.id = game.id;
        dockBtn.title = `${game.section} — ${game.title}`;
        dockBtn.innerHTML = `<span class="dock-dot" aria-hidden="true"></span><span class="dock-name">${game.shortTitle || game.title}</span>`;
        dockBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            selectGame(game.id);
        });
        els.dock.appendChild(dockBtn);
        dockEls.set(game.id, dockBtn);
    }
}

function selectGame(gameId) {
    const game = GAMES.find(g => g.id === gameId);
    if (!game) {
        clearSelection();
        return;
    }

    selectedId = game.id;
    if (castle) castle.focusGame(game.id);

    const href = resolveGameUrl(game);
    const isExternal = /^https?:\/\//i.test(href);

    els.panelTag.textContent = game.tag;
    els.panelSection.textContent = game.section;
    els.panelTitle.textContent = game.title;
    els.panelDesc.textContent = game.description;
    els.panelPlay.href = href;
    if (isExternal) {
        els.panelPlay.target = '_blank';
        els.panelPlay.rel = 'noopener noreferrer';
    } else {
        els.panelPlay.removeAttribute('target');
        els.panelPlay.removeAttribute('rel');
    }

    if (els.panelVideo.getAttribute('src') !== game.videoSrc) {
        els.panelVideo.src = game.videoSrc;
        els.panelVideo.play().catch(() => {});
    }

    els.panel.classList.remove('is-hidden');
    els.overviewBtn.classList.remove('is-hidden');

    for (const [id, pin] of pinEls) {
        pin.classList.toggle('is-active', id === selectedId);
        pin.classList.toggle('is-dimmed', id !== selectedId);
    }
    for (const [id, btn] of dockEls) {
        btn.classList.toggle('is-active', id === selectedId);
    }
    document.body.classList.add('has-selection');
}

function clearSelection() {
    selectedId = null;
    if (castle) castle.resetView();
    els.panel.classList.add('is-hidden');
    els.overviewBtn.classList.add('is-hidden');
    document.body.classList.remove('has-selection');

    for (const [, pin] of pinEls) {
        pin.classList.remove('is-active', 'is-dimmed');
    }
    for (const [, btn] of dockEls) {
        btn.classList.remove('is-active');
    }
}

function stepGame(delta) {
    const idx = selectedId ? GAMES.findIndex(g => g.id === selectedId) : -1;
    const nextIdx = (idx + delta + GAMES.length) % GAMES.length;
    selectGame(GAMES[nextIdx].id);
}

function updateProjectedPins(projected) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isSmall = vw < 720;
    const topSafe = isSmall ? 84 : 92;
    const botSafe = isSmall ? (selectedId ? vh * 0.44 : vh - 94) : vh - 98;
    const placed = [];

    const items = Object.entries(projected)
        .map(([id, coords]) => ({ id, pin: pinEls.get(id), coords }))
        .filter(item => item.pin);

    // Sort top-to-bottom so overlap resolution nudges cleanly downward/sideways
    items.sort((a, b) => a.coords.y - b.coords.y);

    for (const { id, pin, coords } of items) {
        if (!coords.visible || (isSmall && selectedId && id !== selectedId)) {
            pin.style.display = 'none';
            continue;
        }
        pin.style.display = 'inline-flex';

        const pw = pin.offsetWidth || (isSmall ? 96 : 140);
        const ph = pin.offsetHeight || (isSmall ? 28 : 38);
        const padX = Math.max(12, pw / 2 + 8);

        let cx = Math.max(padX, Math.min(vw - padX, coords.x));
        let cy = Math.max(topSafe + ph, Math.min(botSafe, coords.y));

        // De-overlap against already-placed pins
        for (let pass = 0; pass < 2; pass++) {
            for (const other of placed) {
                const minDistX = (pw + other.w) / 2 + 8;
                const minDistY = Math.max(ph, other.h) + 10;
                const dx = cx - other.x;
                const dy = cy - other.y;
                if (Math.abs(dx) < minDistX && Math.abs(dy) < minDistY) {
                    const pushY = other.y + minDistY;
                    if (pushY <= botSafe) {
                        cy = pushY;
                    } else {
                        cx += (dx >= 0 ? 1 : -1) * (minDistX - Math.abs(dx));
                        cx = Math.max(padX, Math.min(vw - padX, cx));
                    }
                }
            }
        }

        placed.push({ x: cx, y: cy, w: pw, h: ph });
        pin.style.left = `${cx.toFixed(1)}px`;
        pin.style.top = `${cy.toFixed(1)}px`;
    }
}

const TIME_MODES = [
    { id: 'auto', label: 'Cycle', icon: '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
    { id: 'day', label: 'Day', icon: '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>' },
    { id: 'dusk', label: 'Dusk', icon: '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10V2"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m16 6-4 4-4-4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg>' },
    { id: 'night', label: 'Night', icon: '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>' }
];

let timeModeIndex = 0;

function updateTimeUI() {
    const cur = TIME_MODES[timeModeIndex];
    const iconEl = document.getElementById('time-icon');
    const labelEl = document.getElementById('time-label');
    if (iconEl) iconEl.innerHTML = cur.icon;
    if (labelEl) labelEl.textContent = cur.label;
    if (castle && castle.setTimeMode) castle.setTimeMode(cur.id);
}

document.addEventListener('DOMContentLoaded', () => {
    buildCastleUI();

    const canvas = document.getElementById('bg-canvas');
    castle = initMedievalCastle(canvas, GAMES, {
        onProject: updateProjectedPins
    });

    updateTimeUI();
    const timeBtn = document.getElementById('time-btn');
    if (timeBtn) {
        timeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            timeModeIndex = (timeModeIndex + 1) % TIME_MODES.length;
            updateTimeUI();
        });
    }

    canvas.addEventListener('click', () => {
        if (selectedId) clearSelection();
    });

    els.overviewBtn.addEventListener('click', clearSelection);
    els.panelClose.addEventListener('click', clearSelection);
    els.panelPrev.addEventListener('click', () => stepGame(-1));
    els.panelNext.addEventListener('click', () => stepGame(1));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && selectedId) clearSelection();
        else if (e.key === 'ArrowRight') stepGame(1);
        else if (e.key === 'ArrowLeft') stepGame(-1);
    });
});
