import React, { useState } from 'react';
import { EVDashboard } from './components/EVDashboard';
import { BettingControlPanel } from './components/BettingControlPanel';
import { AnalyticsTab } from './components/AnalyticsTab';
import { BetHistory } from './components/BetHistory';

const App: React.FC = () => {
    // This state acts as our global refresh trigger
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // We will pass this function to the Control Panel
    const triggerDataRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <h1 style={{ textAlign: 'center', fontFamily: 'sans-serif' }}>Sports Betting EV Analyzer</h1>
            
            {/* The 'key' tells React to completely reload these components when the trigger changes */}
            <AnalyticsTab key={`analytics-${refreshTrigger}`} />
            
            <EVDashboard />
            
            {/* We pass the trigger function down so the control panel can call it after a database insert/update */}
            <BettingControlPanel onBetUpdated={triggerDataRefresh} />
            
            <BetHistory key={`history-${refreshTrigger}`} />
        </div>
    );
};

export default App;