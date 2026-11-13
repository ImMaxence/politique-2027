/** Site copy (everything outside the game itself), in French and English. */
import type { Lang } from './game';
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
    trump: string; reinforcementsTitle: string; reinforcementsLead: string; guestTitle: string; guestLead: string;
    extrasTitle: string; extrasLead: string; extras: Record<string, string>; cta: string;
  };
  legalLayout: { updated: string; contactTitle: string; contactText: string; contactCta: string };
  notFound: { title: string; text: string; cta: string };
}

const fr: SiteStrings = {
  locale: 'fr_FR',
  langName: 'Français',
  meta: {
    home: {
      title: 'Politique 2027 — Le jeu satirique de la présidentielle',
      description:
        "Gauche, Centre, Droite ou les Autres : choisis ton camp et tiens le perron de l'Élysée. Jeu de défense satirique gratuit, sans inscription, jouable dans le navigateur.",
    },
    play: {
      title: 'Jouer à Politique 2027 — Gratuit, dans le navigateur',
      description:
        'Lance une partie : choisis ton camp parmi quatre, déploie tes figures et repousse les trois autres. Clavier, souris ou tactile.',
    },
    characters: {
      title: 'Les 24 personnages et leurs pouvoirs — Politique 2027',
      description:
        "Macron, Mélenchon, Le Pen, Hollande, Riner, Lassalle… Découvre les 24 caricatures jouables, leurs répliques cultes, leurs pouvoirs et l'atout de chaque camp.",
    },
    legal: { title: 'Mentions légales — Politique 2027', description: 'Éditeur, hébergement, propriété intellectuelle et cadre satirique du jeu Politique 2027.' },
    privacy: { title: 'Politique de confidentialité — Politique 2027', description: 'Aucun compte, aucun cookie, aucun traceur : ce que Politique 2027 stocke (dans ton navigateur) et ce qui transite par le serveur.' },
    terms: { title: "Conditions d'utilisation — Politique 2027", description: "Règles d'usage du jeu Politique 2027 : accès gratuit, caractère satirique, usage acceptable et droit applicable." },
    accessibility: { title: "Déclaration d'accessibilité — Politique 2027", description: "État de conformité RGAA et WCAG de Politique 2027, tests réalisés, limites connues et contact." },
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
      "Politique 2027 est une œuvre de satire. Les personnages sont des caricatures ; leurs pouvoirs sont inventés pour rire. Aucun lien avec un parti, un candidat ou une institution.",
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
    lead: "Gauche, Centre, Droite ou les Autres : choisis ton camp, déploie tes figures et tiens le perron de l'Élysée jusqu'au soir du second tour.",
    cta: 'Jouer maintenant',
    secondary: 'Voir le casting',
    perks: ['Gratuit', 'Sans inscription', 'Sans pub ni traceur', 'Clavier, souris ou tactile'],
    campsTitle: 'Quatre camps, zéro consensus',
    campsLead: 'Chaque camp a ses six figures, ses répliques, sa façon de jouer et un atout de campagne à déclencher au bon moment.',
    trump: 'Atout de campagne',
    rosterLabel: 'Figures',
    howTitle: 'Comment on joue',
    steps: [
      { title: 'Choisis ton camp', text: 'La Gauche, le Centre, la Droite ou les Autres. Les trois camps restants deviennent tes adversaires.' },
      { title: 'Collecte des parrainages', text: "Il en faut pour tout. Place d'abord une figure de collecte, le reste suivra." },
      { title: 'Tiens le perron', text: "Les rivaux déferlent par vagues, et la rue s'en mêle : blocus, poubelles en feu, automobilistes en colère. Réponds avant qu'ils n'atteignent les marches." },
      { title: 'Gagne la présidentielle', text: 'Sept soirées de campagne, de la place du village au second tour. Puis la Cohabitation, sans fin.' },
    ],
    castTitle: "Un casting de 24 têtes d'affiche",
    castLead: 'Chacun a son pouvoir et ses répliques, tirés de ses petites phrases les plus célèbres.',
    castCta: 'Voir les 24 personnages',
    faqTitle: 'Questions fréquentes',
    faq: [
      { q: "C'est quoi, Politique 2027 ?", a: "Un jeu de défense en couloirs (tower defense) gratuit, jouable dans le navigateur, qui parodie la course à l'élection présidentielle française de 2027. Tu choisis la Gauche, le Centre, la Droite ou les Autres, puis tu places des caricatures de personnalités publiques pour repousser les trois autres camps." },
      { q: 'Le jeu est-il gratuit ?', a: 'Oui : gratuit, sans inscription, sans publicité et sans achat intégré. Le code source est ouvert, sous licence MIT.' },
      { q: 'Le jeu prend-il parti ?', a: "Non. C'est une satire : tous les camps sont caricaturés avec le même traitement et les quatre sont jouables. Le jeu n'est affilié à aucun parti, candidat ou institution, et ne constitue ni un sondage ni un appel au vote." },
      { q: 'Quels personnages peut-on jouer ?', a: 'Vingt-quatre figures réparties en quatre camps. À gauche : Raphaël Glucksmann, François Hollande, Fabien Roussel, Ségolène Royal, François Ruffin et Jean-Luc Mélenchon. Au centre : François Bayrou, Gabriel Attal, Édouard Philippe, Bruno Le Maire, Élisabeth Borne et Emmanuel Macron. À droite : Nicolas Sarkozy, Jordan Bardella, Éric Ciotti, Bruno Retailleau, Éric Zemmour et Marine Le Pen. Chez les Autres : Brigitte Macron, Dominique de Villepin, Jean Lassalle, Marine Tondelier, Philippe Poutou et Teddy Riner. S’y ajoutent deux renforts communs à tous, les CRS et les pompiers, et cinq invités : Donald Trump au sommet international, HugoDécrypte sur le plateau du débat, Élise Lucet au premier tour, Squeezie dans la rue et Sylvain Durif à la chasse aux parrainages.' },
      { q: "Le jeu suit-il l'actualité ?", a: "À sa façon. Blocus lycéens, poubelles en feu, essence à plus de 2 € le litre, agriculteurs et tracteurs, impôts prélevés à la source, virements de la CAF, patrons du CAC 40, droits de douane, info en continu : ces événements apparaissent comme des péripéties de jeu, de manière générique, sans viser un lieu, une date ou une personne en particulier." },
      { q: 'Les répliques sont-elles de vraies citations ?', a: "Certaines, oui : « De la poudre de perlimpinpin », « La République, c'est moi ! », « Ils sont là, dans les campagnes… » ou « Moi président » sont des formules publiques devenues cultes. Les autres sont inventées dans l'esprit du personnage. Aucune n'a valeur de citation documentaire." },
      { q: 'Est-ce que ça marche sur mobile ?', a: "Oui, sur téléphone et tablette comme sur ordinateur. Sur téléphone, la partie se joue en paysage, en plein écran quand le navigateur le permet : si tu tiens ton téléphone droit, le jeu s'affiche tourné pour que tu le retournes. Ce réglage se désactive dans le menu pause. Un navigateur récent suffit, il n'y a rien à installer." },
      { q: "Peut-on jouer au clavier ou avec un lecteur d'écran ?", a: "Oui. Toutes les actions passent par de vrais boutons : touches 1 à 8 pour choisir une figure, flèches pour viser, Entrée pour placer. Les événements de la partie sont annoncés aux lecteurs d'écran et les animations respectent le réglage « réduire les animations »." },
      { q: 'Mes données sont-elles collectées ?', a: "Non. Pas de compte, pas de cookie, pas de traceur, pas de mesure d'audience. Ta progression reste dans ton navigateur (stockage local) et n'est jamais envoyée." },
      { q: 'Qui a fait ce jeu ?', a: 'Maxence Bonnici, développeur full stack. Politique 2027 est un projet personnel et open source.' },
    ],
    satireTitle: 'Une satire, pas un programme',
    satire:
      "Les personnages sont des caricatures de personnalités publiques. Leurs pouvoirs et les situations sont inventés pour rire : ils ne décrivent pas des faits et ne reflètent pas les opinions de l'auteur. Le jeu n'est lié à aucun parti, candidat ou institution.",
    finalTitle: 'Le perron ne va pas se défendre tout seul',
    finalText: 'Une partie dure trois à sept minutes. La première est la plus facile.',
  },
  play: {
    title: 'Jouer à Politique 2027',
    lead: 'Choisis ton camp, puis une soirée de campagne. La partie se joue à la souris, au doigt ou au clavier.',
    controlsTitle: 'Commandes',
    mouseTitle: 'Souris et tactile',
    mouse: [
      'Clique une figure dans la barre, puis une case du terrain pour la placer.',
      'Le bouton Retirer enlève une figure du terrain et rembourse 25 % de son coût : le terrain se grise, touche la figure à retirer.',
      "L'atout de campagne se déclenche d'un clic dès qu'il est chargé.",
      'Sur téléphone, la partie se joue en paysage : cartes à gauche, terrain à droite. Le menu pause permet de libérer l’orientation.',
    ],
    keyboardTitle: 'Clavier',
    keys: [
      ['1 à 8', 'Choisir une figure'],
      ['Flèches', 'Se déplacer sur le terrain'],
      ['Entrée ou Espace', 'Placer la figure'],
      ['R', 'Retirer une figure'],
      ['U', 'Atout de campagne'],
      ['P ou Échap', 'Pause'],
      ['F', 'Vitesse ×2'],
      ['M', 'Couper ou remettre le son'],
    ],
    rulesTitle: 'Les règles en bref',
    rules: [
      'Les parrainages servent à placer des figures. Tu en reçois un peu tout seul, beaucoup plus avec une figure de collecte.',
      "Chaque adversaire qui atteint le perron te coûte un point de sondage. À zéro, c'est perdu.",
      'Tiens toutes les vagues pour gagner la soirée et débloquer la suivante, avec une nouvelle figure.',
      'Chaque carte affiche son type : Argent (rapporte des parrainages), Attaque, Effet (ralentit, fige, repousse) ou Défense.',
      'Les impôts prélèvent des parrainages tant que le contrôleur est sur le terrain ; la CAF en verse de temps en temps, quand le dossier est complet.',
      'À partir du niveau « La rue gronde », tous les camps peuvent appeler les CRS et les pompiers en renfort.',
      'Les raccourcis clavier ne fonctionnent que lorsque le focus est dans le jeu.',
    ],
    noscript: 'Le jeu a besoin de JavaScript pour fonctionner. Le reste du site se lit sans.',
  },
  characters: {
    title: 'Les personnages',
    lead: "Vingt-quatre caricatures, quatre camps, un seul fauteuil. Chaque figure peut être jouée dans son camp… et te marcher dessus quand tu joues contre lui.",
    cost: 'Coût',
    credibility: 'Crédibilité',
    recharge: 'Recharge',
    role: 'Rôle',
    seconds: 's',
    trump: 'Atout de campagne',
    reinforcementsTitle: 'Les renforts',
    reinforcementsLead: 'Ni de gauche, ni de droite : à partir du niveau « La rue gronde », tous les camps peuvent les appeler.',
    guestTitle: 'Les invités',
    guestLead: "Ils n'appartiennent à aucun camp, mais ils s'invitent dans la campagne : un président étranger, un intervieweur, une journaliste d'investigation, un vidéaste et un candidat pas comme les autres.",
    extrasTitle: 'Les figurants',
    extrasLead: "Ils n'ont pas de nom, mais ils sont nombreux. Les militants prennent la couleur du camp qui les envoie ; la rue, elle, n'appartient à personne.",
    extras: {
      militant: 'Distribue des tracts et avance tout droit. Toujours en bande.',
      placard: 'Sa pancarte encaisse deux fois plus que lui.',
      pundit: 'A un avis sur tout et court très vite le donner.',
      bus: 'Lent, énorme, insensible aux coups de gueule.',
      cat: 'Petit, rapide, vise les mollets. Accompagne une certaine éleveuse.',
      lyceen: 'Rapide, nombreux, pancarte « BLOCUS » à la main. Retourne en cours une fois convaincu.',
      gilet: 'Plus coriace qu’un militant, et difficile à faire reculer : il tient son rond-point.',
      poubelle: "Roule lentement et roussit toutes les figures voisines. Les pompiers l'éteignent d'un coup.",
      auto: 'Démarre en trombe, puis tombe en panne sèche à mi-chemin : à 2 € le litre, on ne va pas loin.',
      agriculteur: 'Chapeau de paille, bleu de travail et fourche à la main. Solide, et il ne rentre à la ferme que convaincu.',
      tracteur: 'Lent et quasi inarrêtable. Son moteur couvre les discours : les figures proches restent sans voix.',
      impots: 'Prélève vos parrainages à la source, toutes les quatre secondes, tant qu’il est sur le terrain.',
      patron: 'Costume à rayures, cravate dorée, mallette bien remplie. Lent, coriace, et il arrive avec ses éditorialistes.',
      cnews: "L'info en continu, parabole déployée : lent, insensible aux coups de gueule, il débarque un éditorialiste toutes les quatre secondes et demie.",
    },
    cta: 'Essayer en partie',
  },
  legalLayout: {
    updated: 'Dernière mise à jour',
    contactTitle: 'Une question ?',
    contactText: "Pour toute demande (droit de réponse, retrait, accessibilité, données), écris à l'auteur via le formulaire de son site.",
    contactCta: "Contacter l'auteur",
  },
  notFound: {
    title: "Ce bureau de vote n'existe pas",
    text: 'La page demandée est introuvable. Elle a peut-être été dissoute.',
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
        'Left, Centre, Right or the Others: pick your camp and hold the steps of the Élysée. A free satirical lane-defense game about the 2027 French presidential race. No sign-up, plays in your browser.',
    },
    play: {
      title: 'Play Politique 2027 — Free, in your browser',
      description:
        'Start a match: pick one of four camps, field your figures and push back the three others. Keyboard, mouse or touch.',
    },
    characters: {
      title: 'The 24 characters and their powers — Politique 2027',
      description:
        "Macron, Mélenchon, Le Pen, Hollande, Riner, Lassalle… Meet the 24 playable caricatures, their catchphrases, their powers and each camp's trump card.",
    },
    legal: { title: 'Legal notice — Politique 2027', description: 'Publisher, hosting, intellectual property and satirical framework of the game Politique 2027.' },
    privacy: { title: 'Privacy policy — Politique 2027', description: 'No account, no cookie, no tracker: what Politique 2027 stores (in your browser) and what passes through the server.' },
    terms: { title: 'Terms of use — Politique 2027', description: 'Rules for using Politique 2027: free access, satirical nature, acceptable use and governing law.' },
    accessibility: { title: 'Accessibility statement — Politique 2027', description: 'RGAA and WCAG conformance status of Politique 2027, tests carried out, known limits and contact.' },
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
      'Politique 2027 is a work of satire. The characters are caricatures; their powers are made up for laughs. It is not affiliated with any party, candidate or institution.',
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
    lead: 'Left, Centre, Right or the Others: pick your camp, field your figures and hold the steps of the Élysée until the night of the run-off.',
    cta: 'Play now',
    secondary: 'Meet the cast',
    perks: ['Free', 'No sign-up', 'No ads, no trackers', 'Keyboard, mouse or touch'],
    campsTitle: 'Four camps, zero consensus',
    campsLead: 'Each camp has its six figures, its catchphrases, its own way of playing and a campaign trump card to fire at the right moment.',
    trump: 'Campaign trump card',
    rosterLabel: 'Figures',
    howTitle: 'How to play',
    steps: [
      { title: 'Pick your camp', text: 'The Left, the Centre, the Right or the Others. The three remaining camps become your opponents.' },
      { title: 'Collect endorsements', text: 'Everything costs endorsements. Place an income figure first, the rest will follow.' },
      { title: 'Hold the steps', text: 'Rivals pour in by waves, and the street joins in: blockades, burning bins, angry motorists. Answer before they reach the steps.' },
      { title: 'Win the presidency', text: 'Seven campaign nights, from the village square to the run-off. Then Cohabitation, endlessly.' },
    ],
    castTitle: 'A cast of 24 headliners',
    castLead: 'Each has a power and catchphrases drawn from their best-known lines.',
    castCta: 'See all 24 characters',
    faqTitle: 'Frequently asked questions',
    faq: [
      { q: 'What is Politique 2027?', a: 'A free lane-defense (tower defense) game that runs in your browser and parodies the race for the 2027 French presidential election. You pick the Left, the Centre, the Right or the Others, then place caricatures of public figures to push back the three other camps.' },
      { q: 'Is the game free?', a: 'Yes: free, with no sign-up, no ads and no in-app purchases. The source code is open, under the MIT licence.' },
      { q: 'Does the game take sides?', a: 'No. It is satire: every camp gets the same treatment and all four are playable. The game is not affiliated with any party, candidate or institution, and is neither a poll nor a call to vote.' },
      { q: 'Which characters can you play?', a: 'Twenty-four figures across four camps. Left: Raphaël Glucksmann, François Hollande, Fabien Roussel, Ségolène Royal, François Ruffin and Jean-Luc Mélenchon. Centre: François Bayrou, Gabriel Attal, Édouard Philippe, Bruno Le Maire, Élisabeth Borne and Emmanuel Macron. Right: Nicolas Sarkozy, Jordan Bardella, Éric Ciotti, Bruno Retailleau, Éric Zemmour and Marine Le Pen. The Others: Brigitte Macron, Dominique de Villepin, Jean Lassalle, Marine Tondelier, Philippe Poutou and Teddy Riner. Add two reinforcements shared by everyone, riot police and firefighters, and five guests: Donald Trump at the international summit, HugoDécrypte on the debate set, Élise Lucet in the first round, Squeezie in the street and Sylvain Durif on the hunt for endorsements.' },
      { q: 'Does the game follow the news?', a: 'In its own way. School blockades, burning bins, petrol above €2 a litre, farmers and tractors, taxes withheld at source, family-benefit transfers, CAC 40 bosses, tariffs, rolling news: these events show up as generic twists in the game, without targeting any place, date or person in particular.' },
      { q: 'Are the catchphrases real quotes?', a: 'Some are: "Poudre de perlimpinpin", "La République, c\'est moi !", "Ils sont là, dans les campagnes…" or "Moi président" are public lines that became cult classics in France. The others are made up in the spirit of the character. None is offered as a documentary quotation.' },
      { q: 'Does it work on mobile?', a: 'Yes, on phones and tablets as well as on desktop. On a phone the match is played in landscape, fullscreen where the browser allows it: if you hold the phone upright, the game is drawn sideways so that you turn it. This can be switched off in the pause menu. A recent browser is all you need; there is nothing to install.' },
      { q: 'Can you play with a keyboard or a screen reader?', a: 'Yes. Every action goes through real buttons: keys 1 to 8 to pick a figure, arrows to aim, Enter to place. Match events are announced to screen readers and animations respect the "reduce motion" setting.' },
      { q: 'Is my data collected?', a: 'No. No account, no cookie, no tracker, no analytics. Your progress stays in your browser (local storage) and is never sent anywhere.' },
      { q: 'Who made this game?', a: 'Maxence Bonnici, a full-stack developer. Politique 2027 is a personal, open-source project.' },
    ],
    satireTitle: 'Satire, not a manifesto',
    satire:
      "The characters are caricatures of public figures. Their powers and the situations are made up for laughs: they do not describe facts and do not reflect the author's opinions. The game has no link with any party, candidate or institution.",
    finalTitle: 'The steps will not defend themselves',
    finalText: 'A match lasts three to seven minutes. The first one is the easiest.',
  },
  play: {
    title: 'Play Politique 2027',
    lead: 'Pick your camp, then a campaign night. Play with a mouse, a finger or a keyboard.',
    controlsTitle: 'Controls',
    mouseTitle: 'Mouse and touch',
    mouse: [
      'Click a figure in the bar, then a square of the field to place it.',
      'The Remove button takes a figure off the field and refunds 25% of its cost: the field greys out, tap the figure to remove.',
      'The campaign trump card fires with one click as soon as it is charged.',
      'On a phone the match is played in landscape: cards on the left, field on the right. The pause menu can release the orientation.',
    ],
    keyboardTitle: 'Keyboard',
    keys: [
      ['1 to 8', 'Pick a figure'],
      ['Arrows', 'Move around the field'],
      ['Enter or Space', 'Place the figure'],
      ['R', 'Remove a figure'],
      ['U', 'Campaign trump card'],
      ['P or Esc', 'Pause'],
      ['F', 'Speed ×2'],
      ['M', 'Mute or unmute'],
    ],
    rulesTitle: 'The rules in short',
    rules: [
      'Endorsements pay for figures. You get a trickle on your own, and far more with an income figure.',
      'Every opponent who reaches the steps costs you a poll point. At zero, you lose.',
      'Hold every wave to win the night and unlock the next one, along with a new figure.',
      'Every card shows its type: Money (brings in endorsements), Attack, Effect (slows, freezes, pushes back) or Defence.',
      'The tax office withholds endorsements for as long as its inspector is on the field; the family-benefits office pays some out now and then, when the file is complete.',
      'From the level "The Street Rumbles" onwards, every camp can call riot police and firefighters as reinforcements.',
      'Keyboard shortcuts only work while focus is inside the game.',
    ],
    noscript: 'The game needs JavaScript to run. The rest of the site reads fine without it.',
  },
  characters: {
    title: 'The characters',
    lead: 'Twenty-four caricatures, four camps, one chair. Each figure can be played in its own camp… and will walk all over you when you play against it.',
    cost: 'Cost',
    credibility: 'Credibility',
    recharge: 'Recharge',
    role: 'Role',
    seconds: 's',
    trump: 'Campaign trump card',
    reinforcementsTitle: 'The reinforcements',
    reinforcementsLead: 'Neither left nor right: from the level "The Street Rumbles" onwards, every camp can call them.',
    guestTitle: 'The guests',
    guestLead: 'They belong to no camp, but they invite themselves into the campaign: a foreign president, an interviewer, an investigative journalist, a video maker and a candidate unlike any other.',
    extrasTitle: 'The extras',
    extrasLead: 'They have no name, but there are a lot of them. Activists wear the colour of the camp that sends them; the street belongs to nobody.',
    extras: {
      militant: 'Hands out leaflets and walks straight ahead. Always in a pack.',
      placard: 'The sign takes twice as much punishment as its bearer.',
      pundit: 'Has an opinion on everything and runs very fast to share it.',
      bus: 'Slow, huge, unmoved by roaring.',
      cat: 'Small, fast, goes for the ankles. Travels with a certain breeder.',
      lyceen: 'Fast, numerous, "BLOCUS" sign in hand. Goes back to class once convinced.',
      gilet: 'Tougher than an activist and hard to push back: he holds his roundabout.',
      poubelle: 'Rolls slowly and scorches every figure nearby. The fire brigade puts it out in one go.',
      auto: 'Races off, then runs out of petrol halfway: at €2 a litre, you do not get far.',
      agriculteur: 'Straw hat, overalls and a pitchfork in hand. Sturdy, and only goes back to the farm once convinced.',
      tracteur: 'Slow and nearly unstoppable. Its engine drowns out every speech: nearby figures are lost for words.',
      impots: 'Withholds your endorsements at source, every four seconds, for as long as he is on the field.',
      patron: 'Pinstripes, gold tie, a well-filled briefcase. Slow, tough, and he brings his own pundits.',
      cnews: 'Rolling news, dish up: slow, unmoved by roaring, and it drops off a fresh pundit every four and a half seconds.',
    },
    cta: 'Try it in a match',
  },
  legalLayout: {
    updated: 'Last updated',
    contactTitle: 'A question?',
    contactText: 'For any request (right of reply, removal, accessibility, data), write to the author through the form on his website.',
    contactCta: 'Contact the author',
  },
  notFound: {
    title: 'This polling station does not exist',
    text: 'The page you asked for cannot be found. It may have been dissolved.',
    cta: 'Back to the home page',
  },
};

export const SITE_STRINGS: Record<Lang, SiteStrings> = { fr, en };
