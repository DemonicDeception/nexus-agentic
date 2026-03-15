import { useState, useMemo } from 'react';
import { useStore } from '../store';

function detectContentType(output: string): 'html' | 'svg' | 'markdown' | 'code' {
  const trimmed = output.trim();
  // SVG image/diagram
  if (trimmed.startsWith('<svg') || trimmed.startsWith('<?xml') && trimmed.includes('<svg')) {
    return 'svg';
  }
  // Full HTML page or significant HTML content
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') ||
      (trimmed.startsWith('<') && trimmed.includes('</') && !trimmed.startsWith('<pre') &&
       (trimmed.includes('<style') || trimmed.includes('<div') || trimmed.includes('<section')))) {
    return 'html';
  }
  const mdSignals = (output.match(/^#{1,3}\s/gm) || []).length;
  const hasTable = output.includes('|---');
  const hasBullets = (output.match(/^[-*]\s/gm) || []).length > 2;
  if (mdSignals >= 2 || hasTable || hasBullets) return 'markdown';
  return 'code';
}

// Check if content can be previewed live
function canPreview(output: string): boolean {
  const lower = output.toLowerCase();
  // SVG content
  if (lower.includes('<svg') && lower.includes('</svg>')) return true;
  // HTML content
  return (lower.includes('<html') || lower.includes('<body') || lower.includes('<div') ||
          lower.includes('<section') || lower.includes('<style') || lower.includes('<canvas')) &&
         lower.includes('</');
}

// Extract renderable content from output
function extractHtmlForPreview(output: string): string {
  const trimmed = output.trim();

  // SVG — extract and wrap in HTML page with dark bg
  const svgMatch = output.match(/<svg[\s\S]*?<\/svg>/i);
  if (svgMatch) {
    return `<!DOCTYPE html><html><head><style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0f1e;}</style></head><body>${svgMatch[0]}</body></html>`;
  }

  // Extract from ```html code blocks
  const htmlBlock = output.match(/```html?\n([\s\S]*?)```/);
  if (htmlBlock) return htmlBlock[1];

  // Extract from ```svg code blocks
  const svgBlock = output.match(/```svg\n([\s\S]*?)```/);
  if (svgBlock) {
    return `<!DOCTYPE html><html><head><style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0f1e;}</style></head><body>${svgBlock[1]}</body></html>`;
  }

  // Complete HTML document
  const docMatch = output.match(/(<!DOCTYPE[\s\S]*<\/html>)/i);
  if (docMatch) return docMatch[1];

  // Raw HTML/SVG
  if (trimmed.startsWith('<')) return trimmed;

  // Wrap HTML fragments
  const bodyMatch = output.match(/<(?:div|section|header|main|style)[\s\S]*$/im);
  if (bodyMatch) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #fff; color: #111; }
      * { box-sizing: border-box; }
    </style></head><body>${bodyMatch[0]}</body></html>`;
  }

  return output;
}

function renderMarkdown(md: string): string {
  let html = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');

  html = html.replace(/((<li>.*<\/li><br\/>?)+)/g, '<ul>$1</ul>');
  html = html.replace(/<br\/><\/li>/g, '</li>');

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

const DOC_STYLES = `
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
  ul, ol { padding-left: 20px; } li { margin: 4px 0; }
  hr { border: none; border-top: 1px solid #1e293b; margin: 20px 0; }
`;

type ViewMode = 'rendered' | 'source' | 'preview';

export function AssetsPanel() {
  const open = useStore((s) => s.assetsOpen);
  const setOpen = useStore((s) => s.setAssetsOpen);
  const assets = useStore((s) => s.assets);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('rendered');

  if (!open) return null;

  const selected = assets.find((a) => a.id === selectedId);
  const contentType = selected ? detectContentType(selected.output) : 'code';
  const showPreview = selected ? canPreview(selected.output) : false;

  const renderedHtml = useMemo(() => {
    if (!selected) return '';
    if (contentType === 'html') return selected.output;
    if (contentType === 'markdown') return renderMarkdown(selected.output);
    return '';
  }, [selected, contentType]);

  const previewHtml = useMemo(() => {
    if (!selected || !showPreview) return '';
    return extractHtmlForPreview(selected.output);
  }, [selected, showPreview]);

  const iframeDoc = viewMode === 'preview' && previewHtml
    ? previewHtml
    : renderedHtml
      ? `<!DOCTYPE html><html><head><style>${DOC_STYLES}</style></head><body>${renderedHtml}</body></html>`
      : '';

  return (
    <div className="assets-panel">
      <div className="assets-header">
        <span className="assets-title">ASSETS</span>
        <span className="assets-count">{assets.length} artifacts</span>
        {selected && (
          <div className="assets-view-toggle">
            {(contentType === 'markdown') && (
              <button className={`assets-toggle-btn ${viewMode === 'rendered' ? 'active' : ''}`} onClick={() => setViewMode('rendered')}>Rendered</button>
            )}
            <button className={`assets-toggle-btn ${viewMode === 'source' ? 'active' : ''}`} onClick={() => setViewMode('source')}>Source</button>
            {showPreview && (
              <button className={`assets-toggle-btn preview ${viewMode === 'preview' ? 'active' : ''}`} onClick={() => setViewMode('preview')}>Preview</button>
            )}
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
            const preview = canPreview(asset.output);
            return (
              <div
                key={asset.id}
                className={`assets-item ${selectedId === asset.id ? 'active' : ''}`}
                onClick={() => { setSelectedId(asset.id); setViewMode(type === 'svg' || (type === 'code' && preview) ? 'preview' : type !== 'code' ? 'rendered' : 'source'); }}
              >
                <div className="assets-item-header">
                  <span className="assets-item-dot" style={{ background: asset.color }} />
                  <span className="assets-item-agent" style={{ color: asset.color }}>{asset.agentName}</span>
                  <span className="assets-item-type">{type === 'svg' ? 'SVG' : preview ? 'LIVE' : type === 'html' ? 'HTML' : type === 'markdown' ? 'DOC' : 'CODE'}</span>
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
              {viewMode === 'source' ? (
                <pre className="assets-viewer-output">{selected.output}</pre>
              ) : (viewMode === 'preview' && previewHtml) ? (
                <iframe
                  className="assets-viewer-iframe"
                  srcDoc={previewHtml}
                  sandbox="allow-scripts allow-same-origin"
                  title="Live preview"
                />
              ) : (viewMode === 'rendered' && iframeDoc) ? (
                <iframe
                  className="assets-viewer-iframe"
                  srcDoc={iframeDoc}
                  sandbox="allow-same-origin"
                  title="Rendered document"
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
