// Keep values in sync with server/utils/constants.js DESIGNATION_OPTIONS
export const DESIGNATION_OPTIONS = [
  { value: "principal", label: "Principal" },
  { value: "director", label: "Director / Owner" },
  { value: "head_of_institution", label: "Head of Institution" },
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "guardian", label: "Guardian" },
  { value: "teacher_admin", label: "Teacher / Staff Admin" },
  { value: "other", label: "Other" },
];

export const ORG_TYPE_OPTIONS = [
  { value: "school", label: "School" },
  { value: "coaching_centre", label: "Coaching Centre" },
  { value: "institution", label: "Institution" },
  { value: "other", label: "Other" },
];

export function designationLabel(admin) {
  if (!admin?.designation) return "";
  if (admin.designation === "other") return admin.designationOther || "Other";
  return DESIGNATION_OPTIONS.find((d) => d.value === admin.designation)?.label || admin.designation;
}
