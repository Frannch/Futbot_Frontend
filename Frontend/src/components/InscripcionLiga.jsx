import { useCallback, useEffect, useState } from 'react';
import SelectorConvocatoria from './SelectorConvocatoria';
import BotonPrimario from './BotonPrimario';
import { obtenerComportamientos, obtenerJugadores } from '../services/clubes.js';
import { ErrorHttp } from '../services/http.js';
import { unirseALiga } from '../services/ligas.js';

function InscripcionLiga({
  liga,
  alVolverAlListado,
  irAlLobby,
}) {
  const [jugadores, setJugadores] = useState([]);
  const [comportamientos, setComportamientos] = useState([]);
  const [convocatoria, setConvocatoria] = useState(null);
  const [contrasenia, setContrasenia] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');

  const cargarDatosClub = useCallback(async () => {
    setCargandoDatos(true);
    try {
      const [jugadoresData, comportamientosData] = await Promise.all([
        obtenerJugadores(),
        obtenerComportamientos(),
      ]);
      setJugadores(jugadoresData);
      setComportamientos(comportamientosData);
    } catch (error) {
      setMensajeError(error.message || 'No se pudieron cargar los datos del club.');
    } finally {
      setCargandoDatos(false);
    }
  }, []);

  useEffect(() => {
    cargarDatosClub();
  }, [cargarDatosClub]);

  const ligaPrivada = Boolean(liga?.privada || liga?.esPrivada || liga?.es_privada);
  const idLiga = liga?.id_liga ?? liga?.id;

  const manejarInscripcion = async (evento) => {
    evento.preventDefault();
    if (!convocatoria || enviando) return;

    setMensajeError('');
    setEnviando(true);

    try {
      await unirseALiga(idLiga, {
        ...(ligaPrivada ? { contrasenia } : {}),
        ...convocatoria,
      });
      irAlLobby?.(idLiga, liga?.nombre ?? liga?.name);
    } catch (error) {
      if (!(error instanceof ErrorHttp)) {
        setMensajeError(error.message || 'No se pudo completar la inscripción.');
      } else if (error.status === 401) {
        setMensajeError('La contraseña de la liga es incorrecta.');
      } else if (error.status === 403) {
        const mensajeLigaCompleta = 'La liga está completa. Volviendo al listado...';
        setMensajeError(mensajeLigaCompleta);
        alVolverAlListado?.(mensajeLigaCompleta);
      } else {
        setMensajeError(error.message || 'No se pudo completar la inscripción.');
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section
      className="mx-auto w-full max-w-3xl rounded-xl bg-[#1a237e] p-5 sm:p-8"
      aria-labelledby="titulo-inscripcion-liga"
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 id="titulo-inscripcion-liga" className="text-2xl font-bold text-white">
            INSCRIBIRSE EN {liga?.nombre ?? liga?.name}
          </h1>
          <p className="mt-1 text-sm text-gray-300">
            Armá tu convocatoria para completar la inscripción.
          </p>
        </div>
        <button
          type="button"
          onClick={alVolverAlListado}
          disabled={enviando}
          className="text-sm text-gray-200 underline-offset-4 hover:text-white hover:underline"
        >
          Volver al listado
        </button>
      </div>

      {mensajeError && (
        <p role="alert" className="mb-5 rounded border border-red-500 bg-red-500/20 p-3 text-sm text-red-100">
          {mensajeError}
        </p>
      )}

      {cargandoDatos ? (
        <p role="status" className="text-sm text-gray-200">Cargando jugadores y comportamientos...</p>
      ) : (
        <form onSubmit={manejarInscripcion} noValidate>
          {ligaPrivada && (
            <div className="mb-6">
              <label htmlFor="contrasena-liga" className="mb-1 block text-sm text-gray-300">
                Contraseña de la liga
              </label>
              <div className="flex gap-2">
                <input
                  id="contrasena-liga"
                  type={mostrarContrasena ? 'text' : 'password'}
                  value={contrasenia}
                  onChange={(evento) => setContrasenia(evento.target.value)}
                  className="min-w-0 flex-1 rounded border border-white/20 bg-[#0d1b13] px-3 py-2 text-sm text-white focus:border-green-400 focus:outline-none"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena((visible) => !visible)}
                  aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="rounded border border-white/30 px-3 py-2 text-sm text-gray-200 transition-colors hover:bg-white/10"
                >
                  {mostrarContrasena ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>
          )}

          <div className="mb-6">
            <SelectorConvocatoria
              jugadores={jugadores}
              comportamientos={comportamientos}
              alCambiar={setConvocatoria}
            />
          </div>

          <BotonPrimario
            texto={enviando ? 'INSCRIBIENDO...' : 'INSCRIBIRSE'}
            tipo="submit"
            disabled={!convocatoria || enviando || (ligaPrivada && !contrasenia)}
          />
        </form>
      )}
    </section>
  );
}

export default InscripcionLiga;
