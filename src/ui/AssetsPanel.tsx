import { useState } from 'react';
import { useStore } from '../store';

export function AssetsPanel() {
  const open = useStore((s) => s.assetsOpen);
  const setOpen = useStore((s) => s.setAssetsOpen);
  const assets = useStore((s) => s.assets);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!open) return null;

  const selected = assets.find((a) => a.id === selectedId);

  return (
    <div className="assets-panel">
      <div className="assets-header">
        <span className="assets-title">ASSETS</span>
        <span className="assets-count">{assets.length} artifacts</span>
        <button className="assets-close" onClick={() => setOpen(false)}>x</button>
      </div>

      <div className="assets-body">
        {/* List */}
        <div className="assets-list">
          {assets.length === 0 && (
            <div className="assets-empty">No assets yet — agents produce assets when they complete tasks</div>
          )}
          {[...assets].reverse().map((asset) => (
            <div
              key={asset.id}
              className={`assets-item ${selectedId === asset.id ? 'active' : ''}`}
              onClick={() => setSelectedId(asset.id)}
            >
              <div className="assets-item-header">
                <span className="assets-item-dot" style={{ background: asset.color }} />
                <span className="assets-item-agent" style={{ color: asset.color }}>{asset.agentName}</span>
                <span className="assets-item-dept">{asset.department}</span>
              </div>
              <div className="assets-item-task">{asset.task}</div>
              <div className="assets-item-time">{new Date(asset.timestamp).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>

        {/* Viewer */}
        <div className="assets-viewer">
          {selected ? (
            <>
              <div className="assets-viewer-header">
                <span style={{ color: selected.color }}>{selected.agentName}</span>
                <span className="assets-viewer-task">{selected.task}</span>
              </div>
              <pre className="assets-viewer-output">{selected.output}</pre>
            </>
          ) : (
            <div className="assets-viewer-empty">Select an asset to view</div>
          )}
        </div>
      </div>
    </div>
  );
}
