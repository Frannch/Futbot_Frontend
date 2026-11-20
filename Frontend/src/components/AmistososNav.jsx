// Solo se encarga de renderizar la barra de navegación y manejar el cambio de secciones. 
// No tiene lógica de carga de datos ni manejo de errores.

function AmistososNav({ seccionActiva, cambiarSeccion }) {
    return (
        <nav className="flex border-b border-gray-800 bg-[#0d101a]">
            <button
                type="button"
                onClick={() => cambiarSeccion('invitar')}
                className={`px-8 py-4 text-sm font-semibold transition-colors ${
                    seccionActiva === 'invitar'
                        ? 'border-b-2 border-green-500 text-green-500'
                        : 'text-gray-400 hover:text-white'
                }`}
            >
                Invitar clubes
            </button>

            <button
                type="button"
                onClick={() => cambiarSeccion('recibidas')}
                className={`px-8 py-4 text-sm font-semibold transition-colors ${
                    seccionActiva === 'recibidas'
                        ? 'border-b-2 border-green-500 text-green-500'
                        : 'text-gray-400 hover:text-white'
                }`}
            >
                Invitaciones recibidas
            </button>
        </nav>
    );
}

export default AmistososNav;