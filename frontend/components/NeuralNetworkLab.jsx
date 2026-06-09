import { useState, useEffect, useMemo, useCallback } from 'react';

const SCATTER_W = 380, SCATTER_H = 320, PAD = 32;
const NN_W = 420, NN_H = 320;
const MAX_NEURONS_DRAWN = 8; // cap per layer for visual clarity

function toSVG(v, min, max, px0, px1) {
  return px0 + ((v - min) / (max - min)) * (px1 - px0);
}

function buildChart(points) {
  if (!points?.length) return null;
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const xMin = Math.min(...xs) - 0.3, xMax = Math.max(...xs) + 0.3;
  const yMin = Math.min(...ys) - 0.3, yMax = Math.max(...ys) + 0.3;
  return {
    xMin, xMax, yMin, yMax,
    sx: v => toSVG(v, xMin, xMax, PAD, SCATTER_W - PAD),
    sy: v => toSVG(v, yMin, yMax, SCATTER_H - PAD, PAD),
  };
}

const PRESETS = [
  { label: '淺層 [8]', sizes: [8], activation: 'relu' },
  { label: '中層 [16,8]', sizes: [16, 8], activation: 'relu' },
  { label: '深層 [32,16,8]', sizes: [32, 16, 8], activation: 'relu' },
  { label: 'tanh [16,8]', sizes: [16, 8], activation: 'tanh' },
  { label: 'sigmoid [16,8]', sizes: [16, 8], activation: 'logistic' },
];

// Build neuron positions for architecture diagram
function buildNNLayout(layerSizes) {
  const layers = layerSizes.map(s => Math.min(s, MAX_NEURONS_DRAWN));
  const xStep = NN_W / (layers.length + 1);
  return layers.map((n, li) => {
    const x = xStep * (li + 1);
    const yStep = NN_H / (n + 1);
    return Array.from({ length: n }, (_, ni) => ({ x, y: yStep * (ni + 1) }));
  });
}

export default function NeuralNetworkLab() {
  const [preset, setPreset] = useState(1); // default [16,8]
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchNN = useCallback(async (p) => {
    setLoading(true);
    try {
      const { sizes, activation } = PRESETS[p];
      const res = await fetch('/api/simulate-neural-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden_layer_sizes: sizes, activation }),
      });
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNN(1); }, [fetchNN]);

  const chart = useMemo(() => result ? buildChart(result.points) : null, [result]);

  // Render decision region from grid
  const gridCells = useMemo(() => {
    if (!chart || !result?.grid) return [];
    const { x: gx, y: gy, probs } = result.grid;
    const cells = [];
    const cellW = chart.sx(gx[1]) - chart.sx(gx[0]);
    const cellH = Math.abs(chart.sy(gy[1]) - chart.sy(gy[0]));
    for (let yi = 0; yi < gy.length; yi++) {
      for (let xi = 0; xi < gx.length; xi++) {
        const prob = probs[yi * gx.length + xi];
        cells.push({
          x: chart.sx(gx[xi]) - cellW / 2,
          y: chart.sy(gy[yi]) - cellH / 2,
          w: cellW + 1,
          h: cellH + 1,
          prob,
        });
      }
    }
    return cells;
  }, [chart, result]);

  const nnLayout = useMemo(() => {
    if (!result?.layer_sizes) return [];
    return buildNNLayout(result.layer_sizes);
  }, [result]);

  const LAYER_LABELS = useMemo(() => {
    if (!result?.layer_sizes) return [];
    return result.layer_sizes.map((s, i) => {
      if (i === 0) return '輸入層';
      if (i === result.layer_sizes.length - 1) return '輸出層';
      return `隱藏層 ${i}`;
    });
  }, [result]);

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <h3 className="text-white font-semibold mb-1">神經網絡 (Neural Network) 實驗室</h3>
        <p className="text-gray-400 text-sm">選擇不同架構與激活函數，觀察決策邊界與網路結構的變化。</p>
      </div>

      {/* Preset buttons */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gray-300 text-sm font-medium mr-2">架構</span>
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => { setPreset(i); fetchNN(i); }}
              className={`px-3 py-1.5 rounded text-xs font-mono border transition-colors ${
                preset === i
                  ? 'bg-amber-500 border-amber-400 text-black font-bold'
                  : 'border-gray-600 text-gray-300 hover:border-amber-500'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 h-48 flex items-center justify-center text-gray-400 text-sm">
          訓練中…
        </div>
      )}

      {!loading && result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Decision boundary scatter */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <span className="text-gray-300 text-xs font-medium block mb-2">決策邊界（類別機率熱圖）</span>
            {chart && (
              <svg viewBox={`0 0 ${SCATTER_W} ${SCATTER_H}`} className="w-full h-auto">
                {/* Grid cells */}
                {gridCells.map((c, i) => (
                  <rect
                    key={i}
                    x={c.x} y={c.y} width={c.w} height={c.h}
                    fill={c.prob > 0.5 ? '#ef4444' : '#3b82f6'}
                    opacity={Math.abs(c.prob - 0.5) * 0.6 + 0.05}
                  />
                ))}
                {/* Points */}
                {result.points.map((p, i) => (
                  <circle
                    key={i}
                    cx={chart.sx(p.x)} cy={chart.sy(p.y)}
                    r={3.5}
                    fill={p.label === 0 ? '#60a5fa' : '#f87171'}
                    stroke="white" strokeWidth={0.5}
                    opacity={0.9}
                  />
                ))}
              </svg>
            )}
          </div>

          {/* Network architecture diagram */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <span className="text-gray-300 text-xs font-medium block mb-2">網路架構圖</span>
            <svg viewBox={`0 0 ${NN_W} ${NN_H}`} className="w-full h-auto">
              {/* Edges (sampled for clarity) */}
              {nnLayout.slice(0, -1).map((layer, li) =>
                layer.slice(0, 4).map((n1, ni) =>
                  nnLayout[li + 1].slice(0, 4).map((n2, nj) => (
                    <line
                      key={`e${li}${ni}${nj}`}
                      x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
                      stroke="#374151" strokeWidth={0.5} opacity={0.5}
                    />
                  ))
                )
              )}
              {/* Neurons */}
              {nnLayout.map((layer, li) => {
                const origSize = result.layer_sizes[li];
                const truncated = origSize > MAX_NEURONS_DRAWN;
                return layer.map((n, ni) => (
                  <g key={`n${li}${ni}`}>
                    <circle
                      cx={n.x} cy={n.y} r={10}
                      fill={li === 0 ? '#1d4ed8' : li === nnLayout.length - 1 ? '#b45309' : '#065f46'}
                      stroke="#4b5563" strokeWidth={1}
                    />
                    {ni === layer.length - 1 && truncated && (
                      <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={10} fill="#9ca3af">…</text>
                    )}
                  </g>
                ));
              })}
              {/* Layer labels */}
              {nnLayout.map((layer, li) => {
                const x = layer[0]?.x ?? 0;
                const origSize = result.layer_sizes[li];
                return (
                  <g key={`lbl${li}`}>
                    <text x={x} y={NN_H - 6} textAnchor="middle" fontSize={9} fill="#9ca3af">
                      {LAYER_LABELS[li]}
                    </text>
                    <text x={x} y={NN_H - 18} textAnchor="middle" fontSize={8} fill="#6b7280">
                      {origSize} 個
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* Stats bar */}
      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="準確率" value={`${(result.accuracy * 100).toFixed(1)}%`} accent="text-green-400" />
          <StatCard label="訓練迭代數" value={result.n_iter} />
          <StatCard label="最終 Loss" value={result.loss} accent="text-amber-400" />
          <StatCard label="激活函數" value={result.activation} />
        </div>
      )}

      <div className="bg-gray-700/40 rounded-xl p-4 text-xs text-gray-400 space-y-1">
        <p className="font-medium text-gray-300">神經網路的特性</p>
        <p>隱藏層越多、神經元越多 → 擬合能力越強，但訓練時間增加，易過擬合</p>
        <p>ReLU：收斂快，適用深層；tanh/sigmoid：輸出有界，適用特定場景</p>
        <p>熱圖顏色深度代表模型對該區域的預測信心，邊界模糊處代表高不確定性</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent = 'text-white' }) {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-3 text-center">
      <div className={`text-xl font-mono font-bold ${accent}`}>{value}</div>
      <div className="text-gray-400 text-xs mt-1">{label}</div>
    </div>
  );
}
