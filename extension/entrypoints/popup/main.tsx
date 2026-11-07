import { render } from 'preact';
// Fonts are bundled with the extension, never fetched: nothing leaves the machine.
import '@fontsource/schibsted-grotesk/700.css';
import '@fontsource/instrument-sans/400.css';
import '@fontsource/instrument-sans/500.css';
import '@fontsource/dm-mono/400.css';
import '@fontsource/dm-mono/500.css';
import '@/assets/tokens.css';
import './style.css';
import { App } from './App';

render(<App />, document.getElementById('app')!);
