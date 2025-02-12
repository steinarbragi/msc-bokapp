'use client';

import Survey from '../survey';

interface Question {
  id: number;
  text: string;
  type: 'multiple-choice' | 'slider' | 'text';
  options?: string[];
}

export default function QuestionsPage() {
  const questions: Question[] = [
    {
      id: 1,
      text: 'Hversu auðvelt var að nota vefsíðuna?',
      type: 'multiple-choice',
      options: ['Mjög auðvelt 😄', 'Auðvelt 🙂', 'Erfitt 🙁', 'Mjög erfitt 😞'],
    },
    {
      id: 2,
      text: 'Skildir þú allar spurningarnar sem vefsíðan spurði þig að?',
      type: 'multiple-choice',
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
      type: 'multiple-choice',
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
      type: 'multiple-choice',
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
      type: 'multiple-choice',
      options: ['Já, allar', 'Já, sumar', 'Kannski eina', 'Nei, engar'],
    },
    {
      id: 6,
      text: 'Myndir þú nota þessa vefsíðu aftur til að finna bækur?',
      type: 'multiple-choice',
      options: ['Já, örugglega', 'Kannski', 'Nei'],
    },
    {
      id: 7,
      text: 'Hvað lestu margar bækur?',
      type: 'multiple-choice',
      options: [
        '1-6 bækur á ári',
        '7-12 bækur á ári',
        '1-2 bækur á mánuði',
        '3-5 bækur á mánuði',
        'Meira en 5 bækur á mánuði',
      ],
    },
    {
      id: 8,
      text: 'Hvað fannst þér skemmtilegast við þessa vefsíðu?',
      type: 'text',
    },
    {
      id: 9,
      text: 'Hvað myndi gera vefsíðuna betri?',
      type: 'text',
    },
  ];

  return <Survey questions={questions} nextPageUrl='/takk' />;
}
