// ============ Category Types ============

export interface Category {
    id: string;
    name: string;
    nameAr: string | null;
    icon: string | null;
    description: string | null;
    descriptionAr: string | null;
    displayOrder: number;
    active: boolean;
}

export interface CreateCategoryRequest {
    name: string;
    nameAr?: string;
    icon?: string;
    description?: string;
    descriptionAr?: string;
    displayOrder?: number;
    active?: boolean;
}

// ============ Reference Item Types ============

export interface ReferenceItem {
    id: string;
    name: string;
    nameAr: string | null;
    categoryId: string;
    category: string; // Denormalized category name
    description: string;
    descriptionAr: string | null;
    images: string[];
    availableInAllStores: boolean;
    specificStoreIds: string[];
    active: boolean;
}

export interface CreateReferenceItemRequest {
    name: string;
    nameAr?: string;
    categoryId: string;
    description?: string;
    descriptionAr?: string;
    images?: string[];
    availableInAllStores?: boolean;
    specificStoreIds?: string[];
}

// ============ Store Types ============

export interface Store {
    id: string;
    name: string;
    nameAr: string | null;
    location: string;
    locationAr: string | null;
    logoUrl: string;
    active: boolean;
}

export interface CreateStoreRequest {
    name: string;
    nameAr?: string;
    location?: string;
    locationAr?: string;
    logoUrl?: string;
}

// ============ Store Item Types ============

export interface StoreItem {
    id: string;
    storeId: string;
    storeName: string;
    referenceItemId: string;
    referenceItemName: string;
    name: string;
    nameAr: string | null;
    brand: string;
    barcode: string;
    images: string[];
    // Current price info
    discountPrice: number | null;
    originalPrice: number | null;
    discountPercentage: number | null;
    currency: string;
    isPromotion: boolean;
    lastPriceUpdate: string | null;
}

export interface CreateStoreItemRequest {
    storeId: string;
    referenceItemId: string;
    name: string;
    nameAr?: string;
    brand?: string;
    barcode?: string;
    images?: string[];
    initialPrice?: number;
    originalPrice?: number;
    currency?: string;
    isPromotion?: boolean;
}

// ============ Price Types ============

export interface StorePrice {
    id: string;
    storeItemId: string;
    price: number;
    originalPrice: number | null;
    currency: string;
    timestamp: string;
    isPromotion: boolean;
}

export interface PriceEntry {
    storeItemId: string;
    price: number;
    originalPrice?: number;
    currency?: string;
    isPromotion?: boolean;
}

export interface BatchPriceUpdateRequest {
    prices: PriceEntry[];
}

export interface PriceUpdateResult {
    storeItemId: string;
    success: boolean;
    message: string;
    newPrice: number | null;
}

export interface BatchPriceUpdateResponse {
    totalRequested: number;
    successCount: number;
    failureCount: number;
    results: PriceUpdateResult[];
}

// ============ Basket Comparison Types ============

export interface BasketComparisonRequest {
    referenceItemIds: string[];
}

export interface BasketComparisonResponse {
    basketItems: BasketItemInfo[];
    storeComparisons: StoreComparisonResult[];
    cheapestStoreId: string | null;
    cheapestStoreName: string | null;
    lowestTotal: number;
    highestTotal: number;
    potentialSavings: number;
}

export interface BasketItemInfo {
    referenceItemId: string;
    name: string;
    category: string;
}

export interface StoreComparisonResult {
    storeId: string;
    storeName: string;
    storeLogoUrl: string;
    totalPrice: number;
    currency: string;
    allItemsAvailable: boolean;
    itemPrices: StoreItemPriceInfo[];
    missingItems: string[];
    availableItemCount: number;
    totalItemCount: number;
}

export interface StoreItemPriceInfo {
    referenceItemId: string;
    referenceItemName: string;
    storeItemId: string;
    storeItemName: string;
    brand: string;
    price: number;
    currency: string;
    isPromotion: boolean;
    available: boolean;
}
