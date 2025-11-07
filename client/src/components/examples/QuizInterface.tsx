import QuizInterface from '../QuizInterface';

export default function QuizInterfaceExample() {
  const questions = [
    {
      id: '1',
      question: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswer: 2
    },
    {
      id: '2',
      question: 'Which planet is known as the Red Planet?',
      options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
      correctAnswer: 1
    },
    {
      id: '3',
      question: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: 1
    }
  ];

  return (
    <div className="p-6">
      <QuizInterface title="General Knowledge Quiz" questions={questions} />
    </div>
  );
}
