import { useEffect, useState } from 'react';
import SelectorConvocatoria from './SelectorConvocatoria';
import { obtenerComportamientos, obtenerJugadores } from '../services/clubes.js';
import {
  actualizarAlineacionLiga,
  obtenerAlineacionLiga,
} from '../services/ligas.js';

function CambiarAlineacion({ idLiga }) {
  const [jugadores, setJugadores] = useState([]);
  const [comportamientos, setComportamientos] = useState([]);
  const [alineacion, setAlineacion] = useState(null);
  const [convocatoria, setConvocatoria] = useState(null);
  const [version, setVersion] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  useEffect(() => {
    let activo = true;

    async function cargarDatos() {
      setCargando(true);
      setMensajeError('');

      try {
        const [alineacionActual, jugadoresClub, comportamientosClub] = await Promise.all([
          obtenerAlineacionLiga(idLiga),
          obtenerJugadores(),
          obtenerComportamientos(),
        ]);

        if (!activo) return;
        setAlineacion(alineacionActual);
        setConvocatoria(alineacionActual);
        setJugadores(jugadoresClub);
        setComportamientos(comportamientosClub);
      } catch (error) {
        if (activo) {
          setMensajeError(error.message || 'No se pudo cargar la alineación.');
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarDatos();
    return () => {
      activo = false;
    };
  }, [idLiga]);

  const guardarAlineacion = async (evento) => {
    evento.preventDefault();
    if (!convocatoria || guardando) return;

    setGuardando(true);
    setMensajeError('');
    setMensajeExito('');

    try {
      const actualizada = await actualizarAlineacionLiga(idLiga, convocatoria);
      setAlineacion(actualizada);
      setConvocatoria(actualizada);
      setVersion((actual) => actual + 1);
      setMensajeExito('Alineación actualizada.');
    } catch (error) {
      setMensajeError(error.message || 'No se pudo actualizar la alineación.');
    } finally {
      setGuardando(false);
    }
  };

  const cancelarCambios = () => {
    setConvocatoria(alineacion);
    setVersion((actual) => actual + 1);
    setMensajeError('');
    setMensajeExito('');
  };

  return (
    <section
      className="space-y-4 rounded-md border border-white/15 bg-[#12251a] p-4"
      aria-labelledby="titulo-cambiar-alineacion"
    >
      <div>
        <h2 id="titulo-cambiar-alineacion" className="text-lg font-semibold text-white">
          Cambiar alineación
        </h2>
        <p className="mt-1 text-sm text-gray-300">
          Actualizá la convocatoria de tu club para los próximos partidos.
        </p>
      </div>

      {mensajeError && <p role="alert" className="text-sm text-red-300">{mensajeError}</p>}
      {mensajeExito && <p role="status" className="text-sm text-green-300">{mensajeExito}</p>}

      {cargando ? (
        <p role="status" className="text-sm text-gray-300">Cargando alineación...</p>
      ) : alineacion && (
        <form onSubmit={guardarAlineacion}>
          <SelectorConvocatoria
            key={version}
            jugadores={jugadores}
            comportamientos={comportamientos}
            convocatoriaInicial={alineacion}
            alCambiar={setConvocatoria}
          />
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={!convocatoria || guardando}
              className="rounded bg-green-500 px-4 py-2 text-sm font-semibold text-[#0d1b13] transition-colors hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar alineación'}
            </button>
            <button
              type="button"
              onClick={cancelarCambios}
              disabled={guardando}
              className="rounded border border-white/25 px-4 py-2 text-sm text-gray-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Descartar cambios
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default CambiarAlineacion;