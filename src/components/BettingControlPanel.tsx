import React, { useState } from 'react';
import { addBet, updateBetStatus, deleteBet } from '../api';

interface Props {
    onBetUpdated?: () => void;
}

export const BettingControlPanel: React.FC<Props> = ({ onBetUpdated }) => {    
    const [propId, setPropId] = useState<number | ''>('');
    const [betSide, setBetSide] = useState<string>('Over');
    const [wagerAmount, setWagerAmount] = useState<number | ''>('');
    const [oddsTaken, setOddsTaken] = useState<number | ''>('');
    const [potentialPayout, setPotentialPayout] = useState<number | ''>('');
    
    const [manageId, setManageId] = useState<number | ''>('');
    const [manageStatus, setManageStatus] = useState<string>('Won');
    
    const [message, setMessage] = useState<string>('');

    const handleAddBet = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addBet({
                prop_id: Number(propId),
                bet_side: betSide,
                wager_amount: Number(wagerAmount),
                odds_taken: Number(oddsTaken),
                potential_payout: Number(potentialPayout)
            });
            setMessage('Bet successfully added!');
            setPropId('');
            setWagerAmount('');
            setOddsTaken('');
            setPotentialPayout('');
            
            // TRIGGER REFRESH HERE
            if (onBetUpdated) onBetUpdated(); 
            
        } catch (err) {
            setMessage('Error adding bet.');
        }
    };

    const handleUpdate = async () => {
        if (!manageId) return;
        try {
            await updateBetStatus(Number(manageId), manageStatus);
            setMessage(`Bet ${manageId} updated to ${manageStatus}!`);
            
            // TRIGGER REFRESH HERE
            if (onBetUpdated) onBetUpdated(); 
            
        } catch (err) {
            setMessage('Error updating bet.');
        }
    };

    const handleDelete = async () => {
        if (!manageId) return;
        try {
            await deleteBet(Number(manageId));
            setMessage(`Bet ${manageId} deleted!`);
            setManageId('');
            
            // TRIGGER REFRESH HERE
            if (onBetUpdated) onBetUpdated(); 
            
        } catch (err) {
            setMessage('Error deleting bet.');
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', border: '1px solid #ccc', marginTop: '20px' }}>
            <h2>Control Panel</h2>
            {message && <p style={{ color: 'blue', fontWeight: 'bold' }}>{message}</p>}
            
            <div style={{ display: 'flex', gap: '40px' }}>
                <form onSubmit={handleAddBet} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}>
                    <h3>Add New Bet</h3>
                    <input type="number" placeholder="Prop ID" value={propId} onChange={e => setPropId(Number(e.target.value))} required />
                    <select value={betSide} onChange={e => setBetSide(e.target.value)}>
                        <option value="Over">Over</option>
                        <option value="Under">Under</option>
                    </select>
                    <input type="number" placeholder="Wager Amount ($)" value={wagerAmount} onChange={e => setWagerAmount(Number(e.target.value))} required />
                    <input type="number" placeholder="Odds Taken (e.g. -110)" value={oddsTaken} onChange={e => setOddsTaken(Number(e.target.value))} required />
                    <input type="number" placeholder="Potential Payout ($)" value={potentialPayout} onChange={e => setPotentialPayout(Number(e.target.value))} required />
                    <button type="submit">Submit Bet</button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}>
                    <h3>Manage Existing Bet</h3>
                    <input type="number" placeholder="Bet ID to manage" value={manageId} onChange={e => setManageId(Number(e.target.value))} />
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select value={manageStatus} onChange={e => setManageStatus(e.target.value)}>
                            <option value="Won">Won</option>
                            <option value="Lost">Lost</option>
                            <option value="Push">Push</option>
                        </select>
                        <button onClick={handleUpdate}>Update Status</button>
                    </div>
                    
                    <button onClick={handleDelete} style={{ color: 'red' }}>Delete Bet</button>
                </div>
            </div>
        </div>
    );
};