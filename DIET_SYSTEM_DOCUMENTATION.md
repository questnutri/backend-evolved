# QuestNutri Diet System - Complete Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Diet Plan Generation System](#diet-plan-generation-system)
4. [Meal Repeat Configuration System](#meal-repeat-configuration-system)
5. [Meal Record Validation](#meal-record-validation)
6. [API Documentation](#api-documentation)
7. [Database Schema](#database-schema)
8. [Service Communication](#service-communication)
9. [Key Implementation Details](#key-implementation-details)
10. [Migration History](#migration-history)
11. [Testing Guidelines](#testing-guidelines)

## System Overview

QuestNutri is a comprehensive nutrition management platform built with NestJS microservices architecture. The system enables nutritionists to create complex diet plans with flexible meal scheduling and allows patients to track their meal consumption with intelligent validation.

### Core Features
- **Complex Diet Plan Generation**: Create sophisticated diet plans with multiple meals and flexible repeat patterns
- **Meal Repeat Configuration**: Support for ONCE, DAILY, WEEKLY, WEEKDAYS, MONTHLY, and MONTHLY_DATE repeat types
- **Meal Record Validation**: Intelligent validation ensuring meal records match the configured schedule
- **UTC Date Normalization**: Consistent timezone handling across all date operations
- **Real-time Validation**: API-level validation with detailed error messages for invalid meal dates

## Architecture

### Microservices Structure
```
apps/
├── admin-svc/          # Admin management service
├── aliment-svc/        # Food/aliment management service  
├── auth-svc/           # Authentication service
├── diet-svc/           # Diet and meal management service
├── gateway/            # API Gateway
├── nutritionist-svc/   # Nutritionist management service
├── patient-svc/        # Patient management service
└── record-svc/         # Meal record tracking service
```

### Shared Libraries
```
libs/shared/
├── entities/           # TypeORM entities
├── dto/               # Data Transfer Objects
├── types/             # TypeScript type definitions
├── utils/             # Utility classes (MealRepeatCalculator)
├── guards/            # Authentication guards
└── filters/           # Exception filters
```

## Diet Plan Generation System

### DietPlan Structure
The diet plan generation creates a hierarchical structure:

```typescript
DietPlan {
  dietId: string
  dayPlans: DietDayPlan[]
}

DietDayPlan {
  relativeDate: Date
  mealPlans: MealPlan[]
}

MealPlan {
  meal: Meal
  mealRecord: CleanedMealRecord | null
}

CleanedMealRecord {
  id: string
  createdAt: Date
  updatedAt: Date
  isCompleted: boolean
  mealRelativeDate: Date
}
```

### Key Implementation
- **Location**: `apps/diet-svc/src/diet/diet.service.ts`
- **Method**: `plan()` - Main entry point for diet plan generation
- **Features**:
  - Multi-diet support for single patient
  - Date range filtering
  - Meal record integration
  - UTC date normalization
  - Aliment fetching and integration

## Meal Repeat Configuration System

### Repeat Types

#### 1. ONCE
- **Purpose**: One-time meals for special occasions
- **Configuration**: 
  ```json
  {
    "type": "ONCE",
    "startDate": "2025-09-25"
  }
  ```
- **Logic**: Meal occurs only on the specified `startDate`

#### 2. DAILY
- **Purpose**: Daily recurring meals with optional intervals
- **Configuration**: 
  ```json
  {
    "type": "DAILY",
    "interval": 1  // Every 1 day (daily), 3 = every 3 days
  }
  ```
- **Logic**: Repeats every X days from diet start date

#### 3. WEEKLY
- **Purpose**: Weekly recurring meals on specific days
- **Configuration**: 
  ```json
  {
    "type": "WEEKLY",
    "interval": 1,
    "daysOfWeek": [1, 3, 5]  // Monday, Wednesday, Friday
  }
  ```
- **Logic**: Repeats every X weeks on specified days (0=Sunday, 1=Monday, etc.)

#### 4. WEEKDAYS
- **Purpose**: Monday-Friday recurring meals
- **Configuration**: 
  ```json
  {
    "type": "WEEKDAYS"
  }
  ```
- **Logic**: Automatically schedules for Monday through Friday

#### 5. MONTHLY
- **Purpose**: Monthly recurring meals on same day as start date
- **Configuration**: 
  ```json
  {
    "type": "MONTHLY",
    "startDate": "2025-09-15"
  }
  ```
- **Logic**: Repeats on the 15th of every month (same day as startDate)

#### 6. MONTHLY_DATE
- **Purpose**: Monthly recurring meals on specific day of month
- **Configuration**: 
  ```json
  {
    "type": "MONTHLY_DATE",
    "dayOfMonth": 30
  }
  ```
- **Logic**: Repeats on the 30th of every month

### MealRepeatCalculator
**Location**: `libs/shared/src/utils/meal-repeat-calculator.ts`

The core logic engine that determines if a meal should be scheduled for a specific date:

```typescript
MealRepeatCalculator.shouldMealBeScheduled(
  repeatConfiguration: RepeatConfiguration,
  relativeDate: Date,
  dietStartDate: Date,
  dietDays: number
): boolean
```

**Key Features**:
- Date range validation (within diet start/end dates)
- Configuration-specific start/end date support
- Interval-based scheduling
- Day-of-week calculations
- UTC date normalization

## Meal Record Validation

### Overview
The meal record validation system ensures that patients can only create meal records for dates that match their meal's repeat configuration and fall within the diet's valid date range.

### Implementation
**Location**: `apps/record-svc/src/meal-record/meal-record.service.ts`
**Method**: `validateMealRelativeDate()`

### Validation Process
1. **Date Format Validation**: Ensures valid date format (accepts both 'YYYY-MM-DD' and full ISO strings)
2. **Meal/Diet Lookup**: Fetches meal and diet information via RPC call
3. **Repeat Configuration Check**: Uses MealRepeatCalculator to validate the date
4. **Detailed Error Messages**: Provides specific feedback based on repeat type

### Error Message Examples

#### WEEKLY Error
```
Date 2025-09-01 is not valid for meal "Breakfast" with repeat type WEEKLY. 
You sent Monday, but this meal is scheduled for: Wednesday, Friday between 2025-08-15 and 2025-10-15
```

#### WEEKDAYS Error
```
Date 2025-09-07 is not valid for meal "Work Lunch" with repeat type WEEKDAYS. 
You sent Sunday, but this meal is scheduled for weekdays only (Monday-Friday) between 2025-08-15 and 2025-10-15
```

#### ONCE Error
```
Date 2025-09-02 is not valid for meal "Special Meal" with repeat type ONCE. 
This meal is scheduled only for 2025-09-01
```

### Integration Points
- **createPatientMealRecord()**: Validates before creating meal records
- **createOne()**: Validates when using the generic create method
- **RPC Communication**: Uses `meal.getDetailedInfo` message pattern

## API Documentation

### Meal Creation Endpoint
**POST** `/diet/{dietId}/meal`

#### Comprehensive Examples

##### ONCE Type Meal
```json
{
  "name": "Birthday Special Dinner",
  "description": "Special birthday celebration meal with cake and favorite foods",
  "hour": "19:00",
  "repeatConfiguration": {
    "type": "ONCE",
    "startDate": "2025-09-25"
  }
}
```

##### DAILY Type Meal
```json
{
  "name": "Daily Breakfast",
  "description": "Healthy breakfast to start each day",
  "hour": "08:00",
  "repeatConfiguration": {
    "type": "DAILY",
    "interval": 1
  }
}
```

##### WEEKLY Type Meal
```json
{
  "name": "Pre-Workout Meal",
  "description": "Energy-rich meal before workout sessions",
  "hour": "17:00",
  "repeatConfiguration": {
    "type": "WEEKLY",
    "interval": 1,
    "daysOfWeek": [1, 3, 5]
  }
}
```

##### MONTHLY Type Meal
```json
{
  "name": "Monthly Health Check Meal",
  "description": "Special nutritious meal on the same day each month as the start date (15th)",
  "hour": "14:00",
  "repeatConfiguration": {
    "type": "MONTHLY",
    "startDate": "2025-09-15"
  }
}
```

### Meal Record Creation Endpoint
**POST** `/meal/{mealId}`

#### Request Body
```json
{
  "mealRelativeDate": "2025-09-01"
}
```

#### Validation Behavior
- Automatically validates the date against meal's repeat configuration
- Returns `BadRequestException` with detailed error message if invalid
- Toggles completion status if record already exists for the date

## Database Schema

### Key Entities

#### Diet Entity
```typescript
@Entity('diets')
export class Diet {
  id: string
  name: string
  description: string
  startDate: Date
  endDate?: Date
  nutritionistId: string
  patientId: string
  meals: Meal[]
}
```

#### Meal Entity
```typescript
@Entity('meals')
export class Meal {
  id: string
  name: string
  description: string
  hour: string
  repeatConfiguration: RepeatConfiguration  // JSONB column
  diet: Diet
  foods: Food[]
}
```

#### MealRecord Entity (V1 - Cleaned)
```typescript
@Entity('meal-records')
export class MealRecord {
  id: string
  createdAt: Date
  updatedAt: Date
  dietId: string
  mealId: string
  patientId: string
  nutritionistId: string
  isCompleted: boolean
  mealRelativeDate: Date  // UTC normalized
}
```

### Important Notes
- **repeatConfiguration**: Stored as JSONB in PostgreSQL for flexibility
- **mealRelativeDate**: Always normalized to UTC start of day (00:00:00.000Z)
- **V1 Clean Architecture**: Removed `mealRepeatDay` column for simplified identification

## Service Communication

### RPC Message Patterns

#### diet-svc → record-svc
- **meal.getInfo**: Get basic meal information
- **meal.getDetailedInfo**: Get meal with diet information for validation

#### record-svc → diet-svc
- **meal-record.findByMealAndDate**: Find meal records by meal and date

### Message Flow Example
```
1. Patient creates meal record via record-svc
2. record-svc calls diet-svc.meal.getDetailedInfo
3. record-svc validates date using MealRepeatCalculator
4. record-svc creates/updates meal record
5. record-svc notifies game-svc (future feature)
```

## Key Implementation Details

### UTC Date Normalization
All dates are normalized using:
```typescript
const normalizedDate = new Date(date);
normalizedDate.setUTCHours(0, 0, 0, 0);
```

**Why UTC**: Prevents timezone-related date shifting issues across different server/client environments.

### Date Range Calculations
```typescript
const dietDays = diet.endDate ? 
  Math.floor((new Date(diet.endDate).getTime() - normalizedDietStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 :
  365; // Default to 1 year if no end date
```

### Meal Record Identification
**V1 System**: Uses combination of `dietId + mealId + patientId + mealRelativeDate`
**Removed**: Legacy `mealRepeatDay` system for backward compatibility

### Error Handling
- **BadRequestException**: For validation errors (wrong date format, invalid meal date)
- **NotFoundException**: For missing resources (meal not found, diet not found)
- **RpcException**: For inter-service communication errors

## Migration History

### V1 Architecture Migration
**Goal**: Remove backward compatibility with `mealRepeatDay` system

**Changes Made**:
1. **MealRecord Entity**: Removed `mealRepeatDay` column
2. **DTOs**: Removed `mealRepeatDay` from Create/Update DTOs
3. **Services**: Updated methods to use only `mealRelativeDate` for identification
4. **Type Definitions**: Updated `CleanedMealRecord` and `MealPlan` interfaces
5. **Tests**: Simplified test files to remove legacy test cases

**Benefits**:
- Cleaner architecture
- Simplified meal record identification
- Better alignment with repeat configuration system
- Reduced complexity in date calculations

### Date Format Improvements
**Change**: Allow simple date format ('YYYY-MM-DD') in addition to full ISO strings
**Impact**: Improved developer experience and API usability

## Testing Guidelines

### Unit Testing
**Focus Areas**:
- MealRepeatCalculator logic for all repeat types
- Date normalization functions
- Validation error message generation

### Integration Testing
**Key Scenarios**:
- Meal creation with various repeat configurations
- Meal record validation across different repeat types
- RPC communication between services
- Date range edge cases

### Manual Testing Scenarios

#### WEEKLY Meal Testing
1. Create meal with WEEKLY type, daysOfWeek: [1, 3, 5]
2. Attempt to create record for Tuesday (should fail)
3. Create record for Monday (should succeed)
4. Verify error message includes day sent vs. expected days

#### ONCE Meal Testing
1. Create meal with ONCE type, startDate: "2025-09-25"
2. Attempt to create record for 2025-09-26 (should fail)
3. Create record for 2025-09-25 (should succeed)

#### Date Range Testing
1. Create diet with startDate: "2025-08-01", endDate: "2025-08-31"
2. Create DAILY meal
3. Attempt to create record for 2025-09-01 (should fail - outside diet range)

## Configuration Files

### Key Configuration
- **TypeORM**: Database entities and relationships
- **NestJS Modules**: Service registration and dependency injection
- **Swagger/OpenAPI**: API documentation and examples
- **Jest**: Testing configuration
- **TSConfig**: TypeScript compilation settings

## Future Enhancements

### Planned Features
1. **Game-svc Integration**: Reward system for completed meals
2. **Advanced Scheduling**: Support for more complex repeat patterns
3. **Notification System**: Meal reminders based on schedule
4. **Analytics**: Meal completion statistics and trends
5. **Meal Templates**: Reusable meal configurations

### Technical Debt
1. **Test Coverage**: Expand test coverage for edge cases
2. **Performance**: Optimize large date range calculations
3. **Caching**: Implement caching for frequently accessed meal configurations
4. **Documentation**: Auto-generate API documentation from code

## Troubleshooting Guide

### Common Issues

#### "Date X is not valid for meal Y"
**Cause**: Meal record date doesn't match repeat configuration
**Solution**: Check meal's repeat configuration and ensure date aligns with pattern

#### "Invalid date format"
**Cause**: Date string not in YYYY-MM-DD or ISO format
**Solution**: Use correct date format ('2025-09-25' or '2025-09-25T00:00:00.000Z')

#### RPC Timeout Errors
**Cause**: Inter-service communication issues
**Solution**: Check service health and network connectivity

#### UTC Date Issues
**Cause**: Timezone-related date calculations
**Solution**: Ensure all dates use UTC normalization

---

**Last Updated**: September 2025
**Version**: 1.0 (V1 Clean Architecture)
