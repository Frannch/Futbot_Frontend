import { useEffect, useState } from 'react';

function obtenerNombre(jugador) {
  return jugador.nombre || jugador.name || `Jugador ${jugador.id}`;
}

function obtenerIdComportamiento(jugador) {
  return jugador.id_comportamiento ?? jugador.comportamiento_id ?? '';
}

function ComportamientosEnCancha({
  jugadoresEnCancha = [],
  comportamientos = [],
  onCambiarComportamiento,
  deshabilitado = false,
}) {
  const [valores, setValores] = useState({});
  const [jugadorEnviando, setJugadorEnviando] = useState(null);
  const [mensajes, setMensajes] = useState({});
  const [idsPorPosicion, setIdsPorPosicion] = useState([]);

  useEffect(() => {
    const idsActuales = jugadoresEnCancha.map((jugador) => String(jugador.id));
    setIdsPorPosicion((posiciones) => {
      const idsEntrantes = new Set(idsActuales);
      const posicionesActualizadas = posiciones.map((id) => (
        id && idsEntrantes.has(id) ? id : null
      ));
      const idsAsignados = new Set(posicionesActualizadas.filter(Boolean));
      const idsNuevos = idsActuales.filter((id) => !idsAsignados.has(id));

      idsNuevos.forEach((id) => {
        const posicionLibre = posicionesActualizadas.indexOf(null);
        if (posicionLibre === -1) {
          posicionesActualizadas.push(id);
        } else {
          posicionesActualizadas[posicionLibre] = id;
        }
      });

      return posicionesActualizadas;
    });
  }, [jugadoresEnCancha]);

  const cambiarValor = (idJugador, valor) => {
    setValores((actuales) => ({ ...actuales, [idJugador]: valor }));
  };

  const solicitarCambio = async (evento, jugador) => {
    evento.preventDefault();
    const idJugador = jugador.id;
    const idComportamiento = valores[idJugador] ?? obtenerIdComportamiento(jugador);

    if (!idComportamiento || deshabilitado || jugadorEnviando !== null) return;

    setJugadorEnviando(idJugador);
    setMensajes((actuales) => ({ ...actuales, [idJugador]: '' }));
    try {
      const resultado = await onCambiarComportamiento({
        id_jugador: Number(idJugador),
        id_comportamiento: Number(idComportamiento),
      });
      setMensajes((actuales) => ({
        ...actuales,
        [idJugador]: resultado?.mensaje || 'Comportamiento actualizado para el próximo tick.',
      }));
    } catch (error) {
      setMensajes((actuales) => ({
        ...actuales,
        [idJugador]: error.message || 'No se pudo actualizar el comportamiento.',
      }));
    } finally {
      setJugadorEnviando(null);
    }
  };

  return (
    <section
      className="space-y-4 rounded-md bg-[#101b44] p-4 text-white"
      aria-labelledby="titulo-comportamientos-en-cancha"
    >
      <h2 id="titulo-comportamientos-en-cancha" className="text-lg font-bold">
        Comportamiento de jugadores
      </h2>
      {jugadoresEnCancha.length === 0 && (
        <p className="text-sm text-gray-300">No hay jugadores disponibles.</p>
      )}
      {idsPorPosicion.map((idJugador, posicion) => {
        const jugador = jugadoresEnCancha.find(
          (jugadorActual) => String(jugadorActual.id) === idJugador
        );
        if (!jugador) return null;

        const valorActual = valores[idJugador] ?? obtenerIdComportamiento(jugador);
        const enviando = jugadorEnviando === idJugador;

        return (
          <form
            key={`posicion-${posicion}`}
            className="space-y-2 border-b border-white/10 pb-3 last:border-b-0 last:pb-0"
            onSubmit={(evento) => solicitarCambio(evento, jugador)}
          >
            <label
              htmlFor={`comportamiento-jugador-${idJugador}`}
              className="block text-sm font-semibold text-gray-200"
            >
              {obtenerNombre(jugador)}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                id={`comportamiento-jugador-${idJugador}`}
                aria-label={`Comportamiento de ${obtenerNombre(jugador)}`}
                value={valorActual}
                onChange={(evento) => cambiarValor(idJugador, evento.target.value)}
                disabled={deshabilitado || enviando}
                required
                className="min-w-0 flex-1 rounded border border-white/20 bg-[#0d1b13] px-3 py-2 text-sm text-white focus:border-green-400 focus:outline-none disabled:opacity-50"
              >
                <option value="">Elegir comportamiento</option>
                {comportamientos.map((comportamiento) => (
                  <option
                    key={comportamiento.id_comportamiento}
                    value={comportamiento.id_comportamiento}
                  >
                    {comportamiento.nombre}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={deshabilitado || enviando || !valorActual}
                className="rounded border border-cyan-400 px-3 py-2 text-sm font-semibold text-cyan-300 transition-colors enabled:hover:bg-cyan-400 enabled:hover:text-[#060b11] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {enviando ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
            {mensajes[idJugador] && (
              <p role="status" className="text-sm text-gray-200">{mensajes[idJugador]}</p>
            )}
          </form>
        );
      })}
    </section>
  );
}

export default ComportamientosEnCancha;
