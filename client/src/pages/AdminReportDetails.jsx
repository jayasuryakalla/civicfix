import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, ArrowLeft, Calendar, MapPin, AlertTriangle, CheckCircle2, Clock, User } from 'lucide-react';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AdminReportDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchTicketDetails();
    }, [id]);

    const fetchTicketDetails = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tickets/${id}`);
            setTicket(res.data);
        } catch (err) {
            console.error("Error fetching ticket:", err);
            alert("Failed to load ticket details");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        setUpdating(true);
        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tickets/${id}/status`, { status: newStatus });
            setTicket(res.data.data);
            // alert("Status updated successfully");
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    const handleDepartmentOverride = async () => {
        const select = document.getElementById('dept-override-select');
        const newDept = select.value;

        if (newDept === ticket.department?.name) return;

        const reason = prompt("Enter reason for overriding department:", "Incorrect classification");
        if (!reason) return;

        setUpdating(true);
        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tickets/${id}/department`, {
                department: newDept,
                reason: reason
            });
            setTicket(res.data.data);
            alert("Department updated successfully");
        } catch (err) {
            console.error("Error updating department:", err);
            alert("Failed to update department");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-civic-600" size={48} /></div>;
    if (!ticket) return <div className="text-center py-20">Ticket not found</div>;

    const severityColor = ticket.aiAnalysis?.severity === 'High' ? 'text-red-600 bg-red-50' :
        ticket.aiAnalysis?.severity === 'Medium' ? 'text-amber-600 bg-amber-50' : 'text-green-600 bg-green-50';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/admin')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-slate-600" />
                </button>
                <h1 className="text-2xl font-bold text-slate-900">Report Details #{ticket._id.slice(-6)}</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Details */}
                <div className="space-y-6">
                    {/* Status & Severity Card */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800 mb-1">{ticket.aiAnalysis?.issueType || 'Reported Issue'}</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Clock size={14} />
                                    <span>Reported on {new Date(ticket.createdAt).toLocaleString()}</span>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${severityColor}`}>
                                {ticket.aiAnalysis?.severity || 'Unknown'} Severity
                            </span>
                        </div>

                        <div className="flex items-center gap-4 mt-6">
                            <label className="text-sm font-medium text-slate-700">Current Status:</label>
                            <select
                                value={ticket.status}
                                onChange={(e) => handleStatusUpdate(e.target.value)}
                                disabled={updating}
                                className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-civic-500 focus:border-civic-500 block p-2.5"
                            >
                                <option value="Open">Open</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                            </select>
                            {updating && <Loader2 className="animate-spin text-civic-600" size={16} />}
                        </div>
                    </div>

                    {/* SLA & Timeline Info */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <Clock size={18} /> Service Level Agreement
                        </h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                <span className="text-sm text-slate-500">Expected Resolution</span>
                                <span className="text-sm font-bold text-slate-900">
                                    {ticket.sla?.expectedResolutionDate
                                        ? new Date(ticket.sla.expectedResolutionDate).toLocaleDateString(undefined, {
                                            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                                        })
                                        : "N/A"}
                                </span>
                            </div>

                            {ticket.sla?.policyReference && (
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <p className="text-xs font-semibold text-blue-800 uppercase mb-1">Official Policy Reference</p>
                                    <p className="text-sm text-blue-900 line-clamp-2">
                                        {ticket.sla.policyReference} ({ticket.sla.policyDurationHours} Hours)
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1 italic">
                                        "{ticket.sla.explanation || 'Based on Citizen Charter'}"
                                    </p>
                                </div>
                            )}

                            {ticket.sla?.breachWarning && (
                                <div className="flex items-center gap-2 text-red-600 text-xs font-bold bg-red-50 p-2 rounded">
                                    <AlertTriangle size={14} /> Warning: SLA Breached
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Department Assignment Info */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <CheckCircle2 size={18} /> Department Assignment
                        </h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="text-sm font-medium text-slate-500">Assigned Department</span>
                                <span className="text-sm font-bold text-civic-700">{ticket.department?.name || "Unassigned"}</span>
                            </div>

                            {ticket.department?.assignedAt && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Has been Assigned on</span>
                                    <span className="font-medium text-slate-700">{new Date(ticket.department.assignedAt).toLocaleString()}</span>
                                </div>
                            )}

                            {ticket.department?.isOverridden && (
                                <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg border border-amber-100 flex items-start gap-2">
                                    <AlertTriangle size={14} className="mt-0.5" />
                                    <div>
                                        <span className="font-bold">Overridden by Admin</span>
                                        <p className="mt-0.5 italic">" Reason: {ticket.department.overrideReason} "</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reporter Info */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <User size={18} /> Reporter Details
                        </h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <span className="text-sm text-slate-500">Name</span>
                                <span className="text-sm font-medium text-slate-900">{ticket.reporter?.name || "Anonymous"}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <span className="text-sm text-slate-500">Contact</span>
                                <span className="text-sm font-medium text-slate-900">{ticket.reporter?.contact || "N/A"}</span>
                            </div>
                            {ticket.reporter?.email && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Email</span>
                                    <span className="text-sm font-medium text-slate-900">{ticket.reporter.email}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Smart Routing Info */}
                    {ticket.smartRouting?.recommendedDepartment && (
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-civic-500">
                            <h4 className="font-semibold text-slate-800 mb-2 flex items-center justify-between">
                                <span>Smart Routing Analysis</span>
                                <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                    Confidence: {(ticket.smartRouting.confidence * 100).toFixed(0)}%
                                </span>
                            </h4>
                            <p className="text-sm text-slate-600 italic mb-4">"{ticket.smartRouting.reasoning}"</p>

                            <div className="flex items-center gap-4">
                                <label className="text-sm font-bold text-slate-700">Assigned Dept:</label>
                                <select
                                    id="dept-override-select"
                                    className="flex-1 bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-civic-500 focus:border-civic-500 p-2"
                                    defaultValue={ticket.department?.name}
                                >
                                    <option value={ticket.department?.name}>{ticket.department?.name}</option>
                                    <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                                    <option value="Sanitation & Waste">Sanitation & Waste</option>
                                    <option value="Water Supply">Water Supply</option>
                                    <option value="Electrical">Electrical</option>
                                    <option value="Public Safety">Public Safety</option>
                                    <option value="Health">Health</option>
                                    <option value="Transport">Transport</option>
                                </select>
                                <button
                                    onClick={handleDepartmentOverride}
                                    disabled={updating}
                                    className="text-xs bg-civic-600 text-white px-3 py-2 rounded font-medium hover:bg-civic-700 disabled:opacity-50"
                                >
                                    Override
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Description Card */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <AlertTriangle size={18} /> Description
                        </h4>
                        <p className="text-slate-600 leading-relaxed">
                            {ticket.userDescription || "No description provided by user."}
                        </p>
                        {ticket.aiAnalysis?.issueDescription && (
                            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">AI Analysis</span>
                                <p className="text-sm text-slate-600">{ticket.aiAnalysis.issueDescription}</p>
                            </div>
                        )}
                    </div>

                    {/* Image Card */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="font-semibold text-slate-800 mb-3">Evidence</h4>
                        {ticket.imageUrl ? (
                            <img src={ticket.imageUrl} alt="Issue Evidence" className="w-full h-auto rounded-lg object-cover max-h-80" />
                        ) : (
                            <p className="text-slate-400 italic">No image available</p>
                        )}
                    </div>
                </div>

                {/* Right Column: Location Map */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full min-h-[500px] flex flex-col">
                        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <MapPin size={18} /> Location
                        </h4>
                        <p className="text-sm text-slate-600 mb-4 bg-slate-50 p-2 rounded border border-slate-100">
                            {ticket.location?.address || "No address available"}
                        </p>

                        <div className="flex-1 rounded-lg overflow-hidden border border-slate-200 relative z-0">
                            {ticket.location?.lat && ticket.location?.lng ? (
                                <MapContainer
                                    center={[ticket.location.lat, ticket.location.lng]}
                                    zoom={15}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <Marker position={[ticket.location.lat, ticket.location.lng]}>
                                        <Popup>
                                            {ticket.aiAnalysis?.issueType || 'Issue Location'}
                                        </Popup>
                                    </Marker>
                                </MapContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full bg-slate-100 text-slate-400">
                                    Map data unavailable
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex justify-end">
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${ticket.location?.lat},${ticket.location?.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-civic-600 hover:text-civic-700 font-medium flex items-center gap-1"
                            >
                                Open in Google Maps <ArrowLeft className="rotate-135" size={14} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReportDetails;
