'use client';

import dayjs from 'dayjs';
import { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import Autocomplete from '@mui/material/Autocomplete';
import { alpha, useTheme } from '@mui/material/styles';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter } from 'src/routes/hooks/use-router';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

import {
  useProjectManagementsApi,
  useProjectManagementProject,
} from './use-project-managements-api';

function toStringArray(value, fallback = []) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (value == null || value === '') return fallback;
  return [String(value)];
}

const PROJECT_TYPE_OPTIONS = [
  'Development',
  'Emergency',
  'Livelihood',
  'Education',
  'Health',
  'Protection',
  'WASH',
  'Nutrition',
  'Shelter',
  'Other',
];
const IMPLEMENTATION_OPTIONS = ['Direct', 'Partner', 'Consortium'];
const STATUS_OPTIONS = ['Draft', 'Planning', 'Active', 'On Hold', 'Completed', 'Closed'];
const REPORTING_OPTIONS = ['Weekly', 'Monthly', 'Quarterly', 'Biannual', 'Annual'];
const RISK_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
const MATERIAL_CATEGORY_OPTIONS = [
  'Construction',
  'Equipment',
  'IT',
  'Office',
  'Medical',
  'Education',
  'Food',
  'Logistics',
  'Other',
];
const MATERIAL_UNIT_OPTIONS = ['pcs', 'box', 'kg', 'litre', 'meter', 'set', 'pack', 'lot'];

const EMPTY_SUB_PLAN = {
  title: '',
  start_date: '',
  end_date: '',
  unit_type: '',
  unit_no: '',
  unit_cost: '',
  assigned_user_ids: [],
};

function calculateSubPlanCost(unitNo, unitCost) {
  return Number(unitNo || 0) * Number(unitCost || 0);
}

const EMPTY_PLAN = {
  serial_code: '1',
  title: '',
  description: '',
  duration_days: '',
  start_date: '',
  end_date: '',
  status: 'Pending',
  assigned_user_ids: [],
  sub_plans: [{ ...EMPTY_SUB_PLAN }],
};

const PLAN_CARD_COLORS = [
  { border: '#fca5a5', bg: '#fef2f2', accent: '#dc2626', button: '#ef4444' }, // light red
  { border: '#93c5fd', bg: '#eff6ff', accent: '#2563eb', button: '#3b82f6' }, // light blue
];

function getPlanCardColor(index) {
  return PLAN_CARD_COLORS[index % PLAN_CARD_COLORS.length];
}

function getMainSerialCode(plan, index = 0) {
  const code = String(plan?.serial_code ?? '').trim();
  return code || String(index + 1);
}

function getSubSerialCode(mainSerial, subIndex) {
  return `${mainSerial}.${subIndex + 1}`;
}

function getNextMainSerialCode(plans = []) {
  if (!plans.length) return '1';

  const lastCode = getMainSerialCode(plans[plans.length - 1], plans.length - 1);
  const parts = lastCode.split('.');
  const lastPart = Number(parts[parts.length - 1]);

  if (Number.isFinite(lastPart)) {
    parts[parts.length - 1] = String(lastPart + 1);
    return parts.join('.');
  }

  return String(plans.length + 1);
}

function createEmptySubPlan(userId = null) {
  return {
    ...EMPTY_SUB_PLAN,
    assigned_user_ids: userId ? [userId] : [],
  };
}

const EMPTY_MATERIAL = {
  title: '',
  category: '',
  description: '',
  unit: 'pcs',
  quantity: '1',
  estimated_unit_cost: '',
  tax_rate: '5',
  preferred_vendor: '',
  required_by: '',
  notes: '',
  plan_serial_no: '',
};

const INITIAL_FORM = {
  title: '',
  short_name: '',
  donor_id: null,
  project_type: ['Development'],
  implementation_type: ['Direct'],
  status: 'Draft',
  start_date: '',
  end_date: '',
  budget_amount: '',
  currency: 'BDT',
  project_manager_id: null,
  assigned_user_ids: [],
  sector: '',
  location: '',
  target_beneficiaries: [],
  background: '',
  objectives: '',
  expected_outcomes: '',
  monitoring_plan: '',
  reporting_frequency: 'Monthly',
  risk_level: 'Medium',
  notes: '',
  plans: [{ ...EMPTY_PLAN, serial_code: '1', sub_plans: [{ ...EMPTY_SUB_PLAN }] }],
  materials: [],
  materials_expense_id: null,
  materials_expense_invoice_number: '',
};

function calculateDurationDays(startDate, endDate) {
  if (!startDate || !endDate) return '';

  const start = dayjs(startDate);
  const end = dayjs(endDate);

  if (!start.isValid() || !end.isValid() || end.isBefore(start, 'day')) return '';

  return String(end.diff(start, 'day') + 1);
}

function createEmptyPlanForUser(userId = null, serialCode = '1') {
  return {
    ...EMPTY_PLAN,
    serial_code: serialCode,
    assigned_user_ids: userId ? [userId] : [],
    sub_plans: [createEmptySubPlan(userId)],
  };
}

function createEmptyMaterial() {
  return { ...EMPTY_MATERIAL };
}

function calculateMaterialEstimatedTotal(quantity, unitCost) {
  return Number(quantity || 0) * Number(unitCost || 0);
}

function calculateMaterialTaxAmount(subtotal, taxRate) {
  return Number(subtotal || 0) * (Math.max(0, Number(taxRate || 0)) / 100);
}

function formatCurrencyAmount(currency, amount) {
  return `${currency} ${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function isPlaceholderSubPlan(subPlan) {
  return (
    !String(subPlan?.title || '').trim() &&
    !subPlan?.start_date &&
    !subPlan?.end_date &&
    !String(subPlan?.unit_type || '').trim() &&
    !Number(subPlan?.unit_no || 0) &&
    !Number(subPlan?.unit_cost || 0) &&
    (!Array.isArray(subPlan?.assigned_user_ids) || subPlan.assigned_user_ids.length === 0)
  );
}

function syncSubPlanDatesWithProject(subPlan, projectStartDate, projectEndDate) {
  const next = {
    ...subPlan,
    assigned_user_ids: Array.isArray(subPlan.assigned_user_ids) ? subPlan.assigned_user_ids : [],
  };

  if (
    next.start_date &&
    projectStartDate &&
    dayjs(next.start_date).isBefore(dayjs(projectStartDate), 'day')
  ) {
    next.start_date = projectStartDate;
  }
  if (
    next.start_date &&
    projectEndDate &&
    dayjs(next.start_date).isAfter(dayjs(projectEndDate), 'day')
  ) {
    next.start_date = projectEndDate;
  }
  if (
    next.end_date &&
    projectStartDate &&
    dayjs(next.end_date).isBefore(dayjs(projectStartDate), 'day')
  ) {
    next.end_date = projectStartDate;
  }
  if (
    next.end_date &&
    projectEndDate &&
    dayjs(next.end_date).isAfter(dayjs(projectEndDate), 'day')
  ) {
    next.end_date = projectEndDate;
  }
  if (
    next.start_date &&
    next.end_date &&
    dayjs(next.end_date).isBefore(dayjs(next.start_date), 'day')
  ) {
    next.end_date = next.start_date;
  }

  return next;
}

function syncPlanDatesWithProject(plan, projectStartDate, projectEndDate) {
  const subPlans = (
    Array.isArray(plan.sub_plans) && plan.sub_plans.length
      ? plan.sub_plans
      : [{ ...EMPTY_SUB_PLAN }]
  ).map((sub) => syncSubPlanDatesWithProject(sub, projectStartDate, projectEndDate));

  const starts = subPlans.map((s) => s.start_date).filter(Boolean);
  const ends = subPlans.map((s) => s.end_date).filter(Boolean);

  const nextPlan = {
    ...plan,
    assigned_user_ids: Array.isArray(plan.assigned_user_ids) ? plan.assigned_user_ids : [],
    sub_plans: subPlans,
    start_date: starts.length ? starts.sort()[0] : '',
    end_date: ends.length ? ends.sort().at(-1) : '',
  };

  nextPlan.duration_days = calculateDurationDays(nextPlan.start_date, nextPlan.end_date);

  return nextPlan;
}

function syncMaterialWithProject(material, projectStartDate, projectEndDate, totalPlans = 0) {
  const nextMaterial = {
    ...material,
    plan_serial_no: material.plan_serial_no || '',
  };

  if (
    nextMaterial.plan_serial_no &&
    (Number(nextMaterial.plan_serial_no) < 1 || Number(nextMaterial.plan_serial_no) > totalPlans)
  ) {
    nextMaterial.plan_serial_no = '';
  }

  if (
    nextMaterial.required_by &&
    projectStartDate &&
    dayjs(nextMaterial.required_by).isBefore(dayjs(projectStartDate), 'day')
  ) {
    nextMaterial.required_by = projectStartDate;
  }

  if (
    nextMaterial.required_by &&
    projectEndDate &&
    dayjs(nextMaterial.required_by).isAfter(dayjs(projectEndDate), 'day')
  ) {
    nextMaterial.required_by = projectEndDate;
  }

  return nextMaterial;
}

function syncPlansWithAssignedUsers(
  plans,
  selectedUserIds = [],
  projectStartDate = '',
  projectEndDate = ''
) {
  const validSelectedIds = selectedUserIds.map(String);
  const sanitizedPlans = plans.map((plan) =>
    syncPlanDatesWithProject(
      {
        ...plan,
        assigned_user_ids: (plan.assigned_user_ids || []).filter((id) =>
          validSelectedIds.includes(String(id))
        ),
        sub_plans: (Array.isArray(plan.sub_plans) && plan.sub_plans.length
          ? plan.sub_plans
          : [{ ...EMPTY_SUB_PLAN }]
        ).map((sub) => ({
          ...sub,
          assigned_user_ids: (sub.assigned_user_ids || []).filter((id) =>
            validSelectedIds.includes(String(id))
          ),
        })),
      },
      projectStartDate,
      projectEndDate
    )
  );

  if (!sanitizedPlans.length) {
    return [{ ...EMPTY_PLAN, sub_plans: [{ ...EMPTY_SUB_PLAN }] }];
  }

  return sanitizedPlans;
}

function formatApiError(error) {
  if (!error) return 'Failed to save project. Please review the form and try again.';
  if (typeof error === 'string') return error;
  if (error.detail) return String(error.detail);
  if (Array.isArray(error))
    return error
      .map((item) => formatApiError(item))
      .filter(Boolean)
      .join(' ');

  if (typeof error === 'object') {
    const messages = Object.entries(error).flatMap(([field, value]) => {
      const items = Array.isArray(value) ? value : [value];
      return items.map((item) => {
        const text = typeof item === 'string' ? item : JSON.stringify(item);
        return field === 'non_field_errors' ? text : `${field}: ${text}`;
      });
    });

    if (messages.length) return messages.join(' | ');
  }

  return 'Failed to save project. Please review the form and try again.';
}

function validateForm(form) {
  if (!form.title.trim()) return 'Project title is required.';
  if (form.start_date && form.end_date && form.end_date < form.start_date) {
    return 'Project end date cannot be before the start date.';
  }

  for (let index = 0; index < form.plans.length; index += 1) {
    const plan = form.plans[index];
    const mainSerial = getMainSerialCode(plan, index);
    const hasMainOrSub =
      plan.title.trim() ||
      (Array.isArray(plan.sub_plans) && plan.sub_plans.some((s) => s.title?.trim()));

    if (hasMainOrSub) {
      if (!String(plan.serial_code || '').trim()) {
        return `Plan ${index + 1} serial number is required.`;
      }

      const subPlans = Array.isArray(plan.sub_plans) ? plan.sub_plans : [];
      for (let subIndex = 0; subIndex < subPlans.length; subIndex += 1) {
        const sub = subPlans[subIndex];
        if (!isPlaceholderSubPlan(sub)) {
          const subSerial = getSubSerialCode(mainSerial, subIndex);

          if (sub.start_date && sub.end_date && sub.end_date < sub.start_date) {
            return `Sub plan ${subSerial} end date cannot be before its start date.`;
          }

          if (
            form.start_date &&
            sub.start_date &&
            dayjs(sub.start_date).isBefore(dayjs(form.start_date), 'day')
          ) {
            return `Sub plan ${subSerial} start date must stay within the project date range.`;
          }

          if (
            form.end_date &&
            sub.end_date &&
            dayjs(sub.end_date).isAfter(dayjs(form.end_date), 'day')
          ) {
            return `Sub plan ${subSerial} end date must stay within the project date range.`;
          }
        }
      }

      if (!plan.title.trim() && subPlans.some((s) => s.title?.trim())) {
        return `Main plan ${mainSerial} title is required when sub plans are filled.`;
      }
    }
  }

  const titledMaterials = form.materials.filter((material) => material.title.trim());
  for (let index = 0; index < titledMaterials.length; index += 1) {
    const material = titledMaterials[index];

    if (Number(material.quantity || 0) <= 0) {
      return `Material line ${index + 1} quantity must be greater than zero.`;
    }

    if (Number(material.estimated_unit_cost || 0) < 0) {
      return `Material line ${index + 1} unit cost cannot be negative.`;
    }

    if (
      form.start_date &&
      material.required_by &&
      dayjs(material.required_by).isBefore(dayjs(form.start_date), 'day')
    ) {
      return `Material line ${index + 1} required date must stay within the project date range.`;
    }

    if (
      form.end_date &&
      material.required_by &&
      dayjs(material.required_by).isAfter(dayjs(form.end_date), 'day')
    ) {
      return `Material line ${index + 1} required date must stay within the project date range.`;
    }

    if (
      material.plan_serial_no &&
      !form.plans[Number(material.plan_serial_no) - 1]?.title?.trim()
    ) {
      return `Material line ${index + 1} must point to a valid roadmap step.`;
    }
  }

  return '';
}

function toPayload(form) {
  return {
    title: form.title.trim(),
    short_name: form.short_name.trim(),
    donor_id: form.donor_id || null,
    project_type: toStringArray(form.project_type, ['Development']),
    implementation_type: toStringArray(form.implementation_type, ['Direct']),
    status: form.status,
    start_date: form.start_date || null,
    end_date: form.end_date || null,
    budget_amount: Number(form.budget_amount || 0),
    currency: form.currency.trim() || 'BDT',
    project_manager_id: form.project_manager_id || null,
    assigned_user_ids: form.assigned_user_ids,
    sector: form.sector.trim(),
    location: form.location.trim(),
    target_beneficiaries: toStringArray(form.target_beneficiaries),
    background: form.background.trim(),
    objectives: form.objectives.trim(),
    expected_outcomes: form.expected_outcomes.trim(),
    monitoring_plan: form.monitoring_plan.trim(),
    reporting_frequency: form.reporting_frequency,
    risk_level: form.risk_level,
    notes: form.notes.trim(),
    plans: form.plans
      .filter(
        (plan) =>
          plan.title.trim() ||
          (Array.isArray(plan.sub_plans) && plan.sub_plans.some((s) => s.title?.trim()))
      )
      .map((plan, index) => {
        const serialCode = getMainSerialCode(plan, index);
        const subPlans = (Array.isArray(plan.sub_plans) ? plan.sub_plans : [])
          .filter(
            (sub) =>
              sub.title?.trim() ||
              sub.start_date ||
              sub.end_date ||
              sub.unit_type?.trim() ||
              Number(sub.unit_no || 0) ||
              Number(sub.unit_cost || 0)
          )
          .map((sub, subIndex) => {
            const unitNo = Number(sub.unit_no || 0);
            const unitCost = Number(sub.unit_cost || 0);
            return {
              serial_code: getSubSerialCode(serialCode, subIndex),
              title: (sub.title || '').trim(),
              start_date: sub.start_date || null,
              end_date: sub.end_date || null,
              unit_type: (sub.unit_type || '').trim(),
              unit_no: unitNo,
              unit_cost: unitCost,
              cost: calculateSubPlanCost(unitNo, unitCost),
              sort_order: subIndex + 1,
              assigned_user_ids: sub.assigned_user_ids || [],
            };
          });

        const starts = subPlans.map((s) => s.start_date).filter(Boolean);
        const ends = subPlans.map((s) => s.end_date).filter(Boolean);
        const startDate = starts.length ? starts.sort()[0] : plan.start_date || null;
        const endDate = ends.length ? ends.sort().at(-1) : plan.end_date || null;

        return {
          serial_no: index + 1,
          serial_code: serialCode,
          title: plan.title.trim() || `Plan ${serialCode}`,
          description: (plan.description || '').trim(),
          duration_days: Number(calculateDurationDays(startDate, endDate) || 0),
          start_date: startDate,
          end_date: endDate,
          status: plan.status || 'Pending',
          assigned_user_ids: plan.assigned_user_ids || [],
          sub_plans: subPlans,
        };
      }),
    materials: form.materials
      .filter((material) => material.title.trim())
      .map((material, index) => ({
        title: material.title.trim(),
        category: material.category.trim(),
        description: material.description.trim(),
        unit: material.unit.trim(),
        quantity: Number(material.quantity || 0),
        estimated_unit_cost: Number(material.estimated_unit_cost || 0),
        preferred_vendor: material.preferred_vendor.trim(),
        required_by: material.required_by || null,
        notes: material.notes.trim(),
        plan_serial_no: material.plan_serial_no ? Number(material.plan_serial_no) : null,
        sort_order: index + 1,
      })),
  };
}

function mapProjectToForm(project) {
  return {
    title: project?.title || '',
    short_name: project?.short_name || '',
    donor_id: project?.donor_id || null,
    project_type: toStringArray(project?.project_type, ['Development']),
    implementation_type: toStringArray(project?.implementation_type, ['Direct']),
    status: project?.status || 'Draft',
    start_date: project?.start_date || '',
    end_date: project?.end_date || '',
    budget_amount: project?.budget_amount || '',
    currency: project?.currency || 'BDT',
    project_manager_id: project?.project_manager_id || null,
    assigned_user_ids: Array.isArray(project?.assigned_users)
      ? project.assigned_users.map((user) => user.id)
      : [],
    sector: project?.sector || '',
    location: project?.location || '',
    target_beneficiaries: Array.isArray(project?.target_beneficiaries)
      ? project.target_beneficiaries
      : [],
    background: project?.background || '',
    objectives: project?.objectives || '',
    expected_outcomes: project?.expected_outcomes || '',
    monitoring_plan: project?.monitoring_plan || '',
    reporting_frequency: project?.reporting_frequency || 'Monthly',
    risk_level: project?.risk_level || 'Medium',
    notes: project?.notes || '',
    plans:
      Array.isArray(project?.plans) && project.plans.length
        ? project.plans.map((plan, planIndex) => ({
            serial_code: plan.serial_code || String(plan.serial_no || planIndex + 1),
            title: plan.title || '',
            description: plan.description || '',
            duration_days:
              calculateDurationDays(plan.start_date || '', plan.end_date || '') ||
              plan.duration_days ||
              '',
            start_date: plan.start_date || '',
            end_date: plan.end_date || '',
            status: plan.status || 'Pending',
            assigned_user_ids: Array.isArray(plan.assigned_users)
              ? plan.assigned_users.map((user) => user.id)
              : [],
            sub_plans:
              Array.isArray(plan.sub_plans) && plan.sub_plans.length
                ? plan.sub_plans.map((sub) => ({
                    title: sub.title || '',
                    start_date: sub.start_date || '',
                    end_date: sub.end_date || '',
                    unit_type: sub.unit_type || '',
                    unit_no: sub.unit_no != null && sub.unit_no !== '' ? String(sub.unit_no) : '',
                    unit_cost:
                      sub.unit_cost != null && sub.unit_cost !== '' ? String(sub.unit_cost) : '',
                    assigned_user_ids: Array.isArray(sub.assigned_users)
                      ? sub.assigned_users.map((user) => user.id)
                      : Array.isArray(sub.assigned_user_ids)
                        ? sub.assigned_user_ids
                        : [],
                  }))
                : [
                    {
                      ...EMPTY_SUB_PLAN,
                      start_date: plan.start_date || '',
                      end_date: plan.end_date || '',
                      assigned_user_ids: Array.isArray(plan.assigned_users)
                        ? plan.assigned_users.map((user) => user.id)
                        : [],
                    },
                  ],
          }))
        : [{ ...EMPTY_PLAN, serial_code: '1', sub_plans: [{ ...EMPTY_SUB_PLAN }] }],
    materials: Array.isArray(project?.materials)
      ? project.materials.map((material) => ({
          title: material.title || '',
          category: material.category || '',
          description: material.description || '',
          unit: material.unit || 'pcs',
          quantity: String(material.quantity ?? '1'),
          estimated_unit_cost: String(
            material.estimatedUnitCost ?? material.estimated_unit_cost ?? ''
          ),
          tax_rate: String(material.taxRate ?? material.tax_rate ?? '5'),
          preferred_vendor: material.preferredVendor || material.preferred_vendor || '',
          required_by: material.requiredBy || material.required_by || '',
          notes: material.notes || '',
          plan_serial_no: material.planSerialNo || material.plan_serial_no || '',
        }))
      : [],
    materials_expense_id: project?.materialsExpenseId || project?.materials_expense_id || null,
    materials_expense_invoice_number:
      project?.materialsExpenseInvoiceNumber || project?.materials_expense_invoice_number || '',
  };
}

function SectionCard({ eyebrow, title, description, children, action = null }) {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)' }}>
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          spacing={1.5}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="overline" color="primary.main">
              {eyebrow}
            </Typography>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mt: 0.25 }}>
              {title}
            </Typography>
            {description ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 760 }}>
                {description}
              </Typography>
            ) : null}
          </Box>
          {action}
        </Stack>
        <Box
          sx={{
            '& .MuiTextField-root': { width: '100%' },
            '& .MuiAutocomplete-root': { width: '100%' },
            '& .MuiInputBase-root': {
              minHeight: 40,
              borderRadius: 1.75,
            },
            '& .MuiInputBase-input': {
              py: 1.15,
            },
            '& .MuiChip-root': {
              borderRadius: 1.5,
            },
          }}
        >
          {children}
        </Box>
      </CardContent>
    </Card>
  );
}

function TabPanel({ activeTab, value, children }) {
  if (activeTab !== value) return null;
  return <Box>{children}</Box>;
}

function MultilineField({ label, value, onChange, minRows = 3 }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
        {label}
      </Typography>
      <TextareaAutosize
        minRows={minRows}
        value={value}
        onChange={onChange}
        style={{
          width: '100%',
          resize: 'vertical',
          padding: '12px 14px',
          borderRadius: 10,
          border: '1px solid rgba(145, 158, 171, 0.24)',
          fontFamily: 'inherit',
          fontSize: 14,
          lineHeight: 1.5,
          backgroundColor: '#fff',
          color: 'inherit',
          boxSizing: 'border-box',
        }}
      />
    </Box>
  );
}

export default function ProjectForm({ mode = 'create', projectId = null }) {
  const theme = useTheme();
  const router = useRouter();
  const isCreateMode = mode === 'create';
  const isEditMode = mode === 'edit';
  const isReadOnly = false;

  const { donors, users, isLoading: optionsLoading, actions } = useProjectManagementsApi();
  const {
    project,
    isLoading: projectLoading,
    error: projectError,
  } = useProjectManagementProject(projectId);
  const { data: vulnerabilityTypesData, loading: vulnerabilityTypesLoading } = useGetRequest(
    endpoints.beneficiaries.vulnerability_types
  );
  const vulnerabilityTypeOptions = (
    Array.isArray(vulnerabilityTypesData)
      ? vulnerabilityTypesData
      : vulnerabilityTypesData?.results || []
  )
    .filter((item) => item?.status !== false)
    .map((item) => item.name)
    .filter(Boolean);

  const { data: projectUnitsData, loading: projectUnitsLoading } = useGetRequest(
    endpoints.projectManagements.units
  );
  const projectUnitOptions = (
    Array.isArray(projectUnitsData) ? projectUnitsData : projectUnitsData?.results || []
  )
    .filter((item) => item?.status !== false)
    .map((item) => item.name)
    .filter(Boolean);

  const [form, setForm] = useState(INITIAL_FORM);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const hydratedProjectRef = useRef(null);

  useEffect(() => {
    if (!isEditMode || !project?.id) return;

    const projectVersion = `${project.id}:${project.updated_at || ''}`;
    if (hydratedProjectRef.current === projectVersion) return;

    setForm(mapProjectToForm(project));
    hydratedProjectRef.current = projectVersion;
  }, [isEditMode, project]);

  useEffect(() => {
    setForm((prev) => {
      const nextPlans = syncPlansWithAssignedUsers(
        prev.plans,
        prev.assigned_user_ids,
        prev.start_date,
        prev.end_date
      );

      if (JSON.stringify(nextPlans) === JSON.stringify(prev.plans)) return prev;

      return {
        ...prev,
        plans: nextPlans,
      };
    });
  }, [form.assigned_user_ids, form.start_date, form.end_date]);

  useEffect(() => {
    setForm((prev) => {
      const nextMaterials = prev.materials.map((material) =>
        syncMaterialWithProject(material, prev.start_date, prev.end_date, prev.plans.length)
      );

      if (JSON.stringify(nextMaterials) === JSON.stringify(prev.materials)) return prev;

      return {
        ...prev,
        materials: nextMaterials,
      };
    });
  }, [form.plans, form.start_date, form.end_date]);

  const selectedAssignedUsers = useMemo(
    () => users.filter((user) => form.assigned_user_ids.includes(user.id)),
    [form.assigned_user_ids, users]
  );
  const selectedManager = users.find((user) => user.id === form.project_manager_id) || null;
  const selectedDonor = donors.find((donor) => donor.id === form.donor_id) || null;

  const pageTitle = isCreateMode ? 'Create New Project' : 'Edit Project';
  const pageDescription = isCreateMode
    ? 'Capture NGO project basics, duration, donor, staffing, material planning, and a multi-step implementation plan.'
    : 'Update project information using the same complete project form.';
  const completedTabCount = useMemo(() => {
    let count = 0;
    if (
      form.title.trim() &&
      toStringArray(form.project_type).length &&
      form.start_date &&
      form.end_date
    )
      count += 1;
    if (form.background.trim() || form.objectives.trim() || form.expected_outcomes.trim())
      count += 1;
    if (form.materials.some((material) => material.title.trim())) count += 1;
    if (
      form.plans.some(
        (plan) =>
          plan.title.trim() ||
          (Array.isArray(plan.sub_plans) && plan.sub_plans.some((sub) => sub.title?.trim()))
      )
    )
      count += 1;
    return count;
  }, [form]);
  const materialEstimatedTotal = useMemo(
    () =>
      form.materials.reduce(
        (sum, material) =>
          sum + calculateMaterialEstimatedTotal(material.quantity, material.estimated_unit_cost),
        0
      ),
    [form.materials]
  );
  const materialLinkedPlanCount = useMemo(
    () =>
      form.materials.filter((material) => material.title.trim() && material.plan_serial_no).length,
    [form.materials]
  );
  const planStepOptions = useMemo(
    () =>
      form.plans.map((plan, index) => ({
        serialNo: index + 1,
        label: plan.title.trim() ? `${index + 1}. ${plan.title.trim()}` : `Step ${index + 1}`,
      })),
    [form.plans]
  );

  function updateField(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === 'start_date' || field === 'end_date') {
        const nextProjectStart = field === 'start_date' ? value : prev.start_date;
        const nextProjectEnd = field === 'end_date' ? value : prev.end_date;
        next.plans = prev.plans.map((plan) =>
          syncPlanDatesWithProject(plan, nextProjectStart, nextProjectEnd)
        );
        next.materials = prev.materials.map((material) =>
          syncMaterialWithProject(material, nextProjectStart, nextProjectEnd, prev.plans.length)
        );
      }

      return next;
    });
  }

  function updatePlan(index, field, value) {
    setForm((prev) => ({
      ...prev,
      plans: prev.plans.map((plan, currentIndex) => {
        if (currentIndex !== index) return plan;

        const nextPlan = {
          ...plan,
          [field]:
            field === 'assigned_user_ids'
              ? Array.isArray(value)
                ? value.filter((id) => prev.assigned_user_ids.includes(id))
                : []
              : value,
        };

        return syncPlanDatesWithProject(nextPlan, prev.start_date, prev.end_date);
      }),
    }));
  }

  function updateSubPlan(planIndex, subIndex, field, value) {
    setForm((prev) => ({
      ...prev,
      plans: prev.plans.map((plan, currentIndex) => {
        if (currentIndex !== planIndex) return plan;

        const subPlans = (
          Array.isArray(plan.sub_plans) && plan.sub_plans.length
            ? plan.sub_plans
            : [{ ...EMPTY_SUB_PLAN }]
        ).map((sub, currentSubIndex) => {
          if (currentSubIndex !== subIndex) return sub;

          return {
            ...sub,
            [field]:
              field === 'assigned_user_ids'
                ? Array.isArray(value)
                  ? value.filter((id) => prev.assigned_user_ids.includes(id))
                  : []
                : value,
          };
        });

        return syncPlanDatesWithProject(
          { ...plan, sub_plans: subPlans },
          prev.start_date,
          prev.end_date
        );
      }),
    }));
  }

  function addSubPlan(planIndex) {
    setForm((prev) => ({
      ...prev,
      plans: prev.plans.map((plan, currentIndex) => {
        if (currentIndex !== planIndex) return plan;

        const subPlans = Array.isArray(plan.sub_plans) ? [...plan.sub_plans] : [];
        subPlans.push(createEmptySubPlan());

        return syncPlanDatesWithProject(
          { ...plan, sub_plans: subPlans },
          prev.start_date,
          prev.end_date
        );
      }),
    }));
  }

  function removeSubPlan(planIndex, subIndex) {
    setForm((prev) => ({
      ...prev,
      plans: prev.plans.map((plan, currentIndex) => {
        if (currentIndex !== planIndex) return plan;

        const currentSubs =
          Array.isArray(plan.sub_plans) && plan.sub_plans.length
            ? plan.sub_plans
            : [{ ...EMPTY_SUB_PLAN }];
        const subPlans =
          currentSubs.length > 1
            ? currentSubs.filter((_, i) => i !== subIndex)
            : [{ ...EMPTY_SUB_PLAN }];

        return syncPlanDatesWithProject(
          { ...plan, sub_plans: subPlans },
          prev.start_date,
          prev.end_date
        );
      }),
    }));
  }

  function addPlan() {
    setForm((prev) => ({
      ...prev,
      plans: [...prev.plans, createEmptyPlanForUser(null, getNextMainSerialCode(prev.plans))],
    }));
    setActiveTab('plans');
  }

  function updateMaterial(index, field, value) {
    setForm((prev) => ({
      ...prev,
      materials: prev.materials.map((material, currentIndex) => {
        if (currentIndex !== index) return material;

        return syncMaterialWithProject(
          {
            ...material,
            [field]: value,
          },
          prev.start_date,
          prev.end_date,
          prev.plans.length
        );
      }),
    }));
  }

  function addMaterial() {
    setForm((prev) => ({
      ...prev,
      materials: [...prev.materials, createEmptyMaterial()],
    }));
    setActiveTab('materials');
  }

  function removeMaterial(index) {
    setForm((prev) => ({
      ...prev,
      materials: prev.materials.filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  function removePlan(index) {
    setForm((prev) => {
      const nextPlans = prev.plans.filter((_, currentIndex) => currentIndex !== index);
      return {
        ...prev,
        plans: nextPlans.length
          ? nextPlans
          : [{ ...EMPTY_PLAN, serial_code: '1', sub_plans: [{ ...EMPTY_SUB_PLAN }] }],
      };
    });
  }

  async function handleSubmit() {
    const validationError = validateForm(form);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    try {
      const payload = toPayload(form);
      const saved = isEditMode
        ? await actions.updateProject(projectId, payload)
        : await actions.createProject(payload);
      setSuccessCode(saved.code || 'Saved');

      if (isCreateMode) {
        const createdPlanIds = Array.isArray(saved?.plans)
          ? saved.plans.map((plan) => plan?.id).filter(Boolean)
          : [];

        if (saved?.id && createdPlanIds.length) {
          const params = new URLSearchParams({
            setup: 'project-create',
            planQueue: createdPlanIds.join(','),
          });

          setTimeout(() => {
            router.push(
              `${paths.dashboard.projectManagements.taskManagement.assignment(saved.id, createdPlanIds[0])}?${params.toString()}`
            );
          }, 500);
          return;
        }
      }

      setTimeout(() => {
        router.push(paths.dashboard.projectManagements.projects.allProjects);
      }, 900);
    } catch (error) {
      setSubmitError(formatApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isEditMode && projectLoading) {
    return (
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Loading project details...
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (isEditMode && projectError) {
    return <Alert severity="error">Unable to load the selected project.</Alert>;
  }

  return (
    <Box>
      <Card
        sx={{
          mb: 3,
          borderRadius: 4,
          color: 'common.white',
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 52%, ${theme.palette.secondary.main} 100%)`,
          boxShadow: theme.shadows[10],
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="overline" sx={{ color: alpha('#ffffff', 0.72) }}>
                {isCreateMode ? 'Project Creation Workspace' : 'Project Editing Workspace'}
              </Typography>
              <Typography variant="h3" fontWeight={800} sx={{ mt: 0.5 }}>
                {pageTitle}
              </Typography>
              <Typography
                variant="body1"
                sx={{ mt: 1.25, maxWidth: 860, color: alpha('#ffffff', 0.84) }}
              >
                {pageDescription}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
                {isEditMode && project?.code ? (
                  <Chip
                    label={`Project Code: ${project.code}`}
                    sx={{ bgcolor: alpha('#ffffff', 0.14), color: 'common.white' }}
                  />
                ) : null}
                <Chip
                  label={`${form.plans.length} plan step${form.plans.length === 1 ? '' : 's'}`}
                  sx={{ bgcolor: alpha('#ffffff', 0.14), color: 'common.white' }}
                />
                <Chip
                  label={`${completedTabCount}/4 sections ready`}
                  sx={{ bgcolor: alpha('#ffffff', 0.14), color: 'common.white' }}
                />
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  borderRadius: 3,
                  bgcolor: alpha('#ffffff', 0.1),
                  backdropFilter: 'blur(6px)',
                }}
              >
                <CardContent>
                  <Typography variant="overline" sx={{ color: alpha('#ffffff', 0.72) }}>
                    Form Actions
                  </Typography>
                  <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                    <Button
                      component={RouterLink}
                      href={paths.dashboard.projectManagements.projects.allProjects}
                      color="inherit"
                      variant="outlined"
                      sx={{ borderColor: alpha('#ffffff', 0.35), color: 'common.white' }}
                    >
                      Back to Projects
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={isSubmitting || optionsLoading}
                      sx={{
                        bgcolor: 'common.white',
                        color: 'primary.main',
                        '&:hover': { bgcolor: alpha('#ffffff', 0.92) },
                      }}
                    >
                      {isSubmitting
                        ? isEditMode
                          ? 'Updating...'
                          : 'Saving...'
                        : isEditMode
                          ? 'Update Project'
                          : 'Save Project'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {submitError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      ) : null}
      {successCode ? (
        <Alert severity="success" sx={{ mb: 3 }}>
          Project {isEditMode ? 'updated' : 'created'} successfully with code {successCode}.
        </Alert>
      ) : null}

      {optionsLoading ? (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Loading donors and users...
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={3}>
          <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, pb: 2 }}>
              <Box
                sx={{
                  p: 0.75,
                  borderRadius: 2.5,
                  bgcolor: alpha(theme.palette.grey[500], 0.08),
                  border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
                }}
              >
                <Tabs
                  value={activeTab}
                  onChange={(_, value) => setActiveTab(value)}
                  variant="fullWidth"
                  sx={{
                    minHeight: 56,
                    '& .MuiTabs-flexContainer': {
                      gap: 8,
                    },
                    '& .MuiTabs-indicator': {
                      display: 'none',
                    },
                    '& .MuiTab-root': {
                      minHeight: 52,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 700,
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: theme.palette.text.secondary,
                      transition: theme.transitions.create(
                        ['background-color', 'color', 'box-shadow'],
                        {
                          duration: theme.transitions.duration.shorter,
                        }
                      ),
                    },
                    '& .MuiTab-root.Mui-selected': {
                      color: theme.palette.primary.main,
                      bgcolor: 'background.paper',
                      boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
                    },
                  }}
                >
                  <Tab value="basic" label="Basic Information" />
                  <Tab value="ngo" label="NGO Project Details" />
                  <Tab value="materials" label={`Project Materials (${form.materials.length})`} />
                  <Tab value="plans" label={`Project Plans (${form.plans.length})`} />
                </Tabs>
              </Box>
            </Box>

            <Divider />

            <Box sx={{ p: { xs: 2, md: 2.5 } }}>
              <TabPanel activeTab={activeTab} value="basic">
                <Stack spacing={2.5}>
                  <SectionCard
                    eyebrow="Section 1"
                    title="Basic Information"
                    description="Set the core project identity, donor, category, and implementation context."
                  >
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          size="small"
                          label="Project Title"
                          fullWidth
                          value={form.title}
                          onChange={(event) => updateField('title', event.target.value)}
                          InputProps={{ readOnly: isReadOnly }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          size="small"
                          label="Short Name"
                          fullWidth
                          value={form.short_name}
                          onChange={(event) => updateField('short_name', event.target.value)}
                          InputProps={{ readOnly: isReadOnly }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Autocomplete
                          options={donors}
                          value={selectedDonor}
                          onChange={(_, value) => updateField('donor_id', value?.id || null)}
                          getOptionLabel={(option) =>
                            option?.name || option?.organization_name || 'Unknown donor'
                          }
                          renderInput={(params) => (
                            <TextField {...params} size="small" label="Donor" />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Autocomplete
                          multiple
                          options={PROJECT_TYPE_OPTIONS}
                          value={toStringArray(form.project_type)}
                          onChange={(_, value) => updateField('project_type', value)}
                          renderInput={(params) => (
                            <TextField {...params} size="small" label="Project Type" />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Autocomplete
                          multiple
                          options={IMPLEMENTATION_OPTIONS}
                          value={toStringArray(form.implementation_type)}
                          onChange={(_, value) => updateField('implementation_type', value)}
                          renderInput={(params) => (
                            <TextField {...params} size="small" label="Implementation Type" />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                          size="small"
                          select
                          label="Status"
                          fullWidth
                          value={form.status}
                          onChange={(event) => updateField('status', event.target.value)}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                          size="small"
                          label="Sector"
                          fullWidth
                          value={form.sector}
                          onChange={(event) => updateField('sector', event.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                          size="small"
                          label="Location"
                          fullWidth
                          value={form.location}
                          onChange={(event) => updateField('location', event.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <Autocomplete
                          multiple
                          loading={vulnerabilityTypesLoading}
                          options={vulnerabilityTypeOptions}
                          value={toStringArray(form.target_beneficiaries)}
                          onChange={(_, value) => updateField('target_beneficiaries', value)}
                          renderInput={(params) => (
                            <TextField {...params} size="small" label="Target Beneficiaries" />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </SectionCard>

                  <SectionCard
                    eyebrow="Section 1"
                    title="Duration, Budget & Team"
                    description="Define project schedule, financial setup, and accountable team members."
                  >
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                          size="small"
                          label="Start Date"
                          type="date"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          value={form.start_date}
                          onChange={(event) => updateField('start_date', event.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                          size="small"
                          label="End Date"
                          type="date"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          value={form.end_date}
                          onChange={(event) => updateField('end_date', event.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                          size="small"
                          label="Budget Amount"
                          type="number"
                          fullWidth
                          value={form.budget_amount}
                          onChange={(event) => updateField('budget_amount', event.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                          size="small"
                          label="Currency"
                          fullWidth
                          value={form.currency}
                          onChange={(event) =>
                            updateField('currency', event.target.value.toUpperCase())
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Autocomplete
                          options={users}
                          value={selectedManager}
                          onChange={(_, value) =>
                            updateField('project_manager_id', value?.id || null)
                          }
                          getOptionLabel={(option) => option?.username || 'Unknown user'}
                          renderInput={(params) => (
                            <TextField {...params} size="small" label="Project Manager" />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Autocomplete
                          multiple
                          options={users}
                          value={selectedAssignedUsers}
                          onChange={(_, value) =>
                            updateField(
                              'assigned_user_ids',
                              value.map((item) => item.id)
                            )
                          }
                          getOptionLabel={(option) => option?.username || 'Unknown user'}
                          renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                              <Chip
                                {...getTagProps({ index })}
                                key={option.id}
                                label={option.username}
                                size="small"
                              />
                            ))
                          }
                          renderInput={(params) => (
                            <TextField {...params} size="small" label="Assign Multiple Users" />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </SectionCard>
                </Stack>
              </TabPanel>

              <TabPanel activeTab={activeTab} value="ngo">
                <SectionCard
                  eyebrow="Section 2"
                  title="NGO Project Details"
                  description="Document the strategic context, delivery expectations, reporting cadence, and risk profile."
                >
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        size="small"
                        select
                        label="Reporting Frequency"
                        fullWidth
                        value={form.reporting_frequency}
                        onChange={(event) => updateField('reporting_frequency', event.target.value)}
                      >
                        {REPORTING_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        size="small"
                        select
                        label="Risk Level"
                        fullWidth
                        value={form.risk_level}
                        onChange={(event) => updateField('risk_level', event.target.value)}
                      >
                        {RISK_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <MultilineField
                        label="Project Background"
                        value={form.background}
                        onChange={(event) => updateField('background', event.target.value)}
                        minRows={4}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <MultilineField
                        label="Objectives"
                        value={form.objectives}
                        onChange={(event) => updateField('objectives', event.target.value)}
                        minRows={4}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <MultilineField
                        label="Expected Outcomes"
                        value={form.expected_outcomes}
                        onChange={(event) => updateField('expected_outcomes', event.target.value)}
                        minRows={4}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <MultilineField
                        label="Monitoring Plan"
                        value={form.monitoring_plan}
                        onChange={(event) => updateField('monitoring_plan', event.target.value)}
                        minRows={4}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <MultilineField
                        label="Other Project Related Information / Notes"
                        value={form.notes}
                        onChange={(event) => updateField('notes', event.target.value)}
                        minRows={3}
                      />
                    </Grid>
                  </Grid>
                </SectionCard>
              </TabPanel>

              <TabPanel activeTab={activeTab} value="materials">
                <Stack spacing={2.5}>
                  <Alert severity="info">
                    Add expense-ready material lines here. These are saved inside project management
                    and automatically create or refresh a linked draft expense while that expense
                    remains in Draft.
                  </Alert>

                  <SectionCard
                    eyebrow="Section 3"
                    title="Project Materials"
                    description="Plan the materials your project needs with quantity, estimated cost, timing, supplier hints, and roadmap-step linkage."
                    action={
                      <Button
                        startIcon={<Iconify icon="solar:add-circle-linear" width={18} />}
                        variant="outlined"
                        onClick={addMaterial}
                        sx={{
                          px: 1.75,
                          py: 0.75,
                          borderRadius: 2,
                          minWidth: 'auto',
                          color: theme.palette.primary.main,
                          borderColor: alpha(theme.palette.primary.main, 0.28),
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                          boxShadow: 'none',
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            boxShadow: 'none',
                          },
                        }}
                      >
                        Add Material
                      </Button>
                    }
                  >
                    <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                        <Card
                          variant="outlined"
                          sx={{
                            borderRadius: 2.5,
                            bgcolor: alpha(theme.palette.primary.main, 0.04),
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Typography variant="overline" color="primary.main">
                              Material Lines
                            </Typography>
                            <Typography variant="h6" fontWeight={800}>
                              {form.materials.length}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                        <Card
                          variant="outlined"
                          sx={{
                            borderRadius: 2.5,
                            bgcolor: alpha(theme.palette.success.main, 0.04),
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Typography variant="overline" color="success.main">
                              Estimated Total
                            </Typography>
                            <Typography variant="h6" fontWeight={800}>
                              {form.currency}{' '}
                              {materialEstimatedTotal.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                        <Card
                          variant="outlined"
                          sx={{
                            borderRadius: 2.5,
                            bgcolor: alpha(theme.palette.warning.main, 0.06),
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Typography variant="overline" color="warning.main">
                              Linked to Steps
                            </Typography>
                            <Typography variant="h6" fontWeight={800}>
                              {materialLinkedPlanCount}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                        <Card
                          variant="outlined"
                          sx={{ borderRadius: 2.5, bgcolor: alpha(theme.palette.info.main, 0.05) }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Typography variant="overline" color="info.main">
                              Expense Link
                            </Typography>
                            <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 0.5 }}>
                              {form.materials_expense_invoice_number ||
                                'Will create a draft on save'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    <Stack spacing={1.5}>
                      {!form.materials.length ? (
                        <Card variant="outlined" sx={{ borderRadius: 2.5, borderStyle: 'dashed' }}>
                          <CardContent>
                            <Typography variant="body2" color="text.secondary">
                              No materials added yet. Use this tab for budgetable project supplies
                              so expense management gets a ready-to-use draft.
                            </Typography>
                          </CardContent>
                        </Card>
                      ) : null}

                      {form.materials.map((material, index) => {
                        const lineSubtotal = calculateMaterialEstimatedTotal(
                          material.quantity,
                          material.estimated_unit_cost
                        );
                        const lineTaxAmount = calculateMaterialTaxAmount(
                          lineSubtotal,
                          material.tax_rate
                        );
                        const lineTotal = lineSubtotal + lineTaxAmount;

                        return (
                          <Card
                            key={`material-${index + 1}`}
                            variant="outlined"
                            sx={{
                              borderRadius: 2.5,
                              borderColor: alpha(theme.palette.primary.main, 0.18),
                            }}
                          >
                            <CardContent sx={{ p: { xs: 1.75, md: 2 } }}>
                              <Stack
                                direction={{ xs: 'column', md: 'row' }}
                                justifyContent="space-between"
                                spacing={1.5}
                                sx={{ mb: 2 }}
                              >
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                  flexWrap="wrap"
                                >
                                  <Chip label={`ML ${index + 1}`} color="primary" size="small" />
                                  <Typography variant="subtitle2" fontWeight={800}>
                                    Material Line {index + 1}
                                  </Typography>
                                  <Chip
                                    label={formatCurrencyAmount(form.currency, lineTotal)}
                                    size="small"
                                    variant="outlined"
                                  />
                                </Stack>
                                <IconButton color="error" onClick={() => removeMaterial(index)}>
                                  <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                                </IconButton>
                              </Stack>

                              <Grid container spacing={1.75}>
                                <Grid size={{ xs: 12, lg: 7 }}>
                                  <Box
                                    sx={{
                                      p: 1.75,
                                      height: '100%',
                                      borderRadius: 2.5,
                                      border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
                                      bgcolor: alpha(theme.palette.background.default, 0.72),
                                    }}
                                  >
                                    <Stack spacing={1.5}>
                                      <Box>
                                        <Typography variant="overline" color="primary.main">
                                          Material Details
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          Keep the identity, sourcing, date, and roadmap mapping
                                          together.
                                        </Typography>
                                      </Box>

                                      <Grid container spacing={1.5}>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                          <TextField
                                            size="small"
                                            label="Material Name"
                                            fullWidth
                                            value={material.title}
                                            onChange={(event) =>
                                              updateMaterial(index, 'title', event.target.value)
                                            }
                                          />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                          <TextField
                                            size="small"
                                            select
                                            label="Category"
                                            fullWidth
                                            value={material.category}
                                            onChange={(event) =>
                                              updateMaterial(index, 'category', event.target.value)
                                            }
                                          >
                                            <MenuItem value="">Select</MenuItem>
                                            {MATERIAL_CATEGORY_OPTIONS.map((option) => (
                                              <MenuItem key={option} value={option}>
                                                {option}
                                              </MenuItem>
                                            ))}
                                          </TextField>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                          <TextField
                                            size="small"
                                            label="Required By"
                                            type="date"
                                            fullWidth
                                            InputLabelProps={{ shrink: true }}
                                            value={material.required_by}
                                            onChange={(event) =>
                                              updateMaterial(
                                                index,
                                                'required_by',
                                                event.target.value
                                              )
                                            }
                                            inputProps={{
                                              min: form.start_date || undefined,
                                              max: form.end_date || undefined,
                                            }}
                                            helperText={
                                              form.start_date && form.end_date
                                                ? `Within project: ${form.start_date} to ${form.end_date}`
                                                : 'Select project dates first'
                                            }
                                          />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                          <TextField
                                            size="small"
                                            label="Preferred Vendor / Source"
                                            fullWidth
                                            value={material.preferred_vendor}
                                            onChange={(event) =>
                                              updateMaterial(
                                                index,
                                                'preferred_vendor',
                                                event.target.value
                                              )
                                            }
                                          />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                          <TextField
                                            size="small"
                                            select
                                            label="Linked Roadmap Step"
                                            fullWidth
                                            value={material.plan_serial_no}
                                            onChange={(event) =>
                                              updateMaterial(
                                                index,
                                                'plan_serial_no',
                                                event.target.value
                                              )
                                            }
                                          >
                                            <MenuItem value="">No linked step</MenuItem>
                                            {planStepOptions.map((option) => (
                                              <MenuItem
                                                key={option.serialNo}
                                                value={String(option.serialNo)}
                                              >
                                                {option.label}
                                              </MenuItem>
                                            ))}
                                          </TextField>
                                        </Grid>
                                      </Grid>
                                    </Stack>
                                  </Box>
                                </Grid>

                                <Grid size={{ xs: 12, lg: 5 }}>
                                  <Box
                                    sx={{
                                      p: 1.75,
                                      height: '100%',
                                      borderRadius: 2.5,
                                      border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
                                      bgcolor: alpha(theme.palette.grey[500], 0.03),
                                    }}
                                  >
                                    <Stack spacing={1.5}>
                                      <Box>
                                        <Typography variant="overline" color="text.secondary">
                                          Notes & Specs
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          Capture what to buy and any internal context in one place.
                                        </Typography>
                                      </Box>

                                      <MultilineField
                                        label="Specification / Description"
                                        value={material.description}
                                        onChange={(event) =>
                                          updateMaterial(index, 'description', event.target.value)
                                        }
                                        minRows={3}
                                      />
                                      <MultilineField
                                        label="Internal Notes"
                                        value={material.notes}
                                        onChange={(event) =>
                                          updateMaterial(index, 'notes', event.target.value)
                                        }
                                        minRows={3}
                                      />
                                    </Stack>
                                  </Box>
                                </Grid>
                              </Grid>

                              <Divider sx={{ my: 2 }} />

                              <Box sx={{ width: '100%' }}>
                                <Stack spacing={1.5}>
                                  <Box
                                    sx={{
                                      border: `1px solid ${alpha(theme.palette.grey[500], 0.18)}`,
                                      borderRadius: 3,
                                      overflow: 'hidden',
                                      bgcolor: 'background.paper',
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: { xs: 'none', md: 'grid' },
                                        gridTemplateColumns:
                                          'minmax(220px, 1.6fr) 88px 120px 120px 140px',
                                        gap: 2,
                                        px: 2,
                                        py: 1.5,
                                        bgcolor: alpha(theme.palette.grey[500], 0.08),
                                        borderBottom: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                                      }}
                                    >
                                      <Typography
                                        variant="subtitle2"
                                        fontWeight={700}
                                        color="text.secondary"
                                      >
                                        Cost Setup
                                      </Typography>
                                      <Typography
                                        variant="subtitle2"
                                        fontWeight={700}
                                        color="text.secondary"
                                      >
                                        Qty
                                      </Typography>
                                      <Typography
                                        variant="subtitle2"
                                        fontWeight={700}
                                        color="text.secondary"
                                      >
                                        Unit
                                      </Typography>
                                      <Typography
                                        variant="subtitle2"
                                        fontWeight={700}
                                        color="text.secondary"
                                      >
                                        Unit Price
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        fontWeight={800}
                                        color="text.secondary"
                                        textAlign="right"
                                      >
                                        Amount
                                      </Typography>
                                    </Box>

                                    <Box
                                      sx={{
                                        display: 'grid',
                                        gridTemplateColumns: {
                                          xs: '1fr 1fr',
                                          md: 'minmax(220px, 1.6fr) 88px 120px 120px 140px',
                                        },
                                        gap: { xs: 1.5, md: 2 },
                                        alignItems: 'center',
                                        px: 2,
                                        py: 1.6,
                                      }}
                                    >
                                      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                                        <Typography variant="body2" fontWeight={700} noWrap>
                                          {material.title || `Material line ${index + 1}`}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap>
                                          {material.category ||
                                            'Set unit, quantity, and unit price to calculate this line.'}
                                        </Typography>
                                      </Box>
                                      <TextField
                                        fullWidth
                                        variant="standard"
                                        type="number"
                                        value={material.quantity}
                                        onChange={(event) =>
                                          updateMaterial(index, 'quantity', event.target.value)
                                        }
                                        inputProps={{ min: 0, step: '0.01' }}
                                      />
                                      <TextField
                                        fullWidth
                                        variant="standard"
                                        select
                                        value={material.unit}
                                        onChange={(event) =>
                                          updateMaterial(index, 'unit', event.target.value)
                                        }
                                      >
                                        {MATERIAL_UNIT_OPTIONS.map((option) => (
                                          <MenuItem key={option} value={option}>
                                            {option}
                                          </MenuItem>
                                        ))}
                                      </TextField>
                                      <TextField
                                        fullWidth
                                        variant="standard"
                                        type="number"
                                        value={material.estimated_unit_cost}
                                        onChange={(event) =>
                                          updateMaterial(
                                            index,
                                            'estimated_unit_cost',
                                            event.target.value
                                          )
                                        }
                                        inputProps={{ min: 0, step: '0.01' }}
                                      />
                                      <TextField
                                        fullWidth
                                        variant="standard"
                                        value={material.title || `Material line ${index + 1}`}
                                        InputProps={{ readOnly: true }}
                                        sx={{ display: { xs: 'block', md: 'none' } }}
                                      />
                                      <Typography
                                        variant="subtitle2"
                                        fontWeight={700}
                                        textAlign={{ xs: 'left', md: 'right' }}
                                        sx={{ whiteSpace: 'nowrap' }}
                                      >
                                        {formatCurrencyAmount(form.currency, lineSubtotal)}
                                      </Typography>
                                    </Box>
                                  </Box>

                                  <Stack
                                    direction="row"
                                    justifyContent="flex-end"
                                    alignItems="center"
                                    spacing={1.25}
                                    sx={{ ml: 'auto', width: 'fit-content' }}
                                  >
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{ whiteSpace: 'nowrap' }}
                                    >
                                      Tax rate %
                                    </Typography>
                                    <TextField
                                      size="small"
                                      type="number"
                                      value={material.tax_rate || '0'}
                                      onChange={(event) =>
                                        updateMaterial(index, 'tax_rate', event.target.value)
                                      }
                                      inputProps={{ min: 0, step: '0.01' }}
                                      sx={{ width: 110, '& .MuiInputBase-root': { width: 110 } }}
                                    />
                                  </Stack>

                                  <Box
                                    sx={{
                                      ml: { xs: 0, md: 'auto' },
                                      width: { xs: '100%', md: 320 },
                                      borderRadius: 3,
                                      bgcolor: alpha(theme.palette.grey[500], 0.06),
                                      px: 2.25,
                                      py: 1.75,
                                    }}
                                  >
                                    <Stack spacing={1.1}>
                                      <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        spacing={2}
                                      >
                                        <Typography variant="body2" color="text.secondary">
                                          Subtotal
                                        </Typography>
                                        <Typography variant="body2" fontWeight={700}>
                                          {formatCurrencyAmount(form.currency, lineSubtotal)}
                                        </Typography>
                                      </Stack>
                                      <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        spacing={2}
                                      >
                                        <Typography variant="body2" color="text.secondary">
                                          Tax ({Number(material.tax_rate || 0)}%)
                                        </Typography>
                                        <Typography variant="body2" fontWeight={700}>
                                          {formatCurrencyAmount(form.currency, lineTaxAmount)}
                                        </Typography>
                                      </Stack>
                                      <Divider />
                                      <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        spacing={2}
                                      >
                                        <Typography variant="subtitle1" fontWeight={800}>
                                          Total
                                        </Typography>
                                        <Typography variant="subtitle1" fontWeight={800}>
                                          {formatCurrencyAmount(form.currency, lineTotal)}
                                        </Typography>
                                      </Stack>
                                    </Stack>
                                  </Box>
                                </Stack>
                              </Box>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </Stack>
                  </SectionCard>
                </Stack>
              </TabPanel>

              <TabPanel activeTab={activeTab} value="plans">
                <Stack spacing={2.5}>
                  <SectionCard
                    eyebrow="Section 4"
                    title="Project Plans"
                    description="Define main plans with nested sub plans, dates, and assigned users."
                  >
                    <Stack spacing={2}>
                      {form.plans.map((plan, index) => {
                        const cardColor = getPlanCardColor(index);
                        const mainSerial = getMainSerialCode(plan, index);
                        const subPlans =
                          Array.isArray(plan.sub_plans) && plan.sub_plans.length
                            ? plan.sub_plans
                            : [{ ...EMPTY_SUB_PLAN }];

                        return (
                          <Card
                            key={`plan-card-${index}`}
                            variant="outlined"
                            sx={{
                              borderRadius: '16px',
                              borderColor: cardColor.border,
                              bgcolor: cardColor.bg,
                              overflow: 'hidden',
                            }}
                          >
                            <CardContent
                              sx={{
                                p: { xs: 1.75, md: 2.25 },
                                '&:last-child': { pb: { xs: 1.75, md: 2.25 } },
                              }}
                            >
                              <Box
                                sx={{
                                  mb: 2,
                                  width: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <Box sx={{ flex: '0 0 10%', maxWidth: '10%' }}>
                                  <TextField
                                    size="small"
                                    label="SL"
                                    fullWidth
                                    value={plan.serial_code ?? mainSerial}
                                    onChange={(event) =>
                                      updatePlan(index, 'serial_code', event.target.value)
                                    }
                                    sx={{
                                      '& .MuiOutlinedInput-root': {
                                        bgcolor: 'background.paper',
                                        borderRadius: '8px',
                                      },
                                      '& .MuiInputBase-input': {
                                        fontWeight: 800,
                                        textAlign: 'center',
                                      },
                                    }}
                                  />
                                </Box>
                                <Box sx={{ flex: '1 1 80%', minWidth: 0 }}>
                                  <TextField
                                    size="small"
                                    label="Main Activities"
                                    fullWidth
                                    value={plan.title}
                                    onChange={(event) =>
                                      updatePlan(index, 'title', event.target.value)
                                    }
                                    sx={{
                                      '& .MuiOutlinedInput-root': {
                                        bgcolor: 'background.paper',
                                        borderRadius: '8px',
                                      },
                                    }}
                                  />
                                </Box>
                                <Box
                                  sx={{
                                    flex: '0 0 10%',
                                    maxWidth: '10%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                  }}
                                >
                                  {form.plans.length > 1 ? (
                                    <IconButton
                                      size="small"
                                      onClick={() => removePlan(index)}
                                      sx={{ color: cardColor.accent }}
                                    >
                                      <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                                    </IconButton>
                                  ) : null}
                                </Box>
                              </Box>

                              <Stack spacing={1.25}>
                                {subPlans.map((subPlan, subIndex) => {
                                  const subSerial = getSubSerialCode(mainSerial, subIndex);
                                  const selectedSubUsers = selectedAssignedUsers.filter((user) =>
                                    (subPlan.assigned_user_ids || []).includes(user.id)
                                  );

                                  return (
                                    <Box
                                      key={`sub-${index}-${subIndex}`}
                                      sx={{
                                        border: `1px solid ${cardColor.border}`,
                                        borderRadius: '12px',
                                        bgcolor: 'background.paper',
                                        p: 1.25,
                                      }}
                                    >
                                      <Stack
                                        direction="row"
                                        spacing={1}
                                        alignItems="center"
                                        sx={{ mb: 1.25 }}
                                      >
                                        <Chip
                                          label={subSerial}
                                          size="small"
                                          variant="outlined"
                                          sx={{
                                            fontWeight: 700,
                                            borderColor: cardColor.border,
                                            color: cardColor.accent,
                                          }}
                                        />
                                        <TextField
                                          size="small"
                                          label="Sub Activities"
                                          fullWidth
                                          value={subPlan.title}
                                          onChange={(event) =>
                                            updateSubPlan(
                                              index,
                                              subIndex,
                                              'title',
                                              event.target.value
                                            )
                                          }
                                        />
                                        {subPlans.length > 1 ? (
                                          <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => removeSubPlan(index, subIndex)}
                                          >
                                            <Iconify
                                              icon="solar:trash-bin-trash-bold"
                                              width={16}
                                            />
                                          </IconButton>
                                        ) : null}
                                      </Stack>

                                      <Grid
                                        container
                                        spacing={1}
                                        sx={{
                                          '& .MuiInputBase-root': { fontSize: 12 },
                                          '& .MuiInputBase-input': { py: 0.75, fontSize: 12 },
                                          '& .MuiInputLabel-root': { fontSize: 12 },
                                          '& .MuiChip-root': { height: 20, fontSize: 11 },
                                        }}
                                      >
                                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                          <TextField
                                            size="small"
                                            label="Start Date"
                                            type="date"
                                            fullWidth
                                            InputLabelProps={{ shrink: true }}
                                            value={subPlan.start_date}
                                            onChange={(event) =>
                                              updateSubPlan(
                                                index,
                                                subIndex,
                                                'start_date',
                                                event.target.value
                                              )
                                            }
                                            inputProps={{
                                              min: form.start_date || undefined,
                                              max: form.end_date || undefined,
                                            }}
                                          />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                          <TextField
                                            size="small"
                                            label="End Date"
                                            type="date"
                                            fullWidth
                                            InputLabelProps={{ shrink: true }}
                                            value={subPlan.end_date}
                                            onChange={(event) =>
                                              updateSubPlan(
                                                index,
                                                subIndex,
                                                'end_date',
                                                event.target.value
                                              )
                                            }
                                            inputProps={{
                                              min:
                                                subPlan.start_date ||
                                                form.start_date ||
                                                undefined,
                                              max: form.end_date || undefined,
                                            }}
                                          />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                          <Autocomplete
                                            multiple
                                            size="small"
                                            options={selectedAssignedUsers}
                                            value={selectedSubUsers}
                                            onChange={(_, value) =>
                                              updateSubPlan(
                                                index,
                                                subIndex,
                                                'assigned_user_ids',
                                                value.map((item) => item.id)
                                              )
                                            }
                                            getOptionLabel={(option) =>
                                              option?.username || 'Unknown user'
                                            }
                                            renderTags={(value, getTagProps) =>
                                              value.map((option, tagIndex) => (
                                                <Chip
                                                  {...getTagProps({ index: tagIndex })}
                                                  key={option.id}
                                                  label={option.username}
                                                  size="small"
                                                />
                                              ))
                                            }
                                            renderInput={(params) => (
                                              <TextField
                                                {...params}
                                                size="small"
                                                label="Assign Users"
                                                fullWidth
                                              />
                                            )}
                                          />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                          <TextField
                                            size="small"
                                            select
                                            label="Unit Type"
                                            fullWidth
                                            value={subPlan.unit_type || ''}
                                            onChange={(event) =>
                                              updateSubPlan(
                                                index,
                                                subIndex,
                                                'unit_type',
                                                event.target.value
                                              )
                                            }
                                            disabled={projectUnitsLoading}
                                            helperText={
                                              !projectUnitsLoading && !projectUnitOptions.length
                                                ? 'Add units from Projects → Project Unit'
                                                : undefined
                                            }
                                          >
                                            <MenuItem value="">Select</MenuItem>
                                            {projectUnitOptions.map((option) => (
                                              <MenuItem key={option} value={option}>
                                                {option}
                                              </MenuItem>
                                            ))}
                                            {subPlan.unit_type &&
                                            !projectUnitOptions.includes(subPlan.unit_type) ? (
                                              <MenuItem value={subPlan.unit_type}>
                                                {subPlan.unit_type}
                                              </MenuItem>
                                            ) : null}
                                          </TextField>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                          <TextField
                                            size="small"
                                            label="Unit No"
                                            type="number"
                                            fullWidth
                                            placeholder="Unit No"
                                            value={subPlan.unit_no}
                                            onChange={(event) =>
                                              updateSubPlan(
                                                index,
                                                subIndex,
                                                'unit_no',
                                                event.target.value
                                              )
                                            }
                                            inputProps={{ min: 0, step: 'any' }}
                                          />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                          <TextField
                                            size="small"
                                            label="Unit Cost"
                                            type="number"
                                            fullWidth
                                            value={subPlan.unit_cost}
                                            onChange={(event) =>
                                              updateSubPlan(
                                                index,
                                                subIndex,
                                                'unit_cost',
                                                event.target.value
                                              )
                                            }
                                            inputProps={{ min: 0, step: 'any' }}
                                          />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                          <TextField
                                            size="small"
                                            label="Cost"
                                            type="number"
                                            fullWidth
                                            value={calculateSubPlanCost(
                                              subPlan.unit_no,
                                              subPlan.unit_cost
                                            )}
                                            InputProps={{ readOnly: true }}
                                            helperText="Unit No × Unit Cost"
                                          />
                                        </Grid>
                                      </Grid>
                                    </Box>
                                  );
                                })}

                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={
                                      <Iconify icon="solar:add-circle-linear" width={16} />
                                    }
                                    onClick={() => addSubPlan(index)}
                                    sx={{
                                      mt: 0.25,
                                      color: cardColor.button,
                                      borderColor: alpha(cardColor.button, 0.45),
                                      bgcolor: alpha(cardColor.button, 0.06),
                                      '&:hover': {
                                        borderColor: cardColor.button,
                                        bgcolor: alpha(cardColor.button, 0.12),
                                      },
                                    }}
                                  >
                                    Add Sub Plan
                                  </Button>
                                </Box>
                              </Stack>
                            </CardContent>
                          </Card>
                        );
                      })}

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          variant="contained"
                          startIcon={<Iconify icon="solar:add-circle-bold" width={18} />}
                          onClick={addPlan}
                          sx={{
                            bgcolor: '#2563eb',
                            color: '#fff',
                            boxShadow: 'none',
                            '&:hover': {
                              bgcolor: '#1d4ed8',
                              boxShadow: 'none',
                            },
                          }}
                        >
                          Add Plan
                        </Button>
                      </Box>
                    </Stack>
                  </SectionCard>
                </Stack>
              </TabPanel>
            </Box>
          </Card>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            spacing={1.5}
          >
            <Typography variant="body2" color="text.secondary">
              Use the tabs to complete the project profile step by step. All changes are submitted
              together.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                component={RouterLink}
                href={paths.dashboard.projectManagements.projects.allProjects}
                color="inherit"
                variant="outlined"
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? isEditMode
                    ? 'Updating Project...'
                    : 'Saving Project...'
                  : isEditMode
                    ? 'Update Project'
                    : 'Create Project'}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      )}
    </Box>
  );
}
