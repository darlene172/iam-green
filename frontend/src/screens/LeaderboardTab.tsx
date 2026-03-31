import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../auth/AuthContext';

interface LeaderboardEntry {
  rank: number;
  districtName: string;
  totalPoints: number;
  areaKm2: number;
  pointsPerKm2: number;
}

const PLACEHOLDER_ENTRIES: LeaderboardEntry[] = [
  { rank: 1, districtName: 'Sha Tin',            totalPoints: 18420, areaKm2: 69.0, pointsPerKm2: 266.96 },
  { rank: 2, districtName: 'Kwun Tong',           totalPoints: 15830, areaKm2: 11.3, pointsPerKm2: 140.09 },
  { rank: 3, districtName: 'Yau Tsim Mong',       totalPoints: 12100, areaKm2: 7.0,  pointsPerKm2: 172.86 },
  { rank: 4, districtName: 'Sham Shui Po',        totalPoints: 10950, areaKm2: 9.9,  pointsPerKm2: 110.61 },
  { rank: 5, districtName: 'Eastern',             totalPoints: 9870,  areaKm2: 18.6, pointsPerKm2: 53.06  },
  { rank: 6, districtName: 'Central and Western', totalPoints: 8540,  areaKm2: 12.5, pointsPerKm2: 68.32  },
];

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

const ROW_STYLE: Record<number, React.CSSProperties> = {
  1: { background: '#FFFBEE', border: '1px solid #F0E498' },
  2: { background: '#ffffff', border: '1px solid #E3EFE7' },
  3: { background: '#FDF0E3', border: '1px solid #EDD8B8' },
};

export default function LeaderboardTab() {
  const { session } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>(PLACEHOLDER_ENTRIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<{ data: { leaderboard: LeaderboardEntry[] } }>('/leaderboard')
      .then((res) => { setEntries(res.data.data.leaderboard); })
      .catch(() => { setEntries(PLACEHOLDER_ENTRIES); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '20px 16px', background: '#EEF5F0', minHeight: '100vh' }}>
      <div style={{ fontSize: '22px', fontWeight: 700, color: '#0F2D1C', marginBottom: '4px' }}>
        🏆 District Leaderboard
      </div>
      <div style={{ fontSize: '12px', color: '#4D7060', marginBottom: '16px' }}>
        Ranked by recycling points per km²
      </div>

      {entries.map((entry) => {
        const isOwn = session?.user?.district === entry.districtName;
        const rowStyle = ROW_STYLE[entry.rank] ?? { background: '#ffffff', border: '1px solid #E3EFE7' };

        return (
          <div
            key={entry.rank}
            style={{
              ...rowStyle,
              borderRadius: '16px',
              padding: '13px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              outline: isOwn ? '2px solid #2AA962' : 'none',
            }}
          >
            {/* Medal or rank number */}
            <div style={{ width: '34px', textAlign: 'center', fontSize: '22px', flexShrink: 0 }}>
              {MEDAL[entry.rank] ?? (
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#8AAD96' }}>
                  #{entry.rank}
                </span>
              )}
            </div>

            {/* District info */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#0F2D1C' }}>
                {entry.districtName}
                {isOwn && (
                  <span style={{ marginLeft: '8px', fontSize: '11px', color: '#2AA962', fontWeight: 600 }}>
                    ← you
                  </span>
                )}
              </div>
              <div style={{ fontSize: '10.5px', color: '#8AAD96', marginTop: '2px' }}>
                {entry.totalPoints.toLocaleString()} pts · {entry.areaKm2} km²
              </div>
            </div>

            {/* Score */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '18px', color: '#2AA962' }}>
                {entry.pointsPerKm2.toFixed(2)}
              </div>
              <div style={{ fontSize: '10px', color: '#8AAD96' }}>pts/km²</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}