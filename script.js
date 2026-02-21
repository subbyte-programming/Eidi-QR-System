/* =============================================
   EID EIDI APP - MAIN SCRIPT
   Updated & Fixed for Admin Panel Sync
   ============================================= */

// ===== STATE =====
const App = {
  currentChildId: null,
  currentChild: null,
  trialsLeft: 3,
  spinning: false,
  wheelRotation: 0,
  animFrameId: null,
  pollInterval: null,
  db: null,
};

// ===== DATABASE (localStorage) =====
const DB = {
  key: 'eid_eidi_db',  // ✅ FIXED: Admin panel ke saath same key

  load() {
    const raw = localStorage.getItem(this.key);
    if (raw) return JSON.parse(raw);
    // Default data with 5 children
    const defaultData = {
      children: {
        CHILD001: { name: "Ahmed", assigned_reward: "200", reward_type: "cash", username: null, password: null, login_approved: false, login_requested: false, eidi_claimed: false, request_time: null },
        CHILD002: { name: "Fatima", assigned_reward: "500", reward_type: "cash", username: null, password: null, login_approved: false, login_requested: false, eidi_claimed: false, request_time: null },
        CHILD003: { name: "Zain", assigned_reward: "Gift Box 🎁", reward_type: "gift", username: null, password: null, login_approved: false, login_requested: false, eidi_claimed: false, request_time: null },
        CHILD004: { name: "Ayesha", assigned_reward: "100", reward_type: "cash", username: null, password: null, login_approved: false, login_requested: false, eidi_claimed: false, request_time: null },
        CHILD005: { name: "Omar", assigned_reward: "50", reward_type: "cash", username: null, password: null, login_approved: false, login_requested: false, eidi_claimed: false, request_time: null },
      },
      admin: { password: "EidAdmin2025!" },
    };
    this.save(defaultData);
    return defaultData;
  },

  save(data) {
    localStorage.setItem(this.key, JSON.stringify(data));
    console.log('💾 Data saved to localStorage', data);
  },

  getChild(id) {
    const data = this.load();
    return data.children[id] || null;
  },

  updateChild(id, updates) {
    console.log(`📝 Updating ${id} with:`, updates);
    const data = this.load();
    if (!data.children[id]) {
      console.error(`❌ Child ${id} not found!`);
      return false;
    }
    data.children[id] = { ...data.children[id], ...updates };
    this.save(data);
    
    // Verify save
    const saved = data.children[id];
    console.log(`✅ After update:`, saved);
    return true;
  },

  getAllChildren() {
    return this.load().children;
  },

  addChild(id, childData) {
    const data = this.load();
    data.children[id] = childData;
    this.save(data);
  }
};

// ===== HELPERS =====
function generateUsername(name) {
  const clean = name.toLowerCase().replace(/\s+/g, '');
  const num = Math.floor(Math.random() * 900) + 100;
  return `${clean}${num}`;
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
  let pass = '';
  for (let i = 0; i < 8; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass;
}

function generateStars() {
  const container = document.createElement('div');
  container.className = 'stars-container';
  for (let i = 0; i < 60; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation-delay: ${Math.random() * 3}s;
      animation-duration: ${2 + Math.random() * 3}s;
      width: ${1 + Math.random() * 3}px;
      height: ${1 + Math.random() * 3}px;
    `;
    container.appendChild(star);
  }
  document.body.appendChild(container);
}

function showToast(message, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.className = `toast ${type === 'error' ? 'error' : ''}`;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(id);
  if (screen) {
    screen.classList.add('active');
    screen.classList.add('fade-in');
  }
}

// ===== URL PARSING =====
function getChildIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// ===== INITIALIZATION =====
function init() {
  if (document.getElementById('app')) {
    console.log('🚀 App initializing...');
    generateStars();
    createFloatingDecor();
    
    const childId = getChildIdFromURL();
    console.log('🔍 Child ID from URL:', childId);
    
    if (!childId) {
      console.log('❌ No child ID in URL');
      showInvalidScreen();
      return;
    }
    
    App.currentChildId = childId;
    const child = DB.getChild(childId);
    console.log('👶 Child data:', child);
    
    if (!child) {
      console.log('❌ Child not found in database');
      showInvalidScreen();
      return;
    }
    
    App.currentChild = child;
    routeChild();
  }
}

function createFloatingDecor() {
  const decors = ['☪️', '🌙', '⭐', '🪔', '✨', '🌟'];
  decors.forEach((emoji, i) => {
    const el = document.createElement('div');
    el.className = 'floating-decor';
    el.textContent = emoji;
    document.body.insertBefore(el, document.body.firstChild);
  });
  // BG pattern
  const bg = document.createElement('div');
  bg.className = 'bg-pattern';
  document.body.insertBefore(bg, document.body.firstChild);
}

function routeChild() {
  const child = App.currentChild;
  console.log('🔄 Routing child:', child);

  if (child.eidi_claimed) {
    console.log('✅ Child already claimed');
    showAlreadyClaimedScreen();
    return;
  }

  if (child.login_approved && isLoggedIn()) {
    console.log('✅ Child approved and logged in');
    showWheelScreen();
    return;
  }

  if (child.login_requested && !child.login_approved) {
    console.log('⏳ Child has pending request');
    showWaitingScreen();
    return;
  }

  console.log('👋 Showing welcome screen');
  showWelcomeScreen();
}

function isLoggedIn() {
  return sessionStorage.getItem('eid_session') === App.currentChildId;
}

// ===== SCREENS =====
function showInvalidScreen() {
  showScreen('invalid-screen');
}

function showAlreadyClaimedScreen() {
  showScreen('claimed-screen');
}

function showWelcomeScreen() {
  const child = App.currentChild;
  document.getElementById('child-name').textContent = child.name;
  showScreen('welcome-screen');
}

function showWaitingScreen() {
  showScreen('waiting-screen');
  // Clear old interval if exists
  if (App.pollInterval) clearInterval(App.pollInterval);
  // Poll for approval every 3 seconds
  App.pollInterval = setInterval(checkApproval, 3000);
}

function checkApproval() {
  console.log('🔄 Checking approval status...');
  const child = DB.getChild(App.currentChildId);
  if (child && child.login_approved) {
    console.log('✅ Child approved!');
    clearInterval(App.pollInterval);
    App.currentChild = child;
    showToast('✅ Admin ne approve kar diya! Login karein.', 'success');
    showLoginScreen();
  }
}

function showLoginScreen() {
  showScreen('login-screen');
  const child = DB.getChild(App.currentChildId);
  document.getElementById('login-username').value = child.username || '';
}

function showWheelScreen() {
  const child = DB.getChild(App.currentChildId);
  App.currentChild = child;
  if (child.eidi_claimed) {
    showAlreadyClaimedScreen();
    return;
  }
  App.trialsLeft = 3; // Reset trials
  showScreen('wheel-screen');
  initWheel();
  updateTrialPips();
}

// ===== REQUEST ACCESS =====
function requestAccess() {
  console.log('🔑 Requesting access...');
  
  const child = App.currentChild;
  console.log('Current child:', child);
  
  if (child.login_requested) {
    console.log('⏳ Request already pending');
    showToast('⏳ Aapki request pehle se pending hai!', 'info');
    showWaitingScreen();
    return;
  }

  const username = generateUsername(child.name);
  const password = generatePassword();
  
  console.log('Generated credentials:', { username, password });

  const updateResult = DB.updateChild(App.currentChildId, {
    login_requested: true,
    username,
    password,
    request_time: new Date().toISOString(),
  });

  if (updateResult) {
    App.currentChild = DB.getChild(App.currentChildId);
    console.log('✅ Updated child:', App.currentChild);
    showToast('🔔 Request bhej di gayi! Admin approve karega.', 'success');
    showWaitingScreen();
  } else {
    console.error('❌ Failed to update child');
    showToast('❌ Request fail hui! Dobara try karein.', 'error');
  }
}

// ===== LOGIN =====
function attemptLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value.trim();

  console.log('🔐 Login attempt:', { username, password });

  if (!username || !password) {
    showToast('❌ Username aur password darj karein!', 'error');
    return;
  }

  const child = DB.getChild(App.currentChildId);
  console.log('Stored child:', child);

  if (!child || !child.login_approved) {
    showToast('❌ Admin ne abhi approve nahi kiya!', 'error');
    return;
  }

  if (username !== child.username || password !== child.password) {
    console.log('❌ Credentials mismatch');
    showToast('❌ Galat username ya password!', 'error');
    return;
  }

  sessionStorage.setItem('eid_session', App.currentChildId);
  showToast('🎉 Login kamiyab! Eidi unlock ho rahi hai...', 'success');
  setTimeout(() => showWheelScreen(), 800);
}

// ===== WHEEL =====
const WHEEL_SEGMENTS = [
  { label: '50', color: '#006B3C' },
  { label: '100', color: '#D4AF37' },
  { label: '200', color: '#004A29' },
  { label: '500', color: '#A67C00' },
  { label: '🎁 Gift', color: '#006B3C' },
  { label: '1000', color: '#D4AF37' },
  { label: '50', color: '#004A29' },
  { label: '100', color: '#A67C00' },
];

function initWheel() {
  const canvas = document.getElementById('wheel-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  App.wheelRotation = 0;
  drawWheel(ctx, canvas.width, App.wheelRotation);
}

function drawWheel(ctx, size, rotation) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const segments = WHEEL_SEGMENTS.length;
  const arc = (2 * Math.PI) / segments;

  ctx.clearRect(0, 0, size, size);

  // Outer glow ring
  const gradient = ctx.createRadialGradient(cx, cy, r - 10, cx, cy, r + 4);
  gradient.addColorStop(0, 'rgba(212,175,55,0)');
  gradient.addColorStop(1, 'rgba(212,175,55,0.6)');
  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, 2 * Math.PI);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Segments
  for (let i = 0; i < segments; i++) {
    const startAngle = rotation + i * arc;
    const endAngle = startAngle + arc;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = WHEEL_SEGMENTS[i].color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(212,175,55,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Text
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startAngle + arc / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFF8E7';
    ctx.font = `bold ${size * 0.055}px Poppins`;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText(WHEEL_SEGMENTS[i].label, r - 12, 5);
    ctx.restore();
  }

  // Center circle
  const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
  centerGrad.addColorStop(0, '#F5D76E');
  centerGrad.addColorStop(1, '#A67C00');
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, 2 * Math.PI);
  ctx.fillStyle = centerGrad;
  ctx.fill();
  ctx.strokeStyle = '#FFF8E7';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Center crescent
  ctx.font = `${size * 0.085}px serif`;
  ctx.textAlign = 'center';
  ctx.fillText('☪️', cx, cy + 8);
}

function spinWheel() {
  if (App.spinning || App.trialsLeft <= 0) return;

  const canvas = document.getElementById('wheel-canvas');
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const child = DB.getChild(App.currentChildId);
  const assigned = child.assigned_reward;

  App.spinning = true;
  App.trialsLeft--;
  updateTrialPips();

  document.getElementById('spin-btn').disabled = true;

  // Find segment index that matches assigned reward
  let targetIdx = WHEEL_SEGMENTS.findIndex(s =>
    s.label.toLowerCase().includes(assigned.toLowerCase()) ||
    assigned.toLowerCase().includes(s.label.toLowerCase().replace('🎁 ', ''))
  );
  if (targetIdx < 0) targetIdx = 0;

  const segments = WHEEL_SEGMENTS.length;
  const arc = (2 * Math.PI) / segments;
  // We want targetIdx segment to land under the pointer (top = -π/2)
  const targetAngle = -Math.PI / 2 - (targetIdx * arc + arc / 2);
  const spins = 6 + Math.random() * 4; // 6-10 full rotations
  const finalRotation = App.wheelRotation + spins * 2 * Math.PI + (targetAngle - App.wheelRotation % (2 * Math.PI));

  const duration = 5000 + (App.trialsLeft === 0 ? 0 : Math.random() * 1000);
  const startTime = performance.now();
  const startRotation = App.wheelRotation;

  // Tension build-up
  canvas.style.filter = 'drop-shadow(0 0 20px rgba(212,175,55,0.8))';

  function easeOutCubic(t) {
    if (t < 0.7) return t * 1.43;
    const t2 = (t - 0.7) / 0.3;
    return 0.7 * 1.43 + (1 - Math.pow(1 - t2, 4)) * (1 - 0.7 * 1.43);
  }

  function animate(now) {
    const elapsed = now - startTime;
    let progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);

    App.wheelRotation = startRotation + (finalRotation - startRotation) * eased;
    drawWheel(ctx, size, App.wheelRotation);

    if (progress < 1) {
      App.animFrameId = requestAnimationFrame(animate);
    } else {
      App.spinning = false;
      canvas.style.filter = '';

      if (App.trialsLeft > 0) {
        document.getElementById('spin-btn').disabled = false;
        updateTrialPips();
      } else {
        // Last spin — reveal result
        setTimeout(() => revealResult(assigned, child.reward_type), 800);
      }
    }
  }

  requestAnimationFrame(animate);
}

function updateTrialPips() {
  const pips = document.querySelectorAll('.trial-pip');
  pips.forEach((pip, i) => {
    pip.classList.toggle('used', i < (3 - App.trialsLeft));
  });

  const spinBtn = document.getElementById('spin-btn');
  if (App.trialsLeft === 0 && !App.spinning) {
    spinBtn.disabled = true;
    spinBtn.textContent = 'Akhri Spin Ho Gayi!';
  } else if (!App.spinning) {
    spinBtn.innerHTML = `🎡 Spin Karein! (${App.trialsLeft} baqi)`;
  }
}

function revealResult(reward, type) {
  DB.updateChild(App.currentChildId, { eidi_claimed: true });
  App.currentChild = DB.getChild(App.currentChildId);

  // Show result
  const isGift = type === 'gift';
  document.getElementById('result-icon').textContent = isGift ? '🎁' : '💰';
  document.getElementById('result-amount').textContent = isGift ? reward : `Rs. ${reward}`;
  document.getElementById('result-label').textContent = isGift ? 'Aapka Tohfa!' : 'Eidi Mubarak!';
  document.getElementById('child-result-name').textContent = App.currentChild.name;

  showScreen('result-screen');
  launchConfetti();
  sessionStorage.removeItem('eid_session');
}

// ===== CONFETTI =====
function launchConfetti() {
  const colors = ['#D4AF37', '#F5D76E', '#006B3C', '#00A86B', '#FFF8E7', '#A67C00', '#FF6B6B', '#FFD700'];
  for (let i = 0; i < 120; i++) {
    setTimeout(() => {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.cssText = `
        left: ${Math.random() * 100}vw;
        top: -20px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        width: ${6 + Math.random() * 8}px;
        height: ${8 + Math.random() * 12}px;
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        transform: rotate(${Math.random() * 360}deg);
        animation-duration: ${2 + Math.random() * 3}s;
        animation-delay: ${Math.random() * 0.5}s;
      `;
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 5000);
    }, i * 30);
  }
}

// Expose functions globally for HTML onclick
window.requestAccess = requestAccess;
window.attemptLogin = attemptLogin;
window.spinWheel = spinWheel;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', init);
