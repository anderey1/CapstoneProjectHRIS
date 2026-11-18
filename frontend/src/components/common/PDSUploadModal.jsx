import { useEffect, useId, useState } from 'react';
import axios from '../../api/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../api/queryKeys';

const PDSUploadModal = ({ onExtractionComplete, onSuccess }) => {
    const queryClient = useQueryClient();
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [extractedData, setExtractedData] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const fieldId = useId();

    useEffect(() => {
        if (!previewUrl) return;
        return () => URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    const cleanValue = (val) => {
        if (!val) return '';
        
        // Handle Arrays (Recursive)
        if (Array.isArray(val)) {
            return val.map(item => cleanValue(item));
        }
        
        // Handle Objects (Recursive)
        if (typeof val === 'object' && val !== null) {
            const cleanedObj = {};
            Object.keys(val).forEach(key => {
                cleanedObj[key] = cleanValue(val[key]);
            });
            return cleanedObj;
        }

        if (typeof val !== 'string') return val;

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
            const formData = new FormData();
            formData.append('file', file);
            const response = await axios.post('pds/extract/', formData);
            return response.data;
        },
        onSuccess: (data) => {
            const cleaned = {};
            let hasData = false;
            Object.keys(data.extracted_data).forEach(key => {
                const val = cleanValue(data.extracted_data[key]);
                cleaned[key] = val;
                if (val) hasData = true;
            });

            if (!hasData) {
                setExtractedData(null);
                setErrorMsg("No details could be extracted. Choose a completed, readable CS Form 212 PDF and try again.");
            } else {
                setExtractedData(cleaned);
                setErrorMsg(null);
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
        if (!selectedFile) return;
        setExtractedData(null);
        extractMutation.reset();
        saveApplicantMutation.reset();
        if (selectedFile.type === 'application/pdf' || (!selectedFile.type && /\.pdf$/i.test(selectedFile.name))) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setErrorMsg(null);
        } else {
            setFile(null);
            setPreviewUrl(null);
            setErrorMsg("Choose a PDF file. Other file types cannot be imported.");
            e.target.value = '';
        }
    };

    const handleSaveAsApplicant = () => {
        if (!extractedData) return;

        const validPositions = [
            'Teacher I', 'Teacher II', 'Teacher III', 'Master Teacher I', 'Master Teacher II', 'SPED Teacher I',
            'Administrative Officer I', 'Administrative Officer II', 'Administrative Assistant I', 'Administrative Assistant II',
            'Registrar I', 'Accountant I', 'School Principal I'
        ];
        
        let position = extractedData.position || '';
        const match = validPositions.find(p => p.toLowerCase() === position.trim().toLowerCase());
        position = match || position.trim();

        const applicantData = {
            first_name: extractedData.first_name || '',
            middle_name: extractedData.middle_name || extractedData.middlename || '',
            last_name: extractedData.last_name || '',
            email: extractedData.email || '',
            phone: extractedData.mobile_no || extractedData.telephone_no || '',
            position_applied: position,
            status: 'applied'
        };
        saveApplicantMutation.mutate(applicantData);
    };

    return (
        <div className="space-y-5 text-sm text-slate-800">
            <div>
                <h3 className="text-base font-semibold text-slate-900">Import details from a PDS</h3>
                <p id={`${fieldId}-help`} className="mt-1 text-sm text-slate-600">
                    Select a completed CS Form 212 PDF. Review the extracted details before applying or saving them.
                </p>
            </div>
            <div className="space-y-2">
                <label htmlFor={`${fieldId}-file`} className="block text-sm font-medium">PDS document (PDF)</label>
                <input
                    id={`${fieldId}-file`}
                    type="file"
                    accept=".pdf,application/pdf"
                    aria-describedby={`${fieldId}-help`}
                    disabled={extractMutation.isPending || saveApplicantMutation.isPending}
                    onChange={handleFileChange}
                    className="block min-h-11 w-full min-w-0 rounded-md border border-slate-400 bg-white p-2 text-sm file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-800 hover:file:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed"
                />
            </div>
            {!extractedData ? (
                <button
                    type="button"
                    onClick={() => {
                        setErrorMsg(null);
                        extractMutation.mutate(file);
                    }}
                    disabled={!file || extractMutation.isPending}
                    className="btn btn-primary min-h-11 rounded-md text-sm font-semibold"
                >
                    {extractMutation.isPending ? 'Extracting details...' : 'Extract details'}
                </button>
            ) : (
                <div className="space-y-5">
                    <p role="status" className="text-sm text-slate-700">Extraction complete. Check names, dates, and other details against your PDF.</p>
                    {/* Left: Preview */}
                    {previewUrl && (
                        <details className="rounded-md border border-slate-300">
                            <summary className="min-h-11 cursor-pointer px-3 py-3 text-sm font-medium text-primary hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-primary">View original PDF</summary>
                            <iframe src={previewUrl} width="600" height="400" className="h-96 w-full" title="Original PDS document" />
                        </details>
                    )}
                    {/* Right: Data Verification */}
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-3 border-y border-slate-200 py-4 sm:grid-cols-2">
                        {[
                            ['Family background', extractedData.family?.length || 0],
                            ['Education background', extractedData.education?.length || 0],
                            ['Civil service eligibility', extractedData.eligibilities?.length || 0],
                            ['Work experience', extractedData.work_experience?.length || 0],
                        ].map(([label, count]) => (
                            <div key={label}>
                                <dt className="text-xs font-medium text-slate-600">{label}</dt>
                                <dd className="mt-1 text-sm">{count} {count === 1 ? 'record' : 'records'} extracted</dd>
                            </div>
                        ))}
                    </dl>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {Object.entries(extractedData)
                            .filter(([, value]) => !Array.isArray(value) && typeof value !== 'object')
                            .map(([key, value]) => {
                                const label = key.replace(/_/g, ' ');
                                return (
                                    <div key={key} className="min-w-0 space-y-1.5">
                                        <label htmlFor={`${fieldId}-${key}`} className="block text-sm font-medium">
                                            {label.charAt(0).toUpperCase() + label.slice(1)}
                                            {!value && <span className="ml-2 text-xs font-normal text-slate-600">(not extracted)</span>}
                                        </label>
                                        <input
                                            id={`${fieldId}-${key}`}
                                            type="text"
                                            value={value ?? ''}
                                            disabled={saveApplicantMutation.isPending}
                                            onChange={(e) => setExtractedData(prev => ({ ...prev, [key]: e.target.value }))}
                                            className="input min-h-11 w-full rounded-md border-slate-400 bg-white text-sm font-normal focus:border-primary"
                                        />
                                    </div>
                                );
                            })}
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            className="btn btn-ghost min-h-11 rounded-md text-sm font-medium text-slate-700"
                            disabled={saveApplicantMutation.isPending}
                            onClick={() => {
                                setExtractedData(null);
                                setErrorMsg(null);
                                saveApplicantMutation.reset();
                            }}
                        >
                            Extract again
                        </button>
                        {onExtractionComplete ? (
                            <button type="button" className="btn btn-primary min-h-11 rounded-md text-sm font-semibold" onClick={() => onExtractionComplete(extractedData)}>
                                Apply to employee form
                            </button>
                        ) : (
                            <button type="button" className="btn btn-primary min-h-11 rounded-md text-sm font-semibold" onClick={handleSaveAsApplicant} disabled={saveApplicantMutation.isPending || saveApplicantMutation.isSuccess}>
                                {saveApplicantMutation.isPending ? 'Saving applicant...' : saveApplicantMutation.isSuccess ? 'Applicant saved' : 'Save applicant'}
                            </button>
                        )}
                    </div>
                </div>
            )}
            {(extractMutation.isPending || saveApplicantMutation.isPending) && (
                <p role="status" className="text-sm text-slate-700">
                    {extractMutation.isPending ? `Extracting details from ${file?.name}. Keep this form open while the document is processed.` : 'Saving the applicant record. Keep this form open.'}
                </p>
            )}
            {(extractMutation.isError || errorMsg) && (
                <div role="alert" className="break-words rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                    <p className="font-semibold">Could not extract details</p>
                    <p className="mt-1">{errorMsg || extractMutation.error?.response?.data?.details || extractMutation.error?.response?.data?.error || 'Check your connection and choose a readable PDF, then try again.'}</p>
                </div>
            )}
            {saveApplicantMutation.isError && (
                <div role="alert" className="break-words rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                    <p className="font-semibold">Could not save applicant</p>
                    <p className="mt-1">
                        {Object.entries(saveApplicantMutation.error?.response?.data || {}).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : typeof value === 'string' ? value : JSON.stringify(value)}`).join(' ') || 'Check your connection and try saving again. Your extracted details are still available.'}
                    </p>
                </div>
            )}
            {saveApplicantMutation.isSuccess && <p role="status" className="text-sm text-slate-700">Applicant saved successfully.</p>}
        </div>
    );
};

export default PDSUploadModal;
