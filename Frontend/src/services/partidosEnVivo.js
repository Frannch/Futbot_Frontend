const URL_BASE = 'ws://localhost:8000';
const TIPOS_ESTADO_PARTIDO = new Set([
  'PARTIDO_INICIAL',
  'PARTIDO_ESTADO',
  'PARTIDO_TICK',
  'PENAL_TICK',
  'PARTIDO_PAUSADO',
  'PARTIDO_REANUDADO',
  'PENALES_INICIADOS',
  'PENAL_RONDA_INICIADA',
  'PENAL_RONDA_FINALIZADA',
]);

const obtenerIdClub = (club) => club?.id_club ?? club?.id ?? club?.club_id;
const obtenerClaveClub = (club) => String(
  obtenerIdClub(club) ?? club?.nombre ?? club?.name ?? '',
).trim().toLowerCase();

const intercambiarMarcador = (marcador) => (
  Array.isArray(marcador) && marcador.length >= 2
    ? [marcador[1], marcador[0]]
    : marcador
);

export function combinarPelota(pelotaNueva, pelotaAnterior) {
  if (!pelotaNueva || typeof pelotaNueva !== 'object') return pelotaAnterior;
  const posicion = pelotaNueva.posicion || pelotaNueva.position || {};
  const x = pelotaNueva.x ?? posicion.x;
  const y = pelotaNueva.y ?? posicion.y;

  return {
    ...pelotaAnterior,
    ...pelotaNueva,
    ...(x === undefined ? {} : { x }),
    ...(y === undefined ? {} : { y }),
  };
}

export function normalizarOrdenPartido(partido) {
  const clubes = partido.clubes || {};
  const local = partido.club_local ?? clubes.local;
  const visitante = partido.club_visitante ?? clubes.visitante;
  const claveLocal = obtenerClaveClub(local);
  const claveVisitante = obtenerClaveClub(visitante);
  if (!local || !visitante || !claveLocal || !claveVisitante) return partido;

  const partidoConClubes = {
    ...partido,
    club_local: local,
    club_visitante: visitante,
    clubes: {
      ...clubes,
      local,
      visitante,
    },
  };
  if (claveLocal <= claveVisitante) return partidoConClubes;

  const jugadores = Array.isArray(partido.jugadores)
    ? partido.jugadores.map((jugador) => (
      jugador.equipo === undefined
        ? jugador
        : { ...jugador, equipo: jugador.equipo === 0 ? 1 : 0 }
    ))
    : partido.jugadores;

  return {
    ...partidoConClubes,
    club_local: visitante,
    club_visitante: local,
    clubes: {
      ...clubes,
      local: visitante,
      visitante: local,
    },
    marcador: intercambiarMarcador(partido.marcador),
    marcador_reglamentario: intercambiarMarcador(partido.marcador_reglamentario),
    marcador_regular: intercambiarMarcador(partido.marcador_regular),
    resultado_penales: intercambiarMarcador(partido.resultado_penales),
    equipo_ganador: partido.equipo_ganador === undefined
      ? partido.equipo_ganador
      : partido.equipo_ganador === 0 ? 1 : 0,
    ganador_definicion: partido.ganador_definicion === undefined
      ? partido.ganador_definicion
      : partido.ganador_definicion === 0 ? 1 : 0,
    jugadores,
  };
}

function alinearConReferencia(partido, referencia) {
  const local = partido.club_local ?? partido.clubes?.local;
  const visitante = partido.club_visitante ?? partido.clubes?.visitante;
  const referenciaLocal = referencia.club_local ?? referencia.clubes?.local;
  const referenciaVisitante = referencia.club_visitante ?? referencia.clubes?.visitante;
  const claves = [obtenerClaveClub(local), obtenerClaveClub(visitante)];
  const clavesReferencia = [
    obtenerClaveClub(referenciaLocal),
    obtenerClaveClub(referenciaVisitante),
  ];

  if (!claves[0] || !claves[1] || !clavesReferencia[0] || !clavesReferencia[1]) {
    return {
      ...partido,
      club_local: referenciaLocal || local,
      club_visitante: referenciaVisitante || visitante,
      clubes: referencia.clubes || partido.clubes,
    };
  }

  const partidoAlineado = claves[0] === clavesReferencia[1]
    && claves[1] === clavesReferencia[0]
    ? normalizarOrdenPartido(partido)
    : partido;

  return {
    ...partidoAlineado,
    club_local: referenciaLocal,
    club_visitante: referenciaVisitante,
    clubes: {
      ...(partidoAlineado.clubes || {}),
      ...(referencia.clubes || {}),
      local: referenciaLocal,
      visitante: referenciaVisitante,
    },
  };
}

function quitarDatosDinamicos(partido) {
  const {
    jugadores,
    alineacion,
    alineaciones,
    convocatorias,
    convocatoria,
    jugadores_local,
    jugadores_visitante,
    ...metadatos
  } = partido;

  return metadatos;
}

function combinarPartido(actual, mensaje, idPartido) {
  const estado = mensaje.estado || mensaje;
  const partidoCombinado = {
    ...actual,
    ...estado,
    id_partido: mensaje.id_partido ?? estado.id_partido ?? actual?.id_partido ?? idPartido,
    club_local: estado.club_local ?? estado.clubes?.local ?? actual?.club_local,
    club_visitante: estado.club_visitante ?? estado.clubes?.visitante ?? actual?.club_visitante,
    marcador: estado.marcador ?? actual?.marcador ?? [0, 0],
    pelota: combinarPelota(estado.pelota, actual?.pelota),
  };

  return alinearConReferencia(
    normalizarOrdenPartido(partidoCombinado),
    actual,
  );
}

export function crearServicioPartidosEnVivo(token, callbacks = {}) {
  const socketsPartidos = new Map();
  const estadosPartidos = new Map();
  const estadosInicialesRecibidos = new Set();
  const idsConectando = new Set();
  let socketListado = null;
  let cerrado = false;

  const eliminarPartido = (idPartido) => {
    const clave = String(idPartido);
    idsConectando.delete(clave);
    const socketPartido = socketsPartidos.get(clave);
    if (socketPartido) {
      socketPartido.onclose = null;
      socketPartido.close();
      socketsPartidos.delete(clave);
    }
    estadosPartidos.delete(clave);
    estadosInicialesRecibidos.delete(clave);
    callbacks.onPartidoEliminado?.(idPartido);
  };

  const conectarPartido = (idPartido) => {
    const clave = String(idPartido);
    if (!idPartido || socketsPartidos.has(clave) || idsConectando.has(clave) || cerrado) return;

    idsConectando.add(clave);
    const socket = new WebSocket(
      `${URL_BASE}/websocket/partidos/${encodeURIComponent(idPartido)}?token=${encodeURIComponent(token)}`
    );
    socketsPartidos.set(clave, socket);

    socket.onmessage = (event) => {
      try {
        const mensaje = JSON.parse(event.data);
        if (mensaje.tipo === 'ERROR_PARTIDO') {
          callbacks.onError?.(
            mensaje.mensaje || 'El partido ya no está disponible para espectar.',
          );
          callbacks.onPartidoError?.(idPartido);
          eliminarPartido(idPartido);
          return;
        }
        const esPrimerEstadoDelPartido = !estadosInicialesRecibidos.has(clave);
        if (mensaje.tipo === 'PARTIDO_FINALIZADO') {
          const partidoActual = esPrimerEstadoDelPartido
            ? quitarDatosDinamicos(estadosPartidos.get(clave) || {})
            : estadosPartidos.get(clave) || {};
          const partidoFinal = combinarPartido(
            partidoActual,
            { ...mensaje, id_partido: idPartido },
            idPartido,
          );
          estadosInicialesRecibidos.add(clave);
          estadosPartidos.set(clave, partidoFinal);
          callbacks.onPartidoActualizado?.(idPartido, mensaje, partidoFinal);
          eliminarPartido(idPartido);
          return;
        }

        if (TIPOS_ESTADO_PARTIDO.has(mensaje.tipo)) {
          const partidoActual = esPrimerEstadoDelPartido
            ? quitarDatosDinamicos(estadosPartidos.get(clave) || {})
            : estadosPartidos.get(clave) || {};
          const partidoNuevo = combinarPartido(partidoActual, { ...mensaje, id_partido: idPartido }, idPartido);
          estadosInicialesRecibidos.add(clave);
          estadosPartidos.set(clave, partidoNuevo);
          callbacks.onPartidoActualizado?.(
            idPartido,
            mensaje,
            partidoNuevo,
          );
        }
      } catch (error) {
        console.error('No se pudo procesar el mensaje del partido en vivo:', error);
      }
    };

    socket.onclose = (event) => {
      idsConectando.delete(clave);
      if (socketsPartidos.get(clave) === socket) {
        socketsPartidos.delete(clave);
      }
      if (event?.code === 4404) {
        callbacks.onError?.('El partido ya no está disponible para espectar.');
      }
    };

    socket.onerror = () => {
      idsConectando.delete(clave);
      callbacks.onError?.('No se pudo conectar con uno de los partidos en vivo.');
    };
  };

  socketListado = new WebSocket(
    `${URL_BASE}/websocket/partidos-en-vivo?token=${encodeURIComponent(token)}`
  );

  socketListado.onopen = () => callbacks.onConectado?.();
  socketListado.onmessage = (event) => {
    try {
      const mensaje = JSON.parse(event.data);
      if (mensaje.tipo === 'PARTIDOS_EN_VIVO') {
        callbacks.onCargando?.(false);
        (mensaje.partidos || []).forEach((partido) => {
          estadosPartidos.set(
            String(partido.id_partido),
            normalizarOrdenPartido(partido),
          );
        });
        callbacks.onPartidosIniciales?.(
          (mensaje.partidos || []).map(normalizarOrdenPartido),
        );
        (mensaje.partidos || []).forEach((partido) => conectarPartido(partido.id_partido));
      }
      if (mensaje.tipo === 'PARTIDO_DISPONIBLE') {
        conectarPartido(mensaje.id_partido);
      }
      if (mensaje.tipo === 'PARTIDO_NO_DISPONIBLE') {
        eliminarPartido(mensaje.id_partido);
      }
    } catch (error) {
      callbacks.onCargando?.(false);
      callbacks.onError?.('No se pudo procesar la lista de partidos en vivo.');
      console.error('No se pudo procesar el listado de partidos en vivo:', error);
    }
  };

  socketListado.onerror = () => {
    callbacks.onCargando?.(false);
    callbacks.onError?.('No se pudo conectar con el listado de partidos en vivo.');
  };
  socketListado.onclose = () => callbacks.onCargando?.(false);

  return () => {
    cerrado = true;
    socketListado.onclose = null;
    socketListado.close();
    socketsPartidos.forEach((socket) => {
      socket.onclose = null;
      socket.close();
    });
    socketsPartidos.clear();
    estadosPartidos.clear();
    estadosInicialesRecibidos.clear();
    idsConectando.clear();
  };
}
