function getTripDayRange(date, duration) {
    if (!date) return null;
    const [year, month, day] = date.split("-").map(Number);
    const start = Date.UTC(year, month - 1, day) / 86400000;
    const durationDays = Number(String(duration).match(/\d+/)?.[0]);
    const days = Math.max(1, durationDays || 1);
    return { start, end: start + days };
}

function getReservationUnits(reservation) {
    const units = Array.isArray(reservation.busUnits) && reservation.busUnits.length
        ? reservation.busUnits
        : (Array.isArray(reservation.buses) ? reservation.buses : []);

    return units.map(unit => {
        const match = String(unit).match(/\d+/);
        return match ? String(Number(match[0])) : "";
    }).filter(Boolean);
}

export function getBookedBusUnits(trips, date, duration) {
    const requestedRange = getTripDayRange(date, duration);
    if (!requestedRange) return new Set();

    const bookedUnits = new Set();
    trips.forEach(trip => {
        const reservedRange = getTripDayRange(trip.tanggal, trip.durasi);
        if (!reservedRange ||
            requestedRange.start >= reservedRange.end ||
            reservedRange.start >= requestedRange.end) {
            return;
        }

        getReservationUnits(trip).forEach(unit => bookedUnits.add(unit));
    });

    return bookedUnits;
}
