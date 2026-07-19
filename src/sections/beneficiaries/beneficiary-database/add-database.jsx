'use client';

import dayjs from 'dayjs';
import { mutate } from 'swr';
import { toast } from 'sonner';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller, FormProvider, useWatch } from 'react-hook-form';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Box,
  Grid,
  Step,
  Paper,
  Stack,
  Button,
  Stepper,
  StepLabel,
  TextField,
  Typography,
  Autocomplete,
  FormControlLabel,
  Radio,
  RadioGroup,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useGetRequest, usePutRequest, useCreateRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

import {
  PROFILE_STEPS,
  GENDER_OPTIONS,
  EDUCATION_OPTIONS,
  SANITATION_OPTIONS,
  LOSS_DAMAGE_OPTIONS,
  HOUSEHOLD_TYPE_OPTIONS,
  COASTAL_RISK_OPTIONS,
  MAIN_INCOME_OPTIONS,
  LAND_OWNERSHIP_OPTIONS,
  HOUSING_CONDITION_OPTIONS,
  DISABILITY_TYPE_OPTIONS,
  VULNERABILITY_CATEGORY_OPTIONS,
  DRINKING_WATER_OPTIONS,
  HEALTH_PROBLEM_OPTIONS,
  HEALTH_ACCESS_OPTIONS,
  COPING_STRATEGY_OPTIONS,
  GROUP_MEMBERSHIP_OPTIONS,
  IRRIGATION_SOURCE_OPTIONS,
  DEFAULT_BENEFICIARY_FORM,
} from './beneficiary-profile-options';

const getLabel = (option) => {
  if (typeof option === 'string') return option;
  if (!option || Array.isArray(option)) return '';
  return option.label || option.name || option.organization_name || option.household_code || option.value || '';
};

const toOptions = (list) => list.map((value) => ({ value, label: value }));

function MultiSelectField({ name, control, label, options, freeSolo = false }) {
  const optionObjs = toOptions(options);
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const selectedValues = Array.isArray(field.value) ? field.value : [];
        const selectedOptions = selectedValues.map((v) => {
          if (typeof v === 'object') return v;
          return optionObjs.find((o) => o.value === v) || { value: v, label: v };
        });
        return (
          <Autocomplete
            multiple
            freeSolo={freeSolo}
            options={optionObjs}
            getOptionLabel={getLabel}
            value={selectedOptions}
            isOptionEqualToValue={(a, b) => (a.value || a) === (b.value || b)}
            onChange={(_, value) => {
              field.onChange(
                value.map((item) => (typeof item === 'string' ? item : item.value || item.label))
              );
            }}
            renderInput={(params) => <TextField {...params} fullWidth label={label} />}
          />
        );
      }}
    />
  );
}

function SingleSelectField({ name, control, label, options }) {
  const optionObjs = toOptions(options);
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Autocomplete
          options={optionObjs}
          getOptionLabel={getLabel}
          value={optionObjs.find((o) => o.value === field.value) || null}
          isOptionEqualToValue={(a, b) => a.value === b?.value}
          onChange={(_, value) => field.onChange(value?.value || null)}
          renderInput={(params) => <TextField {...params} fullWidth label={label} />}
        />
      )}
    />
  );
}

function TextCtrl({ name, control, label, type = 'text', ...rest }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField {...field} fullWidth label={label} type={type} value={field.value ?? ''} {...rest} />
      )}
    />
  );
}

function DateCtrl({ name, control, label }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <DatePicker
          {...field}
          label={label}
          format="DD/MM/YYYY"
          slotProps={{ textField: { fullWidth: true } }}
        />
      )}
    />
  );
}

export default function AddDatabaseForm() {
  const router = useRouter();
  const beneficiaryId = useSearchParams().get('editId');
  const isEditMode = !!beneficiaryId;
  const [activeStep, setActiveStep] = useState(0);

  const {
    data: defaultBeneficiaryData,
    loading: defaultBeneficiaryLoading,
  } = useGetRequest(
    beneficiaryId ? endpoints.beneficiaries.beneficiary_by_id(beneficiaryId) : null
  );

  const { data: projectsData, loading: projectsLoading } = useGetRequest(
    `${endpoints.projects.projects}`
  );

  // Fetch vulnerability types for dropdown
  const { data: vulnerabilityTypesData, loading: vulnerabilityTypesLoading } = useGetRequest(
    endpoints.beneficiaries.vulnerability_types
  );
  const { data: donorsData, loading: donorsLoading } = useGetRequest(
    endpoints.beneficiaries.donors
  );

  const methods = useForm({ defaultValues: DEFAULT_BENEFICIARY_FORM });
  const { control, handleSubmit, reset, setValue, formState: { isSubmitting } } = methods;

  const dateOfBirth = useWatch({ control, name: 'date_of_birth' });
  const selectedProjects = useWatch({ control, name: 'projects' });
  const healthProblems = useWatch({ control, name: 'common_health_problems' });
  const personWithDisability = useWatch({ control, name: 'person_with_disability' });

  const projectOptions = Array.isArray(projectsData)
    ? projectsData
    : Array.isArray(projectsData?.results)
      ? projectsData.results
      : [];
  const donorOptions = Array.isArray(donorsData)
    ? donorsData
    : Array.isArray(donorsData?.results)
      ? donorsData.results
      : [];

  const calcAgeFromDob = (dob) => {
    if (!dob || !dayjs(dob).isValid()) return '';
    const birth = dayjs(dob).startOf('day');
    const today = dayjs().startOf('day');
    let age = today.diff(birth, 'year');
    if (age < 0) age = 0;
    return age;
  };

  // Real-time age from DOB
  useEffect(() => {
    setValue('age', calcAgeFromDob(dateOfBirth), { shouldDirty: true });
  }, [dateOfBirth, setValue]);

  // Auto-fill donors from selected projects (uses donor_id from project API)
  useEffect(() => {
    if (!Array.isArray(selectedProjects) || selectedProjects.length === 0) return;
    if (!projectOptions.length) return;

    const donorIdsFromProjects = selectedProjects
      .map((projectId) => {
        const project = projectOptions.find((p) => p.id === projectId);
        if (!project) return null;
        // ProjectSerializer returns donor as name string and donor_id as FK pk
        return project.donor_id?.id || project.donor_id || null;
      })
      .filter(Boolean);

    if (donorIdsFromProjects.length === 0) return;

    const uniqueDonorIds = [...new Set(donorIdsFromProjects)];
    setValue('donors', uniqueDonorIds, { shouldDirty: true });
  }, [selectedProjects, projectOptions, setValue]);

  useEffect(() => {
    if (!defaultBeneficiaryData || !isEditMode) return;
    const d = defaultBeneficiaryData;
    const dob = d.date_of_birth ? dayjs(d.date_of_birth) : null;
    reset({
      ...DEFAULT_BENEFICIARY_FORM,
      household_id: d.household_id || d.household_code || '',
      projects: Array.isArray(d.projects) ? d.projects : d.project ? [d.project] : [],
      donors: Array.isArray(d.donors) ? d.donors : d.donor ? [d.donor] : [],
      enrollment_date: d.enrollment_date ? dayjs(d.enrollment_date) : null,
      name: d.name || '',
      mother_name: d.mother_name || '',
      father_name: d.father_name || '',
      husband_name: d.husband_name || '',
      sex: d.sex || null,
      date_of_birth: dob,
      age: calcAgeFromDob(dob) || d.age || '',
      nid: d.nid || '',
      contact: d.contact || '',
      household_type: d.household_type || null,
      household_head_name: d.household_head_name || '',
      relationship_with_hh_head: d.relationship_with_hh_head || '',
      household_size: d.household_size ?? '',
      hh_members_total: d.hh_members_total ?? '',
      hh_members_male: d.hh_members_male ?? '',
      hh_members_female: d.hh_members_female ?? '',
      hh_members_transgender: d.hh_members_transgender ?? '',
      hh_members_children: d.hh_members_children ?? '',
      hh_members_elderly: d.hh_members_elderly ?? '',
      hh_members_pwd: d.hh_members_pwd ?? '',
      district: d.district || '',
      upazila: d.upazila || '',
      union: d.union || '',
      village: d.village || '',
      gps_latitude: d.gps_latitude ?? '',
      gps_longitude: d.gps_longitude ?? '',
      coastal_risk_zones: d.coastal_risk_zones || [],
      main_income_sources: d.main_income_sources || [],
      secondary_occupation: d.secondary_occupation || '',
      monthly_income: d.monthly_income ?? '',
      land_ownership_status: d.land_ownership_status || null,
      housing_condition: d.housing_condition || null,
      education_level: d.education_level || null,
      person_with_disability: d.person_with_disability,
      disability_types: d.disability_types || [],
      vulnerability_categories: d.vulnerability_categories || [],
      drinking_water_sources: d.drinking_water_sources || [],
      drinking_water_distance_km: d.drinking_water_distance_km ?? '',
      sanitation_facility: d.sanitation_facility || null,
      common_health_problems: d.common_health_problems || [],
      common_health_problems_other: d.common_health_problems_other || '',
      access_to_health_services: d.access_to_health_services || [],
      loss_and_damage: d.loss_and_damage || [],
      coping_strategies: d.coping_strategies || [],
      group_memberships: d.group_memberships || [],
      group_joining_date: d.group_joining_date ? dayjs(d.group_joining_date) : null,
      agri_land_owned_decimal: d.agri_land_owned_decimal ?? '',
      currently_practiced_adaptive_agriculture:
        typeof d.currently_practiced_adaptive_agriculture === 'string'
          ? d.currently_practiced_adaptive_agriculture
          : Array.isArray(d.currently_practiced_adaptive_agriculture)
            ? d.currently_practiced_adaptive_agriculture.join(', ')
            : '',
      total_cultivated_land_last_season: d.total_cultivated_land_last_season ?? '',
      land_under_climate_adaptive_agriculture: d.land_under_climate_adaptive_agriculture ?? '',
      irrigation_sources: d.irrigation_sources || [],
      total_agricultural_income_last_year: d.total_agricultural_income_last_year ?? '',
      adaptive_agricultural_practices:
        typeof d.adaptive_agricultural_practices === 'string'
          ? d.adaptive_agricultural_practices
          : Array.isArray(d.adaptive_agricultural_practices)
            ? d.adaptive_agricultural_practices.join(', ')
            : '',
      climate_resilient_crop_varieties:
        typeof d.climate_resilient_crop_varieties === 'string'
          ? d.climate_resilient_crop_varieties
          : Array.isArray(d.climate_resilient_crop_varieties)
            ? d.climate_resilient_crop_varieties.join(', ')
            : '',
    });
  }, [defaultBeneficiaryData, isEditMode, reset]);

  const postBeneficiary = useCreateRequest;
  const putBeneficiary = usePutRequest;

  const toNum = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

  const onSubmit = async (data) => {
    try {
      const formattedData = {
        ...data,
        enrollment_date: data.enrollment_date
          ? dayjs(data.enrollment_date).format('YYYY-MM-DD')
          : null,
        date_of_birth: data.date_of_birth ? dayjs(data.date_of_birth).format('YYYY-MM-DD') : null,
        group_joining_date: data.group_joining_date
          ? dayjs(data.group_joining_date).format('YYYY-MM-DD')
          : null,
        age: calcAgeFromDob(data.date_of_birth) || toNum(data.age),
        projects: Array.isArray(data.projects) ? data.projects : [],
        donors: Array.isArray(data.donors) ? data.donors : [],
        household_id: data.household_id || '',
        household_size: toNum(data.household_size),
        hh_members_total: toNum(data.hh_members_total),
        hh_members_male: toNum(data.hh_members_male),
        hh_members_female: toNum(data.hh_members_female),
        hh_members_transgender: toNum(data.hh_members_transgender),
        hh_members_children: toNum(data.hh_members_children),
        hh_members_elderly: toNum(data.hh_members_elderly),
        hh_members_pwd: toNum(data.hh_members_pwd),
        monthly_income: toNum(data.monthly_income),
        gps_latitude: toNum(data.gps_latitude),
        gps_longitude: toNum(data.gps_longitude),
        drinking_water_distance_km: toNum(data.drinking_water_distance_km),
        agri_land_owned_decimal: toNum(data.agri_land_owned_decimal),
        total_cultivated_land_last_season: toNum(data.total_cultivated_land_last_season),
        land_under_climate_adaptive_agriculture: toNum(data.land_under_climate_adaptive_agriculture),
        total_agricultural_income_last_year: toNum(data.total_agricultural_income_last_year),
      };
      delete formattedData.project;
      delete formattedData.donor;
      delete formattedData.household;
      delete formattedData.adaptive_agricultural_practices_other;
      delete formattedData.climate_resilient_crop_varieties_other;

      if (isEditMode) {
        await putBeneficiary(
          `${endpoints.beneficiaries.beneficiaries_database}${beneficiaryId}/`,
          formattedData
        );
        toast.success('Beneficiary profile saved');
        await mutate(endpoints.beneficiaries.beneficiary_by_id(beneficiaryId));
      } else {
        await postBeneficiary(endpoints.beneficiaries.beneficiaries_database, formattedData);
        toast.success('Beneficiary profile saved as draft');
      }
      router.push(paths.dashboard.beneficiaries.database);
    } catch (error) {
      toast.error(`Error ${isEditMode ? 'updating' : 'creating'} beneficiary`);
      console.error(error);
    }
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" color="text.secondary">
                Beneficiary Unique ID is auto-generated on save.
                {isEditMode && defaultBeneficiaryData?.ben_code
                  ? ` Current ID: ${defaultBeneficiaryData.ben_code}`
                  : ''}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl name="household_id" control={control} label="Household ID" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Controller
                name="projects"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    options={projectOptions}
                    loading={projectsLoading}
                    getOptionLabel={getLabel}
                    value={projectOptions.filter((p) =>
                      (Array.isArray(field.value) ? field.value : []).includes(p.id)
                    )}
                    isOptionEqualToValue={(a, b) => a.id === b?.id}
                    onChange={(_, value) => field.onChange(value.map((v) => v.id))}
                    renderInput={(params) => <TextField {...params} label="Project Name" />}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Controller
                name="donors"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    options={donorOptions}
                    loading={donorsLoading}
                    getOptionLabel={(o) => o?.organization_name || o?.name || ''}
                    value={donorOptions.filter((d) =>
                      (Array.isArray(field.value) ? field.value : []).includes(d.id)
                    )}
                    isOptionEqualToValue={(a, b) => a.id === b?.id}
                    onChange={(_, value) => field.onChange(value.map((v) => v.id))}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Donor Name"
                        helperText="Auto-filled from selected projects; editable"
                      />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <DateCtrl name="enrollment_date" control={control} label="Enrollment Date" />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl name="name" control={control} label="Full Name" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl name="mother_name" control={control} label="Mother Name" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl name="father_name" control={control} label="Father Name" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl name="husband_name" control={control} label="Husband Name" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <SingleSelectField name="sex" control={control} label="Gender" options={GENDER_OPTIONS} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Controller
                name="date_of_birth"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Date of Birth"
                    format="DD/MM/YYYY"
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      setValue('age', calcAgeFromDob(value), { shouldDirty: true });
                    }}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Controller
                name="age"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Age (auto-calculated)"
                    type="number"
                    value={field.value ?? ''}
                    InputProps={{ readOnly: true }}
                    helperText="Updates instantly from Date of Birth"
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl name="nid" control={control} label="National ID / Birth Registration No." />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl name="contact" control={control} label="Mobile Number" />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <SingleSelectField
                name="household_type"
                control={control}
                label="Household Type"
                options={HOUSEHOLD_TYPE_OPTIONS}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl name="household_head_name" control={control} label="Name of Household Head" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl
                name="relationship_with_hh_head"
                control={control}
                label="Relationship with HH Head"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl name="household_size" control={control} label="Household Size" type="number" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl
                name="hh_members_total"
                control={control}
                label="Number of Household Members"
                type="number"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl name="hh_members_male" control={control} label="Male" type="number" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl name="hh_members_female" control={control} label="Female" type="number" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl
                name="hh_members_transgender"
                control={control}
                label="Transgender"
                type="number"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl
                name="hh_members_children"
                control={control}
                label="Children (0–17)"
                type="number"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl name="hh_members_elderly" control={control} label="Elderly (60+)" type="number" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl
                name="hh_members_pwd"
                control={control}
                label="Persons with Disability"
                type="number"
              />
            </Grid>
          </Grid>
        );
      case 3:
        return (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl name="district" control={control} label="District" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl name="upazila" control={control} label="Upazila" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl name="union" control={control} label="Union" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl name="village" control={control} label="Village / Ward" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl name="gps_latitude" control={control} label="GPS Latitude" type="number" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl name="gps_longitude" control={control} label="GPS Longitude" type="number" />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <MultiSelectField
                name="coastal_risk_zones"
                control={control}
                label="Coastal Risk Zone"
                options={COASTAL_RISK_OPTIONS}
              />
            </Grid>
          </Grid>
        );
      case 4:
        return (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <MultiSelectField
                name="main_income_sources"
                control={control}
                label="Main Income Source"
                options={MAIN_INCOME_OPTIONS}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl name="secondary_occupation" control={control} label="Secondary Occupation" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl
                name="monthly_income"
                control={control}
                label="Monthly Household Income (BDT)"
                type="number"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <SingleSelectField
                name="land_ownership_status"
                control={control}
                label="Land Ownership Status"
                options={LAND_OWNERSHIP_OPTIONS}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <SingleSelectField
                name="housing_condition"
                control={control}
                label="Housing Condition"
                options={HOUSING_CONDITION_OPTIONS}
              />
            </Grid>
          </Grid>
        );
      case 5:
        return (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <SingleSelectField
                name="education_level"
                control={control}
                label="Education Level"
                options={EDUCATION_OPTIONS}
              />
            </Grid>
          </Grid>
        );
      case 6:
        return (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Person with Disability
              </Typography>
              <Controller
                name="person_with_disability"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    row
                    value={
                      field.value === true ? 'yes' : field.value === false ? 'no' : ''
                    }
                    onChange={(_, v) => field.onChange(v === 'yes' ? true : v === 'no' ? false : null)}
                  >
                    <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                    <FormControlLabel value="no" control={<Radio />} label="No" />
                  </RadioGroup>
                )}
              />
            </Grid>
            {personWithDisability === true && (
              <Grid size={{ xs: 12 }}>
                <MultiSelectField
                  name="disability_types"
                  control={control}
                  label="Disability Type"
                  options={DISABILITY_TYPE_OPTIONS}
                />
              </Grid>
            )}
            <Grid size={{ xs: 12 }}>
              <MultiSelectField
                name="vulnerability_categories"
                control={control}
                label="Vulnerability Category"
                options={VULNERABILITY_CATEGORY_OPTIONS}
              />
            </Grid>
          </Grid>
        );
      case 7:
        return (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <MultiSelectField
                name="drinking_water_sources"
                control={control}
                label="Primary Drinking Water Source"
                options={DRINKING_WATER_OPTIONS}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl
                name="drinking_water_distance_km"
                control={control}
                label="Distance to Drinking Water (KM)"
                type="number"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <SingleSelectField
                name="sanitation_facility"
                control={control}
                label="Sanitation Facility"
                options={SANITATION_OPTIONS}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <MultiSelectField
                name="common_health_problems"
                control={control}
                label="Common Health Problems (last 6 months)"
                options={HEALTH_PROBLEM_OPTIONS}
              />
            </Grid>
            {Array.isArray(healthProblems) && healthProblems.includes('Others') && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextCtrl
                  name="common_health_problems_other"
                  control={control}
                  label="Others (Health Problems)"
                />
              </Grid>
            )}
            <Grid size={{ xs: 12 }}>
              <MultiSelectField
                name="access_to_health_services"
                control={control}
                label="Access to Health Services"
                options={HEALTH_ACCESS_OPTIONS}
              />
            </Grid>
          </Grid>
        );
      case 8:
        return (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <MultiSelectField
                name="loss_and_damage"
                control={control}
                label="Loss & Damage Experienced"
                options={LOSS_DAMAGE_OPTIONS}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <MultiSelectField
                name="coping_strategies"
                control={control}
                label="Coping Strategy Used"
                options={COPING_STRATEGY_OPTIONS}
              />
            </Grid>
          </Grid>
        );
      case 9:
        return (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <MultiSelectField
                name="group_memberships"
                control={control}
                label="Member of Group"
                options={GROUP_MEMBERSHIP_OPTIONS}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <DateCtrl name="group_joining_date" control={control} label="Date of Joining Group" />
            </Grid>
          </Grid>
        );
      case 10:
        return (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl
                name="agri_land_owned_decimal"
                control={control}
                label="Total agricultural land owned (Decimal)"
                type="number"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextCtrl
                name="currently_practiced_adaptive_agriculture"
                control={control}
                label="Currently practiced adaptive agriculture"
                multiline
                rows={2}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl
                name="total_cultivated_land_last_season"
                control={control}
                label="Total cultivated land (last season)"
                type="number"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl
                name="land_under_climate_adaptive_agriculture"
                control={control}
                label="Land under climate adaptive agriculture"
                type="number"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <MultiSelectField
                name="irrigation_sources"
                control={control}
                label="Source of irrigation"
                options={IRRIGATION_SOURCE_OPTIONS}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextCtrl
                name="total_agricultural_income_last_year"
                control={control}
                label="Total Agricultural Income (Last 1 Year)"
                type="number"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextCtrl
                name="adaptive_agricultural_practices"
                control={control}
                label="Adaptive agricultural practices"
                multiline
                rows={2}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextCtrl
                name="climate_resilient_crop_varieties"
                control={control}
                label="Climate Resilient Crop Varieties"
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', py: 4, px: 2, bgcolor: 'grey.50' }}>
      <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
        {isEditMode && defaultBeneficiaryLoading ? (
          <Paper sx={{ p: 4, borderRadius: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
              <CircularProgress size={32} />
              <Typography>Loading beneficiary profile...</Typography>
            </Stack>
          </Paper>
        ) : (
          <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <FormProvider {...methods}>
              <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: 3 }}>
                <Stack spacing={3}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        {isEditMode ? 'Edit Beneficiary Profile' : 'Add Beneficiary Profile'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        All fields optional — save anytime as draft
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      startIcon={<Iconify icon="eva:arrow-back-fill" />}
                      onClick={() => router.back()}
                    >
                      Back
                    </Button>
                  </Stack>

                  <Stepper activeStep={activeStep} alternativeLabel sx={{ overflowX: 'auto', pb: 1 }}>
                    {PROFILE_STEPS.map((step) => (
                      <Step key={step.key}>
                        <StepLabel>{`${step.key}. ${step.label}`}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>

                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} color="primary.main" sx={{ mb: 2 }}>
                      {PROFILE_STEPS[activeStep].key}. {PROFILE_STEPS[activeStep].label}
                    </Typography>
                    {renderStep()}
                  </Box>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Button
                      variant="outlined"
                      disabled={activeStep === 0 || isSubmitting}
                      onClick={() => setActiveStep((s) => s - 1)}
                    >
                      Previous
                    </Button>
                    {activeStep < PROFILE_STEPS.length - 1 ? (
                      <Button variant="contained" onClick={() => setActiveStep((s) => s + 1)}>
                        Next
                      </Button>
                    ) : null}
                    <Box sx={{ flexGrow: 1 }} />
                    <Button
                      type="submit"
                      variant="contained"
                      color="success"
                      disabled={isSubmitting}
                      startIcon={
                        isSubmitting ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <Iconify icon="solar:diskette-bold" />
                        )
                      }
                    >
                      {isSubmitting ? 'Saving...' : 'Save Draft / Profile'}
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </FormProvider>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
