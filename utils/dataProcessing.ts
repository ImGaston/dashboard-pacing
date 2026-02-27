import type { Reservation, KPIMetrics, PacingDataPoint, MonthlyMetric, LeadTimeBucket, ChannelMix, DashboardData } from '../types';
import { getYear, getMonth, isBefore, subYears, differenceInDays, startOfYear, endOfYear, eachMonthOfInterval, format } from 'date-fns';

export const processData = (
    rawData: Reservation[],
    comparisonDate: Date,
    selectedListing: string | "All Listings"
): DashboardData => {

    // 1. Filter by Listing
    const listings = Array.from(new Set(rawData.map(r => r.listing))).sort();
    const data = selectedListing === "All Listings"
        ? rawData
        : rawData.filter(r => r.listing === selectedListing);

    const currentYear = getYear(comparisonDate);
    const prevYear = currentYear - 1;
    const prevComparisonDate = subYears(comparisonDate, 1);

    // 2. Separate Data and Apply STLY Logic (Reservation Date Cutoff)
    // STLY Logic: Only include reservations made on or before the comparison date of that year

    // Current Year Data (e.g., 2026)
    // Stay is in 2026 AND Reservation was made <= Comparison Date
    const currentYearData = data.filter(r =>
        getYear(r.checkInDate) === currentYear &&
        (isBefore(r.reservationDate, comparisonDate) || r.reservationDate.getTime() === comparisonDate.getTime())
    );

    // Previous Year Data (e.g., 2025)
    // Stay is in 2025 AND Reservation was made <= Comparison Date (of 2025)
    const prevYearData = data.filter(r =>
        getYear(r.checkInDate) === prevYear &&
        (isBefore(r.reservationDate, prevComparisonDate) || r.reservationDate.getTime() === prevComparisonDate.getTime())
    );

    // Helper for metrics
    const calculateMetrics = (dataset: Reservation[], cutoffDate: Date) => {
        let revenueSum = 0;
        let nightsSum = 0;
        let leadTimeSum = 0;
        let count = 0;

        // For YTD vs Forward
        let revenueYTD = 0;
        let revenueForward = 0;

        dataset.forEach(r => {
            revenueSum += r.revenue;
            nightsSum += r.nights;
            leadTimeSum += differenceInDays(r.checkInDate, r.reservationDate);
            count++;

            if (isBefore(r.checkInDate, cutoffDate) || r.checkInDate.getTime() === cutoffDate.getTime()) {
                revenueYTD += r.revenue;
            } else {
                revenueForward += r.revenue;
            }
        });

        return {
            totalRevenue: revenueSum,
            revenueYTD,
            revenueForward,
            adr: nightsSum > 0 ? revenueSum / nightsSum : 0,
            avgLeadTime: count > 0 ? leadTimeSum / count : 0,
            totalNights: nightsSum
        };
    };

    const currentMetrics = calculateMetrics(currentYearData, comparisonDate);
    const prevMetrics = calculateMetrics(prevYearData, prevComparisonDate);

    const getPctChange = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return ((curr - prev) / prev) * 100;
    };

    // 3. Assemble KPIs
    const kpis: KPIMetrics = {
        revenueYTD: {
            current: currentMetrics.revenueYTD,
            previous: prevMetrics.revenueYTD,
            percentChange: getPctChange(currentMetrics.revenueYTD, prevMetrics.revenueYTD)
        },
        forwardBooked: {
            current: currentMetrics.revenueForward,
            previous: prevMetrics.revenueForward,
            percentChange: getPctChange(currentMetrics.revenueForward, prevMetrics.revenueForward)
        },
        adr: {
            current: currentMetrics.adr,
            previous: prevMetrics.adr,
            percentChange: getPctChange(currentMetrics.adr, prevMetrics.adr)
        },
        avgLeadTime: {
            current: currentMetrics.avgLeadTime,
            previous: prevMetrics.avgLeadTime,
            percentChange: getPctChange(currentMetrics.avgLeadTime, prevMetrics.avgLeadTime)
        }
    };

    // 4. Pacing Chart (Cumulative Revenue by Month)
    // We need data for all months of the years
    const months = eachMonthOfInterval({
        start: startOfYear(new Date(currentYear, 0, 1)),
        end: endOfYear(new Date(currentYear, 0, 1))
    });

    const pacingData: PacingDataPoint[] = months.map((monthDate, index) => {
        // Current Year Cumulative (up to end of this month)
        // Actually typically pacing charts show cumulative stats "on the books" for stay dates YTD?
        // User request: "X-axis: months (Jan-Dec)", "Y-axis: cumulative revenue"
        // Usually this means: Revenue for Jan, Revenue for Jan+Feb, etc.

        // Filter stays in this month


        // To get cumulative, we sum up revenue for stays in months 0 to index
        const currentCumulative = currentYearData
            .filter(r => getMonth(r.checkInDate) <= index)
            .reduce((sum, r) => sum + r.revenue, 0);

        const prevCumulative = prevYearData
            .filter(r => getMonth(r.checkInDate) <= index)
            .reduce((sum, r) => sum + r.revenue, 0);

        return {
            monthIndex: index,
            month: format(monthDate, 'MMM'),
            cumulative2025: prevCumulative,
            cumulative2026: currentCumulative
        };
    });

    // 5. Monthly Table
    // Columns: Month | 2025 Revenue | 2025 Occ% | 2025 ADR | 2026 Booked | 2026 Occ% | 2026 ADR | Δ Revenue
    // Need to know "days in month" for occupancy calculation. 
    // Wait, Occupancy = nights / (days in month * listing_count?).
    // If property filter is "All Listings", then denominator is (days in month * total_listings).
    // But listings count might be dynamic based on which listings were active? 
    // Simplified assumption: denominator = days in month * (unique listings in that month's data? or all visible listings?)
    // Let's use 'listings.length' from the filtered set (if All Listings selected, count of all listings found in data).

    // Note: if a listing has 0 bookings in a month, it should still be counted in denominator for "All Listings" if we want true occupancy.
    // But we only know listings from the CSV.
    // Assumption: use `listings.length` (calculated at top) as the denominator unit multiplier.
    const listingCount = selectedListing === "All Listings" ? listings.length : 1;

    const monthlyData: MonthlyMetric[] = months.map((monthDate, index) => {
        const daysInMonth = transformDateToDaysInMonth(monthDate);

        const getDataForMonth = (dataset: Reservation[]) => dataset.filter(r => getMonth(r.checkInDate) === index);

        const currMonthData = getDataForMonth(currentYearData);
        const prevMonthData = getDataForMonth(prevYearData);

        const calcMonthMetrics = (d: Reservation[]) => {
            const rev = d.reduce((s, r) => s + r.revenue, 0);
            const nights = d.reduce((s, r) => s + r.nights, 0);
            return {
                revenue: rev,
                nights,
                adr: nights > 0 ? rev / nights : 0,
                occupancy: (nights / (daysInMonth * listingCount)) * 100
            };
        };

        const curr = calcMonthMetrics(currMonthData);
        const prev = calcMonthMetrics(prevMonthData);

        return {
            month: format(monthDate, 'MMM'),
            revenue2025: prev.revenue,
            occupancy2025: prev.occupancy,
            adr2025: prev.adr,
            revenue2026: curr.revenue,
            occupancy2026: curr.occupancy,
            adr2026: curr.adr,
            deltaRevenue: prev.revenue > 0 ? ((curr.revenue - prev.revenue) / prev.revenue) * 100 : 0
        };
    });

    // 6. Lead Time Histogram
    // Buckets: 0-7, 8-14, 15-30, 31-60, 60+
    const buckets = [
        { label: "0-7", min: 0, max: 7 },
        { label: "8-14", min: 8, max: 14 },
        { label: "15-30", min: 15, max: 30 },
        { label: "31-60", min: 31, max: 60 },
        { label: "60+", min: 61, max: 9999 }
    ];

    const leadTimeData: LeadTimeBucket[] = buckets.map(b => {
        const countInBucket = (dataset: Reservation[]) => dataset.filter(r => {
            const lead = differenceInDays(r.checkInDate, r.reservationDate);
            return lead >= b.min && lead <= b.max;
        }).length;

        return {
            range: b.label,
            count2025: countInBucket(prevYearData),
            count2026: countInBucket(currentYearData)
        };
    });

    // 7. Channel Mix (Phase 2)
    // Revenue distribution by booking channel
    const channelMix: ChannelMix[] = [];
    const channels = Array.from(new Set(currentYearData.map(r => r.channel)));
    channels.forEach(ch => {
        const rev = currentYearData.filter(r => r.channel === ch).reduce((s, r) => s + r.revenue, 0);
        channelMix.push({ channel: ch, revenue: rev });
    });

    return {
        kpis,
        pacing: pacingData,
        monthly: monthlyData,
        leadTime: leadTimeData,
        channelMix,
        listings
    };
};

// Helper
function transformDateToDaysInMonth(date: Date): number {
    return new Date(getYear(date), getMonth(date) + 1, 0).getDate();
}
