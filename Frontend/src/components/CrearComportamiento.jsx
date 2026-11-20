import { useState } from 'react';
import { crearComportamiento } from '../services/ComportamientoService';

const sensores = [
  ['mi_posicion()', '(jugador_x, jugador_y)'],
  ['posicion_pelota()', '(pelota_x, pelota_y)'],
  ['puedo_patear()', 'True o False'],
  ['id_propio()', 'id del jugador'],
  ['posicion_arco_propio()', '(arco_x, arco_y)'],
  ['posicion_arco_rival()', '(arco_x, arco_y)'],
  ['tiempo_restante()', 'tiempo restante'],
  ['marcador()', '(goles_propios, goles_rivales)'],
  ['jugadores_propios()', 'lista de jugadores'],
  ['jugadores_rivales()', 'lista de jugadores'],
  ['distancia_a(x, y)', 'distancia al punto'],
];

const acciones = [
  ['correr(x, y, altura)', 'Mueve al jugador al destino.'],
  ['patear(x, y, altura)', 'Patea hacia el destino con potencia normal.'],
  ['patearConFuerza(x, y, altura)', 'Patea hacia el destino con mayor potencia.'],
];

const alturas = ['Z_ALTO', 'Z_MEDIO', 'Z_BAJO'];

const funcionesAuxiliares = [
  ['perseguir_pelota()', 'Corre hacia la pelota con Z_ALTO.'],
  ['perseguir_jugador(jugador)', 'Corre hacia jugador[x, y] con Z_ALTO.'],
  ['rematar_al_arco()', 'Patea al arco rival con Z_ALTO.'],
  ['pasar_a(compañero)', 'Patea hacia compañero[x, y] con Z_BAJO.'],
  ['cubrir_posicion(x, y)', 'Corre a (x, y) con Z_MEDIO.'],
];

function CrearComportamiento({ onCreated, onCancel }) {
  const [nombre, setNombre] = useState('');
  const [codigoPython, setCodigoPython] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const manejarEnvio = async (event) => {
    event.preventDefault();
    setError('');
    setGuardando(true);

    try {
      const resultado = await crearComportamiento(nombre.trim(), codigoPython);
      onCreated(resultado);
    } catch (errorSolicitud) {
      setError(errorSolicitud.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]" aria-labelledby="crear-comportamiento-titulo">
      <form onSubmit={manejarEnvio} className="space-y-6">
        <div className="mb-6 flex flex-col gap-4 border-b border-gray-700 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="crear-comportamiento-titulo" className="text-2xl font-bold text-white">
            Nuevo comportamiento
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={guardando}
              className="rounded-md border border-gray-600 px-5 py-2.5 font-semibold text-gray-200 transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || !nombre.trim() || !codigoPython.trim()}
              className="rounded-md bg-green-400 px-5 py-2.5 font-bold text-[#071b16] transition-colors hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Crear comportamiento'}
            </button>
          </div>
        </div>

        <div className="max-w-xl">
          <label htmlFor="nombre-comportamiento" className="mb-2 block text-sm font-semibold text-gray-200">
            Nombre
          </label>
          <input
            id="nombre-comportamiento"
            name="nombre"
            type="text"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            required
            maxLength={60}
            autoComplete="off"
            className="w-full rounded-md border border-gray-600 bg-[#11151f] px-4 py-3 text-white outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
            placeholder="Ej. Ataque rápido"
          />
        </div>

        <div>
          <label htmlFor="codigo-python" className="mb-2 block text-sm font-semibold text-gray-200">
            Código Python
          </label>
          <div className="overflow-hidden rounded-md border border-gray-700 bg-[#080b12] focus-within:border-green-400">
            <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2 text-xs text-gray-400">
              <span>python</span>
            </div>
            <textarea
              id="codigo-python"
              name="codigo_python"
              value={codigoPython}
              onChange={(event) => setCodigoPython(event.target.value)}
              required
              spellCheck="false"
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              className="min-h-[320px] w-full resize-y bg-transparent px-4 py-4 font-mono text-sm leading-6 text-green-100 outline-none"
              placeholder={'if puedo_patear():\n    rematar_al_arco()\nelse:\n    pelota_x, pelota_y = posicion_pelota()\n    correr(pelota_x, pelota_y, Z_ALTO)'}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

      </form>
      <aside className="h-fit max-h-[75vh] space-y-5 overflow-y-auto rounded-md border border-gray-700 bg-[#11151f] p-4">
        <section>
          <h3 className="mb-3 text-sm font-semibold text-gray-200">Sensores y retornos</h3>
          <ul className="space-y-2 text-xs">
            {sensores.map(([firma, retorno]) => (
              <li key={firma} className="flex flex-wrap items-baseline gap-x-1">
                <code className="font-mono text-green-200">{firma}</code>
                <span className="text-gray-400">= {retorno}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-gray-700 pt-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-200">Acciones</h3>
          <ul className="space-y-3 text-xs">
            {acciones.map(([firma, descripcion]) => (
              <li key={firma}>
                <code className="block break-words font-mono text-green-200">{firma}</code>
                <span className="text-gray-400">{descripcion}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-gray-400">
            Alturas: {alturas.map((altura, indice) => (
              <span key={altura}>
                {indice > 0 ? ', ' : ''}<code className="font-mono text-green-200">{altura}</code>
              </span>
            ))}
          </p>
          <p className="mt-2 text-xs text-gray-400">
            El motor agrega vista, primitivas y accion internamente cuando corresponde. La diferencia entre patear y patearConFuerza es la potencia.
          </p>
        </section>

        <section className="border-t border-gray-700 pt-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-200">Funciones auxiliares</h3>
          <ul className="space-y-3 text-xs">
            {funcionesAuxiliares.map(([firma, descripcion]) => (
              <li key={firma}>
                <code className="block break-words font-mono text-green-200">{firma}</code>
                <span className="text-gray-400">{descripcion}</span>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </section>
  );
}

export default CrearComportamiento;