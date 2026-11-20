/*
un solo lugar para hablar con el backend. arma la url, pega el token de sesion
y devuelve los errores siempre igual, asi cada pantalla no repite lo mismo
*/

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

// error con el codigo http adentro, para poder distinguir un 409 de un 401
export class ErrorHttp extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.name = 'ErrorHttp';
    this.status = status;
  }
}

async function peticion(ruta, metodo, body) {
  const headers = {};
  const esFormData = body instanceof FormData;

  /*
  con FormData no ponemos Content-Type: el navegador lo arma solo con el
  boundary que necesita el multipart. si lo escribimos a mano, se rompe
  */
  if (body !== undefined && !esFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const token = localStorage.getItem('token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let cuerpo;
  if (body !== undefined) {
    cuerpo = esFormData ? body : JSON.stringify(body);
  }

  let respuesta;
  try {
    respuesta = await fetch(`${BASE_URL}${ruta}`, { method: metodo, headers, body: cuerpo });
  } catch {
    // no llegamos al servidor: esta apagado, no hay red, o lo frena CORS
    throw new ErrorHttp(0, 'Error de conexión con el servidor.');
  }

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new ErrorHttp(
      respuesta.status,
      datos.error || datos.detail || 'Ocurrió un error inesperado.'
    );
  }

  return datos;
}

export const httpGet = (ruta) => peticion(ruta, 'GET');
export const httpPost = (ruta, body) => peticion(ruta, 'POST', body);
export const httpPut = (ruta, body) => peticion(ruta, 'PUT', body);
export const httpDelete = (ruta) => peticion(ruta, 'DELETE');