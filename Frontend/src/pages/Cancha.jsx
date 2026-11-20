import { useEffect, useRef, useState } from 'react';
import BotonPrimario from '../components/ui/Button.jsx';
import CambioEnCancha from '../components/layout/CambioEnCancha.jsx';
import ComportamientosEnCancha from '../components/layout/ComportamientosEnCancha.jsx';

// Limitar un valor entre un mínimo y un máximo
// se usa para limitar la posición de los jugadores y la pelota dentro de la cancha, y para limitar el factor de interpolación entre 0 y 1
const limitar = (valor, minimo, maximo) => Math.min(Math.max(valor, minimo), maximo);

// Interpolar un número entre dos valores según un factor (0 a 1)
// esto permite suavizar la transición entre estados del partido, por ejemplo, la posición de la pelota o de los jugadores
const interpolarNumero = (inicio, fin, factor) => inicio + ((fin - inicio) * factor);

const obtenerEtiquetaJugador = (nombre, id) => {
  const palabras = nombre?.trim().split(/\s+/).filter(Boolean) || [];
  if (palabras.length === 0) return String(id);
  if (palabras.length === 1) return palabras[0].slice(0, 3).toUpperCase();
  if (palabras.length === 2) {
    return palabras.map((palabra) => palabra[0]).join('').toUpperCase();
  }
  return palabras.slice(0, 3).map((palabra) => palabra[0]).join('').toUpperCase();
};

function normalizarConvocatoria(convocatoria) {
  if (Array.isArray(convocatoria)) return convocatoria;
  if (!convocatoria || typeof convocatoria !== 'object') return [];

  return Object.values(convocatoria).flatMap((grupo) => {
    if (Array.isArray(grupo)) return grupo;
    if (!grupo || typeof grupo !== 'object') return [];
    return Object.values(grupo).flatMap((jugadores) => (
      Array.isArray(jugadores) ? jugadores : []
    ));
  });
}

function normalizarJugador(jugador) {
  if (!jugador || typeof jugador !== 'object') return jugador;
  return {
    ...jugador,
    id_jugador: jugador.id_jugador ?? jugador.id,
    nombre: jugador.nombre ?? jugador.name,
  };
}

function normalizarComportamiento(comportamiento) {
  if (!comportamiento || typeof comportamiento !== 'object') return comportamiento;
  return {
    ...comportamiento,
    id_comportamiento: comportamiento.id_comportamiento ?? comportamiento.id,
    nombre: comportamiento.nombre ?? comportamiento.name,
  };
}

// Interpolar el estado del partido entre dos ticks para suavizar la animación
// esto permite que la pelota y los jugadores se muevan suavemente entre posiciones en lugar de saltar de un estado a otro
const interpolarEstado = (inicio, fin, factor) => {
  if (!inicio) return fin;

  // Si cambia de fase o de ronda de penales, no interpolar las posiciones para evitar que los jugadores
  // se deslicen de golpe o lentamente desde sus posiciones anteriores
  if (inicio.fase !== fin.fase || inicio.ronda_penal !== fin.ronda_penal) {
    return fin;
  }

  if (!Array.isArray(inicio.jugadores) || !Array.isArray(fin.jugadores) || !inicio.pelota || !fin.pelota) {
    return fin;
  }
  
  //busca los jugadores anteriores porque el jugador puede aparecer en posiciones diferentes entre dos estados
  const jugadoresInicio = new Map(
    inicio.jugadores.map((jugador) => [jugador.id, jugador]),
  );

  return {
    ...fin,
    pelota: {
      ...fin.pelota,
      x: interpolarNumero(inicio.pelota.x, fin.pelota.x, factor),
      y: interpolarNumero(inicio.pelota.y, fin.pelota.y, factor),
    },
    jugadores: fin.jugadores.map((jugador) => {
      //entonces busca el jugador anterior para interpolar su posición, si no existe, devuelve el jugador actual
      const jugadorAnterior = jugadoresInicio.get(jugador.id);
      if (!jugadorAnterior) return jugador;

      return {
        ...jugador,
        nombre: jugador.nombre || jugadorAnterior.nombre,
        id_comportamiento: jugador.id_comportamiento
          ?? jugadorAnterior.id_comportamiento,
        x: interpolarNumero(jugadorAnterior.x, jugador.x, factor),
        y: interpolarNumero(jugadorAnterior.y, jugador.y, factor),
      };
    }),
  };
};

// Esta viene de ESTADOINICIAL de partidoWebSocket.js, pero la duplico aquí para no tener que importar todo el archivo
// Hook para suavizar la transición entre estados del partido, es decir, 20 -> 21 -> 22 ->... -> 25 
function useEstadoVisual(estado) {
  const estadoAnteriorRef = useRef(null);
  const objetivoRef = useRef(null);
  const inicioAnimacionRef = useRef(0);
  const duracionRef = useRef(100);
  const frameRef = useRef(null);
  const [estadoVisual, setEstadoVisual] = useState(null);

  // Cuando el estado cambia, actualizamos el objetivo y calculamos la duración de la animación según los ticks saltados
  useEffect(() => {
    if (!estado) return undefined;

    // Si el estado anterior es nulo, significa que es la primera vez que recibimos un estado, por lo que no necesitamos interpolar.
    const estadoAnterior = objetivoRef.current;
    objetivoRef.current = estado;
    if (!estadoAnterior) {
      estadoAnteriorRef.current = estado;
      setEstadoVisual(estado);
      return undefined;
    }

    // Calcular la duracion de la animación según los ticks saltados, para que la animación sea más rápida si se han saltado muchos ticks.
    const ticksSaltados = Math.max(1, estado.tick - estadoAnterior.tick);
    const duracionEstimada = 100 / ticksSaltados;
    duracionRef.current = limitar(duracionEstimada, 60, 250); //limitar la duración entre 60 y 250 ms para que la animación no sea demasiado rápida ni demasiado lenta
    inicioAnimacionRef.current = performance.now();
    estadoAnteriorRef.current = estadoAnterior;

    return undefined;
  }, [estado]);

  // Animamos la transición entre el estado anterior y el objetivo usando requestAnimationFrame
  useEffect(() => {
    const animar = (ahora) => {
      const objetivo = objetivoRef.current;
      const anterior = estadoAnteriorRef.current;
      if (!objetivo || !anterior) return;

      // calculamos el factor de interpolación entre 0 y 1 según el tiempo transcurrido desde el inicio de la animación y la duración estimada
      const factor = limitar(
        (ahora - inicioAnimacionRef.current) / duracionRef.current,
        0,
        1,
      );
      setEstadoVisual(interpolarEstado(anterior, objetivo, factor));

      // requestAnimationFrame anima hasta que el factor llegue a 1, es decir, ejecuta animar en el proximo frame de renderizado
      if (factor < 1) {
        frameRef.current = requestAnimationFrame(animar);
      }
    };

    frameRef.current = requestAnimationFrame(animar);
    return () => cancelAnimationFrame(frameRef.current);
  }, [estado]);

  return estadoVisual || estado;
}

// Muestra el estado de la conexión al websocket
function EstadoConexion({ estado }) {
  const etiquetas = {
    conectando: 'Conectando',
    conectado: 'Conectado',
    desconectado: 'Desconectado',
    error: 'Error',
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
      estado === 'conectado'
        ? 'bg-emerald-400/20 text-emerald-300'
        : estado === 'error'
          ? 'bg-red-400/20 text-red-300'
          : 'bg-amber-400/20 text-amber-300'
    }`}
    >
      {etiquetas[estado] || 'Desconectado'}
    </span>
  );
}

// Componente principal que representa la cancha y el estado del partido en vivo
function Cancha({
  estado,
  finalizado = false,
  pausado = false,
  estadoConexion = 'conectado',
  error = '',
  cambiarPantalla,
  onFinalizar,
  convocatoria = [],
  jugadores = [],
  jugadoresControlables,
  jugadoresDatosControlables,
  filtrarPorConvocatoria = true,
  comportamientos = [],
  onSolicitarCambio,
  onCambiarComportamiento,
  puedeControlar = true,
  onCerrar,
  soloTitulares = false,
}) {
  const [cuentaPausa, setCuentaPausa] = useState(10);
    const estadoVisual = useEstadoVisual(estado);
    const convocatoriaSegura = normalizarConvocatoria(convocatoria)
      .map(normalizarJugador);
    const jugadoresSeguros = jugadores.map(normalizarJugador);
    const jugadoresControles = (jugadoresDatosControlables ?? jugadoresSeguros)
      .map(normalizarJugador);
    const comportamientosSeguros = comportamientos.map(normalizarComportamiento);
    const idsConvocados = new Set(
      convocatoriaSegura.map((jugador) => String(jugador.id_jugador ?? jugador.id))
    );
    const idsTitulares = new Set(
      convocatoriaSegura
        .filter((jugador) => jugador.rol === 'titular')
        .map((jugador) => String(jugador.id_jugador ?? jugador.id))
    );
    const jugadoresPropios = puedeControlar
      ? (jugadoresControlables ?? convocatoriaSegura)
      : [];
    const jugadoresPorId = new Map();
    const idsJugadoresPropios = new Set(
      jugadoresPropios.map((jugador) => String(jugador.id_jugador ?? jugador.id)),
    );
    jugadoresSeguros
      .filter((jugador) => idsJugadoresPropios.has(
        String(jugador.id_jugador ?? jugador.id),
      ))
      .forEach((jugador) => {
        jugadoresPorId.set(String(jugador.id_jugador ?? jugador.id), jugador);
      });
    jugadoresPropios.forEach((jugador) => {
      const id = String(jugador.id_jugador ?? jugador.id);
      if (jugador.nombre) {
        jugadoresPorId.set(id, jugador);
      }
    });
    const comportamientoPorJugador = new Map(
      convocatoriaSegura.map((jugador) => [
        String(jugador.id_jugador ?? jugador.id),
        jugador.comportamiento,
      ])
    );
    const jugadoresActivos = estado
      ? (estado.jugadores || [])
        .filter((jugador) => (
          (!filtrarPorConvocatoria
            || idsConvocados.size === 0
            || idsConvocados.has(String(jugador.id)))
          && (!soloTitulares || idsTitulares.has(String(jugador.id)))
        ))
        .map((jugador) => {
          const jugadorPlantel = jugadoresPorId.get(String(jugador.id));
          const nombreComportamiento = comportamientoPorJugador.get(String(jugador.id));
          const comportamiento = comportamientosSeguros.find(
            (opcion) => opcion.nombre === nombreComportamiento
              || String(opcion.id_comportamiento) === String(nombreComportamiento)
          );

          return {
            ...jugador,
            nombre: jugadorPlantel?.nombre || (puedeControlar && !jugadoresControlables
              ? jugador.nombre
              : undefined),
            id_comportamiento: jugador.id_comportamiento
              ?? comportamiento?.id_comportamiento,
          };
        })
      : [];
    const idsControlables = jugadoresControlables
      ? new Set(jugadoresControlables.map(
        (jugador) => String(jugador.id_jugador ?? jugador.id),
      ))
      : null;
    const jugadoresParaControles = idsControlables
      ? jugadoresActivos.filter((jugador) => idsControlables.has(String(jugador.id)))
      : jugadoresActivos;
    const obtenerNombreVisible = (jugador) => {
      if (!puedeControlar) return undefined;
      return jugadoresPorId.get(String(jugador.id))?.nombre
        || (!jugadoresControlables ? jugador.nombre : undefined);
    };
    const esDefinicion = estadoVisual?.fase === 'definicion' || estado?.fase === 'definicion';
    const ganadorDefinicion = estado?.ganador_definicion ?? estadoVisual?.ganador_definicion ?? null;
    const resultadoPenales = estado?.resultado_penales
      || estadoVisual?.resultado_penales
      || [0, 0];
    const marcadorReglamentario = estado?.marcador_reglamentario
      || estadoVisual?.marcador_reglamentario
      || null;
    const rondaActual = estadoVisual?.ronda_penal || estado?.ronda_penal || 1;
    const historialPenales = estado?.historial_penales || estadoVisual?.historial_penales || [];

    const marcador = estadoVisual?.marcador || [0, 0];
    const marcadorPrincipal = marcadorReglamentario
      || estado?.marcador_regular
      || estadoVisual?.marcador_regular
      || (!esDefinicion ? marcador : [0, 0]);
    const hayDatosDeDefinicion = esDefinicion
      || ganadorDefinicion !== null
      || historialPenales.length > 0
      || estado?.tipo?.startsWith('PENAL_');
    const huboPenales = hayDatosDeDefinicion
      && marcadorPrincipal[0] === marcadorPrincipal[1];
    const tickPausa = estado?.tick ?? 0;
    const ticksTotales = estado?.ticks_totales ?? 0;
    const tituloPausa = tickPausa <= Math.ceil(ticksTotales / 4)
      ? 'Cooling Break #1'
      : tickPausa <= Math.ceil(ticksTotales / 2)
        ? 'Medio Tiempo'
        : 'Cooling Break #2';
    const progreso = estadoVisual && estadoVisual.ticks_totales > 0
    ? limitar((estadoVisual.tick / estadoVisual.ticks_totales) * 100, 0, 100)
    : 0;  
    const cancha = estadoVisual?.cancha || { ancho: 100, alto: 60 };
    const pelota = estadoVisual?.pelota;

    const nombreGanadorDefinicion = ganadorDefinicion === 0
      ? (estado?.clubes?.local?.nombre || 'Club Local')
      : ganadorDefinicion === 1
        ? (estado?.clubes?.visitante?.nombre || 'Club Visitante')
        : null;

    useEffect(() => {
      if (!pausado) {
        setCuentaPausa(10);
        return undefined;
      }

      setCuentaPausa(estado?.duracion_pausa_segundos ?? 10);
      const intervalo = setInterval(() => {
        setCuentaPausa((actual) => Math.max(0, actual - 1));
      }, 1000);

      return () => clearInterval(intervalo);
    }, [pausado, estado?.duracion_pausa_segundos]);

    const regresar = () => {
        // Limpiamos el estado del partido
        if (onFinalizar) {
          onFinalizar();
        }
        if (onCerrar) {
          onCerrar();
          return;
        }

        // Volvemos a MiClub
        if (cambiarPantalla) {
          cambiarPantalla('mi-club');
        }
      };

    const renderPuntosPenales = (equipoIndex, ariaLabel) => (
      <div className="mt-2 flex justify-center gap-1.5" aria-label={ariaLabel}>
        {[1, 2, 3, 4, 5].map((numRonda) => {
          const h = historialPenales.find((r) => r.ronda === numRonda);
          if (h) {
            const gano = h.ganador_ronda === equipoIndex;
            return (
              <span
                key={numRonda}
                title={`Ronda ${numRonda}: ${gano ? 'Anotó' : 'Falló'}`}
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                  gano ? 'bg-emerald-500 text-slate-950' : 'bg-red-500 text-white'
                }`}
              >
                {gano ? '✓' : '✕'}
              </span>
            );
          }
          if (numRonda === rondaActual && esDefinicion && !finalizado) {
            return (
              <span
                key={numRonda}
                title={`Ronda ${numRonda}: En juego`}
                className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-400/20 text-xs text-amber-300 animate-pulse"
              >
                ●
              </span>
            );
          }
          return (
            <span
              key={numRonda}
              title={`Ronda ${numRonda}: Pendiente`}
              className="h-5 w-5 rounded-full border border-slate-700 bg-slate-800"
            />
          );
        })}
      </div>
    );
    
    return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
        <div className="mx-auto max-w-7xl">
            <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
                  {esDefinicion ? 'Definición por penales' : 'Partido en vivo'}
                </p>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                  {estado?.clubes?.local?.nombre || 'Club Local'}
                  <span className="mx-3 text-slate-500">vs</span>
                  {estado?.clubes?.visitante?.nombre || 'Club Visitante'}
                </h1>
              </div>
              <EstadoConexion estado={estadoConexion} />
              {(onCerrar || cambiarPantalla) && !finalizado && (
                <button
                  type="button"
                  onClick={regresar}
                  className="rounded border border-cyan-300 px-4 py-2 text-sm font-semibold text-cyan-200 transition-colors hover:bg-cyan-300 hover:text-slate-950"
                >
                  Dejar de ver
                </button>
              )}
            </header>

            {esDefinicion && (
              <div
                role="status"
                aria-live="polite"
                className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-center"
              >
                <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Definición por Penales &bull; Ronda #{rondaActual} de 5</span>
                </div>
                {estado?.tipo === 'PENAL_RONDA_FINALIZADA' && estado?.ganador_ronda !== undefined && (
                  <p className="mt-1 text-sm font-semibold text-emerald-300">
                    ¡Ronda #{estado.ronda_penal} finalizada! Ganador:{' '}
                    <span className="font-bold">
                      {estado.ganador_ronda === 0
                        ? (estado?.clubes?.local?.nombre || 'Local')
                        : (estado?.clubes?.visitante?.nombre || 'Visitante')}
                    </span>
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="mb-5 rounded-xl border border-red-400/40 bg-red-950/60 p-4 text-red-100" role="alert">
                <p className="font-semibold">No se pudo cargar el partido</p>
                <p className="mt-1 text-sm text-red-200">{error}</p>
              </div>
            )}

            <div className={puedeControlar
              ? 'grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.9fr)_minmax(19rem,1fr)]'
              : 'flex justify-center'}
            >
            <section className={`min-w-0 rounded-2xl border border-slate-700 bg-slate-900 p-3 shadow-2xl sm:p-5 ${
              puedeControlar ? '' : 'w-full max-w-5xl'
            }`}
            >
              {/* modela el marcador */}
              <div className="mb-4 flex items-center justify-center gap-5 text-center">
                <div className="min-w-24">
                  <p className="truncate text-sm text-slate-300">{estado?.clubes?.local?.nombre || 'Local'}</p>
                  <p className="text-6xl font-black text-sky-300 sm:text-7xl" aria-label={`Marcador reglamentario local: ${marcadorPrincipal[0]}`}>
                    {marcadorPrincipal[0]}
                  </p>
                </div>
                <span className="text-xl text-slate-500">-</span>
                <div className="min-w-24">
                  <p className="truncate text-sm text-slate-300">{estado?.clubes?.visitante?.nombre || 'Visitante'}</p>
                  <p className="text-6xl font-black text-orange-300 sm:text-7xl" aria-label={`Marcador reglamentario visitante: ${marcadorPrincipal[1]}`}>
                    {marcadorPrincipal[1]}
                  </p>
                </div>
              </div>

              {huboPenales && (
                <div className="mb-4 space-y-3 border-t border-slate-700 pt-3">
                  <div className="flex items-center justify-center gap-6 text-center">
                    <div className="min-w-28">
                      <p className="truncate text-sm font-medium text-slate-300">
                        {estado?.clubes?.local?.nombre || 'Local'}
                      </p>
                      <p className="text-4xl font-black text-sky-300 sm:text-5xl" aria-label={`Penales Local: ${resultadoPenales[0]}`}>
                        {resultadoPenales[0]}
                      </p>
                      {renderPuntosPenales(0, 'Rondas penales local')}
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                        Penales
                      </span>
                      <span className="text-2xl font-bold text-slate-500">-</span>
                    </div>

                    <div className="min-w-28">
                      <p className="truncate text-sm font-medium text-slate-300">
                        {estado?.clubes?.visitante?.nombre || 'Visitante'}
                      </p>
                      <p className="text-4xl font-black text-orange-300 sm:text-5xl" aria-label={`Penales Visitante: ${resultadoPenales[1]}`}>
                        {resultadoPenales[1]}
                      </p>
                      {renderPuntosPenales(1, 'Rondas penales visitante')}
                    </div>
                  </div>

                  {esDefinicion && !finalizado && (
                    <div className="flex justify-center text-xs text-slate-400">
                      <span>Duelo 1v1 ronda #{rondaActual}: {marcador[0]} - {marcador[1]}</span>
                    </div>
                  )}
                </div>
              )}
            
              <div className="relative overflow-hidden rounded-xl border-4 border-white/80 bg-emerald-700">
              {/* modela la cancha */}
                <svg
                  viewBox={`0 0 ${cancha.ancho} ${cancha.alto}`}
                  preserveAspectRatio="xMidYMid meet"
                  className="block aspect-[5/3] w-full"
                  aria-label="Cancha de fútbol y posiciones de jugadores"
                >
                  <rect width={cancha.ancho} height={cancha.alto} fill="#16803c" />
                  <path d="M 0 0 H 100 V 60 H 0 Z M 50 0 V 60 M 0 30 H 100" fill="none" stroke="#b7f7c4" strokeWidth="0.45" opacity="0.8" />
                  <circle cx="50" cy="30" r="9" fill="none" stroke="#b7f7c4" strokeWidth="0.45" opacity="0.8" />
                  <circle cx="50" cy="30" r="0.8" fill="#b7f7c4" />
                  <path d="M 0 12 H 16 V 48 H 0 M 100 12 H 84 V 48 H 100" fill="none" stroke="#b7f7c4" strokeWidth="0.45" />
                  <path d="M 0 22 H 6 V 38 H 0 M 100 22 H 94 V 38 H 100" fill="none" stroke="#b7f7c4" strokeWidth="0.45" />
                  <rect x="-2" y="22" width="2" height="16" fill="#e2e8f0" />
                  <rect x="100" y="22" width="2" height="16" fill="#e2e8f0" />
            
                  {/* recorrre y dibuja a los jugadores */}
                  {estadoVisual?.jugadores?.map((jugador) => (
                    <g key={jugador.id} transform={`translate(${limitar(jugador.x, 0, cancha.ancho)} ${limitar(jugador.y, 0, cancha.alto)})`}>
                      {/* dibuja el respectivo circulo de cada jugador */}
                      <circle r="2.1" fill={jugador.equipo === 0 ? '#38bdf8' : '#fb923c'} stroke="#fff" strokeWidth="0.35" />
                      <text y="0.7" textAnchor="middle" fontSize="1.6" fontWeight="700" fill="#0f172a">
                        {obtenerEtiquetaJugador(
                          obtenerNombreVisible(jugador),
                          jugador.id,
                        )}
                      </text>
                      <title>{obtenerNombreVisible(jugador) || `Jugador ${jugador.id}`}</title>
                    </g>
                  ))}
                  {pelota && (
                    <circle
                      cx={limitar(pelota.x, 0, cancha.ancho)}
                      cy={limitar(pelota.y, 0, cancha.alto)}
                      r="1.4"
                      fill="#fff"
                      stroke="#0f172a"
                      strokeWidth="0.35"
                    >
                      <title>Pelota</title>
                    </circle>
                  )}
                </svg>
                {finalizado && (
                  <div
                    className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/25"
                    aria-label="Partido finalizado"
                  >
                    <span className="text-6xl font-black tracking-[0.3em] text-white drop-shadow-[0_3px_3px_rgba(0,0,0,0.8)] sm:text-8xl">
                      FIN
                    </span>
                  </div>
                )}
                {pausado && (
                  <div
                    role="status"
                    aria-live="assertive"
                    className="absolute inset-0 flex flex-col items-center justify-center bg-gray-500/65 px-4 text-center backdrop-blur-[1px]"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-4xl font-black tabular-nums text-red-600 sm:text-6xl" aria-label={`${cuentaPausa}`}>
                        {cuentaPausa}
                      </span>
                      <h2 className="text-4xl font-black text-cyan-300 [-webkit-text-stroke:1px_#000] sm:text-6xl">
                        {tituloPausa}
                      </h2>
                    </div>
                    <p className="mt-3 max-w-xl text-base font-semibold text-white drop-shadow sm:text-xl">
                      Realizando sustituciones
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-slate-400">
                  <span>
                    {esDefinicion
                      ? `Progreso de ronda #${rondaActual}`
                      : 'Progreso del partido'}
                  </span>
                  <span>{estadoVisual ? `${estadoVisual.tick} / ${estadoVisual.ticks_totales} ticks` : 'Esperando estado'}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                  <div className="h-full rounded-full bg-emerald-400 transition-[width] duration-300" style={{ width: `${progreso}%` }} />
                </div>
              </div>
              {finalizado && (
                <div className="mt-5 flex flex-col items-center gap-3">
                  {ganadorDefinicion !== null && (
                    <div
                      role="region"
                      aria-label="Resultado de la definición por penales"
                      className="w-full max-w-lg rounded-xl border border-emerald-400/40 bg-emerald-950/40 p-4 text-center shadow-lg"
                    >
                      <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                        Ganador de la definición por penales
                      </p>
                      <h3 className="mt-1 text-2xl font-black text-white">
                        {nombreGanadorDefinicion}
                      </h3>
                      <div className="mt-2 flex items-center justify-center gap-3 text-sm">
                        <span className="rounded bg-emerald-500/20 px-2 py-1 font-bold text-emerald-200">
                          Penales: {resultadoPenales[0]} - {resultadoPenales[1]}
                        </span>
                        {marcadorReglamentario && (
                          <span className="text-slate-400">
                            (Reglamentario: {marcadorReglamentario[0]} - {marcadorReglamentario[1]})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <p className="rounded-lg bg-emerald-400/15 px-4 py-2 text-center font-semibold text-emerald-300">
                    Partido finalizado
                  </p>
                  <BotonPrimario
                    texto="VOLVER A MI CLUB"
                    onClick={regresar}
                    className="max-w-xs"
                  />
                </div>
              )}
            </section>
            {puedeControlar && (
            <aside className="space-y-5 lg:flex lg:h-full lg:flex-col lg:justify-center">
              <div>
                <CambioEnCancha
                  jugadoresEnCancha={jugadoresParaControles}
                  convocatoria={convocatoriaSegura}
                  jugadores={jugadoresControles.length ? jugadoresControles : jugadoresActivos}
                  onSolicitarCambio={onSolicitarCambio}
                  deshabilitado={!onSolicitarCambio || esDefinicion}
                  pausado={pausado}
                />
                {esDefinicion && (
                  <p className="mt-1 text-center text-xs text-amber-300/80">
                    Sustituciones no disponibles durante la tanda de penales
                  </p>
                )}
              </div>
              <ComportamientosEnCancha
                jugadoresEnCancha={jugadoresParaControles}
                comportamientos={comportamientosSeguros}
                onCambiarComportamiento={onCambiarComportamiento}
                deshabilitado={!onCambiarComportamiento}
              />
            </aside>
            )}
            </div>
        </div>
     </main>
    );
}

export default Cancha;