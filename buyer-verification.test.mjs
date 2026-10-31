# Phase 1: Buyer verification foundation

## Why this phase is deliberately conservative

The current Scout response is model-generated JSON. A source URL in that JSON is not proof that the page exists or supports the claim. This first slice adds deterministic triage without pretending to establish factual truth.

## Added components

- `lib/buyer-verification.mjs`: pure validation and batch deduplication.
- `api/verify.js`: `POST /api/verify` endpoint.
- `tests/buyer-verification.test.mjs`: Node built-in test coverage.

## API

Request:

```json
{
  "candidates": [
    {
      "company": "Example Energy",
      "company_domain": "example.com",
      "type": "expansion",
      "headline": "Company announced a new solar facility",
      "source_title": "Example Industry News",
      "source_url": "https://news.example.org/story",
      "date": "2026-10-20",
      "why_now": "The expansion may create a need for monitoring software."
    }
  ]
}
```

Response includes a status, normalized evidence record, structural checks, flags, completeness score and an explicit `verified: false`.

### Status meanings

- `needs_review`: structurally plausible; a person or a future source-fetching verifier must check the source and claim.
- `expired`: exact day-level evidence is older than the configured freshness window.
- `rejected`: unsafe/invalid URL or future-dated evidence.
- `duplicate`: same normalized company and source URL repeated in this request.

`Oct 2025` style dates retain month precision and are never silently treated as exact dates.

## Security and scope

- Only public-looking HTTP(S) URLs are accepted; credentials, localhost and common private IP ranges are rejected.
- The endpoint does not fetch submitted URLs. This avoids introducing an SSRF-capable fetcher in the first phase.
- No AI call, CRM write, email send or database write is performed.
- `verified` is always false. Structural completeness is not factual confidence.

## Run tests

Requires Node.js 18+:

```bash
node --test tests/buyer-verification.test.mjs
```

## Integration point in the existing app

After Scout has collected `found`, call `/api/verify` with `candidates: found`. Preserve the returned verification record alongside each clue. Do not drop existing clue fields; the UI and saved-run format depend on them.

For this first rollout, only `needs_review` records should appear as reviewable evidence cards. Do not auto-promote any record to a verified buyer. A later source-fetching phase should fetch and extract public pages with strict SSRF protections, record HTTP status and retrieval time, and compare the actual page content to the claimed evidence.

## Next implementation slices

1. Persist companies, evidence sources and verification records in PostgreSQL.
2. Add a safe source fetcher with DNS/IP checks, redirect revalidation, content-type and response-size limits, timeouts, and per-host rate limits.
3. Add human review actions and an immutable verification audit trail.
4. Add evidence-backed scoring only after verification states are available.
