import { useState } from 'react';
import Temporizador from '../components/Timer.jsx';

const clubLocal = {
  nombre: 'Mi Club'
};

const clubRival = {
  nombre: 'Atlético Norte'
};

function TemporizadorDemo() {
  const [expirado, setExpirado] = useState(false);

  return (
    <main className="min-h-screen bg-[#0d1b13] p-8 text-white">
      <h1 className="text-2xl font-bold">Demo del temporizador</h1>
      <p className="mt-2 text-gray-300">Vista aislada para probar la espera de respuesta del rival.</p>

      {!expirado && (
        <Temporizador
          clubLocal={clubLocal}
          clubRival={clubRival}
          onTiempoExpirado={() => setExpirado(true)}
        />
      )}

      {expirado && (
        <div className="mt-6 rounded border border-amber-500 bg-amber-500/10 p-4 text-amber-100">
          El tiempo de espera terminó.
        </div>
      )}
    </main>
  );
}

export default TemporizadorDemo;
