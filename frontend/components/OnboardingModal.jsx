import { useState, useEffect } from 'react';

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = window.localStorage.getItem('ml-onboarding-v1');
    if (!seen) setVisible(true);
  }, []);

  function close() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ml-onboarding-v1', 'done');
    }
    setVisible(false);
  }

  if (!visible) return null;

  const isLast = step === 2;

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="dots">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              type="button"
              className={`dot ${i === step ? 'dot-active' : ''}`}
              onClick={() => setStep(i)}
            />
          ))}
        </div>

        {step === 0 && (
          <>
            <div className="modalIcon">🎓</div>
            <h2 className="modalTitle">歡迎來到 ML 學習平台！</h2>
            <div className="modalBody">
              <p>這裡有 <strong>10 大機器學習演算法</strong>，透過視覺化動畫與互動實驗，讓你真正理解核心概念。</p>
              <div className="highlights">
                <div className="hl"><span className="hlIcon">🔍</span><span>搜尋 &amp; 篩選演算法</span></div>
                <div className="hl"><span className="hlIcon">📊</span><span>SVG 互動視覺化</span></div>
                <div className="hl"><span className="hlIcon">✏️</span><span>互動小測驗系統</span></div>
                <div className="hl"><span className="hlIcon">🤖</span><span>AI 助教即時解答</span></div>
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="modalIcon">🖥</div>
            <h2 className="modalTitle">三欄式學習介面</h2>
            <div className="modalBody">
              <p>點擊任意演算法卡片後，下方出現三個學習面板：</p>
              <div className="panes">
                <div className="pane pane-blue">
                  <strong>視覺化</strong>
                  <span>SVG 動畫展示演算法運作，含圖例與數學公式</span>
                </div>
                <div className="pane pane-green">
                  <strong>程式碼</strong>
                  <span>scikit-learn 實作範例，含步驟說明</span>
                </div>
                <div className="pane pane-purple">
                  <strong>小測驗</strong>
                  <span>3 道由易到難的題目，附解題解析</span>
                </div>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="modalIcon">✨</div>
            <h2 className="modalTitle">特色功能</h2>
            <div className="modalBody">
              <p>還有這些進階功能等你探索：</p>
              <div className="features">
                <div className="feat">
                  <span className="featIcon">📈</span>
                  <div>
                    <strong>線性迴歸實驗室</strong>
                    <span>調整 a、b、σ² 參數，Python 即時計算，標示 Top-10 離群點</span>
                  </div>
                </div>
                <div className="feat">
                  <span className="featIcon">💬</span>
                  <div>
                    <strong>AI 機器學習助教</strong>
                    <span>右下角聊天室，根據目前演算法即時回答問題</span>
                  </div>
                </div>
                <div className="feat">
                  <span className="featIcon">📊</span>
                  <div>
                    <strong>進度追蹤面板</strong>
                    <span>右上角「進度追蹤」查看測驗完成狀況與各題成績</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="footer">
          <button type="button" className="skipBtn" onClick={close}>
            跳過
          </button>
          <div className="footerNav">
            {step > 0 && (
              <button type="button" className="backBtn" onClick={() => setStep((s) => s - 1)}>
                上一步
              </button>
            )}
            <button type="button" className="nextBtn" onClick={isLast ? close : () => setStep((s) => s + 1)}>
              {isLast ? '開始學習！' : '下一步'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          backdrop-filter: blur(3px);
        }
        .modal {
          background: var(--surface, #fff);
          border: 1px solid var(--line, #dbe3ef);
          border-radius: 18px;
          padding: 36px;
          max-width: 440px;
          width: 100%;
          box-shadow: 0 32px 80px rgba(0, 0, 0, 0.28);
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .dots {
          display: flex;
          gap: 7px;
          justify-content: center;
        }
        .dot {
          height: 8px;
          width: 8px;
          border-radius: 4px;
          border: 0;
          background: var(--line, #dbe3ef);
          cursor: pointer;
          padding: 0;
          transition: width 0.25s, background 0.25s;
        }
        .dot-active {
          width: 24px;
          background: var(--accent, #4f63f6);
        }
        .modalIcon {
          font-size: 2.4rem;
          text-align: center;
          line-height: 1;
        }
        .modalTitle {
          margin: 0;
          font-size: 1.25rem;
          text-align: center;
          color: var(--text, #172033);
        }
        .modalBody {
          color: var(--muted, #475569);
          line-height: 1.7;
          font-size: 0.9rem;
        }
        .modalBody p {
          margin: 0 0 14px;
        }
        .modalBody strong {
          color: var(--text, #172033);
        }
        /* Step 1 */
        .highlights {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .hl {
          display: flex;
          align-items: center;
          gap: 9px;
          background: var(--surface-soft, #f1f5f9);
          border-radius: 9px;
          padding: 10px 12px;
          font-size: 0.86rem;
          font-weight: 600;
          color: var(--text, #172033);
        }
        .hlIcon {
          font-size: 1.15rem;
        }
        /* Step 2 */
        .panes {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .pane {
          border-radius: 9px;
          padding: 11px 14px;
          border-left: 4px solid transparent;
        }
        .pane strong {
          display: block;
          margin-bottom: 3px;
          font-size: 0.88rem;
          color: var(--text, #172033);
        }
        .pane span {
          font-size: 0.82rem;
        }
        .pane-blue { background: rgba(219, 234, 254, 0.5); border-color: #3b82f6; }
        .pane-green { background: rgba(220, 252, 231, 0.5); border-color: #22c55e; }
        .pane-purple { background: rgba(243, 232, 255, 0.5); border-color: #a855f7; }
        /* Step 3 */
        .features {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .feat {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .featIcon {
          font-size: 1.5rem;
          flex-shrink: 0;
          line-height: 1;
          margin-top: 2px;
        }
        .feat strong {
          display: block;
          margin-bottom: 3px;
          font-size: 0.88rem;
          color: var(--text, #172033);
        }
        .feat span {
          font-size: 0.82rem;
        }
        /* Footer */
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--line, #dbe3ef);
          padding-top: 16px;
        }
        .skipBtn {
          border: 0;
          background: transparent;
          color: var(--muted, #475569);
          cursor: pointer;
          font: inherit;
          font-size: 0.85rem;
          padding: 6px 0;
        }
        .footerNav {
          display: flex;
          gap: 10px;
        }
        .backBtn {
          border: 1px solid var(--line, #dbe3ef);
          border-radius: 8px;
          background: var(--surface-soft, #f1f5f9);
          color: var(--muted, #475569);
          padding: 9px 18px;
          cursor: pointer;
          font: inherit;
          font-weight: 600;
          font-size: 0.88rem;
        }
        .nextBtn {
          border: 0;
          border-radius: 8px;
          background: var(--accent, #4f63f6);
          color: #fff;
          padding: 9px 22px;
          cursor: pointer;
          font: inherit;
          font-weight: 700;
          font-size: 0.88rem;
        }
      `}</style>
    </div>
  );
}
