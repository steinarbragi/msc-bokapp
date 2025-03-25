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
    options: ['6-7 ára 🌱', '8-9 ára 🌿', '10-11 ára 🌳', 'Annað 🤔'], // Kannski bara 1 text field?
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
    setSessionId,
    setDescriptionId,
  } = useBook();

  return (
    <QuestionProvider initialQuestions={initialQuestions}>
      <Questions
        questions={initialQuestions}
        submitButtonText='Finna bækur 🚀'
        onComplete={async answers => {
          console.log('Survey answers:', answers);
          setSurveyResponses(answers);

          try {
            // First, get the session ID from the questions API
            console.log('Fetching session ID from questions API...');
            const questionsResponse = await fetch('/api/survey/questions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ surveyResponses: answers }),
            });

            if (!questionsResponse.ok) {
              const errorText = await questionsResponse.text();
              console.error('Questions API error:', errorText);
              throw new Error('Failed to get session ID');
            }

            const questionsData = await questionsResponse.json();
            console.log('Questions API response:', questionsData);
            const sessionId = questionsData.sessionId;
            setSessionId(sessionId);

            // Then, get the prompt with the session ID
            console.log('Fetching prompt with session ID:', sessionId);
            const promptResponse = await fetch('/api/prompt', {
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
            console.log('Prompt API response:', promptData);
            setCoverDescription(promptData.coverDescription);
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
