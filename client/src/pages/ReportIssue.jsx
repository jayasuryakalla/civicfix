import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Loader2, UploadCloud, ArrowRight, Wand2 } from 'lucide-react';
import axios from 'axios';

const ReportIssue = () => {
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [location, setLocation] = useState(null);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [generatingDesc, setGeneratingDesc] = useState(false);
    const [result, setResult] = useState(null);

    const fileInputRef = useRef(null);

    useEffect(() => {
        // Auto-get location on mount
        getLocation();
    }, []);

    const getLocation = () => {
        setGettingLocation(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setGettingLocation(false);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setGettingLocation(false);
                    // Default fallback (e.g. City Center) could go here
                }
            );
        } else {
            setGettingLocation(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleGenerateDescription = async () => {
        if (!image) return;

        setGeneratingDesc(true);
        const formData = new FormData();
        formData.append('image', image);

        try {
            const res = await axios.post('http://localhost:5000/api/tickets/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const analysis = res.data.data;
            if (analysis && analysis.description) {
                setDescription(analysis.description);
            }
        } catch (err) {
            console.error("Error generating description:", err);
            alert("Failed to generate description. Please try again.");
        } finally {
            setGeneratingDesc(false);
        }
    };

    const handleSubmit = async () => {
        if (!image) return;

        setSubmitting(true);
        const formData = new FormData();
        formData.append('image', image);
        formData.append('userDescription', description);
        if (location) {
            formData.append('lat', location.lat);
            formData.append('lng', location.lng);
        }
        formData.append('address', "Detected Location"); // simplified

        try {
            // Assume API is proxied via Vite config or absolute URL needed if separate ports
            const res = await axios.post('http://localhost:5000/api/tickets/report', formData, {
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
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Report Submited!</h2>
                <p className="text-slate-500 mb-8">Ticket ID: <span className="font-mono bg-slate-100 px-2 py-1 rounded">{result.ticketId}</span></p>

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

                    <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Resolution</span>
                        <p className="text-slate-900 font-medium">
                            {new Date(result.sla.expectedResolutionDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 italic">
                            "According to standard SLAs for {result.aiAnalysis.issueType}s."
                        </p>
                    </div>
                </div>

                <button onClick={() => window.location.reload()} className="mt-8 text-civic-600 font-medium border-b border-transparent hover:border-civic-600 transition-all">
                    Submit Another Issue
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Report an Issue</h2>

            {/* Step 1: Image - The Core Action */}
            <div className="mb-6">
                <div
                    onClick={() => fileInputRef.current.click()}
                    className={`w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden ${preview ? 'border-civic-500 bg-slate-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                        }`}
                >
                    {preview ? (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <>
                            <div className="bg-white p-4 rounded-full shadow-sm mb-3">
                                <Camera size={32} className="text-civic-600" />
                            </div>
                            <p className="text-slate-600 font-medium">Tap to take a photo</p>
                            <p className="text-xs text-slate-400 mt-1">or upload from gallery</p>
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
            </div>

            {/* Step 2: Location (Auto) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 flex items-center gap-3">
                <div className="bg-civic-50 text-civic-600 p-2 rounded-lg">
                    {gettingLocation ? <Loader2 size={20} className="animate-spin" /> : <MapPin size={20} />}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">Location</p>
                    <p className="text-xs text-slate-500">
                        {gettingLocation ? 'Detecting...' : location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Location undefined'}
                    </p>
                </div>
            </div>

            {/* Step 3: Description (Optional) */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-700">Description (Optional)</label>
                    <button
                        onClick={handleGenerateDescription}
                        disabled={!image || generatingDesc}
                        className={`text-xs flex items-center gap-1 px-2 py-1 rounded-md border transition-colors ${!image ? 'text-slate-300 border-transparent cursor-not-allowed' :
                                generatingDesc ? 'bg-civic-50 text-civic-600 border-civic-200' :
                                    'text-civic-600 border-civic-200 hover:bg-civic-50'
                            }`}
                    >
                        {generatingDesc ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                        {generatingDesc ? 'Generating...' : 'Auto-Generate'}
                    </button>
                </div>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="E.g. Large pothole causing traffic..."
                    className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-civic-500 min-h-[100px] resize-none"
                />
            </div>

            <button
                onClick={handleSubmit}
                disabled={!image || submitting}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all ${!image || submitting
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-civic-600 text-white shadow-civic-500/30 hover:scale-[1.02] active:scale-95'
                    }`}
            >
                {submitting ? (
                    <>
                        <Loader2 size={24} className="animate-spin" />
                        Analyzing...
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
