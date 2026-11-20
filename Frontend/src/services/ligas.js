import { httpDelete, httpGet, httpPost, httpPut } from '../core/api/http.js';

export async function unirseALiga(idLiga, datosInscripcion) {
  if (!idLiga) {
    throw new Error('No se indicó la liga a la que se quiere ingresar.');
  }

  return httpPost(`/api/ligas/${idLiga}/unirse`, datosInscripcion);
}

export async function iniciarLiga(idLiga) {
  return httpPut(`/api/ligas/${idLiga}/iniciar`);
}

export async function obtenerLobbyLiga(idLiga) {
  if (!idLiga) {
    throw new Error('No se indicó la liga a consultar.');
  }

  return httpGet(`/api/ligas/${idLiga}/lobby`);
}

export async function obtenerAlineacionLiga(idLiga) {
  if (!idLiga) {
    throw new Error('No se indicó la liga a consultar.');
  }

  return httpGet(`/api/ligas/${idLiga}/alineacion`);
}

export async function actualizarAlineacionLiga(idLiga, convocatoria) {
  if (!idLiga) {
    throw new Error('No se indicó la liga a actualizar.');
  }

  return httpPut(`/api/ligas/${idLiga}/alineacion`, convocatoria);
}

export async function obtenerDatosDireccionLiga(idLiga) {
  if (!idLiga) {
    throw new Error('El partido no indica la liga que se quiere dirigir.');
  }

  const [alineacion, jugadores, respuestaComportamientos] = await Promise.all([
    httpGet(`/api/ligas/${idLiga}/alineacion`),
    httpGet('/api/jugadores'),
    httpGet('/api/comportamientos'),
  ]);

  const jugadoresPorId = new Map(
    jugadores.map((jugador) => [String(jugador.id ?? jugador.id_jugador), jugador]),
  );
  const jugadoresPropios = (alineacion.jugadores_convocados ?? []).map((convocado) => ({
    ...(jugadoresPorId.get(String(convocado.id_jugador)) ?? {}),
    ...convocado,
  }));

  return {
    convocatoria: jugadoresPropios,
    jugadores: jugadoresPropios,
    comportamientos: respuestaComportamientos.comportamientos ?? [],
  };
}

export async function cancelarLiga(idLiga) {
  if (!idLiga) {
    throw new Error('No se indicó la liga que se quiere cancelar.');
  }

  return httpDelete(`/api/ligas/${idLiga}`);
}