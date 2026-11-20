import { useState } from 'react'
import Registro from './pages/Registro.jsx'
import ExploradorLigas from './pages/ExploradorLigas.jsx'
import MiClub from './pages/MiClub.jsx'
import CrearClub from './pages/CrearClub.jsx'
import Login from './pages/Login.jsx'
import DesafiosAmistosos from './pages/Amistosos.jsx'
import PartidosEnVivo from './pages/PartidosEnVivo.jsx'
import CanchaAmistoso from './pages/CanchaAmistoso.jsx'
import ReenviarVerificacion from './pages/ReenviarVerificacion.jsx'
import VerificacionEmail from './pages/VerificacionEmail.jsx'
import { useWebSocket } from './services/websocket.jsx'
import { registrarLigaClub } from './services/ligasClub.js'

function App() {
	const {
		desconectarWebSocket,
		estadoPartido,
		partidoVisible,
		partidoFinalizado,
		partidoPausado,
		finalizarPartido,
		convocatoriaPartido,
		jugadoresPartido,
		comportamientosPartido,
		solicitarCambioPartido,
		cambiarComportamientoPartido,
	} = useWebSocket()
	// const { desconectarWebSocket } = useWebSocket()

	const [pantalla, setPantalla] = useState(() => {
		const tieneSesion = localStorage.getItem('token') && localStorage.getItem('userId')
		const clubId = localStorage.getItem('clubId')
		const pantallaGuardada = localStorage.getItem('pantallaActual')
		return tieneSesion
			? clubId || pantallaGuardada === 'miClub'
				? 'mi-club'
				: pantallaGuardada || 'login'
			: 'login'
	})
	const [rutaEspecial, setRutaEspecial] = useState(() => (
		['/verificacion', '/reenviar-verificacion'].includes(window.location.pathname)
			? window.location.pathname
			: null
	))

	//Liga a la que entramos despues de crearla
	const [ligaActiva, setLigaActiva] = useState(null)
	const irAlLobby = (id, nombre, esCreador = false, cantidadEquipos = null) => {
		registrarLigaClub(id, nombre, undefined, esCreador)
		setLigaActiva({
			id,
			nombre,
			clubes: [],
			cuposOcupados: 0,
			fechas: [],
			esCreador,
			cantidadEquipos,
		})
		cambiarPantalla('lobby')
	}

	const cerrarSesion = () => {
		desconectarWebSocket()
		localStorage.removeItem('token')
		localStorage.removeItem('userId')
		localStorage.removeItem('clubId')
		localStorage.removeItem('pantallaActual')
		setPantalla('login')
	}

	const cambiarPantalla = (nuevaPantalla) => {
		if (rutaEspecial) {
			window.history.replaceState({}, '', '/')
			setRutaEspecial(null)
		}

		if (nuevaPantalla === 'ligas') {
			setLigaActiva(null)
		}

		setPantalla(nuevaPantalla)

		if (nuevaPantalla === 'login') {
			localStorage.removeItem('pantallaActual')
			return
		}

		localStorage.setItem('pantallaActual', nuevaPantalla)
	}

	if (rutaEspecial === '/verificacion') {
		return <VerificacionEmail cambiarPantalla={cambiarPantalla} />
	}
	if (rutaEspecial === '/reenviar-verificacion') {
		return <ReenviarVerificacion cambiarPantalla={cambiarPantalla} />
	}

	/*Si hay un partido activo, mostramos la cancha.
	  La cancha queda por encima de la pantalla actual.
	*/
	if (estadoPartido && partidoVisible && pantalla !== 'login' && pantalla !== 'partidos-en-vivo') {
		return (
			<div className="fixed inset-0 z-50 overflow-y-auto">
				<CanchaAmistoso
					estado={estadoPartido}
					finalizado={partidoFinalizado}
					pausado={partidoPausado}
					cambiarPantalla={cambiarPantalla}
					onFinalizar={finalizarPartido}
					convocatoriaPartido={convocatoriaPartido}
					jugadoresPartido={jugadoresPartido}
					comportamientosPartido={comportamientosPartido}
					onSolicitarCambio={solicitarCambioPartido}
					onCambiarComportamiento={cambiarComportamientoPartido}
				/>
			</div>
		)
	}

	if (pantalla === 'login') {
		return <Login cambiarPantalla={cambiarPantalla} />
	}
	if (pantalla === 'reenviar-verificacion') {
		return <ReenviarVerificacion cambiarPantalla={cambiarPantalla} />
	}
	if (pantalla == 'CrearClub'){
		return <CrearClub cambiarPantalla={cambiarPantalla} cerrarSesion={cerrarSesion}/>
	}
	if (pantalla === 'mi-club') {
		return <MiClub cambiarPantalla={cambiarPantalla} cerrarSesion={cerrarSesion} />
	}
	if (pantalla === 'amistosos') {
		return <DesafiosAmistosos cambiarPantalla={cambiarPantalla} cerrarSesion={cerrarSesion} />
	}

	if (pantalla === 'ligas' || pantalla === 'lobby') {
		return (
			<ExploradorLigas
				irAlLobby={irAlLobby}
				ligaActiva={ligaActiva}
				irALogin={() => cambiarPantalla('login')}
				cambiarPantalla={cambiarPantalla}
				cerrarSesion={cerrarSesion}
			/>
		)
	}

	if (pantalla === 'partidos-en-vivo') {
		return <PartidosEnVivo cambiarPantalla={cambiarPantalla} cerrarSesion={cerrarSesion} />
	}

	return <Registro cambiarPantalla={cambiarPantalla} />
}

export default App