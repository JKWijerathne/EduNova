import { useState } from 'react'
import { createQuiz } from '../services/quizService.js'

const fieldClass = 'mt-1 w-full border border-[#bdc9bf] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#426e5c]'

function newQuestion() {
  return { questionText: '', questionType: 'MULTIPLE_CHOICE', options: ['', '', '', ''], correctAnswerIndex: 0 }
}

export default function QuizBuilder({ parent, onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [passingMarkPercentage, setPassingMarkPercentage] = useState('70')
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('')
  const [questions, setQuestions] = useState([newQuestion()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateQuestion(index, updates) {
    setQuestions((current) => current.map((question, questionIndex) => questionIndex === index
      ? { ...question, ...updates }
      : question))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const normalizedQuestions = questions.map((question) => ({
      ...question,
      questionText: question.questionText.trim(),
      options: question.options.map((option) => option.trim()),
      correctAnswerIndex: Number(question.correctAnswerIndex),
    }))
    if (normalizedQuestions.some((question) => !question.questionText
      || question.options.length < 2
      || question.options.some((option) => !option)
      || question.correctAnswerIndex < 0
      || question.correctAnswerIndex >= question.options.length)) {
      setError('Provide the question text, at least two non-empty options, and select the correct answer for each question.')
      return
    }

    setSaving(true)
    try {
      await createQuiz({
        ...parent,
        title: title.trim(),
        passingMarkPercentage: Number(passingMarkPercentage),
        timeLimitMinutes: timeLimitMinutes === '' ? null : Number(timeLimitMinutes),
        questions: normalizedQuestions,
      })
      await onCreated()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.response?.data?.message || 'Quiz could not be created. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-[#172d2a]/55 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="quiz-builder-title" className="my-auto max-h-[94vh] w-full max-w-3xl overflow-y-auto bg-[#fbfcf8] p-6 shadow-xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#68817b]">Assessment builder</p>
            <h2 id="quiz-builder-title" className="mt-2 font-serif text-3xl">Create quiz</h2>
            <p className="mt-2 text-sm text-[#657570]">Attached to {parent.lessonId ? 'this lesson' : 'this section'}.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close quiz builder" className="px-2 py-1 text-xl text-[#52645f]">×</button>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-semibold sm:col-span-3">Quiz title
              <input required maxLength="160" value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} />
            </label>
            <label className="text-sm font-semibold">Passing mark (%)
              <input required type="number" min="0" max="100" value={passingMarkPercentage} onChange={(event) => setPassingMarkPercentage(event.target.value)} className={fieldClass} />
            </label>
            <label className="text-sm font-semibold sm:col-span-2">Time limit (minutes, optional)
              <input type="number" min="1" value={timeLimitMinutes} onChange={(event) => setTimeLimitMinutes(event.target.value)} className={fieldClass} />
            </label>
          </div>
          <div className="space-y-4">
            {questions.map((question, questionIndex) => (
              <fieldset key={questionIndex} className="space-y-3 border border-[#d9ded5] bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <legend className="font-semibold">Question {questionIndex + 1}</legend>
                  {questions.length > 1 && <button type="button" onClick={() => setQuestions((current) => current.filter((_, index) => index !== questionIndex))} className="text-xs font-semibold text-[#a14935]">Remove</button>}
                </div>
                <label className="block text-sm font-medium">Question
                  <textarea required rows="2" value={question.questionText} onChange={(event) => updateQuestion(questionIndex, { questionText: event.target.value })} className={fieldClass} />
                </label>
                <label className="block text-sm font-medium">Question type
                  <select value={question.questionType} onChange={(event) => updateQuestion(questionIndex, {
                    questionType: event.target.value,
                    options: event.target.value === 'TRUE_FALSE' ? ['True', 'False'] : ['', '', '', ''],
                    correctAnswerIndex: 0,
                  })} className={fieldClass}>
                    <option value="MULTIPLE_CHOICE">Multiple choice</option>
                    <option value="TRUE_FALSE">True / False</option>
                  </select>
                </label>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Options <span className="font-normal text-[#657570]">— select the correct answer</span></p>
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={`correct-answer-${questionIndex}`}
                        aria-label={`Set option ${optionIndex + 1} as correct`}
                        checked={Number(question.correctAnswerIndex) === optionIndex}
                        onChange={() => updateQuestion(questionIndex, { correctAnswerIndex: optionIndex })}
                        className="accent-[#254d40]"
                      />
                      <label className="flex-1 text-sm">
                        <span className="sr-only">Option {optionIndex + 1}</span>
                        <input required value={option} readOnly={question.questionType === 'TRUE_FALSE'} onChange={(event) => updateQuestion(questionIndex, {
                          options: question.options.map((item, index) => index === optionIndex ? event.target.value : item),
                        })} className="w-full border border-[#bdc9bf] px-3 py-2 outline-none focus:border-[#426e5c]" />
                      </label>
                      {question.questionType === 'MULTIPLE_CHOICE' && question.options.length > 2 && (
                        <button type="button" onClick={() => {
                          const options = question.options.filter((_, index) => index !== optionIndex)
                          const oldCorrect = Number(question.correctAnswerIndex)
                          updateQuestion(questionIndex, {
                            options,
                            correctAnswerIndex: oldCorrect === optionIndex ? 0 : oldCorrect > optionIndex ? oldCorrect - 1 : oldCorrect,
                          })
                        }} aria-label={`Remove option ${optionIndex + 1}`} className="px-2 text-[#a14935]">×</button>
                      )}
                    </div>
                  ))}
                  {question.questionType === 'MULTIPLE_CHOICE' && (
                    <button type="button" onClick={() => updateQuestion(questionIndex, { options: [...question.options, ''] })} className="text-xs font-semibold text-[#426e5c] hover:underline">+ Add option</button>
                  )}
                </div>
              </fieldset>
            ))}
            <button type="button" onClick={() => setQuestions((current) => [...current, newQuestion()])} className="border border-[#bdc9bf] px-4 py-2 text-sm font-semibold hover:bg-[#edf4ef]">+ Add question</button>
          </div>
          {error && <p role="alert" className="border-l-4 border-[#bd4c37] bg-[#f8e9e4] px-3 py-2 text-sm">{error}</p>}
          <div className="flex justify-end gap-3 border-t border-[#d9ded5] pt-4">
            <button type="button" onClick={onClose} disabled={saving} className="border border-[#bdc9bf] px-4 py-2.5 text-sm font-semibold hover:bg-[#edf4ef]">Cancel</button>
            <button type="submit" disabled={saving} className="bg-[#254d40] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#18392f] disabled:opacity-60">{saving ? 'Creating...' : 'Create quiz'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
