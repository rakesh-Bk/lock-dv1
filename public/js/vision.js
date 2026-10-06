import { ShapeMatchGame } from './shapeMatch.js';
import { TargetShooterGame } from './targetShooter.js';

let activeGame = null;
let puzzlePrompt = null;

export function startPuzzleSequence() {
    puzzlePrompt = document.getElementById('puzzle-prompt');
    if (puzzlePrompt) puzzlePrompt.innerText = "Drag shapes to their outlines!";
    
    if (activeGame) activeGame.stop();
    activeGame = ShapeMatchGame;
    
    activeGame.start(() => {
        startStageTwo();
    });
}

function startStageTwo() {
    if (puzzlePrompt) puzzlePrompt.innerText = "Make a gun pose and hit 10 targets!";
    
    if (activeGame) activeGame.stop();
    activeGame = TargetShooterGame;
    
    activeGame.start(() => {
        if (activeGame) activeGame.stop();
        activeGame = null;
        if (puzzlePrompt) puzzlePrompt.innerText = "Unlocked!";
        
        if (window.gameState) {
            window.gameState.providedAnswer = window.gameState.expectedAnswer;
            if (typeof window.evaluateAnswer === "function") {
                window.evaluateAnswer();
            }
        }
    });
}

let detector;
let video;
let canvas;
let ctx;
let latestKeypoints = null;

// Stability filter: the same count must repeat this many frames in a row
const REQUIRED_STABLE_FRAMES = 3; // ~0.3s at 10 FPS
let stableCount = 0;
let lastCount = -1;

async function setupCamera() {
    video = document.getElementById('webcam-video');
    // Keep it "displayed" (display:none can zero out dimensions) but invisible
    video.style.display = "block";
    video.style.position = "absolute";
    video.style.opacity = "0";
    video.style.pointerEvents = "none";

    const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            facingMode: 'user',
            width: 320,
            height: 240
        }
    });
    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => resolve(video);
    });
}

async function initVision() {
    setStatus("Starting camera…");
    await setupCamera();
    await video.play();
    console.log("📷 Camera ready:", video.videoWidth + "x" + video.videoHeight);

    canvas = document.getElementById('output-canvas');
    
    const logicalWidth = 320;
    const logicalHeight = 240;
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    // Removed inline styles to let CSS width/height: 100% take over for full screen
    
    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Start drawing the camera feed immediately
    renderVideo();

    setStatus("Loading hand model…");
    const model = handPoseDetection.SupportedModels.MediaPipeHands;
detector = await handPoseDetection.createDetector(model, {
    runtime: 'mediapipe',
    modelType: 'lite',
    maxHands: 1,
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands'
});
console.log("✅ Detector ready (mediapipe runtime)");

    setStatus("Show your hand");
    
    startPuzzleSequence();
    
    trackHands();
}

function renderVideo() {
    ctx.clearRect(0, 0, 320, 240);

    // Mirror the feed; keypoints are drawn inside the same transform so they line up
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-320, 0);
    ctx.drawImage(video, 0, 0, 320, 240);

    if (latestKeypoints) {
        drawKeypoints(latestKeypoints);
    }

    if (activeGame) {
        activeGame.draw(ctx);
    }

    ctx.restore();
    requestAnimationFrame(renderVideo);
}

async function trackHands() {
    if (!detector) return;

    try {
        // Skip frames until the video actually has data
        if (video.readyState >= 2) {
            const hands = await detector.estimateHands(video);
            console.log("Hands found:", hands.length);

            if (hands.length > 0) {
                latestKeypoints = hands[0].keypoints;
                
                if (activeGame) {
                    activeGame.evaluate(latestKeypoints);
                }
                
                const numFingers = countFingers(latestKeypoints);
                setStatus("Pinch distance: " + Math.hypot(latestKeypoints[8].x - latestKeypoints[4].x, latestKeypoints[8].y - latestKeypoints[4].y).toFixed(1));
            } else {
                latestKeypoints = null;
                setStatus("Show your hand");
            }
        }
    } catch (e) {
        console.error("Error estimating hands:", e);
    }

    // Throttle ML tracking to ~10 FPS
    setTimeout(trackHands, 100);
}

function drawKeypoints(keypoints) {
    ctx.fillStyle = "black";
    for (const kp of keypoints) {
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 1.5, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function countFingers(k) {
    let count = 0;
    const wrist = k[0];

    // Index, middle, ring, pinky: finger is up when the tip is clearly
    // farther from the wrist than its PIP joint (works even if the hand tilts)
    const fingers = [[8, 6], [12, 10], [16, 14], [20, 18]]; // [tip, pip]
    for (const [tip, pip] of fingers) {
        if (dist(k[tip], wrist) > dist(k[pip], wrist) * 1.1) count++;
    }

    // Thumb: tip must be clearly farther from the pinky base than the IP joint.
    // Works for both left and right hands.
    if (dist(k[4], k[17]) > dist(k[3], k[17]) * 1.15) count++;

    return count;
}

// Debug helper: shows which individual fingers are detected as UP
function debugFingers(k) {
    const wrist = k[0];
    const names = ["index", "middle", "ring", "pinky"];
    const pairs = [[8, 6], [12, 10], [16, 14], [20, 18]];

    const state = {};
    pairs.forEach(([tip, pip], i) => {
        state[names[i]] = dist(k[tip], wrist) > dist(k[pip], wrist) * 1.1 ? "UP" : "down";
    });
    state.thumb = dist(k[4], k[17]) > dist(k[3], k[17]) * 1.15 ? "UP" : "down";

    console.table(state);
}

function setStatus(text) {
    const el = document.getElementById('finger-count');
    if (el) el.textContent = text;
}

document.addEventListener('DOMContentLoaded', () => {
    initVision().catch((err) => {
        console.error(err);
        setStatus("Camera error: " + err.message);
    });
});