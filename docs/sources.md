# Salfra Source Register

Last updated: 2026-10-17

## Approval Policy

A source must not be enabled until its access method and terms have been reviewed. An unchecked or unknown terms field is not permission.

MVP ingestion is limited to authorized RSS, Atom, or API feeds. Do not scrape publisher webpages.

Full-text fetching defaults to **No**. Set it to Yes only when the applicable terms and `robots.txt` clearly permit the intended access.

For every source, review and document permissions for feed use, summaries, storage, attribution, and commercial use. If permission is unclear, keep the source disabled and seek clarification or written permission.

## 1. Official AI Labs and Company Blogs

| Name, domain | Type, primary? | Access method + feed URL | Terms URL + date reviewed | Full-text fetch allowed? | Region | Notes |
|---|---|---|---|---|---|---|
| OpenAI, `openai.com` | `lab_blog`; Yes, official | RSS candidate: `https://openai.com/news/rss.xml` | `https://openai.com/policies/terms-of-use/` ; Review pending | No | global | Models, ChatGPT, API releases, research, and safety announcements. Verify feed URL and terms before enabling. |
| Anthropic, `anthropic.com` | `lab_blog`; Yes, official | Official RSS/API not verified | `https://www.anthropic.com/legal/consumer-terms` ; Review pending | No | global | Claude releases, research, developer tools, and AI safety. Use only an authorized machine-readable feed or API. |
| Google DeepMind, `deepmind.google` | `lab_blog`; Yes, official | RSS candidate: `https://deepmind.google/blog/rss.xml` | `https://policies.google.com/terms` ; Review pending | No | global | Gemini models, research breakthroughs, science, and AI agents. Verify feed and terms. |
| Google AI / Google Blog, `blog.google` | `company_blog`; Yes, official | Feed candidate: `https://blog.google/technology/ai/rss/` | `https://policies.google.com/terms` ; Review pending | No | global | AI product launches, Gemini, Search, and research. Verify exact feed URL and applicable permissions. |
| Meta AI, `ai.meta.com` | `lab_blog`; Yes, official | Official RSS/API not verified | `https://ai.meta.com/` ; Review pending | No | global | Llama models, open-weight releases, research, and Meta AI products. Confirm an authorized feed or API. |
| Mistral AI, `mistral.ai` | `lab_blog`; Yes, official | Official RSS/API not verified | `https://mistral.ai/` ; Review pending | No | global | New models, APIs, open-weight releases, and enterprise AI tools. Verify feed availability and terms. |
| NVIDIA, `nvidia.com` | `company_blog`; Yes, official | RSS directory: `https://www.nvidia.com/en-us/about-nvidia/rss/` | `https://www.nvidia.com/en-us/about-nvidia/rss/` ; Review pending | No | global | AI infrastructure, GPUs, robotics, and developer tools. Review RSS restrictions, including non-commercial limitations, before use. |
| Hugging Face, `huggingface.co` | `company_blog`; Yes, official | RSS candidate: `https://huggingface.co/blog/feed.xml` | `https://huggingface.co/terms-of-service` ; Review pending | No | global | Open models, datasets, libraries, and developer tools. Verify feed URL and terms. |
| Microsoft AI, `microsoft.com` | `company_blog`; Yes, official | Official feed URL not verified | `https://www.microsoft.com/en-us/legal/terms-of-use` ; Review pending | No | global | AI products, Copilot, Azure AI, and research. Identify an authorized feed or API before enabling. |
| AWS Machine Learning, `aws.amazon.com` | `company_blog`; Yes, official | Official feed URL not verified | `https://aws.amazon.com/service-terms/` ; Review pending | No | global | AWS AI services, model access, infrastructure, and developer releases. Verify feed and applicable terms. |
| xAI, `x.ai` | `lab_blog`; Yes, official | Official feed URL not verified | `https://x.ai/` ; Review pending | No | global | Grok models, APIs, and research announcements. Confirm an authorized machine-readable feed. |
| DeepSeek, `deepseek.com` | `lab_blog`; Yes, official | Official feed URL not verified | `https://www.deepseek.com/` ; Review pending | No | global | Model releases, research, and developer API updates. Confirm feed availability and terms. |
| Cohere, `cohere.com` | `company_blog`; Yes, official | Official feed URL not verified | `https://cohere.com/` ; Review pending | No | global | Enterprise models, retrieval, embeddings, and APIs. Confirm an authorized feed or API. |
| Perplexity, `perplexity.ai` | `company_blog`; Yes, official | Official feed URL not verified | `https://www.perplexity.ai/` ; Review pending | No | global | AI search, product updates, and research announcements. Confirm an authorized feed or API. |

## 2. Government and Cybersecurity Sources

| Name, domain | Type, primary? | Access method + feed URL | Terms URL + date reviewed | Full-text fetch allowed? | Region | Notes |
|---|---|---|---|---|---|---|
| CISA, `cisa.gov` | `government`; Yes, official | RSS/XML candidate: `https://www.cisa.gov/cybersecurity-advisories/all.xml` | `https://www.cisa.gov/about/website-policies` ; Review pending | No | global | Security advisories and vulnerability announcements. Verify feed availability and reuse conditions. |
| Center for Internet Security, `cisecurity.org` | `publisher`; Yes, official advisories | RSS candidate: `https://www.cisecurity.org/feed/advisories` | `https://www.cisecurity.org/` ; Review pending | No | global | Cybersecurity advisories. Verify feed and applicable syndication terms before enabling. |

## 3. African Technology Publishers

| Name, domain | Type, primary? | Access method + feed URL | Terms URL + date reviewed | Full-text fetch allowed? | Region | Notes |
|---|---|---|---|---|---|---|
| Techpoint Africa, `techpoint.africa` | `publisher`; Yes, original publisher | RSS candidate: `https://techpoint.africa/feed/` | `https://techpoint.africa/` ; Review pending | No | africa | African technology, startups, funding, and AI developments. Verify feed and reuse permissions. |
| TechCabal, `techcabal.com` | `publisher`; Yes, original publisher | RSS candidate: `https://techcabal.com/feed/feed` | `https://techcabal.com/terms-use/` ; Review pending | No | africa | African technology businesses, startups, and digital economy. Review restrictions on automated collection and reuse; seek permission if needed. |
| Tech Africa, `techafrica.com` | `publisher`; Yes, original publisher | Authorized feed URL not verified | `https://www.techafrica.com/terms-of-service/` ; Review pending | No | africa | Verify the domain, feed availability, and permissions for automated use before enabling. |

## Source Status Definitions

- `candidate`: Source identified but not yet reviewed.
- `pending_terms_review`: Feed or terms review remains incomplete.
- `blocked`: Intended use is not permitted without additional authorization.
- `enabled`: Required checks are complete and approval is documented.

## Enablement Checklist

Before enabling any source:

- [ ] Confirm the feed or API is provided by or authorized by the publisher.
- [ ] Verify that the feed URL works and returns machine-readable data.
- [ ] Read the current terms and relevant feed or syndication policy.
- [ ] Record the actual date reviewed and summarize the applicable conditions.
- [ ] Document permissions for summaries, storage, attribution, and commercial use.
- [ ] Check `robots.txt` before considering full-text fetching.
- [ ] Keep full-text fetching disabled unless both terms and `robots.txt` clearly allow it.
- [ ] Record rate limits and configure a conservative polling interval.
- [ ] Record the reviewer, approval date, and decision in the admin audit log.

## Current Production Status

**All listed sources remain disabled until the required checks are complete.** Candidate feed URLs are not proof of current availability or permission to use a source.

Salfra should prioritize official AI announcements and independent reporting, while excluding promotional content that does not meet its newsworthiness criteria.