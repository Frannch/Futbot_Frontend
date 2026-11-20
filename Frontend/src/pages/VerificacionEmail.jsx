import Header from '../components/Header';

const estados = {
  ok: {
    titulo: 'Correo verificado',
    mensaje: 'Tu cuenta fue verificada correctamente. Ya puedes iniciar sesión.',
    clase: 'border-green-500 bg-green-500/20 text-green-100',
  },
  expirado: {
    titulo: 'Enlace vencido',
    mensaje: 'El enlace de verificación venció. Solicita uno nuevo para continuar.',
    clase: 'border-red-500 bg-red-500/20 text-red-100',
  },
  invalido: {
    titulo: 'Enlace inválido',
    mensaje: 'El enlace no es válido. Solicita un nuevo correo de verificación.',
    clase: 'border-red-500 bg-red-500/20 text-red-100',
  },
};

function VerificacionEmail({ cambiarPantalla }) {
  const estado = new URLSearchParams(window.location.search).get('estado') || 'invalido';
  const resultado = estados[estado] || estados.invalido;

  return (
    <div className="min-h-screen bg-[#0d1b13] flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <section className="bg-[#1a237e] rounded-xl p-8 max-w-2xl w-full">
          <h2 className="text-white text-3xl font-bold mb-6">{resultado.titulo}</h2>
          <p className={`rounded border p-3 text-sm ${resultado.clase}`}>{resultado.mensaje}</p>
          <div className="mt-6 space-y-3">
            {estado !== 'ok' && (
              <button
                type="button"
                onClick={() => cambiarPantalla?.('reenviar-verificacion')}
                className="w-full rounded-md bg-[#00e676] px-8 py-2 font-bold text-black hover:bg-green-500"
              >
                Reenviar verificación
              </button>
            )}
            <button
              type="button"
              onClick={() => cambiarPantalla?.('login')}
              className="w-full text-sm text-gray-100 underline-offset-4 hover:underline"
            >
              Ir a iniciar sesión
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default VerificacionEmail;
