// Initialize Lucide Icons
lucide.createIcons();

// DOM Elements
const runTestBtn = document.getElementById('runTestBtn');
const clearConsoleBtn = document.getElementById('clearConsoleBtn');
const statLatency = document.getElementById('statLatency');
const statStatus = document.getElementById('statStatus');
const statRuns = document.getElementById('statRuns');
const consoleBody = document.getElementById('consoleBody');
const copyTerminalBtn = document.getElementById('copyTerminalBtn');

// Connection Builder Fields
const dbHost = document.getElementById('dbHost');
const dbPort = document.getElementById('dbPort');
const dbName = document.getElementById('dbName');
const dbUser = document.getElementById('dbUser');
const dbPassword = document.getElementById('dbPassword');
const connStringCode = document.getElementById('connStringCode');
const copyConnStringBtn = document.getElementById('copyConnStringBtn');

// Diagram elements
const diagramSteps = document.querySelectorAll('.diagram-step');
const diagramExplainBox = document.getElementById('diagramExplainBox');

// Global Stats State
let runsCount = 0;
let latencyHistory = [0, 0, 0, 0, 0];
let consoleHistoryText = "";

// Simulator Controls Elements
const demoModeToggle = document.getElementById('demoModeToggle');
const simScenario = document.getElementById('simScenario');

// Check if running locally
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
let demoMode = !isLocalhost;

// Set toggle status initially
if (demoModeToggle) {
  demoModeToggle.checked = demoMode;
  demoModeToggle.addEventListener('change', (e) => {
    demoMode = e.target.checked;
    checkServerLiveness();
  });
}

// Ping check loop on page load
async function checkServerLiveness() {
  const serverBadge = document.getElementById('serverBadge');
  const serverBadgeText = document.getElementById('serverBadgeText');
  
  if (demoMode) {
    serverBadge.style.background = 'rgba(245, 158, 11, 0.1)';
    serverBadge.style.borderColor = 'rgba(245, 158, 11, 0.2)';
    serverBadge.style.color = 'var(--warning)';
    serverBadgeText.textContent = 'Demo Mode (Simulated)';
    return;
  }

  try {
    const start = performance.now();
    const response = await fetch('/api/db-time');
    const end = performance.now();
    const ms = Math.round(end - start);
    
    serverBadge.style.background = 'rgba(16, 185, 129, 0.1)';
    serverBadge.style.borderColor = 'rgba(16, 185, 129, 0.2)';
    serverBadge.style.color = 'var(--success)';
    serverBadgeText.textContent = `Server Active (${ms}ms)`;
  } catch (err) {
    serverBadge.style.background = 'rgba(239, 68, 68, 0.1)';
    serverBadge.style.borderColor = 'rgba(239, 68, 68, 0.2)';
    serverBadge.style.color = 'var(--danger)';
    serverBadgeText.textContent = 'Server Offline';
  }
}

// Initial check and set interval
checkServerLiveness();
setInterval(checkServerLiveness, 10000);

// Toast Manager
function showToast(title, desc, type = 'success') {
  const host = document.getElementById('toastHost');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? 'check-circle' : 'alert-circle';
  
  toast.innerHTML = `
    <div class="toast-icon">
      <i data-lucide="${icon}" style="width: 20px; height: 20px;"></i>
    </div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-desc">${desc}</div>
    </div>
    <button class="toast-close">&times;</button>
  `;
  
  // Close button handler
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.style.animation = 'slide-out 0.2s forwards';
    setTimeout(() => toast.remove(), 200);
  });
  
  host.appendChild(toast);
  lucide.createIcons(); // Refresh icons for the newly injected element
  
  // Auto dismiss
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = 'slide-out 0.2s forwards';
      setTimeout(() => toast.remove(), 200);
    }
  }, 4000);
}

// Confetti Effect
function triggerConfetti() {
  const colors = ['#6366f1', '#06b6d4', '#d946ef', '#10b981', '#f59e0b'];
  const rect = runTestBtn.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + window.scrollY + rect.height / 2;

  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    
    document.body.appendChild(p);

    const angle = Math.random() * Math.PI * 2;
    const velocity = 4 + Math.random() * 8;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity - 3; // Upward initial velocity
    const rotation = Math.random() * 360;

    let t = 0;
    const duration = 600 + Math.random() * 400;
    const startTime = performance.now();

    (function updateParticle(now) {
      t = now - startTime;
      const progress = t / duration;
      const dx = vx * (t / 16);
      const dy = (vy + 0.12 * (t / 2)) * (t / 16); // Gravity simulation

      p.style.transform = `translate(${dx}px, ${dy}px) rotate(${rotation + t / 2}deg)`;
      p.style.opacity = (1 - progress).toFixed(2);

      if (progress < 1) {
        requestAnimationFrame(updateParticle);
      } else {
        p.remove();
      }
    })(startTime);
  }
}

// Run Integration Test Request
runTestBtn.addEventListener('click', async () => {
  runTestBtn.disabled = true;
  runTestBtn.innerHTML = `<span style="display:inline-block;animation:spin 1s linear infinite;margin-right:8px;">⏳</span> Fetching...`;
  
  const startTime = performance.now();
  let latency = 0;
  
  // 1. MOCK MODE SIMULATION
  if (demoMode) {
    writeToTerminal('Executing SELECT current_timestamp; on Simulated Postgres DB...');
    
    // Simulate delay
    const mockLatency = Math.round(40 + Math.random() * 80);
    await new Promise(resolve => setTimeout(resolve, mockLatency));
    
    const scenario = simScenario ? simScenario.value : 'success';
    runsCount++;
    
    if (scenario === 'success') {
      // Success response simulation
      updateStats(mockLatency, 'Success', runsCount);
      updateChart(mockLatency, false);
      
      // Generate formatted Postgres-like timestamp using client time
      const now = new Date();
      const tzOffset = -now.getTimezoneOffset();
      const diff = tzOffset >= 0 ? '+' : '-';
      const pad = (num) => String(num).padStart(2, '0');
      const formattedTime = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ` +
                            `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.` +
                            `${String(now.getMilliseconds()).padStart(3, '0')}000${diff}${pad(Math.floor(Math.abs(tzOffset)/60))}`;
      
      const data = { status: "success", db_time: formattedTime };
      const successText = `[Success] Database active (Simulated).\nTimestamp: ${data.db_time}\nRoundtrip Latency: ${mockLatency}ms\nRaw JSON: ${JSON.stringify(data)}`;
      writeToTerminal(successText, true);
      
      showToast('Connection Active', `Simulated database responded in ${mockLatency}ms!`, 'success');
      triggerConfetti();
    } else if (scenario === 'db_error') {
      // Connection fail simulation
      updateStats(mockLatency, 'Err 500', runsCount);
      updateChart(mockLatency, true);
      
      const errMsg = "pqxx: connection to database failed: server closed the connection unexpectedly";
      const errorText = `[Error 500] Database Connection Failed (Simulated)!\nDetails: ${errMsg}\nCheck if your simulated PostgreSQL server is running.`;
      writeToTerminal(errorText, false);
      
      showToast('Query Failed', 'Connection to database failed (Simulated).', 'error');
    } else if (scenario === 'auth_error') {
      // Password failure simulation
      updateStats(mockLatency, 'Err 500', runsCount);
      updateChart(mockLatency, true);
      
      const errMsg = "pqxx: password authentication failed for user 'postgres'";
      const errorText = `[Error 500] Database Connection Failed (Simulated)!\nDetails: ${errMsg}\nDouble check your simulated credentials password.`;
      writeToTerminal(errorText, false);
      
      showToast('Query Failed', 'Password authentication failed (Simulated).', 'error');
    } else {
      // Timeout simulation
      updateStats(mockLatency + 200, 'Failed', runsCount);
      updateChart(mockLatency + 200, true);
      
      const errorText = `[Error Network] Server Unreachable (Simulated).\nDetails: fetch request timed out after 3000ms.\nCheck if your simulated server port is open.`;
      writeToTerminal(errorText, false);
      
      showToast('Server Offline', 'Request timed out (Simulated).', 'error');
    }
    
    runTestBtn.disabled = false;
    runTestBtn.innerHTML = `<i data-lucide="play" style="width: 16px; height: 16px;"></i> Run Query Test`;
    lucide.createIcons();
    checkServerLiveness();
    return;
  }
  
  // 2. LIVE SERVER CONNECTION
  try {
    writeToTerminal('Executing SELECT current_timestamp; on Postgres DB...');
    
    const response = await fetch('/api/db-time');
    const endTime = performance.now();
    latency = Math.round(endTime - startTime);
    
    const data = await response.json();
    
    if (response.ok && data.status === 'success') {
      // Success
      runsCount++;
      updateStats(latency, 'Success', runsCount);
      updateChart(latency, false);
      
      const successText = `[Success] Database active.\nTimestamp: ${data.db_time}\nRoundtrip Latency: ${latency}ms\nRaw JSON: ${JSON.stringify(data)}`;
      writeToTerminal(successText, true);
      
      showToast('Connection Active', `PostgreSQL responded in ${latency}ms!`, 'success');
      triggerConfetti();
    } else {
      // Error response from server
      runsCount++;
      updateStats(latency, 'Err 500', runsCount);
      updateChart(latency, true);
      
      const errMsg = data.message || 'Unknown database error occurred.';
      const errorText = `[Error 500] Database Connection Failed!\nDetails: ${errMsg}\nTry modifying your Postgres credentials and rebuilding the C++ executable.`;
      writeToTerminal(errorText, false);
      
      showToast('Query Failed', errMsg, 'error');
    }
  } catch (err) {
    // Core Network/Server down error
    const endTime = performance.now();
    latency = Math.round(endTime - startTime);
    runsCount++;
    
    updateStats(latency, 'Failed', runsCount);
    updateChart(latency, true);
    
    const serverDownText = `[Error Network] Server Unreachable.\nDetails: Failed to fetch from endpoint '/api/db-time'.\nIs your C++ server active on port 80? Make sure it's running.`;
    writeToTerminal(serverDownText, false);
    
    showToast('Server Offline', 'Failed to connect to the local C++ server.', 'error');
  } finally {
    runTestBtn.disabled = false;
    runTestBtn.innerHTML = `<i data-lucide="play" style="width: 16px; height: 16px;"></i> Run Query Test`;
    lucide.createIcons();
    checkServerLiveness();
  }
});

// Write logs to fake Terminal Screen
function writeToTerminal(text, isSuccess = null) {
  let colorClass = '';
  if (isSuccess === true) colorClass = 'color: #34d399;'; // light green
  if (isSuccess === false) colorClass = 'color: #f87171;'; // light red
  
  const newText = `\n<span style="${colorClass}">$ ${text}</span>`;
  consoleHistoryText += newText;
  
  consoleBody.innerHTML = `<span>${consoleHistoryText}</span><span class="terminal-cursor"></span>`;
  consoleBody.scrollTop = consoleBody.scrollHeight;
}

// Clear Terminal Output
clearConsoleBtn.addEventListener('click', () => {
  consoleHistoryText = "";
  consoleBody.innerHTML = '<span>Console cleared. Ready...</span><span class="terminal-cursor"></span>';
  showToast('Console Cleaned', 'History output cleared.', 'success');
});

// Copy Terminal Text
copyTerminalBtn.addEventListener('click', () => {
  const text = consoleBody.textContent.replace('$', '').trim();
  navigator.clipboard.writeText(text);
  showToast('Copied Output', 'Terminal logs copied to clipboard!', 'success');
});

// Update Stats indicators
function updateStats(latency, status, runs) {
  statLatency.textContent = `${latency} ms`;
  statStatus.textContent = status;
  statRuns.textContent = runs;
  
  if (status === 'Success') {
    statStatus.className = 'stat-value success';
  } else {
    statStatus.className = 'stat-value';
    statStatus.style.color = 'var(--danger)';
  }
}

// Update Chart visual heights dynamically
function updateChart(newLatency, isError) {
  // Shift array
  latencyHistory.shift();
  latencyHistory.push(newLatency);
  
  // Update chart UI
  const bars = document.querySelectorAll('.chart-bar');
  const tooltips = document.querySelectorAll('.chart-tooltip');
  
  // Calculate max for relative scale
  let maxVal = Math.max(...latencyHistory, 50); // Min scale is 50ms
  
  latencyHistory.forEach((lat, index) => {
    const bar = bars[index];
    const tooltip = tooltips[index];
    
    if (lat === 0) {
      bar.style.height = '4px';
      tooltip.textContent = 'N/A';
      bar.classList.remove('error-bar');
    } else {
      const heightPercent = Math.min((lat / maxVal) * 100, 100);
      bar.style.height = `${heightPercent}%`;
      tooltip.textContent = `${lat} ms`;
      
      // If this was the last injected item and it was an error
      if (index === 4 && isError) {
        bar.classList.add('error-bar');
      } else if (index === 4) {
        bar.classList.remove('error-bar');
      }
    }
  });

  // Calculate Average Latency (exclude zeroes)
  const validLats = latencyHistory.filter(l => l > 0);
  if (validLats.length > 0) {
    const avg = Math.round(validLats.reduce((a, b) => a + b, 0) / validLats.length);
    document.getElementById('avgLatency').textContent = `Avg: ${avg} ms`;
  }
}

// Connection String Builder Update Listeners
function updateConnString() {
  const host = dbHost.value.trim() || '127.0.0.1';
  const port = dbPort.value.trim() || '5432';
  const name = dbName.value.trim() || 'postgres';
  const user = dbUser.value.trim() || 'postgres';
  const pass = dbPassword.value.trim() || 'root';
  
  const connStr = `pqxx::connection c("dbname=${name} user=${user} password=${pass} hostaddr=${host} port=${port}");`;
  connStringCode.textContent = connStr;
}

[dbHost, dbPort, dbName, dbUser, dbPassword].forEach(el => {
  el.addEventListener('input', updateConnString);
});

// Copy Connection String button
copyConnStringBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(connStringCode.textContent);
  
  copyConnStringBtn.innerHTML = `<i data-lucide="check" style="width: 12px; height: 12px; color: var(--success);"></i> Copied!`;
  showToast('String Copied', 'Connection string copied to clipboard.', 'success');
  
  setTimeout(() => {
    copyConnStringBtn.innerHTML = `<i data-lucide="copy" style="width: 12px; height: 12px;"></i> Copy`;
    lucide.createIcons();
  }, 2000);
});

// Diagram Interactive Selection
diagramSteps.forEach(step => {
  step.addEventListener('click', () => {
    // Toggle active class
    diagramSteps.forEach(s => s.classList.remove('active'));
    step.classList.add('active');
    
    // Show info
    const info = step.getAttribute('data-info');
    const title = step.querySelector('.step-title').childNodes[0].textContent.trim();
    const tech = step.querySelector('.step-tech').textContent;
    
    diagramExplainBox.innerHTML = `
      <i data-lucide="info" style="color: var(--primary);"></i>
      <div>
        <strong>${title} (${tech}):</strong>
        <p style="font-size: 0.8rem; margin-top: 4px; color: var(--text-secondary);">${info}</p>
      </div>
    `;
    lucide.createIcons();
    
    // Add subtle animation pulse
    step.classList.add('glowing-pulse');
    setTimeout(() => step.classList.remove('glowing-pulse'), 1500);
  });
});

// Tab switcher
function switchTab(evt, tabId) {
  // Hide all pane content
  const tabPanes = document.querySelectorAll('.tab-pane');
  tabPanes.forEach(pane => pane.classList.remove('active'));
  
  // Deactivate all tab buttons
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => btn.classList.remove('active'));
  
  // Show matching pane and active target button
  document.getElementById(tabId).classList.add('active');
  evt.currentTarget.classList.add('active');
}

// Copy general snippets helper
function copySnippet(btn) {
  const code = btn.parentNode.parentNode.querySelector('code').textContent;
  navigator.clipboard.writeText(code);
  
  const originalText = btn.textContent;
  btn.textContent = "Copied!";
  btn.style.color = "var(--success)";
  
  showToast('Copied Code', 'Snippet copied to clipboard.', 'success');
  
  setTimeout(() => {
    btn.textContent = originalText;
    btn.style.color = "var(--text-secondary)";
  }, 2000);
}
