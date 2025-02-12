'use client';

import Survey from './survey';

type QuestionType = 'text' | 'multiple-choice' | 'slider' | 'single-choice';

interface Question {
  id: number;
  text: string;
  type: QuestionType;
  options: string[];
  allowTextInput?: boolean;
}

export default function QuestionsPage() {
  const questions: Question[] = [
    {
      id: 1,
      text: 'Hvað lýsir þér best?',
      type: 'single-choice',
      options: ['Stelpa 👧', 'Strákur 👦', 'Stálp 👱', 'Annað 🦸'],
    },
    {
      id: 2,
      text: 'Hvaða aldurshópi tilheyrir þú?',
      type: 'single-choice',
      options: ['6-7 ára 🌱', '8-9 ára 🌿', '10-11 ára 🌳', 'Annað 🤔'],
    },

    {
      id: 3,
      text: 'Hvaða tegund af sögum finnst þér skemmtilegast að lesa?',
      type: 'multiple-choice',
      options: [
        'Ævintýri 🤠',
        'Fantasía 🏰',
        'Húmor 😄',
        'Dýrasögur 🐾',
        'Daglegt líf 🏠',
      ],
      allowTextInput: true,
    },
    {
      id: 4,
      text: 'Hvernig á aðalsögupersónan að vera?',
      type: 'multiple-choice',
      options: [
        'Hugmyndarík/ur og klár',
        'Hugrökk/Hugrakkur og ævintýragjörn/ævintýragjarn',
        'Fyndin/n og skemmtileg/ur',
        'Góð/ur við aðra og hjálpsöm/samur',
        'Svipuð/svipaður mér',
      ],
      allowTextInput: true,
    },
    {
      id: 5,
      text: 'Hvað viltu að gerist í sögunni?',
      type: 'multiple-choice',
      options: [
        'Leysa dularfullt mál 🔍',
        'Fara í spennandi ferðalag 🌎',
        'Bjarga einhverjum/einhverju 🦸',
        'Eignast nýja vini 🤝',
        'Sigrast á erfiðu verkefni ⭐',
      ],
      allowTextInput: true,
    },
    {
      id: 6,
      text: 'Hvar á sagan að gerast?',
      type: 'multiple-choice',
      options: [
        'Í töfraheimi 🌟',
        'Í venjulegum heimi 🏘️',
        'Í skóla 📚',
        'Úti í náttúrunni 🌲',
        'Í framtíðinni 🚀',
      ],
      allowTextInput: true,
    },
  ];

  return <Survey questions={questions} nextPageUrl='/leit' />;
}
