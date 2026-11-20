import { useState } from 'react';
import Header from '../components/layout/Header';
import InputTexto from '../components/ui/Input';
import BotonPrimario from '../components/ui/Button';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

function ReenviarVerificacion({ cambiarPantalla }) {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    setMensaje('');
    setError('');
    setEnviando(true);

    try {
      const respuesta = await fetch(`${API_URL}/api/auth/reenviar-verificacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!respuesta.ok) {
        const data = await respuesta.json().catch(() => ({}));
        setError(data.error || data.detail || 'No se pudo procesar la solicitud.');
        return;
      }

      setMensaje('Si el correo está registrado y sin verificar, te hemos enviado un nuevo enlace.');
      setSegundosRestantes(60);
      const intervalo = window.setInterval(() => {
        setSegundosRestantes((actual) => {
          if (actual <= 1) {
            window.clearInterval(intervalo);
            return 0;
          }
          return actual - 1;
        });
      }, 1000);
    } catch {
      setError('Error de conexión con el servidor.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1b13] flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <section className="bg-[#1a237e] rounded-xl p-8 max-w-2xl w-full">
          <h2 className="text-white text-3xl font-bold mb-4">REENVIAR VERIFICACIÓN</h2>
          <p className="text-gray-300 mb-8">
            Ingresa tu correo para solicitar un nuevo enlace de verificación.
          </p>
          {error && (
            <p className="mb-4 rounded border border-red-500 bg-red-500/20 p-3 text-sm text-red-100">
              {error}
            </p>
          )}
          {mensaje && (
            <p className="mb-4 rounded border border-green-500 bg-green-500/20 p-3 text-sm text-green-100">
              {mensaje}
            </p>
          )}
          <form onSubmit={manejarEnvio} className="space-y-6" noValidate>
            <InputTexto
              label="Correo Electrónico"
              tipo="email"
              id="email-verificacion"
              valor={email}
              alCambiar={(evento) => setEmail(evento.target.value)}
              required
            />
            <BotonPrimario
              texto={enviando ? 'ENVIANDO...' : segundosRestantes > 0
                ? `ESPERA ${segundosRestantes}s`
                : 'REENVIAR VERIFICACIÓN'}
              tipo="submit"
              disabled={!emailValido || enviando || segundosRestantes > 0}
            />
          </form>
          <button
            type="button"
            onClick={() => cambiarPantalla?.('login')}
            className="mt-4 w-full text-sm text-gray-100 underline-offset-4 hover:underline"
          >
            Volver a iniciar sesión
          </button>
        </section>
      </main>
    </div>
  );
}

export default ReenviarVerificacion;
