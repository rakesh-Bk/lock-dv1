const gameState = {
    isLocked: true,
    expectedAnswer: 3,
    providedAnswer: null
};

function unlockVideo() {
    gameState.isLocked = false;
    document.getElementById('video-wrapper').classList.remove('locked');
    if (window.player && window.player.playVideo) {
        window.player.playVideo();
    }
}

function lockVideo() {
    gameState.isLocked = true;
    document.getElementById('video-wrapper').classList.add('locked');
    if (window.player && window.player.pauseVideo) {
        window.player.pauseVideo();
    }
}

function evaluateAnswer() {
    if (gameState.providedAnswer === gameState.expectedAnswer) {
        if (gameState.isLocked) unlockVideo();
    } else {
        if (!gameState.isLocked) lockVideo();
    }
}

// Make accessible globally
window.gameState = gameState;
window.unlockVideo = unlockVideo;
window.lockVideo = lockVideo;
window.evaluateAnswer = evaluateAnswer;
