# Lock'd - Phase 1: Web Infrastructure & Mock State

## Project Overview
Lock'd (formerly VisionGate) is a web application that regulates children's screen time by functioning as a solve-to-unlock gate. Children must complete physical, interactive puzzles on-camera to access parent-approved YouTube content. 

This repository represents **Phase 1 (Weeks 1-2)**. In this phase, we are building the complete web infrastructure and state management **without** the machine learning/computer vision component. Instead of a webcam, we use a mock "Cheat Menu" to simulate vision inputs and test the game loop.

## Tech Stack
*   **Backend:** Node.js, Express.js
*   **Frontend:** HTML5, CSS3, Vanilla JavaScript
*   **External APIs:** YouTube IFrame Player API

## Target File Architecture
The project must adhere strictly to the following structure:
```text
/
├── package.json
├── server/
│   └── app.js                 # Express server configuration
└── public/
    ├── index.html             # Main application layout
    ├── css/
    │   └── style.css          # UI styling and layout rules
    └── js/
        ├── gameLogic.js       # Game state machine
        ├── youtubeCtrl.js     # YouTube IFrame API integration
        └── mockVision.js      # Mock control panel for testing inputs

EXTRA INSTRUCTIONS
1. Backend Server (server/app.js)
Initialize a basic Express server running on port 3000.

Serve all static files from the /public directory.

Ensure fallback routing handles basic errors gracefully.

2. Frontend Layout (public/index.html & public/css/style.css)
App Container: A responsive, kid-friendly layout.

Video Container: An empty <div id="player"></div> that the YouTube API will replace.

Puzzle Overlay: A UI modal that covers the video area when isLocked is true, displaying the currentPuzzle prompt (e.g., "Hold up 3 fingers!").

Camera Placeholder: A designated square where the webcam will eventually render (currently empty).

Cheat Menu: A fixed/floating control panel visible only during development containing the Mock Vision buttons.

3. Game Logic & YouTube Controller (public/js/gameLogic.js & public/js/youtubeCtrl.js)
Load the YouTube IFrame API asynchronously.

Initialize a video (use ID M7lc1UVf-VE as a placeholder) with controls: 0 to prevent skipping.

Implement unlockVideo(): Sets isLocked to false, reveals the video container, hides the puzzle overlay, and calls player.playVideo().

Implement lockVideo(): Sets isLocked to true, hides the video container, shows the puzzle overlay, and calls player.pauseVideo().

Security: Listen to YouTube's onStateChange event. If the video state changes to PLAYING while gameState.isLocked is true, immediately force it to pause.

4. Mock Vision Controller (public/js/mockVision.js)
Populate the HTML Cheat Menu with buttons simulating ML triggers (e.g., <button>Simulate 3 Fingers</button>).

When a button is clicked, update gameState.providedAnswer.

Evaluate if gameState.providedAnswer === gameState.expectedAnswer. If it matches, trigger unlockVideo().


#STEP 2
# Lock'd - Step 2: The Machine Learning Engine

## Project Overview
Lock'd is a solve-to-unlock application that uses computer vision to regulate children's screen time. 

**This repository phase is strictly Step 2.**
In Step 1, we built the UI, Node.js backend, game state (`isLocked`), and the YouTube API integration using mock "Cheat Menu" HTML buttons. In Step 2, our sole focus is ripping out those mock buttons and replacing them with a live, TensorFlow.js-powered webcam feed that analyzes hand gestures in real-time.

## Step 2 Objectives
1. **Webcam Integration:** Request user camera permissions and pipe the feed into a hidden HTML `<video>` element.
2. **TensorFlow.js Setup:** Load `@tensorflow-models/hand-pose-detection` and its WebGL backend dependencies via CDN.
3. **The Tracking Loop:** Initialize the MediaPipe Hands model to read the webcam feed and extract the 21 2D/3D coordinate keypoints of the user's hand at roughly 10-30 FPS.
4. **Gesture Math:** Write mathematical logic to evaluate those 21 keypoints (e.g., determining if a finger is extended by comparing the Y-coordinate of its tip against its knuckle).
5. **The Handshake:** Connect the gesture math directly to the `gameLogic.js` state. A successful physical gesture must trigger the exact same `unlockVideo()` function that the mock buttons used to trigger.

## CDN Dependencies (Inject into index.html)
Agents should use the official unpkg or jsdelivr CDNs for the ML models in the document `<head>`:
```html
<script src="[https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core](https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core)"></script>
<script src="[https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter](https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter)"></script>
<script src="[https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl](https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl)"></script>
<script src="[https://cdn.jsdelivr.net/npm/@tensorflow-models/hand-pose-detection](https://cdn.jsdelivr.net/npm/@tensorflow-models/hand-pose-detection)"></script>

ALTERATIONS
/
├── app.js                 
└── /public                
    ├── index.html         # Add the CDN links, a hidden <video>, and an output <canvas>
    ├── css/
    │   └── style.css      
    └── js/
        ├── gameLogic.js         # Keep exactly as is (manages state)
        ├── youtubeController.js # Keep exactly as is
        ├── vision.js            # [NEW] Contains TF.js setup, tracking loop, and gesture math
        └── mockVision.js        # [DELETE] We no longer need the cheat buttons

