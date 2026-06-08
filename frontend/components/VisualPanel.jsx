import MiniChart from './MiniChart';
import { animationDescriptions, chartType } from '../lib/algorithmData';

export default function VisualPanel({ active, algorithms, simulationRun, simulationStatus, onSimulate, onSelectAlgo }) {
  return (
    <article className="panel visualPanel">
      <h2>互動式可視化</h2>
      <p>目前選擇：{active.shortName}</p>
      <div className={`bigChart ${simulationRun ? 'isRunning' : ''}`} key={`${active.id}-${simulationRun}`}>
        <MiniChart type={chartType(active.id)} color={active.color} stateIndex={simulationRun} algoId={active.id} />
      </div>
      {animationDescriptions[active.id] && (
        <p className="animDesc">
          <span className="animStep">步驟 {(simulationRun % 5) + 1}/5</span>
          {animationDescriptions[active.id][simulationRun % 5]}
        </p>
      )}
      <div className="controlBox">
        <label>
          選擇演算法
          <select value={active.id} onChange={(event) => onSelectAlgo(Number(event.target.value))}>
            {algorithms.map((algo) => <option key={algo.id} value={algo.id}>{algo.shortName}</option>)}
          </select>
        </label>
        <div>
          <span>任務類型</span>
          <strong>{active.task}</strong>
        </div>
        <div className="simulationStats">
          <span><b>{simulationRun}</b> 模擬次數</span>
          <span><b>{Math.min(98, 82 + ((simulationRun + active.id) % 12))}%</b> 估計表現</span>
        </div>
        <p className="simulationStatus">{simulationStatus}</p>
        <button type="button" onClick={onSimulate}>{simulationRun ? '重新模擬' : '開始模擬'}</button>
      </div>
      <style jsx>{`
        .panel {
          border: 1px solid var(--line);
          border-radius: 9px;
          background: var(--surface);
          padding: 18px;
          box-shadow: 0 8px 24px var(--shadow);
        }
        .panel p {
          color: var(--muted);
          line-height: 1.65;
        }
        h2 {
          margin: 0;
          font-size: 1.18rem;
        }
        .bigChart {
          height: 220px;
          display: grid;
          place-items: center;
          border: 1px solid var(--line-soft);
          border-radius: 8px;
          background: linear-gradient(var(--surface), var(--surface-soft));
          margin: 16px 0;
        }
        .bigChart :global(.miniChart) {
          width: 82%;
          height: 180px;
        }
        .bigChart.isRunning :global(.miniChart) {
          animation: chartPulse 780ms ease-out;
        }
        @keyframes chartPulse {
          0% { opacity: 0.55; transform: translateY(8px) scale(0.96); }
          55% { opacity: 1; transform: translateY(-2px) scale(1.03); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animDesc {
          margin: 8px 0 0;
          font-size: 0.82rem;
          color: var(--muted-strong);
          line-height: 1.5;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .animStep {
          font-size: 0.72rem;
          font-weight: 700;
          background: var(--surface-soft);
          border: 1px solid var(--line);
          border-radius: 4px;
          padding: 2px 6px;
          white-space: nowrap;
          color: var(--accent);
          flex-shrink: 0;
        }
        .controlBox {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 130px;
          gap: 12px;
          align-items: end;
        }
        .controlBox label,
        .controlBox div {
          display: grid;
          gap: 8px;
          color: var(--muted);
          font-size: 0.88rem;
        }
        select {
          height: 38px;
          border: 1px solid var(--line);
          border-radius: 7px;
          padding: 0 10px;
          background: var(--surface);
          color: var(--text);
        }
        .controlBox button {
          grid-column: 1 / -1;
          border: 0;
          border-radius: 7px;
          background: var(--accent);
          color: #fff;
          padding: 12px;
          cursor: pointer;
          font: inherit;
          font-weight: 800;
        }
        .simulationStats {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .simulationStats span {
          border: 1px solid var(--line-soft);
          border-radius: 7px;
          background: var(--surface-soft);
          padding: 10px;
        }
        .simulationStats b {
          display: block;
          color: var(--text);
          font-size: 1.05rem;
        }
        .simulationStatus {
          grid-column: 1 / -1;
          min-height: 24px;
          margin: 0;
          color: var(--accent) !important;
          font-weight: 800;
        }
      `}</style>
    </article>
  );
}
