import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { useToast } from '../../../context/ToastContext';

/**
 * Custom Domain Hook for the 201-file document checklist.
 *
 * The server is the single source of truth. Documents are keyed by document_type,
 * one row per type per employee, so uploading an existing type replaces it.
 */
export function useEmployeeDocuments(employeeId) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const queryKey = [QUERY_KEYS.EMPLOYEE_DOCUMENTS, employeeId];

  const { data: documents = [] } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await api.get('employee-documents/', { params: { employee: employeeId } });
      return Array.isArray(response.data) ? response.data : response.data.results || [];
    },
    enabled: !!employeeId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  const uploadMutation = useMutation({
    mutationFn: ({ file, documentType }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);
      formData.append('file_name', file.name);
      formData.append('employee', employeeId);
      return api.post('employee-documents/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      invalidate();
      toast.success('Document uploaded.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Upload failed.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (docId) => api.delete(`employee-documents/${docId}/`),
    onSuccess: () => {
      invalidate();
      toast.info('Document removed.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to delete document.');
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({ docId, verified }) =>
      api.post(`employee-documents/${docId}/verify/`, { verified }),
    onSuccess: (_res, { verified }) => {
      invalidate();
      toast.success(verified ? 'Document verified.' : 'Verification revoked.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to update verification status.');
    },
  });

  return {
    documents,
    uploadDocument: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    deleteDocument: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    verifyDocument: verifyMutation.mutateAsync,
    isVerifying: verifyMutation.isPending,
  };
}

/**
 * Reshape server rows into the shape the checklist UI reads.
 * Keyed by document_type, matching the REQUIRED_DOCS_LIST keys.
 */
export function mapDocumentsToChecklist(documents) {
  const byType = {};
  documents.forEach((doc) => {
    byType[doc.document_type] = {
      id: doc.id,
      fileName: doc.file_name || `${doc.document_type}.pdf`,
      uploadDate: new Date(doc.uploaded_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      verified: doc.verified,
      fileData: doc.file_url,
    };
  });
  return byType;
}
