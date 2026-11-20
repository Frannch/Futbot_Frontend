import { useEffect, useState } from 'react';

// Estado inicial del partido, usado para normalizar los estados recibidos del backend
// representa una foto del partido en un momento dado, con la posición de la pelota, jugadores y marcador
// para representar el estado del partido usamos luego useEstadoVisual en Cancha.jsx, que suaviza la transición entre estados para que la animación sea más fluida
const ESTADO_INICIAL = {
  tick: 0,
  ticks_totales: 600,
  marcador: [0, 0],
  clubes: {
    local: { id: 1, nombre: 'Club Local' },
    visitante: { id: 2, nombre: 'Club Visitante' },
  },
  pelota: { x: 50, y: 30 },
  jugadores: [],
  cancha: { ancho: 100, alto: 60 },
};

const esNumero = (valor) => typeof valor === 'number' && Number.isFinite(valor);

// valida que el mensaje recibido del backend tiene la estructura esperada para un estado de partido
const esEstadoPartido = (mensaje) => (
  mensaje
  && mensaje.tipo === 'ESTADO_PARTIDO'
  && esNumero(mensaje.tick)
  && esNumero(mensaje.ticks_totales)
  && Array.isArray(mensaje.marcador)
  && mensaje.marcador.length >= 2
  && mensaje.clubes?.local?.nombre
  && mensaje.clubes?.visitante?.nombre
  && mensaje.pelota
  && Array.isArray(mensaje.jugadores)
  && mensaje.cancha
);

// normaliza el estado recibido, rellenando valores faltantes con los del estado inicial
const normalizarEstado = (mensaje) => ({
  ...ESTADO_INICIAL,
  ...mensaje,
  marcador: [
    esNumero(mensaje.marcador?.[0]) ? mensaje.marcador[0] : 0,
    esNumero(mensaje.marcador?.[1]) ? mensaje.marcador[1] : 0,
  ],
  pelota: {
    ...ESTADO_INICIAL.pelota,
    ...mensaje.pelota,
  },
  jugadores: mensaje.jugadores.filter((jugador) => (
    jugador && esNumero(jugador.x) && esNumero(jugador.y)
  )),
  cancha: {
    ...ESTADO_INICIAL.cancha,
    ...mensaje.cancha,
  },
});

// construye la URL del websocket para conectarse a un partido, incluyendo los parámetros necesarios
export function construirUrlPartido({
  clubLocalId,
  clubVisitanteId,
  token,
  wsBaseUrl = 'ws://localhost:8000',
  ticks = 600,
  seed = 0,
}) {
  const url = new URL(
    `${wsBaseUrl.replace(/\/$/, '')}/ws/partido/${encodeURIComponent(clubLocalId)}/${encodeURIComponent(clubVisitanteId)}`,
  );
  url.searchParams.set('token',token);
  url.searchParams.set('ticks', String(ticks));
  url.searchParams.set('seed', String(seed));
  return url.toString();
}

// usePartidoWebSocket maneja la conexión a un partido en tiempo real mediante websocket
export function usePartidoWebSocket({ clubLocalId, clubVisitanteId, token, wsBaseUrl, ticks = 600, seed = 0 }) {
  const [estado, setEstado] = useState(null);
  const [estadoConexion, setEstadoConexion] = useState('desconectado');
  const [error, setError] = useState('');
  const [finalizado, setFinalizado] = useState(false);

  // Efecto que se ejecuta al montar el componente o cuando cambian los parámetros de conexión
  // es decir, cuando cambian los IDs de los clubes, el token, la URL base del websocket, los ticks o la semilla
  useEffect(() => {
    if (clubLocalId === undefined || clubLocalId === null
      || clubVisitanteId === undefined || clubVisitanteId === null || !token) {
      setEstadoConexion('error');
      setError('Configura los IDs de ambos clubes y un token para iniciar el partido.');
      return undefined;
    }

    // Desconectamos el socket anterior si existe y crea uno nuevo
    let socket;
    let desmontado = false;
    setEstadoConexion('conectando');
    setError('');
    setFinalizado(false);
    setEstado(null);

    // Abre la conexión al websocket del partido
    try {
      socket = new WebSocket(construirUrlPartido({ clubLocalId, clubVisitanteId, token, wsBaseUrl, ticks, seed }));
      // Actualizo el estado de conexión si el componente no se ha desmontado
      socket.onopen = () => {
        if (!desmontado) setEstadoConexion('conectado');
      };

      // Manejo los tipos de eventos, actualizando el estado del partido, mostrando errores o marcando el partido como finalizado
      socket.onmessage = (event) => {
        if (desmontado) return;
        try {
          const mensaje = JSON.parse(event.data);
          if (esEstadoPartido(mensaje)) {
            setEstado(normalizarEstado(mensaje));
          } else if (mensaje?.tipo === 'ERROR_PARTIDO') {
            setError(mensaje.mensaje || 'El backend rechazó el partido.');
            setEstadoConexion('error');
          } else if (mensaje?.tipo === 'PARTIDO_FINALIZADO') {
            setFinalizado(true);
          }
        } catch {
          setError('Se recibió un mensaje inválido del partido.');
          setEstadoConexion('error');
        }
      };

      // Si ocurre un error en la conexión, actualizo el estado de conexión y muestro un mensaje de error
      socket.onerror = () => {
        if (!desmontado) {
          setError('No se pudo mantener la conexión con el partido.');
          setEstadoConexion('error');
        }
      };

      // Si el socket se cierra, actualizo el estado de conexión a desconectado si el componente no se ha desmontado
      socket.onclose = () => {
        if (!desmontado) setEstadoConexion('desconectado');
      };
    } catch {
      setError('No se pudo abrir la conexión con el partido.');
      setEstadoConexion('error');
    }

    // Cleanup function que se ejecuta al desmontar el componente o cuando cambian los parámetros de conexión
    return () => {
      desmontado = true;
      socket?.close();
    };
  }, [clubLocalId, clubVisitanteId, token, wsBaseUrl, ticks, seed]);

  return { estado, estadoConexion, error, finalizado };
}
