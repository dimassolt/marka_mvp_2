import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { engineRunning } from '@/utils/engine-status';

function Popup() {
  const [running, setRunning] = useState(false);

  useEffect(() => {
    engineRunning.getValue().then(setRunning);
    return engineRunning.watch((value) => setRunning(value));
  }, []);

  const toggle = () => engineRunning.setValue(!running);

  return (
    <div style={{ width: 220, padding: 16, font: '14px system-ui, sans-serif', textAlign: 'center' }}>
      <img
        src={running ? '/ghost-active.svg' : '/ghost-inactive.svg'}
        width={96}
        height={96}
        alt=""
      />
      <p style={{ margin: '8px 0 12px', fontWeight: 600 }}>
        {running ? 'Engine running' : 'Start Ghost Agent engine'}
      </p>
      <button
        onClick={toggle}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '2px solid #0A0B0F',
          borderRadius: 999,
          background: running ? '#0A0B0F' : '#FFFFFF',
          color: running ? '#FFFFFF' : '#0A0B0F',
          font: 'inherit',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {running ? 'Running: switch off' : 'Stopped: switch on'}
      </button>
    </div>
  );
}

render(<Popup />, document.getElementById('app')!);
