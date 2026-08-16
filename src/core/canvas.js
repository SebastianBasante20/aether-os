/**
 * AETHER OS — Infinite Spatial Canvas & Viewport Engine
 */

export class SpatialCanvas {
  constructor(viewportId, worldId, minimapId, minimapLensId) {
    this.viewport = document.getElementById(viewportId);
    this.world = document.getElementById(worldId);
    this.minimapCanvas = document.getElementById(minimapId);
    this.minimapLens = document.getElementById(minimapLensId);
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

    this.panX = 120;
    this.panY = 80;
    this.zoom = 1;
    this.minZoom = 0.25;
    this.maxZoom = 2.5;

    this.isPanning = false;
    this.isSpacePressed = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    this.onPanChange = null;
    this.onZoomChange = null;

    this.init();
  }

  init() {
    this.updateTransform();

    // Wheel zoom & pan
    this.viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey || !this.isSpacePressed) {
        const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
        this.zoomAt(e.clientX, e.clientY, zoomFactor);
      } else {
        this.panX -= e.deltaX;
        this.panY -= e.deltaY;
        this.updateTransform();
      }
    }, { passive: false });

    // Panning with mouse
    this.viewport.addEventListener('mousedown', (e) => {
      // Middle click or Space+Left click or click on canvas background directly
      const isDirectCanvas = e.target === this.viewport || e.target.id === 'canvas-grid' || e.target.id === 'wires-layer' || e.target.id === 'wires-group';
      if (e.button === 1 || this.isSpacePressed || (e.button === 0 && isDirectCanvas)) {
        this.isPanning = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.viewport.classList.add('panning');
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isPanning) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.panX += dx;
        this.panY += dy;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.updateTransform();
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isPanning) {
        this.isPanning = false;
        this.viewport.classList.remove('panning');
      }
    });

    // Spacebar hold detection
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !this.isSpacePressed && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        this.isSpacePressed = true;
        this.viewport.style.cursor = 'grab';
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.isSpacePressed = false;
        this.viewport.style.cursor = '';
      }
    });

    // Minimap click-to-pan
    if (this.minimapCanvas) {
      this.minimapCanvas.parentElement.addEventListener('mousedown', (e) => {
        this.handleMinimapClick(e);
      });
    }
  }

  zoomAt(screenX, screenY, factor) {
    const rect = this.viewport.getBoundingClientRect();
    const mouseX = screenX - rect.left;
    const mouseY = screenY - rect.top;

    const newZoom = Math.min(this.maxZoom, Math.max(this.minZoom, this.zoom * factor));
    if (newZoom === this.zoom) return;

    // Zoom centered around mouse pointer
    this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
    this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
    this.zoom = newZoom;

    this.updateTransform();
  }

  setZoom(newZoom) {
    const rect = this.viewport.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    this.zoomAt(rect.left + centerX, rect.top + centerY, newZoom / this.zoom);
  }

  updateTransform() {
    if (this.world) {
      this.world.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    }

    // Sync dot grid background alignment
    const grid = document.getElementById('canvas-grid');
    if (grid) {
      grid.style.backgroundPosition = `${this.panX}px ${this.panY}px`;
      grid.style.backgroundSize = `${28 * this.zoom}px ${28 * this.zoom}px`;
    }

    // Update zoom level indicator
    const zoomText = document.getElementById('zoom-indicator');
    if (zoomText) {
      zoomText.textContent = `${Math.round(this.zoom * 100)}%`;
    }

    if (this.onPanChange) this.onPanChange(this.panX, this.panY);
    if (this.onZoomChange) this.onZoomChange(this.zoom);

    this.renderMinimap();
  }

  screenToWorld(screenX, screenY) {
    const rect = this.viewport.getBoundingClientRect();
    return {
      x: (screenX - rect.left - this.panX) / this.zoom,
      y: (screenY - rect.top - this.panY) / this.zoom
    };
  }

  worldToScreen(worldX, worldY) {
    const rect = this.viewport.getBoundingClientRect();
    return {
      x: worldX * this.zoom + this.panX + rect.left,
      y: worldY * this.zoom + this.panY + rect.top
    };
  }

  zoomToFit(nodes) {
    if (!nodes || nodes.length === 0) return;
    const rect = this.viewport.getBoundingClientRect();

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(n => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + 280);
      maxY = Math.max(maxY, n.y + 200);
    });

    const padding = 120;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    const scaleX = rect.width / width;
    const scaleY = rect.height / height;
    this.zoom = Math.min(1.2, Math.max(0.4, Math.min(scaleX, scaleY)));

    this.panX = (rect.width - width * this.zoom) / 2 - (minX - padding) * this.zoom;
    this.panY = (rect.height - height * this.zoom) / 2 - (minY - padding) * this.zoom;

    this.updateTransform();
  }

  renderMinimap(nodes = []) {
    if (!this.minimapCtx || !this.minimapCanvas) return;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    this.minimapCtx.clearRect(0, 0, w, h);

    // Map bounds estimation
    const worldExtent = 2600;
    const scale = w / worldExtent;

    // Draw nodes as dots/rectangles on radar
    const allNodeEls = document.querySelectorAll('.canvas-node');
    this.minimapCtx.fillStyle = '#00f0ff';
    allNodeEls.forEach(el => {
      const left = parseFloat(el.style.left) || 0;
      const top = parseFloat(el.style.top) || 0;
      const mx = (left + 500) * scale;
      const my = (top + 500) * scale;
      this.minimapCtx.fillRect(mx, my, 18 * scale * 1.5, 12 * scale * 1.5);
    });

    // Update minimap lens viewport box
    if (this.minimapLens) {
      const vRect = this.viewport.getBoundingClientRect();
      const lensW = Math.max(20, (vRect.width / this.zoom) * scale);
      const lensH = Math.max(15, (vRect.height / this.zoom) * scale);
      const lensX = (-this.panX / this.zoom + 500) * scale;
      const lensY = (-this.panY / this.zoom + 500) * scale;

      this.minimapLens.style.width = `${lensW}px`;
      this.minimapLens.style.height = `${lensH}px`;
      this.minimapLens.style.left = `${Math.max(0, Math.min(w - lensW, lensX))}px`;
      this.minimapLens.style.top = `${Math.max(0, Math.min(h - lensH, lensY))}px`;
    }
  }

  handleMinimapClick(e) {
    const rect = this.minimapCanvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const scale = this.minimapCanvas.width / 2600;
    const targetWorldX = clickX / scale - 500;
    const targetWorldY = clickY / scale - 500;

    const vRect = this.viewport.getBoundingClientRect();
    this.panX = vRect.width / 2 - targetWorldX * this.zoom;
    this.panY = vRect.height / 2 - targetWorldY * this.zoom;

    this.updateTransform();
  }
}
