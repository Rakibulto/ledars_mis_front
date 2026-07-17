import { z as zod } from 'zod';

export const LeaveRequestSchema = zod
  .object({
    employee: zod.number({ required_error: 'Employee is required' }),
    leave_policy: zod.number({ required_error: 'Leave policy is required' }),
    is_half_day: zod.boolean().optional(),
    half_day_period: zod.string().optional(),
    start_date: zod.string().min(1, { message: 'Start date is required' }),
    end_date: zod.string().min(1, { message: 'End date is required' }),
    reason: zod.string().min(1, { message: 'Reason is required' }),
    status: zod.string().min(1, { message: 'Status is required' }),
  })
  .refine(
    (data) => {
      // require half_day_period when is_half_day is true
      if (data.is_half_day) {
        return !!data.half_day_period;
      }
      return true;
    },
    {
      path: ['half_day_period'],
      message: 'Half day period is required when half day is selected',
    }
  );

export const LeaveApprovalSchema = zod.object({
  status: zod.enum(['pending', 'approved', 'rejected'], {
    required_error: 'Status is required',
  }),
  comments: zod.string().nullable().optional(),
});
