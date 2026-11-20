import { useEffect, useState } from 'react';
import {
  obtenerComportamientos,
  obtenerComportamientoPorNombre,
  actualizarComportamiento,
  probarComportamiento,
} from '../services/ComportamientoService';
import EliminarComportamiento from './EliminarComportamiento.jsx';
import SimulacionComportamiento from './SimulacionComportamiento.jsx';

function ListaComportamientos() {
  const [comportamientos, setComportamientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [comportamientoSeleccionado, setComportamientoSeleccionado] =
    useState(null);
  const [detalle, setDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState(null);
  const [editando, setEditando] = useState(false);
  const [codigoEditado, setCodigoEditado] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [simulacion, setSimulacion] = useState(null);
  const [simulando, setSimulando] = useState(false);
  const [errorSimulacion, setErrorSimulacion] = useState(null);
  const [mostrarSimulacion, setMostrarSimulacion] = useState(false);

  useEffect(() => {
    const cargarComportamientos = async () => {
      try {
        setLoading(true);
        setError(null);

        const datos = await obtenerComportamientos();

        setComportamientos(datos);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    cargarComportamientos();
  }, []);

  const manejarClick = async (comportamiento) => {
    setComportamientoSeleccionado(comportamiento);
    setDetalle(null);
    setErrorDetalle(null);
    setEditando(false);
    setSimulacion(null);
    setErrorSimulacion(null);
    setMostrarSimulacion(false);
    setLoadingDetalle(true);

    try {
      const datos = await obtenerComportamientoPorNombre(
        comportamiento.nombre
      );

      setDetalle(datos);
    } catch (error) {
      setErrorDetalle(error.message);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const limpiarSeleccion = () => {
    setComportamientoSeleccionado(null);
    setDetalle(null);
    setErrorDetalle(null);
    setLoadingDetalle(false);
    setEditando(false);
    setCodigoEditado('');
    setSimulacion(null);
    setErrorSimulacion(null);
    setMostrarSimulacion(false);
  };

  const comenzarEdicion = () => {
    setCodigoEditado(detalle.script ?? '');
    setErrorDetalle(null);
    setEditando(true);
  };

  const cancelarEdicion = () => {
    setEditando(false);
    setCodigoEditado('');
    setErrorDetalle(null);
  };

  const guardarEdicion = async () => {
    setGuardandoEdicion(true);
    setErrorDetalle(null);

    try {
      await actualizarComportamiento(comportamientoSeleccionado.nombre, codigoEditado);
      setDetalle((detalleActual) => ({
        ...detalleActual,
        script: codigoEditado,
      }));
      setSimulacion(null);
      setEditando(false);
      setCodigoEditado('');
    } catch (error) {
      setErrorDetalle(error.message);
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const simularComportamiento = async () => {
    setMostrarSimulacion(true);
    setSimulando(true);
    setErrorSimulacion(null);
    setSimulacion(null);

    try {
      const resultado = await probarComportamiento(
        comportamientoSeleccionado.id_comportamiento
      );
      setSimulacion(resultado);
    } catch (error) {
      setErrorSimulacion(error.message);
    } finally {
      setSimulando(false);
    }
  };

  const cancelarSimulacion = () => {
    setMostrarSimulacion(false);
    setSimulacion(null);
    setErrorSimulacion(null);
  };

  const manejarEliminado = (comportamientoEliminado) => {
    setComportamientos((actuales) => actuales.filter(
      (comportamiento) => comportamiento.id_comportamiento !== comportamientoEliminado.id_comportamiento
    ));
    if (comportamientoSeleccionado?.id_comportamiento === comportamientoEliminado.id_comportamiento) {
      limpiarSeleccion();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-green-500" />

        <span className="ml-3 text-gray-400">
          Cargando comportamientos...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-900/30 p-4 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="grid min-h-[420px] grid-cols-1 gap-4 lg:h-[calc(100dvh-300px)] lg:min-h-[360px] lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,2fr)]">
      <section className="min-h-64 overflow-hidden rounded-md border border-gray-700 bg-[#11151f] lg:min-h-0" aria-label="Comportamientos guardados">
        <h2 className="border-b border-gray-700 bg-[#20288f] px-4 py-3 font-semibold text-white">
          Scripts guardados
        </h2>
        {comportamientos.length ? (
          <ul className="max-h-[560px] divide-y divide-gray-800 overflow-y-auto lg:max-h-[calc(100%-56px)] lg:h-[calc(100%-56px)]">
            {comportamientos.map((comportamiento) => {
              const seleccionado = comportamientoSeleccionado?.id_comportamiento
                === comportamiento.id_comportamiento;
              return (
                <li key={comportamiento.id_comportamiento}>
                  <button
                    type="button"
                    onClick={() => manejarClick(comportamiento)}
                    aria-current={seleccionado ? 'true' : undefined}
                    className={`w-full px-4 py-4 text-left transition-colors ${seleccionado
                      ? 'bg-[#20288f] text-lime-300'
                      : 'text-gray-200 hover:bg-gray-800/70'
                    }`}
                  >
                    <span className="block truncate font-semibold">{comportamiento.nombre}</span>
                    <span className="mt-1 block text-xs text-gray-400">ID {comportamiento.id_comportamiento}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="p-4 text-sm text-gray-400">No hay comportamientos guardados.</p>
        )}
      </section>

      <section className="flex min-h-[420px] min-w-0 flex-col overflow-hidden rounded-md border border-gray-700 bg-[#11151f] lg:min-h-0" aria-label="Editor de comportamiento">
        <header className="flex min-h-14 items-center border-b border-gray-700 bg-[#20288f] px-4 py-3">
          <h2 className="truncate font-semibold text-white">
            {detalle?.nombre ?? comportamientoSeleccionado?.nombre ?? 'Seleccioná un comportamiento'}
          </h2>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden p-3">
          {loadingDetalle && (
            <div className="flex items-center justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-green-500" />
              <span className="ml-3 text-gray-400">Cargando código...</span>
            </div>
          )}

          {errorDetalle && <p role="alert" className="rounded-md bg-red-900/30 p-4 text-red-300">{errorDetalle}</p>}

          {!comportamientoSeleccionado && !loadingDetalle && (
            <div className="flex h-full min-h-[300px] items-center justify-center rounded-md border border-dashed border-gray-700 bg-[#080b12] p-6 text-center text-sm text-gray-400">
              Elegí un comportamiento para ver su código.
            </div>
          )}

          {!loadingDetalle && detalle && (
            <div className="h-full min-h-0">
              {mostrarSimulacion ? (
                <div className="h-full min-h-0">
                  {simulando && !simulacion && !errorSimulacion && (
                    <div className="flex h-full items-center justify-center text-sm text-gray-300" role="status">
                      Preparando simulación...
                    </div>
                  )}
                  {errorSimulacion && (
                    <div className="flex h-full items-center justify-center rounded-md border border-red-800 bg-red-950/30 p-4 text-sm text-red-300" role="alert">
                      {errorSimulacion}
                    </div>
                  )}
                  {simulacion && (
                    <SimulacionComportamiento
                      simulacion={simulacion}
                      nombre={detalle.nombre}
                    />
                  )}
                </div>
              ) : (
                <div className="flex h-full min-h-0 flex-col">
                  <h3 className="mb-2 shrink-0 text-sm font-semibold text-gray-400">Código Python</h3>
                {editando ? (
                  <textarea
                    aria-label="Código Python"
                    value={codigoEditado}
                    onChange={(event) => setCodigoEditado(event.target.value)}
                    spellCheck="false"
                    autoCapitalize="off"
                    autoComplete="off"
                    autoCorrect="off"
                    className="min-h-0 w-full flex-1 resize-none rounded-md border border-gray-700 bg-[#080b12] p-4 font-mono text-sm leading-6 text-gray-200 outline-none focus:border-green-400"
                  />
                ) : (
                  <pre className="min-h-0 flex-1 overflow-auto rounded-md bg-[#080b12] p-4 text-sm text-gray-200">
                    <code>{detalle.script}</code>
                  </pre>
                )}
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-gray-700 p-3">
          {detalle && !editando && (
            <>
              <button
                type="button"
                onClick={comenzarEdicion}
                className="rounded-md border border-gray-500 px-4 py-2 text-sm font-semibold text-gray-100 hover:bg-gray-800"
              >
                Editar
              </button>
              <EliminarComportamiento
                comportamiento={comportamientoSeleccionado}
                onEliminado={manejarEliminado}
              />
              {mostrarSimulacion ? (
                <button
                  type="button"
                  onClick={cancelarSimulacion}
                  className="rounded-md border border-gray-500 px-4 py-2 text-sm font-semibold text-gray-100 hover:bg-gray-800"
                >
                  Cancelar simulación
                </button>
              ) : (
                <button
                  type="button"
                  onClick={simularComportamiento}
                  disabled={simulando}
                  className="rounded-md bg-orange-500 px-4 py-2 text-sm font-bold text-[#17100a] hover:bg-orange-400 disabled:cursor-wait disabled:opacity-60"
                >
                  {simulando ? 'Simulando...' : 'Simular'}
                </button>
              )}
            </>
          )}
          {detalle && editando && (
            <>
              <button
                type="button"
                onClick={cancelarEdicion}
                disabled={guardandoEdicion}
                className="rounded-md border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-800 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarEdicion}
                disabled={guardandoEdicion}
                className="rounded-md bg-green-400 px-4 py-2 text-sm font-semibold text-[#071b16] hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </>
          )}
        </footer>
      </section>
    </div>
  );
}

export default ListaComportamientos;