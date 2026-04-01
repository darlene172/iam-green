import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import OnboardingScreen from './screens/OnboardingScreen';

const LeaderboardTab   = lazy(() => import('./screens/LeaderboardTab'));
const DashboardTab     = lazy(() => import('./screens/DashboardTab'));
const MapTab           = lazy(() => import('./screens/MapTab'));
const GarbageReportTab = lazy(() => import('./screens/GarbageReportTab'));
const CreditsTab       = lazy(() => import('./screens/CreditsTab'));
const ProfileTab       = lazy(() => import('./screens/ProfileTab'));

function TabFallback() {
  return <div style={{ padding: '40px', textAlign: 'center', color: '#8AAD96' }}>Loading…</div>;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

const TABS = [
  { to: '/',         end: true,  bg: '#FEF6DC', icon: '🏆', label: 'Leaderboard' },
  { to: '/dashboard',end: false, bg: '#D9F3E5', icon: '📊', label: 'Dashboard'   },
  { to: '/map',      end: false, bg: '#D0EDFD', icon: '🗺️', label: 'Map'         },
  { to: '/report',   end: false, bg: '#E8F5EE', icon: '📷', label: 'Report'      },
  { to: '/credits',  end: false, bg: '#EBE8FA', icon: '💳', label: 'Credits'     },
  { to: '/profile',  end: false, bg: '#DDE6ED', icon: '👤', label: 'Profile'     },
];

function TabBar() {
  const { session } = useAuth();
  if (!session) return null;
  return (
    <nav style={{
      display: 'flex',
      background: '#fff',
      borderTop: '1px solid #E3EFE7',
      padding: '6px 2px 14px',
      boxShadow: '0 -2px 16px rgba(0,0,0,0.08)',
      flexShrink: 0,
    }}>
      {TABS.map(t => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            padding: '5px 2px',
            borderRadius: '10px',
            textDecoration: 'none',
            fontFamily: "'Noto Sans', sans-serif",
            fontSize: '9px',
            fontWeight: 600,
            color: isActive ? '#1F8F56' : '#8AAD96',
            background: isActive ? '#EFF9F3' : 'transparent',
            minWidth: 0,
          })}
        >
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '8px',
            background: t.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
          }}>
            {t.icon}
          </div>
          <span style={{ fontSize: '9px', whiteSpace: 'nowrap' }}>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default function App() {
  const { session } = useAuth();
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#c8d8cc',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        minHeight: '100vh',
        background: '#EEF5F0',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Noto Sans', sans-serif",
        boxShadow: '0 0 40px rgba(0,0,0,0.15)',
      }}>
        {session && (
          <div style={{
            background: '#1A7A4A',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px 14px',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="24" viewBox="0 0 30 30" fill="none">
                <circle cx="15" cy="15" r="14" fill="#E8F5EE"/>
                <path d="M15 6c-2 4-6 5-6 9a6 6 0 0012 0c0-4-4-5-6-9z" fill="#1F8F56"/>
                <path d="M11 17c1-1 3-1.5 4-3 1 1.5 3 2 4 3" stroke="#1A7A4A" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
              </svg>
              <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '-0.3px' }}>iAM Green</span>
            </div>
            <span style={{ fontSize: '12px', opacity: 0.85 }}>Recycling Rewards</span>
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Suspense fallback={<TabFallback />}>
            <Routes>
              <Route path="/onboarding" element={<OnboardingScreen />} />
              <Route path="/" element={<AuthGuard><LeaderboardTab /></AuthGuard>} />
              <Route path="/dashboard" element={<AuthGuard><DashboardTab /></AuthGuard>} />
              <Route path="/map" element={<AuthGuard><MapTab /></AuthGuard>} />
              <Route path="/report" element={<AuthGuard><GarbageReportTab /></AuthGuard>} />
              <Route path="/credits" element={<AuthGuard><CreditsTab /></AuthGuard>} />
              <Route path="/profile" element={<AuthGuard><ProfileTab /></AuthGuard>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
        <TabBar />
      </div>
    </div>
  );
}