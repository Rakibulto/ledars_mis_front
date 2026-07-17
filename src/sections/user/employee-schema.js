import { z as zod } from 'zod';

import { schemaHelper } from 'src/components/hook-form';

// Validation schema for employee
export const EmployeeSchema = zod
  .object({
    // User ID
    user: zod.any(),

    // Employee basic information
    employee_id: zod.string().min(1, { message: 'Employee ID is required!' }),
    employee_name: zod.string().min(1, { message: 'Employee name is required!' }),
    joining_date: schemaHelper
      .date({ message: { required_error: 'Joining date is required!' } })
      .nullable(),
    probation_period_time: zod.number().int().min(0).nullable(),
    probation_period: zod.boolean(),
    confirmation_date: schemaHelper
      .date({ message: { required_error: 'Confirmation date is required!' } })
      .nullable(),
    date_of_birth: schemaHelper
      .date({ message: { required_error: 'Date of birth is required!' } })
      .nullable(),

    // Office information
    department_id: zod
      .number({
        required_error: 'Department is required!',
      })
      .nullable(),
    designation_id: zod
      .number({
        required_error: 'Designation is required!',
      })
      .nullable(),
    location_id: zod
      .number({
        required_error: 'Location is required!',
      })
      .nullable(),
    office_days: zod.string(),
    office_days_custom: zod.string().optional().nullable(),
    office_time_id: zod.number().nullable(),
    official_mobile_number: zod.string(),
    employment_type: zod.number(),
    salary: zod.number().nullable().or(zod.string().nullable()),
    rfid_or_machine_code: zod.string(),
    grade_id: zod.number().nullable(),
    status: zod.string(),
    leave_group: zod.number().nullable(),

    // Termination details
    resign_terminated_date: schemaHelper.date().nullable(),
    resign_terminated_reason: zod.string(),

    // Personal information
    present_address: zod.string(),
    permanent_address: zod.string(),
    marital_status: zod.string(),
    religion: zod.string(),
    blood_group: zod.string(),
    gender: zod.string(),
    personal_mobile_number: zod.string(),
    personal_email_id: zod.string(),

    // Education & Experience
    last_education: zod.string(),
    educational_institute: zod.string(),
    last_job_experience: zod.string(),

    // Bank details
    bank_name: zod.string().nullable(),
    bank_account_number: zod.string().nullable(),
    bank_branch: zod.string().nullable(),

    // Profile picture
    profile_picture: schemaHelper.file().nullable(),

    // Signature
    signature: schemaHelper.file().nullable(),

    // Attendance settings
    allow_web_login: zod.boolean(),
    is_ip_restricted: zod.boolean(),
    allow_any_ip_attendance: zod.boolean(),

    // Necessary arrays
    // supervisor: zod.array(zod.number().nullable()).optional().default([]),
    emergency_contact: zod
      .array(
        zod
          .object({
            name: zod.string().optional().nullable(),
            relationship: zod.string().optional().nullable(),
            phone: zod.string().optional().nullable(),
            address: zod.string().optional().nullable(),
          })
          .nullable()
          .optional()
      )
      .optional()
      .default([]),
    nominee: zod
      .array(
        zod
          .object({
            name: zod.string().optional().nullable(),
            relationship: zod.string().optional().nullable(),
            phone: zod.string().optional().nullable(),
            address: zod.string().optional().nullable(),
            percentage: zod.union([zod.string(), zod.number(), zod.null()]).optional().nullable(),
          })
          .nullable()
          .optional()
      )
      .optional()
      .default([]),
  })
  .superRefine((data, ctx) => {
    // If either IP option is selected, web login must be enabled
    if ((data.is_ip_restricted || data.allow_any_ip_attendance) && !data.allow_web_login) {
      ctx.addIssue({
        path: ['allow_web_login'],
        code: zod.ZodIssueCode.custom,
        message: 'Allow Web Login must be enabled to use IP restrictions or Any IP Attendance.',
      });
    }
    // Both IP options cannot be selected at the same time
    if (data.is_ip_restricted && data.allow_any_ip_attendance) {
      ctx.addIssue({
        path: ['is_ip_restricted'],
        code: zod.ZodIssueCode.custom,
        message: 'Cannot select both IP Restricted and Allow Attendance from Any IP.',
      });
      ctx.addIssue({
        path: ['allow_any_ip_attendance'],
        code: zod.ZodIssueCode.custom,
        message: 'Cannot select both IP Restricted and Allow Attendance from Any IP.',
      });
    }
  });
