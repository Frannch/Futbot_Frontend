import React from "react";
import EspectarPartidoButton from './EspectarPartidoButton.jsx';

function Fixture({ fechas = [], onEspectarPartido }) {
  // Filtramos para descartar las fechas finalizadas
  const fechasActivas = fechas.filter((fecha) => fecha.estado_fecha !== "finalizada");

  return (
    <section className="rounded-md bg-[#1a237e] p-6 text-white" aria-labelledby="titulo-fixture">
      <h2 id="titulo-fixture" className="mb-6 text-xl font-bold border-b border-white/20 pb-2">
        Calendario de Fechas
      </h2>

      {fechasActivas.length > 0 ? (
        <div className="max-h-[420px] overflow-y-auto pr-1 space-y-8">
          {fechasActivas.map((fecha) => (
            <div key={fecha.id_fecha ?? fecha.numero_fecha} className="space-y-3">
              {/* Encabezado de la Fecha */}
              <div className="bg-[#32cd32]/50 px-4 py-2 rounded-md">
                <h3 className="font-bold text-base uppercase tracking-wide">
                  {fecha.estado_fecha === "actual"
                    ? `Fecha Actual (${fecha.numero_fecha})`
                    : `Próxima Fecha (${fecha.numero_fecha})`}
                </h3>
              </div>

              {/* Lista de Partidos */}
              <ul className="divide-y divide-white/10 rounded-md bg-white/5 p-2">
                {fecha.partidos?.map((partido, index) => {
                  const enVivo = ["1T", "2T", "Penales"].includes(partido.estado);

                  return (
                    <li
                      key={partido.id ?? index}
                      className="flex flex-col items-center justify-between gap-2 rounded px-2 py-3 sm:flex-row"
                    >
                      {/* Estado del Partido (1T, 2T, Penales) */}
                      <div className="text-xs font-medium text-amber-300 sm:w-24 text-center sm:text-left">
                        {enVivo ? (
                          <span className="inline-flex items-center gap-1.5 font-bold">
                            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                            {partido.estado}
                          </span>
                        ) : (
                          <span className="text-gray-300">{partido.estado || "Por jugar"}</span>
                        )}
                      </div>
                      {enVivo && partido.id && onEspectarPartido && (
                        <EspectarPartidoButton
                          onClick={() => onEspectarPartido(partido)}
                        />
                      )}

                      {/* Marcador: Club Goles - Goles Club */}
                      <div className="flex items-center justify-center gap-3 font-semibold text-sm sm:text-base w-full sm:w-auto">
                        <span className="flex-1 text-right sm:w-40 truncate">
                          {partido.local}
                        </span>

                        <div className="bg-black/30 px-3 py-1 rounded font-mono font-bold text-lg min-w-[60px] text-center">
                          {partido.goles_local ?? 0} - {partido.goles_visitante ?? 0}
                        </div>

                        <span className="flex-1 text-left sm:w-40 truncate">
                          {partido.visitante}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-300">No hay fechas ni partidos programados.</p>
      )}
    </section>
  );
}

export default Fixture;