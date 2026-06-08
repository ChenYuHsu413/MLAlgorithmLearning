export default function DetailModal({ show, active, activeInsight, onClose }) {
  if (!show || !active || !activeInsight) return null;

  return (
    <div className="modalLayer" role="presentation" onClick={onClose}>
      <section className="detailModal" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={(event) => event.stopPropagation()}>
        <div className="modalHeader">
          <div>
            <span>{active.category}</span>
            <h2 id="detail-title">{active.shortName} 完整說明</h2>
          </div>
          <button type="button" aria-label="關閉完整說明" onClick={onClose}>×</button>
        </div>
        <p className="modalLead">{active.concept}</p>
        <div className="modalGrid">
          <article>
            <h3>適合情境</h3>
            <p>{active.bestFor}</p>
          </article>
          <article>
            <h3>核心重點</h3>
            <p>{activeInsight.core}</p>
          </article>
          <article>
            <h3>建模流程</h3>
            <ol>
              {activeInsight.workflow.map((item) => <li key={item}>{item}</li>)}
            </ol>
          </article>
          <article>
            <h3>常見錯誤</h3>
            <ul>
              {activeInsight.pitfalls.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
        </div>
        <div className="modalFooter">
          <div className="chips">
            {activeInsight.metrics.map((item) => <span key={item}>{item}</span>)}
          </div>
          <button type="button" onClick={onClose}>完成</button>
        </div>
      </section>
      <style jsx>{`
        .modalLayer {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: grid;
          place-items: center;
          background: rgba(15, 23, 42, 0.58);
          padding: 22px;
        }
        .detailModal {
          width: min(820px, 100%);
          max-height: min(760px, calc(100vh - 44px));
          overflow: auto;
          border: 1px solid var(--line);
          border-radius: 10px;
          background: var(--surface);
          color: var(--text);
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
          padding: 22px;
        }
        .modalHeader {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: flex-start;
          border-bottom: 1px solid var(--line-soft);
          padding-bottom: 16px;
          margin-bottom: 16px;
        }
        .modalHeader span {
          color: var(--accent);
          font-weight: 800;
          font-size: 0.86rem;
        }
        .modalHeader h2 {
          margin: 5px 0 0;
          font-size: 1.45rem;
        }
        .modalHeader button {
          width: 36px;
          height: 36px;
          border: 1px solid var(--line);
          border-radius: 7px;
          background: var(--surface-soft);
          color: var(--text);
          cursor: pointer;
          font-size: 1.4rem;
          line-height: 1;
        }
        .modalLead {
          color: var(--muted);
          line-height: 1.75;
          margin: 0 0 16px;
        }
        .modalGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .modalGrid article {
          border: 1px solid var(--line-soft);
          border-radius: 8px;
          background: var(--surface-soft);
          padding: 14px;
        }
        .modalGrid h3 {
          margin: 0 0 8px;
          font-size: 1rem;
        }
        .modalGrid p,
        .modalGrid li {
          color: var(--muted);
          line-height: 1.65;
        }
        .modalGrid ol,
        .modalGrid ul {
          margin: 0;
          padding-left: 1.2rem;
        }
        .modalFooter {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: center;
          border-top: 1px solid var(--line-soft);
          margin-top: 16px;
          padding-top: 16px;
        }
        .modalFooter button {
          border: 0;
          border-radius: 7px;
          background: var(--accent);
          color: #fff;
          padding: 11px 18px;
          cursor: pointer;
          font: inherit;
          font-weight: 800;
        }
        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .chips span {
          border: 1px solid var(--line);
          border-radius: 999px;
          background: var(--surface-soft);
          color: var(--muted-strong);
          padding: 7px 10px;
          font-size: 0.82rem;
          font-weight: 700;
        }
        @media (max-width: 1120px) {
          .modalGrid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 680px) {
          .modalFooter {
            align-items: stretch;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
