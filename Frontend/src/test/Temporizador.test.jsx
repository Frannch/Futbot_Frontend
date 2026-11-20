import { cleanup, act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Temporizador from '../components/Temporizador.jsx';

const clubes = {
  local: {
    nombre: 'Mi Club',
    escudo: '/club-local.png'
  },
  rival: {
    nombre: 'Atletico Norte',
    escudo: '/club-rival.png'
  }
};

describe('Temporizador', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('muestra los clubes y comienza en 05:00', () => {
    render(
      <Temporizador
        clubLocal={clubes.local}
        clubRival={clubes.rival}
        onTiempoExpirado={vi.fn()}
      />
    );

    expect(screen.getByText('Mi Club')).toBeInTheDocument();
    expect(screen.getByText('Atletico Norte')).toBeInTheDocument();
    expect(screen.getByText('VS')).toBeInTheDocument();
    expect(screen.getByText('05:00')).toBeInTheDocument();
    expect(screen.getByText('Esperando respuesta del rival...')).toBeInTheDocument();
  });

  it('decrementa un segundo cada segundo', () => {
    render(
      <Temporizador
        clubLocal={clubes.local}
        clubRival={clubes.rival}
        onTiempoExpirado={vi.fn()}
      />
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('04:59')).toBeInTheDocument();
  });

  it('usa el mensaje y los segundos recibidos desde el padre', () => {
    render(
      <Temporizador
        segundosIniciales={10}
        mensaje="El club rival te envió un desafío."
        titulo="NUEVA SOLICITUD"
        onTiempoExpirado={vi.fn()}
      />
    );

    expect(screen.getByText('NUEVA SOLICITUD')).toBeInTheDocument();
    expect(screen.getByText('El club rival te envió un desafío.')).toBeInTheDocument();
    expect(screen.getByText('00:10')).toBeInTheDocument();
  });

  it('no reinicia la cuenta cuando cambia la referencia del callback', () => {
    const { rerender } = render(
      <Temporizador
        segundosIniciales={10}
        onTiempoExpirado={() => {}}
      />
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    rerender(<Temporizador segundosIniciales={10} onTiempoExpirado={() => {}} />);

    expect(screen.getByText('00:08')).toBeInTheDocument();
  });

  it('avisa al padre cuando la cuenta llega a cero', () => {
    const onTiempoExpirado = vi.fn();

    render(
      <Temporizador
        clubLocal={clubes.local}
        clubRival={clubes.rival}
        onTiempoExpirado={onTiempoExpirado}
      />
    );

    act(() => {
      vi.advanceTimersByTime(300_000);
    });

    expect(onTiempoExpirado).toHaveBeenCalledTimes(1);
  });

  it('detiene el intervalo cuando el padre desmonta el temporizador', () => {
    const onTiempoExpirado = vi.fn();

    const { unmount } = render(
      <Temporizador
        clubLocal={clubes.local}
        clubRival={clubes.rival}
        onTiempoExpirado={onTiempoExpirado}
      />
    );

    unmount();

    act(() => {
      vi.advanceTimersByTime(300_000);
    });

    expect(onTiempoExpirado).not.toHaveBeenCalled();
  });
});
