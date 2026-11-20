// Solo se encarga de renderizar la barra de navegación y manejar el cambio de secciones. 
// No tiene lógica de carga de datos ni manejo de errores.

function MiClubNav({ seccionActiva, cambiarSeccion }) {
  return (
    <nav className="flex border-b border-gray-800 bg-[#0d101a]">
      <button
        type="button"
        onClick={() => cambiarSeccion('plantilla')}
        className={`px-8 py-4 text-sm font-semibold transition-colors ${
          seccionActiva === 'plantilla'
            ? 'border-b-2 border-green-500 text-green-500'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        Plantilla
      </button>

      <button
        type="button"
        onClick={() => cambiarSeccion('comportamientos')}
        className={`px-8 py-4 text-sm font-semibold transition-colors ${
          seccionActiva === 'comportamientos'
            ? 'border-b-2 border-green-500 text-green-500'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        Comportamientos
      </button>
    </nav>
  );
}

export default MiClubNav;