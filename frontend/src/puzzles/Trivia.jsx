import { useState } from 'react'
import { PuzzleFrame } from './PuzzleFrame'
import { scoreQuestions } from './logic'

export function Trivia({ puzzle }) {
  const questions = puzzle.puzzle?.questions ?? []
  const [answers, setAnswers] = useState({})
  const score = scoreQuestions(questions, answers)

  return (
    <PuzzleFrame title={puzzle.title} note={`Score ${score} / ${questions.length}`}>
      {questions.map((question, index) => {
        const picked = answers[index]
        return (
          <div className="quiz" key={`${index}-${question.question}`}>
            <p className="quiz-ask">
              {question.difficulty && <span className="tag">{question.difficulty}</span>}
              {question.question}
            </p>
            <div className="pill-row">
              {(question.options ?? []).map((option) => (
                <button
                  key={option}
                  className={`ink-button ${picked === option ? 'is-on' : ''}`}
                  onClick={() => setAnswers({ ...answers, [index]: option })}
                >
                  {option}
                </button>
              ))}
            </div>
            {picked && (
              <p className={picked === question.answer ? 'verdict is-right' : 'verdict is-wrong'}>
                {picked === question.answer ? 'Correct.' : `Not quite — ${question.answer}.`}
                {question.explanation ? ` ${question.explanation}` : ''}
              </p>
            )}
          </div>
        )
      })}
    </PuzzleFrame>
  )
}
