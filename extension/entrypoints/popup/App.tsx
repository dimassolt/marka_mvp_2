import type { ComponentChildren } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { checkEngine, engineRunning } from '@/utils/engine-status';
import {
  downloadModel,
  MODEL_SIZE_MB,
  modelStatus,
  progressPercent,
  type ModelStatus,
} from '@/utils/model';
import {
  addSite,
  addWord,
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

type View = 'main' | 'new-domain' | 'settings';

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

/** The Engine's GLiNER model. Asks again every 2 s while it downloads. */
function useModelStatus(): [ModelStatus | null, () => void] {
  const [status, setStatus] = useState<ModelStatus | null>(null);
  useEffect(() => {
    modelStatus().then(setStatus);
  }, []);
  useEffect(() => {
    if (status?.state !== 'downloading') return;
    const timer = setTimeout(() => modelStatus().then(setStatus), 2000);
    return () => clearTimeout(timer);
  }, [status]);
  const download = () => {
    downloadModel().then(setStatus);
  };
  return [status, download];
}

export function App() {
  const running = useItem(engineRunning);
  const [view, setView] = useState<View>('main');
  const toMain = () => setView('main');

  // Re-check on every popup open, so it never shows a stale "Running".
  useEffect(() => {
    checkEngine();
  }, []);

  if (running === undefined) return null;
  if (!running) return <EngineDown />;
  if (view === 'new-domain') return <NewDomain onBack={toMain} />;
  if (view === 'settings') return <Settings onBack={toMain} />;
  return <Main onNewDomain={() => setView('new-domain')} onSettings={() => setView('settings')} />;
}

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
      <Ghost on={on} animate={animate} />
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
        <g
          fill="#0A0B0F"
          stroke="#0A0B0F"
          stroke-linejoin="round"
          stroke-linecap="round"
        >
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
      </svg>
    </span>
  );
}

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
  const [model, download] = useModelStatus();
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
          class="switch"
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

      {model && model.state !== 'ready' && <ModelNotice status={model} onDownload={download} />}

      <div class="stack">
        <div class="label-row">
          <label for="domain" class="label">
            Domain
          </label>
          <DomainInfo domain={domain} own={!!words} />
        </div>
        <div class="row">
          <select
            id="domain"
            class="select"
            value={domain}
            onChange={(e) => selectedDomain.setValue(e.currentTarget.value)}
          >
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

function Words({ domain, words }: { domain: string; words: string[] }) {
  const [word, setWord] = useState('');
  const [query, setQuery] = useState('');
  const shown = words.filter((w) => w.toLowerCase().includes(query.trim().toLowerCase()));
  const list = useRef<HTMLUListElement>(null);
  const [overflows, setOverflows] = useState(false);

  // Search shows only once the full list scrolls; while filtered, keep the last answer.
  useLayoutEffect(() => {
    if (query) return;
    const ul = list.current;
    setOverflows(!!ul && ul.scrollHeight > ul.clientHeight);
  }, [words, query]);

  const submit = async (e: Event) => {
    e.preventDefault();
    await addWord(domain, word);
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

function Settings({ onBack }: { onBack: () => void }) {
  const list = useItem(sites) ?? [];
  const paused = useItem(pausedSites) ?? [];
  const [site, setSite] = useState('');
  const [model, download] = useModelStatus();

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
      {model && (
        <section class="section">
          <div class="heading-row">
            <h2 class="heading">Name model</h2>
            <span class="pill">{MODEL_PILL[model.state]}</span>
          </div>
          {model.state === 'ready' ? (
            <p class="hint">GLiNER finds surnames, organisations and places. It runs on this computer.</p>
          ) : (
            <ModelNotice status={model} onDownload={download} flat />
          )}
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
    </main>
  );
}

/** The Name model's state in Settings, next to its heading. */
const MODEL_PILL: Record<ModelStatus['state'], string> = {
  missing: 'Off',
  downloading: 'Downloading',
  ready: 'Downloaded',
  failed: 'Failed',
};

/**
 * Offers the GLiNER model download, like scripts/install.sh does. Without the model the
 * Engine still checks everything else, so the popup says plainly what is off.
 */
function ModelNotice({
  status,
  onDownload,
  flat = false,
}: {
  status: ModelStatus;
  onDownload: () => void;
  /** In Settings: no box and no title, the section heading says it. */
  flat?: boolean;
}) {
  const percent = progressPercent(status.downloaded_mb);
  return (
    <div class={flat ? 'model model--flat' : 'model'} aria-live="polite">
      {status.state === 'downloading' ? (
        <>
          {!flat && <h2 class="model__title">Downloading the name model</h2>}
          <div
            class="bar"
            role="progressbar"
            aria-label="Model download"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <span class="bar__fill" style={{ width: `${percent}%` }} />
          </div>
          <p class="model__text">
            <span class="mono">{status.downloaded_mb}</span> of about{' '}
            <span class="mono">{MODEL_SIZE_MB}</span> MB. Keep the Engine running. You can close
            this popup.
          </p>
        </>
      ) : status.state === 'failed' ? (
        <>
          {!flat && <h2 class="model__title">Download failed</h2>}
          <p class="error">{status.error}</p>
          <p class="model__text">Check the internet connection and try again.</p>
          <button type="button" class="btn" onClick={onDownload}>
            Try again
          </button>
        </>
      ) : (
        <>
          {!flat && <h2 class="model__title">Names and places are off</h2>}
          <p class="model__text">
            Download the GLiNER model to find surnames, organisations and places. About{' '}
            {MODEL_SIZE_MB} MB, once. Your text never leaves this computer.
          </p>
          <button type="button" class="btn" onClick={onDownload}>
            Download model
          </button>
        </>
      )}
    </div>
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
