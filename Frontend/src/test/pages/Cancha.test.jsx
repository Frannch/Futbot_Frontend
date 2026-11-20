import { describe, expect, it, vi, beforeEach, afterEach,} from 'vitest';

import { act, render,  screen,  fireEvent,  cleanup, waitFor,} from '@testing-library/react';

import Cancha from '../pages/Cancha.jsx';

const estadoInicial = {
  tick: 10,
  ticks_totales: 100,
  marcador: [2, 1],
  cancha: {ancho: 100, alto: 60,},
  clubes: { local: {   nombre: 'Club Local', }, visitante: {   nombre: 'Club Visitante', },
  },
  jugadores: [
    { id: 1, nombre: 'Carlos', equipo: 0, x: 20, y: 30, },
    { id: 2, nombre: 'Juan', equipo: 1, x: 80, y: 30, },
  ],
  pelota: { x: 50, y: 30,},
};

describe('Cancha', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(performance.now() + 1000);
      return 1;
    });

    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renderiza los nombres de los clubes y el marcador', () => {
    render(<Cancha estado={estadoInicial} />);

    expect(screen.getAllByText('Club Local').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Club Visitante').length).toBeGreaterThan(0);

    expect(screen.getByText('CAR')).toBeInTheDocument();
    expect(screen.getByText('JUA')).toBeInTheDocument();
  });

  it('muestra el estado de conexión', () => {
    render(<Cancha  estado={estadoInicial}  estadoConexion="conectado"/>,);

    expect(screen.getByText('Conectado')).toBeInTheDocument();
  });

  it('muestra el estado de conexión como desconectado', () => {
    render( <Cancha    estado={estadoInicial}    estadoConexion="desconectado"  />,);

    expect(screen.getByText('Desconectado')).toBeInTheDocument();
  });

  it('muestra un mensaje de error cuando se proporciona', () => {
    render( <Cancha    estado={estadoInicial}    error="No se pudo conectar con el servidor"  />,);

    expect(screen.getByText('No se pudo cargar el partido'),).toBeInTheDocument();

    expect(screen.getByText('No se pudo conectar con el servidor'),).toBeInTheDocument();

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('muestra los jugadores en la cancha', () => {
    const { container } = render(<Cancha estado={estadoInicial} />,);

    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);

    // Los nombres de los jugadores están dentro de elementos <title> del SVG.
    const titles = Array.from(
      container.querySelectorAll('svg title'),
    ).map((title) => title.textContent);

    expect(titles).toContain('Carlos');
    expect(titles).toContain('Juan');
  });

  it('genera etiquetas con iniciales según la cantidad de nombres', () => {
    render(
      <Cancha
        estado={{
          ...estadoInicial,
          jugadores: [
            { id: 1, nombre: 'Juan Perez', equipo: 0, x: 20, y: 30 },
            { id: 2, nombre: 'Juan Carlos Perez', equipo: 1, x: 80, y: 30 },
          ],
        }}
      />
    );

    expect(screen.getByText('JP')).toBeInTheDocument();
    expect(screen.getByText('JCP')).toBeInTheDocument();
  });

  it('muestra nombres solo para jugadores propios y IDs para rivales al dirigir', () => {
    const { container } = render(
      <Cancha
        estado={{
          ...estadoInicial,
          jugadores: [
            { id: 1, nombre: 'Carlos', equipo: 0, x: 20, y: 30 },
            { id: 2, nombre: 'Rival', equipo: 1, x: 80, y: 30 },
          ],
        }}
        jugadoresControlables={[{ id_jugador: 1, nombre: 'Carlos' }]}
        puedeControlar
      />,
    );

    const titles = Array.from(container.querySelectorAll('svg title'))
      .map((title) => title.textContent);
    expect(titles).toContain('Carlos');
    expect(titles).toContain('Jugador 2');
    expect(titles).not.toContain('Rival');
  });

  it('muestra IDs para todos los jugadores en modo espectador', () => {
    const { container } = render(
      <Cancha
        estado={estadoInicial}
        puedeControlar={false}
      />,
    );

    const titles = Array.from(container.querySelectorAll('svg title'))
      .map((title) => title.textContent);
    expect(titles).toContain('Jugador 1');
    expect(titles).toContain('Jugador 2');
    expect(titles).not.toContain('Carlos');
    expect(titles).not.toContain('Juan');
  });

  it('muestra la pelota en la cancha', () => {
    const { container } = render(<Cancha estado={estadoInicial} />,);

    const titles = Array.from(
      container.querySelectorAll('svg title'),
    ).map((title) => title.textContent);

    expect(titles).toContain('Pelota');
  });

  it('conserva los nombres cuando un tick posterior solo actualiza posiciones', () => {
    window.requestAnimationFrame.mockImplementation((callback) => {
      callback(performance.now() + 1000);
      return 1;
    });
    const { rerender, container } = render(<Cancha estado={estadoInicial} />);

    rerender(
      <Cancha
        estado={{
          ...estadoInicial,
          tick: 11,
          jugadores: [
            { id: 1, equipo: 0, x: 25, y: 30 },
            { id: 2, equipo: 1, x: 75, y: 30 },
          ],
        }}
      />
    );

    const titles = Array.from(container.querySelectorAll('svg title'))
      .map((title) => title.textContent);
    expect(titles).toContain('Carlos');
    expect(titles).toContain('Juan');
  });

  it('cubre la cancha con el aviso durante la pausa', () => {
    render(<Cancha estado={{ ...estadoInicial, tick: 25, ticks_totales: 100 }} pausado />);

    expect(screen.getByRole('status')).toHaveTextContent('Cooling Break #1');
    expect(screen.getByText('Realizando sustituciones')).toBeInTheDocument();
  });

  it('muestra el rótulo de la pausa según el tick del partido', () => {
    const { unmount } = render(
      <Cancha estado={{ ...estadoInicial, tick: 50, ticks_totales: 100 }} pausado />
    );

    expect(screen.getByRole('heading', { name: 'Medio Tiempo' })).toBeInTheDocument();

    unmount();
    render(
      <Cancha estado={{ ...estadoInicial, tick: 75, ticks_totales: 100 }} pausado />
    );
    expect(screen.getByRole('heading', { name: 'Cooling Break #2' })).toBeInTheDocument();
  });

  it('cuenta desde 10 hasta 0 durante la pausa y se detiene al reanudar', () => {
    vi.useFakeTimers();
    const { rerender } = render(<Cancha estado={null} pausado />);

    expect(screen.getByLabelText('10')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByLabelText('7')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(7000));
    expect(screen.getByLabelText('0')).toBeInTheDocument();

    rerender(<Cancha estado={null} pausado={false} />);
    expect(screen.queryByLabelText('0')).not.toBeInTheDocument();
  });

  it('no muestra la capa de pausa durante el juego', () => {
    render(<Cancha estado={estadoInicial} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText('Cooling Break #1')).not.toBeInTheDocument();
  });

  it('ubica el selector junto a la cancha y deja espacio reservado arriba', () => {
    const onSolicitarCambio = vi.fn();
    const { container } = render(
      <Cancha
        estado={estadoInicial}
        convocatoria={[
          { id_jugador: 1, rol: 'titular' },
          { id_jugador: 3, rol: 'suplente' },
        ]}
        jugadores={[{ id_jugador: 1, nombre: 'Carlos' }, { id_jugador: 3, nombre: 'Pedro' }]}
        onSolicitarCambio={onSolicitarCambio}
      />
    );

    expect(screen.getByRole('heading', { name: 'Cambio de jugador' })).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"].min-h-32')).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Juan' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Sale del partido'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Entra desde el banco'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar cambio' }));

    expect(onSolicitarCambio).toHaveBeenCalledWith({
      id_jugador_sale: 1,
      id_jugador_entra: 3,
    });
  });

  it('mantiene los suplentes que entran y muestra sus nombres en comportamientos', () => {
    render(
      <Cancha
        estado={{
          ...estadoInicial,
          jugadores: [
            { id: 1, nombre: 'Carlos', equipo: 0, x: 20, y: 30 },
            { id: 3, equipo: 0, x: 30, y: 30 },
          ],
        }}
        convocatoria={[
          { id_jugador: 1, rol: 'titular', comportamiento: 'Defensor' },
          { id_jugador: 3, rol: 'suplente' },
        ]}
        jugadores={[
          { id_jugador: 1, nombre: 'Carlos' },
          { id_jugador: 3, nombre: 'Pedro' },
        ]}
        comportamientos={[
          { id_comportamiento: 1, nombre: 'Defensor' },
        ]}
        onCambiarComportamiento={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Comportamiento de Carlos')).toBeInTheDocument();
    expect(screen.getByLabelText('Comportamiento de Pedro')).toBeInTheDocument();
    expect(screen.queryByLabelText('Comportamiento de Juan')).not.toBeInTheDocument();
  });

  it('cruza los jugadores controlables con el plantel para mostrar sus nombres', async () => {
    render(
      <Cancha
        estado={{
          ...estadoInicial,
          jugadores: [
            { id: 1, equipo: 0, x: 20, y: 30 },
            { id: 2, equipo: 0, x: 25, y: 30 },
            { id: 3, equipo: 0, x: 30, y: 30 },
          ],
        }}
        convocatoria={[
          { id_jugador: 1, rol: 'titular' },
          { id_jugador: 2, rol: 'titular' },
          { id_jugador: 3, rol: 'titular' },
        ]}
        jugadoresControlables={[
          { id_jugador: 1, rol: 'titular' },
          { id_jugador: 2, rol: 'titular' },
          { id_jugador: 3, rol: 'titular' },
        ]}
        jugadores={[
          { id_jugador: 1, nombre: 'Carlos' },
          { id_jugador: 2, nombre: 'Pedro' },
          { id_jugador: 3, nombre: 'Luis' },
        ]}
        comportamientos={[{ id_comportamiento: 1, nombre: 'Defensor' }]}
        onCambiarComportamiento={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Comportamiento de Carlos')).toBeInTheDocument();
      expect(screen.getByLabelText('Comportamiento de Pedro')).toBeInTheDocument();
      expect(screen.getByLabelText('Comportamiento de Luis')).toBeInTheDocument();
    });
  });

  it('muestra solo titulares de una convocatoria de liga y usa sus nombres', () => {
    render(
      <Cancha
        estado={{
          ...estadoInicial,
          jugadores: [
            { id: 14, equipo: 0, x: 20, y: 30 },
            { id: 18, equipo: 0, x: 25, y: 30 },
            { id: 17, equipo: 0, x: 30, y: 30 },
            { id: 8, equipo: 1, x: 70, y: 30 },
          ],
        }}
        convocatoria={{
          0: [
            { id_jugador: 14, nombre: 'Titular Local', rol: 'titular' },
            { id_jugador: 18, nombre: 'Suplente Local', rol: 'suplente' },
            { id_jugador: 17, nombre: 'Otro Suplente', rol: 'suplente' },
          ],
          1: [
            { id_jugador: 8, nombre: 'Titular Visitante', rol: 'titular' },
          ],
        }}
        soloTitulares
        comportamientos={[{ id_comportamiento: 1, nombre: 'Presionar' }]}
        onCambiarComportamiento={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Comportamiento de Titular Local')).toBeInTheDocument();
    expect(screen.getByLabelText('Comportamiento de Titular Visitante')).toBeInTheDocument();
    expect(screen.queryByLabelText('Comportamiento de Suplente Local')).not.toBeInTheDocument();
  });

  it('muestra el progreso del partido', () => {
    render(<Cancha estado={estadoInicial} />);

    expect(screen.getByText('10 / 100 ticks'),).toBeInTheDocument();
  });

  it('calcula correctamente el porcentaje de progreso', () => {
    const { container } = render(
      <Cancha
        estado={{
          ...estadoInicial,
          tick: 25,
          ticks_totales: 100,
        }}
      />,
    );

    const barra = container.querySelector('div[style="width: 25%;"]',);

    expect(barra).toBeInTheDocument();
  });

  it('muestra el botón para volver a MiClub cuando el partido finaliza', () => {
    render( <Cancha    estado={estadoInicial}    finalizado  />,);

    expect(screen.getByText('Partido finalizado'),).toBeInTheDocument();
    expect(screen.getByText('FIN')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'VOLVER A MI CLUB', }),).toBeInTheDocument();
  });

  it('no muestra el botón para volver a MiClub si el partido no finalizó', () => {
    render(<Cancha estado={estadoInicial} finalizado={false} />,);

    expect(screen.queryByText('Partido finalizado'),).not.toBeInTheDocument();
    expect(screen.queryByText('FIN')).not.toBeInTheDocument();

    expect(screen.queryByRole('button', { name: 'VOLVER A MI CLUB',  }),).not.toBeInTheDocument();
  });

  it('muestra Dejar de ver durante un partido propio', () => {
    const cambiarPantalla = vi.fn();
    render(
      <Cancha
        estado={estadoInicial}
        cambiarPantalla={cambiarPantalla}
        onFinalizar={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dejar de ver' }));

    expect(cambiarPantalla).toHaveBeenCalledWith('mi-club');
  });

  it('ejecuta onFinalizar y vuelve a MiClub al finalizar el partido', () => {
    const onFinalizar = vi.fn();
    const cambiarPantalla = vi.fn();

    render(
      <Cancha
        estado={estadoInicial}
        finalizado
        onFinalizar={onFinalizar}
        cambiarPantalla={cambiarPantalla}
      />,
    );

    fireEvent.click(screen.getByRole('button', {  name: 'VOLVER A MI CLUB',}),);

    expect(onFinalizar).toHaveBeenCalledTimes(1);
    expect(cambiarPantalla).toHaveBeenCalledTimes(1);
    expect(cambiarPantalla).toHaveBeenCalledWith('mi-club');
  });

  it('funciona aunque no se proporcione onFinalizar', () => {
    const cambiarPantalla = vi.fn();

    render(<Cancha  estado={estadoInicial}  finalizado  cambiarPantalla={cambiarPantalla}/>,);

    fireEvent.click(screen.getByRole('button', { name: 'VOLVER A MI CLUB',  }),);

    expect(cambiarPantalla).toHaveBeenCalledWith('mi-club');
  });

  it('funciona aunque no se proporcione cambiarPantalla', () => {
    const onFinalizar = vi.fn();

    render(<Cancha  estado={estadoInicial}  finalizado  onFinalizar={onFinalizar}/>,);

    fireEvent.click(screen.getByRole('button', { name: 'VOLVER A MI CLUB',  }),);

    expect(onFinalizar).toHaveBeenCalledTimes(1);
  });

  it('usa valores por defecto cuando faltan datos de clubes', () => {
    render(
      <Cancha
        estado={{
          ...estadoInicial,
          clubes: undefined,
        }}
      />,
    );

    // El componente utiliza "Local" y "Visitante" como valores por defecto.
    expect(screen.getByText('Local')).toBeInTheDocument();
    expect(screen.getByText('Visitante')).toBeInTheDocument();
  });

  it('muestra "Esperando estado" cuando todavía no existe un estado visual', () => {
    render(<Cancha estado={null} />);

    expect(screen.getByText('Esperando estado'),).toBeInTheDocument();
  });

  describe('Definición por Penales', () => {
    const estadoPenales = {
      fase: 'definicion',
      ronda_penal: 2,
      tick: 30,
      ticks_totales: 600,
      marcador: [0, 0], // duelo 1v1 actual
      resultado_penales: [1, 0],
      marcador_reglamentario: [2, 2],
      ganador_definicion: null,
      equipo_ganador: null,
      cancha: { ancho: 100, alto: 60 },
      clubes: {
        local: { id_club: 1, nombre: 'Boca Juniors' },
        visitante: { id_club: 2, nombre: 'River Plate' },
      },
      historial_penales: [
        { ronda: 1, ganador_ronda: 0, resultado_penales: [1, 0] },
      ],
      jugadores: [
        { id: 10, nombre: 'Pateador 1', equipo: 0, x: 42, y: 30 },
        { id: 20, nombre: 'Arquero 1', equipo: 1, x: 58, y: 30 },
        { id: 11, equipo: 0, x: 3, y: 3 },
        { id: 12, equipo: 0, x: 3, y: 57 },
        { id: 21, equipo: 1, x: 97, y: 3 },
        { id: 22, equipo: 1, x: 97, y: 57 },
      ],
      pelota: { x: 50, y: 30 },
    };

    it('renderiza el marcador reglamentario en grande y el tanteador de penales secundario', () => {
      render(<Cancha estado={estadoPenales} />);

      expect(screen.getByText('Definición por penales')).toBeInTheDocument();
      expect(screen.getByLabelText('Marcador reglamentario local: 2')).toBeInTheDocument();
      expect(screen.getByLabelText('Marcador reglamentario visitante: 2')).toBeInTheDocument();
      expect(screen.getByLabelText('Penales Local: 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Penales Visitante: 0')).toBeInTheDocument();
      expect(screen.getByText('Duelo 1v1 ronda #2: 0 - 0')).toBeInTheDocument();
    });

    it('muestra los indicadores de ronda ganada, fallada y en disputa', () => {
      render(<Cancha estado={estadoPenales} />);

      expect(screen.getByTitle('Ronda 1: Anotó')).toBeInTheDocument(); // Local ganó ronda 1
      expect(screen.getByTitle('Ronda 1: Falló')).toBeInTheDocument(); // Visitante perdió ronda 1
      expect(screen.getAllByTitle('Ronda 2: En juego').length).toBe(2); // Ambas están en juego
      expect(screen.getAllByTitle('Ronda 3: Pendiente').length).toBe(2);
    });

    it('deshabilita las sustituciones durante la tanda de penales', () => {
      render(
        <Cancha
          estado={estadoPenales}
          convocatoria={[
            { id_jugador: 10, rol: 'titular' },
            { id_jugador: 30, rol: 'suplente' },
          ]}
          jugadores={[{ id_jugador: 10, nombre: 'Pateador 1' }, { id_jugador: 30, nombre: 'Suplente' }]}
          onSolicitarCambio={vi.fn()}
        />
      );

      expect(screen.getByLabelText('Sale del partido')).toBeDisabled();
      expect(screen.getByText('Sustituciones no disponibles durante la tanda de penales')).toBeInTheDocument();
    });

    it('muestra la notificación de ronda finalizada con el equipo ganador', () => {
      render(
        <Cancha
          estado={{
            ...estadoPenales,
            tipo: 'PENAL_RONDA_FINALIZADA',
            ganador_ronda: 0,
            ronda_penal: 2,
          }}
        />
      );

      expect(screen.getByText(/¡Ronda #2 finalizada!/)).toBeInTheDocument();
      expect(screen.getByText(/Ganador:/)).toHaveTextContent('Boca Juniors');
    });

    it('muestra la tarjeta de victoria por penales al finalizar el partido con ganador_definicion', () => {
      render(
        <Cancha
          estado={{
            ...estadoPenales,
            fase: 'finalizado',
            resultado_penales: [3, 1],
            ganador_definicion: 0,
            equipo_ganador: 0,
          }}
          finalizado
        />
      );

      expect(screen.getByRole('region', { name: 'Resultado de la definición por penales' })).toBeInTheDocument();
      expect(screen.getByText('Ganador de la definición por penales')).toBeInTheDocument();
      expect(screen.getByText('Penales: 3 - 1')).toBeInTheDocument();
      expect(screen.getByText('(Reglamentario: 2 - 2)')).toBeInTheDocument();
      expect(screen.getByText('Partido finalizado')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'VOLVER A MI CLUB' })).toBeInTheDocument();
    });

    it('no muestra la tarjeta de penales si el partido finaliza sin definición por penales', () => {
      render(
        <Cancha
          estado={{
            ...estadoInicial,
            fase: 'finalizado',
            marcador: [3, 1],
            ganador_definicion: null,
            resultado_penales: null,
          }}
          finalizado
        />
      );

      expect(screen.queryByRole('region', { name: 'Resultado de la definición por penales' })).not.toBeInTheDocument();
      expect(screen.getByText('FIN')).toBeInTheDocument();
      expect(screen.getByText('Partido finalizado')).toBeInTheDocument();
    });

    it('mantiene el marcador regular como principal aunque exista un resultado de penales sin empate', () => {
      render(
        <Cancha
          estado={{
            ...estadoInicial,
            marcador: [3, 1],
            resultado_penales: [0, 0],
          }}
        />
      );

      expect(screen.getByLabelText('Marcador reglamentario local: 3')).toBeInTheDocument();
      expect(screen.getByLabelText('Marcador reglamentario visitante: 1')).toBeInTheDocument();
      expect(screen.queryByText('Penales')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Penales Local: 0')).not.toBeInTheDocument();
    });
  });
});
