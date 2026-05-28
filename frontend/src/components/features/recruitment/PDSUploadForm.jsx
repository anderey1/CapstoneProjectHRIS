import React, { useState } from 'react';
import axios from '../../../api/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { 
    AlertCircle, CheckCircle2, Loader2, Upload, 
    UserPlus, RefreshCw, FileSearch, Eye, ShieldCheck 
} from 'lucide-react';

const PDSUploadForm = ({ onExtractionComplete, onSuccess }) => {
    const queryClient = useQueryClient();
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [extractedData, setExtractedData] = useState(null);
    const [confidence, setConfidence] = useState(0);
    const [errorMsg, setErrorMsg] = useState(null);

    const cleanValue = (val) => {
        if (!val) return '';
        // Remove spaces and normalize for comparison
        const normalized = val.replace(/\s+/g, '').toUpperCase();
        const placeholders = [
            '(MM/DD/YYYY)', '(JR.,SR)', '(M)', '(KG)', 
            'N/A', 'NONE', '.', ',', 'NOTAPPLICABLE'
        ];
        
        if (placeholders.includes(normalized)) return '';
        
        // Also check for partial instruction matches
        if (normalized === '(MM/DD/YY)' || normalized === '(MM/DD)') return '';
        
        return val.trim();
    };

    const extractMutation = useMutation({
        mutationFn: async (file) => {
            console.log("Starting PDS extraction for file:", file.name);
            const formData = new FormData();
            formData.append('file', file);
            try {
                const response = await axios.post('/pds/extract/', formData);
                console.log("Extraction Success Response:", response.data);
                return response.data;
            } catch (error) {
                console.error("Extraction API Error Object:", error);
                console.error("Server Error Response Data:", error.response?.data);
                throw error;
            }
        },
        onSuccess: (data) => {
            // Apply cleaning to extracted data
            const cleaned = {};
            let hasData = false;
            Object.keys(data.extracted_data).forEach(key => {
                const val = cleanValue(data.extracted_data[key]);
                cleaned[key] = val;
                if (val) hasData = true;
            });

            if (!hasData) {
                // If everything is empty, don't show the data verification screen yet
                // Instead, let the error handling or a local state show the warning
                setExtractedData(null);
                setConfidence(0);
                // We can use a custom error state or just alert
                setErrorMsg("The AI extracted no data. Please check the document's content or clarity.");
            } else {
                setExtractedData(cleaned);
                setConfidence(data.confidence_avg);
                setErrorMsg(null);
                if (onExtractionComplete) onExtractionComplete(cleaned);
            }
        }
    });

    const saveApplicantMutation = useMutation({
        mutationFn: (data) => axios.post('applicants/', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.APPLICANTS] });
            if (onSuccess) onSuccess();
        }
    });

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        } else {
            alert("Please upload a PDF file.");
            e.target.value = null;
        }
    };

    const handleSaveAsApplicant = () => {
        if (!extractedData) return;
        const applicantData = {
            first_name: extractedData.first_name || '',
            last_name: extractedData.last_name || '',
            email: extractedData.email || '',
            phone: extractedData.mobile_no || extractedData.telephone_no || '',
            position_applied: 'PDS Import',
            status: 'applied'
        };
        saveApplicantMutation.mutate(applicantData);
    };

    return (
        <div className="flex flex-col gap-6">
            {!extractedData ? (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-2xl p-12 bg-primary/5 transition-all hover:bg-primary/10">
                    <div className="w-20 h-20 bg-white rounded-full shadow-xl flex items-center justify-center text-primary mb-6 animate-bounce-slow">
                        <FileSearch className="w-10 h-10" />
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-widest text-base-content mb-2">Intelligent PDS Reader</h3>
                    <p className="text-xs font-bold text-base-content/40 mb-8 text-center max-w-[300px] leading-relaxed">
                        Drop your CS Form 212 PDF here. Our AI will automatically map fields for you.
                    </p>
                    
                    <div className="w-full max-w-sm space-y-4">
                        <label className="flex flex-col items-center px-4 py-6 bg-white text-primary rounded-xl shadow-lg tracking-wide border border-primary/10 cursor-pointer hover:bg-primary hover:text-white transition-all group">
                            <Upload className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            <span className="mt-2 text-[10px] font-black uppercase tracking-widest">
                                {file ? file.name : "Select PDF Document"}
                            </span>
                            <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                        </label>

                        <button 
                            onClick={() => extractMutation.mutate(file)}
                            disabled={!file || extractMutation.isPending}
                            className="btn btn-primary btn-block rounded-xl shadow-lg shadow-primary/30 h-14 font-black uppercase tracking-[0.2em] text-xs"
                        >
                            {extractMutation.isPending ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-3" />
                                    Analyzing Document...
                                </>
                            ) : (
                                "Execute OCR Scan"
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-500">
                    {/* Left: Preview */}
                    <div className="hidden lg:flex flex-col bg-base-200 rounded-2xl overflow-hidden border border-base-300">
                        <div className="bg-base-300 px-4 py-3 flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4 opacity-50" />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Document View</span>
                             </div>
                             <ShieldCheck className="w-4 h-4 text-success" />
                        </div>
                        <iframe src={previewUrl} className="w-full h-full min-h-[500px]" title="PDS Preview" />
                    </div>

                    {/* Right: Data Verification */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between bg-success/10 border border-success/20 p-5 rounded-2xl">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-success text-white rounded-xl flex items-center justify-center shadow-lg shadow-success/20">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black uppercase tracking-widest text-base-content">Scan Complete</h4>
                                    <p className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">Please verify extracted fields</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block text-[10px] font-black opacity-30 uppercase">Accuracy</span>
                                <span className="text-lg font-black text-success">{confidence}%</span>
                            </div>
                        </div>

                        <div className="bg-white border border-base-200 rounded-2xl p-6 shadow-sm overflow-hidden flex-1">
                            <div className="max-h-[400px] overflow-y-auto pr-4 custom-scrollbar space-y-5">
                                {Object.entries(extractedData).map(([key, value]) => (
                                    <div key={key} className="space-y-1.5 group">
                                        <div className="flex justify-between items-center ml-1">
                                            <label className="text-[9px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
                                                {key.replace(/_/g, ' ')}
                                            </label>
                                            {!value && <span className="text-[8px] font-black text-warning uppercase bg-warning/10 px-2 py-0.5 rounded-full">Missing</span>}
                                        </div>
                                        <input 
                                            type="text" 
                                            value={value} 
                                            onChange={(e) => setExtractedData(prev => ({ ...prev, [key]: e.target.value }))}
                                            className={`input input-bordered w-full bg-base-50/50 focus:bg-white rounded-xl text-xs font-bold h-10 transition-all ${!value ? 'border-warning/50' : 'border-base-200'}`}
                                            placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-auto">
                            <button 
                                className="btn btn-ghost flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-40 hover:bg-base-200" 
                                onClick={() => setExtractedData(null)}
                            >
                                <RefreshCw className="w-3 h-3 mr-2" />
                                Re-Scan
                            </button>
                            <button 
                                className="btn btn-primary flex-[2] rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 h-12"
                                onClick={handleSaveAsApplicant}
                                disabled={saveApplicantMutation.isPending}
                            >
                                {saveApplicantMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Commit to Database
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {(extractMutation.isError || errorMsg) && (
                <div className="alert alert-error bg-error/10 border-error/20 text-error rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1">Extraction Failure</p>
                        <p className="text-[11px] font-bold opacity-80">
                            {errorMsg || extractMutation.error?.response?.data?.details || extractMutation.error?.response?.data?.error || "Check internet connection or PDF validity"}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PDSUploadForm;
