import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { referenceItemApi } from '../api/referenceItemApi';
import { Search, ScanBarcode, Package, Store, TrendingDown, AlertCircle } from 'lucide-react';

export function BarcodeSearchPage() {
    const [barcodeInput, setBarcodeInput] = useState('');
    const [searchedBarcode, setSearchedBarcode] = useState('');

    // Single API call that returns both reference item AND store prices
    const { data: searchResult, isLoading, isFetched } = useQuery({
        queryKey: ['barcodeSearch', searchedBarcode],
        queryFn: () => referenceItemApi.searchByBarcode(searchedBarcode),
        enabled: searchedBarcode.trim().length > 0,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchedBarcode(barcodeInput.trim());
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch(e);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <ScanBarcode size={28} className="text-primary-500" />
                    Barcode Search
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Search for items by barcode to compare prices across all stores.
                </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="card p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Enter barcode (e.g., 6291003081024)"
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="form-input pl-10 text-lg font-mono"
                            autoFocus
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!barcodeInput.trim()}
                        className="btn btn-primary flex items-center gap-2 px-6"
                    >
                        <ScanBarcode size={20} />
                        Search
                    </button>
                </div>
            </form>

            {/* Loading State */}
            {isLoading && (
                <div className="card p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="text-slate-500 mt-3">Searching for barcode...</p>
                </div>
            )}

            {/* No Results */}
            {isFetched && searchedBarcode && !searchResult && !isLoading && (
                <div className="card p-8 text-center">
                    <AlertCircle size={48} className="text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No items found</h3>
                    <p className="text-slate-500">
                        No products with barcode <span className="font-mono font-semibold">{searchedBarcode}</span> were found.
                    </p>
                    <p className="text-slate-400 text-sm mt-2">
                        Add a barcode to a reference item in the Items page first.
                    </p>
                </div>
            )}

            {/* Results */}
            {searchResult && (
                <div className="space-y-4">
                    {/* Summary Card */}
                    <div className="card p-6 bg-gradient-to-r from-primary-50 to-white border-primary-200">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                                    <Package size={16} />
                                    <span className="font-mono">{searchedBarcode}</span>
                                </div>
                                <h2 className="text-xl font-bold text-slate-800">{searchResult.item.name}</h2>
                                <p className="text-slate-500 text-sm">{searchResult.item.category}</p>
                                <p className="text-slate-500 mt-1">
                                    Found in <span className="font-semibold text-primary-600">{searchResult.storeCount}</span> store{searchResult.storeCount !== 1 ? 's' : ''}
                                </p>
                            </div>
                            {searchResult.lowestPrice && (
                                <div className="text-right">
                                    <div className="text-xs text-slate-500 mb-1">Best Price</div>
                                    <div className="text-2xl font-bold text-green-600">
                                        {searchResult.lowestPrice.toFixed(2)} JOD
                                    </div>
                                    <div className="text-sm text-green-600 flex items-center gap-1 justify-end">
                                        <TrendingDown size={14} />
                                        {searchResult.cheapestStoreName}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* No Store Items Message */}
                    {searchResult.storePrices.length === 0 && (
                        <div className="card p-6 bg-amber-50 border-amber-200">
                            <p className="text-amber-800">
                                This item exists but has no store listings yet. Add prices in the Prices page.
                            </p>
                        </div>
                    )}

                    {/* Store Comparison Table */}
                    {searchResult.storePrices.length > 0 && (
                        <div className="card overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                                    <Store size={18} />
                                    Price Comparison by Store
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50 text-left text-sm text-slate-500">
                                            <th className="px-6 py-3 font-medium">Store</th>
                                            <th className="px-6 py-3 font-medium">Item Name</th>
                                            <th className="px-6 py-3 font-medium text-right">Original Price</th>
                                            <th className="px-6 py-3 font-medium text-right">Discount Price</th>
                                            <th className="px-6 py-3 font-medium text-center">Discount</th>
                                            <th className="px-6 py-3 font-medium text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {searchResult.storePrices.map((item) => {
                                            const isCheapest = item.storeName === searchResult.cheapestStoreName;
                                            const effectivePrice = item.discountPrice ?? item.originalPrice ?? 0;
                                            const hasDiscount = item.originalPrice && item.discountPrice && item.discountPrice < item.originalPrice;
                                            const discountPercent = hasDiscount
                                                ? Math.round(((item.originalPrice! - item.discountPrice!) / item.originalPrice!) * 100)
                                                : null;

                                            return (
                                                <tr
                                                    key={item.id}
                                                    className={`hover:bg-slate-50 transition-colors ${isCheapest ? 'bg-green-50' : ''}`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            {isCheapest && (
                                                                <span className="badge badge-success text-xs">Cheapest</span>
                                                            )}
                                                            <span className="font-medium text-slate-800">{item.storeName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600">{item.name || '—'}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        {item.originalPrice ? (
                                                            <span className={hasDiscount ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}>
                                                                {item.originalPrice.toFixed(2)} {item.currency || 'JOD'}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {item.discountPrice ? (
                                                            <span className={`font-semibold ${isCheapest ? 'text-green-600' : 'text-slate-800'}`}>
                                                                {item.discountPrice.toFixed(2)} {item.currency || 'JOD'}
                                                            </span>
                                                        ) : effectivePrice > 0 ? (
                                                            <span className="text-slate-800 font-medium">
                                                                {effectivePrice.toFixed(2)} {item.currency || 'JOD'}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {discountPercent && discountPercent > 0 ? (
                                                            <span className="badge badge-success">
                                                                -{discountPercent}%
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {item.isPromotion ? (
                                                            <span className="badge badge-warning">Promo</span>
                                                        ) : (
                                                            <span className="badge badge-secondary">Regular</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
