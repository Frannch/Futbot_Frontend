import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CambiarAlineacion from '../../../components/layout/CambiarAlineacion.jsx';
import {
  actualizarAlineacionLiga,
  obtenerAlineacionLiga,
} from '../../../services/ligas.js';
import { obtenerComportamientos, obtenerJugadores } from '../../../services/clubes.js';

vi.mock('../../../services/ligas.js', () => ({
  actualizarAlineacionLiga: vi.fn(),
  obtenerAlineacionLiga: vi.fn(),
}));

vi.mock('../../../services/clubes.js', () => ({
  obtenerComportamientos: vi.fn(),
  obtenerJugadores: vi.fn(),
}));

const alineacion = {
  id_liga: 24,
  id_club: 8,
  formacion_tactica: 2,
  jugadores_convocados: [
    { id_jugador: 1, rol: 'titular', comportamiento: 'perseguir_balon' },
    { id_jugador: 2, rol: 'titular', comportamiento: 'cubrir_arco' },
    { id_jugador: 3, rol: 'titular', comportamiento: 'atacar_espacios' },
    { id_jugador: 4, rol: 'suplente', comportamiento: null },
    { id_jugador: 5, rol: 'suplente', comportamiento: null },
    { id_jugador: 6, rol: 'suplente', comportamiento: null },
  ],
};

describe('CambiarAlineacion', () => {
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it('carga la alineación y la guarda en la liga', async () => {
    obtenerAlineacionLiga.mockResolvedValue(alineacion);
    obtenerJugadores.mockResolvedValue(Array.from({ length: 6 }, (_, indice) => ({
      id_jugador: indice + 1,
      nombre: `Jugador ${indice + 1}`,
    })));
    obtenerComportamientos.mockResolvedValue([
      { id_comportamiento: 1, nombre: 'perseguir_balon' },
      { id_comportamiento: 2, nombre: 'cubrir_arco' },
      { id_comportamiento: 3, nombre: 'atacar_espacios' },
    ]);
    actualizarAlineacionLiga.mockResolvedValue(alineacion);

    render(<CambiarAlineacion idLiga={24} />);

    expect(await screen.findByLabelText('Jugador 1')).toHaveValue('1');
    expect(screen.getByLabelText('Formación Táctica')).toHaveValue('2');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar alineación' }));

    await waitFor(() => {
      expect(actualizarAlineacionLiga).toHaveBeenCalledWith(24, alineacion);
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Alineación actualizada.');
  });
});