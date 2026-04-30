-- Stage 3 Deliverable B: Indexes
-- Run these commands in your Neon SQL editor to create the indexes.

-- 1. Index on UserBets(status)
-- Supports the query in get_analytics() report.
-- Speeds up filtering bets where status IN ('Won', 'Lost', 'Push').
CREATE INDEX idx_userbets_status ON UserBets(status);

-- 2. Indexes for Foreign Keys to speed up JOINs
-- Supports the get_bet_history() and get_ev_report() queries.
-- PostgreSQL does not automatically index foreign keys, so these help the JOIN conditions
-- ON ub.prop_id = pl.prop_id AND ON pl.player_id = p.player_id
CREATE INDEX idx_userbets_propid ON UserBets(prop_id);
CREATE INDEX idx_proplines_playerid ON PropLines(player_id);

-- 3. Indexes for Filtering & Sorting in get_filters()
-- Speeds up SELECT DISTINCT team FROM Players ORDER BY team; and similar queries.
CREATE INDEX idx_players_team ON Players(team);
CREATE INDEX idx_players_name ON Players(name);
CREATE INDEX idx_proplines_statcategory ON PropLines(stat_category);

-- 4. Index for EV Report Filtering
-- Speeds up the get_ev_report() query when the user filters by opponent.
CREATE INDEX idx_proplines_opponent ON PropLines(opponent);

-- 5. Composite Index for L3 Hit Rate Query
-- Supports the calculate_l3_hit_rate() function.
-- Speeds up: SELECT {db_column} FROM PlayerStats WHERE player_id = %s ORDER BY game_date DESC LIMIT 3
CREATE INDEX idx_playerstats_playerid_gamedate ON PlayerStats(player_id, game_date DESC);
