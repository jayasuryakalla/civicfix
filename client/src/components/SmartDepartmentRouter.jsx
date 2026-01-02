import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, ArrowRight, CheckCircle2, AlertTriangle, Building2, MapPin } from 'lucide-react';

const SmartDepartmentRouter = ({ description, location, onAnalysisComplete }) => {
    const [routingData, setRoutingData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Debounce analysis
    useEffect(() => {
        const timer = setTimeout(() => {
            if (description && description.length > 10) {
                analyze();
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [description, location]);

    const analyze = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/routing/analyze`, {
                text: description,
                lat: location?.lat,
                lng: location?.lng
            });
            if (res.data.success) {
                setRoutingData(res.data.data);
                if (onAnalysisComplete) {
                    onAnalysisComplete(res.data.data);
                }
            }
        } catch (error) {
            console.error("Analysis failed", error);
        } finally {
            setLoading(false);
        }
    };

    if (!description || description.length <= 10) {
        return (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-slate-500 text-sm">
                <WandIcon className="mx-auto mb-2 opacity-50" size={24} />
                <p>Describe your issue to see smart department routing.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-civic-50 border border-civic-100 rounded-xl p-4 flex items-center gap-3 text-civic-700 animate-pulse">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm font-medium">Analyzing complaint context & location...</span>
            </div>
        );
    }

    if (!routingData) return null;

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Building2 size={12} /> Smart Routing
                </span>
                <span className="text-xs font-mono text-slate-400">Confidence: {(routingData.confidence * 100).toFixed(0)}%</span>
            </div>

            <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-civic-100 text-civic-600 rounded-lg">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 leading-tight">
                            {routingData.department}
                        </h4>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={12} /> {routingData.zone}
                        </p>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 border border-slate-100">
                    <p className="italic">"{routingData.reasoning}"</p>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium">
                    <span className={`px-2 py-0.5 rounded ${routingData.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                        routingData.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                        }`}>
                        {routingData.priority} Priority
                    </span>
                </div>
            </div>
        </div>
    );
};

const WandIcon = ({ className, size }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M15 4V2" />
        <path d="M15 16v-2" />
        <path d="M8 9h2" />
        <path d="M20 9h2" />
        <path d="M17.8 11.8 19 13" />
        <path d="M15 9h0" />
        <path d="M17.8 6.2 19 5" />
        <path d="m3 21 9-9" />
        <path d="M12.2 6.2 11 5" />
    </svg>
);

export default SmartDepartmentRouter;
