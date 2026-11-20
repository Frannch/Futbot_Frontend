import { useState } from 'react';
import { cancelarLiga } from '../../services/ligas.js';

function CancelarLiga({ idLiga, esCreador = false, cambiarPantalla }) {
  const [confirmando, setConfirmando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState('');

  if (!esCreador) return null;

  const confirmarCancelacion = async () => {
    if (cancelando) return;

    setCancelando(true);
    setError('');
    try {
      await cancelarLiga(idLiga);
      setConfirmando(false);
      cambiarPantalla?.('mi-club');
    } catch (fallo) {
      setError(fallo.message || 'No se pudo cancelar la liga.');
    } finally {
      setCancelando(false);
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
        className="w-fit justify-self-end rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
      >
        Cancelar liga
      </button>

      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-cancelar-liga"
            className="w-full max-w-md rounded-lg border border-gray-700 bg-[#11151f] p-6 text-center text-white shadow-xl"
          >
            <h2 id="titulo-cancelar-liga" className="text-lg font-bold">
              Cancelar liga
            </h2>
            <p className="mt-3 text-sm text-gray-300">
              Todos los jugadores serán eliminados de la liga junto a ella.
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
                disabled={cancelando}
                className="rounded border border-gray-600 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 disabled:opacity-50"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={confirmarCancelacion}
                disabled={cancelando}
                className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelando ? 'Cancelando...' : 'Confirmar'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default CancelarLiga;
