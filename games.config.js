/**
 * Dynamic castle-mapped game registry.
 *
 * Each entry controls BOTH:
 * 1. Where the game lives in the 3D medieval castle (`section`, `anchor`, `camera`).
 * 2. Where the link routes (`localPath` locally vs `vercelUrl` in production).
 */
export const GAMES = [
    {
        id: 'bones',
        title: 'Spooky Bones',
        shortTitle: 'Bones',
        section: 'Bell Spire',
        category: '3d',
        tag: '3D WebGL',
        description: 'Interactive 3D skeleton stage with dance routines, squat challenges, and score cards.',
        videoSrc: 'assets/bones.mp4',
        localPath: './bones/',
        vercelUrl: '',
        anchor: [0, 18.8, -7.1],
        camera: { pos: [4.5, 19.5, 8.5], lookAt: [0, 16.0, -7.1] }
    },
    {
        id: 'splitshift',
        title: 'Splitshift',
        section: 'Grand Keep',
        category: 'puzzle',
        tag: 'Puzzle',
        description: 'Retro CRT 4×4 wrap-around sliding tile puzzle with a shortest-path solver.',
        videoSrc: 'assets/splitshift.mp4',
        localPath: './splitshift/',
        vercelUrl: '',
        anchor: [0, 13.8, 0.9],
        camera: { pos: [0, 13.8, 16.5], lookAt: [0, 11.2, -2.5] }
    },
    {
        id: 'chess2',
        title: 'Chess 2',
        section: 'East War Tower',
        category: 'arcade',
        tag: 'Arcade',
        description: 'Throw pieces onto the board to capture, promote ranks, and unleash king waves.',
        videoSrc: 'assets/chess2.mp4',
        localPath: './chess2/',
        vercelUrl: '',
        anchor: [8.2, 14.5, -8.3],
        camera: { pos: [18.5, 16.5, 6.0], lookAt: [7.8, 12.2, -8.0] }
    },
    {
        id: 'poms',
        title: 'Poms',
        section: 'West Bastion',
        category: 'arcade',
        tag: 'Toy / Speed',
        description: 'Tap or press QWERTYUIOP to summon waves of Pomeranians across five stage lanes.',
        videoSrc: 'assets/poms.mp4',
        localPath: './poms/',
        vercelUrl: '',
        anchor: [-7.8, 12.6, 3.7],
        camera: { pos: [-17.5, 14.0, 15.5], lookAt: [-7.6, 10.0, 3.6] }
    },
    {
        id: 'firewood',
        title: 'Firewood Splitting',
        shortTitle: 'Firewood',
        section: 'Lumber Yard',
        category: '3d',
        tag: '3D Physics',
        description: 'Split oak logs in 3D with timed lumberjack challenges and physics-driven kindling.',
        videoSrc: 'assets/firewood.mp4',
        localPath: './firewood/',
        vercelUrl: '',
        anchor: [-13.6, 4.6, 7.6],
        camera: { pos: [-21.0, 9.2, 19.5], lookAt: [-13.2, 3.4, 7.2] }
    },
    {
        id: 'roadtrip',
        title: 'Road trip',
        section: 'King\'s Drawbridge',
        category: 'arcade',
        tag: 'Arcade',
        description: 'Drop torrents of cars into a passing field of dodging cows without hitting them.',
        videoSrc: 'assets/roadtrip.mp4',
        localPath: './roadtrip/',
        vercelUrl: '',
        anchor: [0, 4.2, 12.6],
        camera: { pos: [7.5, 7.8, 25.5], lookAt: [0, 3.2, 11.5] }
    }
];

export function resolveGameUrl(game) {
    const params = new URLSearchParams(window.location.search);
    const forceLocal = params.get('mode') === 'local';
    const isLocalHost =
        window.location.protocol === 'file:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '';

    const override = params.get(`url_${game.id}`);
    if (override && /^https?:\/\//i.test(override)) {
        return override;
    }

    if (!forceLocal && !isLocalHost && game.vercelUrl && /^https?:\/\//i.test(game.vercelUrl)) {
        return game.vercelUrl;
    }

    return game.localPath;
}
