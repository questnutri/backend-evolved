export class SchedulerHelper {
    private timeZone: number
    private formatter: string;

    constructor(timeZone: number = 0) {
        this.timeZone = timeZone
    }

    setTimeZone(tz: number) {
        this.timeZone = tz
    }

    setFormat(formatter: string) {
        this.formatter = formatter;
    }

    private tzForCall(timeZone?: number) {
        return timeZone !== undefined ? timeZone : this.timeZone
    }

    private localPartsFromInstant(date: Date, tz: number) {
        const shifted = new Date(date.getTime() + tz * 3600000)
        return {
            year: shifted.getUTCFullYear(),
            month: shifted.getUTCMonth(),
            day: shifted.getUTCDate(),
            hour: shifted.getUTCHours(),
            minute: shifted.getUTCMinutes(),
            second: shifted.getUTCSeconds()
        }
    }

    private utcFromLocalParts(year: number, month: number, day: number, hour: number, minute: number, second: number, tz: number) {
        const localMs = Date.UTC(year, month, day, hour, minute, second)
        return new Date(localMs - tz * 3600000)
    }

    isBetween(comparison: { start: Date; end: Date; target: Date; ignoreTime?: boolean }, timeZone?: number): boolean {
        const tz = this.tzForCall(timeZone)
        let { start, end, target, ignoreTime = false } = comparison
        if (ignoreTime) {
            const sp = this.localPartsFromInstant(start, tz)
            const ep = this.localPartsFromInstant(end, tz)
            const tp = this.localPartsFromInstant(target, tz)
            const sUtc = this.utcFromLocalParts(sp.year, sp.month, sp.day, 0, 0, 0, tz)
            const eUtc = this.utcFromLocalParts(ep.year, ep.month, ep.day, 23, 59, 59, tz)
            const tUtc = this.utcFromLocalParts(tp.year, tp.month, tp.day, 0, 0, 0, tz)
            return tUtc.getTime() >= sUtc.getTime() && tUtc.getTime() <= eUtc.getTime()
        }
        return target.getTime() >= start.getTime() && target.getTime() <= end.getTime()
    }

    isSameDate(dateA: Date, dateB: Date, ignoreTime: boolean = false, timeZone?: number): boolean {
        const tz = this.tzForCall(timeZone)
        if (ignoreTime) {
            const a = this.localPartsFromInstant(dateA, tz)
            const b = this.localPartsFromInstant(dateB, tz)
            return a.year === b.year && a.month === b.month && a.day === b.day
        }
        return dateA.getTime() === dateB.getTime()
    }

    buildDate({
        date,
        day,
        year,
        month,
        time,
        hour,
        minute,
        second,
        endOfDay = false,
        startOfDay = false,
        useUTC = true,
        timeZone,
        offset
    }: {
        date?: Date | string
        day?: number
        year?: number
        month?: number
        time?: string
        hour?: number
        minute?: number
        second?: number
        endOfDay?: boolean
        startOfDay?: boolean
        useUTC?: boolean
        timeZone?: number
        offset?: { year?: number; month?: number; week?: number; day?: number; hour?: number; minute?: number; second?: number }
    } = {}): Date {
        const tz = this.tzForCall(timeZone)

        const dateHasTimeInfo = typeof date === 'string' &&
            (date.includes('T') || (date.includes(' ') && date.includes(':')) ||
                /\d{4}-\d{2}-\d{2}T\d{2}(:\d{2})?(:\d{2})?/.test(String(date)) ||
                /\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?/.test(String(date)))

        let parsedHour: number | undefined = hour
        let parsedMinute: number | undefined = minute
        let parsedSecond: number | undefined = second

        if (time && typeof time === 'string') {
            if (time.includes(':')) {
                const parts = time.split(':')
                parsedHour = parseInt(parts[0], 10)
                parsedMinute = parts[1] ? parseInt(parts[1], 10) : 0
                parsedSecond = parts[2] ? parseInt(parts[2], 10) : (second ?? 0)
            } else {
                parsedHour = parseInt(time, 10)
                parsedMinute = 0
                parsedSecond = second ?? 0
            }
            if (isNaN(parsedHour) || parsedHour < 0 || parsedHour > 23) throw new Error('Invalid hour')
            if (isNaN(parsedMinute) || parsedMinute < 0 || parsedMinute > 59) throw new Error('Invalid minute')
            if (parsedSecond !== undefined && (isNaN(parsedSecond) || parsedSecond < 0 || parsedSecond > 59)) throw new Error('Invalid second')
        }

        let baseYear: number
        let baseMonth: number
        let baseDay: number
        let baseHour: number
        let baseMinute: number
        let baseSec: number

        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            const [y, m, d] = date.split('-').map(s => parseInt(s, 10))
            baseYear = y
            baseMonth = m - 1
            baseDay = d
            baseHour = 0
            baseMinute = 0
            baseSec = 0
        } else if (typeof date === 'string' && dateHasTimeInfo) {
            const dObj = new Date(date)
            baseYear = dObj.getUTCFullYear()
            baseMonth = dObj.getUTCMonth()
            baseDay = dObj.getUTCDate()
            baseHour = dObj.getUTCHours()
            baseMinute = dObj.getUTCMinutes()
            baseSec = dObj.getUTCSeconds()
        } else if (date instanceof Date) {
            const dObj = date
            baseYear = dObj.getUTCFullYear()
            baseMonth = dObj.getUTCMonth()
            baseDay = dObj.getUTCDate()
            baseHour = dObj.getUTCHours()
            baseMinute = dObj.getUTCMinutes()
            baseSec = dObj.getUTCSeconds()
        } else {
            const now = new Date()
            const nowLocal = new Date(now.getTime() + tz * 3600000)
            baseYear = nowLocal.getUTCFullYear()
            baseMonth = nowLocal.getUTCMonth()
            baseDay = nowLocal.getUTCDate()
            baseHour = nowLocal.getUTCHours()
            baseMinute = nowLocal.getUTCMinutes()
            baseSec = nowLocal.getUTCSeconds()
        }

        const targetYear = year ?? baseYear
        const targetMonth = month ?? baseMonth
        const targetDay = day ?? baseDay

        let targetHour: number
        let targetMinute: number
        let targetSecond: number

        const explicitTimeProvided = parsedHour !== undefined || parsedMinute !== undefined || parsedSecond !== undefined || dateHasTimeInfo

        if (startOfDay) {
            targetHour = 0
            targetMinute = 0
            targetSecond = 0
        } else if (endOfDay) {
            targetHour = 23
            targetMinute = 59
            targetSecond = parsedSecond ?? 59
        } else if (parsedHour !== undefined || parsedMinute !== undefined || parsedSecond !== undefined) {
            targetHour = parsedHour ?? baseHour
            targetMinute = parsedMinute ?? baseMinute
            targetSecond = parsedSecond ?? baseSec
        } else if (dateHasTimeInfo) {
            targetHour = baseHour
            targetMinute = baseMinute
            targetSecond = baseSec
        } else if (!explicitTimeProvided) {
            const now = new Date()
            const nowLocal = new Date(now.getTime() + tz * 3600000)
            targetHour = nowLocal.getUTCHours()
            targetMinute = nowLocal.getUTCMinutes()
            targetSecond = nowLocal.getUTCSeconds()
        } else {
            targetHour = baseHour
            targetMinute = baseMinute
            targetSecond = baseSec
        }

        let result = useUTC
            ? this.utcFromLocalParts(targetYear, targetMonth, targetDay, targetHour, targetMinute, targetSecond, tz)
            : new Date(targetYear, targetMonth, targetDay, targetHour, targetMinute, targetSecond)

        if (offset) {
            if (offset.year) result.setUTCFullYear(result.getUTCFullYear() + offset.year)
            if (offset.month) result.setUTCMonth(result.getUTCMonth() + offset.month)
            if (offset.week) result.setUTCDate(result.getUTCDate() + offset.week * 7)
            if (offset.day) result.setUTCDate(result.getUTCDate() + offset.day)
            if (offset.hour) result.setUTCHours(result.getUTCHours() + offset.hour)
            if (offset.minute) result.setUTCMinutes(result.getUTCMinutes() + offset.minute)
            if (offset.second) result.setUTCSeconds(result.getUTCSeconds() + offset.second)
        }

        return result
    }

    endOfDay() {
        return this.buildDate({ endOfDay: true });
    }

    startOfDay() {
        return this.buildDate({ startOfDay: true });
    }

    startOfMonth(date?: Date, timeZone?: number): Date {
        const tz = this.tzForCall(timeZone)
        const baseDate = date || new Date()
        const parts = this.localPartsFromInstant(baseDate, tz)
        
        // Return date set to 00:00:00 of the first day of the month
        return this.utcFromLocalParts(parts.year, parts.month, 1, 0, 0, 0, tz)
    }

    endOfMonth(date?: Date, timeZone?: number): Date {
        const tz = this.tzForCall(timeZone)
        const baseDate = date || new Date()
        const parts = this.localPartsFromInstant(baseDate, tz)
        
        // Get the last day of the month by going to the first day of next month and subtracting 1 day
        const firstDayNextMonth = this.utcFromLocalParts(parts.year, parts.month + 1, 1, 0, 0, 0, tz)
        const lastDayOfMonth = new Date(firstDayNextMonth.getTime() - 86400000) // subtract 1 day
        
        // Get the day number from the last day
        const lastDayParts = this.localPartsFromInstant(lastDayOfMonth, tz)
        
        // Return date set to 23:59:59 of the last day
        return this.utcFromLocalParts(lastDayParts.year, lastDayParts.month, lastDayParts.day, 23, 59, 59, tz)
    }

    normalizeToStartOfDay(date: Date, timeZone?: number): Date {
        const tz = this.tzForCall(timeZone)
        const p = this.localPartsFromInstant(date, tz)
        return this.utcFromLocalParts(p.year, p.month, p.day, 0, 0, 0, tz)
    }

    getDaysDifference(start: Date, end: Date, timeZone?: number): number {
        const tz = this.tzForCall(timeZone)
        const sParts = this.localPartsFromInstant(start, tz)
        const eParts = this.localPartsFromInstant(end, tz)
        const sUtc = this.utcFromLocalParts(sParts.year, sParts.month, sParts.day, 0, 0, 0, tz)
        const eUtc = this.utcFromLocalParts(eParts.year, eParts.month, eParts.day, 0, 0, 0, tz)
        return Math.floor((eUtc.getTime() - sUtc.getTime()) / 86400000)
    }

    getWeeksDifference(start: Date, end: Date, timeZone?: number): number {
        const days = this.getDaysDifference(start, end, timeZone)
        return Math.floor(days / 7)
    }

    getMonthsDifference(start: Date, end: Date, timeZone?: number): number {
        const tz = this.tzForCall(timeZone)
        const s = this.localPartsFromInstant(start, tz)
        const e = this.localPartsFromInstant(end, tz)
        return (e.year - s.year) * 12 + (e.month - s.month)
    }

    format(date: Date | string, format?: string, timeZone?: number): string {
        const tz = timeZone !== undefined ? timeZone : this.timeZone
        const d = typeof date === 'string' ? new Date(date) : date
        const parts = this.localPartsFromInstant(d, tz)

        const pad = (v: number) => String(v).padStart(2, '0')

        const tokens: Record<string, string> = {
            YYYY: String(parts.year),
            MM: pad(parts.month + 1),
            DD: pad(parts.day),
            HH: pad(parts.hour),
            mm: pad(parts.minute),
            ss: pad(parts.second),
            Z: (tz >= 0 ? '+' : '') + pad(tz) + ':00'
        }

        let formatted = format || this.formatter || 'YYYY-MM-DDTHH:mm:ssZ'
        for (const token in tokens) {
            formatted = formatted.replace(token, tokens[token])
        }

        return formatted
    }

    isValidDate(dateString: string): boolean {
        if (!dateString || typeof dateString !== 'string') {
            return false
        }

        const date = new Date(dateString)

        if (isNaN(date.getTime())) {
            return false
        }

        return true
    }
}
