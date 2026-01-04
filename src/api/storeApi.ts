import { apiClient } from './client';
import type { Store, CreateStoreRequest } from '../types';

const BASE_PATH = 'stores';

export const storeApi = {
    getAll: async (): Promise<Store[]> => {
        const response = await apiClient.get<Store[]>(BASE_PATH);
        return response.data;
    },

    getActive: async (): Promise<Store[]> => {
        const response = await apiClient.get<Store[]>(`${BASE_PATH}/active`);
        return response.data;
    },

    getById: async (id: string): Promise<Store> => {
        const response = await apiClient.get<Store>(`${BASE_PATH}/${id}`);
        return response.data;
    },

    create: async (data: CreateStoreRequest): Promise<Store> => {
        const response = await apiClient.post<Store>(BASE_PATH, data);
        return response.data;
    },

    update: async (id: string, data: CreateStoreRequest): Promise<Store> => {
        const response = await apiClient.put<Store>(`${BASE_PATH}/${id}`, data);
        return response.data;
    },

    toggleStatus: async (id: string): Promise<Store> => {
        const response = await apiClient.patch<Store>(`${BASE_PATH}/${id}/toggle-status`);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`${BASE_PATH}/${id}`);
    },
};
