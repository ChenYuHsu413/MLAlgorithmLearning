import { useState, useEffect, useMemo } from 'react';

const W = 400, H = 340, PAD = 36;
const BAR_W = 480, BAR_H = 200, BAR_PAD_L = 48, BAR_PAD_R = 16, BAR_PAD_T = 20, BAR_PAD_B = 36;

function toSVG(v, min, max, px0, px1) {
  return px0 + ((v - min) / (max - min)) * (px1 - px0);
}

export default function PCALab() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nComponents, setNComponents] = useState(2);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/simulate-pca', { method: 'POST' })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => setResult(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const scatter = useMemo(() => {
    if (!result?.points?.length) return null;
    const xs = result.points.map(p => p.x), ys = result.points.map(p => p.y);
    const xMin = Math.min(...xs) - 0.5, xMax = Math.max(...xs) + 0.5;
    const yMin = Math.min(...ys) - 0.5, yMax = Math.max(...ys) + 0.5;
    return {
      xMin, xMax, yMin, yMax,
      sx: v => toSVG(v, xMin, xMax, PAD, W - PAD),
      sy: v => toSVG(v, yMin, yMax, H - PAD, PAD),
    };
  }, [result]);

  const evr = result?.evr ?? [];
  const cumEvr = result?.cumulative_evr ?? [];
  const totalEvr = nComponents <= evr.length ? cumEvr[nComponents - 1] : 0;

  const barGeom = useMemo(() => {
    if (!evr.length) return null;
    const maxBar = Math.max(...evr) * 1.1;
    const bw = (BAR_W - BAR_PAD_L - BAR_PAD_R) / evr.length;
    return {
      bw,
      barX: i => BAR_PAD_L + i * bw + bw * 0.15,
      barW: bw * 0.7,
      barY: v => BAR_PAD_T + ((maxBar - v) / maxBar) * (BAR_H - BAR_PAD_T - BAR_PAD_B),
      barH: v => ((v / maxBar) * (BAR_H - BAR_PAD_T - BAR_PAD_B)),
      maxBar,
    };
  }, [evr]);

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <h3 className="text-white font-semibold mb-1">主成分分析 (PCA) 實驗室</h3>
        <p className="text-gray-400 text-sm">觀察 PC1 vs PC2 散佈圖，以及各主成分的解釋變異量。</p>
      </div>

      {/* n_components slider */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-300 text-sm font-medium">保留主成分數 (n_components)</span>
          <span className="text-amber-400 font-mono text-sm">{nComponents}</span>
        </div>
        <input
          type="range" min={1} max={evr.length || 10} value={nComponents}
          onChange={e => setNComponents(Number(e.target.value))}
          className="w-full accent-amber-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1</span>
          <span className="text-amber-400 font-mono">
            累積解釋變異量：{evr.length ? `${(totalEvr * 100).toFixed(1)}%` : '—'}
          </span>
          <span>{evr.length || 10}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
          載入失敗：{error}
        </div>
      )}

      {loading && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 h-48 flex items-center justify-center text-gray-400 text-sm">
          計算中…
        </div>
      )}

      {!loading && result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* PC1 vs PC2 scatter */}
          <div className="lg:col-span-2 bg-gray-800 rounded-xl border border-gray-700 p-4">
            <span className="text-gray-300 text-xs font-medium block mb-2">
              PC1 vs PC2 — 前兩個主成分投影
            </span>
            {scatter && (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
                {/* Axes */}
                <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#374151" strokeWidth={1} />
                <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#374151" strokeWidth={1} />
                <text x={W / 2} y={H - 6} textAnchor="middle" fontSize={10} fill="#6b7280">PC1</text>
                <text x={12} y={H / 2} textAnchor="middle" fontSize={10} fill="#6b7280"
                  transform={`rotate(-90, 12, ${H / 2})`}>PC2</text>

                {/* Points */}
                {result.points.map((p, i) => (
                  <circle
                    key={i}
                    cx={scatter.sx(p.x)}
                    cy={scatter.sy(p.y)}
                    r={4}
                    fill={p.label === 0 ? '#60a5fa' : '#f87171'}
                    opacity={0.75}
                  />
                ))}
              </svg>
            )}
          </div>

          {/* EVR bar chart + stats */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex flex-col gap-4">
            <h4 className="text-white text-sm font-semibold">各主成分解釋變異量</h4>

            {barGeom && (
              <svg viewBox={`0 0 ${BAR_W} ${BAR_H}`} className="w-full h-auto">
                {evr.map((v, i) => {
                  const active = i < nComponents;
                  const x = barGeom.barX(i);
                  const y = barGeom.barY(v);
                  const h = barGeom.barH(v);
                  return (
                    <g key={i}>
                      <rect
                        x={x} y={y} width={barGeom.barW} height={h}
                        fill={active ? '#f59e0b' : '#374151'}
                        rx={2}
                      />
                      <text
                        x={x + barGeom.barW / 2}
                        y={BAR_H - BAR_PAD_B + 14}
                        textAnchor="middle" fontSize={9} fill="#9ca3af"
                      >
                        PC{i + 1}
                      </text>
                      {active && (
                        <text
                          x={x + barGeom.barW / 2}
                          y={y - 3}
                          textAnchor="middle" fontSize={8} fill="#fbbf24"
                        >
                          {(v * 100).toFixed(0)}%
                        </text>
                      )}
                    </g>
                  );
                })}
                {/* 0% baseline */}
                <line
                  x1={BAR_PAD_L} y1={BAR_H - BAR_PAD_B}
                  x2={BAR_W - BAR_PAD_R} y2={BAR_H - BAR_PAD_B}
                  stroke="#374151" strokeWidth={1}
                />
              </svg>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">選取主成分</span>
                <span className="text-amber-400 font-mono font-semibold">{nComponents}</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">累積解釋變異</span>
                <span className="text-green-400 font-mono font-semibold">
                  {evr.length ? `${(totalEvr * 100).toFixed(1)}%` : '—'}
                </span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-gray-400">原始維度</span>
                <span className="text-white font-mono font-semibold">{evr.length}</span>
              </div>
            </div>

            <div className="mt-auto p-3 bg-gray-700/50 rounded-lg text-xs text-gray-400 space-y-1">
              <p className="font-medium text-gray-300">PCA 的原理</p>
              <p>找出資料變異量最大的方向（主成分），用少量維度捕捉原始資料的結構。</p>
            </div>

            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-400 inline-block" /> 類別 0</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> 類別 1</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
