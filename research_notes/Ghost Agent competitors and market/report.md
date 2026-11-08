# Ghost Agent fills the gap enterprise DLP leaves

Ghost Agent's competitors fall into four groups, and none of them sits exactly where Ghost Agent sits. **Enterprise "AI DLP" vendors** (Microsoft Purview, Google Chrome Enterprise Premium, Zscaler, Netskope, Palo Alto, Nightfall, Harmonic, Strac and others) mostly *block or warn*. They inspect in their own cloud or need managed devices, and they sell through sales-led contracts to organisations that have a security team. **A crowd of small browser extensions** (Caviard, PrivacyScrubber, ChatWall, PiiBlocker, the open-source DFKI Privacy Guardrail) already ships Ghost Agent's core trick: detect locally, swap values for typed placeholders like `[PERSON_1]`, restore them in the answer. That mechanic alone no longer sets Ghost Agent apart. But none of these extensions detects fødselsnummer or D-nummer, and their verifiable user bases are tens to a few hundred. **The only Norwegian rival, NorwAI Shield**, has the Norwegian identifiers, but it is an admin-led policy product (block, warn or anonymise, with a central dashboard) and its pages mention no placeholder-restore or rephrase. Ghost Agent's defensible gap is the *combination* of five things: Norwegian identifiers, sector word lists, a local-LLM Rephrase (only an academic prototype and a US cloud service offer anything similar), zero telemetry, and no admin needed. The market is real but unmeasured for this segment. Analyst figures for "AI prompt security" (about USD 2B in 2025) are enterprise-weighted and paywalled, and the behavioural data comes from vendor telemetry on US and UK enterprises. The strongest Norwegian evidence is a usage gap: **54% of Norwegian adults used generative AI in 2025, but only 3 in 10 firms with 10+ staff did**. On top of that, Digdir/KS, Udir, Helse Sør-Øst, the GPs' association and audit bodies all repeat one rule: don't put personal or confidential data into general AI chats. The recommendation is to position Ghost Agent as "follow the guidance without giving up the tool" for professionals bound by secrecy, to enter through solo and small health and legal practices, and to price below a password manager: a free personal tier, a flat per-practice plan, and a per-municipality licence that comes with a Norwegian DPIA pack.

*How to read this report.* Every sourced fact carries an inline link. Sentences marked **(inference)** are my reasoning, not something a source says. A **vendor figure** comes from a company that sells AI-DLP and benefits from the problem looking large. A **competitor source** is a rival's blog describing another vendor. Three terms recur. **DLP** (data loss prevention) is software that spots sensitive data leaving an organisation and blocks or logs it. **TLS inspection** means routing all web traffic through a vendor proxy that decrypts it so it can read prompts. **MDM** (mobile device management, such as Intune or Jamf) is how an IT team pushes software and policy onto staff computers.

## Enterprise AI-DLP blocks prompts and assumes an IT department

The big vendors use three architectures:

- **Browser extensions plus endpoint agents:** Strac, Harmonic, Prompt Security, LayerX, Nightfall.
- **Cloud proxies with TLS inspection:** Zscaler, Netskope, Palo Alto Prisma Access, Cloudflare Gateway.
- **Managed browsers:** Island, Chrome Enterprise Premium, Prisma Browser, Edge for Business with Purview.

Only Strac ("detection runs locally in the browser") and Harmonic (small language models that "sit on the endpoint") claim local detection ([Strac](https://www.strac.io/ai-governance); [Harmonic](https://www.harmonic.security/solutions/genai-compliance-regulated-industries)). Both still send events to a cloud admin console. Menlo, by contrast, sends files to the Menlo Cloud for masking and can keep the originals there ([Menlo](https://www.menlosecurity.com/product/ai-adaptive-dlp)). **No enterprise vendor found markets "nothing leaves the machine"** (inference from the absence of such a claim in every source reviewed).

What these products *do* to a prompt is mostly negative: block, warn ("coach") or log. Microsoft Purview blocks typed prompts with sensitive data in consumer ChatGPT, Gemini, DeepSeek and others. It does so only in Edge for Business on Intune-managed Windows 10/11 ([Microsoft Learn](https://learn.microsoft.com/en-us/purview/deploymentmodels/depmod-data-leak-shadow-ai-step3)). Chrome Enterprise Premium blocks or warns only in managed Chrome ([Chrome Enterprise](https://chromeenterprise.google/products/chrome-enterprise-premium/)). Some vendors redact so the user can still send a cleaned prompt: Prompt Security, Harmonic, Strac (a "Warn & Allow" mode with a redacted preview), Menlo, Island, and Netskope through a newer masking option ([AppSecSanta](https://appsecsanta.com/prompt-security); [Strac](https://www.strac.io/ai-governance); [Netskope community](https://community.netskope.com/inside-netskope-22/securing-saas-and-genai-without-saying-no-8705)). **No source showed numbered, reversible placeholders, restoring values in the AI's answer, or local-LLM rephrasing from any enterprise vendor.** One useful data point backs Ghost Agent's "underline, don't block" design: in Netskope's data, **73% of users stop after a coaching prompt** ([Netskope GenAI 2025](https://www.netskope.com/resources/cloud-and-threat-reports/cloud-and-threat-report-generative-ai-2025), vendor figure).

Pricing shows who these products are built for. Only a few vendors publish anything:

- **Google:** Chrome Enterprise Premium at **USD 6/user/month** list price ([Chrome Enterprise](https://chromeenterprise.google/download/)).
- **Microsoft:** a Purview Suite add-on for Business Premium reported at **USD 10/user/month** for up to 300 seats ([Minerva](https://blog.minerva-ia.com/en/blog/m0vaya6g); [dope.security](https://dope.security/post/microsoft-purview-pricing-2026), competitor source). On top of that, Edge inline protection of typed text is billed pay-as-you-go through an "In Transit Protection" meter ([Microsoft Learn](https://learn.microsoft.com/sv-se/purview/purview-billing-models)).
- **Cloudflare:** Zero Trust is free for up to 50 seats ([Cloudflare](https://blog.cloudflare.com/zero-trust-ai-security/)), but it needs a client, a gateway and TLS inspection.
- **Strac:** a benchmark of **USD 30–50 per user per year** for a "typical mid-market deployment", quoted after a sales call ([Strac](https://www.strac.io/ai-governance), vendor figure).

Everyone else is "contact sales". Nightfall describes its buyers as **250 to 100,000+ users** ([Nightfall](https://www.nightfall.ai/pricing)). Third-party estimates put the cloud-proxy (SASE) platforms at roughly USD 80–200/user/year for Zscaler and USD 50–98/user/year for Netskope ([dope.security](https://dope.security/post/zscaler-pricing-2026), competitor source; [UnderDefense](https://underdefense.com/blog/netskope-pricing-guide/)). **(Inference)** For a 20-person clinic that already has the right Microsoft or Google stack, rough annual costs would be:

| Option | Approx. per year |
|---|---|
| Chrome Enterprise Premium | ~USD 1,440 |
| Purview Suite add-on | ~USD 2,400, plus metered Edge charges |
| Strac | ~USD 600–1,000, if no sales minimum applies |

Each of these assumes someone who can configure policies, which the clinic does not have.

Norwegian support is thin. **Microsoft Purview has a built-in "Norway identification number" detector.** It matches the 11-digit fødselsnummer, validates the checksum, and raises confidence when a keyword appears within 300 characters ([Microsoft Learn](https://learn.microsoft.com/en-us/purview/sit-defn-norway-identification-number)). Google's DLP library has `NORWAY_NI_NUMBER` ([Google SDP](https://docs.cloud.google.com/sensitive-data-protection/docs/infotypes-reference)). **No enterprise vendor documents D-nummer, Norwegian kontonummer (MOD11) or Norwegian-language health terms.** Whether Microsoft's date check rejects D-numbers is unverified. A D-nummer adds 4 to the first digit, so a plain date check could fail it (inference).

The market is consolidating upward. SentinelOne bought Prompt Security in 2025 (reported at USD 180–250M; sources conflict) ([Calcalist](https://www.calcalistech.com/ctechnews/article/im5ma59bu)). Check Point bought Lakera in September 2025 ([Infosecurity Magazine](https://www.infosecurity-magazine.com/news-features/cybersecurity-ma-crowdstrike/)). Akamai agreed to buy LayerX for about **USD 205M** in May 2026; LayerX expected only about USD 10M of 2026 recurring revenue ([SecurityWeek](https://www.securityweek.com/akamai-to-acquire-ai-and-browser-security-firm-layerx-for-205-million/)). The independents raised large rounds: Harmonic USD 50M in October 2026 with 100+ enterprise customers ([Unite.ai](https://www.unite.ai/harmonic-security-raises-50m-series-b-to-expand-us-and-uk-teams/)), Island USD 250M at about USD 4.8B ([SecurityWeek](https://www.securityweek.com/island-banks-250m-series-e-for-enterprise-browser/)), and Cyberhaven USD 100M at over USD 1B ([Cyberhaven](https://www.cyberhaven.com/press-releases/cyberhaven-raises-100-million-series-d-at-1-billion-valuation)). **(Inference)** Folding into large platforms pushes these roadmaps further toward big-enterprise bundles. The no-IT segment stays underserved, and Harmonic is expanding in the US and UK, not the Nordics.

## A dozen small tools already hide and restore, but none speaks Norwegian

Ghost Agent's Hide-plus-Restore mechanic is crowded. At least ten consumer or prosumer tools detect locally, swap in placeholders and restore in the reply:

- **Caviard** keeps one placeholder per value for the session and toggles back with Alt+R ([Caviard](https://www.caviard.ai/)).
- **PrivacyScrubber** uses `[NAME_1]`-style tokens, a "Reverse Reveal" and on-device OCR ([PrivacyScrubber](https://privacyscrubber.com/)).
- **ChatWall** turns an email into `[EMAIL_1]` and restores the AI's reply on screen ([AMO](https://addons.mozilla.org/en-US/firefox/addon/chatwall/)).
- **PiiBlocker** highlights PII as you type and restores in the chat box ([PiiBlocker blog](https://piiblock.pages.dev/blog/best-pii-masking-chrome-extensions-ai-chatbots), competitor source).
- **PasteSecure**, **Private Guard**, **Privatiser**, **Cloak** and **DFKI Privacy Guardrail** do versions of the same ([GitHub DFKI](https://github.com/dfki-dsa/pii-guardrail-browser-extension/); [AMO Privatiser](https://addons.mozilla.org/en-US/firefox/addon/privatiser/)).

Several trigger only on paste (DFKI, Privatiser, Presidio Browser Anonymizer). PiiBlocker and PasteSecure claim to work as you type, so **underlining while typing narrows the field but is not unique on its own** ([PasteSecure listing](https://chromewebstore.google.com/detail/pastesecure-%E2%80%93-pii-redacti/ebolpbgeaeammpddffibagpobicfnhoc)). Ghost Agent's Restore will share a known weakness: DFKI warns that restoration "may not handle every response rewrite" when the model rewords placeholders ([DFKI](https://github.com/dfki-dsa/pii-guardrail-browser-extension/)).

**Rephrase is the rare feature.** Only two products found do anything like it. **Rescriber** is a peer-reviewed CHI '25 research prototype that lets users *redact or abstract* disclosures ([arXiv](https://arxiv.org/html/2410.11876v3)). **Wald.ai** offers a cloud-side "inflection" that "reframes prompts to maintain privacy while preserving their intent", at USD 19.99/user/month inside its own chat platform ([Wald](https://wald.ai/private-gpt); [Wald pricing](https://app.wald.ai/pricing)). Rephrase matters because masking leaves quasi-identifiers in place: the Norwegian vendor Lavli notes that age + city + job title can identify a person ([Lavli](https://lavli.no/blogg/6-rad-om-ki-bruk)). A local LLM that rewrites "a 47-year-old physiotherapist in Florø" into "a middle-aged health worker in a small town" covers that gap. Placeholders cannot.

Traction across this niche is tiny, and the money is weaker still:

- **Caviard** claims "50K+" users, but its Chrome listing showed **342 users** in October 2026 (competitor-reported count). A Stripe-verified profile shows **USD 74 in all-time revenue** ([TrustMRR](https://trustmrr.com/startup/caviard-ai); [PiiBlocker blog](https://piiblock.pages.dev/blog/best-pii-masking-chrome-extensions-ai-chatbots)).
- **PrivacyScrubber** had 99 Chrome users, **ChatWall** 105, and **PiiBlocker** self-reports 492 (same competitor source).

Prices cluster at free to USD 4–15/month or a lifetime licence:

| Tool | Pricing |
|---|---|
| Caviard | USD 4/month, USD 19 lifetime |
| PrivacyScrubber | Pro USD 15/month, Teams USD 99/month flat for unlimited seats |
| PiiBlocker | USD 6.99/seat/month enterprise tier |
| ChatWall | from USD 19/month for 10 devices |

Sources: [PrivacyScrubber](https://privacyscrubber.com/); [PiiBlocker blog](https://piiblock.pages.dev/blog/best-pii-masking-chrome-extensions-ai-chatbots). **(Inference)** Consumers do not pay much for this. The paying buyer is the professional or the practice.

None of these tools names a Nordic identifier. The open-source engines most builders reach for are no better:

- **Microsoft Presidio** ships Swedish and Finnish recognisers but "no entities" for Norway or Denmark ([Presidio](https://presidio.dataprivacystack.org/supported_entities/)).
- **LLM Guard**'s anonymiser is "English-specific" (plus Chinese) ([LLM Guard](https://protectai.github.io/llm-guard/input_scanners/anonymize)), and one source says active development stopped after May 2025 ([AppSecSanta](https://appsecsanta.com/llm-guard)).

Architecturally, the closest match to Ghost Agent is a community **Presidio Browser Anonymizer**: a Chrome extension backed by a locally run Flask/Presidio server ([GitHub](https://github.com/gacabartosz/presidio-local-anonymizer)). In April 2026 OpenAI released **Privacy Filter**, an open-weight local model for masking personal data ([AlternativeTo](https://alternativeto.net/news/2026/4/openai-releases-privacy-filter-a-local-open-weight-model-built-for-personal-data-masking/)). That commoditises generic PII detection for everyone, including Ghost Agent.

The Nordic players are few:

- **NorwAI Shield** (Norway) is the one direct rival for organisations. It is a browser extension plus agent proxy plus gateway with an admin dashboard. It detects fødselsnummer, D-nummer, cards, IBAN, bank accounts, passports, org numbers and more, and the admin picks block, warn, anonymise or allow per data type ([NorwAI Shield](https://norwaishield.no/)). It publishes Norwegian prices: **Free** for up to 3 users with no blocking, **Team 990 kr/month + 59 kr/user**, and **Business 2,490 kr/month + 99 kr/user**. Its Firefox listing had **0 users**, and Opera is not listed ([AMO](https://addons.mozilla.org/en-US/firefox/addon/norwai-shield/)). A third-party summary says it sends trigger metadata (data type, platform, action, device ID) to a Supabase backend. That is unverified ([BrowserTotal mirror](https://firefox.marketplace.browsertotal.com/sv-SE/firefox/addon/norwai-shield/privacy/)).
- **Sladd** (Kristiansand) is a local web app for redacting documents, not an in-chat tool. It finds fødselsnummer and names, and its own blog says health information is marked by hand ([Sladd](https://sladd.no/); [Sladd blog](https://sladd.no/blogg/personopplysninger-i-chatgpt)).
- **Maskera** (Stockholm) is the closest Nordic analogue in mechanism: an open-source Swedish NER model running in the browser, with placeholders and local restore. It covers Swedish only ([Maskera](https://maskera.dev/)).
- **PrivatAI** and **Bineric/Norsk AI** take a different approach: they replace ChatGPT with Norway- or EU-hosted chat rather than guarding the public tools ([PrivatAI](https://privatai.no/); [norskgpt.com](https://norskgpt.com/)).

On the Opera add-ons store, the only relevant listing found was a general clipboard redactor ([Opera add-ons](https://addons.opera.com/fr/extensions/details/paste-redactor-clipboard-pii-redaction)).

## The competitor map: who does what to the prompt

Legend: **V** = vendor claim, **3P** = third-party estimate, **C** = competitor source, **(inf.)** = inference. "Restore" means real values come back in the AI's answer on the user's screen.

| Competitor | Group | Target | Deployment | What it does to the prompt | Pricing (date) | Norwegian support | Strengths vs Ghost Agent | Weaknesses vs Ghost Agent |
|---|---|---|---|---|---|---|---|---|
| **Ghost Agent** (reference) | — | Small orgs, individuals; NO first | Local extension + local Python engine; nothing leaves the machine | Underline as you type → Hide (typed placeholders), Rephrase (local Gemma), Ignore; Restore on screen | TBD | fødselsnummer, D-nummer, account, IBAN, names (GLiNER), health/school/court/industrial/religious lists | — | — |
| [Microsoft Purview + Edge for Business](https://learn.microsoft.com/en-us/purview/deploymentmodels/depmod-data-leak-shadow-ai-step3) | Enterprise | M365 orgs with Intune | Managed Edge on Intune Windows; Microsoft-managed policy | Block / block with override; audit | ~USD 10/user/mo add-on (C, 2026) + metered Edge charges | fødselsnummer with checksum; D-nummer unverified | Often partly licensed already; central policy and audit; desktop and file coverage | Managed Edge only; blocks rather than helps; Claude reportedly not covered (C); needs admin |
| [Google Chrome Enterprise Premium](https://chromeenterprise.google/products/chrome-enterprise-premium/) | Enterprise | Chrome/Workspace orgs | Managed Chrome; Google cloud policy | Block / warn | USD 6/user/mo list | `NORWAY_NI_NUMBER` in Google DLP library | Cheap, published price | Managed Chrome only; no placeholders or rephrase |
| [Cloudflare Zero Trust](https://blog.cloudflare.com/zero-trust-ai-security/) | Enterprise (free tier) | Any size with IT skills | Cloud proxy, TLS inspection, client | Block on DLP or AI-topic match | Free ≤50 seats | Not documented | Free; AI prompt topic detection | Needs proxy, certificates, IT setup |
| [Zscaler](https://www.zscaler.com/resources/data-sheets/zscaler-gen-ai-security-at-a-glance.pdf) / [Netskope](https://www.netskope.com/products/data-loss-prevention) / [Palo Alto](https://www.paloaltonetworks.com/sase/prisma-browser) | Enterprise SASE | Large enterprises | Cloud proxy with TLS inspection; Prisma managed browser | Block, coach, isolate; Netskope newer masking | Contact sales; ~USD 50–200/user/yr (3P/C) | Not confirmed | Full web, SaaS and file coverage | Price, complexity, vendor cloud inspection |
| [Nightfall](https://www.nightfall.ai/pricing) | Enterprise | 250–100,000+ users | Endpoint agent + browser | Block prompts and uploads | Contact sales; ~USD 5–15k/yr small deals ([3P](https://www.vendr.com/marketplace/nightfall)) | Not documented | Desktop AI apps, code tools, MCP | Not for small orgs; no free tier |
| [Harmonic](https://www.harmonic.security/products/guide) | Enterprise | 100+ enterprises | Extension + endpoint small models; cloud console | Log, warn, coach, block; redact (V) | Contact sales | Not stated; EU hosting on request | Context-aware detection <200 ms (V) | Enterprise sales; no Nordic focus |
| [Prompt Security / SentinelOne](https://appsecsanta.com/prompt-security) | Enterprise | Enterprises | Extension + agent; cloud | Block, redact, coach | Not public | Not documented | 15,000+ AI sites (V) | Inside SentinelOne platform |
| [Strac](https://www.strac.io/ai-governance) | Mid-market | Mid-market, regulated | Extension, local detection (V); cloud console | Block; warn with redacted preview; audit | USD 30–50/user/yr (V, Nov 2026) | 100+ types, no country IDs | Lowest enterprise benchmark; 4 browsers; OCR | Sales call; no Nordic IDs; no restore or rephrase |
| [Island](https://www.securityweek.com/island-banks-250m-series-e-for-enterprise-browser/) / [Menlo](https://www.menlosecurity.com/product/ai-adaptive-dlp) / [LayerX](https://www.securityweek.com/akamai-to-acquire-ai-and-browser-security-firm-layerx-for-205-million/) | Enterprise browser security | Enterprises | Replacement browser (Island); extension + Menlo cloud | Redact (Island), mask in cloud (Menlo), block | Contact sales | Not documented | Last-mile controls, BYOD | Replace browser or cloud inspection; enterprise contracts |
| [NorwAI Shield](https://norwaishield.no/) | Nordic | Norwegian businesses ≤250 users | Local extension + agent proxy + gateway; dashboard gets metadata | Admin picks block / warn / anonymise / allow per type; restore not mentioned | Free ≤3 users (no blocking); 990 kr/mo + 59 kr/user; 2,490 kr/mo + 99 kr/user | fødselsnummer, D-nummer, bank, IBAN, org nr | Admin policy, reporting, NOK pricing, 30+ sites | No stated placeholder-restore or rephrase; telemetry; 0 Firefox users; no Opera |
| [Sladd](https://sladd.no/) | Nordic | Case handlers, guardians, public sector | Local web app, downloads model | Redact documents; no restore | "Free to try"; price not found | fødselsnummer, names; health marked by hand | PDF and image redaction | Not in-chat |
| [Maskera](https://maskera.dev/) | Nordic / open source | Swedish users and companies | In-browser Swedish NER; self-hosted company version | Placeholder + local restore | Not found | Swedish only | No Python engine needed; open source | No Norwegian; could add it (inf.) |
| [Caviard](https://www.caviard.ai/) | SMB/consumer | Individuals | Local, Chrome | Placeholder + restore toggle; masks responses | Free / USD 4 mo / USD 19 lifetime | None | Very cheap | 342 Chrome users (C); no Nordic |
| [PrivacyScrubber](https://privacyscrubber.com/) | SMB/consumer | Individuals, teams | Local (V), Chrome + web app | Typed tokens + Reverse Reveal; OCR | Free / USD 15 mo / Teams USD 99 mo flat | None | OCR; many sites; flat team price | English-centric |
| [ChatWall](https://addons.mozilla.org/en-US/firefox/addon/chatwall/) | SMB/consumer | Individuals, EU/GDPR framing | Local (V), Chrome + Firefox | `[EMAIL_1]` placeholder + restore | From USD 19/mo per 10 devices (C) | None | Source-available | No Nordic IDs |
| [PiiBlocker](https://piiblock.pages.dev/blog/best-pii-masking-chrome-extensions-ai-chatbots) | SMB/consumer | Individuals, SMB | Local claim, contested | Highlight as you type, confirm, mask, restore | Free; USD 6.99/seat/mo | None | As-you-type; GPO/MDM deploy | Local claim contradicted by its own page |
| [Wald.ai](https://wald.ai/private-gpt) | SMB/business | Regulated orgs (55+, V) | Own cloud chat platform | Sanitise, reinsert, "inflection" rephrase | USD 19.99/user/mo | None | Only commercial rephrase; SOC2 | Cloud; replaces ChatGPT UI; US-centric |
| [DFKI Privacy Guardrail](https://github.com/dfki-dsa/pii-guardrail-browser-extension/) | Open source | Researchers, individuals | In-browser WASM + ONNX | Paste-only; `[PERSON_1]` + restore | Free, Apache-2.0 | Multilingual NER; no Nordic IDs | Fully in-browser; credible lab | Beta; 3 sites; paste-only |
| [Rescriber](https://arxiv.org/html/2410.11876v3) | Open source / research | Individuals | In-browser detection | Redact or **abstract** (rephrase-like) | Free | None | Peer-reviewed usability | Research prototype |
| [Presidio](https://presidio.dataprivacystack.org/supported_entities/) / [LLM Guard](https://protectai.github.io/llm-guard/output_scanners/deanonymize) | Open-source engines | Developers | Local library | Anonymise + deanonymise | Free | None for Norway | Building blocks anyone can reuse | No Norwegian; LLM Guard stalled |

## Market figures are large, enterprise-weighted and mostly vendor-made

**No analyst publishes a "GenAI DLP for small business" segment, and no source gives an SMB share of any DLP-type market.** The nearest published segments disagree with each other by 2–5x, and all sit behind paywalls with opaque methods.

| Segment | Size | Growth | Source and date | Caveat |
|---|---|---|---|---|
| AI prompt security (narrowest) | **USD 1.98B (2025) → 5.87B (2029)** | 31.2% CAGR | [Business Research Co., 7 Jan 2026](https://www.globenewswire.com/news-release/2026/01/07/3214674/0/en/p.html) | Paywalled; method opaque |
| AI TRiSM (trust, risk and security management) | USD 2.34B (2024) / 2.80B (2025) → 7.44B (2030) | 21.6% CAGR | [Grand View via GlobeNewswire, 21 May 2025](https://www.globenewswire.com/news-release/2025/05/21/3085951/28124/en/AI-Trust-Risk-and-Security-Management-Trends-Analysis-and-Growth-Forecasts-2025-2030-Market-to-Reach-7-44-Billion-Generative-AI-Foundation-Models-Spur-Demand-for-Advanced-AI-TRiSM-.html) | SME split exists but not public |
| Generative AI cybersecurity | USD 8.65B (2025) → 35.50B (2031) | 26.5% CAGR | [MarketsandMarkets, 25 Aug 2025](https://contentenginellc.com/2025/08/25/generative-ai-cybersecurity-market-worth-3550-billion-by-2031-marketsandmarketstm) | Mostly AI used *for* security; the 2024 edition said USD 40.1B by 2030 ([M&M](https://marketsandmarkets.com/PressReleases/generative-ai-cybersecurity.asp)), so the two editions disagree |
| Classic DLP | ~USD 2.6–3.1B (2024–25) | single to low double digits | [IMARC via GII](https://www.gii.tw/report/imarc1941601-data-loss-prevention-market-size-share-trends.html) | Large enterprises lead ([Market Research Forecast](https://www.marketresearchforecast.com/reports/data-loss-prevention-tools-25494)) |

**(Inference)** Use AI prompt security (about USD 2B) as the closest top-down figure. Treat it as an enterprise number, though, not Ghost Agent's addressable market. Even among Netskope's enterprise customers, only **50% use DLP for GenAI** ([Netskope 2026, 5 Jan 2026](https://threatlabs.netskope.com/reports/2026/cloud-and-threat-report-2026), vendor figure). Coverage among Nordic micro-organisations is almost certainly near zero, but no source measures it.

The evidence that people paste sensitive data into AI chats is consistent, but it comes almost entirely from vendors measuring their own US and UK enterprise customers, each with a broad definition of "sensitive" that includes source code:

- **Harmonic:** 8.5% of prompts in Q4 2024 ([Campus Technology, 22 Jan 2025](https://campustechnology.com/Articles/2025/01/22/Study-1-in-10-AI-Prompts-Could-Expose-Sensitive-Data.aspx)). Then 4.37% of prompts and 22% of files in Q2 2025 ([Business Wire, 31 Jul 2025](https://www.businesswire.com/news/home/20250731456105/en)). File uploads rose to 26.4% in Q3 2025 ([Business Wire, 13 Nov 2025](https://www.businesswire.com/news/home/20251113987633/en)).
- **Cyberhaven:** **34.8% of corporate data put into AI tools is sensitive**, up from 10.7% two years earlier ([Cyberhaven, 23 Apr 2025](https://cyberhaven.com/press-releases/cyberhaven-report-majority-of-corporate-ai-tools-present-critical-data-security-risks)).
- **LayerX:** 77% of AI users paste data into chatbots, 22% of those pastes contain PII or card data, and 82% of pastes come from unmanaged personal accounts ([The Register, 7 Oct 2025](https://theregister.com/2025/10/07/gen_ai_shadow_it_secrets)).
- **Netskope** (best proxy for Ghost Agent's focus): **regulated data (personal, financial, health) makes up 32% of GenAI policy violations**. Use of personal AI apps fell from 78% to 47% of users as managed accounts spread ([Netskope 2026](https://threatlabs.netskope.com/reports/2026/cloud-and-threat-report-2026)).

The most neutral sources point the same way. IBM/Ponemon found **20% of organisations had a breach involving shadow AI**, adding about USD 670k to average cost, and only 37% have AI governance policies ([TechRepublic on IBM 2025](https://www.techrepublic.com/article/news-ai-breach-risks-rise-as-governance-lags/)). Secondary coverage of Verizon's DBIR 2026 says 45% of employees are now regular AI users on corporate systems, up from 15% ([eSecurityPlanet](https://www.esecurityplanet.com/de/threats/2026-verizon-dbir-the-new-era-of-cyber-threats/)). **(Inference)** The fall in personal-account use reflects large firms buying ChatGPT Enterprise or Copilot. Small clinics and schools without such licences stay on free consumer tiers. That keeps the problem alive exactly in Ghost Agent's segment, though no study measures small organisations or Nordic users directly.

Norwegian adoption data is official and recent:

- **Firms:** SSB reports **3 in 10 firms with 10+ employees used AI in 2025**, up from 1 in 10 in 2023. Of the 70% not using it, **4 in 10 cite data and privacy concerns** ([SSB, 24 Sep 2025](https://www.ssb.no/teknologi-og-innovasjon/informasjons-og-kommunikasjonsteknologi-ikt/statistikk/bruk-av-ikt-i-naeringslivet/artikler/bruken-av-ki-har-skutt-fart-det-siste-aret)).
- **Individuals:** the same release says **54% of Norwegians aged 16–79 used generative AI** in Q2 2025, up from 36%.
- **Public sector:** IT i praksis 2026 puts AI use in public organisations at **66%**, up from 54% in 2025 ([KS, IT i praksis 2026](https://www.ks.no/contentassets/298ce53af7eb4a6894c87e32bdfe0f03/it-i-praksis-2026-samlet-rapport.pdf)).
- **EU comparison:** Eurostat shows small EU firms (10–49 staff) at only **17.00%** AI use against 55.03% for large ones. Denmark (42.03%) and Finland (37.82%) lead, and **48.83%** of EU firms that considered AI cite data-protection concerns as a barrier ([Eurostat, Dec 2025](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Use_of_artificial_intelligence_in_enterprises)).
- **Weekly use (unverified):** a Norwegian press release on the Reuters Institute 2026 report claims 57% of Norwegians use an AI service weekly ([NTB](https://kommunikasjon.ntb.no/pressemelding/19121552/nordmenn-pa-topp-i-betaling-for-ki-tjenester-viser-ny-oxford-studie?lang=no)). It was read from snippets only.

**(Inference)** The gap between 54% personal use and 30% organisational use implies many staff in small organisations use personal AI accounts for work without a tool or policy. Privacy is a top-three barrier to adoption, which means Ghost Agent can be sold as something that *enables* AI use, not only as protection.

A bottom-up market estimate is more honest than top-down figures, but the inputs are incomplete. Norway had **about 207,000 businesses with employees** at the start of 2025 ([SSB](https://www.ssb.no/virksomheter-foretak-og-regnskap/virksomheter-og-foretak/statistikk/virksomheter/artikler/full-brems-i-antall-bedrifter)). In the latest size table found (2015), about 90% of enterprises had fewer than 10 employees ([SSB](https://www.ssb.no/215387/antall-virksomheter-etter-st%C3%B8rrelse)). Counts of clinics, schools, law firms and accounting firms by size were *not* retrieved; they sit in SSB StatBank under SN2025 codes 69.1, 69.2, 85 and 86. **(Inference, illustrative only)** Suppose 2% of those 207,000 employer businesses each paid for 3 seats at NOK 49/month. That is about 12,400 seats and roughly **NOK 7.3M a year**. The point of the sum is that Norway alone is a beachhead, not a business: the plan has to reach the other Nordics and the EU, or sell flat organisation licences to municipalities and school owners.

## Secrecy duties and "don't paste personal data" guidance drive the buyer

No Norwegian law says "don't type personal data into ChatGPT". **The real driver is one rule, repeated by every authority the target customers listen to:** don't put personal, confidential or sensitive data into general AI chats unless a DPIA (data protection impact assessment) and a data processing agreement (databehandleravtale) are in place.

- **Public sector:** KS's annex, based on Digdir's guidelines, advises against sharing personal data about employees and citizens, sensitive information or logins with generative AI ([KS Vedlegg 7](https://www.ks.no/contentassets/136dba1bfe774740a3904bdb4cde77c0/vedlegg-7-kunstig-intelligens.pdf)).
- **Hospitals:** Helse Sør-Øst gives all staff Copilot Chat but says **Copilot must not be used for patient information** ([Helse Sør-Øst](https://www.helse-sorost.no/helsefaglig/utdanning/pedagogisk-veileder/kunstig_intelligens/)).
- **GPs:** the GPs' association leader tells doctors to watch which personal data they give AI tools. In a survey cited there, **56% of GPs use AI and 37% of those had used ChatGPT for medicine information** ([Fagbladet](https://www.fagbladet.no/nyheter/fastlegene-om-ki-bruk-frigir-tid-til-pasientene/751898); snippet only, date not shown).
- **Legal AI:** in Datatilsynet's LawAi sandbox, the provider recommends users not enter sensitive personal data ([Datatilsynet](https://www.datatilsynet.no/contentassets/9bc1a7df3dc9493a9232b63eb3f53553/sluttrapport_juridisk-abc_11.12.2024.pdf)).
- **Schools:** Udir says AI tools in teaching must be approved and privacy-assessed by the school owner ([Udir](https://udir.no/api/PdfApi/PrintPageAsPdfDocument/219264)). KS SkoleSec runs national DPIAs that municipalities adopt and then top up locally ([KS SkoleSec](https://www.ks.no/fagomrader/digitalisering/skolesec/nasjonal-dpia-for-kunstig-intelligens/)).
- **Lawyers:** Advokatforeningen adopted AI guidance on **5 Sep 2025** (members-only) ([Advokatforeningen](https://www.advokatforeningen.no/advokatetikk/anbefalinger/veiledning-for-bruk-av-kunstig-intelligens-i-advokatvirksomhet/)).
- **Auditors:** a Revisorforeningen adviser wrote that entering confidential client data into ChatGPT can breach the auditor's duty of confidentiality ([Revregn 2023](https://www.revregn.no/asset/pdf/2023/08/Revregn-2023-08-20-23.pdf)).

**(Inference)** Professional secrecy is a stronger, more personal driver than GDPR. For a GP, lawyer or accountant, a breach is a matter of personal professional conduct, and the person who carries that risk is usually the person who buys. Here is the concrete case. A physiotherapist types "Kari Nordmann, 12039045678 [a made-up number], knee pain after surgery at Haukeland" into ChatGPT. Ghost Agent underlines the name and the fødselsnummer and offers `[PERSON_1]` and `[NATIONAL_ID_1]`; the health list flags "surgery". The physiotherapist can now follow the Helse Sør-Øst-style rule and still get the answer.

Other levers are weaker than they look:

- **Fines:** Datatilsynet issued **only 2 fines in 2025** (one to a municipality), down from 5. Complaints doubled from 902 to 1,848 ([Meld. St. 13 (2025–2026)](https://www.regjeringen.no/no/dokumenter/meld.-st.-13-20252026/id3170563/?ch=1)). **(Inference)** Selling on fear of fines will not work in Norway. Selling on duty of care and "appropriate technical measures" (GDPR Article 32) will. This matches the EU pattern, where inadequate technical and organisational measures is the top cause of healthcare GDPR fines: 100 of 265 fines, about EUR 22.8M of EUR 32.3M ([CMS Enforcement Tracker 2026](https://cms.law/en/deu/publication/GDPR-Enforcement-Tracker-Report/life-science-healthcare)).
- **AI Act:** the EU's Digital Omnibus softened the Article 4 AI-literacy duty to "take measures to support" AI literacy from 27 Jul 2026, with no specific fine ([nicfab.eu](https://www.nicfab.eu/en/posts/digital-omnibus-ai-official-journal/)). Norway's KI-lov is out for consultation until 11 Dec 2026, and the bill is expected in spring 2027 ([KI-akademiet, 2 Nov 2026](https://kiakademiet.no/kunnskap/ki-forordningen/norge)).
- **NIS2:** its status in Norway is contested across vendor blogs ([Legiscope](https://www.legiscope.com/blog/nis2-norge-gjennomforing.html)). **(Inference)** It mostly does not reach micro-organisations anyway, so don't lead with the AI Act or NIS2.

One honesty constraint shapes the pitch. Norwegian guidance says **pseudonymised data is still personal data** ([ki.norge.no](https://ki.norge.no/veiledning/gjor-dataene-ki-klare/forsta-behandling-av-sensitive-personopplysninger/anonymisere-og-pseudonymisere); [Draftit](https://draftit.no/blogg/pseudonymisering-anonymisering-bruk-av-personopplysninger)). Hide with placeholders *reduces* what the AI provider receives; it does not make the prompt anonymous. Peer tools disclaim compliance explicitly. DFKI calls its tool "not a compliance or DLP product" ([DFKI](https://github.com/dfki-dsa/pii-guardrail-browser-extension/)), and Maskera says it is "not a compliance guarantee" ([Maskera](https://maskera.dev/)).

The segment table below is **inference**, built from the drivers above. No source ranks these segments.

| Segment | Main driver | Who decides | Speed | Priority |
|---|---|---|---|---|
| Solo/small health (GPs, physio, psychologists) | Helsepersonell secrecy; 56% GP AI use | The practitioner | Fast | 1 |
| Small law firms | Advokat confidentiality; Sep 2025 guidance | Partner | Fast | 1 |
| Accountants/auditors | Regnskapsførerloven § 10 duty (secondary source); Revisorforeningen | Owner | Fast | 2 |
| Freelancers handling client data | Contract confidentiality | Self | Fast, low willingness to pay | 2 |
| Schools/teachers | Udir approval rule; KS SkoleSec DPIAs | School owner (municipality) | Slow, but one deal covers many | 3 |
| Small municipalities | Digdir/KS rule; no DPIA capacity | IT unit / inter-municipal IT | Slow | 3 |
| Parishes, small manufacturers | GDPR (religious data is special-category); trade secrets | Admin/owner | Unknown | Untested: no source found on either |

Two caveats apply. The notes contain no data on parishes or small manufacturers, so those segments are untested hypotheses. And the § 10 detail comes from a secondary contracts summary ([Law Insider](https://lawinsider.com/nb/contracts/8atwrdjb1ds)), not the statute itself.

## Browser stores win individuals; KS, associations and IT partners win organisations

Distribution splits by buyer:

- **Individuals and solo practitioners** install from browser stores. **(Inference)** The Opera add-ons store is almost empty for this category, which makes the "Opera first" listing visible, but Opera users can also install from the Chrome Web Store. Municipalities and health trusts are Microsoft and Edge shops. Chrome Web Store and Edge Add-ons therefore matter more than Opera for reach.
- **Organisations** buy through multipliers. KS SkoleSec's national DPIAs lower the barrier for every school owner at once ([KS op-ed](https://www.ks.no/kronikker/nasjonale-vurderinger-av-personvern-frigjor-kommunal-tid/)). Regional networks such as Digi Rogaland and Digi Agder, and KINS's Copilot risk checklist, spread AI governance practice to small municipalities ([Digi Rogaland](https://digirogaland.no/tjenesteomrader/copilot-hva-kan-kommunene-lare-av-ntnu/); [KINS](https://www.kins.no/media/d5qjg4pj/risikoer-som-boer-vurderes-i-forbindelse-med-innfoering-av-microsoft-copilot-kins-versjon-2.pdf)).
- **Health practitioners** learn AI rules through Helsedirektoratet's inter-agency AI guidance service, the SKIL clinical AI course (autumn 2026), a planned 2026 GP campaign on the "KI-vettregler" and Normkonferansen ([Helsedirektoratet](https://www.helsedirektoratet.no/rapporter/allmennlegetjenesten-arsrapport-2025-inklusive-status-mai-2026/en-modernisert-allmennlegetjeneste-i-et-digitalt-skifte/kunstig-intelligens-og-allmennlegetjenesten)).
- **Lawyers** gather at Advokatforeningen courses; Oslo krets drew 200 people to one on AI ([Advokatforeningen Oslo](https://www.advokatforeningen.no/om-advokatforeningen/organisasjon/foreningsorganer/kretser/oslo-krets/nyheter/samlet-200-til-kurs-i-kunstig-intelligens/)). Regnskap Norge's digital forum covers AI for accountants ([Regnskap Norge](https://www.regnskapnorge.no/contentassets/73fb045f2fae44f7ad30f03c3107e118/presentasjoner_digitalt-forum-2025.pdf)).
- **IT partners and MSPs** (managed service providers) that run M365 for small firms are natural resellers, but no data on their programmes or margins was found. Atea covers larger Nordic public-sector buyers ([GlobalData](https://www.globaldata.com/company-profile/atea-asa/)).

**(Inference)** A low-cost licence likely falls under national procurement thresholds, so a municipality can buy directly. The threshold sources conflict: NOK 1.1M, 1.3M or 1.75M ([regjeringen.no](https://www.regjeringen.no/contentassets/48242c43007d4e4c95dec5d63b2df498/oversikt-over-terskelverdiene-etter-nytt-regelverk.pdf); [Larvik](https://www.larvik.kommune.no/media/5p3mlnz3/larvik-kommune-temaplan-anskaffelser-kunnskapsgrunnlaget.pdf)).

Trust signals carry more weight than features. Buyers look for:

- a DPIA, or an approved and privacy-assessed tool (Udir, KS);
- no training on their data, which is the reason Kongsvinger gave for choosing Copilot ([Offentlig Service](https://www.offentligservice.no/ki-i-kommunen-erfaringer-med-copilot-i-kongsvinger.6711140-409725.html));
- data kept out of non-EEA clouds.

**(Inference)** Ghost Agent's "nothing leaves the machine" design may mean Ghost Agent never processes customer data as a vendor, so no data processing agreement is needed for the tool itself. A ready-made **Norwegian DPIA annex modelled on KS SkoleSec** would remove the main buying friction for schools and municipalities. Open-sourcing the engine, or at least the detectors, would back up the "local only" claim. Every closed competitor makes the same claim without an audit.

## Microsoft, a Norwegian rival and install friction top the risk list

The risks, in rough order:

1. **Microsoft.** Purview inline DLP in Edge for Business already blocks sensitive data typed into ChatGPT, Gemini and DeepSeek, with general availability targeted for November 2025 ([MC1046161](https://mc.merill.net/message/MC1046161)). A "Shadow AI" roadmap item for Edge v148 was listed as generally available in April 2026 ([RM560341](https://mc.merill.net/message/RM560341)). **(Inference)** The risk is real but limited to one segment. It needs managed Edge, Intune and Purview licensing, which clinics, solo lawyers and parishes on Business Basic/Standard or personal devices will not set up. And Purview blocks; it does not help the user send a safe version.
2. **NorwAI Shield** adding placeholders and restore. It already has the identifiers, NOK pricing and an admin story.
3. **Maskera** extending to Norwegian. Its in-browser Nordic NER architecture already fits the job (inference).
4. **Commoditised detection.** OpenAI's open-weight Privacy Filter and multilingual NER make generic PII detection cheap for everyone.
5. **Install friction.** A local Python engine plus a Gemma model is heavier than pure-browser rivals, and it collides with locked-down municipal and health PCs where users cannot install software. This argues for targeting private practices first and offering deployment through IT units or MSPs for municipalities (inference; no source on Norwegian endpoint policies).

The product carries its own risks too:

- **Restore breaks** when the model rewrites placeholders ([DFKI](https://github.com/dfki-dsa/pii-guardrail-browser-extension/)).
- **A missed fødselsnummer** gives a false sense of safety and invites liability if the product is marketed as "compliant".
- **Over-flagging** common Norwegian names annoys users into pressing Ignore.
- **Coverage gaps:** a browser-only tool misses desktop AI apps and file uploads, which the enterprise suites cover ([Nightfall](https://www.nightfall.ai/pricing); [Harmonic](https://www.harmonic.security/products/guide)).
- **No admin evidence:** with no admin console or audit trail, a municipality cannot show that the control was used. A user can also simply turn the extension off (inference).
- **Weak consumer revenue:** Caviard's USD 74 lifetime revenue is the clearest warning that a consumer-only model will not fund the product ([TrustMRR](https://trustmrr.com/startup/caviard-ai)).

## Sell "follow the guidance, keep the tool" below password-manager prices

Everything in this section is **inference** built on the evidence above.

**Positioning.** Ghost Agent should not position itself as DLP. Enterprise vendors own that word, and it signals admin work and contracts. It should not lead on "local placeholder + restore" either, because ten extensions already say that. The recommended line is: **"The Norwegian AI-safety helper for people bound by taushetsplikt (professional secrecy): it underlines what you shouldn't share as you type, and lets you hide it or rephrase it on your own machine, so you can follow the guidance and still use ChatGPT, Claude or Gemini."** Lead with three proof points no competitor combines:

1. fødselsnummer, D-nummer and kontonummer validated locally, plus health, school and court vocabularies in Norwegian;
2. Rephrase with a local model, which handles the quasi-identifiers that masking misses;
3. zero telemetry and no admin needed, with a DPIA annex ready for the buyer.

Avoid the word "compliant". Say "reduces what you share; you stay responsible", which matches how peers and Norwegian guidance frame pseudonymisation. Against NorwAI Shield, the contrast is "helps the user finish the task" versus "lets an admin block it". Against Purview, it is "works for the 10-person practice with no IT and any Chromium browser, including Opera". Support copilot.microsoft.com as well. Helse Sør-Øst forbids patient data even in Copilot, so a placeholder layer adds value on top of sanctioned tools too.

**Pricing.** The anchors are:

- the buyer's M365 seat: Business Basic NOK 71.16/user/month ([Microsoft nb-no](https://www.microsoft.com/nb-no/microsoft-365/business/with-copilot-plans-and-pricing));
- password managers: Bitwarden Teams about USD 4/user/month ([Costbench](https://costbench.com/software/password-management/bitwarden/)), and 1Password's Teams Starter Pack about USD 20–25/month for up to 10 users ([softwares.com](https://www.softwares.com/compare/1password-vs-bitwarden));
- AI-privacy tools: Strac's USD 30–50/user/year, PiiBlocker's USD 6.99/seat/month, and NorwAI Shield's 990 kr + 59 kr/user, which comes to about 1,285 kr/month for a 5-person clinic.

Local processing has near-zero cost per user, so a generous free tier costs little. The table below shows a pricing ladder that fits those anchors.

| Tier | For | Suggested price | Includes | Why |
|---|---|---|---|---|
| Free | Individuals, teachers, students | 0 | All detectors, Hide, Ignore, Restore; Rephrase rate-limited or included | Store reach; consumer willingness to pay is weak (Caviard) |
| Pro | Solo professionals, freelancers | ~NOK 49/month or NOK 490/year | Full Rephrase, custom word lists, priority updates to Norwegian detectors | Below a password manager and well below NorwAI Team |
| Practice | Clinics, law and accounting firms up to 10 seats | ~NOK 299/month flat | Pro for all seats, shared word lists, Norwegian DPIA annex, invoice billing | Mirrors 1Password's Starter Pack; about a quarter of NorwAI Shield for a 5-person clinic |
| Organisation | Municipalities, school owners, parishes | Flat annual licence per organisation (e.g. NOK 15–40k, scaled by staff) | Silent MSI/policy deployment, DPIA pack aligned with KS SkoleSec, optional local-only usage counters | Matches how school owners buy; stays far under procurement thresholds |

Every number in that table is an untested hypothesis. Test willingness to pay in 10–15 interviews with GPs, physiotherapists and small-firm lawyers before publishing prices, and then validate Denmark and Finland (the highest EU AI adoption) as the second market.

## Conclusion

The research changes what Ghost Agent's moat should be. Detect-hide-restore once looked like the product; it turns out to be table stakes, shipped by many free extensions that hardly anyone uses. The scarce assets are elsewhere: Norwegian-specific detection that big vendors document only partly (fødselsnummer, but not D-nummer, kontonummer or Norwegian health terms), a local Rephrase that addresses the re-identification risk masking leaves behind, and the trust packaging (zero telemetry, no data processing agreement, a ready DPIA) that small Norwegian buyers are told to demand. The biggest strategic surprise is the gap between how many people use AI personally (54%) and how many organisations have sanctioned it (30%), together with privacy as a top-three adoption barrier. Ghost Agent can be sold as the thing that lets a small practice *start* using AI responsibly, not just as a leak plug.

The market analysts quote is large, but almost none of it is Ghost Agent's. No source sizes the no-IT, Nordic segment. Norway alone supports a beachhead, not a company, and the consumer side has shown it will not pay. The path that holds together is narrow: win the professionals whose secrecy duty is personal, use KS, Helsedirektoratet channels and professional associations as multipliers, and move quickly into Denmark, Finland and the EU before NorwAI Shield adds placeholders or Maskera learns Norwegian. The most valuable next research is primary. Exact SSB counts for the target sectors, a handful of willingness-to-pay interviews, and a hands-on test of NorwAI Shield's "anonymise" behaviour would each change the plan more than another analyst report.
