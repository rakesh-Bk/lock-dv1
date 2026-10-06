export const ShapeMatchGame = {
  isActive: false,
  onSuccess: null,
  draggedShape: null,
  shapes: [],

  resetShapes() {
    const cw = 320;
    const ch = 240;

    // Use tight padding to keep shapes strictly in the center "safe area" of any screen
    const paddingX = 100;
    const centerX = cw / 2;
    const sections = [paddingX, centerX, cw - paddingX];
    
    // Randomize the target sections
    const targetSections = [...sections].sort(() => Math.random() - 0.5);

    // Shapes start at the bottom, targets are at the top, within the safe area
    const paddingY = 80;
    const startY = ch - paddingY;
    const targetY = paddingY;

    this.shapes = [
      { id: 'square', x: sections[0], y: startY, targetX: targetSections[0], targetY: targetY, color: '#3B82F6', isMatched: false },
      { id: 'circle', x: sections[1], y: startY, targetX: targetSections[1], targetY: targetY, color: '#EF4444', isMatched: false },
      { id: 'triangle', x: sections[2], y: startY, targetX: targetSections[2], targetY: targetY, color: '#10B981', isMatched: false }
    ];
  },

  start(onSuccessCallback) {
    this.isActive = true;
    this.onSuccess = onSuccessCallback;
    this.draggedShape = null;
    this.resetShapes();
  },

  stop() {
    this.isActive = false;
    this.onSuccess = null;
    this.draggedShape = null;
    this.resetShapes();
  },

  evaluate(keypoints) {
    if (!this.isActive || !keypoints || keypoints.length < 21) return;

    const k4 = keypoints[4]; // Thumb tip
    const k8 = keypoints[8]; // Index tip

    // Calculate pinch cursor position
    const cursorX = (k4.x + k8.x) / 2;
    const cursorY = (k4.y + k8.y) / 2;

    // Calculate pinch distance
    const pinchDistance = Math.hypot(k8.x - k4.x, k8.y - k4.y);
    const isPinching = pinchDistance < 25;

    if (isPinching) {
      if (!this.draggedShape) {
        // Try to pick up a shape (increased grab radius)
        for (const shape of this.shapes) {
          if (shape.isMatched) continue;

          const distToShape = Math.hypot(shape.x - cursorX, shape.y - cursorY);
          if (distToShape < 40) {
            this.draggedShape = shape;
            break;
          }
        }
      } else {
        // Update shape position to follow cursor
        this.draggedShape.x = cursorX;
        this.draggedShape.y = cursorY;

        // Check for snapping to target (increased snap radius)
        const distToTarget = Math.hypot(this.draggedShape.x - this.draggedShape.targetX, this.draggedShape.y - this.draggedShape.targetY);
        if (distToTarget < 40) {
          // Snap into place
          this.draggedShape.x = this.draggedShape.targetX;
          this.draggedShape.y = this.draggedShape.targetY;
          this.draggedShape.isMatched = true;
          this.draggedShape = null;

          // Check win condition
          if (this.shapes.every(s => s.isMatched)) {
            if (this.onSuccess) this.onSuccess();
            this.stop();
          }
        }
      }
    } else {
      // Released pinch, drop the shape
      this.draggedShape = null;
    }
  },

  draw(ctx) {
    if (!this.isActive) return;

    for (const shape of this.shapes) {
      // Draw target outline
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (shape.id === 'square') {
        ctx.rect(shape.targetX - 15, shape.targetY - 15, 30, 30);
      } else if (shape.id === 'circle') {
        ctx.arc(shape.targetX, shape.targetY, 15, 0, Math.PI * 2);
      } else if (shape.id === 'triangle') {
        ctx.moveTo(shape.targetX, shape.targetY - 15);
        ctx.lineTo(shape.targetX + 15, shape.targetY + 15);
        ctx.lineTo(shape.targetX - 15, shape.targetY + 15);
        ctx.closePath();
      }
      ctx.stroke();

      // Draw solid shape
      ctx.fillStyle = shape.color;
      ctx.beginPath();
      if (shape.id === 'square') {
        ctx.rect(shape.x - 15, shape.y - 15, 30, 30);
      } else if (shape.id === 'circle') {
        ctx.arc(shape.x, shape.y, 15, 0, Math.PI * 2);
      } else if (shape.id === 'triangle') {
        ctx.moveTo(shape.x, shape.y - 15);
        ctx.lineTo(shape.x + 15, shape.y + 15);
        ctx.lineTo(shape.x - 15, shape.y + 15);
        ctx.closePath();
      }
      ctx.fill();
    }
  }
};
