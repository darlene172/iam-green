import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const BLUE_ICON = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const COLLECTION_POINTS = [
  { id: 1, name: 'Wan Chai Recycling Station',    lat: 22.2783, lng: 114.1747, tier: 'basic'    },
  { id: 2, name: 'Causeway Bay Green Corner',      lat: 22.2808, lng: 114.1846, tier: 'basic'    },
  { id: 3, name: 'Mong Kok Eco Point',             lat: 22.3193, lng: 114.1694, tier: 'premium'  },
  { id: 4, name: 'Tsim Sha Tsui Collection Hub',   lat: 22.2988, lng: 114.1722, tier: 'basic'    },
  { id: 5, name: 'Sha Tin Recycling Centre',       lat: 22.3833, lng: 114.1833, tier: 'premium'  },
  { id: 6, name: 'Kwun Tong Green Station',        lat: 22.3126, lng: 114.2261, tier: 'basic'    },
  { id: 7, name: 'Sham Shui Po Eco Corner',        lat: 22.3311, lng: 114.1622, tier: 'basic'    },
  { id: 8, name: 'Central Recycling Drop-off',     lat: 22.2820, lng: 114.1588, tier: 'premium'  },
  { id: 9, name: 'Tai Po Collection Point',        lat: 22.4513, lng: 114.1699, tier: 'basic'    },
  { id: 10, name: 'Tuen Mun Recycling Hub',        lat: 22.3910, lng: 113.9769, tier: 'premium'  },
];

function LocationMarker() {
  const [pos, setPos] = useState<[number, number] | null>(null);
  const map = useMap();
  useEffect(() => {
    map.locate({ setView: true, maxZoom: 14 }).on('locationfound', (e) => {
      setPos([e.latlng.lat, e.latlng.lng]);
    });
  }, [map]);
  return pos ? <Marker position={pos}><Popup>You are here</Popup></Marker> : null;
}

export default function MapTab() {
  const [search, setSearch] = useState('');
  const filtered = COLLECTION_POINTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#EEF5F0' }}>
      {/* Search bar */}
      <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #E3EFE7' }}>
        <input
          type="text"
          placeholder="🔍 Search collection points..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px',
            border: '1.5px solid #CCDDD4', borderRadius: '99px',
            fontSize: '14px', fontFamily: "'Noto Sans', sans-serif",
            outline: 'none', background: '#F5F9F6',
          }}
        />
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '8px', padding: '10px 16px', background: '#fff' }}>
        <button style={{
          flex: 1, padding: '8px 12px', borderRadius: '99px',
          border: '1.5px solid #2AA962', background: '#EFF9F3',
          color: '#1A7A4A', fontWeight: 600, fontSize: '13px',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>♻️ Sort Item</button>
        <button style={{
          flex: 1, padding: '8px 12px', borderRadius: '99px',
          border: '1.5px solid #CCDDD4', background: '#fff',
          color: '#1E3D2A', fontWeight: 600, fontSize: '13px',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>🗑️ Request Bin</button>
      </div>

      {/* Map */}
      <div style={{ flex: 1, minHeight: '400px' }}>
        <MapContainer
          center={[22.3193, 114.1694]}
          zoom={12}
          style={{ width: '100%', height: '100%', minHeight: '400px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker />
          {filtered.map(point => (
            <Marker key={point.id} position={[point.lat, point.lng]} icon={BLUE_ICON}>
              <Popup>
                <strong>{point.name}</strong><br />
                <span style={{
                  background: point.tier === 'premium' ? '#D9F3E5' : '#E6F1FB',
                  color: point.tier === 'premium' ? '#155C38' : '#0C447C',
                  padding: '2px 8px', borderRadius: '99px', fontSize: '11px',
                }}>
                  {point.tier === 'premium' ? '⭐ Premium' : 'Basic'}
                </span>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}