import { apiClient } from './client';
import type { ReferenceItem, CreateReferenceItemRequest } from '../types';

const BASE_PATH = 'items';

export interface PaginatedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;  // current page (0-indexed)
    size: number;
    first: boolean;
    last: boolean;
}

export const referenceItemApi = {
    /**
     * Get all items without pagination (used by PricesPage, PreviewPage, etc.).
     */
    getAll: async (): Promise<ReferenceItem[]> => {
        const response = await apiClient.get<ReferenceItem[]>(BASE_PATH);
        return response.data;
    },

    /**
     * Get items with pagination.
     */
    getAllPaginated: async (page: number = 0, size: number = 20): Promise<PaginatedResponse<ReferenceItem>> => {
        console.log(`[API Call] TESSST getAllPaginated - page: ${page}, size: ${size}`);
        const response = await apiClient.get<PaginatedResponse<ReferenceItem>>(BASE_PATH, {
            params: { page, size, paginate: true },
        });
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
