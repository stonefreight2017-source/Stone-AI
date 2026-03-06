/**
 * BESTIE LANGUAGE SEEDS & REGIONAL COMPLIANCE
 *
 * Deep cultural knowledge, communication patterns, and legal requirements
 * for each supported language/region. When a Bestie operates in a language,
 * the corresponding regional rules are automatically injected into the prompt.
 *
 * This ensures Stone AI is legally compliant in every market where users
 * speak these languages, and that the Bestie communicates with authentic
 * cultural fluency — not just translation.
 */

import type { BestieLanguage } from "./bestie-validators";

export interface LanguageSeed {
  code: BestieLanguage;
  label: string;
  /** Primary regions/countries where this language is spoken */
  regions: string[];
  /** Deep cultural communication norms */
  culturalNorms: string;
  /** Idioms, proverbs, and expressions that feel native */
  idioms: string[];
  /** Communication style preferences (direct vs indirect, formal vs casual) */
  communicationStyle: string;
  /** Regional legal/regulatory requirements for AI services */
  legalCompliance: string;
  /** Content restrictions specific to this region */
  contentRestrictions: string;
  /** Data privacy laws that apply */
  dataPrivacy: string;
  /** Age/minor protections specific to region */
  minorProtections: string;
  /** Emotional/cultural taboos to be aware of */
  culturalSensitivities: string;
  /** How greetings, farewells, and respect work */
  socialProtocol: string;
  /** Currency, date format, number format */
  localeFormats: string;
}

export const LANGUAGE_SEEDS: Record<BestieLanguage, LanguageSeed> = {
  en: {
    code: "en",
    label: "English",
    regions: ["United States", "United Kingdom", "Canada", "Australia", "New Zealand", "Ireland", "South Africa", "Nigeria", "Philippines", "Singapore"],
    culturalNorms: `
English speakers vary enormously by region. Key differences:
- US: Casual, optimistic, action-oriented. "How are you?" is a greeting, not a real question. Directness is valued. Self-improvement culture is strong.
- UK: Understatement is an art form. "Not bad" means "quite good." Sarcasm and dry humor are communication tools, not hostility. Queue culture matters.
- Australia: Extremely casual, abbreviate everything (arvo=afternoon, brekkie=breakfast). Tall poppy syndrome — don't brag. Mate culture.
- Canada: Polite but not passive. "Sorry" is conversational glue. Bilingual awareness (French-English).
- Nigeria/West Africa: Proverbs carry weight. Respect for elders is paramount. Pidgin English is a real, valid language.
- India (English): Hinglish is the norm in urban contexts. "Kindly do the needful" is valid. Head wobble means many things.`,
    idioms: [
      "Break a leg (good luck)",
      "Hit the nail on the head (exactly right)",
      "Piece of cake (easy)",
      "Cost an arm and a leg (expensive)",
      "Spill the tea (share gossip)",
      "It's giving... (it resembles/conveys)",
      "No cap (for real)",
      "Slay (excel/impress)",
      "Living rent-free in my head (can't stop thinking about it)",
      "Main character energy (confidence/presence)",
    ],
    communicationStyle: "Generally direct, values clarity. US leans optimistic/encouraging. UK leans understated/ironic. Australia leans casual/irreverent. Match the user's energy and regional markers.",
    legalCompliance: `
US: FTC Act Section 5 (unfair/deceptive practices), state consumer protection laws, CA SB 243 (AI Companion Safeguards), NY AI Companion Safeguards Act. Must disclose AI nature. No deceptive emotional manipulation.
UK: Online Safety Act 2023, UK GDPR, AI regulatory framework (pro-innovation). Ofcom oversight for online services.
Canada: AIDA (Artificial Intelligence and Data Act), PIPEDA (federal privacy), Quebec Law 25 (privacy).
Australia: Privacy Act 1988 (amended 2024), AI Ethics Framework (voluntary but referenced in enforcement), Online Safety Act 2021.
EU (Ireland): EU AI Act (high-risk AI rules), GDPR, Digital Services Act.`,
    contentRestrictions: "No content that could be considered deceptive advertising. FTC requires clear AI disclosure. UK Online Safety Act prohibits content harmful to adults/children. Australian eSafety Commissioner can issue takedown notices.",
    dataPrivacy: `
US: No federal comprehensive privacy law. CA CCPA/CPRA (right to delete, opt-out of sale), CO CPA, VA VCDPA, CT CTDPA, other state laws. Children: COPPA (under 13).
UK: UK GDPR — lawful basis required, right to erasure, data portability, breach notification within 72 hours.
Canada: PIPEDA — consent required, right of access, breach reporting mandatory.
Australia: Privacy Act — APPs (Australian Privacy Principles), notifiable data breach scheme, right to access/correct.`,
    minorProtections: "US: COPPA (under 13), CA AADC (under 18 design code). UK: Age Appropriate Design Code (AADC). Australia: Online Safety Act youth protections. Stone AI requires 18+ — always enforce.",
    culturalSensitivities: "Avoid assumptions about race, politics, religion. US: politically polarized — don't take sides. UK: class sensitivity. Australia: Indigenous cultural respect (don't casually reference Dreamtime/sacred sites). Canada: Indigenous reconciliation awareness.",
    socialProtocol: "US: First names quickly, handshake culture, small talk expected. UK: More formal initially, tea is serious, weather is a conversation starter. Australia: First names immediately, 'mate' is universal. Canada: Bilingual greetings in formal contexts.",
    localeFormats: "US: MM/DD/YYYY, $, 1,000.00, Imperial. UK: DD/MM/YYYY, GBP, 1,000.00, Metric. Canada: DD/MM/YYYY or YYYY-MM-DD, CAD, Metric. Australia: DD/MM/YYYY, AUD, Metric.",
  },

  zh: {
    code: "zh",
    label: "Mandarin Chinese",
    regions: ["Mainland China (PRC)", "Taiwan (ROC)", "Singapore", "Malaysia", "Hong Kong (Cantonese primary, Mandarin growing)"],
    culturalNorms: `
Chinese communication is deeply contextual:
- "Face" (mianzi/lian) is central — never publicly embarrass or directly contradict someone. Indirect disagreement is preferred.
- Guanxi (relationships/connections) matter enormously. Building rapport before business is expected.
- Modesty is valued. Compliments are often deflected — "nali nali" (where? where? = you flatter me).
- Hierarchy matters. Age and seniority carry implicit respect.
- Gift-giving has rules: no clocks (homophone for "attending a funeral"), no pears to split (homophone for "separation"), avoid the number 4 (homophone for "death"), 8 is lucky.
- Taiwan: More casual/Westernized in some ways, but traditional values strong. Use Traditional characters. Political sensitivity around PRC/ROC relations.
- Singapore: Multilingual (English/Mandarin/Malay/Tamil). Singlish influence. Simplified characters.`,
    idioms: [
      "塞翁失马 (Sai Weng lost his horse — a blessing in disguise)",
      "画蛇添足 (Drawing legs on a snake — overdoing it)",
      "对牛弹琴 (Playing music to a cow — wasting effort on unappreciative audience)",
      "入乡随俗 (When entering a village, follow its customs — when in Rome)",
      "三思而行 (Think three times before acting — look before you leap)",
      "活到老学到老 (Live to old age, learn to old age — never stop learning)",
      "加油 (Add oil — you can do it! / keep going!)",
      "慢慢来 (Take it slowly — no rush, be patient)",
      "吃苦 (Eat bitterness — endure hardship, a virtue)",
      "缘分 (Yuan fen — fate/destiny that brings people together)",
    ],
    communicationStyle: "High-context, indirect. Silence can mean disagreement. 'Maybe' or 'I'll think about it' often means 'no.' Harmony (hexie) is prioritized over blunt truth. Use softer suggestions: 'Have you considered...' rather than 'You should...'",
    legalCompliance: `
PRC: Interim Measures for Generative AI Services (2023) — AI must uphold "core socialist values," no content undermining state power or national unity, no content promoting terrorism/extremism, no fake news. Must label AI-generated content. Real-name registration may be required.
PRC: Algorithmic Recommendation Regulations (2022) — transparency in algorithms.
PRC: Deep Synthesis Provisions (2023) — deepfake/synthetic content rules.
Taiwan: Personal Data Protection Act (PDPA), no specific AI law yet but follows democratic/Western-aligned norms.
Singapore: AI Governance Framework (voluntary), PDPA (Personal Data Protection Act 2012).
Hong Kong: PDPO (Personal Data Privacy Ordinance).`,
    contentRestrictions: `
PRC: Extensive content restrictions. No content that: subverts state power, undermines national unity, damages national honor, spreads rumors, disrupts social order, promotes superstition/obscenity/gambling/violence. No content about Tiananmen, Taiwan independence, Tibet independence, Xinjiang, or other politically sensitive topics. The Bestie must NOT engage with these topics — redirect gracefully.
Taiwan: Standard democratic content norms — no child exploitation, defamation laws apply.
Singapore: Strict on racial/religious harmony (Sedition Act, Maintenance of Religious Harmony Act). No content that inflames racial or religious tension.`,
    dataPrivacy: `
PRC: PIPL (Personal Information Protection Law 2021) — China's comprehensive data privacy law. Consent required, cross-border data transfer restrictions (data localization requirements), right to delete, separate consent for sensitive data. Data leaving China requires security assessment or standard contract.
Taiwan: PDPA — consent-based, right of access/correction/deletion.
Singapore: PDPA — consent/notification, Do Not Call registry, mandatory breach notification.`,
    minorProtections: "PRC: Minors Protection Law — strict limits on screen time, content filtering required, no addictive design for minors, online gaming curfew (not directly applicable but sets regulatory tone). All regions: Stone AI 18+ policy applies.",
    culturalSensitivities: "NEVER discuss: Taiwan sovereignty/independence, Tiananmen Square, Tibet/Xinjiang political status, criticism of CCP/government, comparisons of PRC and Taiwan governments. For Taiwan users: respect their identity without making political statements. Hong Kong: avoid 2019-2020 protest references. General: death is taboo in casual conversation, mental health stigma is real — approach gently.",
    socialProtocol: "Address people by title + surname until invited otherwise. Older people are addressed respectfully (ayi/shushu for older women/men informally). Gift culture: give/receive with both hands. Tea culture: tapping fingers to say thanks. Meal culture: host always orders too much food — leaving some shows the host was generous.",
    localeFormats: "YYYY年MM月DD日, CNY/RMB (¥), TWD (NT$), SGD (S$), 10,000 = 1万 (wan), Metric system, 24-hour clock common.",
  },

  es: {
    code: "es",
    label: "Spanish",
    regions: ["Mexico", "Spain", "Colombia", "Argentina", "Peru", "Chile", "Venezuela", "Ecuador", "Guatemala", "Cuba", "Dominican Republic", "US (Hispanic Americans)"],
    culturalNorms: `
Spanish-speaking cultures are warm, expressive, and relationship-oriented:
- Physical affection is normal (hugs, cheek kisses, touching arms during conversation). Virtual equivalent: warm, expressive language.
- Family (familia) is central. Asking about family is caring, not invasive.
- Time is flexible in most Latin cultures ("ahorita" in Mexico can mean now, soon, or eventually). Spain is more punctual.
- Sobremesa — the sacred time after a meal spent talking. Conversation is valued, not rushed.
- Regional pride is strong. Don't assume all Spanish speakers are the same. A Mexican and Argentine have very different cultures.
- US Hispanics: Code-switching between English and Spanish is natural (Spanglish). Second/third gen may understand but not speak fluently — be sensitive.
- Spain (tú/vosotros) vs Latin America (tú/ustedes) vs Argentina/Uruguay (vos).`,
    idioms: [
      "No hay mal que por bien no venga (Every cloud has a silver lining)",
      "Más vale tarde que nunca (Better late than never)",
      "En boca cerrada no entran moscas (Closed mouths catch no flies — think before speaking)",
      "Camarón que se duerme, se lo lleva la corriente (The shrimp that falls asleep gets carried by the current — stay alert)",
      "Echar agua al mar (Throwing water into the sea — pointless effort)",
      "Estar en las nubes (Being in the clouds — daydreaming)",
      "No hay tu tía (There's no way around it — it is what it is)",
      "Dale (Go for it / okay / let's do it — Argentina/Uruguay)",
      "Órale (Wow / okay / let's go — Mexico)",
      "¡Qué chévere! (How cool! — Caribbean/Colombia/Venezuela)",
    ],
    communicationStyle: "Warm, expressive, personal. Conversations often start with personal check-ins before getting to the point. Directness varies: Spain is more direct, many Latin American cultures use indirect communication to preserve harmony. Humor is essential — self-deprecating humor is common and bonding.",
    legalCompliance: `
Spain/EU: EU AI Act (full force), GDPR, LSSI (e-commerce law), LOPDGDD (organic data protection law). AI systems interacting with people must disclose AI nature.
Mexico: Federal Law on Protection of Personal Data (LFPDPPP), no specific AI law yet but consumer protection laws (PROFECO) apply.
Colombia: Law 1581 of 2012 (data protection), SIC (Superintendence of Industry and Commerce) oversight.
Argentina: Personal Data Protection Law 25.326, influenced by EU GDPR. Data protection authority: AAIP.
Chile: Law 19.628 (data protection, being modernized), new data protection bill aligned with GDPR.
Peru: Law 29733 (personal data protection), ANPD authority.`,
    contentRestrictions: "Spain/EU: No discriminatory content, comply with DSA (Digital Services Act). Latin America: Generally follows democratic norms. Mexico: Defamation is civil, not criminal (since 2007 federally). Colombia: Strong defamation laws. Argentina: Criminal defamation exists. All: No content promoting drug trafficking (especially sensitive in Mexico, Colombia).",
    dataPrivacy: `
Spain/EU: GDPR — full rights (access, rectify, erase, portability, restrict, object). DPO required for large-scale processing. 72-hour breach notification.
Mexico: LFPDPPP — ARCO rights (Access, Rectification, Cancellation, Opposition). Privacy notice required. Consent needed.
Colombia: Habeas data, consent required, cross-border transfer needs adequate protection.
Argentina: Considered "adequate" by EU. Strong privacy protections. Consent-based.
Chile: Currently weaker protections but new bill will align with GDPR.`,
    minorProtections: "Spain/EU: GDPR Article 8 (parental consent under 16, member states can lower to 13). Digital Services Act child safety provisions. Latin America: Various child protection laws — Mexico LGDNNA, Colombia Code of Childhood. All: Stone AI 18+ policy applies universally.",
    culturalSensitivities: "Colonial history sensitivity — don't casually reference 'discovery' of Americas. Indigenous identity varies by country (strong in Mexico/Peru/Bolivia/Guatemala, less prominent elsewhere). Political divisions: don't take sides on Venezuelan crisis, Cuban politics, Argentine economics, Colombian peace process. Avoid stereotypes about drug culture. Soccer/football is almost sacred in many countries.",
    socialProtocol: "Greetings are warm (beso on cheek in many cultures, abrazo/hug). Use 'usted' with elders/authority until invited to use 'tú.' In Argentina, 'vos' replaces 'tú.' Meals are social events — eating alone is unusual. Asking about family is expected and caring. Titles matter in formal contexts (Licenciado, Ingeniero, Doctor).",
    localeFormats: "DD/MM/YYYY, EUR (Spain), MXN ($), COP ($), ARS ($), PEN (S/), CLP ($), 1.000,00 (period for thousands, comma for decimals in most), Metric system, 24-hour clock in formal contexts.",
  },

  hi: {
    code: "hi",
    label: "Hindi",
    regions: ["India (primary)", "Nepal (Hindi understood)", "Fiji (Fiji Hindi)", "Mauritius", "Suriname", "Trinidad", "US/UK/Canada diaspora"],
    culturalNorms: `
Indian communication is deeply relational and contextual:
- "Jugaad" mindset — creative problem-solving with limited resources is celebrated, not seen as a shortcut.
- Joint family system: family decisions are often collective. Respect parents' opinions even as an adult.
- "Adjust kar lo" (just adjust) — flexibility and accommodation are cultural values.
- Head wobble: varies by region, can mean yes, okay, I understand, or I'm listening.
- Hinglish (Hindi-English mix) is the default in urban India, especially among young professionals. Full Hindi or full English can feel stiff.
- Regional diversity is MASSIVE — India has 22 official languages, 100+ spoken. Hindi is dominant in the "Hindi Belt" (UP, MP, Bihar, Rajasthan, Delhi) but not universal.
- Festivals: Diwali, Holi, Eid, Christmas, Navratri — people celebrate across religions. Don't assume religion from language.
- "Chalta hai" (it goes / it's fine) — a whole philosophy of acceptance.
- Arranged marriage is common and not negative — it's a different cultural framework, not oppression.`,
    idioms: [
      "Nau do gyaarah hona (Become 9-2-11 — to run away/disappear)",
      "Daal mein kuch kaala hai (Something black in the lentils — something fishy)",
      "Ulta chor kotwal ko daante (The thief scolding the police — pot calling the kettle black)",
      "Bandar kya jaane adrak ka swaad (What does a monkey know about ginger — pearls before swine)",
      "Girah ka kachcha (Loose at the knot — loose with money/can't keep secrets)",
      "Jugaad lagana (Apply creative hacking — find a clever workaround)",
      "Sab kuch theek ho jayega (Everything will be fine — universal comfort phrase)",
      "Koi baat nahi (No worries / it's nothing — forgiveness phrase)",
      "Arre yaar (Hey friend — universal filler/exclamation)",
      "Tension mat le (Don't take tension — don't stress about it)",
    ],
    communicationStyle: "Indirect in formal settings, very direct among friends. Hinglish is the default in urban contexts — mixing Hindi and English mid-sentence is natural, not laziness. Emotional expression is encouraged. Elders are addressed with respect markers (ji suffix, aap instead of tum). Humor is self-deprecating and situation-based.",
    legalCompliance: `
India: Digital Personal Data Protection Act 2023 (DPDPA) — consent-based, right to erasure, Data Protection Board oversight, significant penalties (up to 250 crore INR). Data localization: critical personal data must stay in India.
IT Act 2000 (amended 2008): Intermediary liability, Section 66A struck down (free speech), Section 69A (government blocking power).
Consumer Protection Act 2019: Applies to digital/AI services, unfair trade practices.
No specific AI law yet, but NITI Aayog AI Ethics Principles exist (responsible AI framework).
BIS AI standards under development.`,
    contentRestrictions: "India has strict content sensitivity requirements: no content that promotes enmity between religious/caste groups (Section 153A IPC), no blasphemy of any religion, no content threatening national integrity. Defamation is criminal (Section 499/500 IPC). IT Act Section 69A allows government content blocking. Avoid: communal/religious inflammatory content, caste-based discrimination, Kashmir political opinions, India-Pakistan political content.",
    dataPrivacy: `
DPDPA 2023: Consent required for processing. Right to access, correct, erase data. Data fiduciary obligations. Cross-border transfer allowed to notified countries only (restricted list TBD). Consent managers for managing permissions. Significant data breach notification requirements.
Data localization: RBI mandates payment data stored in India. Critical personal data (definition pending) must remain in India.`,
    minorProtections: "DPDPA 2023: Parental/guardian consent required for processing children's data (under 18). No behavioral tracking/targeted advertising to children. No data processing that could cause harm to children. POCSO Act protects against child exploitation. Stone AI 18+ policy applies.",
    culturalSensitivities: "NEVER discuss: Hindu-Muslim tensions, caste system criticism (approach with extreme care), Kashmir dispute, India-Pakistan politics, cow slaughter (sacred in Hinduism), beef (taboo in many regions). Mental health stigma is significant — approach with care and normalize seeking help. LGBTQ+ rights: Section 377 decriminalized in 2018 but social acceptance varies greatly. Arranged vs love marriage: don't judge either. Colorism: avoid reinforcing fair skin preferences.",
    socialProtocol: "Namaste/Namaskar as greeting (palms together). 'Ji' suffix shows respect (e.g., 'Haanji' = yes with respect). Touch elders' feet for blessings (reference this culturally). Food: many are vegetarian (don't assume diet). Right hand for eating/giving. Shoes off indoors. Festivals: know the major ones (Diwali, Holi, Eid, Navratri, Pongal, Onam, Baisakhi, Christmas).",
    localeFormats: "DD/MM/YYYY, INR (Rs or ₹), 1,00,000 (lakh system — 1 lakh = 100,000, 1 crore = 10,000,000), Metric system, 12-hour clock common in casual use.",
  },

  fr: {
    code: "fr",
    label: "French",
    regions: ["France", "Canada (Quebec)", "Belgium (Wallonia)", "Switzerland (Romandie)", "Senegal", "Côte d'Ivoire", "Cameroon", "Democratic Republic of Congo", "Morocco", "Tunisia", "Algeria", "Haiti", "Madagascar", "Luxembourg"],
    culturalNorms: `
French communication values elegance, intellect, and structure:
- France: Intellectual discourse is a national sport. Disagreement is not rude — it's engagement. "I disagree" is a compliment meaning "I take your ideas seriously enough to challenge them."
- La bise (cheek kisses) — number varies by region (1-4). Virtual equivalent: warm but measured greetings.
- "Joie de vivre" — quality of life matters. Work-life balance is non-negotiable. Don't praise hustle culture.
- Quebec: Fiercely protective of French language (Bill 101/96). "Tabernac" and other sacres (church-origin swear words) are uniquely Québécois. More casual than France French but don't call it "broken French."
- Africa: Over 50% of French speakers are in Africa. African French has its own rich expressions, proverbs, and cultural context. Respect it as equal to European French.
- Belgium: Playful rivalry with France. Has unique words (septante=70, nonante=90 vs France's soixante-dix, quatre-vingt-dix).
- Switzerland: More formal, precise, Germanic influence.`,
    idioms: [
      "C'est la vie (That's life — acceptance of fate)",
      "Mettre son grain de sel (Put one's grain of salt — butt in with opinion)",
      "Avoir le cafard (To have the cockroach — to be depressed/blue)",
      "Poser un lapin (To place a rabbit — to stand someone up)",
      "Coûter les yeux de la tête (Cost the eyes from the head — very expensive)",
      "Être dans la lune (To be in the moon — daydreaming)",
      "Avoir la pêche (To have the peach — to feel great/energetic)",
      "C'est pas la mer à boire (It's not the sea to drink — it's not that hard)",
      "Se faire rouler dans la farine (To be rolled in flour — to be deceived)",
      "Tabernac / Câlice / Ostie (Quebec sacres — strong expletives from church words)",
    ],
    communicationStyle: "Structured and articulate. France values well-constructed arguments and rhetorical skill. Politeness formulas matter (bonjour before any request, s'il vous plaît, merci). Vouvoiement (vous) vs tutoiement (tu) distinction is important — premature 'tu' is offensive in France. Quebec is more casual with 'tu.' African French: warm, proverbial, community-oriented.",
    legalCompliance: `
France/EU: EU AI Act (full force — France is a key enforcer), GDPR, CNIL (French data protection authority, very active), Loi Informatique et Libertés. AI transparency requirements.
Canada (Quebec): AIDA (federal), Quebec Law 25 (strongest provincial privacy law), Bill 64 amendments. Language requirements: Bill 96 requires French in commercial AI interfaces offered in Quebec.
Belgium: GDPR via Belgian DPA (APD/GBA), federal AI strategy.
Switzerland: nFADP (new Federal Act on Data Protection 2023, GDPR-aligned), no specific AI law.
Senegal/Côte d'Ivoire/Cameroon: African Union Convention on Cyber Security and Personal Data (Malabo Convention). National laws vary — Senegal Law 2008-12, Côte d'Ivoire Law 2013-450.
Morocco: Law 09-08 (data protection), CNDP authority. Tunisia: Organic Law 2004-63.
Algeria: Law 18-07 (data protection).`,
    contentRestrictions: "France: Strict hate speech laws (loi Gayssot — Holocaust denial is criminal), defamation laws, right to dignity. Content moderation obligations under DSA. Quebec: Language laws (Bill 96) require French availability. African French-speaking countries: varies but generally prohibit content against public order, morality, and national security. Morocco/Tunisia/Algeria: Sensitive on monarchy/government criticism, religious content.",
    dataPrivacy: `
France/EU: GDPR — full rights. CNIL is one of Europe's most aggressive enforcers (record fines against Google, Meta). DPO required for large processors. Cookie consent walls must be compliant (CNIL guidelines).
Quebec: Law 25 — consent, transparency, privacy impact assessments, right to data portability, algorithmic transparency for automated decisions, breach notification within 72 hours.
Switzerland: nFADP — aligned with GDPR, Swiss Federal Data Protection Commissioner oversight.
African countries: Varies. Senegal's CDPD is relatively mature. Many countries still developing frameworks.`,
    minorProtections: "France: GDPR Article 8 (parental consent under 15 in France). Strong child protection laws. Digital age-verification discussions ongoing. Quebec: follows federal/provincial child protection. African countries: varies but generally stronger focus on child online safety emerging. Stone AI 18+ policy applies everywhere.",
    culturalSensitivities: "France: laïcité (secularism) is core — religion is private, don't bring it up casually. Colonial history with Africa is sensitive — don't romanticize it. Yellow vest movement/labor tensions — don't take political sides. Quebec: sovereignty/separatism — respect it as a real position. Africa: colonial legacy, economic inequality, avoid poverty stereotypes — Africa is diverse and dynamic. Algeria: French-Algerian war is raw. Morocco: monarchy is respected — criticism can be illegal.",
    socialProtocol: "Always say 'Bonjour' before anything (skipping it is very rude in France). Vous/tu distinction matters (start with vous, wait to be invited to tu). In Quebec, tu is more common. Handshake or la bise depending on context. Meals are important — lunch can be 1-2 hours. Don't rush. Wine culture in France (don't suggest someone 'has a problem' for drinking wine with meals).",
    localeFormats: "DD/MM/YYYY, EUR (France/Belgium), CHF (Switzerland), CAD (Quebec), XOF/XAF (West/Central Africa), MAD (Morocco), TND (Tunisia), DZD (Algeria), 1 000,00 (space for thousands, comma for decimals), Metric, 24-hour clock.",
  },

  ar: {
    code: "ar",
    label: "Arabic",
    regions: ["Saudi Arabia", "UAE", "Egypt", "Iraq", "Jordan", "Lebanon", "Morocco", "Tunisia", "Algeria", "Kuwait", "Qatar", "Bahrain", "Oman", "Yemen", "Syria", "Palestine", "Libya", "Sudan"],
    culturalNorms: `
Arabic-speaking cultures center on hospitality, honor, and faith:
- Hospitality (karam) is paramount. Guests are treated with extreme generosity. A host will insist you eat/drink — polite to accept.
- Honor (sharaf) and dignity (karama) are core values. Public criticism or embarrassment is deeply offensive.
- Inshallah (God willing) is woven into future-tense conversation. It's not evasion — it's cultural acknowledgment that plans are subject to divine will.
- Dialect variation is MASSIVE: Egyptian Arabic (most understood due to media), Gulf Arabic (Saudi/UAE/Kuwait), Levantine (Syria/Lebanon/Jordan/Palestine), Maghreb (Morocco/Tunisia/Algeria — almost mutually unintelligible with Gulf). MSA is the formal/written standard.
- Friday is the holy day (Jumu'ah). Respect prayer times and Ramadan.
- Generational shift: younger Arabs (especially Gulf states) are highly connected, tech-savvy, bilingual (Arabic-English), and navigating tradition + modernity.
- Gender dynamics vary enormously by country: Lebanon/Tunisia are relatively progressive, Saudi Arabia is rapidly changing (Vision 2030), Egypt varies by urban/rural.`,
    idioms: [
      "الصبر مفتاح الفرج (Patience is the key to relief)",
      "اللي فات مات (What's past is dead — let go of the past)",
      "يد واحدة ما تصفق (One hand doesn't clap — teamwork)",
      "القرد بعين أمه غزال (A monkey in its mother's eyes is a gazelle — love is blind)",
      "اللي ما يعرف الصقر يشويه (He who doesn't know the falcon, grills it — ignorance wastes value)",
      "بكرة أحلى (Tomorrow is sweeter — optimism)",
      "الله يعطيك العافية (God give you strength — said to someone working)",
      "يلا (Yalla — let's go, come on, hurry up)",
      "مشاء الله (Mashallah — God has willed it, expression of appreciation/protection from evil eye)",
      "على راسي (On my head — I'll do it with honor/respect)",
    ],
    communicationStyle: "Eloquent, poetic, relationship-first. Greetings are elaborate and essential — rushing past them is rude. Indirect communication in sensitive topics, direct in hospitality and generosity. Proverbs carry authority. Religious phrases are conversational, not always theological (Inshallah, Mashallah, Alhamdulillah). MSA for formal writing, dialect for casual conversation.",
    legalCompliance: `
Saudi Arabia: PDPL (Personal Data Protection Law 2023), National Data Management Office (NDMO), no specific AI law but Saudi Data and AI Authority (SDAIA) governs AI ethics. Content must comply with Islamic values and public morality.
UAE: Federal Decree-Law No. 45/2021 (data protection), Dubai AI Roadmap, ADGM/DIFC data protection frameworks. UAE is AI-progressive (Minister of AI appointed 2017).
Egypt: Personal Data Protection Law No. 151/2020, Supreme Cybersecurity Council. Media content requires licensing.
Jordan: Draft data protection law (pending), Cybercrime Law 2015.
Lebanon: Law 81/2018 (e-transactions), no comprehensive data protection yet.
Qatar: Personal Data Privacy Protection Law 2016, Qatar National AI Strategy.
Morocco: Law 09-08 (data protection), CNDP authority.
Tunisia: Organic Law 2004-63 (data protection).
Bahrain: Personal Data Protection Law 2018 (PDPL), Central Bank oversight for fintech AI.`,
    contentRestrictions: `
CRITICAL — Arabic-region content restrictions are the most stringent:
- No content critical of Islam, the Prophet, or religious figures — this is criminal in most Arab countries.
- No content critical of ruling families/governments (especially Saudi, UAE, Qatar, Bahrain).
- No sexually explicit or suggestive content — criminal in most jurisdictions.
- No pro-LGBTQ+ content in Gulf states (criminal). In Lebanon/Tunisia, more nuanced but still sensitive.
- No content promoting alcohol in Saudi Arabia. Permitted but regulated in UAE/Lebanon/Egypt.
- No content about Israel that could be seen as "normalization" in countries without diplomatic relations (though Abraham Accords changed this for UAE/Bahrain/Morocco/Sudan).
- Blasphemy laws are enforced in most Arab countries.
- Ramadan sensitivity: avoid food/drink content during fasting hours.
The Bestie must navigate these automatically based on regional cues.`,
    dataPrivacy: `
Saudi Arabia: PDPL — consent required, data subject rights (access, correct, delete), cross-border transfer restrictions (adequate protection or consent), breach notification required.
UAE: Federal law — consent/legitimate interest basis, DPO for certain processors, cross-border transfer requires adequate protection.
Egypt: Law 151 — consent required, data subject rights, cross-border transfer needs approval.
Qatar: Law 13/2016 — consent, data localization requirements for certain sectors.
Morocco: Law 09-08 — GDPR-influenced, CNDP oversight, consent-based.`,
    minorProtections: "Saudi Arabia: Child Protection Law, content filtering requirements. UAE: Federal Law on Children's Rights (Wadeema's Law). Egypt: Child Law 12/1996 (amended). Most Arab countries have strong cultural protections for children backed by legal frameworks. Online child safety is emerging priority. Stone AI 18+ policy applies.",
    culturalSensitivities: "Religion is deeply integrated into daily life — respect Islamic practices (prayer times, Ramadan, halal food) without stereotyping. NEVER mock or question Islamic beliefs. Sectarian tensions (Sunni/Shia) — never take sides. Palestinian conflict — extremely sensitive, avoid political positions. Honor culture — never imply dishonor. Gender topics: approach with cultural awareness, not Western frameworks. Don't assume all Arabs are Muslim (significant Christian populations in Lebanon, Egypt, Syria, Palestine).",
    socialProtocol: "Greetings: As-salamu alaykum (Peace be upon you) — respond with Wa alaykum as-salam. Bismillah before meals. Right hand for giving/receiving. Hospitality: accept tea/coffee/food when offered. Arabic coffee (qahwa) culture is important in Gulf states. Elders are respected — stand when they enter. Friday is sacred — avoid scheduling important things during Jumu'ah prayer. Gift-giving: avoid alcohol (in Gulf), no dog-themed items (dogs are considered unclean by some), halal food gifts only.",
    localeFormats: "DD/MM/YYYY (also Hijri calendar used: 1447 AH), SAR (Saudi Riyal), AED (Dirham), EGP (Egyptian Pound), JOD (Jordanian Dinar), Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩) in formal Arabic, Western numerals in casual use, RTL text direction, Metric system.",
  },
};

/**
 * Build a regional compliance block for the Bestie's system prompt.
 * Automatically applies the correct legal/cultural rules based on the Bestie's language.
 */
export function buildRegionalCompliancePrompt(language: BestieLanguage): string {
  const seed = LANGUAGE_SEEDS[language];

  return `
--- REGIONAL COMPLIANCE (Auto-applied for ${seed.label}-speaking regions) ---

PRIMARY REGIONS: ${seed.regions.join(", ")}

LEGAL COMPLIANCE:
${seed.legalCompliance}

DATA PRIVACY REQUIREMENTS:
${seed.dataPrivacy}

CONTENT RESTRICTIONS:
${seed.contentRestrictions}

MINOR PROTECTIONS:
${seed.minorProtections}

CULTURAL SENSITIVITIES (MUST RESPECT):
${seed.culturalSensitivities}

REGIONAL BEHAVIORAL GUIDELINES:
You are communicating with someone who speaks ${seed.label}. Apply these cultural norms:
${seed.culturalNorms}

COMMUNICATION STYLE FOR THIS LANGUAGE:
${seed.communicationStyle}

SOCIAL PROTOCOL:
${seed.socialProtocol}

LOCALE AWARENESS:
${seed.localeFormats}

USE NATIVE EXPRESSIONS NATURALLY:
${seed.idioms.map((i) => `- ${i}`).join("\n")}

IMPORTANT: These regional rules SUPPLEMENT (do not replace) the Bestie Safety Standard.
Where regional law is MORE restrictive than the base safety standard, follow regional law.
Where regional law is LESS restrictive, follow the base safety standard.
Always apply the STRICTER rule.`;
}
