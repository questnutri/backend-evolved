import { RepeatType, DayOfWeek, RepeatConfiguration } from '@backend-evolved/shared';

// Example RepeatConfiguration usage

// 1. Every day
const dailyConfiguration: RepeatConfiguration = {
  type: RepeatType.DAILY,
  interval: 1 // Every day
};

// 2. Every 2 days
const everyTwoDaysConfiguration: RepeatConfiguration = {
  type: RepeatType.DAILY,
  interval: 2 // Every 2 days
};

// 3. Every Monday and Wednesday
const mondayWednesdayConfiguration: RepeatConfiguration = {
  type: RepeatType.WEEKLY,
  interval: 1, // Every week
  daysOfWeek: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY]
};

// 4. Every 2 weeks on Friday
const biweeklyFridayConfiguration: RepeatConfiguration = {
  type: RepeatType.WEEKLY,
  interval: 2, // Every 2 weeks
  daysOfWeek: [DayOfWeek.FRIDAY]
};

// 5. Weekdays only (Monday to Friday)
const weekdaysConfiguration: RepeatConfiguration = {
  type: RepeatType.WEEKDAYS,
  // No need for daysOfWeek - defaults to Monday-Friday
};

// 6. Custom weekdays (Monday, Wednesday, Friday)
const customWeekdaysConfiguration: RepeatConfiguration = {
  type: RepeatType.WEEKDAYS,
  daysOfWeek: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY]
};

// 7. Every month on the 15th
const monthlyConfiguration: RepeatConfiguration = {
  type: RepeatType.MONTHLY_DATE,
  dayOfMonth: 15 // 15th of every month
};

// 8. Every 3rd Monday of the month
const monthlyMondayConfiguration: RepeatConfiguration = {
  type: RepeatType.MONTHLY,
  interval: 1, // Every month
  daysOfWeek: [DayOfWeek.MONDAY]
  // Note: This will schedule for the first Monday of each month
  // For more complex monthly patterns (like 3rd Monday), additional logic would be needed
};

// 9. Time-limited configuration (only during January 2024)
const timeLimitedConfiguration: RepeatConfiguration = {
  type: RepeatType.DAILY,
  interval: 1,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31')
};

// Example of a meal with multiple repeat configurations
const breakfastRepeatConfigurations: RepeatConfiguration[] = [
  // Monday to Friday (weekdays)
  {
    type: RepeatType.WEEKDAYS,
    daysOfWeek: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY]
  },
  // Saturday and Sunday (different pattern for weekends)
  {
    type: RepeatType.WEEKLY,
    interval: 1,
    daysOfWeek: [DayOfWeek.SATURDAY, DayOfWeek.SUNDAY]
  }
];

// Example meal creation with new system
const createMealExampleDto = {
  name: "High Protein Breakfast",
  description: "Eggs, oats, and protein shake",
  hour: "08:00",
  repeatConfigurations: breakfastRepeatConfigurations,
  // repeatDays is now deprecated but still supported for backward compatibility
  // repeatDays: [1, 2, 3, 4, 5] // Old system
};

export {
  dailyConfiguration,
  everyTwoDaysConfiguration,
  mondayWednesdayConfiguration,
  biweeklyFridayConfiguration,
  weekdaysConfiguration,
  customWeekdaysConfiguration,
  monthlyConfiguration,
  monthlyMondayConfiguration,
  timeLimitedConfiguration,
  breakfastRepeatConfigurations,
  createMealExampleDto
};
