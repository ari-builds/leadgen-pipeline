---
name: lead-analyzer
description: Use when analyzing, scoring, or enriching leads in the database. Triggers on "analyze leads", "score leads", "rate this lead", "enrich lead data", "assess lead quality". Evaluates lead quality based on available data.
---

# Lead Analyzer Skill

Analyzes and scores leads based on data completeness, engagement signals, and fit with the client's ideal customer profile.

## Scoring Criteria (1-10)

| Factor | Weight | Description |
|--------|--------|-------------|
| Contact Info | 30% | Has email, phone, decision-maker name |
| Web Presence | 20% | Active website, social media profiles |
| Industry Match | 25% | Matches client's ideal customer profile |
| Data Completeness | 15% | All fields populated, notes included |
| Recency | 10% | Recently scraped, not stale |

## How to Analyze

### Manual Analysis (via conversation)
When asked to analyze a lead, evaluate:

1. **Read the lead data** from the database:
   ```sql
   SELECT * FROM leads WHERE id = ?
   ```

2. **Score each factor** based on available data:
   - Has email AND phone AND contact name → Contact Info: 9/10
   - Has website with active content → Web Presence: 8/10
   - Industry matches client ICP → Industry Match: 9/10
   - All fields populated → Completeness: 8/10

3. **Calculate weighted average** and update:
   ```sql
   UPDATE leads SET score = ?, notes = ? WHERE id = ?
   ```

### Bulk Analysis
To analyze all leads for a client:
```sql
SELECT l.* FROM leads l
JOIN client_leads cl ON l.id = cl.lead_id
WHERE cl.client_id = ?
ORDER BY l.score ASC
```

Focus enrichment on the lowest-scored leads — they have the most room for improvement.

## Enrichment Checklist

For each lead, check and fill:
- [ ] Company name (verified, not guessed)
- [ ] Contact email (from website or LinkedIn)
- [ ] Contact name (decision-maker)
- [ ] Phone number
- [ ] Industry (accurate classification)
- [ ] Location (city, state)
- [ ] Website URL (working, current)
- [ ] Social media links
- [ ] Tech stack (if detectable)
- [ ] Notes (relevance to client, any signals)

## Status Guidelines

- **new**: Just scraped, not yet evaluated
- **contacted**: Outreach started
- **qualified**: Fits ICP, worth pursuing
- **closed**: Converted to customer
