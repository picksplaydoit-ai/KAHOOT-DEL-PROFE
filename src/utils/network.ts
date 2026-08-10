/**
 * EL PROFE PRO - Detector de Red e IP Local
 * ----------------------------------------
 * Obtiene la dirección IPv4 local del profesor (laptop/PC) y genera
 * un código QR en DataURL para fácil escaneo por los alumnos.
 */

import os from 'os';
import QRCode from 'qrcode';
import { NetworkInfo } from '../types';

/**
 * Detecta las interfaces de red locales activas (WiFi, Ethernet)
 */
export function getLocalIPv4Addresses(): { interface: string; address: string }[] {
  const interfaces = os.networkInterfaces();
  const results: { interface: string; address: string }[] = [];

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      // Ignorar loopback (127.0.0.1) e IPv6
      if (net.family === 'IPv4' && !net.internal) {
        results.push({
          interface: name,
          address: net.address
        });
      }
    }
  }

  if (results.length === 0) {
    results.push({ interface: 'Localhost', address: '127.0.0.1' });
  }

  return results;
}

/**
 * Genera la información de red completa incluyendo el código QR en Base64
 */
export async function getNetworkConfig(port: number = 3000): Promise<NetworkInfo> {
  const ips = getLocalIPv4Addresses();
  // Preferir interfaces de WiFi o Ethernet si están disponibles
  const primary = ips.find(ip => /wifi|wlan|ethernet|eth|en/i.test(ip.interface)) || ips[0];

  const hostUrl = process.env.APP_URL || `http://${primary.address}:${port}`;

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(hostUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Error generando el código QR:', err);
  }

  return {
    interface: primary.interface,
    address: primary.address,
    port,
    qrDataUrl,
    fullUrl: hostUrl
  };
}
