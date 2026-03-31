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
const ROW_CLASS: Record<number, string> = { 1: 'gold', 2: 'silver', 3: 'bronze' };

export default function LeaderboardTab() {
  const { session } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>(PLACEHOLDER_ENTRIES);

  useEffect(() => {
    apiClient
      .get('/leaderboard')
      .then((res: any) => {
        if (res?.data?.data?.leaderboard) {
          setEntries(res.data.data.leaderboard);
        }
      })
      .catch(() => setEntries(PLACEHOLDER_ENTRIES));
  }, []);

  const myDistrict = (session as any)?.user?.district ?? '';

  return (
    <div style={{ padding: '20px 16px', background: '#EEF5F0', minHeight: '100%' }}>
      <div style={{ fontSize: '22px', fontWeight: 700, color: '#0F2D1C', marginBottom: '4px' }}>
        🏆 District Leaderboard
      </div>
      <div style={{ fontSize: '12px', color: '#4D7060', marginBottom: '16px' }}>
        Ranked by recycling points per km²
      </div>

      {entries.map((entry) => {
        const isOwn = myDistrict === entry.districtName;
        const rowClass = ROW_CLASS[entry.rank] ?? '';

        return (
          <div
            key={entry.rank}
            className={`lb-row ${rowClass}`}
            style={{ outline: isOwn ? '2px solid #2AA962' : 'none' }}
          >
            <div className="lb-medal">
              {MEDAL[entry.rank] ?? (
                <span className="lb-rank">#{entry.rank}</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div className="lb-name">
                {entry.districtName}
                {isOwn && (
                  <span style={{ marginLeft: '8px', fontSize: '11px', color: '#2AA962', fontWeight: 600 }}>
                    ← you
                  </span>
                )}
              </div>
              <div className="lb-sub">
                {entry.totalPoints.toLocaleString()} pts · {entry.areaKm2} km²
              </div>
            </div>
            <div className="lb-score">
              <div className="lb-pts">{entry.pointsPerKm2.toFixed(2)}</div>
              <div className="lb-unit">pts/km²</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}