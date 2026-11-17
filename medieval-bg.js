import * as THREE from 'https://unpkg.com/three@0.170.0/build/three.module.js';

/**
 * Interactive 3D Medieval Pixel-Art Castle Hub
 * Projects dynamic game anchors into screen space and glides the camera
 * to each castle section when selected.
 */
export function initMedievalCastle(canvas, games, { onProject } = {}) {
    if (!canvas) return null;

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: false,
            alpha: false,
            powerPreference: 'low-power'
        });
    } catch (err) {
        console.warn('WebGL unavailable:', err);
        return null;
    }

    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x161925);
    scene.fog = new THREE.FogExp2(0x191c29, 0.0155);

    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.5, 190);
    const OVERVIEW = {
        pos: new THREE.Vector3(0, 15.8, 34.5),
        lookAt: new THREE.Vector3(0, 8.2, -1.5)
    };
    const camCurrentPos = OVERVIEW.pos.clone();
    const camTargetPos = OVERVIEW.pos.clone();
    const camCurrentLook = OVERVIEW.lookAt.clone();
    const camTargetLook = OVERVIEW.lookAt.clone();
    let activeGameId = null;

    camera.position.copy(camCurrentPos);
    camera.lookAt(camCurrentLook);

    // ===== PIXEL TEXTURE GENERATOR (16x16 NearestFilter) =====
    function makePixelTexture(size, drawFn, repeatX = 1, repeatY = 1) {
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        drawFn(ctx, size);
        const tex = new THREE.CanvasTexture(c);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.generateMipmaps = false;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(repeatX, repeatY);
        return tex;
    }

    const stoneTex = makePixelTexture(16, (ctx) => {
        ctx.fillStyle = '#5d606a';
        ctx.fillRect(0, 0, 16, 16);
        const bricks = [
            [0, 0, 7, 3, '#696c76'], [8, 0, 8, 3, '#535660'],
            [0, 4, 4, 3, '#575a64'], [5, 4, 7, 3, '#6d707a'], [13, 4, 3, 3, '#5a5d67'],
            [0, 8, 8, 3, '#646771'], [9, 8, 7, 3, '#51545e'],
            [0, 12, 5, 3, '#5b5e68'], [6, 12, 7, 3, '#6a6d77'], [14, 12, 2, 3, '#545761']
        ];
        bricks.forEach(([x, y, w, h, col]) => {
            ctx.fillStyle = col;
            ctx.fillRect(x, y, w, h);
        });
        ctx.fillStyle = '#3f424b';
        [3, 7, 11, 15].forEach(y => ctx.fillRect(0, y, 16, 1));
        ctx.fillStyle = '#475243';
        ctx.fillRect(2, 12, 2, 1);
        ctx.fillRect(10, 8, 2, 1);
    }, 2, 2);

    const roofTex = makePixelTexture(16, (ctx) => {
        ctx.fillStyle = '#4b3338';
        ctx.fillRect(0, 0, 16, 16);
        for (let y = 0; y < 16; y += 4) {
            for (let x = 0; x < 16; x += 4) {
                const off = (y / 4) % 2 === 0 ? 0 : 2;
                ctx.fillStyle = (x + y) % 8 === 0 ? '#5b3c41' : '#3f2a2e';
                ctx.fillRect((x + off) % 16, y, 3, 3);
            }
        }
    }, 2, 2);

    const grassTex = makePixelTexture(16, (ctx) => {
        ctx.fillStyle = '#2d4032';
        ctx.fillRect(0, 0, 16, 16);
        const speckles = [
            [2, 2, '#354b3a'], [6, 5, '#253529'], [11, 3, '#384f3d'],
            [4, 10, '#3a513e'], [9, 12, '#243428'], [14, 9, '#344939'],
            [1, 14, '#293b2d'], [12, 14, '#364d3b'], [7, 1, '#314536']
        ];
        speckles.forEach(([x, y, col]) => {
            ctx.fillStyle = col;
            ctx.fillRect(x, y, 2, 2);
        });
    }, 6, 6);

    const woodTex = makePixelTexture(16, (ctx) => {
        ctx.fillStyle = '#5a3e2b';
        ctx.fillRect(0, 0, 16, 16);
        for (let x = 0; x < 16; x += 4) {
            ctx.fillStyle = x % 8 === 0 ? '#674832' : '#4f3524';
            ctx.fillRect(x, 0, 3, 16);
            ctx.fillStyle = '#3a2619';
            ctx.fillRect(x + 3, 0, 1, 16);
        }
    }, 1, 1);

    // ===== MATERIALS =====
    const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.95, metalness: 0.05 });
    const darkStoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, color: 0xb8bcc8, roughness: 0.96 });
    const roofMat = new THREE.MeshStandardMaterial({ map: roofTex, roughness: 0.88 });
    const grassMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1.0 });
    const dirtMat = new THREE.MeshStandardMaterial({ color: 0x3b3129, roughness: 1.0 });
    const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.92 });
    const logCutMat = new THREE.MeshStandardMaterial({ color: 0xb89668, roughness: 0.9 });
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x1d2b3b, roughness: 0.45, metalness: 0.2 });
    const leafDarkMat = new THREE.MeshStandardMaterial({ color: 0x22382c, roughness: 0.95 });
    const leafMidMat = new THREE.MeshStandardMaterial({ color: 0x2d4a38, roughness: 0.95 });
    const bannerMat = new THREE.MeshStandardMaterial({ color: 0x8b3438, roughness: 0.85, side: THREE.DoubleSide });
    const windowGlowMat = new THREE.MeshBasicMaterial({ color: 0xf2b55b });

    // ===== LIGHTING =====
    const hemiLight = new THREE.HemisphereLight(0x8295bf, 0x22261e, 0.78);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xa3b9df, 0.9);
    keyLight.position.set(-22, 36, 20);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x524566, 0.35);
    rimLight.position.set(24, 12, -20);
    scene.add(rimLight);

    const torchConfigs = [
        { pos: [-2.6, 5.4, 5.2], base: 5.5 },
        { pos: [2.6, 5.4, 5.2], base: 5.5 },
        { pos: [0, 12.6, 2.8], base: 4.5 },
        { pos: [-13.6, 3.6, 7.6], base: 3.2 },
        { pos: [8.2, 13.8, -6.2], base: 3.6 }
    ];
    const torches = torchConfigs.map(({ pos, base }, idx) => {
        const light = new THREE.PointLight(0xe8943a, base, 20, 1.8);
        light.position.set(pos[0], pos[1], pos[2]);
        scene.add(light);

        const flame = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.42, 0.3),
            new THREE.MeshBasicMaterial({ color: 0xf6b95c })
        );
        flame.position.set(pos[0], pos[1] - 0.1, pos[2]);
        scene.add(flame);

        return { light, flame, base, phase: idx * 2.17 };
    });

    // ===== WORLD =====
    const world = new THREE.Group();
    scene.add(world);

    function addBox(w, h, d, x, y, z, mat, parent = world) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        mesh.position.set(x, y, z);
        parent.add(mesh);
        return mesh;
    }

    // Moat & stepped hilltop
    addBox(100, 2, 100, 0, -2.2, -10, waterMat);
    addBox(46, 3, 38, 0, -0.5, -2, dirtMat);
    addBox(44, 1.2, 36, 0, 1.4, -2, grassMat);
    addBox(28, 2.2, 22, 0, 2.8, -2, dirtMat);
    addBox(26.5, 1.0, 20.5, 0, 4.1, -2, grassMat);

    // Distant rolling hills
    addBox(34, 8, 16, -34, 2, -26, dirtMat);
    addBox(32, 1.2, 14, -34, 6.4, -26, grassMat);
    addBox(38, 10, 18, 36, 3, -30, dirtMat);
    addBox(36, 1.2, 16, 36, 8.4, -30, grassMat);
    addBox(52, 7, 14, 0, 1.5, -36, dirtMat);
    addBox(50, 1.2, 12, 0, 5.4, -36, grassMat);

    // Drawbridge & King's Road (Road trip section)
    for (let i = 0; i < 7; i++) {
        addBox(3.6, 0.35, 1.15, 0, 2.25 - i * 0.12, 9.4 + i * 1.45, woodMat);
    }
    addBox(0.3, 1.4, 9.8, -1.9, 2.4, 13.6, woodMat);
    addBox(0.3, 1.4, 9.8, 1.9, 2.4, 13.6, woodMat);

    // Lumber Yard stump & woodpile (Firewood section, front-left)
    addBox(1.5, 1.2, 1.5, -13.6, 2.5, 7.6, woodMat);
    addBox(1.3, 0.12, 1.3, -13.6, 3.12, 7.6, logCutMat);
    addBox(1.8, 0.55, 0.6, -15.4, 2.25, 8.2, woodMat);
    addBox(1.8, 0.55, 0.6, -15.4, 2.25, 8.9, woodMat);
    addBox(1.8, 0.55, 0.6, -15.4, 2.8, 8.55, woodMat);

    // ===== MEDIEVAL CASTLE =====
    const castle = new THREE.Group();
    castle.position.set(0, 4.5, -2.5);
    world.add(castle);

    // Curtain walls
    addBox(16, 3.6, 1.4, 0, 1.8, 6.4, darkStoneMat, castle);
    addBox(16, 3.6, 1.4, 0, 1.8, -6.4, darkStoneMat, castle);
    addBox(1.4, 3.6, 12, -7.3, 1.8, 0, darkStoneMat, castle);
    addBox(1.4, 3.6, 12, 7.3, 1.8, 0, darkStoneMat, castle);

    for (let x = -7; x <= 7; x += 2) {
        addBox(0.95, 0.85, 1.45, x, 4.0, 6.4, stoneMat, castle);
        addBox(0.95, 0.85, 1.45, x, 4.0, -6.4, stoneMat, castle);
    }
    for (let z = -5; z <= 5; z += 2) {
        addBox(1.45, 0.85, 0.95, -7.3, 4.0, z, stoneMat, castle);
        addBox(1.45, 0.85, 0.95, 7.3, 4.0, z, stoneMat, castle);
    }

    // Gatehouse
    addBox(4.4, 4.6, 2.2, 0, 2.3, 6.6, stoneMat, castle);
    addBox(2.2, 2.9, 0.4, 0, 1.45, 7.6, woodMat, castle);
    for (let x = -1.6; x <= 1.6; x += 1.6) {
        addBox(0.9, 0.9, 2.3, x, 5.0, 6.6, stoneMat, castle);
    }

    // Central Grand Keep (Splitshift section)
    addBox(8.2, 9.2, 7.4, 0, 4.6, -0.4, stoneMat, castle);
    for (let step = 0; step < 5; step++) {
        addBox(8.8 - step * 1.35, 0.85, 8.0 - step * 1.1, 0, 9.6 + step * 0.82, -0.4, roofMat, castle);
    }
    [[-2.0, 6.8], [2.0, 6.8], [0, 7.4], [-2.0, 4.4], [2.0, 4.4]].forEach(([wx, wy]) => {
        addBox(0.75, 1.25, 0.18, wx, wy, 3.32, windowGlowMat, castle);
    });

    function addTower(x, z, w, h, hasSpire = true) {
        addBox(w, h, w, x, h / 2, z, stoneMat, castle);
        const half = w / 2 - 0.35;
        [[-half, -half], [half, -half], [-half, half], [half, half], [0, -half], [0, half], [-half, 0], [half, 0]].forEach(([cx, cz]) => {
            addBox(0.75, 0.85, 0.75, x + cx, h + 0.4, z + cz, darkStoneMat, castle);
        });
        addBox(0.6, 1.1, 0.2, x, h - 2.1, z + w / 2 + 0.02, windowGlowMat, castle);
        if (hasSpire) {
            for (let s = 0; s < 4; s++) {
                const sw = Math.max(0.8, w + 0.6 - s * 1.05);
                addBox(sw, 0.9, sw, x, h + 1.1 + s * 0.88, z, roofMat, castle);
            }
        }
    }

    // West Bastion (Poms), East Gate Tower, Back-West Tower, East War Tower (Chess 2), Bell Spire (Spooky Bones)
    addTower(-7.8, 6.2, 3.2, 7.2, true);
    addTower(7.8, 6.2, 3.2, 7.2, true);
    addTower(-8.2, -5.8, 3.8, 10.4, true);
    addTower(8.2, -5.8, 3.8, 9.4, false);
    addTower(0, -4.6, 3.4, 13.0, true);

    // Swaying banners
    const banners = [];
    [[-7.8, 11.4, 6.2], [7.8, 11.4, 6.2], [-8.2, 14.6, -5.8], [0, 17.2, -4.6]].forEach(([bx, by, bz], i) => {
        addBox(0.16, 2.2, 0.16, bx, by + 0.8, bz, woodMat, castle);
        const flag = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.75, 0.1), bannerMat);
        flag.position.set(bx + 0.75, by + 1.45, bz);
        castle.add(flag);
        banners.push({ mesh: flag, phase: i * 1.3 });
    });

    // ===== VOXEL PINE FOREST =====
    function addPineTree(x, y, z, scale = 1) {
        const g = new THREE.Group();
        g.position.set(x, y, z);
        addBox(0.65 * scale, 1.9 * scale, 0.65 * scale, 0, 0.95 * scale, 0, woodMat, g);
        addBox(2.7 * scale, 1.5 * scale, 2.7 * scale, 0, 2.2 * scale, 0, leafDarkMat, g);
        addBox(2.1 * scale, 1.4 * scale, 2.1 * scale, 0, 3.4 * scale, 0, leafMidMat, g);
        addBox(1.3 * scale, 1.2 * scale, 1.3 * scale, 0, 4.5 * scale, 0, leafDarkMat, g);
        addBox(0.65 * scale, 0.8 * scale, 0.65 * scale, 0, 5.3 * scale, 0, leafMidMat, g);
        world.add(g);
    }

    [
        [-17.8, 2.0, 2.2, 1.05], [-14.8, 2.0, -6.5, 1.25], [-18.5, 2.0, -10.5, 1.1],
        [-17.5, 2.0, 10.6, 0.95], [14.8, 2.0, 6.2, 1.1], [17.6, 2.0, 1.8, 1.2],
        [15.4, 2.0, -5.8, 1.0], [18.8, 2.0, -9.8, 1.3], [11.8, 2.0, 10.6, 0.88],
        [-8.8, 2.0, 12.6, 0.85], [9.5, 2.0, 12.5, 0.95], [-24, 6.8, -22, 1.4],
        [-29, 6.8, -24, 1.2], [25, 8.8, -26, 1.35], [31, 8.8, -24, 1.15]
    ].forEach(([x, y, z, s]) => addPineTree(x, y, z, s));

    // ===== DYNAMIC 3D LANDMARK BEACONS FOR EACH GAME =====
    const beaconGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
    const gameAnchors = games.map((game, idx) => {
        const pos = new THREE.Vector3(...game.anchor);
        const mat = new THREE.MeshBasicMaterial({ color: 0xe6b462 });
        const beacon = new THREE.Mesh(beaconGeo, mat);
        beacon.position.set(pos.x, pos.y - 0.55, pos.z);
        scene.add(beacon);
        return { id: game.id, game, pos, beacon, mat, phase: idx * 1.1 };
    });

    // ===== PIXEL SUN, MOON, STARS, CLOUDS & EMBERS =====
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xf7df9c });
    const sun = new THREE.Mesh(new THREE.BoxGeometry(6.2, 6.2, 0.7), sunMat);
    scene.add(sun);

    const moonMat = new THREE.MeshBasicMaterial({ color: 0xe9e2cf });
    const moon = new THREE.Mesh(new THREE.BoxGeometry(5.2, 5.2, 0.6), moonMat);
    moon.position.set(-28, 30, -56);
    scene.add(moon);

    const starPositions = [];
    for (let i = 0; i < 140; i++) {
        starPositions.push((Math.random() - 0.5) * 140, 14 + Math.random() * 44, -42 - Math.random() * 40);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xd9dec8, size: 0.45, sizeAttenuation: true, transparent: true, opacity: 1 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    const cloudMat = new THREE.MeshBasicMaterial({ color: 0x262b3d, transparent: true, opacity: 0.78 });
    const clouds = [];
    for (let i = 0; i < 9; i++) {
        const cg = new THREE.Group();
        const w = 5 + Math.floor(Math.random() * 6);
        addBox(w, 1.1, 2.6, 0, 0, 0, cloudMat, cg);
        addBox(w * 0.6, 0.9, 2.2, 0.6, 0.85, 0, cloudMat, cg);
        cg.position.set(-48 + i * 13, 22 + (i % 3) * 3.4, -26 - (i % 4) * 6);
        scene.add(cg);
        clouds.push({ group: cg, speed: 0.35 + (i % 3) * 0.14 });
    }

    const embers = [];
    const emberMat = new THREE.MeshBasicMaterial({ color: 0xeba44a, transparent: true, opacity: 1 });
    const emberGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    for (let i = 0; i < 24; i++) {
        const m = new THREE.Mesh(emberGeo, emberMat);
        m.position.set((Math.random() - 0.5) * 22, 4 + Math.random() * 14, (Math.random() - 0.5) * 14);
        scene.add(m);
        embers.push({ mesh: m, speedY: 0.45 + Math.random() * 0.55, drift: Math.random() * Math.PI * 2 });
    }

    // ===== DAY / NIGHT CYCLE PALETTE =====
    // cycleT: 0.00 = midnight, 0.25 = dawn, 0.50 = midday, 0.75 = sunset
    const SKY_STOPS = [
        { t: 0.00, sky: new THREE.Color(0x131622), cloud: new THREE.Color(0x24293a), hemiSky: new THREE.Color(0x6f83ad), hemiGnd: new THREE.Color(0x1d211b), key: new THREE.Color(0x9cb3da), water: new THREE.Color(0x192533) },
        { t: 0.20, sky: new THREE.Color(0x282940), cloud: new THREE.Color(0x4b4258), hemiSky: new THREE.Color(0x8c7b96), hemiGnd: new THREE.Color(0x25241e), key: new THREE.Color(0xd19478), water: new THREE.Color(0x243140) },
        { t: 0.27, sky: new THREE.Color(0xc28061), cloud: new THREE.Color(0xe3b18e), hemiSky: new THREE.Color(0xe8b490), hemiGnd: new THREE.Color(0x3a3226), key: new THREE.Color(0xf5b378), water: new THREE.Color(0x494b54) },
        { t: 0.40, sky: new THREE.Color(0x7ea5c4), cloud: new THREE.Color(0xe8e5dc), hemiSky: new THREE.Color(0xc8dcf0), hemiGnd: new THREE.Color(0x46523a), key: new THREE.Color(0xfff1d4), water: new THREE.Color(0x375870) },
        { t: 0.58, sky: new THREE.Color(0x7ca2c0), cloud: new THREE.Color(0xe8e4da), hemiSky: new THREE.Color(0xc8dcf0), hemiGnd: new THREE.Color(0x46523a), key: new THREE.Color(0xfff0d0), water: new THREE.Color(0x375870) },
        { t: 0.74, sky: new THREE.Color(0xb0634e), cloud: new THREE.Color(0xd99375), hemiSky: new THREE.Color(0xde9a76), hemiGnd: new THREE.Color(0x352922), key: new THREE.Color(0xf29f61), water: new THREE.Color(0x3d3844) },
        { t: 0.84, sky: new THREE.Color(0x26263b), cloud: new THREE.Color(0x3b384f), hemiSky: new THREE.Color(0x7c7b9e), hemiGnd: new THREE.Color(0x22221e), key: new THREE.Color(0x9fb5dc), water: new THREE.Color(0x1f2b3a) },
        { t: 1.00, sky: new THREE.Color(0x131622), cloud: new THREE.Color(0x24293a), hemiSky: new THREE.Color(0x6f83ad), hemiGnd: new THREE.Color(0x1d211b), key: new THREE.Color(0x9cb3da), water: new THREE.Color(0x192533) }
    ];
    const WIN_DAY = new THREE.Color(0x282b33);
    const WIN_NIGHT = new THREE.Color(0xf2b55b);

    const CYCLE_DURATION_SEC = 72; // Full medieval day-to-night cycle
    const TIME_PRESETS = { day: 0.48, dusk: 0.74, night: 0.96 };
    let timeMode = 'auto'; // 'auto' | 'day' | 'dusk' | 'night'
    let cycleT = 0.70; // Start right before golden dusk so the transition is immediately noticeable

    function sampleStop(t, field, out) {
        for (let i = 0; i < SKY_STOPS.length - 1; i++) {
            const a = SKY_STOPS[i];
            const b = SKY_STOPS[i + 1];
            if (t >= a.t && t <= b.t) {
                const f = (t - a.t) / Math.max(0.0001, b.t - a.t);
                const smooth = f * f * (3 - 2 * f);
                return out.copy(a[field]).lerp(b[field], smooth);
            }
        }
        return out.copy(SKY_STOPS[0][field]);
    }

    function setTimeMode(nextMode) {
        if (nextMode === 'auto' || nextMode in TIME_PRESETS) {
            timeMode = nextMode;
        }
    }

    // ===== PIXELATED RESIZE & RESPONSIVE CAMERA FRAMING =====
    function getOverviewPose() {
        const aspect = window.innerWidth / Math.max(1, window.innerHeight);
        if (aspect < 0.72) {
            // Portrait phone: wider FOV + stepped back + look slightly lower so castle sits above dock
            return {
                fov: 56,
                pos: new THREE.Vector3(0, 18.2, 42.5),
                lookAt: new THREE.Vector3(0, 5.6, -1.0)
            };
        }
        if (aspect < 1.05) {
            // Tablet / square
            return {
                fov: 48,
                pos: new THREE.Vector3(0, 16.8, 38.0),
                lookAt: new THREE.Vector3(0, 7.0, -1.5)
            };
        }
        return {
            fov: 42,
            pos: OVERVIEW.pos.clone(),
            lookAt: OVERVIEW.lookAt.clone()
        };
    }

    function applyFocusPose(item) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const aspect = vw / Math.max(1, vh);
        const isPortrait = aspect < 0.85;
        const isShortLandscape = vh < 520 && aspect >= 1.1;

        const basePos = item.game.camera.pos;
        const baseLook = item.game.camera.lookAt;

        if (isPortrait) {
            // Pull back slightly and lower lookAt so the landmark sits cleanly in upper half above the card
            camera.fov = 52;
            camTargetPos.set(basePos[0] * 1.05, basePos[1] + 1.4, basePos[2] + 6.5);
            camTargetLook.set(baseLook[0], baseLook[1] - 2.6, baseLook[2]);
        } else if (isShortLandscape) {
            // Offset lookAt slightly right so castle sits nicely on the left side opposite the right panel
            camera.fov = 46;
            camTargetPos.set(basePos[0], basePos[1] + 0.6, basePos[2] + 3.0);
            camTargetLook.set(baseLook[0] + 2.2, baseLook[1] - 0.5, baseLook[2]);
        } else {
            camera.fov = 42;
            camTargetPos.set(basePos[0], basePos[1], basePos[2]);
            camTargetLook.set(baseLook[0], baseLook[1], baseLook[2]);
        }
        camera.updateProjectionMatrix();
    }

    function resize() {
        const vw = Math.max(1, window.innerWidth);
        const vh = Math.max(1, window.innerHeight);
        const aspect = vw / vh;
        const targetPixelHeight = vw < 600 ? 290 : 360;
        const rh = Math.min(vh, targetPixelHeight);
        const rw = Math.max(160, Math.round(rh * aspect));
        renderer.setSize(rw, rh, false);
        camera.aspect = aspect;

        if (activeGameId) {
            const item = gameAnchors.find(a => a.id === activeGameId);
            if (item) applyFocusPose(item);
        } else {
            const ov = getOverviewPose();
            camera.fov = ov.fov;
            camTargetPos.copy(ov.pos);
            camTargetLook.copy(ov.lookAt);
            camera.updateProjectionMatrix();
        }
    }
    window.addEventListener('resize', resize);
    resize();
    camCurrentPos.copy(camTargetPos);
    camCurrentLook.copy(camTargetLook);

    // ===== POINTER PARALLAX + TOUCH DRAG PAN =====
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let isTouchDragging = false;
    let touchStartX = 0;
    let touchPanOffset = 0;
    let touchPanTarget = 0;

    window.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        pointer.tx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
        pointer.ty = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    }, { passive: true });

    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isTouchDragging = true;
            touchStartX = e.touches[0].clientX;
        }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (!isTouchDragging || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - touchStartX;
        touchStartX = e.touches[0].clientX;
        touchPanTarget = Math.max(-7, Math.min(7, touchPanTarget - dx * 0.035));
    }, { passive: true });

    window.addEventListener('touchend', () => { isTouchDragging = false; }, { passive: true });

    function focusGame(gameId) {
        const item = gameAnchors.find(a => a.id === gameId);
        if (!item) {
            resetView();
            return;
        }
        activeGameId = gameId;
        touchPanTarget = 0;
        applyFocusPose(item);
    }

    function resetView() {
        activeGameId = null;
        touchPanTarget = 0;
        const ov = getOverviewPose();
        camera.fov = ov.fov;
        camTargetPos.copy(ov.pos);
        camTargetLook.copy(ov.lookAt);
        camera.updateProjectionMatrix();
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clock = new THREE.Clock();
    const projVec = new THREE.Vector3();
    let rafId = null;

    function animate() {
        rafId = requestAnimationFrame(animate);
        if (document.hidden) return;

        const dt = Math.min(0.05, clock.getDelta());
        const t = clock.elapsedTime;

        pointer.x += (pointer.tx - pointer.x) * 0.04;
        pointer.y += (pointer.ty - pointer.y) * 0.04;
        touchPanOffset += (touchPanTarget - touchPanOffset) * 0.08;

        const lerpSpeed = Math.min(1, dt * 3.8);
        camCurrentPos.lerp(camTargetPos, lerpSpeed);
        camCurrentLook.lerp(camTargetLook, lerpSpeed);

        const swayScale = activeGameId ? 0.3 : 1;
        const driftX = reducedMotion ? 0 : Math.sin(t * 0.16) * 2.1 * swayScale;
        camera.position.set(
            camCurrentPos.x + driftX + pointer.x * 2.1 * swayScale + touchPanOffset,
            camCurrentPos.y - pointer.y * 0.85 * swayScale,
            camCurrentPos.z
        );
        camera.lookAt(camCurrentLook);
        camera.updateMatrixWorld();

        // ===== UPDATE DAY / NIGHT CYCLE =====
        if (timeMode === 'auto') {
            if (!reducedMotion) {
                cycleT = (cycleT + dt / CYCLE_DURATION_SEC) % 1;
            }
        } else {
            const targetT = TIME_PRESETS[timeMode];
            let diff = targetT - cycleT;
            if (diff > 0.5) diff -= 1;
            if (diff < -0.5) diff += 1;
            cycleT = (cycleT + diff * Math.min(1, dt * 3.2) + 1) % 1;
        }

        // Sun elevation: -1 at midnight (0), 0 at dawn (0.25)/dusk (0.75), +1 at noon (0.5)
        const sunAngle = (cycleT - 0.25) * Math.PI * 2;
        const sunElev = Math.sin(sunAngle);
        const sunHoriz = Math.cos(sunAngle);
        const dayFactor = Math.max(0, Math.min(1, (sunElev + 0.18) / 0.55));
        const nightFactor = 1 - dayFactor;

        // Orbit pixel Sun & pixel Moon
        sun.position.set(sunHoriz * 52, 6 + sunElev * 36, -58);
        sun.visible = sunElev > -0.22;

        const moonElev = -sunElev;
        const moonHoriz = -sunHoriz;
        moon.position.set(moonHoriz * 48, 6 + moonElev * 34, -56);
        moon.visible = moonElev > -0.22;

        // Sky, fog, clouds, water, hemisphere & directional key light
        sampleStop(cycleT, 'sky', scene.background);
        scene.fog.color.copy(scene.background);
        sampleStop(cycleT, 'cloud', cloudMat.color);
        sampleStop(cycleT, 'hemiSky', hemiLight.color);
        sampleStop(cycleT, 'hemiGnd', hemiLight.groundColor);
        sampleStop(cycleT, 'key', keyLight.color);
        sampleStop(cycleT, 'water', waterMat.color);

        hemiLight.intensity = 0.68 + dayFactor * 0.42;
        keyLight.intensity = 0.72 + dayFactor * 0.68;
        if (sunElev >= 0) {
            keyLight.position.set(sunHoriz * 34, Math.max(8, sunElev * 42), 18);
        } else {
            keyLight.position.set(moonHoriz * 32, Math.max(10, moonElev * 38), 18);
        }

        // Stars, castle windows, torches & embers respond to nightFactor
        starMat.opacity = Math.max(0, Math.min(1, (nightFactor - 0.15) / 0.65));
        stars.visible = starMat.opacity > 0.02;

        windowGlowMat.color.copy(WIN_DAY).lerp(WIN_NIGHT, Math.pow(nightFactor, 0.8));
        emberMat.opacity = Math.max(0, Math.min(0.95, (nightFactor - 0.1) * 1.15));

        const torchesLit = nightFactor > 0.15;
        const torchScale = torchesLit ? 0.15 + nightFactor * 0.95 : 0;
        for (const tr of torches) {
            const flick = reducedMotion ? 0 : (Math.sin(t * 9.5 + tr.phase) * 0.45 + Math.sin(t * 17.3 + tr.phase) * 0.25);
            tr.light.intensity = Math.max(0, (tr.base + flick) * torchScale);
            tr.flame.visible = torchesLit;
            if (!reducedMotion && torchesLit) {
                tr.flame.scale.y = (0.92 + Math.sin(t * 14 + tr.phase) * 0.14) * (0.65 + nightFactor * 0.35);
            }
        }
        const embersVisible = emberMat.opacity > 0.04;
        for (const em of embers) {
            em.mesh.visible = embersVisible;
            if (!reducedMotion) {
                em.mesh.position.y += em.speedY * dt;
                em.mesh.position.x += Math.sin(t * 1.3 + em.drift) * 0.25 * dt;
                if (em.mesh.position.y > 20) {
                    em.mesh.position.y = 4.2;
                    em.mesh.position.x = (Math.random() - 0.5) * 18;
                }
            }
        }

        if (!reducedMotion) {
            for (const b of banners) {
                b.mesh.rotation.y = Math.sin(t * 2.6 + b.phase) * 0.24;
            }
            for (const c of clouds) {
                c.group.position.x += c.speed * dt;
                if (c.group.position.x > 64) c.group.position.x = -64;
            }
            for (const a of gameAnchors) {
                const isSelected = a.id === activeGameId;
                a.beacon.position.y = a.pos.y - 0.55 + Math.sin(t * 2.4 + a.phase) * 0.18;
                a.beacon.rotation.y = t * 0.9 + a.phase;
                const s = isSelected ? 1.35 : 0.95;
                a.beacon.scale.setScalar(s);
                a.mat.color.setHex(isSelected ? 0xf5f1e6 : 0xdba255);
            }
        }

        renderer.render(scene, camera);

        // Project all 6 castle game anchors to live viewport coordinates
        if (onProject) {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const projected = {};
            for (const a of gameAnchors) {
                projVec.copy(a.pos).project(camera);
                const visible = projVec.z >= -1 && projVec.z <= 1;
                const x = (projVec.x * 0.5 + 0.5) * vw;
                const y = (-projVec.y * 0.5 + 0.5) * vh;
                projected[a.id] = { x, y, visible };
            }
            onProject(projected);
        }
    }

    animate();

    return {
        focusGame,
        resetView,
        setTimeMode,
        destroy() {
            if (rafId) cancelAnimationFrame(rafId);
            window.removeEventListener('resize', resize);
            renderer.dispose();
        }
    };
}
