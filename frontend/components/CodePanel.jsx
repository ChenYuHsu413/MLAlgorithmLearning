export default function CodePanel({ activeExample, active, codeOutput, onExecute, onShowDetails }) {
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
      <button type="button" className="runCodeButton" onClick={onExecute}>執行程式碼</button>
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
