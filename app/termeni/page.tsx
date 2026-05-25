import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Termeni și condiții",
    description: "Termenii și condițiile de utilizare ale magazinului online CNA Shop.",
    alternates: { canonical: "/termeni" },
};

export default function TermeniPage() {
    return (
        <div className="max-w-3xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Termeni și condiții
            </h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-10">
                Ultima actualizare: mai 2025
            </p>

            <div className="prose prose-gray dark:prose-invert max-w-none flex flex-col gap-8 text-sm leading-relaxed text-gray-700 dark:text-gray-300">

                <section>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">1. Informații generale</h2>
                    <p>
                        Prezentul document stabilește termenii și condițiile de utilizare ale platformei online <strong>CNA Shop</strong>, disponibilă la adresa <strong>cnashop.ro</strong>, operată de societatea <strong>CNA S.R.L.</strong>, cu sediul în Str. Exemplu nr. 1, Cluj-Napoca, România, înregistrată la Registrul Comerțului sub numărul J12/000/2024, CUI RO00000000.
                    </p>
                    <p className="mt-2">
                        Prin accesarea și utilizarea acestui site, confirmați că ați citit, înțeles și acceptat în totalitate acești termeni. Dacă nu sunteți de acord cu oricare dintre prevederi, vă rugăm să nu utilizați serviciile noastre.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">2. Produse și prețuri</h2>
                    <p>
                        Ne rezervăm dreptul de a modifica prețurile oricând, fără notificare prealabilă. Prețul afișat la momentul plasării comenzii este cel valabil pentru acea tranzacție. Toate prețurile sunt exprimate în lei românești (RON) și includ TVA, cu excepția cazului în care se specifică altfel.
                    </p>
                    <p className="mt-2">
                        Imaginile produselor au caracter informativ. Ne rezervăm dreptul de a efectua modificări ale specificațiilor tehnice ale produselor fără notificare prealabilă, cu condiția ca acestea să nu afecteze în mod semnificativ calitatea sau funcționalitatea produsului.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">3. Comanda și contractul de vânzare</h2>
                    <p>
                        Prin plasarea unei comenzi pe site, acceptați că formați un contract de vânzare cu CNA S.R.L. Contractul se consideră încheiat în momentul în care primiți confirmarea prin email a comenzii dumneavoastră.
                    </p>
                    <p className="mt-2">
                        Ne rezervăm dreptul de a refuza sau anula orice comandă în caz de erori de prețuri, stoc insuficient sau informații eronate furnizate de client. În caz de anulare, orice sumă plătită va fi rambursată integral.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">4. Plata</h2>
                    <p>
                        Acceptăm plata prin card bancar (Visa, Mastercard), procesată securizat prin platforma Stripe. Datele cardului nu sunt stocate pe serverele noastre.
                    </p>
                    <p className="mt-2">
                        Comanda devine activă numai după confirmarea plății. Comenzile neachitate în termen de 24 de ore pot fi anulate automat.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">5. Livrare</h2>
                    <p>
                        Livrăm pe teritoriul României prin curier. Termenul de livrare este de 2–5 zile lucrătoare de la confirmarea plății. Nu ne asumăm responsabilitatea pentru întârzierile cauzate de curier sau de forță majoră.
                    </p>
                    <p className="mt-2">
                        Costurile de livrare sunt afișate la finalizarea comenzii și pot varia în funcție de greutate, volum și destinație.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">6. Dreptul de returnare</h2>
                    <p>
                        În conformitate cu OUG nr. 34/2014 privind drepturile consumatorilor, aveți dreptul să returnați produsele în termen de <strong>14 zile calendaristice</strong> de la primirea coletului, fără a oferi o justificare, cu excepția produselor excluse prin lege (produse sigilate deschise, produse personalizate etc.).
                    </p>
                    <p className="mt-2">
                        Pentru a iniția o returnare, accesați secțiunea <em>Comenzile mele</em> din contul dumneavoastră sau contactați-ne la adresa <strong>contact@cna.shop</strong>. Costurile de returnare sunt suportate de client, cu excepția situațiilor în care produsul este defect sau livrat eronat.
                    </p>
                    <p className="mt-2">
                        Rambursarea se efectuează în termen de <strong>14 zile</strong> de la primirea produsului returnat și verificarea stării acestuia.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">7. Garanție</h2>
                    <p>
                        Toate produsele beneficiază de garanție legală de conformitate de <strong>2 ani</strong>, conform Legii nr. 449/2003 privind vânzarea produselor și garanțiile asociate acestora. Pentru detalii suplimentare despre garanție, contactați-ne la <strong>contact@cna.shop</strong>.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">8. Proprietate intelectuală</h2>
                    <p>
                        Toate conținuturile acestui site (texte, imagini, logo-uri, grafice, cod sursă) sunt proprietatea CNA S.R.L. și sunt protejate de legislația română și europeană privind dreptul de autor. Reproducerea, distribuirea sau utilizarea acestora fără acordul scris al CNA S.R.L. este interzisă.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">9. Limitarea răspunderii</h2>
                    <p>
                        CNA S.R.L. nu este răspunzătoare pentru daunele indirecte, incidentale sau consecutive rezultate din utilizarea sau imposibilitatea utilizării serviciilor noastre, cu excepția cazurilor prevăzute expres de lege.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">10. Soluționarea litigiilor</h2>
                    <p>
                        Dacă aveți o reclamație, vă rugăm să ne contactați în primul rând la <strong>contact@cna.shop</strong>. Dacă nu reușim să rezolvăm problema pe cale amiabilă, puteți apela la:
                    </p>
                    <ul className="list-disc list-inside mt-2 flex flex-col gap-1">
                        <li>Autoritatea Națională pentru Protecția Consumatorilor (ANPC) — <strong>anpc.ro</strong></li>
                        <li>Platforma europeană de soluționare online a litigiilor (SOL) — <strong>ec.europa.eu/consumers/odr</strong></li>
                    </ul>
                    <p className="mt-2">
                        Prezentul contract este guvernat de legislația română.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">11. Modificări ale termenilor</h2>
                    <p>
                        Ne rezervăm dreptul de a modifica acești termeni oricând. Versiunea actualizată va fi publicată pe această pagină cu menționarea datei ultimei modificări. Continuarea utilizării site-ului după publicarea modificărilor constituie acceptarea noilor termeni.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">12. Contact</h2>
                    <p>
                        Pentru orice întrebări legate de acești termeni, ne puteți contacta la:
                    </p>
                    <div className="mt-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex flex-col gap-1">
                        <p><strong>CNA S.R.L.</strong></p>
                        <p>Str. Exemplu nr. 1, Cluj-Napoca, România</p>
                        <p>Email: <a href="mailto:contact@cna.shop" className="text-gray-900 dark:text-gray-100 underline">contact@cna.shop</a></p>
                        <p>Telefon: +40 700 000 000</p>
                    </div>
                </section>

            </div>
        </div>
    );
}
