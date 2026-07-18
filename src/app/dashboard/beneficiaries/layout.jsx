'use client';

import { PermissionBasedGuard } from 'src/auth/guard';

const BENEFICIARY_VIEW_PERMISSIONS = [
  'view_beneficiary',
  'view_vulnerabilitytype',
  'view_vulnerabilityassessment',
  'view_targetingcriteria',
  'view_needsassessment',
  'view_eligibilityscreening',
  'view_householdprofiling',
  'view_householdsurvey',
  'view_complaintsfeedback',
  'view_satisfactionsurvey',
  'view_grievanceredressal',
  'view_donorreport',
  'view_attendancetracker',
  'view_coveragearea',
  'view_beneficiarysetting',
];

export default function BeneficiariesLayout({ children }) {
  return (
    <PermissionBasedGuard requiredPermission={BENEFICIARY_VIEW_PERMISSIONS}>
      {children}
    </PermissionBasedGuard>
  );
}
