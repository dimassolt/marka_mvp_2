import type { ComponentChildren } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { checkEngine, engineRunning } from '@/utils/engine-status';
import { AI_CHAT_SITES, checkEverywhere, checkOnlyChosenSites, tourPending } from '@/utils/onboarding';
import {
  downloadModel,
  downloadRephraseModel,
  modelStatus,
  rephraseModelStatus,
  progressPercent,
  type ModelStatus,
  type RephraseModelStatus,
} from '@/utils/model';
import { modelSteps, type ModelStep } from '@/utils/model-steps';
import {
  addSite,
  addWord,
  blockSend,
  BUILT_IN_DOMAIN_INFO,
  BUILT_IN_DOMAINS,
  createDomain,
  customDomains,
  isBuiltInDomain,
  isSiteOn,
  pausedSites,
  removeSite,
  removeWord,
  selectedDomain,
  setSiteOn,
  setSitePaused,
  sites,
} from '@/utils/popup-settings';

type View = 'main' | 'new-domain' | 'settings' | 'tour';

type Item<T> = {
  getValue(): Promise<T>;
  watch(callback: (value: T) => void): () => void;
};

/** Reads a storage item and re-renders when it changes. Undefined until the first read. */
function useItem<T>(item: Item<T>): T | undefined {
  const [value, setValue] = useState<T>();
  useEffect(() => {
    item.getValue().then(setValue);
    return item.watch(setValue);
  }, [item]);
  return value;
}

/** Hostname of the tab the popup was opened on. */
function useHostname(): string {
  const [host, setHost] = useState('');
  useEffect(() => {
    browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.url) setHost(new URL(tab.url).hostname);
    });
  }, []);
  return host;
}

/** How often the popup asks while a model downloads: the Engine is local, so it can be often. */
const DOWNLOAD_POLL_MS = 1000;
/** How often it asks while the rephrase model loads. */
const LOAD_POLL_MS = 2000;

/**
 * The Engine's GLiNER model. Asks again every second while it downloads, and when `running`
 * changes (the tour stays open while the user starts the Engine).
 */
function useModelStatus(running = true): [ModelStatus | null, () => void] {  const [status, setStatus] = useState<ModelStatus | null>(null);
  useEffect(() => {
    if (running) modelStatus().then(setStatus);
    else setStatus(null);
  }, [running]);
  useEffect(() => {
    if (status?.state !== 'downloading') return;
    const timer = setTimeout(() => modelStatus().then(setStatus), DOWNLOAD_POLL_MS);
    return () => clearTimeout(timer);
  }, [status]);
  const download = () => {
    downloadModel().then(setStatus);
  };
  return [status, download];
}

/** The Engine's rephrase model. Asks again every second while it downloads, every 2 s while it loads. */
function useRephraseModelStatus(): [RephraseModelStatus | null, () => void] {
  const [status, setStatus] = useState<RephraseModelStatus | null>(null);
  useEffect(() => {
    rephraseModelStatus().then(setStatus);
  }, []);
  useEffect(() => {
    if (status?.state !== 'idle' && status?.state !== 'loading' && status?.state !== 'downloading') return;
    const delay = status.state === 'downloading' ? DOWNLOAD_POLL_MS : LOAD_POLL_MS;
    const timer = setTimeout(() => rephraseModelStatus().then(setStatus), delay);
    return () => clearTimeout(timer);
  }, [status]);
  const download = () => {
    downloadRephraseModel().then(setStatus);
  };
  return [status, download];
}

/** Both optional models as ordered steps, and a download for each (spec §3, Models). */
function useModelSteps(): [ModelStep[], (id: ModelStep['id']) => void] {
  const [names, downloadNames] = useModelStatus();
  const [rephrase, downloadRephrase] = useRephraseModelStatus();
  const download = (id: ModelStep['id']) => (id === 'names' ? downloadNames() : downloadRephrase());
  return [modelSteps(names, rephrase), download];
}

export function App() {
  const running = useItem(engineRunning);
  const pending = useItem(tourPending);
  const [view, setView] = useState<View>('main');
  const toMain = () => setView('main');

  // Re-check on every popup open, so it never shows a stale "Running".
  useEffect(() => {
    checkEngine();
  }, []);

  if (running === undefined || pending === undefined) return null;
  // The tour comes first, even with the Engine down: its second step starts the Engine.
  if (pending || view === 'tour') {
    const finish = () => {
      tourPending.setValue(false);
      toMain();
    };
    return <Tour running={running} onFinish={finish} />;
  }
  if (!running) return <EngineDown />;
  if (view === 'new-domain') return <NewDomain onBack={toMain} />;
  if (view === 'settings') return <Settings onBack={toMain} onTour={() => setView('tour')} />;
  return <Main onNewDomain={() => setView('new-domain')} onSettings={() => setView('settings')} />;
}

/** The product website; the header ghost links to it. */
const WEBSITE_URL = 'https://kirill-antonovich.github.io/ghost-agent-website/';

/** The ghost wears sunglasses while it checks this site; the chip shows the Engine. */
function Header({
  running,
  on = running,
  animate = false,
}: {
  running: boolean;
  on?: boolean;
  /** Swing the sunglasses on and off; only after the user flips the switch. */
  animate?: boolean;
}) {
  return (
    <header class="header">
      <a
        class="ghost-link"
        href={WEBSITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ghost Agent website"
        title="Ghost Agent website"
      >
        <Ghost on={on} animate={animate} />
      </a>
      <h1 class="title">Ghost Agent</h1>
      <span class={running ? 'chip' : 'chip chip--down'}>{running ? 'Running' : 'Engine down'}</span>
    </header>
  );
}

/**
 * public/ghost-active.svg drawn inline. The sunglasses are a second SVG on top, because
 * Chromium turns only a whole <svg> in 3D, not the shapes inside one.
 */
function Ghost({ on, animate }: { on: boolean; animate: boolean }) {
  return (
    <span class={animate ? 'ghost ghost--animate' : 'ghost'} aria-hidden="true">
      <svg width={28} height={28} viewBox="0 0 512 512">
        <defs>
          <path
            id="ghost-shape"
            d="M256 48 C352 48 424 120 424 224 L424 398 C424 440 390 456 362 434 C338 416 318 420 302 444 C288 464 272 472 256 472 C240 472 224 464 210 444 C194 420 174 416 150 434 C122 456 88 440 88 398 L88 224 C88 120 160 48 256 48 Z"
          />
          <clipPath id="ghost-clip">
            <use href="#ghost-shape" />
          </clipPath>
          <linearGradient id="ghost-body" x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0" stop-color="#FFFFFF" />
            <stop offset="0.6" stop-color="#FFFFFF" />
            <stop offset="1" stop-color="#EEF1F6" />
          </linearGradient>
          <linearGradient id="ghost-gloss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.95" />
            <stop offset="1" stop-color="#FFFFFF" stop-opacity="0" />
          </linearGradient>
          <filter id="ghost-shadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#1E2330" flood-opacity="0.15" />
          </filter>
          <g id="ghost-glasses-art" fill="#0A0B0F" stroke="#0A0B0F" stroke-linejoin="round" stroke-linecap="round">
            <path d="M126 192 C126 180 136 172 150 172 L362 172 C376 172 386 180 386 192" fill="none" stroke-width="16" />
            <rect x="240" y="170" width="32" height="30" stroke="none" />
            <path
              stroke-width="10"
              d="M134 200 C134 188 142 182 154 182 L236 182 C248 182 254 190 252 202 L246 238 C240 268 220 282 192 282 C162 282 142 266 138 238 Z"
            />
            <path
              stroke-width="10"
              d="M378 200 C378 188 370 182 358 182 L276 182 C264 182 258 190 260 202 L266 238 C272 268 292 282 320 282 C350 282 370 266 374 238 Z"
            />
          </g>
        </defs>
        <use href="#ghost-shape" fill="url(#ghost-body)" filter="url(#ghost-shadow)" />
        <path
          clip-path="url(#ghost-clip)"
          d="M120 210 C120 128 180 74 256 74 C332 74 392 128 392 210 C340 176 172 176 120 210 Z"
          fill="url(#ghost-gloss)"
        />
        <use href="#ghost-shape" fill="none" stroke="#0A0B0F" stroke-width="14" stroke-linejoin="round" />
        <ellipse cx="200" cy="228" rx="24" ry="34" fill="#0A0B0F" />
        <ellipse cx="312" cy="228" rx="24" ry="34" fill="#0A0B0F" />
      </svg>
      <svg
        class={on ? 'ghost__glasses' : 'ghost__glasses ghost__glasses--off'}
        width={28}
        height={28}
        viewBox="0 0 512 512"
      >
        <use href="#ghost-glasses-art" />
      </svg>
      {/* Switched off: the glasses crumble into sand that blows away to the right. */}
      {animate && !on && (
        <svg class="ghost__dust" width={28} height={28} viewBox="0 0 512 512">
          {GRAINS.map((g) => (
            <g key={g.x * 1000 + g.y} class="ghost__grain" style={g.style}>
              <svg x={g.x} y={g.y} width={GRAIN} height={GRAIN} viewBox={`${g.x} ${g.y} ${GRAIN} ${GRAIN}`}>
                <use href="#ghost-glasses-art" />
              </svg>
            </g>
          ))}
        </svg>
      )}
    </span>
  );
}

/** One grain of sand: a 16×16 square of the 512 viewBox, about 1px of the 28px ghost. */
const GRAIN = 16;

/**
 * The glasses' box (x 118–406, y 162–290) cut into grains. Each blows up and to the right,
 * about 30° above level; the left side goes first, so the sand sweeps across. Picked once,
 * so every render matches.
 */
const GRAINS = Array.from({ length: 18 * 8 }, (_, i) => {
  const col = i % 18;
  const x = 118 + col * GRAIN;
  const y = 162 + Math.floor(i / 18) * GRAIN;
  const dx = 120 + Math.random() * 160;
  const dy = -dx * 0.6 + (Math.random() - 0.5) * 40;
  const delay = (col / 18) * 150 + Math.random() * 60;
  return { x, y, style: `--dx: ${dx}px; --dy: ${dy}px; --delay: ${delay}ms` };
});

function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header class="header header--sub">
      <button type="button" class="bare-btn" aria-label="Back" onClick={onBack}>
        <Icon size={18}>
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </Icon>
      </button>
      <h1 class="title">{title}</h1>
    </header>
  );
}

function Main({ onNewDomain, onSettings }: { onNewDomain: () => void; onSettings: () => void }) {
  const domain = useItem(selectedDomain) ?? 'free';
  const domains = useItem(customDomains) ?? {};
  const siteList = useItem(sites) ?? [];
  const paused = useItem(pausedSites) ?? [];
  const host = useHostname();
  const on = isSiteOn(host, siteList, paused);
  const words = domains[domain];
  const [steps, download] = useModelSteps();
  // The box stays until every model is on disk; a model that is loading counts as there.
  const missing = steps.some((step) => step.state !== 'done' && step.state !== 'loading');
  const [toggled, setToggled] = useState(false);
  return (
    <main class="popup">
      <Header running on={on} animate={toggled} />

      <div class="site">
        <span class="site__text">
          <span class="site__host">{host}</span>
          <span class="hint">{on ? 'Checking this site' : 'Off on this site'}</span>
        </span>
        <button
          type="button"
          class={toggled ? 'switch switch--animate' : 'switch'}
          role="switch"
          aria-checked={on}
          aria-label={`On for ${host}`}
          disabled={!host}
          onClick={() => {
            setToggled(true);
            setSiteOn(host, !on);
          }}
        >
          <span class="switch__knob" />
        </button>
        <button type="button" class="icon-btn" aria-label="Settings" onClick={onSettings}>
          <Icon size={16}>
            <path d="M20 7h-9" />
            <path d="M14 17H5" />
            <circle cx="17" cy="17" r="3" />
            <circle cx="7" cy="7" r="3" />
          </Icon>
        </button>
      </div>

      {missing && (
        <div class="model" aria-live="polite">
          <h2 class="model__title">Basic checks are on</h2>
          <p class="model__text">
            Ghost already finds ID numbers, cards, emails, phone numbers, first names and your
            Domain's words. Two optional models add more. Download them in this order:
          </p>
          <ModelSteps steps={steps} onDownload={download} />
        </div>
      )}

      <div class="stack">
        <div class="label-row">
          <label for="domain" class="label">
            Domain
          </label>
          <DomainInfo domain={domain} own={!!words} />
        </div>
        <div class="row">
          <DomainSelect domain={domain} domains={domains} />
          <button
            type="button"
            class="icon-btn icon-btn--lg"
            aria-label="New Domain"
            onClick={onNewDomain}
          >
            <Icon size={18}>
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </Icon>
          </button>
        </div>
      </div>

      <div class="tear" />

      {words ? <Words key={domain} domain={domain} words={words} /> : <BuiltIn domain={domain} />}
    </main>
  );
}

/** The Domain list: built-in Domains, then the user's own. Choosing one sets `selectedDomain`. */
function DomainSelect({ domain, domains }: { domain: string; domains: Record<string, string[]> }) {
  return (
    <select id="domain" class="select" value={domain} onChange={(e) => selectedDomain.setValue(e.currentTarget.value)}>
      {BUILT_IN_DOMAINS.map((name) => (
        <option key={name} value={name}>
          {BUILT_IN_DOMAIN_INFO[name].label}
        </option>
      ))}
      {Object.keys(domains).map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );
}

function Words({ domain, words }: { domain: string; words: string[] }) {
  const [word, setWord] = useState('');
  const [query, setQuery] = useState('');
  const shown = words.filter((w) => w.toLowerCase().includes(query.trim().toLowerCase()));
  const list = useRef<HTMLUListElement>(null);
  const [overflows, setOverflows] = useState(false);
  // The word just submitted, new or already there; its chip gets scrolled into view.
  const [landed, setLanded] = useState<string | null>(null);

  // Search shows only once the full list scrolls; while filtered, keep the last answer.
  useLayoutEffect(() => {
    if (query) return;
    const ul = list.current;
    setOverflows(!!ul && ul.scrollHeight > ul.clientHeight);
  }, [words, query]);

  // Waits until the word is in the list, since a new one arrives a render later. A search that
  // filters it out leaves nothing to scroll to.
  useLayoutEffect(() => {
    if (!landed || !words.includes(landed)) return;
    const i = shown.indexOf(landed);
    if (i >= 0) list.current?.children[i]?.scrollIntoView({ block: 'nearest' });
    setLanded(null);
  }, [landed, words]);

  const submit = async (e: Event) => {
    e.preventDefault();
    await addWord(domain, word);
    setLanded(word.trim());
    setWord('');
  };

  return (
    <section class="section">
      <div class="heading-row">
        <h2 class="heading">Your words</h2>
        <span class="hint">On this computer</span>
      </div>
      {(overflows || query) && (
        <input
          type="search"
          class="input input--search"
          aria-label={`Search ${domain} words`}
          placeholder="Search your words"
          value={query}
          onInput={(e) => setQuery(e.currentTarget.value)}
        />
      )}
      {words.length > 0 && shown.length === 0 && <p class="hint">No words match.</p>}
      {shown.length > 0 && (
        <ul class="chips" ref={list}>
          {shown.map((w) => (
            <li key={w} class="word">
              <span class="word__text" title={w}>
                {w}
              </span>
              <button
                type="button"
                class="word__remove"
                aria-label={`Remove ${w}`}
                onClick={() => removeWord(domain, w)}
              >
                <Icon size={12} stroke={2.5}>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </Icon>
              </button>
            </li>
          ))}
        </ul>
      )}
      <form class="row" onSubmit={submit}>
        <input
          class="input input--sm"
          aria-label={`Add a word to ${domain}`}
          placeholder="Add a word"
          value={word}
          onInput={(e) => setWord(e.currentTarget.value)}
        />
        <button type="submit" class="btn" disabled={!word.trim()}>
          Add
        </button>
      </form>
    </section>
  );
}

function BuiltIn({ domain }: { domain: string }) {
  const name = isBuiltInDomain(domain) ? domain : 'free';
  return (
    <section class="section">
      <div class="heading-row">
        <span class="pill">Built-in</span>
      </div>
      <p class="body">{BUILT_IN_DOMAIN_INFO[name].about}</p>
    </section>
  );
}

/** A "?" by the Domain label; hover or focus shows what the selected Domain checks. */
function DomainInfo({ domain, own }: { domain: string; own: boolean }) {
  return (
    <span class="info">
      <button
        type="button"
        class="info__btn"
        aria-label="About this Domain"
        aria-describedby="domain-info"
      >
        <Icon size={15}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </Icon>
      </button>
      <span role="tooltip" id="domain-info" class="info__tip">
        {domain === 'free'
          ? 'Base checks only: fnr, card, email, phone, names.'
          : 'Plus the Base checks: fnr, card, email, phone, names.'}
        {!own && <span class="info__line">Want your own words? Make a Domain with the + button.</span>}
      </span>
    </span>
  );
}

function NewDomain({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState('');
  const [taken, setTaken] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);

  const submit = async (e: Event) => {
    e.preventDefault();
    if (await createDomain(name)) onBack();
    else setTaken(true);
  };

  return (
    <main class="popup">
      <SubHeader title="New Domain" onBack={onBack} />
      <form class="popup" onSubmit={submit}>
        <div class="stack stack--top">
          <label for="domain-name" class="label">
            Name
          </label>
          <input
            ref={input}
            id="domain-name"
            class="input input--strong"
            value={name}
            aria-invalid={taken}
            aria-describedby={taken ? 'domain-name-error' : undefined}
            onInput={(e) => {
              setName(e.currentTarget.value);
              setTaken(false);
            }}
          />
          {taken && (
            <p id="domain-name-error" class="error">
              A Domain with this name already exists.
            </p>
          )}
        </div>
        <div class="tear" />
        <div class="section section--loose">
          <p class="body body--sm">
            Saved on this computer only. It starts with the Base checks; you add your own words next.
          </p>
          <button type="submit" class="btn btn--block" disabled={!name.trim()}>
            Create
          </button>
        </div>
      </form>
    </main>
  );
}

function Settings({ onBack, onTour }: { onBack: () => void; onTour: () => void }) {
  const list = useItem(sites) ?? [];
  const paused = useItem(pausedSites) ?? [];
  const [site, setSite] = useState('');
  const [steps, download] = useModelSteps();
  const block = useItem(blockSend) ?? false;
  const [toggled, setToggled] = useState(false);
  const submit = async (e: Event) => {
    e.preventDefault();
    await addSite(site);
    setSite('');
  };

  return (
    <main class="popup">
      <SubHeader title="Settings" onBack={onBack} />
      <section class="section section--top">
        <div class="sites-head">
          <h2 class="heading">Sites</h2>
          <p class="hint">Ghost Agent checks text on these sites. * means every site.</p>
        </div>
        {list.length > 0 && (
          <ul class="sites">
            {list.map((s) => (
              <li key={s} class="site-item">
                {s === '*' ? (
                  <>
                    <span class="mono">*</span>
                    <span class="muted">All sites</span>
                  </>
                ) : (
                  <span>{s}</span>
                )}
                <button
                  type="button"
                  class="bare-btn bare-btn--muted"
                  aria-label={`Remove ${s}`}
                  onClick={() => removeSite(s)}
                >
                  <Icon size={14} stroke={2.25}>
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </Icon>
                </button>
              </li>
            ))}
          </ul>
        )}
        <form class="row" onSubmit={submit}>
          <input
            class="input input--sm"
            aria-label="Add a site"
            placeholder="claude.ai"
            value={site}
            onInput={(e) => setSite(e.currentTarget.value)}
          />
          <button type="submit" class="btn" disabled={!site.trim()}>
            Add
          </button>
        </form>
      </section>
      <section class="section">
        <div class="row">
          <div class="site__text">
            <h2 class="heading">Block sending</h2>
            <p class="hint">Enter and Send wait until every Finding is hidden or ignored.</p>
          </div>
          <button
            type="button"
            class={toggled ? 'switch switch--animate' : 'switch'}
            role="switch"
            aria-checked={block}
            aria-label="Block sending until every Finding is resolved"
            onClick={() => {
              setToggled(true);
              blockSend.setValue(!block);
            }}
          >
            <span class="switch__knob" />
          </button>
        </div>
      </section>
      {steps.length > 0 && (
        <section class="section">
          <div class="sites-head">
            <h2 class="heading">Models</h2>
            <p class="hint">Basic checks always run. These two add more, in this order. Hover ? to see what each does.</p>
          </div>
          <ModelSteps steps={steps} onDownload={download} />
        </section>
      )}
      {paused.length > 0 && (
        <section class="section">
          <div class="sites-head">
            <h2 class="heading">Off on</h2>
            <p class="hint">Switched off in the popup, even though * covers them.</p>
          </div>
          <ul class="sites">
            {paused.map((s) => (
              <li key={s} class="site-item">
                <span>{s}</span>
                <button
                  type="button"
                  class="bare-btn bare-btn--muted"
                  aria-label={`Remove ${s} from Off on`}
                  onClick={() => setSitePaused(s, false)}
                >
                  <Icon size={14} stroke={2.25}>
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </Icon>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div class="tear" />
      <section class="section">
        <button type="button" class="link-btn" onClick={onTour}>
          Take the welcome tour again
        </button>
      </section>
    </main>
  );
}

/** What a step says while it can't be downloaded, or once it is there. */
const STEP_NOTE: Partial<Record<ModelStep['state'], string>> = {
  done: 'Downloaded',
  loading: 'Downloaded. Loading…',
  waiting: 'After step 1',
};

/**
 * The optional models as numbered steps, GLiNER then Gemma 4, like scripts/install.sh fetches
 * them. A "?" by each title says what the model enables, on hover or keyboard focus, like the
 * Domain's "?".
 */
function ModelSteps({ steps, onDownload }: { steps: ModelStep[]; onDownload: (id: ModelStep['id']) => void }) {
  return (
    <ol class="steps">
      {steps.map((step, i) => {
        const tip = `model-tip-${step.id}`;
        const percent = progressPercent(step.downloadedMb, step.sizeMb);
        return (
          <li key={step.id} class={`step step--${step.state}`}>
            <span class="step__num" aria-hidden="true">
              {step.state === 'done' || step.state === 'loading' ? '✓' : i + 1}
            </span>
            <div class="step__body">
              <div class="step__head">
                <span class="step__title-row">
                  <span class="step__title">{step.title}</span>
                  <span class="info info--step">
                    <button
                      type="button"
                      class="info__btn"
                      aria-label={`About ${step.model}`}
                      aria-describedby={tip}
                    >
                      <Icon size={15}>
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <path d="M12 17h.01" />
                      </Icon>
                    </button>
                    <span role="tooltip" id={tip} class="info__tip step__tip">
                      {step.enables}
                      <span class="info__line">Runs on this computer. Your text never leaves it.</span>
                    </span>
                  </span>
                </span>
                <span class="step__meta mono">
                  {step.model} · {step.sizeMb >= 1000 ? `${step.sizeMb / 1000} GB` : `${step.sizeMb} MB`}
                </span>
              </div>
              {step.state === 'next' && (
                <button type="button" class="btn btn--sm" aria-describedby={tip} onClick={() => onDownload(step.id)}>
                  Download
                </button>
              )}
              {step.state === 'downloading' && (
                <>
                  <div
                    class="bar"
                    role="progressbar"
                    aria-label={`${step.model} download`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                  >
                    <span class="bar__fill" style={{ width: `${percent}%` }} />
                  </div>
                  <p class="model__text">
                    <span class="mono">{step.downloadedMb}</span> of about <span class="mono">{step.sizeMb}</span> MB.
                    Keep the Engine running.
                  </p>
                </>
              )}
              {step.state === 'failed' && (
                <>
                  <p class="error">{step.error}</p>
                  <button type="button" class="btn btn--sm" aria-describedby={tip} onClick={() => onDownload(step.id)}>
                    Try again
                  </button>
                </>
              )}
              {step.state === 'broken' && (
                <>
                  <p class="error mono">{step.error}</p>
                  <p class="model__text">It is downloaded but would not load. Restart the Engine.</p>
                </>
              )}
              {STEP_NOTE[step.state] && <p class="step__note">{STEP_NOTE[step.state]}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const TOUR_STEPS = 5;

/**
 * The first-run tour (docs/spec.md, Onboarding): shown the first time the popup opens after
 * a fresh install, and again from Settings. Laid out like the main view: the header, then
 * each step in a paper-3 box like the site row, then Back and the next step.
 */
function Tour({ running, onFinish }: { running: boolean; onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const last = step === TOUR_STEPS - 1;
  const next = step === 1 && !running ? 'Continue without it' : last ? 'Done' : step === 0 ? 'Get started' : 'Continue';

  return (
    <main class="popup">
      <header class="header">
        <Ghost on animate={false} />
        <h1 class="title">Ghost Agent</h1>
        {!last && (
          <button type="button" class="tour__skip" onClick={onFinish}>
            Skip
          </button>
        )}
      </header>
      {step === 0 && <TourWelcome />}
      {step === 1 && <TourEngine running={running} />}
      {step === 2 && <TourDomain />}
      {step === 3 && <TourSend />}
      {step === 4 && <TourSites />}
      <div class="tear" />
      <footer class="tour__footer">
        {step > 0 ? (
          <button type="button" class="tour__back" onClick={() => setStep(step - 1)}>
            Back
          </button>
        ) : (
          <span />
        )}
        <span class="hint">
          {step + 1} of {TOUR_STEPS}
        </span>
        <button type="button" class="btn" onClick={last ? onFinish : () => setStep(step + 1)}>
          {next}
        </button>
      </footer>
    </main>
  );
}

function TourWelcome() {
  return (
    <section class="tour__box">
      <h2 class="tour__title">Your text stays yours</h2>
      <p class="body body--sm">Ghost Agent underlines sensitive data before you send it to an AI chat. You choose what to hide.</p>
      <ul class="tour__list">
        <li>Checked on this computer. Nothing is sent anywhere.</li>
        <li>Hidden values live in memory only.</li>
        <li>Nothing in your text changes until you click.</li>
      </ul>
    </section>
  );
}

/** Re-checks the Engine every 2 s while it is down, so the step moves on by itself. */
function TourEngine({ running }: { running: boolean }) {
  const [model, download] = useModelStatus(running);
  useEffect(() => {
    if (running) return;
    const timer = setInterval(checkEngine, 2000);
    return () => clearInterval(timer);
  }, [running]);

  return (
    <>
      <section class="tour__box">
        <div class="tour__head">
          <h2 class="tour__title">Start the Engine</h2>
          <span class={running ? 'chip' : 'chip chip--down'}>{running ? 'Running' : 'Not running'}</span>
        </div>
        {running ? (
          <p class="body body--sm">The Engine reads your text here, on this computer.</p>
        ) : (
          <>
            <p class="body body--sm">The Engine reads your text on this computer. In the project folder, run:</p>
            {/* Two lines, not &&: works in cmd, PowerShell and zsh alike. */}
            <code class="code">{'cd engine\nuv run ghost-engine'}</code>
            <p class="hint">This popup notices as soon as it starts.</p>
          </>
        )}
      </section>
      {running && model && model.state !== 'ready' && <ModelNotice status={model} onDownload={download} />}
    </>
  );
}

function TourDomain() {
  const domain = useItem(selectedDomain) ?? 'free';
  const domains = useItem(customDomains) ?? {};
  return (
    <section class="tour__box">
      <h2 class="tour__title">What do you write about?</h2>
      <p class="body body--sm">A Domain adds the words that are sensitive in your work. Fnr, cards, email, phone and names are always checked.</p>
      <label for="domain" class="label">
        Domain
      </label>
      <DomainSelect domain={domain} domains={domains} />
      <p class="hint">
        {isBuiltInDomain(domain) ? BUILT_IN_DOMAIN_INFO[domain].about : 'Your own words, plus the Base checks.'}
      </p>
    </section>
  );
}

/** Whether Enter and Send wait for every Finding (the Block sending switch in Settings). */
function TourSend() {
  const block = useItem(blockSend) ?? false;
  return (
    <section class="tour__box" role="radiogroup" aria-labelledby="send-title">
      <h2 id="send-title" class="tour__title">
        When you send
      </h2>
      <label class="tour__choice">
        <input type="radio" name="send" checked={!block} onChange={() => blockSend.setValue(false)} />
        <span>
          <span class="heading">Just underline</span>
          <span class="hint">You decide what to hide.</span>
        </span>
      </label>
      <label class="tour__choice">
        <input type="radio" name="send" checked={block} onChange={() => blockSend.setValue(true)} />
        <span>
          <span class="heading">Block until resolved</span>
          <span class="hint">Enter and Send wait until every Finding is hidden or ignored.</span>
        </span>
      </label>
      <p class="hint">Change it any time in Settings.</p>
    </section>
  );
}

/** Where Ghost Agent works: every site, or only listed ones (the `sites` list in Settings). */
function TourSites() {
  const list = useItem(sites) ?? ['*'];
  const everywhere = list.includes('*');
  const chosen = list.filter((s) => s !== '*');
  return (
    <section class="tour__box" role="radiogroup" aria-labelledby="where-title">
      <h2 id="where-title" class="tour__title">
        Where should it work?
      </h2>
      <label class="tour__choice">
        <input type="radio" name="where" checked={everywhere} onChange={checkEverywhere} />
        <span>
          <span class="heading">Everywhere</span>
          <span class="hint">Every site you type on.</span>
        </span>
      </label>
      <label class="tour__choice">
        <input type="radio" name="where" checked={!everywhere} onChange={checkOnlyChosenSites} />
        <span>
          <span class="heading">Only sites I choose</span>
          <span class="hint">{(everywhere || chosen.length === 0 ? AI_CHAT_SITES : chosen).join(', ')}</span>
        </span>
      </label>
      <p class="hint">
        Change it any time in Settings. Pin Ghost Agent from the puzzle piece, then paste something into ChatGPT.
      </p>
    </section>
  );
}

function EngineDown() {
  return (
    <main class="popup">
      <Header running={false} />
      <div class="down">
        <h2 class="down__title">Start Ghost Agent engine</h2>
        <p class="down__text">In the project folder, run:</p>
        {/* Two lines, not &&: works in cmd, PowerShell and zsh alike. */}
        <code class="code">{'cd engine\nuv run ghost-engine'}</code>
      </div>
    </main>
  );
}

function Icon({ size, stroke = 2, children }: { size: number; stroke?: number; children: ComponentChildren }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={stroke}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
