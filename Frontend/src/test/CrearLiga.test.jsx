import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CrearLiga from '../components/layout/CrearLiga';
import { COMPORTAMIENTOS, JUGADORES } from '../mocks/Club.js';

const { obtenerComportamientosMock, obtenerJugadoresMock } = vi.hoisted(() => ({
  obtenerComportamientosMock: vi.fn(),
  obtenerJugadoresMock: vi.fn()
}));

vi.mock('../services/clubes.js', async (importOriginal) => ({
  ...await importOriginal(),
  obtenerComportamientos: obtenerComportamientosMock,
  obtenerJugadores: obtenerJugadoresMock
}));

const respuestaOk = {
  ok: true,
  status: 201,
  json: async () => ({ id_liga: 1 })
};

function completarDatosLiga(nombreLiga = 'Copa de Prueba', conPenales = true) {
  fireEvent.change(screen.getByLabelText('Nombre de la Liga'), { target: { value: nombreLiga } });
  fireEvent.change(screen.getByLabelText('Duración por Partido'), { target: { value: '10' } });
  fireEvent.change(screen.getByLabelText('Cantidad de Equipos'), { target: { value: '4' } });
  if (!conPenales) {
    fireEvent.click(screen.getByRole('checkbox', { name: /Definir empates por penales/i }));
  }
  fireEvent.click(screen.getByRole('button', { name: 'CONTINUAR' }));
}

// titulares con los jugadores 1, 2 y 3; suplentes con el 4, 5 y 6
async function completarConvocatoria() {
  await screen.findByLabelText('Jugador 1');

  [0, 1, 2].forEach((i) => {
    fireEvent.change(screen.getByLabelText(`Jugador ${i + 1}`), {
      target: { value: String(i + 1) }
    });
    fireEvent.change(screen.getByLabelText(`Comportamiento ${i + 1}`), {
      target: { value: COMPORTAMIENTOS[i].nombre }
    });
    fireEvent.change(screen.getByLabelText(`Suplente ${i + 1}`), {
      target: { value: String(i + 4) }
    });
  });
}

describe('CrearLiga', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    obtenerJugadoresMock.mockResolvedValue(JUGADORES);
    obtenerComportamientosMock.mockResolvedValue(COMPORTAMIENTOS);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('pasa al paso 2 sin tocar el backend y no pierde los datos al volver', () => {
    render(<CrearLiga />);

    completarDatosLiga('Liga Nocturna');

    expect(screen.getByText('PASO 2 DE 2')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Volver a los datos de la liga' }));
    expect(screen.getByLabelText('Nombre de la Liga')).toHaveValue('Liga Nocturna');
  });

  it('manda la liga y la convocatoria juntas en una sola peticion', async () => {
    fetch.mockResolvedValue(respuestaOk);
    const alCerrar = vi.fn();
    const irAlLobby = vi.fn();

    render(<CrearLiga alCerrar={alCerrar} irAlLobby={irAlLobby} />);
    completarDatosLiga();
    await completarConvocatoria();
    fireEvent.click(screen.getByRole('button', { name: 'CREAR LIGA' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(alCerrar).toHaveBeenCalledTimes(1);
      expect(irAlLobby).toHaveBeenCalledWith(1, 'Copa de Prueba', true, 4);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    const [url, opciones] = fetch.mock.calls[0];
    const cuerpo = JSON.parse(opciones.body);

    expect(url).toContain('/api/ligas');
    expect(opciones.method).toBe('POST');
    expect(cuerpo.name).toBe('Copa de Prueba');
    expect(cuerpo.con_penales).toBe(true);
    expect(cuerpo.duracion_partido).toBe(10);
    expect(cuerpo.cantidad_equipos).toBe(4);
    expect(cuerpo.jugadores_convocados).toHaveLength(6);
    // sin clave la liga es publica: el backend puede recibir null para representar ausencia de password
    expect(cuerpo.password).toBeNull();
  });

  it('envía con_penales en falso cuando se desactiva la opción', async () => {
    fetch.mockResolvedValue(respuestaOk);
    render(<CrearLiga />);

    completarDatosLiga('Liga sin penales', false);
    await completarConvocatoria();
    fireEvent.click(screen.getByRole('button', { name: 'CREAR LIGA' }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    const cuerpo = JSON.parse(fetch.mock.calls[0][1].body);
    expect(cuerpo.con_penales).toBe(false);
  });

  it('vuelve al paso 1 con el error cuando el nombre ya existe', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: 'Ya existe una liga con ese nombre.' })
    });

    render(<CrearLiga />);
    completarDatosLiga();
    await completarConvocatoria();
    fireEvent.click(screen.getByRole('button', { name: 'CREAR LIGA' }));

    expect(await screen.findByText('Ya existe una liga con ese nombre.')).toBeInTheDocument();
    expect(screen.getByText('PASO 1 DE 2')).toBeInTheDocument();
  });

  it('muestra un mensaje cuando no hay conexion con el servidor', async () => {
    fetch.mockRejectedValue(new Error('Backend apagado'));

    render(<CrearLiga />);
    completarDatosLiga();
    await completarConvocatoria();
    fireEvent.click(screen.getByRole('button', { name: 'CREAR LIGA' }));

    expect(await screen.findByText('Error de conexión con el servidor.')).toBeInTheDocument();
  });
});