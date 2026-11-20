import { useEffect, useRef, useState } from 'react';
import Header from '../components/layout/Header';
import InputTexto from '../components/ui/Input';
import BotonPrimario from '../components/ui/Button';
import VisualizadorEscudo from '../components/layout/VisualizadorEscudo';

function FundarClub({ cambiarPantalla, cerrarSesion }) {
  const [nombreClub, setNombreClub] = useState('');
  const [archivoEscudo, setArchivoEscudo] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const urlPreviaRef = useRef('');
  const formularioValido = nombreClub.trim() !== '' && archivoEscudo;

  useEffect(() => {
    return () => {
      if (urlPreviaRef.current) URL.revokeObjectURL(urlPreviaRef.current);
    };
  }, []);

  const manejarArchivoEscudo = (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (archivo.type !== 'image/jpeg') {
      e.target.value = '';
      setMensajeError('El escudo debe estar en formato JPG.');
      return;
    }
    if (archivo.size >= 1024 * 1024) {
      e.target.value = '';
      setMensajeError('El escudo debe pesar menos de 1 MB.');
      return;
    }

    setMensajeError('');
    if (urlPreviaRef.current) URL.revokeObjectURL(urlPreviaRef.current);
    urlPreviaRef.current = URL.createObjectURL(archivo);
    setVistaPrevia(urlPreviaRef.current);
    setArchivoEscudo(archivo);
  };

  const manejarFundarClub = async () => {
    setMensajeError('');
    setMensajeExito('');

    if (!formularioValido) {
      setMensajeError('Completa el nombre y selecciona un escudo antes de continuar.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setMensajeError('No se encontró el token de autenticación. Inicia sesión nuevamente.');
      return;
    }

    const datosClub = new FormData();
    datosClub.append('name', nombreClub.trim());
    datosClub.append('photo', archivoEscudo);

    setEnviando(true); 
    try {
      // TODO: Mover la lógica de llamadas a la API a `services`
      // en un ticket separado. 
      const respuesta = await fetch('http://127.0.0.1:8000/api/clubes/', { 
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: datosClub
      });

      const data = await respuesta.json().catch(() => ({}));

      if (respuesta.status === 201) {
        const clubId = data.id_club ?? data.club_id ?? data.id;
        if (clubId != null) {
          localStorage.setItem('clubId', String(clubId));
        }
        setMensajeExito(data.mensaje || 'Club creado correctamente.');
        setTimeout(() => {
          cambiarPantalla?.('mi-club');
        }, 2000);
      } else if (respuesta.status === 403) {
        setMensajeError('El usuario ya tiene un club.');
      } else if (respuesta.status === 409) {
        setMensajeError('El nombre del club ya está en uso.');
      } else {
        setMensajeError(data.error || 'No se pudo crear el club.');
      }
    } catch {
      setMensajeError('Error de conexión con el servidor.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#0d1b13] flex flex-col">
      <Header onCerrarSesion={cerrarSesion} />
      
      <main className="flex-1 flex items-center justify-center p-2">
        {/* Tarjeta principal oscura */}
        <div className="bg-[#1a237e] rounded-xl p-4 max-w-6xl w-full">
          <h1 className="text-3xl font-bold text-white mb-1">FUNDAR NUEVO CLUB</h1>

          {mensajeError && (
            <p className="mb-3 rounded border border-red-500 bg-red-500/20 p-3 text-sm text-red-100">
              {mensajeError}
            </p>
          )}

          {mensajeExito && (
            <p className="mb-3 rounded border border-green-500 bg-green-500/20 p-3 text-sm text-green-100">
              {mensajeExito}
            </p>
          )}

          {/* Grid de dos columnas para separar la preview de los datos */}
          <div className="grid grid-cols-2 gap-1">
            
            {/* COLUMNA IZQUIERDA: ESCUDO */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">ESCUDO DEL CLUB</h2>
              <VisualizadorEscudo urlImagen={vistaPrevia} />
            </div>

            {/* COLUMNA DERECHA: DATOS */}
            <div className="space-y-7">
              <h2 className="text-lg font-bold text-white">DATOS DEL CLUB</h2>
              <InputTexto
                label="Nombre Oficial"
                id="nombre-club"
                valor={nombreClub}
                alCambiar={(e) => setNombreClub(e.target.value)}
                required
                maxLength={20}
              />
              <label className="flex flex-col gap-1 text-sm font-medium text-white">
                 Subir una imagen desde el dispositivo
                <span
                  className="cursor-pointer rounded-md border border-gray-500 bg-[#111827] px-3 py-2 text-sm text-white"
                >
                  Seleccionar archivo
                </span>
                <input
                  type="file"
                  accept="image/jpeg"
                  onChange={manejarArchivoEscudo}
                  className="hidden"
                />
                <span className="text-xs text-gray-300">
                  Selecciona una imagen JPG de hasta 1 MB
                </span>
              </label>
            </div>
          </div>

          {/* Botones inferiores (reutilizados) */}
          <div className="flex justify-between mt-3">
             <BotonPrimario
               texto={enviando ? 'FUNDANDO CLUB...' : 'FUNDAR CLUB'}
               className="w-auto"
               onClick={manejarFundarClub}
               disabled={!formularioValido || enviando}
             />
          </div>

        </div>
      </main>
    </div>
  );
}

export default FundarClub;