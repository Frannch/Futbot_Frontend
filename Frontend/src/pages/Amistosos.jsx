import { useCallback, useEffect, useRef, useState } from 'react';
import Header from '../components/Header.jsx';
import AmistososNav from '../components/AmistososNav.jsx';
import SelectorConvocatoria from '../components/SelectorAmistoso.jsx';
import Temporizador from '../components/Timer.jsx';
import { useWebSocket } from '../services/websocket.jsx';
import {
  obtenerClubes,
  obtenerComportamientos,
  obtenerInvitacionesPendientes,
  obtenerJugadores,
  normalizarLogo,
  solicitarAmistoso
} from '../services/clubes.js';

export default function DesafiosAmistosos({ cambiarPantalla, cerrarSesion }) {
  const {
    invitacionActual,
    resultadoSolicitud,
    aceptarInvitacionDesdeLista,
    rechazarInvitacion,
    guardarConvocatoriaPartido,
  } = useWebSocket() || {};
  const [seccionActiva, setSeccionActiva] = useState('invitar');
  const [clubes, setClubes] = useState([]);
  const [invitaciones, setInvitaciones] = useState([]);
  const [jugadores, setJugadores] = useState([]);
  const [comportamientos, setComportamientos] = useState([]);
  const [cargandoClubes, setCargandoClubes] = useState(true);
  const [cargandoInvitaciones, setCargandoInvitaciones] = useState(false);
  const [cargandoJugadores, setCargandoJugadores] = useState(true);
  const [cargandoComportamientos, setCargandoComportamientos] = useState(true);
  const [errorClubes, setErrorClubes] = useState('');
  const [errorInvitaciones, setErrorInvitaciones] = useState('');
  const [idRechazoEnCurso, setIdRechazoEnCurso] = useState(null);
  const [errorRechazo, setErrorRechazo] = useState('');
  const [errorJugadores, setErrorJugadores] = useState('');
  const [errorComportamientos, setErrorComportamientos] = useState('');
  const [clubSeleccionado, setClubSeleccionado] = useState(null);
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [temporizadorActivo, setTemporizadorActivo] = useState(false);
  const [temporizadorOculto, setTemporizadorOculto] = useState(false);
  const [idSolicitudEnEspera, setIdSolicitudEnEspera] = useState(null);
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const [errorSolicitud, setErrorSolicitud] = useState('');
  const cargasEnCurso = useRef({
    clubes: false,
    invitaciones: false,
    jugadores: false,
    comportamientos: false
  });

  const cargarClubes = useCallback(async () => {
    if (cargasEnCurso.current.clubes) return;
    cargasEnCurso.current.clubes = true;
    setCargandoClubes(true);
    setErrorClubes('');

    try {
      setClubes(await obtenerClubes());
    } catch (error) {
      setErrorClubes(error.message);
    } finally {
      cargasEnCurso.current.clubes = false;
      setCargandoClubes(false);
    }
  }, []);

  const cargarInvitaciones = useCallback(async () => {
    if (cargasEnCurso.current.invitaciones) return;
    cargasEnCurso.current.invitaciones = true;
    setCargandoInvitaciones(true);
    setErrorInvitaciones('');

    try {
      const invitacionesPendientes = await obtenerInvitacionesPendientes();
      setInvitaciones((actuales) => {
        const porId = new Map(actuales.map((invitacion) => [invitacion.id_solicitud, invitacion]));
        invitacionesPendientes.forEach((invitacion) => {
          porId.set(invitacion.id_solicitud, { ...porId.get(invitacion.id_solicitud), ...invitacion });
        });
        return Array.from(porId.values());
      });
    } catch (error) {
      setErrorInvitaciones(error.message);
    } finally {
      cargasEnCurso.current.invitaciones = false;
      setCargandoInvitaciones(false);
    }
  }, []);

  const cargarJugadores = useCallback(async () => {
    if (cargasEnCurso.current.jugadores) return;
    cargasEnCurso.current.jugadores = true;
    setCargandoJugadores(true);
    setErrorJugadores('');

    try {
      setJugadores(await obtenerJugadores());
    } catch (error) {
      setErrorJugadores(error.message);
    } finally {
      cargasEnCurso.current.jugadores = false;
      setCargandoJugadores(false);
    }
  }, []);

  const cargarComportamientos = useCallback(async () => {
    if (cargasEnCurso.current.comportamientos) return;
    cargasEnCurso.current.comportamientos = true;
    setCargandoComportamientos(true);
    setErrorComportamientos('');

    try {
      setComportamientos(await obtenerComportamientos());
    } catch (error) {
      setErrorComportamientos(error.message);
    } finally {
      cargasEnCurso.current.comportamientos = false;
      setCargandoComportamientos(false);
    }
  }, []);

  useEffect(() => {
    cargarClubes();
    cargarJugadores();
    cargarComportamientos();
  }, [cargarClubes, cargarJugadores, cargarComportamientos]);

  useEffect(() => {
    if (seccionActiva === 'recibidas') cargarInvitaciones();
  }, [seccionActiva, cargarInvitaciones]);

  useEffect(() => {
    if (invitacionActual?.id_solicitud == null) return;

    const invitacionEnVivo = {
      id_solicitud: invitacionActual.id_solicitud,
      id_club_retador: invitacionActual.id_club_retador,
      nombre_club_retador: invitacionActual.nombre_club_retador
        ?? `Club ${invitacionActual.id_club_retador}`,
      avatar: invitacionActual.avatar ?? '',
      tiempo_restante: invitacionActual.expira_en_segundos ?? 300,
    };

    setInvitaciones((actuales) => [
      invitacionEnVivo,
      ...actuales.filter((actual) => actual.id_solicitud !== invitacionEnVivo.id_solicitud),
    ]);
    cargarInvitaciones();
  }, [invitacionActual, cargarInvitaciones]);

  useEffect(() => {
    const mismaSolicitud = String(
      resultadoSolicitud?.id_solicitud ?? resultadoSolicitud?.data?.id_solicitud,
    ) === String(idSolicitudEnEspera);
    if (
      mismaSolicitud
      && ['desafio_rechazado', 'desafio_aceptado'].includes(resultadoSolicitud?.evento)
    ) {
      setTemporizadorActivo(false);
      setIdSolicitudEnEspera(null);
    }
  }, [resultadoSolicitud, idSolicitudEnEspera]);

  const handleRetar = (club) => {
    setClubSeleccionado(club);
    setErrorSolicitud('');
    setSelectorAbierto(true);
  };

  const enviarSolicitud = async (payload) => {
    setErrorSolicitud('');
    setEnviandoSolicitud(true);
    console.log('JSON de la solicitud amistosa:', JSON.stringify(payload, null, 2));

    try {
      const respuesta = await solicitarAmistoso(clubSeleccionado.id_club, payload);
      guardarConvocatoriaPartido?.(payload, jugadores, [clubSeleccionado]);
      setSelectorAbierto(false);
      setIdSolicitudEnEspera(respuesta.id_solicitud_amistoso);
      setTemporizadorOculto(false);
      setTemporizadorActivo(true);
    } catch (error) {
      setErrorSolicitud(error.message);
    } finally {
      setEnviandoSolicitud(false);
    }
  };

  const handleRechazarInvitacion = async (invitacion) => {
    setIdRechazoEnCurso(invitacion.id_solicitud);
    setErrorRechazo('');

    try {
      const rechazada = await rechazarInvitacion?.(invitacion);
      if (!rechazada) {
        setErrorRechazo('No se pudo rechazar la invitación. Intenta nuevamente.');
        return;
      }
      setInvitaciones((actuales) => actuales.filter(
        (actual) => actual.id_solicitud !== invitacion.id_solicitud
      ));
    } finally {
      setIdRechazoEnCurso(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1b13] text-slate-100 flex flex-col font-sans select-none">
      <Header
        onCambiarPantalla={cambiarPantalla}
        onCerrarSesion={cerrarSesion}
        pantallaActual="amistosos"
      />
      <AmistososNav
        seccionActiva={seccionActiva}
        cambiarSeccion={setSeccionActiva}
      />
      
      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 flex flex-col">
        {seccionActiva === 'invitar' && (
          <>
        
        {/* Título de la sección */}
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-wide text-white uppercase">
            Desafíos Amistosos
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Desafía a cualquier club de la plataforma sin alterar puntos de liga.
          </p>
          {cargandoJugadores && (
            <p className="mt-3 text-xs text-slate-400">Cargando tu plantilla...</p>
          )}
          {errorJugadores && (
            <p className="mt-3 rounded border border-red-500 bg-red-500/20 p-3 text-sm text-red-100">
              {errorJugadores}
              <button type="button" className="ml-3 underline" onClick={cargarJugadores}>
                Reintentar
              </button>
            </p>
          )}
          {cargandoComportamientos && (
            <p className="mt-3 text-xs text-slate-400">Cargando comportamientos...</p>
          )}
          {errorComportamientos && (
            <p className="mt-3 rounded border border-red-500 bg-red-500/20 p-3 text-sm text-red-100">
              {errorComportamientos}
              <button type="button" className="ml-3 underline" onClick={cargarComportamientos}>
                Reintentar
              </button>
            </p>
          )}
        </div>
        
        { /* Barra de Filtro / Buscador 
        <div className="bg-[#101b44] border border-[#1b2b68] rounded-md px-4 py-2 flex items-center justify-between mb-4">
          <input
            type="text"
            placeholder="Buscar por nombre de club o usuario rival..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="bg-[#0b1230] border border-[#1b2b68] text-xs text-white placeholder-slate-500 rounded px-3 py-1.5 w-72 focus:outline-none focus:border-cyan-400"
          />
          <span className="text-xs text-slate-400">
            {clubesFiltrados.length} Clubes Disponibles
          </span>
        </div>
        */}

        {/* TABLA DE CLUBES */}
        <div className="bg-[#101b44] border border-[#1b2b68] rounded-md flex-1 flex flex-col overflow-hidden">
          
          <div className="grid grid-cols-12 px-6 py-3 border-b border-[#1b2b68] text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            <span className="col-span-4">Club Rival</span>
            <button
              type="button"
              onClick={cargarClubes}
              disabled={cargandoClubes}
              className="col-span-8 justify-self-end rounded border border-cyan-400 px-3 py-1 text-[10px] text-cyan-300 enabled:hover:bg-cyan-400 enabled:hover:text-[#060b11] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cargandoClubes ? 'Actualizando...' : 'Actualizar clubes'}
            </button>
          </div>

          {/* Filas */}
          <div className="divide-y divide-[#1b2b68]/60 overflow-y-auto">
            {clubes.map((club) => (
              <div
                key={club.id_club}
                className="grid grid-cols-12 px-6 py-3.5 items-center hover:bg-[#152358]/50 transition-colors"
              >
                {/* Nombre y avatar de club */}
                <div className="col-span-8 flex items-center gap-3">
                 
                  <span className="text-xs font-semibold text-white">
                    {club.nombre}
                  </span>
                </div>
            
                <div className="col-span-4 flex justify-end">
                  <button
                    onClick={() => handleRetar(club)}
                    disabled={
                      cargandoJugadores ||
                      cargandoComportamientos ||
                      Boolean(errorJugadores) ||
                      Boolean(errorComportamientos)
                    }
                    className="bg-[#00e676] hover:bg-[#00c853] text-[#06120b] font-black text-[11px] tracking-wide px-4 py-1.5 rounded transition-transform active:scale-95 uppercase"
                  >
                    Jugar Amistoso
                  </button>
                </div>
              </div>
            ))}

            {cargandoClubes && (
              <div className="p-8 text-center text-xs text-slate-400">
                Cargando clubes...
              </div>
            )}

            {errorClubes && (
              <div className="p-8 text-center text-xs text-red-200">
                {errorClubes}
              </div>
            )}

            {!cargandoClubes && !errorClubes && clubes.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                No se encontraron clubes disponibles.
              </div>
            )}
          </div>
        </div>
          </>
          /*SECCION PARA LISTAR INVITACIONES DE AMISTOSOS*/
        )}
        {seccionActiva === 'recibidas' && (
          <section className="flex-1">
            <div className="mb-6">
              <h1 className="text-xl font-bold tracking-wide text-white uppercase">
                Invitaciones de amistosos recibidas
              </h1>
            </div>
            <div
              role="region"
              aria-label="Lista de invitaciones recibidas"
              className="min-h-64 divide-y divide-[#1b2b68]/60 overflow-hidden rounded-md border border-[#1b2b68] bg-[#101b44]"
            >
              <div className="flex items-center justify-between gap-4 border-b border-[#1b2b68] px-6 py-3">
                <span className="text-xs font-bold uppercase text-slate-300">Pendientes</span>
                <button
                  type="button"
                  onClick={cargarInvitaciones}
                  disabled={cargandoInvitaciones}
                  className="rounded border border-cyan-400 px-3 py-1 text-[10px] text-cyan-300 enabled:hover:bg-cyan-400 enabled:hover:text-[#060b11] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cargandoInvitaciones ? 'Actualizando...' : 'Actualizar invitaciones'}
                </button>
              </div>
              {cargandoInvitaciones && (
                <p className="p-8 text-center text-xs text-slate-400">Cargando invitaciones...</p>
              )}
              {errorInvitaciones && (
                <p className="p-8 text-center text-xs text-red-200">
                  {errorInvitaciones}
                  <button type="button" className="ml-3 underline" onClick={cargarInvitaciones}>
                    Reintentar
                  </button>
                </p>
              )}
              {errorRechazo && (
                <p role="alert" className="px-6 py-3 text-xs text-red-200">
                  {errorRechazo}
                </p>
              )}
              {!cargandoInvitaciones && !errorInvitaciones && invitaciones.length === 0 && (
                <p className="p-8 text-center text-xs text-slate-400">
                  No tienes invitaciones pendientes.
                </p>
              )}
              {!errorInvitaciones && invitaciones.map((invitacion) => (
                <article
                  key={invitacion.id_solicitud}
                  className="flex flex-wrap items-center gap-3 px-6 py-4"
                >
                  {/* Campo reservado para mostrar la foto/avatar del club.
                  {invitacion.avatar && (
                    <img
                      src={normalizarLogo(invitacion.avatar)}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  )} */}
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      {invitacion.nombre_club_retador}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Invitación pendiente · {Math.floor(invitacion.tiempo_restante / 60)} min {invitacion.tiempo_restante % 60} s restantes
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => aceptarInvitacionDesdeLista?.(invitacion)}
                    className="ml-auto rounded bg-[#00e676] px-4 py-2 text-xs font-bold uppercase text-[#06120b] hover:bg-[#00c853]"
                  >
                    Aceptar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRechazarInvitacion(invitacion)}
                    disabled={idRechazoEnCurso === invitacion.id_solicitud}
                    className="ml-2 rounded border border-[#F97316] px-4 py-2 text-xs font-bold uppercase text-[#F97316] hover:bg-[#F97316] hover:text-white"
                  >
                    {idRechazoEnCurso === invitacion.id_solicitud ? 'Rechazando...' : 'Rechazar'}
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

      </main>

      <SelectorConvocatoria
        abierto={selectorAbierto}
        alCerrar={() => setSelectorAbierto(false)}
        enviando={enviandoSolicitud}
        mensajeError={errorSolicitud}
        jugadores={jugadores}
        comportamientos={comportamientos}
        nombreClubDesafiado={clubSeleccionado?.nombre}
        alEnviar={enviarSolicitud}
      />

      {temporizadorActivo && clubSeleccionado && (
        <Temporizador
          clubLocal={{ nombre: 'Mi Club' }}
          clubRival={clubSeleccionado}
          oculto={temporizadorOculto}
          onDescartar={() => setTemporizadorOculto(true)}
          onTiempoExpirado={() => {
            setTemporizadorActivo(false);
            setTemporizadorOculto(false);
          }}
        />
      )}
    </div>
  );
}