/**
 * EL PROFE PRO - Archivo Principal de Electron (main.js)
 * ----------------------------------------------------
 * Inicializa la aplicación de escritorio en Electron, detecta las IPs locales
 * de la laptop del profesor y lanza el servidor integrado Express + Socket.io.
 */

import { app, BrowserWindow, Menu, ipcMain, shell } from 'electron';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let serverProcess = null;
const PORT = process.env.PORT || 3000;

/**
 * Obtiene la dirección IP IPv4 de la red local (WiFi o Ethernet)
 */
function getLocalNetworkIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      // Ignorar loopback (127.0.0.1) y direcciones IPv6
      if (net.family === 'IPv4' && !net.internal) {
        ips.push({
          interface: name,
          address: net.address
        });
      }
    }
  }

  return ips.length > 0 ? ips : [{ interface: 'Local', address: '127.0.0.1' }];
}

/**
 * Crea la ventana principal de Electron
 */
async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 868,
    minWidth: 1024,
    minHeight: 700,
    title: 'El Profe Pro - Servidor Evaluativo Offline',
    icon: path.join(__dirname, 'public/favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    },
    show: false
  });

  if (app.isPackaged) {
    // En producción empaquetada, cargar el archivo index.html compilado directamente
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    await mainWindow.loadFile(indexPath);
  } else {
    // En desarrollo, cargar la URL de Vite / Express
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    await mainWindow.loadURL(appUrl);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Configurar Menú Superior
  const menuTemplate = [
    {
      label: 'Servidor',
      submenu: [
        {
          label: 'Ver IPs de Red Local',
          click: () => {
            const ips = getLocalNetworkIPs();
            const ipList = ips.map(i => `${i.interface}: http://${i.address}:${PORT}`).join('\n');
            mainWindow?.webContents.send('show-ip-info', ipList);
          }
        },
        {
          label: 'Recargar Servidor',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow?.reload()
        },
        { type: 'separator' },
        {
          label: 'Salir',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'togglefullscreen', label: 'Pantalla Completa' },
        { role: 'zoomIn', label: 'Acercar' },
        { role: 'zoomOut', label: 'Alejar' },
        { role: 'resetZoom', label: 'Restablecer Zoom' },
        { role: 'toggleDevTools', label: 'Herramientas de Desarrollador' }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Manual de Uso Offline',
          click: () => {
            shell.openExternal(`http://localhost:${PORT}/#manual`);
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Inicialización de App Electron
app.whenReady().then(async () => {
  // Iniciar servidor Express/Socket.io en segundo plano
  try {
    const serverPath = path.join(__dirname, 'dist', 'server.js');
    await import(`file://${serverPath}`);
    console.log('Servidor Express iniciado en puerto:', PORT);
  } catch (err) {
    console.error('Error al iniciar el servidor Express:', err);
  }

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (serverProcess) serverProcess.kill();
    app.quit();
  }
});

// IPC Listener para solicitar las IPs de red desde el frontend docente
ipcMain.handle('get-network-ips', () => {
  return getLocalNetworkIPs();
});
