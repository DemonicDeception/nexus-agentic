import { useState, useMemo } from 'react';
import { useStore } from '../store';

function detectContentType(output: string): 'html' | 'markdown' | 'code' {
  const trimmed = output.trim();
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.startsWith('<div') || trimmed.startsWith('<section') || trimmed.startsWith('<style')) {
    return 'html';
  }
  // Check for significant markdown indicators
  const mdSignals = (output.match(/^#{1,3}\s/gm) || []).length;
  const hasTable = output.includes('|---');
  const hasBullets = (output.match(/^[-*]\s/gm) || []).length > 2;
  if (mdSignals >= 2 || hasTable || hasBullets) return 'markdown';
  return 'code';
}

// Simple markdown → HTML renderer (no external deps)
function renderMarkdown(md: string): string {
  let html = md
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Code blocks
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr/>')
    // List items
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');

  // Wrap lists
  html = html.replace(/((<li>.*<\/li><br\/>?)+)/g, '<ul>$1</ul>');
  html = html.replace(/<br\/><\/li>/g, '</li>');

  // Tables
  html = html.replace(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/g, (_match, header, body) => {
    const ths = header.split('|').filter((c: string) => c.trim()).map((c: string) => `<th>${c.trim()}</th>`).join('');
    const rows = body.trim().split('\n').map((row: string) => {
      const tds = row.split('|').filter((c: string) => c.trim()).map((c: string) => `<td>${c.trim()}</td>`).join('');
      return `<tr>${tds}</tr>`;
    }).join('');
    return `<table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  return `<p>${html}</p>`;
}

const RENDERED_STYLES = `
  body { font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; background: #0a0f1e; padding: 24px; line-height: 1.7; margin: 0; }
  h1 { color: #00d4ff; font-size: 24px; border-bottom: 1px solid #1e293b; padding-bottom: 8px; margin-top: 0; }
  h2 { color: #00d4ff; font-size: 18px; margin-top: 24px; }
  h3 { color: #94a3b8; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 20px; }
  p { margin: 8px 0; }
  strong { color: #f1f5f9; }
  code { background: rgba(0,212,255,0.1); color: #00d4ff; padding: 2px 6px; border-radius: 3px; font-family: 'JetBrains Mono', monospace; font-size: 13px; }
  pre { background: rgba(0,0,0,0.4); border: 1px solid #1e293b; border-radius: 6px; padding: 16px; overflow-x: auto; }
  pre code { background: none; padding: 0; color: #e2e8f0; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  th { background: rgba(0,212,255,0.1); color: #00d4ff; text-align: left; padding: 8px 12px; border: 1px solid #1e293b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 8px 12px; border: 1px solid #1e293b; font-size: 13px; }
  tr:nth-child(even) { background: rgba(255,255,255,0.02); }
  ul, ol { padding-left: 20px; }
  li { margin: 4px 0; }
  hr { border: none; border-top: 1px solid #1e293b; margin: 20px 0; }
  a { color: #00d4ff; }
`;

export function AssetsPanel() {
  const open = useStore((s) => s.assetsOpen);
  const setOpen = useStore((s) => s.setAssetsOpen);
  const assets = useStore((s) => s.assets);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'rendered' | 'source'>('rendered');

  if (!open) return null;

  const selected = assets.find((a) => a.id === selectedId);
  const contentType = selected ? detectContentType(selected.output) : 'code';

  const renderedHtml = useMemo(() => {
    if (!selected) return '';
    if (contentType === 'html') return selected.output;
    if (contentType === 'markdown') return renderMarkdown(selected.output);
    return '';
  }, [selected, contentType]);

  const iframeContent = renderedHtml ? `<!DOCTYPE html><html><head><style>${RENDERED_STYLES}</style></head><body>${renderedHtml}</body></html>` : '';

  return (
    <div className="assets-panel">
      <div className="assets-header">
        <span className="assets-title">ASSETS</span>
        <span className="assets-count">{assets.length} artifacts</span>
        {selected && contentType !== 'code' && (
          <div className="assets-view-toggle">
            <button className={`assets-toggle-btn ${viewMode === 'rendered' ? 'active' : ''}`} onClick={() => setViewMode('rendered')}>Rendered</button>
            <button className={`assets-toggle-btn ${viewMode === 'source' ? 'active' : ''}`} onClick={() => setViewMode('source')}>Source</button>
          </div>
        )}
        <button className="assets-close" onClick={() => setOpen(false)}>x</button>
      </div>

      <div className="assets-body">
        <div className="assets-list">
          {assets.length === 0 && (
            <div className="assets-empty">No assets yet — agents produce assets when they complete tasks</div>
          )}
          {[...assets].reverse().map((asset) => {
            const type = detectContentType(asset.output);
            return (
              <div
                key={asset.id}
                className={`assets-item ${selectedId === asset.id ? 'active' : ''}`}
                onClick={() => { setSelectedId(asset.id); setViewMode('rendered'); }}
              >
                <div className="assets-item-header">
                  <span className="assets-item-dot" style={{ background: asset.color }} />
                  <span className="assets-item-agent" style={{ color: asset.color }}>{asset.agentName}</span>
                  <span className="assets-item-type">{type === 'html' ? 'HTML' : type === 'markdown' ? 'DOC' : 'CODE'}</span>
                  <span className="assets-item-dept">{asset.department}</span>
                </div>
                <div className="assets-item-task">{asset.task}</div>
                <div className="assets-item-time">{new Date(asset.timestamp).toLocaleTimeString()}</div>
              </div>
            );
          })}
        </div>

        <div className="assets-viewer">
          {selected ? (
            <>
              <div className="assets-viewer-header">
                <span style={{ color: selected.color }}>{selected.agentName}</span>
                <span className="assets-viewer-task">{selected.task}</span>
              </div>
              {viewMode === 'rendered' && contentType !== 'code' ? (
                <iframe
                  className="assets-viewer-iframe"
                  srcDoc={iframeContent}
                  sandbox="allow-same-origin"
                  title="Asset preview"
                />
              ) : (
                <pre className="assets-viewer-output">{selected.output}</pre>
              )}
            </>
          ) : (
            <div className="assets-viewer-empty">Select an asset to view</div>
          )}
        </div>
      </div>
    </div>
  );
}
