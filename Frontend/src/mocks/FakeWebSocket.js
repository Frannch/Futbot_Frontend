export default class FakeWebSocket {
    static instances = [];

    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    constructor(url) {
        this.url = url;
        this.readyState = FakeWebSocket.CONNECTING;

        this.onopen = null;
        this.onmessage = null;
        this.onerror = null;
        this.onclose = null;

        FakeWebSocket.instances.push(this);
    }

    open() {
        this.readyState = FakeWebSocket.OPEN;
        this.onopen?.({ target: this });
    }

    // Simula un mensaje enviado por el servidor.
    recibirMensaje(data) {
        this.onmessage?.({
            data: JSON.stringify(data),
            target: this,
        });
    }

    // Simula un error de conexión.
    provocarError() {
        this.onerror?.({ target: this });
    }

    // Simula una desconexión del servidor.
    desconectar() {
        this.readyState = FakeWebSocket.CLOSED;
        this.onclose?.({
            code: 1006,
            reason: 'Conexión simulada cerrada',
            target: this,
        });
    }

    close() {
        this.readyState = FakeWebSocket.CLOSED;
    }

    send() {
        // El canal de ligas es de solo lectura.
        // No necesitamos enviar mensajes desde el cliente.
    }

    static reiniciar() {
        FakeWebSocket.instances = [];
    }
}
