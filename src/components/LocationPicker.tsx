import { useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

export type LocationType = {
  lat: number;
  lng: number;
  address: string;
};

interface LocationPickerProps {
  location: LocationType;
  onChange: (location: LocationType) => void;
}

const containerStyle = {
  width: '100%',
  height: '100%'
};

const DEFAULT_CENTER = {
  lat: 28.6139,
  lng: 77.2090
};

export default function LocationPicker({ location, onChange }: LocationPickerProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const [position, setPosition] = useState<{lat: number, lng: number}>(
    location.lat && location.lng ? { lat: location.lat, lng: location.lng } : DEFAULT_CENTER
  );
  
  const [addressInput, setAddressInput] = useState(location.address || '');

  const handlePositionChange = (lat: number, lng: number) => {
    setPosition({ lat, lng });
    onChange({
      lat,
      lng,
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
        {!isLoaded ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
            <p style={{ color: 'var(--text-muted)' }}>Loading Google Maps...</p>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={position}
            zoom={13}
            onClick={(e) => {
              if (e.latLng) {
                handlePositionChange(e.latLng.lat(), e.latLng.lng());
              }
            }}
          >
            <Marker 
              position={position}
              draggable={true}
              onDragEnd={(e) => {
                if (e.latLng) {
                  handlePositionChange(e.latLng.lat(), e.latLng.lng());
                }
              }}
            />
          </GoogleMap>
        )}
      </div>
    </div>
  );
}
