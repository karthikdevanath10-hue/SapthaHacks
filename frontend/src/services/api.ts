import axios from 'axios';
import { FullAnalysisResponse, InvestigationSummary } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000,
});

export const apiService = {
  async checkHealth() {
    try {
      const res = await apiClient.get('/health');
      return res.data;
    } catch (e) {
      return { status: 'offline', supabase_connected: false, gemini_configured: false };
    }
  },

  async analyzeMedia(params: {
    file?: File | null;
    textContent?: string;
    caption?: string;
    sourceContext?: string;
    userId?: string;
    modality?: string;
  }): Promise<FullAnalysisResponse> {
    const formData = new FormData();
    if (params.file) {
      formData.append('file', params.file);
    }
    if (params.modality) {
      formData.append('modality', params.modality);
    }
    if (params.textContent && params.textContent.trim()) {
      formData.append('text_content', params.textContent.trim());
    }
    if (params.caption && params.caption.trim()) {
      formData.append('caption', params.caption.trim());
    }
    if (params.sourceContext && params.sourceContext.trim()) {
      formData.append('source_context', params.sourceContext.trim());
    }
    if (params.userId) {
      formData.append('user_id', params.userId);
    }

    const res = await apiClient.post<FullAnalysisResponse>('/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async getInvestigations(userId?: string): Promise<InvestigationSummary[]> {
    const params = userId ? { user_id: userId } : {};
    const res = await apiClient.get<{ investigations: InvestigationSummary[] }>('/investigations', { params });
    return res.data.investigations;
  },

  async getInvestigationDetails(id: string): Promise<FullAnalysisResponse> {
    const res = await apiClient.get<FullAnalysisResponse>(`/investigations/${id}`);
    return res.data;
  },

  async deleteInvestigation(id: string, userId?: string): Promise<void> {
    const params = userId ? { user_id: userId } : {};
    await apiClient.delete(`/investigations/${id}`, { params });
  },

  getReportDownloadUrl(investigationId: string): string {
    return `${API_BASE_URL}/reports/${investigationId}/download`;
  }
};
