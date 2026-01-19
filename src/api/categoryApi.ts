import { apiClient } from './client';
import type { Category, CreateCategoryRequest } from '../types';

const BASE_PATH = 'categories';

export const categoryApi = {
    getAll: async (): Promise<Category[]> => {
        const response = await apiClient.get<Category[]>(BASE_PATH);
        return response.data;
    },

    getActive: async (): Promise<Category[]> => {
        const response = await apiClient.get<Category[]>(`${BASE_PATH}/active`);
        return response.data;
    },

    /**
     * Get only top-level categories (no parent)
     */
    getTopLevel: async (activeOnly = false): Promise<Category[]> => {
        const response = await apiClient.get<Category[]>(`${BASE_PATH}/top-level`, {
            params: { activeOnly }
        });
        return response.data;
    },

    /**
     * Get subcategories of a parent category
     */
    getSubcategories: async (parentId: string, activeOnly = false): Promise<Category[]> => {
        const response = await apiClient.get<Category[]>(`${BASE_PATH}/${parentId}/subcategories`, {
            params: { activeOnly }
        });
        return response.data;
    },

    /**
     * Get category with its subcategories populated
     */
    getWithSubcategories: async (id: string): Promise<Category> => {
        const response = await apiClient.get<Category>(`${BASE_PATH}/${id}/with-subcategories`);
        return response.data;
    },

    getById: async (id: string): Promise<Category> => {
        const response = await apiClient.get<Category>(`${BASE_PATH}/${id}`);
        return response.data;
    },

    create: async (data: CreateCategoryRequest): Promise<Category> => {
        const response = await apiClient.post<Category>(BASE_PATH, data);
        return response.data;
    },

    update: async (id: string, data: CreateCategoryRequest): Promise<Category> => {
        const response = await apiClient.put<Category>(`${BASE_PATH}/${id}`, data);
        return response.data;
    },

    toggleStatus: async (id: string): Promise<Category> => {
        const response = await apiClient.patch<Category>(`${BASE_PATH}/${id}/toggle-status`);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`${BASE_PATH}/${id}`);
    },
};
