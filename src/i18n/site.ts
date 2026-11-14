/** Site copy (everything outside the game itself), in French and English. */
import { GAME_STRINGS, type Lang } from './game';
import type { RouteKey } from './routes';

export interface Faq {
  q: string;
  a: string;
}

export interface SiteStrings {
  locale: string;
  langName: string;
  meta: Record<RouteKey, { title: string; description: string }>;
  nav: {
    skip: string; home: string; play: string; characters: string; main: string;
    switchTo: string; switchLabel: string;
  };
  footer: {
    pages: string; legal: string; elsewhere: string; source: string; author: string; a11yStatus: string;
    disclaimer: string; madeBy: string; license: string; top: string;
  };
  labels: Record<RouteKey, string>;
  home: {
    kicker: string; title: string; lead: string; cta: string; secondary: string; perks: string[];
    campsTitle: string; campsLead: string; trump: string; rosterLabel: string;
    howTitle: string; steps: { title: string; text: string }[];
    castTitle: string; castLead: string; castCta: string;
    faqTitle: string; faq: Faq[];
    satireTitle: string; satire: string;
    finalTitle: string; finalText: string;
  };
  play: {
    title: string; lead: string; controlsTitle: string; mouseTitle: string; mouse: string[];
    keyboardTitle: string; keys: [string, string][]; rulesTitle: string; rules: string[]; noscript: string;
  };
  characters: {
    title: string; lead: string; cost: string; credibility: string; recharge: string; role: string; seconds: string;
    trump: string; boss: string; from: string; reinforcementsTitle: string; reinforcementsLead: string; guestTitle: string; guestLead: string;
    extrasTitle: string; extrasLead: string; extras: Record<string, string>; cta: string;
  };
  legalLayout: {
    updated: string; contactTitle: string; contactText: string; contactCta: string;
    creditsTitle: string; creditsLead: string; person: string; face: string; author: string; licence: string; faces: Record<string, string>;
  };
  notFound: { title: string; text: string; cta: string };
}

const fr: SiteStrings = {
  locale: 'fr_FR',
  langName: 'Français',
  meta: {
    home: {
      title: 'Politique 2027 — Le jeu satirique de la présidentielle',
      description:
        "Choisis ton camp et repousse les foules, les memes et les boss de la présidentielle. Jeu de défense satirique gratuit, sans inscription, dans le navigateur",
    },
    play: {
      title: 'Jouer à Politique 2027 — Gratuit, dans le navigateur',
      description:
        'Lance une partie : choisis ton camp parmi quatre, déploie tes figures et repousse les trois autres. Clavier, souris ou tactile',
    },
    characters: {
      title: 'Les personnages et leurs pouvoirs — Politique 2027',
      description:
        "Macron, Mélenchon, Le Pen, Hollande, Riner, Lassalle… Découvre les 24 personnalités jouables, leurs répliques cultes, leurs pouvoirs de boss et l'atout de chaque camp",
    },
    legal: { title: 'Mentions légales — Politique 2027', description: 'Éditeur, hébergement, propriété intellectuelle et cadre satirique du jeu Politique 2027' },
    privacy: { title: 'Politique de confidentialité — Politique 2027', description: 'Aucun compte, aucun cookie, aucun traceur : ce que Politique 2027 stocke (dans ton navigateur) et ce qui transite par le serveur' },
    terms: { title: "Conditions d'utilisation — Politique 2027", description: "Règles d'usage du jeu Politique 2027 : accès gratuit, caractère satirique, usage acceptable et droit applicable" },
    accessibility: { title: "Déclaration d'accessibilité — Politique 2027", description: "État de conformité RGAA et WCAG de Politique 2027, tests réalisés, limites connues et contact" },
  },
  nav: {
    skip: 'Aller au contenu',
    home: 'Accueil',
    play: 'Jouer',
    characters: 'Personnages',
    main: 'Navigation principale',
    switchTo: 'English',
    switchLabel: 'Read this page in English',
  },
  footer: {
    pages: 'Pages',
    legal: 'Légal',
    elsewhere: 'Ailleurs',
    source: 'Code source (GitHub)',
    author: "Le site de l'auteur",
    a11yStatus: 'partiellement conforme',
    disclaimer:
      "Politique 2027 est une œuvre de satire. Les personnages sont des caricatures ; leurs pouvoirs sont inventés pour rire. Aucun lien avec un parti, un candidat ou une institution",
    madeBy: 'Fait main par',
    license: 'Code sous licence MIT',
    top: 'Remonter',
  },
  labels: {
    home: 'Accueil',
    play: 'Jouer',
    characters: 'Personnages',
    legal: 'Mentions légales',
    privacy: 'Confidentialité',
    terms: 'Conditions',
    accessibility: 'Accessibilité',
  },
  home: {
    kicker: 'Présidentielle 2027 · Jeu satirique gratuit',
    title: 'Politique 2027',
    lead: "Gauche, Centre, Droite ou les Autres : choisis ton camp, pose tes figures et défends ce que la foule veut emporter (subventions, portables confisqués, caddies, urnes…) jusqu'au soir du second tour. À la fin, les têtes d'affiche adverses débarquent en boss",
    cta: 'Jouer maintenant',
    secondary: 'Voir le casting',
    perks: ['Gratuit', 'Sans inscription', 'Sans pub ni traceur', 'Clavier, souris ou tactile'],
    campsTitle: 'Quatre camps, zéro consensus',
    campsLead: 'Chaque camp a ses six figures, ses répliques, sa façon de jouer et un atout de campagne à déclencher au bon moment',
    trump: 'Atout de campagne',
    rosterLabel: 'Figures',
    howTitle: 'Comment on joue',
    steps: [
      { title: 'Choisis ton camp', text: 'La Gauche, le Centre, la Droite ou les Autres. Les trois camps restants deviennent tes adversaires' },
      { title: 'Récolte des bulletins', text: "Les bulletins de vote paient tout. Pose d'abord une figure qui en rapporte, le reste suivra" },
      { title: 'Défends l’objectif', text: "Chaque soirée a son thème : agriculteurs au Salon, lycéens en blocus, manif contre la vie chère… La foule veut emporter ce qui est au bout des couloirs : ne la laisse pas passer" },
      { title: 'Bats les boss', text: "Le Pen qui se pourvoit en cassation, Macron qui traverse la rue, Mélenchon en hologramme, Riner et son ippon, Trump, Xavier Niel… Neuf soirées jusqu'au second tour, puis la Cohabitation, sans fin" },
    ],
    castTitle: "Les têtes d'affiche",
    castLead: 'Chacun a son pouvoir et ses répliques, tirés de ses petites phrases les plus célèbres',
    castCta: 'Voir tous les personnages',
    faqTitle: 'Questions fréquentes',
    faq: [
      { q: "C'est quoi, Politique 2027 ?", a: "Un jeu de défense en couloirs (tower defense) gratuit, jouable dans le navigateur, qui parodie la course à l'élection présidentielle française de 2027. Tu choisis la Gauche, le Centre, la Droite ou les Autres, puis tu places des caricatures de personnalités publiques pour repousser les trois autres camps" },
      { q: 'Le jeu est-il gratuit ?', a: 'Oui : gratuit, sans inscription, sans publicité et sans achat intégré. Le code source est ouvert, sous licence MIT' },
      { q: 'Le jeu prend-il parti ?', a: "Non. C'est une satire : tous les camps sont caricaturés avec le même traitement et les quatre sont jouables. Le jeu n'est affilié à aucun parti, candidat ou institution, et ne constitue ni un sondage ni un appel au vote" },
      { q: 'Quels personnages peut-on jouer ?', a: 'Vingt-quatre personnalités en quatre camps. À gauche : Raphaël Glucksmann, François Hollande, Ségolène Royal, François Ruffin, Jean-Luc Mélenchon et Sandrine Rousseau. Au centre : François Bayrou, Gabriel Attal, Édouard Philippe, Élisabeth Borne, Emmanuel Macron et Gérald Darmanin. À droite : Nicolas Sarkozy, Jordan Bardella, Bruno Retailleau, Éric Zemmour, Marine Le Pen et Éric Ciotti. Chez les Autres : Brigitte Macron, Dominique de Villepin, Jean Lassalle, Philippe Poutou, Teddy Riner et Florian Philippot. La tête d’affiche de chaque camp (Mélenchon, Macron, Le Pen, Riner) débarque contre toi en boss avec ses pouvoirs. À partir de la 6ᵉ soirée, tu composes ton équipe de huit cartes et tu peux débaucher jusqu’à deux transfuges des autres camps. S’y ajoutent sept renforts communs à tous, débloqués au fil de la campagne (les CRS, les pompiers, le radar automatique, le SAMU, la boulangère, les profs et le Conseil constitutionnel), et cinq invités : Xavier Niel au blocus du lycée, HugoDécrypte à la manif contre la vie chère, Élise Lucet sur le plateau du débat, Donald Trump au sommet international et Squeezie au premier tour (face à la Droite)' },
      { q: "Le jeu suit-il l'actualité ?", a: "Oui, c’est même le principe. Une soirée reprend la mobilisation du 17 octobre 2026 contre la vie chère (gilets jaunes, lycéens, syndicats), une autre le blocus d’un lycée et ses portables confisqués, une autre le Salon de l’Agriculture. On y croise aussi les memes de la vie politique : le pourvoi en cassation de Marine Le Pen (condamnée en appel en juillet 2026), le « Je traverse la rue » et la dissolution d’Emmanuel Macron, l’hologramme de Jean-Luc Mélenchon, le « 1v1 » de Xavier Niel devant un Lidl. Le reste (essence à 2 €, impôts à la source, taxe Zucman, droits de douane, info en continu) est traité de manière générique, sans viser de personne en particulier" },
      { q: 'Peut-on jouer à deux ?', a: "Oui, de deux façons. En face-à-face sur le même écran : l'un défend à la souris ou au doigt, l'autre envoie les adversaires au clavier ou avec les boutons de droite, pendant trois minutes. Ou en duel chacun son tour : la même partie pour les deux, sur le même appareil ou en s'envoyant un lien, et le meilleur score l'emporte. Il y a aussi un défi du jour, identique pour tout le monde" },
      { q: 'Les répliques sont-elles de vraies citations ?', a: "Certaines, oui : « De la poudre de perlimpinpin », « Je traverse la rue, je vous trouve du travail », « La République, c'est moi ! » ou « Moi président » sont des formules publiques devenues cultes, tout comme le « Je t’attends !! T’es où ?! » de Xavier Niel. Les autres répliques des responsables politiques sont inventées dans l'esprit du personnage. Aucune n'a valeur de citation documentaire" },
      { q: 'Est-ce que ça marche sur mobile ?', a: "Oui, sur téléphone et tablette comme sur ordinateur. Sur téléphone, la partie se joue en paysage, en plein écran quand le navigateur le permet : si tu tiens ton téléphone droit, le jeu s'affiche tourné pour que tu le retournes. Ce réglage se désactive dans le menu pause. Un navigateur récent suffit, il n'y a rien à installer" },
      { q: "Peut-on jouer au clavier ou avec un lecteur d'écran ?", a: "Oui. Toutes les actions passent par de vrais boutons : touches 1 à 8 pour choisir une figure, flèches pour viser, Entrée pour placer. Les événements de la partie sont annoncés aux lecteurs d'écran et les animations respectent le réglage « réduire les animations »" },
      { q: 'Mes données sont-elles collectées ?', a: "Non. Pas de compte, pas de cookie, pas de traceur, pas de mesure d'audience. Ta progression reste dans ton navigateur (stockage local) et n'est jamais envoyée" },
      { q: 'Qui a fait ce jeu ?', a: 'Maxence Bonnici, développeur full stack. Politique 2027 est un projet personnel et open source' },
    ],
    satireTitle: 'Une satire, pas un programme',
    satire:
      "Les personnages sont des caricatures de personnalités publiques : de vraies photos de leur tête (sous licence libre, créditées dans les mentions légales) montées sur des corps dessinés. Leurs pouvoirs et les situations sont inventés pour rire : ils ne décrivent pas des faits et ne reflètent pas les opinions de l'auteur. Le jeu n'est lié à aucun parti, candidat ou institution",
    finalTitle: 'Les subventions ne vont pas se défendre toutes seules',
    finalText: 'Une partie dure trois à sept minutes. La première est la plus facile',
  },
  play: {
    title: 'Jouer à Politique 2027',
    lead: 'Choisis ton camp, puis une soirée de campagne. La partie se joue à la souris, au doigt ou au clavier',
    controlsTitle: 'Commandes',
    mouseTitle: 'Souris et tactile',
    mouse: [
      'Clique une figure dans la barre, puis une case du terrain pour la placer',
      'Le bouton Retirer enlève une figure du terrain et rembourse 25 % de son coût : le terrain se grise, touche la figure à retirer',
      "L'atout de campagne se déclenche d'un clic dès qu'il est chargé",
      'Sur téléphone, la partie se joue en paysage : cartes à gauche, terrain à droite. Le menu pause permet de libérer l’orientation',
      'Appui long sur une carte : sa fiche complète, sans lancer la figure',
    ],
    keyboardTitle: 'Clavier',
    keys: [
      ['1 à 8', 'Choisir une figure'],
      ['Flèches', 'Se déplacer sur le terrain'],
      ['Entrée ou Espace', 'Placer la figure'],
      ['R', 'Retirer une figure'],
      ['U', 'Atout de campagne'],
      ['P ou Échap', 'Pause'],
      ['S', 'Résumé du terrain (lecteur d’écran)'],
      ['F', 'Vitesse : normale, rapide, lente'],
      ['M', 'Couper ou remettre le son'],
    ],
    rulesTitle: 'Les règles en bref',
    rules: [
      'Les bulletins de vote servent à placer des figures. Tu en reçois un peu tout seul, beaucoup plus avec une figure de type « Votes »',
      "Au bout des couloirs, il y a ce que la foule veut (cinq morceaux, un par rangée). Chaque adversaire qui passe en emporte un : quand il n'y a plus rien, c'est perdu",
      'Tiens toutes les vagues pour gagner la soirée et débloquer la suivante, avec une nouvelle figure',
      'Chaque carte affiche son type : Votes (rapporte des bulletins), Attaque, Effet (ralentit, fige, repousse) ou Défense',
      'Les impôts prélèvent des bulletins tant que le contrôleur est sur le terrain ; des procurations arrivent de temps en temps… quand le dossier est complet',
      "Les boss annoncent leurs attaques : point d'exclamation rouge, tête énervée, cases qui clignotent. Tu as une seconde pour réagir",
      'À partir du « Blocus du lycée », tous les camps peuvent appeler les CRS et les pompiers en renfort, puis un nouveau renfort à chaque soirée dès la 5ᵉ',
      'Pose une figure sur la même figure pour la faire monter de niveau, jusqu’au niveau 3 : plus de crédibilité, plus forte, plus rapide, dorée puis en feu. Chaque niveau coûte plus cher que la carte',
      'À partir de la 6ᵉ soirée, tu composes ton équipe de huit cartes avant de jouer, transfuges compris',
      'Les raccourcis clavier ne fonctionnent que lorsque le focus est dans le jeu',
    ],
    noscript: 'Le jeu a besoin de JavaScript pour fonctionner. Le reste du site se lit sans',
  },
  characters: {
    title: 'Les personnages',
    lead: "Vingt-quatre personnalités, quatre camps, un seul fauteuil. Chaque figure se joue dans son camp… et te marche dessus quand tu joues contre lui : les têtes d'affiche deviennent alors des boss",
    cost: 'Coût',
    credibility: 'Crédibilité',
    recharge: 'Recharge',
    role: 'Rôle',
    seconds: 's',
    trump: 'Atout de campagne',
    boss: 'Boss',
    from: 'dès « {night} »',
    reinforcementsTitle: 'Les renforts',
    reinforcementsLead: 'Ni de gauche, ni de droite : tous les camps peuvent les appeler, les CRS et les pompiers dès le « Blocus du lycée », puis un de plus à chaque soirée',
    guestTitle: 'Les invités',
    guestLead: "Ils n'appartiennent à aucun camp, mais ils s'invitent dans la campagne : un président étranger, le patron de Free, un décrypteur de l'actu, une journaliste d'enquête et un youtubeur",
    extrasTitle: 'Les figurants',
    extrasLead: "Ils n'ont pas de nom, mais ils sont nombreux : chacun a une seule tenue, quel que soit le camp qui l'envoie",
    extras: GAME_STRINGS.fr.about,
    cta: 'Essayer en partie',
  },
  legalLayout: {
    updated: 'Dernière mise à jour',
    contactTitle: 'Une question ?',
    contactText: "Pour toute demande (droit de réponse, retrait, accessibilité, données), écris à l'auteur via le formulaire de son site.",
    contactCta: "Contacter l'auteur",
    creditsTitle: 'Crédits photographiques',
    creditsLead: 'Photos publiées sur Wikimedia Commons, recadrées et détourées pour le jeu. Chaque lien mène à la page de la photo d’origine, avec sa licence complète.',
    person: 'Personnalité',
    face: 'Expression',
    author: 'Auteur',
    licence: 'Licence',
    faces: { neutral: 'souriante', angry: 'énervée', hurt: 'en difficulté' },
  },
  notFound: {
    title: "Ce bureau de vote n'existe pas",
    text: 'La page demandée est introuvable. Elle a peut-être été dissoute',
    cta: "Retour à l'accueil",
  },
};

const en: SiteStrings = {
  locale: 'en_GB',
  langName: 'English',
  meta: {
    home: {
      title: 'Politique 2027 — The satirical French election game',
      description:
        'Pick your camp and push back the crowds, the memes and the bosses of the 2027 French presidential race. A free satirical lane-defense game, no sign-up, in your browser',
    },
    play: {
      title: 'Play Politique 2027 — Free, in your browser',
      description:
        'Start a match: pick one of four camps, field your figures and push back the three others. Keyboard, mouse or touch',
    },
    characters: {
      title: 'The characters and their powers — Politique 2027',
      description:
        "Macron, Mélenchon, Le Pen, Hollande, Riner, Lassalle… Meet the 24 playable public figures, their catchphrases, their boss powers and each camp's trump card",
    },
    legal: { title: 'Legal notice — Politique 2027', description: 'Publisher, hosting, intellectual property and satirical framework of the game Politique 2027' },
    privacy: { title: 'Privacy policy — Politique 2027', description: 'No account, no cookie, no tracker: what Politique 2027 stores (in your browser) and what passes through the server' },
    terms: { title: 'Terms of use — Politique 2027', description: 'Rules for using Politique 2027: free access, satirical nature, acceptable use and governing law' },
    accessibility: { title: 'Accessibility statement — Politique 2027', description: 'RGAA and WCAG conformance status of Politique 2027, tests carried out, known limits and contact' },
  },
  nav: {
    skip: 'Skip to content',
    home: 'Home',
    play: 'Play',
    characters: 'Characters',
    main: 'Main navigation',
    switchTo: 'Français',
    switchLabel: 'Lire cette page en français',
  },
  footer: {
    pages: 'Pages',
    legal: 'Legal',
    elsewhere: 'Elsewhere',
    source: 'Source code (GitHub)',
    author: "The author's website",
    a11yStatus: 'partially compliant',
    disclaimer:
      'Politique 2027 is a work of satire. The characters are caricatures; their powers are made up for laughs. It is not affiliated with any party, candidate or institution',
    madeBy: 'Handmade by',
    license: 'Code under the MIT licence',
    top: 'Back to top',
  },
  labels: {
    home: 'Home',
    play: 'Play',
    characters: 'Characters',
    legal: 'Legal notice',
    privacy: 'Privacy',
    terms: 'Terms',
    accessibility: 'Accessibility',
  },
  home: {
    kicker: '2027 French presidential race · Free satirical game',
    title: 'Politique 2027',
    lead: 'Left, Centre, Right or the Others: pick your camp, field your figures and defend what the crowd wants to carry off (farm subsidies, confiscated phones, trolleys, ballot boxes…) until the night of the run-off. At the end, the rival headliners turn up as bosses',
    cta: 'Play now',
    secondary: 'Meet the cast',
    perks: ['Free', 'No sign-up', 'No ads, no trackers', 'Keyboard, mouse or touch'],
    campsTitle: 'Four camps, zero consensus',
    campsLead: 'Each camp has its six figures, its catchphrases, its own way of playing and a campaign trump card to fire at the right moment',
    trump: 'Campaign trump card',
    rosterLabel: 'Figures',
    howTitle: 'How to play',
    steps: [
      { title: 'Pick your camp', text: 'The Left, the Centre, the Right or the Others. The three remaining camps become your opponents' },
      { title: 'Collect votes', text: 'Ballots pay for everything. Place a figure that brings them in first, the rest will follow' },
      { title: 'Defend the goal', text: 'Every night has a theme: farmers at the Agricultural Show, pupils on a blockade, a march against the cost of living… The crowd wants to carry off what stands at the end of the lanes: do not let it through' },
      { title: 'Beat the bosses', text: 'Le Pen appealing to the Court of Cassation, Macron crossing the street, Mélenchon as a hologram, Riner and his ippon, Trump, Xavier Niel… Nine nights up to the run-off, then Cohabitation, endlessly' },
    ],
    castTitle: 'The headliners',
    castLead: 'Each has a power and catchphrases drawn from their best-known lines',
    castCta: 'See every character',
    faqTitle: 'Frequently asked questions',
    faq: [
      { q: 'What is Politique 2027?', a: 'A free lane-defense (tower defense) game that runs in your browser and parodies the race for the 2027 French presidential election. You pick the Left, the Centre, the Right or the Others, then place caricatures of public figures to push back the three other camps' },
      { q: 'Is the game free?', a: 'Yes: free, with no sign-up, no ads and no in-app purchases. The source code is open, under the MIT licence' },
      { q: 'Does the game take sides?', a: 'No. It is satire: every camp gets the same treatment and all four are playable. The game is not affiliated with any party, candidate or institution, and is neither a poll nor a call to vote' },
      { q: 'Which characters can you play?', a: 'Twenty-four public figures in four camps. Left: Raphaël Glucksmann, François Hollande, Ségolène Royal, François Ruffin, Jean-Luc Mélenchon and Sandrine Rousseau. Centre: François Bayrou, Gabriel Attal, Édouard Philippe, Élisabeth Borne, Emmanuel Macron and Gérald Darmanin. Right: Nicolas Sarkozy, Jordan Bardella, Bruno Retailleau, Éric Zemmour, Marine Le Pen and Éric Ciotti. The Others: Brigitte Macron, Dominique de Villepin, Jean Lassalle, Philippe Poutou, Teddy Riner and Florian Philippot. Each camp\'s headliner (Mélenchon, Macron, Le Pen, Riner) turns up against you as a boss with its powers. From night 6 you pick a deck of eight cards and may poach up to two turncoats from the other camps. Add seven reinforcements shared by everyone, unlocked along the campaign (riot police, firefighters, the speed camera, paramedics, the baker, the teachers and the Constitutional Council), and five guests: Xavier Niel at the school blockade, HugoDécrypte at the march against the cost of living, Élise Lucet on the debate set, Donald Trump at the international summit and Squeezie in the first round (against the Right)' },
      { q: 'Does the game follow the news?', a: 'Yes, that is the whole idea. One night revisits the 17 October 2026 protests against the cost of living (yellow vests, pupils, unions), another a school blockade and its confiscated phones, another the Agricultural Show. French political memes turn up too: Marine Le Pen\'s appeal to the Court of Cassation (convicted on appeal in July 2026), Emmanuel Macron\'s "I cross the street" and his dissolution, Jean-Luc Mélenchon\'s hologram, Xavier Niel\'s "1v1" outside a Lidl. The rest (petrol at €2, taxes withheld at source, the Zucman tax, tariffs, rolling news) is generic and targets nobody in particular' },
      { q: 'Can two people play?', a: 'Yes, in two ways. Head to head on one screen: one defends with the mouse or a finger, the other sends opponents with the keyboard or the buttons on the right, for three minutes. Or a turn-based duel: the same match for both, on one device or by sending a link, and the best score wins. There is also a daily challenge, the same for everybody' },
      { q: 'Are the catchphrases real quotes?', a: 'Some are: "Poudre de perlimpinpin", "Je traverse la rue, je vous trouve du travail", "La République, c\'est moi !" or "Moi président" are public lines that became cult classics in France, as is Xavier Niel\'s "Je t\'attends !! T\'es où ?!". The other lines of the politicians are made up in the spirit of the character. None is offered as a documentary quotation' },
      { q: 'Does it work on mobile?', a: 'Yes, on phones and tablets as well as on desktop. On a phone the match is played in landscape, fullscreen where the browser allows it: if you hold the phone upright, the game is drawn sideways so that you turn it. This can be switched off in the pause menu. A recent browser is all you need; there is nothing to install' },
      { q: 'Can you play with a keyboard or a screen reader?', a: 'Yes. Every action goes through real buttons: keys 1 to 8 to pick a figure, arrows to aim, Enter to place. Match events are announced to screen readers and animations respect the "reduce motion" setting' },
      { q: 'Is my data collected?', a: 'No. No account, no cookie, no tracker, no analytics. Your progress stays in your browser (local storage) and is never sent anywhere' },
      { q: 'Who made this game?', a: 'Maxence Bonnici, a full-stack developer. Politique 2027 is a personal, open-source project' },
    ],
    satireTitle: 'Satire, not a manifesto',
    satire:
      "The characters are caricatures of public figures: real photos of their heads (freely licensed, credited in the legal notice) on drawn bodies. Their powers and the situations are made up for laughs: they do not describe facts and do not reflect the author's opinions. The game has no link with any party, candidate or institution",
    finalTitle: 'The farm subsidies will not defend themselves',
    finalText: 'A match lasts three to seven minutes. The first one is the easiest',
  },
  play: {
    title: 'Play Politique 2027',
    lead: 'Pick your camp, then a campaign night. Play with a mouse, a finger or a keyboard',
    controlsTitle: 'Controls',
    mouseTitle: 'Mouse and touch',
    mouse: [
      'Click a figure in the bar, then a square of the field to place it',
      'The Remove button takes a figure off the field and refunds 25% of its cost: the field greys out, tap the figure to remove',
      'The campaign trump card fires with one click as soon as it is charged',
      'On a phone the match is played in landscape: cards on the left, field on the right. The pause menu can release the orientation',
      'Long-press a card for its full description, without placing it',
    ],
    keyboardTitle: 'Keyboard',
    keys: [
      ['1 to 8', 'Pick a figure'],
      ['Arrows', 'Move around the field'],
      ['Enter or Space', 'Place the figure'],
      ['R', 'Remove a figure'],
      ['U', 'Campaign trump card'],
      ['P or Esc', 'Pause'],
      ['S', 'Board summary (screen reader)'],
      ['F', 'Speed: normal, fast, slow'],
      ['M', 'Mute or unmute'],
    ],
    rulesTitle: 'The rules in short',
    rules: [
      'Ballots pay for figures. You get a trickle on your own, and far more with a "Votes" figure',
      'At the end of the lanes stands what the crowd is after (five pieces, one per row). Every opponent who gets through carries one off: when nothing is left, you lose',
      'Hold every wave to win the night and unlock the next one, along with a new figure',
      'Every card shows its type: Votes (brings in ballots), Attack, Effect (slows, freezes, pushes back) or Defence',
      'The tax office withholds ballots for as long as its inspector is on the field; proxy votes arrive now and then… when the file is complete',
      'Bosses announce their attacks: a red exclamation mark, an angry face, flashing squares. You have a second to react',
      'From "The School Blockade" onwards, every camp can call riot police and firefighters as reinforcements, then one more reinforcement every night from the 5th',
      'Play a figure on the same figure to level it up, up to level 3: more credibility, stronger, quicker, gold then on fire. Each level costs more than the card',
      'From night 6 you pick a deck of eight cards before playing, turncoats included',
      'Keyboard shortcuts only work while focus is inside the game',
    ],
    noscript: 'The game needs JavaScript to run. The rest of the site reads fine without it',
  },
  characters: {
    title: 'The characters',
    lead: 'Twenty-four public figures, four camps, one chair. Each figure can be played in its own camp… and will walk all over you when you play against it: the headliners then become bosses',
    cost: 'Cost',
    credibility: 'Credibility',
    recharge: 'Recharge',
    role: 'Role',
    seconds: 's',
    trump: 'Campaign trump card',
    boss: 'Boss',
    from: 'from "{night}"',
    reinforcementsTitle: 'The reinforcements',
    reinforcementsLead: 'Neither left nor right: every camp can call them, riot police and firefighters from "The School Blockade", then one more every night',
    guestTitle: 'The guests',
    guestLead: 'They belong to no camp, but they invite themselves into the campaign: a foreign president, the founder of Free, a news explainer, an investigative journalist and a YouTuber',
    extrasTitle: 'The extras',
    extrasLead: 'They have no name, but there are a lot of them: each kind has a single outfit, whichever camp sends it',
    extras: GAME_STRINGS.en.about,
    cta: 'Try it in a match',
  },
  legalLayout: {
    updated: 'Last updated',
    contactTitle: 'A question?',
    contactText: 'For any request (right of reply, removal, accessibility, data), write to the author through the form on his website.',
    contactCta: 'Contact the author',
    creditsTitle: 'Photo credits',
    creditsLead: 'Photos published on Wikimedia Commons, cropped and cut out for the game. Each link leads to the original photo’s page, with its full licence.',
    person: 'Public figure',
    face: 'Expression',
    author: 'Author',
    licence: 'Licence',
    faces: { neutral: 'smiling', angry: 'angry', hurt: 'struggling' },
  },
  notFound: {
    title: 'This polling station does not exist',
    text: 'The page you asked for cannot be found. It may have been dissolved',
    cta: 'Back to the home page',
  },
};

export const SITE_STRINGS: Record<Lang, SiteStrings> = { fr, en };
