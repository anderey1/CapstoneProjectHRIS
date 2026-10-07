/**
 * Local Storage Adapter for the profile photo and ID card images.
 *
 * 201-file documents are not stored here. They live on the server in
 * EmployeeDocument and are read through useEmployeeDocuments.
 */

export const loadProfilePhoto = (id) => {
  if (!id) return null;
  return localStorage.getItem(`hris_profile_photo_${id}`) || null;
};

export const saveProfilePhoto = (id, base64String) => {
  if (!id) return;
  localStorage.setItem(`hris_profile_photo_${id}`, base64String);
};

/**
 * Returns only ID card images that were actually uploaded on this device.
 * No card is invented from a number already on the employee record.
 */
export const loadProfileIDs = (employee) => {
  if (!employee?.id) return {};
  const stored = localStorage.getItem(`hris_profile_ids_${employee.id}`);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
};

export const saveProfileIDs = (id, ids) => {
  if (!id) return;
  localStorage.setItem(`hris_profile_ids_${id}`, JSON.stringify(ids));
};
