// Avisos entre pantallas del barbero: cuando cambia su catálogo u horario, el aviso de
// "completa tu perfil" se actualiza sin recargar; y desde ese aviso se abre el horario.
export const BARBER_SETUP_CHANGED = "barber-setup-changed";
export const OPEN_BARBER_HOURS = "open-barber-hours";

export function notifyBarberSetupChanged() {
    window.dispatchEvent(new Event(BARBER_SETUP_CHANGED));
}
