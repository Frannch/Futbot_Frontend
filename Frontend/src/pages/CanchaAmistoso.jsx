import Cancha from './Cancha.jsx';

function CanchaAmistoso({
  estado,
  finalizado = false,
  pausado = false,
  cambiarPantalla,
  onFinalizar,
  convocatoriaPartido = [],
  jugadoresPartido = [],
  comportamientosPartido = [],
  onSolicitarCambio,
  onCambiarComportamiento,
}) {
  return (
    <Cancha
      estado={estado}
      finalizado={finalizado}
      pausado={pausado}
      cambiarPantalla={cambiarPantalla}
      onFinalizar={onFinalizar}
      convocatoria={convocatoriaPartido}
      jugadores={jugadoresPartido}
      jugadoresControlables={convocatoriaPartido.length ? convocatoriaPartido : undefined}
      jugadoresDatosControlables={jugadoresPartido}
      comportamientos={comportamientosPartido}
      onSolicitarCambio={onSolicitarCambio}
      onCambiarComportamiento={onCambiarComportamiento}
      soloTitulares={false}
    />
  );
}

export default CanchaAmistoso;
