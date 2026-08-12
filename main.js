/**
 * EL PROFE PRO - Archivo Principal de Electron (main.js)
 * ----------------------------------------------------
 * Inicializa la aplicación de escritorio en Electron, detecta las IPs locales
 * de la laptop del profesor y lanza el servidor integrado Express + Socket.io.
 */

import { app, BrowserWindow, Menu, ipcMain, shell, dialog } from 'electron';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let serverProcess = null;
const DEFAULT_PORT = process.env.PORT || 3000;

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

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Esperar a que el servidor Express levante y defina su puerto final
  const connectToServer = async (retries = 10) => {
    for (let i = 0; i < retries; i++) {
      const actualPort = process.env.EXPRESS_PORT;
      if (actualPort) {
        const appUrl = process.env.APP_URL || `http://localhost:${actualPort}`;
        try {
          await mainWindow.loadURL(appUrl);
          return;
        } catch (e) {
          console.log(`Reintentando carga de URL (${i+1}/${retries})...`);
        }
      }
      await new Promise(res => setTimeout(res, 500));
    }
    console.error('No se pudo conectar al servidor integrado.');
    // Mostrar la ventana de todos modos para que no se quede oculta para siempre
    mainWindow.show();
    dialog.showErrorBox('Timeout de Servidor', 'El servidor interno tardó demasiado en responder o falló silenciosamente.\n\nRevisa si hay otra instancia corriendo o consulta los logs.');
  };

  await connectToServer();

  // Configurar Menú Superior
  const menuTemplate = [
    {
      label: 'Servidor',
      submenu: [
        {
          label: 'Ver IPs de Red Local',
          click: () => {
            const actualPort = process.env.EXPRESS_PORT || DEFAULT_PORT;
            const ips = getLocalNetworkIPs();
            const ipList = ips.map(i => `${i.interface}: http://${i.address}:${actualPort}`).join('\n');
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
            const actualPort = process.env.EXPRESS_PORT || DEFAULT_PORT;
            shell.openExternal(`http://localhost:${actualPort}/#manual`);
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
    let serverPath;
    const distServerPath = path.join(__dirname, 'dist', 'server.js');
    const unpackedServerPath = path.join(__dirname.replace('app.asar', 'app.asar.unpacked'), 'dist', 'server.js');
    
    if (app.isPackaged) {
      process.env.NODE_ENV = 'production';
      serverPath = fs.existsSync(unpackedServerPath) ? unpackedServerPath : distServerPath;
    } else {
      serverPath = distServerPath;
    }

    if (!fs.existsSync(serverPath)) {
      throw new Error(`No se encontró el archivo del servidor en:\n- ${unpackedServerPath}\n- ${distServerPath}`);
    }

    const serverUrl = pathToFileURL(serverPath).href;
    await import(serverUrl);
    console.log('Iniciando servidor Express interno...');
  } catch (err) {
    console.error('Error al iniciar el servidor Express:', err);
    dialog.showErrorBox('Error de Arranque', `Error al iniciar el servidor integrado:\n\n${err.message}\n\nStack: ${err.stack}`);
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
