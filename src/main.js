/**
 * AETHER OS — Next-Generation Spatial Intelligence & 3D Quantum Studio
 * Application Orchestrator & Bootstrapper
 */

import { ParticleField } from './core/particles.js';
import { SpatialCanvas } from './core/canvas.js';
import { NodeGraph, NODE_TYPES } from './core/node-graph.js';
import { TelemetryStudio } from './components/telemetry.js';
import { NodeInspector } from './components/inspector.js';
import { CommandPalette } from './components/command-palette.js';
import { ToolbarManager } from './components/toolbar.js';
import { Holo3DScene } from './core/holo3d.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('%c AETHER OS v2.4 %c Autonomous Spatial Intelligence & 3D Quantum Engine ', 'background: #00f0ff; color: #000; font-weight: bold; padding: 2px 6px; border-radius: 3px;', 'background: #121826; color: #00f0ff; padding: 2px 6px;');

  // 1. Initialize Ambient Particle Gravity Background
  const particles = new ParticleField('particle-canvas');

  // 2. Initialize Telemetry Studio & Log Feed
  const telemetry = new TelemetryStudio();

  // 3. Initialize Spatial Canvas (Pan / Zoom / Minimap)
  const canvas = new SpatialCanvas(
    'canvas-viewport',
    'canvas-world',
    'minimap-canvas',
    'minimap-lens'
  );

  // 4. Initialize Node Inspector Drawer
  let inspector = null;

  // 5. Initialize Node Graph & Pipeline Engine
  const graph = new NodeGraph(
    canvas,
    (node) => {
      if (inspector) inspector.inspect(node);
      if (holo3D && holo3D.active) holo3D.sync3DNodes();
    },
    (level, message) => {
      telemetry.addLog(level, message);
    }
  );

  // Bind Inspector instance with graph & toast
  let toolbar = null;
  inspector = new NodeInspector(graph, (type, msg) => {
    if (toolbar) toolbar.toast(type, msg);
  });

  // 6. Initialize Three.js 3D Quantum Holo-Chamber
  const holo3D = new Holo3DScene('holo3d-container', 'holo3d-canvas', graph);

  // 7. Initialize Toolbar, Themes & Node Picker
  let palette = null;
  toolbar = new ToolbarManager(graph, () => {
    if (palette) palette.open();
  });

  // 8. Initialize Command Palette (Raycast-grade Cmd+K)
  palette = new CommandPalette({
    runPipeline: () => graph.runPipeline(),
    addNode: (typeKey) => toolbar.addNodeToCenter(typeKey),
    autoAlign: () => graph.autoAlignNodes(),
    zoomFit: () => canvas.zoomToFit(graph.nodes),
    setTheme: (theme) => toolbar.setTheme(theme),
    toggleTelemetry: () => telemetry.togglePanel(),
    toggle3D: () => holo3D.toggle()
  });

  // 9. Bind Global Execution & 3D Controls
  const toggle3DBtn = document.getElementById('btn-toggle-3d');
  if (toggle3DBtn) {
    toggle3DBtn.addEventListener('click', () => {
      holo3D.toggle();
      if (holo3D.active) {
        toolbar.toast('info', 'Entered 3D Quantum Holo-Chamber • Drag to Rotate 360°');
      }
    });
  }

  const exit3DBtn = document.getElementById('btn-exit-3d');
  if (exit3DBtn) {
    exit3DBtn.addEventListener('click', () => {
      holo3D.stop();
      toolbar.toast('info', 'Returned to 2D Spatial Canvas');
    });
  }

  const runBtn = document.getElementById('btn-run-pipeline');
  if (runBtn) {
    runBtn.addEventListener('click', () => {
      graph.runPipeline();
    });
  }

  const stepBtn = document.getElementById('btn-step-pipeline');
  if (stepBtn) {
    stepBtn.addEventListener('click', () => {
      if (graph.nodes.length > 0) {
        const nextNode = graph.nodes.find(n => n.status !== 'completed') || graph.nodes[0];
        graph.executeNodeStep(nextNode);
      }
    });
  }

  const resetBtn = document.getElementById('btn-reset-pipeline');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      graph.nodes.forEach(n => graph.setNodeStatus(n.id, 'idle'));
      telemetry.addLog('INFO', 'Neural pipeline state reset to IDLE.');
      toolbar.toast('info', 'Reset mesh state to IDLE.');
    });
  }

  // Bind Canvas Controls
  const zoomInBtn = document.getElementById('btn-zoom-in');
  if (zoomInBtn) zoomInBtn.addEventListener('click', () => canvas.zoomAt(window.innerWidth / 2, window.innerHeight / 2, 1.2));

  const zoomOutBtn = document.getElementById('btn-zoom-out');
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => canvas.zoomAt(window.innerWidth / 2, window.innerHeight / 2, 0.8));

  const zoomFitBtn = document.getElementById('btn-zoom-fit');
  if (zoomFitBtn) zoomFitBtn.addEventListener('click', () => canvas.zoomToFit(graph.nodes));

  const autoAlignBtn = document.getElementById('btn-auto-align');
  if (autoAlignBtn) autoAlignBtn.addEventListener('click', () => graph.autoAlignNodes());

  const toggleTelemBtn = document.getElementById('btn-toggle-telemetry');
  if (toggleTelemBtn) toggleTelemBtn.addEventListener('click', () => telemetry.togglePanel());

  const openPaletteBtn = document.getElementById('btn-open-palette');
  if (openPaletteBtn) openPaletteBtn.addEventListener('click', () => palette.open());

  // 10. Global Keyboard Shortcut Handlers
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

    if (e.key === 'Escape' && holo3D.active) {
      holo3D.stop();
      toolbar.toast('info', 'Returned to 2D Spatial Canvas');
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      graph.runPipeline();
    } else if (e.key === '3' || e.key === 'v' || e.key === 'V') {
      e.preventDefault();
      holo3D.toggle();
      if (holo3D.active) {
        toolbar.toast('info', 'Entered 3D Quantum Holo-Chamber • Drag to Rotate 360°');
      }
    } else if (e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      toolbar.openNodePicker();
    } else if (e.key === 'l' || e.key === 'L') {
      e.preventDefault();
      graph.autoAlignNodes();
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      canvas.zoomToFit(graph.nodes);
    } else if (toolbar.pickerOverlay && !toolbar.pickerOverlay.classList.contains('hidden')) {
      const num = parseInt(e.key);
      const keys = Object.keys(NODE_TYPES);
      if (num >= 1 && num <= keys.length) {
        e.preventDefault();
        toolbar.closeNodePicker();
        toolbar.addNodeToCenter(keys[num - 1]);
      }
    }
  });

  // 11. Load Initial Showcase Workflow
  graph.loadWorkflow('agentic-reasoning');

  // Trigger welcome toast
  setTimeout(() => {
    toolbar.toast('info', 'Welcome to AETHER OS • Click "3D Realm" to experience the 3D Quantum Engine!');
  }, 400);
});
