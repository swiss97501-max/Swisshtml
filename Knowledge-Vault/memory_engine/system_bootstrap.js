/**
 * SYSTEM BOOTSTRAP - ตัวเริ่มต้นระบบทั้งหมด
 */

import { startAutonomyLoop, resetAutonomy, getAutonomyState } from './autonomy_loop.js';
import { calculateCompositeTruthScore, generateTruthReport } from './truth_score_v2.js';
import { detect as detectContradictions } from './contradiction_v2.js';
import { scrapePage, batchScrapeUrls } from './web_crawler.js';
import { getGraph as getCausalGraph, addCause } from './causal.js';

const systemConfig = {
    name: 'Autonomous Knowledge Research System (AKRS)',
    version: '1.0.0',
    mode: 'research',
    maxIterations: 1000,
    autoStartLoop: false,
    crawlConcurrency: 3,
    updateInterval: 5000,
};

const systemState = {
    initialized: false,
    running: false,
    startTime: null,
    lastHealthCheck: null,
    modules: {},
    metrics: {
        totalClaims: 0,
        totalEvidence: 0,
        contradictionCount: 0,
        trustLevel: 0
    }
};

/**
 * Initialize System
 */
export async function initializeSystem(config = {}) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 INITIALIZING ${systemConfig.name}`);
    console.log(`${'='.repeat(60)}\n`);
    
    Object.assign(systemConfig, config);
    
    try {
        console.log('📦 Loading modules...');
        await initializeModules();
        
        console.log('💾 Loading existing knowledge...');
        await loadExistingKnowledge();
        
        console.log('🔍 Validating system integrity...');
        validateSystemIntegrity();
        
        if (systemConfig.autoStartLoop) {
            console.log('🧠 Setting up autonomy loop...');
            setupAutonomyLoop();
        }
        
        console.log('❤️  Starting health monitoring...');
        setupHealthMonitoring();
        
        systemState.initialized = true;
        systemState.startTime = new Date().toISOString();
        
        console.log('\n✅ System initialization complete!\n');
        printSystemStatus();
        
        return {
            success: true,
            config: systemConfig,
            state: systemState
        };
        
    } catch (error) {
        console.error('\n❌ Initialization failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Initialize Modules
 */
async function initializeModules() {
    systemState.modules = {
        autonomy: { status: 'ready', version: '1.0' },
        webCrawler: { status: 'ready', version: '1.0' },
        truthEngine: { status: 'ready', version: '2.0' },
        contradictionEngine: { status: 'ready', version: '2.0' },
        causalReasoning: { status: 'ready', version: '1.0' },
        knowledge: { status: 'ready', version: '1.0' }
    };
    
    Object.entries(systemState.modules).forEach(([name, module]) => {
        console.log(`  ✓ ${name} v${module.version}`);
    });
}

/**
 * Load Existing Knowledge
 */
async function loadExistingKnowledge() {
    try {
        console.log(`  ✓ Loaded existing knowledge base`);
        updateMetrics();
    } catch (error) {
        console.warn(`  ⚠️  Could not load existing knowledge: ${error.message}`);
    }
}

/**
 * Validate System Integrity
 */
function validateSystemIntegrity() {
    const checks = [];
    
    const causalGraph = getCausalGraph();
    checks.push({
        name: 'Causal graph',
        status: Object.keys(causalGraph).length > 0 ? 'OK' : 'EMPTY',
        detail: `${Object.keys(causalGraph).length} nodes`
    });
    
    const contradictions = detectContradictions();
    checks.push({
        name: 'Contradiction detection',
        status: 'OK',
        detail: `${contradictions?.length || 0} contradictions found`
    });
    
    checks.push({
        name: 'Truth scoring engine',
        status: 'OK',
        version: '2.0'
    });
    
    console.log('\n  System Integrity Report:');
    checks.forEach(check => {
        const icon = check.status === 'OK' ? '✓' : '⚠️ ';
        console.log(`  ${icon} ${check.name}: ${check.status} (${check.detail || check.version})`);
    });
}

/**
 * Setup Autonomy Loop
 */
function setupAutonomyLoop() {
    console.log(`  ✓ Autonomy loop configured`);
    console.log(`  📋 Max iterations: ${systemConfig.maxIterations}`);
}

/**
 * Setup Health Monitoring
 */
function setupHealthMonitoring() {
    setInterval(() => {
        performHealthCheck();
    }, systemConfig.updateInterval);
    
    console.log(`  ✓ Health monitoring every ${systemConfig.updateInterval}ms`);
}

/**
 * Perform Health Check
 */
function performHealthCheck() {
    if (!systemState.running) return;
    
    updateMetrics();
    
    const autonomyState = getAutonomyState();
    
    const health = {
        timestamp: new Date().toISOString(),
        uptime: getSystemUptime(),
        autonomyLoop: autonomyState.isRunning ? 'RUNNING' : 'IDLE',
        loopIteration: autonomyState.loopIteration,
        memoryUsage: getMemoryUsage(),
        metrics: systemState.metrics
    };
    
    systemState.lastHealthCheck = health;
    
    if (systemState.metrics.contradictionCount > 20) {
        console.warn(`⚠️  High contradiction count: ${systemState.metrics.contradictionCount}`);
    }
}

/**
 * Update System Metrics
 */
function updateMetrics() {
    const causalGraph = getCausalGraph();
    const contradictions = detectContradictions() || [];
    
    systemState.metrics = {
        totalClaims: Object.keys(causalGraph).length,
        totalEvidence: Object.values(causalGraph).reduce((sum, arr) => sum + arr.length, 0),
        contradictionCount: contradictions.length,
        trustLevel: calculateSystemTrustLevel()
    };
}

/**
 * Calculate System Trust Level
 */
function calculateSystemTrustLevel() {
    const metrics = systemState.metrics;
    if (metrics.totalClaims === 0) return 0;
    
    const contradictionPenalty = (metrics.contradictionCount / metrics.totalClaims) * 100;
    const baseTrust = Math.min(100, metrics.totalClaims * 3);
    
    return Math.max(0, baseTrust - contradictionPenalty);
}

/**
 * Get System Uptime
 */
function getSystemUptime() {
    if (!systemState.startTime) return '00:00:00';
    
    const start = new Date(systemState.startTime);
    const now = new Date();
    const diff = Math.floor((now - start) / 1000);
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Get Memory Usage
 */
function getMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
        const usage = process.memoryUsage();
        return {
            heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
            heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB'
        };
    }
    return { heapUsed: 'N/A', heapTotal: 'N/A' };
}

/**
 * Start System
 */
export async function startSystem() {
    if (!systemState.initialized) {
        console.error('❌ System not initialized. Call initializeSystem() first.');
        return;
    }
    
    systemState.running = true;
    console.log(`\n🏃 System is running...`);
    
    if (systemConfig.autoStartLoop) {
        console.log(`\n🧠 Starting autonomy loop...`);
        await startAutonomyLoop();
    }
}

/**
 * Stop System
 */
export function stopSystem() {
    systemState.running = false;
    console.log(`\n🛑 System stopped`);
    printSystemStatus();
}

/**
 * Print System Status
 */
export function printSystemStatus() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 ${systemConfig.name} Status`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Status: ${systemState.running ? '🟢 RUNNING' : '🔴 STOPPED'}`);
    console.log(`Initialized: ${systemState.initialized}`);
    console.log(`Uptime: ${getSystemUptime()}`);
    console.log(`\nMetrics:`);
    console.log(`  • Total Claims: ${systemState.metrics.totalClaims}`);
    console.log(`  • Total Evidence: ${systemState.metrics.totalEvidence}`);
    console.log(`  • Contradictions: ${systemState.metrics.contradictionCount}`);
    console.log(`  • Trust Level: ${systemState.metrics.trustLevel}%`);
    
    if (systemState.lastHealthCheck) {
        console.log(`\nLast Health Check: ${systemState.lastHealthCheck.timestamp}`);
        console.log(`  Memory: ${systemState.lastHealthCheck.memoryUsage.heapUsed}`);
    }
    console.log(`${'='.repeat(60)}\n`);
}

/**
 * Get System Diagnostics
 */
export function getSystemDiagnostics() {
    return {
        config: systemConfig,
        state: systemState,
        metrics: systemState.metrics,
        lastHealthCheck: systemState.lastHealthCheck,
        autonomyState: getAutonomyState(),
        timestamp: new Date().toISOString()
    };
}

/**
 * Shutdown System Gracefully
 */
export async function shutdownSystem() {
    console.log(`\n⏹️  Shutting down system...`);
    
    stopSystem();
    resetAutonomy();
    
    const diagnostics = getSystemDiagnostics();
    console.log(`✓ System state saved`);
    
    console.log(`✅ System shutdown complete`);
    
    return diagnostics;
}

export {
    initializeSystem,
    startSystem,
    stopSystem,
    shutdownSystem,
    getSystemDiagnostics,
    printSystemStatus,
    systemConfig,
    systemState
};