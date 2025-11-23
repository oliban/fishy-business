const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
let gameState = 'START'; // START, PLAYING, GAMEOVER
let score = 0;
let animationId;
let lastTime = 0;

// Assets
// No images needed for fish anymore!
const assets = {
    background: new Image()
};

assets.background.src = 'assets/background.png';

// Fish Archetypes
const ARCHETYPES = {
    guppy: {
        name: 'Guppy',
        bodyShape: 'round',
        finStyle: 'round',
        hasTeeth: false,
        color: '#ff7675', // Pinkish Red
        baseSpeed: 250, // Buffed from 200
        visionRadius: 150,
        fleeForce: 2,
        aggression: 0,
        scaleRange: [0.5, 0.8],
        texture: 'scales'
    },
    blob: {
        name: 'Blob',
        bodyShape: 'round',
        finStyle: 'round',
        hasTeeth: false,
        color: '#a29bfe', // Purple
        baseSpeed: 240, // Buffed from 180
        visionRadius: 100,
        fleeForce: 1,
        aggression: 0,
        scaleRange: [0.6, 1.0],
        texture: 'mottled'
    },
    piranha: {
        name: 'Piranha',
        bodyShape: 'round',
        finStyle: 'spiky',
        hasTeeth: true,
        color: '#fab1a0', // Orange
        baseSpeed: 300, // Buffed from 220
        visionRadius: 250,
        fleeForce: 1,
        aggression: 1.0, // Buffed from 0.8
        scaleRange: [0.4, 0.7],
        texture: 'spots'
    },
    shark: {
        name: 'Shark',
        bodyShape: 'shark',
        finStyle: 'spiky',
        hasTeeth: true,
        color: '#636e72', // Grey
        baseSpeed: 220, // Buffed from 160
        visionRadius: 600, // Buffed from 400
        fleeForce: 0,
        aggression: 1.0, // Buffed from 0.5
        scaleRange: [1.5, 2.5],
        texture: 'stripes'
    },
    eel: {
        name: 'Eel',
        bodyShape: 'eel',
        finStyle: 'round',
        hasTeeth: true,
        color: '#2ed573', // Green
        baseSpeed: 280, // Buffed from 200
        visionRadius: 250, // Increased from 200
        fleeForce: 4,
        aggression: 0.7, // Increased from 0.5
        scaleRange: [1.0, 1.5]
    },
    angler: {
        name: 'Angler Fish',
        bodyShape: 'angler', // New custom shape
        finStyle: 'spiky',
        hasTeeth: true,
        color: '#2d3436', // Dark Grey/Brown (Realism)
        baseSpeed: 300,
        visionRadius: 400,
        fleeForce: 4,
        aggression: 0.9,
        scaleRange: [1.2, 2.5],
        special: 'lure',
        lureRadius: 300,
        texture: 'scales' // Added texture
    },
    octopus: {
        name: 'Octopus',
        bodyShape: 'octopus',
        finStyle: 'round',
        hasTeeth: true, // Beak
        color: '#ff4757', // Red/Pink
        baseSpeed: 320, // Buffed from 260
        visionRadius: 300,
        fleeForce: 3,
        aggression: 0.6,
        scaleRange: [1.0, 2.0],
        special: 'ink',
        inkCooldown: 2.0 // Seconds (Automatic)
    },
    turtle: {
        name: 'Turtle',
        bodyShape: 'turtle',
        finStyle: 'round',
        hasTeeth: false,
        color: '#20bf6b', // Green
        baseSpeed: 250, // Buffed from 200
        visionRadius: 200,
        fleeForce: 2,
        aggression: 0.2, // Peaceful
        scaleRange: [1.5, 2.5],
        texture: 'hexagons'
    },
    catfish: {
        name: 'Catfish',
        bodyShape: 'catfish',
        finStyle: 'round',
        hasTeeth: false,
        color: '#e1b12c', // Mustard
        baseSpeed: 225, // Reduced from 280 (20% slower)
        visionRadius: 300,
        fleeForce: 3,
        aggression: 0.4,
        scaleRange: [0.8, 1.5],
        special: 'stealth',
        texture: 'mottled'
    },
    diver: {
        name: 'Diver',
        bodyShape: 'diver',
        finStyle: 'none',
        hasTeeth: false,
        color: '#0984e3', // Blue suit
        baseSpeed: 80, // Buffed from 50
        visionRadius: 100,
        fleeForce: 0,
        aggression: 0,
        scaleRange: [1.0, 1.0], // Fixed size
        special: 'sink'
    },
    submarine: {
        name: 'Submarine',
        bodyShape: 'submarine',
        finStyle: 'none',
        hasTeeth: false,
        color: '#2d3436', // Dark Grey
        baseSpeed: 150, // Buffed from 100
        visionRadius: 600,
        fleeForce: 0,
        aggression: 1.0,
        scaleRange: [2.0, 2.0], // Big
        special: 'torpedo'
    }
};

// Procedural Drawing Helper
// Helper for deterministic randomness
function seededRandom(seed) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

function drawProceduralFish(ctx, x, y, width, height, color, angle, time, config, jawOpen = 0, id = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Tail Animation
    const tailWag = Math.sin(time * 10) * 0.2;

    // 1. Draw Tail (Common for most, specific for Eel)
    // SKIP for Diver and Submarine
    if (config.bodyShape !== 'diver' && config.bodyShape !== 'submarine') {
        ctx.fillStyle = color;
        ctx.beginPath();
        if (config.bodyShape === 'eel') {
            ctx.moveTo(-width * 0.4, 0);
            ctx.quadraticCurveTo(-width * 0.9, tailWag * 30, -width * 1.2, tailWag * 10);
            ctx.lineTo(-width * 1.2, tailWag * 10 + height * 0.3);
            ctx.quadraticCurveTo(-width * 0.9, tailWag * 30 + height * 0.3, -width * 0.4, height * 0.3);
        } else {
            ctx.moveTo(-width * 0.3, 0);
            ctx.lineTo(-width * 0.8, -height * 0.5 + tailWag * 20);
            ctx.lineTo(-width * 0.8, height * 0.5 + tailWag * 20);
        }
        ctx.fill();
    }

    // 2. Draw Body & Jaws
    if (config.bodyShape === 'shark') {
        // --- REALISTIC SHARK MODEL (REFINED V2) ---

        // 1. Body (Fusiform Shape - EVEN BIGGER HEAD)
        const noseX = width * 0.65; // Massive head
        const tailBaseX = -width * 0.4;
        const bodyTopY = -height * 0.5; // Thicker top
        const bodyBottomY = height * 0.5; // Thicker bottom

        // Gradient (Shared with fins for seamless look)
        const grd = ctx.createLinearGradient(0, -height * 0.6, 0, height * 0.6);
        grd.addColorStop(0, '#2d3436');
        grd.addColorStop(0.4, config.color);
        grd.addColorStop(1, '#b2bec3');

        ctx.fillStyle = grd;

        // Draw Body AND Dorsal Fin in one path for perfect connection
        ctx.beginPath();
        ctx.moveTo(noseX, 0);

        // Top contour to Fin Base Front
        // Control point pushed forward for bulky head
        ctx.quadraticCurveTo(width * 0.3, bodyTopY, width * 0.1, -height * 0.4);

        // DORSAL FIN (Integrated)
        // Up to tip
        ctx.quadraticCurveTo(0, -height * 1.0, -width * 0.15, -height * 0.9);
        // Down to back base
        ctx.quadraticCurveTo(-width * 0.05, -height * 0.45, -width * 0.15, -height * 0.35);

        // Continue Top contour to tail
        ctx.quadraticCurveTo(-width * 0.3, -height * 0.2, tailBaseX, -height * 0.15);

        // Tail base
        ctx.lineTo(tailBaseX, height * 0.15);

        // Bottom contour
        ctx.quadraticCurveTo(width * 0.3, bodyBottomY, noseX, 0);
        ctx.fill();

        // 2. Tail (Heterocercal)
        const tailTipX = -width * 0.9;
        const tailTopY = -height * 0.7;
        const tailBottomY = height * 0.5;

        ctx.save();
        ctx.translate(tailBaseX, 0);
        ctx.rotate(tailWag * 0.5);
        ctx.fillStyle = config.color; // Tail can be solid or gradient? Let's stick to solid for now to avoid complex gradient rotation
        ctx.beginPath();
        ctx.moveTo(0, -height * 0.15);
        ctx.quadraticCurveTo(-width * 0.2, -height * 0.5, tailTipX - tailBaseX, tailTopY);
        ctx.lineTo((tailTipX - tailBaseX) * 0.8, 0);
        ctx.lineTo((tailTipX - tailBaseX) * 0.7, tailBottomY);
        ctx.quadraticCurveTo(-width * 0.1, height * 0.3, 0, height * 0.15);
        ctx.fill();
        ctx.restore();

        // 3. Fins - ONLY DORSAL (Already drawn)
        // REMOVED Pectoral and Pelvic fins

        // 4. Gills
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const gx = width * 0.15 - (i * width * 0.035); // Moved forward with head
            ctx.beginPath();
            ctx.moveTo(gx, -height * 0.15);
            ctx.quadraticCurveTo(gx - 3, 0, gx, height * 0.15);
            ctx.stroke();
        }

        // Textures
        drawTexture(ctx, config.texture, width, height, 'rgba(0,0,0,0.1)');

        // 5. Jaw & Teeth (BIGGER & WIDER OPENING)
        const hingeX = width * 0.15; // Moved forward
        const hingeY = height * 0.2;
        const jawLength = width * 0.45; // Even longer
        const jawAngle = jawOpen * 1.0; // WIDE OPEN (was 0.6)

        // Mouth Interior (Dark Red - Throat Hole)
        if (jawOpen > 0.05) {
            ctx.fillStyle = '#2d0a0a'; // Very dark red
            ctx.beginPath();
            // Draw a small ellipse for the throat, slightly behind the hinge
            ctx.ellipse(hingeX + width * 0.05, hingeY, width * 0.08, height * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Lower Jaw
        ctx.save();
        ctx.translate(hingeX, hingeY);
        ctx.rotate(jawAngle);
        ctx.fillStyle = '#b2bec3';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(jawLength * 0.5, height * 0.15, jawLength, 0);
        ctx.lineTo(jawLength * 0.8, height * 0.2);
        ctx.quadraticCurveTo(jawLength * 0.2, height * 0.25, 0, height * 0.1);
        ctx.fill();

        // Lower Teeth (BIGGER & CONNECTED)
        if (config.hasTeeth && jawOpen > 0.1) {
            ctx.fillStyle = 'white';
            for (let i = 0; i < 4; i++) {
                const tx = jawLength * 0.25 + (i * jawLength * 0.18);
                ctx.beginPath();
                // Start slightly BELOW the jaw line (y=0) to ensure connection
                ctx.moveTo(tx, 2);
                ctx.lineTo(tx + 4, -16); // Point Up
                ctx.lineTo(tx + 8, 2);
                ctx.fill();
            }
        }
        ctx.restore();

        // Upper Teeth (BIGGER & CONNECTED)
        if (config.hasTeeth && jawOpen > 0.1) {
            ctx.fillStyle = 'white';
            for (let i = 0; i < 4; i++) {
                const tx = width * 0.25 + (i * width * 0.08);
                const ty = height * 0.1;
                ctx.beginPath();
                // Start slightly ABOVE the gum line to ensure connection
                ctx.moveTo(tx, ty - 2);
                ctx.lineTo(tx + 4, ty + 16); // Point Down
                ctx.lineTo(tx + 8, ty - 2);
                ctx.fill();
            }
        }

    } else if (config.bodyShape === 'round') {
        // Round Body
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, 0, width * 0.4, height * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Textures
        drawTexture(ctx, config.texture, width, height, color);

        // Mouth (Animated)
        // REMOVED dark inside to prevent artifacts
        // ctx.fillStyle = '#330000';
        // ctx.beginPath();
        // ctx.arc(0, 0, width * 0.35, 0, Math.PI * 2);
        // ctx.fill();

        // Draw Body (Pacman)
        ctx.fillStyle = color;
        const mouthAngle = jawOpen * 0.8; // Wider opening (was 0.5)

        ctx.beginPath();
        // Arc from mouth top to mouth bottom (counter-clockwise)
        ctx.arc(0, 0, width * 0.4, mouthAngle, Math.PI * 2 - mouthAngle, false);
        ctx.lineTo(0, 0); // Center
        ctx.fill();

        // Teeth (Piranha)
        if (config.hasTeeth && jawOpen > 0) {
            ctx.fillStyle = 'white';
            // Top Tooth
            ctx.beginPath();
            ctx.moveTo(width * 0.2, -width * 0.1);
            ctx.lineTo(width * 0.25, 0);
            ctx.lineTo(width * 0.3, -width * 0.15);
            ctx.fill();
            // Bottom Tooth
            ctx.beginPath();
            ctx.moveTo(width * 0.2, width * 0.1);
            ctx.lineTo(width * 0.25, 0);
            ctx.lineTo(width * 0.3, width * 0.15);
            ctx.fill();
        }

    } else if (config.bodyShape === 'octopus') {
        // --- OCTOPUS ---
        // Draw Head (Round)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, -height * 0.2, width * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Textures
        // drawTexture(ctx, 'spots', width, height, color);

        // Draw Tentacles
        const tentacleCount = 8;
        ctx.strokeStyle = color;
        ctx.lineWidth = width * 0.08;
        ctx.lineCap = 'round';

        for (let i = 0; i < tentacleCount; i++) {
            const angleOffset = (i / tentacleCount) * Math.PI; // Spread downwards
            const wave = Math.sin(time * 5 + i) * (width * 0.1); // Wavy movement

            ctx.beginPath();
            ctx.moveTo(0, 0);
            // Quadratic curve for tentacle
            const tx = Math.cos(angleOffset + Math.PI / 2) * width * 0.6 + wave;
            const ty = Math.sin(angleOffset + Math.PI / 2) * height * 0.6;
            ctx.quadraticCurveTo(tx * 0.5 + wave, ty * 0.5, tx, ty);
            ctx.stroke();
        }

    } else if (config.bodyShape === 'turtle') {
        // --- TURTLE ---
        // Shell
        ctx.fillStyle = '#27ae60'; // Darker Green Shell
        ctx.beginPath();
        ctx.ellipse(0, 0, width * 0.45, height * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Textures (Shell Pattern)
        // drawTexture(ctx, 'hexagons', width, height, '#2ecc71');

        // Head
        ctx.fillStyle = '#badc58'; // Light Green Skin
        ctx.beginPath();
        ctx.arc(width * 0.5, -height * 0.1, width * 0.15, 0, Math.PI * 2);
        ctx.fill();

        // Flippers (Animated)
        const flipperAngle = Math.sin(time * 3) * 0.3;

        // Front Flippers
        ctx.save();
        ctx.translate(width * 0.2, -height * 0.3);
        ctx.rotate(-0.5 + flipperAngle);
        ctx.fillStyle = '#badc58';
        ctx.beginPath();
        ctx.ellipse(0, 0, width * 0.15, height * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(width * 0.2, height * 0.3);
        ctx.rotate(0.5 - flipperAngle);
        ctx.fillStyle = '#badc58';
        ctx.beginPath();
        ctx.ellipse(0, 0, width * 0.15, height * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

    } else if (config.bodyShape === 'catfish') {
        // --- CATFISH (REFINED) ---
        // 1. Body (Tadpole/Teardrop shape)
        const headX = width * 0.2;
        const tailX = -width * 0.5;

        // Gradient for smooth look
        const grd = ctx.createLinearGradient(0, -height / 2, 0, height / 2);
        grd.addColorStop(0, '#e1b12c'); // Base
        grd.addColorStop(1, '#cd6133'); // Darker belly

        ctx.fillStyle = grd;
        ctx.beginPath();
        // Head (Broad and flat)
        ctx.moveTo(headX, -height * 0.2);
        ctx.quadraticCurveTo(width * 0.5, 0, headX, height * 0.2); // Snout
        // Bottom contour
        ctx.quadraticCurveTo(0, height * 0.4, tailX, height * 0.1);
        // Tail base
        ctx.lineTo(tailX, -height * 0.1);
        // Top contour
        ctx.quadraticCurveTo(0, -height * 0.4, headX, -height * 0.2);
        ctx.fill();

        // 2. Textures (Mottled spots)
        drawTexture(ctx, config.texture, width, height, 'rgba(0,0,0,0.1)');

        // 3. Whiskers (Barbels) - Long and flowing
        ctx.strokeStyle = '#2d3436';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        // Dynamic whisker movement
        const whiskerWave = Math.sin(time * 4) * 10;

        ctx.beginPath();
        // Left Whisker (Long)
        ctx.moveTo(headX, -height * 0.1);
        ctx.bezierCurveTo(
            headX + 20, -height * 0.5,
            headX + 40, -height * 0.8 + whiskerWave,
            headX + 60, -height * 0.6 + whiskerWave
        );
        ctx.stroke();

        // Right Whisker (Long)
        ctx.beginPath();
        ctx.moveTo(headX, height * 0.1);
        ctx.bezierCurveTo(
            headX + 20, height * 0.5,
            headX + 40, height * 0.8 + whiskerWave,
            headX + 60, height * 0.6 + whiskerWave
        );
        ctx.stroke();

        // Short whiskers (inner)
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(headX + 5, -height * 0.05);
        ctx.quadraticCurveTo(headX + 15, -height * 0.2, headX + 25, -height * 0.15);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(headX + 5, height * 0.05);
        ctx.quadraticCurveTo(headX + 15, height * 0.2, headX + 25, height * 0.15);
        ctx.stroke();

        // 4. Eyes (Small, wide set)
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(headX - width * 0.1, -height * 0.15, 3, 0, Math.PI * 2); // Left
        ctx.arc(headX - width * 0.1, height * 0.15, 3, 0, Math.PI * 2); // Right
        ctx.fill();

    } else if (config.bodyShape === 'diver') {
        // --- DIVER ---
        // Rotated to face down mostly? No, they sink.
        // Head
        ctx.fillStyle = '#ffeaa7'; // Skin
        ctx.beginPath();
        ctx.arc(0, -height * 0.3, width * 0.15, 0, Math.PI * 2);
        ctx.fill();
        // Mask
        ctx.fillStyle = '#74b9ff';
        ctx.beginPath();
        ctx.rect(-width * 0.05, -height * 0.35, width * 0.1, height * 0.1);
        ctx.fill();
        // Body
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, width * 0.1, width * 0.2, height * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Arms
        ctx.strokeStyle = color;
        ctx.lineWidth = width * 0.1;
        ctx.beginPath();
        ctx.moveTo(-width * 0.2, -height * 0.1);
        ctx.lineTo(-width * 0.4, height * 0.1);
        ctx.moveTo(width * 0.2, -height * 0.1);
        ctx.lineTo(width * 0.4, height * 0.1);
        ctx.stroke();
        // Flippers
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(-width * 0.1, height * 0.4);
        ctx.lineTo(-width * 0.3, height * 0.8);
        ctx.lineTo(0, height * 0.7);
        ctx.lineTo(width * 0.3, height * 0.8);
        ctx.lineTo(width * 0.1, height * 0.4);
        ctx.fill();

    } else if (config.bodyShape === 'angler') {
        // --- ANGLERFISH (NIGHTMARE OVERHAUL - EXAGGERATED) ---
        // 1. Body (Lumpy, Blobby, Tapering)
        ctx.fillStyle = color;
        ctx.beginPath();
        // Start at nose (Upper Lip)
        const noseX = width * 0.4;
        const noseY = -height * 0.15;
        ctx.moveTo(noseX, noseY);

        // Top head (HUGE Hump)
        ctx.bezierCurveTo(width * 0.2, -height * 0.9, -width * 0.2, -height * 1.0, -width * 0.5, -height * 0.2);

        // Tail base (Narrow)
        ctx.lineTo(-width * 0.7, 0);
        ctx.lineTo(-width * 0.5, height * 0.2);

        // Belly (Sagging and distended)
        // Extend belly PAST the hinge to cover it (Throat)
        const throatX = -width * 0.05; // Moved left
        const throatY = height * 0.25;
        ctx.bezierCurveTo(-width * 0.2, height * 0.9, width * 0.1, height * 0.8, throatX, throatY);

        // Mouth Roof (The Upper Jaw Line) - Curve back to nose
        // Control point for the roof
        const roofCpX = width * 0.2;
        const roofCpY = -height * 0.05;
        ctx.quadraticCurveTo(roofCpX, roofCpY, noseX, noseY);

        ctx.fill();

        // 2. Textures (Subtle Skin Blemishes)
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        for (let i = 0; i < 8; i++) {
            // Use seeded random for consistent warts
            const r1 = seededRandom(id + i * 10);
            const r2 = seededRandom(id + i * 10 + 1);
            const r3 = seededRandom(id + i * 10 + 2);

            const lx = (r1 - 0.5) * width * 0.6;
            const ly = (r2 - 0.5) * height * 0.6;
            const lSize = r3 * width * 0.06 + 2;
            ctx.beginPath();
            ctx.arc(lx, ly, lSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Upper Lip Line (Visual connection for teeth)
        ctx.strokeStyle = '#1e272e'; // Darker line
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(noseX, noseY);
        // Hinge is now "inside", so we curve towards the throat/hinge area
        // Let's define the Hinge slightly inside/above the throat
        const hingeX = -width * 0.05; // Moved left to match throat
        const hingeY = height * 0.15;

        ctx.quadraticCurveTo(roofCpX, roofCpY, hingeX, hingeY);
        ctx.stroke();

        // 3. The Lure (Illicium)
        const lureStartX = width * 0.2; // Forehead
        const lureStartY = -height * 0.5; // Lower down to sink into the head
        const lureEndX = width * 0.7;
        const lureEndY = -height * 1.0;

        // Stalk (Thin, wire-like)
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lureStartX, lureStartY);
        // S-curve for organic feel
        ctx.bezierCurveTo(width * 0.25, -height * 1.2, width * 0.6, -height * 0.8, lureEndX, lureEndY);
        ctx.stroke();

        // Bulb (Esca)
        const glowRadius = width * 1.2 + Math.sin(time * 3) * 15;
        const glow = ctx.createRadialGradient(lureEndX, lureEndY, 2, lureEndX, lureEndY, glowRadius);
        glow.addColorStop(0, 'rgba(220, 255, 255, 1.0)');
        glow.addColorStop(0.3, 'rgba(0, 200, 255, 0.3)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(lureEndX, lureEndY, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(lureEndX, lureEndY, width * 0.06, 0, Math.PI * 2);
        ctx.fill();

        // 4. Jaw & Teeth (Chaotic Needles)
        const jawAngle = 0.3 + jawOpen * 0.6;

        // Lower Jaw (Huge, heavy bone)
        ctx.save();
        ctx.translate(hingeX, hingeY); // Pivot from INSIDE the body
        ctx.rotate(jawAngle);
        ctx.fillStyle = color;
        ctx.beginPath();
        // Start well behind the hinge to ensure overlap
        ctx.moveTo(-width * 0.1, -height * 0.1);
        // Heavy chin
        ctx.quadraticCurveTo(width * 0.3, height * 0.6, width * 0.7, -height * 0.1);
        // Gum line (Uneven)
        ctx.lineTo(width * 0.5, 0);
        ctx.quadraticCurveTo(width * 0.25, height * 0.1, 0, 0);
        ctx.fill();

        // Lower Teeth (Chaotic, Long, Needle-like)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        for (let i = 0; i < 8; i++) {
            const t = i / 7;
            const tx = width * 0.05 + t * (width * 0.6);
            const ty = Math.sin(t * Math.PI) * (height * 0.05);

            // EXAGGERATED CHAOS - SEEDED
            const r1 = seededRandom(id + i * 20);
            const r2 = seededRandom(id + i * 20 + 1);

            const len = height * 0.35 + r1 * height * 0.25;
            const angleVar = (r2 - 0.5) * 0.8; // More tilt

            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx + Math.sin(angleVar) * 15, ty - len);
            ctx.lineTo(tx - 3, ty); // Back to base
            ctx.fill();
        }
        ctx.restore();

        // Upper Teeth (Chaotic & Aligned)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        for (let i = 0; i < 7; i++) {
            // Interpolate along the mouth roof curve using Quadratic Bezier formula
            // P(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
            // We want teeth from nose (t=1) to throat (t=0) or vice versa.
            // Let's go from nose back to throat to match index direction
            const T = 1 - (i / 6);
            const invT = 1 - T;

            const tx = (invT * invT * hingeX) + (2 * invT * T * roofCpX) + (T * T * noseX);
            const ty = (invT * invT * hingeY) + (2 * invT * T * roofCpY) + (T * T * noseY);

            // SEEDED CHAOS
            const r1 = seededRandom(id + i * 30);
            const r2 = seededRandom(id + i * 30 + 1);

            const len = height * 0.3 + r1 * height * 0.2;
            const angleVar = (r2 - 0.5) * 0.5;

            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx + Math.sin(angleVar) * 10, ty + len);
            ctx.lineTo(tx - 3, ty - 2);
            ctx.fill();
        }

        // 5. Eyes (Tiny, milky, barely visible)
        ctx.fillStyle = '#95a5a6';
        ctx.beginPath();
        ctx.arc(width * 0.15, -height * 0.3, width * 0.03, 0, Math.PI * 2);
        ctx.fill();

    } else if (config.bodyShape === 'submarine') {
        // --- SUBMARINE ---
        // Main Hull
        ctx.beginPath();
        ctx.ellipse(0, 0, width * 0.6, height * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        // Conning Tower
        ctx.fillStyle = '#636e72';
        ctx.beginPath();
        ctx.rect(-width * 0.2, -height * 0.4, width * 0.2, height * 0.2);
        ctx.fill();
        // Periscope
        ctx.fillStyle = '#2d3436';
        ctx.beginPath();
        ctx.rect(-width * 0.15, -height * 0.6, width * 0.05, height * 0.2);
        ctx.rect(-width * 0.2, -height * 0.6, width * 0.1, width * 0.05);
        ctx.fill();
        // Propeller
        ctx.fillStyle = '#b2bec3';
        ctx.beginPath();
        ctx.rect(-width * 0.65, -height * 0.1, width * 0.1, height * 0.2);
        ctx.fill();

    } else {
        // --- GENERIC (OVAL/EEL) ---
        // Simple ellipse body
        ctx.fillStyle = color;
        ctx.beginPath();
        if (config.bodyShape === 'eel') {
            ctx.ellipse(0, 0, width * 0.6, height * 0.25, 0, 0, Math.PI * 2);
        } else {
            ctx.ellipse(0, 0, width * 0.5, height * 0.4, 0, 0, Math.PI * 2);
        }
        ctx.fill();

        // Simple Mouth (Black Circle scaled)
        // REMOVED to prevent artifacts
        // if (jawOpen > 0) {
        //     ctx.fillStyle = 'black';
        //     ctx.beginPath();
        //     ctx.arc(width * 0.4, 0, width * 0.1 * jawOpen, 0, Math.PI * 2);
        //     ctx.fill();
        // }
    }

    // 3. Fins (Generic, skip for Shark as it has custom)
    // SKIP for Diver and Submarine
    if (config.bodyShape !== 'shark' && config.bodyShape !== 'diver' && config.bodyShape !== 'submarine') {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -height * 0.3);
        if (config.finStyle === 'spiky') {
            ctx.lineTo(width * 0.1, -height * 0.7);
            ctx.lineTo(width * 0.2, -height * 0.3);
        } else {
            ctx.quadraticCurveTo(-width * 0.2, -height * 0.6, width * 0.1, -height * 0.3);
        }
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, height * 0.3);
        if (config.finStyle === 'spiky') {
            ctx.lineTo(width * 0.1, height * 0.7);
            ctx.lineTo(width * 0.2, height * 0.3);
        } else {
            ctx.quadraticCurveTo(-width * 0.2, height * 0.6, width * 0.1, height * 0.3);
        }
        ctx.fill();
    }

    // 4. Eyes
    // SKIP for Diver and Submarine
    if (config.bodyShape !== 'diver' && config.bodyShape !== 'submarine') {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        let eyeX = width * 0.2;
        let eyeY = -height * 0.15;

        if (config.bodyShape === 'shark') { eyeX = width * 0.25; eyeY = -height * 0.15; }
        if (config.bodyShape === 'round') { eyeX = width * 0.1; eyeY = -height * 0.2; }

        ctx.arc(eyeX, eyeY, width * 0.08, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(eyeX + width * 0.03, eyeY, width * 0.03, 0, Math.PI * 2);
        ctx.fill();

        // Angry Eyebrow
        if (config.aggression > 0.5) {
            ctx.strokeStyle = config.color;
            ctx.lineWidth = width * 0.05;
            ctx.beginPath();
            ctx.moveTo(eyeX - width * 0.1, eyeY - width * 0.08);
            ctx.lineTo(eyeX + width * 0.1, eyeY + width * 0.02);
            ctx.stroke();
        }
    }

    // Angler Lure (Generic fallback, skip for custom Angler body)
    if (config.special === 'lure' && config.bodyShape !== 'angler') {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Stalk
        ctx.moveTo(0, -height * 0.4);
        ctx.quadraticCurveTo(width * 0.5, -height * 0.8, width * 0.8, -height * 0.4);
        ctx.stroke();

        // Light Bulb
        ctx.fillStyle = '#feca57'; // Yellow/Gold
        ctx.shadowColor = '#feca57';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(width * 0.8, -height * 0.4, width * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
    }

    ctx.restore();
}



// Game Objects
class Fish {
    constructor(x, y, width, height, config, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.config = config; // Store archetype config
        this.color = config.color;
        this.speed = config.baseSpeed;
        this.type = type; // 'player' or 'enemy'

        this.markedForDeletion = false;
        this.hasEaten = false;

        // Physics
        this.vx = 0;
        this.vy = 0;
        this.ax = 0;
        this.ay = 0;
        this.maxSpeed = this.speed * 1.5;
        this.maxForce = 1500;

        // AI Stats from Config
        this.visionRadius = config.visionRadius || 300;
        this.fleeForce = config.fleeForce || 5;
        this.aggression = config.aggression || 0;

        this.wanderAngle = 0;
        this.facingRight = true;
        this.time = Math.random() * 100;
        this.jawOpen = 0;
    }

    draw() {
        // Calculate angle based on movement
        let angle = 0;
        if (this.vy !== 0 || this.vx !== 0) {
            // Simple tilt
            angle = this.vy * 0.002;
        }

        // Flip context if facing left
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // BURP ANIMATION (Shudder + Open Mouth)
        let drawJawOpen = this.jawOpen;
        if (this.burpTimer > 0) {
            // Shudder Effect
            const shudderAmount = 5;
            ctx.translate((Math.random() - 0.5) * shudderAmount, (Math.random() - 0.5) * shudderAmount);

            // Force Mouth Open
            drawJawOpen = 1.0;
        }

        if (!this.facingRight) {
            ctx.scale(-1, 1);
        }

        // Apply Alpha (for Stealth)
        ctx.globalAlpha = this.alpha !== undefined ? this.alpha : 1.0;

        // Vulnerability Glow
        if (this.isVulnerable) {
            ctx.shadowBlur = 20 + Math.sin(this.time * 10) * 10;
            ctx.shadowColor = '#ff0000'; // Red warning glow
        } else {
            ctx.shadowBlur = 0;
        }

        // Catfish Visuals
        if (this.config.special === 'stealth') {
            // Charging/Ready Effect (Ring)
            if (this.boostCharge > 0) {
                const maxCharge = 3.0;
                const progress = this.boostCharge / maxCharge;

                ctx.beginPath();
                ctx.arc(0, 0, this.width * 0.6 + Math.sin(this.time * 10) * 2, 0, Math.PI * 2);
                // Gold when full, White when charging
                ctx.strokeStyle = progress >= 0.95 ? `rgba(255, 215, 0, 0.8)` : `rgba(255, 255, 255, 0.5)`;
                ctx.lineWidth = 2 + progress * 3;

                // Draw partial ring for progress
                ctx.beginPath();
                ctx.arc(0, 0, this.width * 0.65, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress));
                ctx.stroke();

                // Text timer
                ctx.fillStyle = 'white';
                ctx.font = '12px Arial';
                if (progress >= 0.99) {
                    ctx.fillStyle = '#e1b12c';
                    ctx.fillText("MAX", -12, -this.height * 0.7);
                } else {
                    ctx.fillText(this.boostCharge.toFixed(1), -10, -this.height * 0.7);
                }
            }

            // Boost Effect (Speed Lines) - Only when moving and using charge
            const speed = Math.hypot(this.vx, this.vy);
            if (this.boostCharge > 0 && speed > 10) {
                // Speed lines / Trail
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#e1b12c'; // Gold glow

                ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
                ctx.lineWidth = 3;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(-this.width * 0.6 - i * 10, -this.height * 0.2 + i * 10);
                    ctx.lineTo(-this.width * 1.2 - i * 20, -this.height * 0.2 + i * 10);
                    ctx.stroke();
                }
            }
        }

        // Draw fish at 0,0 in local space
        drawProceduralFish(ctx, 0, 0, this.width, this.height, this.color, angle, this.time, this.config, drawJawOpen);

        ctx.restore();
    }

    update(deltaTime) {
        // Apply Physics
        this.vx += this.ax * deltaTime;
        this.vy += this.ay * deltaTime;

        // Limit speed
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Reset acceleration
        this.ax = 0;
        this.ay = 0;

        this.time += deltaTime;
    }

    applyForce(fx, fy) {
        this.ax += fx;
        this.ay += fy;
    }

    seek(targetX, targetY) {
        const dx = targetX - (this.x + this.width / 2);
        const dy = targetY - (this.y + this.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            const desiredVx = (dx / dist) * this.maxSpeed;
            const desiredVy = (dy / dist) * this.maxSpeed;

            const steerX = desiredVx - this.vx;
            const steerY = desiredVy - this.vy;

            // Limit force is handled by maxForce/mass implicitly, but let's just add it
            this.applyForce(steerX * 5, steerY * 5); // Multiplier for snappiness
        }
    }

    pursue(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const predictionTime = dist / this.maxSpeed;

        const futureX = target.x + target.vx * predictionTime;
        const futureY = target.y + target.vy * predictionTime;

        // Open jaw if close to target!
        if (dist < 150) { // Reverted to 150
            this.jawOpen += 0.2; // Faster opening
        } else {
            this.jawOpen -= 0.1;
        }
        this.jawOpen = Math.max(0, Math.min(1, this.jawOpen));

        this.seek(futureX, futureY);
    }

    flee(targetX, targetY) {
        const dx = targetX - (this.x + this.width / 2);
        const dy = targetY - (this.y + this.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Close jaw when fleeing
        this.jawOpen -= 0.1;
        this.jawOpen = Math.max(0, Math.min(1, this.jawOpen));

        if (dist > 0 && dist < this.visionRadius) {
            const desiredVx = -(dx / dist) * this.maxSpeed; // Reverse direction
            const desiredVy = -(dy / dist) * this.maxSpeed;

            const steerX = desiredVx - this.vx;
            const steerY = desiredVy - this.vy;

            this.applyForce(steerX * this.fleeForce, steerY * this.fleeForce);
        }
    }

    wander(deltaTime) {
        // Close jaw when wandering
        this.jawOpen -= 0.05;
        this.jawOpen = Math.max(0, Math.min(1, this.jawOpen));

        // Randomly change wander angle
        this.wanderAngle += (Math.random() - 0.5) * 5 * deltaTime;

        const circleDist = 100;
        const circleRadius = 50;

        // Project a circle in front of velocity
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const headingX = speed > 0 ? this.vx / speed : 1;
        const headingY = speed > 0 ? this.vy / speed : 0;

        const circleX = this.x + headingX * circleDist;
        const circleY = this.y + headingY * circleDist;

        const targetX = circleX + Math.cos(this.wanderAngle) * circleRadius;
        const targetY = circleY + Math.sin(this.wanderAngle) * circleRadius;

        this.seek(targetX, targetY);
    }

    grow(preySize) {
        // Proportional growth: Grow more if eating something close to your size
        // Base growth factor
        const growthFactor = preySize / this.width;
        const amount = growthFactor * 5; // Tuning constant

        this.width += amount;
        this.height += amount * 0.7; // Maintain aspect ratio roughly
        this.maxSpeed = Math.max(50, this.maxSpeed * 0.98);
        this.hasEaten = true; // Mark as a survivor/hunter

        if (this.type === 'player') {
            this.fishEaten = (this.fishEaten || 0) + 1;
        }
    }

    getBounds() {
        const padding = this.width * 0.2;
        return {
            left: this.x + padding,
            right: this.x + this.width - padding,
            top: this.y + padding,
            bottom: this.y + this.height - padding
        };
    }
}

class Player extends Fish {
    constructor(archetypeKey = 'shark', controls = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }, playerId = 1) {
        // Player Config
        let baseConfig = ARCHETYPES[archetypeKey];
        console.log('Player constructor. Archetype:', archetypeKey);
        console.log('Base Config:', JSON.stringify(baseConfig));

        // SAFETY CHECK: If archetype is invalid (e.g. typo or missing), fallback to shark
        if (!baseConfig) {
            console.error(`Invalid archetype '${archetypeKey}', falling back to shark.`);
            baseConfig = ARCHETYPES['shark'];
        }

        // Customize player stats slightly (buffs)
        const playerConfig = {
            ...baseConfig,
            name: `Player ${playerId}`,
            visionRadius: 500, // Better vision
            aggression: 1
        };
        console.log('Player Config constructed:', JSON.stringify(playerConfig));

        // Adjust speed for player control feel
        if (archetypeKey === 'shark') playerConfig.baseSpeed = 450; // Buffed from 350
        if (archetypeKey === 'angler') playerConfig.baseSpeed = 350; // Buffed from 280

        // Spawn positions for 2P
        let startX = canvas.width / 2;
        if (playerId === 1) startX -= 100;
        if (playerId === 2) startX += 100;

        super(startX, canvas.height / 2, 60, 40, playerConfig, 'player');

        this.controls = controls;
        this.playerId = playerId;
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        this.fishEaten = 0;
        this.abilityCooldown = 0;

        // Catfish Mechanics
        this.boostCharge = 0; // 0 to 3.0 seconds

        // Shark Mechanics
        this.burpTimer = 0;
    }

    get level() {
        return Math.floor((this.width - 60) / 10) + 1;
    }

    useAbility() {
        console.log('useAbility called. Special:', this.config.special, 'Cooldown:', this.abilityCooldown);
        console.log('Full Config:', JSON.stringify(this.config));
        if (this.config.special === 'ink' && this.abilityCooldown <= 0) {
            console.log('Ink condition met! Spawning ink...');
            spawnInk(this.x + this.width / 2, this.y + this.height / 2);
            this.abilityCooldown = this.config.inkCooldown;
            try {
                soundManager.playInk();
            } catch (e) {
                console.error('Error playing ink sound:', e);
            }
        }
    }

    update(deltaTime, worldWidth, worldHeight) {
        this.time += deltaTime;

        if (this.abilityCooldown > 0) this.abilityCooldown -= deltaTime;

        // Automatic Ability Trigger REMOVED for manual control
        // if (this.config.special === 'ink' && this.abilityCooldown <= 0) {
        //     this.useAbility();
        // }

        // Movement Logic
        let dx = 0;
        let dy = 0;

        if (this.keys.up) dy -= 1;
        if (this.keys.down) dy += 1;
        if (this.keys.left) dx -= 1;
        if (this.keys.right) dx += 1;

        // Speed increases linearly with size to maintain screen-space speed
        let currentSpeed = this.speed * (this.width / 60);

        // Catfish Stealth & Boost Logic (Bufferable)
        if (this.config.special === 'stealth') {
            // Check inputs for "resting"
            if (dx === 0 && dy === 0) {
                // Charge up
                this.boostCharge += deltaTime;
                if (this.boostCharge > 3.0) this.boostCharge = 3.0; // Cap at 3s
            } else {
                // Moving! Discharge if we have charge
                if (this.boostCharge > 0) {
                    currentSpeed *= 1.75; // 75% extra speed
                    this.boostCharge -= deltaTime;
                    if (this.boostCharge < 0) this.boostCharge = 0;
                }
            }
        }

        if (dx !== 0 || dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;

            this.vx = dx * currentSpeed;
            this.vy = dy * currentSpeed;

            if (dx !== 0) {
                this.facingRight = dx > 0;
            }
        } else {
            this.vx = 0;
            this.vy = 0;
        }

        // Manual Jaw Control (Auto-open near enemies)
        let nearestEdible = Infinity;
        // Check enemies
        for (const enemy of enemies) {
            if (this.width > enemy.width) {
                const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (d < nearestEdible) nearestEdible = d;
            }
        }
        // Check other player (PvP)
        if (players.length > 1) {
            const other = players.find(p => p !== this);
            if (other && this.width > other.width) { // Only check if we are bigger
                const d = Math.hypot(other.x - this.x, other.y - this.y);
                if (d < nearestEdible) nearestEdible = d;
            }
        }

        if (nearestEdible < 150) { // Reverted to 150
            this.jawOpen += 0.2; // Faster opening
        } else {
            this.jawOpen -= 0.1;
        }
        this.jawOpen = Math.max(0, Math.min(1, this.jawOpen));

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        this.x = Math.max(0, Math.min(worldWidth - this.width, this.x));
        this.y = Math.max(0, Math.min(worldHeight - this.height, this.y));

        // SHARK BURP LOGIC (Player)
        if (this.burpTimer > 0) {
            this.burpTimer -= deltaTime;
            if (this.burpTimer <= 0) {
                // BURP!
                try { soundManager.playBurp(); } catch (e) { }

                // Fire Torpedo
                // Visuals (Bubbles)
                for (let i = 0; i < 8; i++) {
                    particles.push(new Particle(
                        this.x + this.width / 2 + (this.facingRight ? this.width / 2 : -this.width / 2),
                        this.y + this.height / 2,
                        '#00ffff', // Cyan
                        Math.random() * 2 + 1, // Speed
                        Math.random() * 3 + 2  // Size
                    ));
                }
                const vx = this.facingRight ? 400 : -400; // Fire in direction of movement
                projectiles.push(new Torpedo(
                    this.x + this.width / 2 + (this.facingRight ? this.width / 2 : -this.width / 2),
                    this.y + this.height / 2,
                    vx,
                    0, // Straight ahead
                    this
                ));
            }
        }
    }
}

class Enemy extends Fish {
    constructor(x, y, width, height, config) {
        super(x, y, width, height, config, 'enemy');
        this.vx = -config.baseSpeed; // Start moving left
    }

    update(deltaTime, worldWidth, worldHeight) {
        // AI Logic
        let closestPrey = null;
        let closestPredator = null;
        let minPreyDist = Infinity;
        let minPredatorDist = Infinity;

        // Check Player(s)
        for (const p of players) {
            const dPlayer = Math.hypot(p.x - this.x, p.y - this.y);

            // CATFISH STEALTH CHECK
            if (p.config.special === 'stealth') {
                const speed = Math.hypot(p.vx, p.vy);
                if (speed < 20) { // Threshold for "still"
                    p.alpha = 0.4; // Visual feedback
                    continue; // Enemy ignores player
                } else {
                    p.alpha = 1.0;
                }
            } else {
                p.alpha = 1.0;
            }

            // ANGLER MECHANIC: Lure Prey
            // If player is Angler, and this enemy is smaller (prey), and within lure radius...
            if (p.config.special === 'lure' && p.width > this.width * 1.1 && dPlayer < p.config.lureRadius) {
                // LURE EFFECT: Override fear! Move TOWARDS player!
                // This makes them easy to catch
                this.seek(p.x + p.width / 2, p.y + p.height / 2);
                // Visual cue? Maybe eyes glow? For now, just behavior.

                // Skip normal fear logic for player
                continue; // Move to next player or skip to decision making
            } else if (dPlayer < this.visionRadius) {
                if (p.width > this.width * 1.1) {
                    if (dPlayer < minPredatorDist) {
                        minPredatorDist = dPlayer;
                        closestPredator = p;
                    }
                } else if (this.width > p.width * 1.05) {
                    // Only chase if aggressive enough
                    // Reduced threshold to 1.05 to make them more opportunistic
                    if (this.aggression > 0.5) {
                        if (dPlayer < minPreyDist) {
                            minPreyDist = dPlayer;
                            closestPrey = p;
                        }
                    }
                }
            }
        }

        // Check other Enemies
        for (const other of enemies) {
            if (other === this) continue;
            const d = Math.hypot(other.x - this.x, other.y - this.y);
            if (d < this.visionRadius) {
                if (other.width > this.width * 1.1) {
                    if (d < minPredatorDist) {
                        minPredatorDist = d;
                        closestPredator = other;
                    }
                } else if (this.width > other.width * 1.05) {
                    if (this.aggression > 0.5) {
                        if (d < minPreyDist) {
                            minPreyDist = d;
                            closestPrey = other;
                        }
                    }
                }
            }
        }

        // Decision Making
        if (closestPredator) {
            this.maxSpeed = this.speed * 1.5; // Reset speed
            this.flee(closestPredator.x + closestPredator.width / 2, closestPredator.y + closestPredator.height / 2);
            this.jawOpen -= 0.1; // Close mouth when fleeing
        } else if (closestPrey) {
            // Hunting Frenzy for Sharks
            if (this.config.bodyShape === 'shark') {
                this.maxSpeed = this.speed * 2.0; // 33% faster than normal max
            } else {
                this.maxSpeed = this.speed * 1.5;
            }
            // Use Pursuit for hunting
            this.pursue(closestPrey);

            // Open Jaw when close!
            if (minPreyDist < 200) { // Increased from 150
                this.jawOpen += 0.1; // Slower opening for smoother animation
            } else {
                this.jawOpen -= 0.1;
            }
        } else {
            this.maxSpeed = this.speed * 1.5; // Reset speed
            // Normal Wander
            // Normal Wander
            if (this.config.special !== 'sink' && this.config.special !== 'torpedo') {
                this.wander(deltaTime);
            } else if (this.config.special === 'torpedo') {
                // Submarine Logic: Fire Torpedoes
                this.shootTimer = (this.shootTimer || 0) + deltaTime;
                if (this.shootTimer > 2.0) { // Fire every 2.0 seconds
                    this.shootTimer = 0;

                    // Find nearest player
                    let target = null;
                    let minDist = Infinity;
                    for (const p of players) {
                        // STEALTH CHECK: Don't aim at invisible players
                        if (p.alpha < 0.9) continue;

                        const d = Math.hypot(p.x - this.x, p.y - this.y);
                        if (d < minDist) {
                            minDist = d;
                            target = p;
                        }
                    }

                    let vx = 0;
                    let vy = 0;

                    if (target) {
                        // Aim at player
                        const dx = (target.x + target.width / 2) - (this.x + this.width / 2);
                        const dy = (target.y + target.height / 2) - (this.y + this.height / 2);
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist > 0) {
                            vx = (dx / dist) * 300;
                            vy = (dy / dist) * 300;
                        }
                    } else {
                        // Fallback: Fire forward
                        const dir = this.vx > 0 ? 1 : -1;
                        vx = dir * 300;
                    }

                    projectiles.push(new Torpedo(
                        this.x + this.width / 2,
                        this.y + this.height / 2,
                        vx,
                        vy,
                        this // Owner
                    ));
                    soundManager.playShoot();
                }
            }
            this.jawOpen -= 0.1; // Close mouth when wandering
        }
        this.jawOpen = Math.max(0, Math.min(1, this.jawOpen));

        // SHARK BURP LOGIC (Enemy)
        if (this.burpTimer > 0) {
            this.burpTimer -= deltaTime;
            if (this.burpTimer <= 0) {
                // BURP!
                try { soundManager.playBurp(); } catch (e) { }

                // Fire Torpedo
                // Visuals (Bubbles)
                for (let i = 0; i < 8; i++) {
                    particles.push(new Particle(
                        this.x + this.width / 2 + (this.facingRight ? this.width / 2 : -this.width / 2),
                        this.y + this.height / 2,
                        '#00ffff', // Cyan
                        Math.random() * 2 + 1, // Speed
                        Math.random() * 3 + 2  // Size
                    ));
                }
                const vx = this.vx > 0 ? 400 : -400; // Fire in direction of movement
                projectiles.push(new Torpedo(
                    this.x + this.width / 2 + (this.vx > 0 ? this.width / 2 : -this.width / 2),
                    this.y + this.height / 2,
                ));
            }
        }

        // Base movement bias (always drift slightly left to keep game moving)
        this.applyForce(-50, 0);

        super.update(deltaTime);

        // Orientation
        if (Math.abs(this.vx) > 1) {
            this.facingRight = this.vx > 0;
        }

        // Screen Constraints (World Bounds)
        // Normal behavior: bounce off Y, die off X
        if (this.y < 50) this.applyForce(0, 200);
        if (this.y > worldHeight - 50) this.applyForce(0, -200);
    }

    flee(targetX, targetY) {
        const dx = targetX - (this.x + this.width / 2);
        const dy = targetY - (this.y + this.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0 && dist < this.visionRadius) {
            const desiredVx = -(dx / dist) * this.maxSpeed; // Reverse direction
            const desiredVy = -(dy / dist) * this.maxSpeed;

            const steerX = desiredVx - this.vx;
            const steerY = desiredVy - this.vy;

            this.applyForce(steerX * this.fleeForce, steerY * this.fleeForce);
        }
    }
}

let players = []; // Array of Player objects
let player; // Reference to P1 for legacy code compatibility (if any)
let enemies = [];
let spawnTimer = 0;
let spawnInterval = 1.5;
let gracePeriod = 0;
let cameraScale = 1.0;
let gameMode = '1P'; // '1P' or '2P'
let selectionPhase = 1; // 1 = P1 Select, 2 = P2 Select

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Input Handling
window.addEventListener('keydown', (e) => {
    players.forEach(p => {
        if (e.code === p.controls.up) p.keys.up = true;
        if (e.code === p.controls.down) p.keys.down = true;
        if (e.code === p.controls.left) p.keys.left = true;
        if (e.code === p.controls.right) p.keys.right = true;
        if (e.code === 'Space') {
            console.log('Space pressed for player', p.playerId);
            p.useAbility();
        }
    });
});

window.addEventListener('keyup', (e) => {
    players.forEach(p => {
        if (e.code === p.controls.up) p.keys.up = false;
        if (e.code === p.controls.down) p.keys.down = false;
        if (e.code === p.controls.left) p.keys.left = false;
        if (e.code === p.controls.right) p.keys.right = false;
    });
});

// Game Loop
function gameLoop(timestamp) {
    const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    // Update Camera Scale
    // Update Camera Scale & Position
    if (players.length > 0) {
        let targetScale = 1.0;
        let centerX = 0;
        let centerY = 0;

        if (players.length === 1) {
            // 1 Player Camera
            const p = players[0];
            targetScale = 60 / Math.max(60, p.width);
            // Center is just player position (handled by translate later? No, we center world on screen)
            // Actually, we don't translate context for position, we just scale.
            // Wait, the original code didn't translate for position?
            // Ah, original code: ctx.scale(cameraScale, cameraScale). 
            // It seems the original code didn't center the camera on the player? 
            // It just scaled the world. The player moved in the world.
            // If the world is larger than screen, we need to translate.
            // BUT, the original code: this.x = Math.max(0, Math.min(worldWidth - this.width, this.x));
            // This implies the player moves within the viewport?
            // Let's check updateGame...
            // Ah, updateGame is not shown here.
            // If the original code didn't translate, the player just moves on screen.
            // But if we zoom out, the world gets smaller on screen.
            // For 2P, we need to keep them both on screen.

            // Let's stick to simple scaling for now as per original design.
            // The "Zoom" effectively increases the visible area.
        } else {
            // 2 Player Camera
            const p1 = players[0];
            const p2 = players[1];

            // Calculate distance
            const dx = Math.abs(p1.x - p2.x);
            const dy = Math.abs(p1.y - p2.y);
            const dist = Math.max(dx, dy) + 200; // Padding

            // Calculate max width of either player
            const maxPWidth = Math.max(p1.width, p2.width);

            // Target scale based on distance AND player size
            // We want to fit 'dist' into the screen
            const scaleDist = canvas.width / dist;
            const scaleSize = 60 / Math.max(60, maxPWidth);

            targetScale = Math.min(scaleDist, scaleSize);
        }

        cameraScale += (targetScale - cameraScale) * 0.02;
    }

    // Calculate World Dimensions
    const worldWidth = canvas.width / cameraScale;
    const worldHeight = canvas.height / cameraScale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Background (SCREEN SPACE - PERFORMANCE FIX)
    // Draw before scaling to keep it static and performant
    if (assets.background.complete) {
        // Cover the screen
        ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#001f3f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Apply Camera Transform
    ctx.save();
    ctx.scale(cameraScale, cameraScale);

    if (gameState === 'PLAYING' || gameState === 'DYING') {
        updateGame(deltaTime, worldWidth, worldHeight);

        // PvP Logic
        if (players.length === 2) {
            const p1 = players[0];
            const p2 = players[1];

            // Vulnerability based on Fish Eaten Count
            const diff = p1.fishEaten - p2.fishEaten;

            // Reset Glow
            p1.isVulnerable = false;
            p2.isVulnerable = false;

            if (diff >= 5) {
                p2.isVulnerable = true;
            } else if (diff <= -5) {
                p1.isVulnerable = true;
            }

            // Check Collision
            if (checkCollision(p1, p2)) {
                if (p2.isVulnerable) {
                    createEatingEffect(p2.x, p2.y, p2.color);
                    // Remove P2
                    players.splice(1, 1);
                    // Show message?
                    // gameOver(1); // Don't end game yet!
                } else if (p1.isVulnerable) {
                    createEatingEffect(p1.x, p1.y, p1.color);
                    // Remove P1
                    players.splice(0, 1);
                    // gameOver(2);
                }
            }
        }

        // Game Over if ALL players are dead
        if (players.length === 0 && gracePeriod <= 0) {
            gameOver();
        }
    }

    drawGame();
    ctx.restore(); // Restore camera

    // Draw UI (Score) on top of everything (unscaled)
    // Actually score is DOM element, so it's already on top.
    // But if we had canvas UI, we'd draw it here.

    animationId = requestAnimationFrame(gameLoop);
}

// Particles
class Particle {
    constructor(x, y, color, speed, size) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.speedY = speed;
        this.size = size;
        this.alpha = 1;
        this.decay = 0.01 + Math.random() * 0.02;
    }

    update() {
        this.y -= this.speedY;
        this.alpha -= this.decay;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Torpedo {
    constructor(x, y, vx, vy, owner) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.width = 20;
        this.height = 8;
        this.color = '#2d3436';
        this.timer = 0;
        this.owner = owner;
    }

    update(deltaTime) {
        this.timer += deltaTime;
        if (this.timer > 7.0) {
            return true; // Signal to explode
        }

        // Homing Logic
        let target = null;
        let minDist = Infinity;

        // Determine potential targets based on owner
        let potentialTargets = [];
        if (this.owner && this.owner.type === 'player') {
            potentialTargets = enemies;
        } else {
            potentialTargets = players;
        }

        for (const t of potentialTargets) {
            // Don't track owner (just in case)
            if (t === this.owner) continue;

            // STEALTH CHECK: Ignore invisible targets
            // Check alpha property (Enemy sets it on players, Player has it too)
            if (t.alpha !== undefined && t.alpha < 0.9) continue;

            const d = Math.hypot(t.x - this.x, t.y - this.y);
            if (d < minDist) {
                minDist = d;
                target = t;
            }
        }

        if (target) {
            const dx = (target.x + target.width / 2) - this.x;
            const dy = (target.y + target.height / 2) - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                // Desired velocity
                const speed = 350; // Slightly faster than initial
                const targetVx = (dx / dist) * speed;
                const targetVy = (dy / dist) * speed;

                // Steer towards target (Turn rate)
                const turnRate = 2.0 * deltaTime;
                this.vx += (targetVx - this.vx) * turnRate;
                this.vy += (targetVy - this.vy) * turnRate;
            }
        }

        // Normalize speed
        const currentSpeed = Math.hypot(this.vx, this.vy);
        if (currentSpeed > 0) {
            const maxSpeed = 350;
            this.vx = (this.vx / currentSpeed) * maxSpeed;
            this.vy = (this.vy / currentSpeed) * maxSpeed;
        }

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Bubble trail
        if (Math.random() < 0.3) {
            particles.push(new Particle(this.x, this.y, 'rgba(255, 255, 255, 0.5)', 0, 2));
        }

        return false;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Rotate to face velocity
        const angle = Math.atan2(this.vy, this.vx);
        ctx.rotate(angle);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        // Torpedo shape
        ctx.moveTo(0, 0);
        ctx.lineTo(this.width, this.height / 2);
        ctx.lineTo(0, this.height);
        ctx.lineTo(0, 0);
        ctx.fill();

        // Red tip
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.width, this.height / 2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }
}

let particles = [];
let projectiles = [];

function createBubbles(worldWidth, worldHeight) {
    if (Math.random() < 0.05) {
        const x = Math.random() * worldWidth;
        const y = worldHeight + 10;
        const size = 2 + Math.random() * 5;
        const speed = 1 + Math.random() * 2;
        particles.push(new Particle(x, y, 'rgba(255, 255, 255, 0.3)', speed, size));
    }
}

function spawnInk(x, y) {
    const count = 20;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 100;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const size = 10 + Math.random() * 20;
        const p = new Particle(x, y, 'rgba(50, 0, 50, 0.8)', 0, size); // Dark Purple
        p.vx = vx;
        p.vy = vy;
        p.decay = 0.005; // Last longer
        p.type = 'ink';
        p.width = size; // For collision
        p.height = size;
        p.getBounds = function () { return { left: this.x - this.size, right: this.x + this.size, top: this.y - this.size, bottom: this.y + this.size }; };

        // Override update for ink movement
        p.update = function () {
            this.x += this.vx * 0.016; // Approx dt
            this.y += this.vy * 0.016;
            this.vx *= 0.95; // Drag
            this.vy *= 0.95;
            this.alpha -= this.decay;
        };

        particles.push(p);
    }
}

function createExplosion(x, y) {
    const count = 30;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 150 + 50;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const size = 5 + Math.random() * 10;
        const color = Math.random() < 0.5 ? '#ff9f43' : '#ff6b6b'; // Orange/Red

        const p = new Particle(x, y, color, 0, size);
        p.vx = vx;
        p.vy = vy;
        p.decay = 0.02;

        // Physics update for explosion
        p.update = function () {
            this.x += this.vx * 0.016;
            this.y += this.vy * 0.016;
            this.alpha -= this.decay;
        };

        particles.push(p);
    }
}

function createEatingEffect(x, y, color) {
    // Blood splatter effect!
    const isBlood = true; // Always bloody for visceral feel
    const particleCount = 15; // Increased countmore realism
    const particleColor = isBlood ? 'rgba(180, 0, 0, 0.9)' : color;
    const count = isBlood ? 30 : 10; // Increased count

    for (let i = 0; i < count; i++) {
        const pX = x + (Math.random() - 0.5) * 40;
        const pY = y + (Math.random() - 0.5) * 40;
        // Varied size for "clots"
        const size = 2 + Math.random() * 8;
        const speed = (Math.random() - 0.5) * 8; // More explosive
        const p = new Particle(pX, pY, particleColor, speed, size);
        p.speedY = (Math.random() - 0.5) * 8; // Override speedY for explosion
        particles.push(p);
    }
}

function spawnEnemy(worldWidth, worldHeight) {
    // Performance Cap
    if (enemies.length > 40) return;

    // Select Archetype based on Score/Difficulty
    // Low score: Mostly Guppies and Blobs
    // High score: Piranhas and Sharks appear

    // Dynamic Difficulty: Based on Score AND Player Size
    // This ensures that if player grows fast, enemies get tougher/bigger
    let sizeFactor = 0;
    if (players.length > 0) {
        // Use the largest player's size for difficulty scaling
        const largestPlayer = players.reduce((maxP, p) => (p.width > maxP.width ? p : maxP), players[0]);
        sizeFactor = (largestPlayer.width - 60) / 200; // 0 at start, increases as player grows
    }
    const difficulty = (score * 0.002) + sizeFactor; // Uncapped difficulty

    let archetypeKey;
    const roll = Math.random();

    // Spawn Probabilities - Tuned for more variety earlier
    if (difficulty < 0.15) {
        // Early game: Mostly small, but chance of Piranha
        if (roll < 0.6) archetypeKey = 'guppy';
        else if (roll < 0.9) archetypeKey = 'blob';
        else archetypeKey = 'piranha'; // Rare early threat
    } else if (difficulty < 0.4) {
        // Mid game: Balanced
        if (roll < 0.25) archetypeKey = 'guppy';
        else if (roll < 0.5) archetypeKey = 'blob';
        else if (roll < 0.75) archetypeKey = 'piranha';
        else if (roll < 0.9) archetypeKey = 'eel';
        else archetypeKey = 'shark'; // Added 10% chance in mid-game
    } else {
        // Late game: Dangerous!
        if (roll < 0.15) archetypeKey = 'guppy'; // Reduced food
        else if (roll < 0.3) archetypeKey = 'blob';
        else if (roll < 0.5) archetypeKey = 'piranha';
        else if (roll < 0.7) archetypeKey = 'eel';
        else archetypeKey = 'shark'; // 30% chance (was 20%)
    }

    // Ensure there's always a chance for a "Apex" spawn if player is huge
    // INCREASED chance for testing
    if (sizeFactor > 0.3 && Math.random() < 0.2) { // Earlier and more often
        archetypeKey = 'shark';
    }

    // Special Spawns (Diver / Submarine)
    // Diver: Occasional snack
    if (Math.random() < 0.05) archetypeKey = 'diver';
    // Submarine: Rare threat (Balanced for visibility)
    if (Math.random() < 0.04) archetypeKey = 'submarine';

    const config = ARCHETYPES[archetypeKey];

    // Calculate Size
    // Base size * random scale
    // Scale base size slightly with difficulty to keep challenge up
    const scale = config.scaleRange[0] + Math.random() * (config.scaleRange[1] - config.scaleRange[0]);
    const baseSize = 60 * (1 + difficulty * 0.8); // Enemies grow significantly with difficulty
    let width = baseSize * scale;
    let height = width * 0.6; // Aspect ratio

    if (config.bodyShape === 'eel') height = width * 0.3;
    if (config.bodyShape === 'round') height = width;

    // Spawn from random side
    const side = Math.floor(Math.random() * 4);
    let x, y, initialVx, initialVy;
    const buffer = 200;
    const speed = config.baseSpeed;

    switch (side) {
        case 0: // Right
            x = worldWidth + buffer;
            y = Math.random() * worldHeight;
            initialVx = -speed;
            initialVy = (Math.random() - 0.5) * speed;
            break;
        case 1: // Left
            x = -buffer;
            y = Math.random() * worldHeight;
            initialVx = speed;
            initialVy = (Math.random() - 0.5) * speed;
            break;
        case 2: // Top
            x = Math.random() * worldWidth;
            y = -buffer;
            initialVx = (Math.random() - 0.5) * speed;
            initialVy = speed;
            break;
        case 3: // Bottom
            x = Math.random() * worldWidth;
            y = worldHeight + buffer;
            initialVx = (Math.random() - 0.5) * speed;
            initialVy = -speed;
            break;
    }

    const enemy = new Enemy(x, y, width, height, config);

    // Override behavior for Special Enemies
    if (config.special === 'sink') {
        // Diver: Spawn at top, sink down
        enemy.x = Math.random() * worldWidth;
        enemy.y = -height * 2;
        enemy.vx = 0;
        enemy.vy = config.baseSpeed;
    } else if (config.special === 'torpedo') {
        // Submarine: Spawn at side, move straight
        enemy.vy = 0;
        // Keep initialVx from switch, but ensure y is deep enough
        enemy.y = Math.random() * (worldHeight - 200) + 100;
    } else {
        enemy.vx = initialVx;
        enemy.vy = initialVy;
    }

    enemies.push(enemy);
}

let gameTime = 0;

function updateGame(deltaTime, worldWidth, worldHeight) {
    gameTime += deltaTime;
    if (gracePeriod > 0) {
        gracePeriod -= deltaTime;
    }

    spawnTimer += deltaTime;
    if (spawnTimer > spawnInterval) {
        spawnEnemy(worldWidth, worldHeight);
        spawnTimer = 0;
        spawnInterval = Math.max(0.8, 2.0 - score * 0.01);
    }

    createBubbles(worldWidth, worldHeight);
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].alpha <= 0) {
            particles.splice(i, 1);
        } else if (particles[i].type === 'ink') {
            // Ink Logic: Slow down enemies
            for (const enemy of enemies) {
                if (checkCollision(particles[i], enemy)) {
                    enemy.vx *= 0.9; // Slow down
                    enemy.vy *= 0.9;
                }
            }
        }
    }

    // Update Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        const shouldExplode = p.update(deltaTime);

        if (shouldExplode) {
            createExplosion(p.x, p.y);
            try {
                soundManager.playExplosion();
            } catch (e) {
                console.error('Error playing explosion sound:', e);
            }
            projectiles.splice(i, 1);
            continue;
        }

        // Remove if off screen
        if (p.x < -100 || p.x > worldWidth + 100) {
            projectiles.splice(i, 1);
            continue;
        }

        // Check Collision with Players
        if (gracePeriod <= 0) {
            for (let k = players.length - 1; k >= 0; k--) {
                const player = players[k];
                if (checkCollision(p, player)) {
                    // Player Hit!
                    createExplosion(player.x, player.y); // Explosion Effect
                    createEatingEffect(player.x, player.y, player.color); // Blood
                    players.splice(k, 1); // Remove player
                    projectiles.splice(i, 1); // Remove torpedo
                    try {
                        soundManager.playExplosion();
                    } catch (e) {
                        console.error('Error playing explosion sound:', e);
                    }

                    // If no players left, Game Over
                    if (players.length === 0) {
                        gameOver();
                    }
                    break; // Stop checking players for this torpedo
                }
            }
        }

        // Check Collision with Enemies (Torpedoes kill other fish too!)
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (checkCollision(p, enemy)) {
                // Submarine Fix: Don't hit owner immediately
                if (p.owner === enemy && p.timer < 2.0) continue;

                createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                createEatingEffect(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color);
                try {
                    soundManager.playExplosion();
                } catch (e) {
                    console.error('Error playing explosion sound:', e);
                }
                enemies.splice(j, 1); // Kill enemy
                projectiles.splice(i, 1); // Remove torpedo
                break; // Stop checking enemies for this torpedo
            }
        }
    }

    players.forEach(p => p.update(deltaTime, worldWidth, worldHeight));



    // Update Enemies & Collision
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.update(deltaTime, worldWidth, worldHeight);

        // Remove if off screen (looser bounds for wandering)
        // Use worldWidth for bounds
        if (enemy.x > worldWidth + 300 || enemy.x < -300 || enemy.y < -300 || enemy.y > worldHeight + 300) {
            enemies.splice(i, 1);
            continue;
        }

        // Player Collision
        for (let k = players.length - 1; k >= 0; k--) {
            const p = players[k];
            if (checkCollision(p, enemy)) {
                if (p.width >= enemy.width) {
                    score += 10;
                    document.getElementById('score').textContent = score;

                    // Shark Burp Trigger
                    if (p.config.bodyShape === 'shark' && enemy.config.bodyShape === 'submarine') {
                        // Always burp on submarine
                        p.burpTimer = 1.0;
                    }

                    p.grow(enemy.width); // Pass prey size

                    if (enemy.config.bodyShape === 'submarine') {
                        // Submarine Eating: Clonk + No Blood
                        try { soundManager.playClonk(); } catch (e) { }
                        // No eating effect (or maybe sparks? For now, nothing as requested "no blood effect")
                        createEatingEffect(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#cccccc'); // Grey sparks/debris
                    } else {
                        // Normal Eating
                        createEatingEffect(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color); // Blood/Guts
                        try { soundManager.playEat(); } catch (e) { }
                    }

                    enemies.splice(i, 1);
                    break; // Enemy eaten
                } else {
                    if (gracePeriod <= 0) {
                        // Player Eaten!
                        createEatingEffect(p.x, p.y, p.color); // Blood
                        try {
                            soundManager.playHit();
                        } catch (e) {
                            console.error('Error playing hit sound:', e);
                        }
                        players.splice(k, 1); // Remove this player

                        // If no players left, Game Over
                        if (players.length === 0) {
                            gameOver();
                        }
                    }
                }
            }
        }
        if (enemies[i] === enemy) { // Check if enemy was not eaten by a player
            // Enemy vs Enemy Collision (Ecosystem)
            for (let j = enemies.length - 1; j >= 0; j--) {
                if (i === j) continue; // Don't eat self
                const other = enemies[j];

                if (checkCollision(enemy, other)) {
                    // Check size difference (10% margin)
                    if (enemy.width > other.width * 1.1) {
                        // Enemy eats Other
                        enemy.grow(other.width); // Pass prey size

                        if (enemy.config.bodyShape === 'shark' && other.config.bodyShape === 'submarine') {
                            // Enemy Shark Burp
                            // Always burp on submarine
                            enemy.burpTimer = 1.0;

                            // Clonk + No Blood
                            try { soundManager.playClonk(); } catch (e) { }
                            createEatingEffect(other.x + other.width / 2, other.y + other.height / 2, '#cccccc');
                        } else {
                            createEatingEffect(other.x + other.width / 2, other.y + other.height / 2, other.color); // Red/Blood
                        }

                        enemies.splice(j, 1);
                        if (j < i) i--; // Adjust index if we removed an element before current
                    }
                }
            }
        }
    }
}

function drawGame() {
    particles.forEach(p => p.draw());
    projectiles.forEach(p => p.draw());
    enemies.forEach(enemy => enemy.draw());
    players.forEach(p => p.draw());
}



function checkCollision(rect1, rect2) {
    const b1 = rect1.getBounds();
    const b2 = rect2.getBounds();

    return (
        b1.left < b2.right &&
        b1.right > b2.left &&
        b1.top < b2.bottom &&
        b1.bottom > b2.top
    );
}

// Helper for random archetype
function getRandomArchetype() {
    const playableKeys = ['shark', 'angler', 'catfish'];
    return playableKeys[Math.floor(Math.random() * playableKeys.length)];
}

function startGame(p1Archetype, p2Archetype) {
    console.log('startGame called with:', p1Archetype, p2Archetype);
    try {
        soundManager.init();
        soundManager.playStart();
        soundManager.playAmbient();
    } catch (e) {
        console.error('Audio initialization failed:', e);
    }

    gameState = 'PLAYING';
    console.log('gameState set to PLAYING');
    score = 0;
    document.getElementById('score').textContent = score;
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('active');
    console.log('Start screen hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('active');

    players = [];

    // Use provided archetypes or fall back to random
    //   const arch1 = 'octopus'; // FORCE OCTOPUS FOR DEBUGGING
    const arch1 = p1Archetype || getRandomArchetype();
    const arch2 = p2Archetype || getRandomArchetype();

    // Player 1 (Arrows)
    // If it's the very first game, use selection. If it's a restart (score > 0 or just logic?), use random?
    // Let's just use random if we are coming from Game Over.
    // But wait, startGame is called from Start Screen too.
    // Let's check if we are restarting.

    // Simple approach: If we are in 2P mode, always randomize? No, that defeats selection.
    // Maybe only randomize on "Restart" button click?
    // The user said "re-start each game".
    // This implies when we click "Restart" or "Play Again".
    // Let's add a flag or check.

    // We can pass a flag to startGame?
    // Or just randomize here if we want to force it.
    // "Also re-start each game with a random fish type selected for each player."
    // This sounds like a feature of the restart.

    // Let's modify the Restart Button listener to pass a flag.

    // Player 1
    const p1 = new Player(arch1, { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }, 1);
    players.push(p1);
    player = p1; // Legacy ref

    if (gameMode === '2P') {
        // Player 2 (WASD)
        const p2 = new Player(arch2, { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' }, 2);
        players.push(p2);
    }

    enemies = [];
    projectiles = [];
    particles = []; // Clear particles
    spawnTimer = 0;
    gameTime = 0;
    gracePeriod = 2.0; // 2 seconds invulnerability at start
    lastTime = performance.now();

    if (!animationId) {
        requestAnimationFrame(gameLoop);
    }

    initPatterns();
}

function gameOver(winnerId = null) {
    if (gameState === 'DYING' || gameState === 'GAMEOVER') return;

    console.log('Game Over triggered');
    gameState = 'DYING';
    deathTime = Date.now();

    // Disable player controls/collision by effectively removing them from active play
    // We keep them visible for the explosion effect though

    setTimeout(() => {
        gameState = 'GAMEOVER';
        const finalScore = Math.floor(score);
        if (finalScore > highScore) {
            highScore = finalScore;
            localStorage.setItem('fishyBusinessHighScore', highScore);
        }

        document.getElementById('final-score').textContent = finalScore;
        document.getElementById('high-score').textContent = highScore;
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('game-over-screen').style.display = 'flex'; // Use flex to make it visible
        document.getElementById('game-over-screen').classList.add('active');

        // Reset selection UI for next game
        // document.getElementById('start-screen').classList.remove('hidden'); // REMOVED: This was covering the Game Over screen
    }, 2000);
}

// UI Event Listeners
// Start Button removed, but keeping Restart Button
document.getElementById('restart-btn').addEventListener('click', () => {
    // Randomize for restart based on current mode
    const randomP1 = getRandomArchetype();
    const randomP2 = getRandomArchetype();

    // Instant restart with random types
    startGame(randomP1, gameMode === '2P' ? randomP2 : null);
});

window.addEventListener('keydown', (e) => {
    if (e.key === '1') {
        console.log('Key 1 pressed, starting 1P game...');
        gameMode = '1P';
        startGame(getRandomArchetype());
    } else if (e.key === '2') {
        console.log('Key 2 pressed, starting 2P game...');
        gameMode = '2P';
        startGame(getRandomArchetype(), getRandomArchetype());
    } else if (gameState === 'GAMEOVER' && e.code === 'Enter') {
        // Restart with same mode
        const randomP1 = getRandomArchetype();
        const randomP2 = getRandomArchetype();
        startGame(randomP1, gameMode === '2P' ? randomP2 : null);
    }
});

// Initial render
requestAnimationFrame(gameLoop);



function initPatterns() {
    if (assets.patterns) return;
    assets.patterns = {};

    const createPattern = (drawFn) => {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        drawFn(ctx, 100, 100);
        return ctx.createPattern(canvas, 'repeat');
    };

    assets.patterns.scales = createPattern((ctx, w, h) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        const scaleSize = 20;
        for (let y = -10; y < h + 10; y += scaleSize * 0.8) {
            for (let x = -10; x < w + 10; x += scaleSize) {
                const xOff = (Math.floor(y / scaleSize) % 2 === 0) ? 0 : scaleSize * 0.5;
                ctx.beginPath();
                ctx.arc(x + xOff, y, scaleSize * 0.5, 0, Math.PI, false);
                ctx.fill();
            }
        }
    });

    assets.patterns.stripes = createPattern((ctx, w, h) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Darker stripes
        const stripeWidth = 15; // Wider stripes
        const gap = 40;
        for (let x = -20; x < w + 20; x += gap) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + stripeWidth, 0);
            ctx.lineTo(x + stripeWidth * 0.5 + 20, h); // Slanted
            ctx.lineTo(x - stripeWidth * 0.5 + 20, h);
            ctx.fill();
        }
    });

    assets.patterns.hexagons = createPattern((ctx, w, h) => {
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 2;
        const size = 20;
        const height = size * Math.sqrt(3);
        for (let y = -10; y < h + 10; y += height) {
            for (let x = -10; x < w + 10; x += size * 3) {
                const xOff = (Math.floor(y / height) % 2 === 0) ? 0 : size * 1.5;
                drawHexagon(ctx, x + xOff, y, size * 0.9);
            }
        }
    });

    assets.patterns.spots = createPattern((ctx, w, h) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            const r = 5 + Math.random() * 5;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    assets.patterns.mottled = createPattern((ctx, w, h) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; // Darker spots
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            const r = 5 + Math.random() * 15; // Varied sizes
            ctx.beginPath();
            // Irregular blobs
            ctx.ellipse(x, y, r, r * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function drawTexture(ctx, type, width, height, color) {
    if (!type || !assets.patterns || !assets.patterns[type]) return;

    ctx.save();
    // Use clipping instead of source-atop for better performance
    ctx.clip();

    // Calculate scale to match original look
    let s = 1;
    if (type === 'scales') s = (width * 0.1) / 20;
    else if (type === 'stripes') s = (width * 0.05) / 10;
    else if (type === 'hexagons') s = (width * 0.15) / 20;
    else if (type === 'spots') s = (width * 0.05) / 5;
    else if (type === 'mottled') s = (width * 0.1) / 10;

    ctx.scale(s, s);
    ctx.fillStyle = assets.patterns[type];

    // Draw large enough rect to cover the fish (scaled coordinates)
    const sw = width / s;
    const sh = height / s;

    ctx.fillRect(-sw / 2 - 10, -sh / 2 - 10, sw + 20, sh + 20);

    ctx.restore();
}

function drawHexagon(ctx, x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const px = x + r * Math.cos(angle);
        const py = y + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke(); // Outline for shell
    // ctx.fill();
}
