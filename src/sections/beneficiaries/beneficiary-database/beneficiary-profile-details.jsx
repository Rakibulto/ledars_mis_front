'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { formatList } from './beneficiary-profile-options';

function Section({ title, children }) {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} color="primary.main" sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Grid container spacing={2}>
        {children}
      </Grid>
    </Box>
  );
}

function Field({ label, value, xs = 12, sm = 6 }) {
  const isList = Array.isArray(value);
  return (
    <Grid size={{ xs, sm }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      {isList && value.length > 0 ? (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
          {value.map((item) => (
            <Chip key={String(item)} size="small" label={item} />
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" fontWeight={600}>
          {formatList(value)}
        </Typography>
      )}
    </Grid>
  );
}

export default function BeneficiaryProfileDetails({ beneficiary }) {
  if (!beneficiary) return null;
  const b = beneficiary;
  const gps =
    b.gps_latitude || b.gps_longitude
      ? `${b.gps_latitude || '—'}, ${b.gps_longitude || '—'}`
      : '—';

  return (
    <Box>
      <Section title="A. Identification & System Information">
        <Field label="Beneficiary Unique ID" value={b.ben_code} />
        <Field label="Household ID" value={b.household_id || b.household_code} />
        <Field label="Project Name" value={b.project_names || b.project_name} />
        <Field label="Donor Name" value={b.donor_names || b.donor_name} />
        <Field label="Enrollment Date" value={b.enrollment_date} />
      </Section>
      <Divider />
      <Section title="B. Personal Information">
        <Field label="Full Name" value={b.name} />
        <Field label="Mother Name" value={b.mother_name} />
        <Field label="Father Name" value={b.father_name} />
        <Field label="Husband Name" value={b.husband_name} />
        <Field label="Gender" value={b.sex} />
        <Field label="Date of Birth" value={b.date_of_birth} />
        <Field label="Age" value={b.age} />
        <Field label="National ID / Birth Registration" value={b.nid} />
        <Field label="Mobile Number" value={b.contact} />
      </Section>
      <Divider />
      <Section title="C. Household & Demographic Information">
        <Field label="Household Type" value={b.household_type} />
        <Field label="Name of Household Head" value={b.household_head_name} />
        <Field label="Relationship with HH Head" value={b.relationship_with_hh_head} />
        <Field label="Household Size" value={b.household_size} />
        <Field label="Number of Household Members" value={b.hh_members_total} />
        <Field label="Male" value={b.hh_members_male} sm={4} />
        <Field label="Female" value={b.hh_members_female} sm={4} />
        <Field label="Transgender" value={b.hh_members_transgender} sm={4} />
        <Field label="Children (0–17)" value={b.hh_members_children} sm={4} />
        <Field label="Elderly (60+)" value={b.hh_members_elderly} sm={4} />
        <Field label="Persons with Disability" value={b.hh_members_pwd} sm={4} />
      </Section>
      <Divider />
      <Section title="D. Geographic & Location Details">
        <Field label="District" value={b.district} />
        <Field label="Upazila" value={b.upazila} />
        <Field label="Union" value={b.union} />
        <Field label="Village / Ward" value={b.village} />
        <Field label="GPS Location" value={gps} />
        <Field label="Coastal Risk Zone" value={b.coastal_risk_zones} />
      </Section>
      <Divider />
      <Section title="E. Socio-Economic Status">
        <Field label="Main Income Source" value={b.main_income_sources} />
        <Field label="Secondary Occupation" value={b.secondary_occupation} />
        <Field label="Monthly Household Income (BDT)" value={b.monthly_income} />
        <Field label="Land Ownership Status" value={b.land_ownership_status} />
        <Field label="Housing Condition" value={b.housing_condition} />
      </Section>
      <Divider />
      <Section title="F. Education Profile">
        <Field label="Education Level" value={b.education_level} />
      </Section>
      <Divider />
      <Section title="G. Disability & Vulnerability Status">
        <Field label="Person with Disability" value={b.person_with_disability} />
        <Field label="Disability Type" value={b.disability_types} />
        <Field label="Vulnerability Category" value={b.vulnerability_categories} />
      </Section>
      <Divider />
      <Section title="H. Health, WASH & Nutrition">
        <Field label="Primary Drinking Water Source" value={b.drinking_water_sources} />
        <Field label="Distance to Drinking Water (KM)" value={b.drinking_water_distance_km} />
        <Field label="Sanitation Facility" value={b.sanitation_facility} />
        <Field label="Common Health Problems" value={b.common_health_problems} />
        <Field label="Others (Health)" value={b.common_health_problems_other} />
        <Field label="Access to Health Services" value={b.access_to_health_services} />
      </Section>
      <Divider />
      <Section title="I. Climate Change & Disaster Exposure">
        <Field label="Loss & Damage Experienced" value={b.loss_and_damage} />
        <Field label="Coping Strategy Used" value={b.coping_strategies} />
      </Section>
      <Divider />
      <Section title="J. Program Participation & Group Membership">
        <Field label="Member of Group" value={b.group_memberships} />
        <Field label="Date of Joining Group" value={b.group_joining_date} />
      </Section>
      <Divider />
      <Section title="K. Agricultural Information">
        <Field label="Total agricultural land owned (Decimal)" value={b.agri_land_owned_decimal} />
        <Field
          label="Currently practiced adaptive agriculture"
          value={b.currently_practiced_adaptive_agriculture}
        />
        <Field
          label="Total cultivated land (last season)"
          value={b.total_cultivated_land_last_season}
        />
        <Field
          label="Land under climate adaptive agriculture"
          value={b.land_under_climate_adaptive_agriculture}
        />
        <Field label="Source of irrigation" value={b.irrigation_sources} />
        <Field
          label="Total Agricultural Income (Last 1 Year)"
          value={b.total_agricultural_income_last_year}
        />
        <Field label="Adaptive agricultural practices" value={b.adaptive_agricultural_practices} />
        <Field
          label="Climate Resilient Crop Varieties"
          value={b.climate_resilient_crop_varieties}
        />
      </Section>
    </Box>
  );
}
