# AI and Technology News Curation Platform

# ROUND 1: VISION AND PROBLEM

### 1.1 What problem should the platform solve?

I currently run a channel that shares AI and technology news and updates. Finding credible, timely information manually takes too much time because I must monitor multiple sources. This creates a risk of publishing outdated news, inaccurate claims, or stories that have not been sufficiently verified.

The platform should automate the discovery, screening, consolidation, summarization, and organization of credible AI and technology news. It should reduce research time while improving freshness, accuracy, source transparency, and consistency.

### 1.2 Which differentiators matter most?

All three are important:

1. **Consolidated reporting:** Group multiple reports about the same event into one useful story with links to the original sources.
2. **African and Ghanaian visibility:** Include significant credible developments from Ghana and Africa alongside global coverage in one unified feed.
3. **Transparent and trustworthy curation:** Show source links, disclose AI-generated summaries, distinguish claims from verified facts, and maintain correction history.

These differentiators should be reflected in the product's data model, editorial workflow, interface, and acceptance tests.

### 1.3 Rank the product's central purposes

1. News discovery tool.
2. Professional information service.
3. Educational resource through accessible explanations of current developments.
4. Research tool.

The primary purpose is to help readers discover reliable, recent AI and technology developments efficiently. It is not intended to replace original reporting or academic research.

### 1.4 Is this a portfolio, community service, or business?

Initially, this is a personal project and a practical learning opportunity in AI engineering, software development, information retrieval, and product design.

It may become a business in the future. If it gains meaningful readership and becomes a trusted destination for AI and technology updates, potential monetization methods include clearly labelled advertisements and sponsored advertising placements.

Advertising must not influence editorial decisions or allow sponsors to purchase favorable coverage. Sponsored content should be excluded from the editorial news feed unless a separately labelled sponsorship format is explicitly approved in the future.

### 1.5 What should readers see when they open a story?

The homepage should display clickable headlines. Clicking a headline opens an internal story page containing an AI-generated summary, publication details, and a clearly visible link to the original source.

The summary should help readers understand the development without requiring them to read every original article. However, the platform must acknowledge the original publisher prominently and encourage readers to consult the source for full details.

Do not republish full articles or substantial copyrighted passages without appropriate permission.

### 1.6 What does success look like three months after launch?

Success means establishing a credible, usable, and technically stable AI and technology news platform that:

- Regularly discovers fresh and relevant stories from approved global and African sources.
- Publishes accurate summaries with visible source attribution.
- Consolidates duplicate reporting and identifies meaningful follow-up developments.
- Provides a clear, chronological feed and useful search and filtering.
- Can accommodate multiple concurrent readers without major performance problems.
- Has a functioning administration interface for sources, failed jobs, corrections, and publishing.
- Has evidence of reader engagement and repeat visits.

Track source coverage, publication delay, unique stories published, summary accuracy, working source links, returning visitors, and system reliability. Establish numeric visitor and repeat-reader targets after a baseline is available rather than inventing arbitrary success figures.

### 1.7 What makes the MVP successful?

The MVP must be able to:

1. Collect current AI and technology news from a manually approved source list.
2. Filter out irrelevant, duplicated, outdated, and insufficiently supported items.
3. Generate accurate, understandable summaries grounded in source evidence.
4. Display stories in newest-first order by default.
5. Consolidate multiple reports about the same event when appropriate.
6. Link visibly to original reporting and disclose AI-generated summaries.
7. Provide a responsive public website and a usable admin interface.
8. Recover safely from source failures, model errors, and interrupted processing.
9. Prevent unreviewed, malformed, or rejected items from being published accidentally.

### 1.8 What should the platform never be?

It must not be a clickbait website, a generic AI-generated content feed, a rumor aggregator, or a platform that presents unsupported claims as facts.

Reader comments are excluded from the MVP. The platform should prioritize accuracy, clarity, source transparency, relevance, and freshness over engagement tricks or publishing volume.

# ROUND 2: AUDIENCE

### 2.1 Who is the primary audience?

- AI enthusiasts.
- Students.
- Software developers and engineers.
- Researchers.
- Technology professionals.
- Business leaders and entrepreneurs.
- Ghanaian and broader African technology communities.

### 2.2 What is their knowledge level?

The platform should serve beginners, technically literate readers, and experts.

Use plain English by default, while preserving technical accuracy. Explain unfamiliar terms briefly and provide technical details when the story requires them. Do not oversimplify research findings or remove important limitations.

### 2.3 How do readers currently follow news, and why would they return?

Readers may currently use X, Reddit, Hacker News, YouTube, publisher websites, and official company blogs.

They should return because the platform offers:

- Fresh, regularly updated AI and technology news.
- Understandable summaries.
- Consolidated coverage instead of repeated versions of the same story.
- Clear original-source links.
- Useful global coverage alongside African developments.
- A straightforward way to find stories by topic, publisher, date, or region.

### 2.4 Which groups should the product exclude?

Do not deliberately exclude readers based on their technical knowledge or professional background. Make the content accessible to everyone interested in AI and technology.

However, general political, celebrity, entertainment, and other non-technology news should remain outside the platform unless a genuine technology development is central to the story.

### 2.5 Should the public site require accounts?

No. The public site must be account-free for the MVP.

Reader accounts, bookmarks requiring login, personalization, and subscription features are out of scope.

Admin authentication is still mandatory.

### 2.6 Where are the intended readers located?

Ghana is the initial target market, but the website should be designed for global access from the beginning.

Use responsive layouts, efficient pages, accessible controls, and reasonable performance on mobile devices and slower connections. Store timestamps consistently and display publication times clearly, using an appropriate localized presentation.

# ROUND 3: COVERAGE AND TAXONOMY

### 3.1 Which content types are in scope?

**Included:**

- Company announcements and product releases.
- Research papers and significant research findings.
- Funding, mergers, acquisitions, and technology business news.
- Technology policy and regulation.
- Cybersecurity incidents and vulnerabilities.
- Opinion and analysis from credible sources, clearly labelled as such.
- Tutorials and educational articles when they are newly published and relevant developments.
- Job and layoff news related to technology.
- Technology conferences, launches, and other relevant events.

Rumors and leaks are excluded.

### 3.2 What counts as technology news?

A story qualifies when it has a meaningful connection to technological innovation, development, use, security, regulation, or the technology industry.

- Smartphone reviews: included when they provide meaningful technology analysis or report a relevant new product.
- Cryptocurrency: included when the story concerns technology, infrastructure, security, or relevant regulation; exclude speculative investment promotions.
- Gaming: included when it concerns game technology, hardware, platforms, development, or meaningful industry developments.
- Social media controversies: included when they concern platform technology, AI, privacy, security, content moderation systems, or technology policy.
- A technology CEO's personal scandal: excluded unless there is a substantive, verifiable technology-industry consequence.

### 3.3 Should the taxonomy be fixed or dynamic?

Use fixed, editor-controlled top-level categories and AI-generated entity tags.

The AI may suggest company, person, product, model, research institution, and technology tags. It must map topics to the approved category list rather than creating unlimited new top-level categories automatically.

### 3.4 Which categories are required?

Use these initial categories:

1. AI News.
2. Global Tech.
3. Product Releases.
4. African Tech.

Allow additional secondary tags for cybersecurity, research, software development, policy, funding, business, hardware, gaming technology, and other relevant subjects.

Categories may overlap where appropriate. For example, a new AI product from a Ghanaian company could appear under AI News and Product Releases and carry the Africa filter.

Review the taxonomy after observing actual collected content.

### 3.5 How should Ghana and Africa stories appear?

Use one unified chronological feed, not a separate African edition.

Provide filters for Ghana and Africa, and clearly display the relevant regional tags on story cards. Do not bury credible African stories simply because they originate from smaller publishers.

### 3.6 What qualifies as a significant African or Ghanaian story?

Any credible, relevant technology development may qualify, including developments from startups, research institutions, universities, government technology initiatives, established companies, and local technology communities.

Apply the same basic accuracy and relevance requirements globally. Do not require an African story to have international coverage before it can be published.

### 3.7 How should stories be prioritized?

Editorial importance should be evaluated in this order:

1. Novelty.
2. Recency.
3. Source credibility.
4. Usefulness.
5. Impact.
6. Relevance to the platform's audience.

These priorities guide selection and ranking, but they are not a rigid mathematical truth. A high-impact security warning or major policy development may deserve prominence even if it is not the newest item.

The default latest feed should remain chronological. Any separate featured or important-story ranking must be explainable and should not be represented as objective truth merely because an algorithm generated it.

### 3.8 Are evergreen explainers in scope?

The platform is primarily for time-sensitive news.

Newly published educational articles, tutorials, research explainers, and technical guides may be included when they constitute relevant new developments. A static library of evergreen educational articles is not an MVP requirement.

Do not manufacture a news story merely by repackaging old educational material.

### 3.9 Which languages should be supported?

English only for the MVP, both for source selection and published summaries.

Other languages may be considered later.

### 3.10 What should be excluded?

Exclude:

- Rumors and unverified leaks.
- Sponsored posts and advertisements presented as editorial content.
- Straightforward press-release reprints that add no meaningful news value.
- Generic listicles.
- Product deals, discount promotions, and shopping offers.
- Unrelated general news.
- Duplicate stories without meaningful new information.
- Content that cannot be summarized reliably from available evidence.
- Content whose access or use would violate applicable restrictions.

An original company announcement may still be newsworthy. Exclude low-value reprints, not every legitimate primary-source announcement.

# ROUND 4: SOURCES AND ACQUISITION

### 4.1 Which source types are acceptable?

Potential sources include:

- Official AI laboratory and technology company blogs.
- Established technology and general news publishers with relevant technology coverage.
- Research institutions, academic journals, and preprint repositories such as arXiv.
- Government agencies and cybersecurity authorities.
- Official GitHub repositories and release notes.
- Official social media accounts.
- Relevant newsletters where authorized access is available.
- Community sites such as Reddit and Hacker News.

These are source types, not automatic approvals. Each source must be evaluated and configured by the administrator.

### 4.2 What makes a source acceptable?

Evaluate:

- Editorial reputation and accuracy track record.
- Whether the source is the original or primary source.
- Correction and retraction practices.
- Relevance to AI and technology.
- Whether access is permitted.
- Availability and reliability of RSS, Atom, API, or another authorized acquisition method.
- Ability to establish publication dates and retrieve enough information to summarize accurately.

### 4.3 Who controls the source list?

I will curate and configure sources manually. The agent may suggest potential sources for consideration, but it must never automatically approve or add a new source to production.

The administrator may add, edit, disable, and remove sources through the admin interface.

### 4.4 How many sources should launch with the MVP?

Start with approximately 10–25 carefully selected sources, including both global and African sources.

The number can increase or decrease as quality, access permissions, coverage gaps, and operational costs are assessed. Credibility and useful coverage matter more than raw source count.

### 4.5 Which acquisition methods are acceptable?

**Recommended order:**

1. Official APIs.
2. RSS or Atom feeds.
3. Official publisher integrations or other expressly authorized access.
4. Free data providers only when their terms and costs are suitable.
5. HTML scraping only when the publisher's terms, permissions, applicable law, and technical restrictions allow it.

For the MVP, prioritize free, authorized access. Do not assume that a publicly accessible page can legally be scraped, stored, summarized, or republished without restrictions.

Do not bypass paywalls, authentication, rate limits, robots or access restrictions where applicable, or other technical controls. Check actual source terms before implementation and record the permitted access method.

### 4.6 What if only a headline, metadata, and a short excerpt are accessible?

First, seek an authorized alternative source.

If no adequate alternative is available, the item may be used as corroborating evidence for a story when appropriate. A limited entry containing the headline, publisher, date if available, link, and a short description grounded strictly in accessible information may be published if it meets the editorial requirements.

Clearly disclose that the entry is limited and avoid presenting it as a full-source summary. Skip it if there is insufficient evidence to provide a useful, accurate entry.

### 4.7 What happens when a source fails?

Use automatic retries and exponential backoff for transient errors, followed by automatic pausing and administrator alerts when configured failure thresholds are reached.

Use three consecutive technical failures as a provisional initial threshold. Allow this value to be configurable.

Pause the affected source immediately when access is explicitly denied or restricted. Repeated malformed responses should also trigger a pause and investigation. Editorial quality concerns should generally be flagged for review rather than inferred from one unusual article.

Record the error, attempt count, source, timestamp, and final status. Require administrator review before resuming a source that was paused for persistent or access-related problems.

### 4.8 Should stories be capped by publisher?

No publisher-share cap is required for the MVP.

However, the system must consolidate duplicates, measure source diversity, and avoid counting repeated syndicated copies as independent evidence. Source diversity can be monitored without imposing an arbitrary publication quota.

### 4.9 Should sources have trust tiers?

A mandatory numeric or multi-level trust system is not necessary for the MVP.

However, store useful source attributes, including source type, whether it is primary or secondary, its permitted access method, its known limitations, and its terms-of-use record. These attributes can help editorial decisions without pretending that a single trust score guarantees truth.

### 4.10 Are paid news data providers allowed?

The MVP should use free sources and free authorized access methods.

Paid providers are not part of the initial budget. Revisit them only if source coverage or reliability cannot be achieved using permitted free sources and the budget is explicitly approved.

### 4.11 Where should source terms be recorded?

The admin interface must include a source-management record containing, where applicable:

- Source name and canonical domain.
- Source type and access method.
- Feed or API endpoint.
- Terms-of-use URL and review notes.
- Permitted collection and content-use limitations.
- Last terms review date.
- Source status and failure history.

The administrator is responsible for verifying and updating these records. Do not treat an unchecked terms field as proof of permission.

# ROUND 5: AI AGENT WORKFLOW

### 5.1 How often should sources be checked?

Check sources hourly for the MVP.

Use source-specific scheduling and respect publisher rate limits. The architecture should allow different intervals later without requiring a complete redesign.

### 5.2 How quickly should news appear?

The target is under one hour from original publication to appearance on the platform when the source makes the item available and the system can process it reliably.

This is a target, not a guarantee. Monitor publication latency and explain delays through operational metrics. Do not publish unverified information just to meet the target.

### 5.3 What outcomes should the agent support?

Use these explicit workflow states:

- Discovered.
- Pending retrieval.
- Retrieved.
- Processing.
- Rejected.
- Held for additional evidence.
- Awaiting human review.
- Approved for publication.
- Published.
- Updated.
- Retracted or withdrawn.
- Failed or quarantined.

Transitions must be validated in application code. Rejected, failed, or quarantined items must never be published accidentally.

### 5.4 What is the publishing volume target?

Use provisional targets of 100–300 collected articles per day and 10–30 published unique stories per day.

Set a configurable initial maximum of 30 published stories per day. This is a ceiling, not a quota that must be filled.

Do not impose a strict daily collection cap initially, but enforce source-specific rate limits, duplicate prevention, processing limits, and a configurable AI spending budget. Measure collected items separately from published unique stories.

Multiple reports about the same event should be consolidated where appropriate. Publication depends on novelty, relevance, evidence quality, and editorial policy, not on reaching a quota. Validate these targets against actual coverage, costs, and quality.

### 5.5 How should new developments relate to existing stories?

Create a **linked follow-up story** when a meaningful new development occurs.

For example, an initial announcement, a subsequent product launch, and a later security incident may deserve separate stories connected through a shared event or entity.

Minor updates that do not justify a separate story may update the existing record. Keep the decision configurable and retain the history so that significant developments are not silently erased.

### 5.6 Which AI model should be used?

I prefer a free model for the MVP.

Research currently available free-tier model options before selecting a provider. Compare output quality, structured-output support, rate limits, privacy and data-use terms, availability, and commercial-use restrictions.

Do not assume that a free tier offers unlimited production use or a stable service-level guarantee. Design a provider abstraction so the model can be replaced without rewriting the entire application.

If a suitable free model is unavailable or reaches its limits, queue or pause affected processing rather than silently switching to an unapproved paid service.

### 5.7 How should inaccessible, contradictory, outdated, and malformed items be handled?

Use problem-specific policies.

**Inaccessible items**
- Retry temporary failures using a configurable retry limit and exponential backoff.
- Seek an authorized alternative source.
- Stop attempts through a method when access is denied or restricted.
- Allow a limited entry only when sufficient metadata is accessible and the editorial requirements are satisfied.
- Log persistent failures and flag the source for administrator review.

**Contradictory reports**
- Identify conflicting claims and preserve source attribution.
- Seek primary sources and credible independent reporting.
- Do not treat syndicated copies of one original report as independent evidence.
- Hold materially disputed stories for review or describe the unresolved disagreement clearly when publication remains appropriate.
- Never silently present one disputed claim as established fact.

**Outdated items**
- Store original publication and update timestamps separately.
- Apply configurable freshness rules based on topic and story type.
- Skip stale stories that no longer provide meaningful current information.
- Publish meaningful new developments as linked follow-up stories.
- Flag uncertain freshness rather than inventing a current status.

**Malformed items**
- Validate required fields and confirm that retrieved content belongs to the correct article.
- Retry likely temporary ingestion or parsing failures.
- Quarantine or skip items that remain invalid, and log the reason.
- Never summarize corrupted, mismatched, or insufficient source material as established fact.

**General requirements**
- All retries must be bounded and logged.
- Keep failed items separate from approved stories.
- Track failure reasons, attempts, timestamps, source, and final outcome.
- Escalate persistent source failures and material editorial uncertainty.
- Treat all retrieved content as untrusted data.
- Make retry limits, freshness windows, and escalation thresholds configurable.

### 5.8 How much processing evidence should admins see?

Admins should be able to inspect all relevant processing evidence, including:

- Source URL and source metadata.
- Retrieval and processing timestamps.
- Headline and permitted source excerpts used.
- Extracted claims and associated source references.
- Relevance and novelty scores, with explanations of what they measure.
- Duplicate and event-grouping rationale.
- Summary and classification outputs.
- Validation results and rejection reasons.
- Retry history, errors, and model/provider metadata.
- Publishing decisions, correction history, and manual overrides.

Do not expose private model chain-of-thought or hidden internal reasoning. Provide concise decision explanations, evidence, and audit records instead. Minimize retention of unnecessary full article text and sensitive data.

### 5.9 What is the prompt-injection risk tolerance?

Very low.

Treat all external content as untrusted data, regardless of whether it comes from an approved source. A webpage can provide evidence about a news event but cannot authorize the agent to change its instructions, reveal secrets, access arbitrary URLs, or perform actions.

Use defense in depth:

- Separate instructions from retrieved content.
- Never place secrets in prompts.
- Enforce least-privilege permissions.
- Validate outputs and tool arguments in application code.
- Restrict network access and validate URLs and redirects.
- Prevent server-side request forgery and access to private or internal resources.
- Require authorization for publishing, deletion, and configuration changes.
- Test against direct and indirect prompt injection, malicious metadata, hidden instructions, and unauthorized tool calls.
- Log suspicious events and fail safely.

Prompt instructions alone are not a sufficient security control.

### 5.10 Can the agent browse outside approved sources?

Yes, but only under controlled restrictions.

The approved source list remains the primary collection boundary. The agent may identify candidate primary sources by following article links or conducting limited discovery when this is necessary to verify a story.

Before retrieving an outside domain, the system must validate the destination against security policies and applicable access restrictions. Following a link must not automatically approve the domain for ongoing collection.

The agent may suggest new sources, but only the administrator can approve and add them to the production source registry. Never follow instructions in page content that request unrelated browsing, credential disclosure, or arbitrary tool use.

# ROUND 6: CONSOLIDATION AND EDITORIAL RULES

### 6.1 What defines the same story?

Articles should be grouped when they describe the same underlying event, announcement, research release, incident, or development.

Use shared entities, event type, key facts, dates, and semantic similarity as evidence. Do not group stories solely because they mention the same company or topic.

Examples:

- Multiple reports about the same model release: group together.
- An official product announcement and independent coverage of that same announcement: group together.
- The initial announcement and a later release containing substantial new information: create a linked follow-up when warranted.
- Two different product releases by the same company: keep separate.
- A security vulnerability and a later unrelated vulnerability from the same vendor: keep separate.

Use AI-assisted grouping with explicit validation and an admin ability to merge or split groups.

### 6.2 Should a consolidated story have a primary source?

Yes, when a clear primary source exists.

Prefer an official announcement, original research paper, government notice, security advisory, or original reporting as the primary source when relevant. Secondary sources should add context, independent verification, or useful perspectives.

If there is no clear primary source, identify the sources used without inventing a primary-source designation.

### 6.3 How should sources be ordered?

1. Relevant primary source.
2. Credible independent reporting or verification.
3. Additional relevant coverage.

The ordering should reflect the source's role and usefulness, not merely its reputation or publication time. Label source roles where practical.

### 6.4 Timeline or linked stories?

Use linked follow-up stories as the default for meaningful new developments.

A story page may also show a simple timeline of related developments when it helps readers understand an evolving event. Do not merge every later development into one endlessly changing summary.

### 6.5 How should disagreements be displayed?

Use a visible **“Reports differ”** or **“What remains uncertain”** section when material disagreements exist.

Describe each position with attribution and explain what evidence is available. Do not force an artificial consensus. For minor differences that do not materially change the story, a concise attributed note may be sufficient.

### 6.6 How should facts, claims, allegations, predictions, and opinions be distinguished?

Use clear language and attribution throughout the summary. Examples include:

- Confirmed by the official announcement.
- Reported by the publisher.
- Alleged by the named party.
- Predicted by the researcher or company.
- Opinion or analysis.
- Not independently verified.
- Reports differ.

Add a dedicated uncertainty section for stories where the distinction materially affects interpretation.

### 6.7 Should stories have a confidence indicator?

Avoid a single numeric AI confidence score presented as a measure of truth.

Instead, use evidence-based labels when their definitions are satisfied, such as:

- **Primary source available:** An original announcement, document, paper, or official notice is accessible.
- **Independently corroborated:** Multiple genuinely independent sources support the relevant claim.
- **Single-source report:** The claim currently relies on one reporting source.
- **Reports differ:** Material claims conflict.
- **Verification incomplete:** Important evidence is unavailable.

These labels describe the available evidence, not an absolute guarantee of truth. Do not display a label unless the system can explain and verify its criteria.

### 6.8 How should repeated claims be handled?

Track the provenance of claims when practical.

If several outlets repeat a single original report, treat them as a reporting chain rather than multiple independent confirmations. Record the earliest identifiable origin, direct evidence, and later sources that independently verified the claim.

When the original source cannot be established, record the uncertainty instead of assuming independence.

### 6.9 Which stories require human review?

Require human review before publication during the initial launch phase.

Once the system has been evaluated, allow automatic publication only for eligible, low-risk stories that pass all defined checks. Continue requiring human review for:

- Allegations about named people or organizations.
- Material legal or regulatory claims.
- Financial or market-moving claims.
- Serious cybersecurity incidents or vulnerabilities, especially where publication could enable harm.
- Health or safety implications.
- Material contradictions.
- Single-source stories involving high-impact claims.
- Low-quality or uncertain evidence.
- Summaries that fail validation or exhibit suspicious behavior.
- Corrections, retractions, and disputed high-impact updates.

Security vulnerability coverage must be informative without unnecessarily exposing exploit instructions or sensitive operational details.

### 6.10 What happens after a correction or retraction?

Use a combination of actions:

- Detect and record the correction or retraction.
- Flag the affected story for urgent administrator review.
- For a confirmed retraction that invalidates the story, unpublish it or replace it with a clear withdrawal notice as appropriate.
- For a correction, update the summary and show a correction note.
- Keep the earlier version and the reason for the change in the audit history.
- Notify the administrator of significant changes.

Do not silently overwrite a published story or automatically accept an unverified correction claim.

### 6.11 Should correction history be public?

Yes. Public story pages should show a visible correction or update notice when materially relevant, including the date and a concise explanation.

Maintain an internal version history for every material edit. Routine spelling changes need not generate a prominent public correction notice.

# ROUND 7: SUMMARIES AND READER VALUE

### 7.1 What summary format should be used?

Use a layered format:

**Story card**
- Headline.
- Brief two- or three-sentence summary.
- Category and regional tags.
- Publisher and publication time.
- Updated indicator when applicable.

**Full story page**
- What happened.
- Why it matters.
- What remains uncertain, when relevant.
- Sources and links.
- Original publication and update timestamps.
- AI-generated summary disclosure.
- Correction history, when applicable.

Keep summaries concise, informative, and proportional to the evidence.

### 7.2 Should every story use the same template?

Use a consistent overall structure but adapt details to story type.

- Research: question, findings, limitations, and link to the paper.
- Product release: what launched, availability, key capabilities, and disclosed limitations.
- Security: affected systems, verified impact, recommended official guidance where available, and responsible disclosure considerations.
- Policy: what changed, who is affected, and when it takes effect.
- Funding and business: confirmed transaction or announcement, involved parties, and attributed financial details.
- Opinion: identify the author's argument and distinguish it from established facts.
- Educational articles: explain the new resource and its intended audience.

### 7.3 What reading level should be used?

Use plain English that is understandable to beginners while preserving technical precision.

Explain necessary technical terms in context. Keep product names, technical specifications, and research terminology accurate. Avoid unnecessary jargon, exaggerated language, and claims about capabilities not supported by the source.

### 7.4 What level of source referencing is required?

Use claim-level references where practical, particularly for important factual claims, numbers, quotations, allegations, and disputed statements.

At minimum, every story must have a clearly visible source list and link. The system should maintain internal mappings between extracted claims and the source passages supporting them.

If full claim-level citations are too expensive or complex for the first implementation, deliver story-level citations in the initial UI while preserving source evidence and claim provenance internally.

### 7.5 Are direct quotations allowed?

Use direct quotations sparingly.

Prefer paraphrasing. When a short quotation adds real value, verify it against the accessible original source, preserve attribution, and respect copyright and source restrictions. Do not invent quotations or reproduce long passages. If verification is impossible, paraphrase or omit the quotation.

### 7.6 How should “Why it matters” be written?

Ground the explanation in the source material and reliable context.

The AI may explain general background when it can distinguish established background from new claims. It must not invent business impact, technical performance, adoption figures, implications, or predictions.

Use cautious wording when consequences are uncertain. For example, say a development “could affect” a group only when there is a defensible basis, rather than claiming that the effect has already occurred.

### 7.7 How should AI-generated content be disclosed?

Use all three:

1. A clear label on each AI-generated summary.
2. An About or Methodology page explaining the curation process and its limitations.
3. A Corrections Policy explaining how readers can report errors and how corrections are handled.

Do not imply that AI-generated summaries are human-written journalism.

### 7.8 What is the minimum evidence required to publish?

At least one credible source with enough accessible evidence to support the summary is required for ordinary, low-risk news.

Use a primary source where appropriate. For sensitive or high-impact claims, require stronger corroboration or human review. Two articles that repeat the same original claim do not count as two independent confirmations.

If evidence is inadequate, hold, limit, or reject the item. Never fill evidence gaps with fabricated facts or unsupported model knowledge.

### 7.9 How should summaries change when new evidence arrives?

Regenerate or revise summaries when material new evidence arrives, but do not silently overwrite published content.

The system must retain previous versions. Routine low-risk updates may follow an automated, validated workflow once proven reliable. Material corrections, retractions, and sensitive updates require human approval.

Preserve the source evidence and reason associated with each significant version.

### 7.10 Should stories include images?

Images are optional for the MVP and must not block publishing.

Prefer no image over an image with unclear rights. Use publisher thumbnails only when permitted, or images from sources with appropriate licenses or explicit permission. Store image attribution and license information where applicable.

Do not download and republish arbitrary publisher images or assume that a publicly visible image is free to use. Generated images may be considered later but must not be presented as genuine photographs of a news event.

# ROUND 8: WEBSITE AND USER EXPERIENCE

### 8.1 What should the homepage prioritize?

Prioritize:

1. Latest stories in reverse chronological order.
2. Clearly identifiable categories.
3. Ghana and Africa filters.
4. Recently updated stories where useful.
5. A small featured section if the editorial selection is explainable.

The latest feed should be the main experience. Do not allow a ranking algorithm to obscure the chronological feed.

### 8.2 Who chooses featured stories?

Use a combination of administrator selection and an explainable ranking recommendation.

The algorithm may consider novelty, recency, evidence quality, relevance, and impact. The administrator can select or remove featured stories. Do not use unsupported popularity scores or equate the number of reposts with truth.

### 8.3 What belongs on a story card?

Include:

- Headline.
- Short summary.
- Category and entity tags.
- Ghana or Africa tag when relevant.
- Publisher or primary-source attribution.
- Original publication time.
- Updated label when applicable.
- Link to the internal story page.

A source count may be displayed only when it accurately reflects distinct sources. Do not make source count a proxy for truth.

### 8.4 How should lists load?

Use pagination or a “Load more” approach for the MVP. Prefer a crawlable, accessible implementation with stable URLs and appropriate SEO metadata.

Avoid infinite scroll as the only navigation method.

### 8.5 Is dark mode required?

Dark mode is optional for the MVP. Use a clean, readable default theme and accessible contrast. Add dark mode later if it can be implemented without delaying core functionality.

### 8.6 What is the visual direction?

The platform name, logo, and final brand system are not yet confirmed.

Use a modern, professional, editorial design suitable for an AI and technology publication. Avoid a generic AI dashboard appearance, excessive gradients, cluttered cards, and sensational headlines.

Prioritize typography, clear hierarchy, generous readable spacing, visible source links, and mobile usability. Keep branding configurable.

### 8.7 What accessibility target should be used?

Target WCAG 2.2 AA as the design and testing goal.

Support keyboard navigation, semantic HTML, meaningful labels, sufficient color contrast, visible focus states, descriptive link text, screen-reader-friendly controls, and reduced-motion preferences where relevant.

### 8.8 Is SEO required at launch?

Yes.

Include:

- Indexable public story pages.
- Descriptive page titles and meta descriptions.
- Canonical URLs.
- Open Graph and social-sharing metadata.
- XML sitemap.
- Robots directives.
- Structured data only when accurate and appropriate.
- Accessible navigation and internal links.
- Share links or controls.

SEO must not create misleading structured data or duplicate pages for the same story.

### 8.9 Should the site provide an RSS feed?

**Recommended MVP decision: Yes, provide an RSS feed of published stories**, subject to implementation time.

The feed should include headlines, links, publication and update dates, and short summaries. Respect content rights and avoid reproducing full publisher articles.

If the initial development schedule becomes constrained, the RSS output may be moved to the next release without delaying the core news website.

### 8.10 Which static pages are required?

Required for launch:

- About.
- Methodology and AI disclosure.
- Corrections Policy.
- Source List or source methodology page.
- Contact or error-reporting method.
- Privacy Policy.
- Terms of Use.

Legal pages must be reviewed for the actual deployment, data collection, source use, and applicable law. Do not generate boilerplate and assume it is legally sufficient.

### 8.11 What analytics are needed?

Use privacy-conscious traffic analytics if feasible within the free-tier budget.

Measure page views, story engagement, search usage, referral sources, and returning visits with data minimization. Avoid unnecessary personal tracking. Document cookies and other data collection accurately, and implement consent where legally required.

Analytics are not allowed to affect editorial ranking in ways that undermine the platform's trustworthiness.

### 8.12 What performance targets should be used?

Use the following provisional targets:

- Target Core Web Vitals of LCP at or below 2.5 seconds, INP at or below 200 milliseconds, and CLS at or below 0.1 at the 75th percentile when sufficient field data is available.
- Keep story pages lightweight and optimize images.
- Avoid loading large AI libraries or expensive client-side code on public pages.
- Provide clear loading, empty, and error states.
- Cache suitable public content while ensuring that corrections and new stories become visible promptly.

These are performance goals to measure, not guarantees before deployment.

# ROUND 9: SEARCH AND DISCOVERY

### 9.1 What should search match?

Search should match:

- Headlines.
- Summaries.
- Categories and tags.
- Publisher names.
- Company and product names.
- Named entities.
- Accessible stored excerpts where legally permitted.

Do not require storing complete copyrighted articles just to support search.

### 9.2 Which filters are required?

MVP filters:

- Category or topic.
- Date range.
- Publisher.
- Ghana or Africa.
- Story type where useful.

Allow users to combine filters.

### 9.3 How should results be ranked?

Provide relevance-first search with recency as an important factor. Allow a user to sort results by newest where practical.

The default latest-news feed remains chronological. Clearly distinguish search ranking from editorial importance.

### 9.4 What happens when multiple publishers cover the same event?

Show the consolidated story as the main result. Provide links to the individual sources on the story page.

Avoid displaying multiple duplicate results for one event unless they represent distinct, meaningful developments.

### 9.5 How should related stories be determined?

Use shared entities, topics, event groups, and relevant time relationships, with administrator overrides.

Do not treat all stories mentioning the same company as one event. Related-story suggestions should be useful and explainable.

### 9.6 Should the site show trending, popular, or breaking labels?

Do not launch with unsupported AI-generated popularity indicators.

A “Breaking” label may be added later when the system has a defensible definition, such as a verified major development that is both recent and time-sensitive. Any “trending” label should be based on a disclosed measurable method, not invented model judgment.

### 9.7 Should semantic search be implemented?

For the MVP, use basic full-text search, with sensible handling of abbreviations, aliases, and common alternative names where feasible.

Defer advanced semantic search until the core product is reliable. Use normalized entity aliases and searchable metadata before introducing a more complex vector-search system.

### 9.8 What should happen when no results are found?

Show a clear message, suggest checking spelling or broadening the date range, and offer links to major categories or the latest stories.

A topic-request form is not required for the MVP.

# ROUND 10: ADMINISTRATION

### 10.1 Who uses the admin interface?

Initially, I will be the primary administrator.

Build the authorization model so additional reviewers or administrators can be added later. Separate permissions for source management, editorial review, and system administration when practical.

### 10.2 Which admin capabilities are required for MVP?

**Must-have:**

- Add, edit, enable, and disable sources.
- View source permissions and terms records.
- Monitor collection and processing jobs.
- Inspect failures and retry eligible jobs.
- Review held stories.
- Edit headlines, summaries, and tags.
- Merge and split event groups.
- Publish and unpublish stories.
- Inspect source evidence and summary versions.
- View processing history and audit records.
- Pause a source or all publishing.
- View basic system health and AI usage or cost estimates.

Advanced analytics, sophisticated dashboards, and complex multi-user workflows can follow later.

### 10.3 What authentication should admins use?

Use secure admin authentication through a reputable provider or a properly implemented authentication system.

Support strong password policies or secure passwordless login, session expiration, secure cookies, and account recovery protections. Enable multi-factor authentication where supported, particularly before public production use.

Never expose admin endpoints or credentials to unauthenticated visitors.

### 10.4 Should every admin edit be recorded?

Yes. Record who performed an action, what changed, when it happened, and the before-and-after values where appropriate.

Mark materially human-edited stories internally. Show public correction or update notices when changes materially affect the story. Do not expose sensitive admin details publicly.

### 10.5 What happens when an admin manually edits a story?

Manual edits must not be silently overwritten by automated regeneration.

Track which fields were manually changed. If new evidence requires regeneration, create a proposed revision or flag the story for review. Preserve the previous version and require approval before replacing a materially edited summary.

### 10.6 Can admins see rejected articles?

Yes. Admins should be able to inspect rejected, held, and quarantined items with clear rejection reasons.

An administrator may override an editorial rejection only through an authorized action that records the reason and preserves the history. Security, access restrictions, and malformed data must not be bypassed by a casual editorial override.

### 10.7 Is an emergency kill switch required?

Yes.

Provide controls to pause all publishing, pause one source, and pause automatic publishing while allowing safe collection and review to continue where appropriate.

The control must take effect reliably and be recorded in the audit log.

### 10.8 Should deletion be permanent?

Use soft deletion or withdrawal for stories and sources by default so records can be recovered and investigated.

Support permanent deletion only when explicitly required, authorized, and compatible with retention obligations. Preserve necessary audit records without retaining data that must lawfully be erased.

### 10.9 Who handles review queues?

Initially, I will manage the queue. The system must support a practical review workflow with prioritization for sensitive or time-critical items.

A provisional operating assumption is that manual review capacity may be limited to approximately 10–30 items per day. This is not a confirmed commitment. Monitor queue size and age, and pause or restrict automatic publishing if required reviews accumulate beyond safe limits.

# ROUND 11: TECHNICAL AND DATA REQUIREMENTS

### 11.1 Preferred technologies and development approach

I am a Computer Science student building this project as a personal learning and portfolio project. I intend to use AI coding assistants while remaining responsible for understanding, testing, and maintaining the code.

Evaluate a beginner-friendly, maintainable stack. A reasonable starting candidate is:

- Frontend: Next.js with TypeScript.
- Backend API and agent services: Python with FastAPI.
- Database: PostgreSQL, potentially hosted through Supabase.
- Scheduled collection and processing: a background worker and scheduler.
- AI integration: an interchangeable LLM provider adapter with structured outputs.
- Testing: automated unit, integration, and end-to-end tests.
- Deployment: services with free tiers where suitable.

This is a proposed stack, not an irreversible decision. Recommend alternatives only when there is a clear benefit, and explain the cost, complexity, learning value, and operational trade-offs. Do not introduce unnecessary microservices or infrastructure for the MVP.

### 11.2 Expected scale

Initial assumptions:

- 10–25 approved sources.
- 100–300 collected items per day as a provisional target.
- Up to 30 published stories per day under a configurable cap.
- Initially modest public traffic, with no confirmed visitor forecast.
- A design that supports multiple simultaneous visitors and can be scaled as readership grows.

Do not promise a specific concurrency level without load testing. Define measurable targets after hosting and traffic assumptions are known.

### 11.3 Data retention and original article text

Retain published story records, source links, metadata, summaries, event relationships, correction history, and essential audit information for the long term, subject to legal and storage constraints.

Do not default to storing complete original article text indefinitely. Store only the metadata, short permitted excerpts, and extracted evidence necessary for curation and verification.

Apply source-specific retention rules where required. Define retention for temporary processing data, logs, and failed items, and avoid collecting unnecessary personal data.

### 11.4 Which environments are required?

Use three environments where feasible:

1. Local development.
2. Staging or preview.
3. Production.

If free-tier constraints make a permanently running staging service impractical, use deployment previews and controlled test environments. Keep production credentials and data separate from development.

### 11.5 How should failed jobs recover?

Use automatic recovery with bounded retries, exponential backoff, timeouts, and idempotent job processing.

A job should not create duplicate stories or duplicate publications when retried. Flag persistently failed jobs for review.

A provisional operational target is to detect stuck jobs within 15 minutes of their expected completion, subject to the scheduler and hosting capabilities. Configure timeouts by job type.

### 11.6 What happens if the AI provider is unavailable?

Queue eligible work and retry with bounded backoff. Pause AI-dependent publishing when required processing cannot be completed safely.

Design an adapter layer that allows a second provider to be added later, but do not automatically switch to an unapproved provider. A fallback model must pass quality, privacy, structured-output, and cost checks before it is enabled.

The system should continue serving already published stories during an AI outage.

### 11.7 Is a job queue required?

For the MVP, use a simple scheduled worker and persistent job records if they can meet the reliability and workload requirements.

Add a dedicated message broker or more advanced queue only when the workload, concurrency, retry requirements, or hosting limitations justify it. Do not add Redis or other infrastructure merely because it is common in production architectures.

Ensure the design supports retries, idempotency, visibility into job state, and recovery after restarts.

### 11.8 Backup and recovery goals

Use automated database backups when available and test restoration before launch.

Provisional goals:

- Target a recovery point objective of up to 24 hours for ordinary application data, with a preference for more frequent recovery where practical.
- Target a recovery time objective of 24 hours for a serious outage in the initial personal-project phase.
- Keep configuration and deployment instructions in version control without committing secrets.
- Test a backup restoration and document the recovery procedure.

These goals must be reconciled with actual hosting capabilities and the available budget.

### 11.9 How should alerts be delivered?

For the MVP, use a low-cost alert channel such as email if available. Telegram may be considered if a reliable, secure integration is practical.

Alert on:

- Repeated source failures.
- Source pauses or access restrictions.
- Failed or stuck processing jobs.
- AI provider outages or rate limits.
- Publishing pipeline failures.
- Unexpected spending or budget-limit events.
- Review queues that exceed safe thresholds.
- Suspicious security events.
- Failed backups or recovery checks.

Avoid alert fatigue by grouping repetitive alerts and providing actionable context. Do not expose secrets in notifications.

### 11.10 Is a public API required?

No public third-party API is required for the MVP.

Build an internal API for the frontend and admin interface. Keep endpoints and data models organized so a public read-only API can be introduced later if there is a real use case.

### 11.11 Domain and hosting preferences

The final domain and hosting accounts are not yet confirmed.

Recommend free-tier hosting and a domain plan appropriate to the budget. Explain free-tier limits, cold starts, scheduled-job reliability, bandwidth, database capacity, and possible upgrade costs before finalizing the architecture.

No special data-residency requirement has been confirmed. Assess the applicable legal and privacy obligations before choosing providers.

# ROUND 12: SECURITY, LEGAL, AND RESPONSIBLE AI

### 12.1 Applicable jurisdiction

The project is initially intended for Ghanaian readers and is being developed from Ghana. Assess the applicable Ghanaian data protection, copyright, consumer, cybersecurity, and other relevant legal requirements, along with any obligations arising from hosting or serving international users.

Do not provide unsupported assurances of legal compliance. Identify matters requiring qualified professional advice.

### 12.2 Will visitor data be collected?

Collect the minimum necessary data.

The MVP may collect aggregated or privacy-conscious analytics, security logs, and operational metadata. Do not require visitor accounts or collect personal profile information.

If contact functionality is implemented, clearly disclose what information is collected and why. Establish appropriate access, retention, and deletion practices.

### 12.3 What is the takedown policy?

Provide a documented process for receiving and reviewing publisher or rights-holder requests.

Include a contact route and an admin control to temporarily hide a disputed story while a serious request is investigated. Record the request, decision, timestamps, and actions taken.

Respond promptly, preserve necessary audit information, and obtain appropriate advice for complex legal disputes. Do not automatically accept every request without verification, but do not leave credible high-risk complaints unaddressed.

### 12.4 How should allegations about named people or companies be handled?

Require human review before publication of significant allegations.

Use careful attribution, verify the source and relevant evidence, distinguish allegations from established facts, avoid unnecessary repetition of damaging unverified claims, and consider whether publication is justified by genuine public interest.

If the evidence is inadequate, hold or reject the item.

### 12.5 Which sensitive categories require extra caution?

Apply additional safeguards to:

- Active cybersecurity exploits and vulnerability disclosures.
- Leaked personal or confidential data.
- Deepfake abuse and manipulated media.
- Extremist or violent content.
- High-impact allegations.
- Content involving health, safety, or serious financial consequences.

Do not reproduce leaked sensitive data or operational exploit instructions unnecessarily. Focus on verified developments, risk context, and responsible guidance.

### 12.6 How should the platform describe its limitations?

State clearly that AI-generated summaries may contain errors and that readers should consult the linked original sources for full context.

The Methodology page should explain source selection, summarization, story grouping, evidence limitations, corrections, and the role of human review. Provide a way for readers to report factual errors or broken links.

### 12.7 How should secrets and deployment access be managed?

Store API keys and credentials in environment variables or an appropriate secret-management service.

Never commit secrets to version control, embed private keys in frontend code, or place credentials in model prompts. Use separate credentials for development and production, apply least privilege, rotate exposed secrets, and restrict deployment permissions.

### 12.8 Are rate limiting and abuse protection required?

Yes.

Use rate limiting and sensible request limits on public search and other potentially expensive endpoints. Protect admin authentication against brute-force attempts, secure sessions, validate input, and enforce authorization on every privileged operation.

Apply CSRF protections where relevant, secure cookies, dependency updates, and safe error handling. Do not expose internal stack traces or sensitive job data publicly.

### 12.9 Is an incident response plan required?

Yes.

Define procedures for serious factual errors, harmful publications, compromised credentials, prompt-injection incidents, data exposure, and unauthorized changes.

The administrator should be able to pause publishing, unpublish or correct affected stories, revoke compromised credentials, preserve relevant audit evidence, and investigate the cause. Notify affected parties or authorities where required.

Prioritize immediate containment for serious harm, with documented follow-up and preventive fixes.

# ROUND 13: OPERATIONS AND BUDGET

### 13.1 When should development launch?

The launch date is not yet confirmed.

Build incrementally, with a local prototype first, then controlled testing, a soft launch, and public release. Recommend a realistic schedule based on the implementation plan and available weekly time rather than promising an arbitrary deadline.

### 13.2 What is the monthly budget?

The initial preference is **$0 monthly operating cost using free tiers**, where feasible.

This is a strong preference for the MVP, not a guarantee that production-grade availability or every desired capability can be achieved without spending money.

Identify the limitations of each free service, any usage restrictions, and possible costs before recommending it. Avoid paid AI calls, paid content APIs, or paid infrastructure without explicit approval.

### 13.3 What is the acceptable AI cost per story?

The initial target is zero direct model usage cost through an appropriate free tier.

Implement usage tracking and configurable spending limits. If the provider has no direct billing or the system reaches a free-tier limit, pause AI-dependent processing safely rather than incurring unapproved charges.

Estimate cost per collected item and published story even when the MVP uses a free model, so future scaling decisions are evidence-based.

### 13.4 How much manual intervention is acceptable?

The project should minimize routine manual work, but quality and safety take priority over complete automation.

Initially, I can review stories and investigate failures as part of the learning and testing process. Design the system to show a prioritized queue, actionable error messages, and clear evidence so manual review is efficient.

The actual daily review capacity is not yet confirmed and should be measured during the pilot.

### 13.5 What happens when the administrator is unavailable?

The system should fail safely.

If a story requires human approval and nobody is available, keep it queued. If review backlogs exceed a configurable threshold, pause or reduce automatic publishing. Continue serving existing published stories and collecting only where safe.

Do not bypass editorial safeguards because of exams, travel, or an unattended review queue.

### 13.6 How much vendor lock-in is acceptable?

Minimize unnecessary vendor lock-in.

Use standard PostgreSQL where practical, keep the AI provider behind an adapter, store data in portable formats, and document deployment and recovery steps.

Avoid overengineering a provider-neutral architecture if it significantly complicates the MVP. The objective is reasonable portability, not building support for every provider from day one.

### 13.7 What should happen if adoption grows tenfold?

Prioritize in this order:

1. Preserve accuracy, security, and availability.
2. Measure bottlenecks and improve caching, database queries, job processing, and observability.
3. Increase infrastructure budget where necessary.
4. Expand source coverage carefully.
5. Add human reviewers if editorial workload requires them.

Do not increase collection and publishing volume without confirming that quality and operating costs remain manageable.

# ROUND 14: MVP SCOPE AND ACCEPTANCE

### 14.1 Which MVP capabilities are non-negotiable?

Ranked by importance:

1. Reliable collection from approved sources.
2. Source access controls and source registry.
3. Accurate, evidence-grounded AI summaries.
4. Duplicate detection and event consolidation.
5. Public homepage and individual story pages.
6. Clear original-source attribution and AI disclosure.
7. Latest-first feed, basic search, and topic/region filters.
8. Admin controls for sources, review, corrections, and publishing.
9. Job monitoring, retry handling, logging, and safe recovery.
10. Security, responsive design, accessibility, SEO, and deployment readiness.

If time is limited, defer advanced analytics, complex semantic search, dark mode, advanced ranking, generated images, and sophisticated visual dashboards. Do not cut source attribution, basic security, validation, or recovery safeguards.

### 14.2 Is a soft launch acceptable?

Yes. Start with a soft launch in which all stories receive human review before publication.

Enable automatic publication only after the system has passed a representative evaluation set, including difficult and adversarial examples, and demonstrated consistent quality.

A provisional starting requirement is at least 100 evaluated items across different source types and story categories. This is a minimum pilot dataset, not proof of universal accuracy. Include negative examples, duplicate reports, conflicting sources, malformed content, and inaccessible articles.

Begin with a limited, low-risk subset for auto-publishing. Expand only after monitoring confirms that the process remains reliable.

### 14.3 What accuracy standards should apply?

Use the following provisional acceptance targets:

- Fabricated factual claims in the evaluated publication sample: **0 tolerated**.
- Published source links: at least 99% working at evaluation time, with monitoring and a recovery process for subsequent link failures.
- Published stories: 100% have visible source attribution and AI-summary disclosure.
- Duplicate publications of the same event without meaningful new information: target zero in the evaluation set.
- Required metadata and publication-state validation: 100% of published stories pass the application checks.
- Sensitive stories requiring human review: 100% held until approval.
- Prompt-injection tests: no unauthorized action, secret disclosure, or policy override in the defined test suite.

Measure factual accuracy, evidence support, grouping quality, freshness, readability, and rejection quality separately. A system that publishes fewer but well-supported stories is preferable to one that meets a volume target by lowering standards.

These targets must be validated with a defined test set and documented evaluation method. They are acceptance goals, not claims about existing performance.

### 14.4 Who evaluates quality?

Initially, I will evaluate the system with support from peers or relevant subject-matter reviewers where available.

Create a small, versioned evaluation dataset containing real articles, expected relevance decisions, source links, duplicate/event relationships, important factual claims, and known uncertainties.

Keep evaluation examples separate from ordinary production data where practical. Re-run the evaluation set after changes to prompts, models, source extraction, grouping, or publishing rules.

### 14.5 What is excluded from the MVP?

Explicitly out of scope:

- Email subscriptions and newsletters.
- Reader accounts.
- Paid subscriptions.
- Mobile applications.
- Reader comments.
- Social-network features.
- Push notifications.
- Personalized feeds.
- Reader bookmarks requiring accounts.
- Advanced semantic or vector search.
- A public third-party API.
- Automatic approval of new sources.
- Automatic publishing of rumors or unsupported claims.
- Paid news data providers.
- Unlicensed full-article republication.
- An evergreen educational-content library.
- Unrestricted web browsing by the agent.

An RSS feed of the platform's own published stories is recommended for the MVP if it does not delay the core launch.

### 14.6 What must be true before public launch?

Use this launch-readiness checklist:

**Editorial quality**
- [ ] Approved sources have documented access methods and terms.
- [ ] Source attribution is visible on every published story.
- [ ] AI-summary disclosure is present.
- [ ] Summaries are grounded in accessible evidence.
- [ ] Duplicate and follow-up story behavior has been tested.
- [ ] Corrections and retractions have a documented workflow.
- [ ] Sensitive stories are held for human review.
- [ ] The initial evaluation set passes its acceptance criteria.

**Security**
- [ ] Prompt-injection and malicious-content tests have been run.
- [ ] Secrets are not exposed in frontend bundles, prompts, logs, or repositories.
- [ ] Admin routes enforce authentication and authorization.
- [ ] URL validation and protection against SSRF have been tested.
- [ ] Rate limiting and safe error handling are in place.
- [ ] Dependencies and deployment settings have been reviewed.
- [ ] Publishing can be paused immediately.

**Reliability**
- [ ] Collection, retries, and duplicate prevention work.
- [ ] Stuck and failed jobs can be identified.
- [ ] AI-provider outages do not result in fabricated summaries.
- [ ] Database backup and restoration have been tested.
- [ ] Logs and operational alerts are functional.
- [ ] The public site continues serving published stories during processing outages.

**Website and accessibility**
- [ ] Homepage and story pages work on desktop and mobile.
- [ ] Search and required filters work.
- [ ] Loading, empty, and error states are handled.
- [ ] Keyboard navigation and core accessibility checks pass.
- [ ] SEO metadata, canonical URLs, and sitemap are correct.
- [ ] Source links and correction notices are easy to find.

**Legal and operations**
- [ ] About, Methodology, Corrections, Contact, Privacy, and Terms pages are available.
- [ ] Source and image usage has been checked.
- [ ] Data collection and retention practices are documented.
- [ ] Takedown and incident-response procedures are defined.
- [ ] Deployment, rollback, and recovery instructions exist.
- [ ] Free-tier limits and potential charges are understood.
- [ ] The soft-launch monitoring and review process is ready.

Run a controlled pilot before opening the site publicly. A provisional goal is seven consecutive days of stable operation with no unresolved critical security issues or known fabricated factual claims in published stories. Any serious incident resets the relevant evaluation and requires investigation before wider release.

# FINAL PRODUCT PRINCIPLES

1. Accuracy is more important than publishing volume.
2. Freshness matters, but not at the expense of verification.
3. Source attribution must be prominent and useful.
4. The AI summarizes and organizes evidence; it does not create facts.
5. Multiple reports are not automatically independent confirmation.
6. African and Ghanaian technology developments belong in the unified global feed.
7. External content is untrusted data, never a source of system authority.
8. Editorial decisions, corrections, and material changes must be traceable.
9. Automated workflows must be bounded, observable, recoverable, and safe.
10. The MVP should remain small enough for one student developer to understand, test, deploy, and maintain.

# WHAT I WANT YOU TO DO NEXT

Using this requirements baseline:

1. Identify contradictions, missing decisions, and assumptions that could materially change the design.
2. Separate confirmed requirements from provisional recommendations and unresolved questions.
3. Recommend the smallest practical MVP architecture that meets these requirements.
4. Explain the chosen technology stack, database, source collection, AI workflow, scheduling, hosting, and security controls in beginner-friendly language.
5. Produce the PRD, architecture and data-flow diagrams, database schema, API plan, sitemap, UI/UX plan, QA strategy, implementation roadmap, and learning roadmap.
6. Research current provider capabilities, free-tier limitations, source access methods, and relevant licensing considerations before making time-sensitive technical recommendations.
7. Explain major decisions using what the component is, why it is needed, how it works, alternatives, trade-offs, and how it fits into this project.
8. Avoid premature coding, unnecessary complexity, unverified legal claims, and paid services without approval.

The goal is not to build the most complicated system. It is to build a trustworthy, maintainable AI news curation platform that works reliably, can be understood by its developer, and can grow when the evidence justifies it.