import { useState } from 'react';
import MiPerfil from './MiPerfil.jsx';

function Header({
  onCerrarSesion,
  onCambiarPantalla,
  pantallaActual,
}) {
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const secciones = [
    { destino: 'mi-club', etiqueta: 'Mi Club' },
    { destino: 'ligas', etiqueta: 'Explorador de Ligas' },
    { destino: 'amistosos', etiqueta: 'Amistosos' },
    { destino: 'partidos-en-vivo', etiqueta: 'Partidos en Vivo' },
  ];

  return (
    <header className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-gray-800 px-4 py-4 md:px-8">
      <div className="flex items-center gap-2">
        <div className="border border-green-500 text-green-500 font-bold px-2 py-1 rounded text-sm">
          FBT
        </div>
        <span className="text-white font-bold text-xl tracking-wider">
          FUTBOT
        </span>
      </div>

      {onCambiarPantalla ? (
        <nav aria-label="Navegación principal" className="flex min-w-0 justify-center gap-2 overflow-x-auto">
          {secciones.map((seccion) => (
            <button
              key={seccion.destino}
              type="button"
              aria-current={pantallaActual === seccion.destino ? 'page' : undefined}
              onClick={() => onCambiarPantalla(seccion.destino)}
              className={`whitespace-nowrap border-b-2 px-3 py-3 text-xs font-semibold transition-colors md:px-5 md:text-sm ${
                pantallaActual === seccion.destino
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {seccion.etiqueta}
            </button>
          ))}
        </nav>
      ) : <span />}

      <div className="flex justify-end gap-3">
        {onCerrarSesion && (
          <button
            type="button"
            onClick={() => setPerfilAbierto(true)}
            className="whitespace-nowrap rounded border border-green-500 px-3 py-2 text-sm font-semibold text-green-300 hover:bg-green-500 hover:text-[#06120b]"
          >
            Ver perfil
          </button>
        )}
      </div>
      {perfilAbierto && (
        <MiPerfil
          abierto
          esModal
          alCerrar={() => setPerfilAbierto(false)}
          cambiarPantalla={onCambiarPantalla}
          onCerrarSesion={onCerrarSesion}
        />
      )}
    </header>
  );
}

export default Header;