/**
 * AETHER OS — Toolbar, Theme Engine, Toast & Quick Node Picker Component
 */

import { NODE_TYPES } from '../core/node-graph.js';
import { Icons } from '../core/icons.js';
import { Audio } from '../core/audio.js';

export class ToolbarManager {
  constructor(nodeGraphInstance, onOpenPalette) {
    this.graph = nodeGraphInstance;
    this.openPalette = onOpenPalette;

    this.workflowBtn = document.getElementById('btn-workflow-select');
    this.workflowMenu = document.getElementById('workflow-menu');
    this.workflowTitle = document.getElementById('current-workflow-title');

    this.themeBtn = document.getElementById('btn-theme-switch');
    this.themeMenu = document.getElementById('theme-menu');

    this.audioBtn = document.getElementById('btn-toggle-audio');
    this.quickAddBtn = document.getElementById('btn-quick-add-node');

    this.pickerOverlay = document.getElementById('node-picker-overlay');
    this.pickerList = document.getElementById('picker-list');

    this.init();
  }

  init() {
    // Workflow selector
    if (this.workflowBtn && this.workflowMenu) {
      this.workflowBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.workflowMenu.classList.toggle('show');
        this.themeMenu.classList.remove('show');
      });

      const options = this.workflowMenu.querySelectorAll('.workflow-option');
      options.forEach(opt => {
        opt.addEventListener('click', () => {
          options.forEach(o => o.classList.remove('active'));
          opt.classList.add('active');
          const wfKey = opt.getAttribute('data-workflow');
          const wfName = opt.querySelector('.wf-name').textContent;
          this.workflowTitle.textContent = wfName;
          this.workflowMenu.classList.remove('show');
          this.graph.loadWorkflow(wfKey);
          this.toast('info', `Loaded workflow: ${wfName}`);
        });
      });
    }

    // Theme selector
    if (this.themeBtn && this.themeMenu) {
      this.themeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.themeMenu.classList.toggle('show');
        this.workflowMenu.classList.remove('show');
      });

      const themeOptions = this.themeMenu.querySelectorAll('.theme-option');
      themeOptions.forEach(opt => {
        opt.addEventListener('click', () => {
          const theme = opt.getAttribute('data-theme');
          this.setTheme(theme);
          themeOptions.forEach(o => o.classList.remove('active'));
          opt.classList.add('active');
          this.themeMenu.classList.remove('show');
        });
      });
    }

    // Close dropdowns on outside click
    window.addEventListener('click', () => {
      if (this.workflowMenu) this.workflowMenu.classList.remove('show');
      if (this.themeMenu) this.themeMenu.classList.remove('show');
    });

    // Audio toggle
    if (this.audioBtn) {
      this.audioBtn.addEventListener('click', () => {
        const isEnabled = Audio.toggle();
        const onIcon = this.audioBtn.querySelector('.audio-on-icon');
        const offIcon = this.audioBtn.querySelector('.audio-off-icon');
        if (isEnabled) {
          onIcon.classList.remove('hidden');
          offIcon.classList.add('hidden');
          this.audioBtn.classList.remove('active-toggle');
          Audio.click(1400);
          this.toast('info', 'Acoustic UI Audio Enabled');
        } else {
          onIcon.classList.add('hidden');
          offIcon.classList.remove('hidden');
          this.audioBtn.classList.add('active-toggle');
          this.toast('info', 'Acoustic UI Audio Muted');
        }
      });
    }

    // Quick Add Node Picker
    if (this.quickAddBtn) {
      this.quickAddBtn.addEventListener('click', () => {
        this.openNodePicker();
      });
    }

    if (this.pickerOverlay) {
      this.pickerOverlay.addEventListener('click', (e) => {
        if (e.target === this.pickerOverlay) {
          this.closeNodePicker();
        }
      });
    }

    this.renderNodePickerList();
  }

  setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    this.toast('info', `Theme switched to ${themeName.toUpperCase()}`);
    Audio.click(1500);
  }

  renderNodePickerList() {
    if (!this.pickerList) return;
    this.pickerList.innerHTML = '';

    const keys = Object.keys(NODE_TYPES);
    keys.forEach((key, idx) => {
      const typeDef = NODE_TYPES[key];
      const item = document.createElement('div');
      item.className = 'picker-node-item';

      const iconSvg = Icons[typeDef.icon] || Icons.brain;

      item.innerHTML = `
        <div class="picker-node-info">
          <div class="picker-icon-box">${iconSvg}</div>
          <div>
            <div class="picker-node-name">${typeDef.name}</div>
            <div class="picker-node-desc">${typeDef.desc}</div>
          </div>
        </div>
        <span class="picker-num-key">${idx + 1}</span>
      `;

      item.addEventListener('click', () => {
        this.closeNodePicker();
        this.addNodeToCenter(key);
      });

      this.pickerList.appendChild(item);
    });
  }

  openNodePicker() {
    if (this.pickerOverlay) {
      this.pickerOverlay.classList.remove('hidden');
      Audio.click(1200);
    }
  }

  closeNodePicker() {
    if (this.pickerOverlay) {
      this.pickerOverlay.classList.add('hidden');
    }
  }

  addNodeToCenter(typeKey) {
    const vRect = this.graph.canvas.viewport.getBoundingClientRect();
    const centerWorld = this.graph.canvas.screenToWorld(
      vRect.left + vRect.width / 2 - 140,
      vRect.top + vRect.height / 2 - 100
    );

    const node = this.graph.addNode(typeKey, Math.round(centerWorld.x), Math.round(centerWorld.y));
    this.graph.selectNode(node.id);
    this.toast('success', `Created [${node.name}] block.`);
  }

  toast(type, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : '•'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px) scale(0.95)';
      setTimeout(() => toast.remove(), 200);
    }, 2800);
  }
}
