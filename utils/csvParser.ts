import type { Reservation, PMSType, PMSColumnMapping } from '../types';

interface PMSConfig {
    columns: PMSColumnMapping;
    statusFilter?: string;
    channelMap?: Record<string, string>;
}

export const PMS_PARSERS: Record<string, PMSConfig> = {
    hostaway: {
        columns: {
            checkin: 'Check-in date',
            checkout: 'Check-out date',
            bookingDate: 'Reservation date',
            property: 'Listing',
            channel: 'Channel',
            revenue: 'rentalRevenue',
            nights: 'Nights'
        },
        statusFilter: undefined,
        channelMap: {
            'airbnbOfficial': 'Airbnb',
            'airbnb': 'Airbnb',
            'vrbo': 'VRBO',
            'direct': 'Direct',
            'bookingengine': 'Direct'
        }
    },
    hospitable: {
        columns: {
            checkin: 'checkin_date',
            checkout: 'checkout_date',
            bookingDate: 'booking_date',
            property: 'property_name',
            channel: 'platform',
            revenue: 'revenue',
            nights: 'nights',
            status: 'status'
        },
        statusFilter: 'accepted',
        channelMap: {
            'airbnb': 'Airbnb',
            'vrbo': 'VRBO',
            'direct': 'Direct',
            'manual': 'Direct',
            'booking.com': 'Booking.com'
        }
    }
};

export const detectPMS = (headers: string[]): PMSType | 'unknown' => {
    const h = headers.map(x => x.toLowerCase().trim());

    if (h.includes('checkin_date') && h.includes('platform') && h.includes('property_name')) {
        return 'hospitable';
    }

    if (h.includes('check-in date') && h.includes('channel') && h.includes('listing')) {
        return 'hostaway';
    }

    return 'unknown';
};

// Helper to parse CSV line handling quoted values
const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());

    return result;
};

export const parseCSV = async (
    file: File,
    pmsType: PMSType,
    customMapping?: PMSColumnMapping,
    customStatusFilterValue?: string
): Promise<{ reservations: Reservation[], cancelledCount: number }> => {
    const text = await file.text();

    // Strip BOM if present
    const cleanText = text.replace(/^\uFEFF/, '');
    const lines = cleanText.split('\n');

    if (lines.length === 0) return { reservations: [], cancelledCount: 0 };

    const headers = parseCSVLine(lines[0]);

    let mapping: PMSColumnMapping;
    if (pmsType === 'custom' && customMapping) {
        mapping = customMapping;
    } else {
        mapping = PMS_PARSERS[pmsType].columns;
    }

    // Get column indices
    const colIndex: Record<string, number> = {};
    for (const [key, colName] of Object.entries(mapping)) {
        if (!colName) continue;
        colIndex[key] = headers.findIndex(h =>
            h.trim().toLowerCase() === colName.toLowerCase()
        );
    }

    // Status filter setup
    const statusColName = mapping.status;
    const statusIdx = statusColName ? headers.findIndex(h => h.trim().toLowerCase() === statusColName.toLowerCase()) : -1;

    // Determine filter value: passed arg (custom) OR config (hospitable)
    const statusFilter = customStatusFilterValue
        ? customStatusFilterValue.toLowerCase().trim()
        : (pmsType === 'hospitable' ? PMS_PARSERS.hospitable.statusFilter : null);

    const reservations: Reservation[] = [];
    let cancelledCount = 0;

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const row = parseCSVLine(lines[i]);

        // Validation: skip if row doesn't have enough columns
        // heuristic: must have at least checkin and revenue columns
        if (colIndex.checkin === -1 || !row[colIndex.checkin]) continue;

        // Skip cancelled for Hospitable/Custom if configured
        if (statusIdx >= 0 && statusFilter) {
            const rowStatus = row[statusIdx]?.toLowerCase().replace(/"/g, '').trim();
            // Check for exact match (e.g. "accepted")
            if (rowStatus !== statusFilter) {
                cancelledCount++;
                continue;
            }
        }

        // Parse revenue - handle empty or zero
        // Hospitable/Hostaway revenue might be currency string or number
        const rawRevenue = row[colIndex.revenue];
        let revenue = 0;
        if (rawRevenue) {
            revenue = parseFloat(rawRevenue.toString().replace(/[^0-9.-]/g, ''));
        }

        if (!revenue || revenue <= 0) continue; // Skip zero-revenue rows

        // Parse dates
        const checkInDate = new Date(row[colIndex.checkin]);
        const checkOutDate = new Date(row[colIndex.checkout]);
        const bookingDate = new Date(row[colIndex.bookingDate]);

        if (isNaN(checkInDate.getTime())) continue;

        // Normalize channel name
        const rawChannel = row[colIndex.channel]?.toLowerCase().replace(/"/g, '').trim() || 'other';
        const channelMap = (pmsType !== 'custom' ? PMS_PARSERS[pmsType]?.channelMap : {}) || {};
        const channel = channelMap[rawChannel] || rawChannel.charAt(0).toUpperCase() + rawChannel.slice(1);

        reservations.push({
            guest: 'Guest',
            channel: channel,
            checkInDate: checkInDate,
            checkOutDate: checkOutDate,
            listing: row[colIndex.property]?.replace(/"/g, '').trim() || 'Unknown',
            reservationDate: bookingDate,
            revenue: revenue,
            nights: parseInt(row[colIndex.nights]?.toString().replace(/[^0-9]/g, '') || '0')
        });
    }

    return { reservations, cancelledCount };
};
