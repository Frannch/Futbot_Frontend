import { createContext, useContext, useEffect, useState, useRef } from 'react';
import SelectorConvocatoria from '../components/layout/SelectorAmistoso.jsx';
import Temporizador from '../components/layout/Timer.jsx';
import {
  aceptarAmistoso,
  obtenerComportamientos,
  obtenerClubPorId,
  obtenerInvitacionesPendientes,
  obtenerJugadores,
  rechazarAmistoso
} from './clubes.js';
import {
  cambiarComportamientoJugador,
  solicitarCambioPartido as enviarCambioPartido,
} from './partidos.js';
import { combinarPelota } from './partidosEnVivo.js';

// Crear el contexto y el hook personalizado
const WebSocketContext = createContext(null);
export const useWebSocket = () => useContext(WebSocketContext);

// cuanto esperamos antes de reintentar si se cae la conexion
const DEMORA_RECONEXION = 3000;

export const WebSocketProvider = ({ children, pantallaActual }) => {
  const [ws, setWs] = useState(null);
  const [invitacion, setInvitacion] = useState(null);
  const [notificacionDescartada, setNotificacionDescartada] = useState(false);
  const [resultadoSolicitud, setResultadoSolicitud] = useState(null);
  const wsRef = useRef(null);

  // selector de convocatoria para responder el desafio
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [jugadores, setJugadores] = useState([]);
  const [comportamientos, setComportamientos] = useState([]);
  const [cargandoPlantel, setCargandoPlantel] = useState(false);
  const [respondiendo, setRespondiendo] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  // Estado del partido
  const [estadoPartido, setEstadoPartido] = useState(null);
  const [partidoVisible, setPartidoVisible] = useState(false);
  const [partidoFinalizado, setPartidoFinalizado] = useState(false);
  const [partidoPausado, setPartidoPausado] = useState(false);
  const [datosPartido, setDatosPartido] = useState({
    idPartido: null,
    convocatoria: [],
    jugadores: [],
    comportamientos: [],
    clubes: [],
  });

  // guardamos las credenciales para poder reconectar sin pedirlas de nuevo
  const credencialesRef = useRef(null);
  const invitacionRef = useRef(null);
  const reintentoRef = useRef(null);
  const cargandoComportamientosPartidoRef = useRef(false);
  const clubesPartidoRef = useRef([]);
  const partidoOcultoRef = useRef(false);
  const partidoActivoRef = useRef(null);
  const partidoAmistosoRef = useRef(false);
  const estadoPartidoRef = useRef(null);

  const limpiezaPendienteRef = useRef(null);

  const establecerInvitacion = (actualizar) => {
    const siguiente = typeof actualizar === 'function'
      ? actualizar(invitacionRef.current)
      : actualizar;
    invitacionRef.current = siguiente;
    setInvitacion(siguiente);
    return siguiente;
  };

  const sincronizarInvitacionesPendientes = async () => {
    try {
      const pendientes = await obtenerInvitacionesPendientes();
      if (
        !credencialesRef.current
        || !Array.isArray(pendientes)
        || pendientes.length === 0
        || invitacionRef.current
      ) return;

      const invitacionRecibida = [...pendientes].sort(
        (a, b) => Number(b.id_solicitud) - Number(a.id_solicitud),
      )[0];
      const invitacionPendiente = {
        ...invitacionRecibida,
        expira_en_segundos: invitacionRecibida.expira_en_segundos
          ?? invitacionRecibida.tiempo_restante
          ?? 300,
      };
      establecerInvitacion(invitacionPendiente);
      setNotificacionDescartada(false);
      void cargarNombreInvitacion(invitacionPendiente);
    } catch (error) {
      console.error('No se pudieron recuperar los desafíos pendientes:', error);
    }
  };

  const cargarComportamientosPartido = async () => {
    if (cargandoComportamientosPartidoRef.current) return;

    cargandoComportamientosPartidoRef.current = true;
    try {
      const listaComportamientos = await obtenerComportamientos();
      setComportamientos(listaComportamientos);
      setDatosPartido((actuales) => ({
        ...actuales,
        comportamientos: listaComportamientos,
      }));
    } catch (error) {
      console.error('No se pudieron cargar los comportamientos del partido:', error);
    } finally {
      cargandoComportamientosPartidoRef.current = false;
    }
  };

  const cargarNombreInvitacion = async (invitacionRecibida) => {
    if (!invitacionRecibida?.id_club_retador) return;

    try {
      const club = await obtenerClubPorId(invitacionRecibida.id_club_retador);
      establecerInvitacion((actual) => actual?.id_solicitud === invitacionRecibida.id_solicitud
        ? { ...actual, nombre_club_retador: club.nombre }
        : actual);
    } catch (error) {
      console.error('No se pudo cargar el nombre del club retador:', error);
    }
  };

  const aplicarNombresClubes = (estado) => {
    if (!estado?.clubes || clubesPartidoRef.current.length === 0) return estado;

    const nombresPorId = new Map(
      clubesPartidoRef.current.map((club) => [String(club.id_club), club])
    );
    const completarClub = (club) => {
      if (!club) return club;
      const idClub = club.id_club ?? club.id;
      const clubRegistrado = nombresPorId.get(String(idClub));
      const clubPorNombre = clubesPartidoRef.current.find(
        (clubDisponible) => clubDisponible.nombre === (club.nombre ?? club.name),
      );
      return {
        ...(clubRegistrado || clubPorNombre || {}),
        ...club,
        id_club: idClub ?? clubRegistrado?.id_club ?? clubPorNombre?.id_club,
        nombre: clubRegistrado?.nombre || clubPorNombre?.nombre || club.nombre,
      };
    };

    return {
      ...estado,
      clubes: {
        ...estado.clubes,
        local: completarClub(estado.clubes.local),
        visitante: completarClub(estado.clubes.visitante),
      },
    };
  };

  const normalizarOrdenClubes = (estado) => {
    const local = estado?.clubes?.local;
    const visitante = estado?.clubes?.visitante;
    const idLocal = Number(local?.id_club ?? local?.id);
    const idVisitante = Number(visitante?.id_club ?? visitante?.id);

    if (
      !Number.isFinite(idLocal)
      || !Number.isFinite(idVisitante)
      || idLocal <= idVisitante
    ) {
      return estado;
    }

    const intercambiarEquipos = (valores) => (
      Array.isArray(valores) && valores.length >= 2
        ? [valores[1], valores[0], ...valores.slice(2)]
        : valores
    );

    return {
      ...estado,
      clubes: { local: visitante, visitante: local },
      marcador: intercambiarEquipos(estado.marcador),
      marcador_regular: intercambiarEquipos(estado.marcador_regular),
      marcador_reglamentario: intercambiarEquipos(estado.marcador_reglamentario),
      resultado_penales: intercambiarEquipos(estado.resultado_penales),
      ganador_definicion: estado.ganador_definicion == null
        ? estado.ganador_definicion
        : 1 - estado.ganador_definicion,
      jugadores: Array.isArray(estado.jugadores)
        ? estado.jugadores.map((jugador) => ({
          ...jugador,
          equipo: jugador.equipo == null ? jugador.equipo : 1 - jugador.equipo,
        }))
        : estado.jugadores,
      historial_penales: Array.isArray(estado.historial_penales)
        ? estado.historial_penales.map((ronda) => ({
          ...ronda,
          ganador_ronda: ronda.ganador_ronda == null
            ? ronda.ganador_ronda
            : 1 - ronda.ganador_ronda,
          resultado_penales: intercambiarEquipos(ronda.resultado_penales),
          marcador: intercambiarEquipos(ronda.marcador),
        }))
        : estado.historial_penales,
    };
  };

  const combinarEstadoPartido = (data, estadoPrevio) => {
    // Si arranca un partido nuevo desde cero, reiniciamos el estado de penales y marcadores previos
    if (data.tipo === 'PARTIDO_INICIADO') {
      const nuevoEstado = {
        ...data,
        clubes: data.clubes || estadoPrevio?.clubes,
        cancha: data.cancha || estadoPrevio?.cancha || { ancho: 100, alto: 60 },
        marcador_reglamentario: null,
        resultado_penales: null,
        historial_penales: [],
        ganador_definicion: null,
        ronda_penal: null,
      };
      return normalizarOrdenClubes(aplicarNombresClubes(nuevoEstado));
    }

    // Preservar clubes si no vienen en la carga
    let clubes = data.clubes || estadoPrevio?.clubes;
    if (!clubes && clubesPartidoRef.current.length >= 2) {
      clubes = {
        local: {
          id_club: clubesPartidoRef.current[0].id_club,
          nombre: clubesPartidoRef.current[0].nombre,
        },
        visitante: {
          id_club: clubesPartidoRef.current[1].id_club,
          nombre: clubesPartidoRef.current[1].nombre,
        },
      };
    }
    const cancha = data.cancha || estadoPrevio?.cancha || { ancho: 100, alto: 60 };

    const esMensajePenal = [
      'PENALES_INICIADOS',
      'PENAL_RONDA_INICIADA',
      'PENAL_TICK',
      'PENAL_RONDA_FINALIZADA',
    ].includes(data.tipo) || data.fase === 'definicion';

    // Marcador reglamentario: se conserva el del tiempo regular cuando entramos en penales
    let marcadorReglamentario = estadoPrevio?.marcador_reglamentario ?? null;
    if (esMensajePenal && !marcadorReglamentario) {
      marcadorReglamentario = estadoPrevio?.marcador || [0, 0];
    } else if (
      data.tipo === 'PARTIDO_FINALIZADO' &&
      data.ganador_definicion !== null &&
      data.ganador_definicion !== undefined
    ) {
      marcadorReglamentario = data.marcador || estadoPrevio?.marcador_reglamentario || estadoPrevio?.marcador;
    }

    // Historial de penales (duelos 1v1 disputados)
    let historialPenales = estadoPrevio?.historial_penales ? [...estadoPrevio.historial_penales] : [];
    if (data.tipo === 'PENALES_INICIADOS') {
      historialPenales = [];
    } else if (data.tipo === 'PENAL_RONDA_FINALIZADA' && data.ganador_ronda !== undefined) {
      const entradaRonda = {
        ronda: data.ronda_penal,
        ganador_ronda: data.ganador_ronda,
        resultado_penales: data.resultado_penales,
        marcador: data.marcador,
      };
      const idx = historialPenales.findIndex((r) => r.ronda === data.ronda_penal);
      if (idx >= 0) {
        historialPenales[idx] = entradaRonda;
      } else {
        historialPenales.push(entradaRonda);
      }
    }

    const resultadoPenales = data.resultado_penales ?? estadoPrevio?.resultado_penales ?? null;
    const ganadorDefinicion = data.ganador_definicion !== undefined
      ? data.ganador_definicion
      : (estadoPrevio?.ganador_definicion ?? null);

    const estadoCombinado = {
      ...estadoPrevio,
      ...data,
      clubes,
      cancha,
      marcador_reglamentario: marcadorReglamentario,
      resultado_penales: resultadoPenales,
      historial_penales: historialPenales,
      ganador_definicion: ganadorDefinicion,
      pelota: combinarPelota(data.pelota, estadoPrevio?.pelota),
    };

    return normalizarOrdenClubes(aplicarNombresClubes(estadoCombinado));
  };

  const obtenerIdPartido = (data) => (
    data?.id_partido ?? data?.partido_id ?? data?.estado?.id_partido ?? null
  );

  const obtenerPayload = (data) => (
    data?.data && typeof data.data === 'object'
      ? { ...data, ...data.data }
      : data
  );

  const perteneceAlPartidoActivo = (data) => {
    const idRecibido = obtenerIdPartido(data);
    const idActivo = partidoActivoRef.current;

    if (idActivo == null && idRecibido != null) {
      partidoActivoRef.current = idRecibido;
      return true;
    }

    return idRecibido == null || idActivo == null
      || String(idRecibido) === String(idActivo);
  };
  // Referencia para leer la pantalla actual sin reiniciar el socket
  const pantallaRef = useRef(pantallaActual);
  useEffect(() => {
    pantallaRef.current = pantallaActual;
  }, [pantallaActual]);

  // Función principal de conexión (Llamada desde Login o al recargar)
  const conectarWebSocket = (userId, token) => {
    // Si ya hay un socket abierto y sano, evitamos duplicados
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) return;

    credencialesRef.current = { userId, token };

    const socket = new WebSocket(
      `ws://localhost:8000/ws/${userId}?token=${encodeURIComponent(token)}`
    );

    socket.onopen = () => {
      console.log("WebSocket conectado y esperando eventos");
      void sincronizarInvitacionesPendientes();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const payload = obtenerPayload(data);
        if (payload.tipo === "NUEVA_SOLICITUD_AMISTOSO") {
          setMensajeError('');
          establecerInvitacion(payload);
          setNotificacionDescartada(false);
          void cargarNombreInvitacion(payload);
        }
        const TIPOS_PARTIDO_EN_JUEGO = [
          "PARTIDO_INICIADO",
          "PARTIDO_TICK",
          "PARTIDO_PAUSADO",
          "PARTIDO_REANUDADO",
          "PENALES_INICIADOS",
          "PENAL_RONDA_INICIADA",
          "PENAL_TICK",
          "PENAL_RONDA_FINALIZADA",
        ];

        if (payload.evento === "desafio_aceptado" || payload.evento === "desafio_rechazado") {
          setResultadoSolicitud(payload);
          if (payload.evento === "desafio_aceptado" && payload.id_partido != null) {
            partidoActivoRef.current = payload.id_partido;
            setDatosPartido((actuales) => ({ ...actuales, idPartido: payload.id_partido }));
            void cargarComportamientosPartido();
          }
          cerrarInvitacion();
          return;
        }

        if (!perteneceAlPartidoActivo(payload)) {
          return;
        }
        if (payload.tipo === 'PARTIDO_INICIADO') {
          partidoOcultoRef.current = !partidoAmistosoRef.current;
          setPartidoVisible(partidoAmistosoRef.current);
        }

        if (TIPOS_PARTIDO_EN_JUEGO.includes(payload.tipo)) {
          setPartidoFinalizado(false);
          const estadoNuevo = combinarEstadoPartido(payload, estadoPartidoRef.current);
          estadoPartidoRef.current = estadoNuevo;
          setEstadoPartido(estadoNuevo);
          setPartidoPausado(payload.tipo === "PARTIDO_PAUSADO");
        }
        if (payload.tipo === "PARTIDO_FINALIZADO") {
          const estadoNuevo = combinarEstadoPartido(payload, estadoPartidoRef.current);
          estadoPartidoRef.current = estadoNuevo;
          setEstadoPartido(estadoNuevo);
          setPartidoFinalizado(true);
          setPartidoPausado(false);
        }
      } catch (error) {
        console.error("Error parseando JSON del servidor:", error);
      }
    };

    /*
    si la conexion se cae reintentamos sola. sin esto el usuario deja de
    recibir invitaciones hasta que recargue la pagina y no se entera
    */
    socket.onclose = () => {
      if (wsRef.current === socket) {
        wsRef.current = null;
      }
      setWs(null);

      if (credencialesRef.current) {
        reintentoRef.current = setTimeout(() => {
          const { userId: id, token: tk } = credencialesRef.current;
          conectarWebSocket(id, tk);
        }, DEMORA_RECONEXION);
      }
    };

    socket.onerror = (error) => {
      console.error("Error en WebSocket:", error);
    };

    wsRef.current = socket;
    setWs(socket);
  };

  const desconectarWebSocket = () => {
    // limpiamos las credenciales primero para que onclose no reintente
    credencialesRef.current = null;
    clearTimeout(reintentoRef.current);

    wsRef.current?.close();
    wsRef.current = null;
    setWs(null);
    cerrarInvitacion();

    //limpiamos el partido al cerrar sesion
    setEstadoPartido(null);
    estadoPartidoRef.current = null;
    partidoActivoRef.current = null;
    partidoAmistosoRef.current = false;
    partidoOcultoRef.current = false;
    setPartidoVisible(false);
    setPartidoFinalizado(false);
    setPartidoPausado(false);
    setDatosPartido({ idPartido: null, convocatoria: [], jugadores: [], comportamientos: [], clubes: [] });
    clubesPartidoRef.current = [];
    cargandoComportamientosPartidoRef.current = false;
  };

  // Oculta la cancha sin descartar los datos del partido activo.
  const finalizarPartido = () => {
    partidoOcultoRef.current = true;
    setPartidoVisible(false);
    setPartidoFinalizado(false);
    setPartidoPausado(false);

    if (partidoFinalizado) {
      estadoPartidoRef.current = null;
      partidoActivoRef.current = null;
      setDatosPartido({
        idPartido: null,
        convocatoria: [],
        jugadores: [],
        comportamientos: [],
        clubes: [],
      });
      clubesPartidoRef.current = [];
      cargandoComportamientosPartidoRef.current = false;
    }
  };

  const abrirPartidoAmistoso = () => {
    if (!estadoPartidoRef.current || datosPartido.idPartido == null) return false;

    partidoOcultoRef.current = false;
    setPartidoVisible(true);
    setEstadoPartido(estadoPartidoRef.current);
    setPartidoFinalizado(false);
    return true;
  };

  const guardarConvocatoriaPartido = (convocatoria, listaJugadores = [], clubes = []) => {
    partidoAmistosoRef.current = true;
    clubesPartidoRef.current = clubes;
    void cargarComportamientosPartido();
    estadoPartidoRef.current = aplicarNombresClubes(estadoPartidoRef.current);
    if (!partidoOcultoRef.current) {
      setEstadoPartido(estadoPartidoRef.current);
    }
    setDatosPartido((actuales) => ({
      ...actuales,
      convocatoria: convocatoria?.jugadores_convocados ?? convocatoria ?? [],
      jugadores: listaJugadores,
      clubes,
    }));

    const idsClubes = [
      ...clubes.map((club) => club.id_club),
      localStorage.getItem('clubId'),
    ].filter(Boolean);
    void Promise.all(idsClubes.map((idClub) => obtenerClubPorId(idClub)))
      .then((clubesCompletos) => {
        clubesPartidoRef.current = clubesCompletos;
        estadoPartidoRef.current = aplicarNombresClubes(estadoPartidoRef.current);
        if (!partidoOcultoRef.current) {
          setEstadoPartido(estadoPartidoRef.current);
        }
        setDatosPartido((actuales) => ({ ...actuales, clubes: clubesCompletos }));
      })
      .catch((error) => {
        console.error('No se pudieron cargar los nombres de los clubes:', error);
      });
  };

  const solicitarCambioPartido = (cambio) => (
    enviarCambioPartido(datosPartido.idPartido, cambio)
  );

  const cambiarComportamientoPartido = ({ id_jugador, id_comportamiento }) => (
    cambiarComportamientoJugador(
      datosPartido.idPartido,
      id_jugador,
      id_comportamiento,
    )
  );
  

  // Reconecta al recargar si todavía existe una sesión válida.
  useEffect(() => {
    if (limpiezaPendienteRef.current) {
      clearTimeout(limpiezaPendienteRef.current);
      limpiezaPendienteRef.current = null;
    }

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (token && userId) {
      conectarWebSocket(userId, token);
    }

    return () => {
      limpiezaPendienteRef.current = setTimeout(() => {
        desconectarWebSocket();
        limpiezaPendienteRef.current = null;
      }, 0);
    };
  }, []);

  const cerrarInvitacion = () => {
    establecerInvitacion(null);
    setNotificacionDescartada(false);
    setSelectorAbierto(false);
    setMensajeError('');
  };

  /*
  la invitacion puede llegar en cualquier pantalla, asi que el plantel no
  esta cargado. lo pedimos recien cuando el usuario decide aceptar
  */
  const abrirSelector = async (invitacionSeleccionada = invitacion) => {
    if (!invitacionSeleccionada) return;
    establecerInvitacion(invitacionSeleccionada);
    setNotificacionDescartada(true);
    setMensajeError('');
    setCargandoPlantel(true);

    try {
      const [listaJugadores, listaComportamientos] = await Promise.all([
        obtenerJugadores(),
        obtenerComportamientos()
      ]);

      setJugadores(listaJugadores);
      setComportamientos(listaComportamientos);
      setSelectorAbierto(true);
    } catch (error) {
      setMensajeError(error.message);
    } finally {
      setCargandoPlantel(false);
    }
  };

  const confirmarAceptacion = async (convocatoria) => {
    setMensajeError('');
    setRespondiendo(true);
  
    try {
      const data = await aceptarAmistoso(invitacion.id_solicitud, convocatoria);
      const partidoCreado = obtenerPayload(data);
      const idPartido = partidoCreado.id_partido ?? partidoCreado.partido_id;
      partidoAmistosoRef.current = true;
      console.log('Partido creado:', idPartido);
      const idsClubes = [
        invitacion.id_club_retador,
        localStorage.getItem('clubId'),
      ].filter(Boolean);
      let clubesDelPartido = [];
      try {
        clubesDelPartido = await Promise.all(idsClubes.map((idClub) => obtenerClubPorId(idClub)));
      } catch (error) {
        console.error('No se pudieron cargar los nombres de los clubes del partido:', error);
      }
      clubesPartidoRef.current = clubesDelPartido;
      setEstadoPartido((actual) => aplicarNombresClubes(actual));
      setDatosPartido({
        idPartido,
        convocatoria: convocatoria?.jugadores_convocados ?? [],
        jugadores,
        comportamientos,
        clubes: clubesDelPartido,
      });
      partidoActivoRef.current = idPartido;
      partidoOcultoRef.current = false;
      const estadoInicial = partidoCreado.estado ?? partidoCreado.partido;
      if (estadoInicial && typeof estadoInicial === 'object') {
        const estadoNuevo = combinarEstadoPartido(
          { ...estadoInicial, id_partido: idPartido },
          estadoPartidoRef.current,
        );
        estadoPartidoRef.current = estadoNuevo;
        setEstadoPartido(estadoNuevo);
      }
      cerrarInvitacion();
      //redirige a la pantalla del partido cuando exista
    } catch (error) {
      setMensajeError(error.message);
    } finally {
      setRespondiendo(false);
    }
  };

  const rechazar = async (invitacionSeleccionada = invitacion) => {
    if (!invitacionSeleccionada?.id_solicitud) return false;

    setMensajeError('');
    setRespondiendo(true);

    try {
      await rechazarAmistoso(invitacionSeleccionada.id_solicitud);
      if (
        invitacion?.id_solicitud != null &&
        String(invitacion.id_solicitud) === String(invitacionSeleccionada.id_solicitud)
      ) {
        cerrarInvitacion();
      }
      return true;
    } catch (error) {
      setMensajeError(error.message);
      return false;
    } finally {
      setRespondiendo(false);
    }
  };
//TODO revisar la impresión de nombre de club retador y club retado
  const nombreRetador = invitacion?.nombre_club_retador
    ?? `Club ${invitacion?.id_club_retador ?? ''}`;
  const mensajeInvitacion = invitacion?.nombre_club_retador
    ? `El club ${nombreRetador} te ha retado.`
    : invitacion?.mensaje || '';

  return (
    <WebSocketContext.Provider
      value={{
        ws,
        conectarWebSocket,
        desconectarWebSocket,
        estadoPartido,
        partidoVisible,
        partidoFinalizado,
        finalizarPartido,
        abrirPartidoAmistoso,
        partidoAmistosoId: datosPartido.idPartido,
        partidoPausado,
        modoPenales: estadoPartido?.fase === 'definicion' || Boolean(estadoPartido?.ronda_penal && !partidoFinalizado),
        resultadoPenales: estadoPartido?.resultado_penales ?? null,
        rondaActualPenales: estadoPartido?.ronda_penal ?? null,
        historialPenales: estadoPartido?.historial_penales ?? [],
        ganadorDefinicion: estadoPartido?.ganador_definicion ?? null,
        convocatoriaPartido: datosPartido.convocatoria,
        jugadoresPartido: datosPartido.jugadores,
        comportamientosPartido: datosPartido.comportamientos,
        guardarConvocatoriaPartido,
        solicitarCambioPartido,
        cambiarComportamientoPartido,
        invitacionActual: invitacion,
        resultadoSolicitud,
        aceptarInvitacionDesdeLista: abrirSelector,
        rechazarInvitacion: rechazar,
        cerrarInvitacion,
      }}
    >
      {children}

      {/* AVISO DE INVITACION CON EL TIEMPO QUE QUEDA */}
      {invitacion && (
        <Temporizador
          titulo="¡NUEVO DESAFÍO!"
          mensaje={mensajeError || mensajeInvitacion}
          clubLocal={{ nombre: 'Tu club' }}
          clubRival={{ nombre: nombreRetador }}
          segundosIniciales={invitacion.expira_en_segundos ?? 300}
          oculto={notificacionDescartada}
          onDescartar={() => setNotificacionDescartada(true)}
          onTiempoExpirado={cerrarInvitacion}
        >
          <div className="flex gap-4 justify-center mt-6">
            <button
              type="button"
              onClick={() => abrirSelector()}
              disabled={cargandoPlantel || respondiendo}
              className="bg-[#00e676] hover:bg-[#00c853] disabled:opacity-40 px-6 py-2 rounded text-[#06120b] font-bold transition-colors"
            >
              {cargandoPlantel ? 'Cargando plantel...' : 'Aceptar'}
            </button>
            <button
              type="button"
              onClick={() => rechazar()}
              disabled={cargandoPlantel || respondiendo}
              className="border border-[#F97316] text-[#F97316] hover:bg-[#F97316] hover:text-white disabled:opacity-40 px-6 py-2 rounded font-bold transition-colors"
            >
              {respondiendo ? 'Enviando...' : 'Rechazar'}
            </button>
          </div>
        </Temporizador>
      )}

      {/* CONVOCATORIA PARA ACEPTAR EL DESAFIO */}
      <SelectorConvocatoria
        abierto={selectorAbierto}
        alCerrar={() => setSelectorAbierto(false)}
        enviando={respondiendo}
        esAceptacion
        mensajeError={mensajeError}
        jugadores={jugadores}
        comportamientos={comportamientos}
        nombreClubDesafiado={nombreRetador}
        alEnviar={confirmarAceptacion}
      />
    </WebSocketContext.Provider>
  );
};