/**
 * Form field metadata, and — importantly — which factors a person can actually change.
 *
 * `modifiable: false` fields are shown in the What-If panel behind a lock. The
 * simulator only ever exposes levers a lifestyle change could really move; age,
 * sex and family history are context, not controls.
 */

export const SMOKING_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'former', label: 'Former' },
  { value: 'current', label: 'Current' },
];

export const DIET_OPTIONS = [
  { value: 'poor', label: 'Rarely' },
  { value: 'average', label: 'Most days' },
  { value: 'good', label: 'Every day' },
];

export const FAMILY_OPTIONS = [
  { value: 'none', label: 'None recorded' },
  { value: 'second', label: 'Second-degree relative (grandparent, aunt, uncle)' },
  { value: 'first', label: 'First-degree relative (parent, sibling, child)' },
];

export const SEX_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Prefer not to say' },
];

export const FORM_FIELDS = [
  { id: 'age', label: 'Age', control: 'number', unit: 'years', min: 18, max: 100, modifiable: false },
  { id: 'sex', label: 'Sex', control: 'select', options: SEX_OPTIONS, modifiable: false,
    help: 'The published instruments are sex-binary. "Prefer not to say" uses the lower-risk reference table.' },
  { id: 'heightCm', label: 'Height', control: 'number', unit: 'cm', min: 120, max: 220, modifiable: false },
  { id: 'weightKg', label: 'Weight', control: 'number', unit: 'kg', min: 35, max: 200, modifiable: true },
  { id: 'waistCm', label: 'Waist circumference', control: 'number', unit: 'cm', min: 50, max: 160, modifiable: true,
    help: 'Scored separately from BMI by the diabetes model.' },
  { id: 'systolic', label: 'Systolic BP', control: 'number', unit: 'mmHg', min: 80, max: 220, modifiable: true },
  { id: 'diastolic', label: 'Diastolic BP', control: 'number', unit: 'mmHg', min: 40, max: 140, modifiable: true },
  { id: 'smoking', label: 'Smoking status', control: 'segmented', options: SMOKING_OPTIONS, modifiable: true },
  { id: 'activityMinutes', label: 'Moderate activity', control: 'number', unit: 'min/week', min: 0, max: 600, modifiable: true },
  { id: 'dietQuality', label: 'Fruit & vegetables', control: 'segmented', options: DIET_OPTIONS, modifiable: true },
  { id: 'familyHistory', label: 'Family history of diabetes, high BP or heart disease',
    control: 'select', options: FAMILY_OPTIONS, modifiable: false, full: true },
  { id: 'onBpMedication', label: 'Currently taking blood-pressure medication', control: 'toggle', modifiable: false,
    help: 'Recorded because the scoring models ask for it. This prototype never comments on medication.' },
  { id: 'priorHighGlucose', label: 'Previously recorded high blood glucose', control: 'toggle', modifiable: false },
];

/** Read-only context shown inside the What-If panel. */
export const LOCKED_IN_SIMULATOR = ['age', 'sex', 'familyHistory', 'priorHighGlucose'];

export function labelForValue(fieldId, value) {
  const field = FORM_FIELDS.find((f) => f.id === fieldId);
  if (!field) return String(value);
  if (field.options) return field.options.find((o) => o.value === value)?.label ?? String(value);
  if (field.control === 'toggle') return value ? 'Yes' : 'No';
  return field.unit ? `${value} ${field.unit}` : String(value);
}
