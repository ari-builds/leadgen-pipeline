---
name: lead-reporter
description: Use when generating reports, exports, or analytics for leads and clients. Triggers on "generate report", "export leads", "create PDF", "make a presentation", "download Excel", "client report", "show analytics". Supports XLSX, DOCX, PPTX, PDF Summary, and PDF Visual formats.
---

# Lead Reporter Skill

Generates reports and exports from lead data in multiple formats.

## Export Formats

| Format | Best For | Command |
|--------|----------|---------|
| Excel (.xlsx) | Data analysis, filtering, sorting | `?format=xlsx` |
| Word (.docx) | Formal reports, documentation | `?format=docx` |
| PowerPoint (.pptx) | Client presentations | `?format=pptx` |
| PDF Summary | Clean data tables | `?format=pdf-summary` |
| PDF Visual | Charts + data combined | `?format=pdf-visual` |

## How to Generate Reports

### Via API
```bash
# Export all leads
curl -o leads.xlsx "http://localhost:3000/api/leads/export?format=xlsx"

# Export for specific client
curl -o client-report.pdf "http://localhost:3000/api/leads/export?format=pdf-visual&clientId=1"

# Export with filters
curl -o filtered.xlsx "http://localhost:3000/api/leads/export?format=xlsx&status=qualified&search=dental"
```

### Via Dashboard
- **Leads page** (`/leads`): Click "Export" button → choose format
- **Client detail** (`/clients/[id]`): Click "Export" button → choose format
- **Analytics page** (`/analytics`): Click "Export" button

### Generating Reports for Clients

When generating a client report:

1. **Query the client's leads**:
   ```sql
   SELECT l.* FROM leads l
   JOIN client_leads cl ON l.id = cl.lead_id
   WHERE cl.client_id = ?
   ORDER BY l.score DESC
   ```

2. **Choose format based on use case**:
   - Monthly delivery → PDF Visual (charts look impressive)
   - Data handoff → XLSX (client can filter/sort)
   - Executive summary → DOCX (professional formatting)
   - Sales meeting → PPTX (presentation-ready)

3. **Generate via API route** or use the export modules directly:
   ```typescript
   import { generateXLSX, generatePDFVisual } from "@/lib/exports";
   ```

## Analytics Dashboard

The `/analytics` page shows real-time charts:
- Status distribution (donut chart)
- Industry breakdown (bar chart)
- Score distribution (histogram)
- Top 10 leads table

Per-client analytics are available on `/clients/[id]`.
