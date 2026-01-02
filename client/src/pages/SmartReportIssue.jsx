import React, { useState } from 'react';
import axios from 'axios';
import SmartDepartmentRouter from '../components/SmartDepartmentRouter';
import DuplicateIncidentDetector from '../components/DuplicateIncidentDetector';
import { MapPin, Navigation, ArrowRight, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const LocationPicker = ({ location, setLocation }) => {
    useMapEvents({
        click(e) {
            setLocation(e.latlng);
        },
    });
    return location ? <Marker position={location} /> : null;
};

const SmartReportIssue = () => {
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState({ lat: 17.44, lng: 78.34 }); // Default
    const [address, setAddress] = useState('Gachibowli, Hyderabad');
    const [analyzing, setAnalyzing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [routerData, setRouterData] = useState(null);

    const handleSubmit = async () => {
        if (!description || !routerData) return;
        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('userDescription', description);
            formData.append('lat', location.lat);
            formData.append('lng', location.lng);
            formData.append('address', address);
            // formData.append('image', imageFile); // Add if image upload added later

            // Mock reporter info (In real app, get from Auth context)
            formData.append('name', "Citizen User");
            formData.append('contact', "9988776655");

            formData.append('routingData', JSON.stringify(routerData));

            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tickets/report`, formData);
            alert("Ticket Submitted Successfully!");
            window.location.href = '/'; // Go home
        } catch (error) {
            console.error("Submission error", error);
            alert("Failed to submit ticket.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto pb-20">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Smart Report</h1>
                <p className="text-slate-500 mt-1">AI automatically routes your issue based on what you say and where you are.</p>
            </div>

            <div className="space-y-6">
                {/* 1. Location */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-bold text-slate-700">1. Issue Location</label>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-mono">
                            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </span>
                    </div>

                    <div className="h-48 rounded-xl overflow-hidden border border-slate-200 relative mb-3">
                        <MapContainer center={location} zoom={13} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <LocationPicker location={location} setLocation={setLocation} />
                        </MapContainer>
                        <div className="absolute bottom-2 right-2 z-[400]">
                            <button className="bg-white p-2 rounded-lg shadow text-slate-700 text-xs font-bold">
                                Tap map to move
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Description (Trigger) */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <label className="block text-sm font-bold text-slate-700 mb-2">2. What's the problem?</label>
                    <textarea
                        className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-civic-500 focus:border-civic-500 outline-none text-slate-700 placeholder:text-slate-400 min-h-[120px]"
                        placeholder="e.g., There is a huge overflow of sewage water near the public school main gate..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <DuplicateIncidentDetector
                    description={description}
                    location={location}
                />

                {/* 3. Smart Router Result */}
                <SmartDepartmentRouter
                    description={description}
                    location={location}
                    onAnalysisComplete={setRouterData}
                />

                {/* 4. Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={!routerData || submitting}
                    className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all ${!routerData || submitting
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-civic-600 text-white shadow-civic-500/30 hover:scale-[1.02] active:scale-95'
                        }`}
                >
                    {submitting ? (
                        <>
                            <Loader2 size={24} className="animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            Submit Report <ArrowRight size={24} />
                        </>
                    )}
                </button>

            </div>
        </div>
    );
};

export default SmartReportIssue;
