import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, ThumbsUp, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DuplicateIncidentDetector = ({ description, location, onCheckComplete }) => {
    const [isChecking, setIsChecking] = useState(false);
    const [duplicateResult, setDuplicateResult] = useState(null);
    const navigate = useNavigate();

    // Debounce check logic (run when description is substantial and location is set)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (description && description.length > 20 && location?.lat) {
                checkDuplicate();
            }
        }, 2000); // 2-second debounce to avoid spamming while typing

        return () => clearTimeout(timer);
    }, [description, location]);

    const checkDuplicate = async () => {
        setIsChecking(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tickets/check-duplicate`, {
                description,
                lat: location.lat,
                lng: location.lng
            });

            if (res.data.isDuplicate) {
                setDuplicateResult(res.data);
            } else {
                setDuplicateResult(null);
            }
        } catch (error) {
            console.error("Duplicate check failed", error);
        } finally {
            setIsChecking(false);
            if (onCheckComplete) onCheckComplete();
        }
    };

    const handleUpvote = async () => {
        if (!duplicateResult?.duplicateTicketId) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tickets/${duplicateResult.duplicateTicketId}/upvote`);
            alert("Thanks! You have upvoted the existing ticket.");
            navigate('/'); // Go back home
        } catch (error) {
            alert("Failed to upvote.");
        }
    };

    if (!duplicateResult) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl scale-100 animate-in zoom-in-95">
                <div className="flex items-start gap-4">
                    <div className="bg-amber-100 p-3 rounded-full text-amber-600">
                        <AlertCircle size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Similar Issue Found!</h3>
                        <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                            It looks like a neighbor has already reported a similar issue nearby.
                        </p>

                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mt-3 text-sm text-amber-800 italic">
                            "{duplicateResult.reason}"
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                    <button
                        onClick={handleUpvote}
                        className="w-full bg-civic-600 hover:bg-civic-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-civic-500/20"
                    >
                        <ThumbsUp size={20} />
                        Upvote Existing & Close
                    </button>

                    <button
                        onClick={() => setDuplicateResult(null)}
                        className="w-full bg-white hover:bg-slate-50 text-slate-500 font-medium py-3 rounded-xl border border-slate-200 transition-colors"
                    >
                        No, mine is different. Continue Report.
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DuplicateIncidentDetector;
