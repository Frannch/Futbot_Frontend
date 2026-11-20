import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ListaClubesLiga from '../../../components/layout/ListaClubesLiga.jsx';

describe('ListaClubesLiga', () => {
  afterEach(cleanup);

  it('calcula las estadísticas, ignora partidos no finalizados y ordena por puntos', () => {
    const clubes = [
      { id: 2, nombre: 'Dos FC' },
      { id: 1, nombre: 'Uno FC' },
      { id: 3, nombre: 'Tres FC' },
      { id: 4, nombre: 'Cero FC' },
    ];
    const fechas = [
      {
        estado_fecha: 'finalizada',
        partidos: [
          { local: 'Uno FC', visitante: 'Dos FC', goles_local: 2, goles_visitante: 0 },
          { local: 'Tres FC', visitante: 'Cero FC', goles_local: 1, goles_visitante: 1 },
        ],
      },
      {
        estado_fecha: 'actual',
        partidos: [
          { local: 'Dos FC', visitante: 'Tres FC', goles_local: 8, goles_visitante: 0, estado: '2T' },
        ],
      },
    ];

    render(<ListaClubesLiga clubes={clubes} fechas={fechas} iniciada />);

    const filas = screen.getAllByRole('row').slice(1);
    expect(filas.map((fila) => within(fila).getAllByRole('cell')[0].textContent)).toEqual([
      '1', '2', '3', '4',
    ]);
    expect(filas.map((fila) => fila.querySelector('th').textContent)).toEqual([
      'Uno FC', 'Cero FC', 'Tres FC', 'Dos FC',
    ]);
    expect(filas[0].querySelector('th')).toHaveClass('text-yellow-300');

    const filaUno = filas.find((fila) => fila.textContent.includes('Uno FC'));
    expect(within(filaUno).getAllByRole('cell').map((celda) => celda.textContent)).toEqual([
      '1', '1', '1', '0', '0', '2', '0', '+2', '3',
    ]);
    expect(screen.getByRole('columnheader', { name: 'PJ' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'PTS' })).toBeInTheDocument();
  });

  it('suma el resultado al puntaje solo cuando el partido termina', () => {
    const clubes = [
      { id: 1, nombre: 'Local FC' },
      { id: 2, nombre: 'Visitante FC' },
    ];
    const fechas = [{
      estado_fecha: 'actual',
      partidos: [{
        local: 'Local FC',
        visitante: 'Visitante FC',
        goles_local: 2,
        goles_visitante: 0,
        estado: '1T',
      }],
    }];
    const { rerender } = render(<ListaClubesLiga clubes={clubes} fechas={fechas} iniciada />);

    const filaEnVivo = screen.getByRole('row', { name: /Local FC/ });
    expect(within(filaEnVivo).getAllByRole('cell')[1]).toHaveTextContent('0');
    expect(within(filaEnVivo).getAllByRole('cell')[8]).toHaveTextContent('0');

    rerender(
      <ListaClubesLiga
        clubes={clubes}
        fechas={[{
          ...fechas[0],
          partidos: [{ ...fechas[0].partidos[0], estado: 'finalizado' }],
        }]}
        iniciada
      />
    );

    const filaFinal = screen.getByRole('row', { name: /Local FC/ });
    expect(within(filaFinal).getAllByRole('cell')[1]).toHaveTextContent('1');
    expect(within(filaFinal).getAllByRole('cell')[8]).toHaveTextContent('3');
  });

  it('no inventa posiciones cuando no hay clubes ni resultados', () => {
    render(<ListaClubesLiga />);

    expect(screen.getByText('Todavía no hay clubes para mostrar.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});