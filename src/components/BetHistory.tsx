import React, { useState, useEffect } from 'react';
import { fetchBetHistory } from '../api';

interface BetHistoryRow {
    bet_id: number;
    prop_id: number; // NEW
    player_name: string;
    team: string;
    opponent: string;
    sportsbook: string;
    stat_category: string;
    line: number;
    bet_side: string;
    wager_amount: number;
    odds_taken: number;
    potential_payout: number;
    status: string;
}

export const BetHistory: React.FC = () => {
    const [history, setHistory] = useState<BetHistoryRow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const loadHistory = async () => {
        setIsLoading(true);
        try {
            const data = await fetchBetHistory();
            setHistory(data || []);
            setError(null);
        } catch (err) {
            setError("Failed to load bet history.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const getStatusColor = (status: string) => {
        if (status === 'Won') return '#15803d';
        if (status === 'Lost') return '#b91c1c';
        return '#4b5563';
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', marginTop: '20px' }}>
            <h2>📖 My Bet History</h2>
            
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {isLoading && <p>Loading history...</p>}

            {!isLoading && !error && (
                <div style={{ overflowX: 'auto' }}>
                    <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: '#f4f4f4' }}>
                            <tr>
                                <th>Bet ID</th>
                                <th>Prop ID</th> {/* NEW HEADER */}
                                <th>Matchup</th>
                                <th>Player</th>
                                <th>Bet Details</th>
                                <th>Sportsbook</th>
                                <th>Wager</th>
                                <th>To Win</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(!history || history.length === 0) ? (
                                <tr><td colSpan={9} style={{ textAlign: 'center' }}>No bets placed yet.</td></tr>
                            ) : (
                                (history || []).map((row) => (
                                    <tr key={row.bet_id}>
                                        <td>{row.bet_id}</td>
                                        {/* NEW PROP ID CELL */}
                                        <td style={{ color: '#666', fontSize: '0.9em' }}>#{row.prop_id}</td> 
                                        <td>{row.team} vs {row.opponent}</td>
                                        <td><strong>{row.player_name}</strong></td>
                                        <td>{row.bet_side} {row.line} {row.stat_category} ({row.odds_taken})</td>
                                        <td>{row.sportsbook}</td>
                                        <td>${Number(row.wager_amount || 0).toFixed(2)}</td>
                                        <td>${Number(row.potential_payout || 0).toFixed(2)}</td>
                                        <td style={{ color: getStatusColor(row.status), fontWeight: 'bold' }}>
                                            {row.status}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};