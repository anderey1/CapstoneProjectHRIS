/**
 * Transforms raw employee form values into appropriate payload for Django REST Framework.
 * If signature file is included, uses FormData with JSON stringified nested arrays.
 * Otherwise returns a clean JSON object without file helper fields.
 */
export function buildEmployeePayload(data) {
  const hasFile = data.e_signature_file && data.e_signature_file.length > 0;

  if (hasFile) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'e_signature_file') {
        formData.append('e_signature', value[0]);
      } else if (['family', 'education', 'eligibilities', 'work_experience'].includes(key)) {
        // DRF MultiPartParser requires JSON strings for nested structured fields
        formData.append(key, JSON.stringify(value));
      } else if (value !== null && value !== undefined && key !== 'e_signature_preview') {
        formData.append(key, value);
      }
    });
    return formData;
  }

  const cleanJson = { ...data };
  delete cleanJson.e_signature_file;
  delete cleanJson.e_signature_preview;
  return cleanJson;
}
