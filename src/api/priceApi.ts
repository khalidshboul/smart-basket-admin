import { apiClient } from './client';
import type { StorePrice, BatchPriceUpdateRequest, BatchPriceUpdateResponse } from '../types';

const BASE_PATH = 'prices';

export const priceApi = {
    /**
     * Update a single item's price
     */
    updatePrice: async (
        storeItemId: string,
        price: number,
        originalPrice?: number,
        currency?: string,
        isPromotion?: boolean
    ): Promise<StorePrice> => {
        const params = new URLSearchParams();
        params.append('storeItemId', storeItemId);
        params.append('price', price.toString());
        if (originalPrice !== undefined) params.append('originalPrice', originalPrice.toString());
        if (currency) params.append('currency', currency);
        if (isPromotion !== undefined) params.append('isPromotion', isPromotion.toString());

        const response = await apiClient.post<StorePrice>(`${BASE_PATH}?${params.toString()}`);
        return response.data;
    },

    /**
     * Batch update prices for multiple items
     */
    batchUpdatePrices: async (request: BatchPriceUpdateRequest): Promise<BatchPriceUpdateResponse> => {
        const response = await apiClient.post<BatchPriceUpdateResponse>(
            `${BASE_PATH}/batch`,
            request
        );
        return response.data;
    },

    /**
     * Get price history for a store item
     */
    getPriceHistory: async (storeItemId: string): Promise<StorePrice[]> => {
        const response = await apiClient.get<StorePrice[]>(
            `${BASE_PATH}/history/${storeItemId}`
        );
        return response.data;
    },
};
