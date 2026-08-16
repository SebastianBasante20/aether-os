/**
 * AETHER OS — Command Palette (Raycast / Linear Class)
 */

import { Icons } from '../core/icons.js';
import { Audio } from '../core/audio.js';

export class CommandPalette {
  constructor(actionsHandler) {
    this.handler = actionsHandler;
    this.overlay = document.getElementById('palette-overlay');
    this.input = document.getElementById('palette-input');
    this.resultsContainer = document.getElementById('palette-results');
    this.isOpen = false;
    this.selectedIndex = 0;

    this.commands = [
      {
        id: 'toggle-3d',
        title: 'Enter 3D Quantum Holo-Chamber',
        subtitle: 'Immerse into full 3D WebGL relativistic singularity & particle vortex',
        category: '3D Spatial',
        icon: 'sparkles',
        shortcut: '3 / V',
        action: () => this.handler.toggle3D()
      },
      {
        id: 'run-mesh',
        title: 'Run Neural Mesh',
        subtitle: 'Execute full topological pipeline step-by-step',
        category: 'Execution',
        icon: 'play',
        shortcut: '⌘↵',
        action: () => this.handler.runPipeline()
      },
      {
        id: 'add-vision',
        title: 'Add Multimodal Sensor',
        subtitle: 'Vision, audio, and prompt sensor ingestion node',
        category: 'Add Block',
        icon: 'eye',
        shortcut: '1',
        action: () => this.handler.addNode('input_vision')
      },
      {
        id: 'add-reasoner',
        title: 'Add Neural Agent Core',
        subtitle: 'Recursive Chain-of-Thought reasoning block',
        category: 'Add Block',
        icon: 'brain',
        shortcut: '2',
        action: () => this.handler.addNode('agent_reasoner')
      },
      {
        id: 'add-memory',
        title: 'Add Episodic Vector Memory',
        subtitle: 'HNSW vector store and semantic search retrieval',
        category: 'Add Block',
        icon: 'database',
        shortcut: '3',
        action: () => this.handler.addNode('vector_memory')
      },
      {
        id: 'add-sandbox',
        title: 'Add WASM Code Sandbox',
        subtitle: 'Isolated Python & algorithmic executor',
        category: 'Add Block',
        icon: 'code',
        shortcut: '4',
        action: () => this.handler.addNode('code_sandbox')
      },
      {
        id: 'add-router',
        title: 'Add Conditional Gateway',
        subtitle: 'Dynamic logic router and branching validator',
        category: 'Add Block',
        icon: 'route',
        shortcut: '5',
        action: () => this.handler.addNode('router_gate')
      },
      {
        id: 'add-visualizer',
        title: 'Add Holographic Visualizer',
        subtitle: 'Real-time 3D latent space visualizer',
        category: 'Add Block',
        icon: 'sparkles',
        shortcut: '6',
        action: () => this.handler.addNode('holographic_vis')
      },
      {
        id: 'auto-align',
        title: 'Auto-Align Spatial Layout',
        subtitle: 'Neatly align all nodes in a topological grid',
        category: 'Canvas',
        icon: 'layers',
        shortcut: 'L',
        action: () => this.handler.autoAlign()
      },
      {
        id: 'zoom-fit',
        title: 'Zoom to Fit Viewport',
        subtitle: 'Frame all active nodes inside viewport',
        category: 'Canvas',
        icon: 'sliders',
        shortcut: 'F',
        action: () => this.handler.zoomFit()
      },
      {
        id: 'theme-obsidian',
        title: 'Switch Theme: Obsidian Carbon',
        subtitle: 'Deep dark luxury palette with neon cyan accents',
        category: 'Themes',
        icon: 'sparkles',
        shortcut: 'T1',
        action: () => this.handler.setTheme('obsidian')
      },
      {
        id: 'theme-cyber',
        title: 'Switch Theme: Cyber Titanium',
        subtitle: 'Gunmetal slate palette with laser indigo accents',
        category: 'Themes',
        icon: 'sparkles',
        shortcut: 'T2',
        action: () => this.handler.setTheme('cyber')
      },
      {
        id: 'theme-mono',
        title: 'Switch Theme: Swiss Monochrome',
        subtitle: 'High-contrast minimalist Swiss typography',
        category: 'Themes',
        icon: 'sparkles',
        shortcut: 'T3',
        action: () => this.handler.setTheme('monochrome')
      },
      {
        id: 'toggle-telemetry',
        title: 'Toggle Telemetry & Log Stream',
        subtitle: 'Expand or collapse bottom telemetry panel',
        category: 'Panels',
        icon: 'terminal',
        shortcut: '`',
        action: () => this.handler.toggleTelemetry()
      }
    ];

    this.filteredCommands = [...this.commands];
    this.init();
  }

  init() {
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.toggle();
      } else if (e.key === 'Escape' && this.isOpen) {
        this.close();
      } else if (this.isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.moveSelection(1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.moveSelection(-1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          this.executeSelected();
        }
      }
    });

    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.close();
        }
      });
    }

    if (this.input) {
      this.input.addEventListener('input', () => {
        this.filter(this.input.value);
      });
    }
  }

  open() {
    this.isOpen = true;
    this.overlay.classList.remove('hidden');
    this.input.value = '';
    this.filter('');
    setTimeout(() => this.input.focus(), 50);
    Audio.click(1400);
  }

  close() {
    this.isOpen = false;
    this.overlay.classList.add('hidden');
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  filter(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
      this.filteredCommands = [...this.commands];
    } else {
      this.filteredCommands = this.commands.filter(cmd => 
        cmd.title.toLowerCase().includes(q) ||
        cmd.subtitle.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q)
      );
    }
    this.selectedIndex = 0;
    this.renderResults();
  }

  moveSelection(delta) {
    if (this.filteredCommands.length === 0) return;
    this.selectedIndex = (this.selectedIndex + delta + this.filteredCommands.length) % this.filteredCommands.length;
    this.renderResults();
    Audio.click(1600);
  }

  executeSelected() {
    if (this.filteredCommands[this.selectedIndex]) {
      const cmd = this.filteredCommands[this.selectedIndex];
      this.close();
      cmd.action();
    }
  }

  renderResults() {
    if (!this.resultsContainer) return;
    this.resultsContainer.innerHTML = '';

    if (this.filteredCommands.length === 0) {
      this.resultsContainer.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-muted);">
          No matching commands found.
        </div>
      `;
      return;
    }

    const groups = {};
    this.filteredCommands.forEach((cmd, idx) => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push({ cmd, flatIndex: idx });
    });

    Object.keys(groups).forEach(category => {
      const header = document.createElement('div');
      header.className = 'palette-group-header';
      header.textContent = category;
      this.resultsContainer.appendChild(header);

      groups[category].forEach(({ cmd, flatIndex }) => {
        const item = document.createElement('div');
        item.className = `palette-item ${flatIndex === this.selectedIndex ? 'selected' : ''}`;

        const iconSvg = Icons[cmd.icon] || Icons.zap;

        item.innerHTML = `
          <div class="palette-item-left">
            <div class="palette-item-icon">${iconSvg}</div>
            <div class="palette-item-text">
              <span class="palette-item-title">${cmd.title}</span>
              <span class="palette-item-subtitle">${cmd.subtitle}</span>
            </div>
          </div>
          ${cmd.shortcut ? `<span class="palette-item-shortcut">${cmd.shortcut}</span>` : ''}
        `;

        item.addEventListener('mouseenter', () => {
          this.selectedIndex = flatIndex;
          this.renderResults();
        });

        item.addEventListener('click', () => {
          this.close();
          cmd.action();
        });

        this.resultsContainer.appendChild(item);
      });
    });
  }
}
