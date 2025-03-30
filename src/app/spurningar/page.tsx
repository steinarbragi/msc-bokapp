'use client';

import { QuestionProvider } from './QuestionContext';
import Questions from './questions';
import { useRouter } from 'next/navigation';
import { Question } from './types';
import { useBook } from '../context/BookContext';

const initialQuestions: Question[] = [
  {
    id: 1,
    text: 'Á hvaða aldri ert þú?', // Þetta má kannski orða betur?
    key: 'reader-age',
    type: 'single-choice',
    options: [
      '0-5 ára 🌱',
      '6-12 ára 🌿',
      '13 ára eða eldri 🌳',
      'Fullorðinn að prófa 👨🏻‍💻',
    ],
  },
  {
    id: 2,
    text: 'Hvaða tegund af sögum finnst þér skemmtilegast að lesa?',
    key: 'reader-favorite-genre',
    type: 'multiple-choice',
    options: [
      'Ævintýri 🤠',
      'Fantasía 🏰',
      'Húmor 😄',
      'Dýrasögur 🐾',
      'Daglegt líf 🏠',
      'Íþróttasögur ⚽',
      'Vísindasögur 🔬',
      'Draugasögur 👻',
      'Spennusögur 🎯',
      'Vináttu- og ástarsögur 💝',
      'Goðsögur og þjóðsögur 🌈',
    ],
    allowTextInput: true,
  },
  {
    id: 3,
    text: 'Hvar á sagan að gerast?',
    key: 'story-location',
    type: 'multiple-choice',
    options: [
      'Í töfraheimi 🌟',
      'Í venjulegum heimi 🏘️',
      'Í skóla 📚',
      'Úti í náttúrunni 🌲',
      'Í framtíðinni 🚀',
      'Í geimnum 🛸',
      'Í undirdjúpunum 🌊',
      'Í ævintýralandi 🎪',
      'Á fornöld ⚔️',
      'Í draugahúsi 👻',
      'Í dýragarði 🦁',
      'Á eyðieyju 🏝️',
      'Í risastórri borg 🌆',
      'Í neðanjarðarbyrgi 🕳️',
      'Í kastala 🏰',
    ],
    allowTextInput: true,
  },
];

export default function Page() {
  const router = useRouter();
  const {
    setCoverDescription,
    setSurveyResponses,
    setDescriptionId,
    sessionId,
  } = useBook();

  return (
    <QuestionProvider initialQuestions={initialQuestions}>
      <Questions
        questions={initialQuestions}
        submitButtonText='Finna bækur 🚀'
        onComplete={async answers => {
          setSurveyResponses(answers);

          try {
            // Get the prompt with the session ID
            const promptResponse = await fetch('/api/describe', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                surveyResponses: answers,
                sessionId,
              }),
            });

            if (!promptResponse.ok) {
              const errorText = await promptResponse.text();
              console.error('Prompt API error:', errorText);
              throw new Error('Failed to generate prompt');
            }

            const promptData = await promptResponse.json();
            setCoverDescription(promptData.bookDescription.description);
            setDescriptionId(promptData.descriptionId);

            router.push('/leit');
          } catch (error) {
            console.error('Error:', error);
            router.push('/leit');
          }
        }}
      />
    </QuestionProvider>
  );
}
