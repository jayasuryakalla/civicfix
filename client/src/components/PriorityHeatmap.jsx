import React, { useEffect, useState } from 'react';
import { SYSTEM_DEFAULT_LOCATION } from '../utils/constants';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for leaflet.heat not finding L
if (typeof window !== 'undefined') {
    window.L = L;
}
import 'leaflet.heat';

const HeatmapLayer = ({ points }) => {
    const map = useMap();

    useEffect(() => {
        if (!points || points.length === 0) return;

        const heat = L.heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
        }).addTo(map);

        return () => {
            map.removeLayer(heat);
        };
    }, [points, map]);

    return null;
};

const RecenterAutomatically = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
};

const PriorityHeatmap = ({ tickets = [] }) => {
    const [mapCenter, setMapCenter] = useState(SYSTEM_DEFAULT_LOCATION);

    // Convert tickets to [lat, lng, intensity]
    const heatPoints = tickets
        .filter(t => t.location?.lat && t.location?.lng)
        .map(t => {
            let intensity = 0.5;
            if (t.aiAnalysis?.severity === 'High') intensity = 1.0;
            else if (t.aiAnalysis?.severity === 'Medium') intensity = 0.6;
            else if (t.aiAnalysis?.severity === 'Low') intensity = 0.3;

            return [t.location.lat, t.location.lng, intensity];
        });

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setMapCenter([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    console.error("Error getting location for heatmap:", error);
                    // Fallback is already set in state
                }
            );
        }
    }, []);

    return (
        <div className="h-full w-full rounded-lg overflow-hidden relative z-0">
            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <RecenterAutomatically center={mapCenter} />
                <HeatmapLayer points={heatPoints} />
            </MapContainer>
        </div>
    );
};

export default PriorityHeatmap;
