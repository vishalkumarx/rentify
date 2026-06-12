import { useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

export default function LocationPicker({ location, onChange }: LocationPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(
    location.lat && location.lng ? new L.LatLng(location.lat, location.lng) : new L.LatLng(28.6139, 77.2090) // Default to New Delhi or similar
  );
  
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
      
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
        Tap or drag the pin on the map to set the exact coordinates.
      </p>

      <div style={{ height: '300px', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
        <MapContainer center={position || [28.6139, 77.2090]} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={handlePositionChange} />
        </MapContainer>
      </div>
    </div>
  );
}
