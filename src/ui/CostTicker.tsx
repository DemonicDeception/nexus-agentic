import { useRef, useEffect, useState } from 'react';
import { useStore } from '../store';

export function CostTicker() {
  const totalCost = useStore((s) => s.totalCost);
  const totalTokens = useStore((s) => s.totalTokens);
  const [displayCost, setDisplayCost] = useState(0);
  const animRef = useRef<number>(0);
  const targetRef = useRef(0);

  useEffect(() => {
    targetRef.current = totalCost;
  }, [totalCost]);

  useEffect(() => {
    const tick = () => {
      setDisplayCost((prev) => {
        const diff = targetRef.current - prev;
        if (Math.abs(diff) < 0.000001) return targetRef.current;
        return prev + diff * 0.08;
      });
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const costStr = displayCost.toFixed(4);
  const [whole, decimal] = costStr.split('.');

  return (
    <div className="cost-ticker">
      <div className="cost-ticker-amount">
        {whole}.<span style={{ opacity: 0.7 }}>{decimal}</span>
      </div>
      <div className="cost-ticker-tokens">{totalTokens.toLocaleString()} tokens</div>
    </div>
  );
}
