import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
// Removing generic imports to focus on functionality
import { AlertCircle, CheckCircle, Clock, FileText, MapPin } from 'lucide-react';

const CitizenReportDetails = () => {
    const { id } = useParams();
    const [ticket, setTicket] = useState(null);
    const [slaData, setSlaData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTicketAndSLA = async () => {
            try {
                // Fetch Ticket Details
                const ticketRes = await fetch(`http://localhost:5000/api/tickets/${id}`);
                if (!ticketRes.ok) throw new Error('Ticket not found');
                const ticketJson = await ticketRes.json();
                setTicket(ticketJson);

                // Fetch SLA Details (if not already in ticket or to get fresh RAG explanation)
                const slaRes = await fetch(`http://localhost:5000/api/tickets/${id}/sla`);
                if (slaRes.ok) {
                    const slaJson = await slaRes.json();
                    setSlaData(slaJson.sla);
                } else {
                    console.warn("Failed to fetch SLA data");
                }

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTicketAndSLA();
    }, [id]);

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error) return (
        <div className="flex justify-center items-center h-screen bg-gray-50 text-red-600">
            <AlertCircle className="w-6 h-6 mr-2" /> {error}
        </div>
    );

    if (!ticket) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">

                {/* Header */}
                <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-white flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        Report Details
                    </h1>
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        #{ticket.ticketId || ticket._id.slice(-6).toUpperCase()}
                    </span>
                </div>

                <div className="p-6 space-y-8">

                    {/* Status Tracker (Simplified) */}
                    <div className="flex justify-between items-center border-b pb-6">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Current Status</p>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${ticket.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                                    ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                }`}>
                                {ticket.status}
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500 mb-1">Reported On</p>
                            <p className="font-semibold text-gray-800">
                                {new Date(ticket.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {/* Issue Description */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-3">Issue Information</h2>
                            <div className="space-y-3">
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium text-gray-900">Type:</span> {ticket.aiAnalysis?.issueType || ticket.title}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium text-gray-900">Department:</span> {ticket.department?.name}
                                </p>
                                <p className="text-sm text-gray-600 flex items-start">
                                    <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0 text-gray-400" />
                                    {ticket.location?.address}
                                </p>
                            </div>

                            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="text-sm text-gray-700 italic">
                                    "{ticket.userDescription}"
                                </p>
                            </div>
                        </div>

                        {/* Image */}
                        <div>
                            {ticket.imageUrl ? (
                                <img
                                    src={ticket.imageUrl}
                                    alt="Reported Issue"
                                    className="w-full h-48 object-cover rounded-lg shadow-sm border"
                                />
                            ) : (
                                <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                    No Image Provided
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SLA Section - RAG Powered */}
                    {slaData && slaData.found && (
                        <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
                            <h2 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
                                <Clock className="w-5 h-5 mr-2" />
                                Expected Resolution
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-indigo-600 mb-1 font-medium">Target Date</p>
                                    <p className="text-2xl font-bold text-indigo-700">
                                        {new Date(slaData.expectedResolutionDate).toLocaleDateString([], {
                                            weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
                                        })}
                                    </p>
                                    <p className="text-sm text-indigo-500 mt-1">
                                        by {new Date(slaData.expectedResolutionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                <div className="border-l border-indigo-200 pl-6">
                                    <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider mb-2">
                                        Official Citizen Charter Reference
                                    </p>
                                    <p className="text-sm text-indigo-800 font-medium mb-1">
                                        {slaData.slaReferenced.section}
                                    </p>
                                    <p className="text-sm text-indigo-600 leading-relaxed">
                                        "{slaData.slaReferenced.policyText}"
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-indigo-200">
                                <p className="text-sm text-indigo-700">
                                    <span className="font-semibold">Note:</span> {slaData.explanation}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Fallback if no SLA found */}
                    {(!slaData || !slaData.found) && (
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center">
                            <p className="text-gray-500">Processing SLA standards for this issue type...</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default CitizenReportDetails;
