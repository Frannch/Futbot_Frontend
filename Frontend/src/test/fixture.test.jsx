import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import Fixture from '../components/fixture';

const mockFechas = [
  {
    id_fecha: 1,
    numero_fecha: 5,
    estado_fecha: 'actual',
    partidos: [
      {
        id: 101,
        local: 'Boca Juniors',
        visitante: 'River Plate',
        goles_local: 2,
        goles_visitante: 1,
        estado: '2T',
      },
    ],
  },
  {
    id_fecha: 2,
    numero_fecha: 6,
    estado_fecha: 'proxima',
    partidos: [
      {
        id: 102,
        local: 'Racing Club',
        visitante: 'Independiente',
        goles_local: 0,
        goles_visitante: 0,
        estado: 'Por jugar',
      },
    ],
  },
  {
    id_fecha: 3,
    numero_fecha: 4,
    estado_fecha: 'finalizada',
    partidos: [
      {
        id: 100,
        local: 'San Lorenzo',
        visitante: 'Huracán',
        goles_local: 1,
        goles_visitante: 0,
        estado: 'Finalizado',
      },
    ],
  },
];

describe('Fixture', () => {
  afterEach(() => {
    cleanup();
  });

  it('muestra el mensaje de estado vacío cuando no hay fechas', () => {
    render(<Fixture fechas={[]} />);

    expect(screen.getByText('No hay fechas ni partidos programados.')).toBeInTheDocument();
  });

  it('descarta las fechas con estado "finalizada" y muestra solo las activas', () => {
    render(<Fixture fechas={mockFechas} />);

    // Verifica las fechas que deben renderizarse
    expect(screen.getByText(/Fecha Actual \(5\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Próxima Fecha \(6\)/i)).toBeInTheDocument();

    // La fecha finalizada (numero_fecha: 4) no debe aparecer en el DOM
    expect(screen.queryByText(/Fecha 4/i)).not.toBeInTheDocument();
    expect(screen.queryByText('San Lorenzo')).not.toBeInTheDocument();
  });

  it('renderiza correctamente los equipos y el marcador de los partidos', () => {
    render(<Fixture fechas={mockFechas} />);

    // Equipos
    expect(screen.getByText('Boca Juniors')).toBeInTheDocument();
    expect(screen.getByText('River Plate')).toBeInTheDocument();

    // Marcador de la fecha actual
    expect(screen.getByText('2 - 1')).toBeInTheDocument();
  });

  it('renderiza el estado del partido en vivo (1T, 2T o Penales)', () => {
    render(<Fixture fechas={mockFechas} />);

    // El partido 101 está en '2T'
    expect(screen.getByText('2T')).toBeInTheDocument();
  });

  it('renderiza el estado "Por jugar" para partidos que no han iniciado', () => {
    render(<Fixture fechas={mockFechas} />);

    // El partido 102 está en 'Por jugar'
    expect(screen.getByText('Por jugar')).toBeInTheDocument();
  });

  it('muestra el botón de espectar solo para partidos en vivo', () => {
    render(<Fixture fechas={mockFechas} onEspectarPartido={() => {}} />);

    expect(screen.getByRole('button', { name: 'Espectar partido' })).toBeInTheDocument();
  });

  it('muestra los partidos como información si no se proporciona la acción de espectar', () => {
    render(<Fixture fechas={mockFechas} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Boca Juniors').closest('li')).toBeInTheDocument();
  });
});