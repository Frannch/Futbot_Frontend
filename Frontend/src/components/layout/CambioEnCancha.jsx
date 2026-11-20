import { useEffect, useRef, useState } from 'react';

function obtenerNombre(idJugador, jugadoresPorId) {
  const jugador = jugadoresPorId.get(String(idJugador));
  return jugador?.nombre || jugador?.name || `Jugador ${idJugador}`;
}

function CambioEnCancha({
  jugadoresEnCancha = [],
  convocatoria = [],
  jugadores = [],
  onSolicitarCambio,
  deshabilitado = false,
  pausado = false,
}) {
  const [idJugadorSale, setIdJugadorSale] = useState('');
  const [idJugadorEntra, setIdJugadorEntra] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const pausadoAnterior = useRef(pausado);
  const jugadoresPorId = new Map(
    jugadores.map((jugador) => [
      String(jugador.id_jugador ?? jugador.id),
      jugador,
    ])
  );
  const idsEnCancha = new Set(jugadoresEnCancha.map((jugador) => String(jugador.id)));
  const suplentes = convocatoria.filter((jugador) => (
    jugador.rol === 'suplente'
    && !idsEnCancha.has(String(jugador.id_jugador ?? jugador.id))
  ));

  useEffect(() => {
    if (pausadoAnterior.current && !pausado) {
      setMensaje('');
    }
    pausadoAnterior.current = pausado;
  }, [pausado]);

  const solicitarCambio = async (evento) => {
    evento.preventDefault();
    if (!idJugadorSale || !idJugadorEntra || deshabilitado || enviando) return;

    setEnviando(true);
    setMensaje('');
    try {
      const resultado = await onSolicitarCambio({
        id_jugador_sale: Number(idJugadorSale),
        id_jugador_entra: Number(idJugadorEntra),
      });
      setMensaje(resultado?.mensaje || 'Cambio solicitado para la próxima pausa.');
      setIdJugadorSale('');
      setIdJugadorEntra('');
    } catch (error) {
      setMensaje(error.message || 'No se pudo solicitar el cambio.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form
      className="space-y-4 rounded-md bg-[#101b44] p-4 text-white"
      onSubmit={solicitarCambio}
      aria-labelledby="titulo-cambio-en-cancha"
    >
      <h2 id="titulo-cambio-en-cancha" className="text-lg font-bold">
        Cambio de jugador
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="jugador-sale" className="mb-1 block text-sm text-gray-300">
            Sale del partido
          </label>
          <select
            id="jugador-sale"
            value={idJugadorSale}
            onChange={(evento) => setIdJugadorSale(evento.target.value)}
            disabled={deshabilitado || enviando || jugadoresEnCancha.length === 0}
            required
            className="w-full rounded border border-white/20 bg-[#0d1b13] px-3 py-2 text-sm text-white focus:border-green-400 focus:outline-none disabled:opacity-50"
          >
            <option value="">Elegir jugador en cancha</option>
            {jugadoresEnCancha.map((jugador) => {
              const id = jugador.id;
              return (
                <option key={id} value={id}>
                  {obtenerNombre(id, jugadoresPorId)}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label htmlFor="jugador-entra" className="mb-1 block text-sm text-gray-300">
            Entra desde el banco
          </label>
          <select
            id="jugador-entra"
            value={idJugadorEntra}
            onChange={(evento) => setIdJugadorEntra(evento.target.value)}
            disabled={deshabilitado || enviando || suplentes.length === 0}
            required
            className="w-full rounded border border-white/20 bg-[#0d1b13] px-3 py-2 text-sm text-white focus:border-green-400 focus:outline-none disabled:opacity-50"
          >
            <option value="">Elegir suplente</option>
            {suplentes.map((jugador) => {
              const id = jugador.id_jugador ?? jugador.id;
              return (
                <option key={id} value={id}>
                  {obtenerNombre(id, jugadoresPorId)}
                </option>
              );
            })}
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={deshabilitado || enviando || !idJugadorSale || !idJugadorEntra}
        className="rounded border border-cyan-400 px-4 py-2 text-sm font-semibold text-cyan-300 transition-colors enabled:hover:bg-cyan-400 enabled:hover:text-[#060b11] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enviando ? 'Enviando...' : 'Solicitar cambio'}
      </button>
      {mensaje && <p role="status" className="text-sm text-gray-200">{mensaje}</p>}
    </form>
  );
}

export default CambioEnCancha;
