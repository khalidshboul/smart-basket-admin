import { apiClient } from './client';
import type { ReferenceItem, CreateReferenceItemRequest } from '../types';

const BASE_PATH = 'items';

export const referenceItemApi = {
    getAll: async (): Promise<ReferenceItem[]> => {
        const response = await apiClient.get<ReferenceItem[]>(BASE_PATH);
        return response.data;
    },

    getById: async (id: string): Promise<ReferenceItem> => {
        const response = await apiClient.get<ReferenceItem>(`${BASE_PATH}/${id}`);
        return response.data;
    },

    getByCategory: async (categoryId: string, includeSubcategories = false): Promise<ReferenceItem[]> => {
        const response = await apiClient.get<ReferenceItem[]>(`${BASE_PATH}/category/${categoryId}`, {
            params: { includeSubcategories },
        });
        return response.data;
    },

    search: async (query: string): Promise<ReferenceItem[]> => {
        const response = await apiClient.get<ReferenceItem[]>(`${BASE_PATH}/search`, {
            params: { query },
        });
        return response.data;
    },

    create: async (data: CreateReferenceItemRequest): Promise<ReferenceItem> => {
        const response = await apiClient.post<ReferenceItem>(BASE_PATH, data);
        return response.data;
    },

    update: async (id: string, data: CreateReferenceItemRequest): Promise<ReferenceItem> => {
        const response = await apiClient.put<ReferenceItem>(`${BASE_PATH}/${id}`, data);
        return response.data;
    },

    toggleStatus: async (id: string): Promise<ReferenceItem> => {
        const response = await apiClient.patch<ReferenceItem>(`${BASE_PATH}/${id}/toggle-status`);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`${BASE_PATH}/${id}`);
    },
};
