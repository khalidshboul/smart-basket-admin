import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
    ShoppingCart,
    LayoutDashboard,
    FolderOpen,
    Package,
    Store,
    DollarSign,
    Eye,
    Menu,
    X
} from 'lucide-react';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/categories', icon: FolderOpen, label: 'Categories' },
    { to: '/items', icon: Package, label: 'Items' },
    { to: '/stores', icon: Store, label: 'Stores' },
    { to: '/prices', icon: DollarSign, label: 'Prices' },
    { to: '/preview', icon: Eye, label: 'Preview' },
];

const SIDEBAR_KEY = 'sidebar-collapsed';

export function Layout({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem(SIDEBAR_KEY);
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem(SIDEBAR_KEY, String(isCollapsed));
    }, [isCollapsed]);

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white flex flex-col fixed h-full transition-all duration-300`}>
                {/* Logo & Toggle */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}>
                        <ShoppingCart size={28} className="text-primary-400 flex-shrink-0" />
                        {!isCollapsed && <span className="font-bold text-lg">Smart Basket</span>}
                    </div>
                    {!isCollapsed && (
                        <button
                            onClick={toggleSidebar}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            title="Collapse sidebar"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Expand button when collapsed */}
                {isCollapsed && (
                    <button
                        onClick={toggleSidebar}
                        className="p-3 mx-auto mt-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Expand sidebar"
                    >
                        <Menu size={20} />
                    </button>
                )}

                {/* Navigation */}
                <nav className="flex-1 p-2 space-y-1 mt-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${isCollapsed ? 'justify-center' : ''
                                } ${isActive
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/50'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`
                            }
                            title={isCollapsed ? item.label : undefined}
                        >
                            <item.icon size={20} />
                            {!isCollapsed && <span className="font-medium">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800">
                    {!isCollapsed && (
                        <div className="text-xs text-slate-500 text-center">
                            Admin Panel v1.0
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 ${isCollapsed ? 'ml-20' : 'ml-64'} p-8 bg-slate-50 min-h-screen transition-all duration-300`}>
                <div className="max-w-7xl mx-auto animate-in">
                    {children}
                </div>
            </main>
        </div>
    );
}
