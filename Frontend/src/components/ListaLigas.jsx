import React from 'react';
import useWebSocketLigas from '../hooks/useWebSocketLigas';
import { obtenerLigasClub } from '../services/ligasClub';

function ListaLigas({ onUnirse, onIrAlLobby, miClubId }) {
  const { ligas, estado, error, listadoRecibido } = useWebSocketLigas();
  const ligasDelClub = obtenerLigasClub(miClubId);

  if (!listadoRecibido && estado !== 'error') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-400">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
        <p>
          {estado === 'reconectando'
            ? 'Reconectando con el servidor de ligas...'
            : 'Conectando y cargando ligas...'}
        </p>
      </div>
    );
  }

  if (!listadoRecibido && estado === 'error') {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-400"
      >
        <p className="font-semibold">No se pudo cargar el listado de ligas.</p>
        <p className="mt-1 text-sm">
          {error || 'Verificá la conexión y tu sesión.'}
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {(estado === 'error' || estado === 'reconectando' || estado === 'conectando') && (
        <div
          role="status"
          className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200"
        >
          {estado === 'reconectando'
            ? 'Se perdió la conexión. Intentando reconectar...'
            : estado === 'conectando'
              ? 'Conectando nuevamente al canal de ligas...'
              : error || 'Hay un problema con la conexión.'}
          {ligas.length > 0 && (
            <p className="mt-1">
              Se conserva el último listado recibido mientras se recupera la conexión.
            </p>
          )}
        </div>
      )}

      {ligas.length === 0 ? (
        <div className="flex-1 flex flex-col overflow-hidden rounded-md border border-[#1b2b68] bg-[#101b44] px-4 py-12 text-center">
          <h2 className="text-lg font-semibold text-white">
            No hay ligas disponibles
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Cuando una liga entre en espera, aparecerá aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden rounded-md border border-[#1b2b68] bg-[#101b44]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm text-gray-200">
              <thead className="border-b border-[#1b2b68] text-xs uppercase text-gray-400">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Cupos</th>
                  <th className="px-4 py-3">Duración</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b2b68]/60">
                {ligas.map((liga) => {
                  const completa = liga.cuposOcupados >= liga.cantidadEquipos;
                  const ligaRegistrada = ligasDelClub.find(
                    (ligaClub) => String(ligaClub.id) === String(liga.id)
                  );
                  const esMiLiga = Boolean(ligaRegistrada) || liga.clubes?.some(
                    (club) => String(club.id_club ?? club.id) === String(miClubId)
                  );

                  // Detectar si la liga está en curso (acepta formatos comunes)
                  const estadoLimpio = (liga.estado || '').toLowerCase().replace('_', ' ');
                  const esEnCurso = estadoLimpio === 'en curso';

                  // Determinar texto y estilo
                  let estadoTexto = 'En espera';
                  let estadoColor = 'font-medium text-green-400';

                  if (esMiLiga) {
                    estadoTexto = 'Lobby';
                    estadoColor = 'font-medium text-cyan-400';
                  } else if (esEnCurso) {
                    estadoTexto = 'En curso';
                    estadoColor = 'font-medium text-yellow-400';
                  } else if (completa) {
                    estadoTexto = 'Completa';
                    estadoColor = 'font-medium text-red-400';
                  }

                  return (
                    <tr
                      key={liga.id}
                      className="transition-colors hover:bg-[#1b2b68]/40"
                    >
                      <td className="px-4 py-4 font-medium text-white">{liga.nombre}</td>
                      <td className="px-4 py-4">
                        {liga.cuposOcupados} / {liga.cantidadEquipos}
                      </td>
                      <td className="px-4 py-4">{liga.duracionPartido} min</td>
                      <td className="px-4 py-4">{liga.esPrivada ? 'Privada' : 'Pública'}</td>
                      <td className="px-4 py-4">
                        <span className={estadoColor}>
                          {estadoTexto}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {/* Solo renderiza el botón si es la liga del usuario o si NO está completa y NO está en curso */}
                        {(esMiLiga || (!completa && !esEnCurso)) && (
                          <button
                            type="button"
                            onClick={() => esMiLiga
                              ? onIrAlLobby?.({ ...liga, esCreador: ligaRegistrada?.esCreador ?? false })
                              : onUnirse?.(liga)}
                            className={`rounded border px-3 py-1 text-[10px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${esMiLiga
                              ? 'border-orange-400 text-orange-300 enabled:hover:bg-orange-400 enabled:hover:text-[#060b11]'
                              : 'border-cyan-400 text-cyan-300 enabled:hover:bg-cyan-400 enabled:hover:text-[#060b11]'
                            }`}
                          >
                            {esMiLiga ? 'Lobby' : 'Unirse'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default ListaLigas;