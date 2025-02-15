'use client';

import Survey from '../survey';
import { useRouter } from 'next/navigation';
import { Question } from '../types';
export default function SurveyPage() {
  const router = useRouter();
  const questions: Question[] = [
    {
      id: 1,
      text: 'Hversu auðvelt var að nota vefsíðuna?',
      type: 'single-choice',
      key: 'ease-of-use',
      options: ['Mjög auðvelt 😄', 'Auðvelt 🙂', 'Erfitt 🙁', 'Mjög erfitt 😞'],
    },
    {
      id: 2,
      text: 'Skildir þú allar spurningarnar sem vefsíðan spurði þig að?',
      type: 'single-choice',
      key: 'understood-questions',
      options: [
        'Já, allar',
        'Flestar þeirra',
        'Sumar þeirra',
        'Nei, þær voru ruglandi',
      ],
    },
    {
      id: 3,
      text: 'Fannst þér þetta gaman?',
      type: 'single-choice',
      key: 'enjoyed-survey',
      options: [
        'Mjög gaman 😄',
        'Gaman 🙂',
        'Ekki mjög gaman 🙁',
        'Ekkert gaman 😞',
      ],
    },
    {
      id: 4,
      text: 'Líkaði þér við bækurnar sem við mæltum með?',
      type: 'single-choice',
      key: 'liked-books',
      options: [
        'Ég elskaði þær! 😄',
        'Þær voru ágætar 🙂',
        'Mér líkaði ekki mikið við þær 🙁',
        'Mér líkaði alls ekki við þær 😞',
      ],
    },
    {
      id: 5,
      text: 'Myndir þú vilja lesa einhverjar af þessum bókum?',
      type: 'single-choice',
      key: 'want-to-read-books',
      options: ['Já, allar', 'Já, sumar', 'Kannski eina', 'Nei, engar'],
    },
    {
      id: 6,
      text: 'Myndir þú nota þessa vefsíðu aftur til að finna bækur?',
      type: 'single-choice',
      key: 'use-website-again',
      options: ['Já, örugglega', 'Kannski', 'Nei'],
    },
    {
      id: 7,
      text: 'Hvað lýsir þér best?',
      key: 'reader-gender',
      type: 'single-choice',
      options: ['Stelpa 👧', 'Strákur 👦', 'Stálp 👱', 'Annað 🦸'],
    },
    {
      id: 8,
      text: 'Hvað lestu margar bækur?',
      type: 'single-choice',
      key: 'read-books',
      options: [
        '1-6 bækur á ári',
        '7-12 bækur á ári',
        '1-2 bækur á mánuði',
        '3-5 bækur á mánuði',
        'Meira en 5 bækur á mánuði',
      ],
    },

    {
      id: 9,
      text: 'Hvað fannst þér skemmtilegast við þessa vefsíðu?',
      type: 'text',
      key: 'most-enjoyed-part',
    },
    {
      id: 10,
      text: 'Hvað myndi gera vefsíðuna betri?',
      type: 'text',
      key: 'improve-website',
    },
  ];

  return (
    <Survey
      questions={questions}
      submitButtonText='Ljúka könnun 🙏'
      onComplete={answers => {
        console.log('Survey answers:', answers);
        router.push('/takk');
      }}
    />
  );
}
