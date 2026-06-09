import { useState, useEffect } from 'react';

export default function QuizPanel({ active, answers, onSelectAnswer }) {
  const questions = active.quiz;
  const algoAnswers = answers[active.id] || [];
  const [currentQ, setCurrentQ] = useState(0);

  useEffect(() => {
    setCurrentQ(0);
  }, [active.id]);

  const isAllDone =
    questions.length > 0 &&
    questions.every((_, i) => algoAnswers[i]?.correct === true);

  const q = questions[Math.min(currentQ, questions.length - 1)];
  const qAnswer = algoAnswers[currentQ];
  const hasAnswer = qAnswer !== undefined && qAnswer !== null;

  function handleRetry() {
    onSelectAnswer(active.id, -1, -1);
    setCurrentQ(0);
  }

  return (
    <article className="panel quizPanel">
      <div className="quizHeader">
        <h2>小測驗</h2>
        {isAllDone ? (
          <span className="allCorrect">全對！</span>
        ) : (
          <span className="qCounter">{currentQ + 1} / {questions.length} 題</span>
        )}
      </div>

      {isAllDone ? (
        <div className="doneBanner">
          <p>恭喜！你已答對所有題目，代表你掌握了本演算法的核心概念。</p>
          <button type="button" className="retryBtn" onClick={handleRetry}>重新測驗</button>
        </div>
      ) : (
        <>
          <p className="qText">{q.question}</p>
          <div className="quizOptions">
            {q.options.map((option, index) => {
              const isSelected = hasAnswer && qAnswer.selected === index;
              const isOptCorrect = index === q.correctIndex;
              let cls = '';
              if (hasAnswer) {
                if (isOptCorrect) cls = 'correct';
                else if (isSelected) cls = 'wrong';
              }
              return (
                <button
                  key={option}
                  type="button"
                  className={cls}
                  disabled={hasAnswer}
                  onClick={() => onSelectAnswer(active.id, currentQ, index)}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {hasAnswer && (
            <div className={`explanation ${qAnswer.correct ? 'ok' : 'no'}`}>
              <strong>{qAnswer.correct ? '答對了！' : '答錯了'}</strong>
              <p>{q.explanation}</p>
            </div>
          )}

          {hasAnswer && currentQ < questions.length - 1 && (
            <button
              type="button"
              className="nextBtn"
              onClick={() => setCurrentQ((prev) => prev + 1)}
            >
              下一題 →
            </button>
          )}
        </>
      )}

      <div className="qDots">
        {questions.map((_, i) => {
          const a = algoAnswers[i];
          return (
            <button
              key={i}
              type="button"
              aria-label={`第 ${i + 1} 題`}
              className={`qDot${i === currentQ ? ' current' : ''}${a?.correct ? ' done' : a ? ' tried' : ''}`}
              onClick={() => setCurrentQ(i)}
            />
          );
        })}
      </div>

      <style jsx>{`
        .panel {
          border: 1px solid var(--line);
          border-radius: 9px;
          background: var(--surface);
          padding: 18px;
          box-shadow: 0 8px 24px var(--shadow);
        }
        .quizHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        h2 {
          margin: 0;
          font-size: 1.18rem;
        }
        .qCounter {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--muted);
          background: var(--surface-soft);
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 3px 9px;
        }
        .allCorrect {
          font-size: 0.8rem;
          font-weight: 700;
          color: #16a34a;
          background: #dcfce7;
          border: 1px solid #86efac;
          border-radius: 999px;
          padding: 3px 9px;
        }
        .qText {
          color: var(--muted);
          line-height: 1.65;
          margin: 0 0 12px;
          font-size: 0.93rem;
        }
        .quizOptions {
          display: grid;
          gap: 8px;
          margin-bottom: 12px;
        }
        .quizOptions button {
          border: 1px solid var(--line);
          border-radius: 7px;
          background: var(--surface);
          color: var(--text);
          padding: 10px 12px;
          text-align: left;
          cursor: pointer;
          font: inherit;
          font-size: 0.9rem;
          transition: border-color 0.15s;
        }
        .quizOptions button:disabled {
          cursor: default;
        }
        .quizOptions .correct {
          border-color: #86efac;
          background: #dcfce7;
          color: #14532d;
        }
        .quizOptions .wrong {
          border-color: #fca5a5;
          background: #fee2e2;
          color: #991b1b;
        }
        .explanation {
          border-radius: 8px;
          padding: 10px 12px;
          margin-bottom: 10px;
          font-size: 0.86rem;
          line-height: 1.6;
        }
        .explanation.ok {
          background: #f0fdf4;
          border: 1px solid #86efac;
        }
        .explanation.no {
          background: #fff1f2;
          border: 1px solid #fca5a5;
        }
        .explanation strong {
          display: block;
          margin-bottom: 4px;
          font-size: 0.88rem;
        }
        .explanation.ok strong { color: #16a34a; }
        .explanation.no strong { color: #dc2626; }
        .explanation p {
          margin: 0;
          color: var(--muted-strong);
        }
        .nextBtn {
          width: 100%;
          border: 0;
          border-radius: 7px;
          background: var(--accent);
          color: #fff;
          padding: 11px;
          cursor: pointer;
          font: inherit;
          font-weight: 800;
          margin-bottom: 12px;
        }
        .doneBanner {
          border-radius: 8px;
          background: #f0fdf4;
          border: 1px solid #86efac;
          padding: 14px;
          margin-bottom: 12px;
          text-align: center;
        }
        .doneBanner p {
          margin: 0 0 10px;
          color: #14532d;
          font-size: 0.88rem;
          line-height: 1.6;
        }
        .retryBtn {
          border: 1px solid #86efac;
          border-radius: 7px;
          background: #fff;
          color: #16a34a;
          padding: 8px 16px;
          cursor: pointer;
          font: inherit;
          font-weight: 700;
        }
        .qDots {
          display: flex;
          gap: 7px;
          justify-content: center;
          padding-top: 6px;
        }
        .qDot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid var(--line);
          background: var(--surface-soft);
          cursor: pointer;
          padding: 0;
          transition: background 0.15s, border-color 0.15s;
        }
        .qDot.current {
          border-color: var(--accent);
          background: var(--accent);
        }
        .qDot.done {
          border-color: #86efac;
          background: #86efac;
        }
        .qDot.tried {
          border-color: #fca5a5;
          background: #fca5a5;
        }
      `}</style>
    </article>
  );
}
