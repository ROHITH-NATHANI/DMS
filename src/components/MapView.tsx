import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shelter, Report } from '../types';

// Fix Leaflet icon issue
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  center: [number, number];
  shelters: Shelter[];
  reports: Report[];
  hazards?: { lat: number; lng: number; radius: number; type: string }[];
  onMarkerClick?: (type: 'shelter' | 'report', data: any) => void;
  id?: string;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export const MapView: React.FC<MapViewProps> = ({ center, shelters, reports, hazards = [], id = "map-container" }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(false);
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => {
      clearTimeout(timer);
      setIsMounted(false);
    };
  }, [id, center[0], center[1]]);

  if (!isMounted) {
    return (
      <div className="w-full h-full bg-zinc-100 flex items-center justify-center rounded-2xl">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin" />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Loading Map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden shadow-inner bg-zinc-200">
      <MapContainer 
        key={id}
        center={center} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={center} />
        
        {/* User Location */}
        <Marker position={center}>
          <Popup>You are here</Popup>
        </Marker>

        {/* Shelters */}
        {shelters.map((shelter) => (
          <Marker 
            key={`shelter-${shelter.id}`} 
            position={[shelter.latitude, shelter.longitude]}
            icon={L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="background-color: #10b981; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
              iconSize: [12, 12],
              iconAnchor: [6, 6]
            })}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold">{shelter.name}</h3>
                <p className="text-xs text-zinc-500">{shelter.type}</p>
                <p className="text-xs mt-1">Capacity: {shelter.occupancy}/{shelter.capacity}</p>
                <p className="text-xs mt-1">{shelter.address}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Reports */}
        {reports.map((report) => (
          <Marker 
            key={`report-${report.id}`} 
            position={[report.latitude, report.longitude]}
            icon={L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="background-color: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
              iconSize: [12, 12],
              iconAnchor: [6, 6]
            })}
          >
            <Popup>
              <div className="p-2 max-w-[200px]">
                <h3 className="font-bold text-red-600">{report.type}</h3>
                <p className="text-xs font-semibold uppercase">{report.severity} Severity</p>
                <p className="text-xs mt-1 line-clamp-2">{report.description}</p>
                {report.image_url && (
                  <img src={report.image_url} alt="Damage" className="mt-2 rounded w-full h-20 object-cover" />
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Hazard Overlays */}
        {hazards.map((hazard, idx) => (
          <Circle
            key={`hazard-${idx}`}
            center={[hazard.lat, hazard.lng]}
            radius={hazard.radius}
            pathOptions={{
              fillColor: hazard.type === 'fire' ? 'orange' : 'blue',
              color: hazard.type === 'fire' ? 'red' : 'darkblue',
              fillOpacity: 0.3
            }}
          >
            <Popup>{hazard.type.toUpperCase()} HAZARD ZONE</Popup>
          </Circle>
        ))}
      </MapContainer>
    </div>
  );
};
