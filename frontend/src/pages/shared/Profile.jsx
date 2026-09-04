import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { TABS, REQUIRED_DOCS_LIST, GOVERNMENT_IDS_LIST } from './profile/constants';
import ProfileHeader from './profile/ProfileHeader';
import PersonalInfoTab from './profile/PersonalInfoTab';
import FamilyBackgroundTab from './profile/FamilyBackgroundTab';
import EducationalBackgroundTab from './profile/EducationalBackgroundTab';
import CivilServiceEligibilityTab from './profile/CivilServiceEligibilityTab';
import WorkExperienceTab from './profile/WorkExperienceTab';
import VerifiedIDsTab from './profile/VerifiedIDsTab';
import DocumentChecklistTab from './profile/DocumentChecklistTab';
import ProfileSidebar from './profile/ProfileSidebar';
import PDSDetailModal from './profile/PDSDetailModal';
import DocumentPreviewModal from './profile/DocumentPreviewModal';

const Profile = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const sigInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const docInputRef = useRef(null);
  const idFileInputRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('personal');
  const [isUploadingSig, setIsUploadingSig] = useState(false);
  
  // Custom Local Storage Mocks for high-fidelity interactive simulation
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [simulatedDocs, setSimulatedDocs] = useState({});
  const [simulatedIDs, setSimulatedIDs] = useState({});
  const [activeDocUpload, setActiveDocUpload] = useState(null);
  const [activeIDUpload, setActiveIDUpload] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  // Modals state for PDS CRUD
  const [activeModal, setActiveModal] = useState(null); // 'personal', 'education', 'work', 'eligibility', 'family'
  const [modalData, setModalData] = useState(null);
  const [modalIndex, setModalIndex] = useState(null);

  // Fetch current user / employee details
  const { data: me, isLoading } = useQuery({
    queryKey: id ? ['employee', id] : ['me'],
    queryFn: () => {
      const endpoint = id ? `employees/${id}/` : 'employees/me/';
      return api.get(endpoint).then(res => res.data);
    }
  });

  // Check user role and permissions
  const currentUserRole = user?.role || localStorage.getItem('user_role') || me?.user_details?.role || 'TEACHING';
  const isHrOrSuperintendent = currentUserRole === 'HR' || currentUserRole === 'SUPERINTENDENT';
  const isAdmin = isHrOrSuperintendent;

  // Determine ownership: own profile vs another user's profile
  const isOwnProfile = !id || Boolean(
    (user?.employee_id && String(user.employee_id) === String(id)) ||
    (user?.id && me?.user_details?.id && String(user.id) === String(me.user_details.id)) ||
    (user?.username && me?.user_details?.username && user.username.toLowerCase() === me.user_details.username.toLowerCase()) ||
    (user?.employee_id && me?.id && String(user.employee_id) === String(me.id))
  );

  // Granular capability flags
  const canUploadSignature = isOwnProfile; // Strictly employee self-service only
  const canEditProfile = isOwnProfile || isHrOrSuperintendent;
  const canVerifyDocs = !isOwnProfile && isHrOrSuperintendent;
  const canChangePhoto = isOwnProfile || isHrOrSuperintendent;

  // Load localStorage mocks on component mount / profile data load
  useEffect(() => {
    if (me?.id) {
      const storedPhoto = localStorage.getItem(`hris_profile_photo_${me.id}`);
      if (storedPhoto) setProfilePhoto(storedPhoto);

      const storedDocs = localStorage.getItem(`hris_profile_docs_${me.id}`);
      if (storedDocs) {
        setSimulatedDocs(JSON.parse(storedDocs));
      } else {
        const initial = {};
        if (me.pds_file) {
          initial['pds_file'] = {
            fileName: 'Accomplished_PDS.pdf',
            uploadDate: new Date().toLocaleDateString(),
            verified: true,
            fileData: me.pds_file
          };
        }
        setSimulatedDocs(initial);
      }

      const storedIDs = localStorage.getItem(`hris_profile_ids_${me.id}`);
      if (storedIDs) {
        setSimulatedIDs(JSON.parse(storedIDs));
      } else {
        const initialIDs = {};
        GOVERNMENT_IDS_LIST.forEach(item => {
          if (me[item.id]) {
            initialIDs[item.id] = {
              number: me[item.id],
              uploadDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
              verified: true,
              fileName: `${item.id}_card.png`,
              fileData: null
            };
          }
        });
        setSimulatedIDs(initialIDs);
      }
    }
  }, [me]);

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (updatedFields) => {
      const endpoint = id ? `employees/${id}/` : 'employees/me/';
      return api.patch(endpoint, updatedFields);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: id ? ['employee', id] : ['me'] });
      setActiveModal(null);
      setModalData(null);
      setModalIndex(null);
    },
    onError: (err) => {
      console.error(err);
      alert("Failed to update profile details: " + (err.response?.data?.detail || "Please try again."));
    }
  });

  const sigMutation = useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append('e_signature', file);
      const endpoint = id ? `employees/${id}/` : 'employees/me/';
      return api.patch(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: id ? ['employee', id] : ['me'] });
      setIsUploadingSig(false);
    },
    onError: (err) => {
      console.error(err);
      setIsUploadingSig(false);
      alert("Failed to upload signature. Please try again.");
    }
  });

  const handleSigUpload = (e) => {
    if (!canUploadSignature) return;
    const file = e.target.files[0];
    if (file) {
      setIsUploadingSig(true);
      sigMutation.mutate(file);
    }
  };

  const handlePhotoSelect = (e) => {
    if (!canChangePhoto) return;
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        localStorage.setItem(`hris_profile_photo_${me?.id || 'default'}`, base64String);
        setProfilePhoto(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerDocUpload = (docKey) => {
    if (!canEditProfile) return;
    setActiveDocUpload(docKey);
    docInputRef.current?.click();
  };

  const handleDocFileSelect = (e) => {
    if (!canEditProfile) return;
    const file = e.target.files[0];
    if (file && activeDocUpload && me?.id) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updated = {
          ...simulatedDocs,
          [activeDocUpload]: {
            fileName: file.name,
            uploadDate: new Date().toLocaleDateString(),
            verified: false,
            fileData: reader.result
          }
        };
        setSimulatedDocs(updated);
        localStorage.setItem(`hris_profile_docs_${me.id}`, JSON.stringify(updated));
        setActiveDocUpload(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteDoc = (docKey) => {
    if (!canEditProfile) return;
    if (window.confirm("Are you sure you want to delete this document upload?")) {
      const updated = { ...simulatedDocs };
      delete updated[docKey];
      setSimulatedDocs(updated);
      localStorage.setItem(`hris_profile_docs_${me.id}`, JSON.stringify(updated));
    }
  };

  const handleVerifyDoc = (docKey, status) => {
    if (!canVerifyDocs && !isAdmin) return;
    if (me?.id) {
      const updated = {
        ...simulatedDocs,
        [docKey]: {
          ...simulatedDocs[docKey],
          verified: status
        }
      };
      setSimulatedDocs(updated);
      localStorage.setItem(`hris_profile_docs_${me.id}`, JSON.stringify(updated));
    }
  };

  const triggerIDUpload = (idKey) => {
    if (!canEditProfile) return;
    setActiveIDUpload(idKey);
    idFileInputRef.current?.click();
  };

  const handleIDFileSelect = (e) => {
    if (!canEditProfile) return;
    const file = e.target.files[0];
    if (file && activeIDUpload && me?.id) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const currentNum = simulatedIDs[activeIDUpload]?.number || '';
        const idNumber = window.prompt(`Enter your ID Number for ${GOVERNMENT_IDS_LIST.find(i => i.id === activeIDUpload)?.label}:`, currentNum);
        
        if (idNumber !== null) {
          const updated = {
            ...simulatedIDs,
            [activeIDUpload]: {
              number: idNumber,
              uploadDate: new Date().toLocaleDateString(),
              verified: false,
              fileName: file.name,
              fileData: reader.result
            }
          };
          setSimulatedIDs(updated);
          localStorage.setItem(`hris_profile_ids_${me.id}`, JSON.stringify(updated));
          updateMutation.mutate({ [activeIDUpload]: idNumber });
        }
        setActiveIDUpload(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteID = (idKey) => {
    if (!canEditProfile) return;
    if (window.confirm(`Are you sure you want to delete the uploaded card and number for this ID?`)) {
      const updated = { ...simulatedIDs };
      delete updated[idKey];
      setSimulatedIDs(updated);
      localStorage.setItem(`hris_profile_ids_${me.id}`, JSON.stringify(updated));
      updateMutation.mutate({ [idKey]: '' });
    }
  };

  const handleVerifyID = (idKey, status) => {
    if (!canVerifyDocs && !isAdmin) return;
    if (me?.id) {
      const updated = {
        ...simulatedIDs,
        [idKey]: {
          ...simulatedIDs[idKey],
          verified: status
        }
      };
      setSimulatedIDs(updated);
      localStorage.setItem(`hris_profile_ids_${me.id}`, JSON.stringify(updated));
    }
  };

  const handlePreviewDoc = (doc) => {
    const docData = simulatedDocs[doc.key];
    if (docData?.fileData) {
      setPreviewFile({
        title: doc.name,
        data: docData.fileData,
        fileName: docData.fileName
      });
    } else {
      setPreviewFile({
        title: doc.name,
        data: "MOCK_PDF",
        fileName: docData?.fileName || `${doc.key}.pdf`
      });
    }
  };

  const handlePreviewIDCard = (doc) => {
    const cardData = simulatedIDs[doc.id];
    if (cardData?.fileData) {
      setPreviewFile({
        title: doc.label,
        data: cardData.fileData,
        fileName: cardData.fileName
      });
    } else {
      setPreviewFile({
        title: doc.label,
        data: "MOCK_CARD",
        fileName: cardData?.fileName || `${doc.id}_card.png`,
        number: cardData?.number || me[doc.id]
      });
    }
  };

  if (isLoading) return (
    <div className="p-8 flex justify-center h-[60vh] items-center">
      <span className="loading loading-spinner loading-lg text-[#0038A8]" />
    </div>
  );

  const workstation = me?.school_details;
  const pos = {
    lat: workstation?.latitude ? parseFloat(workstation.latitude) : 13.9408,
    lng: workstation?.longitude ? parseFloat(workstation.longitude) : 121.6210
  };

  const getProfileCompletion = () => {
    const fields = [
      me?.first_name, me?.last_name, me?.middle_name, me?.date_of_birth,
      me?.civil_status, me?.mobile_no, me?.email, me?.residential_address,
      me?.permanent_address, me?.umid_id, me?.pagibig_id, me?.philhealth_no
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  const completion = getProfileCompletion();

  const handleSaveModal = () => {
    if (!canEditProfile || !modalData) return;
    
    if (activeModal === 'personal') {
      updateMutation.mutate(modalData);
    } else if (activeModal === 'education') {
      const currentList = [...(me?.education || [])];
      if (modalIndex !== null) {
        currentList[modalIndex] = modalData;
      } else {
        currentList.push(modalData);
      }
      updateMutation.mutate({ education: currentList });
    } else if (activeModal === 'work') {
      const currentList = [...(me?.work_experience || [])];
      if (modalIndex !== null) {
        currentList[modalIndex] = modalData;
      } else {
        currentList.push(modalData);
      }
      updateMutation.mutate({ work_experience: currentList });
    } else if (activeModal === 'eligibility') {
      const currentList = [...(me?.eligibilities || [])];
      if (modalIndex !== null) {
        currentList[modalIndex] = modalData;
      } else {
        currentList.push(modalData);
      }
      updateMutation.mutate({ eligibilities: currentList });
    } else if (activeModal === 'family') {
      const currentList = [...(me?.family || [])];
      if (modalIndex !== null) {
        currentList[modalIndex] = modalData;
      } else {
        currentList.push(modalData);
      }
      updateMutation.mutate({ family: currentList });
    }
  };

  const handleDeleteNested = (section, index) => {
    if (!canEditProfile) return;
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    if (section === 'education') {
      const list = me?.education?.filter((_, i) => i !== index) || [];
      updateMutation.mutate({ education: list });
    } else if (section === 'work') {
      const list = me?.work_experience?.filter((_, i) => i !== index) || [];
      updateMutation.mutate({ work_experience: list });
    } else if (section === 'eligibility') {
      const list = me?.eligibilities?.filter((_, i) => i !== index) || [];
      updateMutation.mutate({ eligibilities: list });
    } else if (section === 'family') {
      const list = me?.family?.filter((_, i) => i !== index) || [];
      updateMutation.mutate({ family: list });
    }
  };

  const handleFieldChange = (key, val) => {
    setModalData(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={photoInputRef}
        onChange={handlePhotoSelect}
        accept="image/*"
        className="hidden"
      />
      <input 
        type="file" 
        ref={docInputRef}
        onChange={handleDocFileSelect}
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        className="hidden"
      />
      <input 
        type="file" 
        ref={idFileInputRef}
        onChange={handleIDFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Profile Header Card with Stats */}
      <ProfileHeader 
        me={me}
        profilePhoto={profilePhoto}
        onEditProfile={() => {
          if (!canEditProfile) return;
          setActiveModal('personal');
          setModalData({ ...me });
        }}
        onChangePhoto={() => {
          if (!canChangePhoto) return;
          photoInputRef.current?.click();
        }}
        simulatedDocs={simulatedDocs}
        completion={completion}
        canEditProfile={canEditProfile}
        canChangePhoto={canChangePhoto}
      />

      {/* Main Content: Left Tabs + Right Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tabs Navigation */}
          <div className="bg-white rounded-lg border border-slate-200 p-1.5 flex flex-nowrap sm:flex-wrap overflow-x-auto no-scrollbar gap-1 shadow-sm">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold shrink-0 whitespace-nowrap transition-colors ${
                    isSelected 
                      ? 'bg-[#0038A8] text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 md:p-6 shadow-sm">
            {activeTab === 'personal' && (
              <PersonalInfoTab 
                me={me}
                canEdit={canEditProfile}
                onEdit={() => {
                  if (!canEditProfile) return;
                  setActiveModal('personal');
                  setModalData({ ...me });
                }}
              />
            )}

            {activeTab === 'family' && (
              <FamilyBackgroundTab 
                me={me}
                canEdit={canEditProfile}
                onAdd={() => {
                  if (!canEditProfile) return;
                  setActiveModal('family');
                  setModalIndex(null);
                  setModalData({ relationship: 'SPOUSE', surname: '', first_name: '', middle_name: '', extension: '', occupation: '', employer: '', date_of_birth: '' });
                }}
                onEdit={(f, idx) => {
                  if (!canEditProfile) return;
                  setActiveModal('family');
                  setModalIndex(idx);
                  setModalData({ ...f });
                }}
                onDelete={(idx) => {
                  if (!canEditProfile) return;
                  handleDeleteNested('family', idx);
                }}
              />
            )}

            {activeTab === 'education' && (
              <EducationalBackgroundTab 
                me={me}
                canEdit={canEditProfile}
                onAdd={() => {
                  if (!canEditProfile) return;
                  setActiveModal('education');
                  setModalIndex(null);
                  setModalData({ level: 'BACCALAUREATE', school_name: '', degree_course: '', period_from: '', period_to: '', highest_level: '', year_graduated: '', honors_received: '' });
                }}
                onEdit={(e, idx) => {
                  if (!canEditProfile) return;
                  setActiveModal('education');
                  setModalIndex(idx);
                  setModalData({ ...e });
                }}
                onDelete={(idx) => {
                  if (!canEditProfile) return;
                  handleDeleteNested('education', idx);
                }}
              />
            )}

            {activeTab === 'eligibility' && (
              <CivilServiceEligibilityTab 
                me={me}
                canEdit={canEditProfile}
                onAdd={() => {
                  if (!canEditProfile) return;
                  setActiveModal('eligibility');
                  setModalIndex(null);
                  setModalData({ service: '', rating: '', date_of_exam: '', place_of_exam: '', license_no: '', license_date: '' });
                }}
                onEdit={(el, idx) => {
                  if (!canEditProfile) return;
                  setActiveModal('eligibility');
                  setModalIndex(idx);
                  setModalData({ ...el });
                }}
                onDelete={(idx) => {
                  if (!canEditProfile) return;
                  handleDeleteNested('eligibility', idx);
                }}
              />
            )}

            {activeTab === 'work' && (
              <WorkExperienceTab 
                me={me}
                canEdit={canEditProfile}
                onAdd={() => {
                  if (!canEditProfile) return;
                  setActiveModal('work');
                  setModalIndex(null);
                  setModalData({ date_from: '', date_to: '', position_title: '', agency: '', monthly_salary: '', salary_grade: '', status_of_appointment: 'PERMANENT', is_gov_service: false, is_present: false });
                }}
                onEdit={(w, idx) => {
                  if (!canEditProfile) return;
                  setActiveModal('work');
                  setModalIndex(idx);
                  setModalData({ ...w });
                }}
                onDelete={(idx) => {
                  if (!canEditProfile) return;
                  handleDeleteNested('work', idx);
                }}
              />
            )}

            {activeTab === 'ids' && (
              <VerifiedIDsTab 
                me={me}
                simulatedIDs={simulatedIDs}
                isAdmin={isAdmin}
                canEdit={canEditProfile}
                canVerify={canVerifyDocs}
                onPreview={handlePreviewIDCard}
                onTriggerUpload={triggerIDUpload}
                onDelete={handleDeleteID}
                onVerify={handleVerifyID}
              />
            )}

            {activeTab === 'documents' && (
              <DocumentChecklistTab 
                simulatedDocs={simulatedDocs}
                isAdmin={isAdmin}
                canEdit={canEditProfile}
                canVerify={canVerifyDocs}
                onPreview={handlePreviewDoc}
                onTriggerUpload={triggerDocUpload}
                onDelete={handleDeleteDoc}
                onVerify={handleVerifyDoc}
              />
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <ProfileSidebar 
          me={me}
          sigInputRef={sigInputRef}
          onSigUpload={handleSigUpload}
          isUploadingSig={isUploadingSig}
          canUploadSignature={canUploadSignature}
          workstation={workstation}
          pos={pos}
        />
      </div>

      {/* PDS Detail CRUD Modal */}
      <PDSDetailModal 
        activeModal={activeModal}
        modalData={modalData}
        modalIndex={modalIndex}
        onClose={() => {
          setActiveModal(null);
          setModalData(null);
          setModalIndex(null);
        }}
        onFieldChange={handleFieldChange}
        onSave={handleSaveModal}
        isPending={updateMutation.isPending}
      />

      {/* Document / ID Card Preview Modal */}
      <DocumentPreviewModal 
        previewFile={previewFile}
        onClose={() => setPreviewFile(null)}
        me={me}
      />
    </div>
  );
};

export default Profile;
