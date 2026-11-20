export function adaptarFixture(fixtureList) {
  if (!Array.isArray(fixtureList) || fixtureList.length === 0) return [];

  // Si ya viene agrupado por fecha (formato con numero_fecha), lo retornamos directamente
  if (fixtureList[0]?.numero_fecha !== undefined) {
    return fixtureList;
  }

  const fechasMap = new Map();

  for (const p of fixtureList) {
    const numFecha = p.fecha ?? 1;
    if (!fechasMap.has(numFecha)) {
      fechasMap.set(numFecha, {
        id_fecha: numFecha,
        numero_fecha: numFecha,
        estado_fecha: 'proxima',
        partidos: [],
      });
    }

    const fechaObj = fechasMap.get(numFecha);

    let estadoPartido = 'Por jugar';
    const est = String(p.estado ?? '').toUpperCase();
    if (est === 'FINALIZADO') {
      estadoPartido = 'finalizado';
    } else if (est === 'EN_VIVO') {
      estadoPartido = '1T';
    }

    fechaObj.partidos.push({
      id: p.id_partido,
      local: p.club_local_nombre,
      visitante: p.club_visitante_nombre,
      localId: p.club_local_id,
      visitanteId: p.club_visitante_id,
      goles_local: p.gol_club_local ?? 0,
      goles_visitante: p.gol_club_visitante ?? 0,
      estado: estadoPartido,
    });
  }

  const fechasArray = Array.from(fechasMap.values()).sort(
    (a, b) => a.numero_fecha - b.numero_fecha
  );

  let primeraPendienteEncontrada = false;
  for (const fecha of fechasArray) {
    const todosFinalizados = fecha.partidos.every(
      (partido) => partido.estado === 'finalizado'
    );
    const algunoEnVivo = fecha.partidos.some(
      (partido) => partido.estado === '1T' || partido.estado === '2T' || partido.estado === 'Penales'
    );

    if (todosFinalizados) {
      fecha.estado_fecha = 'finalizada';
    } else if (algunoEnVivo) {
      fecha.estado_fecha = 'actual';
      primeraPendienteEncontrada = true;
    } else if (!primeraPendienteEncontrada) {
      fecha.estado_fecha = 'actual';
      primeraPendienteEncontrada = true;
    } else {
      fecha.estado_fecha = 'proxima';
    }
  }

  return fechasArray;
}
