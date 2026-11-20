import { useEffect, useState } from 'react';
import Fixture from './fixture';
import ListaClubesLiga from './ListaClubesLiga';
import AbandonarLiga from './AbandonarLiga';
import IniciarLiga from './IniciarLiga';
import CancelarLiga from './CancelarLiga';
import CambiarAlineacion from './CambiarAlineacion';
import useWebSocketLigas from '../hooks/useWebSocketLigas';
import { obtenerLobbyLiga } from '../services/ligas';
import { adaptarFixture } from '../utils/fixture';

function LobbyLiga({ liga, cambiarPantalla }) {
  const { ligas } = useWebSocketLigas(liga?.id);
  const [datosDeInicio, setDatosDeInicio] = useState({});
  const [datosLobby, setDatosLobby] = useState(null);
  const [ligaIniciadaLocal, setLigaIniciadaLocal] = useState(false);
  const [mostrarEditorAlineacion, setMostrarEditorAlineacion] = useState(false);
  const ligaActualizada = ligas.find((item) => String(item.id) === String(liga?.id));
  const estadoLiga = String(ligaActualizada?.estadoLiga ?? liga?.estadoLiga ?? liga?.estado ?? '')
    .toLowerCase()
    .replaceAll('_', ' ');
  const yaIniciada = ligaIniciadaLocal
    || Boolean(ligaActualizada?.enCurso ?? liga?.enCurso)
    || estadoLiga === 'iniciada'
    || estadoLiga === 'iniciado'
    || estadoLiga === 'en curso';

  useEffect(() => {
    if (yaIniciada && liga?.id) {
      obtenerLobbyLiga(liga.id)
        .then((datos) => {
          if (datos) {
            setDatosLobby({
              fechas: adaptarFixture(datos.fixture ?? []),
              tablas_posiciones: datos.tablas_posiciones,
              clubes: datos.tablas_posiciones?.map((p) => ({
                id: p.id_club,
                nombre: p.nombre,
                photo: p.avatar,
              })),
            });
          }
        })
        .catch((err) => {
          console.error('Error al cargar datos del lobby de la liga iniciada:', err);
        });
    }
  }, [yaIniciada, liga?.id]);

  const clubes = datosDeInicio.clubes
    ?? datosLobby?.clubes
    ?? ligaActualizada?.clubes
    ?? liga?.clubes
    ?? [];
  const fechasBase = datosDeInicio.fechas
    ?? datosLobby?.fechas
    ?? ligaActualizada?.fechas
    ?? liga?.fechas
    ?? [];
  const actualizacionesPartido = ligaActualizada?.actualizacionesPartido ?? {};
  const fechas = fechasBase.map((fecha) => ({
    ...fecha,
    partidos: (fecha.partidos ?? []).map((partido) => {
      const actualizacion = actualizacionesPartido[String(partido.id)];
      if (!actualizacion || !Array.isArray(actualizacion.marcador)) return partido;

      return {
        ...partido,
        goles_local: actualizacion.marcador[0],
        goles_visitante: actualizacion.marcador[1],
        estado: actualizacion.finalizado ? 'finalizado' : '1T',
      };
    }),
  }));
  const equiposDisponibles = ligaActualizada?.cuposOcupados
    ?? liga?.cuposOcupados
    ?? liga?.clubes?.length
    ?? 0;
  const espectarPartido = (partido) => {
    localStorage.setItem('partidoEspectadoId', String(partido.id));
    cambiarPantalla?.('partidos-en-vivo');
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">
          {liga?.nombre || 'Liga'}
        </h1>
        <IniciarLiga
          idLiga={liga?.id}
          cambiarPantalla={cambiarPantalla}
          esCreador={liga?.esCreador}
          equiposDisponibles={equiposDisponibles}
          yaIniciada={yaIniciada}
          alIniciar={(datos) => {
            setDatosDeInicio(datos);
            setLigaIniciadaLocal(true);
          }}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ListaClubesLiga
          clubes={clubes}
          fechas={fechas}
          iniciada={yaIniciada}
        />
        <div className="relative min-w-0">
          {yaIniciada && (
            <button
              type="button"
              onClick={() => setMostrarEditorAlineacion((visible) => !visible)}
              aria-label={mostrarEditorAlineacion ? 'Ver fixture' : 'Cambiar alineación'}
              className="absolute right-3 top-3 z-10 rounded border border-green-400 bg-[#0d1b13]/95 px-3 py-2 text-sm font-semibold text-green-300 shadow-lg transition-colors hover:bg-green-500 hover:text-[#0d1b13]"
            >
              {mostrarEditorAlineacion ? 'Ver fixture' : 'Cambiar alineación'}
            </button>
          )}
          {mostrarEditorAlineacion && yaIniciada ? (
            <CambiarAlineacion idLiga={liga?.id} />
          ) : (
            <Fixture fechas={fechas} onEspectarPartido={espectarPartido} />
          )}
        </div>
        <div aria-hidden="true" />
        {liga?.esCreador ? (
          <CancelarLiga
            idLiga={liga.id}
            esCreador
            cambiarPantalla={cambiarPantalla}
          />
        ) : (
          <AbandonarLiga idLiga={liga?.id} cambiarPantalla={cambiarPantalla} />
        )}
      </div>
    </div>
  );
}

export default LobbyLiga;