/**
 * EL PROFE PRO - Panel de Configuración de Red y Código QR
 */

import React from 'react';
import { Wifi, QrCode, Users, ShieldCheck, RefreshCw, Copy, Check, Smartphone } from 'lucide-react';
import { NetworkInfo, Student } from '../types';

interface NetworkPanelProps {
  networkInfo: NetworkInfo | null;
  students: Student[];
  onRefresh: () => void;
}

export const NetworkPanel: React.FC<NetworkPanelProps> = ({ networkInfo, students, onRefresh }) => {
  const [copied, setCopied] = React.useState(false);

  const copyUrl = () => {
    if (networkInfo?.fullUrl) {
      navigator.clipboard.writeText(networkInfo.fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tarjeta Principal de Red Local */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Información e IP */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <Wifi className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tracking-wider text-emerald-700 uppercase bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Servidor 100% Offline Activo
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mt-1">
                  Red Local del Profesor
                </h2>
              </div>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed">
              Los estudiantes deben conectar sus celulares, tablets o laptops al mismo WiFi o punto de acceso y escribir la dirección IP en el navegador web o escanear el código QR.
            </p>

            <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400 font-medium block">DIRECCIÓN IP DE ACCESO:</span>
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-400 font-mono">
                  {networkInfo ? networkInfo.fullUrl : 'Cargando IP...'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyUrl}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? '¡Copiado!' : 'Copiar URL'}
                </button>
                <button
                  onClick={onRefresh}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
                  title="Actualizar Red"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Código QR de Acceso Rápido */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl w-full lg:w-auto">
            {networkInfo?.qrDataUrl ? (
              <div className="bg-white p-3 rounded-xl shadow-inner border border-slate-200 flex flex-col items-center">
                <img
                  src={networkInfo.qrDataUrl}
                  alt="QR Acceso Alumnos"
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                />
                <span className="text-xs font-bold text-slate-600 mt-2 flex items-center gap-1">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  Escanear con la Cámara del Celular
                </span>
              </div>
            ) : (
              <div className="w-56 h-56 flex items-center justify-center bg-slate-200 rounded-xl text-slate-400 text-sm font-medium">
                Generando QR...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Alumnos Conectados en Tiempo Real */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-800">
              Alumnos Conectados en Línea
            </h3>
            <span className="ml-2 bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {students.length}
            </span>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <Smartphone className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-600 font-medium text-sm">Aún no hay alumnos conectados</p>
            <p className="text-slate-400 text-xs mt-1">
              Escanea el código QR desde un celular o abre una pestaña nueva con la IP para simular un alumno.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {students.map((std) => (
              <div
                key={std.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center">
                    {std.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 leading-tight">
                      {std.name}
                    </h4>
                    <span className="text-xs text-slate-500 font-medium">
                      Grupo: {std.group}
                    </span>
                  </div>
                </div>
                {std.blurCount > 0 ? (
                  <span className="text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                    ⚠️ {std.blurCount} salidas
                  </span>
                ) : (
                  <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Limpio
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
