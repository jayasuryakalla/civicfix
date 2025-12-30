import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Camera, CheckCircle2 } from 'lucide-react';

const Home = () => {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center max-w-lg mx-auto">
            <div className="bg-civic-100 p-4 rounded-full mb-6">
                <MapPin size={48} className="text-civic-600" />
            </div>

            <h1 className="text-3xl font-bold text-slate-900 mb-4">Fix Your City, <br /> One Click at a Time.</h1>
            <p className="text-slate-600 mb-8 text-lg">
                Spot a pothole? Broken streetlight? Garbage pile?
                Report it instantly using AI.
            </p>

            <Link
                to="/report"
                className="w-full bg-civic-600 text-white font-semibold py-4 rounded-xl shadow-lg shadow-civic-500/30 active:scale-95 transition-all text-lg flex items-center justify-center gap-2"
            >
                <Camera size={24} />
                Report an Issue Now
            </Link>

            <div className="mt-12 grid grid-cols-3 gap-4 w-full">
                <div className="flex flex-col items-center gap-2">
                    <div className="bg-slate-100 p-3 rounded-lg"><Camera size={20} className="text-slate-600" /></div>
                    <span className="text-xs font-medium text-slate-600">Snap</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="bg-slate-100 p-3 rounded-lg"><CheckCircle2 size={20} className="text-slate-600" /></div>
                    <span className="text-xs font-medium text-slate-600">AI Checks</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="bg-slate-100 p-3 rounded-lg"><MapPin size={20} className="text-slate-600" /></div>
                    <span className="text-xs font-medium text-slate-600">Fixed</span>
                </div>
            </div>
        </div>
    );
};

export default Home;
