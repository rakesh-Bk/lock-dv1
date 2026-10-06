export const TargetShooterGame = {
  isActive: false,
  onSuccess: null,
  targets: [],
  particles: [],
  bullets: [],
  score: 0,
  maxScore: 10,
  lastShotTime: 0,

  resetGame() {
    this.score = 0;
    this.targets = [];
    this.particles = [];
    this.bullets = [];
    this.spawnTarget();
  },

  spawnTarget() {
    const cw = 320;
    const ch = 240;
    
    // Use tight padding to keep targets strictly in the center "safe area"
    const paddingX = 100;
    const paddingY = 80;
    const radius = 8 + Math.random() * 6;
    
    this.targets.push({
      x: paddingX + Math.random() * (cw - 2 * paddingX),
      y: paddingY + Math.random() * (ch - 2 * paddingY),
      radius: radius,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`
    });
  },

  start(onSuccessCallback) {
    this.isActive = true;
    this.onSuccess = onSuccessCallback;
    this.resetGame();
  },

  stop() {
    this.isActive = false;
    this.onSuccess = null;
    this.targets = [];
    this.particles = [];
    this.bullets = [];
  },

  isGunPose(keypoints) {
    const indexExtended = keypoints[8].y < keypoints[6].y;
    const middleClosed = keypoints[12].y > keypoints[10].y;
    const ringClosed = keypoints[16].y > keypoints[14].y;
    const pinkyClosed = keypoints[20].y > keypoints[18].y;
    return indexExtended && middleClosed && ringClosed && pinkyClosed;
  },

  evaluate(keypoints) {
    if (!this.isActive) return;

    if (keypoints && keypoints.length >= 21) {
      if (this.isGunPose(keypoints)) {
        const cursorX = keypoints[8].x;
        const cursorY = keypoints[8].y;
        
        // Auto-shoot continuously in the direction of the index finger
        const now = Date.now();
        if (now - this.lastShotTime > 150) {
          const k6 = keypoints[6]; // PIP joint
          const k8 = keypoints[8]; // TIP joint
          
          let dx = k8.x - k6.x;
          let dy = k8.y - k6.y;
          const len = Math.hypot(dx, dy);
          
          if (len > 0) {
            dx /= len;
            dy /= len;
          } else {
            dx = 0;
            dy = -1;
          }
          
          const speed = 15;
          this.bullets.push({
            x: cursorX,
            y: cursorY,
            vx: dx * speed,
            vy: dy * speed,
            radius: 2
          });
          this.lastShotTime = now;
        }
      }
    }
    
    // Update bullets and check collisions
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      
      const cw = 320;
      const ch = 240;
      
      // Remove if off screen
      if (b.y < -20 || b.y > ch + 20 || b.x < -20 || b.x > cw + 20) {
        this.bullets.splice(i, 1);
        continue;
      }
      
      let bulletHit = false;
      for (let j = this.targets.length - 1; j >= 0; j--) {
        const t = this.targets[j];
        const dist = Math.hypot(t.x - b.x, t.y - b.y);
        
        if (dist < t.radius + b.radius) {
          // Hit!
          this.createExplosion(t.x, t.y, t.color);
          this.targets.splice(j, 1);
          this.score++;
          bulletHit = true;
          
          if (this.score >= this.maxScore) {
            if (this.onSuccess) this.onSuccess();
            this.stop();
            return;
          } else {
            this.spawnTarget();
          }
          break; // Bullet can only hit one target
        }
      }
      if (bulletHit) {
        this.bullets.splice(i, 1);
      }
    }
    
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 3; // Fade slightly faster
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  },

  createExplosion(x, y, color) {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 100,
        color: color
      });
    }
  },

  draw(ctx) {
    if (!this.isActive) return;

    // Draw targets
    for (const t of this.targets) {
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    
    // Draw bullets
    ctx.fillStyle = '#FFF'; // white bullets
    for (const b of this.bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw particles (smaller)
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life / 100);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    
    // Update score in the DOM
    const scoreEl = document.getElementById('finger-count');
    if (scoreEl) {
      scoreEl.innerText = `Target: ${this.maxScore}  |  Score: ${this.score}`;
    }
  }
};
