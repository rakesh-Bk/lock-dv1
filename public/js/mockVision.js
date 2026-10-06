document.addEventListener('DOMContentLoaded', () => {
    const cheatMenu = document.getElementById('cheat-menu');
    
    // Simulate 3 Fingers Button
    const btn3Fingers = document.createElement('button');
    btn3Fingers.textContent = 'Simulate 3 Fingers';
    btn3Fingers.onclick = () => {
        window.gameState.providedAnswer = 3;
        window.evaluateAnswer();
    };

    // Simulate 0 Fingers (Reset)
    const btn0Fingers = document.createElement('button');
    btn0Fingers.textContent = 'Simulate 0 Fingers';
    btn0Fingers.onclick = () => {
        window.gameState.providedAnswer = 0;
        window.evaluateAnswer();
    };

    cheatMenu.appendChild(btn3Fingers);
    cheatMenu.appendChild(btn0Fingers);
});
