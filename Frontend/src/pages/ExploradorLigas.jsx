import { useState } from 'react';
import Header from '../components/layout/Header';
import CrearLiga from '../components/layout/CrearLiga';
import ListaLiga from '../components/layout/ListaLigas';
import InscripcionLiga from '../components/layout/InscripcionLiga';
import LobbyLiga from '../components/layout/LobbyLiga';

function ExploradorLigas({
  irAlLobby,
  irALogin,
  cambiarPantalla,
  cerrarSesion,
  ligaActiva,
}) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [ligaSeleccionada, setLigaSeleccionada] = useState(null);

  const volverAlListado = () => setLigaSeleccionada(null);
  const navegarAlLobby = (...datosLiga) => {
    setModalAbierto(false);
    setLigaSeleccionada(null);
    irAlLobby?.(...datosLiga);
  };
  const abrirLobby = (liga) => navegarAlLobby(
    liga.id,
    liga.nombre,
    liga.esCreador,
    liga.cantidadEquipos
  );
  const cambiarSeccion = (seccion) => {
    setModalAbierto(false);
    cambiarPantalla?.(seccion);
  };

  return (
    <div className="min-h-screen bg-[#0d1b13] flex flex-col">
      <Header
        onCambiarPantalla={cambiarSeccion}
        onCerrarSesion={cerrarSesion}
        pantallaActual="ligas"
      />
      <main className="flex-1 p-6">
        <div className="mx-auto w-full max-w-[1600px]">
          {ligaActiva ? (
            <LobbyLiga liga={ligaActiva} cambiarPantalla={cambiarPantalla} />
          ) : (
            <>
              <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="mb-1 text-2xl font-bold text-white">
                    LIGAS Y COMPETICIONES
                  </h1>
                  <p className="text-gray-300">
                    Inscribe tu club en torneos automatizados o desafía a otros usuarios.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalAbierto(true)}
                  className="rounded bg-green-500 px-6 py-3 font-bold text-[#0d1b13] transition-colors hover:bg-green-400"
                >
                  + CREAR LIGA
                </button>
              </div>
              {ligaSeleccionada ? (
                <InscripcionLiga
                  liga={ligaSeleccionada}
                  alVolverAlListado={volverAlListado}
                  irAlLobby={navegarAlLobby}
                />
              ) : (
                <ListaLiga
                  onUnirse={setLigaSeleccionada}
                  onIrAlLobby={abrirLobby}
                />
              )}
            </>
          )}
        </div>
      </main>

      {modalAbierto && !ligaActiva && (
        <CrearLiga
          alCerrar={() => setModalAbierto(false)}
          irAlLobby={navegarAlLobby}
          irALogin={irALogin}
        />
      )}
    </div>
  );
}

export default ExploradorLigas;