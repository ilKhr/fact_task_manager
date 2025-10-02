const { contextBridge, ipcRenderer } = require('electron');

// Безопасный API для renderer процесса
contextBridge.exposeInMainWorld('electronAPI', {
    checkLicense: () => ipcRenderer.invoke('check-license'),
    saveData: (data) => ipcRenderer.invoke('save-data', data),
    loadData: () => ipcRenderer.invoke('load-data'),
    onLicenseInvalid: (callback) => ipcRenderer.on('license-invalid', callback),
});
