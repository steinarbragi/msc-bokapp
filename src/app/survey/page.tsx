'use client';

import Survey from './survey';

type QuestionType = 'text' | 'multiple-choice' | 'slider';

interface Question {
  id: number;
  text: string;
  type: QuestionType;
  options: string[];
}

export default function QuestionsPage() {
  const questions: Question[] = [
    {
      id: 1,
      text: 'Hvað lýsir þér best?',
      type: 'multiple-choice',
      options: ['Stelpa 👧', 'Strákur 👦', 'Stálp 👱', 'Annað 🦸'],
    },
    {
      id: 2,
      text: 'Hvaða aldurshópi tilheyrir þú?',
      type: 'multiple-choice',
      options: ['6-7 ára', '8-9 ára', '10-11 ára', 'Annað'],
    },
    {
      id: 3,
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
      id: 4,
      text: 'Hvaða tegund af sögum finnst þér skemmtilegast að lesa?',
      type: 'multiple-choice',
      options: ['Ævintýri', 'Fantasía', 'Húmor', 'Dýrasögur', 'Daglegt líf'],
    },
    {
      id: 5,
      text: 'Hvernig á aðalsögupersónan að vera?',
      type: 'multiple-choice',
      options: [
        'Hugmyndarík/ur og klár',
        'Hugrökk/Hugrakkur og ævintýragjörn/ævintýragjarn',
        'Fyndin/n og skemmtileg/ur',
        'Góð/ur við aðra og hjálpsöm/samur',
        'Svipuð/svipaður mér',
      ],
    },
    {
      id: 6,
      text: 'Hvað viltu að gerist í sögunni?',
      type: 'multiple-choice',
      options: [
        'Leysa dularfullt mál',
        'Fara í spennandi ferðalag',
        'Bjarga einhverjum/einhverju',
        'Eignast nýja vini',
        'Sigrast á erfiðu verkefni',
      ],
    },
    {
      id: 7,
      text: 'Hvar á sagan að gerast?',
      type: 'multiple-choice',
      options: [
        'Í töfraheimi',
        'Í venjulegum heimi',
        'Í skóla',
        'Úti í náttúrunni',
        'Í framtíðinni',
      ],
    },
  ];

  return <Survey questions={questions} nextPageUrl='/search' />;
}
