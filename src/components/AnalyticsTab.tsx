import React, { useState, useEffect } from 'react';
import { fetchAnalytics } from '../api';

interface AnalyticsData {
    total_resolved_bets: number;
    total_wagered: number;
    total_returned: number;
    profit: number;
    roi: number;
    win_percentage: number; // NEW
}

export const AnalyticsTab: React.FC = () => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadAnalytics = async () => {
            try {
                const result = await fetchAnalytics();
                setData(result);
            } catch (err) {
                setError('Failed to load analytics.');
            }
        };
        loadAnalytics();
    }, []);

    if (error) return <div style={{ color: 'red' }}>{error}</div>;
    if (!data) return <div>Loading analytics...</div>;

    const isProfitable = data.profit >= 0;
    const color = isProfitable ? '#15803d' : '#b91c1c';

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', border: '1px solid #ccc', marginTop: '20px', backgroundColor: '#f9fafb' }}>
            <h2>📊 Bankroll & ROI Analytics</h2>
            <div style={{ display: 'flex', gap: '30px', fontSize: '1.2rem', flexWrap: 'wrap' }}>
                <div>
                    <strong>Resolved Bets:</strong> {data.total_resolved_bets || 0}
                </div>
                <div>
                    <strong>Win Rate:</strong> {Number(data.win_percentage || 0).toFixed(1)}%
                </div>
                <div>
                    <strong>Total Wagered:</strong> ${Number(data.total_wagered || 0).toFixed(2)}
                </div>
                <div>
                    <strong>Total Returned:</strong> ${Number(data.total_returned || 0).toFixed(2)}
                </div>
                <div style={{ color, fontWeight: 'bold' }}>
                    <strong>Net Profit:</strong> {isProfitable ? '+' : ''}${Number(data.profit || 0).toFixed(2)}
                </div>
                <div style={{ color, fontWeight: 'bold' }}>
                    <strong>ROI:</strong> {isProfitable ? '+' : ''}{Number(data.roi || 0).toFixed(2)}%
                </div>
            </div>
        </div>
    );
};