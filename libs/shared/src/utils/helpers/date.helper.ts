export function normalizeToStartOfDay(date: Date): Date {
    const normalized = new Date(date);
    normalized.setUTCHours(0, 0, 0, 0);
    return normalized;
}

export function toDateOnlyString(date: Date | string | number): string {
    const d = new Date(date);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function  getUTCTodayStart(): Date {
    const today = new Date();
    // Creates a new date object for today, but setting its UTC time to 00:00:00.000
    const normalized = new Date(Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate()
    ));
    return normalized;
}

export function getUTCYesterdayEnd(date: Date): Date {
    // Helper to get 1 millisecond before the start of a given date (i.e., the end of the previous day)
    const startOfDate = normalizeToStartOfDay(date);
    return new Date(startOfDate.getTime() - 1);
}