(function () {
    const STORAGE_KEY = 'poms_mode';
    const COLLAPSE_KEY = 'poms_hud_collapsed';
    let mode = localStorage.getItem(STORAGE_KEY) || 'challenge';
    let collapsed = localStorage.getItem(COLLAPSE_KEY) === '1';
    let streak = 0;
    let currentGoal = null;
    let lastGoalId = null;
    let status = 'active';
    let timerId = null;

    const ICONS = {
        infinity: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z"/></svg>',
        trophy: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
        chevronUp: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>',
        target: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
        flame: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
        timer: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/></svg>',
        zap: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
        check: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
        alert: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>',
        shuffle: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/></svg>',
        arrowRight: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
        rotateCcw: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>'
    };

    let state = {
        spawns: 0,
        maxActive: 0,
        lanesHit: [false, false, false, false, false],
        leftHits: 0,
        rightHits: 0,
        centerHits: 0,
        uniqueChars: new Set(),
        startedAt: null,
        timeLeft: null
    };

    const GOALS = [
        {
            id: 'metal-burst',
            title: 'Heavy Metal Burst',
            desc: 'Summon 20 Poms in 5 seconds (tap or mash QWERTYUIOP)!',
            timeLimit: 5,
            target: 20,
            getProgress: () => state.spawns,
            getLabel: () => `${Math.min(state.spawns, 20)} / 20 poms`,
            getShort: () => `${Math.min(state.spawns, 20)}/20`
        },
        {
            id: 'pom-swarm',
            title: 'Pom Swarm',
            desc: 'Have 22 Poms charging across the screen at once.',
            target: 22,
            getProgress: () => state.maxActive,
            getLabel: () => `${Math.min(state.maxActive, 22)} / 22 active`,
            getShort: () => `${Math.min(state.maxActive, 22)}/22`
        },
        {
            id: 'lane-sweep',
            title: 'Full Stage Sweep',
            desc: 'Summon Poms across all 5 screen zones (Left → Right).',
            target: 5,
            chips: ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5'],
            getChipsDone: () => state.lanesHit,
            getProgress: () => state.lanesHit.filter(Boolean).length,
            getLabel: () => `${state.lanesHit.filter(Boolean).length} / 5 zones`,
            getShort: () => `${state.lanesHit.filter(Boolean).length}/5`
        },
        {
            id: 'bookends',
            title: 'Edge Stereo',
            desc: 'Summon 5 Poms on the Far Left and 5 on the Far Right.',
            target: 10,
            chips: ['Far Left (5)', 'Far Right (5)'],
            getChipsDone: () => [state.leftHits >= 5, state.rightHits >= 5],
            getProgress: () => Math.min(state.leftHits, 5) + Math.min(state.rightHits, 5),
            getLabel: () => `L ${Math.min(state.leftHits, 5)}/5 · R ${Math.min(state.rightHits, 5)}/5`,
            getShort: () => `${Math.min(state.leftHits, 5) + Math.min(state.rightHits, 5)}/10`
        },
        {
            id: 'center-stage',
            title: 'Center Stage',
            desc: 'Land 10 Poms in the center lane in 7 seconds.',
            timeLimit: 7,
            target: 10,
            getProgress: () => state.centerHits,
            getLabel: () => `${Math.min(state.centerHits, 10)} / 10 center`,
            getShort: () => `${Math.min(state.centerHits, 10)}/10`
        },
        {
            id: 'variety-pack',
            title: 'Variety Pack',
            desc: 'Summon 8 different Pom styles within 10 seconds.',
            timeLimit: 10,
            target: 8,
            getProgress: () => state.uniqueChars.size,
            getLabel: () => `${Math.min(state.uniqueChars.size, 8)} / 8 styles`,
            getShort: () => `${Math.min(state.uniqueChars.size, 8)}/8`
        },
        {
            id: 'hyper-stampede',
            title: 'Hyper Stampede',
            desc: 'Summon 35 Poms in 8 seconds!',
            timeLimit: 8,
            target: 35,
            getProgress: () => state.spawns,
            getLabel: () => `${Math.min(state.spawns, 35)} / 35 poms`,
            getShort: () => `${Math.min(state.spawns, 35)}/35`
        }
    ];

    function playWinChime() {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            const ctx = new Ctx();
            [523.25, 659.25, 783.99].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.value = freq;
                const t = ctx.currentTime + i * 0.08;
                gain.gain.setValueAtTime(0.001, t);
                gain.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(t);
                osc.stop(t + 0.26);
            });
        } catch (_) {}
    }

    function createHUD() {
        const hud = document.createElement('div');
        hud.id = 'goal-hud';
        hud.innerHTML = `
            <div class="goal-top-row">
                <div class="goal-mode-bar" role="group" aria-label="Game mode">
                    <button type="button" class="goal-mode-btn" data-mode="freeplay">${ICONS.infinity}<span>Free<span class="goal-label-long">play</span></span></button>
                    <button type="button" class="goal-mode-btn" data-mode="challenge">${ICONS.trophy}<span>Goal<span class="goal-label-long">s</span></span></button>
                </div>
                <button type="button" class="goal-collapse-btn" id="goal-collapse-btn" aria-label="Toggle goal details" title="Collapse or expand goal">${ICONS.chevronUp}</button>
            </div>
            <button type="button" class="goal-mini-pill" id="goal-mini-pill" aria-label="Expand current goal"></button>
            <div class="goal-card" id="goal-card">
                <div class="goal-header">
                    <span class="goal-title-wrap">${ICONS.target}<span class="goal-title" id="goal-title">Challenge</span></span>
                    <span class="goal-streak" id="goal-streak">${ICONS.flame}<span>0</span></span>
                </div>
                <p class="goal-desc" id="goal-desc"></p>
                <div class="goal-chips" id="goal-chips" style="display:none;"></div>
                <div class="goal-progress-track">
                    <div class="goal-progress-fill" id="goal-progress-fill"></div>
                </div>
                <div class="goal-meta">
                    <span class="goal-meta-item" id="goal-progress-text">0 / 0</span>
                    <span class="goal-meta-item" id="goal-limit-text"></span>
                </div>
                <div class="goal-banner" id="goal-banner"></div>
                <div class="goal-actions">
                    <button type="button" class="goal-action-btn" id="goal-retry-btn" style="display:none;">${ICONS.rotateCcw}<span>Retry</span></button>
                    <button type="button" class="goal-action-btn" id="goal-new-btn">${ICONS.shuffle}<span>New Goal</span></button>
                </div>
            </div>
        `;
        document.body.appendChild(hud);

        ['pointerdown', 'pointerup', 'mousedown', 'touchstart', 'click'].forEach(evt => {
            hud.addEventListener(evt, e => e.stopPropagation());
        });

        hud.querySelectorAll('.goal-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => setMode(btn.dataset.mode));
        });

        hud.querySelector('#goal-collapse-btn').addEventListener('click', () => setCollapsed(!collapsed));
        hud.querySelector('#goal-mini-pill').addEventListener('click', () => setCollapsed(false));
        hud.querySelector('#goal-new-btn').addEventListener('click', () => startGoal());
        hud.querySelector('#goal-retry-btn').addEventListener('click', () => startGoal(currentGoal));

        return hud;
    }

    const hud = createHUD();
    const els = {
        card: hud.querySelector('#goal-card'),
        collapseBtn: hud.querySelector('#goal-collapse-btn'),
        miniPill: hud.querySelector('#goal-mini-pill'),
        title: hud.querySelector('#goal-title'),
        streak: hud.querySelector('#goal-streak span'),
        desc: hud.querySelector('#goal-desc'),
        chips: hud.querySelector('#goal-chips'),
        fill: hud.querySelector('#goal-progress-fill'),
        progressText: hud.querySelector('#goal-progress-text'),
        limitText: hud.querySelector('#goal-limit-text'),
        banner: hud.querySelector('#goal-banner'),
        retryBtn: hud.querySelector('#goal-retry-btn'),
        newBtn: hud.querySelector('#goal-new-btn'),
        modeBtns: hud.querySelectorAll('.goal-mode-btn')
    };

    function setCollapsed(val) {
        collapsed = !!val;
        localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
        render();
    }

    function clearTimer() {
        if (timerId) {
            clearInterval(timerId);
            timerId = null;
        }
    }

    function pickRandomGoal() {
        const pool = GOALS.filter(g => g.id !== lastGoalId);
        return pool[Math.floor(Math.random() * pool.length)] || GOALS[0];
    }

    function startGoal(specificGoal = null) {
        clearTimer();
        currentGoal = specificGoal || pickRandomGoal();
        lastGoalId = currentGoal.id;
        status = 'active';
        state = {
            spawns: 0,
            maxActive: 0,
            lanesHit: [false, false, false, false, false],
            leftHits: 0,
            rightHits: 0,
            centerHits: 0,
            uniqueChars: new Set(),
            startedAt: null,
            timeLeft: currentGoal.timeLimit || null
        };
        render();
    }

    function ensureTimerStarted() {
        if (!currentGoal || !currentGoal.timeLimit || state.startedAt || status !== 'active') return;
        state.startedAt = performance.now();
        timerId = setInterval(() => {
            if (mode !== 'challenge' || status !== 'active') {
                clearTimer();
                return;
            }
            const elapsed = (performance.now() - state.startedAt) / 1000;
            state.timeLeft = Math.max(0, currentGoal.timeLimit - elapsed);
            if (state.timeLeft <= 0) {
                failGoal('TIME UP!');
            } else {
                render();
            }
        }, 100);
    }

    function winGoal() {
        if (status !== 'active') return;
        clearTimer();
        status = 'won';
        streak++;
        collapsed = false;
        playWinChime();
        render();
    }

    function failGoal(msg) {
        if (status !== 'active') return;
        clearTimer();
        status = 'failed';
        streak = 0;
        collapsed = false;
        els.banner.innerHTML = `${ICONS.alert}<span>${msg}</span>`;
        render();
    }

    function evaluate() {
        if (mode !== 'challenge' || !currentGoal || status !== 'active') return;
        if (currentGoal.getProgress() >= currentGoal.target) {
            winGoal();
            return;
        }
        render();
    }

    function render() {
        const isChallenge = mode === 'challenge';
        els.modeBtns.forEach(btn => {
            btn.classList.toggle('is-active', btn.dataset.mode === mode);
        });
        els.collapseBtn.classList.toggle('is-hidden', !isChallenge);
        els.collapseBtn.classList.toggle('is-collapsed', collapsed);
        els.card.classList.toggle('is-hidden', !isChallenge || collapsed);
        els.miniPill.classList.toggle('is-visible', isChallenge && collapsed);

        if (!isChallenge || !currentGoal) return;

        els.card.classList.toggle('is-won', status === 'won');
        els.card.classList.toggle('is-failed', status === 'failed');
        els.miniPill.classList.toggle('is-won', status === 'won');
        els.miniPill.classList.toggle('is-failed', status === 'failed');

        els.title.textContent = currentGoal.title;
        els.desc.textContent = currentGoal.desc;
        els.streak.textContent = String(streak);

        const progress = Math.min(currentGoal.getProgress(), currentGoal.target);
        const pct = currentGoal.target > 0 ? Math.min(100, (progress / currentGoal.target) * 100) : 0;
        els.fill.style.width = `${pct}%`;
        els.progressText.textContent = currentGoal.getLabel();

        if (currentGoal.chips) {
            const doneFlags = currentGoal.getChipsDone();
            els.chips.style.display = 'flex';
            els.chips.innerHTML = currentGoal.chips
                .map((c, i) => `<span class="goal-chip ${doneFlags[i] ? 'is-done' : ''}">${doneFlags[i] ? ICONS.check : ''}<span>${c}</span></span>`)
                .join('');
        } else {
            els.chips.style.display = 'none';
        }

        let shortLimit = '';
        if (currentGoal.timeLimit) {
            const t = state.timeLeft !== null ? state.timeLeft : currentGoal.timeLimit;
            const txt = state.startedAt ? `${t.toFixed(1)}s` : `${currentGoal.timeLimit}s`;
            els.limitText.innerHTML = `${ICONS.timer}<span>${txt}</span>`;
            shortLimit = ` · ${txt}`;
        } else {
            els.limitText.innerHTML = `${ICONS.zap}<span>${state.spawns} summoned</span>`;
        }

        els.miniPill.innerHTML = `${ICONS.target}<span>${currentGoal.title}: ${currentGoal.getShort()}${shortLimit}</span>`;

        if (status === 'won') {
            els.banner.innerHTML = `${ICONS.check}<span>Completed</span>`;
            els.retryBtn.style.display = 'none';
            els.newBtn.innerHTML = `<span>Next Goal</span>${ICONS.arrowRight}`;
            els.newBtn.classList.add('is-primary');
        } else if (status === 'failed') {
            els.retryBtn.style.display = 'inline-flex';
            els.newBtn.innerHTML = `${ICONS.shuffle}<span>New Goal</span>`;
            els.newBtn.classList.remove('is-primary');
        } else {
            els.banner.innerHTML = '';
            els.retryBtn.style.display = 'none';
            els.newBtn.innerHTML = `${ICONS.shuffle}<span>New Goal</span>`;
            els.newBtn.classList.remove('is-primary');
        }
    }

    function setMode(newMode) {
        mode = newMode === 'freeplay' ? 'freeplay' : 'challenge';
        localStorage.setItem(STORAGE_KEY, mode);
        if (mode === 'challenge') {
            if (!currentGoal || status !== 'active') startGoal();
            else render();
        } else {
            clearTimer();
            render();
        }
    }

    window.addEventListener('poms:spawn', (e) => {
        if (mode !== 'challenge' || status !== 'active') return;
        ensureTimerStarted();
        const d = e.detail || {};
        state.spawns++;
        if (typeof d.activePoms === 'number' && d.activePoms > state.maxActive) {
            state.maxActive = d.activePoms;
        }
        if (typeof d.t === 'number') {
            const lane = Math.min(4, Math.max(0, Math.floor(d.t * 5)));
            state.lanesHit[lane] = true;
            if (d.t < 0.25) state.leftHits++;
            else if (d.t > 0.75) state.rightHits++;
            else if (d.t >= 0.35 && d.t <= 0.65) state.centerHits++;
        }
        if (d.charKey) state.uniqueChars.add(d.charKey);
        evaluate();
    });

    if (mode === 'challenge') startGoal();
    else render();
})();
