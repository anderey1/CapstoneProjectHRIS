import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User, Mail, Briefcase, MapPin, 
  Camera, Fingerprint, UserCircle, Users, 
  GraduationCap, Award, History, Globe, 
  ShieldCheck, Loader2, X, CheckCircle2, 
  Signature, Plus, Pencil, Trash2, FileText, 
  Download, Upload, AlertCircle, AlertTriangle,
  FileCheck, Shield, FileX, Sparkles, Building2, Check, Key
} from 'lucide-react';
import api from '../../api/axios';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';

const TABS = [
  { id: 'personal', label: 'Personal Information', icon: User },
  { id: 'family', label: 'Family Background', icon: Users },
  { id: 'education', label: 'Educational Background', icon: GraduationCap },
  { id: 'eligibility', label: 'Eligibility', icon: Award },
  { id: 'work', label: 'Work Experience', icon: History },
  { id: 'ids', label: 'Verified IDs', icon: Fingerprint },
  { id: 'documents', label: 'Required Documents', icon: FileText }
];

const REQUIRED_DOCS_LIST = [
  { key: 'letter_of_intent', name: 'Letter of Intent', description: 'Addressed to Schools Division Superintendent Susan D. Orbiana.', mandatory: true },
  { key: 'pds_file', name: 'Personal Data Sheet (PDS)', description: 'Duly accomplished and notarized Current/Revised 2025 PDS.', mandatory: true },
  { key: 'tor', name: 'Transcript of Records (TOR)', description: 'Complete academic records including graduate/post-graduate units.', mandatory: true },
  { key: 'checklist', name: 'Checklist of Requirements', description: 'Duly signed Checklist of Requirements.', mandatory: true },
  { key: 'omnibus', name: 'Omnibus Sworn Statement', description: 'Notarized Omnibus Sworn Statement.', mandatory: true },
  { key: 'cav', name: 'Certification on the Authenticity (CAV)', description: 'CAV of submitted school documents.', mandatory: true },
  { key: 'privacy_consent', name: 'Data Privacy Consent Form', description: 'Signed Data Privacy Consent Form.', mandatory: true },
  { key: 'prc_documents', name: 'PRC ID / License', description: 'Photocopy of Professional Regulation Commission ID/License (if applicable).', mandatory: false },
  { key: 'eligibility_certificate', name: 'Eligibility Certificate', description: 'Photocopy of rating or certificate (if applicable).', mandatory: false },
  { key: 'employment_documents', name: 'Employment Documents', description: 'Service Record or Certificate of Employment.', mandatory: false },
  { key: 'latest_appointment', name: 'Latest Appointment', description: 'Copy of latest employment appointment.', mandatory: false },
  { key: 'performance_rating', name: 'Performance Rating', description: 'Performance rating for the latest period (if applicable).', mandatory: false },
  { key: 'certificates_of_training', name: 'Certificates of Training', description: 'Completed training certificates.', mandatory: false },
  { key: 'specialized_training', name: 'Specialized Training', description: 'Specialized training credentials.', mandatory: false }
];

const GOVERNMENT_IDS_LIST = [
  { id: 'umid_id', label: 'UMID Card', desc: 'Unified Multi-Purpose ID' },
  { id: 'pagibig_id', label: 'Pag-IBIG ID', desc: 'HDMF Pag-IBIG Membership Card' },
  { id: 'philhealth_no', label: 'PhilHealth Member ID', desc: 'PhilHealth Identification Card' },
  { id: 'philsys_id', label: 'National ID (PhilSys)', desc: 'Philippine Identification System Card' },
  { id: 'tin_no', label: 'TIN / BIR ID', desc: 'Taxpayer Identification Number ID' },
  { id: 'agency_employee_no', label: 'Agency Employee ID', desc: 'DepEd Official Employee ID Card' }
];

const Profile = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  
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

  const { data: myProfile } = useQuery({
    queryKey: ['me-profile-tab-check'],
    queryFn: () => api.get('employees/me/').then(res => res.data),
    enabled: !!id
  });

  const isOwnProfile = !id || (myProfile && String(myProfile.id) === String(id)) || (me && String(me.id) === String(id));
  const visibleTabs = isOwnProfile 
    ? [...TABS, { id: 'settings', label: 'Security & Settings', icon: Key }]
    : TABS;

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMessage, setPwMessage] = useState(null);
  const [isChangingPw, setIsChangingPw] = useState(false);

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
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwMessage({ 
        type: 'error', 
        text: err.response?.data?.error || err.response?.data?.detail || 'Failed to update password. Verify your old password.' 
      });
    } finally {
      setIsChangingPw(false);
    }
  };

  // Check user role for admin features
  const userRole = localStorage.getItem('user_role') || me?.user_details?.role || 'TEACHING';
  const isAdmin = userRole === 'HR' || userRole === 'SUPERINTENDENT' || userRole === 'ADMINISTRATIVE';

  // Load localStorage mocks on component mount / profile data load
  useEffect(() => {
    if (me?.id) {
      const storedPhoto = localStorage.getItem(`hris_profile_photo_${me.id}`);
      if (storedPhoto) setProfilePhoto(storedPhoto);

      const storedDocs = localStorage.getItem(`hris_profile_docs_${me.id}`);
      if (storedDocs) {
        setSimulatedDocs(JSON.parse(storedDocs));
      } else {
        // Build initial checklist status
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
        // Populate existing values
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
    const file = e.target.files[0];
    if (file) {
      setIsUploadingSig(true);
      sigMutation.mutate(file);
    }
  };

  // Profile Photo Upload Handlers
  const handlePhotoSelect = (e) => {
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

  // Required Documents Simulated Upload Handlers
  const triggerDocUpload = (docKey) => {
    setActiveDocUpload(docKey);
    docInputRef.current?.click();
  };

  const handleDocFileSelect = (e) => {
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
    if (window.confirm("Are you sure you want to delete this document upload?")) {
      const updated = { ...simulatedDocs };
      delete updated[docKey];
      setSimulatedDocs(updated);
      localStorage.setItem(`hris_profile_docs_${me.id}`, JSON.stringify(updated));
    }
  };

  const handleVerifyDoc = (docKey, status) => {
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

  // Government Verified ID File Upload Handlers
  const triggerIDUpload = (idKey) => {
    setActiveIDUpload(idKey);
    idFileInputRef.current?.click();
  };

  const handleIDFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && activeIDUpload && me?.id) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Ask for the ID Number
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

          // Call the backend PATCH to update ID text field in the database
          updateMutation.mutate({ [activeIDUpload]: idNumber });
        }
        setActiveIDUpload(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteID = (idKey) => {
    if (window.confirm(`Are you sure you want to delete the uploaded card and number for this ID?`)) {
      const updated = { ...simulatedIDs };
      delete updated[idKey];
      setSimulatedIDs(updated);
      localStorage.setItem(`hris_profile_ids_${me.id}`, JSON.stringify(updated));

      // Reset ID number on backend
      updateMutation.mutate({ [idKey]: '' });
    }
  };

  const handleVerifyID = (idKey, status) => {
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
      alert("No visual mockup uploaded. Simulating preview container.");
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
      // Simulate placeholder thumbnail
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

  // Profile Completion Calculation
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

  // Save Modal Action
  const handleSaveModal = () => {
    if (!modalData) return;
    
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

  // Delete Action
  const handleDeleteNested = (section, index) => {
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

  // Form Fields Change Helpers
  const handleFieldChange = (key, val) => {
    setModalData(prev => ({ ...prev, [key]: val }));
  };

  // Document Counts
  const uploadedDocsCount = REQUIRED_DOCS_LIST.filter(doc => simulatedDocs[doc.key]).length;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Hidden File Inputs for Photo/Docs/IDs */}
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

      {/* Simple Profile Header */}
      <div className="bg-white p-6 rounded-lg border border-base-200 flex flex-col md:flex-row items-center gap-6">
        
        {/* Simple Profile Photo */}
        <div className="w-24 h-24 bg-base-100 rounded-full flex items-center justify-center border border-base-300 overflow-hidden shrink-0 relative">
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile Photo" className="w-full h-full object-cover" />
          ) : (
            <UserCircle size={80} className="text-base-content opacity-30" />
          )}
        </div>

        <div className="flex-1 space-y-1 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h1 className="text-xl font-bold text-base-content">
              {me?.first_name} {me?.last_name}
            </h1>
            <span className="px-2 py-0.5 bg-base-100 border text-base-content/75 rounded text-[9px] font-bold uppercase">
              {me?.user_details?.role || 'STAFF'}
            </span>
          </div>
          
          <p className="text-xs text-base-content/60 font-semibold">
            {me?.position || 'Teacher I'} • {me?.department || 'Operations'}
          </p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 text-[11px] text-base-content/50">
            <span>Email: {me?.email || me?.user_details?.email}</span>
            {me?.mobile_no && <span>Mobile: {me.mobile_no}</span>}
            <span>ID: #{me?.id}</span>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <button 
            onClick={() => {
              setActiveModal('personal');
              setModalData({ ...me });
            }}
            className="btn btn-outline btn-sm rounded-lg text-xs"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Summary Statistics Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Profile Completion Card */}
        <div className="bg-white border border-base-200 rounded-lg p-4 flex items-center justify-between gap-4">
          <div>
            <span className="text-[9px] font-black text-base-content/40 uppercase tracking-wider block">Profile Completion</span>
            <span className="text-xl font-black text-base-content mt-1 block">{completion}% Completed</span>
          </div>
        </div>

        {/* 2. Submitted Applications Card */}
        <div className="bg-white border border-base-200 rounded-lg p-4 flex items-center justify-between gap-4">
          <div>
            <span className="text-[9px] font-black text-base-content/40 uppercase tracking-wider block">Submitted Applications</span>
            <span className="text-xl font-black text-base-content mt-1 block">1 Active Form</span>
          </div>
        </div>

        {/* 3. Uploaded Documents Card */}
        <div className="bg-white border border-base-200 rounded-lg p-4 flex items-center justify-between gap-4">
          <div>
            <span className="text-[9px] font-black text-base-content/40 uppercase tracking-wider block">Uploaded Documents</span>
            <span className="text-xl font-black text-base-content mt-1 block">{uploadedDocsCount} / {REQUIRED_DOCS_LIST.length} Files</span>
          </div>
        </div>

        {/* 4. Eligibility Status Card */}
        <div className="bg-white border border-base-200 rounded-lg p-4 flex items-center justify-between gap-4">
          <div>
            <span className="text-[9px] font-black text-base-content/40 uppercase tracking-wider block">Eligibility Status</span>
            <span className="text-xl font-black text-base-content mt-1 block truncate max-w-[160px]">
              {me?.eligibilities?.length > 0 ? me.eligibilities[0].service : 'Not Specified'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Main Tabbed Layout Container */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Simple Tab Navigation */}
          <div className="bg-white rounded-lg border border-base-200 p-1 flex flex-wrap gap-1">
            {visibleTabs.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold ${
                    isSelected 
                      ? 'bg-primary text-white font-bold' 
                      : 'text-base-content/75 hover:bg-base-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Display Panel Container */}
          <div className="bg-white border border-base-200 rounded-lg p-6">
            
            {/* 1. PERSONAL INFORMATION */}
            {activeTab === 'personal' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center border-b border-base-100 pb-4">
                  <div>
                    <h3 className="text-sm font-black text-[#0038A8] uppercase tracking-wider">Personal details</h3>
                    <p className="text-[10px] font-medium text-base-content/40 mt-0.5">Verify and update your basic profile variables</p>
                  </div>
                  <button 
                    onClick={() => {
                      setActiveModal('personal');
                      setModalData({ ...me });
                    }}
                    className="btn btn-ghost hover:bg-[#0038A8]/10 btn-sm text-[#0038A8] font-black uppercase flex items-center gap-1 px-3"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-base-content">
                  <div className="p-4 bg-base-50/40 rounded-2xl border border-base-100">
                    <p className="text-[9px] font-black uppercase text-base-content/40 tracking-wider">Full Name</p>
                    <p className="font-bold text-base-content mt-1 uppercase text-sm">
                      {me?.first_name} {me?.middle_name || ''} {me?.last_name} {me?.name_extension || ''}
                    </p>
                  </div>
                  <div className="p-4 bg-base-50/40 rounded-2xl border border-base-100">
                    <p className="text-[9px] font-black uppercase text-base-content/40 tracking-wider">Gender</p>
                    <p className="font-bold text-base-content mt-1 uppercase text-sm">{me?.sex || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-base-50/40 rounded-2xl border border-base-100">
                    <p className="text-[9px] font-black uppercase text-base-content/40 tracking-wider">Date of Birth</p>
                    <p className="font-bold text-base-content mt-1 text-sm">{me?.date_of_birth ? new Date(me.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-base-50/40 rounded-2xl border border-base-100">
                    <p className="text-[9px] font-black uppercase text-base-content/40 tracking-wider">Civil Status</p>
                    <p className="font-bold text-base-content mt-1 uppercase text-sm">{me?.civil_status || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-base-50/40 rounded-2xl border border-base-100 text-xs">
                    <p className="text-[9px] font-black uppercase text-base-content/40 tracking-wider">Place of Birth</p>
                    <p className="font-bold text-base-content mt-1 uppercase leading-normal">{me?.place_of_birth || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-base-50/40 rounded-2xl border border-base-100">
                    <p className="text-[9px] font-black uppercase text-base-content/40 tracking-wider">Contact Number</p>
                    <p className="font-bold text-base-content mt-1 text-sm">{me?.mobile_no || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-base-50/40 rounded-2xl border border-base-100 sm:col-span-2 text-xs">
                    <p className="text-[9px] font-black uppercase text-base-content/40 tracking-wider">Residential Address</p>
                    <p className="font-bold text-base-content mt-1 uppercase leading-relaxed text-[11px]">{me?.residential_address || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-base-50/40 rounded-2xl border border-base-100 sm:col-span-2 text-xs">
                    <p className="text-[9px] font-black uppercase text-base-content/40 tracking-wider">Permanent Address</p>
                    <p className="font-bold text-base-content mt-1 uppercase leading-relaxed text-[11px]">{me?.permanent_address || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. FAMILY BACKGROUND */}
            {activeTab === 'family' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center border-b border-base-100 pb-4">
                  <div>
                    <h3 className="text-sm font-black text-[#0038A8] uppercase tracking-wider">Family Background</h3>
                    <p className="text-[10px] font-medium text-base-content/40 mt-0.5">Manage immediate family members and relations</p>
                  </div>
                  <button 
                    onClick={() => {
                      setActiveModal('family');
                      setModalIndex(null);
                      setModalData({ relationship: 'SPOUSE', surname: '', first_name: '', middle_name: '', extension: '', occupation: '', employer: '', date_of_birth: '' });
                    }}
                    className="btn btn-outline btn-sm rounded-lg border-base-300 font-black text-[#0038A8] hover:bg-[#0038A8] hover:text-white uppercase flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Member
                  </button>
                </div>

                {me?.family?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {me.family.map((f, idx) => (
                      <div key={idx} className="p-5 bg-white border border-base-200 rounded-2xl space-y-3 relative group hover:border-[#0038A8]/20 hover:shadow-md transition-all shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-black text-xs uppercase tracking-tight text-base-content">
                              {f.relationship === 'CHILD' ? f.full_name : `${f.first_name} ${f.surname}`}
                            </p>
                            <span className="px-2.5 py-0.5 bg-[#0038A8]/10 text-[#0038A8] border border-primary/5 rounded-full text-[8px] font-black uppercase tracking-wider mt-1.5 inline-block">
                              {f.relationship}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                  setActiveModal('family');
                                  setModalIndex(idx);
                                  setModalData({ ...f });
                              }}
                              className="btn btn-ghost btn-xs text-primary px-1 min-h-0 h-6"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteNested('family', idx)}
                              className="btn btn-ghost btn-xs text-error px-1 min-h-0 h-6"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="text-[10px] font-bold text-base-content/50 uppercase border-t border-base-100 pt-2 space-y-1.5">
                          {f.occupation && (
                            <div>Occupation: <span className="text-base-content">{f.occupation}</span></div>
                          )}
                          {f.employer && (
                            <div>Employer: <span className="text-base-content">{f.employer}</span></div>
                          )}
                          {f.date_of_birth && (
                            <div>Date of Birth: <span className="text-base-content">{new Date(f.date_of_birth).toLocaleDateString()}</span></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-base-50/30 border-2 border-dashed border-base-200 rounded-2xl space-y-4">
                    <div className="w-12 h-12 bg-base-100 border border-base-200 rounded-full flex items-center justify-center mx-auto text-base-content/30 shadow-inner">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-base-content/60 tracking-wider">No Family Members Registered</p>
                      <p className="text-[10px] font-bold text-base-content/30 mt-1 max-w-[280px] mx-auto">Please add your family background information to complete your profile details.</p>
                    </div>
                    <button 
                      onClick={() => {
                        setActiveModal('family');
                        setModalIndex(null);
                        setModalData({ relationship: 'SPOUSE', surname: '', first_name: '', middle_name: '', extension: '', occupation: '', employer: '', date_of_birth: '' });
                      }}
                      className="btn bg-[#0038A8] hover:bg-[#002d86] text-white btn-xs font-black uppercase tracking-wider rounded-lg h-9 px-4 transition-all"
                    >
                      Add Spouse or Child
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. EDUCATIONAL BACKGROUND */}
            {activeTab === 'education' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center border-b border-base-100 pb-4">
                  <div>
                    <h3 className="text-sm font-black text-[#0038A8] uppercase tracking-wider">Educational Background</h3>
                    <p className="text-[10px] font-medium text-base-content/40 mt-0.5">Manage your academic credentials and degrees</p>
                  </div>
                  <button 
                    onClick={() => {
                      setActiveModal('education');
                      setModalIndex(null);
                      setModalData({ level: 'BACCALAUREATE', school_name: '', degree_course: '', period_from: '', period_to: '', highest_level: '', year_graduated: '', honors_received: '' });
                    }}
                    className="btn btn-outline btn-sm rounded-lg border-base-300 font-black text-[#0038A8] hover:bg-[#0038A8] hover:text-white uppercase flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Education
                  </button>
                </div>

                {me?.education?.length > 0 ? (
                  <div className="space-y-4">
                    {me.education.map((e, idx) => (
                      <div key={idx} className="flex gap-4 p-5 bg-white border border-base-200 rounded-2xl relative group hover:border-[#0038A8]/20 hover:shadow-md transition-all shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center font-black text-xs uppercase shrink-0 border border-primary/10 shadow-inner">
                          {e.level?.charAt(0) || 'E'}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h4 className="font-black text-xs uppercase tracking-tight text-base-content">
                                {e.school_name}
                              </h4>
                              <p className="text-[10px] font-bold text-base-content/50 uppercase mt-0.5">
                                {e.degree_course || 'No course specified'}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button 
                                onClick={() => {
                                  setActiveModal('education');
                                  setModalIndex(idx);
                                  setModalData({ ...e });
                                }}
                                className="btn btn-ghost btn-xs text-primary px-1 min-h-0 h-6"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteNested('education', idx)}
                                className="btn btn-ghost btn-xs text-error px-1 min-h-0 h-6"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-[9px] font-black uppercase text-[#0038A8] mt-4 border-t border-base-100 pt-3">
                            <span>Level: {e.level?.replace('_', ' ')}</span>
                            <span>Inclusive Dates: {e.period_from || 'N/A'} - {e.period_to || 'N/A'}</span>
                            {e.year_graduated && <span>Graduated: {e.year_graduated}</span>}
                            {e.honors_received && (
                              <span className="text-success text-[8.5px] px-2 py-0.5 bg-success/10 border border-success/10 rounded-full flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Honors: {e.honors_received}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-base-50/30 border-2 border-dashed border-base-200 rounded-2xl space-y-4">
                    <div className="w-12 h-12 bg-base-100 border border-base-200 rounded-full flex items-center justify-center mx-auto text-base-content/30 shadow-inner">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-base-content/60 tracking-wider">No Education Credentials Added</p>
                      <p className="text-[10px] font-bold text-base-content/30 mt-1 max-w-[280px] mx-auto">Please add your schools, inclusive dates, degrees, and academic achievements to finish recruitment forms.</p>
                    </div>
                    <button 
                      onClick={() => {
                        setActiveModal('education');
                        setModalIndex(null);
                        setModalData({ level: 'BACCALAUREATE', school_name: '', degree_course: '', period_from: '', period_to: '', highest_level: '', year_graduated: '', honors_received: '' });
                      }}
                      className="btn bg-[#0038A8] hover:bg-[#002d86] text-white btn-xs font-black uppercase tracking-wider rounded-lg h-9 px-4 transition-all"
                    >
                      Add Degree or School
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 4. ELIGIBILITY */}
            {activeTab === 'eligibility' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center border-b border-base-100 pb-4">
                  <div>
                    <h3 className="text-sm font-black text-[#0038A8] uppercase tracking-wider">Eligibility & Certifications</h3>
                    <p className="text-[10px] font-medium text-base-content/40 mt-0.5">Manage Civil Service or Board qualifications</p>
                  </div>
                  <button 
                    onClick={() => {
                      setActiveModal('eligibility');
                      setModalIndex(null);
                      setModalData({ service: '', rating: '', date_of_exam: '', place_of_exam: '', license_no: '', license_date: '' });
                    }}
                    className="btn btn-outline btn-sm rounded-lg border-base-300 font-black text-[#0038A8] hover:bg-[#0038A8] hover:text-white uppercase flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Certification
                  </button>
                </div>

                {me?.eligibilities?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {me.eligibilities.map((el, idx) => (
                      <div key={idx} className="p-5 bg-white border border-base-200 rounded-2xl relative group hover:border-[#0038A8]/20 hover:shadow-md transition-all shadow-sm space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="font-black text-xs uppercase tracking-tight text-base-content pr-8">{el.service}</p>
                            <span className="px-2 py-0.5 bg-success/10 text-success border border-success/5 rounded-full text-[8.5px] font-black uppercase tracking-wider mt-1.5 inline-block">
                              Rating: {el.rating || 'Passed'}%
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-4">
                            <button 
                              onClick={() => {
                                  setActiveModal('eligibility');
                                  setModalIndex(idx);
                                  setModalData({ ...el });
                              }}
                              className="btn btn-ghost btn-xs text-primary px-1 min-h-0 h-6"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteNested('eligibility', idx)}
                              className="btn btn-ghost btn-xs text-error px-1 min-h-0 h-6"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="text-[9px] font-black uppercase text-base-content/40 pt-3 border-t border-base-100 space-y-1">
                          {el.date_of_exam && <p>Exam Date: <span className="text-base-content font-bold">{new Date(el.date_of_exam).toLocaleDateString()}</span></p>}
                          {el.place_of_exam && <p>Exam Place: <span className="text-base-content font-bold">{el.place_of_exam}</span></p>}
                          {el.license_no && <p>License No: <span className="text-base-content font-bold">{el.license_no}</span></p>}
                          {el.license_date && <p>License Validity: <span className="text-base-content font-bold">{new Date(el.license_date).toLocaleDateString()}</span></p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-base-50/30 border-2 border-dashed border-base-200 rounded-2xl space-y-4">
                    <div className="w-12 h-12 bg-base-100 border border-base-200 rounded-full flex items-center justify-center mx-auto text-base-content/30 shadow-inner">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-base-content/60 tracking-wider">No Eligibility Credentials Added</p>
                      <p className="text-[10px] font-bold text-base-content/30 mt-1 max-w-[280px] mx-auto">Please add active licenses or Civil Service exam pass certificates to authorize your recruitment.</p>
                    </div>
                    <button 
                      onClick={() => {
                        setActiveModal('eligibility');
                        setModalIndex(null);
                        setModalData({ service: '', rating: '', date_of_exam: '', place_of_exam: '', license_no: '', license_date: '' });
                      }}
                      className="btn bg-[#0038A8] hover:bg-[#002d86] text-white btn-xs font-black uppercase tracking-wider rounded-lg h-9 px-4 transition-all"
                    >
                      Add Board or CSC Exam
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 5. WORK EXPERIENCE */}
            {activeTab === 'work' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center border-b border-base-100 pb-4">
                  <div>
                    <h3 className="text-sm font-black text-[#0038A8] uppercase tracking-wider">Work History & Experience</h3>
                    <p className="text-[10px] font-medium text-base-content/40 mt-0.5">Manage your past job records and professional timeline</p>
                  </div>
                  <button 
                    onClick={() => {
                      setActiveModal('work');
                      setModalIndex(null);
                      setModalData({ date_from: '', date_to: '', position_title: '', agency: '', monthly_salary: '', salary_grade: '', status_of_appointment: 'PERMANENT', is_gov_service: false, is_present: false });
                    }}
                    className="btn btn-outline btn-sm rounded-lg border-base-300 font-black text-[#0038A8] hover:bg-[#0038A8] hover:text-white uppercase flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Experience
                  </button>
                </div>

                {me?.work_experience?.length > 0 ? (
                  <div className="space-y-4 relative pl-6 border-l-2 border-base-200 ml-3 py-1">
                    {me.work_experience.map((w, idx) => (
                      <div key={idx} className="relative group p-5 bg-white border border-base-200 rounded-2xl hover:border-[#0038A8]/20 hover:shadow-md transition-all shadow-sm space-y-3">
                        {/* Timeline Circle Node */}
                        <div className="absolute w-3.5 h-3.5 bg-[#0038A8] rounded-full -left-[31.5px] top-6 border-2 border-white ring-4 ring-[#0038A8]/10 shadow-sm"></div>
                        
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[9px] font-black uppercase text-[#0038A8] tracking-wider bg-[#0038A8]/15 border border-[#0038A8]/5 px-2.5 py-0.5 rounded-full">
                              {w.date_from ? new Date(w.date_from).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : ''} — {w.is_present ? 'Present' : (w.date_to ? new Date(w.date_to).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : '')}
                            </span>
                            <h4 className="font-black text-xs uppercase tracking-tight text-base-content mt-2">
                              {w.position_title}
                            </h4>
                            <p className="text-[10px] font-bold text-base-content/40 uppercase mt-0.5">
                              {w.agency}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                  setActiveModal('work');
                                  setModalIndex(idx);
                                  setModalData({ ...w });
                              }}
                              className="btn btn-ghost btn-xs text-primary px-1 min-h-0 h-6"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteNested('work', idx)}
                              className="btn btn-ghost btn-xs text-error px-1 min-h-0 h-6"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-[9px] font-black uppercase text-base-content/65 pt-3 border-t border-base-100">
                          <span>Salary: ₱{parseFloat(w.monthly_salary || 0).toLocaleString()} / mo</span>
                          {w.salary_grade && (
                            <span className="bg-[#FCD116]/10 text-amber-800 border border-amber-500/10 px-2 py-0.5 rounded-full font-black text-[8px]">
                              Salary Grade: {w.salary_grade}
                            </span>
                          )}
                          <span>Service: {w.is_gov_service ? 'Government' : 'Private'}</span>
                          <span>Status: {w.status_of_appointment}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-base-50/30 border-2 border-dashed border-base-200 rounded-2xl space-y-4">
                    <div className="w-12 h-12 bg-base-100 border border-base-200 rounded-full flex items-center justify-center mx-auto text-base-content/30 shadow-inner">
                      <History className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-base-content/60 tracking-wider">No Work History Added</p>
                      <p className="text-[10px] font-bold text-base-content/30 mt-1 max-w-[280px] mx-auto">Please add your past employment positions, salary details, and inclusive working dates.</p>
                    </div>
                    <button 
                      onClick={() => {
                        setActiveModal('work');
                        setModalIndex(null);
                        setModalData({ date_from: '', date_to: '', position_title: '', agency: '', monthly_salary: '', salary_grade: '', status_of_appointment: 'PERMANENT', is_gov_service: false, is_present: false });
                      }}
                      className="btn bg-[#0038A8] hover:bg-[#002d86] text-white btn-xs font-black uppercase tracking-wider rounded-lg h-9 px-4 transition-all"
                    >
                      Add Job Record
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 6. VERIFIED GOVT IDS */}
            {activeTab === 'ids' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-base-100 pb-4">
                  <h3 className="text-sm font-black text-[#0038A8] uppercase tracking-wider">Government Verified IDs</h3>
                  <p className="text-[10px] font-medium text-base-content/40 mt-0.5">Scanned files and ID validation credentials</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {GOVERNMENT_IDS_LIST.map((doc) => {
                    const number = me?.[doc.id];
                    const idData = simulatedIDs[doc.id];
                    const hasFile = !!idData?.fileName;
                    const isVerified = !!idData?.verified;
                    const uploadDate = idData?.uploadDate;

                    return (
                      <div key={doc.id} className="p-5 bg-white border border-base-200 rounded-2xl hover:border-[#0038A8]/20 hover:shadow-md transition-all flex flex-col justify-between space-y-4 shadow-sm relative group">
                        
                        <div className="flex gap-4 items-start">
                          {/* Mini Stylized Card Mockup */}
                          <div className="w-16 h-10 bg-gradient-to-br from-[#0038A8]/10 to-[#0038A8]/5 border border-[#0038A8]/10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative shadow-inner">
                            {hasFile ? (
                              <div className="w-full h-full relative flex items-center justify-center bg-blue-900/10">
                                <FileText className="w-4 h-4 text-[#0038A8]" />
                                <div className="absolute inset-0 bg-[#0038A8]/5 opacity-40"></div>
                              </div>
                            ) : (
                              <Fingerprint className="w-5 h-5 text-[#0038A8]/45" />
                            )}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-black text-xs uppercase tracking-tight text-base-content truncate pr-4">{doc.label}</h4>
                            </div>
                            <p className="text-[8.5px] font-bold text-base-content/30 uppercase mt-0.5 leading-none">{doc.desc}</p>
                            
                            {number ? (
                              <p className="text-xs font-black text-[#0038A8] tracking-wider mt-2.5 bg-[#0038A8]/5 px-2 py-1 rounded inline-block">{number}</p>
                            ) : (
                              <p className="text-xs font-semibold opacity-30 italic mt-2.5">Not Provided</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-[9px] pt-3 border-t border-base-100">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold opacity-30 uppercase tracking-widest text-[8px]">Status</span>
                            <span className={`font-black uppercase tracking-wider flex items-center gap-1 ${
                              number ? (isVerified ? 'text-success' : 'text-warning') : 'text-base-content/30'
                            }`}>
                              {number ? (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  {isVerified ? 'Verified' : 'Pending Verification'}
                                </>
                              ) : 'Missing'}
                            </span>
                          </div>
                          
                          {uploadDate && (
                            <div className="flex flex-col gap-0.5 text-right">
                              <span className="font-bold opacity-30 uppercase tracking-widest text-[8px]">Uploaded</span>
                              <span className="font-bold text-base-content/65">{uploadDate}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions buttons */}
                        <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-base-100">
                          {number ? (
                            <>
                              <button 
                                onClick={() => handlePreviewIDCard(doc)}
                                className="btn btn-ghost hover:bg-[#0038A8]/5 btn-xs text-[#0038A8] font-black uppercase px-2 min-h-0 h-7"
                              >
                                Preview
                              </button>
                              <button 
                                onClick={() => triggerIDUpload(doc.id)}
                                className="btn btn-ghost hover:bg-secondary/5 btn-xs text-secondary font-black uppercase px-2 min-h-0 h-7"
                              >
                                Replace
                              </button>
                              <button 
                                onClick={() => handleDeleteID(doc.id)}
                                className="btn btn-ghost hover:bg-error/5 btn-xs text-error font-black uppercase px-2 min-h-0 h-7"
                              >
                                Delete
                              </button>
                              
                              {/* Admin Approval Control Override */}
                              {isAdmin && !isVerified && (
                                <button 
                                  onClick={() => handleVerifyID(doc.id, true)}
                                  className="btn btn-success text-white btn-xs font-black uppercase px-2.5 min-h-0 h-7 rounded-lg shadow-sm"
                                >
                                  Approve ID
                                </button>
                              )}
                            </>
                          ) : (
                            <div className="w-full flex justify-end">
                              <button 
                                onClick={() => triggerIDUpload(doc.id)}
                                className="btn bg-[#0038A8] hover:bg-[#002d86] text-white btn-xs font-black uppercase tracking-wider rounded-lg h-8 px-3 transition-all flex items-center gap-1.5"
                              >
                                <Upload className="w-3.5 h-3.5" /> Upload ID Card
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 7. REQUIRED DOCUMENTS */}
            {activeTab === 'documents' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-base-100 pb-4">
                  <h3 className="text-sm font-black text-[#0038A8] uppercase tracking-wider">Required Documents Module</h3>
                  <p className="text-[10px] font-medium text-base-content/40 mt-0.5">Submit and verify mandatory recruitment documents</p>
                </div>

                <div className="space-y-3">
                  {REQUIRED_DOCS_LIST.map((doc) => {
                    const docData = simulatedDocs[doc.key];
                    const hasFile = !!docData;
                    const uploadDate = docData?.uploadDate;
                    const isDocVerified = !!docData?.verified;
                    const fileName = docData?.fileName;

                    return (
                      <div key={doc.key} className="p-4 bg-white border border-base-200 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-[#0038A8]/20 hover:shadow-md transition-all shadow-sm relative group">
                        
                        <div className="flex gap-4 items-start min-w-0 flex-1">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-inner ${
                            hasFile ? 'bg-success/5 text-success border-success/10' : 'bg-primary/5 text-[#0038A8] border-primary/10'
                          }`}>
                            {hasFile ? <FileCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <h4 className="font-black text-xs uppercase tracking-tight text-base-content flex items-center gap-1.5">
                              {doc.name}
                              {doc.mandatory && <span className="text-error font-extrabold">*</span>}
                            </h4>
                            <p className="text-[10px] font-bold text-base-content/40 leading-relaxed mt-0.5 max-w-lg">
                              {doc.description}
                            </p>
                            
                            {hasFile && (
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[9px] font-black uppercase text-base-content/50">
                                <span>File: <span className="text-[#0038A8] font-black break-all">{fileName}</span></span>
                                {uploadDate && <span>Uploaded: <span className="text-base-content">{uploadDate}</span></span>}
                                <span>Status: <span className={isDocVerified ? 'text-success font-black' : 'text-warning font-black'}>
                                  {isDocVerified ? 'Verified by Admin' : 'Pending Verification'}
                                </span></span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0">
                          {hasFile ? (
                            <>
                              <button 
                                onClick={() => handlePreviewDoc(doc)}
                                className="btn btn-ghost hover:bg-[#0038A8]/5 btn-xs text-[#0038A8] font-black uppercase px-2 min-h-0 h-8 flex items-center"
                              >
                                Preview
                              </button>
                              
                              {/* Direct Download Simulation */}
                              <a 
                                href={docData.fileData || '#'} 
                                download={fileName}
                                onClick={(e) => {
                                  if (!docData.fileData) {
                                    e.preventDefault();
                                    alert("Simulating standard file download package.");
                                  }
                                }}
                                className="btn btn-ghost hover:bg-[#0038A8]/5 btn-xs text-primary font-black uppercase px-2 min-h-0 h-8 flex items-center"
                              >
                                Download
                              </a>
                              
                              <button 
                                onClick={() => triggerDocUpload(doc.key)}
                                className="btn btn-ghost hover:bg-secondary/5 btn-xs text-secondary font-black uppercase px-2 min-h-0 h-8 flex items-center"
                              >
                                Replace
                              </button>
                              
                              <button 
                                onClick={() => handleDeleteDoc(doc.key)}
                                className="btn btn-ghost hover:bg-error/5 btn-xs text-error font-black uppercase px-2 min-h-0 h-8 flex items-center"
                              >
                                Delete
                              </button>

                              {/* Admin Verification Control Toggle */}
                              {isAdmin && (
                                <button 
                                  onClick={() => handleVerifyDoc(doc.key, !isDocVerified)}
                                  className={`btn btn-xs font-black uppercase px-2.5 min-h-0 h-8 rounded-lg shadow-sm border-none text-white ${
                                    isDocVerified ? 'bg-warning hover:bg-warning-dark' : 'bg-success hover:bg-success-dark'
                                  }`}
                                >
                                  {isDocVerified ? 'Revoke Review' : 'Approve Doc'}
                                </button>
                              )}
                            </>
                          ) : (
                            <button 
                              onClick={() => triggerDocUpload(doc.key)}
                              className="btn bg-[#0038A8] hover:bg-[#002d86] text-white btn-xs font-black uppercase tracking-wider rounded-lg h-8 px-3 transition-all flex items-center gap-1.5"
                            >
                              <Upload className="w-3.5 h-3.5" /> Upload File
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 8. SECURITY & SETTINGS */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="border-b border-base-100 pb-4">
                  <h3 className="text-sm font-bold text-base-content uppercase tracking-wider">Security & Settings</h3>
                  <p className="text-[10px] font-medium text-base-content/40 mt-0.5">Manage your account credentials and security settings</p>
                </div>

                <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                  {pwMessage && (
                    <div className={`alert text-white rounded-lg font-bold text-xs uppercase ${
                      pwMessage.type === 'success' ? 'alert-success' : 'alert-error'
                    }`}>
                      <span>{pwMessage.text}</span>
                    </div>
                  )}

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text text-[10px] font-bold uppercase opacity-65 tracking-wider">Current Password</span>
                    </label>
                    <input 
                      type="password" 
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input input-bordered rounded-lg w-full text-xs font-semibold"
                      required
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text text-[10px] font-bold uppercase opacity-65 tracking-wider">New Password</span>
                    </label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input input-bordered rounded-lg w-full text-xs font-semibold"
                      required
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text text-[10px] font-bold uppercase opacity-65 tracking-wider">Confirm New Password</span>
                    </label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input input-bordered rounded-lg w-full text-xs font-semibold"
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isChangingPw}
                    className="btn btn-primary btn-md rounded-lg text-xs w-full mt-6"
                  >
                    {isChangingPw ? (
                      <span className="loading loading-spinner" />
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>

        {/* Sidebar Components (Signature, Workstation Leaflet Map) */}
        <div className="space-y-6">
          
          {/* E-Signature Overlay (Preserving backend attachment path!) */}
          <div className="bg-white border border-base-200 rounded-lg p-6 space-y-4">
             <div className="flex items-center gap-2 pb-3 border-b border-base-100">
                <Signature className="w-4 h-4 text-base-content" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-base-content">E-Signature</h3>
             </div>
             
             <div className="space-y-4">
                <div className="h-28 w-full bg-base-100 rounded-lg border border-dashed border-base-300 flex items-center justify-center p-2 relative group overflow-hidden">
                  {me?.e_signature ? (
                    <img 
                       src={me.e_signature} 
                       alt="E-Signature" 
                       className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <p className="text-[8px] font-bold opacity-30 uppercase tracking-widest text-center">No E-Signature Uploaded</p>
                  )}
                  {isUploadingSig && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <input 
                    type="file" 
                    ref={sigInputRef}
                    onChange={handleSigUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button 
                    onClick={() => sigInputRef.current?.click()}
                    disabled={isUploadingSig}
                    className="btn btn-primary btn-sm rounded-lg text-xs w-full"
                  >
                    {me?.e_signature ? 'Update Signature' : 'Upload Signature'}
                  </button>
                </div>
             </div>
          </div>

          {/* Work Location Geofence Map */}
          <div className="bg-white border border-base-200 rounded-lg overflow-hidden flex flex-col min-h-[380px] z-0">
            <div className="p-6 border-b border-base-100 bg-white">
               <span className="text-[9px] font-bold text-base-content/40 uppercase tracking-wider block">Assigned Workstation</span>
               <h3 className="text-xs font-bold uppercase tracking-tight text-base-content mt-1">{workstation?.name || 'Lucena Division Office'}</h3>
            </div>
            <div className="flex-1 min-h-[200px] z-0 relative">
               <MapContainer 
                 key={`${pos.lat}-${pos.lng}`}
                 center={[pos.lat, pos.lng]} 
                 zoom={15} 
                 style={{ height: '100%', width: '100%', zIndex: 0 }}
                 zoomControl={false}
                 scrollWheelZoom={false}
                 dragging={false}
               >
                 <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                 <Circle center={[pos.lat, pos.lng]} radius={100} pathOptions={{ color: '#0038A8', fillColor: '#0038A8' }} />
                 <Marker position={[pos.lat, pos.lng]} />
               </MapContainer>
            </div>
            <div className="p-4 bg-base-100 flex items-center gap-2 border-t border-base-200">
               <MapPin className="text-base-content w-4 h-4 shrink-0" />
               <span className="text-[8px] font-bold uppercase opacity-45 tracking-wider leading-relaxed">
                 {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)} • Geofenced Boundaries (100m)
               </span>
            </div>
          </div>

        </div>

      </div>

      {/* EDIT MODAL DIALOGS */}
      {activeModal && (
        <div className="modal modal-open flex items-center justify-center bg-black/60 transition-all duration-300 z-[999] p-4">
          <div className="bg-white rounded-3xl border border-base-200 max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-base-100 pb-4">
              <h3 className="text-sm font-black text-[#0038A8] uppercase tracking-wider">
                {modalIndex !== null ? 'Edit' : 'Add'} {activeModal === 'personal' ? 'Profile' : activeModal.charAt(0).toUpperCase() + activeModal.slice(1)} Details
              </h3>
              <button 
                onClick={() => {
                  setActiveModal(null);
                  setModalData(null);
                  setModalIndex(null);
                }} 
                className="btn btn-ghost btn-sm rounded-full p-1 min-w-0"
              >
                <X className="w-5 h-5 text-base-content/50 hover:text-base-content" />
              </button>
            </div>

            {/* Modal Body Forms */}
            <div className="space-y-4 text-xs font-bold text-base-content/75">
              
              {/* Personal Form */}
              {activeModal === 'personal' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-[9px] font-black uppercase text-base-content/40">First Name</label>
                    <input 
                      type="text" 
                      value={modalData?.first_name || ''} 
                      onChange={(e) => handleFieldChange('first_name', e.target.value)}
                      className="input input-bordered input-sm w-full font-bold uppercase rounded-xl text-xs h-10" 
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-[9px] font-black uppercase text-base-content/40">Last Name</label>
                    <input 
                      type="text" 
                      value={modalData?.last_name || ''} 
                      onChange={(e) => handleFieldChange('last_name', e.target.value)}
                      className="input input-bordered input-sm w-full font-bold uppercase rounded-xl text-xs h-10" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-base-content/40">Middle Name</label>
                    <input 
                      type="text" 
                      value={modalData?.middle_name || ''} 
                      onChange={(e) => handleFieldChange('middle_name', e.target.value)}
                      className="input input-bordered input-sm w-full font-bold uppercase rounded-xl text-xs h-10" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-base-content/40">Extension Name</label>
                    <input 
                      type="text" 
                      value={modalData?.name_extension || ''} 
                      onChange={(e) => handleFieldChange('name_extension', e.target.value)}
                      className="input input-bordered input-sm w-full font-bold uppercase rounded-xl text-xs h-10" 
                      placeholder="Jr. / Sr."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-base-content/40">Date of Birth</label>
                    <input 
                      type="date" 
                      value={modalData?.date_of_birth || ''} 
                      onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
                      className="input input-bordered input-sm w-full font-bold rounded-xl text-xs h-10" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-base-content/40">Place of Birth</label>
                    <input 
                      type="text" 
                      value={modalData?.place_of_birth || ''} 
                      onChange={(e) => handleFieldChange('place_of_birth', e.target.value)}
                      className="input input-bordered input-sm w-full font-bold rounded-xl text-xs h-10" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-base-content/40">Gender</label>
                    <select 
                      value={modalData?.sex || ''} 
                      onChange={(e) => handleFieldChange('sex', e.target.value)}
                      className="select select-bordered select-sm w-full font-bold rounded-xl text-xs h-10"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-base-content/40">Civil Status</label>
                    <input 
                      type="text" 
                      value={modalData?.civil_status || ''} 
                      onChange={(e) => handleFieldChange('civil_status', e.target.value)}
                      className="input input-bordered input-sm w-full font-bold uppercase rounded-xl text-xs h-10" 
                      placeholder="Single/Married"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[9px] font-black uppercase text-base-content/40">Mobile No</label>
                    <input 
                      type="text" 
                      value={modalData?.mobile_no || ''} 
                      onChange={(e) => handleFieldChange('mobile_no', e.target.value)}
                      className="input input-bordered input-sm w-full font-bold rounded-xl text-xs h-10" 
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[9px] font-black uppercase text-base-content/40">Residential Address</label>
                    <textarea 
                      value={modalData?.residential_address || ''} 
                      onChange={(e) => handleFieldChange('residential_address', e.target.value)}
                      className="textarea textarea-bordered textarea-sm w-full font-bold uppercase rounded-xl text-xs h-16 pt-2" 
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[9px] font-black uppercase text-base-content/40">Permanent Address</label>
                    <textarea 
                      value={modalData?.permanent_address || ''} 
                      onChange={(e) => handleFieldChange('permanent_address', e.target.value)}
                      className="textarea textarea-bordered textarea-sm w-full font-bold uppercase rounded-xl text-xs h-16 pt-2" 
                    />
                  </div>
                </div>
              )}

              {/* Education Form */}
              {activeModal === 'education' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-base-content/40">Academic Level</label>
                    <select 
                      value={modalData?.level || ''} 
                      onChange={(e) => handleFieldChange('level', e.target.value)}
                      className="select select-bordered select-sm w-full font-bold rounded-xl text-xs h-10"
                    >
                      <option value="ELEMENTARY">ELEMENTARY</option>
                      <option value="SECONDARY">SECONDARY</option>
                      <option value="VOCATIONAL">VOCATIONAL / TRADE COURSE</option>
                      <option value="BACCALAUREATE">BACCALAUREATE (COLLEGE)</option>
                      <option value="GRADUATE_STUDIES">GRADUATE STUDIES</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-base-content/40">School / Institution Name</label>
                    <input 
                      type="text" 
                      value={modalData?.school_name || ''} 
                      onChange={(e) => handleFieldChange('school_name', e.target.value)}
                      className="input input-bordered input-sm w-full font-bold uppercase rounded-xl text-xs h-10" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-base-content/40">Degree / Basic Course</label>
                    <input 
                      type="text" 
                      value={modalData?.degree_course || ''} 
                      onChange={(e) => handleFieldChange('degree_course', e.target.value)}
                      className="input input-bordered input-sm w-full font-bold uppercase rounded-xl text-xs h-10" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-base-content/40">Period From</label>
                      <input 
                        type="text" 
                        value={modalData?.period_from || ''} 
                        onChange={(e) => handleFieldChange('period_from', e.target.value)}
                        className="input input-bordered input-sm w-full font-bold rounded-xl text-xs h-10" 
                        placeholder="Year (e.g. 2012)"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-base-content/40">Period To</label>
                      <input 
                        type="text" 
                        value={modalData?.period_to || ''} 
                        onChange={(e) => handleFieldChange('period_to', e.target.value)}
                        className="input input-bordered input-sm w-full font-bold rounded-xl text-xs h-10" 
                        placeholder="Year / present"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-base-content/40">Year Graduated</label>
                      <input 
                        type="text" 
                        value={modalData?.year_graduated || ''} 
                        onChange={(e) => handleFieldChange('year_graduated', e.target.value)}
                        className="input input-bordered input-sm w-full font-bold rounded-xl text-xs h-10" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-base-content/40">Honors Received</label>
                      <input 
                        type="text" 
                        value={modalData?.honors_received || ''} 
                        onChange={(e) => handleFieldChange('honors_received', e.target.value)}
                        className="input input-bordered input-sm w-full font-bold rounded-xl text-xs h-10" 
                        placeholder="e.g. Cum Laude"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Work Experience Form */}
              {activeModal === 'work' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-base-content/40">Position Title</label>
                    <input 
                      type="text" 
                      value={modalData?.position_title || ''} 
                      onChange={(e) => handleFieldChange('position_title', e.target.value)}
                      className="input input-bordered input-sm w-full font-bold uppercase rounded-xl text-xs h-10" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-base-content/40">Employer / Agency Name</label>
                    <input 
                      type="text" 
                      value={modalData?.agency || ''} 
                      onChange={(e) => handleFieldChange('agency', e.target.value)}
                      className="input input-bordered input-sm w-full font-bold uppercase rounded-xl text-xs h-10" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-base-content/40">Period From</label>
                      <input 
                        type="date" 
                        value={modalData?.date_from || ''} 
                        onChange={(e) => handleFieldChange('date_from', e.target.value)}
                        className="input input-bordered input-sm w-full font-bold rounded-xl text-xs h-10" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-base-content/40">Period To</label>
                      <input 
                        type="date" 
                        disabled={modalData?.is_present}
                        value={modalData?.is_present ? '' : (modalData?.date_to || '')} 
                        onChange={(e) => handleFieldChange('date_to', e.target.value)}
                        className="input input-bordered input-sm w-full font-bold rounded-xl text-xs h-10" 
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="is_present"
                      checked={modalData?.is_present || false} 
                      onChange={(e) => {
                        handleFieldChange('is_present', e.target.checked);
                        if (e.target.checked) handleFieldChange('date_to', null);
                      }}
                      className="checkbox checkbox-xs" 
                    />
                    <label htmlFor="is_present" className="text-[10px] font-black uppercase text-base-content/75 cursor-pointer">Currently Working Here</label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-base-content/40">Monthly Salary</label>
                      <input 
                        type="text" 
                        value={modalData?.monthly_salary || ''} 
                        onChange={(e) => handleFieldChange('monthly_salary', e.target.value)}
                        className="input input-bordered input-sm w-full font-bold rounded-xl text-xs h-10" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-base-content/40">Appointment Status</label>
                      <select 
                        value={modalData?.status_of_appointment || ''} 
                        onChange={(e) => handleFieldChange('status_of_appointment', e.target.value)}
                        className="select select-bordered select-sm w-full font-bold rounded-xl text-xs h-10"
                      >
                        <option value="PERMANENT">PERMANENT</option>
                        <option value="TEMPORARY">TEMPORARY</option>
                        <option value="CONTRACTUAL">CONTRACTUAL</option>
                        <option value="CASUAL">CASUAL</option>
                        <option value="CO-TERMINUS">CO-TERMINUS</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-base-content/40">Salary Grade (SG)</label>
                      <input 
                        type="text" 
                        value={modalData?.salary_grade || ''} 
                        onChange={(e) => handleFieldChange('salary_grade', e.target.value)}
                        className="input input-bordered input-sm w-full font-bold rounded-xl text-xs h-10" 
                        placeholder="e.g. 11"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <input 
                        type="checkbox" 
                        id="is_gov_service"
                        checked={modalData?.is_gov_service || false} 
                        onChange={(e) => handleFieldChange('is_gov_service', e.target.checked)}
                        className="checkbox checkbox-xs" 
                      />
                      <label htmlFor="is_gov_service" className="text-[10px] font-black uppercase text-base-content/75 cursor-pointer">Government Service</label>
                    </div>
                  </div>
                </div>
              )}

              {/* Eligibility Form */}
              {activeModal === 'eligibility' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-base-content/40">Exam / Board Title</label>
                    <input 
                      type="text" 
                      value={modalData?.service || ''} 
                      onChange={(e) => handleFieldChange('service', e.target.value)}
                      className="input input-bordered input-sm w-full font-bold uppercase rounded-xl text-xs h-10" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-base-content/40">Rating Obtained</label>
                      <input 
                        type="text" 
                        value={modalData?.rating || ''} 
                        onChange={(e) => handleFieldChange('rating', e.target.value)}
                        className="input input-bordered input-sm w-full font-bold uppercase rounded-xl text-xs h-10" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-base-content/40">Exam Date</label>
                      <input 
                        type="date" 
                        value={modalData?.date_of_exam || ''} 
                        onChange={(e) => handleFieldChange('date_of_exam', e.target.value)}
                        className="input input-bordered input-sm w-full font-bold rounded-xl text-xs h-10" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-base-content/40">Place of Exam</label>
                    <input 
                      type="text" 
                      value={modalData?.place_of_exam || ''} 
                      onChange={(e) => handleFieldChange('place_of_exam', e.target.value)}
                      className="input input-bordered input-sm w-full font-bold uppercase rounded-xl text-xs h-10" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-base-content/40">License Number</label>
                      <input 
                        type="text" 
                        value={modalData?.license_no || ''} 
                        onChange={(e) => handleFieldChange('license_no', e.target.value)}
                        className="input input-bordered input-sm w-full font-bold uppercase rounded-xl text-xs h-10" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-base-content/40">License Date of Validity</label>
                      <input 
                        type="date" 
                        value={modalData?.license_date || ''} 
                        onChange={(e) => handleFieldChange('license_date', e.target.value)}
                        className="input input-bordered input-sm w-full font-bold rounded-xl text-xs h-10" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Family Member Form */}
              {activeModal === 'family' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-base-content/40">Relationship</label>
                      <select 
                        value={modalData?.relationship || ''} 
                        onChange={(e) => handleFieldChange('relationship', e.target.value)}
                        className="select select-bordered select-sm w-full font-bold rounded-xl text-xs h-10"
                      >
                        <option value="SPOUSE">SPOUSE</option>
                        <option value="FATHER">FATHER</option>
                        <option value="MOTHER">MOTHER</option>
                        <option value="CHILD">CHILD</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-base-content/40">Extension (Jr./Sr.)</label>
                      <input 
                        type="text" 
                        value={modalData?.extension || ''} 
                        onChange={(e) => handleFieldChange('extension', e.target.value)}
                        className="input input-bordered input-sm w-full font-bold uppercase rounded-xl text-xs h-10" 
                      />
                    </div>
                  </div>
                  {modalData?.relationship === 'CHILD' ? (
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-base-content/40">Full Name</label>
                      <input 
                        type="text" 
                        value={modalData?.full_name || ''} 
                        onChange={(e) => handleFieldChange('full_name', e.target.value)}
                        className="input input-bordered input-sm w-full font-bold uppercase rounded-xl text-xs h-10" 
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-base-content/40">Surname</label>
                        <input 
                          type="text" 
                          value={modalData?.surname || ''} 
                          onChange={(e) => handleFieldChange('surname', e.target.value)}
                          className="input input-bordered input-sm w-full font-bold uppercase rounded-xl text-xs h-10" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-base-content/40">First Name</label>
                        <input 
                          type="text" 
                          value={modalData?.first_name || ''} 
                          onChange={(e) => handleFieldChange('first_name', e.target.value)}
                          className="input input-bordered input-sm w-full font-bold uppercase rounded-xl text-xs h-10" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-base-content/40">Middle Name</label>
                        <input 
                          type="text" 
                          value={modalData?.middle_name || ''} 
                          onChange={(e) => handleFieldChange('middle_name', e.target.value)}
                          className="input input-bordered input-sm w-full font-bold uppercase rounded-xl text-xs h-10" 
                        />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-base-content/40">Date of Birth</label>
                      <input 
                        type="date" 
                        value={modalData?.date_of_birth || ''} 
                        onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
                        className="input input-bordered input-sm w-full font-bold rounded-xl text-xs h-10" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-base-content/40">Occupation</label>
                      <input 
                        type="text" 
                        value={modalData?.occupation || ''} 
                        onChange={(e) => handleFieldChange('occupation', e.target.value)}
                        className="input input-bordered input-sm w-full font-bold uppercase rounded-xl text-xs h-10" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-base-content/40">Employer / Agency</label>
                    <input 
                      type="text" 
                      value={modalData?.employer || ''} 
                      onChange={(e) => handleFieldChange('employer', e.target.value)}
                      className="input input-bordered input-sm w-full font-bold uppercase rounded-xl text-xs h-10" 
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-base-100">
              <button 
                onClick={() => {
                  setActiveModal(null);
                  setModalData(null);
                  setModalIndex(null);
                }} 
                className="btn btn-ghost rounded-xl font-black uppercase tracking-wider text-[10px] h-10"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveModal}
                disabled={updateMutation.isPending}
                className="btn bg-[#0038A8] hover:bg-[#002d86] text-white rounded-xl font-black uppercase tracking-wider text-[10px] px-6 h-10 shadow-md shadow-blue-900/10 flex items-center gap-2 border-none"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                  </>
                ) : 'Save Details'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT / FILE PREVIEW MODAL */}
      {previewFile && (
        <div className="modal modal-open flex items-center justify-center bg-black/75 z-[9999] p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-base-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-[#0038A8] uppercase tracking-wider">Document Preview</h3>
                <p className="text-[9.5px] font-bold text-base-content/40 mt-0.5">{previewFile.title} ({previewFile.fileName})</p>
              </div>
              <button 
                onClick={() => setPreviewFile(null)} 
                className="btn btn-ghost btn-sm rounded-full p-1 min-w-0"
              >
                <X className="w-5 h-5 text-base-content/50 hover:text-base-content" />
              </button>
            </div>

            {/* Preview Frame */}
            <div className="h-[60vh] bg-base-100 rounded-2xl border border-base-200 overflow-hidden flex items-center justify-center relative p-4">
              {previewFile.data === "MOCK_PDF" ? (
                <div className="text-center space-y-4 max-w-md">
                  <div className="w-16 h-16 bg-red-100 border border-red-200 rounded-full flex items-center justify-center text-red-600 mx-auto shadow-inner">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-tight text-base-content">Simulated PDF Document</h4>
                    <p className="text-[10px] font-bold text-base-content/40 mt-1">This is a mockup placeholder preview representing the uploaded {previewFile.title} file package stored inside the Division recruitment archive.</p>
                  </div>
                  <div className="p-3.5 bg-base-50/50 rounded-xl text-[9px] font-black uppercase text-base-content/50 tracking-wider">
                    File: {previewFile.fileName}
                  </div>
                </div>
              ) : previewFile.data === "MOCK_CARD" ? (
                <div className="w-full max-w-md bg-gradient-to-br from-[#0038A8] via-[#002878] to-[#001850] p-6 rounded-2xl border border-white/10 text-white shadow-xl space-y-6 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[radial-gradient(circle_at_top_right,#FCD116_10%,transparent_50%)] opacity-30"></div>
                  
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <img src="/Deped2.png" className="w-10 h-10 object-contain drop-shadow" alt="DepEd Logo" />
                      <div>
                        <h4 className="font-black text-[9px] uppercase tracking-wider leading-none">Republic of the Philippines</h4>
                        <h5 className="font-extrabold text-[8px] uppercase tracking-widest text-[#FCD116] mt-0.5 leading-none">Department of Education</h5>
                        <p className="text-[6.5px] opacity-60 uppercase tracking-tighter leading-none mt-0.5">Lucena City Division Office</p>
                      </div>
                    </div>
                    <div className="px-2 py-0.5 bg-success text-white border border-success rounded text-[7px] font-black uppercase tracking-wider">
                      Verified
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[8px] opacity-40 uppercase tracking-widest leading-none">Card Type</p>
                    <p className="font-black text-xs uppercase tracking-tight text-[#FCD116]">{previewFile.title}</p>
                  </div>

                  <div className="flex justify-between items-end border-t border-white/10 pt-4">
                    <div>
                      <p className="text-[7.5px] opacity-45 uppercase tracking-widest">Cardholder Name</p>
                      <p className="font-black text-xs uppercase mt-0.5">{me?.first_name} {me?.last_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[7.5px] opacity-45 uppercase tracking-widest">Document Number</p>
                      <p className="font-black text-xs mt-0.5 tracking-widest text-[#FCD116]">{previewFile.number || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ) : (previewFile.data?.startsWith('data:application/pdf') || previewFile.fileName?.toLowerCase().endsWith('.pdf')) ? (
                <iframe 
                  src={previewFile.data} 
                  title={previewFile.title}
                  className="w-full h-full border-none rounded-xl"
                />
              ) : (
                <img 
                  src={previewFile.data} 
                  alt={previewFile.title} 
                  className="max-h-full max-w-full object-contain rounded-xl shadow-md border border-base-200" 
                />
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-base-100 pt-4">
              <a 
                href={previewFile.data.startsWith('data:') ? previewFile.data : '#'} 
                download={previewFile.fileName}
                onClick={(e) => {
                  if (!previewFile.data.startsWith('data:')) {
                    e.preventDefault();
                    alert("Simulated file downloaded package complete.");
                  }
                }}
                className="btn bg-[#0038A8] hover:bg-[#002d86] text-white btn-sm rounded-xl font-black uppercase tracking-wider text-[10px] px-5 h-10 border-none shadow-md shadow-blue-900/10 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download File
              </a>
              <button 
                onClick={() => setPreviewFile(null)} 
                className="btn btn-ghost hover:bg-base-100 btn-sm rounded-xl font-black uppercase tracking-wider text-[10px] h-10 px-5"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
