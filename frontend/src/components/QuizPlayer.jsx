import { useCallback, useEffect, useRef, useState } from 'react'
import { getQuiz, submitQuiz } from '../services/quizService.js'

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

export default function QuizPlayer({ quizId, onNext, hasNext, onPassed }) {
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [remainingSeconds, setRemainingSeconds] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const submitRef = useRef(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setQuiz(null)
    setAnswers({})
    setResult(null)
    setRemainingSeconds(null)
    getQuiz(quizId)
      .then((loadedQuiz) => {
        if (!active) return
        setQuiz(loadedQuiz)
        if (loadedQuiz.timeLimitMinutes) setRemainingSeconds(loadedQuiz.timeLimitMinutes * 60)
      })
      .catch((requestError) => {
        if (!active) return
        const status = requestError.response?.status
        setError(status === 401
          ? 'Your session has expired. Sign in again to view this quiz.'
          : status === 403
            ? 'You do not have permission to view this quiz. Sign in with an account that has access, then try again.'
            : 'This quiz could not be loaded. Please try again.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [quizId])

  const submitAnswers = useCallback(async () => {
    if (!quiz || result || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const attempt = await submitQuiz(quiz.id, quiz.questions
        .filter((question) => answers[question.id] !== undefined)
        .map((question) => ({ questionId: question.id, selectedOptionIndex: answers[question.id] })))
      setResult(attempt)
      if (attempt.passed) {
        try {
          await onPassed(quiz.id)
        } catch {
          setError('Your result was saved, but course progress could not be refreshed. Reload the course to see your updated progress.')
        }
      }
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.response?.data?.message || 'Your answers could not be submitted. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [answers, onPassed, quiz, result, submitting])

  submitRef.current = submitAnswers

  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0 || result || submitting) return undefined
    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => current === null ? null : Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [remainingSeconds, result, submitting])

  useEffect(() => {
    if (remainingSeconds === 0 && quiz && !result && !submitting) submitRef.current?.()
  }, [remainingSeconds, quiz, result, submitting])

  function retakeQuiz() {
    setAnswers({})
    setResult(null)
    setError('')
    setRemainingSeconds(quiz.timeLimitMinutes ? quiz.timeLimitMinutes * 60 : null)
  }

  const resultsById = new Map((result?.answers || []).map((answer) => [answer.questionId, answer]))

  return (
    <article className="mx-auto max-w-4xl">
      {loading && <p className="bg-white p-8 text-[#657570]">Loading assessment...</p>}
      {error && !quiz && <p role="alert" className="border-l-4 border-[#bd4c37] bg-white px-4 py-3 text-sm">{error}</p>}
      {quiz && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#68817b]">Assessment · Pass mark {quiz.passingMarkPercentage}%</p>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl">{quiz.title}</h2>
              <p className="mt-2 text-sm text-[#657570]">{quiz.questions.length} questions · {quiz.questions.length} marks</p>
            </div>
            {remainingSeconds !== null && !result && <p role="timer" aria-live="off" className={`border px-3 py-2 font-semibold ${remainingSeconds < 60 ? 'border-[#bd4c37] text-[#a14935]' : 'border-[#bdc9bf] text-[#426e5c]'}`}>Time remaining: {formatTime(remainingSeconds)}</p>}
          </div>

          {!result ? (
            <form onSubmit={(event) => { event.preventDefault(); submitAnswers() }} className="mt-7 space-y-4">
              {quiz.questions.map((question, questionIndex) => (
                <fieldset key={question.id} className="border border-[#d9ded5] bg-white p-5 sm:p-6">
                  <legend className="font-semibold">Question {questionIndex + 1} of {quiz.questions.length}</legend>
                  <p className="mt-2 leading-7">{question.questionText}</p>
                  <div className="mt-4 space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <label key={`${question.id}-${optionIndex}`} className={`flex cursor-pointer items-center gap-3 border px-3 py-3 text-sm ${answers[question.id] === optionIndex ? 'border-[#426e5c] bg-[#edf4ef]' : 'border-[#d9ded5] hover:bg-[#f3f4ed]'}`}>
                        <input type="radio" name={`question-${question.id}`} checked={answers[question.id] === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))} className="accent-[#254d40]" />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              {error && <p role="alert" className="border-l-4 border-[#bd4c37] bg-white px-4 py-3 text-sm">{error}</p>}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#cbd3ca] pt-5">
                <p className="text-sm text-[#657570]">{Object.keys(answers).length} of {quiz.questions.length} answered</p>
                <button type="submit" disabled={submitting} className="bg-[#254d40] px-6 py-3 text-sm font-semibold text-white hover:bg-[#18392f] disabled:cursor-wait disabled:opacity-60">{submitting ? 'Grading...' : 'Submit quiz'}</button>
              </div>
            </form>
          ) : (
            <section className="mt-7">
              <div className={`border-l-4 p-5 ${result.passed ? 'border-[#426e5c] bg-[#edf4ef]' : 'border-[#bd4c37] bg-[#f8e9e4]'}`}>
                <p className="text-xs font-bold uppercase tracking-[0.15em]">{result.passed ? 'Passed' : 'Not passed'}</p>
                <h3 className="mt-2 font-serif text-3xl">{result.scoreObtained} / {result.totalMarks} marks · {result.percentage}%</h3>
                <p className="mt-2 text-sm">{result.passed ? 'You passed this assessment.' : `You need ${result.passingMarkPercentage}% to pass. Review the answers and try again.`}</p>
              </div>
              {error && <p role="alert" className="mt-4 border-l-4 border-[#bd4c37] bg-white px-4 py-3 text-sm">{error}</p>}
              <div className="mt-5 space-y-3">
                {quiz.questions.map((question, questionIndex) => {
                  const answer = resultsById.get(question.id)
                  return (
                    <article key={question.id} className="border border-[#d9ded5] bg-white p-5">
                      <p className="font-semibold">{questionIndex + 1}. {question.questionText}</p>
                      <p className={`mt-3 text-sm ${answer?.correct ? 'text-[#426e5c]' : 'text-[#a14935]'}`}>
                        Your answer: {answer?.selectedOptionIndex === null || answer?.selectedOptionIndex === undefined ? 'Not answered' : question.options[answer.selectedOptionIndex]}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#426e5c]">Correct answer: {answer?.correctAnswer}</p>
                    </article>
                  )
                })}
              </div>
              <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-[#cbd3ca] pt-5">
                <button type="button" onClick={retakeQuiz} className="border border-[#bdc9bf] px-4 py-3 text-sm font-semibold hover:bg-white">Try again</button>
                {hasNext && <button type="button" onClick={onNext} className="bg-[#254d40] px-5 py-3 text-sm font-semibold text-white hover:bg-[#18392f]">Next activity →</button>}
              </div>
            </section>
          )}
        </>
      )}
    </article>
  )
}
