import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { checkEngine, engineRunning } from '@/utils/engine-status';
import {
  addSite,
  addWord,
  createDomain,
  customDomains,
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
function Header({ running, on = running }: { running: boolean; on?: boolean }) {
  return (
    <header class="header">
      <img
        src={on ? '/icon/active/128.png' : '/icon/inactive/128.png'}
        width={28}
        height={28}
        alt=""
      />
      <h1 class="title">Ghost Agent</h1>
      <span class={running ? 'chip' : 'chip chip--down'}>{running ? 'Running' : 'Engine down'}</span>
    </header>
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

  return (
    <main class="popup">
      <Header running on={on} />

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
          onClick={() => setSiteOn(host, !on)}
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
            <option value="free">Free</option>
            <option value="health">Health</option>
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
      {words.length > 0 && (
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
        <ul class="chips">
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
  const health = domain === 'health';
  return (
    <section class="section">
      <div class="heading-row">
        <h2 class={health ? 'heading heading--domain' : 'heading'}>{health ? 'Health' : 'Free'}</h2>
        <span class="pill">Built-in</span>
      </div>
      {health && (
        <p class="body">
          234 health words in Bokmål and English: diagnoses, medicines, and terms like innlagt and
          sykemeldt.
        </p>
      )}
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
