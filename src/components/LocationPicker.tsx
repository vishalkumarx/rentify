import { useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Locate } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet icon in React
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export type LocationType = {
  lat: number;
  lng: number;
  address: string;
};

interface LocationPickerProps {
  location: LocationType;
  onChange: (location: LocationType) => void;
}

function LocationMarker({ position, setPosition }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void }) {
  const markerRef = useRef<L.Marker>(null);
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          setPosition(marker.getLatLng());
        }
      },
    }),
    [setPosition]
  );

  return position === null ? null : (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
}

function FlyToCurrentLocation({ position }: { position: L.LatLng | null }) {
  const map = useMap();
  if (position) {
    map.flyTo(position, 13);
  }
  return null;
}

export default function LocationPicker({ location, onChange }: LocationPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(
    location.lat && location.lng ? new L.LatLng(location.lat, location.lng) : new L.LatLng(28.6139, 77.2090) // Default to New Delhi or similar
  );
  const [isLocating, setIsLocating] = useState(false);
  
  const [addressInput, setAddressInput] = useState(location.address || '');

  const handlePositionChange = (pos: L.LatLng) => {
    setPosition(pos);
    onChange({
      lat: pos.lat,
      lng: pos.lng,
      address: addressInput
    });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAddressInput(val);
    if (position) {
      onChange({
        lat: position.lat,
        lng: position.lng,
        address: val
      });
    }
  };

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const newPos = new L.LatLng(latitude, longitude);
          setPosition(newPos);
          
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await res.json();
            const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Unknown Area';
            const state = data.address.state || '';
            const address = `${city}${state ? `, ${state}` : ''}`;
            
            setAddressInput(address);
            onChange({
              lat: latitude,
              lng: longitude,
              address: address
            });
          } catch (error) {
            onChange({
              lat: latitude,
              lng: longitude,
              address: addressInput
            });
          }
          setIsLocating(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to retrieve your location. Please check browser permissions.');
          setIsLocating(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
      setIsLocating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>Location</label>
      
      <input
        type="text"
        placeholder="Enter a descriptive address or landmark..."
        value={addressInput}
        onChange={handleAddressChange}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: '16px',
          border: '1px solid var(--surface-border)',
          background: 'var(--surface)',
          color: 'var(--text-main)',
          fontSize: '15px',
          outline: 'none',
        }}
      />
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
          Tap or drag the pin on the map to set the exact coordinates.
        </p>
        <button 
          onClick={(e) => {
            e.preventDefault();
            handleGetCurrentLocation();
          }}
          disabled={isLocating}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            padding: '8px 12px', 
            borderRadius: '12px', 
            background: 'var(--primary-glow)', 
            color: 'var(--primary)', 
            border: '1px solid var(--primary)', 
            fontSize: '12px', 
            fontWeight: 700,
            cursor: isLocating ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            width: 'auto'
          }}
        >
          <Locate size={14} />
          {isLocating ? 'Locating...' : 'My Location'}
        </button>
      </div>

      <div style={{ height: '300px', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
        <MapContainer center={position || [28.6139, 77.2090]} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={handlePositionChange} />
          <FlyToCurrentLocation position={position} />
        </MapContainer>
      </div>
    </div>
  );
}
