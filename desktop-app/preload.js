const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('irwfsAPI', {
    // Authentication
    login: (email, password) => ipcRenderer.invoke('auth:login', { email, password }),
    register: (email, username, password, fullName) => ipcRenderer.invoke('auth:register', { email, username, password, fullName }),
    getUser: () => ipcRenderer.invoke('auth:getUser'),
    logout: () => ipcRenderer.invoke('auth:logout'),
    checkSession: () => ipcRenderer.invoke('auth:checkSession'),
    
    // File Selection
    selectImage: () => ipcRenderer.invoke('file:selectImage'),
    selectVideo: () => ipcRenderer.invoke('file:selectVideo'),
    
    // Face Swap
    swapImage: (sourcePath, targetPath) => ipcRenderer.invoke('swap:image', { sourcePath, targetPath }),
    swapVideo: (sourcePath, targetPath) => ipcRenderer.invoke('swap:video', { sourcePath, targetPath }),
    getHistory: () => ipcRenderer.invoke('swap:history'),
    deleteSwap: (swapId) => ipcRenderer.invoke('swap:delete', swapId),
    
    // Utils
    downloadFile: (url, filename) => ipcRenderer.invoke('app:downloadFile', { url, filename }),
    
    // Menu events
    onMenuNewSwap: (callback) => ipcRenderer.on('menu-new-swap', callback)
});
