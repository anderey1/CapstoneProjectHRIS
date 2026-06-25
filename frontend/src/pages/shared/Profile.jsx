import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User, Mail, Briefcase, Building2, MapPin, 
  Calendar, Wallet, Camera, Fingerprint,
  UserCircle, CalendarCheck, Users, GraduationCap,
  Award, History, Globe, ShieldCheck, Loader2, X,
  CheckCircle2, Signature
} from 'lucide-react';
import api from '../../api/axios';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
// import { loadFaceModels, extractFaceDescriptor } from '../../utils/faceAuth';

/**
 * My Profile / Employee Detailed View
 * 
 * Simple, professional redesign for viewing personal and work details.
 * Expanded to include full PDS history sections and biometric enrollment.
 */
const Profile = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  // const [isEnrolling, setIsEnrolling] = useState(false);
  const [isUploadingSig, setIsUploadingSig] = useState(false);
  // const [enrollStep, setEnrollStep] = useState('idle'); // idle, loading, ready, capturing, success, error
  // const videoRef = useRef(null);
  const sigInputRef = useRef(null);

  const { data: me, isLoading } = useQuery({
    queryKey: id ? ['employee', id] : ['me'],
    queryFn: () => {
        const endpoint = id ? `employees/${id}/` : 'employees/me/';
        return api.get(endpoint).then(res => res.data);
    }
  });

  // const enrollMutation = useMutation({
  //   mutationFn: (descriptor) => {
  //     const endpoint = id ? `employees/${id}/` : 'employees/me/';
  //     return api.patch(endpoint, { face_descriptor: JSON.stringify(Array.from(descriptor)) });
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: id ? ['employee', id] : ['me'] });
  //     setEnrollStep('success');
  //     setTimeout(() => {
  //       setIsEnrolling(false);
  //       setEnrollStep('idle');
  //     }, 3000);
  //   },
  //   onError: (err) => {
  //     console.error("Enrollment failed:", err.response?.data);
  //     setEnrollStep('error');
  //   }
  // });

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
      alert("E-Signature updated successfully!");
    },
    onError: (err) => {
      console.error("Signature upload failed:", err.response?.data);
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

  // const startEnrollment = async () => {
  //   setIsEnrolling(true);
  //   setEnrollStep('loading');
  //   
  //   const loaded = await loadFaceModels();
  //   if (!loaded) {
  //     setEnrollStep('error');
  //     return;
  //   }
  // 
  //   try {
  //     const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
  //     if (videoRef.current) {
  //       videoRef.current.srcObject = stream;
  //       setEnrollStep('ready');
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     setEnrollStep('error');
  //   }
  // };
  // 
  // const captureFace = async () => {
  //   if (!videoRef.current) return;
  //   setEnrollStep('capturing');
  //   
  //   const descriptor = await extractFaceDescriptor(videoRef.current);
  //   
  //   // Stop camera safely
  //   if (videoRef.current?.srcObject) {
  //     const stream = videoRef.current.srcObject;
  //     stream.getTracks().forEach(track => track.stop());
  //   }
  // 
  //   if (descriptor) {
  //     enrollMutation.mutate(descriptor);
  //   } else {
  //     setEnrollStep('error');
  //     alert("Face not detected. Please try again in better lighting.");
  //   }
  // };
  // 
  // const cancelEnrollment = () => {
  //   if (videoRef.current?.srcObject) {
  //     const stream = videoRef.current.srcObject;
  //     stream.getTracks().forEach(track => track.stop());
  //   }
  //   setIsEnrolling(false);
  //   setEnrollStep('idle');
  // };

  if (isLoading) return (
    <div className="p-8 flex justify-center h-[60vh] items-center">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  );

  const workstation = me?.school_details;
  const pos = {
    lat: workstation?.latitude ? parseFloat(workstation.latitude) : 13.9408,
    lng: workstation?.longitude ? parseFloat(workstation.longitude) : 121.6210
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Header / Profile Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-base-200 overflow-hidden">
        <div className="h-32 bg-primary/10 relative">
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/20 to-transparent"></div>
        </div>
        <div className="px-8 pb-8 -mt-12 flex flex-col md:flex-row items-end gap-6 relative z-10">
          <div className="p-1.5 bg-white rounded-xl shadow-lg border border-base-100">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-base-100 rounded-lg flex items-center justify-center border border-base-200 overflow-hidden relative group">
              <UserCircle size={60} className="text-primary opacity-20" />
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                <Camera className="text-primary w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="flex-1 pb-2">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">
                {me?.first_name} {me?.last_name}
              </h1>
              <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase tracking-widest border border-primary/10">
                {me?.user_details?.role || 'STAFF'}
              </div>
              {/* {me?.face_descriptor && (
                <div className="px-3 py-1 bg-success/10 text-success rounded-full text-[9px] font-black uppercase tracking-widest border border-success/10 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Face Verified
                </div>
              )} */}
            </div>
            <p className="text-xs font-bold opacity-40 uppercase tracking-widest flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5" /> {me?.position || 'No Position'} • {me?.department || 'Unassigned'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Info Area */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Biometric Enrollment Card (Set aside for now) */}
            {/* 
            <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8 space-y-6 md:col-span-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30 flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-primary" /> Biometric Identity
              </h3>
              
              {!isEnrolling ? (
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-base-50 rounded-2xl border border-dashed border-base-300">
                  <div className="space-y-1 text-center md:text-left">
                    <p className="font-black text-sm uppercase tracking-tight">Face Recognition Enrollment</p>
                    <p className="text-[10px] font-bold opacity-40 uppercase">Required for secure attendance logging</p>
                  </div>
                  <button 
                    onClick={startEnrollment}
                    className="btn btn-primary btn-sm rounded-lg font-black uppercase tracking-widest px-6 w-full md:w-auto"
                  >
                    {me?.face_descriptor ? 'Update Face Data' : 'Enroll My Face'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="relative aspect-square w-full max-w-sm mx-auto bg-black rounded-2xl overflow-hidden border-4 border-base-200 shadow-2xl">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      muted 
                      className={`w-full h-full object-cover ${enrollStep === 'capturing' ? 'grayscale opacity-50' : ''}`}
                    />
                    
                    <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none flex items-center justify-center">
                       <div className="w-full h-full border-2 border-primary/30 rounded-full" />
                    </div>
                    
                    {enrollStep === 'loading' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 text-white">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Initializing AI Models...</p>
                      </div>
                    )}
                    
                    {enrollStep === 'capturing' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                         <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}

                    {enrollStep === 'success' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-success/80 text-white">
                        <CheckCircle2 className="w-16 h-16" />
                        <p className="text-sm font-black uppercase tracking-widest">Enrollment Successful</p>
                      </div>
                    )}

                    {enrollStep === 'error' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-error/80 text-white p-4 text-center">
                        <X className="w-16 h-16" />
                        <p className="text-sm font-black uppercase tracking-widest">Enrollment Failed</p>
                        <p className="text-[9px] font-bold uppercase opacity-80 mt-1">Check console or permissions</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center gap-4">
                    {enrollStep === 'ready' && (
                      <button 
                        onClick={captureFace}
                        className="btn btn-primary rounded-xl font-black uppercase tracking-widest px-10 h-12"
                      >
                        <Camera className="w-4 h-4 mr-2" /> Capture Reference
                      </button>
                    )}
                    <button 
                      onClick={cancelEnrollment}
                      className="btn btn-ghost rounded-xl font-black uppercase tracking-widest text-[10px]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            */}

            {/* E-Signature Card */}
            <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8 space-y-6 md:col-span-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30 flex items-center gap-2">
                <Signature className="w-4 h-4 text-primary" /> E-Signature Overlay
              </h3>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-6 bg-base-50 rounded-2xl border border-dashed border-base-300">
                <div className="space-y-4 text-center md:text-left flex-1">
                  <div className="space-y-1">
                    <p className="font-black text-sm uppercase tracking-tight">Electronic Signature</p>
                    <p className="text-[10px] font-bold opacity-40 uppercase">Used for automated DTR generation and paperless forms</p>
                  </div>
                  
                  <div className="h-24 w-full md:w-64 bg-white rounded-xl border border-base-200 flex items-center justify-center p-2 relative group overflow-hidden shadow-inner">
                    {me?.e_signature ? (
                      <img 
                        src={me.e_signature} 
                        alt="E-Signature" 
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <p className="text-[9px] font-black opacity-20 uppercase tracking-widest">No Signature Uploaded</p>
                    )}
                    {isUploadingSig && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 w-full md:w-auto">
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
                    className="btn btn-primary btn-sm rounded-lg font-black uppercase tracking-widest px-6 w-full shadow-md shadow-primary/20"
                  >
                    {me?.e_signature ? 'Update Signature' : 'Upload Signature'}
                  </button>
                  <p className="text-[8px] font-bold opacity-30 uppercase text-center">PNG or JPG with transparent bg preferred</p>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8 space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" /> Personal Info
              </h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-base-50 rounded-lg border border-base-100 flex items-center justify-center"><User className="w-4 h-4 opacity-30" /></div>
                  <div>
                    <p className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-0.5">Username</p>
                    <p className="text-sm font-bold text-base-content">{me?.user_details?.username || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-base-50 rounded-lg border border-base-100 flex items-center justify-center"><Mail className="w-4 h-4 opacity-30" /></div>
                  <div>
                    <p className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-0.5">Email</p>
                    <p className="text-sm font-bold text-base-content">{me?.user_details?.email || 'N/A'}</p>
                  </div>
                </div>
                {me?.mobile_no && (
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-base-50 rounded-lg border border-base-100 flex items-center justify-center"><Globe className="w-4 h-4 opacity-30" /></div>
                     <div>
                       <p className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-0.5">Mobile</p>
                       <p className="text-sm font-bold text-base-content">{me.mobile_no}</p>
                     </div>
                   </div>
                )}
              </div>
            </div>

            {/* Job Info */}
            <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8 space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Work Info
              </h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-base-50 rounded-lg border border-base-100 flex items-center justify-center"><Calendar className="w-4 h-4 opacity-30" /></div>
                  <div>
                    <p className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-0.5">Joined</p>
                    <p className="text-sm font-bold text-base-content">{me?.date_hired ? new Date(me.date_hired).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-base-50 rounded-lg border border-base-100 flex items-center justify-center"><Wallet className="w-4 h-4 opacity-30" /></div>
                  <div>
                    <p className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-0.5">Monthly Pay</p>
                    <p className="text-sm font-bold text-primary">₱{parseFloat(me?.salary || 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-base-50 rounded-lg border border-base-100 flex items-center justify-center"><CalendarCheck className="w-4 h-4 opacity-30" /></div>
                  <div>
                    <p className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-0.5">Balance</p>
                    <p className="text-sm font-bold text-base-content">{me?.leave_balance || 0} Days Available</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed PDS History Sections */}
          <div className="space-y-8">
            
            {/* 1. Family Background */}
            <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8">
              <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30 flex items-center gap-2 mb-8">
                <Users className="w-4 h-4 text-primary" /> II. Family Background
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {me?.family?.length > 0 ? me.family.map((f, idx) => (
                   <div key={idx} className="p-4 bg-base-50 rounded-lg border border-base-100 space-y-1">
                      <div className="flex justify-between items-start">
                         <p className="font-black text-xs uppercase tracking-tight">{f.relationship === 'CHILD' ? f.full_name : `${f.first_name} ${f.surname}`}</p>
                         <span className="text-[9px] font-black opacity-20 uppercase tracking-widest">{f.relationship}</span>
                      </div>
                      {f.occupation && <p className="text-[10px] font-bold opacity-40 uppercase">{f.occupation}</p>}
                   </div>
                )) : <p className="text-[10px] font-bold opacity-20 uppercase py-4">No records found</p>}
              </div>
            </div>

            {/* 2. Educational Background */}
            <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8">
              <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30 flex items-center gap-2 mb-8">
                <GraduationCap className="w-4 h-4 text-primary" /> III. Educational Background
              </h3>
              <div className="space-y-4">
                {me?.education?.length > 0 ? me.education.map((e, idx) => (
                   <div key={idx} className="flex gap-6 p-4 bg-base-50 rounded-lg border border-base-100">
                      <div className="w-10 h-10 rounded bg-white flex items-center justify-center font-black text-primary text-[10px] uppercase shadow-sm border border-base-100 shrink-0">
                         {e.level?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-start">
                            <h4 className="font-black text-xs uppercase tracking-tight truncate">{e.school_name}</h4>
                            <span className="text-[9px] font-black opacity-20 uppercase tracking-widest">{e.level}</span>
                         </div>
                         <p className="text-[10px] font-bold opacity-40 uppercase truncate">{e.degree_course}</p>
                         <p className="text-[9px] font-black text-primary/60 uppercase mt-2">Class of {e.year_graduated || 'N/A'}</p>
                      </div>
                   </div>
                )) : <p className="text-[10px] font-bold opacity-20 uppercase py-4">No records found</p>}
              </div>
            </div>

            {/* 3. Civil Service Eligibility */}
            <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8">
              <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30 flex items-center gap-2 mb-8">
                <Award className="w-4 h-4 text-primary" /> IV. Eligibility
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {me?.eligibilities?.length > 0 ? me.eligibilities.map((e, idx) => (
                   <div key={idx} className="p-4 bg-base-50 rounded-lg border border-base-100 space-y-1">
                      <p className="font-black text-xs uppercase tracking-tight">{e.service}</p>
                      <div className="flex justify-between items-center text-[10px] font-bold opacity-40 uppercase">
                         <span>Rating: {e.rating || 'N/A'}</span>
                         <span>{e.date_of_exam ? new Date(e.date_of_exam).getFullYear() : ''}</span>
                      </div>
                   </div>
                )) : <p className="text-[10px] font-bold opacity-20 uppercase py-4">No records found</p>}
              </div>
            </div>

            {/* 4. Work Experience */}
            <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8">
              <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30 flex items-center gap-2 mb-8">
                <History className="w-4 h-4 text-primary" /> V. Work Experience
              </h3>
              <div className="space-y-4">
                {me?.work_experience?.length > 0 ? me.work_experience.map((w, idx) => (
                   <div key={idx} className="flex gap-6 p-4 bg-base-50 rounded-lg border border-base-100">
                      <div className="w-10 h-10 rounded bg-white flex items-center justify-center font-black text-primary text-[10px] uppercase shadow-sm border border-base-100 shrink-0">
                         {w.is_gov_service ? 'GOV' : 'PVT'}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-start">
                            <h4 className="font-black text-xs uppercase tracking-tight truncate">{w.position_title}</h4>
                            <span className="text-[9px] font-black opacity-20 uppercase tracking-widest">
                               {w.date_from ? new Date(w.date_from).getFullYear() : ''} — {w.is_present ? 'Present' : (w.date_to ? new Date(w.date_to).getFullYear() : '')}
                            </span>
                         </div>
                         <p className="text-[10px] font-bold opacity-40 uppercase truncate">{w.agency}</p>
                         <p className="text-[9px] font-black text-primary/60 uppercase mt-2">₱{parseFloat(w.monthly_salary || 0).toLocaleString()} / MONTH</p>
                      </div>
                   </div>
                )) : <p className="text-[10px] font-bold opacity-20 uppercase py-4">No records found</p>}
              </div>
            </div>

          </div>
        </div>

        {/* Sidebar: Map */}
        <div className="space-y-8 h-full">
          <div className="bg-white border border-base-200 shadow-sm rounded-xl overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="p-6 border-b border-base-100">
               <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-1">Work Location</h3>
               <p className="text-xs font-black uppercase tracking-tight text-primary">{workstation?.name || 'Home Office'}</p>
            </div>
            <div className="flex-1 min-h-[200px] z-0">
               <MapContainer 
                 key={`${pos.lat}-${pos.lng}`}
                 center={[pos.lat, pos.lng]} 
                 zoom={16} 
                 style={{ height: '100%', width: '100%' }}
                 zoomControl={false}
                 scrollWheelZoom={false}
                 dragging={false}
               >
                 <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                 <Circle center={[pos.lat, pos.lng]} radius={100} pathOptions={{ color: 'primary', fillColor: 'primary' }} />
                 <Marker position={[pos.lat, pos.lng]} />
               </MapContainer>
            </div>
            <div className="p-6 bg-base-50/50 flex items-center gap-3">
               <MapPin className="text-primary w-4 h-4" />
               <span className="text-[9px] font-black uppercase opacity-40 tracking-tighter">
                 {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)} • Office Boundary
               </span>
            </div>
          </div>

          {/* Gov IDs Sidebar Card */}
          <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8 space-y-6">
             <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30 flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-primary" /> Verified IDs
             </h3>
             <div className="space-y-4">
                {[
                   { label: 'UMID', val: me?.umid_id },
                   { label: 'Pag-IBIG', val: me?.pagibig_id },
                   { label: 'PhilHealth', val: me?.philhealth_no },
                   { label: 'PhilSys', val: me?.philsys_id },
                   { label: 'TIN', val: me?.tin_no },
                   { label: 'Agency No', val: me?.agency_employee_no }
                ].filter(id => id.val).map(id => (
                   <div key={id.label}>
                      <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-0.5">{id.label}</p>
                      <p className="text-xs font-black text-base-content tracking-wider">{id.val}</p>
                   </div>
                ))}
                {!me?.umid_id && !me?.pagibig_id && <p className="text-[10px] font-bold opacity-20 uppercase">No ID records found</p>}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
