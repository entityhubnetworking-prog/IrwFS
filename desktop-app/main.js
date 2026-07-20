const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const Store = require('electron-store');

const store = new Store();

// API Configuration
const API_URL = 'http://3.84.94.77:8000/api';

let mainWindow;
let authToken = store.get('authToken', null);

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'assets', 'icon.png'),
        title: 'IrwFS Face Swap'
    });

    mainWindow.loadFile('src/index.html');
    
    // Create menu
    const menuTemplate = [
        {
            label: 'File',
            submenu: [
                { label: 'New Swap', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.send('menu-new-swap') },
                { type: 'separator' },
                { label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
            ]
        },
        {
            label: 'View',
            submenu: [
                { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
                { label: 'Toggle DevTools', accelerator: 'F12', click: () => mainWindow.webContents.toggleDevTools() },
                { type: 'separator' },
                { label: 'Fullscreen', accelerator: 'F11', click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen()) }
            ]
        },
        {
            label: 'Help',
            submenu: [
                { label: 'About IrwFS', click: () => dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: 'About IrwFS',
                    message: 'IrwFS Face Swap v1.0.0',
                    detail: 'Face Swap Ecosystem for images, videos, and live streams.'
                })}
            ]
        }
    ];
    
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
}

// IPC Handlers
ipcMain.handle('auth:login', async (event, { email, password }) => {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, 
            new URLSearchParams({ username: email, password }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        
        authToken = response.data.access_token;
        store.set('authToken', authToken);
        return { success: true, token: authToken };
    } catch (error) {
        return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
});

ipcMain.handle('auth:register', async (event, { email, username, password, fullName }) => {
    try {
        const response = await axios.post(`${API_URL}/auth/register`, {
            email,
            username,
            password,
            full_name: fullName || null
        });
        return { success: true, user: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
});

ipcMain.handle('auth:getUser', async () => {
    if (!authToken) return { success: false, error: 'Not authenticated' };
    
    try {
        const response = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        return { success: true, user: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.detail || 'Failed to get user' };
    }
});

ipcMain.handle('auth:logout', async () => {
    authToken = null;
    store.delete('authToken');
    return { success: true };
});

ipcMain.handle('auth:checkSession', async () => {
    if (!authToken) return { authenticated: false };
    
    try {
        await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        return { authenticated: true };
    } catch {
        authToken = null;
        store.delete('authToken');
        return { authenticated: false };
    }
});

ipcMain.handle('file:selectImage', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }
        ]
    });
    
    if (result.canceled) return { canceled: true };
    return { canceled: false, path: result.filePaths[0] };
});

ipcMain.handle('file:selectVideo', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Videos', extensions: ['mp4', 'webm', 'mov', 'avi'] }
        ]
    });
    
    if (result.canceled) return { canceled: true };
    return { canceled: false, path: result.filePaths[0] };
});

ipcMain.handle('swap:image', async (event, { sourcePath, targetPath }) => {
    if (!authToken) return { success: false, error: 'Not authenticated' };
    
    try {
        const formData = new FormData();
        formData.append('source', fs.createReadStream(sourcePath));
        formData.append('target', fs.createReadStream(targetPath));
        
        const response = await axios.post(`${API_URL}/faceswap/image`, formData, {
            headers: {
                ...formData.getHeaders(),
                Authorization: `Bearer ${authToken}`
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        
        return { success: true, result: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.detail || 'Face swap failed' };
    }
});

ipcMain.handle('swap:video', async (event, { sourcePath, targetPath }) => {
    if (!authToken) return { success: false, error: 'Not authenticated' };
    
    try {
        const formData = new FormData();
        formData.append('source', fs.createReadStream(sourcePath));
        formData.append('target', fs.createReadStream(targetPath));
        
        const response = await axios.post(`${API_URL}/faceswap/video`, formData, {
            headers: {
                ...formData.getHeaders(),
                Authorization: `Bearer ${authToken}`
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        
        return { success: true, result: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.detail || 'Video swap failed' };
    }
});

ipcMain.handle('swap:history', async () => {
    if (!authToken) return { success: false, error: 'Not authenticated' };
    
    try {
        const response = await axios.get(`${API_URL}/faceswap/history`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        return { success: true, history: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.detail || 'Failed to get history' };
    }
});

ipcMain.handle('swap:delete', async (event, swapId) => {
    if (!authToken) return { success: false, error: 'Not authenticated' };
    
    try {
        await axios.delete(`${API_URL}/faceswap/${swapId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.response?.data?.detail || 'Failed to delete' };
    }
});

ipcMain.handle('app:downloadFile', async (event, { url, filename }) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: filename,
        filters: [{ name: 'All Files', extensions: ['*'] }]
    });
    
    if (result.canceled) return { canceled: true };
    
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        fs.writeFileSync(result.filePath, response.data);
        return { success: true, path: result.filePath };
    } catch (error) {
        return { success: false, error: 'Download failed' };
    }
});

app.whenReady().then(() => {
    createWindow();
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
