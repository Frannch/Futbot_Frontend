import { useState } from 'react';
import { eliminarComportamiento } from '../services/ComportamientoService.js';

function EliminarComportamiento({ comportamiento, onEliminado }) {
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState('');

  const nombre = comportamiento.nombre;

  const confirmarEliminacion = async () => {
    if (eliminando) return;

    setEliminando(true);
    setError('');

    try {
      await eliminarComportamiento(nombre);
      onEliminado?.(comportamiento);
      setConfirmando(false);
    } catch (fallo) {
      setError(fallo.message || 'No se pudo eliminar el comportamiento.');
    } finally {
      setEliminando(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError('');
          setConfirmando(true);
        }}
        className="rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500"
      >
        Eliminar
      </button>

      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-confirmar-eliminacion-comportamiento"
            className="w-full max-w-md rounded-lg border border-gray-700 bg-[#11151f] p-6 text-center text-white shadow-xl"
          >
            <h2 id="titulo-confirmar-eliminacion-comportamiento" className="text-lg font-bold">
              Eliminar comportamiento
            </h2>
            <p className="mt-3 text-sm text-gray-300">
              ¿Eliminar permanentemente “{nombre}”?
            </p>

            {error && (
              <p role="alert" className="mt-4 rounded-md bg-red-900/30 p-3 text-sm text-red-300">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                disabled={eliminando}
                className="rounded border border-gray-600 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminacion}
                disabled={eliminando}
                className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default EliminarComportamiento;
