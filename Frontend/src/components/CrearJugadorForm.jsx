import { useState } from 'react';
import InputTexto from '../components/InputTexto';
import BotonPrimario from '../components/BotonPrimario';
import { crearJugador } from '../services/JugadorService';

// Constantes globales para evitar valores numéricos directos
const STAT_MIN = 20;
const STAT_MAX = 100;
const TOTAL_PUNTOS = 300;

// Valores predeterminados de las estadísticas.
// 60 * 5 = 300 puntos.
const STATS_PREDETERMINADOS = {
  velocidad: 60,
  fuerza: 60,
  potencia: 60,
  agilidad: 60,
  control: 60,
};

function CrearJugadorForm({ onCreated, onCancel }) {
  // Estados
  const [nombre, setNombre] = useState('');
  const [stats, setStats] = useState({...STATS_PREDETERMINADOS,});
  const [enviando, setEnviando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  // Cálculos y validaciones
  const total = Object.values(stats).reduce(
    (suma, valor) => suma + valor,
    0
  );

  const nombreValido =
    nombre.trim().length >= 1 &&
    nombre.trim().length <= 50;

    // valido si todas las stats están dentro del rango permitido
  const statsValidos = Object.values(stats).every(
    (valor) => valor >= STAT_MIN && valor <= STAT_MAX
  );
  const totalValido = total === TOTAL_PUNTOS;

  // Validación general del formulario para habilitar o deshabilitar el botón de envío
  const formularioValido = nombreValido && statsValidos;

  // Cambio de nombre
  const manejarNombre = (e) => {
    setNombre(e.target.value);
  };

  // Manejo de estadísticas
  // statModificada: nombre de la estadística que se está modificando
  // nuevoValor: nuevo valor de la estadística
  const manejarStat = (statModificada, nuevoValor) => {
    // Convertimos el valor a número para evitar problemas de tipo
    nuevoValor = Number(nuevoValor);
  
    const valorAnterior = stats[statModificada];
    const diferencia = nuevoValor - valorAnterior;
  
    if (diferencia === 0) {
      return;
    }
  
    const nuevosStats = {
      ...stats,
      [statModificada]: nuevoValor,
    };
    
    setStats(nuevosStats);
  };

  // Restablecer estadísticas
  const restablecerStats = () => {
    setStats({...STATS_PREDETERMINADOS});
  };

  // Crear jugador
  const manejarCrear = async (e) => {
    e.preventDefault();

    if (!formularioValido || enviando) {
      return;
    }

    // Se limpian los mensajes previos
    setMensajeError('');
    setMensajeExito('');
    setEnviando(true);

    try {
      const token = localStorage.getItem('token');

      // Invocamos al servicio para crear el jugador
      const data = await crearJugador(nombre.trim(), stats, token);
      
      // Creamos un objeto jugador con los datos devueltos por la API
      const jugador = {
        id: data.id,
        nombre: data.name,
        ...stats,
      };
      console.log('Jugador creado:', data.id, data.name, stats);
      setMensajeExito('Jugador creado con éxito.');
    
      if (onCreated) {
        onCreated(jugador);
      }
    } catch (error) {
      console.error('Error al crear jugador:', error);
  
      if ([400, 403, 409].includes(error?.status)) {
        setMensajeError(error.message);
      } else if (error?.status === 401) {
        setMensajeError('Sesión expirada o no autorizada. Inicia sesión nuevamente.');
      } else if (!error?.status) {
        setMensajeError('Error de conexión con el servidor.');
      } else {
        setMensajeError('Ocurrió un error inesperado al crear el jugador.');
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:items-center">

      <section className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl bg-[#1a237e] p-5 shadow-xl sm:p-6">

        {/* Título */}
        <h2 className="mb-6 text-2xl font-bold text-white">
          CREAR JUGADOR
        </h2>
        {mensajeError && (
          <p className="mb-4 rounded border border-red-500 bg-red-500/20 p-3 text-sm text-red-100">
            {mensajeError}
          </p>
        )}
        
        {mensajeExito && (
          <p className="mb-4 rounded border border-green-500 bg-green-500/20 p-3 text-sm text-green-100">
            {mensajeExito}
          </p>
        )}

        <form onSubmit={manejarCrear} noValidate>

          {/* Nombre */}
          <div className="mb-6">
            <InputTexto
              label="Nombre del jugador"
              id="nombre-jugador"
              valor={nombre}
              alCambiar={manejarNombre}
              required
            />

            {nombre.length > 0 && !nombreValido && (
              <p className="mt-1 text-sm text-red-400">
                El nombre debe tener entre 1 y 50 caracteres.
              </p>
            )}
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-x-4 gap-y-3">

            <StatSlider
              nombre="Velocidad"
              valor={stats.velocidad}
              alCambiar={(valor) => manejarStat('velocidad', valor) }
            />

            <StatSlider
              nombre="Fuerza"
              valor={stats.fuerza}
              alCambiar={(valor) => manejarStat('fuerza', valor) }
            />

            <StatSlider
              nombre="Potencia"
              valor={stats.potencia}
              alCambiar={(valor) => manejarStat('potencia', valor) }
            />

            <div className="col-span-3 flex justify-center gap-x-4">
              <div className="w-1/3">
                <StatSlider
                  nombre="Agilidad"
                  valor={stats.agilidad}
                  alCambiar={(valor) => manejarStat('agilidad', valor) }
                />
              </div>

              <div className="w-1/3">
                <StatSlider
                  nombre="Control"
                  valor={stats.control}
                  alCambiar={(valor) => manejarStat('control', valor) }
                />
              </div>
            </div>

          </div>

          {/* Total */}
          <div
            className={`mt-6 rounded-lg border p-3 text-center ${
              totalValido
                ? 'border-green-500 bg-green-500/10 text-green-400'
                : 'border-red-500 bg-red-500/10 text-red-400'
            }`}
          >
            <span className="font-bold">
              Total puntos: {total} / {TOTAL_PUNTOS}
            </span>
          </div>

          {/* Validación */}
          {!totalValido && (
            <p className="mt-2 text-center text-sm text-red-400">
              El total de puntos debe ser exactamente {TOTAL_PUNTOS}.
            </p>
          )}

          {/* Botones */}
<div className="mt-6 grid grid-cols-3 items-center gap-3">

{/* Restablecer */}
<button
  type="button"
  onClick={restablecerStats}
  disabled={enviando}
  className="w-full rounded-lg border border-yellow-500 px-3 py-2 text-yellow-400 transition-colors hover:bg-yellow-500/10 disabled:cursor-not-allowed disabled:opacity-50"
>
  RESTABLECER
</button>

{/* Cancelar y Crear */}
  {/* Cancelar */}
  <button
    type="button"
    onClick={onCancel}
    disabled={enviando}
    className="w-full rounded-lg border border-gray-500 px-3 py-2 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
  >
    CANCELAR
  </button>

  {/* Crear */}
  <BotonPrimario
    texto={
      enviando
        ? 'CREANDO...'
        : 'CREAR JUGADOR'
    }
    tipo="submit"
    className="w-full"
    disabled={!formularioValido || enviando}
  />

</div>

        </form>

      </section>
    </div>
  );
}

/**
 * Slider individual de estadísticas.
 */
function StatSlider({ nombre, valor, alCambiar }) {
  return (
    <div>
      {/* Label + valor */}
      <div className="mb-1 flex items-center justify-between">
        <label className="text-sm font-medium text-gray-200">
          {nombre}
        </label>
        <span className="text-sm font-bold text-white">
          {valor}
        </span>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={STAT_MIN}
        max={STAT_MAX}
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-green-400"
        aria-label={nombre}
      />

      {/* Límites */}
      <div className="mt-1 flex justify-between text-xs text-gray-400">
        <span>{STAT_MIN}</span>
        <span>{STAT_MAX}</span>
      </div>

    </div>
  );
}

export default CrearJugadorForm;
