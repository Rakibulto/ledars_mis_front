import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

import { formatList } from './beneficiary-profile-options';

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  orgHeader: {
    textAlign: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottom: '2px solid #059669',
  },
  orgName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  orgAddress: {
    fontSize: 10,
    color: '#374151',
    marginTop: 2,
  },
  orgTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 6,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 6,
    paddingBottom: 3,
    borderBottom: '1px solid #e5e7eb',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: '40%',
    fontSize: 8,
    color: '#6b7280',
  },
  value: {
    width: '60%',
    fontSize: 9,
    color: '#1f2937',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 28,
    right: 28,
    textAlign: 'center',
    fontSize: 7,
    color: '#9ca3af',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 6,
  },
});

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{formatList(value)}</Text>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const BeneficiaryProfilePDF = ({ beneficiary }) => {
  const b = beneficiary || {};
  const gps =
    b.gps_latitude || b.gps_longitude
      ? `${b.gps_latitude || '—'}, ${b.gps_longitude || '—'}`
      : '—';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.orgHeader}>
          <Text style={styles.orgName}>LEDARS</Text>
          <Text style={styles.orgAddress}>Shyamnagar, Satkhira</Text>
          <Text style={styles.orgTitle}>Beneficiary Profile Checklist of MIS</Text>
          <Text style={{ marginTop: 6, fontSize: 10, color: '#059669' }}>
            ID: {b.ben_code || '—'}
          </Text>
        </View>

        <Section title="A. Identification & System Information">
          <Row label="Beneficiary Unique ID" value={b.ben_code} />
          <Row label="Household ID" value={b.household_id || b.household_code} />
          <Row label="Project Name" value={b.project_name || b.project_names} />
          <Row label="Donor Name" value={b.donor_name || b.donor_names} />
          <Row label="Enrollment Date" value={b.enrollment_date} />
        </Section>

        <Section title="B. Personal Information">
          <Row label="Full Name" value={b.name} />
          <Row label="Mother Name" value={b.mother_name} />
          <Row label="Father Name" value={b.father_name} />
          <Row label="Husband Name" value={b.husband_name} />
          <Row label="Gender" value={b.sex} />
          <Row label="Date of Birth" value={b.date_of_birth} />
          <Row label="Age" value={b.age} />
          <Row label="National ID / Birth Registration" value={b.nid} />
          <Row label="Mobile Number" value={b.contact} />
        </Section>

        <Section title="C. Household & Demographic Information">
          <Row label="Household Type" value={b.household_type} />
          <Row label="Name of Household Head" value={b.household_head_name} />
          <Row label="Relationship with HH Head" value={b.relationship_with_hh_head} />
          <Row label="Household Size" value={b.household_size} />
          <Row label="Number of Household Members" value={b.hh_members_total} />
          <Row label="Male / Female / Transgender" value={`${b.hh_members_male ?? '—'} / ${b.hh_members_female ?? '—'} / ${b.hh_members_transgender ?? '—'}`} />
          <Row label="Children / Elderly / PWD" value={`${b.hh_members_children ?? '—'} / ${b.hh_members_elderly ?? '—'} / ${b.hh_members_pwd ?? '—'}`} />
        </Section>

        <Section title="D. Geographic & Location Details">
          <Row label="District" value={b.district} />
          <Row label="Upazila" value={b.upazila} />
          <Row label="Union" value={b.union} />
          <Row label="Village / Ward" value={b.village} />
          <Row label="GPS Location" value={gps} />
          <Row label="Coastal Risk Zone" value={b.coastal_risk_zones} />
        </Section>

        <Section title="E. Socio-Economic Status">
          <Row label="Main Income Source" value={b.main_income_sources} />
          <Row label="Secondary Occupation" value={b.secondary_occupation} />
          <Row label="Monthly Household Income (BDT)" value={b.monthly_income} />
          <Row label="Land Ownership Status" value={b.land_ownership_status} />
          <Row label="Housing Condition" value={b.housing_condition} />
        </Section>

        <Section title="F. Education Profile">
          <Row label="Education Level" value={b.education_level} />
        </Section>

        <Section title="G. Disability & Vulnerability Status">
          <Row label="Person with Disability" value={b.person_with_disability} />
          <Row label="Disability Type" value={b.disability_types} />
          <Row label="Vulnerability Category" value={b.vulnerability_categories} />
        </Section>

        <Section title="H. Health, WASH & Nutrition">
          <Row label="Primary Drinking Water Source" value={b.drinking_water_sources} />
          <Row label="Distance to Drinking Water (KM)" value={b.drinking_water_distance_km} />
          <Row label="Sanitation Facility" value={b.sanitation_facility} />
          <Row label="Common Health Problems" value={b.common_health_problems} />
          <Row label="Others (Health)" value={b.common_health_problems_other} />
          <Row label="Access to Health Services" value={b.access_to_health_services} />
        </Section>

        <Section title="I. Climate Change & Disaster Exposure">
          <Row label="Loss & Damage Experienced" value={b.loss_and_damage} />
          <Row label="Coping Strategy Used" value={b.coping_strategies} />
        </Section>

        <Section title="J. Program Participation & Group Membership">
          <Row label="Member of Group" value={b.group_memberships} />
          <Row label="Date of Joining Group" value={b.group_joining_date} />
        </Section>

        <Section title="K. Agricultural Information">
          <Row label="Total agricultural land owned (Decimal)" value={b.agri_land_owned_decimal} />
          <Row
            label="Currently practiced adaptive agriculture"
            value={b.currently_practiced_adaptive_agriculture}
          />
          <Row label="Total cultivated land (last season)" value={b.total_cultivated_land_last_season} />
          <Row
            label="Land under climate adaptive agriculture"
            value={b.land_under_climate_adaptive_agriculture}
          />
          <Row label="Source of irrigation" value={b.irrigation_sources} />
          <Row
            label="Total Agricultural Income (Last 1 Year)"
            value={b.total_agricultural_income_last_year}
          />
          <Row label="Adaptive agricultural practices" value={b.adaptive_agricultural_practices} />
          <Row label="Climate Resilient Crop Varieties" value={b.climate_resilient_crop_varieties} />
        </Section>

        <View style={styles.footer}>
          <Text>
            Generated on {new Date().toLocaleDateString()} | LEDARS MIS — Shyamnagar, Satkhira
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default BeneficiaryProfilePDF;
