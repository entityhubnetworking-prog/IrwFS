// App State
const state = {
    isAuthenticated: false,
    user: null,
    swapType: 'image',
    sourcePath: null,
    targetPath: null,
    currentResult: null
};

// DOM Elements
const elements = {
    // Screens
    loginScreen: document.getElementById('login-screen'),
    mainScreen: document.getElementById('main-screen'),
    
    // Auth
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    loginError: document.getElementById('login-error'),
    registerError: document.getElementById('register-error'),
    registerSuccess: document.getElementById('register-success'),
    
    // Main
    userInfo: document.getElementById('user-info'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // Swap
    swapTypeBtns: document.querySelectorAll('.type-btn'),
    selectSourceBtn: document.getElementById('select-source-btn'),
    selectTargetBtn: document.getElementById('select-target-btn'),
    sourceName: document.getElementById('source-name'),
    targetName: document.getElementById('target-name'),
    sourcePreview: document.getElementById('source-preview'),
    targetPreview: document.getElementById('target-preview'),
    targetType: document.getElementById('target-type'),
    swapBtn: document.getElementById('swap-btn'),
    swapProgress: document.getElementById('swap-progress'),
    resultArea: document.getElementById('result-area'),
    resultPreview: document.getElementById('result-preview'),
    downloadBtn: document.getElementById('download-btn'),
    newSwapBtn: document.getElementById('new-swap-btn'),
    
    // History
    historyList: document.getElementById('history-list'),
    
    // Settings
    accountInfo: document.getElementById('account-info'),
    
    // Navigation
    navBtns: document.querySelectorAll('.nav-btn'),
    views: document.querySelectorAll('.view'),
    
    // Notification
    notification: document.getElementById('notification')
};

// Utility Functions
function showNotification(message, type = 'success') {
    elements.notification.textContent = message;
    elements.notification.className = `notification ${type} show`;
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}

function showView(viewId) {
    elements.views.forEach(view => view.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    
    elements.navBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewId.replace('-view', ''));
    });
}

function updateSwapButton() {
    elements.swapBtn.disabled = !(state.sourcePath && state.targetPath);
}

function resetSwapForm() {
    state.sourcePath = null;
    state.targetPath = null;
    state.currentResult = null;
    elements.sourceName.textContent = '';
    elements.targetName.textContent = '';
    elements.sourcePreview.style.display = 'none';
    elements.targetPreview.style.display = 'none';
    elements.resultArea.style.display = 'none';
    elements.swapProgress.style.display = 'none';
    elements.swapBtn.disabled = true;
    elements.swapBtn.style.display = 'block';
}

// Tab Switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const tab = btn.dataset.tab;
        elements.loginForm.classList.toggle('active', tab === 'login');
        elements.registerForm.classList.toggle('active', tab === 'register');
    });
});

// Navigation
elements.navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        showView(`${btn.dataset.view}-view`);
        
        if (btn.dataset.view === 'history') {
            loadHistory();
        } else if (btn.dataset.view === 'settings') {
            loadAccountInfo();
        }
    });
});

// Authentication
elements.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    elements.loginError.textContent = '';
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const result = await window.irwfsAPI.login(email, password);
    
    if (result.success) {
        state.isAuthenticated = true;
        await loadUserInfo();
        elements.loginScreen.classList.remove('active');
        elements.mainScreen.classList.add('active');
        showNotification('Welcome back!');
    } else {
        elements.loginError.textContent = result.error;
    }
});

elements.registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    elements.registerError.textContent = '';
    elements.registerSuccess.textContent = '';
    
    const email = document.getElementById('reg-email').value;
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const fullName = document.getElementById('reg-fullname').value;
    
    const result = await window.irwfsAPI.register(email, username, password, fullName);
    
    if (result.success) {
        elements.registerSuccess.textContent = 'Registration successful! Please check your email to verify, then login.';
        elements.registerForm.reset();
    } else {
        elements.registerError.textContent = result.error;
    }
});

elements.logoutBtn.addEventListener('click', async () => {
    await window.irwfsAPI.logout();
    state.isAuthenticated = false;
    state.user = null;
    elements.mainScreen.classList.remove('active');
    elements.loginScreen.classList.add('active');
    showNotification('Logged out successfully');
});

async function loadUserInfo() {
    const result = await window.irwfsAPI.getUser();
    if (result.success) {
        state.user = result.user;
        elements.userInfo.textContent = `${result.user.username} (${result.user.role})`;
    }
}

// Swap Type Selection
elements.swapTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        elements.swapTypeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.swapType = btn.dataset.type;
        elements.targetType.textContent = state.swapType === 'image' ? 'Image' : 'Video';
        resetSwapForm();
    });
});

// File Selection
elements.selectSourceBtn.addEventListener('click', async () => {
    const result = await window.irwfsAPI.selectImage();
    if (!result.canceled) {
        state.sourcePath = result.path;
        const fileName = result.path.split(/[\\/]/).pop();
        elements.sourceName.textContent = fileName;
        
        // Show preview
        const fs = require('fs');
        const imageData = fs.readFileSync(result.path);
        const base64 = imageData.toString('base64');
        elements.sourcePreview.src = `data:image/jpeg;base64,${base64}`;
        elements.sourcePreview.style.display = 'block';
        
        updateSwapButton();
    }
});

elements.selectTargetBtn.addEventListener('click', async () => {
    const result = state.swapType === 'image' 
        ? await window.irwfsAPI.selectImage()
        : await window.irwfsAPI.selectVideo();
        
    if (!result.canceled) {
        state.targetPath = result.path;
        const fileName = result.path.split(/[\\/]/).pop();
        elements.targetName.textContent = fileName;
        
        if (state.swapType === 'image') {
            const fs = require('fs');
            const imageData = fs.readFileSync(result.path);
            const base64 = imageData.toString('base64');
            elements.targetPreview.src = `data:image/jpeg;base64,${base64}`;
            elements.targetPreview.style.display = 'block';
        }
        
        updateSwapButton();
    }
});

// Face Swap
elements.swapBtn.addEventListener('click', async () => {
    elements.swapBtn.style.display = 'none';
    elements.swapProgress.style.display = 'flex';
    
    let result;
    if (state.swapType === 'image') {
        result = await window.irwfsAPI.swapImage(state.sourcePath, state.targetPath);
    } else {
        result = await window.irwfsAPI.swapVideo(state.sourcePath, state.targetPath);
    }
    
    elements.swapProgress.style.display = 'none';
    
    if (result.success) {
        state.currentResult = result.result;
        elements.resultPreview.src = result.result.result_url;
        elements.resultArea.style.display = 'block';
        showNotification('Face swap completed!');
    } else {
        elements.swapBtn.style.display = 'block';
        showNotification(result.error, 'error');
    }
});

elements.downloadBtn.addEventListener('click', async () => {
    if (state.currentResult) {
        const filename = state.swapType === 'image' ? 'faceswap_result.jpg' : 'faceswap_result.mp4';
        const result = await window.irwfsAPI.downloadFile(state.currentResult.result_url, filename);
        if (result.success) {
            showNotification(`Saved to: ${result.path}`);
        }
    }
});

elements.newSwapBtn.addEventListener('click', () => {
    resetSwapForm();
});

// History
async function loadHistory() {
    elements.historyList.innerHTML = '<p class="loading">Loading history...</p>';
    
    const result = await window.irwfsAPI.getHistory();
    
    if (result.success && result.history.items.length > 0) {
        elements.historyList.innerHTML = result.history.items.map(item => `
            <div class="history-item">
                <img src="${item.result_url || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 80 80%22><rect fill=%22%23334155%22 width=%2280%22 height=%2280%22/><text x=%2240%22 y=%2245%22 text-anchor=%22middle%22 fill=%22%2394a3b8%22 font-size=%2220%22>📷</text></svg>'}" class="history-thumb" alt="Result">
                <div class="history-info">
                    <h4>${item.swap_type.toUpperCase()} Swap #${item.id}</h4>
                    <p>${new Date(item.created_at).toLocaleString()}</p>
                    <span class="status-badge status-${item.status}">${item.status}</span>
                </div>
                <div class="history-actions">
                    ${item.result_url ? `<button class="btn btn-small btn-secondary" onclick="downloadResult('${item.result_url}', '${item.swap_type}')">📥</button>` : ''}
                    <button class="btn btn-small btn-secondary" onclick="deleteSwap(${item.id})">🗑️</button>
                </div>
            </div>
        `).join('');
    } else {
        elements.historyList.innerHTML = '<p class="loading">No history yet. Start swapping faces!</p>';
    }
}

async function deleteSwap(swapId) {
    if (confirm('Are you sure you want to delete this item?')) {
        const result = await window.irwfsAPI.deleteSwap(swapId);
        if (result.success) {
            showNotification('Deleted successfully');
            loadHistory();
        } else {
            showNotification(result.error, 'error');
        }
    }
}

// Settings
async function loadAccountInfo() {
    const result = await window.irwfsAPI.getUser();
    if (result.success) {
        elements.accountInfo.innerHTML = `
            <p><strong>Email:</strong> ${result.user.email}</p>
            <p><strong>Username:</strong> ${result.user.username}</p>
            <p><strong>Role:</strong> ${result.user.role}</p>
            <p><strong>Video Quota:</strong> ${result.user.videos_used}/${result.user.video_quota}</p>
            <p><strong>Image Quota:</strong> ${result.user.images_used}/${result.user.image_quota}</p>
            <p><strong>Member since:</strong> ${new Date(result.user.created_at).toLocaleDateString()}</p>
        `;
    }
}

// Initialize
async function init() {
    const session = await window.irwfsAPI.checkSession();
    
    if (session.authenticated) {
        state.isAuthenticated = true;
        await loadUserInfo();
        elements.loginScreen.classList.remove('active');
        elements.mainScreen.classList.add('active');
    }
    
    // Menu event
    window.irwfsAPI.onMenuNewSwap(() => {
        showView('swap-view');
        resetSwapForm();
    });
}

init();
