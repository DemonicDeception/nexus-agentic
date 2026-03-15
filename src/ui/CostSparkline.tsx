import { useEffect, useRef } from 'react';
import { useStore } from '../store';

const MAX_SAMPLES = 40;

export function CostSparkline() {
  const totalCost = useStore((s) => s.totalCost);
  const samplesRef = useRef<number[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    samplesRef.current.push(totalCost);
    if (samplesRef.current.length > MAX_SAMPLES) samplesRef.current.shift();
    drawSparkline();
  }, [totalCost]);

  const drawSparkline = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const samples = samplesRef.current;
    if (samples.length < 2) return;

    const w = 120;
    const h = 24;
    const min = Math.min(...samples);
    const max = Math.max(...samples);
    const range = max - min || 1;

    const points = samples.map((v, i) => {
      const x = (i / (MAX_SAMPLES - 1)) * w;
      const y = h - ((v - min) / range) * (h - 2) - 1;
      return `${x},${y}`;
    }).join(' ');

    svg.innerHTML = `<polyline points="${points}" fill="none" stroke="#00d4ff" stroke-width="1.5" opacity="0.6" />`;
  };

  return (
    <div className="cost-sparkline">
      <svg ref={svgRef} width="120" height="24" viewBox="0 0 120 24" />
    </div>
  );
}
