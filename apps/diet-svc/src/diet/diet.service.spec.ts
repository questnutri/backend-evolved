import { Test, TestingModule } from '@nestjs/testing';
import { DietService } from './diet.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Diet, PATIENT_SERVICE_PROXY_NAME } from '@backend-evolved/shared';

describe('DietService', () => {
  let service: DietService;
  let mockDietRepository: any;
  let mockPatientProxy: any;

  beforeEach(async () => {
    mockDietRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
      delete: jest.fn(),
    };

    mockPatientProxy = {
      send: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DietService,
        {
          provide: getRepositoryToken(Diet),
          useValue: mockDietRepository,
        },
        {
          provide: PATIENT_SERVICE_PROXY_NAME,
          useValue: mockPatientProxy,
        },
      ],
    }).compile();

    service = module.get<DietService>(DietService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateRepeatDayForBackwardCompatibility', () => {
    it('should calculate day of week for backward compatibility', () => {
      // Setup: Testing the new simplified day-of-week calculation
      const diet = {
        id: 'test-diet',
        startDate: new Date('2025-09-17'), // Wednesday
        endDate: new Date('2025-09-25'), // Thursday
      } as Diet;

      // Test Sunday (should return 1)
      const sundayDate = new Date('2025-09-21'); // Sunday
      const sundayResult = service['calculateRepeatDayForBackwardCompatibility'](diet, sundayDate, diet.startDate);
      expect(sundayResult).toBe(1); // Sunday = 0 + 1 = 1

      // Test Wednesday (should return 4)
      const wednesdayDate = new Date('2025-09-17'); // Wednesday
      const wednesdayResult = service['calculateRepeatDayForBackwardCompatibility'](diet, wednesdayDate, diet.startDate);
      expect(wednesdayResult).toBe(4); // Wednesday = 3 + 1 = 4
    });
  });

      // Test Sunday (2025-09-21)
      const sundayDate = new Date('2025-09-21');
      const result = (service as any).getMealRepeatDayForDate(diet, meal, sundayDate);
      
      expect(result).toBe(1); // Should return 1 for Sunday
    });

    it('should correctly calculate WEEK_DAY mode - Wednesday (day 4)', () => {
      const diet = {
        id: 'test-diet',
        dayInterpretationMode: DietDayInterpretationMode.WEEK_DAY,
        startDate: new Date('2025-09-17'),
        endDate: new Date('2025-09-25'),
      } as Diet;

      const meal = {
        id: 'test-meal',
        repeatDays: [1, 4], // Sunday=1, Wednesday=4
        isActive: true,
      };

      // Test Wednesday (2025-09-24)
      const wednesdayDate = new Date('2025-09-24');
      const result = (service as any).getMealRepeatDayForDate(diet, meal, wednesdayDate);
      
      expect(result).toBe(4); // Should return 4 for Wednesday
    });

    it('should correctly calculate DIET_DAYS mode - first day', () => {
      const diet = {
        id: 'test-diet',
        dayInterpretationMode: DietDayInterpretationMode.DIET_DAYS,
        startDate: new Date('2025-09-17'), // Start date
        endDate: new Date('2025-09-25'),
      } as Diet;

      const meal = {
        id: 'test-meal',
        repeatDays: [1, 4], // 1st day, 4th day of diet
        isActive: true,
      };

      // Test first day (2025-09-17 = start date)
      const firstDay = new Date('2025-09-17');
      const result = (service as any).getMealRepeatDayForDate(diet, meal, firstDay);
      
      expect(result).toBe(1); // Should return 1 for first day
    });

    it('should correctly calculate DIET_DAYS mode - fourth day', () => {
      const diet = {
        id: 'test-diet',
        dayInterpretationMode: DietDayInterpretationMode.DIET_DAYS,
        startDate: new Date('2025-09-17'), // Start date
        endDate: new Date('2025-09-25'),
      } as Diet;

      const meal = {
        id: 'test-meal',
        repeatDays: [1, 4], // 1st day, 4th day of diet
        isActive: true,
      };

      // Test fourth day (2025-09-20 = start date + 3 days)
      const fourthDay = new Date('2025-09-20');
      const result = (service as any).getMealRepeatDayForDate(diet, meal, fourthDay);
      
      expect(result).toBe(4); // Should return 4 for fourth day
    });

    it('should return null for days not in repeatDays', () => {
      const diet = {
        id: 'test-diet',
        dayInterpretationMode: DietDayInterpretationMode.WEEK_DAY,
        startDate: new Date('2025-09-17'),
        endDate: new Date('2025-09-25'),
      } as Diet;

      const meal = {
        id: 'test-meal',
        repeatDays: [1, 4], // Sunday=1, Wednesday=4
        isActive: true,
      };

      // Test Tuesday (2025-09-23) - should not be included
      const tuesdayDate = new Date('2025-09-23');
      const result = (service as any).getMealRepeatDayForDate(diet, meal, tuesdayDate);
      
      expect(result).toBeNull(); // Should return null for Tuesday
    });

    it('should ignore hours and normalize dates to start of day', () => {
      const diet = {
        id: 'test-diet',
        dayInterpretationMode: DietDayInterpretationMode.DIET_DAYS,
        startDate: new Date('2025-09-17T14:30:25'), // Start date with specific time
        endDate: new Date('2025-09-25T09:45:10'),
      } as Diet;

      const meal = {
        id: 'test-meal',
        repeatDays: [1, 4], // 1st day, 4th day of diet
        isActive: true,
      };

      // Test same day but different times - should both be day 1
      const morningTime = new Date('2025-09-17T06:00:00');
      const eveningTime = new Date('2025-09-17T23:59:59');
      
      const morningResult = (service as any).getMealRepeatDayForDate(diet, meal, morningTime);
      const eveningResult = (service as any).getMealRepeatDayForDate(diet, meal, eveningTime);
      
      expect(morningResult).toBe(1); // Should return 1 for morning
      expect(eveningResult).toBe(1); // Should return 1 for evening (same day)
    });
  });

  describe('findMealRecordInList', () => {
    it('should find matching meal record by mealId, patientId, date, and repeatDay', () => {
      const mealRecords: MealRecord[] = [
        {
          id: 'record-1',
          mealId: 'meal-1',
          patientId: 'patient-1',
          mealRelativeDate: new Date('2025-09-17T10:30:00'),
          mealRepeatDay: 1,
        } as MealRecord,
        {
          id: 'record-2',
          mealId: 'meal-2',
          patientId: 'patient-1',
          mealRelativeDate: new Date('2025-09-17T15:45:00'),
          mealRepeatDay: 4,
        } as MealRecord
      ];

      const targetDate = new Date('2025-09-17T08:00:00');
      const result = (service as any).findMealRecordInList('meal-1', 'patient-1', targetDate, 1, mealRecords);
      
      expect(result).toBeTruthy();
      expect(result.id).toBe('record-1');
    });

    it('should return null when no matching meal record is found', () => {
      const mealRecords: MealRecord[] = [
        {
          id: 'record-1',
          mealId: 'meal-1',
          patientId: 'patient-1',
          mealRelativeDate: new Date('2025-09-17'),
          mealRepeatDay: 1,
        } as MealRecord
      ];

      const targetDate = new Date('2025-09-18');
      const result = (service as any).findMealRecordInList('meal-1', 'patient-1', targetDate, 1, mealRecords);
      
      expect(result).toBeNull();
    });
  });
});
