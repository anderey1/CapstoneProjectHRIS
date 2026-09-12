import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Key } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  TABS, 
  REQUIRED_DOCS_LIST, 
  GOVERNMENT_IDS_LIST,
  ProfileHeader,
  PersonalInfoTab,
  FamilyBackgroundTab,
  EducationalBackgroundTab,
  CivilServiceEligibilityTab,
  WorkExperienceTab,
  VerifiedIDsTab,
  DocumentChecklistTab,
  ProfileSidebar,
  PDSDetailModal,
  DocumentPreviewModal,
  loadProfilePhoto,
  saveProfilePhoto,
  loadProfileDocs,
  saveProfileDocs,
  loadProfileIDs,
  saveProfileIDs,
} from '../../features/profile';

/**
 * Clean Profile Page Orchestrator
 * 
 * Powered by feature-sliced profile modules.
 * Includes PDS details, documents checklist, verified IDs, 
 * signature upload, geolocation workstation card, and password security.
 */
const Profile = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();
  
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

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMessage, setPwMessage] = useState(null);
  const [isChangingPw, setIsChangingPw] = useState(false);

  // Fetch current user / employee details
  const { data: me, isLoading } = useQuery({
    queryKey: id ? ['employee', id] : ['me'],
    queryFn: () => {
      const endpoint = id ? `employees/${id}/` : 'employees/me/';
      return api.get(endpoint).then(res => res.data);
    }
  });

  const { data: myProfile } = useQuery({
    queryKey: ['me-profile-tab-check'],
    queryFn: () => api.get('employees/me/').then(res => res.data),
    enabled: !!id
  });

  const isOwnProfile = !id || 
    (Boolean(user?.employee_id) && String(user.employee_id) === String(id)) || 
    (Boolean(myProfile?.id) && String(myProfile.id) === String(id));

  const visibleTabs = isOwnProfile 
    ? [...TABS, { id: 'settings', label: 'Security & Settings', icon: Key }]
    : TABS;

  // Check user role and permissions strictly from authenticated session
  const currentUserRole = user?.role || localStorage.getItem('user_role') || 'TEACHING';
  const isHrOrSuperintendent = currentUserRole === 'HR' || currentUserRole === 'SUPERINTENDENT';
  const isAdmin = isHrOrSuperintendent || currentUserRole === 'ADMINISTRATIVE';

  // Personal PDS editing, photo changes, and digital signature upload are STRICTLY limited to the account owner
  const canEditProfile = isOwnProfile;
  const canChangePhoto = isOwnProfile;
  const canUploadSignature = isOwnProfile;
  const canVerifyDocs = isHrOrSuperintendent || currentUserRole === 'ADMINISTRATIVE';

  // Initialize photo and simulated storage
  useEffect(() => {
    if (me?.id) {
      setProfilePhoto(loadProfilePhoto(me.id));
      setSimulatedDocs(loadProfileDocs(me.id));
      setSimulatedIDs(loadProfileIDs(me.id));
    }
  }, [me?.id]);

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: (updatedData) => {
      const endpoint = id ? `employees/${id}/` : 'employees/me/';
      return api.patch(endpoint, updatedData);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(id ? ['employee', id] : ['me'], data);
      queryClient.invalidateQueries({ queryKey: [id ? ['employee', id] : ['me']] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setActiveModal(null);
      setModalData(null);
      setModalIndex(null);
      toast.success('Profile details saved successfully!');
    },
    onError: (err) => {
      console.error('Update failed:', err);
      toast.error('Failed to update details. Please verify your entries.');
    }
  });

  // Password Change Handler
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMessage(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPwMessage({ type: 'error', text: 'All password fields are required.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 8) {
      setPwMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    setIsChangingPw(true);
    try {
      const response = await api.post('employees/change-password/', {
        old_password: oldPassword,
        new_password: newPassword
      });
      setPwMessage({ type: 'success', text: response.data.message || 'Password updated successfully!' });
      toast.success('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to update password. Verify your old password.';
      setPwMessage({ type: 'error', text: msg });
      toast.error(msg);
    } finally {
      setIsChangingPw(false);
    }
  };

  // E-Signature upload
  const handleSigUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('e_signature', file);

    setIsUploadingSig(true);
    try {
      const endpoint = id ? `employees/${id}/` : 'employees/me/';
      const res = await api.patch(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      queryClient.setQueryData(id ? ['employee', id] : ['me'], res.data);
      toast.success('E-Signature uploaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload signature.');
    } finally {
      setIsUploadingSig(false);
    }
  };

  // Photo change handler
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file || !me?.id) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setProfilePhoto(base64);
      saveProfilePhoto(me.id, base64);
      toast.success('Profile photo updated!');
    };
    reader.readAsDataURL(file);
  };

  // Document Checklist simulation handlers
  const handleDocFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file || !activeDocUpload || !me?.id) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const updated = {
        ...simulatedDocs,
        [activeDocUpload]: {
          uploaded: true,
          fileName: file.name,
          uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          data: reader.result,
          verified: false
        }
      };
      setSimulatedDocs(updated);
      saveProfileDocs(me.id, updated);
      setActiveDocUpload(null);
      toast.success('Document uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const triggerDocUpload = (docKey) => {
    setActiveDocUpload(docKey);
    docInputRef.current?.click();
  };

  const handleDeleteDoc = (docKey) => {
    if (!me?.id) return;
    const updated = { ...simulatedDocs };
    delete updated[docKey];
    setSimulatedDocs(updated);
    saveProfileDocs(me.id, updated);
    toast.info('Document removed.');
  };

  const handleVerifyDoc = (docKey) => {
    if (!me?.id) return;
    const current = simulatedDocs[docKey];
    if (!current) return;
    const updated = {
      ...simulatedDocs,
      [docKey]: { ...current, verified: !current.verified }
    };
    setSimulatedDocs(updated);
    saveProfileDocs(me.id, updated);
    toast.success(updated[docKey].verified ? 'Document verified!' : 'Document unverified.');
  };

  const handlePreviewDoc = (docKey, docItem) => {
    const fileInfo = simulatedDocs[docKey];
    setPreviewFile({
      title: docItem.name,
      fileName: fileInfo?.fileName || `${docItem.key}.pdf`,
      data: fileInfo?.data || 'MOCK_PDF'
    });
  };

  // Verified IDs simulation handlers
  const handleIDFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file || !activeIDUpload || !me?.id) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const updated = {
        ...simulatedIDs,
        [activeIDUpload]: {
          uploaded: true,
          fileName: file.name,
          uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          data: reader.result,
          verified: false
        }
      };
      setSimulatedIDs(updated);
      saveProfileIDs(me.id, updated);
      setActiveIDUpload(null);
      toast.success('ID attachment uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const triggerIDUpload = (idKey) => {
    setActiveIDUpload(idKey);
    idFileInputRef.current?.click();
  };

  const handleDeleteID = (idKey) => {
    if (!me?.id) return;
    const updated = { ...simulatedIDs };
    delete updated[idKey];
    setSimulatedIDs(updated);
    saveProfileIDs(me.id, updated);
    toast.info('ID attachment removed.');
  };

  const handleVerifyID = (idKey) => {
    if (!me?.id) return;
    const current = simulatedIDs[idKey];
    if (!current) return;
    const updated = {
      ...simulatedIDs,
      [idKey]: { ...current, verified: !current.verified }
    };
    setSimulatedIDs(updated);
    saveProfileIDs(me.id, updated);
    toast.success(updated[idKey].verified ? 'ID verified!' : 'ID unverified.');
  };

  const handlePreviewIDCard = (idKey, item) => {
    const currentSim = simulatedIDs[idKey];
    setPreviewFile({
      title: item.label,
      number: me?.[idKey],
      fileName: currentSim?.fileName || `${item.id}_card.png`,
      data: currentSim?.data || 'MOCK_CARD'
    });
  };

  // Save Modal Action for PDS CRUD
  const handleSaveModal = () => {
    if (!modalData) return;

    if (activeModal === 'personal') {
      updateMutation.mutate(modalData);
    } else {
      const currentList = [...(me?.[activeModal] || [])];
      if (modalIndex !== null) {
        currentList[modalIndex] = modalData;
      } else {
        currentList.push(modalData);
      }
      updateMutation.mutate({ [activeModal]: currentList });
    }
  };

  const handleDeleteNested = (field, index) => {
    if (window.confirm('Delete this record entry?')) {
      const currentList = [...(me?.[field] || [])];
      currentList.splice(index, 1);
      updateMutation.mutate({ [field]: currentList });
    }
  };

  const handleFieldChange = (key, value) => {
    setModalData((prev) => ({ ...prev, [key]: value }));
  };

  // Profile completion score
  const getProfileCompletion = () => {
    if (!me) return 0;
    const fields = [
      me.first_name, me.last_name, me.email || me.user_details?.email, me.mobile_no,
      me.residential_address, me.tin_no, me.gsis_bp_no, me.position, me.department,
      me.education?.length > 0, me.civil_status, me.date_of_birth
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  const completion = getProfileCompletion();
  const workstation = me?.school_details || {
    name: 'DepEd Division Office of Lucena City',
    latitude: 13.9374,
    longitude: 121.6171
  };
  const pos = {
    lat: workstation?.latitude ? Number(workstation.latitude) : 13.9374,
    lng: workstation?.longitude ? Number(workstation.longitude) : 121.6171
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center h-[60vh] items-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-[180ms]">
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={photoInputRef}
        onChange={handlePhotoChange}
        accept="image/*"
        className="hidden"
      />
      <input 
        type="file" 
        ref={sigInputRef}
        onChange={handleSigUpload}
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
            {visibleTabs.map((tab) => {
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

            {activeTab === 'settings' && isOwnProfile && (
              <div className="space-y-6 animate-in fade-in duration-[180ms]">
                <div className="border-b border-slate-200 pb-4">
                  <h3 className="text-base font-bold text-slate-900">Security & Account Settings</h3>
                  <p className="text-xs text-slate-500 mt-1">Manage your portal password and login security credentials.</p>
                </div>

                <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                  {pwMessage && (
                    <div className={`p-3 rounded-lg text-xs font-medium ${
                      pwMessage.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {pwMessage.text}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                    <input 
                      type="password" 
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input input-bordered input-sm rounded-lg w-full text-xs font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input input-bordered input-sm rounded-lg w-full text-xs font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input input-bordered input-sm rounded-lg w-full text-xs font-mono"
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isChangingPw}
                    className="btn bg-[#0038A8] hover:bg-[#002d86] text-white btn-sm rounded-lg text-xs font-medium px-5 border-none"
                  >
                    {isChangingPw ? 'Updating Password...' : 'Update Password'}
                  </button>
                </form>
              </div>
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
