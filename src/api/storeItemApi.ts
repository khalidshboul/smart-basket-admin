import { apiClient } from './client';
import type { StoreItem, CreateStoreItemRequest } from '../types';

const BASE_PATH = 'store-items';

export const storeItemApi = {
    /**
     * Get all store items
     */
    getAll: async (): Promise<StoreItem[]> => {
        const response = await apiClient.get<StoreItem[]>(BASE_PATH);
        return response.data;
    },

    /**
     * Create a new store item linked to a reference item
     */
    create: async (data: CreateStoreItemRequest): Promise<StoreItem> => {
        const response = await apiClient.post<StoreItem>(BASE_PATH, data);
        return response.data;
    },

    /**
     * Get a store item by ID
     */
    getById: async (id: string): Promise<StoreItem> => {
        const response = await apiClient.get<StoreItem>(`${BASE_PATH}/${id}`);
        return response.data;
    },

    /**
     * Get all store items for a specific reference item
     */
    getByReferenceItem: async (referenceItemId: string): Promise<StoreItem[]> => {
        const response = await apiClient.get<StoreItem[]>(
            `${BASE_PATH}/by-reference/${referenceItemId}`
        );
        return response.data;
    },

    /**
     * Get all store items for a specific store
     */
    getByStore: async (storeId: string): Promise<StoreItem[]> => {
        const response = await apiClient.get<StoreItem[]>(
            `${BASE_PATH}/by-store/${storeId}`
        );
        return response.data;
    },

    /**
     * Delete a store item
     */
    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`${BASE_PATH}/${id}`);
    },
};

