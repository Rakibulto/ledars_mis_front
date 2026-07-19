export const GENDER_OPTIONS = ['Female', 'Male', 'Transgender'];

export const HOUSEHOLD_TYPE_OPTIONS = ['Male-headed', 'Female-headed', 'Child-headed'];

export const COASTAL_RISK_OPTIONS = [
  'Salinity affected',
  'Cyclone prone',
  'Flood prone',
  'Embankment erosion area',
];

export const MAIN_INCOME_OPTIONS = [
  'Agriculture',
  'Fishing',
  'Day labor',
  'Small business',
  'Service',
  'Other',
];

export const LAND_OWNERSHIP_OPTIONS = ['Landless', 'Homestead only', 'Cultivable land'];

export const HOUSING_CONDITION_OPTIONS = ['Muddy', 'Semi-concrete', 'Concrete'];

export const EDUCATION_OPTIONS = [
  'No schooling',
  'Primary incomplete',
  'Primary complete',
  'Secondary',
  'Higher Secondary',
  'Graduate & above',
];

export const DISABILITY_TYPE_OPTIONS = ['Physical', 'Visual', 'Hearing', 'Intellectual'];

export const VULNERABILITY_CATEGORY_OPTIONS = [
  'Extreme poor',
  'Climate-affected household',
  'Woman-headed household',
  'Child marriage survivor',
  'GBV survivor',
  'Elderly living alone',
  'Person with chronic illness',
];

export const DRINKING_WATER_OPTIONS = [
  'Tube well',
  'Pond sand filter',
  'Rainwater harvesting',
  'Water on Wheel (WoW)',
  'Reverse Osmosis (RO)',
];

export const SANITATION_OPTIONS = ['Hygienic latrine', 'Non-hygienic', 'Open defecation'];

export const HEALTH_PROBLEM_OPTIONS = [
  'Skin disease',
  'Diarrhea',
  'Gynecological issues',
  'Hypertension',
  'Others',
];

export const HEALTH_ACCESS_OPTIONS = ['Government', 'NGO', 'Private'];

export const LOSS_DAMAGE_OPTIONS = ['House', 'Livelihood', 'Crops', 'Livestock'];

export const COPING_STRATEGY_OPTIONS = ['Migration', 'Loan', 'Asset selling', 'Aid support'];

export const GROUP_MEMBERSHIP_OPTIONS = [
  'Climate Resilient Group',
  'Women Self-Help Group',
  'Youth Group',
  'Adolescence Group',
];

export const IRRIGATION_SOURCE_OPTIONS = [
  'Pond',
  'Canal',
  'River',
  'Tube well',
  'Rainwater',
  'None',
];

export const PROFILE_STEPS = [
  { key: 'A', label: 'Identification' },
  { key: 'B', label: 'Personal' },
  { key: 'C', label: 'Household' },
  { key: 'D', label: 'Location' },
  { key: 'E', label: 'Socio-Economic' },
  { key: 'F', label: 'Education' },
  { key: 'G', label: 'Vulnerability' },
  { key: 'H', label: 'Health & WASH' },
  { key: 'I', label: 'Climate' },
  { key: 'J', label: 'Groups' },
  { key: 'K', label: 'Agriculture' },
];

export const DEFAULT_BENEFICIARY_FORM = {
  household_id: '',
  projects: [],
  donors: [],
  enrollment_date: null,
  name: '',
  mother_name: '',
  father_name: '',
  husband_name: '',
  sex: null,
  date_of_birth: null,
  age: '',
  nid: '',
  contact: '',
  household_type: null,
  household_head_name: '',
  relationship_with_hh_head: '',
  household_size: '',
  hh_members_total: '',
  hh_members_male: '',
  hh_members_female: '',
  hh_members_transgender: '',
  hh_members_children: '',
  hh_members_elderly: '',
  hh_members_pwd: '',
  district: '',
  upazila: '',
  union: '',
  village: '',
  gps_latitude: '',
  gps_longitude: '',
  coastal_risk_zones: [],
  main_income_sources: [],
  secondary_occupation: '',
  monthly_income: '',
  land_ownership_status: null,
  housing_condition: null,
  education_level: null,
  person_with_disability: null,
  disability_types: [],
  vulnerability_categories: [],
  drinking_water_sources: [],
  drinking_water_distance_km: '',
  sanitation_facility: null,
  common_health_problems: [],
  common_health_problems_other: '',
  access_to_health_services: [],
  loss_and_damage: [],
  coping_strategies: [],
  group_memberships: [],
  group_joining_date: null,
  agri_land_owned_decimal: '',
  currently_practiced_adaptive_agriculture: '',
  total_cultivated_land_last_season: '',
  land_under_climate_adaptive_agriculture: '',
  irrigation_sources: [],
  total_agricultural_income_last_year: '',
  adaptive_agricultural_practices: '',
  climate_resilient_crop_varieties: '',
};

export const formatList = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(', ') || '—';
  }
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
};
