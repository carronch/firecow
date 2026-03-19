-- Migration: Reviewer Pool & Campaigns

CREATE TABLE reviewers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL UNIQUE,
    sinpe_number TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'banned')),
    total_gigs_completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE review_campaigns (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    budget INTEGER NOT NULL,
    bounty_per_review INTEGER NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE review_dispatch_log (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL REFERENCES review_campaigns(id) ON DELETE CASCADE,
    reviewer_id TEXT NOT NULL REFERENCES reviewers(id) ON DELETE CASCADE,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    payout_status TEXT DEFAULT 'pending' CHECK(payout_status IN ('pending', 'paid', 'failed')),
    UNIQUE(campaign_id, reviewer_id)
);
