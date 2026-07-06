import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Politica de confidențialitate",
    description: "Politica de confidențialitate și protecția datelor personale la CNA Shop.",
    alternates: { canonical: "/confidentialitate" },
};

export default function ConfidentialittatePage() {
    return (
        <div className="max-w-3xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Politica de confidențialitate
            </h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-10">
                Ultima actualizare: mai 2025
            </p>

            <div className="flex flex-col gap-8 text-sm leading-relaxed text-gray-700 dark:text-gray-300">

                <section>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">1. Cine suntem</h2>
                    <p>
                        <strong>CNA S.R.L.</strong> („noi”, „operatorul”) cu sediul în Str. Exemplu nr. 1, Cluj-Napoca, România, CUI RO00000000, este operatorul datelor cu caracter personal colectate prin intermediul site-ului <strong>cnashop.ro</strong>.
                    </p>
                    <p className="mt-2">
                        Contact DPO / responsabil date: <a href="mailto:contact@cna.shop" className="underline">contact@cna.shop</a>
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">2. Ce date colectăm</h2>
                    <div className="flex flex-col gap-3">
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Date furnizate de dumneavoastră</p>
                            <ul className="list-disc list-inside flex flex-col gap-0.5">
                                <li>Nume și prenume, adresă de email, număr de telefon</li>
                                <li>Adresă de livrare și facturare</li>
                                <li>Istoricul comenzilor și al returnărilor</li>
                                <li>Recenzii și evaluări ale produselor</li>
                            </ul>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Date colectate automat</p>
                            <ul className="list-disc list-inside flex flex-col gap-0.5">
                                <li>Adresă IP și informații despre dispozitiv/browser</li>
                                <li>Pagini vizitate și timp petrecut pe site</li>
                                <li>Date de navigare (cookie-uri tehnice și de sesiune)</li>
                            </ul>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Date de la terți</p>
                            <ul className="list-disc list-inside flex flex-col gap-0.5">
                                <li>Profil Google (dacă vă autentificați cu Google): email, nume, ID Google</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">3. De ce colectăm datele</h2>
                    <table className="w-full border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left py-2 pr-4 font-semibold text-gray-800 dark:text-gray-200">Scop</th>
                                <th className="text-left py-2 font-semibold text-gray-800 dark:text-gray-200">Temei legal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            <tr>
                                <td className="py-2 pr-4">Procesarea și livrarea comenzilor</td>
                                <td className="py-2">Executarea contractului (Art. 6(1)(b) GDPR)</td>
                            </tr>
                            <tr>
                                <td className="py-2 pr-4">Gestionarea contului de utilizator</td>
                                <td className="py-2">Executarea contractului (Art. 6(1)(b) GDPR)</td>
                            </tr>
                            <tr>
                                <td className="py-2 pr-4">Trimiterea emailurilor de confirmare, expediere și retur</td>
                                <td className="py-2">Executarea contractului (Art. 6(1)(b) GDPR)</td>
                            </tr>
                            <tr>
                                <td className="py-2 pr-4">Conformitate fiscală și contabilitate</td>
                                <td className="py-2">Obligație legală (Art. 6(1)(c) GDPR)</td>
                            </tr>
                            <tr>
                                <td className="py-2 pr-4">Prevenirea fraudelor și securitatea platformei</td>
                                <td className="py-2">Interes legitim (Art. 6(1)(f) GDPR)</td>
                            </tr>
                            <tr>
                                <td className="py-2 pr-4">Cookie-uri analitice și de marketing</td>
                                <td className="py-2">Consimțământ (Art. 6(1)(a) GDPR)</td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">4. Cui transmitem datele</h2>
                    <p>Nu vindem datele dumneavoastră. Le putem transmite numai următorilor parteneri, strict necesar pentru furnizarea serviciilor:</p>
                    <ul className="list-disc list-inside mt-2 flex flex-col gap-1">
                        <li><strong>Stripe Inc.</strong> — procesare plăți (SUA; acoperit de Clauze Contractuale Standard)</li>
                        <li><strong>Furnizori de servicii de curierat</strong> — livrarea coletelor</li>
                        <li><strong>Google LLC</strong> — autentificare OAuth (dacă utilizați „Login cu Google”)</li>
                        <li><strong>Resend Inc.</strong> — trimitere email-uri tranzacționale</li>
                    </ul>
                    <p className="mt-2">
                        Toți partenerii noștri sunt obligați contractual să protejeze datele și să le utilizeze exclusiv în scopul pentru care le-au primit.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">5. Cât timp păstrăm datele</h2>
                    <ul className="list-disc list-inside flex flex-col gap-1">
                        <li>Date cont utilizator: cât timp contul este activ + 3 ani după ștergere</li>
                        <li>Date comenzi și facturi: 10 ani (obligație legală fiscală)</li>
                        <li>Date de navigare (log-uri): 90 de zile</li>
                        <li>Cookie-uri de sesiune: expiră la închiderea browser-ului</li>
                        <li>Cookie-uri persistent (preferințe, consimțământ): 12 luni</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">6. Drepturile dumneavoastră</h2>
                    <p>Conform Regulamentului (UE) 2016/679 (GDPR) și Legii nr. 190/2018, aveți următoarele drepturi:</p>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                            ["Dreptul de acces", "Puteți solicita o copie a datelor pe care le deținem despre dumneavoastră."],
                            ["Dreptul la rectificare", "Puteți solicita corectarea datelor inexacte sau incomplete."],
                            ["Dreptul la ștergere", "Puteți solicita ștergerea datelor, cu excepția obligațiilor legale."],
                            ["Dreptul la portabilitate", "Puteți primi datele într-un format structurat, lizibil automat."],
                            ["Dreptul la opoziție", "Vă puteți opune prelucrării bazate pe interes legitim."],
                            ["Dreptul de retragere a consimțământului", "Puteți retrage consimțământul oricând, fără efect retroactiv."],
                        ].map(([title, desc]) => (
                            <div key={title} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                <p className="font-semibold text-gray-800 dark:text-gray-200 text-xs">{title}</p>
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                            </div>
                        ))}
                    </div>
                    <p className="mt-3">
                        Pentru exercitarea drepturilor, contactați-ne la <a href="mailto:contact@cna.shop" className="underline">contact@cna.shop</a>. Vom răspunde în termen de 30 de zile. De asemenea, aveți dreptul de a depune plângere la <strong>Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP)</strong> — <a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer" className="underline">dataprotection.ro</a>.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">7. Cookie-uri</h2>
                    <p>Utilizăm cookie-uri pentru funcționarea corectă a site-ului și pentru îmbunătățirea experienței dumneavoastră. Detaliile sunt prezentate în bannerul de consimțământ afișat la prima vizită.</p>
                    <div className="mt-3 flex flex-col gap-2">
                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                            <p className="font-semibold text-gray-800 dark:text-gray-200 text-xs">Cookie-uri strict necesare</p>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Sesiune, autentificare, coș de cumpărături. Nu pot fi dezactivate.</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                            <p className="font-semibold text-gray-800 dark:text-gray-200 text-xs">Cookie-uri de preferințe</p>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Stochează setările dumneavoastră (temă, limbă). Necesită consimțământ.</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                            <p className="font-semibold text-gray-800 dark:text-gray-200 text-xs">Cookie-uri analitice</p>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Ne ajută să înțelegem cum este utilizat site-ul. Necesită consimțământ.</p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">8. Securitatea datelor</h2>
                    <p>
                        Utilizăm măsuri tehnice și organizatorice adecvate pentru a proteja datele dumneavoastră: conexiuni criptate HTTPS/TLS, autentificare JWT, stocarea parolelor cu bcrypt, acces restricționat la date în funcție de rol.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">9. Modificări ale politicii</h2>
                    <p>
                        Putem actualiza această politică periodic. Data ultimei modificări este indicată în partea de sus a paginii. Vă recomandăm să consultați periodic această pagină.
                    </p>
                </section>

            </div>
        </div>
    );
}
