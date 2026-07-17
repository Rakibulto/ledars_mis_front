import dayjs from 'dayjs';
import { z as zod } from 'zod';

const isValidDate = (val) => dayjs(val).isValid();

export const HolidaySchema = zod
  .object({
    name: zod.string().min(1, { message: 'Holiday Name is required!' }),
    description: zod.string().optional(),
    from_date: zod.string().min(1, { message: 'Start Date is required!' }).refine(isValidDate, {
      message: 'Invalid Start Date format!',
    }),
    to_date: zod
      .string()
      .min(1, { message: 'End Date is required!' })
      .refine(isValidDate, {
        message: 'Invalid End Date format!',
      })
      .refine(
        (toDate, ctx) => {
          if (!ctx || !ctx.parent) return true;

          const fromDate = ctx.parent.from_date;
          if (!fromDate || !isValidDate(fromDate)) return true;

          return dayjs(toDate).isSame(dayjs(fromDate)) || dayjs(toDate).isAfter(dayjs(fromDate));
        },
        {
          message: 'End Date must be on or after Start Date!',
        }
      ),
    is_global: zod.boolean(),
    holiday_type: zod.array(zod.string()).optional(),
    employment_types: zod.number().or(zod.string()).optional(),
    branches: zod.array(zod.any()).optional(),
    departments: zod.array(zod.any()).optional(),
    designations: zod.array(zod.any()).optional(),
    assigned_employees: zod.array(zod.any()).optional(),
    excluded_employees: zod.array(zod.any()).optional(),
    status: zod.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.is_global === false && (!data.holiday_type || data.holiday_type.length === 0)) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        message: 'At least one holiday type must be selected for non-global holidays!',
        path: ['holiday_type'],
      });
    }

    if (data.holiday_type?.includes('Branch') && (!data.branches || data.branches.length === 0)) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        message: 'At least one branch must be selected!',
        path: ['branches'],
      });
    }

    if (
      data.holiday_type?.includes('Department') &&
      (!data.departments || data.departments.length === 0)
    ) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        message: 'At least one department must be selected!',
        path: ['departments'],
      });
    }

    if (
      data.holiday_type?.includes('Designation') &&
      (!data.designations || data.designations.length === 0)
    ) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        message: 'At least one designation must be selected!',
        path: ['designations'],
      });
    }

    if (data.holiday_type?.includes('Employee Type') && !data.employment_types) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        message: 'Employment type must be selected!',
        path: ['employment_types'],
      });
    }

    if (
      data.holiday_type?.includes('Assigned Employees') &&
      (!data.assigned_employees || data.assigned_employees.length === 0)
    ) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        message: 'At least one assigned employee must be selected!',
        path: ['assigned_employees'],
      });
    }

    if (
      data.holiday_type?.includes('Excluded Employees') &&
      (!data.excluded_employees || data.excluded_employees.length === 0)
    ) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        message: 'At least one excluded employee must be selected!',
        path: ['excluded_employees'],
      });
    }
  });
