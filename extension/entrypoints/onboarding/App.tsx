/**
 * First-run onboarding: why Ghost Agent is safe, starting the Engine, choosing a Domain,
 * and a hands-on try of underlines, the Card, the Ghost bar and Restore.
 *
 * The screens only use the settings in utils/ (storage items and Engine calls), so the
 * desktop App can reuse them by swapping those modules for its own.
 */
import type { ComponentChildren } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { ModelNotice, useModelStatus, useRephraseModelStatus } from '@/entrypoints/popup/App';
import {
  REPHRASE_FAILURES,
  checkEngine,
  engineRunning,
  type Finding,
  type RephraseResult,
} from '@/utils/engine-status';
import {
  SAMPLE_FINDINGS,
  SAMPLE_TEXT,
  featuredDomains,
  AI_CHAT_SITES,
  checkEverywhere,
  checkOnlyChosenSites,
  onboardingDone,
  placeholdersFor,
  splitByFindings,
} from '@/utils/onboarding';
import {
  BUILT_IN_DOMAINS,
  BUILT_IN_DOMAIN_INFO,
  addSite,
  addWord,
  createDomain,
  customDomains,
  isBuiltInDomain,
  removeSite,
  removeWord,
  selectedDomain,
  sites,
} from '@/utils/popup-settings';
import { sentenceAround } from '@/utils/sentence';

const STEPS = ['Welcome', 'Engine', 'Domain', 'Try it', 'Done'] as const;

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

/** Whether the Engine runs, re-checked every 2 s while a screen needs to know. */
function useEngine(poll: boolean): boolean {
  const running = useItem(engineRunning) ?? false;
  useEffect(() => {
    if (!poll) return;
    checkEngine();
    const timer = setInterval(checkEngine, 2000);
    return () => clearInterval(timer);
  }, [poll]);
  return running;
}

export function Onboarding() {
  const [step, setStep] = useState(0);
  const top = useRef<HTMLDivElement>(null);
  const go = (to: number) => {
    setStep(to);
    top.current?.focus();
    window.scrollTo({ top: 0 });
  };
  const next = () => go(step + 1);
  const back = () => go(step - 1);
  const finish = async () => {
    await onboardingDone.setValue(true);
    window.close();
  };

  return (
    <div class="page">
      <div class="sheet" ref={top} tabIndex={-1} aria-live="polite">
        <header class="masthead">
          <img src="/icon/active/128.png" width={32} height={32} alt="" />
          <span class="brand">Ghost Agent</span>
          <Progress step={step} />
        </header>

        {step === 0 && <Welcome onNext={next} onSkip={finish} />}
        {step === 1 && <Engine onNext={next} onBack={back} />}
        {step === 2 && <Domains onNext={next} onBack={back} />}
        {step === 3 && <Practice onNext={next} onBack={back} />}
        {step === 4 && <Done onBack={back} onFinish={finish} />}
      </div>
    </div>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <nav class="progress" aria-label={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}>
      <ol class="progress__dots">
        {STEPS.map((name, i) => (
          <li
            key={name}
            class={i === step ? 'dot dot--now' : i < step ? 'dot dot--done' : 'dot'}
            aria-current={i === step ? 'step' : undefined}
          />
        ))}
      </ol>
      <span class="hint">
        {step + 1} of {STEPS.length}
      </span>
    </nav>
  );
}

function Footer({
  onBack,
  onNext,
  next = 'Continue',
  aside,
}: {
  onBack?: () => void;
  onNext: () => void;
  next?: string;
  aside?: ComponentChildren;
}) {
  return (
    <footer class="footer">
      {onBack ? (
        <button type="button" class="text-btn" onClick={onBack}>
          Back
        </button>
      ) : (
        aside
      )}
      <button type="button" class="btn" onClick={onNext}>
        {next}
      </button>
    </footer>
  );
}

/* Step 1: what it does and the local promise */

function Welcome({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <section class="step">
      <h1 class="display">Your text stays yours.</h1>
      <p class="lead">
        Ghost Agent underlines personal and sensitive data while you write to an AI chat, so you
        can hide it before you press Send.
      </p>

      <figure class="flow" aria-label="Your text is checked on this computer and never sent to our servers">
        <div class="flow__node">
          <span class="flow__label">Your text</span>
          <span class="mono flow__sample">Kari, fnr 01019000083</span>
        </div>
        <Arrow />
        <div class="flow__node flow__node--here">
          <span class="flow__label">This computer</span>
          <span class="hint">Ghost Agent Engine checks it</span>
        </div>
        <Arrow crossed />
        <div class="flow__node flow__node--away">
          <span class="flow__label">Our servers</span>
          <span class="hint">Never receive it. We don't run any.</span>
        </div>
      </figure>

      <ul class="promises">
        <Pledge title="Checked on this computer">
          Text goes from your browser to the Engine on your own machine (127.0.0.1) and nowhere
          else. It works offline.
        </Pledge>
        <Pledge title="Forgotten when you close the browser">
          Hidden values are kept in memory only, so Ghost Agent can show them back to you. Nothing
          is written to disk or logged.
        </Pledge>
        <Pledge title="You decide">
          Ghost Agent only underlines. Nothing in your message changes until you click Hide or
          accept a Rephrase.
        </Pledge>
      </ul>

      <Footer
        onNext={onNext}
        next="Get started"
        aside={
          <button type="button" class="text-btn" onClick={onSkip}>
            Skip the tour
          </button>
        }
      />
    </section>
  );
}

function Pledge({ title, children }: { title: string; children: ComponentChildren }) {
  return (
    <li class="promise">
      <Icon size={20}>
        <path d="M20 6 9 17l-5-5" />
      </Icon>
      <div>
        <h2 class="promise__title">{title}</h2>
        <p class="body">{children}</p>
      </div>
    </li>
  );
}

function Arrow({ crossed = false }: { crossed?: boolean }) {
  return (
    <span class={crossed ? 'flow__arrow flow__arrow--crossed' : 'flow__arrow'} aria-hidden="true">
      <Icon size={22}>
        {crossed ? (
          <>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </>
        ) : (
          <>
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </>
        )}
      </Icon>
    </span>
  );
}

/* Step 2: start the Engine */

function Engine({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const running = useEngine(true);
  const [model, download] = useModelStatus(running);
  return (
    <section class="step">
      <h1 class="display">Start the Engine</h1>
      <p class="lead">
        The Engine is the part of Ghost Agent that reads your text. It runs on this computer, so
        your text never has to leave it.
      </p>

      <div class={running ? 'status status--ok' : 'status'} role="status">
        <span class={running ? 'chip' : 'chip chip--down'}>{running ? 'Running' : 'Not running'}</span>
        <span class="body">
          {running
            ? 'All set. Text is checked here, on this computer.'
            : 'Waiting for the Engine. This page notices as soon as it starts.'}
        </span>
      </div>

      {running && model && model.state !== 'ready' && <ModelNotice status={model} onDownload={download} />}

      {!running && (
        <div class="stack">
          <p class="body">In the Ghost Agent project folder, run:</p>
          {/* Two lines, not &&: works in cmd, PowerShell and zsh alike. */}
          <code class="code">{'cd engine\nuv run ghost-engine'}</code>
          <p class="hint">
            Without the Engine nothing is underlined. Click the Ghost Agent icon in your toolbar
            any time to see whether it's running.
          </p>
        </div>
      )}

      <Footer onBack={onBack} onNext={onNext} next={running ? 'Continue' : 'Continue without it'} />
    </section>
  );
}

/* Step 3: choose a Domain */

function Domains({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const domain = useItem(selectedDomain) ?? 'free';
  const own = useItem(customDomains) ?? {};
  const [making, setMaking] = useState(false);

  const pick = (name: string) => {
    setMaking(false);
    selectedDomain.setValue(name);
  };
  // Free and two Domains as cards; the other built-in Domains and the user's own in a list.
  const { cards, more } = featuredDomains(BUILT_IN_DOMAINS);
  const listed = [...more, ...Object.keys(own)];
  const inList = !making && listed.includes(domain);

  return (
    <section class="step">
      <h1 class="display">What do you write about?</h1>
      <p class="lead">
        A Domain tells Ghost Agent what counts as sensitive in your work. One Domain is active at a
        time, and every Domain includes the Base checks.
      </p>

      <div class="base">
        <span class="label">Base checks, always on</span>
        <ul class="tags">
          {['Fødselsnummer', 'D-nummer', 'Bank account', 'Card', 'IBAN', 'Passwords and keys', 'Email', 'Phone', 'Names'].map(
            (t) => (
              <li key={t} class="tag">
                {t}
              </li>
            ),
          )}
        </ul>
      </div>

      <div class="choices" role="radiogroup" aria-label="Domain">
        {cards.map((name) => (
          <Choice
            key={name}
            checked={domain === name && !making}
            onSelect={() => pick(name)}
            title={BUILT_IN_DOMAIN_INFO[name].label}
            tag="Built-in"
          >
            {BUILT_IN_DOMAIN_INFO[name].about}
          </Choice>
        ))}
        <Choice
          checked={making}
          onSelect={() => setMaking(true)}
          title="Make your own"
          tag="Custom"
        >
          Add words only you know are sensitive, like a client, a project or a place.
        </Choice>
      </div>

      {listed.length > 0 && (
        <div class="more">
          <label for="more-domains" class="label">
            More Domains
          </label>
          <select
            id="more-domains"
            class={inList ? 'select select--chosen' : 'select'}
            value={inList ? domain : ''}
            onChange={(e) => e.currentTarget.value && pick(e.currentTarget.value)}
          >
            <option value="" disabled>
              Choose another Domain
            </option>
            {more.map((name) => (
              <option key={name} value={name}>
                {BUILT_IN_DOMAIN_INFO[name].label}
              </option>
            ))}
            {Object.keys(own).map((name) => (
              <option key={name} value={name}>
                {name} (yours)
              </option>
            ))}
          </select>
          {inList && isBuiltInDomain(domain) && <p class="hint">{BUILT_IN_DOMAIN_INFO[domain].about}</p>}
        </div>
      )}

      {making && <NewDomain onCreated={() => setMaking(false)} />}
      {!making && own[domain] && <Words domain={domain} words={own[domain]!} />}

      <p class="hint">You can switch Domain or edit your words any time from the Ghost Agent icon in your toolbar.</p>

      <Footer onBack={onBack} onNext={onNext} />
    </section>
  );
}

function Choice({
  checked,
  onSelect,
  title,
  tag,
  children,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  tag: string;
  children: ComponentChildren;
}) {
  return (
    <button type="button" role="radio" aria-checked={checked} class="choice" onClick={onSelect}>
      <span class="choice__head">
        <span class="choice__mark" aria-hidden="true" />
        <span class="choice__title">{title}</span>
        <span class="pill">{tag}</span>
      </span>
      <span class="body">{children}</span>
    </button>
  );
}

function NewDomain({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [taken, setTaken] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);

  const submit = async (e: Event) => {
    e.preventDefault();
    if (await createDomain(name)) onCreated();
    else setTaken(true);
  };

  return (
    <form class="panel" onSubmit={submit}>
      <label for="domain-name" class="label">
        Name your Domain
      </label>
      <div class="row">
        <input
          ref={input}
          id="domain-name"
          class="input"
          placeholder="e.g. Clinic, Clients, School"
          value={name}
          aria-invalid={taken}
          aria-describedby={taken ? 'domain-name-error' : undefined}
          onInput={(e) => {
            setName(e.currentTarget.value);
            setTaken(false);
          }}
        />
        <button type="submit" class="btn" disabled={!name.trim()}>
          Create
        </button>
      </div>
      {taken && (
        <p id="domain-name-error" class="error">
          A Domain with this name already exists.
        </p>
      )}
      <p class="hint">Saved on this computer only. You add your words next.</p>
    </form>
  );
}

function Words({ domain, words }: { domain: string; words: string[] }) {
  const [word, setWord] = useState('');
  const submit = async (e: Event) => {
    e.preventDefault();
    await addWord(domain, word);
    setWord('');
  };

  return (
    <div class="panel">
      <div class="heading-row">
        <span class="label">Words in {domain}</span>
        <span class="hint">On this computer</span>
      </div>
      {words.length > 0 && (
        <ul class="chips">
          {words.map((w) => (
            <li key={w} class="word">
              {w}
              <button type="button" class="word__remove" aria-label={`Remove ${w}`} onClick={() => removeWord(domain, w)}>
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
          class="input"
          aria-label={`Add a word to ${domain}`}
          placeholder="Add a word, like Ullevål"
          value={word}
          onInput={(e) => setWord(e.currentTarget.value)}
        />
        <button type="submit" class="btn" disabled={!word.trim()}>
          Add
        </button>
      </form>
      <p class="hint">
        End a word with * to match its endings too: <span class="mono">diabet*</span> finds diabetes
        and diabetiker.
      </p>
    </div>
  );
}

/* Step 4: try underlines, the Card, the Ghost bar and Restore */

function Practice({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const running = useEngine(true);
  const rephraseModel = useRephraseModelStatus(running);
  const domain = useItem(selectedDomain) ?? 'free';
  const [text, setText] = useState(SAMPLE_TEXT);
  const [found, setFound] = useState<Finding[]>(SAMPLE_FINDINGS);

  // With the Engine running, check the text for real, with the chosen Domain.
  useEffect(() => {
    if (!running) {
      setText(SAMPLE_TEXT);
      setFound(SAMPLE_FINDINGS);
      return;
    }
    const timer = setTimeout(async () => {
      const findings: Finding[] = await browser.runtime.sendMessage({ type: 'detect', text });
      setFound(findings);
    }, 600);
    return () => clearTimeout(timer);
  }, [running, text, domain]);

  const rephraseOff = !running
    ? 'Start the Engine to try Rephrase.'
    : rephraseModel?.state === 'ready'
      ? null
      : rephraseModel?.state === 'loading' || rephraseModel?.state === 'idle'
        ? 'Rephrase model is loading. Try again in a few seconds.'
        : REPHRASE_FAILURES['model-missing'];

  return (
    <section class="step">
      <h1 class="display">Try it here</h1>
      <p class="lead">
        Hover an underline to open its Card. The tab on top of the field hides everything at once.
      </p>

      <Field
        key={`${text}\u0000${JSON.stringify(found)}`}
        text={text}
        findings={found}
        rephraseOff={rephraseOff}
        onRewrite={setText}
      />

      {running ? (
        <div class="stack">
          <label for="own-text" class="label">
            Or try your own text, checked with your Domain ({domainName(domain)})
          </label>
          <textarea
            id="own-text"
            class="input textarea"
            rows={3}
            value={text}
            onInput={(e) => setText(e.currentTarget.value)}
          />
          <p class="hint">Checked on this computer only. Nothing you type here is sent or saved.</p>
        </div>
      ) : (
        <p class="hint">
          This is an example. Start the Engine to check your own text and see your Domain at work.
        </p>
      )}

      <RestoreExample />

      <Footer onBack={onBack} onNext={onNext} />
    </section>
  );
}

/** A built-in Domain's label, or the user's own Domain name as they typed it. */
function domainName(domain: string): string {
  return isBuiltInDomain(domain) ? BUILT_IN_DOMAIN_INFO[domain].label : domain;
}

/** The open Card's Rephrase: waiting for the Engine, the rewrite to accept, or why there is none. */
type Rephrasing =
  | { i: number; state: 'waiting' }
  | { i: number; state: 'preview'; start: number; end: number; text: string }
  | { i: number; state: 'failed'; message: string };

/**
 * A practice field with main's Card and Ghost bar: the real underline colours, Hide, Rephrase,
 * Ignore and their "all". Rephrase asks the Engine like a chat does; Accept rewrites the text.
 */
function Field({
  text,
  findings,
  rephraseOff,
  onRewrite,
}: {
  text: string;
  findings: Finding[];
  /** Why Rephrase can't run here, or null when it can. */
  rephraseOff: string | null;
  onRewrite: (text: string) => void;
}) {
  const pieces = useMemo(() => splitByFindings(text, findings), [text, findings]);
  const placeholders = useMemo(() => placeholdersFor(text, findings), [text, findings]);
  const [hidden, setHidden] = useState<number[]>([]);
  const [ignored, setIgnored] = useState<number[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const [menu, setMenu] = useState(false);
  const [rephrasing, setRephrasing] = useState<Rephrasing | null>(null);

  const left = findings.map((_, i) => i).filter((i) => !hidden.includes(i) && !ignored.includes(i));
  const close = () => {
    setOpen(null);
    setRephrasing(null);
  };
  const hide = (which: number[]) => {
    setHidden([...hidden, ...which]);
    close();
    setMenu(false);
  };
  const ignoreAll = () => {
    setIgnored([...ignored, ...left]);
    setMenu(false);
  };
  // In a chat the editor's own Ctrl+Z undoes a Hide; here the example just starts over.
  const reset = () => {
    setHidden([]);
    setIgnored([]);
  };
  const touched = hidden.length + ignored.length > 0;
  // Ignore covers every occurrence of the same value (docs/spec.md §3).
  const ignore = (i: number) => {
    const same = findings.map((_, j) => j).filter((j) => placeholders[j] === placeholders[i]);
    setIgnored([...ignored, ...same]);
    close();
  };
  const rephrase = async (i: number) => {
    const { start, end } = sentenceAround(text, findings[i]!.start, findings[i]!.end);
    setRephrasing({ i, state: 'waiting' });
    const result: RephraseResult | undefined = await browser.runtime
      .sendMessage({ type: 'rephrase', sentence: text.slice(start, end) })
      .catch(() => undefined);
    // The Card may have closed while the Engine worked.
    setRephrasing((now) => {
      if (now?.i !== i) return now;
      if (!result) return { i, state: 'failed', message: REPHRASE_FAILURES.failed };
      if (!result.ok) return { i, state: 'failed', message: REPHRASE_FAILURES[result.reason] };
      return { i, state: 'preview', start, end, text: result.text };
    });
  };
  const accept = () => {
    if (rephrasing?.state !== 'preview') return;
    onRewrite(text.slice(0, rephrasing.start) + rephrasing.text + text.slice(rephrasing.end));
  };
  // While a Rephrase runs or waits for Accept, the Card stays open without the pointer.
  const busy = (i: number) => rephrasing?.i === i && rephrasing.state !== 'failed';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      close();
      setMenu(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  let index = -1;
  return (
    <div class="field">
      {left.length > 0 && (
        <div class="ghost">
          {menu && (
            <div class="ghost__menu" role="menu" aria-label="Ghost bar">
              <button type="button" role="menuitem" onClick={() => hide(left)}>
                Hide all<span class="mono ghost__count">{left.length}</span>
              </button>
              <button type="button" role="menuitem" onClick={ignoreAll}>
                Ignore all<span class="mono ghost__count">{left.length}</span>
              </button>
            </div>
          )}
          <button type="button" class="ghost__tab" aria-expanded={menu} onClick={() => setMenu(!menu)}>
            <span class="mono ghost__count">{left.length}</span>to check
          </button>
        </div>
      )}

      <p class="field__text">
        {pieces.map((piece, p) => {
          if (!('colour' in piece)) return <span key={p}>{piece.text}</span>;
          const i = ++index;
          if (hidden.includes(i)) return <span key={p} class="mono placeholder">{placeholders[i]}</span>;
          if (ignored.includes(i)) return <span key={p}>{piece.text}</span>;
          const name = findings[i]!.name ?? piece.category;
          const r = rephrasing?.i === i ? rephrasing : null;
          return (
            <span
              key={p}
              class="finding"
              onMouseEnter={() => open !== i && (close(), setOpen(i))}
              onMouseLeave={() => !busy(i) && open === i && close()}
            >
              <button
                type="button"
                class={`u u--${piece.colour} finding__text`}
                aria-expanded={open === i}
                aria-label={`${name}: ${piece.text}`}
                onClick={() => (open === i ? close() : (close(), setOpen(i)))}
              >
                {piece.text}
              </button>
              {open === i && (
                <span class={`card card--${piece.colour}`} role="dialog" aria-label={`${name} found`}>
                  <span class="card__label">
                    <span class="card__name">{name}</span>
                    <span class="mono card__value">{piece.text}</span>
                    <span class="mono card__stamp">hide as {placeholders[i]}</span>
                  </span>
                  <span class="card__tear" />
                  {r && (
                    <span class="card__rephrase">
                      {r.state === 'waiting' && (
                        <span class="card__status" role="status">
                          Rephrasing…
                        </span>
                      )}
                      {r.state === 'failed' && (
                        <span class="card__status card__status--failed" role="status">
                          {r.message}
                        </span>
                      )}
                      {r.state === 'preview' && (
                        <>
                          <span class="card__preview">{r.text}</span>
                          <span class="card__actions card__actions--decide">
                            <button type="button" class="btn btn--card" onClick={accept}>
                              Accept
                            </button>
                            <button type="button" class="text-btn btn--card" onClick={() => setRephrasing(null)}>
                              Reject
                            </button>
                          </span>
                        </>
                      )}
                    </span>
                  )}
                  {(!r || r.state === 'failed') && (
                    <span class="card__actions">
                      <button type="button" class="btn btn--card" onClick={() => hide([i])}>
                        Hide
                      </button>
                      <button
                        type="button"
                        class="btn-clear btn--card"
                        disabled={rephraseOff !== null}
                        aria-describedby={rephraseOff ? `rephrase-off-${i}` : undefined}
                        onClick={() => rephrase(i)}
                      >
                        Rephrase
                      </button>
                      <button type="button" class="text-btn btn--card" onClick={() => ignore(i)}>
                        Ignore
                      </button>
                    </span>
                  )}
                  {rephraseOff && !r && (
                    <span id={`rephrase-off-${i}`} class="card__note">
                      {rephraseOff}
                    </span>
                  )}
                </span>
              )}
            </span>
          );
        })}
      </p>

      {touched && (
        <p class="hint">
          In a chat, Ctrl+Z puts a hidden value back.{' '}
          <button type="button" class="link-btn" onClick={reset}>
            Start over
          </button>
        </p>
      )}
    </div>
  );
}

function RestoreExample() {
  return (
    <div class="restore">
      <h2 class="heading">When the AI answers</h2>
      <div class="restore__panes">
        <div class="restore__pane">
          <span class="label">The AI sees</span>
          <p class="body">
            Kjære <span class="mono placeholder">[PERSON_1]</span>, her er henvisningen…
          </p>
        </div>
        <div class="restore__pane">
          <span class="label">You see</span>
          <p class="body">
            Kjære <span class="restored">Kari</span>, her er henvisningen…
          </p>
        </div>
      </div>
      <p class="hint">
        Restore puts your values back in the answer, on your screen only. The real name never left
        your computer.
      </p>
    </div>
  );
}

/* Step 5: done */

function Done({ onBack, onFinish }: { onBack: () => void; onFinish: () => void }) {
  const domain = useItem(selectedDomain) ?? 'free';
  return (
    <section class="step">
      <h1 class="display">You're set.</h1>
      <p class="lead">Ghost Agent now checks what you write in AI chats, right here on this computer.</p>

      <Sites />

      <ol class="checklist">
        <li>
          <span class="checklist__n mono">1</span>
          <div>
            <h2 class="promise__title">Pin Ghost Agent to your toolbar</h2>
            <p class="body">
              Click the puzzle piece next to the address bar, then the pin next to Ghost Agent. The
              ghost wears sunglasses on sites it checks.
            </p>
          </div>
        </li>
        <li>
          <span class="checklist__n mono">2</span>
          <div>
            <h2 class="promise__title">Your Domain: {domainName(domain)}</h2>
            <p class="body">
              Click the icon to switch Domain, add your own words, change your sites, or turn Ghost
              Agent off for the site you're on.
            </p>
          </div>
        </li>
        <li>
          <span class="checklist__n mono">3</span>
          <div>
            <h2 class="promise__title">Write as usual</h2>
            <p class="body">Paste or type into the chat. Sensitive data is underlined before you send it.</p>
          </div>
        </li>
      </ol>

      <Footer onBack={onBack} onNext={onFinish} next="Done" />
    </section>
  );
}

/** Where Ghost Agent works: every site, or only the ones the user lists (the popup's Sites). */
function Sites() {
  const list = useItem(sites) ?? ['*'];
  const [site, setSite] = useState('');
  const everywhere = list.includes('*');
  const chosen = list.filter((s) => s !== '*');
  const suggested = AI_CHAT_SITES.filter((s) => !chosen.includes(s));

  const submit = async (e: Event) => {
    e.preventDefault();
    await addSite(site);
    setSite('');
  };

  return (
    <div class="stack">
      <h2 class="heading">Where should Ghost Agent work?</h2>
      <div class="choices" role="radiogroup" aria-label="Where Ghost Agent works">
        <Choice checked={everywhere} onSelect={checkEverywhere} title="Everywhere" tag="Default">
          Every site you type on, from AI chats to email.
        </Choice>
        <Choice checked={!everywhere} onSelect={checkOnlyChosenSites} title="Only sites I choose" tag="Sites">
          For example only AI chats. Everything else stays untouched.
        </Choice>
      </div>

      {!everywhere && (
        <div class="panel">
          {chosen.length > 0 ? (
            <ul class="chips">
              {chosen.map((s) => (
                <li key={s} class="word word--site">
                  {s}
                  <button type="button" class="word__remove" aria-label={`Remove ${s}`} onClick={() => removeSite(s)}>
                    <Icon size={12} stroke={2.5}>
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </Icon>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p class="error">No sites yet, so Ghost Agent checks nothing. Add one below.</p>
          )}
          {suggested.length > 0 && (
            <div class="suggest">
              <span class="hint">Add:</span>
              {suggested.map((s) => (
                <button key={s} type="button" class="suggest__btn" onClick={() => addSite(s)}>
                  + {s}
                </button>
              ))}
            </div>
          )}
          <form class="row" onSubmit={submit}>
            <input
              class="input"
              aria-label="Add a site"
              placeholder="Add a site, like mail.google.com"
              value={site}
              onInput={(e) => setSite(e.currentTarget.value)}
            />
            <button type="submit" class="btn" disabled={!site.trim()}>
              Add
            </button>
          </form>
        </div>
      )}
    </div>
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
