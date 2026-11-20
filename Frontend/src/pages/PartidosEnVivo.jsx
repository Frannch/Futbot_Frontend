import { useEffect, useRef, useState } from 'react';
import Header from '../components/layout/Header.jsx';
import CanchaLiga from './CanchaLiga.jsx';
import { crearServicioPartidosEnVivo } from '../services/partidosEnVivo.js';
import {
  cambiarComportamientoJugador,
  solicitarCambioPartido,
} from '../services/partidos.js';
import { useWebSocket } from '../services/websocket.jsx';
import { obtenerDatosDireccionLiga } from '../services/ligas.js';

const CAMPOS_ID_USUARIO = ['id_usuario', 'usuario_id', 'user_id', 'idUser'];
const CAMPOS_ID_JUGADOR = ['id_jugador', 'jugador_id', 'player_id'];
const CAMPOS_ID_DT = [
  'id_dt',
  'id_director_tecnico',
  'id_entrenador',
  'id_usuario_dt',
  'id_usuario_entrenador',
  'director_tecnico_id',
  'entrenador_id',
];

function obtenerJugadoresDelPartido(partido) {
  const colecciones = [
    partido?.jugadores,
    partido?.alineacion,
    partido?.alineaciones,
    partido?.convocatorias,
    partido?.convocatoria,
    partido?.jugadores_local,
    partido?.jugadores_visitante,
  ];

  return colecciones.flatMap((coleccion) => {
    if (Array.isArray(coleccion)) return coleccion;
    if (coleccion && typeof coleccion === 'object') {
      return Object.values(coleccion).flatMap((valor) => (
        Array.isArray(valor) ? valor : []
      ));
    }
    return [];
  });
}

function contieneIdDt(valor, idUsuario, vistos = new Set()) {
  if (!valor || typeof valor !== 'object') return false;
  if (vistos.has(valor)) return false;
  vistos.add(valor);
  if (CAMPOS_ID_DT.some((campo) => String(valor[campo]) === String(idUsuario))) {
    return true;
  }

  return Object.entries(valor).some(([clave, contenido]) => {
    const claveNormalizada = clave.toLowerCase();
    if (
      (claveNormalizada.includes('dt') || claveNormalizada.includes('entrenador'))
      && String(contenido) === String(idUsuario)
    ) {
      return true;
    }
    return typeof contenido === 'object' && contieneIdDt(contenido, idUsuario, vistos);
  });
}

export function usuarioParticipaEnPartido(partido, idUsuario, idClub) {
  if (!idUsuario && !idClub) return false;
  const usuario = String(idUsuario);
  const club = String(idClub);

  if (contieneIdDt(partido, usuario)) return true;
  const coleccionesPartido = [partido?.clubes, partido?.convocatorias, partido?.alineaciones];
  if (coleccionesPartido.some((coleccion) => contieneIdDt(coleccion, usuario))) {
    return true;
  }

  const clubes = [
    partido?.club_local,
    partido?.club_visitante,
    partido?.clubes?.local,
    partido?.clubes?.visitante,
  ];
  if (idClub && clubes.some((equipo) => (
    equipo && String(equipo.id_club ?? equipo.id ?? equipo.club_id) === club
  ))) {
    return true;
  }

  if (!idUsuario) return false;
  return obtenerJugadoresDelPartido(partido).some((jugador) => (
    CAMPOS_ID_USUARIO.some((campo) => String(jugador?.[campo]) === usuario)
    || CAMPOS_ID_JUGADOR.some((campo) => String(jugador?.[campo]) === usuario)
    || String(jugador?.id) === usuario
  ));
}

function obtenerConvocatoria(partido) {
  if (Array.isArray(partido?.convocatoria)) return partido.convocatoria;
  if (Array.isArray(partido?.alineacion)) return partido.alineacion;

  const alineaciones = partido?.alineaciones;
  if (!alineaciones || typeof alineaciones !== 'object') return [];

  return Object.values(alineaciones).flatMap((alineacion) => {
    if (Array.isArray(alineacion)) {
      return alineacion.map((idJugador) => (
        typeof idJugador === 'object'
          ? idJugador
          : { id_jugador: idJugador }
      ));
    }

    if (!alineacion || typeof alineacion !== 'object') return [];
    return Object.values(alineacion).flatMap((jugadores) => (
      Array.isArray(jugadores)
        ? jugadores.map((idJugador) => (
          typeof idJugador === 'object'
            ? idJugador
            : { id_jugador: idJugador }
        ))
        : []
    ));
  });
}

function PartidoCard({ partido, idUsuario, idClub, puedeDirigirAmistoso = false }) {
  const marcador = partido.marcador || [0, 0];
  const puedeDirigir = usuarioParticipaEnPartido(partido, idUsuario, idClub);
  const estiloBoton = puedeDirigir
    ? 'border-orange-300 text-orange-200 hover:bg-orange-300 hover:text-slate-950'
    : 'border-cyan-400 text-cyan-300 hover:bg-cyan-400 hover:text-slate-950';

  return (
    <article className="rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-300">
          En vivo
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
        <p className="truncate font-semibold text-slate-100">
          {partido.club_local?.nombre || 'Club local'}
        </p>
        <p className="text-3xl font-black text-white" aria-label="Marcador">
          {marcador[0]} - {marcador[1]}
        </p>
        <p className="truncate font-semibold text-slate-100">
          {partido.club_visitante?.nombre || 'Club visitante'}
        </p>
      </div>
      {(partido.fase || partido.tick !== undefined) && (
        <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs text-slate-400">
          {partido.fase && <span>Fase: {partido.fase}</span>}
          {partido.tick !== undefined && <span>Tick: {partido.tick}</span>}
        </div>
      )}
      <button
        type="button"
        onClick={() => (
          puedeDirigirAmistoso
            ? partido.onDirigirAmistoso?.(partido)
            : partido.onEspectar?.(partido)
        )}
        className={`mt-5 w-full rounded border px-4 py-2 text-sm font-semibold transition-colors ${estiloBoton}`}
      >
        {puedeDirigirAmistoso ? 'Dirigir amistoso' : puedeDirigir ? 'Dirigir partido' : 'Espectar partido'}
      </button>
    </article>
  );
}
export default function PartidosEnVivo({ cambiarPantalla, cerrarSesion }) {
  const {
    partidoAmistosoId,
    abrirPartidoAmistoso,
  } = useWebSocket() || {};
  const [partidos, setPartidos] = useState([]);
  const [partidoEspectado, setPartidoEspectado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [datosDireccion, setDatosDireccion] = useState(null);
  const datosDireccionCacheRef = useRef(new Map());
  const cargasDireccionRef = useRef(new Set());
  const idUsuario = localStorage.getItem('userId');
  const idClub = localStorage.getItem('clubId');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCargando(false);
      setError('Debes iniciar sesión para consultar los partidos en vivo.');
      return undefined;
    }

    const desconectar = crearServicioPartidosEnVivo(token, {
      onCargando: setCargando,
      onConectado: () => setError(''),
      onError: setError,
      onPartidoError: (idPartido) => setPartidoEspectado((actual) => (
        actual && String(actual.id_partido) === String(idPartido)
          ? null
          : actual
      )),
      onPartidosIniciales: (partidosIniciales) => setPartidos(partidosIniciales),
      onPartidoEliminado: (idPartido) => setPartidos((actuales) => actuales.filter(
        (partido) => String(partido.id_partido) !== String(idPartido)
      )),
      onPartidoActualizado: (idPartido, mensaje, partidoNuevo) => {
        setPartidoEspectado((actual) => (
          actual && String(actual.id_partido) === String(idPartido)
            ? partidoNuevo
            : actual
        ));
        setPartidos((actuales) => {
          const indice = actuales.findIndex(
            (partido) => String(partido.id_partido) === String(idPartido)
          );
          if (indice === -1) {
            return mensaje.tipo === 'PARTIDO_INICIAL'
              ? [partidoNuevo, ...actuales]
              : actuales;
          }
          const actualizados = [...actuales];
          actualizados[indice] = Object.entries(partidoNuevo).reduce(
            (partidoActualizado, [clave, valor]) => (
              valor === undefined
                ? partidoActualizado
                : { ...partidoActualizado, [clave]: valor }
            ),
            actualizados[indice],
          );
          return actualizados;
        });
      },
    });

    return desconectar;
  }, []);

  useEffect(() => {
    const idSeleccionado = localStorage.getItem('partidoEspectadoId');
    if (!idSeleccionado || partidoEspectado) return;

    const partido = partidos.find(
      (item) => String(item.id_partido) === String(idSeleccionado),
    );
    if (partido) {
      localStorage.removeItem('partidoEspectadoId');
      setPartidoEspectado(partido);
    }
  }, [partidos, partidoEspectado]);

  useEffect(() => {
    let cancelado = false;
    const cargarDatosDireccion = async () => {
      const idLiga = partidoEspectado?.id_liga;
      if (!idLiga || !usuarioParticipaEnPartido(
          partidoEspectado,
          localStorage.getItem('userId'),
          localStorage.getItem('clubId'),
        )) {
        setDatosDireccion(null);
        return;
      }

      const claveLiga = String(idLiga);
      const datosCacheados = datosDireccionCacheRef.current.get(claveLiga);
      if (datosCacheados) {
        setDatosDireccion(datosCacheados);
        return;
      }
      if (cargasDireccionRef.current.has(claveLiga)) return;

      cargasDireccionRef.current.add(claveLiga);
      try {
        const datos = await obtenerDatosDireccionLiga(idLiga);
        datosDireccionCacheRef.current.set(claveLiga, datos);
        if (!cancelado) setDatosDireccion(datos);
      } catch (errorCarga) {
        if (!cancelado) {
          setDatosDireccion(null);
          setError(errorCarga.message);
        }
      } finally {
        cargasDireccionRef.current.delete(claveLiga);
      }
    };

    void cargarDatosDireccion();
    return () => {
      cancelado = true;
    };
  }, [partidoEspectado?.id_liga, partidoEspectado?.id_partido]);

  if (partidoEspectado) {
    const puedeControlar = usuarioParticipaEnPartido(
      partidoEspectado,
      localStorage.getItem('userId'),
      localStorage.getItem('clubId'),
    );
    const idPartido = partidoEspectado.id_partido;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <CanchaLiga
          estado={{
            cancha: { ancho: 100, alto: 60 },
            jugadores: [],
            pelota: { x: 50, y: 30 },
            marcador: [0, 0],
            ...partidoEspectado,
          }}
          finalizado={partidoEspectado.tipo === 'PARTIDO_FINALIZADO'}
          pausado={partidoEspectado.tipo === 'PARTIDO_PAUSADO'}
          jugadores={partidoEspectado.jugadores || []}
          convocatoria={datosDireccion?.convocatoria ?? obtenerConvocatoria(partidoEspectado)}
          jugadoresControlables={datosDireccion?.jugadores}
          comportamientos={datosDireccion?.comportamientos
            ?? partidoEspectado.comportamientos
            ?? []}
          puedeControlar={puedeControlar}
          onSolicitarCambio={puedeControlar
            ? (cambio) => solicitarCambioPartido(idPartido, cambio)
            : undefined}
          onCambiarComportamiento={puedeControlar
            ? ({ id_jugador, id_comportamiento }) => (
              cambiarComportamientoJugador(idPartido, id_jugador, id_comportamiento)
            )
            : undefined}
          onCerrar={() => {
            localStorage.removeItem('partidoEspectadoId');
            setPartidoEspectado(null);
            cambiarPantalla?.('mi-club');
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1b13] text-white">
      <Header
        onCambiarPantalla={cambiarPantalla}
        onCerrarSesion={cerrarSesion}
        pantallaActual="partidos-en-vivo"
      />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-xl font-bold uppercase">Partidos en Vivo</h1>
        {cargando && <p className="mt-4 text-sm text-slate-400">Cargando partidos...</p>}
        {error && <p className="mt-4 rounded border border-red-400/40 p-3 text-sm text-red-200">{error}</p>}
        {!cargando && !error && partidos.length === 0 && (
          <p className="mt-4 text-sm text-slate-400">No hay partidos en vivo para mostrar.</p>
        )}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {partidos.map((partido) => (
            <PartidoCard
              key={partido.id_partido}
              partido={{
                ...partido,
                onEspectar: setPartidoEspectado,
                onDirigirAmistoso: () => {
                  if (abrirPartidoAmistoso?.()) {
                    cambiarPantalla?.('mi-club');
                  }
                },
              }}
              idUsuario={idUsuario}
              idClub={idClub}
              puedeDirigirAmistoso={
                String(partido.id_partido) === String(partidoAmistosoId)
                && usuarioParticipaEnPartido(partido, idUsuario, idClub)
              }
            />
          ))}
        </div>
      </main>
    </div>
  );
}
