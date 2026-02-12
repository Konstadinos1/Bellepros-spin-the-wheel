import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType,
  Header, convertInchesToTwip, TableLayoutType,
} from 'docx';
import { writeFileSync } from 'fs';

// ==========================================
//  Colors
// ==========================================
const NAVY = '1B1B2F';
const ORANGE = 'FF6B35';
const RED = 'E63946';
const GOLD = 'FFD700';
const WHITE = 'FFFFFF';
const LIGHT_GRAY = 'F2F2F2';

// ==========================================
//  Helper: styled text run
// ==========================================
function txt(text, opts = {}) {
  return new TextRun({
    text,
    font: 'Arial',
    size: opts.size || 22,
    bold: opts.bold || false,
    italics: opts.italics || false,
    color: opts.color || '333333',
    ...opts,
  });
}

function heading(text, level, color) {
  return new Paragraph({
    heading: level,
    spacing: { before: 300, after: 120 },
    children: [txt(text, { bold: true, color, size: level === HeadingLevel.HEADING_1 ? 36 : level === HeadingLevel.HEADING_2 ? 28 : 24 })],
  });
}

function bullet(text, opts = {}) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [txt(text, { size: 21, ...opts })],
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [txt(text, { size: 21, ...opts })],
  });
}

function emptyLine() {
  return new Paragraph({ spacing: { after: 80 }, children: [] });
}

// ==========================================
//  Helper: table cell
// ==========================================
function cell(text, opts = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.shading ? { type: ShadingType.SOLID, color: opts.shading } : undefined,
    verticalAlign: 'center',
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: opts.align || AlignmentType.LEFT,
        children: [txt(text, { bold: opts.bold || false, color: opts.textColor || '333333', size: opts.size || 20 })],
      }),
    ],
  });
}

function headerCell(text, width) {
  return cell(text, { shading: NAVY, textColor: WHITE, bold: true, width, size: 20 });
}

// ==========================================
//  PAGE 1
// ==========================================

// Title block
const titleBlock = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 80 }, children: [txt('LA ROUE DE FORTUNE', { bold: true, color: NAVY, size: 52 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [txt('Storyboard TikTok • Campagne Gamification', { color: ORANGE, size: 26, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [txt('Bellepros 440 • Laval, Québec • @bellepros440', { color: '666666', size: 21 })] }),
];

// Concept
const conceptSection = [
  heading('CONCEPT', HeadingLevel.HEADING_2, ORANGE),
  para('La Roue de Fortune transforme un simple repas au Bellepros 440 en une expérience de jeu excitante. Chaque client qui dépense 50$ ou plus reçoit un spin gratuit sur notre roue illuminée installée en magasin. Le concept mise sur la gamification pour augmenter le panier moyen, créer du contenu viral pour TikTok, et fidéliser la clientèle avec une expérience mémorable.'),
  para('L\'objectif est triple : (1) augmenter la valeur moyenne des transactions, (2) générer du contenu organique sur les réseaux sociaux grâce aux réactions des gagnants, et (3) positionner le Bellepros 440 comme LA destination fun à Laval.'),
  emptyLine(),
];

// Mise en Place
const miseEnPlace = [
  heading('MISE EN PLACE', HeadingLevel.HEADING_2, ORANGE),
  bullet('iPad monté sur support près de la caisse avec l\'app La Roue de Fortune'),
  bullet('Règle du jeu : achat de 50$+ = 1 spin gratuit (le staff vérifie le reçu)'),
  bullet('Tout le monde gagne un prix — aucun perdant (conforme aux lois du Québec)'),
  bullet('Coût moyen estimé par spin : ~10.50$ (basé sur les probabilités pondérées)'),
  bullet('Ratio coût/revenu : ~21% (10.50$/50$) — excellent pour la fidélisation'),
  bullet('ROI : augmentation ciblée de 15-25% du panier moyen pendant la campagne'),
  bullet('Contenu TikTok généré par les réactions authentiques des gagnants'),
  emptyLine(),
];

// Storyboard TikTok
const storyboardTitle = [
  heading('STORYBOARD TIKTOK (15 SECONDES)', HeadingLevel.HEADING_2, ORANGE),
];

const storyboardData = [
  ['0 – 3 sec', 'Close-up de la roue colorée qui tourne avec les lumières qui flashent. Ambiance game show.', '"ACHÈTE 50$+ = SPIN GRATUIT! 🤑"', 'Musique game show, bruit de la roue qui tourne'],
  ['3 – 6 sec', 'Constantin montre le terminal Interac / reçu de 50$+. Il dit: "Tu dépenses 50 piasses, tu gagnes un spin!"', '"La Règle : 50$+ = 1 Spin Gratuit"', 'Voix excitée de Constantin'],
  ['6 – 9 sec', 'Un client tourne la roue. La flèche ralentit... passe proche des petits prix... et tombe sur 25$ EN BOUFFE!', 'Roulement de tambour... DING!', 'Drum roll + cloche ding'],
  ['9 – 12 sec', 'Tout le monde crie! Constantin donne un gros sac de bouffe au client. High fives!', '"JACKPOT! 🎉"', 'Cris de joie, applaudissements'],
  ['12 – 15 sec', 'Constantin regarde la caméra et pointe. La roue est visible derrière lui.', '"T\'es joueur ou pas? Viens essayer." / "Seulement au 440."', 'Musique build, appel à l\'action'],
];

const storyboardTable = new Table({
  width: { size: 9400, type: WidthType.DXA },
  layout: TableLayoutType.FIXED,
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        headerCell('Temps', 1200),
        headerCell('Visuel / Action', 3200),
        headerCell('Texte à l\'écran', 2500),
        headerCell('Audio', 2500),
      ],
    }),
    ...storyboardData.map((row, idx) =>
      new TableRow({
        children: row.map((cellText, ci) =>
          cell(cellText, {
            width: [1200, 3200, 2500, 2500][ci],
            shading: idx % 2 === 0 ? LIGHT_GRAY : WHITE,
          })
        ),
      })
    ),
  ],
});

// TikTok Caption
const captionSection = [
  emptyLine(),
  heading('CAPTION TIKTOK', HeadingLevel.HEADING_3, RED),
  para('🎰 T\'achètes 50$+ au Bellepros 440 = Tu tournes la Roue de Fortune GRATUIT! Tout le monde gagne. Le gars a pogné 25$ en bouffe 🤯🔥 T\'es joueur ou pas?'),
  emptyLine(),
  para('#SpinTheWheel #LaRoueDeFortune #Laval #Jeu #Bellepros440 #450 #BouffeGratuite #Jackpot #QSR #Restaurant #FoodTikTok #Promo #Gamification', { color: '0066CC', size: 19 }),
];

// ==========================================
//  PAGE 2
// ==========================================

const page2Break = new Paragraph({ pageBreakBefore: true, children: [] });

// Prize Structure Table
const prizeData = [
  ['Boisson Gratuite', '~3$', '25%', '1 sur 4 spins'],
  ['Dessert Gratuit', '~5$', '20%', '1 sur 5 spins'],
  ['10$ Rabais (prochaine visite)', '10$', '20%', '1 sur 5 spins'],
  ['Poutine Gratuite', '~12$', '15%', '1 sur 6-7 spins'],
  ['25$ en Bouffe', '25$', '10%', '1 sur 10 spins'],
  ['Upgrade Combo', '~4$', '5%', '1 sur 20 spins'],
  ['50$ JACKPOT', '50$', '5%', '1 sur 20 spins'],
  ['Boisson Gratuite (filler)', '~3$', 'filler', 'Remplace prob. 25%'],
];

const prizeTableSection = [
  heading('STRUCTURE DES PRIX', HeadingLevel.HEADING_2, ORANGE),
  new Table({
    width: { size: 9400, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          headerCell('Prix', 3000),
          headerCell('Valeur', 1600),
          headerCell('Probabilité', 1800),
          headerCell('Fréquence', 3000),
        ],
      }),
      ...prizeData.map((row, idx) =>
        new TableRow({
          children: row.map((t, ci) =>
            cell(t, {
              width: [3000, 1600, 1800, 3000][ci],
              shading: idx % 2 === 0 ? LIGHT_GRAY : WHITE,
              bold: row[0].includes('JACKPOT'),
              textColor: row[0].includes('JACKPOT') ? RED : '333333',
            })
          ),
        })
      ),
    ],
  }),
  emptyLine(),
];

// Financial Analysis
const financialSection = [
  heading('ANALYSE FINANCIÈRE', HeadingLevel.HEADING_2, ORANGE),
  bullet('Coût moyen par spin : (0.25×3) + (0.20×5) + (0.20×10) + (0.15×12) + (0.10×25) + (0.05×4) + (0.05×50) = ~10.45$'),
  bullet('Ratio coût/revenu : 10.45$ / 50$ minimum = 20.9% — marge promotionnelle très saine'),
  bullet('Seuil de rentabilité : si le panier moyen augmente de 15%+ grâce à la promo, le ROI est positif'),
  bullet('Impact estimé sur le ticket moyen : +15% à +25% (les clients ajoutent des items pour atteindre 50$)'),
  bullet('Valeur du contenu TikTok : chaque réaction filmée = contenu organique gratuit (valeur média estimée 200-500$/vidéo)'),
  bullet('Budget mensuel estimé : ~50 spins/jour × 30 jours × 10.45$ = ~15,675$/mois'),
  emptyLine(),
];

// Implementation Notes
const implementationSection = [
  heading('NOTES D\'IMPLÉMENTATION', HeadingLevel.HEADING_3, RED),
  new Paragraph({ numbering: { reference: 'num1', level: 0 }, spacing: { after: 60 }, children: [txt('Installer un iPad sur support sécurisé près de la caisse avec l\'application La Roue de Fortune', { size: 21 })] }),
  new Paragraph({ numbering: { reference: 'num1', level: 0 }, spacing: { after: 60 }, children: [txt('Former le staff : vérifier le reçu (50$+ avant taxes), autoriser le spin, remettre le prix', { size: 21 })] }),
  new Paragraph({ numbering: { reference: 'num1', level: 0 }, spacing: { after: 60 }, children: [txt('Filmer les réactions des gagnants (avec permission) pour créer du contenu TikTok authentique', { size: 21 })] }),
  new Paragraph({ numbering: { reference: 'num1', level: 0 }, spacing: { after: 60 }, children: [txt('Installer une affiche en magasin : "Dépense 50$+ = Tourne la Roue!" avec QR code vers @bellepros440', { size: 21 })] }),
  new Paragraph({ numbering: { reference: 'num1', level: 0 }, spacing: { after: 60 }, children: [txt('Lancer un vendredi soir pour maximiser l\'impact et le trafic initial', { size: 21 })] }),
  new Paragraph({ numbering: { reference: 'num1', level: 0 }, spacing: { after: 60 }, children: [txt('Tracker les métriques : nombre de spins/jour, panier moyen, coût total des prix, engagement TikTok', { size: 21 })] }),
  emptyLine(),
];

// Legal
const legalSection = [
  heading('CONSIDÉRATIONS LÉGALES', HeadingLevel.HEADING_3, RED),
  para('Cette promotion N\'EST PAS un jeu de hasard ou une loterie au sens de la Loi sur les loteries du Québec, pour les raisons suivantes :', { bold: true, size: 21 }),
  bullet('Le spin est un BONUS GRATUIT inclus avec un achat — aucun argent additionnel n\'est requis pour jouer'),
  bullet('TOUT LE MONDE gagne un prix — il n\'y a aucun perdant'),
  bullet('Le client paie pour sa nourriture, pas pour le jeu — la roue est une valeur ajoutée promotionnelle'),
  bullet('Les prix sont des produits/rabais du restaurant, pas de l\'argent comptant'),
  emptyLine(),
  para('RECOMMANDATION : Consulter un avocat spécialisé en droit commercial québécois avant le lancement pour confirmer la conformité avec la Loi sur les loteries, les concours publicitaires et les règles de la Régie des alcools, des courses et des jeux (RACJ).', { italics: true, color: '666666', size: 19 }),
];

// ==========================================
//  BUILD DOCUMENT
// ==========================================
const doc = new Document({
  numbering: {
    config: [{
      reference: 'num1',
      levels: [{
        level: 0,
        format: 'decimal',
        text: '%1.',
        alignment: AlignmentType.START,
        style: { paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) } } },
      }],
    }],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840, orientation: 'portrait' },
        margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [txt('BELLEPROS 440 • Storyboard TikTok', { color: '999999', size: 16, bold: true })],
          }),
        ],
      }),
    },
    children: [
      // PAGE 1
      ...titleBlock,
      ...conceptSection,
      ...miseEnPlace,
      ...storyboardTitle,
      storyboardTable,
      ...captionSection,

      // PAGE 2
      page2Break,
      ...prizeTableSection,
      ...financialSection,
      ...implementationSection,
      ...legalSection,
    ],
  }],
});

// ==========================================
//  EXPORT
// ==========================================
const buffer = await Packer.toBuffer(doc);
writeFileSync('roue-de-fortune-storyboard.docx', buffer);
console.log('Document generated: roue-de-fortune-storyboard.docx');
console.log(`File size: ${(buffer.length / 1024).toFixed(1)} KB`);
