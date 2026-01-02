import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Camera, MapPin, Loader2, UploadCloud, ArrowRight, Wand2, User, Phone, Mail, Navigation, Search, FileText } from 'lucide-react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import SmartDepartmentRouter from '../components/SmartDepartmentRouter';
import DuplicateIncidentDetector from '../components/DuplicateIncidentDetector';

// Fix Leaflet Icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Draggable Marker Component
const DraggableMarker = ({ position, setPosition, onDragEnd }) => {
    const markerRef = useRef(null);
    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const newPos = marker.getLatLng();
                    setPosition(newPos);
                    onDragEnd(newPos);
                }
            },
        }),
        [onDragEnd, setPosition],
    );

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}>
            <Popup minWidth={90}>
                <span className="text-center font-medium">Issue Location</span>
            </Popup>
        </Marker>
    )
}

// Map Click Handler Component
const MapEvents = ({ setLocation, fetchAddress }) => {
    const map = useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            setLocation({ lat, lng });
            fetchAddress(lat, lng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });
    return null;
};

const ReportIssue = () => {
    // User Details
    const [reporter, setReporter] = useState({
        name: '',
        contact: '',
        email: ''
    });

    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [location, setLocation] = useState({ lat: 20.5937, lng: 78.9629 }); // Default Center (India)
    const [address, setAddress] = useState('');
    const [zone, setZone] = useState('');
    const [gettingLocation, setGettingLocation] = useState(false);
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [analyzingImg, setAnalyzingImg] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [routerData, setRouterData] = useState(null);
    const [result, setResult] = useState(null);

    const fileInputRef = useRef(null);

    useEffect(() => {
        getLocation();
    }, []);

    const getLocation = () => {
        setGettingLocation(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const newLoc = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setLocation(newLoc);
                    fetchAddress(newLoc.lat, newLoc.lng);
                    setGettingLocation(false);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setGettingLocation(false);
                }
            );
        } else {
            setGettingLocation(false);
        }
    };

    const fetchAddress = async (lat, lng) => {
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
            if (res.data) {
                setAddress(res.data.display_name);

                // Extract zone from address details
                const addr = res.data.address || {};
                const detectedZone = addr.suburb ||
                    addr.city_district ||
                    addr.neighbourhood ||
                    addr.village ||
                    addr.town ||
                    addr.city ||
                    "General Zone";

                setZone(detectedZone);
            }
        } catch (error) {
            console.error("Geocoding failed", error);
            setAddress("Address not found");
            setZone("Unknown Zone");
        }
    };

    const handleSearch = async () => {
        if (!searchQuery) return;
        setSearching(true);
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`);
            if (res.data && res.data.length > 0) {
                const { lat, lon } = res.data[0];
                const newLat = parseFloat(lat);
                const newLng = parseFloat(lon);
                setLocation({ lat: newLat, lng: newLng });
                fetchAddress(newLat, newLng);
            } else {
                alert("Location not found");
            }
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setSearching(false);
        }
    };

    const handleInput = (e) => {
        const { name, value } = e.target;

        // Validation for Contact Number (Indian Format: Max 10 digits, Numeric only)
        if (name === 'contact') {
            const numericValue = value.replace(/\D/g, ''); // Remove non-digits
            if (numericValue.length <= 10) {
                setReporter({ ...reporter, [name]: numericValue });
            }
        } else {
            setReporter({ ...reporter, [name]: value });
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
            // Auto-analyze upon selection
            analyzeImage(file);
        }
    };

    const analyzeImage = async (file) => {
        setAnalyzingImg(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tickets/analyze`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const analysis = res.data.data;
            console.log("API Analysis Result:", analysis); // Debug Log
            if (analysis) {
                setAiAnalysis(analysis);
                // Auto-fill description if empty
                if (!description) {
                    const generatedDesc = analysis.issueDescription || analysis.description;
                    console.log("Setting description to:", generatedDesc); // Debug Log
                    setDescription(generatedDesc);
                }
            }
        } catch (err) {
            console.error("Analysis failed:", err);
        } finally {
            setAnalyzingImg(false);
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!image || !reporter.name || !reporter.contact) {
            alert("Name, Contact Number, and Image are required.");
            return;
        }

        // Indian Phone Validator (Start with 6-9, 10 digits)
        const indianPhoneRegex = /^[6-9]\d{9}$/;
        if (!indianPhoneRegex.test(reporter.contact)) {
            alert("Please enter a valid 10-digit Indian mobile number.");
            return;
        }

        setSubmitting(true);
        const formData = new FormData();
        formData.append('image', image);
        formData.append('name', reporter.name);
        formData.append('contact', reporter.contact);
        formData.append('email', reporter.email);
        formData.append('userDescription', description);
        formData.append('lat', location.lat);
        formData.append('lng', location.lng);
        formData.append('address', address || "Pinned Location");

        if (routerData) {
            formData.append('routingData', JSON.stringify(routerData));
        }

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tickets/report`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResult(res.data.data);
        } catch (err) {
            console.error("Submission failed:", err);
            alert("Failed to report issue. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (result) {
        return (
            <div className="flex flex-col items-center justify-center pt-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <UploadCloud size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Report Submitted!</h2>
                <div className="text-slate-500 mb-8 space-y-1">
                    <p>Ticket ID: <span className="font-mono bg-slate-100 px-2 py-1 rounded font-bold">{result.ticketId || result._id}</span></p>
                    <p className="text-sm">Assigned to: <span className="font-semibold text-civic-600">{result.department?.name || "General"} Dept.</span></p>
                    {result.sla?.expectedResolutionDate && (
                        <p className="text-sm mt-1">Expected Resolution: <span className="font-semibold text-slate-700">
                            {new Date(result.sla.expectedResolutionDate).toLocaleDateString()}
                        </span></p>
                    )}
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-md shadow-sm text-left space-y-4">
                    <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Analysis</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-medium text-slate-900">{result.aiAnalysis.issueType}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${result.aiAnalysis.severity === 'High' ? 'bg-red-100 text-red-700' :
                                result.aiAnalysis.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                                }`}>
                                {result.aiAnalysis.severity} Priority
                            </span>
                        </div>
                    </div>
                </div>

                <button onClick={() => window.location.reload()} className="mt-8 text-civic-600 font-medium border-b border-transparent hover:border-civic-600 transition-all">
                    Submit Another Issue
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto space-y-8 pb-10">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Report an Issue</h2>
                <p className="text-slate-500">Help us fix your city by reporting issues.</p>
            </div>

            {/* Step 1: User Details */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <User size={18} /> Peronal Details
                </h3>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-slate-400" size={16} />
                        <input
                            type="text"
                            name="name"
                            value={reporter.name}
                            onChange={handleInput}
                            placeholder="John Doe"
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-civic-500 focus:border-civic-500 transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3 text-slate-400" size={16} />
                        <span className="absolute left-9 top-2.5 text-slate-500 font-medium border-r border-slate-300 pr-2 h-5 flex items-center">+91</span>
                        <input
                            type="tel"
                            name="contact"
                            value={reporter.contact}
                            onChange={handleInput}
                            placeholder="98765 43210"
                            className="w-full pl-[5.5rem] pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-civic-500 focus:border-civic-500 transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-slate-400 text-xs">(Optional)</span></label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
                        <input
                            type="email"
                            name="email"
                            value={reporter.email}
                            onChange={handleInput}
                            placeholder="john@example.com"
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-civic-500 focus:border-civic-500 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Step 2: Location Map */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-semibold text-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2"><MapPin size={18} /> Location</div>
                </h3>

                <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search location (e.g. MG Road, Hyderabad)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-civic-500 transition-all outline-none"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={searching || !searchQuery}
                        className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {searching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                    </button>
                </div>

                <div className="flex gap-3 mb-2">
                    <button
                        onClick={getLocation}
                        className="flex-1 bg-civic-600 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-civic-700 transition-colors"
                    >
                        {gettingLocation ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                        Auto Detect
                    </button>
                    <button
                        className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-civic-500"
                        onClick={() => {
                            // Just focus the map container essentially
                            setGettingLocation(false);
                        }}
                    >
                        <MapPin size={16} />
                        Set Manually
                    </button>
                </div>

                <div className="h-48 w-full rounded-lg overflow-hidden border border-slate-200 relative z-0">
                    <MapContainer
                        center={[location.lat, location.lng]}
                        zoom={13}
                        style={{ height: "100%", width: "100%" }}
                        scrollWheelZoom={false} // Disable scroll zoom for better page scroll experience
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <DraggableMarker
                            position={location}
                            setPosition={setLocation}
                            onDragEnd={(pos) => fetchAddress(pos.lat, pos.lng)}
                        />
                        <MapEvents
                            setLocation={setLocation}
                            fetchAddress={fetchAddress}
                        />
                    </MapContainer>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium uppercase mb-1">Detected Address</p>
                    <p className="text-sm text-slate-800 font-medium">
                        {address || (gettingLocation ? "Detecting address..." : "Pin a location on map")}
                    </p>
                    {zone && (
                        <div className="mt-2 text-xs flex items-center gap-2">
                            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold">{zone}</span>
                            <span className="text-slate-400">Auto-detected Service Zone</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Step 3: Evidence & AI Analysis */}
            <div className="space-y-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Camera size={18} /> Issue Evidence
                </h3>

                <div
                    onClick={() => fileInputRef.current.click()}
                    className={`w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden ${preview ? 'border-civic-500 bg-slate-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
                >
                    {preview ? (
                        <div className="relative w-full h-full">
                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                            {analyzingImg && (
                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                                    <Loader2 size={32} className="animate-spin mb-2" />
                                    <span className="font-medium text-sm">Analyzing Issue...</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="bg-white p-4 rounded-full shadow-sm mb-3 text-civic-600">
                                <UploadCloud size={28} />
                            </div>
                            <p className="text-slate-600 font-medium">Upload Image</p>
                            <p className="text-xs text-slate-400 mt-1">Tap to capture or browse</p>
                        </>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageChange}
                    />
                </div>

                {/* AI Detection Result */}
                {aiAnalysis && (
                    <div className="bg-civic-50 border border-civic-100 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-xs text-civic-600 font-bold uppercase tracking-wide">Detected Category</p>
                                <p className="font-bold text-slate-900 text-lg">{aiAnalysis.category}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${aiAnalysis.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                }`}>
                                {aiAnalysis.severity} Severity
                            </span>
                        </div>
                        <div className="mt-2 text-sm text-slate-600 bg-white/50 p-2 rounded border border-civic-100/50">
                            <p><span className="font-semibold">Department:</span> {aiAnalysis.category} Dept.</p>
                            <p><span className="font-semibold">Issue:</span> {aiAnalysis.issueType}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Step 3: Additional Details */}
            <div className="space-y-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <FileText size={18} /> Description
                </h3>

                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description (Optional, AI will generate one)"
                    className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-civic-500 min-h-[100px] text-sm"
                />

                <DuplicateIncidentDetector
                    description={description}
                    location={location}
                />

                <SmartDepartmentRouter
                    description={description}
                    location={location}
                    onAnalysisComplete={setRouterData}
                />
            </div>

            <button
                onClick={handleSubmit}
                disabled={!image || submitting || !reporter.name || !reporter.contact}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all ${!image || !reporter.name || !reporter.contact || submitting
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
                        Submit Report
                        <ArrowRight size={24} />
                    </>
                )}
            </button>
        </div>
    );
};

export default ReportIssue;
