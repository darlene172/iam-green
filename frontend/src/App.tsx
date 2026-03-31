import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import OnboardingScreen from './screens/OnboardingScreen';

const LeaderboardTab   = lazy(() => import('./screens/LeaderboardTab'));
const DashboardTab     = lazy(() => import('./screens/DashboardTab'));
const MapTab           = lazy(() => import('./screens/MapTab'));
const GarbageReportTab = lazy(() => import('./screens/GarbageReportTab'));
const CreditsTab       = lazy(() => import('./screens/CreditsTab'));
const ProfileTab       = lazy(() => import('./screens/ProfileTab'));

function TabFallback() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#8AAD96' }}>Loading…</div>;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function TabBar() {
  const { session } = useAuth();
  if (!session) return null;

  const tabStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 4px',
    fontSize: '9.5px',
    fontWeight: 600,
    color: '#8AAD96',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    gap: '4px',
    textDecoration: 'none',
    fontFamily: "'Noto Sans', sans-serif",
  };

  const activeStyle: React.CSSProperties = {
    ...tabStyle,
    color: '#1F8F56',
    background: '#EFF9F3',
    borderRadius: '10px',
  };

  const iconStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '9px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
  };

  return (
    <nav style={{
      display: 'flex',
      background: '#ffffff',
      borderTop: '1px solid #E3EFE7',
      padding: '6px 4px 14px',
      boxShadow: '0 -2px 16px rgba(0,0,0,0.08)',
      flexShrink: 0,
    }}>
      <NavLink to="/" end style={({ isActive }) => isActive ? activeStyle : tabStyle}>
        <div style={{ ...iconStyle, background: '#FEF6DC' }}>🏆</div>
        <span>Leaderboard</span>
      </NavLink>
      <NavLink to="/dashboard" style={({ isActive }) => isActive ? activeStyle : tabStyle}>
        <div style={{ ...iconStyle, background: '#D9F3E5' }}>📊</div>
        <span>Dashboard</span>
      </NavLink>
      <NavLink to="/map" style={({ isActive }) => isActive ? activeStyle : tabStyle}>
        <div style={{ ...iconStyle, background: '#D0EDFD' }}>🗺️</div>
        <span>Map</span>
      </NavLink>
      <NavLink to="/report" style={({ isActive }) => isActive ? activeStyle : tabStyle}>
        <div style={{ ...iconStyle, background: '#E8F5EE' }}>📷</div>
        <span>Report</span>
      </NavLink>
      <NavLink to="/credits" style={({ isActive }) => isActive ? activeStyle : tabStyle}>
        <div style={{ ...iconStyle, background: '#EBE8FA' }}>💳</div>
        <span>Credits</span>
      </NavLink>
      <NavLink to="/profile" style={({ isActive }) => isActive ? activeStyle : tabStyle}>
        <div style={{ ...iconStyle, background: '#DDE6ED' }}>👤</div>
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}

export default function App() {
  const { session } = useAuth();
  return (
    <div style={{
      maxWidth: '480px',
      margin: '0 auto',
      minHeight: '100vh',
      background: '#EEF5F0',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Noto Sans', sans-serif",
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
            <span style={{ fontSize: '1.1rem' }}>♻️</span>
            <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.3px' }}>iAM Green</span>
          </div>
          <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>Recycling Rewards</span>
        </div>
      )}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Suspense fallback={<TabFallback />}>
          <Routes>
            <Route path="/onboarding" element={<OnboardingScreen />} />
            <Route path="/" element={<AuthGuard><LeaderboardTab /></AuthGuard>} />
            <Route path="/dashboard" element={<AuthGuard><DashboardTab /></AuthGuard>} />
            <Route path="/map" element={<AuthGuard><MapTab /></AuthGuard>} />
            <Route path="/report" element={<AuthGuard><GarbageReportTab /></AuthGuard>} />
            <Route path="/credits" element={<AuthGuard><CreditsTab /></AuthGuard>} />
            <Route path="/profile" ele