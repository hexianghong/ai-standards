/**
 * Health Inspection & Scheduled Diagnosis Service
 * 提供高性能系统健康度评分、即时深度诊断与定时巡检引擎
 */

const os = require('os');
const fs = require('fs');

class InspectionService {
  constructor() {
    this.history = [];
    this.maxHistory = 20;
    this.timer = null;
    this.intervalSeconds = 60;
    this.isScheduled = false;

    // Start default timer (every 60s)
    this.startSchedule(60);
  }

  // Measure Node.js event loop lag
  async measureEventLoopLag() {
    return new Promise(resolve => {
      const start = process.hrtime();
      setImmediate(() => {
        const delta = process.hrtime(start);
        const ms = (delta[0] * 1000) + (delta[1] / 1e6);
        resolve(Math.round(ms * 100) / 100);
      });
    });
  }

  // Run full system diagnosis
  async runDiagnosis() {
    const startTime = Date.now();
    let score = 100;
    const deductions = [];
    const suggestions = [];

    // 1. Memory Check
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = Math.round((usedMem / totalMem) * 100);
    const procMem = process.memoryUsage();
    let memStatus = 'healthy';

    if (memUsagePercent > 90) {
      memStatus = 'critical';
      score -= 30;
      deductions.push('系统物理内存占用超过 90%');
      suggestions.push('建议排查是否有内存泄漏或增加宿主机内存配额');
    } else if (memUsagePercent > 80) {
      memStatus = 'warning';
      score -= 15;
      deductions.push('系统物理内存占用偏高 (>80%)');
      suggestions.push('注意监控应用内存增长趋势');
    }

    // 2. CPU Load Check
    const loadAvg = os.loadavg();
    const cpuCount = os.cpus().length || 1;
    const normalizedLoad1m = Math.round((loadAvg[0] / cpuCount) * 100) / 100;
    let cpuStatus = 'healthy';

    if (normalizedLoad1m > 1.5) {
      cpuStatus = 'critical';
      score -= 30;
      deductions.push(`CPU 1分钟负载偏高 (Load: ${loadAvg[0].toFixed(2)}, 核数: ${cpuCount})`);
      suggestions.push('排查高 CPU 密集计算线程或死循环');
    } else if (normalizedLoad1m > 1.0) {
      cpuStatus = 'warning';
      score -= 10;
      deductions.push('CPU 处于高负载运行状态');
    }

    // 3. Event Loop Lag Check
    const lagMs = await this.measureEventLoopLag();
    let eventLoopStatus = 'healthy';
    if (lagMs > 100) {
      eventLoopStatus = 'critical';
      score -= 25;
      deductions.push(`Node.js 事件循环延迟过高: ${lagMs}ms`);
      suggestions.push('避免在主线程中执行耗时的同步 I/O 或大计算任务');
    } else if (lagMs > 30) {
      eventLoopStatus = 'warning';
      score -= 10;
      deductions.push(`事件循环存在轻微抖动: ${lagMs}ms`);
    }

    // 4. Overall Status
    score = Math.max(0, Math.min(100, score));
    let overallStatus = 'healthy';
    if (score < 60) overallStatus = 'critical';
    else if (score < 85) overallStatus = 'warning';

    if (suggestions.length === 0) {
      suggestions.push('各项系统运行指标处于健康区间，性能优异');
    }

    const report = {
      score,
      status: overallStatus,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      metrics: {
        memory: {
          totalMB: Math.round(totalMem / (1024 * 1024)),
          usedMB: Math.round(usedMem / (1024 * 1024)),
          freeMB: Math.round(freeMem / (1024 * 1024)),
          usagePercent: memUsagePercent,
          processRssMB: Math.round(procMem.rss / (1024 * 1024)),
          processHeapUsedMB: Math.round(procMem.heapUsed / (1024 * 1024)),
          status: memStatus
        },
        cpu: {
          cores: cpuCount,
          load1m: Math.round(loadAvg[0] * 100) / 100,
          load5m: Math.round(loadAvg[1] * 100) / 100,
          load15m: Math.round(loadAvg[2] * 100) / 100,
          normalizedLoad: normalizedLoad1m,
          status: cpuStatus
        },
        eventLoop: {
          lagMs,
          status: eventLoopStatus
        }
      },
      deductions,
      suggestions
    };

    this.history.unshift(report);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    return report;
  }

  // Quick health check for status badges
  async getQuickHealth() {
    if (this.history.length > 0) {
      const latest = this.history[0];
      return {
        score: latest.score,
        status: latest.status,
        timestamp: latest.timestamp,
        metrics: {
          memUsagePercent: latest.metrics.memory.usagePercent,
          normalizedLoad1m: latest.metrics.cpu.normalizedLoad,
          lagMs: latest.metrics.eventLoop.lagMs
        }
      };
    }
    const report = await this.runDiagnosis();
    return {
      score: report.score,
      status: report.status,
      timestamp: report.timestamp,
      metrics: {
        memUsagePercent: report.metrics.memory.usagePercent,
        normalizedLoad1m: report.metrics.cpu.normalizedLoad,
        lagMs: report.metrics.eventLoop.lagMs
      }
    };
  }

  // Get diagnostic historical snapshots
  getHistory() {
    return this.history;
  }

  // Start periodic background inspection schedule
  startSchedule(intervalSeconds) {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.intervalSeconds = Number(intervalSeconds) || 60;
    this.isScheduled = true;
    this.timer = setInterval(async () => {
      try {
        await this.runDiagnosis();
      } catch (err) {
        console.error('[Inspection] 定时巡检执行异常:', err.message);
      }
    }, this.intervalSeconds * 1000);
    if (typeof this.timer.unref === 'function') {
      this.timer.unref();
    }
  }

  // Stop periodic inspection
  stopSchedule() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isScheduled = false;
  }
}

const inspectionService = new InspectionService();
module.exports = inspectionService;
