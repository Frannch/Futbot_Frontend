import { useEffect, useState } from 'react';
import Header from '../components/Header';
import MiClubNav from '../components/MiClubNav';
import CrearJugadorForm from '../components/CrearJugadorForm';
import CrearComportamiento from '../components/CrearComportamiento';
import ListaComportamientos from '../components/ListaComportamientos';
import { obtenerJugadores } from '../services/clubes';  //agregar a FIX

function MiClub({ cambiarPantalla, cerrarSesion }) {
  //  estado para almacenar la lista de jugadores.
  const [jugadores, setJugadores] = useState([]);

  // Estado para controlar la apertura del formulario de creación de jugador.
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarCrearComportamiento, setMostrarCrearComportamiento] = useState(false);

  // Estado para controlar la sección activa.
  // Puede ser: "plantilla" o "comportamientos".
  const [seccionActiva, setSeccionActiva] = useState('plantilla');

  // Colores utilizados para diferenciar visualmente los jugadores.
  const coloresStats = [
    'bg-yellow-400',
    'bg-green-400',
    'bg-cyan-400',
    'bg-pink-500',
  ];

  // Obtener los jugadores del club al montar el componente.
  useEffect(() => {
    const cargarJugadores = async () => {
      try {
        const jugadoresObtenidos = await obtenerJugadores();

        const jugadoresFormateados = jugadoresObtenidos.map(
          (jugador) => ({
            id: jugador.id_jugador,
            nombre: jugador.nombre,
            velocidad: jugador.skills.speed,
            fuerza: jugador.skills.strength,
            potencia: jugador.skills.power,
            agilidad: jugador.skills.agility,
            control: jugador.skills.control,
          })
        );

        setJugadores(jugadoresFormateados);
      } catch (error) {
        console.error(
          'Error al cargar los jugadores:',
          error
        );
      }
    };

    cargarJugadores();
  }, []);


  const agregarJugador = () => {
    setMostrarFormulario(true);
  };

  const manejarJugadorCreado = (jugador) => {
    // Agregamos el jugador a la lista.
    setJugadores((jugadoresActuales) => [
      ...jugadoresActuales,
      jugador,
    ]);

    // Cerramos el formulario.
    setMostrarFormulario(false);
  };

  return (
    <div className="min-h-screen bg-[#0d1b13] flex flex-col">

      {/* Header compartido */}
      <Header
        onCerrarSesion={cerrarSesion}
        onCambiarPantalla={cambiarPantalla}
        pantallaActual="mi-club"
      />

      {/* Navegación interna de Mi Club */}
      <MiClubNav
        seccionActiva={seccionActiva}
        cambiarSeccion={setSeccionActiva}
      />

      {/* Contenido principal */}
      <main className="flex-1 px-6 py-8 md:px-10 lg:px-14">

        {/* ============================= */}
        {/* SECCIÓN PLANTILLA              */}
        {/* ============================= */}

        {seccionActiva === 'plantilla' && (
          <section>

            {/* Encabezado de la página */}
            <section className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-white text-xl md:text-2xl lg:text-3xl font-bold mb-2">
                  MI CLUB
                </h1>

                <p className="text-gray-400 text-sm">
                  Gestiona los atributos, roles y scripts tácticos asignados
                  a cada uno de tus jugadores registrados.
                </p>
              </div>
            </section>

            {/* Grilla de jugadores */}
            <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

              {jugadores.map((jugador, indice) => (
                <article
                  key={jugador.id}
                  className="flex min-h-[280px] flex-col rounded-xl bg-[#20288f] p-3"
                >

                  {/* Avatar */}
                  <div className="mb-1 flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#071b16]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="h-10 w-10 text-gray-300"
                      >
                        <circle cx="12" cy="8" r="3" />
                        <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
                      </svg>
                    </div>
                  </div>

                  {/* Nombre */}
                  <h2 className="mb-1 text-center text-base font-bold text-white">
                    {jugador.nombre}
                  </h2>

                  {/* Stats */}
                  <div className="space-y-1.5">

                    <StatBar
                      nombre="Velocidad"
                      valor={jugador.velocidad}
                      color={coloresStats[indice % coloresStats.length]}
                    />

                    <StatBar
                      nombre="Fuerza"
                      valor={jugador.fuerza}
                      color={coloresStats[indice % coloresStats.length]}
                    />

                    <StatBar
                      nombre="Potencia"
                      valor={jugador.potencia}
                      color={coloresStats[indice % coloresStats.length]}
                    />

                    <StatBar
                      nombre="Agilidad"
                      valor={jugador.agilidad}
                      color={coloresStats[indice % coloresStats.length]}
                    />

                    <StatBar
                      nombre="Control"
                      valor={jugador.control}
                      color={coloresStats[indice % coloresStats.length]}
                    />

                  </div>
                </article>
              ))}

              {/* Botón agregar jugador */}
              <button
                type="button"
                onClick={agregarJugador}
                className="flex min-h-[280px] items-center justify-center rounded-xl bg-[#20288f] text-2xl font-bold text-green-400 transition-colors hover:bg-[#29339e]"
                aria-label="Agregar jugador"
              >
                +
              </button>

            </section>

          </section>
        )}

        {/* ============================= */}
        {/* SECCIÓN COMPORTAMIENTOS        */}
        {/* ============================= */}

        {seccionActiva === 'comportamientos' && (
          <section>
            {mostrarCrearComportamiento ? (
              <>
                <CrearComportamiento
                  onCreated={() => setMostrarCrearComportamiento(false)}
                  onCancel={() => setMostrarCrearComportamiento(false)}
                />
              </>
            ) : (
              <>
                <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h1 className="mb-2 text-xl font-bold text-white md:text-2xl lg:text-3xl">
                      COMPORTAMIENTOS
                    </h1>
                    <p className="text-sm text-gray-400">
                      Gestiona los comportamientos y scripts tácticos de tu club.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMostrarCrearComportamiento(true)}
                    className="rounded-md bg-green-400 px-5 py-2.5 font-bold text-[#071b16] transition-colors hover:bg-green-300"
                  >
                    + Nuevo comportamiento
                  </button>
                </section>
                <ListaComportamientos />
              </>
            )}

          </section>
        )}

      </main>

      {/* Formulario de creación de jugador */}
      {mostrarFormulario && (
        <CrearJugadorForm
          onCreated={manejarJugadorCreado}
          onCancel={() => setMostrarFormulario(false)}
        />
      )}

    </div>
  );
}

/**
 * Barra individual de estadísticas.
 */
function StatBar({ nombre, valor, color }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-xs font-semibold text-white">
          {nombre}
        </span>

        <span className="text-xs font-semibold text-white">
          {valor}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-[#10184f]">
        <div
          className={`h-full ${color} rounded-full`}
          style={{ width: `${valor}%` }}
        />
      </div>
    </div>
  );
}

export default MiClub;
