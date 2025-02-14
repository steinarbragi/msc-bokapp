'use client';

import Survey from './survey';
import { useRouter } from 'next/navigation';
import { Question } from './types';
import { useBook } from '../context/BookContext';

export default function QuestionsPage() {
  const router = useRouter();
  const { setCoverDescription } = useBook();
  const questions: Question[] = [
    {
      id: 1,
      text: 'Hvað lýsir þér best?',
      key: 'reader-gender',
      type: 'single-choice',
      options: ['Stelpa 👧', 'Strákur 👦', 'Stálp 👱', 'Annað 🦸'],
    },
    {
      id: 2,
      text: 'Hvaða aldurshópi tilheyrir þú?',
      key: 'reader-age',
      type: 'single-choice',
      options: ['6-7 ára 🌱', '8-9 ára 🌿', '10-11 ára 🌳', 'Annað 🤔'],
    },

    {
      id: 3,
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
        'Vináttu- og fjölskyldusögur 💝',
        'Goðsögur og þjóðsögur 🌈',
      ],
      allowTextInput: true,
    },
    {
      id: 4,
      text: 'Hvernig ætti aðalpersónan að vera?',
      key: 'main-character-traits',
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
      key: 'story-plot',
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

  return (
    <Survey
      questions={questions}
      submitButtonText='Finna bækur 🚀'
      onComplete={answers => {
        console.log('Survey answers:', answers);
        fetch('/api/prompt', {
          method: 'POST',
          body: JSON.stringify({ surveyResponses: answers }),
        })
          .then(response => response.json())
          .then(data => {
            console.log('Prompt response:', data);
            setCoverDescription(data.coverDescription);
            router.push('/leit');
          })
          .catch(error => {
            console.error('Error:', error);
            router.push('/leit');
          });
      }}
    />
  );
}
