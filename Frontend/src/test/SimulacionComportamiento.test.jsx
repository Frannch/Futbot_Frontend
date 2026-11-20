import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SimulacionComportamiento from '../components/layout/SimulacionComportamiento';

const simulacion = {
  ancho_cancha: 120,
  alto_cancha: 80,
  ticks: 2,
  frames: [
    {
      tick: 0,
      jugador: { x: 20, y: 30 },
      companero: { x: 35, y: 40 },
      pelota: { x: 25, y: 35 },
    },
    {
      tick: 1,
      jugador: { x: 30, y: 32 },
      companero: { x: 36, y: 41 },
      pelota: { x: 34, y: 33 },
    },
    {
      tick: 2,
      jugador: { x: 45, y: 34 },
      companero: { x: 38, y: 42 },
      pelota: { x: 43, y: 35 },
    },
  ],
};

describe('SimulacionComportamiento', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('usa las dimensiones del backend y presenta los personajes con colores de cancha', () => {
    render(<SimulacionComportamiento simulacion={simulacion} nombre="Defensor" />);

    const cancha = screen.getByRole('img', { name: 'Cancha de simulación de Defensor' });
    expect(cancha).toHaveAttribute('viewBox', '0 0 120 80');
    expect(cancha).toHaveStyle({ aspectRatio: '120 / 80' });
    expect(cancha.querySelector('circle[fill="#38bdf8"]')).toBeInTheDocument();
    expect(cancha.querySelector('circle[fill="#fb923c"]')).toBeInTheDocument();
    expect(screen.queryByText('Simulación')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancha: 120 × 80')).not.toBeInTheDocument();
  });

  it('reproduce automáticamente los frames y no muestra controles de pausa ni reinicio', () => {
    vi.useFakeTimers();
    const { container } = render(<SimulacionComportamiento simulacion={simulacion} nombre="Defensor" />);

    const jugador = container.querySelector('svg g[transform]');
    expect(jugador).toHaveAttribute('transform', 'translate(20 30)');
    act(() => vi.advanceTimersByTime(220));
    const posicionIntermedia = jugador.getAttribute('transform').match(/translate\(([^ ]+) ([^)]+)\)/);
    expect(Number(posicionIntermedia[1])).toBeGreaterThan(20);
    expect(Number(posicionIntermedia[1])).toBeLessThan(30);
    act(() => vi.advanceTimersByTime(500));
    expect(jugador).toHaveAttribute('transform', 'translate(45 34)');
    expect(screen.queryByRole('button', { name: /pausar|reproducir|reiniciar/i })).not.toBeInTheDocument();
  });

  it('muestra un estado vacío cuando no hay frames válidos', () => {
    render(<SimulacionComportamiento simulacion={{ ancho_cancha: 100, alto_cancha: 60, frames: [] }} />);

    expect(screen.getByRole('status')).toHaveTextContent('No hay datos de simulación para mostrar.');
  });
});
