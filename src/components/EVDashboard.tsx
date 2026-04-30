import React, { useState, useEffect, useMemo } from 'react';
import { fetchFilters, fetchEVReport } from '../api';

interface ReportRow {
    prop_id: number;
    name: string;
    team: string;
    opponent: string;
    sportsbook: string;
    stat_category: string; // Added to interface
    line: number;
    over_odds: number;
    under_odds: number;
    true_over_prob: number | null;
    l3_hit_rate: number | null; // NEW L3 HIT RATE
}

interface PlayerData {
    name: string;
    team: string;
}

const getImpliedProb = (odds: number): number => {
    if (odds < 0) return Math.abs(odds) / (Math.abs(odds) + 100);
    return 100 / (odds + 100);
};

const calculateVig = (overOdds: number, underOdds: number): number => {
    return (getImpliedProb(overOdds) + getImpliedProb(underOdds)) - 1;
};

const calculateEV = (odds: number, trueWinProb: number): number => {
    const wager = 100;
    const potentialProfit = odds < 0 ? wager * (100 / Math.abs(odds)) : wager * (odds / 100);
    return (trueWinProb * potentialProfit) - ((1 - trueWinProb) * wager);
};

export const EVDashboard: React.FC = () => {
    const [teams, setTeams] = useState<string[]>([]);
    const [players, setPlayers] = useState<PlayerData[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    
    const [selectedTeam, setSelectedTeam] = useState<string>('');
    const [selectedOpponent, setSelectedOpponent] = useState<string>('');
    const [selectedPlayer, setSelectedPlayer] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    
    const [reportData, setReportData] = useState<ReportRow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    useEffect(() => {
        const loadFilters = async () => {
            try {
                const data = await fetchFilters();
                setTeams(data.teams || []);
                setPlayers(data.players || []);
                setCategories(data.stat_categories || []);
            } catch (err) {
                setError("Failed to load filter options.");
            }
        };
        loadFilters();
    }, []);

    useEffect(() => {
        const loadReport = async () => {
            setIsLoading(true);
            try {
                const data = await fetchEVReport(selectedTeam, selectedPlayer, selectedCategory, selectedOpponent);
                setReportData(data || []);
                setError(null);
            } catch (err) {
                setError("Failed to load the EV Report.");
            } finally {
                setIsLoading(false);
            }
        };
        loadReport();
    }, [selectedTeam, selectedPlayer, selectedCategory, selectedOpponent]);

    useEffect(() => {
        if (selectedTeam && selectedPlayer) {
            const safePlayers = players || [];
            const playerStillValid = safePlayers.find(p => p.name === selectedPlayer && p.team === selectedTeam);
            if (!playerStillValid) setSelectedPlayer('');
        }
    }, [selectedTeam, selectedPlayer, players]);

    const safePlayers = players || [];
    const availablePlayers = selectedTeam 
        ? safePlayers.filter(p => p.team === selectedTeam) 
        : safePlayers;

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = useMemo(() => {
        const enrichedData = (reportData || []).map(row => {
            const vig = calculateVig(row.over_odds, row.under_odds) * 100;
            const assumedWinProb = row.true_over_prob !== null ? Number(row.true_over_prob) : 0.50; 
            const ev = calculateEV(row.over_odds, assumedWinProb);
            return { ...row, calculatedVig: vig, calculatedEV: ev };
        });

        if (!sortConfig) return enrichedData;

        return enrichedData.sort((a, b) => {
            const aValue = a[sortConfig.key as keyof typeof a];
            const bValue = b[sortConfig.key as keyof typeof b];

            if (aValue === null) return 1;
            if (bValue === null) return -1;

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [reportData, sortConfig]);

    const getSortIcon = (columnKey: string) => {
        if (!sortConfig || sortConfig.key !== columnKey) return ' ↕';
        return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    };

    const headerStyle: React.CSSProperties = { cursor: 'pointer', backgroundColor: '#f4f4f4', userSelect: 'none' };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h2>📈 Expected Value Dashboard</h2>
            
            <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <div>
                    <label><strong>Team: </strong></label>
                    <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
                        <option value="">All Teams</option>
                        {(teams || []).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label><strong>Opponent: </strong></label>
                    <select value={selectedOpponent} onChange={(e) => setSelectedOpponent(e.target.value)}>
                        <option value="">All Opponents</option>
                        {(teams || []).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label><strong>Player: </strong></label>
                    <select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)}>
                        <option value="">All Players</option>
                        {(availablePlayers || []).map(p => {
                            if (!p || !p.name) return null;
                            return <option key={p.name} value={p.name}>{p.name}</option>;
                        })}
                    </select>
                </div>
                <div>
                    <label><strong>Stat Category: </strong></label>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                        <option value="">All Categories</option>
                        {(categories || []).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
            </div>

            {error && <p style={{ color: 'red' }}>{error}</p>}
            {isLoading && <p>Loading data...</p>}

            {!isLoading && !error && (
                <div style={{ overflowX: 'auto' }}>
                    <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr>
                                <th style={headerStyle} onClick={() => handleSort('prop_id')}>Prop ID{getSortIcon('prop_id')}</th>
                                <th style={headerStyle} onClick={() => handleSort('team')}>Team{getSortIcon('team')}</th>
                                <th style={headerStyle} onClick={() => handleSort('opponent')}>Opponent{getSortIcon('opponent')}</th>
                                <th style={headerStyle} onClick={() => handleSort('name')}>Player Name{getSortIcon('name')}</th>
                                <th style={headerStyle} onClick={() => handleSort('sportsbook')}>Sportsbook{getSortIcon('sportsbook')}</th>
                                <th style={headerStyle} onClick={() => handleSort('line')}>Line{getSortIcon('line')}</th>
                                
                                {/* NEW HEADER */}
                                <th style={headerStyle} onClick={() => handleSort('l3_hit_rate')}>L3 Hit %{getSortIcon('l3_hit_rate')}</th>
                                
                                <th style={headerStyle} onClick={() => handleSort('over_odds')}>Over Odds{getSortIcon('over_odds')}</th>
                                <th style={headerStyle} onClick={() => handleSort('under_odds')}>Under Odds{getSortIcon('under_odds')}</th>
                                <th style={headerStyle} onClick={() => handleSort('calculatedVig')}>Vig %{getSortIcon('calculatedVig')}</th>
                                <th style={headerStyle} onClick={() => handleSort('calculatedEV')}>Over EV ($){getSortIcon('calculatedEV')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(!sortedData || sortedData.length === 0) ? (
                                <tr><td colSpan={11} style={{ textAlign: 'center' }}>No props match your filters.</td></tr>
                            ) : (
                                (sortedData || []).map((row) => {
                                    // Bulletproof the EV and Vig numbers
                                    const safeEV = Number(row.calculatedEV || 0);
                                    const safeVig = Number(row.calculatedVig || 0);
                                    const evColor = safeEV > 0 ? '#15803d' : '#b91c1c';
                                    
                                    // Safely check if the hit rate actually exists (not null AND not undefined)
                                    const hasHitRate = row.l3_hit_rate !== null && row.l3_hit_rate !== undefined;
                                    
                                    // Highlight great hit rates (e.g. 100%) in green, poor in red
                                    let hitRateColor = 'inherit';
                                    if (hasHitRate) {
                                        if (Number(row.l3_hit_rate) >= 66) hitRateColor = '#15803d'; // Green
                                        if (Number(row.l3_hit_rate) <= 33) hitRateColor = '#b91c1c'; // Red
                                    }

                                    return (
                                        <tr key={row.prop_id}>
                                            <td style={{ color: '#666', fontSize: '0.9em' }}>#{row.prop_id}</td>
                                            <td><strong>{row.team}</strong></td>
                                            <td>{row.opponent}</td>
                                            <td><strong>{row.name}</strong></td>
                                            <td>{row.sportsbook}</td>
                                            <td><strong>{row.line} {row.stat_category}</strong></td>
                                            
                                            {/* BULLETPROOFED L3 HIT RATE CELL */}
                                            <td style={{ color: hitRateColor, fontWeight: 'bold' }}>
                                                {hasHitRate ? `${Number(row.l3_hit_rate).toFixed(0)}%` : 'N/A'}
                                            </td>

                                            <td>{row.over_odds}</td>
                                            <td>{row.under_odds}</td>
                                            {/* BULLETPROOFED VIG AND EV CELLS */}
                                            <td>{safeVig.toFixed(2)}%</td>
                                            <td style={{ color: evColor, fontWeight: 'bold' }}>
                                                {safeEV > 0 ? '+' : ''}${safeEV.toFixed(2)}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};