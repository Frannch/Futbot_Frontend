import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import CambioEnCancha from '../components/CambioEnCancha.jsx';

describe('CambioEnCancha', () => {
  afterEach(() => cleanup());

  const jugadoresEnCancha = [
    { id: 1, nombre: 'Titular A', equipo: 0 },
    { id: 2, equipo: 0 },
  ];
  const convocatoria = [
    { id_jugador: 1, rol: 'titular' },
    { id_jugador: 2, rol: 'titular' },
    { id_jugador: 3, rol: 'suplente' },
    { id_jugador: 4, rol: 'suplente' },
    { id_jugador: 5, rol: 'titular' },
  ];
  const jugadores = [
    { id_jugador: 1, nombre: 'Titular A' },
    { id_jugador: 2, nombre: 'Titular B' },
    { id_jugador: 3, nombre: 'Suplente A' },
    { id_jugador: 4, nombre: 'Suplente B' },
    { id_jugador: 5, nombre: 'Titular C' },
  ];

  it('limita las opciones a jugadores en cancha y suplentes de la convocatoria', () => {
    render(
      <CambioEnCancha
        jugadoresEnCancha={jugadoresEnCancha}
        convocatoria={convocatoria}
        jugadores={jugadores}
      />
    );

    const selectSale = screen.getByLabelText('Sale del partido');
    const selectEntra = screen.getByLabelText('Entra desde el banco');

    expect(within(selectSale).getByRole('option', { name: 'Titular A' })).toBeInTheDocument();
    expect(within(selectSale).getByRole('option', { name: 'Titular B' })).toBeInTheDocument();
    expect(within(selectSale).queryByRole('option', { name: 'Suplente A' })).not.toBeInTheDocument();

    expect(within(selectEntra).getByRole('option', { name: 'Suplente A' })).toBeInTheDocument();
    expect(within(selectEntra).getByRole('option', { name: 'Suplente B' })).toBeInTheDocument();
    expect(within(selectEntra).queryByRole('option', { name: 'Titular C' })).not.toBeInTheDocument();
  });

  it('envía los IDs seleccionados con el payload de sustitución', () => {
    const onSolicitarCambio = vi.fn();
    render(
      <CambioEnCancha
        jugadoresEnCancha={jugadoresEnCancha}
        convocatoria={convocatoria}
        jugadores={jugadores}
        onSolicitarCambio={onSolicitarCambio}
      />
    );

    fireEvent.change(screen.getByLabelText('Sale del partido'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Entra desde el banco'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar cambio' }));

    expect(onSolicitarCambio).toHaveBeenCalledWith({
      id_jugador_sale: 1,
      id_jugador_entra: 3,
    });
  });

  it('deshabilita la solicitud cuando no hay opciones para completar el cambio', () => {
    render(<CambioEnCancha />);

    expect(screen.getByRole('button', { name: 'Solicitar cambio' })).toBeDisabled();
    expect(screen.getByLabelText('Sale del partido')).toBeDisabled();
    expect(screen.getByLabelText('Entra desde el banco')).toBeDisabled();
  });

  it('limpia el mensaje de la solicitud cuando termina la pausa', async () => {
    const onSolicitarCambio = vi.fn().mockResolvedValue({
      mensaje: 'Sustitución encolada para la pausa siguiente.',
    });
    const props = {
      jugadoresEnCancha,
      convocatoria,
      jugadores,
      onSolicitarCambio,
    };
    const { rerender } = render(<CambioEnCancha {...props} pausado={false} />);

    fireEvent.change(screen.getByLabelText('Sale del partido'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Entra desde el banco'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar cambio' }));

    expect(await screen.findByText('Sustitución encolada para la pausa siguiente.')).toBeInTheDocument();

    rerender(<CambioEnCancha {...props} pausado />);
    rerender(<CambioEnCancha {...props} pausado={false} />);

    await waitFor(() => {
      expect(screen.queryByText('Sustitución encolada para la pausa siguiente.')).not.toBeInTheDocument();
    });
  });
});
