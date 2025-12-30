import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUiMode } from '../context/UiModeContext';
import axios from 'axios';
import { Loader2, Map, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import PriorityHeatmap from '../components/PriorityHeatmap';

const AdminDashboard = () => {
    const { uiMode } = useUiMode();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (uiMode !== 'admin') {
            navigate('/');
            return;
        }
        fetchTickets();
    }, [uiMode, navigate]);

    const fetchTickets = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/tickets');
            setTickets(res.data);
        } catch (err) {
            console.error("Error fetching tickets:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-civic-600" /></div>;

    const highPriority = tickets.filter(t => t.aiAnalysis?.severity === 'High');
    const recentTickets = tickets;

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">City Admin Dashboard</h2>
                <div className="flex gap-2">
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <AlertTriangle size={16} /> {highPriority.length} Critical
                    </span>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <CheckCircle2 size={16} /> {tickets.length} Total
                    </span>
                </div>
            </header>

            {/* Heatmap Placeholder */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2"><Map size={18} /> Priority Heatmap</h3>
                    <span className="text-xs text-slate-400">Live Updates</span>
                </div>
                <div className="aspect-[3/1] bg-slate-100 rounded-lg flex items-center justify-center relative overflow-hidden group">
                    <PriorityHeatmap tickets={tickets} />
                </div>
            </div>

            {/* Kanban / List View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Open / New Column */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 h-full">
                    <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> New Reports
                    </h4>
                    <div className="space-y-3">
                        {recentTickets.map(ticket => (
                            <div key={ticket._id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${ticket.aiAnalysis?.severity === 'High' ? 'bg-red-50 text-red-600' :
                                        ticket.aiAnalysis?.severity === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                                        }`}>
                                        {ticket.aiAnalysis?.severity || 'Unknown'}
                                    </span>
                                    <span className="text-[10px] text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                </div>
                                <h5 className="font-medium text-slate-900 text-sm mb-1 line-clamp-1">{ticket.aiAnalysis?.issueType || 'Unspecified Issue'}</h5>
                                <p className="text-xs text-slate-500 line-clamp-2">{ticket.userDescription || ticket.aiAnalysis?.description || 'No description available'}</p>
                                <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
                                    <Clock size={12} />
                                    <span>Due: {ticket.sla?.expectedResolutionDate ? new Date(ticket.sla.expectedResolutionDate).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>
                        ))}
                        {recentTickets.length === 0 && (
                            <p className="text-center text-sm text-slate-400 py-8">No open tickets</p>
                        )}
                    </div>
                </div>

                {/* In Progress Column (Static Mock for now) */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 h-full opacity-60">
                    <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span> In Progress
                    </h4>
                    <p className="text-xs text-slate-400 text-center">Drag items here to assign</p>
                </div>

                {/* Resolved Column (Static Mock for now) */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 h-full opacity-60">
                    <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Resolved
                    </h4>
                    <p className="text-xs text-slate-400 text-center">Completed tickets moved here</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
