export const BASE_URL = 'http://127.0.0.1:5000/api';

export interface BetData {
    prop_id: number;
    bet_side: string;
    wager_amount: number;
    odds_taken: number;
    potential_payout: number;
}
export const fetchBetHistory = async () => {
    const response = await fetch(`${BASE_URL}/bets/history`);
    if (!response.ok) throw new Error('Failed to fetch bet history');
    return response.json();
};

export const fetchFilters = async () => {
    const response = await fetch(`${BASE_URL}/filters`);
    if (!response.ok) throw new Error('Failed to fetch filters');
    return response.json();
};

export const fetchEVReport = async (team?: string, player?: string, category?: string, opponent?: string) => {
    const params = new URLSearchParams();
    if (team) params.append('team', team);
    if (player) params.append('player', player);
    if (category) params.append('stat_category', category);
    if (opponent) params.append('opponent', opponent); // NEW
    
    const response = await fetch(`${BASE_URL}/ev-report?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch EV report');
    return response.json();
};
export const fetchAnalytics = async () => {
    const response = await fetch(`${BASE_URL}/analytics`);
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return response.json();
};

export const addBet = async (betData: BetData) => {
    const response = await fetch(`${BASE_URL}/bets`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(betData),
    });
    if (!response.ok) throw new Error('Failed to add bet');
    return response.json();
};

export const updateBetStatus = async (betId: number, status: string) => {
    const response = await fetch(`${BASE_URL}/bets/${betId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update bet');
    return response.json();
};

export const deleteBet = async (betId: number) => {
    const response = await fetch(`${BASE_URL}/bets/${betId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete bet');
    return response.json();
};