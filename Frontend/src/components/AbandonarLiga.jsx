import React, { useState } from 'react';
import BotonPrimario from './ui/Button';
import { abandonarLiga } from '../services/AbandonarLiga';
import { quitarLigaClub } from '../services/ligasClub';

function AbandonarLiga({ idLiga, cambiarPantalla }) {
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const idCreador = localStorage.getItem('ownerId');
  const idUsuario = localStorage.getItem('userId');

  // Por ahora, el creador no puede abandonar la liga.
  const esCreador = idCreador === idUsuario;

  const handleAbandonarLiga = async () => {
    const usuarioId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    // Verificar que existan los datos necesarios.
    if (!idLiga) {
      setError('No se encontró el ID de la liga.');
      setMostrarConfirmacion(false);
      return;
    }

    if (!usuarioId) {
      setError('No se encontró el ID del usuario.');
      setMostrarConfirmacion(false);
      return;
    }

    if (!token) {
      setError('No se encontró el token de autenticación.');
      setMostrarConfirmacion(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await abandonarLiga(idLiga, usuarioId, token);
      quitarLigaClub(idLiga);

      setMostrarConfirmacion(false);

      // Volver a Mi Club después de abandonar la liga.
      cambiarPantalla?.('mi-club');
    } catch (err) {
      console.error('Error al abandonar la liga:', err);

      setError(err.message || 'No se pudo abandonar la liga.');

      // Cerrar el modal y permanecer en el lobby.
      setMostrarConfirmacion(false);
    } finally {
      setLoading(false);
    }
  };

  const cancelarAbandono = () => {
    if (loading) return;

    setMostrarConfirmacion(false);
    setError(null);
  };

  return (
    <>
      <div className="flex w-full justify-end p-3 sm:p-4">
        <button
          type="button"
          onClick={() => {
            if (esCreador || loading) return;

            setError(null);
            setMostrarConfirmacion(true);
          }}
          disabled={esCreador || loading}
          aria-disabled={esCreador || loading}
          title={
            esCreador
              ? 'El creador de la liga no puede abandonar.'
              : undefined
          }
          className="rounded-md bg-red-600 px-4 py-2 font-bold text-white
                     transition-colors hover:bg-red-700
                     focus:outline-none focus:ring-2 focus:ring-red-400
                     disabled:cursor-not-allowed disabled:opacity-50
                     disabled:hover:bg-red-600
                     sm:px-6 sm:py-3"
        >
          Abandonar liga
        </button>
      </div>

      {/* Mostrar los errores fuera del modal */}
      {error && (
        <div
          role="alert"
          className="px-4 pb-3 text-right text-sm text-red-400"
        >
          {error}
        </div>
      )}

      {/* Modal de confirmación */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-abandonar-liga"
            className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-5 text-white shadow-2xl sm:p-7"
          >
            <p className="mb-6 text-center text-sm text-gray-300 sm:text-base">
              ¿Estás seguro de que deseas abandonar esta liga?
            </p>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={cancelarAbandono}
                disabled={loading}
                className="w-full rounded-md border border-gray-600 px-5 py-2
                           font-bold text-white transition-colors
                           hover:bg-gray-800 disabled:cursor-not-allowed
                           disabled:opacity-50 sm:w-auto"
              >
                No
              </button>

              <BotonPrimario
                texto={loading ? 'Abandonando...' : 'Sí'}
                tipo="button"
                onClick={handleAbandonarLiga}
                disabled={loading}
                className="w-full sm:w-auto"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AbandonarLiga;