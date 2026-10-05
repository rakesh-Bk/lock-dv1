let detector;
let video;
let canvas;
let ctx;
let latestKeypoints = null;

async function setupCamera() {
    video = document.getElementById('webcam-video');
    // Ensure video doesn't have display:none which can zero out dimensions in some browsers
    video.style.display = "block";
    video.style.position = "absolute";
    video.style.opacity = "0";
    video.style.pointerEvents = "none";
    
    const stream = await navigator.mediaDevices.getUserMedia({
        'audio': false,
        'video': {
            facingMode: 'user',
            width: 320,
            height: 240
        }
    });
    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

async function initVision() {
    await setupCamera();
    video.play();

    canvas = document.getElementById('output-canvas');
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    ctx = canvas.getContext('2d');

    // Start video rendering immediately
    renderVideo();

    const model = handPoseDetection.SupportedModels.MediaPipeHands;
    const detectorConfig = {
        runtime: 'tfjs',
        modelType: 'lite',
        maxHands: 1
    };
    detector = await handPoseDetection.createDetector(model, detectorConfig);
    
    // Start ML tracking loop
    trackHands();
}

function renderVideo() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Canvas Flip for mirrored feed
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    if (latestKeypoints) {
        drawKeypoints(latestKeypoints);
    }
    
    ctx.restore();
    
    requestAnimationFrame(renderVideo);
}

async function trackHands() {
    if (!detector) return;

    try {
        const hands = await detector.estimateHands(video);
        
        if (hands.length > 0) {
            const hand = hands[0];
            latestKeypoints = hand.keypoints;
            const numFingers = countFingers(latestKeypoints);
            window.gameState.providedAnswer = numFingers;
            window.evaluateAnswer();
        } else {
            latestKeypoints = null;
            window.gameState.providedAnswer = 0;
        }
    } catch (e) {
        console.error("Error estimating hands:", e);
    }

    // Throttle ML tracking to ~10 FPS (100ms delay)
    setTimeout(trackHands, 100);
}

function drawKeypoints(keypoints) {
    ctx.fillStyle = "red";
    for (let i = 0; i < keypoints.length; i++) {
        const x = keypoints[i].x;
        const y = keypoints[i].y;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function countFingers(keypoints) {
    let count = 0;
    
    // Use MCP (base knuckle) and TIP. If tip is above MCP, finger is up.
    if (keypoints[8].y < keypoints[5].y) count++;   // Index
    if (keypoints[12].y < keypoints[9].y) count++;  // Middle
    if (keypoints[16].y < keypoints[13].y) count++; // Ring
    if (keypoints[20].y < keypoints[17].y) count++; // Pinky
    
    // Thumb: calculate distance from wrist to tip vs wrist to IP joint.
    const distTip = Math.hypot(keypoints[4].x - keypoints[0].x, keypoints[4].y - keypoints[0].y);
    const distIp = Math.hypot(keypoints[3].x - keypoints[0].x, keypoints[3].y - keypoints[0].y);
    if (distTip > distIp) count++;
    
    return count;
}

document.addEventListener('DOMContentLoaded', () => {
    initVision().catch(console.error);
});
