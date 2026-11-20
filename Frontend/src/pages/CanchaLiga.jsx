import Cancha from './Cancha.jsx';

function CanchaLiga({
  estado,
  finalizado = false,
  pausado = false,
  convocatoria: convocatoriaProp,
  jugadores: jugadoresProp,
  comportamientos: comportamientosProp,
  jugadoresControlables,
  puedeControlar = false,
  onCerrar,
  onSolicitarCambio,
  onCambiarComportamiento,
}) {
  const convocatoria = convocatoriaProp ?? estado?.convocatorias ?? estado?.convocatoria ?? [];
  const jugadores = jugadoresProp ?? estado?.jugadores ?? [];
  const comportamientos = comportamientosProp ?? estado?.comportamientos ?? [];
  const jugadoresDelClub = new Map(
    (jugadoresControlables ?? jugadores).map((jugador) => [
      String(jugador.id_jugador ?? jugador.id),
      jugador,
    ]),
  );
  const jugadoresCatalogo = convocatoria.map((convocado) => {
    const id = String(convocado.id_jugador ?? convocado.id);
    const jugador = jugadoresDelClub.get(id) ?? {};
    return {
      ...jugador,
      ...convocado,
      id_jugador: convocado.id_jugador ?? jugador.id_jugador ?? jugador.id,
      nombre: convocado.nombre
        ?? convocado.name
        ?? jugador.nombre
        ?? jugador.name,
    };
  });

  return (
    <Cancha
      estado={estado}
      finalizado={finalizado}
      pausado={pausado}
      convocatoria={convocatoria}
      jugadores={jugadores}
      jugadoresControlables={jugadoresCatalogo}
      jugadoresDatosControlables={jugadoresCatalogo}
      filtrarPorConvocatoria={false}
      comportamientos={comportamientos}
      puedeControlar={puedeControlar}
      onCerrar={onCerrar}
      onSolicitarCambio={onSolicitarCambio}
      onCambiarComportamiento={onCambiarComportamiento}
      soloTitulares={false}
    />
  );
}

export default CanchaLiga;
