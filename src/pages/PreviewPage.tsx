import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { referenceItemApi } from '../api/referenceItemApi';
import { storeItemApi } from '../api/storeItemApi';
import { storeApi } from '../api/storeApi';
import { categoryApi } from '../api/categoryApi';
import { Search, Package, Plus, Minus, ShoppingCart, Trophy, ArrowLeft } from 'lucide-react';

export function PreviewPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [cart, setCart] = useState<Map<string, number>>(new Map());
    const [showCheckout, setShowCheckout] = useState(false);

    const { data: items = [] } = useQuery({
        queryKey: ['items'],
        queryFn: referenceItemApi.getAll,
    });

    const { data: storeItems = [] } = useQuery({
        queryKey: ['storeItems'],
        queryFn: storeItemApi.getAll,
    });

    const { data: stores = [] } = useQuery({
        queryKey: ['stores'],
        queryFn: storeApi.getAll,
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['categories', 'active'],
        queryFn: categoryApi.getActive,
    });

    // Only show active items and stores
    const activeItems = items.filter(item => item.active);
    const activeStores = stores.filter(store => store.active);

    // Filter items by search and category
    const filteredItems = activeItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !filterCategory || item.categoryId === filterCategory;
        return matchesSearch && matchesCategory;
    });

    // Cart functions
    const addToCart = (itemId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setCart(prev => new Map(prev).set(itemId, (prev.get(itemId) || 0) + 1));
    };

    const removeFromCart = (itemId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setCart(prev => {
            const next = new Map(prev);
            const current = prev.get(itemId) || 0;
            if (current <= 1) {
                next.delete(itemId);
            } else {
                next.set(itemId, current - 1);
            }
            return next;
        });
    };

    const getCartQuantity = (itemId: string) => cart.get(itemId) || 0;
    const cartItemCount = () => Array.from(cart.values()).reduce((sum, qty) => sum + qty, 0);

    // Get cart items for checkout
    const cartItems = activeItems.filter(item => cart.has(item.id));

    // Calculate store totals for checkout
    const getStoreTotals = () => {
        const storeTotals: Array<{
            store: typeof activeStores[0];
            items: Array<{ name: string; price: number | null; quantity: number }>;
            total: number;
            hasAllItems: boolean;
        }> = [];

        for (const store of activeStores) {
            const itemPrices: Array<{ name: string; price: number | null; quantity: number }> = [];
            let total = 0;
            let hasAllItems = true;

            for (const [itemId, quantity] of cart.entries()) {
                const item = activeItems.find(i => i.id === itemId);
                const storeItem = storeItems.find(si => si.referenceItemId === itemId && si.storeId === store.id);
                // Use discount price, fallback to original price if not set
                let price = storeItem?.discountPrice ?? null;
                if (price === null || price <= 0) {
                    price = storeItem?.originalPrice ?? null;
                }

                itemPrices.push({
                    name: item?.name || 'Unknown',
                    price,
                    quantity,
                });

                if (price !== null) {
                    total += price * quantity;
                } else {
                    hasAllItems = false;
                }
            }

            storeTotals.push({ store, items: itemPrices, total, hasAllItems });
        }

        // Sort by total (cheapest first), but items with missing prices go last
        storeTotals.sort((a, b) => {
            if (a.hasAllItems && !b.hasAllItems) return -1;
            if (!a.hasAllItems && b.hasAllItems) return 1;
            return a.total - b.total;
        });

        return storeTotals;
    };

    const storeTotals = showCheckout ? getStoreTotals() : [];
    const cheapestStore = storeTotals.find(st => st.hasAllItems);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">User Preview</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Simulate the mobile shopping experience.
                </p>
            </div>

            {/* Phone Frame */}
            <div className="flex justify-center">
                <div className="w-full max-w-sm bg-slate-900 rounded-[3rem] p-3 shadow-2xl">
                    <div className="bg-white rounded-[2.5rem] overflow-hidden relative">
                        {/* Status Bar */}
                        <div className="bg-slate-100 px-6 py-2 flex justify-between items-center text-xs text-slate-600">
                            <span>9:41</span>
                            <div className="flex gap-1">
                                <span>📶</span>
                                <span>🔋</span>
                            </div>
                        </div>

                        {/* App Content */}
                        <div className="h-[600px] overflow-y-auto">
                            {!showCheckout ? (
                                <>
                                    {/* Search */}
                                    <div className="sticky top-0 bg-white p-4 border-b border-slate-100 z-10">
                                        <div className="relative">
                                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search products..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full bg-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Category Pills */}
                                    <div className="flex gap-2 p-4 overflow-x-auto">
                                        <button
                                            onClick={() => setFilterCategory('')}
                                            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${!filterCategory
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-slate-100 text-slate-700'
                                                }`}
                                        >
                                            All
                                        </button>
                                        {categories.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setFilterCategory(cat.id)}
                                                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${filterCategory === cat.id
                                                    ? 'bg-primary-600 text-white'
                                                    : 'bg-slate-100 text-slate-700'
                                                    }`}
                                            >
                                                {cat.icon} {cat.name}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Items List */}
                                    <div className="p-4 space-y-3 pb-24">
                                        {filteredItems.length === 0 ? (
                                            <div className="text-center py-8 text-slate-400">
                                                No items found
                                            </div>
                                        ) : (
                                            filteredItems.map(item => {
                                                const qty = getCartQuantity(item.id);
                                                return (
                                                    <div key={item.id} className="bg-slate-50 rounded-2xl p-4">
                                                        <div className="flex gap-3 items-center">
                                                            {/* Image */}
                                                            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                                                {item.images?.[0] ? (
                                                                    <img src={item.images[0]} alt="" className="w-full h-full object-cover rounded-xl" />
                                                                ) : (
                                                                    <Package size={22} className="text-slate-300" />
                                                                )}
                                                            </div>

                                                            {/* Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-semibold text-slate-800 truncate">{item.name}</div>
                                                                <div className="text-xs text-slate-500">{item.category}</div>
                                                            </div>

                                                            {/* Cart Controls */}
                                                            {qty === 0 ? (
                                                                <button
                                                                    onClick={(e) => addToCart(item.id, e)}
                                                                    className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-emerald-700 transition-colors"
                                                                >
                                                                    <Plus size={20} />
                                                                </button>
                                                            ) : (
                                                                <div className="flex items-center gap-2 bg-emerald-100 rounded-full px-1 py-1">
                                                                    <button
                                                                        onClick={(e) => removeFromCart(item.id, e)}
                                                                        className="w-8 h-8 bg-white text-emerald-600 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50"
                                                                    >
                                                                        <Minus size={16} />
                                                                    </button>
                                                                    <span className="w-6 text-center font-semibold text-emerald-700">{qty}</span>
                                                                    <button
                                                                        onClick={(e) => addToCart(item.id, e)}
                                                                        className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-emerald-700"
                                                                    >
                                                                        <Plus size={16} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Floating Cart Bar */}
                                    {cartItemCount() > 0 && (
                                        <div className="absolute bottom-12 left-4 right-4">
                                            <button
                                                onClick={() => setShowCheckout(true)}
                                                className="w-full bg-slate-800 text-white rounded-2xl py-4 px-6 flex items-center justify-between shadow-lg hover:bg-slate-900 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <ShoppingCart size={20} />
                                                    <span className="font-semibold">
                                                        {cartItemCount()} item{cartItemCount() > 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <span className="font-semibold">Checkout →</span>
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* Checkout View */
                                <div className="p-4 pb-8">
                                    <button
                                        onClick={() => setShowCheckout(false)}
                                        className="flex items-center gap-2 text-slate-600 mb-4 hover:text-slate-800"
                                    >
                                        <ArrowLeft size={20} />
                                        <span>Back to shopping</span>
                                    </button>

                                    <h2 className="text-lg font-bold text-slate-800 mb-2">Your Cart</h2>

                                    {/* Cart Items Summary */}
                                    <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-1">
                                        {cartItems.map(item => (
                                            <div key={item.id} className="flex justify-between text-sm">
                                                <span className="text-slate-700">{item.name}</span>
                                                <span className="text-slate-500">×{cart.get(item.id)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <h3 className="text-base font-bold text-slate-800 mb-3">Store Comparison</h3>

                                    {/* Store Totals */}
                                    <div className="space-y-3">
                                        {storeTotals.map((st) => {
                                            const isCheapest = cheapestStore?.store.id === st.store.id;
                                            const missingItems = st.items.filter(itm => itm.price === null);

                                            return (
                                                <div
                                                    key={st.store.id}
                                                    className={`rounded-xl p-4 border-2 transition-all ${isCheapest
                                                        ? 'border-green-500 bg-green-50'
                                                        : st.hasAllItems
                                                            ? 'border-slate-200 bg-white'
                                                            : 'border-slate-200 bg-slate-100 opacity-60'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            {isCheapest && <Trophy size={16} className="text-green-600" />}
                                                            <span className={`font-semibold ${st.hasAllItems ? 'text-slate-800' : 'text-slate-500'}`}>
                                                                {st.store.name}
                                                            </span>
                                                            {isCheapest && (
                                                                <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Best</span>
                                                            )}
                                                            {!st.hasAllItems && (
                                                                <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">Incomplete</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Item Prices */}
                                                    <div className="space-y-1 mb-3">
                                                        {st.items.map((itm, i) => (
                                                            <div key={i} className={`flex justify-between text-sm ${itm.price === null ? 'opacity-50' : ''}`}>
                                                                <span className={itm.price === null ? 'text-red-500 line-through' : 'text-slate-600'}>
                                                                    {itm.name} ×{itm.quantity}
                                                                </span>
                                                                {itm.price !== null ? (
                                                                    <span className="text-slate-800">
                                                                        ${(itm.price * itm.quantity).toFixed(2)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-red-500 text-xs">Not available</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Missing Items Warning */}
                                                    {!st.hasAllItems && missingItems.length > 0 && (
                                                        <div className="text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1 mb-2">
                                                            Missing: {missingItems.map(m => m.name).join(', ')}
                                                        </div>
                                                    )}

                                                    {/* Total */}
                                                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                                        <span className="font-semibold text-slate-700">
                                                            {st.hasAllItems ? 'Total' : 'Available items'}
                                                        </span>
                                                        <span className={`text-lg font-bold ${isCheapest ? 'text-green-600' : st.hasAllItems ? 'text-slate-800' : 'text-slate-500'
                                                            }`}>
                                                            ${st.total.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Home Indicator */}
                        <div className="bg-white pb-2 pt-1 flex justify-center">
                            <div className="w-32 h-1 bg-slate-300 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="text-center text-sm text-slate-500">
                This preview simulates the mobile shopping experience.
            </div>
        </div>
    );
}
