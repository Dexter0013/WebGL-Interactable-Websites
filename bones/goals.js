(function () {
    const STORAGE_KEY = 'bones_mode';
    const COLLAPSE_KEY = 'bones_hud_collapsed';
    let mode = localStorage.getItem(STORAGE_KEY) || 'challenge';
    let collapsed = localStorage.getItem(COLLAPSE_KEY) === '1';
    let streak = 0;
    let currentGoal = null;
    let lastGoalId = null;
    let status = 'active';
    let tickId = null;

    const ICONS = {
        infinity: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z"/></svg>',
        trophy: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
        chevronUp: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>',
        target: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
        flame: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
        timer: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/></svg>',
        move: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/></svg>',
        check: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
        alert: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>',
        shuffle: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/></svg>',
        arrowRight: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
        rotateCcw: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
        arrowUp: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>',
        arrowDown: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
        arrowLeft: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
        arrowRightSm: '<svg class="goal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>'
    };

    const POSES = [
        { key: 'stand', label: 'Stand', icon: ICONS.arrowUp, test: (nx, ny) => ny <= 0.24 },
        { key: 'squat', label: 'Squat', icon: ICONS.arrowDown, test: (nx, ny) => ny >= 0.76 },
        { key: 'left', label: 'Left', icon: ICONS.arrowLeft, test: (nx, ny) => nx <= 0.24 },
        { key: 'right', label: 'Right', icon: ICONS.arrowRightSm, test: (nx, ny) => nx >= 0.76 }
    ];

    function generateSequence(len) {
        const seq = [];
        for (let i = 0; i < len; i++) {
            const choices = POSES.filter(p => i === 0 || p.key !== seq[i - 1].key);
            seq.push(choices[Math.floor(Math.random() * choices.length)]);
        }
        return seq;
    }

    let state = {
        nx: 0.5,
        ny: 0.5,
        lastX: null,
        lastY: null,
        seq: [],
        seqIndex: 0,
        squatReps: 0,
        squatPhase: 'needBottom',
        zoomSweeps: 0,
        zoomPhase: 'needLeft',
        holdSeconds: 0,
        energy: 0,
        startedAt: null,
        timeLeft: null,
        lastTickAt: performance.now()
    };

    const GOALS = [
        {
            id: 'routine-4',
            title: 'Dance Routine',
            desc: 'Hit each pose in order by moving across the dance zone.',
            init: () => { state.seq = generateSequence(4); state.seqIndex = 0; },
            target: 4,
            getProgress: () => state.seqIndex,
            getLabel: () => `${state.seqIndex} / 4 poses`,
            getShort: () => `${state.seqIndex}/4`,
            getChips: () => state.seq.map((p, i) => ({
                label: p.label,
                icon: p.icon,
                done: i < state.seqIndex,
                current: i === state.seqIndex && status === 'active'
            }))
        },
        {
            id: 'squat-reps',
            title: 'Spooky Squats',
            desc: 'Pump 5 full squats (Top ↔ Bottom) in 12 seconds!',
            timeLimit: 12,
            target: 5,
            getProgress: () => state.squatReps,
            getLabel: () => `${Math.min(state.squatReps, 5)} / 5 squats`,
            getShort: () => `${Math.min(state.squatReps, 5)}/5`
        },
        {
            id: 'freeze-squat',
            title: 'Freeze Frame',
            desc: 'Hold a Deep Squat (bottom zone) for 2.5 seconds.',
            target: 2.5,
            getProgress: () => state.holdSeconds,
            getLabel: () => `${Math.min(state.holdSeconds, 2.5).toFixed(1)} / 2.5s held`,
            getShort: () => `${Math.min(state.holdSeconds, 2.5).toFixed(1)}s`
        },
        {
            id: 'zoom-boogie',
            title: 'Zoom Boogie',
            desc: 'Sweep full Left ↔ Right 5 times in 10 seconds!',
            timeLimit: 10,
            target: 5,
            getProgress: () => state.zoomSweeps,
            getLabel: () => `${Math.min(state.zoomSweeps, 5)} / 5 sweeps`,
            getShort: () => `${Math.min(state.zoomSweeps, 5)}/5`
        },
        {
            id: 'club-energy',
            title: 'Club Energy',
            desc: 'Keep the bones grooving to fill 100% energy in 8s!',
            timeLimit: 8,
            target: 100,
            getProgress: () => Math.min(100, state.energy),
            getLabel: () => `${Math.min(100, Math.round(state.energy))}% energy`,
            getShort: () => `${Math.min(100, Math.round(state.energy))}%`
        },
        {
            id: 'routine-6',
            title: 'Pro Choreography',
            desc: 'Nail a 6-pose dance sequence within 14 seconds!',
            timeLimit: 14,
            init: () => { state.seq = generateSequence(6); state.seqIndex = 0; },
            target: 6,
            getProgress: () => state.seqIndex,
            getLabel: () => `${state.seqIndex} / 6 poses`,
            getShort: () => `${state.seqIndex}/6`,
            getChips: () => state.seq.map((p, i) => ({
                label: p.label,
                icon: p.icon,
                done: i < state.seqIndex,
                current: i === state.seqIndex && status === 'active'
            }))
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
        hud.setAttribute('data-desktop-ui', 'true');
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

    function getNormalizedCoords(clientX, clientY) {
        const zone = document.querySelector('.control-zone');
        if (zone) {
            const rect = zone.getBoundingClientRect();
            if (rect.width > 40 && rect.height > 40) {
                return {
                    nx: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
                    ny: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
                };
            }
        }
        return {
            nx: Math.max(0, Math.min(1, clientX / Math.max(1, window.innerWidth))),
            ny: Math.max(0, Math.min(1, clientY / Math.max(1, window.innerHeight)))
        };
    }

    function stopLoop() {
        if (tickId) {
            clearInterval(tickId);
            tickId = null;
        }
    }

    function startLoop() {
        stopLoop();
        state.lastTickAt = performance.now();
        tickId = setInterval(() => {
            if (mode !== 'challenge' || !currentGoal || status !== 'active') return;
            const now = performance.now();
            const dt = Math.min(0.2, (now - state.lastTickAt) / 1000);
            state.lastTickAt = now;

            if (currentGoal.id === 'freeze-squat') {
                if (state.ny >= 0.75) {
                    state.holdSeconds += dt;
                    if (state.holdSeconds >= currentGoal.target) {
                        winGoal();
                        return;
                    }
                } else {
                    state.holdSeconds = Math.max(0, state.holdSeconds - dt * 1.5);
                }
                render();
            }

            if (currentGoal.timeLimit && state.startedAt) {
                const elapsed = (now - state.startedAt) / 1000;
                state.timeLeft = Math.max(0, currentGoal.timeLimit - elapsed);
                if (state.timeLeft <= 0) {
                    failGoal('TIME UP!');
                } else {
                    render();
                }
            }
        }, 80);
    }

    function pickRandomGoal() {
        const pool = GOALS.filter(g => g.id !== lastGoalId);
        return pool[Math.floor(Math.random() * pool.length)] || GOALS[0];
    }

    function startGoal(specificGoal = null) {
        currentGoal = specificGoal || pickRandomGoal();
        lastGoalId = currentGoal.id;
        status = 'active';
        state.seq = [];
        state.seqIndex = 0;
        state.squatReps = 0;
        state.squatPhase = 'needBottom';
        state.zoomSweeps = 0;
        state.zoomPhase = 'needLeft';
        state.holdSeconds = 0;
        state.energy = 0;
        state.lastX = null;
        state.lastY = null;
        state.startedAt = null;
        state.timeLeft = currentGoal.timeLimit || null;
        if (currentGoal.init) currentGoal.init();
        startLoop();
        render();
    }

    function winGoal() {
        if (status !== 'active') return;
        stopLoop();
        status = 'won';
        streak++;
        collapsed = false;
        playWinChime();
        render();
    }

    function failGoal(msg) {
        if (status !== 'active') return;
        stopLoop();
        status = 'failed';
        streak = 0;
        collapsed = false;
        els.banner.innerHTML = `${ICONS.alert}<span>${msg}</span>`;
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

        if (currentGoal.getChips) {
            const chips = currentGoal.getChips();
            els.chips.style.display = 'flex';
            els.chips.innerHTML = chips
                .map(c => `<span class="goal-chip ${c.done ? 'is-done' : ''} ${c.current ? 'is-current' : ''}">${c.done ? ICONS.check : c.icon}<span>${c.label}</span></span>`)
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
            els.limitText.innerHTML = `${ICONS.move}<span>Move to dance</span>`;
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
            else {
                startLoop();
                render();
            }
        } else {
            stopLoop();
            render();
        }
    }

    function handlePointer(e) {
        if (mode !== 'challenge' || !currentGoal || status !== 'active') return;
        if (e.target && e.target.closest && e.target.closest('#goal-hud')) return;

        const { nx, ny } = getNormalizedCoords(e.clientX, e.clientY);
        state.nx = nx;
        state.ny = ny;

        if (state.lastX !== null && state.lastY !== null) {
            const dx = e.clientX - state.lastX;
            const dy = e.clientY - state.lastY;
            const dist = Math.hypot(dx, dy);

            if (dist > 3 && currentGoal.timeLimit && !state.startedAt) {
                state.startedAt = performance.now();
            }

            if (currentGoal.id === 'club-energy') {
                const normDist = dist / Math.max(300, Math.min(window.innerWidth, window.innerHeight));
                state.energy = Math.min(100, state.energy + normDist * 11);
                if (state.energy >= 100) {
                    winGoal();
                    return;
                }
            }
        }
        state.lastX = e.clientX;
        state.lastY = e.clientY;

        if (currentGoal.id === 'routine-4' || currentGoal.id === 'routine-6') {
            const nextPose = state.seq[state.seqIndex];
            if (nextPose && nextPose.test(nx, ny)) {
                state.seqIndex++;
                if (state.seqIndex >= state.seq.length) {
                    winGoal();
                    return;
                }
            }
        } else if (currentGoal.id === 'squat-reps') {
            if (state.squatPhase === 'needBottom' && ny >= 0.76) {
                state.squatPhase = 'needTop';
            } else if (state.squatPhase === 'needTop' && ny <= 0.24) {
                state.squatPhase = 'needBottom';
                state.squatReps++;
                if (state.squatReps >= currentGoal.target) {
                    winGoal();
                    return;
                }
            }
        } else if (currentGoal.id === 'zoom-boogie') {
            if (state.zoomPhase === 'needLeft' && nx <= 0.22) {
                state.zoomPhase = 'needRight';
            } else if (state.zoomPhase === 'needRight' && nx >= 0.78) {
                state.zoomPhase = 'needLeft';
                state.zoomSweeps++;
                if (state.zoomSweeps >= currentGoal.target) {
                    winGoal();
                    return;
                }
            }
        }

        render();
    }

    window.addEventListener('pointermove', handlePointer, { passive: true });
    window.addEventListener('pointerdown', handlePointer, { passive: true });

    if (mode === 'challenge') startGoal();
    else render();
})();
