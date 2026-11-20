/*
datos de prueba hasta que existan GET /api/jugadores y GET /api/comportamientos.
los skills suman 300 en todos, como pide la regla del juego
*/

export const JUGADORES = [
  { id_jugador: 1, nombre: 'Mario Cuenca', poder: 80, agilidad: 60, control: 60, velocidad: 60, fuerza: 40 },
  { id_jugador: 2, nombre: 'Julian Maidana', poder: 40, agilidad: 80, control: 60, velocidad: 80, fuerza: 40 },
  { id_jugador: 3, nombre: 'Victor Hugo Sotomayor', poder: 60, agilidad: 60, control: 80, velocidad: 60, fuerza: 40 },
  { id_jugador: 4, nombre: 'Adrian Avalos', poder: 70, agilidad: 50, control: 50, velocidad: 70, fuerza: 60 },
  { id_jugador: 5, nombre: 'Diego Garay', poder: 50, agilidad: 70, control: 70, velocidad: 50, fuerza: 60 },
  { id_jugador: 6, nombre: 'Rodrigo Astudillo', poder: 60, agilidad: 60, control: 60, velocidad: 60, fuerza: 60 },
  { id_jugador: 7, nombre: 'Dario Gigena', poder: 90, agilidad: 40, control: 50, velocidad: 60, fuerza: 60 },
  { id_jugador: 8, nombre: 'Jose Alfredo Zelaya', poder: 40, agilidad: 90, control: 70, velocidad: 60, fuerza: 40 }
];

export const COMPORTAMIENTOS = [
  { id_comportamiento: 1, nombre: 'Delantero' },
  { id_comportamiento: 2, nombre: 'Defensor Rustico' },
  { id_comportamiento: 3, nombre: 'Mediocampista' },
  { id_comportamiento: 4, nombre: 'Arquero' }
];