import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const subdomain = "notariuszwgarwolinie";
const sql = postgres(DATABASE_URL);

const rows = await sql`SELECT id, translations FROM sites WHERE subdomain = ${subdomain}`;
if (rows.length === 0) {
  console.error(`Business "${subdomain}" not found`);
  await sql.end();
  process.exit(1);
}

const siteId: number = rows[0].id;
const existing = (rows[0].translations as Record<string, unknown>) || {};

const en: Record<string, string> = {
  "business.name": "Notary Office in Garwolin",

  "nav.cta": "Contact",

  "pages.home.title": "Home",
  "pages.about.title": "About",
  "pages.services.title": "Services",
  "pages.blog.title": "Blog",
  "pages.files.title": "Downloads",
  "pages.contact.title": "Contact",
  "pages.informations.title": "Legal Guides",
  "pages.informations.navLabel": "Information",
  "pages.rodo.title": "GDPR",

  "hero.badge": "Notary Office",
  "hero.title": "Professional Notarial Services in Garwolin",
  "hero.subtitle":
    "Notary Office in Garwolin. Reliable and professional notarial services for individuals and businesses.",
  "hero.cta": "Contact Us",

  "services.title": "Comprehensive Notarial Services",
  "services.subtitle":
    "We provide professional notarial services required by law, ensuring the security and legal validity of your transactions.",
  "services.cta": "See all services",
  "services.viewDetails": "See details",

  "about.badge": "About",
  "about.title": "Notary Office in Garwolin",
  "about.story.title": "Notary Office in Garwolin",
  "about.story.content":
    "Our notary office provides professional notarial services in Garwolin and the surrounding area. A notary public is a trusted public official who provides legal certainty for the most important decisions in your life — property transactions, succession, and personal legal affairs.\n\nWe ensure the highest standards of service, full confidentiality, and thorough preparation of notarial documents in accordance with current legislation.\n\nTrust our experience and professionalism — we are here to make your legal transactions secure and free of complications.",
  "about.cta": "Contact Us",
  "about.jurisdiction.title": "Area of Service",
  "about.jurisdiction.content":
    "Our notary office provides notarial services in Garwolin and the surrounding Masovian region. We handle notarial acts, inheritance certifications, certifications, real estate transactions, wills, and powers of attorney.\n\nWe serve both individual clients and businesses. We are happy to assist with any notarial formality required by law.\n\nNotarial acts may be performed at the office or, in special circumstances (e.g., due to health reasons), at the client's location by prior arrangement.\n\nWe strive to make every visit efficient and stress-free, preparing all necessary documents in advance and providing thorough explanations of each notarial act.",
  "about.career.title": "Our Office",
  "about.career.items.0.year": "Established",
  "about.career.items.0.title": "Notary Public",
  "about.career.items.0.company": "Notary Office in Garwolin",
  "about.career.items.0.description":
    "Our office provides the full range of notarial services required by Polish law, ensuring the correctness and legal certainty of every document we prepare.",
  "about.career.items.1.year": "Membership",
  "about.career.items.1.title": "Notarial Chamber",
  "about.career.items.1.company": "Warsaw Chamber of Notaries",
  "about.career.items.1.description":
    "We operate under the supervision of the Warsaw Chamber of Notaries and strictly adhere to the principles of the Notarial Code of Ethics.",
  "about.career.items.2.year": "Our Mission",
  "about.career.items.2.title": "Professional & Trustworthy",
  "about.career.items.2.company": "Notary Office in Garwolin",
  "about.career.items.2.description":
    "We are committed to providing notarial services of the highest quality, ensuring clients feel secure and well-informed at every stage of the notarial procedure.",

  "testimonials.badge": "Testimonials",
  "testimonials.title": "What Our Clients Say",
  "testimonials.subtitle": "Trust and professionalism confirmed by our clients",

  "faq.badge": "FAQ",
  "faq.title": "Frequently Asked Questions",
  "faq.subtitle": "Didn't find an answer to your question?",
  "faq.cta": "Contact Us",

  "blog.badge": "Blog",
  "blog.title": "Notarial Information",
  "blog.subtitle":
    "Useful information about notarial procedures, legal requirements, and how to prepare for your visit.",
  "blog.readMore": "Read More",
  "blog.back": "Go back",

  "informations.badge": "Information",
  "informations.title": "Notarial Guide",
  "informations.subtitle":
    "Key information about notarial procedures for individuals and businesses — what to expect and how to prepare.",

  "home.services.title": "Our Services",

  "home.about.title": "Safe and Professional Notarial Services",
  "home.about.subtitle":
    "Our Notary Office in Garwolin provides reliable notarial services. We guarantee thorough preparation of every document, clear explanations, and full legal certainty for all transactions.",
  "home.about.cta": "More about the office",
  "home.about.stats.0": "Years in practice",
  "home.about.stats.1": "Acts completed",
  "home.about.stats.2": "Satisfied clients",
  "home.about.stats.3": "Year established",

  "features.badge": "Systems",
  "features.title": "Modern Notary Office",
  "features.subtitle":
    "We use modern notarial and legal information systems to ensure the accuracy and efficiency of every notarial act.",
  "features.items.0.description":
    "Access to comprehensive legal databases including legislation, court rulings, and legal commentary — essential for every notary.",
  "features.items.1.description":
    "Electronic access to land and mortgage registers enabling instant verification of property legal status.",
  "features.items.2.description":
    "Access to the Register of Inheritance Acts (RAPD) — the national register of inheritance certification acts.",
  "features.items.3.description":
    "Access to the National Testament Register (NORT) — the national database of registered wills.",
  "features.items.4.description":
    "Electronic Platform for Public Administration Services enabling electronic submission of court applications and documents.",
  "features.items.5.title": "Office Management Software",
  "features.items.5.description":
    "Professional software for managing notarial acts, documents, and client appointments.",
  "features.items.6.title": "Electronic Register",
  "features.items.6.description":
    "Full integration with national notarial registers ensuring the legal validity and immediate effect of registered acts.",
  "features.items.7.title": "Secure Communications",
  "features.items.7.description":
    "Encrypted communication platform ensuring full confidentiality of client correspondence and documents.",

  "testimonials.items.0.title": "Professional and Thorough Service",
  "testimonials.items.0.description":
    "The notary explained every detail of the real estate transaction clearly and patiently. All documents were prepared flawlessly and the entire process was stress-free.",
  "testimonials.items.0.role": "Individual Client",
  "testimonials.items.1.title": "Efficient and Reliable",
  "testimonials.items.1.description":
    "Fast preparation of the inheritance certification act. The notary guided us through the entire process and explained all the legal implications. Highly recommend.",
  "testimonials.items.1.role": "Estate Client",
  "testimonials.items.2.title": "Professional Service",
  "testimonials.items.2.description":
    "We have been using the office's services for our company's needs for years. Always professional, prompt, and thoroughly prepared.",
  "testimonials.items.2.role": "Business Client",

  "faq.items.0.question": "How do I schedule an appointment for a notarial act?",
  "faq.items.0.answer":
    "Appointments can be scheduled by phone, email, or via the contact form on our website. Please contact us in advance so we can prepare the necessary documents and draft the notarial act.",
  "faq.items.1.question": "What documents are needed for a notarial act?",
  "faq.items.1.answer":
    "The required documents depend on the type of notarial act. For real estate transactions you will need the property register number, valid ID documents, and relevant certificates. Please contact us and we will provide a detailed list tailored to your specific case.",
  "faq.items.2.question": "How much does a notarial act cost?",
  "faq.items.2.answer":
    "Notarial fees are regulated by the Maximum Notarial Fee Schedule set by the Minister of Justice. The exact cost depends on the type and value of the transaction. Please contact us for a fee estimate for your specific case.",
  "faq.items.3.question": "How long does it take to complete a notarial act?",
  "faq.items.3.answer":
    "The preparation time depends on the complexity of the act and the required documents. Simple certifications can be completed during a single visit. Complex transactions such as real estate sales require prior document preparation — please contact us in advance.",
  "faq.items.4.question": "What notarial services does the office provide?",
  "faq.items.4.answer":
    "We provide the full range of notarial services: notarial acts, inheritance certification, certifications, real estate sales contracts, wills, and powers of attorney. Please contact us to discuss your specific needs.",

  "blog.preview.0.title": "What is a Notarial Act?",
  "blog.preview.0.description":
    "A guide to notarial acts — when they are required by law and how to prepare for a notarial appointment.",
  "blog.preview.1.title": "Inheritance — Notary vs. Court",
  "blog.preview.1.description":
    "Learn the differences between inheritance certification at a notary and court proceedings — benefits, requirements, and procedure.",
  "blog.preview.2.title": "Real Estate Purchase — What to Prepare",
  "blog.preview.2.description":
    "A step-by-step guide to buying or selling property — what documents you need and what the notary will check.",

  "services.items.0.title": "Notarial Acts",
  "services.items.0.description":
    "We draft notarial acts for all transactions requiring notarial form — contracts, declarations, and other legal documents.",
  "services.items.0.fullDescription":
    "We draft notarial acts for all transactions requiring notarial form — contracts, declarations, and other legal documents.",
  "services.items.1.title": "Inheritance Certification",
  "services.items.1.description":
    "We issue inheritance certification acts as a fast alternative to court proceedings for establishing succession.",
  "services.items.1.fullDescription":
    "We issue inheritance certification acts as a fast alternative to court proceedings for establishing succession.",
  "services.items.2.title": "Certifications",
  "services.items.2.description":
    "We certify signatures, document copies, and dates of presentation — official notarial certifications.",
  "services.items.2.fullDescription":
    "We certify signatures, document copies, and dates of presentation — official notarial certifications.",
  "services.items.3.title": "Real Estate Sales Contracts",
  "services.items.3.description":
    "We draft real estate sales contracts, verify the legal status of property, and guide parties through the entire transaction.",
  "services.items.3.fullDescription":
    "We draft real estate sales contracts, verify the legal status of property, and guide parties through the entire transaction.",
  "services.items.4.title": "Wills & Testaments",
  "services.items.4.description":
    "We draft notarial wills providing legal certainty for your last wishes and effective estate planning.",
  "services.items.4.fullDescription":
    "We draft notarial wills providing legal certainty for your last wishes and effective estate planning.",
  "services.items.5.title": "Powers of Attorney",
  "services.items.5.description":
    "We draft notarial powers of attorney for all legal transactions requiring representation by an attorney-in-fact.",
  "services.items.5.fullDescription":
    "We draft notarial powers of attorney for all legal transactions requiring representation by an attorney-in-fact.",

  "contact.page.subtitle":
    "Contact the Notary Office in Garwolin. We will be happy to answer your questions and help you prepare for your notarial appointment.",
  "contact.info.hours": "Opening Hours",
  "contact.info.hours.mon": "Monday 9:00 – 17:00",
  "contact.info.hours.tue": "Tuesday 9:00 – 17:00",
  "contact.info.hours.wed": "Wednesday 9:00 – 18:00",
  "contact.info.hours.thu": "Thursday 9:00 – 17:00",
  "contact.info.hours.fri": "Friday 9:00 – 15:00",
  "contact.info.receptionHours": "Wednesday 9:00 – 18:00",
  "contact.info.receptionLabel": "Client reception",
  "contact.info.notice.title": "Notary Office bank account: PKO Bank Polski S.A.",
  "contact.info.notice.description":
    "When making a payment, please include the case reference number and the client's full name in the transfer description.",

  "files.groups.0.title": "Powers of Attorney",
  "files.groups.0.files.0.name": "General Power of Attorney",
  "files.groups.0.files.1.name": "Special Power of Attorney for Notarial Proceedings",
  "files.groups.1.title": "Real Estate",
  "files.groups.1.files.0.name": "Real Estate Sale — Document Checklist",
  "files.groups.1.files.1.name": "Land Register Enquiry Guide",
  "files.groups.2.title": "Inheritance",
  "files.groups.2.files.0.name": "Documents Required for Inheritance Certification",
  "files.groups.2.files.1.name": "Inheritance Renunciation",
  "files.groups.3.title": "Wills",
  "files.groups.3.files.0.name": "Will Preparation Guide",

  "systems.learnMore": "Learn more",

  "contact.cta": "Contact Us",
  "contact.badge": "Contact",
  "contact.title": "Get in Touch",
  "contact.subtitle": "Do you need a notarial service or have questions? We are at your disposal.",
  "contact.form.nameLabel": "Full Name",
  "contact.form.namePlaceholder": "Your full name",
  "contact.form.emailLabel": "Email",
  "contact.form.emailPlaceholder": "your@email.com",
  "contact.form.messageLabel": "Message",
  "contact.form.messagePlaceholder": "Describe your notarial matter...",
  "contact.form.submitButton": "Send Message",
  "contact.form.topic.label": "Topic",
  "contact.form.topic.placeholder": "Select a topic",
  "contact.form.topic.options.enforcement": "Notarial Acts",
  "contact.form.topic.options.caseInfo": "Inheritance & Estate",
  "contact.form.topic.options.delivery": "Certifications",
  "contact.form.topic.options.auction": "Real Estate",
  "contact.form.topic.options.other": "Other Matter",

  "footer.copyright": "2026 Notary Office in Garwolin",
  "footer.tagline": "Notary Office in Garwolin. Professional and reliable notarial services.",
  "footer.privacy": "Privacy Policy",
  "footer.terms": "Terms of Service",
  "footer.columns.pages.title": "Pages",
  "footer.columns.contact.title": "Contact",
  "footer.cookieSettings": "Cookie settings",

  "cookies.banner.message":
    "We use cookies to ensure the website works correctly and — with your consent — for analytics and marketing purposes.",
  "cookies.button.onlyNecessary": "Only necessary",
  "cookies.button.customize": "Customize",
  "cookies.button.acceptAll": "Accept all",
  "cookies.button.saveChoice": "Save preferences",
  "cookies.category.necessary.label": "Necessary",
  "cookies.category.necessary.description": "Required for the website to function properly.",
  "cookies.category.analytics.label": "Analytics",
  "cookies.category.analytics.description": "Help us understand how you use the site.",
  "cookies.category.marketing.label": "Marketing",
  "cookies.category.marketing.description": "Used for personalized advertising.",

  "files.badge": "Downloads",
  "files.title": "Forms & Documents",
  "files.subtitle": "Download useful forms and document templates for notarial matters.",

  "ctaBanner.badge": "Contact",
  "ctaBanner.title": "Contact the Notary Office",
  "ctaBanner.subtitle": "Need a notarial service? We are at your disposal.",
  "ctaBanner.cta": "Contact Us",

  "map.badge": "Location",
  "map.title": "Find Us",
  "map.subtitle": "Notary Office in Garwolin",
  "map.openInMaps": "Open in Google Maps",
  "map.directions": "Directions to",
};

const de: Record<string, string> = {
  "business.name": "Notariat in Garwolin",

  "nav.cta": "Kontakt",

  "pages.home.title": "Startseite",
  "pages.about.title": "Über uns",
  "pages.services.title": "Leistungen",
  "pages.blog.title": "Blog",
  "pages.files.title": "Downloads",
  "pages.contact.title": "Kontakt",
  "pages.informations.title": "Rechtsratgeber",
  "pages.informations.navLabel": "Informationen",
  "pages.rodo.title": "Datenschutz",

  "hero.badge": "Notariat",
  "hero.title": "Professionelle Notardienstleistungen in Garwolin",
  "hero.subtitle":
    "Notariat in Garwolin. Zuverlässige und professionelle Notardienstleistungen für Privatpersonen und Unternehmen.",
  "hero.cta": "Kontakt aufnehmen",

  "services.title": "Umfassende Notardienstleistungen",
  "services.subtitle":
    "Wir bieten professionelle, gesetzlich vorgeschriebene Notardienstleistungen und gewährleisten die Sicherheit und rechtliche Gültigkeit Ihrer Transaktionen.",
  "services.cta": "Alle Leistungen anzeigen",
  "services.viewDetails": "Details ansehen",

  "about.badge": "Über uns",
  "about.title": "Notariat in Garwolin",
  "about.story.title": "Notariat in Garwolin",
  "about.story.content":
    "Unser Notariat bietet professionelle Notardienstleistungen in Garwolin und der Umgebung an. Ein Notar ist ein öffentlich bestellter und vereidigter Amtsträger, der rechtliche Sicherheit für die wichtigsten Entscheidungen in Ihrem Leben schafft — Immobilientransaktionen, Erbschaft und persönliche Rechtsangelegenheiten.\n\nWir gewährleisten höchste Servicestandards, vollständige Vertraulichkeit und sorgfältige Vorbereitung aller notariellen Urkunden gemäß den geltenden Rechtsvorschriften.\n\nVertrauen Sie unserer Erfahrung und Professionalität — wir sorgen dafür, dass Ihre Rechtsgeschäfte sicher und reibungslos ablaufen.",
  "about.cta": "Kontakt aufnehmen",
  "about.jurisdiction.title": "Tätigkeitsbereich",
  "about.jurisdiction.content":
    "Unser Notariat bietet Notardienstleistungen in Garwolin und der Masowischen Region an. Wir beurkunden notarielle Urkunden, Erbschaftsnachweise, Beglaubigungen, Immobilientransaktionen, Testamente und Vollmachten.\n\nWir betreuen sowohl Privatpersonen als auch Unternehmen und helfen Ihnen bei jeder gesetzlich vorgeschriebenen notariellen Formalität.\n\nNotarielle Beurkundungen können in unserem Büro oder unter besonderen Umständen (z. B. aus gesundheitlichen Gründen) nach vorheriger Absprache beim Mandanten zu Hause vorgenommen werden.\n\nWir sind bestrebt, jeden Besuch effizient und stressfrei zu gestalten, indem wir alle erforderlichen Unterlagen im Voraus vorbereiten und jede notarielle Handlung ausführlich erläutern.",
  "about.career.title": "Unser Büro",
  "about.career.items.0.year": "Gründung",
  "about.career.items.0.title": "Notar",
  "about.career.items.0.company": "Notariat in Garwolin",
  "about.career.items.0.description":
    "Unser Büro bietet das vollständige Spektrum der nach polnischem Recht erforderlichen Notardienstleistungen an und gewährleistet die Richtigkeit und Rechtssicherheit jeder von uns erstellten Urkunde.",
  "about.career.items.1.year": "Mitgliedschaft",
  "about.career.items.1.title": "Notarkammer",
  "about.career.items.1.company": "Notarkammer Warschau",
  "about.career.items.1.description":
    "Wir arbeiten unter der Aufsicht der Notarkammer Warschau und halten uns strikt an die Grundsätze der Notarischen Berufsordnung.",
  "about.career.items.2.year": "Unsere Mission",
  "about.career.items.2.title": "Professionell & Vertrauenswürdig",
  "about.career.items.2.company": "Notariat in Garwolin",
  "about.career.items.2.description":
    "Wir verpflichten uns, Notardienstleistungen höchster Qualität zu erbringen und dafür zu sorgen, dass sich unsere Mandanten in jeder Phase des notariellen Verfahrens sicher und gut informiert fühlen.",

  "testimonials.badge": "Bewertungen",
  "testimonials.title": "Was unsere Mandanten sagen",
  "testimonials.subtitle": "Vertrauen und Professionalität, bestätigt von unseren Mandanten",

  "faq.badge": "FAQ",
  "faq.title": "Häufig gestellte Fragen",
  "faq.subtitle": "Keine Antwort auf Ihre Frage gefunden?",
  "faq.cta": "Kontakt aufnehmen",

  "blog.badge": "Blog",
  "blog.title": "Notarielle Informationen",
  "blog.subtitle":
    "Nützliche Informationen über notarielle Verfahren, gesetzliche Anforderungen und die Vorbereitung auf Ihren Besuch.",
  "blog.readMore": "Mehr lesen",
  "blog.back": "Zurück",

  "informations.badge": "Informationen",
  "informations.title": "Notarieller Ratgeber",
  "informations.subtitle":
    "Wichtige Informationen zu notariellen Verfahren für Privatpersonen und Unternehmen — was Sie erwartet und wie Sie sich vorbereiten.",

  "home.services.title": "Unsere Leistungen",

  "home.about.title": "Sichere und professionelle Notardienstleistungen",
  "home.about.subtitle":
    "Unser Notariat in Garwolin bietet zuverlässige Notardienstleistungen. Wir garantieren die sorgfältige Vorbereitung jeder Urkunde, klare Erläuterungen und volle Rechtssicherheit bei allen Transaktionen.",
  "home.about.cta": "Mehr über unser Büro",
  "home.about.stats.0": "Jahre Tätigkeit",
  "home.about.stats.1": "Beurkundungen",
  "home.about.stats.2": "Zufriedene Mandanten",
  "home.about.stats.3": "Gründungsjahr",

  "features.badge": "Systeme",
  "features.title": "Modernes Notariat",
  "features.subtitle":
    "Wir nutzen moderne notarielle und juristische Informationssysteme, um die Genauigkeit und Effizienz jeder notariellen Handlung zu gewährleisten.",
  "features.items.0.description":
    "Zugang zu umfassenden Rechtsdatenbanken einschließlich Gesetzestexten, Gerichtsurteilen und juristischen Kommentaren — unverzichtbar für jeden Notar.",
  "features.items.1.description":
    "Elektronischer Zugang zu Grundbüchern für die sofortige Überprüfung des Rechtsstatus von Immobilien.",
  "features.items.2.description":
    "Zugang zum Register der Erbschaftsnachweisakte (RAPD) — das nationale Register der notariellen Erbschaftsnachweise.",
  "features.items.3.description":
    "Zugang zum Nationalen Testamentsregister (NORT) — die nationale Datenbank registrierter Testamente.",
  "features.items.4.description":
    "Elektronische Plattform für öffentliche Verwaltungsdienstleistungen zur elektronischen Einreichung von Gerichtsanträgen und Dokumenten.",
  "features.items.5.title": "Büroverwaltungssoftware",
  "features.items.5.description":
    "Professionelle Software zur Verwaltung von notariellen Akten, Dokumenten und Mandantenterminen.",
  "features.items.6.title": "Elektronisches Register",
  "features.items.6.description":
    "Vollständige Integration mit nationalen notariellen Registern, die die Rechtsgültigkeit und die sofortige Wirkung registrierter Akte gewährleistet.",
  "features.items.7.title": "Sichere Kommunikation",
  "features.items.7.description":
    "Verschlüsselte Kommunikationsplattform für die vollständige Vertraulichkeit der Mandantenkorrespondenz und -dokumente.",

  "testimonials.items.0.title": "Professioneller und gründlicher Service",
  "testimonials.items.0.description":
    "Der Notar erklärte jeden Detail der Immobilientransaktion klar und geduldig. Alle Dokumente wurden einwandfrei vorbereitet und der gesamte Prozess verlief stressfrei.",
  "testimonials.items.0.role": "Privatmandant",
  "testimonials.items.1.title": "Effizient und zuverlässig",
  "testimonials.items.1.description":
    "Schnelle Vorbereitung des Erbschaftsnachweisakts. Der Notar begleitete uns durch den gesamten Prozess und erläuterte alle rechtlichen Konsequenzen. Sehr empfehlenswert.",
  "testimonials.items.1.role": "Erbschaftsmandant",
  "testimonials.items.2.title": "Professioneller Service",
  "testimonials.items.2.description":
    "Wir nutzen die Dienste des Büros für die Bedürfnisse unseres Unternehmens seit Jahren. Immer professionell, pünktlich und gründlich vorbereitet.",
  "testimonials.items.2.role": "Geschäftsmandant",

  "faq.items.0.question": "Wie vereinbare ich einen Termin für eine notarielle Beurkundung?",
  "faq.items.0.answer":
    "Termine können telefonisch, per E-Mail oder über das Kontaktformular auf unserer Website vereinbart werden. Bitte kontaktieren Sie uns im Voraus, damit wir die erforderlichen Unterlagen vorbereiten und die notarielle Urkunde entwerfen können.",
  "faq.items.1.question": "Welche Unterlagen werden für eine notarielle Beurkundung benötigt?",
  "faq.items.1.answer":
    "Die erforderlichen Unterlagen hängen von der Art der notariellen Beurkundung ab. Für Immobilientransaktionen benötigen Sie die Grundbuchnummer, gültige Ausweisdokumente und relevante Bescheinigungen. Kontaktieren Sie uns und wir erstellen eine detaillierte Liste für Ihren spezifischen Fall.",
  "faq.items.2.question": "Was kostet eine notarielle Beurkundung?",
  "faq.items.2.answer":
    "Die Notargebühren sind durch das Höchstgebührenverzeichnis des Justizministers geregelt. Die genauen Kosten hängen von der Art und dem Wert der Transaktion ab. Kontaktieren Sie uns für eine Gebührenschätzung für Ihren spezifischen Fall.",
  "faq.items.3.question": "Wie lange dauert eine notarielle Beurkundung?",
  "faq.items.3.answer":
    "Die Vorbereitungszeit hängt von der Komplexität der Beurkundung und den erforderlichen Unterlagen ab. Einfache Beglaubigungen können während eines einzigen Besuchs erledigt werden. Komplexe Transaktionen wie Immobilienverkäufe erfordern eine vorherige Dokumentenvorbereitung — bitte kontaktieren Sie uns im Voraus.",
  "faq.items.4.question": "Welche Notardienstleistungen bietet das Büro an?",
  "faq.items.4.answer":
    "Wir bieten das vollständige Spektrum der Notardienstleistungen: notarielle Urkunden, Erbschaftsnachweise, Beglaubigungen, Kaufverträge für Immobilien, Testamente und Vollmachten. Kontaktieren Sie uns zur Besprechung Ihrer spezifischen Bedürfnisse.",

  "blog.preview.0.title": "Was ist eine notarielle Urkunde?",
  "blog.preview.0.description":
    "Ein Leitfaden zu notariellen Urkunden — wann sie gesetzlich vorgeschrieben sind und wie Sie sich auf einen Notartermin vorbereiten.",
  "blog.preview.1.title": "Erbschaft — Notar oder Gericht?",
  "blog.preview.1.description":
    "Erfahren Sie die Unterschiede zwischen dem Erbschaftsnachweis beim Notar und einem Gerichtsverfahren — Vorteile, Anforderungen und Ablauf.",
  "blog.preview.2.title": "Immobilienkauf — Was ist vorzubereiten?",
  "blog.preview.2.description":
    "Eine Schritt-für-Schritt-Anleitung zum Kauf oder Verkauf einer Immobilie — welche Dokumente Sie benötigen und was der Notar prüft.",

  "services.items.0.title": "Notarielle Urkunden",
  "services.items.0.description":
    "Wir beurkunden alle Rechtsgeschäfte, die der notariellen Form bedürfen — Verträge, Erklärungen und andere Rechtsdokumente.",
  "services.items.0.fullDescription":
    "Wir beurkunden alle Rechtsgeschäfte, die der notariellen Form bedürfen — Verträge, Erklärungen und andere Rechtsdokumente.",
  "services.items.1.title": "Erbschaftsnachweis",
  "services.items.1.description":
    "Wir stellen Erbschaftsnachweisakten als schnelle Alternative zu einem Gerichtsverfahren zur Feststellung des Erbrechts aus.",
  "services.items.1.fullDescription":
    "Wir stellen Erbschaftsnachweisakten als schnelle Alternative zu einem Gerichtsverfahren zur Feststellung des Erbrechts aus.",
  "services.items.2.title": "Beglaubigungen",
  "services.items.2.description":
    "Wir beglaubigen Unterschriften, Dokumentkopien und Vorlagezeitpunkte — offizielle notarielle Beglaubigungen.",
  "services.items.2.fullDescription":
    "Wir beglaubigen Unterschriften, Dokumentkopien und Vorlagezeitpunkte — offizielle notarielle Beglaubigungen.",
  "services.items.3.title": "Immobilienkaufverträge",
  "services.items.3.description":
    "Wir beurkunden Immobilienkaufverträge, überprüfen den Rechtsstatus der Immobilie und begleiten die Parteien durch die gesamte Transaktion.",
  "services.items.3.fullDescription":
    "Wir beurkunden Immobilienkaufverträge, überprüfen den Rechtsstatus der Immobilie und begleiten die Parteien durch die gesamte Transaktion.",
  "services.items.4.title": "Testamente",
  "services.items.4.description":
    "Wir beurkunden notarielle Testamente, die rechtliche Sicherheit für Ihren letzten Willen und eine effektive Nachlassplanung bieten.",
  "services.items.4.fullDescription":
    "Wir beurkunden notarielle Testamente, die rechtliche Sicherheit für Ihren letzten Willen und eine effektive Nachlassplanung bieten.",
  "services.items.5.title": "Vollmachten",
  "services.items.5.description":
    "Wir beurkunden notarielle Vollmachten für alle Rechtsgeschäfte, die eine Vertretung durch einen Bevollmächtigten erfordern.",
  "services.items.5.fullDescription":
    "Wir beurkunden notarielle Vollmachten für alle Rechtsgeschäfte, die eine Vertretung durch einen Bevollmächtigten erfordern.",

  "contact.page.subtitle":
    "Kontaktieren Sie das Notariat in Garwolin. Wir beantworten gerne Ihre Fragen und helfen Ihnen bei der Vorbereitung auf Ihren Notartermin.",
  "contact.info.hours": "Öffnungszeiten",
  "contact.info.hours.mon": "Montag 9:00 – 17:00",
  "contact.info.hours.tue": "Dienstag 9:00 – 17:00",
  "contact.info.hours.wed": "Mittwoch 9:00 – 18:00",
  "contact.info.hours.thu": "Donnerstag 9:00 – 17:00",
  "contact.info.hours.fri": "Freitag 9:00 – 15:00",
  "contact.info.receptionHours": "Mittwoch 9:00 – 18:00",
  "contact.info.receptionLabel": "Mandantenempfang",
  "contact.info.notice.title": "Bankkontonummer des Notariats: PKO Bank Polski S.A.",
  "contact.info.notice.description":
    "Bitte geben Sie bei der Zahlung im Verwendungszweck die Fallnummer und den vollständigen Namen des Mandanten an.",

  "files.groups.0.title": "Vollmachten",
  "files.groups.0.files.0.name": "Allgemeine Vollmacht",
  "files.groups.0.files.1.name": "Besondere Vollmacht für notarielle Verfahren",
  "files.groups.1.title": "Immobilien",
  "files.groups.1.files.0.name": "Immobilienverkauf — Dokumentencheckliste",
  "files.groups.1.files.1.name": "Grundbuchabfrage — Leitfaden",
  "files.groups.2.title": "Erbschaft",
  "files.groups.2.files.0.name": "Erforderliche Dokumente für den Erbschaftsnachweis",
  "files.groups.2.files.1.name": "Erbschaftsverzicht",
  "files.groups.3.title": "Testamente",
  "files.groups.3.files.0.name": "Leitfaden zur Testamentserrichtung",

  "systems.learnMore": "Mehr erfahren",

  "contact.cta": "Kontakt aufnehmen",
  "contact.badge": "Kontakt",
  "contact.title": "Kontakt aufnehmen",
  "contact.subtitle":
    "Benötigen Sie eine Notardienstleistung oder haben Sie Fragen? Wir stehen Ihnen zur Verfügung.",
  "contact.form.nameLabel": "Vollständiger Name",
  "contact.form.namePlaceholder": "Ihr vollständiger Name",
  "contact.form.emailLabel": "E-Mail",
  "contact.form.emailPlaceholder": "ihre@email.de",
  "contact.form.messageLabel": "Nachricht",
  "contact.form.messagePlaceholder": "Beschreiben Sie Ihr notarielles Anliegen...",
  "contact.form.submitButton": "Nachricht senden",
  "contact.form.topic.label": "Thema",
  "contact.form.topic.placeholder": "Thema auswählen",
  "contact.form.topic.options.enforcement": "Notarielle Urkunden",
  "contact.form.topic.options.caseInfo": "Erbschaft & Nachlass",
  "contact.form.topic.options.delivery": "Beglaubigungen",
  "contact.form.topic.options.auction": "Immobilien",
  "contact.form.topic.options.other": "Sonstiges Anliegen",

  "footer.copyright": "2026 Notariat in Garwolin",
  "footer.tagline": "Notariat in Garwolin. Professionelle und zuverlässige Notardienstleistungen.",
  "footer.privacy": "Datenschutzrichtlinie",
  "footer.terms": "Nutzungsbedingungen",
  "footer.columns.pages.title": "Seiten",
  "footer.columns.contact.title": "Kontakt",
  "footer.cookieSettings": "Cookie-Einstellungen",

  "cookies.banner.message":
    "Wir verwenden Cookies, um den ordnungsgemäßen Betrieb der Website zu gewährleisten und — mit Ihrer Zustimmung — für Analyse- und Marketingzwecke.",
  "cookies.button.onlyNecessary": "Nur notwendige",
  "cookies.button.customize": "Anpassen",
  "cookies.button.acceptAll": "Alle akzeptieren",
  "cookies.button.saveChoice": "Auswahl speichern",
  "cookies.category.necessary.label": "Notwendig",
  "cookies.category.necessary.description":
    "Erforderlich für den ordnungsgemäßen Betrieb der Website.",
  "cookies.category.analytics.label": "Analyse",
  "cookies.category.analytics.description": "Helfen uns zu verstehen, wie Sie die Website nutzen.",
  "cookies.category.marketing.label": "Marketing",
  "cookies.category.marketing.description": "Werden für personalisierte Werbung verwendet.",

  "files.badge": "Downloads",
  "files.title": "Formulare & Dokumente",
  "files.subtitle":
    "Laden Sie nützliche Formulare und Dokumentvorlagen für notarielle Angelegenheiten herunter.",

  "ctaBanner.badge": "Kontakt",
  "ctaBanner.title": "Notariat kontaktieren",
  "ctaBanner.subtitle": "Benötigen Sie eine Notardienstleistung? Wir stehen Ihnen zur Verfügung.",
  "ctaBanner.cta": "Kontakt aufnehmen",

  "map.badge": "Standort",
  "map.title": "Finden Sie uns",
  "map.subtitle": "Notariat in Garwolin",
  "map.openInMaps": "In Google Maps öffnen",
  "map.directions": "Route zu",
};

const uk: Record<string, string> = {
  "business.name": "Нотаріальна канцелярія у Гарволіні",

  "nav.cta": "Контакт",

  "pages.home.title": "Головна",
  "pages.about.title": "Про нас",
  "pages.services.title": "Послуги",
  "pages.blog.title": "Блог",
  "pages.files.title": "Завантаження",
  "pages.contact.title": "Контакт",
  "pages.informations.title": "Правові поради",
  "pages.informations.navLabel": "Інформація",
  "pages.rodo.title": "Захист даних",

  "hero.badge": "Нотаріальна канцелярія",
  "hero.title": "Професійні нотаріальні послуги у Гарволіні",
  "hero.subtitle":
    "Нотаріальна канцелярія у Гарволіні. Надійні та професійні нотаріальні послуги для фізичних осіб та підприємств.",
  "hero.cta": "Зв'яжіться з нами",

  "services.title": "Комплексні нотаріальні послуги",
  "services.subtitle":
    "Ми надаємо професійні нотаріальні послуги, передбачені законом, забезпечуючи безпеку та юридичну силу ваших правочинів.",
  "services.cta": "Переглянути всі послуги",
  "services.viewDetails": "Детальніше",

  "about.badge": "Про нас",
  "about.title": "Нотаріальна канцелярія у Гарволіні",
  "about.story.title": "Нотаріальна канцелярія у Гарволіні",
  "about.story.content":
    "Наша нотаріальна канцелярія надає професійні нотаріальні послуги у Гарволіні та навколишньому регіоні. Нотаріус — це довірена посадова особа, яка забезпечує правову визначеність у найважливіших рішеннях вашого життя: угодах з нерухомістю, спадкуванні та особистих правових питаннях.\n\nМи гарантуємо найвищі стандарти обслуговування, повну конфіденційність та ретельну підготовку нотаріальних документів відповідно до чинного законодавства.\n\nДовіртеся нашому досвіду та професіоналізму — ми тут, щоб зробити ваші правові операції безпечними та безперебійними.",
  "about.cta": "Зв'яжіться з нами",
  "about.jurisdiction.title": "Сфера діяльності",
  "about.jurisdiction.content":
    "Наша нотаріальна канцелярія надає нотаріальні послуги у Гарволіні та Мазовецькому регіоні. Ми здійснюємо нотаріальні акти, свідоцтва про спадщину, засвідчення, угоди з нерухомістю, заповіти та довіреності.\n\nМи обслуговуємо як фізичних осіб, так і підприємства. З радістю допоможемо з будь-якою нотаріальною формальністю, передбаченою законом.\n\nНотаріальні дії можуть здійснюватися в канцелярії або, за особливих обставин (наприклад, через стан здоров'я), за місцем перебування клієнта за попередньою домовленістю.\n\nМи прагнемо зробити кожний візит ефективним та комфортним, готуючи всі необхідні документи завчасно та детально пояснюючи кожну нотаріальну дію.",
  "about.career.title": "Наша канцелярія",
  "about.career.items.0.year": "Заснування",
  "about.career.items.0.title": "Нотаріус",
  "about.career.items.0.company": "Нотаріальна канцелярія у Гарволіні",
  "about.career.items.0.description":
    "Наша канцелярія надає повний спектр нотаріальних послуг, передбачених польським законодавством, забезпечуючи правильність та юридичну силу кожного підготовленого документа.",
  "about.career.items.1.year": "Членство",
  "about.career.items.1.title": "Нотаріальна палата",
  "about.career.items.1.company": "Варшавська нотаріальна палата",
  "about.career.items.1.description":
    "Ми працюємо під наглядом Варшавської нотаріальної палати та суворо дотримуємося принципів нотаріального кодексу етики.",
  "about.career.items.2.year": "Наша місія",
  "about.career.items.2.title": "Професійно та надійно",
  "about.career.items.2.company": "Нотаріальна канцелярія у Гарволіні",
  "about.career.items.2.description":
    "Ми зобов'язуємося надавати нотаріальні послуги найвищої якості, забезпечуючи клієнтам відчуття безпеки та поінформованості на кожному етапі нотаріальної процедури.",

  "testimonials.badge": "Відгуки",
  "testimonials.title": "Що кажуть наші клієнти",
  "testimonials.subtitle": "Довіра та професіоналізм, підтверджені нашими клієнтами",

  "faq.badge": "FAQ",
  "faq.title": "Часті запитання",
  "faq.subtitle": "Не знайшли відповіді на своє запитання?",
  "faq.cta": "Зв'яжіться з нами",

  "blog.badge": "Блог",
  "blog.title": "Нотаріальна інформація",
  "blog.subtitle":
    "Корисна інформація про нотаріальні процедури, правові вимоги та підготовку до вашого візиту.",
  "blog.readMore": "Читати далі",
  "blog.back": "Назад",

  "informations.badge": "Інформація",
  "informations.title": "Нотаріальний путівник",
  "informations.subtitle":
    "Ключова інформація про нотаріальні процедури для фізичних осіб та підприємств — чого очікувати та як підготуватися.",

  "home.services.title": "Наші послуги",

  "home.about.title": "Безпечні та професійні нотаріальні послуги",
  "home.about.subtitle":
    "Наша нотаріальна канцелярія у Гарволіні надає надійні нотаріальні послуги. Гарантуємо ретельну підготовку кожного документа, чіткі пояснення та повну юридичну силу всіх правочинів.",
  "home.about.cta": "Більше про канцелярію",
  "home.about.stats.0": "Років діяльності",
  "home.about.stats.1": "Нотаріальних актів",
  "home.about.stats.2": "Задоволених клієнтів",
  "home.about.stats.3": "Рік заснування",

  "features.badge": "Системи",
  "features.title": "Сучасна нотаріальна канцелярія",
  "features.subtitle":
    "Ми використовуємо сучасні нотаріальні та правові інформаційні системи для забезпечення точності та ефективності кожної нотаріальної дії.",
  "features.items.0.description":
    "Доступ до комплексних правових баз даних, включаючи законодавство, судові рішення та юридичні коментарі — незамінно для кожного нотаріуса.",
  "features.items.1.description":
    "Електронний доступ до реєстрів нерухомості для миттєвої перевірки правового стану майна.",
  "features.items.2.description":
    "Доступ до Реєстру актів посвідчення спадщини (RAPD) — національного реєстру нотаріальних свідоцтв про спадщину.",
  "features.items.3.description":
    "Доступ до Національного реєстру заповітів (NORT) — національної бази даних зареєстрованих заповітів.",
  "features.items.4.description":
    "Електронна платформа публічних адміністративних послуг для електронного подання судових заяв та документів.",
  "features.items.5.title": "Програмне забезпечення канцелярії",
  "features.items.5.description":
    "Професійне програмне забезпечення для управління нотаріальними актами, документами та записами клієнтів.",
  "features.items.6.title": "Електронний реєстр",
  "features.items.6.description":
    "Повна інтеграція з національними нотаріальними реєстрами, що забезпечує юридичну силу та негайний ефект зареєстрованих актів.",
  "features.items.7.title": "Безпечний зв'язок",
  "features.items.7.description":
    "Зашифрована комунікаційна платформа, що забезпечує повну конфіденційність кореспонденції та документів клієнтів.",

  "testimonials.items.0.title": "Професійне та ретельне обслуговування",
  "testimonials.items.0.description":
    "Нотаріус чітко та терпляче пояснив кожну деталь угоди з нерухомістю. Всі документи були підготовлені бездоганно, а весь процес пройшов без стресу.",
  "testimonials.items.0.role": "Індивідуальний клієнт",
  "testimonials.items.1.title": "Ефективно та надійно",
  "testimonials.items.1.description":
    "Швидка підготовка акта посвідчення спадщини. Нотаріус провів нас через весь процес та пояснив усі правові наслідки. Дуже рекомендую.",
  "testimonials.items.1.role": "Клієнт у справах спадщини",
  "testimonials.items.2.title": "Професійне обслуговування",
  "testimonials.items.2.description":
    "Роками користуємося послугами канцелярії для потреб нашої компанії. Завжди професійно, вчасно та ретельно підготовлено.",
  "testimonials.items.2.role": "Корпоративний клієнт",

  "faq.items.0.question": "Як записатися на нотаріальну дію?",
  "faq.items.0.answer":
    "Запис можливий по телефону, електронною поштою або через контактну форму на нашому сайті. Будь ласка, зв'яжіться з нами заздалегідь, щоб ми могли підготувати необхідні документи та скласти проект нотаріального акта.",
  "faq.items.1.question": "Які документи потрібні для нотаріальної дії?",
  "faq.items.1.answer":
    "Перелік необхідних документів залежить від виду нотаріальної дії. Для угод з нерухомістю знадобляться номер реєстру нерухомості, дійсні документи, що посвідчують особу, та відповідні довідки. Зв'яжіться з нами і ми надамо детальний перелік для вашого конкретного випадку.",
  "faq.items.2.question": "Скільки коштує нотаріальна дія?",
  "faq.items.2.answer":
    "Нотаріальні тарифи регулюються Постановою Міністра юстиції про максимальні ставки нотаріального тарифу. Точна вартість залежить від виду та цінності правочину. Зв'яжіться з нами для отримання розрахунку витрат у вашому конкретному випадку.",
  "faq.items.3.question": "Скільки часу займає нотаріальна дія?",
  "faq.items.3.answer":
    "Час підготовки залежить від складності дії та необхідних документів. Прості засвідчення можна виконати під час одного візиту. Складні правочини, як-от продаж нерухомості, потребують попередньої підготовки документів — будь ласка, зв'яжіться з нами заздалегідь.",
  "faq.items.4.question": "Які нотаріальні послуги надає канцелярія?",
  "faq.items.4.answer":
    "Ми надаємо повний спектр нотаріальних послуг: нотаріальні акти, свідоцтва про спадщину, засвідчення, договори купівлі-продажу нерухомості, заповіти та довіреності. Зв'яжіться з нами для обговорення ваших потреб.",

  "blog.preview.0.title": "Що таке нотаріальний акт?",
  "blog.preview.0.description":
    "Путівник по нотаріальних актах — коли вони обов'язкові за законом та як підготуватися до візиту до нотаріуса.",
  "blog.preview.1.title": "Спадщина — нотаріус чи суд?",
  "blog.preview.1.description":
    "Дізнайтеся різницю між посвідченням спадщини у нотаріуса та судовим провадженням — переваги, вимоги та процедура.",
  "blog.preview.2.title": "Купівля нерухомості — що підготувати?",
  "blog.preview.2.description":
    "Покрокове керівництво з купівлі або продажу нерухомості — які документи потрібні та що перевірить нотаріус.",

  "services.items.0.title": "Нотаріальні акти",
  "services.items.0.description":
    "Складаємо нотаріальні акти для всіх правочинів, що вимагають нотаріальної форми — договорів, заяв та інших правових документів.",
  "services.items.0.fullDescription":
    "Складаємо нотаріальні акти для всіх правочинів, що вимагають нотаріальної форми — договорів, заяв та інших правових документів.",
  "services.items.1.title": "Посвідчення спадщини",
  "services.items.1.description":
    "Складаємо акти посвідчення спадщини як швидку альтернативу судовому провадженню для встановлення спадкоємців.",
  "services.items.1.fullDescription":
    "Складаємо акти посвідчення спадщини як швидку альтернативу судовому провадженню для встановлення спадкоємців.",
  "services.items.2.title": "Засвідчення",
  "services.items.2.description":
    "Засвідчуємо підписи, копії документів та дати пред'явлення — офіційні нотаріальні засвідчення.",
  "services.items.2.fullDescription":
    "Засвідчуємо підписи, копії документів та дати пред'явлення — офіційні нотаріальні засвідчення.",
  "services.items.3.title": "Договори купівлі-продажу нерухомості",
  "services.items.3.description":
    "Складаємо договори купівлі-продажу нерухомості, перевіряємо правовий стан майна та супроводжуємо сторони через увесь правочин.",
  "services.items.3.fullDescription":
    "Складаємо договори купівлі-продажу нерухомості, перевіряємо правовий стан майна та супроводжуємо сторони через увесь правочин.",
  "services.items.4.title": "Заповіти",
  "services.items.4.description":
    "Складаємо нотаріальні заповіти, що забезпечують юридичну силу вашої останньої волі та ефективне планування спадщини.",
  "services.items.4.fullDescription":
    "Складаємо нотаріальні заповіти, що забезпечують юридичну силу вашої останньої волі та ефективне планування спадщини.",
  "services.items.5.title": "Довіреності",
  "services.items.5.description":
    "Складаємо нотаріальні довіреності для всіх правочинів, що вимагають представництва уповноваженою особою.",
  "services.items.5.fullDescription":
    "Складаємо нотаріальні довіреності для всіх правочинів, що вимагають представництва уповноваженою особою.",

  "contact.page.subtitle":
    "Зв'яжіться з нотаріальною канцелярією у Гарволіні. Ми із задоволенням відповімо на ваші запитання та допоможемо підготуватися до нотаріального візиту.",
  "contact.info.hours": "Години роботи",
  "contact.info.hours.mon": "понеділок 9:00 – 17:00",
  "contact.info.hours.tue": "вівторок 9:00 – 17:00",
  "contact.info.hours.wed": "середа 9:00 – 18:00",
  "contact.info.hours.thu": "четвер 9:00 – 17:00",
  "contact.info.hours.fri": "п'ятниця 9:00 – 15:00",
  "contact.info.receptionHours": "середа 9:00 – 18:00",
  "contact.info.receptionLabel": "Прийом клієнтів",
  "contact.info.notice.title": "Банківський рахунок канцелярії: PKO Bank Polski S.A.",
  "contact.info.notice.description":
    "При здійсненні платежу в призначенні переказу необхідно вказати номер справи та повне ім'я клієнта.",

  "files.groups.0.title": "Довіреності",
  "files.groups.0.files.0.name": "Загальна довіреність",
  "files.groups.0.files.1.name": "Спеціальна довіреність для нотаріального провадження",
  "files.groups.1.title": "Нерухомість",
  "files.groups.1.files.0.name": "Продаж нерухомості — перелік документів",
  "files.groups.1.files.1.name": "Запит до реєстру нерухомості — керівництво",
  "files.groups.2.title": "Спадщина",
  "files.groups.2.files.0.name": "Документи для посвідчення спадщини",
  "files.groups.2.files.1.name": "Відмова від спадщини",
  "files.groups.3.title": "Заповіти",
  "files.groups.3.files.0.name": "Керівництво зі складання заповіту",

  "systems.learnMore": "Дізнатися більше",

  "contact.cta": "Зв'яжіться з нами",
  "contact.badge": "Контакт",
  "contact.title": "Зв'яжіться з нами",
  "contact.subtitle":
    "Потрібна нотаріальна послуга або є запитання? Ми до вашого розпорядження.",
  "contact.form.nameLabel": "Повне ім'я",
  "contact.form.namePlaceholder": "Ваше повне ім'я",
  "contact.form.emailLabel": "Електронна пошта",
  "contact.form.emailPlaceholder": "ваша@пошта.com",
  "contact.form.messageLabel": "Повідомлення",
  "contact.form.messagePlaceholder": "Опишіть вашу нотаріальну справу...",
  "contact.form.submitButton": "Надіслати повідомлення",
  "contact.form.topic.label": "Тема",
  "contact.form.topic.placeholder": "Виберіть тему",
  "contact.form.topic.options.enforcement": "Нотаріальні акти",
  "contact.form.topic.options.caseInfo": "Спадщина та майно",
  "contact.form.topic.options.delivery": "Засвідчення",
  "contact.form.topic.options.auction": "Нерухомість",
  "contact.form.topic.options.other": "Інше питання",

  "footer.copyright": "2026 Нотаріальна канцелярія у Гарволіні",
  "footer.tagline":
    "Нотаріальна канцелярія у Гарволіні. Професійні та надійні нотаріальні послуги.",
  "footer.privacy": "Політика конфіденційності",
  "footer.terms": "Умови обслуговування",
  "footer.columns.pages.title": "Сторінки",
  "footer.columns.contact.title": "Контакт",
  "footer.cookieSettings": "Налаштування cookies",

  "cookies.banner.message":
    "Ми використовуємо файли cookies для забезпечення належної роботи сайту та — за вашою згодою — для аналітичних і маркетингових цілей.",
  "cookies.button.onlyNecessary": "Лише необхідні",
  "cookies.button.customize": "Налаштувати",
  "cookies.button.acceptAll": "Прийняти всі",
  "cookies.button.saveChoice": "Зберегти вибір",
  "cookies.category.necessary.label": "Необхідні",
  "cookies.category.necessary.description": "Потрібні для належного функціонування сайту.",
  "cookies.category.analytics.label": "Аналітичні",
  "cookies.category.analytics.description": "Допомагають зрозуміти, як ви користуєтеся сайтом.",
  "cookies.category.marketing.label": "Маркетингові",
  "cookies.category.marketing.description": "Використовуються для персоналізованої реклами.",

  "files.badge": "Завантаження",
  "files.title": "Форми та документи",
  "files.subtitle":
    "Завантажте корисні форми та зразки документів для нотаріальних справ.",

  "ctaBanner.badge": "Контакт",
  "ctaBanner.title": "Зв'яжіться з нотаріальною канцелярією",
  "ctaBanner.subtitle": "Потрібна нотаріальна послуга? Ми до вашого розпорядження.",
  "ctaBanner.cta": "Зв'яжіться з нами",

  "map.badge": "Розташування",
  "map.title": "Знайдіть нас",
  "map.subtitle": "Нотаріальна канцелярія у Гарволіні",
  "map.openInMaps": "Відкрити в Google Maps",
  "map.directions": "Маршрут до",
};

const updated = {
  ...existing,
  en,
  de,
  uk,
  _settings: { primaryLanguage: "pl" },
};

await sql`
  UPDATE sites
  SET translations = ${sql.json(updated)}, updated_at = NOW()
  WHERE id = ${siteId}
`;

console.log(`Updated ${subdomain}: added EN, DE, UK translations`);
await sql.end();
console.log("Done.");
