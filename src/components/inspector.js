/**
 * AETHER OS — Node Inspector Drawer Component
 */

import { Icons } from '../core/icons.js';
import { Audio } from '../core/audio.js';

export class NodeInspector {
  constructor(nodeGraphInstance, onToast) {
    this.graph = nodeGraphInstance;
    this.onToast = onToast;

    this.drawer = document.getElementById('inspector-drawer');
    this.titleEl = document.getElementById('ins-title');
    this.typeEl = document.getElementById('ins-type');
    this.iconEl = document.getElementById('ins-node-icon');
    this.contentEl = document.getElementById('inspector-content');
    this.closeBtn = document.getElementById('btn-close-inspector');

    this.currentNode = null;

    this.init();
  }

  init() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => {
        this.deselect();
      });
    }
  }

  inspect(node) {
    this.currentNode = node;

    if (!node) {
      this.showEmptyState();
      return;
    }

    this.titleEl.textContent = node.name;
    this.typeEl.textContent = `${node.category} • ID: ${node.id.slice(-6)}`;
    this.iconEl.innerHTML = Icons[node.icon] || Icons.brain;

    this.renderForm(node);
  }

  showEmptyState() {
    this.titleEl.textContent = 'Node Inspector';
    this.typeEl.textContent = 'Select a node on canvas';
    this.iconEl.innerHTML = Icons.sliders;

    this.contentEl.innerHTML = `
      <div class="inspector-empty-state">
        <div class="empty-glow-orb"></div>
        <p>Click any neural block on the spatial canvas to inspect its internal parameters, memory tensors, execution logs, and live code.</p>
      </div>
    `;
  }

  deselect() {
    this.currentNode = null;
    this.showEmptyState();
    if (this.graph) {
      this.graph.selectedNodeId = null;
      const all = document.querySelectorAll('.canvas-node');
      all.forEach(el => el.classList.remove('selected'));
    }
  }

  renderForm(node) {
    this.contentEl.innerHTML = `
      <!-- Execute Step Single Button -->
      <button class="ins-exec-btn" id="ins-btn-test-step">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        <span>Execute Step (Isolate Test)</span>
      </button>

      <!-- Parameters Section -->
      <div class="ins-section">
        <span class="ins-section-title">Configuration Parameters</span>
        
        <div class="ins-form-group">
          <label class="ins-label">Node Identifier</label>
          <input type="text" class="ins-input" value="${node.name}" id="field-node-name">
        </div>

        ${this.renderCustomFields(node)}
      </div>

      <!-- Live JSON Data View -->
      <div class="ins-section">
        <span class="ins-section-title">Live Memory Payload</span>
        <pre class="ins-code-preview" id="ins-json-preview">${JSON.stringify({
          id: node.id,
          type: node.type,
          status: node.status,
          latency: node.metricValue,
          data: node.data
        }, null, 2)}</pre>
      </div>

      <!-- Delete Node Action -->
      <button class="ins-danger-btn" id="ins-btn-delete-node">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        <span>Delete Neural Block</span>
      </button>
    `;

    // Bind form events
    const nameInput = document.getElementById('field-node-name');
    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        node.name = e.target.value;
        const nodeTitle = document.querySelector(`#${node.id} .node-title`);
        if (nodeTitle) nodeTitle.textContent = node.name;
        this.updateJsonPreview(node);
      });
    }

    const testBtn = document.getElementById('ins-btn-test-step');
    if (testBtn) {
      testBtn.addEventListener('click', async () => {
        await this.graph.executeNodeStep(node);
        this.updateJsonPreview(node);
        if (this.onToast) this.onToast('success', `Tested node [${node.name}] successfully.`);
      });
    }

    const delBtn = document.getElementById('ins-btn-delete-node');
    if (delBtn) {
      delBtn.addEventListener('click', () => {
        this.graph.removeNode(node.id);
        this.deselect();
        if (this.onToast) this.onToast('info', 'Node deleted.');
      });
    }

    this.bindCustomFieldEvents(node);
  }

  renderCustomFields(node) {
    if (node.type === 'agent_reasoner') {
      return `
        <div class="ins-form-group">
          <label class="ins-label">Model Target</label>
          <input type="text" class="ins-input" value="${node.data.model || 'Aether-Reasoner-Ultra'}" id="field-model">
        </div>
        <div class="ins-form-group">
          <label class="ins-label">
            <span>Temperature</span>
            <span class="ins-slider-val" id="val-temp">${node.data.temperature || 0.2}</span>
          </label>
          <div class="ins-slider-wrap">
            <input type="range" class="ins-range-slider" min="0" max="1" step="0.05" value="${node.data.temperature || 0.2}" id="field-temp">
          </div>
        </div>
        <div class="ins-form-group">
          <label class="ins-label">System Instruction</label>
          <textarea class="ins-textarea" id="field-prompt">${node.data.systemPrompt || ''}</textarea>
        </div>
      `;
    }

    if (node.type === 'input_vision') {
      return `
        <div class="ins-form-group">
          <label class="ins-label">Prompt / Ingestion Directive</label>
          <textarea class="ins-textarea" id="field-prompt">${node.data.prompt || ''}</textarea>
        </div>
        <div class="ins-form-group">
          <label class="ins-label">Modality</label>
          <input type="text" class="ins-input" value="${node.data.modality || 'Vision + Audio + Text'}" id="field-modality">
        </div>
      `;
    }

    if (node.type === 'code_sandbox') {
      return `
        <div class="ins-form-group">
          <label class="ins-label">Runtime Engine</label>
          <input type="text" class="ins-input" value="${node.data.runtime || 'Python 3.12 (Isolated WASM)'}" id="field-runtime">
        </div>
        <div class="ins-form-group">
          <label class="ins-label">Executable Python Routine</label>
          <textarea class="ins-textarea" style="font-family: var(--font-mono); min-height: 110px;" id="field-code">${node.data.code || ''}</textarea>
        </div>
      `;
    }

    return `
      <div class="ins-form-group">
        <label class="ins-label">Primary Descriptor</label>
        <textarea class="ins-textarea" id="field-generic">${node.desc}</textarea>
      </div>
    `;
  }

  bindCustomFieldEvents(node) {
    const tempSlider = document.getElementById('field-temp');
    const tempVal = document.getElementById('val-temp');
    if (tempSlider && tempVal) {
      tempSlider.addEventListener('input', (e) => {
        node.data.temperature = parseFloat(e.target.value);
        tempVal.textContent = node.data.temperature;
        this.updateJsonPreview(node);
      });
    }

    const promptField = document.getElementById('field-prompt');
    if (promptField) {
      promptField.addEventListener('input', (e) => {
        if (node.data.systemPrompt !== undefined) node.data.systemPrompt = e.target.value;
        if (node.data.prompt !== undefined) node.data.prompt = e.target.value;
        this.updateJsonPreview(node);
      });
    }

    const codeField = document.getElementById('field-code');
    if (codeField) {
      codeField.addEventListener('input', (e) => {
        node.data.code = e.target.value;
        this.updateJsonPreview(node);
      });
    }
  }

  updateJsonPreview(node) {
    const jsonEl = document.getElementById('ins-json-preview');
    if (jsonEl) {
      jsonEl.textContent = JSON.stringify({
        id: node.id,
        type: node.type,
        status: node.status,
        latency: node.metricValue,
        data: node.data
      }, null, 2);
    }
  }
}
