export default function CodePanel({ activeExample, active, paramDef, paramValue, onParamChange, isRunning, codeOutput, onExecute, onShowDetails }) {
  const currentVal = paramValue ?? paramDef?.defaultVal;

  return (
    <article id="examples" className="panel codePanel">
      <div className="panelHeader">
        <div>
          <h2>實作範例</h2>
          <p>{activeExample.title}</p>
        </div>
        <span>{activeExample.library}</span>
      </div>
      <ol className="steps">
        {activeExample.steps.map((step) => <li key={step}>{step}</li>)}
      </ol>
      <pre>{activeExample.code}</pre>
      {paramDef && (
        <div className="paramControl">
          <div className="paramRow">
            <label className="paramLabel">{paramDef.label}</label>
            <span className="paramVal">{currentVal}</span>
          </div>
          <input
            type="range"
            className="paramSlider"
            min={paramDef.min}
            max={paramDef.max}
            step={paramDef.step}
            value={currentVal}
            onChange={(e) => onParamChange(Number(e.target.value))}
          />
        </div>
      )}
      <button type="button" className="runCodeButton" onClick={onExecute} disabled={isRunning}>
        {isRunning ? '執行中…' : '執行程式碼'}
      </button>
      {codeOutput && (
        <div className="codeOutput" aria-live="polite">
          <strong>{codeOutput.title}</strong>
          {codeOutput.lines.map((line) => <code key={line}>{line}</code>)}
        </div>
      )}
      <button type="button" className="detailButton" onClick={onShowDetails}>查看完整說明</button>
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
        .panelHeader {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
        }
        .panelHeader span {
          border: 1px solid var(--line);
          border-radius: 999px;
          color: var(--accent);
          padding: 7px 10px;
          font-size: 0.78rem;
          font-weight: 800;
          white-space: nowrap;
        }
        .steps {
          display: grid;
          gap: 7px;
          margin: 0 0 14px;
          padding-left: 1.3rem;
          color: var(--muted-strong);
        }
        pre {
          max-height: 340px;
          overflow: auto;
          border-radius: 8px;
          background: var(--code-bg);
          color: var(--code-text);
          padding: 16px;
          line-height: 1.6;
          font-size: 0.82rem;
        }
        .paramControl {
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 10px 12px;
          margin-bottom: 10px;
          background: var(--surface-soft, var(--surface));
        }
        .paramRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .paramLabel {
          font-size: 0.82rem;
          color: var(--muted-strong);
          font-weight: 600;
        }
        .paramVal {
          font-size: 0.92rem;
          font-weight: 800;
          color: var(--accent);
          font-family: Consolas, monospace;
          min-width: 36px;
          text-align: right;
        }
        .paramSlider {
          width: 100%;
          cursor: pointer;
          accent-color: var(--accent);
        }
        .runCodeButton {
          width: 100%;
          border: 0;
          border-radius: 7px;
          background: var(--accent);
          color: #fff;
          padding: 12px;
          cursor: pointer;
          font: inherit;
          font-weight: 800;
          margin-bottom: 10px;
        }
        .runCodeButton:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .codeOutput {
          display: grid;
          gap: 7px;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--surface-soft);
          padding: 12px;
          margin-bottom: 10px;
        }
        .codeOutput strong {
          color: var(--text);
        }
        .codeOutput code {
          display: block;
          color: var(--muted-strong);
          font-family: Consolas, Monaco, monospace;
          font-size: 0.86rem;
        }
        .detailButton {
          width: 100%;
          display: block;
          border: 1px solid var(--line);
          border-radius: 7px;
          background: var(--surface);
          color: var(--accent);
          text-align: center;
          font-weight: 800;
          padding: 11px;
          cursor: pointer;
          font: inherit;
        }
      `}</style>
    </article>
  );
}
