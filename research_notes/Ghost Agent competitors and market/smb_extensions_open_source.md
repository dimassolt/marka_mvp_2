# Consumer, prosumer and SMB tools that detect or redact sensitive data before it reaches AI chats (as of November 2026)

Research date: 2026-11-08. Web research only; nothing was installed or run. Where a vendor page shows no date, the date given is the date I read it (2026-11-08).

Method note: Chrome Web Store pages could not be read directly. Every fetch redirected to a Google consent page (consent.google.com, gl=NO). Chrome user counts therefore come from third-party pages, mainly a comparison blog published by a competitor (PiiBlocker). Firefox (AMO) listings were read directly.

## What each tool does (detect, mask, placeholders, restore in the answer, rephrase, block)

### Takeaway
The core Ghost Agent mechanic is already common among small Chrome/Firefox extensions: detect locally, swap values for typed placeholders, then restore the real values in the AI's reply. At least ten tools do some version of it (Caviard, PrivacyScrubber, PasteSecure, ChatWall, PiiBlocker, Private Guard, Privatiser, Cloak, DFKI Privacy Guardrail, Maskera). Only two do anything like Ghost Agent's "Rephrase": Rescriber (academic) offers "abstract", and Wald.ai offers cloud-side "inflection". The only Norwegian-specific AI-chat product found, NorwAI Shield, blocks, warns or anonymises, but its pages do not mention placeholders or restore.

### Cited Findings

**Closest consumer/prosumer extensions (local, placeholder, restore)**
- **Caviard.ai** (Chrome). Detects PII such as names, numbers, IDs, emails, addresses and payment details. Replaces them with format-preserving placeholders, keeps one placeholder per value across a session, masks PII in AI responses too, and toggles back to the original with Alt+R / Option+R. Claims "100+" PII types. — [caviard.ai](https://www.caviard.ai/) (read 2026-11-08)
- Caviard founder "Damien", Switzerland, founded March 2025. — [TrustMRR](https://trustmrr.com/startup/caviard-ai) (page updated 2026-11-08)
- **PrivacyScrubber** (Chrome extension plus web app, by BrandMeWeb). Typed tokens such as [NAME_1], [EMAIL_1], [FINANCIAL_1]. Has an "AI Tokens" (reversible) mode and a "Blackout" mode. "1-Click Reverse Reveal" restores tokens in AI answers from local memory. On-device OCR for screenshots and PDFs. Version v2.4.8. — [privacyscrubber.com](https://privacyscrubber.com/) (read 2026-11-08)
- **PasteSecure** (Chrome). Detects PII, secrets and financial data as you type or paste. Its "Vault" swaps values for local tokens that can be restored later. Listing updated 2026-09-29. — [Chrome Web Store listing via search snippet](https://chromewebstore.google.com/detail/pastesecure-%E2%80%93-pii-redacti/ebolpbgeaeammpddffibagpobicfnhoc) (snippet seen 2026-11-08)
- **ChatWall** (by StarObject; Firefox and Chrome). A typed email becomes "[EMAIL_1]" when sent, and the AI's reply is restored to the original on screen. Says its code is "Source Available" on GitHub, but the listing gives no URL. Firefox v2.0.4, updated 2026-03-05. — [AMO listing](https://addons.mozilla.org/en-US/firefox/addon/chatwall/) (read 2026-11-08)
- ChatWall restores "automatically, in its own window". — [PiiBlocker blog, 2026-10-02](https://piiblock.pages.dev/blog/best-pii-masking-chrome-extensions-ai-chatbots) (competitor source)
- **PiiBlocker** (Chrome). Highlights PII in real time and shows a confirmation dialog for choosing what to mask. Restores real data automatically in the chat box. — [Chrome Web Store via search snippet](https://chromewebstore.google.com/detail/piiblocker-%E2%80%94-mask-pii-in/nklghhkmhkmckonncilnaohlihfacoee); [PiiBlocker blog, 2026-10-02](https://piiblock.pages.dev/blog/best-pii-masking-chrome-extensions-ai-chatbots)
- **Private Guard — PII Redaction** (Chrome). Claims local redaction and that it "seamlessly restores the original values in the AI's responses". I did not read the listing in full. — [Chrome Web Store, search snippet](https://chromewebstore.google.com/detail/private-guard-%E2%80%94-pii-redac/jjkghegjofelkblppppihfacdoemjban)
- **ChatGPT Privacy Shield / redact.tools** (contact address agenticworkforce.io). Three modes: alert, redact (placeholders like [EMAIL]) and optional unmask in the chat window. ChatGPT only for now. Claude, Copilot, Gemini, Perplexity and multilingual support are all "coming soon". — [redact.tools](https://www.redact.tools/) (© 2026, read 2026-11-08)
- **Privacy Protector for ChatGPT**. No automatic detection; it masks only words the user adds to a dictionary. Last updated 2025-07-02 and may no longer work on ChatGPT's current layout. — [PiiBlocker blog, 2026-10-02](https://piiblock.pages.dev/blog/best-pii-masking-chrome-extensions-ai-chatbots) (older item, flagged)
- **Paste Redactor – Clipboard PII Redaction** (on the Opera add-ons store). Redacts clipboard text "offline in your browser via AI" across Gmail, Slack, ChatGPT, Gemini and others. Advertises 55 PII types. Calls itself "a time-saving assistant, not a complete privacy solution". — [Opera add-ons](https://addons.opera.com/fr/extensions/details/paste-redactor-clipboard-pii-redaction) (search snippet, 2026-11-08)

**Open-source extensions**
- **Privacy Guardrail (DFKI, dfki-dsa)**. Apache-2.0 Chrome extension, public beta 0.x, 103 stars. Intercepts *paste* events, shows a review UI, and replaces spans with [EMAIL_1] or [PERSON_1]. Keeps the map in Chrome storage so values can be restored, highlighted, in model responses. Detection uses Rust→WASM pattern and checksum recognisers plus optional transformer NER via ONNX Runtime Web ("BardsAI EU multilingual NER"). README warns restoration "may not handle every response rewrite" and that it is "not a compliance or DLP product". — [GitHub README](https://github.com/dfki-dsa/pii-guardrail-browser-extension/) (read 2026-11-08; commit dates not shown)
- **Privatiser** (Firefox, MIT, v0.6.0, updated 2026-04-05). Swaps in consistent pseudonyms on paste and restores the originals *to the clipboard* when you copy the AI's response. Has a right-click anonymise/deanonymise menu, an allowlist and a mapping table. Strong focus on secrets, cloud IDs and network data. — [AMO listing](https://addons.mozilla.org/en-US/firefox/addon/privatiser/) (read 2026-11-08)
- **Cloak – Auto-Anonymize ChatGPT** (Firefox, MPL-2.0, v2.0.0). Anonymises PII before sending and restores it in responses. User picks which types to cover. — [BrowserTotal mirror of AMO listing](https://firefox.marketplace.browsertotal.com/sv-SE/firefox/addon/cloak-auto-anonymize-chatgpt/) (search snippet; date not shown)
- **Rescriber** (PEACH Lab, Northeastern; CHI '25 paper). Highlights possible personal disclosures and lets the user **redact or abstract** them before sending. "Abstract" is the closest analogue to Ghost Agent's Rephrase. The paper compared Llama3-8B and GPT-4o back ends. — [arXiv 2410.11876](https://arxiv.org/html/2410.11876v3)
- Rescriber's current version keeps placeholder mappings in local browser storage, and "Detection runs entirely in your browser". — [Rescriber privacy policy, effective 2026-04-25](https://peach-research-lab.github.io/Rescriber/privacy.html)
- One third-party listing says Rescriber now loads Hugging Face "openai/privacy-filter" (about 30–50 MB) in the browser. I could not confirm this from an official source. — [extensionauditor.com](https://extensionauditor.com/scan/rescriber-oglddlncokahjddccgjnnpdlgdbijcbl)
- **Presidio Browser Anonymizer** (community project). Chrome extension plus a *local Flask/Presidio backend*, triggered on paste in ChatGPT, Claude and GitLab. This is architecturally the closest to Ghost Agent's "extension + local Python engine". — [GitHub gacabartosz/presidio-local-anonymizer](https://github.com/gacabartosz/presidio-local-anonymizer) (search snippet; not read in full)
- Other small open-source extensions: SafePrompt and Maskeraid. — [GitHub lukewarm3/SafePrompt](https://github.com/lukewarm3/SafePrompt); [Peerlist Maskeraid](https://peerlist.io/ayushwalekar/project/maskeraid--mask-data-before-is-reaches-ai); "Local-Secure-Prompt-Agent" (emails, phones, Aadhaar/PAN, API keys, names, locations; 100% local) — [GitHub Doffla-mingo](https://github.com/Doffla-mingo/Local-Secure-Prompt-Agent-) (snippets only)

**Nordic tools**
- **NorwAI Shield** (Norway, org.nr 936 915 698; "Detection & Response for AI"). Browser extension plus "ADR" agent proxy plus Gateway, with an admin dashboard. Detects 11 types: fødselsnummer, D-nummer, cards, IBAN, bank accounts, passports, driver's licences, org numbers, IPs, phones, emails, plus custom patterns. Per type, the admin chooses block, warn ("varsle"), anonymise or allow. Placeholders and restore are not mentioned. — [norwaishield.no](https://norwaishield.no/) (read 2026-11-08)
- NorwAI Shield on Firefox: v2.5.3, updated 2026-04-11, 0 users, 0 reviews, "All Rights Reserved". Claims 30+ AI sites. The Norwegian description mentions fødselsnummer, cards, bank accounts, org numbers and phones. — [AMO listing](https://addons.mozilla.org/en-US/firefox/addon/norwai-shield/) (read 2026-11-08)
- **Sladd** (Virtu Tech AS, Kristiansand, org.nr 938 482 217). Browser-based *web app* for redacting text, PDFs and images, not an AI-chat extension. Finds fødselsnummer, names, addresses and contact details. Its homepage also mentions diagnoses, medications and admissions in journal notes. A March 2026 blog post says health information is marked by hand ("Helseopplysninger markerer du selv"). Downloads a language model to the device. Targets saksbehandlere (case handlers), verger (guardians), innsyn (access requests) and procurement. No restore. Founder Håkon Haugen is a professional verge with 11 years in mental-health care. — [sladd.no](https://sladd.no/) (read 2026-11-08); [Sladd blog, 2026-03-18](https://sladd.no/blogg/personopplysninger-i-chatgpt)
- **Maskera** (Hägvall Labs AB, Stockholm). Swedish-first, client-side masking of names, personnummer and addresses before text reaches an LLM, with local restore of the reply ("the key never leaves the device"). Ships its own Swedish NER model (43 MB per the GitHub title; Hugging Face joelhagvall/maskera-sv-ner) running in the browser. Open source on GitHub and npm. Also offers a company version run in the customer's own environment. Says it is "defense in depth, not a compliance guarantee". — [maskera.dev](https://maskera.dev/) (read 2026-11-08); [GitHub joelhagvall/maskera](https://github.com/joelhagvall/maskera) (title/snippet; README fetch timed out)
- **Avidentifiera** (Sweden). A service that masks personal data in PDF, Word, images and text *before* sharing with ChatGPT or Copilot. — [avidentifiera.se](https://avidentifiera.se/) (search snippet)
- **Atea AI-maskeringstjänst** (Sweden). AI document masking with human review, run in Atea's Umeå data centre or on the customer's own IT. Enterprise/public sector, not SMB self-serve. — [atea.se](https://www.atea.se/artificiell-intelligens/ai-som-tjanst/ai-maskeringstjanst/) (search snippet)
- **Sikri PixEdit** (Sweden; authorities and municipalities). AI masking. Coverage is over a year old (flag). — [it-finans.se](https://it-finans.se/sikri-lanserar-ai-driven-losning/)
- **Lexolve "Trygg KI"** (Norway). A *free guide*, not a redaction tool. Tells Norwegian businesses to anonymise "in Excel or another local tool BEFORE" pasting into AI. Last updated May 2026. Lexolve's paid product is Låvli (30-day trial). — [trygg-ki.lexolve.com](https://trygg-ki.lexolve.com/)

**Business/enterprise tools that also reach small teams**
- **Wald.ai** (US; $4M seed, Dec 2024, older item). Its own AI-assistant platform giving access to ChatGPT, Gemini, Claude and Grok, with "intelligent prompt sanitization". Redacts, sanitises, blocks or allows by policy, and reinserts sensitive data into the response. The FAQ says users cannot upload sensitive files. — [Wald pricing](https://app.wald.ai/pricing); [Wald FAQ (search snippet)](https://wald.ai/faq); [BusinessWire, 2024-12-10](https://www.businesswire.com/news/home/20241210585225/en/)
- Wald also offers "inflection", which "reframes prompts to maintain privacy while preserving their intent". This is a cloud-side analogue of Ghost Agent's Rephrase. It shows a SOC2 Type II badge and claims "55+ Regulated Organizations", including a FERPA schools case. — [wald.ai/private-gpt](https://wald.ai/private-gpt) (read 2026-11-08)
- **Strac Browser DLP** (Chrome, Edge, Safari, Firefox). Blocks, redacts, or audits and alerts on sensitive data in ChatGPT, Claude, Gmail and more. Adds OCR and PDF parsing, "100+" ML detectors, and deployment via Chrome Enterprise policy. — [Chrome Web Store (snippet)](https://chromewebstore.google.com/detail/strac-browser-dlp/gclaopgdekbeakgcjpbdondnpgopmifg); [strac.io ChatGPT DLP](https://www.strac.io/integrations/chatgpt-dlp)
- **GPTGuard (by Protecto)**. Cloud or on-prem enterprise AI chat platform that detects and masks PII, PCI and PHI. I found no browser extension. — [Slashdot](https://slashdot.org/software/p/GPT-Guard/); [SpotSaaS](https://www.spotsaas.com/product/gpt-guard/pricing) (aggregators)
- **Private AI / PrivateGPT**. A web chat UI plus Private AI's container, also usable via API. — [Private AI docs (search snippet)](https://docs.private-ai.com/what-is-privategpt) (the page returned 404 when fetched on 2026-11-08)

**Open-source engines and proxies**
- **Microsoft Presidio**. Open-source detection and anonymisation engine. The docs now live at presidio.dataprivacystack.org, with a "Project transition update" notice whose content I did not read. — [Presidio supported entities](https://presidio.dataprivacystack.org/supported_entities/) (read 2026-11-08)
- **LLM Guard** (Protect AI). The Anonymize input scanner swaps PII for placeholders and keeps the mapping in a `Vault`. The Deanonymize output scanner restores the originals in the model's reply. — [LLM Guard Anonymize docs](https://protectai.github.io/llm-guard/input_scanners/anonymize); [Deanonymize docs](https://protectai.github.io/llm-guard/output_scanners/deanonymize)
- LLM Guard maintenance: one source says Protect AI no longer actively develops it, with the last release v0.3.16 in May 2025. A fork, "llm-guardrails-maintained", exists on PyPI. — [appsecsanta](https://appsecsanta.com/llm-guard); [PyPI fork](https://pypi.org/project/llm-guardrails-maintained/) (I did not verify the archive status on GitHub)
- **Local LLM privacy proxies** (developer-oriented, OpenAI-compatible APIs, not chat-site UIs):
  - PasteGuard: placeholders like [[PERSON_1]], can route sensitive requests to local Ollama/vLLM, Apache-2.0 — [DEV post](https://dev.to/githubopensource/stop-sending-secrets-to-openai-meet-pasteguard-your-essential-llm-privacy-shield-4b62)
  - PrivAiTe: proxy for Claude Code, Codex and OpenAI-compatible apps; reversible placeholders plus irreversible redaction for some types; restores values in replies — [GitHub crp4222/PrivAiTe](https://github.com/crp4222/PrivAiTe)
  - akazah/prompt-anonymizer: Presidio-based local proxy that restores labels — [GitHub](https://github.com/akazah/prompt-anonymizer)
  - DontFeedTheAI: pentest proxy using local Ollama plus regex — [GitHub](https://github.com/zeroc00I/LLM-anonymization)
  - daslabhq/pii-proxy: TypeScript library with Ollama detection — [GitHub](https://github.com/daslabhq/pii-proxy)
  - rizzo-pii: Italian legal documents; anonymise locally, send placeholders, restore locally — [GitHub](https://github.com/Rizzo-AI-Academy/rizzo-pii)
  - All of the above are search snippets of READMEs; I did not check maintenance.

### Inferences
- "Local detection + placeholder + restore" no longer sets anyone apart. Small Chrome/Firefox extensions already ship it, several for free. What Ghost Agent can still own: (a) underlining while the user types, rather than only on paste or submit (DFKI, Privatiser and Presidio Browser Anonymizer trigger on paste); (b) local-LLM Rephrase (only Rescriber's "abstract" and Wald's cloud "inflection" are similar); (c) Norwegian identifiers plus domain word lists for health, education and courts; (d) Opera support.
- Restore varies a lot in UX. Caviard uses a keyboard toggle, PrivacyScrubber a click, ChatWall a separate window, Privatiser the clipboard, and DFKI and PiiBlocker restore in the page. Ghost Agent's "restore on screen only" sits in the in-page group.

### Gaps
- I could not read Chrome Web Store pages (consent redirect), so I could not confirm current Chrome ratings, last-updated dates or full feature lists for Caviard, PasteSecure, Private Guard, PiiBlocker or Strac.
- The NorwAI Shield privacy policy did not load from the mirror. It is unclear what its Supabase endpoint receives beyond the homepage's claim of "anonymised statistics only".
- Private AI's PrivateGPT docs page returned 404, so its current architecture and language list are unconfirmed.
- I did not check Microsoft Edge Add-ons listings.
- The Cloak, Maskeraid and SafePrompt repositories were not read in full.

## Where processing happens (local vs vendor cloud)

### Takeaway
Nearly every consumer/prosumer extension found claims fully local, in-browser processing. None of these claims is independently audited, and only the open-source ones can be checked. The business products (Wald, Strac, GPTGuard, NorwAI Shield's Gateway) involve vendor or customer-hosted servers or a central dashboard.

### Cited Findings
- **Caviard**: "All masking happens on the user's device. No data is sent away." — [caviard.ai](https://www.caviard.ai/) (read 2026-11-08)
- **PrivacyScrubber**: processes in local device RAM, "0 bytes" over the network, works in Airplane Mode, zero subprocessors. — [privacyscrubber.com](https://privacyscrubber.com/)
- **ChatWall**: "Your data is masked locally on your device". Lists an optional permission for chatwall.io. — [AMO](https://addons.mozilla.org/en-US/firefox/addon/chatwall/)
- **PiiBlocker**: the store listing says "100% local". The vendor's own comparison page reportedly also says "Data is processed through external servers, not locally", which contradicts this. — [Chrome Web Store snippet](https://chromewebstore.google.com/detail/piiblocker-%E2%80%94-mask-pii-in/nklghhkmhkmckonncilnaohlihfacoee); contradiction reported in a search summary of [AlternativeTo](https://alternativeto.net/software/privacyshield/about) and [piiblock.pages.dev](https://piiblock.pages.dev/). The 2026-10-02 blog says "free version makes no network calls" — [PiiBlocker blog](https://piiblock.pages.dev/blog/best-pii-masking-chrome-extensions-ai-chatbots)
- **DFKI Privacy Guardrail**: "No pasted text leaves the browser"; no telemetry; WASM plus ONNX Runtime Web. Local AI "can be slow or unavailable depending on browser, memory, and WebGPU support". — [GitHub](https://github.com/dfki-dsa/pii-guardrail-browser-extension/)
- **Privatiser**: "100% local", no analytics or telemetry, mappings kept for the browser session only. — [AMO](https://addons.mozilla.org/en-US/firefox/addon/privatiser/)
- **Rescriber**: detection in the browser, mappings in local storage. — [privacy policy, 2026-04-25](https://peach-research-lab.github.io/Rescriber/privacy.html)
- **redact.tools**: "No data ever leaves your browser". — [redact.tools](https://www.redact.tools/)
- **Maskera**: text and the key with the original values do not leave the device. The company version runs in the customer's own environment. — [maskera.dev](https://maskera.dev/)
- **Sladd**: the document "forlater aldri maskinen" (never leaves the machine); model downloaded to the device. — [sladd.no](https://sladd.no/)
- **NorwAI Shield**: the extension and ADR agent analyse locally. The Gateway is self-hosted or EU-hosted by NorwAI. Only anonymised statistics reach the dashboard. — [norwaishield.no](https://norwaishield.no/)
- A third-party search summary of NorwAI Shield's privacy policy says metadata is sent to a Supabase account on each trigger: data type, platform, chosen action, timestamp and device ID. I could not load the page myself. — [BrowserTotal mirror of privacy policy](https://firefox.marketplace.browsertotal.com/sv-SE/firefox/addon/norwai-shield/privacy/) (unverified)
- **Wald.ai**: its DLP product works "on-device" ("Observe and govern Gen AI usage on-device"). Its hosted LLM runs in "a secure environment, with encryption owned by you". The page does not say where redaction runs for its chat platform. — [wald.ai/private-gpt](https://wald.ai/private-gpt)
- **Strac**: the pricing page calls SaaS DLP "agentless" but does not say where scanning happens. The Firefox add-on requires login/sign-up. — [strac.io/pricing](https://www.strac.io/pricing); [AMO (snippet)](https://addons.mozilla.org/fi/firefox/addon/strac-browser-dlp)
- **GPTGuard/Protecto**: cloud-based or on-premises. — [Slashdot](https://slashdot.org/software/p/GPT-Guard/)
- **Presidio Browser Anonymizer**: extension plus a Flask backend the user runs locally. — [GitHub](https://github.com/gacabartosz/presidio-local-anonymizer) (snippet)

### Inferences
- "Nothing leaves the machine" is a crowded claim. A NorwAI Shield–style central dashboard sends at least metadata off the device. Ghost Agent's strict zero-telemetry stance is a real difference from NorwAI Shield, but not from the indie extensions.
- Ghost Agent's local Python engine plus a local Gemma model makes it heavier to install than the pure-browser tools (Caviard, DFKI WASM/ONNX, Maskera's 43 MB browser model). It can, however, run larger models (GLiNER, Gemma) than in-browser competitors. DFKI's README names browser memory and WebGPU limits as the in-browser weakness.

### Gaps
- No independent audit of any extension's local-only claim was found.
- It is unclear whether Wald's redaction runs in the browser or in Wald's cloud for its main chat product.

## Pricing, user counts and ratings

### Takeaway
Consumer extensions cluster at free to about USD 4–15/month or a lifetime licence, and have tiny real user bases: tens to a few hundred Chrome users, near zero on Firefox. Revenue data for Caviard (USD 74 all-time) suggests consumers are not very willing to pay. Business tools charge per seat (about USD 8–20/user/month) or quote custom prices. The only Norwegian price list found is NorwAI Shield: 990 kr/month platform fee + 59 kr/user.

### Cited Findings
- **Caviard**: site claims "50K+" users. — [caviard.ai](https://www.caviard.ai/). Chrome shows **342 users** (2026-10-02). — [PiiBlocker blog](https://piiblock.pages.dev/blog/best-pii-masking-chrome-extensions-ai-chatbots). Aggregators show "a few hundred users". — [extpose](https://extpose.com/ext/411115)
- **Caviard pricing**: Free $0, Monthly $4, Lifetime $19. — [search snippet, ethicalhacking.ai/related listings](https://ethicalhacking.ai/pricing/private-ai-pricing). Per the PiiBlocker blog: per-device lifetime licence, custom plans via sales, free tier of 10 protected values per document. — [PiiBlocker blog, 2026-10-02](https://piiblock.pages.dev/blog/best-pii-masking-chrome-extensions-ai-chatbots)
- **Caviard revenue**: $74 all-time, $9 in the last 30 days, $0 MRR, verified via Stripe. Audience labelled B2B, "~50,000 users". — [TrustMRR, updated 2026-11-08](https://trustmrr.com/startup/caviard-ai)
- **PrivacyScrubber**: Free $0; PRO $15/month or $110 lifetime; TEAMS $99/month flat (unlimited seats); Developer SDK $299/month; Enterprise custom with an on-prem option. — [privacyscrubber.com](https://privacyscrubber.com/) (read 2026-11-08). Chrome: 99 users (2026-10-02). — [PiiBlocker blog](https://piiblock.pages.dev/blog/best-pii-masking-chrome-extensions-ai-chatbots)
- **PiiBlocker**: free core with no account; enterprise $6.99/seat/month billed annually; 492 Chrome users (self-reported in its own blog, 2026-10-02). — [PiiBlocker blog](https://piiblock.pages.dev/blog/best-pii-masking-chrome-extensions-ai-chatbots). Another snapshot shows about 30 users and 5 ratings. AlternativeTo mentions a $5/month plan. — [search summary of Chrome Web Store / AlternativeTo](https://alternativeto.net/software/privacyshield/about) (conflicting)
- **ChatWall**: 105 Chrome users; per-device plans from $19/month for 10 devices. — [PiiBlocker blog, 2026-10-02](https://piiblock.pages.dev/blog/best-pii-masking-chrome-extensions-ai-chatbots). Firefox: 8 users, 0 ratings. — [AMO](https://addons.mozilla.org/en-US/firefox/addon/chatwall/) (read 2026-11-08)
- **PasteSecure**: 69 Chrome users; paid tier, price not published. — [PiiBlocker blog, 2026-10-02](https://piiblock.pages.dev/blog/best-pii-masking-chrome-extensions-ai-chatbots)
- **Privacy Protector for ChatGPT**: 55 Chrome users; free. — same source
- **redact.tools**: Free $0; Pro $9/month (waitlist); Team $49/month for up to 10 members (waitlist). — [redact.tools](https://www.redact.tools/)
- **Paste Redactor** (Opera): free plan capped at 100 redactions/month. — [Opera add-ons snippet](https://addons.opera.com/fr/extensions/details/paste-redactor-clipboard-pii-redaction)
- **Privatiser**: free, Buy Me a Coffee; 14 Firefox users, no ratings. — [AMO](https://addons.mozilla.org/en-US/firefox/addon/privatiser/)
- **Promptmask**: "Free for all non-commercial use — no account, no subscription, no limits". — [chromeboard snippet](https://chromeboard.com/extension/promptmask-lhooepkikambidgdbfoaifoocdlapleh)
- **NorwAI Shield**: Free 0 kr (up to 3 users, no blocking); Team 990 kr/month + 59 kr/user (up to 50 users); Business 2 490 kr/month + 99 kr/user (up to 250 users, with Gateway and ADR); Enterprise on request (self-hosted gateway, SSO/SAML). 14-day trial. — [norwaishield.no](https://norwaishield.no/) (read 2026-11-08). Firefox: 0 users. — [AMO](https://addons.mozilla.org/en-US/firefox/addon/norwai-shield/)
- **Sladd**: "gratis å prøve" (free to try); the pricing page exists but no NOK amounts were captured. — [sladd.no](https://sladd.no/)
- **Wald.ai**: Enterprise $19.99/user/month with access to ChatGPT, Gemini and Claude; custom pricing for large teams; 14-day free trial. Third-party sites claim a freemium tier, which Wald's own page does not mention. — [Wald pricing](https://app.wald.ai/pricing); [Wald FAQ snippet](https://wald.ai/faq)
- **Strac**: no public prices. Itemised quote after a 30-minute call; calculator defaults to 500 employees. — [strac.io/pricing](https://www.strac.io/pricing) (read 2026-11-08)
- **GPTGuard/Protecto**: about $8/user/month (Enterprise, yearly), 14-day trial; free trial capped at 100 prompts/month. All aggregator figures; the vendor does not publish pricing. — [SpotSaaS](https://www.spotsaas.com/product/gpt-guard/pricing); [Slashdot](https://slashdot.org/software/p/GPT-Guard/); [G2](https://www.g2.com/products/gptguard-ai/pricing)
- **Private AI**: aggregators conflict. One says a free API key with 500 calls; others say no free tier, or freemium. — [ethicalhacking.ai](https://ethicalhacking.ai/pricing/private-ai-pricing); [bestaitools](https://www.bestaitools.com/tool/private-ai/) (unreliable)

### Inferences
- The indie extension market is fragmented and small: no product with verifiable traction above about 500 Chrome users was found. Caviard's 50K claim conflicts with every third-party count, and with $74 of lifetime revenue.
- NorwAI Shield's pricing anchors what a Norwegian small org would pay for an admin-managed tool. A 5-person clinic would pay about 990 + 5×59 = 1 285 kr/month on the Team tier. A sole practitioner could use Free (up to 3 users) but would get no blocking. Ghost Agent, being single-user and zero-dashboard, could price below or beside this.

### Gaps
- Current Chrome ratings (stars and counts) could not be read for any extension.
- Sladd's and Maskera's prices were not found.
- Edge and Opera user counts were not found.

## Languages and identifiers; Norwegian/Nordic support

### Takeaway
No consumer AI-chat extension found detects Norwegian fødselsnummer or D-nummer. Only NorwAI Shield, an admin-oriented B2B product, explicitly does. Sladd handles fødselsnummer but is a document web app. Maskera covers Swedish personnummer with a Swedish NER model. Presidio ships Swedish and Finnish recognisers but **no Norwegian or Danish** ones. LLM Guard's NER is English/Chinese only. No tool found mentions Danish CPR, or domain word lists for health, education or courts.

### Cited Findings
- **NorwAI Shield**: fødselsnummer, D-nummer, IBAN, bank accounts, org numbers and more, plus custom patterns. Listing written in Norwegian bokmål. — [norwaishield.no](https://norwaishield.no/); [AMO](https://addons.mozilla.org/en-US/firefox/addon/norwai-shield/)
- **Sladd**: fødselsnummer, names, addresses, phones. Its homepage claims diagnoses, medications and admissions in journal notes. The blog says health information is marked by hand. D-nummer not mentioned. — [sladd.no](https://sladd.no/); [blog, 2026-03-18](https://sladd.no/blogg/personopplysninger-i-chatgpt) (internal inconsistency on health detection)
- **Maskera**: Swedish names, personnummer, addresses. Own Swedish NER model; samordningsnummer, Norwegian and Danish IDs not mentioned. — [maskera.dev](https://maskera.dev/); [GitHub](https://github.com/joelhagvall/maskera)
- **Presidio** country recognisers: Finland `FI_PERSONAL_IDENTITY_CODE`; Sweden `SE_PERSONNUMMER` (incl. coordination numbers) and `SE_ORGANISATIONSNUMMER`; "no entities" for Norway or Denmark. Global: CREDIT_CARD, IBAN_CODE, EMAIL_ADDRESS, PHONE_NUMBER, PERSON, LOCATION and others. Optional MEDICAL_* entities via transformers. — [Presidio supported entities](https://presidio.dataprivacystack.org/supported_entities/) (read 2026-11-08)
- **LLM Guard Anonymize**: "Current entity detection functionality is English-specific"; also supports Chinese. — [LLM Guard docs](https://protectai.github.io/llm-guard/input_scanners/anonymize)
- **Caviard**: "Understands different languages and layouts"; no languages named; no Nordic mention. — [caviard.ai](https://www.caviard.ai/)
- **PrivacyScrubber**: names, emails, phones, SSNs, IBANs, cards, IPs, API keys; no language list; no Nordic mention. — [privacyscrubber.com](https://privacyscrubber.com/)
- **Privatiser**: US/UK phones, SSNs, passports, IBANs, Luhn cards, secrets and cloud IDs; no Nordic IDs. — [AMO](https://addons.mozilla.org/en-US/firefox/addon/privatiser/)
- **DFKI Privacy Guardrail**: email, phone, SSN, cards, IBAN, IP, dates plus multilingual NER ("BardsAI EU multilingual NER"); no language list. — [GitHub](https://github.com/dfki-dsa/pii-guardrail-browser-extension/)
- **redact.tools**: multilingual support "coming soon". — [redact.tools](https://www.redact.tools/)
- No Danish tool with CPR detection for AI prompts was found in Danish-language searches. Cloak and Privatiser list SSN and IBAN but not CPR. — [AMO Privatiser (nb-NO)](https://addons.mozilla.org/nb-NO/firefox/addon/privatiser/); [Cloak mirror](https://firefox.marketplace.browsertotal.com/sv-SE/firefox/addon/cloak-auto-anonymize-chatgpt/)
- None of the six Chrome extensions compared in the PiiBlocker blog state supported languages. ChatWall has a "European/GDPR focus" but no language list. — [PiiBlocker blog, 2026-10-02](https://piiblock.pages.dev/blog/best-pii-masking-chrome-extensions-ai-chatbots)
- Norwegian guidance stresses anonymising *before* pasting. Lavli: "Skriv aldri «anonymiser dette» i KI-verktøyet. Da har du allerede sendt personopplysningene." It also notes that age + city + job title can identify someone. — [lavli.no](https://lavli.no/blogg/6-rad-om-ki-bruk). Pseudonymised data is still personal data. — [Draftit](https://draftit.no/blogg/pseudonymisering-anonymisering-bruk-av-personopplysninger); [ki.norge.no](https://ki.norge.no/veiledning/gjor-dataene-ki-klare/forsta-behandling-av-sensitive-personopplysninger/anonymisere-og-pseudonymisere)
- A Swedish VAKTA article warns that masked data generally remains personal data for the AI provider too, citing draft EDPB anonymisation guidelines. — [ai-sovereign.eu (VAKTA)](https://ai-sovereign.eu/blog/racker-det-att-maska-personuppgifter-innan-ai-modellen-far-fragan.html)

### Inferences
- For Norwegian small organisations, Ghost Agent's likely strongest edge over the indie extensions is fødselsnummer and D-nummer (presumably checksum-validated), Norwegian bank account numbers, Norwegian-language name NER, and health, education and courts vocabularies. NorwAI Shield matches the identifiers but, on its public pages, lacks placeholder/restore, rephrase and domain lists.
- Presidio-based tools would need custom Norwegian recognisers, so no off-the-shelf Presidio app covers Norway today.
- Lavli's point that quasi-identifiers can re-identify someone supports the value of Ghost Agent's Rephrase over pure regex masking.

### Gaps
- I could not confirm whether NorwAI Shield validates fødselsnummer checksums or handles names (NER).
- No Finnish or Danish AI-prompt anonymiser startups were found.
- Searches of Nordic tech press (Digi.no, Kode24, Shifter, Computerworld Norge) returned no coverage of AI-prompt anonymisation tools. Absence of evidence only; site-specific searches returned nothing.

## Which AI sites each tool works on

### Takeaway
Most extensions cover ChatGPT, Claude and Gemini, and many add Copilot, Grok, DeepSeek and Perplexity. A few are still ChatGPT-only (redact.tools, Privacy Protector) or ChatGPT + DeepSeek (Caviard's official framing). Nearly all are listed only on the Chrome Web Store and/or Firefox. None besides Paste Redactor (a general clipboard tool) was found on the Opera add-ons store, and none states Opera support.

### Cited Findings
- **Caviard**: ChatGPT and DeepSeek are named on the site. — [caviard.ai](https://www.caviard.ai/). Claude and Gemini are also named in newer listings. — [PiiBlocker blog](https://piiblock.pages.dev/blog/best-pii-masking-chrome-extensions-ai-chatbots); [extscope](https://www.extscope.org/extension/ncdaondhpapnhbeadnbcgpfmknhcoafh). Chrome only. — [PiiBlocker blog](https://piiblock.pages.dev/blog/best-pii-masking-chrome-extensions-ai-chatbots)
- **PrivacyScrubber**: ChatGPT, Claude, Gemini, DeepSeek, Grok, Copilot, Perplexity, Kimi, Qwen, Zendesk and "+6 more". — [privacyscrubber.com](https://privacyscrubber.com/). The PiiBlocker blog counts 12 sites including Notion, Slack and Zendesk. — [PiiBlocker blog](https://piiblock.pages.dev/blog/best-pii-masking-chrome-extensions-ai-chatbots)
- **PiiBlocker**: ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek, Kimi; not the ChatGPT desktop or mobile apps. — [PiiBlocker blog](https://piiblock.pages.dev/blog/best-pii-masking-chrome-extensions-ai-chatbots)
- **ChatWall**: chatgpt.com, gemini, claude.ai, grok, x.com, Copilot, DeepSeek. — [AMO](https://addons.mozilla.org/en-US/firefox/addon/chatwall/)
- **DFKI Privacy Guardrail**: ChatGPT, Claude, Gemini only; no custom sites in the beta. — [GitHub](https://github.com/dfki-dsa/pii-guardrail-browser-extension/)
- **Privatiser**: ChatGPT, Claude, Gemini, Copilot (permissions also include Grok, Perplexity, DeepSeek, Mistral). — [AMO](https://addons.mozilla.org/en-US/firefox/addon/privatiser/)
- **redact.tools**: ChatGPT only; others "coming soon". — [redact.tools](https://www.redact.tools/)
- **NorwAI Shield**: 30+ sites including ChatGPT, Claude, Gemini/AI Studio, Copilot, Perplexity, Mistral Le Chat, DeepSeek, Grok, Meta AI, Notion, Cursor, Replit. Browsers: Chrome, Firefox, Edge; Opera not listed. — [AMO](https://addons.mozilla.org/en-US/firefox/addon/norwai-shield/); [norwaishield.no](https://norwaishield.no/)
- **Strac**: ChatGPT, Claude, Gmail and more; Chrome, Edge, Safari, Firefox. — [strac.io](https://www.strac.io/integrations/chatgpt-dlp)
- **Wald**: ChatGPT, Gemini, Claude, Grok inside its own platform. — [Wald pricing](https://app.wald.ai/pricing)
- **Opera add-ons store**: the only relevant listing found was Paste Redactor (Gmail, Slack, ChatGPT, Gemini). — [Opera add-ons](https://addons.opera.com/fr/extensions/details/paste-redactor-clipboard-pii-redaction)

### Inferences
- An Opera-store listing would face almost no direct competition today, though Opera users can install Chrome Web Store extensions, which reduces that advantage.
- Ghost Agent should match the de facto baseline of ChatGPT, Claude, Gemini, Copilot and Mistral Le Chat (a likely EU preference) to look complete next to competitors.

### Gaps
- Microsoft Edge Add-ons listings were not checked.
- Whether Chrome-store extensions run correctly in Opera was not verified (would require installing).

## Strengths and weaknesses vs Ghost Agent; who does local detection + placeholder + restore?

### Takeaway
Many tools do local detection + placeholder + restore. The closest structural matches are Caviard, PrivacyScrubber, ChatWall, PiiBlocker and DFKI Privacy Guardrail (all generic and English-centric), and Maskera (the Swedish analogue). None found combines all of: as-you-type underlining, Nordic identifiers, domain vocabularies, a local-LLM rephrase, and zero telemetry. NorwAI Shield is the main Norwegian rival for organisations, but it is a policy/DLP product (block, warn, anonymise, central dashboard), not a personal placeholder + restore assistant.

### Cited Findings
- **Local + placeholder + restore confirmed in the vendor's or project's own text**:
  - Caviard (Alt+R toggle) — [caviard.ai](https://www.caviard.ai/)
  - PrivacyScrubber (Reverse Reveal) — [privacyscrubber.com](https://privacyscrubber.com/)
  - ChatWall ([EMAIL_1] restored on screen) — [AMO](https://addons.mozilla.org/en-US/firefox/addon/chatwall/)
  - DFKI Privacy Guardrail ([PERSON_1], restored and highlighted) — [GitHub](https://github.com/dfki-dsa/pii-guardrail-browser-extension/)
  - Privatiser (restore via clipboard) — [AMO](https://addons.mozilla.org/en-US/firefox/addon/privatiser/)
  - Maskera (local restore) — [maskera.dev](https://maskera.dev/)
  - Rescriber (local mappings) — [privacy policy](https://peach-research-lab.github.io/Rescriber/privacy.html)
  - PasteSecure (Vault tokens) — [CWS snippet](https://chromewebstore.google.com/detail/pastesecure-%E2%80%93-pii-redacti/ebolpbgeaeammpddffibagpobicfnhoc)
  - Private Guard — [CWS snippet](https://chromewebstore.google.com/detail/private-guard-%E2%80%94-pii-redac/jjkghegjofelkblppppihfacdoemjban)
  - PiiBlocker — [PiiBlocker blog](https://piiblock.pages.dev/blog/best-pii-masking-chrome-extensions-ai-chatbots)
  - Cloak — [mirror](https://firefox.marketplace.browsertotal.com/sv-SE/firefox/addon/cloak-auto-anonymize-chatgpt/)
- **Developer-side equivalents**: LLM Guard Anonymize/Vault/Deanonymize — [docs](https://protectai.github.io/llm-guard/output_scanners/deanonymize); PasteGuard, PrivAiTe and prompt-anonymizer proxies — see links above.
- **Known weakness shared by restore tools**: restoration breaks when the model rewrites placeholders. — [DFKI README](https://github.com/dfki-dsa/pii-guardrail-browser-extension/)
- **Paste-only triggers**: DFKI intercepts paste events. — [GitHub](https://github.com/dfki-dsa/pii-guardrail-browser-extension/). Privatiser acts on paste. — [AMO](https://addons.mozilla.org/en-US/firefox/addon/privatiser/). Presidio Browser Anonymizer triggers on paste. — [GitHub snippet](https://github.com/gacabartosz/presidio-local-anonymizer). PasteSecure and PiiBlocker work as you type. — [CWS snippets](https://chromewebstore.google.com/detail/pastesecure-%E2%80%93-pii-redacti/ebolpbgeaeammpddffibagpobicfnhoc)
- **Rephrase-like features**: Rescriber "abstract" — [arXiv](https://arxiv.org/html/2410.11876v3); Wald "inflection" reframes prompts — [wald.ai/private-gpt](https://wald.ai/private-gpt)
- **Trust signals**: open-source or source-available options are DFKI (Apache-2.0), Privatiser (MIT), Cloak (MPL-2.0), Maskera, and ChatWall ("source available"). NorwAI Shield is "All Rights Reserved" with a Supabase endpoint in its permissions. — [AMO NorwAI](https://addons.mozilla.org/en-US/firefox/addon/norwai-shield/)
- **Compliance positioning**: several tools explicitly disclaim compliance. DFKI: "not a compliance or DLP product". Maskera: "not a compliance guarantee". Paste Redactor: "not a complete privacy solution". — [DFKI](https://github.com/dfki-dsa/pii-guardrail-browser-extension/); [maskera GitHub](https://github.com/joelhagvall/maskera); [Opera add-ons](https://addons.opera.com/fr/extensions/details/paste-redactor-clipboard-pii-redaction)

### Per-competitor strengths/weaknesses vs Ghost Agent

| Tool | Closer to Ghost Agent in | Weaker than Ghost Agent in | Stronger than Ghost Agent in |
|---|---|---|---|
| **NorwAI Shield** (NO) | Norwegian IDs incl. D-nummer; local extension; 30+ sites | No placeholder/restore or rephrase stated; dashboard/telemetry; 0 Firefox users; no Opera | Admin policy, central reporting, Gateway/agent proxy, published NOK pricing, Free tier ≤3 users |
| **Sladd** (NO) | Norwegian, fødselsnummer, health-adjacent use, fully local | Web app, not in-chat; no restore; health marked by hand (blog) | PDF/image redaction; founder domain credibility (verge, mental health) |
| **Maskera** (SE) | Local NER + placeholders + local restore; Nordic language model; open source | Swedish only; ChatGPT named only; form factor unclear | Ships an in-browser Swedish NER (no Python engine needed); company self-host option |
| **Caviard** (CH) | Local, consistent placeholders, restore toggle, masks responses | Chrome only; regex-based (per competitor blog); no Nordic; tiny real usage | Very cheap ($4/mo, $19 lifetime); format-preserving fakes |
| **PrivacyScrubber** | Typed tokens [NAME_1], local restore, many sites | No Nordic; English-centric | OCR on screenshots and PDFs; Teams $99 flat unlimited seats; SDK |
| **ChatWall** | [EMAIL_1] placeholders + on-screen restore; EU/GDPR framing | Restores in a separate window (per competitor blog); no Nordic IDs | Firefox + Chrome; device-pack pricing |
| **DFKI Privacy Guardrail** | Local NER + placeholders + in-page restore; research credibility | Paste-only; 3 sites; beta | Fully in-browser WASM/ONNX; Apache-2.0 |
| **Rescriber** | User-led "abstract" ≈ Rephrase; local detection | Research prototype | Peer-reviewed (CHI '25) usability evidence |
| **Wald.ai** | Sanitise + reinsert + reframe | Cloud platform, $19.99/user/mo, US-centric | SOC2, multi-model access, admin/audit |
| **Strac / GPTGuard / Private AI** | Detect/redact/block | Enterprise sales; cloud or self-host infrastructure; not small-org friendly | Broad detector catalogues, OCR, compliance tooling |

### Inferences
- The defensible gap for Ghost Agent: a **Norwegian-first, single-user, zero-telemetry** in-chat assistant combining as-you-type underlining with Hide, Rephrase and Restore, plus Nordic identifiers and sector vocabularies (helse, skole, domstol). NorwAI Shield owns the "admin/DLP for Norwegian businesses" framing; the indie extensions own "cheap generic masking".
- Biggest risks: (1) NorwAI Shield adding placeholder/restore. (2) Maskera extending to Norwegian; its architecture, a Nordic NER model in the browser, already fits. (3) Install friction from Ghost Agent's local Python engine compared with pure in-browser competitors.
- Positioning should avoid "GDPR compliance" claims. Norwegian and Swedish guidance (Lavli, Draftit, VAKTA) stresses that pseudonymised data is still personal data, and peer tools carefully disclaim compliance.

### Gaps
- NorwAI Shield's actual behaviour behind "anonymiser" (placeholder? restore?) is unverified without installing.
- Restore quality (handling of model rewrites) cannot be compared without hands-on testing, which was out of scope.
