import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const COLLECTION_POINTS = [
  { id: 1,  name: 'Wan Chai Recycling Station',   lat: 22.2783, lng: 114.1747, tier: 'basic'   },
  { id: 2,  name: 'Causeway Bay Green Corner',     lat: 22.2808, lng: 114.1846, tier: 'basic'   },
  { id: 3,  name: 'Mong Kok Eco Point',            lat: 22.3193, lng: 114.1694, tier: 'premium' },
  { id: 4,  name: 'Tsim Sha Tsui Collection Hub',  lat: 22.2988, lng: 114.1722, tier: 'basic'   },
  { id: 5,  name: 'Sha Tin Recycling Centre',      lat: 22.3833, lng: 114.1833, tier: 'premium' },
  { id: 6,  name: 'Kwun Tong Green Station',       lat: 22.3126, lng: 114.2261, tier: 'basic'   },
  { id: 7,  name: 'Sham Shui Po Eco Corner',       lat: 22.3311, lng: 114.1622, tier: 'basic'   },
  { id: 8,  name: 'Central Recycling Drop-off',    lat: 22.2820, lng: 114.1588, tier: 'premium' },
  { id: 9,  name: 'Tai Po Collection Point',       lat: 22.4513, lng: 114.1699, tier: 'basic'   },
  { id: 10, name: 'Tuen Mun Recycling Hub',        lat: 22.3910, lng: 113.9769, tier: 'premium' },
  { id: 11, name: 'Yuen Long Green Point',         lat: 22.4449, lng: 114.0228, tier: 'basic'   },
  { id: 12, name: 'Tseung Kwan O Eco Station',     lat: 22.3076, lng: 114.2599, tier: 'premium' },
  { id: 13, name: 'North Point Collection',        lat: 22.2910, lng: 114.1920, tier: 'basic'   },
  { id: 14, name: 'Aberdeen Recycling Hub',        lat: 22.2494, lng: 114.1576, tier: 'basic'   },
  { id: 15, name: 'Fanling Green Corner',          lat: 22.4924, lng: 114.1385, tier: 'basic'   },
];

function AutoLocate() {
  const map = useMap();
  useEffect(() => {
    map.locate({ setView: true, maxZoom: 14 });
  }, [map]);
  return null;
}

export default function MapTab() {
  const [search, setSearch] = useState('');
  const [showBin, setShowBin] = useState(false);
  const [binSent, setBinSent] = useState(false);
  const [sortResult, setSortResult] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = COLLECTION_POINTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzing(true);
    setSortResult(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY ?? '',
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-opus-4-5',
            max_tokens: 200,
            messages: [{
              role: 'user',
              content: [
                { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
                { type: 'text', text: 'What recyclable item is this? Which bin does it go in: Paper (yellow), Plastic (blue), Glass (brown), Metal (blue), E-Waste (special), Clothing (green), or General Waste? Reply in 1-2 sentences.' }
              ]
            }]
          })
        });
        const data = await res.json();
        setSortResult(data.content?.[0]?.text ?? 'Could not identify item.');
      } catch {
        setSortResult('Could not analyze. Please try again.');
      }
      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)' }}>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '8px', padding: '10px 16px', background: '#fff', borderBottom: '1px solid #E3EFE7', flexShrink: 0 }}>
        <button onClick={() => fileRef.current?.click()} style={{
          flex: 1, padding: '9px', borderRadius: '99px',
          border: '1.5px solid #2AA962', background: '#EFF9F3',
          color: '#1A7A4A', fontWeight: 700, fontSize: '13px',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>♻️ Sort Item</button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhoto} />
        <button onClick={() => setShowBin(!showBin)} style={{
          flex: 1, padding: '9px', borderRadius: '99px',
          border: '1.5px solid #CCDDD4', background: '#fff',
          color: '#1E3D2A', fontWeight: 700, fontSize: '13px',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>🗑️ Request Bin</button>
      </div>

      {/* Analyzing */}
      {analyzing && (
        <div style={{ background: '#EFF9F3', padding: '10px 16px', flexShrink: 0, textAlign: 'center', fontSize: '13px', color: '#1A7A4A', fontWeight: 600 }}>
          🔍 Analyzing your item...
        </div>
      )}

      {/* Sort result */}
      {sortResult && (
        <div style={{ background: '#D9F3E5', border: '1px solid #B6E8CC', padding: '12px 16px', flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '13px', color: '#155C38', marginBottom: '4px' }}>♻️ AI Result</div>
          <div style={{ fontSize: '13px', color: '#1E3D2A' }}>{sortResult}</div>
          <button onClick={() => setSortResult(null)} style={{
            marginTop: '8px', padding: '5px 12px', borderRadius: '99px',
            border: 'none', background: '#2AA962', color: '#fff',
            fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>Clear</button>
        </div>
      )}

      {/* Bin request */}
      {showBin && (
        <div style={{ background: '#fff', padding: '12px 16px', borderBottom: '1px solid #E3EFE7', flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F2D1C', marginBottom: '8px' }}>🗑️ Request a recycling bin</div>
          {binSent ? (
            <div style={{ background: '#D9F3E5', color: '#155C38', borderRadius: '12px', padding: '10px', textAlign: 'center', fontWeight: 600, fontSize: '13px' }}>
              ✅ Request sent! We'll review your location soon.
            </div>
          ) : (
            <>
              <p style={{ fontSize: '13px', color: '#4D7060', marginBottom: '10px' }}>We'll place a recycling bin near your current location.</p>
              <button onClick={() => setBinSent(true)} style={{
                width: '100%', padding: '11px', borderRadius: '99px',
                background: '#2AA962', color: '#fff', border: 'none',
                fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
              }}>📍 Submit Request</button>
            </>
          )}
        </div>
      )}

      {/* Search */}
      <div style={{ padding: '8px 16px', background: '#fff', borderBottom: '1px solid #E3EFE7', flexShrink: 0 }}>
        <input
          type="text"
          placeholder="🔍 Search collection points..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '8px 14px',
            border: '1.5px solid #CCDDD4', borderRadius: '99px',
            fontSize: '13px', fontFamily: 'inherit', outline: 'none', background: '#F5F9F6',
          }}
        />
      </div>

      {/* Map */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <MapContainer
          center={[22.3193, 114.1694]}
          zoom={11}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <AutoLocate />
          {filtered.map(point => (
            <CircleMarker
              key={point.id}
              center={[point.lat, point.lng]}
              radius={8}
              pathOptions={{ fillColor: '#1A6BB5', fillOpacity: 0.9, color: '#fff', weight: 2 }}
            >
              <Popup>
                <div style={{ minWidth: '130px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#0F2D1C', marginBottom: '4px' }}>{point.name}</div>
                  <span style={{
                    background: point.tier === 'premium' ? '#D9F3E5' : '#E6F1FB',
                    color: point.tier === 'premium' ? '#155C38' : '#0C447C',
                    padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 600,
                  }}>{point.tier === 'premium' ? '⭐ Premium' : 'Basic'}</span>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}