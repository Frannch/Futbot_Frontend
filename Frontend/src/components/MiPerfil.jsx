import { useCallback, useEffect, useState } from 'react';
import InputTexto from './InputTexto.jsx';
import BotonPrimario from './BotonPrimario.jsx';
import {
  actualizarPerfil,
  obtenerPerfil,
  obtenerIdUsuarioActual,
  obtenerTokenUsuarioActual,
  PERFIL_MOCK_ACTIVO,
} from '../services/perfilService.js';

function MiPerfil({
  abierto = true,
  esModal = true,
  alCerrar,
  onClose,
  cambiarPantalla,
  alRedirigirLobby,
  onCerrarSesion,
}) {
  const userId = obtenerIdUsuarioActual();

  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensajeErrorGuardar, setMensajeErrorGuardar] = useState('');
  const [toast, setToast] = useState(null);

  const [formValores, setFormValores] = useState({
    username: '',
    email: '',
  });

  const manejarCerrar = alCerrar || onClose;

  const redirigirAlLobby = useCallback(() => {
    if (alRedirigirLobby) {
      alRedirigirLobby();
    } else if (cambiarPantalla) {
      cambiarPantalla('mi-club');
    } else if (manejarCerrar) {
      manejarCerrar();
    }
  }, [alRedirigirLobby, cambiarPantalla, manejarCerrar]);

  useEffect(() => {
    let cancelado = false;

    async function cargarPerfil() {
      setCargando(true);

      const token = obtenerTokenUsuarioActual();

      if ((!userId || !token) && !PERFIL_MOCK_ACTIVO) {
        if (!cancelado) {
          setToast({
            tipo: 'error',
            mensaje: 'No se encontró una sesión válida.',
          });
          setCargando(false);
        }
        return;
      }

      try {
        const datos = await obtenerPerfil(userId, token);

        if (cancelado) return;

        const perfilFormateado = {
          id: datos.id ?? userId,
          username: datos.username ?? datos.nombre_usuario ?? datos.nombre ?? '', //TODO reemplazar al tener endpoint implemetnado
          email: datos.email ?? datos.mail ?? datos.correo ?? '',
          avatar_url: datos.avatar_url ?? datos.avatar ?? datos.foto ?? datos.photo ?? '', //TODO evaluar si es necesario formatear/si se envia foto
        };

        setUsuario(perfilFormateado);
        setFormValores({
          username: perfilFormateado.username,
          email: perfilFormateado.email,
        });
      } catch (error) {
        if (cancelado) return;

        let mensaje = 'Error al cargar el perfil.';
        if (error.status === 403) {
          mensaje = 'No tienes permisos para acceder a este perfil (HTTP 403).';
        } else if (error.status === 404) {
          mensaje = 'El usuario no fue encontrado (HTTP 404).';
        } else if (error.status >= 500) {
          mensaje = 'Error interno del servidor (HTTP 500).';
        } else if (error.message) {
          mensaje = error.message;
        }

        setToast({ tipo: 'error', mensaje });
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    cargarPerfil();

    return () => {
      cancelado = true;
    };
  }, [userId, redirigirAlLobby]);

  const manejarGuardar = async (e) => {
    e.preventDefault();
    setMensajeErrorGuardar('');

    if (!formValores.username.trim() || !formValores.email.trim()) {
      setMensajeErrorGuardar('El nombre de usuario y el correo son obligatorios.');
      return;
    }

    setGuardando(true);
    const token = localStorage.getItem('token');
    const cambiosSolicitados = {
      username: formValores.username.trim(),
      email: formValores.email.trim(),
    };

    try {
      await actualizarPerfil(
        userId,
        cambiosSolicitados,
        token
      );
      setFormValores({
        username: usuario.username,
        email: usuario.email,
      });
      setModoEdicion(false);
      setToast({
        tipo: 'exito',
        mensaje: 'Revisa tu bandeja de entrada para confirmar los cambios',
      });
    } catch (error) {
      setMensajeErrorGuardar(error.message || 'Error al guardar cambios.');
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto) return null;

  const contenido = (
    <div className={`relative flex flex-col text-white shadow-2xl overflow-hidden ${
      esModal
        ? 'h-full min-h-screen w-full rounded-none border-l border-[#283593] bg-[#1a237e] p-6'
        : 'w-full max-w-md rounded-xl border border-[#283593] bg-[#1a237e] p-6 sm:p-8'
    }`}>
      {/* Indicador de carga */}
      {cargando && (
        <div
          role="status"
          aria-label="Cargando perfil"
          className="flex flex-col items-center justify-center py-12"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
          <span className="mt-3 text-sm font-medium text-gray-300">
            Cargando perfil...
          </span>
        </div>
      )}

      {/* Vista de Datos y Edición */}
      {!cargando && usuario && (
        <div className="flex flex-col items-center">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full border border-gray-600 bg-[#0d1b13] text-4xl font-bold text-gray-300"
            aria-label={`Inicial de ${usuario.username}`}
          >
            {usuario.username.trim().charAt(0).toUpperCase()}
          </div>

          {!modoEdicion ? (
            /* Modo Lectura */
            <>
              {/* Abajo el nombre */}
              <h2 className="text-2xl font-bold text-white text-center mt-4 tracking-wide">
                {usuario.username}
              </h2>

              {/* Abajo el mail */}
              <p className="text-sm text-gray-300 text-center mt-1">
                {usuario.email}
              </p>

              {/* Botón para editar valores */}
              <div className="mt-6 w-full">
                <BotonPrimario
                  texto="Editar Perfil"
                  onClick={() => setModoEdicion(true)}
                />
              </div>
            </>
          ) : (
            /* Modo Input (Edición) */
            <form onSubmit={manejarGuardar} className="mt-4 space-y-4 w-full" noValidate>
              <InputTexto
                label="Nombre de Usuario"
                id="edit-username"
                valor={formValores.username}
                alCambiar={(e) =>
                  setFormValores({ ...formValores, username: e.target.value })
                }
                required
              />

              <InputTexto
                label="Correo Electrónico"
                id="edit-email"
                tipo="email"
                valor={formValores.email}
                alCambiar={(e) =>
                  setFormValores({ ...formValores, email: e.target.value })
                }
                required
              />
            {/*TODO agregar input opcional para nueva contraseña al editar perfil (KAN-127)*/ }
              {mensajeErrorGuardar && (
                <p
                  role="alert"
                  className="text-sm text-red-200 bg-red-950/60 border border-red-500 rounded p-2 text-center"
                >
                  {mensajeErrorGuardar}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormValores({
                      username: usuario.username,
                      email: usuario.email,
                    });
                    setModoEdicion(false);
                    setMensajeErrorGuardar('');
                  }}
                  disabled={guardando}
                  className="flex-1 rounded-md border border-gray-500 px-4 py-2 text-sm font-semibold text-gray-200 transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <BotonPrimario
                  texto={guardando ? 'Guardando...' : 'Guardar'}
                  tipo="submit"
                  className="flex-1"
                  disabled={
                    guardando ||
                    !formValores.username.trim() ||
                    !formValores.email.trim()
                  }
                />
              </div>
            </form>
          )}
        </div>
      )}

      {(manejarCerrar || onCerrarSesion) && (
        <div className="mt-auto flex justify-end gap-2 pt-6">
          {onCerrarSesion && (
            <button
              type="button"
              onClick={onCerrarSesion}
              className="rounded border border-red-500 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500 hover:text-white"
            >
              Cerrar sesión
            </button>
          )}

          {manejarCerrar && (
            <button
              type="button"
              onClick={manejarCerrar}
              aria-label="Cerrar perfil"
              className="flex h-10 w-10 items-center justify-center rounded border border-gray-500 text-2xl text-gray-300 hover:bg-white/10 hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Notificación */}
      {toast && (
        <div
          role="alert"
          aria-live="assertive"
          className={`fixed top-5 right-5 z-[100] max-w-sm rounded-lg p-4 shadow-2xl border transition-all ${
            toast.tipo === 'error'
              ? 'border-red-500 bg-red-950/90 text-red-100'
              : 'border-green-500 bg-green-950/90 text-green-100'
          }`}
        >
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-sm">{toast.mensaje}</span>
            {toast.tipo === 'error' && (
              <button
                type="button"
                onClick={redirigirAlLobby}
                className="self-end text-xs underline text-red-300 hover:text-white"
              >
                Ir al Lobby ahora
              </button>
            )}
          </div>
        </div>
      )}

      
      {esModal ? (
        <div
          className="fixed inset-y-0 right-0 z-50 h-screen w-[20vw] min-w-[280px] select-none"
          role="dialog"
          aria-label="Mi Perfil"
          aria-modal="true"
        >
          {contenido}
        </div>
      ) : (
        contenido
      )}
    </>
  );
}

export default MiPerfil;
