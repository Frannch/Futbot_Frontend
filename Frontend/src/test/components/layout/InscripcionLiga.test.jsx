import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

import InscripcionLiga from '../../../components/layout/InscripcionLiga.jsx';
import { obtenerComportamientos, obtenerJugadores } from '../../../services/clubes.js';
import { unirseALiga } from '../../../services/ligas.js';

vi.mock('../../../services/clubes.js', () => ({
  obtenerComportamientos: vi.fn(),
  obtenerJugadores: vi.fn(),
}));

vi.mock('../../../services/ligas.js', () => ({
  unirseALiga: vi.fn(),
}));

vi.mock('../../../components/layout/SelectorConvocatoria.jsx', () => ({
  default: ({ alCambiar }) => (
    <button
      type="button"
      onClick={() => alCambiar({
        formacion_tactica: 1,
        jugadores_convocados: [{ id_jugador: 1, rol: 'titular' }],
      })}
    >
      Completar convocatoria
    </button>
  ),
}));

vi.mock('../../../components/ui/Button.jsx', () => ({
  default: ({ texto, tipo, disabled }) => (
    <button type={tipo} disabled={disabled}>{texto}</button>
  ),
}));

describe('InscripcionLiga', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('solicita la contraseña cuando la liga es privada', async () => {
    obtenerJugadores.mockResolvedValue([]);
    obtenerComportamientos.mockResolvedValue([]);

    render(
      <InscripcionLiga
        liga={{ id: 7, nombre: 'Liga privada', esPrivada: true }}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Contraseña de la liga')).toBeInTheDocument();
    });
  });

  it('permite mostrar y ocultar la contraseña de una liga privada', async () => {
    obtenerJugadores.mockResolvedValue([]);
    obtenerComportamientos.mockResolvedValue([]);

    render(
      <InscripcionLiga
        liga={{ id: 7, nombre: 'Liga privada', esPrivada: true }}
      />
    );

    const campoContrasena = await screen.findByLabelText('Contraseña de la liga');
    expect(campoContrasena).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(campoContrasena).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(campoContrasena).toHaveAttribute('type', 'password');
  });

  it('envía la contraseña al inscribir una liga privada', async () => {
    obtenerJugadores.mockResolvedValue([]);
    obtenerComportamientos.mockResolvedValue([]);
    unirseALiga.mockResolvedValue({});
    const irAlLobby = vi.fn();

    render(
      <InscripcionLiga
        liga={{ id: 7, nombre: 'Liga privada', esPrivada: true }}
        irAlLobby={irAlLobby}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Contraseña de la liga')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Contraseña de la liga'), {
      target: { value: 'secreta' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Completar convocatoria' }));
    fireEvent.submit(screen.getByRole('button', { name: 'INSCRIBIRSE' }).closest('form'));

    await waitFor(() => {
      expect(unirseALiga).toHaveBeenCalledWith(7, {
        contrasenia: 'secreta',
        formacion_tactica: 1,
        jugadores_convocados: [{ id_jugador: 1, rol: 'titular' }],
      });
      expect(irAlLobby).toHaveBeenCalledWith(7, 'Liga privada');
    });
  });

  it('permite inscribirse en una liga pública sin solicitar contraseña', async () => {
    obtenerJugadores.mockResolvedValue([]);
    obtenerComportamientos.mockResolvedValue([]);
    unirseALiga.mockResolvedValue({});
    const irAlLobby = vi.fn();

    render(
      <InscripcionLiga
        liga={{ id: 8, nombre: 'Liga pública', esPrivada: false }}
        irAlLobby={irAlLobby}
      />
    );

    expect(screen.queryByLabelText('Contraseña de la liga')).not.toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: 'Completar convocatoria' }));
    fireEvent.submit(screen.getByRole('button', { name: 'INSCRIBIRSE' }).closest('form'));

    await waitFor(() => {
      expect(unirseALiga).toHaveBeenCalledWith(8, {
        formacion_tactica: 1,
        jugadores_convocados: [{ id_jugador: 1, rol: 'titular' }],
      });
      expect(irAlLobby).toHaveBeenCalledWith(8, 'Liga pública');
    });
  });

});
