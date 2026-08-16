/**
 * AETHER OS — Telemetry & Live Ops Studio Component
 * Real-time sparkline performance charts & streaming log terminal
 */

export class TelemetryStudio {
  constructor() {
    this.panel = document.getElementById('telemetry-panel');
    this.feed = document.getElementById('terminal-feed');
    this.collapseBtn = document.getElementById('btn-collapse-telemetry');
    this.clearBtn = document.getElementById('btn-clear-logs');
    this.filterTabs = document.querySelectorAll('.log-tab');

    this.activeFilter = 'all';
    this.logs = [];

    // Sparkline Canvas Contexts
    this.charts = {
      tokens: {
        canvas: document.getElementById('chart-tokens'),
        valEl: document.getElementById('val-chart-tokens'),
        chipEl: document.getElementById('chip-tps'),
        data: Array(25).fill(1600),
        min: 1000,
        max: 2600,
        color: '#00f0ff',
        unit: 't/s'
      },
      latency: {
        canvas: document.getElementById('chart-latency'),
        valEl: document.getElementById('val-chart-latency'),
        chipEl: document.getElementById('chip-latency'),
        data: Array(25).fill(42),
        min: 20,
        max: 90,
        color: '#3b82f6',
        unit: 'ms'
      },
      compute: {
        canvas: document.getElementById('chart-compute'),
        valEl: document.getElementById('val-chart-compute'),
        data: Array(25).fill(38),
        min: 10,
        max: 95,
        color: '#a855f7',
        unit: '%'
      },
      confidence: {
        canvas: document.getElementById('chart-confidence'),
        valEl: document.getElementById('val-chart-confidence'),
        data: Array(25).fill(98),
        min: 80,
        max: 100,
        color: '#10b981',
        unit: '%'
      }
    };

    this.init();
  }

  init() {
    // Event listeners
    if (this.collapseBtn) {
      this.collapseBtn.addEventListener('click', () => {
        this.panel.classList.toggle('collapsed');
      });
    }

    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => {
        this.clearLogs();
      });
    }

    this.filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeFilter = tab.getAttribute('data-filter');
        this.renderLogs();
      });
    });

    // Start background telemetry tick
    this.startTelemetryTick();

    // Initial system greeting logs
    this.addLog('INFO', 'AETHER OS Kernel v2.4 initialized. Neural fabric online.');
    this.addLog('INFO', 'CUDA GPU Acceleration: 16x Tensor Cores active (Sub-50ms latency target).');
    this.addLog('SUCCESS', 'Telemetry metrics stream connected at 60Hz.');
  }

  startTelemetryTick() {
    setInterval(() => {
      // Fluctuate tokens
      const tps = Math.round(1800 + (Math.random() - 0.5) * 450);
      this.pushChartData('tokens', tps);

      // Fluctuate latency
      const lat = Math.round(38 + (Math.random() - 0.5) * 12);
      this.pushChartData('latency', lat);

      // Fluctuate compute
      const comp = +(35 + (Math.random() - 0.5) * 8).toFixed(1);
      this.pushChartData('compute', comp);

      // Fluctuate confidence
      const conf = +(99.1 + (Math.random() - 0.5) * 0.8).toFixed(1);
      this.pushChartData('confidence', conf);

      // Draw all sparklines
      Object.keys(this.charts).forEach(key => this.drawSparkline(key));
    }, 450);
  }

  pushChartData(key, value) {
    const chart = this.charts[key];
    if (!chart) return;

    chart.data.shift();
    chart.data.push(value);

    if (chart.valEl) {
      chart.valEl.textContent = `${value} ${chart.unit}`;
    }
    if (chart.chipEl) {
      chart.chipEl.textContent = `${value} ${chart.unit}`;
    }
  }

  drawSparkline(key) {
    const chart = this.charts[key];
    if (!chart || !chart.canvas) return;

    const canvas = chart.canvas;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const data = chart.data;
    const min = chart.min;
    const max = chart.max;
    const range = max - min || 1;

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, chart.color + '44');
    grad.addColorStop(1, chart.color + '00');

    ctx.beginPath();
    const step = w / (data.length - 1);

    data.forEach((val, i) => {
      const normalized = Math.max(0, Math.min(1, (val - min) / range));
      const y = h - normalized * (h - 8) - 4;
      const x = i * step;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    // Stroke line
    ctx.strokeStyle = chart.color;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Area fill
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw end glowing point
    const lastVal = data[data.length - 1];
    const lastNorm = Math.max(0, Math.min(1, (lastVal - min) / range));
    const lastY = h - lastNorm * (h - 8) - 4;

    ctx.beginPath();
    ctx.arc(w - 2, lastY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = chart.color;
    ctx.fill();
  }

  addLog(level, message) {
    const time = new Date().toTimeString().split(' ')[0] + '.' + String(Date.now() % 1000).padStart(3, '0');
    const logItem = { level, message, time };

    this.logs.push(logItem);
    if (this.logs.length > 200) this.logs.shift();

    if (this.activeFilter === 'all' || this.activeFilter === level.toLowerCase()) {
      this.appendLogDOM(logItem);
    }
  }

  appendLogDOM(logItem) {
    if (!this.feed) return;

    const entry = document.createElement('div');
    entry.className = 'log-entry';

    let tagClass = 'tag-info';
    if (logItem.level === 'EXEC') tagClass = 'tag-exec';
    if (logItem.level === 'WARN') tagClass = 'tag-warn';
    if (logItem.level === 'SUCCESS') tagClass = 'tag-success';

    entry.innerHTML = `
      <span class="log-timestamp">${logItem.time}</span>
      <span class="log-tag ${tagClass}">${logItem.level}</span>
      <span class="log-message">${logItem.message}</span>
    `;

    this.feed.appendChild(entry);
    this.feed.scrollTop = this.feed.scrollHeight;
  }

  renderLogs() {
    if (!this.feed) return;
    this.feed.innerHTML = '';

    const filtered = this.activeFilter === 'all' 
      ? this.logs 
      : this.logs.filter(l => l.level.toLowerCase() === this.activeFilter);

    filtered.forEach(item => this.appendLogDOM(item));
  }

  clearLogs() {
    this.logs = [];
    if (this.feed) this.feed.innerHTML = '';
    this.addLog('INFO', 'Logs buffer cleared.');
  }

  togglePanel() {
    this.panel.classList.toggle('collapsed');
  }
}
