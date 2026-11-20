import { useState, useEffect, useRef } from 'react';

export default function ModalDesafio({
  clubLocal = { nombre: '' },
  clubRival = { nombre: '' },
  segundosIniciales = 300,
  mensaje = 'Esperando respuesta del rival...',
  titulo = '¡DESAFÍO ENVIADO!',
  oculto = false,
  onDescartar,
  onTiempoExpirado,
  children
}) {
  const [segundosRestantes, setSegundosRestantes] = useState(() => (
    Math.max(0, Number(segundosIniciales))
  ));
  const onTiempoExpiradoRef = useRef(onTiempoExpirado);
  const expiradoRef = useRef(false);

  onTiempoExpiradoRef.current = onTiempoExpirado;

  useEffect(() => {
    setSegundosRestantes(Math.max(0, Number(segundosIniciales)));
    expiradoRef.current = false;
  }, [segundosIniciales]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          if (!expiradoRef.current) {
            expiradoRef.current = true;
            onTiempoExpiradoRef.current?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Formato mm:ss (ej: 00:45)
  const minutos = String(Math.floor(segundosRestantes / 60)).padStart(2, '0');
  const segundos = String(segundosRestantes % 60).padStart(2, '0');

  if (oculto) return null;

  return (
    // Overlay que bloquea toda la pantalla (con onClick para que se pueda cerrar)
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm select-none">
      
      
      <div className="relative w-full max-w-2xl mx-4 bg-[#1a237e] rounded-xl p-8 shadow-2xl flex flex-col items-center text-white">
        {onDescartar && (
          <button
            type="button"
            aria-label="Cerrar notificación"
            title="Cerrar notificación"
            onClick={onDescartar}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded text-xl text-white/70 hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        )}
        
        <h3 className="text-3xl font-bold mb-10 text-center">
          {titulo}
        </h3>

        {/* Clubes que se enfrentan */}
        <div className="flex items-center justify-between w-full max-w-md px-4 mb-8">
          <div className="flex flex-col items-center">
            <span className="text-lg font-semibold text-white/90 max-w-[160px] truncate text-center">
              {clubLocal.nombre}
            </span>
          </div>

          <span className="text-xl font-black text-green-300 italic px-2">
            VS
          </span>

          <div className="flex flex-col items-center">
            <span className="text-lg font-semibold text-white/90 max-w-[160px] truncate text-center">
              {clubRival.nombre}
            </span>
          </div>
        </div>

        {/* Círculo del Temporizador */}
        <div className="w-32 h-32 rounded-full border-4 border-green-300/40 flex items-center justify-center my-2 bg-[#0d1b13]/40 shadow-[0_0_15px_rgba(134,239,172,0.2)]">
          <span className="text-4xl font-mono font-bold tracking-wider text-white">
            {minutos}:{segundos}
          </span>
        </div>

        {/* Mensaje de espera */}
        <p className="text-base font-medium text-white mt-6 text-center">
          {mensaje}
        </p>
        <span className="text-sm text-white/70 mt-1 text-center">
          La ventana se cerrará si no responde.
        </span>

        {children}
        
      </div>
    </div>
  );
}