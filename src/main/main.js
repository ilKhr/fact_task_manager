const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const LicenseManager = require('./license');
const StorageManager = require('./storage');

let mainWindow;
const licenseManager = new LicenseManager();
const storageManager = new StorageManager();

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        alwaysOnTop: true,
        skipTaskbar: false,
        webPreferences: {
            preload: path.join(__dirname, '../preload/preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        show: false,
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    // Проверяем лицензию перед показом
    licenseManager.checkLicense().then(valid => {
        if (valid) {
            mainWindow.show();
            licenseManager.startMonitoring(() => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('license-invalid');
                }
            });
        } else {
            licenseManager.showLicenseDialog(mainWindow, () => {
                app.quit();
            });
        }
    });

    // Development tools
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// IPC Handlers
ipcMain.handle('check-license', async () => {
    return await licenseManager.checkLicense();
});

ipcMain.handle('save-data', async (event, data) => {
    const licenseValid = await licenseManager.checkLicense();
    if (!licenseValid) {
        throw new Error('License not valid');
    }
    return await storageManager.saveData(data);
});

ipcMain.handle('load-data', async () => {
    const licenseValid = await licenseManager.checkLicense();
    if (!licenseValid) {
        throw new Error('License not valid');
    }
    return await storageManager.loadData();
});
