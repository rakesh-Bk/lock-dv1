let player;

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '360',
        width: '640',
        videoId: 'M7lc1UVf-VE',
        playerVars: {
            'controls': 0,
            'disablekb': 1,
            'rel': 0
        },
        events: {
            'onStateChange': onPlayerStateChange
        }
    });
    window.player = player;
}

function onPlayerStateChange(event) {
    // If video starts playing while locked, force pause
    if (event.data === YT.PlayerState.PLAYING && window.gameState.isLocked) {
        player.pauseVideo();
    }
}
