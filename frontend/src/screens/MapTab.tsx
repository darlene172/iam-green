import { useEffect, useRef, useState, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import MaterialCamera from '../components/MaterialCamera';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient, ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import BinRequestModal from './BinRequestModal';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

export function getMockFillLevel(id: number): number {
  return (id * 37) % 101;
}

export function getFillCategory(pct: number): { label: string; color: string } {
  if (pct <= 20) return { label: 'Empty',  color: '#16a34a' };
  if (pct <= 40) return { label: 'Low',    color: '#16a34a' };
  if (pct <= 60) return { label: 'Medium', color: '#d97706' };
  if (pct <= 80) return { label: 'High',   color: '#dc2626' };
  return           { label: 'Full',   color: '#dc2626' };
}

function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const FALLBACK_POINTS: CollectionPoint[] = [
  { id: 1,  name: 'Wan Chai Recycling Station',       accessTier: 'basic',   materials: ['Paper','Plastic','Metal'], lat: 22.2783, lng: 114.1825, distanceMetres: 200 },
  { id: 2,  name: 'Causeway Bay Green Corner',         accessTier: 'basic',   materials: ['Paper','Glass'],           lat: 22.2800, lng: 114.1840, distanceMetres: 350 },
  { id: 3,  name: 'Mong Kok Eco Point',                accessTier: 'premium', materials: ['E-Waste','Clothing'],      lat: 22.3193, lng: 114.1694, distanceMetres: 500 },
  { id: 4,  name: 'Tsim Sha Tsui Collection Hub',      accessTier: 'basic',   materials: ['Paper','Plastic'],         lat: 22.2988, lng: 114.1722, distanceMetres: 600 },
  { id: 5,  name: 'Sha Tin Recycling Centre',          accessTier: 'premium', materials: ['Metal','Glass','E-Waste'], lat: 22.3830, lng: 114.1952, distanceMetres: 800 },
  { id: 6,  name: 'Kwun Tong Green Station',           accessTier: 'basic',   materials: ['Paper','Plastic','Metal'], lat: 22.3130, lng: 114.2262, distanceMetres: 900 },
  { id: 7,  name: 'Sham Shui Po Eco Corner',           accessTier: 'basic',   materials: ['Clothing','Paper'],        lat: 22.3302, lng: 114.1618, distanceMetres: 1100 },
  { id: 8,  name: 'Central Recycling Drop-off',        accessTier: 'premium', materials: ['Paper','Glass','Plastic'], lat: 22.2855, lng: 114.1549, distanceMetres: 1200 },
  { id: 9,  name: 'Tuen Mun Green Point',              accessTier: 'basic',   materials: ['Plastic','Metal'],         lat: 22.3914, lng: 113.9769, distanceMetres: 1500 },
  { id: 10, name: 'Yuen Long Eco Station',             accessTier: 'basic',   materials: ['Paper','Plastic'],         lat: 22.4447, lng: 114.0228, distanceMetres: 1800 },
];

interface CollectionPoint {
  id: number;
  name: string;
  accessTier: 'basic' | 'premium';
  materials: string[];
  lat: number;
  lng: number;
  distanceMetres: number;
}

interface MapStats {
  totalCheckins: number;
  totalPoints: number;
  totalGarbageReports: number;
}

interface GarbageReport {
  id: number;
  lat: number;
  lng: number;
  districtName?: string | null;
  photoUrl?: string;
  createdAt: string;
}

function AutoLocate() {
  const map = useMap();
  useEffect(() => {
    map.locate({ setView: true, maxZoom: 14 });
  }, [map]);
  return null;
}

export default function MapTab() {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as { centerLat?: number; centerLng?: number } | null;
  const { session, clearSession } = useAuth();

  const [points, setPoints] = useState<CollectionPoint[]>(FALLBACK_POINTS);
  const [stats, setStats] = useState<MapStats | null>(null);
  const [popup, setPopup] = useState<CollectionPoint | null>(null);
  const [checkinMsg, setCheckinMsg] = useState<string | null>(null);
  const [showBinModal, setShowBinModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const userPos = useRef<{ lat: number; lng: number } | null>(null);

  const defaultCenter: [number, number] = navState?.centerLat != null
    ? [navState.centerLat, navState.centerLng ?? 114.1694]
    : [22.3193, 114.1694];

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => { userPos.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }; },
      () => {},
      { timeout: 5000, maximumAge: 60000 },
    );

    apiClient.get('/collection-points/nearby?lat=22.3193&lng=114.1694&radius=5000')
      .then((res: any) => {
        const pts = res?.data?.points;
        if (pts && pts.length > 0) setPoints(pts);
      })
      .catch(() => {});

    apiClient.get('/map/stats?minLat=22.1&minLng=113.7&maxLat=22.6&maxLng=114.5')
      .then((res: any) => { if (res?.data) setStats(res.data); })
      .catch(() => {});
  }, []);

  async function handleCheckIn(point: CollectionPoint) {
    if (checkingIn) return;
    setCheckinMsg(null);
    setCheckingIn(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await apiClient.post<{ data: { pointsAwarded: number; buildingPointsAwarded: number } }>(
            '/checkins',
            { lat: pos.coords.latitude, lng: pos.coords.longitude, collectionPointId: point.id },
          );
          setCheckinMsg(`✅ +${res.data.pointsAwarded} pts earned!`);
          setPopup(null);
        } catch (e) {
          if (e instanceof ApiError) {
            if (e.status === 409) setCheckinMsg('⏳ Already checked in recently.');
            else if (e.status === 422) setCheckinMsg('📍 Too far from this location.');
            else if (e.status === 401) { clearSession(); navigate('/onboarding'); }
            else setCheckinMsg('Something went wrong.');
          }
        } finally { setCheckingIn(false); }
      },
      () => { setCheckinMsg('📍 Enable GPS to check in.'); setCheckingIn(false); },
      { timeout: 8000, maximumAge: 30000 },
    );
  }

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column' }}>

      {/* Map */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <MapContainer
          center={defaultCenter}
          zoom={navState?.centerLat != null ? 15 : 12}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <AutoLocate />
          {points.map(point => (
            <CircleMarker
              key={point.id}
              center={[point.lat, point.lng]}
              radius={8}
              pathOptions={{ fillColor: '#2563eb', fillOpacity: 0.9, color: '#fff', weight: 2 }}
              eventHandlers={{ click: () => setPopup(point) }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Stats overlay */}
      {stats && (
        <div style={{
          position: 'absolute', bottom: '1rem', left: '0.75rem',
          background: 'rgba(255,255,255,0.93)', borderRadius: '10px',
          padding: '0.5rem 0.75rem', fontSize: '0.75rem',
          boxShadow: '0 1px 6px rgba(0,0,0,0.15)', lineHeight: 1.6,
          pointerEvents: 'none', zIndex: 500,
        }}>
          <div>✅ {stats.totalCheckins} check-ins</div>
          <div>🌿 {stats.totalPoints} pts</div>
          <div>🗑️ {stats.totalGarbageReports} reports</div>
        </div>
      )}

      {/* Sort Item button */}
      <button onClick={() => setShowSortModal(true)} style={{
        position: 'absolute', top: '1rem', left: '1rem',
        background: '#fff', color: '#374151', borderRadius: '8px',
        padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 600,
        boxShadow: '0 1px 6px rgba(0,0,0,0.2)', zIndex: 500, border: 'none', cursor: 'pointer',
      }}>♻️ Sort Item</button>

      {/* Request Bin button */}
      <button onClick={() => setShowBinModal(true)} style={{
        position: 'absolute', top: '1rem', right: '1rem',
        background: '#fff', color: '#374151', borderRadius: '8px',
        padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 600,
        boxShadow: '0 1px 6px rgba(0,0,0,0.2)', zIndex: 500, border: 'none', cursor: 'pointer',
      }}>🗑️ Request Bin</button>

      {/* Sort modal */}
      {showSortModal && (
        <div onClick={() => setShowSortModal(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: '16px', padding: '1.25rem',
            width: '100%', maxWidth: '480px', boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>♻️ How to Sort Items</div>
              <button onClick={() => setShowSortModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#9ca3af', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ width: '100%', height: '320px', borderRadius: '10px', overflow: 'hidden' }}>
              <MaterialCamera />
            </div>
          </div>
        </div>
      )}

      {/* Checkin message */}
      {checkinMsg && (
        <div style={{
          position: 'absolute', top: '1rem', left: '1rem', right: '8rem',
          background: '#fff', borderRadius: '8px', padding: '0.5rem 0.75rem',
          fontSize: '0.82rem', boxShadow: '0 1px 6px rgba(0,0,0,0.2)', zIndex: 500,
        }}>
          {checkinMsg}
          <button onClick={() => setCheckinMsg(null)} style={{ float: 'right', background: 'none', border: 'none', fontSize: '1rem', color: '#6b7280', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Collection point popup */}
      {popup && (
        <div style={{
          position: 'absolute', bottom: '1rem', left: '0.75rem', right: '0.75rem',
          background: '#fff', borderRadius: '14px', padding: '1rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.18)', zIndex: 500,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.3rem' }}>{popup.name}</div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{
                  background: popup.accessTier === 'premium' ? '#D9F3E5' : '#E6F1FB',
                  color: popup.accessTier === 'premium' ? '#155C38' : '#0C447C',
                  padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 600,
                }}>{popup.accessTier}</span>
                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{Math.round(popup.distanceMetres)} m away</span>
              </div>
              {popup.materials.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.3rem' }}>{popup.materials.join(' · ')}</div>
              )}
            </div>
            <button onClick={() => setPopup(null)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#9ca3af', cursor: 'pointer' }}>×</button>
          </div>

          {(() => {
            const pct = getMockFillLevel(popup.id);
            const { label, color } = getFillCategory(pct);
            return (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ background: '#e5e7eb', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  <span style={{ color: '#6b7280' }}>Fill level</span>
                  <span style={{ color, fontWeight: 600 }}>{pct}% · {label}</span>
                </div>
              </div>
            );
          })()}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
            <button
              onClick={() => void handleCheckIn(popup)}
              disabled={checkingIn}
              style={{
                flex: 1, padding: '10px', borderRadius: '99px',
                background: '#2AA962', color: '#fff', border: 'none',
                fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >{checkingIn ? '…' : '✅ Check In'}</button>
            <button
              onClick={() => window.open(`https://maps.google.com/?q=${popup.lat},${popup.lng}`, '_blank', 'noopener,noreferrer')}
              style={{
                flex: 1, padding: '10px', borderRadius: '99px',
                background: '#EFF9F3', color: '#1A7A4A', border: '1.5px solid #2AA962',
                fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >🗺️ Directions</button>
          </div>
        </div>
      )}

      {showBinModal && <BinRequestModal onClose={() => setShowBinModal(false)} />}
    </div>
  );
}