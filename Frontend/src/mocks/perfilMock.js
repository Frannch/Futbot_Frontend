let perfil = {
  id: 'mock-user-1',
  username: 'Usuario de prueba',
  email: 'usuario.prueba@ejemplo.com',
  avatar_url: '',
};

export async function obtenerPerfilMock() {
  return { ...perfil };
}

export async function actualizarPerfilMock(datosUsuario) {
  perfil = {
    ...perfil,
    username: datosUsuario.username,
    email: datosUsuario.email,
  };

  return { ...perfil };
}
