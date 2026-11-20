import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CanchaAmistoso from '../../pages/CanchaAmistoso.jsx';

const { canchaRenderizada } = vi.hoisted(() => ({ canchaRenderizada: vi.fn() }));

vi.mock('../../pages/Cancha.jsx', () => ({
  default: (props) => {
    canchaRenderizada(props);
    return <div data-testid="cancha-amistoso" />;
  },
}));

describe('CanchaAmistoso', () => {
  it('adapta las props del partido amistoso al componente Cancha', () => {
    const estado = { tick: 3 };
    const convocatoriaPartido = [{ id_jugador: 1, rol: 'titular' }];
    const jugadoresPartido = [{ id_jugador: 1, nombre: 'Delantero' }];
    const comportamientosPartido = [{ id: 5, nombre: 'Presionar' }];
    const onSolicitarCambio = vi.fn();
    const onCambiarComportamiento = vi.fn();
    const cambiarPantalla = vi.fn();
    const onFinalizar = vi.fn();

    render(
      <CanchaAmistoso
        estado={estado}
        finalizado
        pausado
        cambiarPantalla={cambiarPantalla}
        onFinalizar={onFinalizar}
        convocatoriaPartido={convocatoriaPartido}
        jugadoresPartido={jugadoresPartido}
        comportamientosPartido={comportamientosPartido}
        onSolicitarCambio={onSolicitarCambio}
        onCambiarComportamiento={onCambiarComportamiento}
      />,
    );

    expect(screen.getByTestId('cancha-amistoso')).toBeInTheDocument();
    expect(canchaRenderizada).toHaveBeenCalledWith({
      estado,
      finalizado: true,
      pausado: true,
      cambiarPantalla,
      onFinalizar,
      convocatoria: convocatoriaPartido,
      jugadores: jugadoresPartido,
      jugadoresControlables: convocatoriaPartido,
      jugadoresDatosControlables: jugadoresPartido,
      comportamientos: comportamientosPartido,
      onSolicitarCambio,
      onCambiarComportamiento,
      soloTitulares: false,
    });
  });
});