# Enterprise and mid-market vendors that stop sensitive data reaching GenAI chat tools (as of November 2026)

Research date: 2026-11-08. Web research only. "Vendor claim" = vendor marketing, not independently verified. Competitor blogs (dope.security, jazz.security, Nightfall, Strac, PiiBlock, RedactSure, Aona, DeepInspect, anonym.legal) are cited only where no primary source turned up, and are flagged. Many vendor pages carry no date; for those, "accessed 2026-11-08" applies.

Vendors covered: Nightfall AI, Harmonic Security, Prompt Security (SentinelOne), Lakera (Check Point), LayerX (Akamai), Strac, Microsoft Purview / Edge for Business, Google Chrome Enterprise Premium / Google SDP, Cloudflare, Zscaler, Netskope, Palo Alto Networks, Cyberhaven, Island, Menlo Security. Also found: small SMB/consumer extensions (Caviard, PiiBlocker, PrivacyScrubber) and Norwegian "private AI" vendors (PrivatAI, Bineric/Norsk AI, Kigent).

---

## 1. Who they target (company size, industries), minimum seats / contract size

### Takeaway
Every named vendor sells to enterprises or the upper mid-market through sales-led annual contracts. None publishes a self-serve plan for a 5–50 person clinic or law firm. The exceptions with low-friction entry points are Cloudflare (free Zero Trust up to 50 users), Google (Chrome Enterprise Premium at a list price of $6/user/month) and Microsoft (a Purview add-on for Business Premium, at up to 300 seats).

### Cited Findings
- **Nightfall AI:** the pricing page describes typical buyers as 250 to 100,000+ users. Sales "confirm user minimums". No self-serve trial; the free option is a 7-day proof of value with Nightfall staff (accessed 2026-11-08). — [Nightfall pricing](https://www.nightfall.ai/pricing)
- **Nightfall AI:** Vendr estimates small deployments start at about $5,000–$15,000 a year (estimate, not vendor-published). — [Vendr Nightfall](https://www.vendr.com/marketplace/nightfall)
- **Strac:** pitched at "nearly all enterprises" whose staff use third-party AI. Highlighted industries: healthcare and life sciences, financial services, tech/SaaS, legal and professional services. Pricing language says "typical mid-market deployment" (accessed 2026-11-08). — [Strac AI Governance](https://www.strac.io/ai-governance)
- **Harmonic Security:** reports 100+ enterprise customers covering "millions of employees" (Oct 2026). Has solution pages for regulated industries and insurance. — [Unite.ai, Oct 2026](https://www.unite.ai/harmonic-security-raises-50m-series-b-to-expand-us-and-uk-teams/); [Harmonic regulated industries](https://www.harmonic.security/solutions/genai-compliance-regulated-industries)
- **Menlo Security:** targets hybrid workforces (BYOD users, contractors, M&A users) and compliance/GRC/security teams. The example customer is SUMA Federal Credit Union (accessed 2026-11-08). — [Menlo AI Adaptive DLP](https://www.menlosecurity.com/product/ai-adaptive-dlp)
- **Island:** sold as custom, per-organisation pricing on annual contracts through sales (third-party directory, unconfirmed). — [ethicalhacking.ai Island pricing](https://ethicalhacking.ai/pricing/island-browser-pricing)
- **Netskope:** 1-year standard minimum commitment, 3-year available, auto-renewing (third-party). — [dope.security Netskope pricing 2026 (competitor)](https://dope.security/post/netskope-pricing-2026)
- **Netskope and Zscaler:** no verified universal SMB seat minimum. — [UnderDefense Netskope guide, Jun 2026](https://underdefense.com/blog/netskope-pricing-guide/)
- **Microsoft:** the Purview Suite add-on for Business Premium is reported at $10/user/month "for up to 300 seats" (Business Premium itself is capped at 300 users). — [Minerva license matrix](https://blog.minerva-ia.com/en/blog/m0vaya6g); [dope.security Purview pricing 2026 (competitor)](https://dope.security/post/microsoft-purview-pricing-2026)
- **Cloudflare:** offers "50 free seats to begin securely using Gen AI immediately". — [Cloudflare blog](https://blog.cloudflare.com/zero-trust-ai-security/)
- **Cloudflare:** a third-party review says users beyond 50 active seats are blocked until the account upgrades (unverified). — [zerometric review](https://zerometric.net/review/cloudflare-zero-trust/)
- **LayerX:** expected 2026 ARR of about $10M at acquisition, so a small customer base relative to the SASE vendors. — [SecurityWeek, May 2026](https://www.securityweek.com/akamai-to-acquire-ai-and-browser-security-firm-layerx-for-205-million/)

### Inferences
- The realistic "competitor a small Norwegian clinic could buy today" set is short: Microsoft (if already on M365 Business Premium), Google Chrome Enterprise Premium (if on Chrome), Cloudflare's free tier (needs IT skills to set up a Zero Trust gateway and certificates), and Strac (sales call, but low per-user benchmark). Nightfall, Harmonic, Prompt/SentinelOne, LayerX/Akamai, Island, Menlo, Zscaler, Netskope and Palo Alto all assume a security team and a procurement process.
- Consolidation (Prompt to SentinelOne, Lakera to Check Point, LayerX to Akamai) pushes these products further up-market into platform bundles.

### Gaps
- No vendor publishes a hard minimum seat count. Nightfall says "confirm with sales".
- No information found on minimum contract value for Harmonic, Prompt Security/SentinelOne, LayerX, Cyberhaven or Palo Alto.

---

## 2. How it works: browser extension, proxy/SASE, endpoint agent, API; cloud vs local inspection

### Takeaway
Three architectures dominate:
- **Browser extension.** Used by Strac, Harmonic, Prompt Security, LayerX and Nightfall (alongside an endpoint agent), and by Menlo for browser DLP.
- **Network proxy / SASE with TLS inspection.** Zscaler, Netskope, Palo Alto Prisma Access, Cloudflare Gateway.
- **Managed browser.** Island, Chrome Enterprise Premium, Prisma Browser, Edge for Business with Purview.

Only Strac and Harmonic explicitly claim detection runs locally on the device. The SASE and Menlo approaches inspect in the vendor cloud.

### Cited Findings
- **Nightfall:** endpoint agent plus browser coverage of AI apps such as ChatGPT and Gemini. Each user licence covers 2 endpoint devices. Premier adds hooks for Cursor, Claude Code and VS Code, MCP discovery, and the Claude Compliance API. Deploys via Jamf or Intune. Inspection is "in-tenant where deployment supports it" (accessed 2026-11-08). — [Nightfall pricing](https://www.nightfall.ai/pricing)
- **Strac:** browser extension for Chrome, Edge, Firefox and Safari. Vendor says "detection runs locally in the browser". It also has an MDM-deployed endpoint agent for local AI apps and MCP servers, and OAuth SaaS integrations. Vendor says "Strac does not intercept TLS" and needs no proxy (accessed 2026-11-08). — [Strac AI Governance](https://www.strac.io/ai-governance)
- **Strac limitation:** the browser extension cannot see the ChatGPT or Claude desktop apps (third-party/competitor review). — [jazz.security (competitor)](https://jazz.security/dlp-explained/dlp-basics/is-strac-worth-it/)
- **Harmonic, detection:** small language models classify prompts in under 200 ms. The vendor says inline models "sit on the endpoint to detect and redact sensitive data before it can be submitted". — [Harmonic regulated industries](https://www.harmonic.security/solutions/genai-compliance-regulated-industries); [Harmonic Guide](https://www.harmonic.security/products/guide)
- **Harmonic, deployment:** the Guide page does not say whether detection runs locally or in the cloud. A browser extension covers supported browsers; an MCP Gateway runs on Windows, macOS and Linux; rollout via Intune, Jamf, Kandji or Group Policy. Coverage includes ChatGPT Desktop, Claude CoWork, Cursor, Codex CLI and OpenAI API calls. — [Harmonic Guide](https://www.harmonic.security/products/guide)
- **Prompt Security (SentinelOne):** browser extension plus a lightweight agent, covering browser, desktop and code-assistant use. Vendor claims 15,000+ AI sites. No evidence of an on-prem option; SentinelOne's DPA offers a choice of cloud hosting regions (third-party reviews). — [AppSecSanta](https://appsecsanta.com/prompt-security); [Aona comparison (competitor)](https://aona.ai/resources/comparisons/aona-vs-prompt-security/)
- **Lakera (Check Point):** Lakera Guard is an API-based runtime guardrail for developers building LLM apps. It is now branded Check Point AI Guardrails, inside a "Check Point AI Defense Plane" with Workforce AI Security, AI Agent Security, AI Guardrails and AI Red Teaming (aggregator sources, mid-2026). — [markaicode Lakera pricing](https://markaicode.com/pricing/lakera-pricing/); [costbench Lakera Guard](https://costbench.com/software/ai-security/lakera-guard/)
- **LayerX:** an "enterprise browser extension" for Chrome, Edge, Firefox and Safari covering GenAI DLP and web/SaaS DLP. — [Yahoo Finance / press release, Apr 2025](https://finance.yahoo.com/news/layerx-security-extends-series-funding-120000252.html)
- **Microsoft Purview, Edge:** inline DLP in Edge for Business blocks typed prompts with sensitive data in consumer ChatGPT, Gemini, DeepSeek, consumer Copilot and others. It applies to Edge for Business on Intune-managed Windows 10/11 devices. — [Microsoft Learn – block sensitive data to AI apps](https://learn.microsoft.com/en-us/purview/deploymentmodels/depmod-data-leak-shadow-ai-step3)
- **Microsoft Purview, coverage list:** reported at 19 curated AI apps, with Claude not on the list (third-party). — [jazz.security (competitor)](https://jazz.security/dlp-explained/dlp-basics/is-microsoft-purview-dlp-enough/)
- **Microsoft Purview, Endpoint DLP:** it does not see typed text, only clipboard or file events, so Edge inline is needed for typed prompts (third-party). — [same](https://jazz.security/dlp-explained/dlp-basics/is-microsoft-purview-dlp-enough/)
- **Microsoft Purview, file uploads:** inline DLP for file uploads to unmanaged GenAI apps in Edge reportedly reached GA in January 2026 (Roadmap 518642). — [handsontek](https://m365admin.handsontek.net/microsoft-purview-data-loss-prevention-new-inline-protection-controls-ai-apps-microsoft-edge-business/)
- **Google Chrome Enterprise Premium:** real-time DLP in managed Chrome blocks pasting sensitive data into prompts and enforces URL controls on unsanctioned AI sites. — [Chrome Enterprise Premium](https://chromeenterprise.google/products/chrome-enterprise-premium/)
- **Google Chrome Enterprise Premium, limits:** it works only in managed Chrome, with no visibility into other browsers or desktop apps (third-party). — [jazz.security (competitor)](https://jazz.security/dlp-explained/dlp-basics/is-google-workspace-dlp-enough/)
- **Cloudflare:** Gateway (forward proxy) DLP natively detects prompts to Gemini, ChatGPT, Claude and Perplexity, with AI-prompt topic classification (changelog 2025-08-25, possibly outdated). — [Cloudflare changelog](https://developers.cloudflare.com/changelog/post/2025-08-25-ai-prompt-protection/)
- **Cloudflare, conflicting source:** a 2026 CASB (API) post says DLP flags sensitive data in ChatGPT, Claude and Gemini chat attachments, with "prompts coming soon" for that API-based path. — [Cloudflare blog CASB AI integrations](https://blog.cloudflare.com/casb-ai-integrations/)
- **Cloudflare AI Gateway:** a developer-side gateway whose DLP scanning is free on all plans, with only 2 predefined profiles without a Zero Trust subscription. — [AI Gateway pricing docs](https://developers.cloudflare.com/ai-gateway/reference/pricing/)
- **Zscaler:** cloud proxy (ZIA) with prompt visibility and classification, inline DLP (100+ predefined dictionaries), and browser isolation that can disable copy/paste, upload, download and print for AI apps. — [Zscaler GenAI security datasheet](https://www.zscaler.com/resources/data-sheets/zscaler-gen-ai-security-at-a-glance.pdf)
- **Zscaler, TLS requirement:** blocking requires ChatGPT traffic to be SSL-inspected (third-party). — [jazz.security (competitor)](https://jazz.security/dlp-explained/dlp-basics/is-zscaler-dlp-enough/)
- **Netskope:** "real-time inline inspection for data flowing into and out of applications like ChatGPT" via its SSE proxy. — [Netskope DLP](https://www.netskope.com/products/data-loss-prevention)
- **Palo Alto Networks:** AI Access Security on Prisma Access (SASE) does inline DLP on AI prompts. Prisma Browser is a managed enterprise browser with "AI-powered DLP with over 1,000 classifiers" (vendor claim). The August 2026 release added GenAI prompt logging for ChatGPT, Claude, Gemini and Perplexity into Strata Logging Service. — [PANW AI Access Security Aug 2026](https://docs.paloaltonetworks.com/ai-access-security/new-features/by-date/ai-access-security/august-2026); [Prisma Browser](https://www.paloaltonetworks.com/sase/prisma-browser)
- **Palo Alto Networks, March 2026:** Prisma Browser update for agentic AI. — [PANW press release 2026](https://www.paloaltonetworks.com/company/press/2026/palo-alto-networks-unveils-the-industry-s-most-secure-browser-built-for-agentic-ai)
- **Island:** a replacement Chromium-based enterprise browser with last-mile controls (copy/paste, upload, download, screenshot, data redaction). AI Protect launched in March 2026 as part of an Enterprise AI suite (AI Protect, AI Browser, AI Automation, AI Publish), with the platform extending "to any browser". — [SecurityWeek Mar 2025](https://www.securityweek.com/island-banks-250m-series-e-for-enterprise-browser/); [BusinessWire Mar 2026](https://www.businesswire.com/news/home/20260317531077/en/)
- **Menlo Security, AI Adaptive DLP:** cloud-delivered; files go to the Menlo Cloud for detection and masking, and the page stresses no heavyweight endpoint agent (accessed 2026-11-08). — [Menlo AI Adaptive DLP](https://www.menlosecurity.com/product/ai-adaptive-dlp)
- **Menlo Security, extension:** a Menlo-authored source says AI Adaptive DLP works at the DOM level as a browser extension across managed, unmanaged and BYOD endpoints. This conflicts with the product page's cloud-only framing; it is likely an extension plus cloud inspection. — [Menlo blog Apr 2026](https://www.menlosecurity.com/blog/dlp-that-doesnt-make-you-choose-introducing-menlo-ai-adaptive-dlp)
- **Cyberhaven:** "Unified AI & Data Security Platform" GA in February 2026, combining DSPM, DLP, insider risk and AI security. — [Cyberhaven FY2026 press release](https://www.cyberhaven.com/press-releases/cyberhaven-announces-record-year-of-growth-as-enterprises-race-to-secure-ai-and-data)

### Inferences
- "Local inspection" claims are rare and only partly backed. Strac says detection runs in the browser, and Harmonic says SLMs run on the endpoint. Even so, both ship events, dashboards and admin consoles to their cloud. No vendor found markets "nothing leaves the machine" as Ghost Agent does.
- Proxy/SASE vendors need TLS interception, certificate deployment and traffic steering. That is impractical for a 10-person clinic without IT.
- Managed-browser approaches (Island, Chrome Enterprise Premium, Prisma Browser, Edge for Business) require device management (Intune or Chrome management) and forcing staff onto one browser.

### Gaps
- Could not confirm where Harmonic's SLM inference physically runs: the Guide page is silent, and the regulated-industries page says "on the endpoint".
- No primary technical docs found for Cyberhaven's GenAI capture mechanism (endpoint agent vs extension), so it is not described here.
- Could not confirm whether Cloudflare's free plan includes the AI prompt DLP profiles.

---

## 3. Actions: redact/placeholder, block, warn, log; can the user send a de-identified version?

### Takeaway
Block, warn/coach and log are universal. Inline redaction or masking, where the user still sends a cleaned prompt, is claimed by Prompt Security, Harmonic (regulated-industries page), Strac (redacted preview in warn mode; placeholders for MCP), Menlo (masking files), Island (redaction) and Netskope (newer masking option, practitioner source). None of the sources describes numbered, reversible placeholders like [PERSON_1], or local LLM rephrasing.

### Cited Findings
- **Strac:** three modes. Block the prompt; warn the user with a redacted preview ("Warn & Allow"); or audit silently. For MCP responses it replaces values such as medical record numbers with placeholders. It also offers OCR redaction of images and documents (accessed 2026-11-08). — [Strac AI Governance](https://www.strac.io/ai-governance)
- **Strac, fake-data swap:** a third-party roundup says Strac can "redact, mask, swap in fake data, block or alert" on AI prompts. — [Elephas PII redaction tools](https://elephas.app/resources/best-pii-redaction-tools)
- **Harmonic, Guide page:** enforcement options are silent logging, contextual warnings, employee coaching and real-time blocking. Redaction is not mentioned there. — [Harmonic Guide](https://www.harmonic.security/products/guide)
- **Harmonic, regulated-industries page:** says SLMs "detect and redact sensitive data before it can be submitted". A third-party summary lists allow, warn, redact and block. — [Harmonic regulated industries](https://www.harmonic.security/solutions/genai-compliance-regulated-industries)
- **Prompt Security:** blocks policy-violating prompts in real time, redacts sensitive data before it reaches the LLM, and coaches employees. — [AppSecSanta](https://appsecsanta.com/prompt-security); [Nightfall review of Prompt (competitor)](https://www.nightfall.ai/blog/prompt-security-reviews)
- **Prompt Security, redaction side effect:** redacting a key inside a signed AWS Bedrock request caused Bedrock to reject it (third-party). — [AppSecSanta](https://appsecsanta.com/prompt-security)
- **Nightfall:** browser and endpoint agents can block sensitive content in prompts and file uploads to ChatGPT, Copilot, Gemini and Claude. — [rfp.wiki Nightfall](https://www.rfp.wiki/it-security/data-loss-prevention/nightfall); [Nightfall pricing](https://www.nightfall.ai/pricing)
- **Menlo:** masks sensitive data in files in real time and delivers the masked file; can block only the sensitive content; can keep originals in Menlo cloud; can detect-and-report only. — [Menlo AI Adaptive DLP](https://www.menlosecurity.com/product/ai-adaptive-dlp)
- **Menlo, prompts:** the April 2026 blog describes masking sensitive data before it reaches external AI services. — [Menlo blog Apr 2026](https://www.menlosecurity.com/blog/dlp-that-doesnt-make-you-choose-introducing-menlo-ai-adaptive-dlp)
- **Island:** "data redaction" among last-mile controls; Island's 2026 AI page says it redacts sensitive data before it reaches an AI provider. — [SecurityWeek Mar 2025](https://www.securityweek.com/island-banks-250m-series-e-for-enterprise-browser/); [RedactSure comparison (competitor)](https://redactsure.com/research/what-is-the-difference-between-redactsure-and-island-enterprise-browser-for-ai-agent-security/)
- **Island, no persistent tokens:** per a competitor, Island's page does not describe replacing values with persistent tokens. — [RedactSure (competitor)](https://redactsure.com/research/what-is-the-difference-between-redactsure-and-island-enterprise-browser-for-ai-agent-security/)
- **Netskope, coaching:** coaching tells users an app is not approved for sensitive data but lets them decide. Netskope's 2025 report says users proceed only 27% of the time after a coaching prompt (73% stop), and coaching is used by 34% of organisations. — [Netskope Cloud and Threat Report GenAI 2025](https://www.netskope.com/resources/cloud-and-threat-reports/cloud-and-threat-report-generative-ai-2025)
- **Netskope, masking:** a practitioner source describes a newer redaction option where secrets are masked and the rest of the prompt continues to the model. — [Netskope community](https://community.netskope.com/inside-netskope-22/securing-saas-and-genai-without-saying-no-8705)
- **Palo Alto:** inline DLP on Prisma Access prevents pasting sensitive data into AI prompts, logs an incident and shows a coaching message. — [PANW LIVEcommunity](https://live.paloaltonetworks.com/t5/community-blogs/securing-the-gen-ai-revolution-remote-browser-isolation-and-dlp/ba-p/1255800)
- **Zscaler:** block via Cloud App Control or DLP rules; isolation disables copy/paste and upload. — [Zscaler datasheet](https://www.zscaler.com/resources/data-sheets/zscaler-gen-ai-security-at-a-glance.pdf)
- **Microsoft Purview, Edge:** blocks typed prompts containing sensitive data in listed AI apps; DLP policies support block or block-with-override. — [Microsoft Learn](https://learn.microsoft.com/en-us/purview/deploymentmodels/depmod-data-leak-shadow-ai-step3)
- **Google Chrome Enterprise Premium:** admins can block, warn or apply DLP rules on sites Google classifies as GenAI. — [Push Security / review](https://pushsecurity.com/blog/island-browser-alternatives-and-competitors); [Chrome Enterprise Premium](https://chromeenterprise.google/products/chrome-enterprise-premium/)
- **Cloudflare:** Gateway policies block prompts that match DLP or AI topic profiles. — [Cloudflare changelog 2025-08-25](https://developers.cloudflare.com/changelog/post/2025-08-25-ai-prompt-protection/)

### Inferences
- The SASE vendors (Zscaler, Palo Alto, Cloudflare) and the managed-browser options (Microsoft Edge, Google Chrome) mainly block, warn or coach. The user must rewrite the prompt themselves.
- Redaction exists at Strac, Prompt Security, Harmonic, Menlo and Island. Their output appears to be masked or removed values rather than consistent, numbered entity placeholders that keep the prompt meaningful.
- None offers local-LLM rephrasing. Ghost Agent's "hide / rephrase / ignore" set is a real differentiator in end-user UX.

### Gaps
- No source showed the exact redaction token format for Prompt Security, Harmonic, Strac (prompt mode) or Island, e.g. "[REDACTED]", "****" or typed placeholders.
- No source confirmed whether any vendor restores original values in the AI's response (re-identification).

---

## 4. Pricing: public list prices, "contact sales", free tiers

### Takeaway
Only Google ($6/user/month for Chrome Enterprise Premium) and Microsoft (Purview add-ons around $10–12/user/month, plus pay-as-you-go meters for Edge inline DLP) publish list prices. Strac publishes a benchmark of $30–50 per user per year. Cloudflare has a free tier up to 50 users. Everyone else is "contact sales". Third-party estimates put SASE bundles at roughly $60–200 per user per year.

### Cited Findings
- **Nightfall:** Foundation and Premier editions, priced per user per year with amounts not shown. "Final pricing depends on user count and data volume." 150 GB data-at-rest scanning included. Free 7-day proof of value, no free tier (accessed 2026-11-08). — [Nightfall pricing](https://www.nightfall.ai/pricing)
- **Nightfall, review-site prices:** Capterra lists "$4 per feature per month", which looks like a placeholder. — [Capterra Nightfall](https://www.capterra.com/p/211481/Nightfall-DLP/)
- **Nightfall, Vendr estimate:** $5k–$15k a year for small deployments (estimate). — [Vendr](https://www.vendr.com/marketplace/nightfall)
- **Strac:** per-user pricing by module (SaaS, Cloud, GenAI, Endpoint). "A typical mid-market deployment with GenAI + SaaS DLP starts around $30–50 per user per year, with volume discounts." Quote via a 15-minute call; no free trial mentioned (accessed 2026-11-08). — [Strac AI Governance](https://www.strac.io/ai-governance)
- **Harmonic:** the pricing page reportedly lists three tiers, Explore, Guide and Command, with no public prices (competitor source, unverified). No seat price was disclosed at the Series B. — [jazz.security (competitor)](https://jazz.security/dlp-explained/dlp-basics/harmonic-security-alternative-beyond-ai-tools/); [cybermerge](https://cybermerge.com/stories/harmonic-security-50m-series-b-ai-usage-governance)
- **Prompt Security / SentinelOne:** no public pricing found.
- **Lakera Guard (Check Point):** a Community plan at $0 with about 10,000 API requests a month is reported by aggregators; paid tiers are quote-based. A "$99/mo Pro" figure appears on one aggregator but conflicts with others (unreliable). — [markaicode](https://markaicode.com/pricing/lakera-pricing/); [costbench](https://costbench.com/software/ai-security/lakera-guard/)
- **LayerX:** no public list price. The AWS Marketplace listing is contract-based. — [AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-ar7ygkx43u27a)
- **Microsoft, Business Premium:** includes DLP for Exchange, SharePoint and OneDrive, but not Endpoint DLP. Endpoint DLP needs E5, the E5 IP&G add-on or a Purview Suite. — [Sourcepass](https://blog.sourcepass.com/sourcepass-blog/purview-licensing-for-m365-e3-and-business-premium-sourcepass-mcoe); [itsorted SME guide](https://itsorted.online/guides/dlp-for-ai-tools-microsoft-purview)
- **Microsoft, add-on prices:** Purview Suite add-on for Business Premium reported at $10/user/month since 1 Feb 2026 (up to 300 seats). Standard Purview Suite (formerly M365 E5 Compliance) about $12/user/month on E3. M365 E5 at $60/user/month. — [dope.security Purview pricing 2026 (competitor)](https://dope.security/post/microsoft-purview-pricing-2026); [Minerva](https://blog.minerva-ia.com/en/blog/m0vaya6g)
- **Microsoft, Edge inline DLP billing:** inline protection of typed text in Edge for Business moved to paid preview on pay-as-you-go via the "In Transit Protection" meter from 31 Oct 2025. The meter counts requests from Edge to unmanaged cloud or GenAI apps. — [Microsoft Learn – Purview billing models](https://learn.microsoft.com/sv-se/purview/purview-billing-models); [MC1154787](https://mc.merill.net/message/MC1154787)
- **Microsoft, PAYG meter example:** audit for non-Microsoft AI apps at $15 per 1M audit records (third-party summary). — [toolradar/third-party](https://toolradar.com/tools/microsoft-purview)
- **Microsoft, Business Premium Edge restriction:** one source says Edge DLP for unmanaged cloud apps is not available on Business Premium and is PAYG with Purview Suite or E5. — [dope.security (competitor)](https://dope.security/post/microsoft-purview-pricing-2026)
- **Microsoft, unconfirmed change:** a dope.security claim that a September 2026 Message Center note removed the PAYG requirement is unconfirmed. — [same](https://dope.security/post/microsoft-purview-pricing-2026)
- **Google:** Chrome Enterprise Premium is $6/user/month. Chrome Enterprise Core (management) is free. Premium is not included in any Workspace edition. — [Chrome Enterprise download page](https://chromeenterprise.google/download/); [jazz.security (competitor)](https://jazz.security/dlp-explained/dlp-basics/is-google-workspace-dlp-enough/)
- **Cloudflare:** Zero Trust is free for up to 50 seats, with limited predefined DLP profiles on the free plan (third-party). AI Gateway DLP is free on all plans (2 predefined profiles without Zero Trust). — [Cloudflare blog](https://blog.cloudflare.com/zero-trust-ai-security/); [zerometric](https://zerometric.net/review/cloudflare-zero-trust/); [AI Gateway pricing](https://developers.cloudflare.com/ai-gateway/reference/pricing/)
- **Zscaler:** no public price. A third-party estimate for ZIA is about $80–200/user/year. Vendr data shows a median of $60k a year at 25 seats (small sample). GenAI prompt capture, classification and isolation sit in a Data Protection "Gen AI" pack above Essentials. — [dope.security Zscaler pricing 2026 (competitor)](https://dope.security/post/zscaler-pricing-2026); [costbench Netskope vs Zscaler](https://www.costbench.com/compare/netskope-vs-zscaler/); [jazz.security (competitor)](https://jazz.security/dlp-explained/dlp-basics/is-zscaler-dlp-enough/)
- **Netskope, estimates:** no public price. Third-party estimates: about $4–8/user/month base (SWG+CASB); $9–14 with ZTNA and basic DLP; $15+ for the full platform with AI controls. — [dope.security (competitor)](https://dope.security/post/netskope-pricing-2026)
- **Netskope, Vendr data:** Max Advantage at a median of $50–98/user/year; about $39k a year for 500 seats. — [UnderDefense Jun 2026](https://underdefense.com/blog/netskope-pricing-guide/)
- **Palo Alto Networks:** no public price found. Without an Enterprise DLP licence, Prisma Browser DLP is reportedly read-only (regex and OCR only) (competitor). — [dope.security (competitor)](https://dope.security/post/palo-alto-dlp-2026)
- **Island, Menlo, Cyberhaven:** no public pricing found. Island is custom per organisation. — [ethicalhacking.ai](https://ethicalhacking.ai/pricing/island-browser-pricing)
- **SMB/consumer extensions:**
  - Caviard: free plan (10 protected values per document) plus a one-time lifetime licence per device. — [PiiBlock blog (competitor)](https://www.piiblock.com/blog/best-pii-masking-chrome-extensions-ai-chatbots)
  - PiiBlocker: enterprise tier at $6.99/seat/month with GPO/MDM deployment. — [same](https://www.piiblock.com/blog/best-pii-masking-chrome-extensions-ai-chatbots)
  - PrivacyScrubber: flat $99/month for unlimited seats. — [PrivacyScrubber comparison (vendor)](https://privacyscrubber.com/solutions/comparison/top-ai-privacy-tools/)

### Inferences
- For a 20-person Norwegian clinic, rough annual costs:

  | Option | Approx. per year | Basis |
  |---|---|---|
  | Chrome Enterprise Premium | ~$1,440 (20 × $6 × 12) | Published list price |
  | Microsoft Purview Suite add-on | ~$2,400, plus PAYG Edge meter | List price, on top of Business Premium |
  | Strac | ~$600–1,000 | Vendor benchmark; a sales minimum may apply |
  | Nightfall | likely $5k+ | Vendr estimate |
  | SASE vendors (Zscaler, Netskope, Palo Alto) | far higher | Median deals in the tens of thousands of USD |

- Strac's benchmark of about $2.50–4/user/month and PiiBlocker's $6.99/seat/month mark the price anchors a small-business product will be compared against.

### Gaps
- No published Edge "In Transit Protection" per-request price was found.
- No pricing at all found for Harmonic, Prompt/SentinelOne, LayerX, Island, Menlo, Cyberhaven or Palo Alto AI Access Security.
- Netskope, Zscaler and Nightfall figures are third-party estimates of uncertain quality.

---

## 5. Language/country support: Norwegian or Nordic identifiers, Norwegian language, EU data residency

### Takeaway
Only Microsoft Purview and Google (Sensitive Data Protection infoTypes) document a built-in Norwegian fødselsnummer detector. No vendor documents D-nummer, Norwegian bank account (kontonummer, 11 digits with MOD11) or Norwegian-language health terms. EU hosting is available "on request" at Harmonic, as hosting-region choice at SentinelOne, and is unstated at Strac, Menlo and Nightfall.

### Cited Findings
- **Microsoft Purview:** built-in "Norway identification number" sensitive information type. Keywords include "Fødselsnummer", "Personnummer" and "Norwegian ID Number". Matches use an 11-digit pattern (DDMMYY + 3-digit individual number + 2 check digits) with checksum validation, and higher confidence when a keyword is within 300 characters. — [Microsoft Learn SIT definition](https://learn.microsoft.com/en-us/purview/sit-defn-norway-identification-number)
- **Microsoft Purview, scope caveat:** the Norway SIT did not appear in the scanner-supported list or the policy-tip reference pages surfaced (search summary). Coverage in specific tools should be checked. — [Purview scanner SITs](https://learn.microsoft.com/en-us/purview/deploy-scanner-supported-sits)
- **Google Sensitive Data Protection:** infoType `NORWAY_NI_NUMBER` ("Fødselsnummer"). Nordic neighbours are also covered: `SWEDEN_NATIONAL_ID_NUMBER`, `DENMARK_CPR_NUMBER`, `FINLAND_NATIONAL_ID_NUMBER` (no update date on page). — [Google SDP infoTypes reference](https://docs.cloud.google.com/sensitive-data-protection/docs/infotypes-reference)
- **Strac:** "100+ sensitive data types" (PII, PCI, PHI, secrets, custom patterns); no country-specific identifiers listed; GDPR alignment claimed but no data-location statement (accessed 2026-11-08). — [Strac AI Governance](https://www.strac.io/ai-governance)
- **Harmonic, hosting:** "EU hosting available on request". A third-party sovereignty review lists data hosting in EU and US. — [Harmonic Guide](https://www.harmonic.security/products/guide); [EU Sovereignty Score](https://eusovereigntyscore.eu/en/vendors/harmonic-security)
- **Harmonic, languages:** not stated on the Guide page. — [Harmonic Guide](https://www.harmonic.security/products/guide)
- **SentinelOne / Prompt Security:** the DPA allows choosing among offered hosting regions; processing locations are separate (competitor summary). — [Aona (competitor)](https://aona.ai/resources/comparisons/aona-vs-prompt-security/)
- **Nightfall:** "in-tenant where deployment supports it". No regions named; compliance docs only under NDA. — [Nightfall pricing](https://www.nightfall.ai/pricing)
- **Menlo:** names PII, PHI and PCI and cites GDPR, CCPA and PIPEDA; no country identifiers or EU residency stated. — [Menlo AI Adaptive DLP](https://www.menlosecurity.com/product/ai-adaptive-dlp)
- **Zscaler:** 100+ predefined DLP dictionaries; Norwegian coverage not confirmed in sources found. — [Zscaler datasheet](https://www.zscaler.com/resources/data-sheets/zscaler-gen-ai-security-at-a-glance.pdf)
- **Norwegian local vendors (different category: private AI chat, not DLP on public AI tools):**
  - PrivatAI (privatai.no): reversible anonymisation, LLM hosting in Norway, zero retention (vendor claims). — [PrivatAI](https://privatai.no/)
  - Bineric / Norsk AI: multi-model front end with EU hosting. — [norskgpt.com](https://norskgpt.com/)
  - Kigent: Oslo, SMB website chat, EU storage. — [kigent.no](https://kigent.no/)

### Inferences
- A fødselsnummer detector is table stakes for the Microsoft and Google stacks. D-nummer (first digit +4), H-nummer, Norwegian kontonummer, organisasjonsnummer and Norwegian clinical vocabulary appear undocumented everywhere. That is a credible localisation edge for Ghost Agent, though not a moat against Microsoft or Google, who could add them.
- Whether Microsoft's SIT checksum accepts D-numbers could not be verified. The D-nummer adds 4 to the first digit, so a DDMMYY date check may reject it.
- Every cloud-inspecting vendor needs a DPA and transfer assessment under GDPR and Datatilsynet guidance. Ghost Agent's fully local model removes that procurement step, a meaningful advantage for municipalities and clinics.

### Gaps
- Could not verify whether Purview's or Google's Norway detectors accept D-nummer.
- No vendor documentation found on Norwegian-language NLP (names or health terms in Norwegian) for any listed vendor.
- EU residency details are unknown for LayerX/Akamai, Island, Cyberhaven, Netskope, Zscaler and Palo Alto. All are believed to run EU data centres, but no source was checked in this pass.

---

## 6. Funding/acquisition news 2024–2026 and notable customers

### Takeaway
2025–2026 saw rapid consolidation: Prompt Security to SentinelOne (Aug/Sep 2025), Lakera to Check Point (Sep 2025), LayerX to Akamai (May 2026, about $205M). Independent players raised big rounds: Harmonic $50M Series B (Oct 2026), Cyberhaven $100M Series D at a valuation over $1B (Apr 2025), Island $250M Series E at about $4.8B (Mar 2025).

### Cited Findings
- **Prompt Security, deal:** SentinelOne announced the acquisition on 5 Aug 2025 and closed it about 5 Sep 2025. Value reported at about $250M (Calcalist) versus about $180M cash and stock (another source); the figures conflict. — [Calcalist](https://www.calcalistech.com/ctechnews/article/im5ma59bu); [Yahoo Finance](https://finance.yahoo.com/news/sentinelone-acquire-prompt-security-250m-182354008.html); [Wikipedia](https://en.wikipedia.org/wiki/Prompt_Security)
- **Prompt Security, product:** now sold as SentinelOne's "security for AI". — [AppSecSanta](https://appsecsanta.com/prompt-security)
- **Lakera:** Check Point announced the acquisition on 16 Sep 2025, expected to close in Q4 2025. A developer blog says the deal was about $300M (unverified). — [Infosecurity Magazine](https://www.infosecurity-magazine.com/news-features/cybersecurity-ma-crowdstrike/); [dev.to (unverified)](https://dev.to/dokasuka_don_de7635cc481c/lakera-guard-was-acquired-for-300m-here-is-the-free-alternative-we-built-for-developers-4h8)
- **LayerX, Series A:** $11M extension in Apr 2025, led by Jump Capital, with Glilot and Dell Technologies Capital. Total raised $45M (headlines vary: $37M Series A). — [SecurityWeek](https://www.securityweek.com/layerx-raises-11-million-for-its-browser-security-solution/); [FinSMEs Apr 2025](https://www.finsmes.com/2025/04/layerx-extends-series-a-funding-to-37m.html)
- **LayerX, acquisition:** Akamai announced intent to acquire on 14 May 2026, about $205M all cash, with about $10M expected 2026 ARR and the team joining Akamai Zero Trust. Close was expected in Q3 2026; a reseller says the deal completed (06.07.2026), but no primary confirmation was found. — [SecurityWeek](https://www.securityweek.com/akamai-to-acquire-ai-and-browser-security-firm-layerx-for-205-million/); [Akamai press release](https://www.akamai.com/content/akamai/it/newsroom/press-release/2026/akamai-technologies-announces-intent-to-acquire-layerx-advancing-its-workforce-security-strategy-with-ai-usage-control.html); [Softprom](https://softprom.com/akamai-layerx-secure-enterprise-browser-acquisition)
- **LayerX, customers:** Dun & Bradstreet, KnowBe4 and MediaTek are named by one secondary source only (uncorroborated). — [PixieBrix](https://www.pixiebrix.com/tool/layerx)
- **Harmonic Security:** $50M Series B on 14 Oct 2026, led by Crosspoint Capital, for $76M total. Earlier rounds: $17.5M Series A (Next47, Oct 2024) and a seed (Ten Eleven, 2023). 100+ enterprise customers; Advisor360 named. — [FinSMEs Oct 2026](https://www.finsmes.com/2026/10/harmonic-security-raises-50m-in-series-b-funding.html); [Unite.ai](https://www.unite.ai/harmonic-security-raises-50m-series-b-to-expand-us-and-uk-teams/); [Harmonic Guide](https://www.harmonic.security/products/guide)
- **Cyberhaven, funding:** $100M Series D in Apr 2025, led by StepStone with Schroders and Industry Ventures, at a valuation above $1B. Total funding figures conflict: $236M (Tracxn) vs $384M (GetLatka, likely wrong). — [Cyberhaven press release](https://www.cyberhaven.com/press-releases/cyberhaven-raises-100-million-series-d-at-1-billion-valuation); [SiliconANGLE Apr 2025](https://siliconangle.com/2025/04/02/cyberhaven-nabs-100m-ai-powered-data-protection-platform/)
- **Cyberhaven, growth:** claims triple-digit revenue growth in FY2026 (company-reported). — [Cyberhaven FY2026](https://www.cyberhaven.com/press-releases/cyberhaven-announces-record-year-of-growth-as-enterprises-race-to-secure-ai-and-data)
- **Island, funding:** $250M Series E on 26 Mar 2025, led by Coatue, at about $4.8B. A later $400M round at $6.4B appears in one secondary source only (unconfirmed). — [Island press](https://www.island.io/press/island-secures-250-million-as-valuation-continues-to-soar-to-nearly-5-billion); [SecurityWeek](https://www.securityweek.com/island-banks-250m-series-e-for-enterprise-browser/); [BigGo (unconfirmed)](https://finance.biggo.com/news/382f12be-10c3-465f-919d-afc28aa9b824)
- **Island, product:** Enterprise AI suite (AI Protect etc.) launched Mar 2026; Claude Compliance API integration in Jun 2026. — [BusinessWire Mar 2026](https://www.businesswire.com/news/home/20260317531077/en/)
- **Menlo Security, award:** won "DLP Solution of the Year" at the 2026 CyberSecurity Breakthrough Awards (8 Oct 2026). — [Menlo press release](https://www.menlosecurity.com/press-releases/menlo-security-wins-data-loss-prevention-solution-of-the-year-in-the-2026-cybersecurity-breakthrough-awards)
- **Menlo Security, product:** AI Adaptive DLP launched Apr 2026. — [Menlo blog](https://www.menlosecurity.com/blog/dlp-that-doesnt-make-you-choose-introducing-menlo-ai-adaptive-dlp)
- **Strac:** named customers include UiPath, Databricks, ThredUp, Underdog Fantasy, CDC and Paymentology. — [Strac AI Governance](https://www.strac.io/ai-governance)
- **Google:** Snap reported a 50% reduction in content transfers to GenAI after Chrome DLP rules (vendor testimonial). — [Chrome Enterprise Premium](https://chromeenterprise.google/products/chrome-enterprise-premium/)
- **Market context:** Calcalist named Lasso, Aim and Pillar as next M&A targets after the Prompt deal. — [Calcalist](https://www.calcalistech.com/ctechnews/article/bjt0500luxl)

### Inferences
- Standalone "AI usage control" startups are being folded into large platforms (endpoint, network, CDN). Their roadmaps will tilt toward big-enterprise bundles, leaving the SMB/no-IT segment underserved.
- Harmonic, Cyberhaven and Island are well funded and remain independent; Harmonic is expanding in the US and UK, not the Nordics.

### Gaps
- No Nightfall funding news from 2024–2026 was found in this pass.
- No Nordic or Norwegian named customers were found for any vendor.
- Lakera deal value is unverified.

---

## 7. Strengths and weaknesses relative to a local, end-user-friendly, small-business tool (Ghost Agent)

### Takeaway
The enterprise vendors win on breadth: desktop apps, file uploads, MCP/agents, SaaS, central policy and audit dashboards. They lose on five points that matter to small Norwegian organisations:
- they need admins, device management or TLS proxies;
- they inspect in their cloud;
- they mostly block or warn rather than help the user send a safe version;
- they lack D-nummer, kontonummer and Norwegian health-term detection;
- they are sold through sales contracts.

### Cited Findings
- **Strac:** local in-browser detection and a redacted-preview warn mode. Strengths: lowest published per-user benchmark ($30–50/year); four browsers. Weaknesses: the extension cannot see desktop AI apps; there is no country-identifier list; it is sales-led. — [Strac AI Governance](https://www.strac.io/ai-governance); [jazz.security (competitor)](https://jazz.security/dlp-explained/dlp-basics/is-strac-worth-it/)
- **Harmonic:** strong context-aware SLM detection (<200 ms) on the endpoint, plus coaching and MCP coverage. Weaknesses: enterprise-only (100+ enterprise customers); EU hosting only on request. — [Harmonic regulated industries](https://www.harmonic.security/solutions/genai-compliance-regulated-industries); [Harmonic Guide](https://www.harmonic.security/products/guide)
- **Microsoft Purview, strengths:** native fødselsnummer SIT; often already partially licensed. — [Microsoft Learn SIT](https://learn.microsoft.com/en-us/purview/sit-defn-norway-identification-number)
- **Microsoft Purview, weaknesses:**
  - Endpoint DLP is not in Business Premium. — [Sourcepass](https://blog.sourcepass.com/sourcepass-blog/purview-licensing-for-m365-e3-and-business-premium-sourcepass-mcoe)
  - Inline prompt blocking works only in Edge for Business on Intune-managed Windows, and is billed PAYG. — [Microsoft Learn](https://learn.microsoft.com/en-us/purview/deploymentmodels/depmod-data-leak-shadow-ai-step3); [Purview billing](https://learn.microsoft.com/sv-se/purview/purview-billing-models)
  - Claude is reportedly not on the supported list. — [jazz.security (competitor)](https://jazz.security/dlp-explained/dlp-basics/is-microsoft-purview-dlp-enough/)
- **Google Chrome Enterprise Premium:** strengths are a cheap published price ($6/user/month) and a NORWAY_NI_NUMBER detector in Google's DLP library. Weakness: managed Chrome only. — [Chrome Enterprise](https://chromeenterprise.google/download/); [Google SDP](https://docs.cloud.google.com/sensitive-data-protection/docs/infotypes-reference); [jazz.security (competitor)](https://jazz.security/dlp-explained/dlp-basics/is-google-workspace-dlp-enough/)
- **Cloudflare:** strengths are a free tier to 50 users and AI prompt topic detection. Weaknesses: needs the WARP client, Gateway setup and TLS inspection; prompt-level coverage is inconsistent across docs. — [Cloudflare blog](https://blog.cloudflare.com/zero-trust-ai-security/); [Cloudflare changelog](https://developers.cloudflare.com/changelog/post/2025-08-25-ai-prompt-protection/); [CASB post](https://blog.cloudflare.com/casb-ai-integrations/)
- **Zscaler, Netskope, Palo Alto:** broad coverage. Weaknesses: SSL inspection, licence tiers, and median deals far above SMB budgets. Netskope's coaching data shows nudges work: 73% of users stop. — [jazz.security Zscaler (competitor)](https://jazz.security/dlp-explained/dlp-basics/is-zscaler-dlp-enough/); [costbench](https://www.costbench.com/compare/netskope-vs-zscaler/); [Netskope GenAI 2025](https://www.netskope.com/resources/cloud-and-threat-reports/cloud-and-threat-report-generative-ai-2025)
- **Island and Prisma Browser:** require replacing the user's browser; enterprise contracts. — [Push Security](https://pushsecurity.com/blog/island-browser-alternatives-and-competitors); [ethicalhacking.ai](https://ethicalhacking.ai/pricing/island-browser-pricing)
- **Menlo:** masks data, but detection happens in the Menlo Cloud and originals can be retained there. — [Menlo AI Adaptive DLP](https://www.menlosecurity.com/product/ai-adaptive-dlp)
- **Prompt Security:** redaction plus coaching across 15,000+ AI sites (vendor claim). Weaknesses: now inside SentinelOne's enterprise platform; redaction can break signed API requests. — [AppSecSanta](https://appsecsanta.com/prompt-security)

### Inferences
- Ghost Agent's clearest differentiators, based on the absence of these features in every source reviewed:
  1. Fully local processing with no vendor cloud, so no DPA or transfer impact assessment.
  2. Numbered entity placeholders ([PERSON_1]) that keep prompts usable.
  3. Local-LLM rephrasing.
  4. Norwegian-specific detectors: D-nummer, kontonummer, Norwegian names and health terms.
  5. Self-install with no admin or MDM.
- Ghost Agent's likely weaknesses versus these vendors:
  - no coverage of desktop AI apps or file uploads (if browser-only);
  - no central admin console or audit trail, which a municipality or clinic may need for GDPR accountability;
  - a user can simply disable the extension;
  - Microsoft and Google already detect fødselsnummer and are "free-ish" for customers on their stacks.
- The SMB-priced extension niche (Caviard, PiiBlocker, PrivacyScrubber, all under $7/seat/month or flat fees) is the nearest price competition. None of them showed Norwegian identifiers in the sources found.

### Gaps
- No independent accuracy benchmarks found comparing detection quality across vendors, especially for non-English text.
- No G2/Capterra review data with SMB-specific sentiment collected in this pass.
- No analyst (Gartner/Forrester) placements for "AI usage control" / GenAI DLP were retrieved in this pass.
