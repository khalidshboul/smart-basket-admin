import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { referenceItemApi } from '../api/referenceItemApi';
import { storeApi } from '../api/storeApi';
import { storeItemApi } from '../api/storeItemApi';
import { priceApi } from '../api/priceApi';
import { categoryApi } from '../api/categoryApi';
import { Search, ChevronDown, Package, Save, X } from 'lucide-react';
import type { StoreItem } from '../types';

interface PendingChange {
    storeItemId: string;
    discountPrice: number;
    originalPrice: number | null;
}

interface PendingNewItem {
    referenceItemId: string;
    storeId: string;
    price: number;
    originalPrice: number | null;
}

export function PricesPage() {
    const queryClient = useQueryClient();
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [pendingChanges, setPendingChanges] = useState<Map<string, PendingChange>>(new Map());
    const [pendingNewItems, setPendingNewItems] = useState<PendingNewItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    const { data: items = [], isLoading: itemsLoading } = useQuery({
        queryKey: ['items'],
        queryFn: referenceItemApi.getAll,
    });

    const { data: stores = [] } = useQuery({
        queryKey: ['stores', 'active'],
        queryFn: storeApi.getActive,
    });

    const { data: storeItems = [] } = useQuery({
        queryKey: ['storeItems'],
        queryFn: storeItemApi.getAll,
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: categoryApi.getAll,
    });

    const updateMutation = useMutation({
        mutationFn: ({ storeItemId, price, originalPrice }: { storeItemId: string; price: number; originalPrice?: number }) =>
            priceApi.updatePrice(storeItemId, price, originalPrice),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['storeItems'] }),
    });

    const createMutation = useMutation({
        mutationFn: storeItemApi.create,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['storeItems'] }),
    });

    // Filter items
    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !filterCategory || item.categoryId === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const toggleExpand = (id: string) => {
        setExpandedItems(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const getStoreItem = (refItemId: string, storeId: string): StoreItem | undefined => {
        return storeItems.find(si => si.referenceItemId === refItemId && si.storeId === storeId);
    };

    const handlePriceChange = (storeItemId: string, field: 'discountPrice' | 'originalPrice', value: string) => {
        const numValue = parseFloat(value) || 0;

        // Find the actual StoreItem to preserve its values
        const storeItem = storeItems.find(si => si.id === storeItemId);

        setPendingChanges(prev => {
            const next = new Map(prev);
            // Use existing pending change, or fallback to actual StoreItem values
            const existing = next.get(storeItemId) || {
                storeItemId,
                discountPrice: storeItem?.discountPrice ?? 0,
                originalPrice: storeItem?.originalPrice ?? null,
            };
            next.set(storeItemId, {
                ...existing,
                [field]: field === 'originalPrice' && value === '' ? null : numValue
            });
            return next;
        });
    };

    const handleNewItemPrice = (refItemId: string, storeId: string, field: 'price' | 'originalPrice', value: string) => {
        const numValue = parseFloat(value) || 0;
        setPendingNewItems(prev => {
            const idx = prev.findIndex(p => p.referenceItemId === refItemId && p.storeId === storeId);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...next[idx], [field]: field === 'originalPrice' && value === '' ? null : numValue };
                return next;
            }
            return [...prev, { referenceItemId: refItemId, storeId, price: field === 'price' ? numValue : 0, originalPrice: field === 'originalPrice' ? numValue : null }];
        });
    };

    const saveAllChanges = async () => {
        // Save price updates
        for (const change of pendingChanges.values()) {
            await updateMutation.mutateAsync({
                storeItemId: change.storeItemId,
                price: change.discountPrice,
                originalPrice: change.originalPrice ?? undefined,
            });
        }
        // Create new store items
        for (const newItem of pendingNewItems) {
            if (newItem.price > 0) {
                await createMutation.mutateAsync({
                    referenceItemId: newItem.referenceItemId,
                    storeId: newItem.storeId,
                    name: items.find(i => i.id === newItem.referenceItemId)?.name || '',
                    initialPrice: newItem.price,
                    originalPrice: newItem.originalPrice ?? undefined,
                });
            }
        }
        setPendingChanges(new Map());
        setPendingNewItems([]);
    };

    const discardChanges = () => {
        setPendingChanges(new Map());
        setPendingNewItems([]);
    };

    const hasChanges = pendingChanges.size > 0 || pendingNewItems.length > 0;

    if (itemsLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-400">Loading prices...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Price Management</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Update and track prices across all stores.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="form-input pl-10"
                    />
                </div>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="form-input w-full sm:w-48"
                >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            {/* Items Accordion */}
            <div className="space-y-2">
                {filteredItems.map(item => {
                    const isExpanded = expandedItems.has(item.id);
                    return (
                        <div key={item.id} className="card p-0 overflow-hidden">
                            {/* Item Header */}
                            <button
                                onClick={() => toggleExpand(item.id)}
                                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Package size={20} className="text-slate-400" />
                                    <div className="text-left">
                                        <div className="font-semibold text-slate-800">{item.name}</div>
                                        <span className="badge badge-success text-xs">{item.category}</span>
                                    </div>
                                </div>
                                <ChevronDown size={20} className={`text-slate-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="border-t border-slate-100 p-4 bg-slate-50">
                                    {((item.availableInAllStores ?? true) ? stores : stores.filter(store => item.specificStoreIds?.includes(store.id))).length === 0 ? (
                                        <div className="text-center py-4 text-slate-400">
                                            No stores available for this item. {(item.availableInAllStores ?? true) ? <a href="/stores" className="text-primary-600 hover:underline">Add a store first</a> : 'Update item to select specific stores.'}
                                        </div>
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-slate-500">
                                                    <th className="pb-2">Store</th>
                                                    <th className="pb-2">Original Price</th>
                                                    <th className="pb-2">Discount Price</th>
                                                    <th className="pb-2">Discount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {((item.availableInAllStores ?? true) ? stores : stores.filter(store => item.specificStoreIds?.includes(store.id))).map(store => {
                                                    const si = getStoreItem(item.id, store.id);
                                                    const pendingChange = si ? pendingChanges.get(si.id) : undefined;
                                                    const pendingNew = pendingNewItems.find(p => p.referenceItemId === item.id && p.storeId === store.id);

                                                    const discountPrice = pendingChange?.discountPrice ?? si?.discountPrice ?? pendingNew?.price ?? 0;
                                                    const originalPrice = pendingChange?.originalPrice ?? si?.originalPrice ?? pendingNew?.originalPrice ?? null;
                                                    const isInvalidDiscount = originalPrice !== null && discountPrice > originalPrice;
                                                    const discount = originalPrice && originalPrice > discountPrice && discountPrice > 0
                                                        ? Math.round(((originalPrice - discountPrice) / originalPrice) * 100)
                                                        : null;

                                                    return (
                                                        <tr key={store.id} className="border-t border-slate-200">
                                                            <td className="py-2 font-medium">
                                                                {store.name}
                                                                {!store.active && <span className="ml-2 text-xs text-slate-400">(inactive)</span>}
                                                            </td>
                                                            <td className="py-2">
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    className="form-input w-24 py-1 px-2 text-sm"
                                                                    value={originalPrice || ''}
                                                                    onChange={(e) => {
                                                                        if (si) handlePriceChange(si.id, 'originalPrice', e.target.value);
                                                                        else handleNewItemPrice(item.id, store.id, 'originalPrice', e.target.value);
                                                                    }}
                                                                    placeholder="0.00"
                                                                />
                                                            </td>
                                                            <td className="py-2">
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    className={`form-input w-24 py-1 px-2 text-sm ${isInvalidDiscount ? 'border-red-500' : ''}`}
                                                                    value={discountPrice || ''}
                                                                    onChange={(e) => {
                                                                        if (si) handlePriceChange(si.id, 'discountPrice', e.target.value);
                                                                        else handleNewItemPrice(item.id, store.id, 'price', e.target.value);
                                                                    }}
                                                                    placeholder="0.00"
                                                                />
                                                            </td>
                                                            <td className="py-2">
                                                                {discount ? (
                                                                    <span className="badge badge-success">-{discount}%</span>
                                                                ) : (
                                                                    <span className="text-slate-400">—</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Floating Action Bar */}
            {hasChanges && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 ml-32 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-50">
                    <span className="text-sm">
                        {pendingChanges.size} updates, {pendingNewItems.filter(p => p.price > 0).length} new
                    </span>
                    <button onClick={discardChanges} className="btn btn-secondary btn-sm flex items-center gap-1">
                        <X size={14} />
                        Discard
                    </button>
                    <button onClick={saveAllChanges} className="btn btn-primary btn-sm flex items-center gap-1">
                        <Save size={14} />
                        Save All
                    </button>
                </div>
            )}
        </div>
    );
}
