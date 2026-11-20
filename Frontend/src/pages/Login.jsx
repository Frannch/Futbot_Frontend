import { useMemo, useState } from 'react';
import Header from '../components/Header';
import InputTexto from '../components/ui/Input.jsx';
import BotonPrimario from '../components/ui/Button.jsx';
import { useWebSocket } from '../services/websocket.jsx';

function Login({ cambiarPantalla }) {
  // Estados para los campos del formulario
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Estados para dar feedback al usuario
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [cuentaNoVerificada, setCuentaNoVerificada] = useState(false);

  // Websocket
  const { conectarWebSocket } = useWebSocket() || {};

  const errores = useMemo(() => ({
    username: username && !/^[a-zA-Z0-9]+$/.test(username)
      ? 'Usa solo letras y números.'
      : ''
  }), [username]);

  const formularioValido = Boolean(
    username && password.length >= 8 && !errores.username
  );

  const crearCuenta = () => {
    if (cambiarPantalla) {
      cambiarPantalla('registro');
    }
  };

  const manejarLogin = async (e) => {
    e.preventDefault(); // Evita que la página se recargue
    
    setMensajeError('');
    setMensajeExito('');
    setCuentaNoVerificada(false);

    // Validación rápida en el cliente
    if (!formularioValido) {
      setMensajeError('Revisa los campos marcados antes de continuar.');
      return; // Corta la ejecución aquí
    }

    const datosLogin = {
      username,
      password
    };

    setEnviando(true);
    try {
      // Invocamos al endpoint de la API
      const respuesta = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosLogin)
      });

      const data = await respuesta.json().catch(() => ({}));

      if (respuesta.status === 200) {
        const token = data.token;
        const userId = data.user_id;

        if (!token || !userId) {
          setMensajeError('La respuesta de inicio de sesión no contiene una sesión válida.');
          return;
        }

        localStorage.setItem('token', token);
        localStorage.setItem('userId', userId);
        if (data.tiene_club == null) {
          localStorage.removeItem('clubId');
        } else {
          localStorage.setItem('clubId', String(data.tiene_club));
        }

        conectarWebSocket?.(userId, token);
        
        setMensajeExito(data.mensaje);
        cambiarPantalla?.(data.tiene_club == null ? 'CrearClub' : 'mi-club');
      } else if (respuesta.status === 400) {
        setMensajeError(data.error);
      } else if (respuesta.status === 401) {
        setMensajeError(data.error);
      } else if (respuesta.status === 403) {
        const mensaje403 = data.error || data.detail || '';
        const indicaFaltaDeVerificacion = /verific/i.test(mensaje403);
        setCuentaNoVerificada(indicaFaltaDeVerificacion);
        setMensajeError(indicaFaltaDeVerificacion
          ? mensaje403
          : 'No fue posible iniciar sesión. Intenta nuevamente.');
      }
      //data.error contiene el mensaje enviado por el backend: 
      // "El usuario o la contraseña son incorrectos"

    } catch (error) {
      // Captura de errores de red (ej. backend está apagado)
      setMensajeError("Error de conexión con el servidor.");
    } finally {
      setEnviando(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#0d1b13] flex flex-col">
      
      {/* Componente compartido superior */}
      <Header />

      {/* Área principal*/}
      <main className="flex-1 flex items-center justify-center p-4">
        
        {/* Tarjeta*/}
        <section className="bg-[#1a237e] rounded-xl p-8 max-w-2xl w-full">
          <h2 className="text-white text-3xl font-bold mb-10">INICIAR SESIÓN</h2>
          

          {mensajeError && (
            <p className="mb-4 rounded border border-red-500 bg-red-500/20 p-3 text-sm text-red-100">
              {mensajeError}
            </p>
          )}

          {cuentaNoVerificada && (
            <button
              type="button"
              onClick={() => cambiarPantalla?.('reenviar-verificacion')}
              className="mb-4 w-full text-sm text-red-100 underline-offset-4 hover:underline"
            >
              ¿No recibiste el correo? Reenviar verificación
            </button>
          )}

          {mensajeExito && (
            <p className="mb-4 rounded border border-green-500 bg-green-500/20 p-3 text-sm text-green-100">
              {mensajeExito}
            </p>
          )}
          
          <form id="login-formulario" onSubmit={manejarLogin} noValidate>
          {/* Grilla de Inputs */}
          <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-1">
            <InputTexto
              label="Nombre de Usuario"
              id="username"
              valor={username}
              alCambiar={(e) => setUsername(e.target.value)}
              error={errores.username}
              required
            />
           
            <InputTexto
              label="Contraseña"
              tipo={mostrarPassword ? 'text' : 'password'}
              id="password"
              valor={password}
              alCambiar={(e) => setPassword(e.target.value)}
              error={errores.password}
              textoAccion={mostrarPassword ? 'Ocultar' : 'Mostrar'}
              alAccionar={() => setMostrarPassword((visible) => !visible)}
              required
            />
       
          </div>

          <BotonPrimario texto={enviando ? 'INICIANDO SESIÓN...' : 'INICIAR SESIÓN'} tipo="submit" disabled={!formularioValido || enviando} />
          </form>
          
          {/* Link al Registro */}
          <div className="text-center mt-4">
            <p className="text-white mb-1">¿No tienes una cuenta?</p>
          <button
            type="button"
            onClick={crearCuenta}
            className="!py-1 !px-6 !text-lg text-sm text-gray-100 hover:text-white transition-colors underline-offset-4 hover:underline"
          >
            Registrarse
          </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Login;