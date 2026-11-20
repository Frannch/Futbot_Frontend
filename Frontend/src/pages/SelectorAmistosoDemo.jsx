import { useState } from 'react';
import SelectorConvocatoria from '../components/SelectorAmistoso.jsx';
import {
  clubesMock,
  comportamientosMock,
  jugadoresMock
} from '../mocks/selectorAmistosoMock.js';

function SelectorAmistosoDemo() {
  const [clubSeleccionado, setClubSeleccionado] = useState(null);
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [convocatoria, setConvocatoria] = useState(null);

  const seleccionarClub = (event) => {
    const club = clubesMock.find(({ id_club }) => id_club === Number(event.target.value));
    setClubSeleccionado(club ?? null);
    setSelectorAbierto(Boolean(club));
    setConvocatoria(null);
  };

  return (
    <main className="min-h-screen bg-[#0d1b13] p-4 text-white sm:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <p className="text-sm uppercase tracking-[0.2em] text-green-400">Demo local</p>
          <h1 className="mt-2 text-3xl font-bold">Invitar a partido amistoso</h1>
          <p className="mt-2 text-gray-300">Seleccioná un club para abrir la convocatoria.</p>
        </header>

        <section className="rounded-lg border border-white/10 bg-white/5 p-4 sm:p-6">
          <label htmlFor="club-rival" className="mb-2 block text-sm text-gray-300">
            Club rival
          </label>
          <select
            id="club-rival"
            className="w-full rounded border border-white/20 bg-[#122319] px-3 py-2 text-white"
            value={clubSeleccionado?.id_club ?? ''}
            onChange={seleccionarClub}
          >
            <option value="">Seleccionar club</option>
            {clubesMock.map((club) => (
              <option key={club.id_club} value={club.id_club}>
                {club.nombre}
              </option>
            ))}
          </select>

          {clubSeleccionado && !selectorAbierto && (
            <button
              type="button"
              className="mt-4 rounded bg-green-500 px-4 py-2 font-semibold text-black hover:bg-green-400"
              onClick={() => setSelectorAbierto(true)}
            >
              Editar convocatoria para {clubSeleccionado.nombre}
            </button>
          )}
        </section>

        <SelectorConvocatoria
          abierto={selectorAbierto}
          alCerrar={() => setSelectorAbierto(false)}
          jugadores={jugadoresMock}
          comportamientos={comportamientosMock}
          nombreClubDesafiado={clubSeleccionado?.nombre}
          alCambiar={setConvocatoria}
          alEnviar={(payload) => {
            setConvocatoria(payload);
            setSelectorAbierto(false);
          }}
        />

        <section className="rounded-lg border border-white/10 bg-black/20 p-4">
          <h2 className="font-semibold">Payload de convocatoria</h2>
          <pre className="mt-3 overflow-x-auto text-xs text-green-200">
            {JSON.stringify(convocatoria, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  );
}

export default SelectorAmistosoDemo;
