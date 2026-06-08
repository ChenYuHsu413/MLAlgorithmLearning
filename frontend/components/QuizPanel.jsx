export default function QuizPanel({ active, answers, onSelectAnswer }) {
  return (
    <article className="panel quizPanel">
      <h2>小測驗</h2>
      <p>{active.quiz.question}</p>
      <div className="quizOptions">
        {active.quiz.options.map((option, index) => {
          const hasAnswer = answers[active.id] !== undefined;
          const isCorrect = index === active.quiz.correctIndex;
          return (
            <button
              key={option}
              type="button"
              className={hasAnswer && isCorrect ? 'correct' : ''}
              onClick={() => onSelectAnswer(active.id, index)}
            >
              {option}
            </button>
          );
        })}
      </div>
      {answers[active.id] !== undefined && (
        <strong className={answers[active.id] ? 'ok' : 'no'}>
          {answers[active.id] ? '答對了' : '再想一下'}
        </strong>
      )}
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
        .quizOptions {
          display: grid;
          gap: 8px;
          margin: 14px 0;
        }
        .quizOptions button {
          border: 1px solid var(--line);
          border-radius: 7px;
          background: var(--surface);
          color: var(--text);
          padding: 11px;
          text-align: left;
          cursor: pointer;
          font: inherit;
        }
        .quizOptions .correct {
          border-color: #86efac;
          background: #dcfce7;
          color: #14532d;
        }
        .ok {
          color: #16a34a;
        }
        .no {
          color: #dc2626;
        }
      `}</style>
    </article>
  );
}
