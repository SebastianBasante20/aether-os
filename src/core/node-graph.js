/**
 * AETHER OS — Node Graph, Bezier Cable Physics, Live Node Canvas Renderers & Pipeline Execution Engine
 */

import { Icons } from './icons.js';
import { Audio } from './audio.js';

export const NODE_TYPES = {
  input_vision: {
    name: 'Multimodal Sensor',
    category: 'Input',
    type: 'input_vision',
    icon: 'eye',
    desc: 'Ingests real-time video, raster imagery & prompt embeddings',
    portColor: '#00f0ff',
    defaultData: {
      prompt: 'Analyze spatial scene telemetry and extract topological entities.',
      resolution: '4K Native (60 FPS)',
      modality: 'Vision + Audio + Text'
    },
    inputs: [],
    outputs: ['tensor_embed', 'metadata']
  },
  agent_reasoner: {
    name: 'Neural Agent Core',
    category: 'Reasoning',
    type: 'agent_reasoner',
    icon: 'brain',
    desc: 'Recursive Chain-of-Thought agent with Tree-of-Thoughts tree search',
    portColor: '#a855f7',
    defaultData: {
      model: 'Aether-Reasoner-Ultra',
      temperature: 0.2,
      depth: 5,
      systemPrompt: 'Deconstruct complex spatial problems into verifiable sub-goals.'
    },
    inputs: ['context_in', 'memory_in'],
    outputs: ['thought_stream', 'tool_call']
  },
  vector_memory: {
    name: 'Episodic Vector Memory',
    category: 'Knowledge',
    type: 'vector_memory',
    icon: 'database',
    desc: 'Semantic knowledge graph with HNSW vector index & cosine retrieval',
    portColor: '#3b82f6',
    defaultData: {
      indexType: 'HNSW-Cosine',
      topK: 8,
      dimensions: 1536,
      namespace: 'spatial-knowledge-v2'
    },
    inputs: ['query_vector'],
    outputs: ['retrieved_chunks']
  },
  code_sandbox: {
    name: 'WASM Code Sandbox',
    category: 'Execution',
    type: 'code_sandbox',
    icon: 'code',
    portColor: '#10b981',
    desc: 'Sandboxed Python / Rust execution environment for algorithmic verification',
    defaultData: {
      runtime: 'Python 3.12 (Isolated WASM)',
      timeoutMs: 2500,
      code: 'def compute_topological_mesh(vectors):\n    return [v.norm() for v in vectors]'
    },
    inputs: ['code_input'],
    outputs: ['execution_result', 'stdout']
  },
  router_gate: {
    name: 'Conditional Gateway',
    category: 'Logic',
    type: 'router_gate',
    icon: 'route',
    portColor: '#f59e0b',
    desc: 'Routes execution flow dynamically based on confidence thresholds',
    defaultData: {
      confidenceThreshold: 0.88,
      fallbackStrategy: 'Escalate to human review'
    },
    inputs: ['eval_signal'],
    outputs: ['path_true', 'path_false']
  },
  holographic_vis: {
    name: 'Holographic Visualizer',
    category: 'Output',
    type: 'holographic_vis',
    icon: 'sparkles',
    portColor: '#00f0ff',
    desc: 'Real-time multi-dimensional latent space rendering & 3D synthesis',
    defaultData: {
      renderEngine: '3D Spatial Surface Vectorizer',
      refreshRate: '60 FPS Native',
      exportFormat: 'Interactive Canvas'
    },
    inputs: ['stream_in', 'metrics_in'],
    outputs: ['visual_frame']
  },
  action_webhook: {
    name: 'Action Dispatcher',
    category: 'Action',
    type: 'action_webhook',
    icon: 'zap',
    portColor: '#ec4899',
    desc: 'Dispatches authenticated actions to external cloud infra and APIs',
    defaultData: {
      endpoint: 'https://api.aether.network/v2/dispatch',
      authMethod: 'mTLS + JWT Bearer',
      retryPolicy: 'Exponential 3x'
    },
    inputs: ['payload_in'],
    outputs: ['dispatch_ack']
  }
};

export class NodeGraph {
  constructor(canvasInstance, onSelectNode, onLogMessage) {
    this.canvas = canvasInstance;
    this.onSelectNode = onSelectNode;
    this.onLogMessage = onLogMessage;

    this.nodes = [];
    this.wires = []; // { id, fromNodeId, fromPort, toNodeId, toPort }
    this.selectedNodeId = null;

    this.isConnecting = false;
    this.connectingSource = null;

    this.container = document.getElementById('nodes-container');
    this.wiresGroup = document.getElementById('wires-group');
    this.pulsesGroup = document.getElementById('pulses-group');
    this.tempWire = document.getElementById('temp-wire');

    this.isRunning = false;
    this.previewAnimFrames = new Map();

    this.initEvents();
  }

  initEvents() {
    window.addEventListener('mousemove', (e) => {
      if (this.isConnecting && this.connectingSource) {
        const worldPos = this.canvas.screenToWorld(e.clientX, e.clientY);
        this.renderTempWire(this.connectingSource.x, this.connectingSource.y, worldPos.x, worldPos.y);
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isConnecting) {
        this.cancelConnecting();
      }
    });
  }

  addNode(typeKey, x, y, customData = null) {
    const typeDef = NODE_TYPES[typeKey] || NODE_TYPES.agent_reasoner;
    const id = `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const node = {
      id,
      type: typeKey,
      name: typeDef.name,
      category: typeDef.category,
      icon: typeDef.icon,
      desc: typeDef.desc,
      portColor: typeDef.portColor,
      x: x || 200 + this.nodes.length * 40,
      y: y || 150 + (this.nodes.length % 3) * 60,
      status: 'idle',
      data: customData ? { ...typeDef.defaultData, ...customData } : { ...typeDef.defaultData },
      inputs: [...typeDef.inputs],
      outputs: [...typeDef.outputs],
      previewText: 'Ready for execution pipeline.',
      metricValue: '0.00 ms'
    };

    this.nodes.push(node);
    this.renderNodeDOM(node);
    this.updateMinimap();
    Audio.click(1200);

    if (this.onLogMessage) {
      this.onLogMessage('INFO', `Spawned node [${node.name}] (${node.id.slice(-6)})`);
    }

    // Initialize node micro canvas renderer
    setTimeout(() => this.initNodeMiniCanvas(node), 50);

    return node;
  }

  removeNode(nodeId) {
    // Cancel anim frame
    if (this.previewAnimFrames.has(nodeId)) {
      cancelAnimationFrame(this.previewAnimFrames.get(nodeId));
      this.previewAnimFrames.delete(nodeId);
    }

    this.wires = this.wires.filter(w => w.fromNodeId !== nodeId && w.toNodeId !== nodeId);
    this.nodes = this.nodes.filter(n => n.id !== nodeId);

    const el = document.getElementById(nodeId);
    if (el) el.remove();

    this.renderWires();
    this.updateMinimap();
    Audio.disconnect();

    if (this.selectedNodeId === nodeId) {
      this.selectedNodeId = null;
      if (this.onSelectNode) this.onSelectNode(null);
    }
  }

  renderNodeDOM(node) {
    const el = document.createElement('div');
    el.className = `canvas-node ${node.status}`;
    el.id = node.id;
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;

    const iconSvg = Icons[node.icon] || Icons.brain;

    el.innerHTML = `
      <div class="node-header">
        <div class="node-header-left">
          <div class="node-icon-chip" style="color: ${node.portColor}; border-color: ${node.portColor}44; background: ${node.portColor}15;">${iconSvg}</div>
          <div class="node-title-group">
            <span class="node-title">${node.name}</span>
            <span class="node-type-label">${node.category}</span>
          </div>
        </div>
        <div class="node-status-badge ${node.status}">
          <span class="badge-dot"></span>
          <span class="badge-text">${node.status}</span>
        </div>
      </div>

      <div class="node-body">
        <div class="node-description">${node.desc}</div>
        
        <!-- Interactive Micro Canvas / Visual Surface -->
        <div class="node-micro-canvas-wrap">
          <canvas id="${node.id}-canvas" class="node-micro-canvas" width="250" height="54"></canvas>
        </div>

        <div class="node-preview-box" id="${node.id}-preview">${node.previewText}</div>
        <div class="node-metric-strip">
          <span>LATENCY / COMPUTE</span>
          <span class="metric-highlight" id="${node.id}-metric">${node.metricValue}</span>
        </div>
      </div>

      <div class="node-ports-row">
        <div class="ports-group inputs">
          ${node.inputs.map(inp => `
            <div class="port-item input" data-port="${inp}" data-type="input" title="Input: ${inp}">
              <div class="port-anchor input-anchor" data-port="${inp}" data-type="input"></div>
              <span>${inp}</span>
            </div>
          `).join('')}
        </div>
        <div class="ports-group outputs">
          ${node.outputs.map(out => `
            <div class="port-item output" data-port="${out}" data-type="output" title="Output: ${out}">
              <span>${out}</span>
              <div class="port-anchor output-anchor" data-port="${out}" data-type="output"></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.container.appendChild(el);
    this.bindNodeEvents(el, node);
  }

  initNodeMiniCanvas(node) {
    const canvas = document.getElementById(`${node.id}-canvas`);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let phase = Math.random() * 10;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      phase += 0.04;

      if (node.type === 'input_vision') {
        // Audio / Visual spectrum waves
        ctx.beginPath();
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.6;
        for (let x = 0; x < canvas.width; x += 4) {
          const y = canvas.height / 2 + Math.sin(x * 0.06 + phase) * 14 * Math.cos(phase * 0.5);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else if (node.type === 'holographic_vis') {
        // 3D rotating wireframe torus / ring
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          const rX = 40 + Math.sin(phase + i) * 8;
          const rY = 16 + Math.cos(phase + i) * 6;
          ctx.ellipse(cx, cy, Math.abs(rX), Math.abs(rY), phase * 0.3 + (i * Math.PI) / 6, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (node.type === 'vector_memory') {
        // 2D Cosine Cluster Points
        ctx.fillStyle = '#3b82f6';
        for (let i = 0; i < 12; i++) {
          const px = 30 + (i * 18 + Math.sin(phase + i) * 8) % (canvas.width - 60);
          const py = 12 + (Math.sin(i * 1.5 + phase) * 14 + 20);
          ctx.beginPath();
          ctx.arc(px, py, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (node.type === 'agent_reasoner') {
        // Tree of Thoughts branching graph
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(20, 27);
        ctx.lineTo(80, 15);
        ctx.moveTo(20, 27);
        ctx.lineTo(80, 39);
        ctx.moveTo(80, 15);
        ctx.lineTo(160, 27 + Math.sin(phase) * 10);
        ctx.moveTo(80, 39);
        ctx.lineTo(160, 27 + Math.sin(phase) * 10);
        ctx.lineTo(230, 27);
        ctx.stroke();

        // Glowing node points
        ctx.fillStyle = '#a855f7';
        [ [20,27], [80,15], [80,39], [160, 27 + Math.sin(phase)*10], [230,27] ].forEach(([x,y]) => {
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI*2);
          ctx.fill();
        });
      } else if (node.type === 'code_sandbox') {
        // Monospace Matrix Stream
        ctx.fillStyle = '#10b981';
        ctx.font = '9px monospace';
        const binary = '01101001 01101110 01110011 01110000 01100101 01100011 01110100';
        const offset = Math.floor(phase * 4) % binary.length;
        ctx.fillText(`EXEC >> ${binary.slice(offset, offset + 28)}`, 10, 24);
        ctx.fillText(`WASM >> [MEM_OK] 0x7FFF8A40 [STATUS: SAFE]`, 10, 42);
      } else {
        // Generic Activity Bar
        ctx.fillStyle = '#f59e0b';
        const barW = (Math.sin(phase) * 0.4 + 0.5) * (canvas.width - 40);
        ctx.fillRect(20, 22, barW, 8);
      }

      this.previewAnimFrames.set(node.id, requestAnimationFrame(render));
    };

    render();
  }

  bindNodeEvents(el, node) {
    const header = el.querySelector('.node-header');
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let nodeStartX = 0;
    let nodeStartY = 0;

    header.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.stopPropagation();

      isDragging = true;
      el.classList.add('dragging');
      this.selectNode(node.id);

      dragStartX = e.clientX;
      dragStartY = e.clientY;
      nodeStartX = node.x;
      nodeStartY = node.y;

      const onMouseMove = (moveEvent) => {
        if (!isDragging) return;
        const dx = (moveEvent.clientX - dragStartX) / this.canvas.zoom;
        const dy = (moveEvent.clientY - dragStartY) / this.canvas.zoom;

        node.x = Math.round(nodeStartX + dx);
        node.y = Math.round(nodeStartY + dy);

        el.style.left = `${node.x}px`;
        el.style.top = `${node.y}px`;

        this.renderWires();
      };

      const onMouseUp = () => {
        isDragging = false;
        el.classList.remove('dragging');
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        this.updateMinimap();
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectNode(node.id);
    });

    const outputAnchors = el.querySelectorAll('.output-anchor');
    outputAnchors.forEach(anchor => {
      anchor.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        const portName = anchor.getAttribute('data-port');
        this.startConnecting(node.id, portName, anchor, true);
      });
    });

    const inputAnchors = el.querySelectorAll('.input-anchor');
    inputAnchors.forEach(anchor => {
      anchor.addEventListener('mouseup', (e) => {
        e.stopPropagation();
        if (this.isConnecting && this.connectingSource && this.connectingSource.isOutput) {
          const portName = anchor.getAttribute('data-port');
          this.connectPorts(this.connectingSource.nodeId, this.connectingSource.portName, node.id, portName);
          this.cancelConnecting();
        }
      });
    });
  }

  selectNode(nodeId) {
    this.selectedNodeId = nodeId;
    const all = this.container.querySelectorAll('.canvas-node');
    all.forEach(el => el.classList.remove('selected'));

    const activeEl = document.getElementById(nodeId);
    if (activeEl) {
      activeEl.classList.add('selected');
    }

    const node = this.nodes.find(n => n.id === nodeId);
    if (this.onSelectNode) {
      this.onSelectNode(node);
    }
    Audio.nodeSelect();
  }

  startConnecting(nodeId, portName, anchorEl, isOutput) {
    this.isConnecting = true;
    anchorEl.classList.add('connecting-source');
    this.canvas.viewport.classList.add('connecting');

    // Highlight compatible input anchors
    const allInputAnchors = this.container.querySelectorAll('.input-anchor');
    allInputAnchors.forEach(a => a.classList.add('compatible-target'));

    const portPos = this.getPortWorldPosition(nodeId, portName, isOutput);
    this.connectingSource = {
      nodeId,
      portName,
      isOutput,
      x: portPos.x,
      y: portPos.y,
      anchorEl
    };
  }

  cancelConnecting() {
    this.isConnecting = false;
    if (this.connectingSource && this.connectingSource.anchorEl) {
      this.connectingSource.anchorEl.classList.remove('connecting-source');
    }
    const allInputAnchors = this.container.querySelectorAll('.input-anchor');
    allInputAnchors.forEach(a => a.classList.remove('compatible-target'));

    this.connectingSource = null;
    this.canvas.viewport.classList.remove('connecting');
    this.tempWire.setAttribute('d', '');
  }

  connectPorts(fromNodeId, fromPort, toNodeId, toPort) {
    if (fromNodeId === toNodeId) return;

    const exists = this.wires.some(w => 
      w.fromNodeId === fromNodeId && w.fromPort === fromPort &&
      w.toNodeId === toNodeId && w.toPort === toPort
    );

    if (exists) return;

    const fromNode = this.nodes.find(n => n.id === fromNodeId);
    const toNode = this.nodes.find(n => n.id === toNodeId);

    const wireId = `wire_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const wire = {
      id: wireId,
      fromNodeId,
      fromPort,
      toNodeId,
      toPort,
      color: fromNode ? fromNode.portColor : '#00f0ff'
    };

    this.wires.push(wire);
    this.renderWires();
    Audio.connect();

    if (this.onLogMessage && fromNode && toNode) {
      this.onLogMessage('SUCCESS', `Neural link established: [${fromNode.name}:${fromPort}] ➔ [${toNode.name}:${toPort}]`);
    }
  }

  removeWire(wireId) {
    this.wires = this.wires.filter(w => w.id !== wireId);
    this.renderWires();
    Audio.disconnect();
  }

  getPortWorldPosition(nodeId, portName, isOutput) {
    const nodeEl = document.getElementById(nodeId);
    if (!nodeEl) return { x: 0, y: 0 };

    const selector = isOutput ? `.output-anchor[data-port="${portName}"]` : `.input-anchor[data-port="${portName}"]`;
    const anchor = nodeEl.querySelector(selector);
    if (!anchor) {
      const node = this.nodes.find(n => n.id === nodeId);
      return {
        x: (node ? node.x : 0) + (isOutput ? 280 : 0),
        y: (node ? node.y : 0) + 100
      };
    }

    const nodeRect = nodeEl.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();

    const node = this.nodes.find(n => n.id === nodeId);
    const relX = (anchorRect.left + anchorRect.width / 2 - nodeRect.left) / this.canvas.zoom;
    const relY = (anchorRect.top + anchorRect.height / 2 - nodeRect.top) / this.canvas.zoom;

    return {
      x: node.x + relX,
      y: node.y + relY
    };
  }

  renderWires() {
    this.wiresGroup.innerHTML = '';

    this.wires.forEach(wire => {
      const start = this.getPortWorldPosition(wire.fromNodeId, wire.fromPort, true);
      const end = this.getPortWorldPosition(wire.toNodeId, wire.toPort, false);

      const pathData = this.calculateBezier(start.x, start.y, end.x, end.y);
      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('d', pathData);
      pathEl.setAttribute('class', 'wire-path');
      pathEl.setAttribute('id', wire.id);

      pathEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeWire(wire.id);
      });

      this.wiresGroup.appendChild(pathEl);
    });
  }

  renderTempWire(x1, y1, x2, y2) {
    const d = this.calculateBezier(x1, y1, x2, y2);
    this.tempWire.setAttribute('d', d);
  }

  calculateBezier(x1, y1, x2, y2) {
    const dx = Math.max(70, Math.abs(x2 - x1) * 0.55);
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  }

  updateMinimap() {
    this.canvas.renderMinimap(this.nodes);
    const countEl = document.getElementById('minimap-node-count');
    if (countEl) countEl.textContent = `${this.nodes.length} Nodes`;

    const statusText = document.getElementById('status-bar-text');
    if (statusText) {
      statusText.innerHTML = `Engine Ready &bull; ${this.nodes.length} Nodes Active &bull; ${this.wires.length} Neural Links`;
    }
  }

  // =========================================================================
  // PIPELINE EXECUTION SIMULATOR & STEP RUNNER
  // =========================================================================
  async runPipeline() {
    if (this.isRunning) return;
    this.isRunning = true;

    const runBtn = document.getElementById('btn-run-pipeline');
    if (runBtn) {
      runBtn.classList.add('running');
      runBtn.innerHTML = `
        <svg class="icon-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
        <span>Synthesizing...</span>
      `;
    }

    if (this.onLogMessage) {
      this.onLogMessage('EXEC', '🚀 Initiating Autonomous Neural Mesh Execution Pipeline...');
    }

    this.nodes.forEach(n => this.setNodeStatus(n.id, 'queued'));

    const sortedNodes = this.getTopologicalOrder();

    for (let i = 0; i < sortedNodes.length; i++) {
      const node = sortedNodes[i];
      await this.executeNodeStep(node);

      const outWires = this.wires.filter(w => w.fromNodeId === node.id);
      outWires.forEach(w => this.animateWirePulse(w.id, node.portColor));
    }

    this.isRunning = false;
    if (runBtn) {
      runBtn.classList.remove('running');
      runBtn.innerHTML = `
        <svg class="icon-svg" viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        <span class="exec-label">Run Mesh</span>
        <kbd class="key-hint">⌘↵</kbd>
      `;
    }

    Audio.complete();
    if (this.onLogMessage) {
      this.onLogMessage('SUCCESS', '✨ Pipeline execution completed successfully with 100% consensus convergence.');
    }
  }

  async executeNodeStep(node) {
    this.setNodeStatus(node.id, 'running');
    Audio.pulse();

    const startT = performance.now();

    const previewEl = document.getElementById(`${node.id}-preview`);
    const metricEl = document.getElementById(`${node.id}-metric`);

    const outputs = {
      input_vision: 'Tensor Embeddings [1x1536] generated. Detected: 4 Spatial Anchors, 2 Dynamic Agents.',
      agent_reasoner: 'CoT Branch #3 selected (Confidence: 99.4%). Plan: Synthesize sub-graph embeddings & compile sandbox routine.',
      vector_memory: 'Retrieved 8 relevant context vectors from HNSW index (Cosine distance: 0.042).',
      code_sandbox: 'Executed isolated WASM runtime: Output shape (128, 4). Exit code 0 (0.84ms execution).',
      router_gate: 'Gate Condition Evaluated: Threshold > 0.88 satisfied. Forwarding to Primary Synthesis Channel.',
      holographic_vis: 'Rendered 3D Latent Topography. Frame buffer: 120 FPS. Shaders converged.',
      action_webhook: 'Dispatched authenticated payload to Cloud Hub (HTTP 200 OK - Roundtrip 18ms).'
    };

    const targetText = outputs[node.type] || 'Step processed successfully.';
    
    if (previewEl) {
      previewEl.textContent = '';
      for (let c = 0; c < targetText.length; c += 3) {
        previewEl.textContent = targetText.slice(0, c + 3);
        await new Promise(r => setTimeout(r, 12));
      }
    } else {
      await new Promise(r => setTimeout(r, 200));
    }

    const elapsed = (performance.now() - startT).toFixed(1);
    if (metricEl) metricEl.textContent = `${elapsed} ms`;
    node.metricValue = `${elapsed} ms`;
    node.previewText = targetText;

    this.setNodeStatus(node.id, 'completed');

    if (this.onLogMessage) {
      this.onLogMessage('INFO', `Node [${node.name}] completed in ${elapsed}ms: ${targetText.slice(0, 45)}...`);
    }
  }

  setNodeStatus(nodeId, status) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;
    node.status = status;

    const el = document.getElementById(nodeId);
    if (el) {
      el.className = `canvas-node ${status} ${this.selectedNodeId === nodeId ? 'selected' : ''}`;
      const badge = el.querySelector('.node-status-badge');
      if (badge) {
        badge.className = `node-status-badge ${status}`;
        badge.querySelector('.badge-text').textContent = status;
      }
    }
  }

  animateWirePulse(wireId, color = '#00f0ff') {
    const pathEl = document.getElementById(wireId);
    if (!pathEl) return;

    pathEl.classList.add('active');
    setTimeout(() => pathEl.classList.remove('active'), 800);

    const length = pathEl.getTotalLength();
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', '5');
    circle.setAttribute('fill', color);
    circle.setAttribute('class', 'wire-pulse-circle');
    this.pulsesGroup.appendChild(circle);

    const startTime = performance.now();
    const duration = 650;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const point = pathEl.getPointAtLength(progress * length);

      circle.setAttribute('cx', point.x);
      circle.setAttribute('cy', point.y);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        circle.remove();
      }
    };

    requestAnimationFrame(animate);
  }

  getTopologicalOrder() {
    const order = [];
    const visited = new Set();

    const visit = (nodeId) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const outgoing = this.wires.filter(w => w.fromNodeId === nodeId);
      outgoing.forEach(w => visit(w.toNodeId));
      order.unshift(this.nodes.find(n => n.id === nodeId));
    };

    this.nodes.forEach(n => {
      const hasInputs = this.wires.some(w => w.toNodeId === n.id);
      if (!hasInputs) visit(n.id);
    });

    this.nodes.forEach(n => {
      if (!visited.has(n.id)) visit(n.id);
    });

    return order.reverse();
  }

  loadWorkflow(templateKey) {
    this.previewAnimFrames.forEach(id => cancelAnimationFrame(id));
    this.previewAnimFrames.clear();

    this.container.innerHTML = '';
    this.wiresGroup.innerHTML = '';
    this.pulsesGroup.innerHTML = '';
    this.nodes = [];
    this.wires = [];

    if (templateKey === 'multimodal-rag') {
      const n1 = this.addNode('input_vision', 140, 180, { prompt: 'Satellite Infrared Telemetry Feed' });
      const n2 = this.addNode('vector_memory', 500, 120, { namespace: 'geospatial-indices' });
      const n3 = this.addNode('agent_reasoner', 500, 380, { model: 'Aether-Reasoner-Ultra' });
      const n4 = this.addNode('holographic_vis', 880, 240, { renderEngine: 'Volumetric Heatmap 3D' });

      this.connectPorts(n1.id, 'tensor_embed', n2.id, 'query_vector');
      this.connectPorts(n1.id, 'metadata', n3.id, 'context_in');
      this.connectPorts(n2.id, 'retrieved_chunks', n3.id, 'memory_in');
      this.connectPorts(n3.id, 'thought_stream', n4.id, 'stream_in');
    } else if (templateKey === 'autonomous-coder') {
      const n1 = this.addNode('input_vision', 120, 200, { prompt: 'Parse AST for Memory Leaks in C++ Kernel' });
      const n2 = this.addNode('agent_reasoner', 480, 160, { model: 'Aether-Coder-DeepTree' });
      const n3 = this.addNode('code_sandbox', 840, 140, { runtime: 'Clang/LLVM Sandbox' });
      const n4 = this.addNode('router_gate', 840, 380, { confidenceThreshold: 0.95 });
      const n5 = this.addNode('action_webhook', 1200, 240, { endpoint: 'https://git.aether.internal/v1/auto-merge' });

      this.connectPorts(n1.id, 'tensor_embed', n2.id, 'context_in');
      this.connectPorts(n2.id, 'tool_call', n3.id, 'code_input');
      this.connectPorts(n3.id, 'execution_result', n4.id, 'eval_signal');
      this.connectPorts(n4.id, 'path_true', n5.id, 'payload_in');
    } else {
      const n1 = this.addNode('input_vision', 100, 220);
      const n2 = this.addNode('vector_memory', 450, 100);
      const n3 = this.addNode('agent_reasoner', 450, 360);
      const n4 = this.addNode('code_sandbox', 820, 120);
      const n5 = this.addNode('router_gate', 820, 380);
      const n6 = this.addNode('holographic_vis', 1180, 240);

      this.connectPorts(n1.id, 'tensor_embed', n2.id, 'query_vector');
      this.connectPorts(n1.id, 'metadata', n3.id, 'context_in');
      this.connectPorts(n2.id, 'retrieved_chunks', n3.id, 'memory_in');
      this.connectPorts(n3.id, 'tool_call', n4.id, 'code_input');
      this.connectPorts(n3.id, 'thought_stream', n5.id, 'eval_signal');
      this.connectPorts(n4.id, 'execution_result', n6.id, 'metrics_in');
      this.connectPorts(n5.id, 'path_true', n6.id, 'stream_in');
    }

    this.updateMinimap();
    this.canvas.zoomToFit(this.nodes);
    this.selectNode(this.nodes[0].id);
  }

  autoAlignNodes() {
    const colMap = new Map();

    this.nodes.forEach(n => {
      const col = Math.floor(n.x / 360);
      if (!colMap.has(col)) colMap.set(col, []);
      colMap.get(col).push(n);
    });

    const sortedCols = Array.from(colMap.keys()).sort((a, b) => a - b);
    sortedCols.forEach((colKey, colIdx) => {
      const colNodes = colMap.get(colKey);
      colNodes.forEach((n, rowIdx) => {
        n.x = 120 + colIdx * 360;
        n.y = 120 + rowIdx * 250;
        const el = document.getElementById(n.id);
        if (el) {
          el.style.left = `${n.x}px`;
          el.style.top = `${n.y}px`;
        }
      });
    });

    this.renderWires();
    this.updateMinimap();
    this.canvas.zoomToFit(this.nodes);
    Audio.click(1400);
  }
}
