'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className='mx-auto max-w-4xl px-4 py-8'>
      <div className='mb-8 flex items-center justify-between'>
        <h1 className='text-4xl font-bold text-purple-800'>
          Skilmálar og persónuvernd
        </h1>
        <Link href='/'>
          <button className='rounded-xl border-2 border-purple-300 bg-purple-50 px-4 py-2 text-center text-purple-700 transition-all hover:scale-105 hover:border-purple-400 hover:bg-purple-100'>
            Aftur á forsíðu
          </button>
        </Link>
      </div>

      <div className='space-y-8 rounded-3xl border-4 border-purple-200 bg-white p-8 shadow-xl'>
        <section>
          <h2 className='mb-4 text-2xl font-semibold text-purple-700'>
            1. Upplýst samþykki
          </h2>
          <p className='text-gray-700'>
            Með notkun á Bókavélinni samþykkir þú þessa skilmála og
            persónuverndarstefnu.
          </p>
        </section>

        <section>
          <h2 className='mb-4 text-2xl font-semibold text-purple-700'>
            2. Tilgangur verkefnisins
          </h2>
          <p className='text-gray-700'>
            Bókavélin er rannsóknarverkefni sem miðar að því að auka
            lestraráhuga barna með hjálp gervigreindar. Gögnin sem safnast verða
            nýtt til að meta gæði mállíkans og niðurstöður verkefnisins munu
            nýtast í rannsóknir á lestrarvenjum og þróun betri aðferða til að
            mæla með bókum.
          </p>
        </section>

        <section>
          <h2 className='mb-4 text-2xl font-semibold text-purple-700'>
            3. Notkun gagna og persónuvernd
          </h2>
          <div className='space-y-4'>
            <p className='text-gray-700'>
              Við söfnum aðeins ópersónugreinanlegum gögnum í rannsóknarskyni,
              þar á meðal:
            </p>
            <ul className='list-inside list-disc space-y-2 text-gray-700'>
              <li>Svör við spurningum um lestrarvenjur og bókasmekk</li>
              <li>Upplýsingar um hvaða bækur eru merktar sem lesnar</li>
              <li>Hvernig bókavélin er notuð og hvaða tillögur eru gefnar</li>
            </ul>
            <p className='text-gray-700'>
              Við söfnum ekki persónuupplýsingum eins og nafni, netfangi eða
              staðsetningu. Öll gögn eru geymd nafnlaust og eru einungis notuð í
              rannsóknarskyni og til að bæta þjónustuna.
            </p>
          </div>
        </section>

        <section>
          <h2 className='mb-4 text-2xl font-semibold text-purple-700'>
            4. Frjáls þátttaka
          </h2>
          <p className='text-gray-700'>
            Þátttaka þín í þessu verkefni er frjáls og þú mátt hætta notkun
            hvenær sem er. Ópersónugreinanlegar upplýsingar sem hafa safnast
            gætu áfram verið notaðar í rannsóknarskyni.
          </p>
        </section>

        <section>
          <h2 className='mb-4 text-2xl font-semibold text-purple-700'>
            5. Hugverkaréttur
          </h2>
          <p className='text-gray-700'>
            Gögnin sem safnast verða eign rannsóknarverkefnisins og má nota til
            frekari greiningar, þjálfunar gervigreindarlíkana eða annarra
            rannsóknarmarkmiða.
          </p>
        </section>

        <section>
          <h2 className='mb-4 text-2xl font-semibold text-purple-700'>
            6. Breytingar á skilmálum
          </h2>
          <p className='text-gray-700'>
            Við áskiljum okkur rétt til þess að breyta þessum skilmálum hvenær
            sem er. Áframhaldandi notkun kerfisins eftir breytingar telst
            samþykki á nýjum skilmálum.
          </p>
        </section>

        <section>
          <h2 className='mb-4 text-2xl font-semibold text-purple-700'>
            7. Samband
          </h2>
          <p className='text-gray-700'>
            Ef þú hefur einhverjar spurningar eða athugasemdir varðandi
            verkefnið eða þessa skilmála, vinsamlegast hafðu samband við Steinar
            Braga Sigurðarson (sbs88@hi.is) eða Hafstein Einarsson
            (hafsteinne@hi.is).
          </p>
        </section>
      </div>
    </div>
  );
}
