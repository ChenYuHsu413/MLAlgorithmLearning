import { useState, useEffect, useMemo, useCallback } from 'react';

const W = 420, H = 360, PAD = 36;
const NODE_R = 18, V_GAP = 64, MIN_GAP = NODE_R * 2 + 6; // guaranteed min center-to-center

function toSVG(v, min, max, px0, px1) {
  return px0 + ((v - min) / (max - min)) * (px1 - px0);
}

function buildChart(points) {
  if (!points?.length) return null;
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const xMin = Math.min(...xs) - 0.5, xMax = Math.max(...xs) + 0.5;
  const yMin = Math.min(...ys) - 0.5, yMax = Math.max(...ys) + 0.5;
  return {
    xMin, xMax, yMin, yMax,
    sx: v => toSVG(v, xMin, xMax, PAD, W - PAD),
    sy: v => toSVG(v, yMin, yMax, H - PAD, PAD),
  };
}

// Post-order x assignment: leaves get sequential positions, parents get midpoint of children.
// Guarantees MIN_GAP between any two adjacent leaf centers at every depth.
function flattenTree(tree, maxDepth) {
  const nodes = [];
  let leafX = 0;

  function build(node, d, parentId) {
    const id = nodes.length;
    nodes.push({ id, node, x: 0, y: 28 + d * V_GAP, parentId, leftId: -1, rightId: -1 });
    if (!node.leaf && d < maxDepth) {
      const leftId = build(node.left, d + 1, id);
      const rightId = build(node.right, d + 1, id);
      nodes[id].leftId = leftId;
      nodes[id].rightId = rightId;
    }
    return id;
  }
  build(tree, 0, null);

  function assignX(id) {
    const n = nodes[id];
    if (n.leftId === -1) {
      n.x = leafX;
      leafX += MIN_GAP;
    } else {
      assignX(n.leftId);
      assignX(n.rightId);
      n.x = (nodes[n.leftId].x + nodes[n.rightId].x) / 2;
    }
  }
  assignX(0);

  return nodes;
}

export default function DecisionTreeLab() {
  const [maxDepth, setMaxDepth] = useState(3);
  const [pendingDepth, setPendingDepth] = useState(3);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const fetchTree = useCallback(async (d) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/simulate-decision-tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ max_depth: d }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTree(3); }, [fetchTree]);

  const chart = useMemo(() => result ? buildChart(result.points) : null, [result]);

  const treeNodes = useMemo(() => {
    if (!result?.tree) return [];
    return flattenTree(result.tree, maxDepth);
  }, [result, maxDepth]);

  const treeBounds = useMemo(() => {
    if (!treeNodes.length) return { minX: 0, maxX: 0, minY: 0, maxY: 0, w: 200, h: 100 };
    const xs = treeNodes.map(n => n.x), ys = treeNodes.map(n => n.y);
    const minX = Math.min(...xs) - NODE_R - 8;
    const maxX = Math.max(...xs) + NODE_R + 8;
    const minY = Math.min(...ys) - NODE_R - 8;
    const maxY = Math.max(...ys) + NODE_R + 8;
    return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
  }, [treeNodes]);

  const handleApply = () => {
    setMaxDepth(pendingDepth);
    fetchTree(pendingDepth);
  };

  const FEAT_NAMES = ['特徵 0', '特徵 1'];
  const hoveredNode = hoveredId !== null ? treeNodes[hoveredId] : null;

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <h3 className="text-white font-semibold mb-1">決策樹 (Decision Tree) 實驗室</h3>
        <p className="text-gray-400 text-sm">調整最大深度，觀察決策邊界與樹狀結構的變化。</p>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-gray-300 text-sm font-medium whitespace-nowrap">最大深度 (max_depth)</span>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(v => (
              <button
                key={v}
                onClick={() => setPendingDepth(v)}
                className={`w-9 h-9 rounded text-sm font-mono border transition-colors ${
                  pendingDepth === v
                    ? 'bg-amber-500 border-amber-400 text-black font-bold'
                    : 'border-gray-600 text-gray-300 hover:border-amber-500'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={handleApply}
            disabled={loading || pendingDepth === maxDepth}
            className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium disabled:opacity-40 transition-colors"
          >
            {loading ? '計算中…' : '套用'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
          載入失敗：{error}
        </div>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Scatter plot */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <span className="text-gray-300 text-xs font-medium block mb-2">決策邊界（訓練資料）</span>
          {loading && <div className="h-40 flex items-center justify-center text-gray-400 text-sm">計算中…</div>}
          {!loading && chart && result && (
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
              {result.points.map((p, i) => (
                <circle
                  key={i}
                  cx={chart.sx(p.x)} cy={chart.sy(p.y)}
                  r={4}
                  fill={p.label === 0 ? '#60a5fa' : '#f87171'}
                  opacity={0.75}
                />
              ))}
            </svg>
          )}
        </div>

        {/* Tree visualization */}
        <div className="lg:col-span-2 bg-gray-800 rounded-xl border border-gray-700 p-4 overflow-x-auto">
          <span className="text-gray-300 text-xs font-medium block mb-2">樹狀結構（hover 節點查看詳情）</span>
          {!loading && treeNodes.length > 0 && (
            <svg
              viewBox={`${treeBounds.minX} ${treeBounds.minY} ${treeBounds.w} ${treeBounds.h}`}
              className="w-full h-auto"
              style={{ minWidth: '320px' }}
            >
              {/* Edges */}
              {treeNodes.map(n => {
                if (n.parentId === null) return null;
                const parent = treeNodes[n.parentId];
                return (
                  <line
                    key={`e${n.id}`}
                    x1={parent.x} y1={parent.y}
                    x2={n.x} y2={n.y}
                    stroke="#4b5563" strokeWidth={1.5}
                  />
                );
              })}
              {/* Nodes — no tooltip inside, keeps z-order clean */}
              {treeNodes.map(n => {
                const isHover = hoveredId === n.id;
                const color = n.node.leaf
                  ? (n.node.class === 0 ? '#3b82f6' : '#ef4444')
                  : '#6b7280';
                return (
                  <g
                    key={n.id}
                    onMouseEnter={() => setHoveredId(n.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={n.x} cy={n.y} r={NODE_R}
                      fill={color}
                      stroke={isHover ? '#fbbf24' : 'transparent'}
                      strokeWidth={2}
                      opacity={0.9}
                    />
                    {n.node.leaf ? (
                      <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={9} fill="white" fontWeight="bold">
                        C{n.node.class}
                      </text>
                    ) : (
                      <>
                        <text x={n.x} y={n.y - 2} textAnchor="middle" fontSize={8} fill="white">
                          X{n.node.feature}
                        </text>
                        <text x={n.x} y={n.y + 8} textAnchor="middle" fontSize={8} fill="#fbbf24">
                          ≤{n.node.threshold}
                        </text>
                      </>
                    )}
                  </g>
                );
              })}
              {/* Tooltip rendered last — always on top of all nodes */}
              {hoveredNode && (() => {
                const n = hoveredNode;
                return (
                  <g pointerEvents="none">
                    <rect
                      x={n.x + NODE_R + 4} y={n.y - 28}
                      width={110} height={n.node.leaf ? 44 : 54}
                      rx={4} fill="#1f2937" stroke="#374151" strokeWidth={1}
                    />
                    {n.node.leaf ? (
                      <>
                        <text x={n.x + NODE_R + 10} y={n.y - 14} fontSize={9} fill="#d1d5db">葉節點 → 類別 {n.node.class}</text>
                        <text x={n.x + NODE_R + 10} y={n.y - 2} fontSize={9} fill="#9ca3af">樣本數: {n.node.samples}</text>
                        <text x={n.x + NODE_R + 10} y={n.y + 10} fontSize={9} fill="#9ca3af">Gini: {n.node.impurity}</text>
                      </>
                    ) : (
                      <>
                        <text x={n.x + NODE_R + 10} y={n.y - 14} fontSize={9} fill="#d1d5db">{FEAT_NAMES[n.node.feature]}</text>
                        <text x={n.x + NODE_R + 10} y={n.y - 2} fontSize={9} fill="#fbbf24">閾值: {n.node.threshold}</text>
                        <text x={n.x + NODE_R + 10} y={n.y + 10} fontSize={9} fill="#9ca3af">樣本數: {n.node.samples}</text>
                        <text x={n.x + NODE_R + 10} y={n.y + 22} fontSize={9} fill="#9ca3af">Gini: {n.node.impurity}</text>
                      </>
                    )}
                  </g>
                );
              })()}
            </svg>
          )}
        </div>
      </div>

      {/* Stats */}
      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="準確率" value={`${(result.accuracy * 100).toFixed(1)}%`} accent="text-green-400" />
          <StatCard label="設定深度" value={maxDepth} />
          <StatCard label="實際深度" value={result.max_depth} />
          <StatCard label="葉節點數" value={result.n_leaves} accent="text-amber-400" />
        </div>
      )}

      <div className="bg-gray-700/40 rounded-xl p-4 text-xs text-gray-400 space-y-1">
        <p className="font-medium text-gray-300">深度對模型的影響</p>
        <p>深度小 → 欠擬合（underfitting），邊界簡單，準確率低</p>
        <p>深度大 → 過擬合（overfitting），完美擬合訓練資料但泛化差</p>
        <p>灰色節點 = 分裂節點（條件），藍/紅節點 = 葉節點（預測類別）</p>
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
