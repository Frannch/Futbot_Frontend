import { useState } from 'react';

// codigos de formacion (formacion_tactica es un int)
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

/*
arma la convocatoria: 3 titulares con comportamiento y 3 suplentes sin comportamiento.
le avisa al padre por alCambiar, mandandole null mientras este incompleta.
lo van a usar tambien unirse a liga y los amistosos, por eso esta aparte
*/
function SelectorConvocatoria({
  jugadores = [],
  comportamientos = [],
  alCambiar,
  convocatoriaInicial = null,
}) {

    //Estados de la convocatoria
  const [formacion, setFormacion] = useState(
    convocatoriaInicial?.formacion_tactica ?? FORMACIONES[0].valor
  );
  const detallesIniciales = convocatoriaInicial?.jugadores_convocados ?? [];
  const titularesIniciales = detallesIniciales
    .filter((jugador) => jugador.rol === 'titular')
    .map((jugador) => ({
      id_jugador: String(jugador.id_jugador),
      comportamiento: jugador.comportamiento ?? '',
    }));
  const suplentesIniciales = detallesIniciales
    .filter((jugador) => jugador.rol === 'suplente')
    .map((jugador) => String(jugador.id_jugador));
  const [titulares, setTitulares] = useState(() => (
    Array.from({ length: CANTIDAD_TITULARES }, (_, indice) => (
      titularesIniciales[indice] ?? { id_jugador: '', comportamiento: '' }
    ))
  ));
  const [suplentes, setSuplentes] = useState(() => (
    Array.from({ length: CANTIDAD_SUPLENTES }, (_, indice) => (
      suplentesIniciales[indice] ?? ''
    ))
  ));

  /*
  arma el objeto que espera el endpoint y se lo pasa al padre.
  drecibe los valores nuevos por parametro porque los setState no son
  inmediatos: si leyeramos el estado aca todavia tendria el valor viejo
  */
  const emitir = (nuevosTitulares, nuevosSuplentes, nuevaFormacion) => {
    const elegidos = [...nuevosTitulares.map((t) => t.id_jugador), ...nuevosSuplentes];
    const sinRepetidos = new Set(elegidos.filter(Boolean)).size === MINIMO_JUGADORES;

    const completa =
      nuevosTitulares.every((t) => t.id_jugador && t.comportamiento) &&
      nuevosSuplentes.every(Boolean) &&
      sinRepetidos;

    if (!completa) {
      if (alCambiar) alCambiar(null);
      return;
    }

    if (alCambiar) {
      alCambiar({
        formacion_tactica: nuevaFormacion,
        jugadores_convocados: [
          ...nuevosTitulares.map((t) => ({
            id_jugador: Number(t.id_jugador),
            rol: 'titular',
            comportamiento: t.comportamiento
          })),
          ...nuevosSuplentes.map((id) => ({ id_jugador: Number(id), rol: 'suplente' }))
        ]
      });
    }
  };

  const cambiarFormacion = (valor) => {
    setFormacion(valor);
    emitir(titulares, suplentes, valor);
  };

  const cambiarTitular = (indice, campo, valor) => {
    const nuevos = titulares.map((titular, i) => (
      i === indice ? { ...titular, [campo]: valor } : titular
    ));
    setTitulares(nuevos);
    emitir(nuevos, suplentes, formacion);
  };

  const cambiarSuplente = (indice, valor) => {
    const nuevos = suplentes.map((id, i) => (i === indice ? valor : id));
    setSuplentes(nuevos);
    emitir(titulares, nuevos, formacion);
  };

    //Jugadores que ya estan puestos en algun lugar de la convocatoria
  const elegidos = new Set(
    [...titulares.map((t) => t.id_jugador), ...suplentes].filter(Boolean)
  );

  // deshabilita al jugador que ya esta elegido en otro select
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

  return (
    <div className="space-y-6">

      {/* formacion tactica */}
      <div>
        <label htmlFor="formacion" className="mb-1 block text-sm text-gray-300">
          Formación Táctica
        </label>
        <select
          id="formacion"
          className={claseSelect}
          value={formacion}
          onChange={(e) => cambiarFormacion(Number(e.target.value))}
        >
          {FORMACIONES.map((f) => (
            <option key={f.valor} value={f.valor}>{f.etiqueta}</option>
          ))}
        </select>
      </div>

      {/* los 3 titulares, cada uno con su comportamiento */}
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-white">Titulares</legend>
        <div className="space-y-3">
          {titulares.map((titular, indice) => (
            <div key={indice} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label htmlFor={`titular-${indice}`} className="mb-1 block text-xs text-gray-400">
                  Jugador {indice + 1}
                </label>
                <select
                  id={`titular-${indice}`}
                  className={claseSelect}
                  value={titular.id_jugador}
                  onChange={(e) => cambiarTitular(indice, 'id_jugador', e.target.value)}
                >
                  <option value="">Elegir jugador</option>
                  {opcionesJugador(titular.id_jugador)}
                </select>
              </div>
              <div>
                <label htmlFor={`comportamiento-${indice}`} className="mb-1 block text-xs text-gray-400">
                  Comportamiento {indice + 1}
                </label>
                <select
                  id={`comportamiento-${indice}`}
                  className={claseSelect}
                  value={titular.comportamiento}
                  onChange={(e) => cambiarTitular(indice, 'comportamiento', e.target.value)}
                >
                  <option value="">Elegir comportamiento</option>
                  {comportamientos.map((c) => (
                    <option key={c.id_comportamiento} value={c.nombre}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      {/* los 3 suplentes, sin comportamiento */}
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-white">Suplentes</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {suplentes.map((id, indice) => (
            <div key={indice}>
              <label htmlFor={`suplente-${indice}`} className="mb-1 block text-xs text-gray-400">
                Suplente {indice + 1}
              </label>
              <select
                id={`suplente-${indice}`}
                className={claseSelect}
                value={id}
                onChange={(e) => cambiarSuplente(indice, e.target.value)}
              >
                <option value="">Elegir jugador</option>
                {opcionesJugador(id)}
              </select>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-400">Los suplentes no llevan comportamiento asignado.</p>
      </fieldset>
    </div>
  );
}

export default SelectorConvocatoria;