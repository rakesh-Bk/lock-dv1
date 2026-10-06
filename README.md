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


STEP 3 - Shape match games
# Lock'd - Feature: Shape Match Minigame (Plugin Architecture)

## Overview
Lock'd is a solve-to-unlock web application using computer vision to regulate children's screen time. This feature specification defines the **Shape Match Minigame**, an interactive module where children use a camera-tracked "pinch" gesture to pick up geometric shapes, drag them across the live canvas feed, and drop them into corresponding target outlines to unlock YouTube playback.

This module builds on the existing TensorFlow.js MediaPipe tracking infrastructure in `vision.js` and follows a standalone plugin contract.

---

## Objectives
1. **Pinch-to-Grab Mechanics:** Compute the Euclidean distance between hand landmarks (Thumb Tip `4` and Index Tip `8`) to simulate mouse-down/mouse-up events.
2. **Interactive Drag-and-Drop:** Translate the pinch midpoint into active cursor coordinates to manipulate virtual shapes on the mirrored canvas.
3. **Collision Detection & Snapping:** Detect when a grabbed shape is within tolerance of its target outline, snap it into place, and mark it matched.
4. **Lifecycle Integration:** Expose standard `start(onSuccessCallback)`, `stop()`, `evaluate(keypoints)`, and `draw(ctx)` methods to keep `shapeMatch.js` decoupled from `vision.js` and `gameLogic.js`.

---

## Technical Specifications

### 1. Coordinate Space & Dimensions
* **Canvas Resolution:** Fixed at $320 \times 240$ pixels (matching the webcam stream).
* **Coordinate Inversion Warning:** Because `vision.js` flips the canvas horizontally (`ctx.scale(-1, 1)` and `ctx.translate(-canvas.width, 0)`), ensure landmark calculations match the rendered canvas coordinate space.

### 2. Gesture Formulas
* **Cursor Position:**
  $$\text{cursorX} = \frac{\text{keypoint}[4].x + \text{keypoint}[8].x}{2}$$
  $$\text{cursorY} = \frac{\text{keypoint}[4].y + \text{keypoint}[8].y}{2}$$
* **Pinch Distance:**
  $$\text{pinchDistance} = \sqrt{(\text{keypoint}[8].x - \text{keypoint}[4].x)^2 + (\text{keypoint}[8].y - \text{keypoint}[4].y)^2}$$
  * `isPinching = pinchDistance < 25` (threshold in pixels).

### 3. Hitbox & Tolerances
* **Pick-up Radius:** Cursor within $30\text{px}$ of shape center.
* **Drop / Snap Radius:** Shape center within $30\text{px}$ of target center.

---

## Architecture & File Structure

```text
/
├── app.js                 
└── /public                
    ├── index.html         # Uses ES module loading for script separation
    ├── css/
    │   └── style.css      
    └── js/
        ├── gameLogic.js         # Core state management
        ├── youtubeCtrl.js       # YouTube IFrame API control
        ├── vision.js            # Webcam pipeline & MediaPipe detector loop
        └── shapeMatch.js        # [NEW] Standalone Shape Match plugin module

        The module must export ShapeMatchGame implementing this interface:

JavaScript
export const ShapeMatchGame = {
  isActive: false,
  onSuccess: null,
  draggedShape: null,
  shapes: [
    { id: 'square', x: 40, y: 50, targetX: 250, targetY: 50, color: '#3B82F6', isMatched: false },
    { id: 'circle', x: 40, y: 120, targetX: 250, targetY: 120, color: '#EF4444', isMatched: false },
    { id: 'triangle', x: 40, y: 190, targetX: 250, targetY: 190, color: '#10B981', isMatched: false }
  ],
  start(onSuccessCallback) {}, // Initializes state and sets success callback
  stop() {},                   // Cleans up state and resets positions
  evaluate(keypoints) {},      // Calculates pinch and updates dragging/snapping
  draw(ctx) {}                 // Renders shapes and outlines on the canvas context
};

STEP 4 - Target shooter
# Lock'd - Feature: Sequential Puzzle Pipeline

## Overview
Lock'd is a solve-to-unlock web application using computer vision to regulate children's screen time. This feature specification defines a **Sequential Puzzle Pipeline**. 

Instead of a single game unlocking the video, the user must now complete two games in a row:
1. **Stage 1: Shape Match Minigame** (Pinch gesture to drag and drop 3 shapes).
2. **Stage 2: Target Shooter Minigame** (Gun pose to aim and shoot 10 targets).
3. **Stage 3: Unlock** (YouTube video becomes accessible).

This requires implementing both plugin modules and updating the main application logic to handle the state transition between games.

---

## Objectives
1. **Implement `shapeMatch.js`:** A drag-and-drop shape matching game using pinch detection (distance between thumb and index finger).
2. **Implement `targetShooter.js`:** A laser-pointer game using a "gun pose" (index extended, others closed) with a particle explosion effect.
3. **Implement the Chain Logic:** Update the core flow so that the `onSuccessCallback` of the first game initiates the `start()` method of the second game, rather than immediately unlocking the video.

---

## Architecture & File Structure

```text
/
├── app.js                 
└── /public                
    ├── index.html         # Must load both game modules
    ├── css/
    │   └── style.css      
    └── js/
        ├── gameLogic.js         # Manages the transition between games and the final unlock
        ├── youtubeCtrl.js       
        ├── vision.js            # Feeds tracking data to whichever game is currently active
        ├── shapeMatch.js        # Stage 1 Plugin
        └── targetShooter.js     # Stage 2 Plugin

        To chain the games, the active game state must be managed dynamically. In vision.js (or gameLogic.js), agents must implement a transition sequence.

Expected Logic Flow:

JavaScript
import { ShapeMatchGame } from './shapeMatch.js';
import { TargetShooterGame } from './targetShooter.js';

let activeGame = null;

// Start the sequence
export function startPuzzleSequence() {
    activeGame = ShapeMatchGame;
    // When Shape Match finishes, start Target Shooter
    activeGame.start(() => {
        startStageTwo();
    });
}

function startStageTwo() {
    activeGame = TargetShooterGame;
    // When Target Shooter finishes, unlock the video
    activeGame.start(() => {
        activeGame = null;
        window.unlockVideo(); // Or evaluateAnswer(true) depending on the codebase
    });
}

// In the TensorFlow tracking loop:
function evaluateFrame(keypoints) {
    if (activeGame) activeGame.evaluate(keypoints);
}

// In the Canvas rendering loop:
function drawFrame(ctx) {
    if (activeGame) activeGame.draw(ctx);
}