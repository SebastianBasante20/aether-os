/**
 * AETHER OS — 3D Quantum Holo-Chamber & Neural Realm Engine
 * Built with Three.js & Custom GL Particle / Geometry Physics
 */

import * as THREE from 'three';
import { Audio } from './audio.js';

export class Holo3DScene {
  constructor(containerId, canvasId, nodeGraph) {
    this.container = document.getElementById(containerId);
    this.canvas = document.getElementById(canvasId);
    this.graph = nodeGraph;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.active = false;

    // Simulation params
    this.currentMode = 'vortex'; // 'vortex' | 'torus' | 'neural' | 'helix'
    this.particleCount = 7000;
    this.particleSpeed = 1.0;
    this.gravityPull = 1.0;
    this.coreScale = 1.0;

    // Particle system
    this.particles = null;
    this.particlePositions = null;
    this.particleTargets = null;
    this.particleColors = null;

    // Central Morphing Wireframe Core
    this.centralMesh = null;
    this.innerCoreMesh = null;

    // 3D Nodes & Laser Beams
    this.nodeMeshes = [];
    this.beamLines = [];

    // Interaction & Orbit
    this.mouse = { x: 0, y: 0, screenX: 0, screenY: 0, isDown: false, lastX: 0, lastY: 0 };
    this.cameraRotation = { x: 0.3, y: 0.5 };
    this.cameraDistance = 45;
    this.targetDistance = 45;
    this.raycaster = new THREE.Raycaster();
    this.hoveredNode = null;
    this.tooltipEl = document.getElementById('holo3d-tooltip');

    this.clock = new THREE.Clock();
    this.animId = null;

    this.init();
  }

  init() {
    if (!this.canvas) return;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x04060b, 0.015);

    // 2. Camera setup
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 1000);
    this.updateCameraPos();

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x0d1828, 2);
    this.scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x00f0ff, 4, 120);
    cyanLight.position.set(20, 20, 20);
    this.scene.add(cyanLight);

    const purpleLight = new THREE.PointLight(0xa855f7, 4, 120);
    purpleLight.position.set(-20, -15, -15);
    this.scene.add(purpleLight);

    // 5. Initialize Particle Quantum Vortex
    this.initParticles();

    // 6. Initialize Central Holographic Core
    this.initCentralCore();

    // 7. Bind Orbit & Resize Events
    this.bindEvents();
  }

  initParticles() {
    const geo = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(this.particleCount * 3);
    this.particleTargets = new Float32Array(this.particleCount * 3);
    this.particleColors = new Float32Array(this.particleCount * 3);

    // Generate initial vortex accretion disk
    this.generateShapePositions('vortex', this.particlePositions);
    this.generateShapePositions('vortex', this.particleTargets);

    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      const ratio = i / this.particleCount;
      // Gradient from cyan to laser purple / blue
      const c = new THREE.Color();
      c.setHSL(0.5 + ratio * 0.25, 0.9, 0.6);
      this.particleColors[idx] = c.r;
      this.particleColors[idx + 1] = c.g;
      this.particleColors[idx + 2] = c.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.particleColors, 3));

    // Particle Material
    const mat = new THREE.PointsMaterial({
      size: 0.38,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  generateShapePositions(mode, array) {
    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;

      if (mode === 'vortex') {
        // Relativistic accretion disk around singularity
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.pow(Math.random(), 0.6) * 32 + 3.5;
        const height = (Math.random() - 0.5) * (radius * 0.22);
        array[idx] = Math.cos(angle) * radius;
        array[idx + 1] = height;
        array[idx + 2] = Math.sin(angle) * radius;
      } else if (mode === 'torus') {
        // Torus knot math curve
        const u = (i / this.particleCount) * Math.PI * 2 * 3;
        const p = 2, q = 3;
        const r = 16 * (0.8 + 0.4 * Math.cos(q * u));
        array[idx] = r * Math.cos(p * u) + (Math.random() - 0.5) * 3;
        array[idx + 1] = 10 * Math.sin(q * u) + (Math.random() - 0.5) * 3;
        array[idx + 2] = r * Math.sin(p * u) + (Math.random() - 0.5) * 3;
      } else if (mode === 'helix') {
        // Cybernetic DNA double helix
        const strand = i % 2 === 0 ? 1 : -1;
        const t = (i / this.particleCount) * 40 - 20;
        const angle = t * 0.8 + (strand > 0 ? 0 : Math.PI);
        const radius = 9;
        array[idx] = Math.cos(angle) * radius + (Math.random() - 0.5) * 1.5;
        array[idx + 1] = t * 1.3;
        array[idx + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 1.5;
      } else if (mode === 'neural') {
        // Spherical neural galaxy with radial filaments
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const r = Math.pow(Math.random(), 0.5) * 26 + 4;
        array[idx] = r * Math.sin(phi) * Math.cos(theta);
        array[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
        array[idx + 2] = r * Math.cos(phi);
      }
    }
  }

  setShapeMode(mode) {
    this.currentMode = mode;
    this.generateShapePositions(mode, this.particleTargets);
    Audio.click(1600);

    // Update buttons
    const btns = document.querySelectorAll('.holo-geom-btn');
    btns.forEach(b => {
      if (b.getAttribute('data-geom') === mode) b.classList.add('active');
      else b.classList.remove('active');
    });

    const badge = document.getElementById('holo3d-active-mode');
    if (badge) badge.textContent = mode.toUpperCase();
  }

  initCentralCore() {
    // Outer wireframe icosahedron
    const coreGeo = new THREE.IcosahedronGeometry(4.2, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.3
    });
    this.centralMesh = new THREE.Mesh(coreGeo, coreMat);
    this.scene.add(this.centralMesh);

    // Inner glowing sphere singularity
    const innerGeo = new THREE.SphereGeometry(2.2, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x000000
    });
    this.innerCoreMesh = new THREE.Mesh(innerGeo, innerMat);
    this.scene.add(this.innerCoreMesh);
  }

  sync3DNodes() {
    // Clear old node meshes and beams
    this.nodeMeshes.forEach(m => this.scene.remove(m));
    this.beamLines.forEach(b => this.scene.remove(b));
    this.nodeMeshes = [];
    this.beamLines = [];

    if (!this.graph || !this.graph.nodes) return;

    const nodes = this.graph.nodes;
    const count = nodes.length;

    // Position nodes in 3D orbit around the core
    nodes.forEach((node, i) => {
      const angle = (i / count) * Math.PI * 2;
      const radius = 22;
      const y = Math.sin(i * 1.5) * 6;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Node 3D Crystal Mesh (Dodecahedron)
      const geom = new THREE.DodecahedronGeometry(1.8, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: node.portColor || 0x00f0ff,
        roughness: 0.1,
        metalness: 0.8,
        wireframe: false,
        emissive: node.portColor || 0x00f0ff,
        emissiveIntensity: 0.4
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(x, y, z);
      mesh.userData = { nodeData: node };

      // Wireframe overlay
      const wireGeom = new THREE.DodecahedronGeometry(2.0, 0);
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.25
      });
      const wireMesh = new THREE.Mesh(wireGeom, wireMat);
      mesh.add(wireMesh);

      this.scene.add(mesh);
      this.nodeMeshes.push(mesh);
    });

    // Create 3D Laser Beams for connected wires
    if (this.graph.wires) {
      this.graph.wires.forEach(wire => {
        const fromMesh = this.nodeMeshes.find(m => m.userData.nodeData.id === wire.fromNodeId);
        const toMesh = this.nodeMeshes.find(m => m.userData.nodeData.id === wire.toNodeId);

        if (fromMesh && toMesh) {
          const points = [fromMesh.position, toMesh.position];
          const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
          const lineMat = new THREE.LineBasicMaterial({
            color: fromMesh.userData.nodeData.portColor || 0x00f0ff,
            transparent: true,
            opacity: 0.65,
            linewidth: 2
          });
          const line = new THREE.Line(lineGeo, lineMat);
          this.scene.add(line);
          this.beamLines.push(line);
        }
      });
    }
  }

  bindEvents() {
    // Mouse drag orbit controls
    this.canvas.addEventListener('mousedown', (e) => {
      this.mouse.isDown = true;
      this.mouse.lastX = e.clientX;
      this.mouse.lastY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.screenX = e.clientX;
      this.mouse.screenY = e.clientY;
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      if (this.mouse.isDown) {
        const dx = e.clientX - this.mouse.lastX;
        const dy = e.clientY - this.mouse.lastY;
        this.cameraRotation.y += dx * 0.006;
        this.cameraRotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.cameraRotation.x + dy * 0.006));
        this.mouse.lastX = e.clientX;
        this.mouse.lastY = e.clientY;
        this.updateCameraPos();
      }

      if (this.active) {
        this.checkRaycastHover();
      }
    });

    window.addEventListener('mouseup', () => {
      this.mouse.isDown = false;
    });

    // Zoom in 3D with wheel
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.targetDistance = Math.max(15, Math.min(100, this.targetDistance + e.deltaY * 0.05));
    }, { passive: false });

    // Click on 3D node
    this.canvas.addEventListener('click', () => {
      if (this.hoveredNode) {
        Audio.nodeSelect();
        if (this.graph) {
          this.graph.selectNode(this.hoveredNode.id);
        }
      }
    });

    // Window resize
    window.addEventListener('resize', () => {
      if (!this.renderer || !this.camera) return;
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    // HUD Slider controls
    const speedSlider = document.getElementById('slider-holo-speed');
    const speedVal = document.getElementById('val-holo-speed');
    if (speedSlider && speedVal) {
      speedSlider.addEventListener('input', (e) => {
        this.particleSpeed = parseFloat(e.target.value);
        speedVal.textContent = `${this.particleSpeed}x`;
      });
    }

    const gravSlider = document.getElementById('slider-holo-gravity');
    const gravVal = document.getElementById('val-holo-gravity');
    if (gravSlider && gravVal) {
      gravSlider.addEventListener('input', (e) => {
        this.gravityPull = parseFloat(e.target.value);
        gravVal.textContent = `${this.gravityPull}x`;
      });
    }

    // HUD Geometry mode buttons
    const geomBtns = document.querySelectorAll('.holo-geom-btn');
    geomBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-geom');
        this.setShapeMode(mode);
      });
    });
  }

  checkRaycastHover() {
    this.raycaster.setFromCamera(new THREE.Vector2(this.mouse.x, this.mouse.y), this.camera);
    const intersects = this.raycaster.intersectObjects(this.nodeMeshes, true);

    if (intersects.length > 0) {
      const topObj = intersects[0].object;
      const rootMesh = topObj.parent && topObj.parent.userData.nodeData ? topObj.parent : topObj;
      const node = rootMesh.userData.nodeData;

      if (node) {
        this.hoveredNode = node;
        this.canvas.style.cursor = 'pointer';
        if (this.tooltipEl) {
          this.tooltipEl.innerHTML = `<strong>${node.name}</strong><br><span style="color:var(--accent-primary)">${node.category} • ${node.status.toUpperCase()}</span>`;
          this.tooltipEl.style.left = `${this.mouse.screenX}px`;
          this.tooltipEl.style.top = `${this.mouse.screenY}px`;
          this.tooltipEl.classList.add('visible');
        }
        return;
      }
    }

    this.hoveredNode = null;
    this.canvas.style.cursor = this.mouse.isDown ? 'grabbing' : 'grab';
    if (this.tooltipEl) {
      this.tooltipEl.classList.remove('visible');
    }
  }

  updateCameraPos() {
    const phi = Math.PI / 2 - this.cameraRotation.x;
    const theta = this.cameraRotation.y;

    this.camera.position.x = this.cameraDistance * Math.sin(phi) * Math.cos(theta);
    this.camera.position.y = this.cameraDistance * Math.cos(phi);
    this.camera.position.z = this.cameraDistance * Math.sin(phi) * Math.sin(theta);
    this.camera.lookAt(0, 0, 0);
  }

  start() {
    this.active = true;
    this.container.classList.add('active');
    this.sync3DNodes();
    Audio.click(1400);

    if (!this.animId) {
      this.animate();
    }
  }

  stop() {
    this.active = false;
    this.container.classList.remove('active');
    if (this.tooltipEl) this.tooltipEl.classList.remove('visible');
  }

  toggle() {
    if (this.active) this.stop();
    else this.start();
  }

  animate() {
    this.animId = requestAnimationFrame(() => this.animate());
    if (!this.active) return;

    const delta = this.clock.getDelta();
    const t = this.clock.getElapsedTime();

    // Smooth camera distance zoom interpolation
    this.cameraDistance += (this.targetDistance - this.cameraDistance) * 0.1;
    this.updateCameraPos();

    // Auto slow rotate scene if not dragging
    if (!this.mouse.isDown) {
      this.cameraRotation.y += 0.002 * this.particleSpeed;
      this.updateCameraPos();
    }

    // Rotate central holographic meshes
    if (this.centralMesh) {
      this.centralMesh.rotation.x = t * 0.3 * this.particleSpeed;
      this.centralMesh.rotation.y = t * 0.5 * this.particleSpeed;
      const pulse = 1 + Math.sin(t * 2) * 0.08;
      this.centralMesh.scale.set(pulse * this.coreScale, pulse * this.coreScale, pulse * this.coreScale);
    }

    // Rotate 3D node crystals
    this.nodeMeshes.forEach((mesh, idx) => {
      mesh.rotation.y = t * 0.8 + idx;
      mesh.rotation.x = Math.sin(t + idx) * 0.4;
      mesh.position.y = Math.sin(t * 1.5 + idx) * 2 + (idx % 2 === 0 ? 3 : -3);
    });

    // Update laser beams positions
    if (this.graph && this.graph.wires) {
      let beamIdx = 0;
      this.graph.wires.forEach(wire => {
        const fromMesh = this.nodeMeshes.find(m => m.userData.nodeData.id === wire.fromNodeId);
        const toMesh = this.nodeMeshes.find(m => m.userData.nodeData.id === wire.toNodeId);
        if (fromMesh && toMesh && this.beamLines[beamIdx]) {
          const positions = this.beamLines[beamIdx].geometry.attributes.position.array;
          positions[0] = fromMesh.position.x;
          positions[1] = fromMesh.position.y;
          positions[2] = fromMesh.position.z;
          positions[3] = toMesh.position.x;
          positions[4] = toMesh.position.y;
          positions[5] = toMesh.position.z;
          this.beamLines[beamIdx].geometry.attributes.position.needsUpdate = true;
          beamIdx++;
        }
      });
    }

    // Morph and swirl quantum particles
    if (this.particles && this.particlePositions && this.particleTargets) {
      const pos = this.particlePositions;
      const targets = this.particleTargets;
      const morphSpeed = 0.045;
      const angleDelta = 0.015 * this.particleSpeed * this.gravityPull;

      for (let i = 0; i < this.particleCount; i++) {
        const idx = i * 3;

        // Smooth morphing interpolation to target geometry
        pos[idx] += (targets[idx] - pos[idx]) * morphSpeed;
        pos[idx + 1] += (targets[idx + 1] - pos[idx + 1]) * morphSpeed;
        pos[idx + 2] += (targets[idx + 2] - pos[idx + 2]) * morphSpeed;

        // Swirl around Y axis
        const x = pos[idx];
        const z = pos[idx + 2];
        const cos = Math.cos(angleDelta);
        const sin = Math.sin(angleDelta);
        pos[idx] = x * cos - z * sin;
        pos[idx + 2] = x * sin + z * cos;
      }

      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
