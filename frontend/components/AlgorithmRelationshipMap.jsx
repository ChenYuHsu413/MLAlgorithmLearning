import { useState } from 'react';

const NW = 120;
const NH = 46;

const NODES = [
  { id: 0, label: '線性迴歸',   x: 90,  y: 82,  color: '#3b82f6' },
  { id: 1, label: '邏輯迴歸',   x: 300, y: 82,  color: '#8b5cf6' },
  { id: 9, label: '神經網路',   x: 600, y: 82,  color: '#f59e0b' },
  { id: 2, label: '決策樹',     x: 90,  y: 224, color: '#22c55e' },
  { id: 3, label: '隨機森林',   x: 300, y: 224, color: '#16a34a' },
  { id: 4, label: 'SVM',        x: 460, y: 224, color: '#ec4899' },
  { id: 5, label: 'KNN',        x: 595, y: 224, color: '#ef4444' },
  { id: 6, label: '樸素貝葉斯', x: 720, y: 224, color: '#14b8a6' },
  { id: 7, label: 'K-Means',    x: 200, y: 354, color: '#64748b' },
  { id: 8, label: 'PCA',        x: 440, y: 354, color: '#94a3b8' },
];

const EDGES = [
  { from: 0, to: 1, label: '分類變體' },
  { from: 1, to: 9, label: '單層類比' },
  { from: 2, to: 3, label: '集成擴展' },
];

function edgePoints(fromNode, toNode) {
  return {
    x1: fromNode.x + NW / 2,
    y1: fromNode.y,
    x2: toNode.x - NW / 2,
    y2: toNode.y,
  };
}

export default function AlgorithmRelationshipMap({ onSelect }) {
  const [hovered, setHovered] = useState(null);

  return (
    <section className="relMap">
      <div className="relMapHead">
        <h3>演算法關係圖</h3>
        <span>點擊節點跳轉學習</span>
      </div>
      <div className="relMapScroll">
        <svg viewBox="0 0 800 395" width="800" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="rmArrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0,8 3,0 6" fill="#94a3b8" />
            </marker>
          </defs>

          {/* Row category labels */}
          <text x="15" y="36" fontSize="11" fill="#94a3b8" fontStyle="italic">監督式 — 迴歸 · 深度學習</text>
          <text x="15" y="178" fontSize="11" fill="#94a3b8" fontStyle="italic">監督式 — 分類</text>
          <text x="15" y="308" fontSize="11" fill="#94a3b8" fontStyle="italic">非監督式</text>

          {/* Row separators */}
          <line x1="10" y1="158" x2="790" y2="158" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="10" y1="288" x2="790" y2="288" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />

          {/* Edges */}
          {EDGES.map((edge) => {
            const from = NODES.find((n) => n.id === edge.from);
            const to = NODES.find((n) => n.id === edge.to);
            const { x1, y1, x2, y2 } = edgePoints(from, to);
            const mx = (x1 + x2) / 2;
            const my = y1 - 11;
            return (
              <g key={`${edge.from}-${edge.to}`}>
                <line
                  x1={x1} y1={y1} x2={x2 - 4} y2={y2}
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  markerEnd="url(#rmArrow)"
                />
                <text x={mx} y={my} textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600">
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {NODES.map((node) => {
            const rx = node.x - NW / 2;
            const ry = node.y - NH / 2;
            const isHovered = hovered === node.id;
            return (
              <g
                key={node.id}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelect && onSelect(node.id)}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <rect
                  x={rx} y={ry}
                  width={NW} height={NH}
                  rx="8"
                  fill={node.color + (isHovered ? '30' : '18')}
                  stroke={node.color}
                  strokeWidth={isHovered ? 2 : 1.5}
                />
                <text
                  x={node.x} y={node.y + 5}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="700"
                  fill={node.color}
                  style={{ userSelect: 'none' }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <style jsx>{`
        .relMap {
          border: 1px solid var(--line);
          border-radius: 9px;
          background: var(--surface);
          padding: 14px 18px;
          margin-bottom: 16px;
          box-shadow: 0 8px 24px var(--shadow);
        }
        .relMapHead {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .relMapHead h3 {
          margin: 0;
          font-size: 0.98rem;
          color: var(--muted-strong);
        }
        .relMapHead span {
          font-size: 0.8rem;
          color: var(--muted);
        }
        .relMapScroll {
          overflow-x: auto;
        }
        .relMapScroll svg {
          display: block;
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </section>
  );
}
