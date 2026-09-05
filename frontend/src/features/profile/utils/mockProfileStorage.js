/**
 * Mock Profile Storage Adapter
 * Decouples simulated localStorage attachments and documents from the Profile presentation view.
 */

export const loadProfilePhoto = (id) => {
  if (!id) return null;
  return localStorage.getItem(`hris_profile_photo_${id}`) || null;
};

export const saveProfilePhoto = (id, base64String) => {
  if (!id) return;
  localStorage.setItem(`hris_profile_photo_${id}`, base64String);
};

export const loadProfileDocs = (me) => {
  if (!me?.id) return {};
  const stored = localStorage.getItem(`hris_profile_docs_${me.id}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }

  const initial = {};
  if (me.pds_file) {
    initial['pds_file'] = {
      fileName: 'Accomplished_PDS.pdf',
      uploadDate: new Date().toLocaleDateString(),
      verified: true,
      fileData: me.pds_file,
    };
  }
  return initial;
};

export const saveProfileDocs = (id, docs) => {
  if (!id) return;
  localStorage.setItem(`hris_profile_docs_${id}`, JSON.stringify(docs));
};

export const loadProfileIDs = (me, governmentIdsList = []) => {
  if (!me?.id) return {};
  const stored = localStorage.getItem(`hris_profile_ids_${me.id}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }

  const initialIDs = {};
  governmentIdsList.forEach((item) => {
    if (me[item.id]) {
      initialIDs[item.id] = {
        number: me[item.id],
        uploadDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        verified: true,
        fileName: `${item.id}_card.png`,
        fileData: null,
      };
    }
  });
  return initialIDs;
};

export const saveProfileIDs = (id, ids) => {
  if (!id) return;
  localStorage.setItem(`hris_profile_ids_${id}`, JSON.stringify(ids));
};
