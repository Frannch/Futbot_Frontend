import React from 'react';

function VisualizadorEscudo({ urlImagen }) {
  return (
    // Cuadrado perfecto (aspect-square), ancho fijo (w-64 = 256px) y centrado (mx-auto)
    <div className="flex flex-col items-center justify-center aspect-square w-64 mx-auto rounded-xl border border-gray-700 bg-[#0f172a] p-6 text-center">
      
      {urlImagen ? (
        <img 
          src={urlImagen} 
          alt="Previsualización del Escudo" 
          className="max-h-full max-w-full object-contain" 
        />
      ) : (
        <React.Fragment>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="w-16 h-16 text-orange-500 mb-4"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          
          <p className="text-sm text-gray-400">
            Vista previa
          </p>
        </React.Fragment>
      )}
    </div>
  );
}

export default VisualizadorEscudo;