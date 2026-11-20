import React, { useState } from 'react';
import BotonPrimario from '../ui/Button';
import { iniciarLiga } from "../../services/ligas";

const MINIMO_EQUIPOS_PARA_INICIAR = 4;

function IniciarLiga({
  idLiga,
  cambiarPantalla,
  esCreador = false,
  equiposDisponibles = 0,
  yaIniciada = false,
  alIniciar,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inicioConfirmado, setInicioConfirmado] = useState(false);
  const clubesFaltantes = Math.max(0, MINIMO_EQUIPOS_PARA_INICIAR - equiposDisponibles);
  const puedeIniciar = equiposDisponibles >= MINIMO_EQUIPOS_PARA_INICIAR;

  const handleIniciarLiga = async () => {
    if (!esCreador || !puedeIniciar || loading) return;

    const token = localStorage.getItem('token');

    // Verificar que existan los datos necesarios.
    if (!idLiga) {
      setError('No se encontró el ID de la liga.');
      return;
    }

    if (!token) {
      setError('No se encontró el token de autenticación.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const datosLiga = await iniciarLiga(idLiga);
      alIniciar?.(datosLiga?.liga ?? datosLiga ?? {});
      setInicioConfirmado(true);
    } catch (err) {
      console.error('Error al iniciar la liga:', err);

      setError(err.message || 'No se pudo iniciar la liga.');
    } finally {
      setLoading(false);
    }
  };

    if (!esCreador || yaIniciada || inicioConfirmado) return null;

    return (
      <div className="flex flex-col items-center justify-center gap-4">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-400"
          >
            <p className="font-semibold">Error al iniciar la liga.</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}
        <p role="status" className="text-sm text-gray-300">
          Faltan {clubesFaltantes} {clubesFaltantes === 1 ? 'club' : 'clubes'} para poder iniciar.
        </p>
        <BotonPrimario
          texto={loading ? 'Iniciando...' : 'Iniciar Liga'}
          onClick={handleIniciarLiga}
          disabled={loading || !puedeIniciar}
        />
      </div>
    );
}

export default IniciarLiga;