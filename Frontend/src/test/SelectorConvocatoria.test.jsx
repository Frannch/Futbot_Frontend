import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SelectorConvocatoria from '../components/SelectorConvocatoria';

const jugadores = Array.from({ length: 8 }, (_, i) => ({
  id_jugador: i + 1,
  nombre: `Jugador ${i + 1}`
}));

const comportamientos = [
  { id_comportamiento: 1, nombre: 'perseguir_balon' },
  { id_comportamiento: 2, nombre: 'cubrir_arco' },
  { id_comportamiento: 3, nombre: 'atacar_espacios' }
];

// titulares con los jugadores 1, 2 y 3; suplentes con el 4, 5 y 6
function completarConvocatoria() {
  [0, 1, 2].forEach((i) => {
    fireEvent.change(screen.getByLabelText(`Jugador ${i + 1}`), {
      target: { value: String(i + 1) }
    });
    fireEvent.change(screen.getByLabelText(`Comportamiento ${i + 1}`), {
      target: { value: comportamientos[i].nombre }
    });
    fireEvent.change(screen.getByLabelText(`Suplente ${i + 1}`), {
      target: { value: String(i + 4) }
    });
  });
}

describe('SelectorConvocatoria', () => {
  afterEach(cleanup);

  it('manda null hasta que la convocatoria queda completa', () => {
    const alCambiar = vi.fn();
    render(
      <SelectorConvocatoria jugadores={jugadores} comportamientos={comportamientos} alCambiar={alCambiar} />
    );

    fireEvent.change(screen.getByLabelText('Jugador 1'), { target: { value: '1' } });
    expect(alCambiar).toHaveBeenLastCalledWith(null);

    completarConvocatoria();
    expect(alCambiar.mock.lastCall[0]).not.toBeNull();

    // si le sacamos el comportamiento a un titular tiene que volver a null
    fireEvent.change(screen.getByLabelText('Comportamiento 2'), { target: { value: '' } });
    expect(alCambiar).toHaveBeenLastCalledWith(null);
  });

  it('arma los 6 convocados con comportamiento solo en los titulares', () => {
    const alCambiar = vi.fn();
    render(
      <SelectorConvocatoria jugadores={jugadores} comportamientos={comportamientos} alCambiar={alCambiar} />
    );

    completarConvocatoria();

    const convocatoria = alCambiar.mock.lastCall[0];
    const titulares = convocatoria.jugadores_convocados.filter((j) => j.rol === 'titular');
    const suplentes = convocatoria.jugadores_convocados.filter((j) => j.rol === 'suplente');

    expect(convocatoria.formacion_tactica).toBe(1);
    expect(titulares).toHaveLength(3);
    expect(titulares.every((j) => j.comportamiento)).toBe(true);
    expect(suplentes).toHaveLength(3);
    expect(suplentes.every((j) => j.comportamiento === undefined)).toBe(true);
  });

  it('no deja elegir dos veces al mismo jugador', () => {
    render(<SelectorConvocatoria jugadores={jugadores} comportamientos={comportamientos} />);

    fireEvent.change(screen.getByLabelText('Jugador 1'), { target: { value: '1' } });

    expect(screen.getByLabelText('Suplente 1').querySelector('option[value="1"]')).toBeDisabled();
  });

  it('inicializa los controles con la convocatoria recibida', () => {
    render(
      <SelectorConvocatoria
        jugadores={jugadores}
        comportamientos={comportamientos}
        convocatoriaInicial={{
          formacion_tactica: 3,
          jugadores_convocados: [
            { id_jugador: 1, rol: 'titular', comportamiento: 'perseguir_balon' },
            { id_jugador: 2, rol: 'titular', comportamiento: 'cubrir_arco' },
            { id_jugador: 3, rol: 'titular', comportamiento: 'atacar_espacios' },
            { id_jugador: 4, rol: 'suplente' },
            { id_jugador: 5, rol: 'suplente' },
            { id_jugador: 6, rol: 'suplente' },
          ],
        }}
      />
    );

    expect(screen.getByLabelText('Formación Táctica')).toHaveValue('3');
    expect(screen.getByLabelText('Jugador 1')).toHaveValue('1');
    expect(screen.getByLabelText('Comportamiento 2')).toHaveValue('cubrir_arco');
    expect(screen.getByLabelText('Suplente 3')).toHaveValue('6');
  });
});