import { useState } from 'react';

export const FORMACIONES = [
  { valor: 1, etiqueta: 'Equilibrada' },
  { valor: 2, etiqueta: 'Defensiva' },
  { valor: 3, etiqueta: 'Ofensiva' }
];

const CANTIDAD_TITULARES = 3;
const CANTIDAD_SUPLENTES = 3;
const MINIMO_JUGADORES = CANTIDAD_TITULARES + CANTIDAD_SUPLENTES;

const claseSelect =
  'w-full rounded bg-[#0d1b13] border border-white/20 text-white text-sm px-3 py-2 ' +
  'focus:outline-none focus:border-green-400 disabled:opacity-40';

const estadoInicialSuplentes = () => [
  { id_jugador: '', comportamiento: '' },
  { id_jugador: '', comportamiento: '' },
  { id_jugador: '', comportamiento: '' }
];

function SelectorConvocatoria({
  jugadores = [],
  comportamientos = [],
  nombreClubDesafiado = 'Club rival',
  abierto = true,
  enviando = false,
  esAceptacion = false,
  mensajeError = '',
  alCerrar,
  alEnviar,
  alCambiar
}) {
  const [formacion, setFormacion] = useState(FORMACIONES[0].valor);
  const [titulares, setTitulares] = useState([
    { id_jugador: '', comportamiento: '' },
    { id_jugador: '', comportamiento: '' },
    { id_jugador: '', comportamiento: '' }
  ]);
  const [suplentes, setSuplentes] = useState(estadoInicialSuplentes);
  const [convocatoriaLista, setConvocatoriaLista] = useState(null);

  if (!abierto) return null;

  const emitir = (nuevosTitulares, nuevosSuplentes, nuevaFormacion) => {
    const elegidos = [
      ...nuevosTitulares.map((titular) => titular.id_jugador),
      ...nuevosSuplentes.map((suplente) => suplente.id_jugador)
    ];
    const sinRepetidos = new Set(elegidos.filter(Boolean)).size === MINIMO_JUGADORES;
    const completa =
      nuevosTitulares.every((titular) => titular.id_jugador && titular.comportamiento) &&
      nuevosSuplentes.every((suplente) => suplente.id_jugador) &&
      sinRepetidos;

    if (!completa) {
      setConvocatoriaLista(null);
      alCambiar?.(null);
      return;
    }

    const nuevaConvocatoria = {
      formacion_tactica: Number(nuevaFormacion),
      jugadores_convocados: [
        ...nuevosTitulares.map((titular) => ({
          id_jugador: Number(titular.id_jugador),
          rol: 'titular',
          comportamiento: titular.comportamiento
        })),
        ...nuevosSuplentes.map((suplente) => ({
          id_jugador: Number(suplente.id_jugador),
          rol: 'suplente',
          comportamiento: null
        }))
      ]
    };

    setConvocatoriaLista(nuevaConvocatoria);
    alCambiar?.(nuevaConvocatoria);
  };

  const cambiarFormacion = (valor) => {
    setFormacion(valor);
    emitir(titulares, suplentes, valor);
  };

  const cambiarTitular = (indice, campo, valor) => {
    const nuevosTitulares = titulares.map((titular, i) => (
      i === indice ? { ...titular, [campo]: valor } : titular
    ));
    setTitulares(nuevosTitulares);
    emitir(nuevosTitulares, suplentes, formacion);
  };

  const cambiarSuplente = (indice, campo, valor) => {
    const nuevosSuplentes = suplentes.map((suplente, i) => (
      i === indice ? { ...suplente, [campo]: valor } : suplente
    ));
    setSuplentes(nuevosSuplentes);
    emitir(titulares, nuevosSuplentes, formacion);
  };

  const elegidos = new Set([
    ...titulares.map((titular) => titular.id_jugador),
    ...suplentes.map((suplente) => suplente.id_jugador)
  ].filter(Boolean));

  const opcionesJugador = (valorActual) => jugadores.map((jugador) => {
    const id = String(jugador.id_jugador);
    return (
      <option key={id} value={id} disabled={elegidos.has(id) && id !== valorActual}>
        {jugador.nombre}
      </option>
    );
  });

  if (jugadores.length < MINIMO_JUGADORES) {
    return (
      <p className="rounded border border-amber-500 bg-amber-500/20 p-3 text-sm text-amber-100">
        Tu club necesita al menos {MINIMO_JUGADORES} jugadores para inscribirse. Tenés {jugadores.length}.
      </p>
    );
  }

  const opcionesComportamiento = (valorActual, indice, prefijo) => (
    <select
      id={`${prefijo}-${indice}`}
      className={claseSelect}
      value={valorActual}
      onChange={(e) => prefijo === 'comportamiento-titular'
        ? cambiarTitular(indice, 'comportamiento', e.target.value)
        : cambiarSuplente(indice, 'comportamiento', e.target.value)}
    >
      <option value="">Elegir comportamiento</option>
      {comportamientos.map((comportamiento) => (
        <option key={comportamiento.id_comportamiento} value={comportamiento.nombre}>
          {comportamiento.nombre}
        </option>
      ))}
    </select>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="selector-convocatoria-titulo">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-white/10 bg-[#122319] p-4 shadow-2xl sm:p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-green-400">Convocatoria amistosa</p>
            <h2 id="selector-convocatoria-titulo" className="mt-1 text-2xl font-bold text-white">{nombreClubDesafiado}</h2>
            {mensajeError && (
              <p className="mt-3 rounded border border-red-500 bg-red-500/20 p-3 text-sm text-red-100">
                {mensajeError}
              </p>
            )}
          </div>
          <button type="button" className="rounded border border-white/20 px-3 py-1 text-sm text-gray-300 hover:border-white/50 hover:text-white" onClick={alCerrar}>
            Cerrar
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="formacion" className="mb-1 block text-sm text-gray-300">Formación Táctica</label>
            <select id="formacion" className={claseSelect} value={formacion} onChange={(e) => cambiarFormacion(Number(e.target.value))}>
              {FORMACIONES.map((formacionDisponible) => (
                <option key={formacionDisponible.valor} value={formacionDisponible.valor}>{formacionDisponible.etiqueta}</option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-bold text-white">Titulares</legend>
            <div className="space-y-3">
              {titulares.map((titular, indice) => (
                <div key={indice} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`titular-${indice}`} className="mb-1 block text-xs text-gray-400">Jugador {indice + 1}</label>
                    <select id={`titular-${indice}`} className={claseSelect} value={titular.id_jugador} onChange={(e) => cambiarTitular(indice, 'id_jugador', e.target.value)}>
                      <option value="">Elegir jugador</option>
                      {opcionesJugador(titular.id_jugador)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`comportamiento-titular-${indice}`} className="mb-1 block text-xs text-gray-400">Comportamiento</label>
                    {opcionesComportamiento(titular.comportamiento, indice, 'comportamiento-titular')}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-bold text-white">Suplentes</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {suplentes.map((suplente, indice) => (
                <div key={indice}>
                  <label htmlFor={`suplente-${indice}`} className="mb-1 block text-xs text-gray-400">Suplente {indice + 1}</label>
                  <select id={`suplente-${indice}`} className={claseSelect} value={suplente.id_jugador} onChange={(e) => cambiarSuplente(indice, 'id_jugador', e.target.value)}>
                    <option value="">Elegir jugador</option>
                    {opcionesJugador(suplente.id_jugador)}
                  </select>
                </div>
              ))}
            </div>
          </fieldset>

          <div className="flex justify-end border-t border-white/10 pt-4">
            <button type="button" className="mr-3 rounded border border-white/20 px-5 py-2 font-semibold text-gray-200 hover:border-white/50 hover:text-white" onClick={alCerrar}>
              Cancelar
            </button>
            <button type="button" className="rounded bg-green-500 px-5 py-2 font-semibold text-black enabled:hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-40" disabled={!convocatoriaLista || enviando} onClick={() => alEnviar?.(convocatoriaLista)}>
              {enviando
                ? (esAceptacion ? 'Aceptando desafío...' : 'Enviando desafío...')
                : (esAceptacion ? 'Aceptar desafío' : 'Enviar desafío')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SelectorConvocatoria;
