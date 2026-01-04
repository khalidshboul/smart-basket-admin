import { useQuery } from '@tanstack/react-query';
import { referenceItemApi } from '../api/referenceItemApi';
import { storeApi } from '../api/storeApi';
import { categoryApi } from '../api/categoryApi';
import { FolderOpen, Package, Store, DollarSign, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Dashboard() {
    const { data: items = [] } = useQuery({
        queryKey: ['items'],
        queryFn: referenceItemApi.getAll,
    });

    const { data: stores = [] } = useQuery({
        queryKey: ['stores'],
        queryFn: storeApi.getAll,
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: categoryApi.getAll,
    });

    const activeStores = stores.filter(s => s.active).length;

    const stats = [
        { icon: FolderOpen, label: 'Categories', value: categories.length, color: 'bg-blue-100 text-blue-600', link: '/categories' },
        { icon: Package, label: 'Items', value: items.length, color: 'bg-green-100 text-green-600', link: '/items' },
        { icon: Store, label: 'Active Stores', value: activeStores, color: 'bg-purple-100 text-purple-600', link: '/stores' },
        { icon: DollarSign, label: 'Total Stores', value: stores.length, color: 'bg-amber-100 text-amber-600', link: '/stores' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Welcome to Smart Basket Admin Panel
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Link to={stat.link} key={stat.label} className="card flex items-center gap-4 hover:shadow-md transition-all">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
                            <div className="text-sm text-slate-500">{stat.label}</div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="card">
                <h2 className="font-bold text-lg text-slate-800 mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                    <Link to="/categories" className="btn btn-secondary flex items-center gap-2">
                        <FolderOpen size={16} />
                        Manage Categories
                    </Link>
                    <Link to="/items" className="btn btn-secondary flex items-center gap-2">
                        <Package size={16} />
                        Manage Items
                    </Link>
                    <Link to="/stores" className="btn btn-secondary flex items-center gap-2">
                        <Store size={16} />
                        Manage Stores
                    </Link>
                    <Link to="/prices" className="btn btn-primary flex items-center gap-2">
                        <DollarSign size={16} />
                        Update Prices
                    </Link>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="card">
                    <h3 className="font-bold text-slate-800 mb-2">Getting Started</h3>
                    <ol className="list-decimal list-inside text-sm text-slate-600 space-y-2">
                        <li>Create categories to organize your products</li>
                        <li>Add reference items (generic products)</li>
                        <li>Set up stores (hypermarket locations)</li>
                        <li>Update prices for each market</li>
                        <li>Preview how users will see the data</li>
                    </ol>
                </div>
                <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
                    <h3 className="font-bold text-lg mb-2">Smart Basket</h3>
                    <p className="text-primary-100 text-sm mb-4">
                        Help users compare prices across hypermarkets and find the best deals for their shopping lists.
                    </p>
                    <Link to="/preview" className="inline-flex items-center gap-2 bg-white text-primary-700 px-4 py-2 rounded-xl font-medium hover:bg-primary-50 transition-all">
                        Preview App
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
