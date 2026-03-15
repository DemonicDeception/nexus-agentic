import { useState, useMemo } from 'react';
import { useStore } from '../store';

type ContentType = 'html' | 'svg' | 'markdown' | 'code';

// Strip markdown code fences to get the actual content
function stripFences(output: string): string {
  // Remove leading ```html or ```svg etc and trailing ```
  return output.replace(/^```\w*\n?/gm, '').replace(/```\s*$/gm, '').trim();
}

function detectContentType(output: string): ContentType {
  const stripped = stripFences(output).trim();
  if (stripped.startsWith('<svg')) return 'svg';
  if (stripped.startsWith('<!DOCTYPE') || stripped.startsWith('<html')) return 'html';
  // Check if code fences contain HTML
  const fenceMatch = output.match(/```html?\n([\s\S]*?)```/);
  if (fenceMatch) return 'html';
  const svgFence = output.match(/```svg\n([\s\S]*?)```/);
  if (svgFence) return 'svg';
  const headings = (output.match(/^#{1,3}\s/gm) || []).length;
  if (headings >= 2 || output.includes('|---')) return 'markdown';
  return 'code';
}

function canPreview(output: string, type: ContentType): boolean {
  if (type === 'svg' || type === 'html') return true;
  const stripped = stripFences(output).toLowerCase();
  return stripped.includes('<!doctype') || (stripped.includes('<html') && stripped.includes('</html>'));
}

function extractForPreview(output: string, type: ContentType): string {
  const stripped = stripFences(output);

  if (type === 'svg') {
    const svg = stripped.match(/<svg[\s\S]*?<\/svg>/i);
    return svg
      ? `<!DOCTYPE html><html><head><style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0f1e;}</style></head><body>${svg[0]}</body></html>`
      : stripped;
  }

  // For HTML: try to extract clean HTML from fences or raw output
  const fenceMatch = output.match(/```html?\n([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  const doc = stripped.match(/(<!DOCTYPE[\s\S]*?<\/html>)/i);
  if (doc) return doc[1];

  // If stripped content starts with HTML tags, use it directly
  if (stripped.startsWith('<!DOCTYPE') || stripped.startsWith('<html')) return stripped;

  return stripped;
}

function renderMarkdown(md: string): string {
  return md
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
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

const DOC_STYLES = `body{font-family:'Inter',system-ui,sans-serif;color:#e2e8f0;background:#0a0f1e;padding:24px;line-height:1.7;margin:0}h1{color:#00d4ff;font-size:24px;border-bottom:1px solid #1e293b;padding-bottom:8px}h2{color:#00d4ff;font-size:18px;margin-top:24px}h3{color:#94a3b8;font-size:14px;text-transform:uppercase;letter-spacing:1px}strong{color:#f1f5f9}code{background:rgba(0,212,255,0.1);color:#00d4ff;padding:2px 6px;border-radius:3px;font-family:monospace;font-size:13px}pre{background:rgba(0,0,0,0.4);border:1px solid #1e293b;border-radius:6px;padding:16px;overflow-x:auto}pre code{background:none;padding:0;color:#e2e8f0}table{border-collapse:collapse;width:100%;margin:12px 0}th{background:rgba(0,212,255,0.1);color:#00d4ff;text-align:left;padding:8px 12px;border:1px solid #1e293b;font-size:12px}td{padding:8px 12px;border:1px solid #1e293b;font-size:13px}tr:nth-child(even){background:rgba(255,255,255,0.02)}ul,ol{padding-left:20px}li{margin:4px 0}hr{border:none;border-top:1px solid #1e293b;margin:20px 0}`;

type ViewMode = 'rendered' | 'source' | 'preview';

export function AssetsPanel() {
  const open = useStore((s) => s.assetsOpen);
  const setOpen = useStore((s) => s.setAssetsOpen);
  const assets = useStore((s) => s.assets);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('source');

  const selected = open ? assets.find((a) => a.id === selectedId) : undefined;
  const contentType = selected ? detectContentType(selected.output) : 'code';
  const previewable = selected ? canPreview(selected.output, contentType) : false;

  const iframeSrc = useMemo(() => {
    if (!selected) return '';
    if (viewMode === 'preview' && previewable) {
      return extractForPreview(selected.output, contentType);
    }
    if (viewMode === 'rendered' && contentType === 'markdown') {
      const html = renderMarkdown(selected.output);
      return `<!DOCTYPE html><html><head><style>${DOC_STYLES}</style></head><body>${html}</body></html>`;
    }
    return '';
  }, [selected?.id, viewMode, contentType, previewable]);

  if (!open) return null;

  return (
    <div className="assets-panel">
      <div className="assets-header">
        <span className="assets-title">ASSETS</span>
        <span className="assets-count">{assets.length} artifacts</span>
        {selected && (
          <div className="assets-view-toggle">
            <button className={`assets-toggle-btn ${viewMode === 'source' ? 'active' : ''}`} onClick={() => setViewMode('source')}>Source</button>
            {contentType === 'markdown' && (
              <button className={`assets-toggle-btn ${viewMode === 'rendered' ? 'active' : ''}`} onClick={() => setViewMode('rendered')}>Rendered</button>
            )}
            {previewable && (
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
            const prev = canPreview(asset.output, type);
            const badge = type === 'svg' ? 'SVG' : type === 'html' ? 'HTML' : prev ? 'LIVE' : type === 'markdown' ? 'DOC' : 'CODE';
            return (
              <div
                key={asset.id}
                className={`assets-item ${selectedId === asset.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedId(asset.id);
                  setViewMode(prev ? 'preview' : type === 'markdown' ? 'rendered' : 'source');
                }}
              >
                <div className="assets-item-header">
                  <span className="assets-item-dot" style={{ background: asset.color }} />
                  <span className="assets-item-agent" style={{ color: asset.color }}>{asset.agentName}</span>
                  <span className="assets-item-type">{badge}</span>
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
              ) : iframeSrc ? (
                <iframe
                  className="assets-viewer-iframe"
                  srcDoc={iframeSrc}
                  sandbox={viewMode === 'preview' ? 'allow-scripts' : ''}
                  title="Asset viewer"
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
