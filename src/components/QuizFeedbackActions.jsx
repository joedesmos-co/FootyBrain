/**
 * Sticky-friendly action row after quiz feedback (player + club quizzes).
 *
 * @param {{ children: import('react').ReactNode }} props
 */
export default function QuizFeedbackActions({ children }) {
  return <div className="quiz-feedback__actions">{children}</div>;
}
