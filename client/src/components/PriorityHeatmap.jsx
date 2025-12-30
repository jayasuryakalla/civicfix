import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

const PriorityHeatmap = ({ tickets }) => {
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

    // Default center (Bangalore) or average of points if available
    const defaultCenter = [12.9716, 77.5946];

    return (
        <div className="h-full w-full rounded-lg overflow-hidden relative z-0">
            <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <HeatmapLayer points={heatPoints} />
            </MapContainer>
        </div>
    );
};

export default PriorityHeatmap;
