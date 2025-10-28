import { RepeatConfiguration, RepeatType, DayOfWeek } from '../types/repeat-configuration';

export class MealRepeatCalculator {
    /**
     * Calculates if a meal should be scheduled for a specific date based on its repeat configuration
     * @param repeatConfiguration - Single repeat configuration for the meal
     * @param relativeDate - Date to check (normalized to start of day)
     * @param dietStartDate - Start date of the diet (normalized to start of day)
     * @param dietDays - Total days of the diet
     * @returns boolean indicating if meal should be scheduled for the date
     */
    static shouldMealBeScheduled(
        repeatConfiguration: RepeatConfiguration,
        relativeDate: Date,
        dietStartDate: Date,
        dietDays: number,
    ): boolean {
        if (!repeatConfiguration) {
            return false;
        }

        const dietEndDate = new Date(dietStartDate);
        dietEndDate.setDate(dietStartDate.getDate() + dietDays - 1);

        const result = this.shouldMealBeScheduledForConfig(repeatConfiguration, relativeDate, dietStartDate, dietEndDate);
        return result;
    }

    /**
     * Checks if a meal should be scheduled based on a single repeat configuration
     */
    private static shouldMealBeScheduledForConfig(
        config: RepeatConfiguration,
        relativeDate: Date,
        dietStartDate: Date,
        dietEndDate: Date,
    ): boolean {
        // Check if the date is within the configuration's date range
        const configStartDate = config.startDate ? new Date(config.startDate) : dietStartDate;
        const configEndDate = config.endDate ? new Date(config.endDate) : dietEndDate;

        if (relativeDate < configStartDate || relativeDate > configEndDate) {
            return false;
        }

        switch (config.type) {
            case RepeatType.ONCE:
                return this.checkOnceRepeat(config, relativeDate, configStartDate);

            case RepeatType.DAILY:
                return this.checkDailyRepeat(config, relativeDate, configStartDate);

            case RepeatType.WEEKLY:
                return this.checkWeeklyRepeat(config, relativeDate, configStartDate);

            case RepeatType.MONTHLY:
                return this.checkMonthlyRepeat(config, relativeDate, configStartDate);

            case RepeatType.WEEKDAYS:
                return this.checkWeekdaysRepeat(config, relativeDate);

            case RepeatType.MONTHLY_DATE:
                return this.checkMonthlyDateRepeat(config, relativeDate);

            default:
                return false;
        }
    }

    private static checkOnceRepeat(
        config: RepeatConfiguration,
        relativeDate: Date,
        startDate: Date,
    ): boolean {
        // For ONCE type, the meal only happens on the exact start date (ignoring time)
        const normalizedRelativeDate = this.normalizeToStartOfDay(relativeDate);
        const normalizedStartDate = this.normalizeToStartOfDay(startDate);

        return normalizedRelativeDate.getTime() === normalizedStartDate.getTime();
    }

    /**
     * Normalize date to start of day (00:00:00) to ignore hours in UTC
     */
    private static normalizeToStartOfDay(date: Date): Date {
        const normalized = new Date(date);
        normalized.setUTCHours(0, 0, 0, 0);
        return normalized;
    }

    private static checkDailyRepeat(
        config: RepeatConfiguration,
        relativeDate: Date,
        startDate: Date,
    ): boolean {
        const daysDiff = Math.floor((relativeDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const interval = config.interval || 1;
        const result = daysDiff >= 0 && daysDiff % interval === 0;
        return result;
    }

    private static checkWeeklyRepeat(
        config: RepeatConfiguration,
        relativeDate: Date,
        startDate: Date,
    ): boolean {
        const weeksDiff = Math.floor((relativeDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        const isCorrectWeekInterval = weeksDiff >= 0 && weeksDiff % (config.interval || 1) === 0;

        if (!isCorrectWeekInterval) {
            return false;
        }

        // If no specific days of week are specified, use the start date's day of week
        if (!config.daysOfWeek || config.daysOfWeek.length === 0) {
            return relativeDate.getUTCDay() === startDate.getUTCDay();
        }

        return config.daysOfWeek.includes(relativeDate.getUTCDay() as DayOfWeek);
    }

    private static checkMonthlyRepeat(
        config: RepeatConfiguration,
        relativeDate: Date,
        startDate: Date,
    ): boolean {
        const monthsDiff = (relativeDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
            (relativeDate.getUTCMonth() - startDate.getUTCMonth());

        const isCorrectMonthInterval = monthsDiff >= 0 && monthsDiff % (config.interval || 1) === 0;

        if (!isCorrectMonthInterval) {
            return false;
        }

        // Check if it's the same day of the month as the start date
        return relativeDate.getUTCDate() === startDate.getUTCDate();
    }

    private static checkWeekdaysRepeat(
        config: RepeatConfiguration,
        relativeDate: Date,
    ): boolean {
        if (!config.daysOfWeek || config.daysOfWeek.length === 0) {
            // Default to Monday-Friday if no specific days are specified
            const dayOfWeek = relativeDate.getUTCDay();
            return dayOfWeek >= DayOfWeek.MONDAY && dayOfWeek <= DayOfWeek.FRIDAY;
        }

        return config.daysOfWeek.includes(relativeDate.getUTCDay() as DayOfWeek);
    }

    private static checkMonthlyDateRepeat(
        config: RepeatConfiguration,
        relativeDate: Date,
    ): boolean {
        if (config.dayOfMonth === undefined) {
            return false;
        }

        return relativeDate.getDate() === config.dayOfMonth;
    }

    /**
     * Gets all dates within a range where a meal should be scheduled
     * @param repeatConfiguration - Single repeat configuration for the meal
     * @param startDate - Start date of the range (normalized to start of day)
     * @param endDate - End date of the range (normalized to start of day)
     * @returns Array of dates where the meal should be scheduled
     */
    static getMealDatesInRange(
        repeatConfiguration: RepeatConfiguration,
        startDate: Date,
        endDate: Date,
    ): Date[] {
        const dates: Date[] = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            if (this.shouldMealBeScheduled(repeatConfiguration, currentDate, startDate,
                Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)) {
                dates.push(new Date(currentDate));
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dates;
    }
}
