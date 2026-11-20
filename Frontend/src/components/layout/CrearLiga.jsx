import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import InputTexto from '../ui/Input.jsx';
import BotonPrimario from '../ui/Button.jsx';
import SelectorConvocatoria from './SelectorConvocatoria';
import {
  obtenerClubes,
  obtenerComportamientos,
  obtenerInvitacionesPendientes,
  obtenerJugadores,
  normalizarLogo,
  solicitarAmistoso
} from '../../services/clubes.js';

const DURACION_MINIMA = 1;
const DURACION_MAXIMA = 100;
const EQUIPOS_MINIMOS = 4;
const EQUIPOS_MAXIMOS = 50;

function CrearLiga({ alCerrar , irAlLobby, irALogin }) {

    //Paso que se ve: 1 datos de la liga, 2 convocatoria
  const [paso, setPaso] = useState(1);

  const [nombre, setNombre] = useState('');
  const [duracion, setDuracion] = useState('10');
  const [cantidadEquipos, setCantidadEquipos] = useState('4');
  const [contrasena, setContrasena] = useState('');
  const [conPenales, setConPenales] = useState(true);
    //Estados de los datos de la liga y la convocatoria
  const [jugadores, setJugadores] = useState([]);
  const [comportamientos, setComportamientos] = useState([]);
  const [cargandoDatosClub, setCargandoDatosClub] = useState(true);
  const [convocatoria, setConvocatoria] = useState(null);

    //Estados para dar feedback al usuario
  const [enviando, setEnviando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
    const [creada, setCreada] = useState(false);

  // error que devuelve el server sobre el nombre, va abajo de ese campo
  const [errorNombreServer, setErrorNombreServer] = useState('');

// --- CARGA DE JUGADORES Y COMPORTAMIENTOS DESDE EL SERVICIO ---

const cargasEnCurso = useRef({
    jugadores: false,
    comportamientos: false
  });

  const cargarJugadoresYComportamientos = useCallback(async () => {
    if (cargasEnCurso.current.jugadores || cargasEnCurso.current.comportamientos) return;
    
    cargasEnCurso.current.jugadores = true;
    cargasEnCurso.current.comportamientos = true;
    setCargandoDatosClub(true);

    try {
      const [jugadoresData, comportamientosData] = await Promise.all([
        obtenerJugadores(),
        obtenerComportamientos()
      ]);

      setJugadores(jugadoresData);
      setComportamientos(comportamientosData);
    } catch (error) {
      setMensajeError('No se pudieron cargar los jugadores o comportamientos del club.');
    } finally {
      cargasEnCurso.current.jugadores = false;
      cargasEnCurso.current.comportamientos = false;
      setCargandoDatosClub(false);
    }
  }, []);

  // Cargar al montar el componente
  useEffect(() => {
    cargarJugadoresYComportamientos();
  }, [cargarJugadoresYComportamientos]);

  const errores = useMemo(() => {
    const duracionNumero = Number(duracion);
    const equiposNumero = Number(cantidadEquipos);

    return {
      nombre: nombre && nombre.trim().length < 3
        ? 'El nombre debe tener al menos 3 caracteres.'
        : '',
      duracion: duracion && (duracionNumero < DURACION_MINIMA || duracionNumero > DURACION_MAXIMA)
        ? `La duración debe estar entre ${DURACION_MINIMA} y ${DURACION_MAXIMA} minutos.`
        : '',
      cantidadEquipos: cantidadEquipos && (equiposNumero < EQUIPOS_MINIMOS || equiposNumero > EQUIPOS_MAXIMOS)
        ? `La liga debe tener entre ${EQUIPOS_MINIMOS} y ${EQUIPOS_MAXIMOS} equipos.`
        : '',
      contrasena: contrasena && contrasena.length < 6
        ? 'La clave de sala debe tener al menos 6 caracteres.'
        : ''
    };
  }, [nombre, duracion, cantidadEquipos, contrasena]);

  const datosLigaValidos = Boolean(
    nombre.trim() && duracion && cantidadEquipos &&
    !errores.nombre && !errores.duracion && !errores.cantidadEquipos && !errores.contrasena
  );

  // el selector manda null mientras la convocatoria no este completa
  const convocatoriaCompleta = convocatoria !== null;

  // si el usuario corrige el nombre, el error del server ya no aplica
  const cambiarNombre = (e) => {
    setNombre(e.target.value);
    setErrorNombreServer('');
  };
 

  /*
  no manda nada al server, solo pasa al paso 2. los datos de la liga se quedan en sus estados y viajan con la convocatoria en una sola peticion al final
  */
  const manejarContinuar = (e) => {
    e.preventDefault();

    if (!datosLigaValidos) {
      return;
    }

    setPaso(2);
  };

  const volverAlPaso1 = () => {
    setConvocatoria(null);
    setMensajeError('');
    setPaso(1);
  };

  const manejarCreacion = async (e) => {
    e.preventDefault();
 
    setMensajeError('');
    setErrorNombreServer('');
 
    if (!datosLigaValidos || !convocatoriaCompleta) {
      setMensajeError('Revisa los datos de la liga y la convocatoria antes de continuar.');
      return;
    }

    /*
    la liga y la convocatoria del creador van juntas en una sola peticion.
    el server las guarda en una transaccion, asi no puede quedar una liga
    creada sin su dueño adentro
    */
    const datosLiga = {
      name: nombre.trim(),
      password: contrasena || null,
      con_penales: conPenales,
      duracion_partido: Number(duracion),
      cantidad_equipos: Number(cantidadEquipos),
      formacion_tactica: convocatoria.formacion_tactica,
      jugadores_convocados: convocatoria.jugadores_convocados
    };

    setEnviando(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Payload enviado a la API:', JSON.stringify(datosLiga, null, 2));
      const respuesta = await fetch('http://127.0.0.1:8000/api/ligas/', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(datosLiga)
      });

      const data = await respuesta.json().catch(() => ({}));
      console.log('Respuesta del server:', respuesta.status, data);
      localStorage.setItem('ownerID', String(data.owner_id));
      
      if (respuesta.ok) {
        console.log('Respuesta del servidor al crear liga:', data);
        setCreada(true);
        alCerrar?.();
        irAlLobby?.(data.id_liga, nombre.trim(), true, Number(cantidadEquipos));

      } else if (respuesta.status === 401) {
        // token vencido: no tiene sentido mostrar un error, hay que loguearse
        irALogin?.();

      } else if (respuesta.status === 409) {
        // nombre repetido: volvemos al paso 1 asi lo puede corregir
        setPaso(1);
        setErrorNombreServer(data.error || data.detail || 'Ya existe una liga con ese nombre.');

      } else if (respuesta.status >= 500) {
          setMensajeError(
            'El servidor falló al procesar los comportamientos de la convocatoria. La solicitud llegó al backend, pero no pudo guardar la liga.'
          );         
      } else {
        let errorTexto = 'Ocurrió un error inesperado al crear la liga.';

        if (typeof data.detail === 'string') {
          errorTexto = data.detail;
        } else if (Array.isArray(data.detail) && data.detail.length > 0) {
          // Extrae el mensaje legible de validación (ej. "field required" o "value is not a valid integer")
          errorTexto = `${data.detail[0].loc?.join(' -> ')}: ${data.detail[0].msg}`;
        } else if (data.error && typeof data.error === 'string') {
          errorTexto = data.error;
        }
        setMensajeError(errorTexto);
      }
    } catch (error) {
      // errores de red (ej. backend apagado)
      setMensajeError('Error de conexión con el servidor.');
    } finally {
      setEnviando(false);
    }
  };

  if (creada) return null;

  return (
    /* 
    capa oscura que cubre la pagina. el clic no cierra, hay que usar "cancelar"
    o la X, para no perder un formulario si clickeamos fuera de el
    */
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-crear-liga"
    >
      {/* tarjeta del pop up */}
      <section className="bg-[#1a237e] rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
 
        <div className="flex items-start justify-between mb-2">
          <h2 id="titulo-crear-liga" className="text-white text-3xl font-bold">CREAR LIGA</h2>
          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar"
            className="text-gray-300 hover:text-white transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <p className="text-green-400 text-sm font-bold mb-1">PASO {paso} DE 2</p>
 
        {mensajeError && (
          <p className="mb-4 rounded border border-red-500 bg-red-500/20 p-3 text-sm text-red-100">
            {mensajeError}
          </p>
        )}
 
        {paso === 1 ? (
          <>
            <p className="text-gray-300 mb-8">Configura el torneo que van a disputar los clubes</p>
 
            <form id="crear-liga-formulario" onSubmit={manejarContinuar} noValidate>
            {/* grilla de Inputs */}
            <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2">
              <InputTexto
                label="Nombre de la Liga"
                id="nombre"
                valor={nombre}
                alCambiar={cambiarNombre}
                error={errorNombreServer || errores.nombre}
                required
              />
              <InputTexto
                label="Clave de Sala"
                id="contrasena"
                placeholder="Vacío para liga pública"
                valor={contrasena}
                alCambiar={(e) => setContrasena(e.target.value)}
                error={errores.contrasena}
              />
              <InputTexto
                label="Duración por Partido"
                tipo="number"
                id="duracion"
                placeholder={`Entre ${DURACION_MINIMA} y ${DURACION_MAXIMA} minutos`}
                valor={duracion}
                alCambiar={(e) => setDuracion(e.target.value)}
                error={errores.duracion}
                required
              />
              <InputTexto
                label="Cantidad de Equipos"
                tipo="number"
                id="cantidadEquipos"
                placeholder={`Entre ${EQUIPOS_MINIMOS} y ${EQUIPOS_MAXIMOS} equipos`}
                valor={cantidadEquipos}
                alCambiar={(e) => setCantidadEquipos(e.target.value)}
                error={errores.cantidadEquipos}
                required
              />
            </div>

            <label htmlFor="con-penales" className="mb-6 flex items-start gap-3 text-sm text-white">
              <input
                id="con-penales"
                type="checkbox"
                checked={conPenales}
                onChange={(e) => setConPenales(e.target.checked)}
                className="mt-0.5 size-4 accent-emerald-400"
              />
              <span>
                <span className="block font-medium">Definir empates por penales</span>
                <span className="mt-1 block text-gray-300">
                  Activa la definicion de penales en caso de empate
                </span>
              </span>
            </label>
 
            <BotonPrimario texto="CONTINUAR" tipo="submit" disabled={!datosLigaValidos} />
            </form>
 
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={alCerrar}
                className="!py-1 !px-6 !text-lg text-sm text-gray-100 hover:text-white transition-colors underline-offset-4 hover:underline"
              >
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-300 mb-8">
              Convoca a los jugadores con los que tu club va a competir en <span className="text-white font-bold">{nombre}</span>
            </p>
 
            <form id="convocatoria-formulario" onSubmit={manejarCreacion} noValidate>
            <div className="mb-6">
              <SelectorConvocatoria
                jugadores={jugadores}
                comportamientos={comportamientos}
                alCambiar={setConvocatoria}
              />
            </div>
 
            <BotonPrimario
              texto={enviando ? 'CREANDO LIGA...' : 'CREAR LIGA'}
              tipo="submit"
              disabled={!convocatoriaCompleta || enviando}
            />
            </form>
 
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={volverAlPaso1}
                disabled={enviando}
                className="!py-1 !px-6 !text-lg text-sm text-gray-100 hover:text-white transition-colors underline-offset-4 hover:underline"
              >
                Volver a los datos de la liga
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
 
export default CrearLiga;