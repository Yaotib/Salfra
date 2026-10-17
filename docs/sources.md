# Salfra Source Register

Last updated: 2026-10-17

## Approval policy

**A source must not be enabled until its access method and terms have been reviewed.** An unchecked or unknown terms field is not permission.

MVP ingestion is limited to authorized RSS, Atom, or API feeds. Do not scrape publisher webpages. Full-text fetching defaults to **No** and may be enabled only when the applicable terms and `robots.txt` clearly permit the intended access.

For each source, document what the terms say about feed use, summaries, content storage, attribution, and commercial use. If permission is ambiguous, keep the source disabled and request clarification or written permission.

## Source register

| Name, domain | Type, primary? | Access method + feed URL | Terms URL + date reviewed | Full-text fetch allowed? | Region | Notes |
|---|---|---|---|---|---|---|
| CISA, `cisa.gov` | `government`; Yes, official security advisories | RSS/XML candidate: https://www.cisa.gov/cybersecurity-advisories/all.xml | https://www.cisa.gov/about/website-policies ; Not reviewed for Salfra use | No | global | Confirm feed availability, reuse conditions, attribution, storage, and applicable terms before enabling. |
| Center for Internet Security, `cisecurity.org` | `publisher`; Yes, official security advisories | RSS candidate: https://www.cisecurity.org/feed/advisories | https://www.cisecurity.org/ ; Not reviewed for Salfra use | No | global | Verify the feed directly and review applicable syndication and reuse conditions. |
| Techpoint Africa, `techpoint.africa` | `publisher`; Yes, original publisher | RSS candidate: https://techpoint.africa/feed/ | https://techpoint.africa/ ; Not reviewed for Salfra use | No | africa | Verify feed availability and applicable terms. Keep disabled until the intended use is authorized. |
| TechCabal, `techcabal.com` | `publisher`; Yes, original publisher | RSS candidate: https://techcabal.com/feed/feed | https://techcabal.com/terms-use/ ; Review required before use | No | africa | Review restrictions on automated collection, summaries, storage, and commercial use. Seek written permission if necessary. |
| Tech Africa, `techafrica.com` | `publisher`; Yes, original publisher | Feed availability and URL require direct verification | https://www.techafrica.com/terms-of-service/ ; Review required before use | No | africa | Verify the publisher's feed and whether the intended automated use is permitted. |
| Google Blog, `blog.google` | `company_blog`; Yes, official company source | Find and verify the first-party RSS/Atom feed directly | https://policies.google.com/terms ; Review required before use | No | global | Confirm the exact feed URL and applicable content and syndication terms. |
| Anthropic, `anthropic.com` | `lab_blog`; Yes, official AI company source | No verified first-party feed URL recorded | https://www.anthropic.com/legal/consumer-terms ; Review required before use | No | global | Candidate only. Enable only if an authorized machine-readable feed or API is available. |

**Important:** These are candidate sources, not approved sources. Feed URLs and current terms must be verified before activation. A website's general terms page may not be sufficient to establish permission for automated feed ingestion or reuse.

## Enablement checklist

Before enabling any source:

- [ ] Confirm the feed or API is provided by or authorized by the publisher.
- [ ] Read the current terms and relevant feed or syndication policy.
- [ ] Record the date actually reviewed.
- [ ] Document rules for summaries, storage, attribution, and commercial use.
- [ ] Check `robots.txt` before any proposed full-text fetching.
- [ ] Keep full-text fetching disabled unless both applicable terms and `robots.txt` clearly permit it.
- [ ] Confirm rate limits and configure a conservative polling interval.
- [ ] Record the reviewer, approval date, and status in the admin audit log.

## Source statuses

- `candidate`: Identified but not reviewed.
- `pending_terms_review`: Terms or permissions remain unverified.
- `blocked`: The intended use is not permitted without additional authorization.
- `enabled`: Required checks are complete and approval is documented.

## Current production status

**No source is approved for production ingestion yet.** All candidates remain disabled until the required checks have been completed.
