import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { MapPin, PlusCircle, LayoutDashboard, User, ShieldCheck } from 'lucide-react';
import { useUiMode } from '../context/UiModeContext';

const Layout = () => {
    const { uiMode, toggleUiMode } = useUiMode();
    const navigate = useNavigate();

    const handleSwitchUi = () => {
        const result = toggleUiMode();
        if (!result.success) {
            alert(result.error);
        } else {
            if (result.mode === 'admin') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 font-bold text-xl text-civic-900">
                        <div className="bg-civic-600 text-white p-1.5 rounded-lg">
                            <MapPin size={20} />
                        </div>
                        <span>CivicFix</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
                        <Link to="/" className="hover:text-civic-600 transition-colors">Home</Link>
                        <Link to="/report" className="hover:text-civic-600 transition-colors">Report Issue</Link>
                        {uiMode === 'admin' && (
                            <Link to="/admin" className="hover:text-civic-600 transition-colors">Dashboard</Link>
                        )}

                        <button
                            onClick={handleSwitchUi}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                                ${uiMode === 'admin'
                                    ? 'bg-civic-100 text-civic-700 hover:bg-civic-200 border border-civic-200'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'}
                            `}
                        >
                            {uiMode === 'admin' ? <User size={14} /> : <ShieldCheck size={14} />}
                            {uiMode === 'admin' ? 'Switch to User UI' : 'Switch to Admin UI'}
                        </button>
                    </nav>

                    <Link to="/report" className="md:hidden text-civic-600">
                        <PlusCircle size={24} />
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 py-6">
                <Outlet />
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 flex items-center justify-around z-50 pb-safe">
                <Link to="/" className="flex flex-col items-center gap-1 text-xs text-slate-500 hover:text-civic-600">
                    <MapPin size={20} />
                    Home
                </Link>
                <Link to="/report" className="flex flex-col items-center gap-1 text-xs text-civic-600 font-medium">
                    <PlusCircle size={24} />
                    Report
                </Link>
                <Link to="/admin" className="flex flex-col items-center gap-1 text-xs text-slate-500 hover:text-civic-600">
                    <LayoutDashboard size={20} />
                    Admin
                </Link>
            </nav>
        </div>
    );
};

export default Layout;
