export enum RepeatType {
    ONCE = 'ONCE',             // One-time meal on a specific date (never repeats)
    DAILY = 'DAILY',           // Every X days
    WEEKLY = 'WEEKLY',         // Every X weeks on specific days
    MONTHLY = 'MONTHLY',       // Every X months on specific day
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
    repeatTarget?: number;         // Every X days/weeks/months (optional, defaults to 1)
    targetDate?: Date;
    daysOfWeek?: DayOfWeek[];  // For WEEKLY and WEEKDAYS
    daysOfMonth?: number[];       // For MONTHLY_DATE (1-31)
}