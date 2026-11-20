function obtenerClaveClub(idClub = localStorage.getItem('clubId')) {
  return idClub ? `ligasClub-${idClub}` : null;
}

export function obtenerLigasClub(idClub) {
  const clave = obtenerClaveClub(idClub);
  if (!clave) return [];

  try {
    const ligas = JSON.parse(localStorage.getItem(clave) || '[]');
    return Array.isArray(ligas) ? ligas : [];
  } catch {
    return [];
  }
}

export function registrarLigaClub(idLiga, nombre, idClub, esCreador = false) {
  const clave = obtenerClaveClub(idClub);
  if (!clave || idLiga == null) return;

  const ligas = obtenerLigasClub(idClub);
  const indice = ligas.findIndex((liga) => String(liga.id) === String(idLiga));
  const ligaActualizada = { id: idLiga, nombre, esCreador };

  if (indice >= 0) {
    ligas[indice] = {
      ...ligas[indice],
      ...ligaActualizada,
      esCreador: ligas[indice].esCreador || esCreador,
    };
  } else {
    ligas.push(ligaActualizada);
  }

  localStorage.setItem(clave, JSON.stringify(ligas));
}

export function quitarLigaClub(idLiga, idClub) {
  const clave = obtenerClaveClub(idClub);
  if (!clave) return;

  const ligas = obtenerLigasClub(idClub).filter(
    (liga) => String(liga.id) !== String(idLiga)
  );
  localStorage.setItem(clave, JSON.stringify(ligas));
}
