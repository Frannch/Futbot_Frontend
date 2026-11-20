import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import SelectorConvocatoria from '../components/SelectorAmistoso.jsx';

const jugadores = [
  { id_jugador: 1, nombre: 'Jugador 1' },
  { id_jugador: 2, nombre: 'Jugador 2' },
  { id_jugador: 3, nombre: 'Jugador 3' },
  { id_jugador: 4, nombre: 'Jugador 4' },
  { id_jugador: 5, nombre: 'Jugador 5' },
  { id_jugador: 6, nombre: 'Jugador 6' }
];

const comportamientos = [
  { id_comportamiento: 1, nombre: 'Agresivo' },
  { id_comportamiento: 2, nombre: 'Equilibrado' }
];

const endpoint = 'http://127.0.0.1:8000/api/clubes/99/amistosos/solicitar';
const token = 'jwt-de-prueba';

function PadreDePrueba() {
  const [mensaje, setMensaje] = useState('');

  const enviarSolicitud = async (payload) => {
    const respuesta = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const datos = await respuesta.json();
    setMensaje(datos.mensaje ?? datos.error);
  };

  return (
    <>
      <SelectorConvocatoria
        jugadores={jugadores}
        comportamientos={comportamientos}
        nombreClubDesafiado="Club rival"
        alEnviar={enviarSolicitud}
      />
      <output>{mensaje}</output>
    </>
  );
}

function completarConvocatoria() {
  [1, 2, 3].forEach((indice) => {
    fireEvent.change(screen.getByLabelText(`Jugador ${indice}`), {
      target: { value: String(indice) }
    });
    fireEvent.change(screen.getByLabelText(`Comportamiento`, { selector: `#comportamiento-titular-${indice - 1}` }), {
      target: { value: 'Agresivo' }
    });
  });

  [4, 5, 6].forEach((idJugador, indice) => {
    fireEvent.change(screen.getByLabelText(`Suplente ${indice + 1}`), {
      target: { value: String(idJugador) }
    });
  });
}

describe('SelectorConvocatoria', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('mantiene deshabilitado el envío mientras la convocatoria no tiene seis jugadores completos', () => {
    render(<SelectorConvocatoria jugadores={jugadores} comportamientos={comportamientos} />);

    expect(screen.getByRole('button', { name: 'Enviar desafío' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Jugador 1'), {
      target: { value: '1' }
    });

    expect(screen.getByRole('button', { name: 'Enviar desafío' })).toBeDisabled();
  });

  it('envía al endpoint el payload con seis jugadores, roles y formación numérica', async () => {
    fetch.mockResolvedValue({
      status: 200,
      json: async () => ({
        id_solicitud_amistoso: 123,
        mensaje: 'La invitación fue enviada exitosamente.'
      })
    });

    render(<PadreDePrueba />);
    completarConvocatoria();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar desafío' }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    const [url, opciones] = fetch.mock.calls[0];
    const payload = JSON.parse(opciones.body);

    expect(url).toBe(endpoint);
    expect(opciones.method).toBe('POST');
    expect(opciones.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });
    expect(payload.formacion_tactica).toBe(1);
    expect(payload.jugadores_convocados).toHaveLength(6);
    expect(payload.jugadores_convocados.filter(({ rol }) => rol === 'titular')).toHaveLength(3);
    expect(payload.jugadores_convocados.filter(({ rol }) => rol === 'suplente')).toHaveLength(3);
    expect(payload.jugadores_convocados).toEqual(expect.arrayContaining([
      { id_jugador: 1, rol: 'titular', comportamiento: 'Agresivo' },
      { id_jugador: 4, rol: 'suplente', comportamiento: null }
    ]));
    expect(payload.jugadores_convocados.every(({ id_jugador, rol }) => (
      Number.isInteger(id_jugador) &&
      ['titular', 'suplente'].includes(rol)
    ))).toBe(true);
    expect(payload.jugadores_convocados
      .filter(({ rol }) => rol === 'titular')
      .every(({ comportamiento }) => (
      typeof comportamiento === 'string' && comportamiento.length > 0
      ))).toBe(true);
    expect(payload.jugadores_convocados
      .filter(({ rol }) => rol === 'titular')
      .every(({ comportamiento }) => comportamiento.length > 0)).toBe(true);
    expect(await screen.findByText('La invitación fue enviada exitosamente.')).toBeInTheDocument();
  });

  it.each([
    [400, 'Falta un jugador o comportamiento requerido.'],
    [404, 'El club rival no fue encontrado.']
  ])('muestra el error de la API cuando responde %s', async (status, error) => {
    fetch.mockResolvedValue({
      status,
      json: async () => ({ error })
    });

    render(<PadreDePrueba />);
    completarConvocatoria();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar desafío' }));

    expect(await screen.findByText(error)).toBeInTheDocument();
  });
});
