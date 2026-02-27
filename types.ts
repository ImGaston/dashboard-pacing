export type PMSType = 'hostaway' | 'hospitable' | 'custom';

export interface PMSColumnMapping {
    checkin: string;
    checkout: string;
    bookingDate: string;
    property: string;
    channel: string;
    revenue: string;
    nights: string;
    status?: string | null;
}

export interface RawReservation {
    [key: string]: string | number | undefined;
}

export interface Reservation {
    guest: string;
    channel: string;
    checkInDate: Date;
    checkOutDate: Date;
    listing: string;
    reservationDate: Date;
    revenue: number;
    nights: number;
}

export interface MonthlyMetric {
    month: string; // "Jan", "Feb", etc.
    revenue2025: number;
    occupancy2025: number;
    adr2025: number;
    revenue2026: number; // "2026 Booked"
    occupancy2026: number;
    adr2026: number;
    deltaRevenue: number; // % change
}

export interface KPIMetrics {
    revenueYTD: { current: number; previous: number; percentChange: number };
    forwardBooked: { current: number; previous: number; percentChange: number };
    adr: { current: number; previous: number; percentChange: number };
    avgLeadTime: { current: number; previous: number; percentChange: number };
}

export interface PacingDataPoint {
    monthIndex: number; // 0-11
    month: string;
    cumulative2025: number;
    cumulative2026: number;
}

export interface LeadTimeBucket {
    range: string; // "0-7", "8-14", etc.
    count2025: number;
    count2026: number;
}

export interface ChannelMix {
    channel: string;
    revenue: number;
}

export interface DashboardData {
    kpis: KPIMetrics;
    pacing: PacingDataPoint[];
    monthly: MonthlyMetric[];
    leadTime: LeadTimeBucket[];
    channelMix: ChannelMix[];
    listings: string[]; // For filter
}

export interface RevenueEntry {
    id: string;
    propertyName: string;
    month: number;
    year: number;
    totalRevenue: number;
    occupiedNights: number;
    availableNights: number;
}
