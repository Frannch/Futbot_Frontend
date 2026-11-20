import { useEffect, useState } from 'react';

const INTERVALO_FRAME_MS = 220;

function SimulacionComportamiento({ simulacion, nombre }) {
  const frames = Array.isArray(simulacion?.frames) ? simulacion.frames : [];
  const ancho = Number(simulacion?.ancho_cancha);
  const alto = Number(simulacion?.alto_cancha);
  const dimensionesValidas = Number.isFinite(ancho) && ancho > 0
    && Number.isFinite(alto) && alto > 0;
  const [frameActual, setFrameActual] = useState(frames[0]);

  useEffect(() => {
    setFrameActual(frames[0]);
  }, [simulacion]);

  useEffect(() => {
    if (frames.length < 2) return undefined;

    let inicioReproduccion;
    let idAnimacion;

    const interpolar = (inicio, fin, factor) => inicio + (fin - inicio) * factor;
    const interpolarPunto = (inicio, fin, factor) => ({
      x: interpolar(inicio.x, fin.x, factor),
      y: interpolar(inicio.y, fin.y, factor),
    });

    const animar = (ahora) => {
      inicioReproduccion ??= ahora;
      const tiempoTranscurrido = ahora - inicioReproduccion;
      const duracionTotal = (frames.length - 1) * INTERVALO_FRAME_MS;

      if (tiempoTranscurrido >= duracionTotal) {
        setFrameActual(frames[frames.length - 1]);
        return;
      }

      const indiceInicio = Math.floor(tiempoTranscurrido / INTERVALO_FRAME_MS);
      const factor = (tiempoTranscurrido % INTERVALO_FRAME_MS) / INTERVALO_FRAME_MS;
      const inicio = frames[indiceInicio];
      const fin = frames[indiceInicio + 1];

      setFrameActual({
        tick: factor < 1 ? inicio.tick : fin.tick,
        jugador: interpolarPunto(inicio.jugador, fin.jugador, factor),
        companero: interpolarPunto(inicio.companero, fin.companero, factor),
        pelota: interpolarPunto(inicio.pelota, fin.pelota, factor),
      });
      idAnimacion = window.requestAnimationFrame(animar);
    };

    idAnimacion = window.requestAnimationFrame(animar);

    return () => window.cancelAnimationFrame(idAnimacion);
  }, [simulacion]);

  const frame = frameActual ?? frames[0];
  const radioJugador = dimensionesValidas ? Math.min(ancho, alto) * 0.035 : 2;
  const radioPelota = radioJugador * 0.48;
  const marcas = dimensionesValidas ? {
    medioX: ancho / 2,
    medioY: alto / 2,
    radioCentro: Math.min(ancho, alto) * 0.15,
    areaAncho: ancho * 0.16,
    areaAlto: alto * 0.6,
    arcoAncho: ancho * 0.055,
    arcoAlto: alto * 0.27,
  } : null;

  if (!dimensionesValidas || frames.length === 0) {
    return (
      <section className="flex h-full items-center justify-center" role="status">
        <p className="text-sm text-gray-300">No hay datos de simulación para mostrar.</p>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 items-center justify-center" aria-label={`Simulación de ${nombre ?? 'comportamiento'}`}>
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Cancha de simulación de ${nombre ?? 'comportamiento'}`}
        className="block h-full min-h-0 w-full"
        style={{ aspectRatio: `${ancho} / ${alto}`, backgroundColor: '#16803c' }}
      >
        <defs>
          <pattern id="simulacion-rayas-cesped" width={ancho / 10} height={alto} patternUnits="userSpaceOnUse">
            <rect width={ancho / 20} height={alto} fill="#ffffff" opacity="0.035" />
          </pattern>
        </defs>
        <rect width={ancho} height={alto} fill="#16803c" />
        <rect width={ancho} height={alto} fill="url(#simulacion-rayas-cesped)" />
        <g fill="none" stroke="#b7f7c4" strokeWidth={Math.min(ancho, alto) * 0.007} opacity="0.86">
          <rect x="0" y="0" width={ancho} height={alto} />
          <line x1={marcas.medioX} y1="0" x2={marcas.medioX} y2={alto} />
          <circle cx={marcas.medioX} cy={marcas.medioY} r={marcas.radioCentro} />
          <circle cx={marcas.medioX} cy={marcas.medioY} r={Math.min(ancho, alto) * 0.012} fill="#b7f7c4" />
          <rect x="0" y={marcas.medioY - marcas.areaAlto / 2} width={marcas.areaAncho} height={marcas.areaAlto} />
          <rect x={ancho - marcas.areaAncho} y={marcas.medioY - marcas.areaAlto / 2} width={marcas.areaAncho} height={marcas.areaAlto} />
          <rect x="0" y={marcas.medioY - marcas.arcoAlto / 2} width={marcas.arcoAncho} height={marcas.arcoAlto} />
          <rect x={ancho - marcas.arcoAncho} y={marcas.medioY - marcas.arcoAlto / 2} width={marcas.arcoAncho} height={marcas.arcoAlto} />
        </g>

        <g transform={`translate(${frame.jugador.x} ${frame.jugador.y})`}>
          <circle r={radioJugador} fill="#38bdf8" stroke="#ffffff" strokeWidth={radioJugador * 0.16} />
          <text y={radioJugador * 0.34} textAnchor="middle" fontSize={radioJugador * 0.88} fontWeight="800" fill="#0f172a">1</text>
          <title>Jugador simulado</title>
        </g>
        <g transform={`translate(${frame.companero.x} ${frame.companero.y})`}>
          <circle r={radioJugador} fill="#fb923c" stroke="#ffffff" strokeWidth={radioJugador * 0.16} />
          <text y={radioJugador * 0.34} textAnchor="middle" fontSize={radioJugador * 0.88} fontWeight="800" fill="#0f172a">2</text>
          <title>Compañero</title>
        </g>
        <circle cx={frame.pelota.x} cy={frame.pelota.y} r={radioPelota} fill="#ffffff" stroke="#0f172a" strokeWidth={radioPelota * 0.2}>
          <title>Pelota</title>
        </circle>
      </svg>
    </section>
  );
}

export default SimulacionComportamiento;
