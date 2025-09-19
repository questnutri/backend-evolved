export enum RepeatType {
    ONCE = 'ONCE',             // One-time meal on a specific date (never repeats)
    DAILY = 'DAILY',           // Every X days
    WEEKLY = 'WEEKLY',         // Every X weeks on specific days
    MONTHLY = 'MONTHLY',       // Every X months on specific day
    WEEKDAYS = 'WEEKDAYS',     // Specific weekdays (Mon, Tue, etc.)
    MONTHLY_DATE = 'MONTHLY_DATE' // Specific date of month (18th, 25th, etc.)
}

export enum DayOfWeek {
    SUNDAY = 0,
    MONDAY = 1,
    TUESDAY = 2,
    WEDNESDAY = 3,
    THURSDAY = 4,
    FRIDAY = 5,
    SATURDAY = 6
}

export interface RepeatConfiguration {
    type: RepeatType;
    interval?: number;         // Every X days/weeks/months (optional, defaults to 1)
    daysOfWeek?: DayOfWeek[];  // For WEEKLY and WEEKDAYS
    dayOfMonth?: number;       // For MONTHLY_DATE (1-31)
    startDate?: Date;          // When the repeat pattern starts
    endDate?: Date;            // When the repeat pattern ends (optional)
}
