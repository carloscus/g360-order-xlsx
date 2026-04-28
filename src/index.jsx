import { render } from 'solid-js/web'
import { Router, Route } from '@solidjs/router'
import App from './App'
import HomePage from './pages/HomePage'
import { DistributionPage } from './components/DistributionPage'
import { ThemeProvider } from './context/ThemeContext'

// G360 Signature Custom Element (Official G360-CLI Guidelines)
class G360Signature extends HTMLElement {
  connectedCallback() {
    const mode = this.getAttribute('mode') || 'client'
    const version = this.getAttribute('version') || ''
    
    const isOwn = mode === 'own'
    const mainText = isOwn ? 'G360 by ccusi' : 'powered by G360'
    const versionHtml = version ? `<span class="g360-separator">></span><span class="g360-version">${version}</span>` : ''
    
    this.innerHTML = `
      <style>
        .g360-sig {
          display: inline-block;
          opacity: 0.4;
          transition: opacity 0.3s ease;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 12px;
          line-height: 1;
        }
        .g360-sig:hover {
          opacity: 1;
        }
        .g360-container {
          display: flex;
          align-items: center;
          gap: 4px;
          height: 18px;
        }
        .g360-isotype-wrapper {
          display: flex;
          align-items: center;
          gap: 1px;
          height: 100%;
        }
        .g360-isotype {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 2px;
          height: 100%;
        }
        .g360-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
        }
        .g360-dot-top { background: var(--g360-gray, #94a3b8); }
        .g360-dot-mid { background: var(--g360-green, #00d084); }
        .g360-dot-bottom { background: var(--g360-gray, #94a3b8); }
        .g360-chevron {
          color: var(--g360-green, #00d084);
          width: 20px;
          height: 20px;
        }
        .g360-text {
          color: var(--g360-gray, #94a3b8);
          letter-spacing: 0.5px;
        }
        .g360-version {
          color: var(--g360-gray, #94a3b8);
          opacity: 0.7;
        }
        .g360-separator {
          color: var(--g360-gray, #94a3b8);
          opacity: 0.5;
        }
        @media (prefers-color-scheme: light) {
          .g360-sig {
            --g360-green: #00d084;
            --g360-gray: #64748b;
          }
        }
        @media (prefers-color-scheme: dark) {
          .g360-sig {
            --g360-green: #00d084;
            --g360-gray: #94a3b8;
          }
        }
      </style>
      <div class="g360-sig">
        <div class="g360-container">
          <div class="g360-isotype-wrapper">
            <div class="g360-isotype">
              <div class="g360-dot g360-dot-top"></div>
              <div class="g360-dot g360-dot-mid"></div>
              <div class="g360-dot g360-dot-bottom"></div>
            </div>
            <svg class="g360-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 4 14 10 6 16"></polyline>
            </svg>
          </div>
          <span class="g360-text">${mainText}</span>
          ${versionHtml}
        </div>
      </div>
    `
  }
}

if (!customElements.get('g360-signature')) {
  customElements.define('g360-signature', G360Signature)
}

render(() => (
  <ThemeProvider>
    <Router root={App}>
      <Route path="/" component={HomePage} />
      <Route path="/distribucion" component={DistributionPage} />
    </Router>
  </ThemeProvider>
), document.getElementById('root'))