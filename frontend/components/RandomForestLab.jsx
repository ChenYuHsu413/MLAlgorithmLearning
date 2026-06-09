import { useState, useEffect, useMemo } from 'react';

const W = 480, H = 260, PAD_L = 48, PAD_R = 20, PAD_T = 20, PAD_B = 40;

export default function RandomForestLab() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(10); // index into curve (200 trees)

  useEffect(() => {
    fetch('/api/simulate-random-forest', { method: 'POST' })
      .then(r => r.json())
      .then(d => { setResult(d); setSelectedIdx(d.curve.length - 1); })
      .finally(() => setLoading(false));
  }, []);

  const curve = result?.curve ?? [];
  const selected = curve[selectedIdx] ?? null;

  const chartGeom = useMemo(() => {
    if (!curve.length) return null;
    const accs = curve.map(p => p.acc);
    const ns = curve.map(p => p.n);
    const accMin = Math.max(0, Math.min(...accs) - 0.02);
    const accMax = Math.min(1, Math.max(...accs) + 0.02);
    const nMin = Math.min(...ns), nMax = Math.max(...ns);
    const sx = v => PAD_L + ((v - nMin) / (nMax - nMin)) * (W - PAD_L - PAD_R);
    const sy = v => PAD_T + ((accMax - v) / (accMax - accMin)) * (H - PAD_T - PAD_B);
    return { sx, sy, accMin, accMax, nMin, nMax };
  }, [curve]);

  const polyline = useMemo(() => {
    if (!chartGeom || !curve.length) return '';
    return curve.map(p => `${chartGeom.sx(p.n)},${chartGeom.sy(p.acc)}`).join(' ');
  }, [chartGeom, curve]);

  const importances = result?.importances ?? [];
  const maxImp = importances.length ? Math.max(...importances.map(f => f.importance)) : 1;

  const yTicks = useMemo(() => {
    if (!chartGeom) return [];
    const { accMin, accMax, sy } = chartGeom;
    const step = 0.05;
    const ticks = [];
    for (let v = Math.ceil(accMin / step) * step; v <= accMax + 0.001; v += step) {
      ticks.push({ v: Math.round(v * 1000) / 1000, y: sy(v) });
    }
    return ticks;
  }, [chartGeom]);

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <h3 className="text-white font-semibold mb-1">隨機森林 實驗室</h3>
        <p className="text-gray-400 text-sm">觀察決策樹數量對準確率的影響，以及各特徵的重要性排名。</p>
      </div>

      {loading && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 h-48 flex items-center justify-center text-gray-400 text-sm">
          訓練中…
        </div>
      )}

      {!loading && result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Accuracy curve */}
          <div className="lg:col-span-2 bg-gray-800 rounded-xl border border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-300 text-sm font-medium">準確率 vs. 決策樹數量</span>
              {selected && (
                <span className="text-amber-400 font-mono text-xs">
                  n={selected.n} → {(selected.acc * 100).toFixed(1)}%
                </span>
              )}
            </div>

            {/* Slider */}
            <input
              type="range"
              min={0}
              max={curve.length - 1}
              value={selectedIdx}
              onChange={e => setSelectedIdx(Number(e.target.value))}
              className="w-full mb-3 accent-amber-500"
            />

            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
              {/* Grid + Y ticks */}
              {yTicks.map(t => (
                <g key={t.v}>
                  <line x1={PAD_L} y1={t.y} x2={W - PAD_R} y2={t.y} stroke="#374151" strokeWidth={1} />
                  <text x={PAD_L - 4} y={t.y + 4} textAnchor="end" fontSize={9} fill="#9ca3af">
                    {(t.v * 100).toFixed(0)}%
                  </text>
                </g>
              ))}

              {/* Curve fill */}
              {chartGeom && (
                <polygon
                  points={`${PAD_L},${H - PAD_B} ${polyline} ${chartGeom.sx(curve[curve.length - 1].n)},${H - PAD_B}`}
                  fill="#f59e0b"
                  fillOpacity={0.08}
                />
              )}

              {/* Curve line */}
              <polyline points={polyline} fill="none" stroke="#f59e0b" strokeWidth={2} />

              {/* All dots */}
              {chartGeom && curve.map((p, i) => (
                <circle
                  key={i}
                  cx={chartGeom.sx(p.n)}
                  cy={chartGeom.sy(p.acc)}
                  r={i === selectedIdx ? 6 : 3}
                  fill={i === selectedIdx ? '#f59e0b' : '#92400e'}
                  stroke={i === selectedIdx ? '#fef3c7' : 'none'}
                  strokeWidth={1.5}
                  className="cursor-pointer"
                  onClick={() => setSelectedIdx(i)}
                />
              ))}

              {/* Selected vertical line */}
              {chartGeom && selected && (
                <line
                  x1={chartGeom.sx(selected.n)} y1={PAD_T}
                  x2={chartGeom.sx(selected.n)} y2={H - PAD_B}
                  stroke="#f59e0b" strokeWidth={1} strokeDasharray="3 2" opacity={0.6}
                />
              )}

              {/* X axis labels */}
              {chartGeom && curve.filter((_, i) => i % 2 === 0 || i === curve.length - 1).map((p, i) => (
                <text
                  key={i}
                  x={chartGeom.sx(p.n)}
                  y={H - PAD_B + 14}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#9ca3af"
                >
                  {p.n}
                </text>
              ))}

              {/* Axis labels */}
              <text x={W / 2} y={H - 2} textAnchor="middle" fontSize={10} fill="#6b7280">決策樹數量</text>
              <text x={10} y={H / 2} textAnchor="middle" fontSize={10} fill="#6b7280"
                transform={`rotate(-90, 10, ${H / 2})`}>準確率</text>
            </svg>
          </div>

          {/* Right panel: stats + feature importance */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex flex-col gap-4">
            <h4 className="text-white text-sm font-semibold">模型指標</h4>
            <StatRow label="最終準確率" value={`${(result.final_acc * 100).toFixed(1)}%`} accent="text-green-400" />
            <StatRow label="訓練樣本" value={result.n_train} />
            <StatRow label="測試樣本" value={result.n_test} />

            <h4 className="text-white text-sm font-semibold mt-2">特徵重要性 (Top 5)</h4>
            <div className="space-y-2">
              {importances.slice(0, 5).map((f, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                    <span>{f.feature}</span>
                    <span className="font-mono">{(f.importance * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${(f.importance / maxImp) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto p-3 bg-gray-700/50 rounded-lg text-xs text-gray-400 space-y-1">
              <p className="font-medium text-gray-300">隨機森林的原理</p>
              <p>每棵樹使用不同的隨機子集訓練，多數投票決定最終結果，有效降低過擬合。</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value, accent = 'text-white' }) {
  return (
    <div className="flex justify-between items-center text-sm border-b border-gray-700 pb-2">
      <span className="text-gray-400">{label}</span>
      <span className={`font-mono font-semibold ${accent}`}>{value}</span>
    </div>
  );
}
