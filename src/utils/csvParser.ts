import Papa from 'papaparse';
import type { RawReservation, Reservation } from '../types';

export const parseCSV = (file: File): Promise<Reservation[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse<RawReservation>(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true, // auto-convert numbers
            complete: (results) => {
                if (results.errors.length > 0) {
                    console.warn("CSV Parse Errors:", results.errors);
                }

                const reservations: Reservation[] = results.data
                    .filter(row => row["Check-in date"] && row.rentalRevenue !== undefined) // Basic validation
                    .map(row => ({
                        guest: row.Guest,
                        channel: row.Channel,
                        checkInDate: new Date(row["Check-in date"]),
                        checkOutDate: new Date(row["Check-out date"]),
                        listing: row.Listing,
                        reservationDate: new Date(row["Reservation date"]),
                        revenue: Number(row.rentalRevenue) || 0,
                        nights: Number(row.Nights) || 0
                    }));

                resolve(reservations);
            },
            error: (error) => {
                reject(error);
            }
        });
    });
};
