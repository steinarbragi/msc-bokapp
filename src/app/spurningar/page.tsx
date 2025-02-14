'use client';

import Survey from './survey';
import { useRouter } from 'next/navigation';

type QuestionType = 'text' | 'multiple-choice' | 'slider' | 'single-choice';

interface Question {
  id: number;
  text: string;
  type: QuestionType;
  options: string[];
  allowTextInput?: boolean;
}

export default function QuestionsPage() {
  const router = useRouter();
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
        'Íþróttasögur ⚽',
        'Vísindasögur 🔬',
        'Draugasögur 👻',
        'Spennusögur 🎯',
        'Vináttu- og fjölskyldusögur 💝',
        'Goðsögur og þjóðsögur 🌈',
      ],
      allowTextInput: true,
    },
    {
      id: 4,
      text: 'Hvernig ætti aðalpersónan að vera?',
      type: 'multiple-choice',
      options: [
        'Hugrökk 🦁',
        'Klár 🤓',
        'Fyndin 😄',
        'Góð við alla 💝',
        'Sterk 💪',
        'Skapandi 🎨',
        'Hjálpsöm 🤝',
        'Forvitin 🔍',
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
        'Taka þátt í keppni 🏆',
        'Finna fjársjóð 💎',
        'Ferðast í tíma ⌛',
        'Tala við dýr 🐾',
        'Verða ofurhetja 🦹',
        'Leysa gátur 🧩',
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

  return (
    <Survey
      questions={questions}
      submitButtonText='Finna bækur 🚀'
      onComplete={answers => {
        console.log('Survey answers:', answers);
        router.push('/leit');
      }}
    />
  );
}
