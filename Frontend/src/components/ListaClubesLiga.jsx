const ESTADOS_FINALIZADOS = new Set([
  'final',
  'finalizada',
  'finalizado',
  'finished',
  'completed',
  'ft',
  'terminada',
  'terminado',
]);

function identificarEquipo(equipo) {
  if (equipo && typeof equipo === 'object') {
    return equipo.id_club ?? equipo.id ?? equipo.nombre ?? equipo.name ?? '';
  }
  return equipo ?? '';
}

function claveEquipo(equipo) {
  return String(identificarEquipo(equipo)).trim().toLocaleLowerCase();
}

function partidoFinalizado(fecha, partido) {
  const estadoFecha = String(fecha.estado_fecha ?? '').trim().toLocaleLowerCase();
  const estadoPartido = String(partido.estado ?? partido.estado_partido ?? '')
    .trim()
    .toLocaleLowerCase();

  return estadoFecha === 'finalizada'
    || estadoFecha === 'finalizado'
    || ESTADOS_FINALIZADOS.has(estadoPartido);
}

function calcularPosiciones(clubes, fechas) {
  const aliasClub = new Map();
  const posiciones = clubes.map((club) => {
    const fila = {
      club,
      pj: 0,
      pg: 0,
      pe: 0,
      pp: 0,
      gf: 0,
      gc: 0,
      df: 0,
      pts: 0,
    };
    const id = claveEquipo(club.id_club ?? club.id);
    const nombre = claveEquipo(club.nombre ?? club.name);
    if (id) aliasClub.set(id, fila);
    if (nombre) aliasClub.set(nombre, fila);
    return fila;
  });

  fechas.forEach((fecha) => {
    (fecha.partidos ?? []).forEach((partido) => {
      if (!partidoFinalizado(fecha, partido)) return;
      if (partido.goles_local == null || partido.goles_visitante == null) return;

      const golesLocal = Number(partido.goles_local);
      const golesVisitante = Number(partido.goles_visitante);
      if (!Number.isFinite(golesLocal) || !Number.isFinite(golesVisitante)) return;

      const local = aliasClub.get(claveEquipo(partido.local ?? partido.club_local));
      const visitante = aliasClub.get(claveEquipo(partido.visitante ?? partido.club_visitante));
      if (!local || !visitante || local === visitante) return;

      local.pj += 1;
      visitante.pj += 1;
      local.gf += golesLocal;
      local.gc += golesVisitante;
      visitante.gf += golesVisitante;
      visitante.gc += golesLocal;

      if (golesLocal > golesVisitante) {
        local.pg += 1;
        local.pts += 3;
        visitante.pp += 1;
      } else if (golesVisitante > golesLocal) {
        visitante.pg += 1;
        visitante.pts += 3;
        local.pp += 1;
      } else {
        local.pe += 1;
        visitante.pe += 1;
        local.pts += 1;
        visitante.pts += 1;
      }
    });
  });

  return posiciones
    .map((fila) => ({ ...fila, df: fila.gf - fila.gc }))
    .sort((a, b) => b.pts - a.pts
      || b.df - a.df
      || b.gf - a.gf
      || String(a.club.nombre ?? a.club.name ?? '').localeCompare(
        String(b.club.nombre ?? b.club.name ?? ''),
        'es'
      ));
}

function ListaClubesLiga({ clubes = [], fechas = [], iniciada = false }) {
  const posiciones = calcularPosiciones(clubes, fechas);
  const primerPuesto = posiciones.find((fila) => fila.pj > 0);
  const lideres = primerPuesto
    ? posiciones.filter((fila) => fila.pts === primerPuesto.pts
      && fila.df === primerPuesto.df
      && fila.gf === primerPuesto.gf)
    : [];

  if (!iniciada) {
    return (
      <section className="rounded-md bg-[#1a237e] p-6" aria-labelledby="titulo-clubes-liga">
        <h2 id="titulo-clubes-liga" className="mb-4 text-lg font-bold text-white">
          CLUBES DEL LOBBY
        </h2>
        {clubes.length > 0 ? (
          <ul className="divide-y divide-white/10">
            {clubes.map((club, index) => (
              <li
                key={club.id_club ?? club.id ?? club.nombre ?? club.name ?? index}
                className="py-3 font-semibold text-white"
              >
                {club.nombre ?? club.name ?? `Club ${index + 1}`}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-300">Todavía no hay clubes para mostrar.</p>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-md bg-[#1a237e] p-6" aria-labelledby="titulo-clubes-liga">
      <h2 id="titulo-clubes-liga" className="mb-4 text-lg font-bold text-white">
        TABLA DE POSICIONES
      </h2>
      {posiciones.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left text-xs text-white">
            <thead className="bg-[#320080] text-[10px] uppercase text-violet-200">
              <tr>
                <th scope="col" className="px-2 py-3">Pos</th>
                <th scope="col" className="px-2 py-3">Club</th>
                <th scope="col" className="px-2 py-3 text-center">PJ</th>
                <th scope="col" className="px-2 py-3 text-center">PG</th>
                <th scope="col" className="px-2 py-3 text-center">PE</th>
                <th scope="col" className="px-2 py-3 text-center">PP</th>
                <th scope="col" className="px-2 py-3 text-center">GF</th>
                <th scope="col" className="px-2 py-3 text-center">GC</th>
                <th scope="col" className="px-2 py-3 text-center">DF</th>
                <th scope="col" className="px-2 py-3 text-center">PTS</th>
              </tr>
            </thead>
            <tbody>
              {posiciones.map((fila, index) => (
                <tr
                  key={fila.club.id_club ?? fila.club.id ?? fila.club.nombre ?? index}
                  className="border-b border-white/10 odd:bg-[#26005f] even:bg-[#320080]"
                >
                  <td className="px-2 py-3 font-bold text-lime-400">{index + 1}</td>
                  <th
                    scope="row"
                    className={`max-w-32 truncate px-2 py-3 text-left font-semibold ${lideres.includes(fila) ? 'text-yellow-300' : ''}`}
                  >
                    {fila.club.nombre ?? fila.club.name ?? `Club ${index + 1}`}
                  </th>
                  <td className="px-2 py-3 text-center">{fila.pj}</td>
                  <td className="px-2 py-3 text-center">{fila.pg}</td>
                  <td className="px-2 py-3 text-center">{fila.pe}</td>
                  <td className="px-2 py-3 text-center">{fila.pp}</td>
                  <td className="px-2 py-3 text-center">{fila.gf}</td>
                  <td className="px-2 py-3 text-center">{fila.gc}</td>
                  <td className={`px-2 py-3 text-center ${fila.df > 0 ? 'text-lime-400' : fila.df < 0 ? 'text-red-400' : ''}`}>
                    {fila.df > 0 ? `+${fila.df}` : fila.df}
                  </td>
                  <td className="px-2 py-3 text-center font-bold text-lime-400">{fila.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-300">Todavía no hay clubes para mostrar.</p>
      )}
    </section>
  );
}

export default ListaClubesLiga;