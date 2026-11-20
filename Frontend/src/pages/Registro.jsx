import { useEffect, useMemo, useState } from 'react';
import Header from '../components/layout/Header';
import InputTexto from '../components/ui/Input';
import BotonPrimario from '../components/ui/Button';

function Registro({ cambiarPantalla }) {
  
    //Estados para los campos del formulario
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [enviando, setEnviando] = useState(false);

    //Estados para dar feedback al usuario
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [segundosParaRedireccion, setSegundosParaRedireccion] = useState(0);

  useEffect(() => {
    if (segundosParaRedireccion <= 0) {
      return undefined;
    }

    const temporizador = window.setTimeout(() => {
      setSegundosParaRedireccion((actual) => actual - 1);
    }, 1000);

    return () => window.clearTimeout(temporizador);
  }, [segundosParaRedireccion]);

  useEffect(() => {
    if (mensajeExito && segundosParaRedireccion === 0) {
      cambiarPantalla?.('login');
    }
  }, [cambiarPantalla, mensajeExito, segundosParaRedireccion]);

  const errores = useMemo(() => ({
    username: username && !/^[a-zA-Z0-9]+$/.test(username)
      ? 'Usa solo letras y números.'
      : '',
    email: email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? 'Ingresa un correo electrónico válido.'
      : '',
    password: password && password.length < 8
      ? 'La contraseña debe tener al menos 8 caracteres.'
      : '',
    confirmPassword: confirmPassword && password !== confirmPassword
      ? 'Las contraseñas no coinciden.'
      : ''
  }), [username, email, password, confirmPassword]);

  const formularioValido = Boolean(
    username && email && password && confirmPassword &&
    !errores.username && !errores.email && !errores.password && !errores.confirmPassword
  );

  const regresar = () => {
    if (cambiarPantalla) {
      cambiarPantalla('login');
    }
  };

    //"async" permite esperar respuestas del servidor
  const manejarRegistro = async (e) => {
    e.preventDefault(); // Evita que la página se recargue
    
    setMensajeError('');
    setMensajeExito('');

    // Validación rápida en el cliente
    if (!formularioValido) {
      setMensajeError('Revisa los campos marcados antes de continuar.');
      return; // Corta la ejecución aquí
    }

    // Armar el cuerpo de la petición (Objeto JSON)
    const datosRegistro = {
      username: username,
      password: password,
      email: email
    };

    setEnviando(true);
    try {
      // TODO: Mover la lógica de llamadas a la API a `services`
      // en un ticket separado. 
      // Invocamos al endpoint de la API
      const respuesta = await fetch('http://127.0.0.1:8000/api/auth/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosRegistro) //Se convierte el objeto a JSON real
      });

      // Extraemos la respuesta si el backend devuelve JSON
      const data = await respuesta.json().catch(() => ({}));

      // Manejo de los distintos códigos de respuesta
      if (respuesta.ok) {
        setMensajeExito(
          'Cuenta creada. Revisa tu bandeja de entrada (y la carpeta de spam) para verificar tu correo antes de iniciar sesión.'
        );
        setSegundosParaRedireccion(10);

      } else {
        setMensajeError(
          data.error || data.detail || "Ocurrió un error inesperado al intentar registrarse."
        );
      }

    } catch {
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
          <h2 className="text-white text-3xl font-bold mb-2">CREAR CUENTA</h2>
          <p className="text-gray-300 mb-8">Regístrate en la plataforma</p>

          {mensajeError && (
            <p className="mb-4 rounded border border-red-500 bg-red-500/20 p-3 text-sm text-red-100">
              {mensajeError}
            </p>
          )}

          {mensajeExito && (
            <>
              <p className="mb-2 rounded border border-green-500 bg-green-500/20 p-3 text-sm text-green-100">
                {mensajeExito}
              </p>
              <p className="mb-4 text-center text-sm text-green-100">
                Serás redirigido al inicio de sesión en {segundosParaRedireccion} segundos.
              </p>
            </>
          )}
          
          <form id="registro-formulario" onSubmit={manejarRegistro} noValidate>
          {/* Grilla de Inputs */}
          <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2">
            <InputTexto
              label="Nombre de Usuario"
              id="username"
              valor={username}
              alCambiar={(e) => setUsername(e.target.value)}
              error={errores.username}
              required
            />
            <InputTexto
              label="Correo Electrónico"
              tipo="email"
              id="email"
              valor={email}
              alCambiar={(e) => setEmail(e.target.value)}
              error={errores.email}
              required
            />
            <InputTexto
              label="Contraseña"
              tipo={mostrarPassword ? 'text' : 'password'}
              id="password"
              placeholder="Mínimo 8 caracteres"
              valor={password}
              alCambiar={(e) => setPassword(e.target.value)}
              error={errores.password}
              textoAccion={mostrarPassword ? 'Ocultar' : 'Mostrar'}
              alAccionar={() => setMostrarPassword((visible) => !visible)}
              required
            />
            <InputTexto
              label="Confirmar Contraseña"
              tipo={mostrarConfirmacion ? 'text' : 'password'}
              id="confirmPassword"
              placeholder="Repite la contraseña"
              valor={confirmPassword}
              alCambiar={(e) => setConfirmPassword(e.target.value)}
              error={errores.confirmPassword}
              textoAccion={mostrarConfirmacion ? 'Ocultar' : 'Mostrar'}
              alAccionar={() => setMostrarConfirmacion((visible) => !visible)}
              required
            />
          </div>

          <BotonPrimario texto={enviando ? 'CREANDO CUENTA...' : 'CREAR CUENTA'} tipo="submit" disabled={!formularioValido || enviando} />
          </form>
          
          {/* Link al login */}
          <div className="text-center mt-4">
            <p className="text-white mb-1">Ya tienes una cuenta?</p>
          <button
            type="button"
            onClick={regresar}
            className="!py-1 !px-6 !text-lg text-sm text-gray-100 hover:text-white transition-colors underline-offset-4 hover:underline"
          >
            Regresar
          </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Registro;