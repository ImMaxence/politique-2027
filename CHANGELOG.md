# Changelog

All notable changes to Politique 2027 are listed here, newest first.

Versions follow **`MAJOR.MEDIUM.MINOR`**:

| Part | Bumped when | Example |
|---|---|---|
| **MAJOR** | The game changes in a way players notice immediately or that breaks saved progress: new core mechanic, reworked campaign, new save format | `1.4.2 → 2.0.0` |
| **MEDIUM** | Something is added without breaking anything: a character, a level, a mode, a language, a page | `1.0.3 → 1.1.0` |
| **MINOR** | Fixes and polish: bug fix, balance tweak, wording, accessibility or performance improvement | `1.0.0 → 1.0.1` |

When a version is released, update `version` in `package.json` and `updated` in `src/config/site.ts` (both are shown in the footer and the legal pages).

## [4.3.0] — 2026-11-14

Achievements now unlock looks, the daily challenge has a rule of the day and a streak, the campaign has five difficulties, and every shared result carries the link to the game. Saves are kept.

### Added

- **A wardrobe on the calendar**: six achievements each unlock a look your figures wear on the board. The mayor's tricolour sash (first win), sunglasses over their eyes (a night with three stars), gold cards (a daily challenge), blue flames (a figure at level 3), purple flames (a win with every camp) and tricolour flames (five daily challenges in a row). Looks change nothing to the game, and one flame colour is worn at a time. The achievements list says what each one unlocks, and the gazette announces a new look.
- **A rule of the day for the daily challenge**, the same for everybody: double votes (but faster opponents), no reshuffle, sales (cards 30% cheaper, 50% slower to recharge), hard heads (opponents with 30% more credibility, 150 more votes to start with) or merges at cost. It is written on the daily card, announced at the start and hung on the wall all night. The reference bot was run on every possible night with each rule: hard heads is the tough day of the week, the others play about like a normal night.
- **A streak**: daily challenges played to the end on consecutive days. The daily card shows it; five days in a row earn the new **Regular** achievement (18 in all) and the tricolour flames.
- **Two more difficulties, very easy and extreme**, on either side of easy, normal and hard. Very easy: waves 45% smaller, opponents with 35% less credibility and 10% slower, 100 more votes at the start, to discover the game or play it with a child. Extreme: waves 60% bigger, opponents with 25% more credibility and 12% faster; its button carries a skull with glowing eyes. The line under the five choices describes the chosen one. Measured with the reference bot: it wins every night from very easy to normal, three nights in four in hard and a little more than one in three in extreme, and doing nothing still loses in very easy. Winning the run-off in extreme counts for the hard-mode achievement.
- **Challenge a friend from the daily challenge**: the result's share button becomes "Challenge a friend" and sends a duel link with your score and the rule of the day, so that the friend plays the very same match.

### Fixed

- **A friend's challenge opens straight away for someone who has never played**: the calendar comes up with the challenge on top and the duel's camp, instead of the choice of camp first. The match is the very same night as the challenger's, not night 1.
- **A shared result now carries the link to the game.** With a picture, only duels added it: a campaign or Cohabitation result went out with its headline alone.

## [4.2.0] — 2026-11-14

An easy mode, and the five newest reinforcements can finally be seen. Saves are kept: a hard mode chosen before stays chosen.

### Added

- **Easy mode**, next to Normal and Hard on the calendar: waves a quarter smaller, opponents with a fifth less credibility and 50 more votes at the start of each night, to find your feet. Like hard mode it applies to the campaign and Cohabitation, not to the daily challenge, duels or head to head; the start of the night and the gazette say which mode was played. On a narrow phone the three choices sit side by side under the word "Difficulty". The reference bot wins every night in easy mode without losing a single piece of the goal, and doing nothing still loses.

### Fixed

- **The five reinforcements added in 3.1.0 can be seen on the board.** The speed camera, the paramedics, the baker, the teachers and the Constitutional Council did their job but stayed invisible once placed (only their speech bubble showed): the game only prepared the pictures of the riot police and the firefighters. Every reinforcement now gets its picture, and a test checks that every card has one.

## [4.1.1] — 2026-11-14

Saves are untouched.

### Fixed

- **Locked nights no longer take a whole phone screen each.** The sentence saying how to unlock a night slipped under its date, and the date column grew as wide as that sentence: the rest of the card was squeezed into a column of single words. Everything but the date now sits in the right-hand column, on every screen.

## [4.1.0] — 2026-11-14

Numbers everywhere: what each card does, what each hit takes off, what each figure gives back. Levels are easier to tell apart. Saves are untouched.

### Added

- **Damage numbers**: every hit shows over the opponent the credibility it took off (red, orange from 100 up), levels included. Édouard Philippe's counter-attack shows in steps of 10 rather than every frame.
- **Each card's number on its portrait**, in the column of cards: damage for attack and effect cards (sword), credibility for defence cards (shield), votes for "Votes" cards (ballot box), care for the paramedics (cross); Florian Philippot shows how often he sends an opponent back. Hovering a card, or reading it with a screen reader, gives the full figures.
- **Taking a figure off shows what it gives back**: in removal mode each figure carries its refund ("+112" for a level 3 Jordan Bardella, a quarter of 100 + 150 + 200), and the votes won back float up when it leaves. Speech bubbles step aside meanwhile.
- **Each level-up says what it changed**, in the bar under the board (Jordan Bardella: 20 damage every 1.4 s, then 30 every 1.1 s, then 44 every second), and the merge tip gives the figure's own numbers.

### Changed

- **Levels are easier to tell apart**: level 1 has nothing, level 2 only has its eyes on fire (white-hot, with a little flame rising from each), level 3 has its eyes on fire and a simple fire around it (orange and yellow, no taller than the figure). The golden aura and the golden sheen on the faces are gone.
- The tag over a figure that can level up is one clean shape with a double chevron (its arrow looked odd).
- **The home page shows each camp's three best-known figures, bigger**, as a group photo with the headliner in front; the six names stay listed underneath.
- The Remove button and the rules say it plainly: a figure gives back 25% of all it cost, levels included.

## [4.0.0] — 2026-11-14

Figures now level up on the board: play a card on the same figure and it goes up a level, gold then on fire. This replaces the upgrades bought with stars in 3.1.0: the levels bought there are dropped (stars stay on the calendar as each night's score, and an achievement already earned stays earned). The rest of the save is kept.

### Added

- **Levels, played on the board**: a card played on the same figure merges into it and takes it to level 2, then 3 at most. Level 2 turns it gold (golden aura, glowing yellow eyes, sparks), level 3 sets it on fire (flames, embers), with a badge on the figure. Each level costs more than the card (×1.5, then ×2, rounded up to 25 votes) and brings +60% then +130% credibility, a stronger effect (×1.5, then ×2.2) and quicker actions; the figure gets all its credibility back, and taking it off refunds a quarter of everything spent on it. Selecting a card shows, over each figure it can raise, the next level and its price. Bombs and the fire hose leave the board at once, so they do not merge. A tip explains it all the first time a second copy of a figure reaches the board, and screen readers hear each figure's level.
- **The deck screen explains itself**: a line says what a turncoat is, turncoats are grouped by camp, filters show one family at a time (Votes, Attack, Effect, Defence), and each card gives its power and what it does in numbers (damage and pace, votes, credibility, freeze time…).
- The result screen counts the level-ups of the night.

### Changed

- The **Maxed Out** achievement becomes **On Fire**: take a figure to level 3 during a night.
- Playing a card on a square already taken says why it is refused: only the same figure can go there, to level up.

### Removed

- **Upgrades bought with stars** and their panel on the calendar: replaced by levels on the board.

### Fixed

- **The home page shows the four headliners again** (Mélenchon, Macron, Le Pen, Riner): since 3.1.0 it showed each camp's night-6 figure.
- **The "Install the app" banner fits narrow phones**: the text gets the whole width and the Install button goes under it, instead of a column of one word per line.

## [3.1.0] — 2026-11-14

Something new every night until the run-off: four public figures, five reinforcements, a deck to build with turncoats, and upgrades bought with stars. Saves are kept (the new settings start empty).

### Added

- **A sixth figure per camp**, unlocked on night 6, each an "effect" card (purple tie): **Sandrine Rousseau** (No More Barbecue: her remarks slow opponents down), **Gérald Darmanin** (Under Arrest!: handcuffs that freeze the first opponent), **Éric Ciotti** (The Locked Headquarters: everyone in front of him is stuck for a few seconds) and **Florian Philippot** (Frexit: the frontmost opponent goes back to the gate). They also march as rival lieutenants.
- **Five everyday reinforcements**, one more every night from the 5th, for every camp: the **speed camera** (flashes its whole lane: damage and slowdown), the **paramedics** (give the eight neighbours credibility back), the **baker** (a baguette, a ballot: 20 votes every six seconds), the **teachers** (the whole lane is marked; pupils and scooters go back to class at once) and the **Constitutional Council** (the toughest opponent in the lane is censored: −60%, −30% for a headliner).
- **Get ready for the night**: from night 6 (and in Cohabitation) a screen comes before the match to pick a deck of **eight cards** among the camp's figures, the reinforcements and up to **two turncoats** poached from the rival camps (headliners excepted). The last deck is remembered; "Try again" keeps it.
- **Upgrades**: the stars won are spent on the calendar to take a card to level 2 (2 ★) or 3 (3 ★): +25% credibility, 15% shorter recharge and a 15% stronger effect per level. The daily challenge, duels and head to head stay the same for everybody (no upgrades, default deck).
- Two achievements: **Poached** (play a night with a turncoat) and **Maxed Out** (take a card to level 3).
- The result screen announces the reinforcement unlocked for the next night; the characters page says from which night each reinforcement comes.

### Changed

- **Every head sits the same way on its body**: the cutter now moves each head so that its chin rests on the collar and its middle sits over the tie, whatever the framing of the photo (François Hollande and Bruno Retailleau were floating). Élisabeth Borne's cheek, Marine Le Pen's and Brigitte Macron's hair are no longer cut off.
- Keys 1 to 8 pick a card again (decks hold eight cards).
- The shared result picture shows the camp's headliner again (it had gone missing in 3.0).

## [3.0.3] — 2026-11-14

Saves are untouched.

### Fixed

- **The new photos now reach every player.** A head kept the same file name from one version to the next, so browsers, Cloudflare and the offline copy of the game went on showing the old one (they keep pictures for a week). Every head's file name now carries the hash of its content, heads are cached for a year since a new photo always gets a new name, and the offline copy is filled past the browser's cache.

### Changed

- **Defenders show their credibility**: a thick bar with the points left written on it, always visible under every defence figure on the board (green, yellow, then red).
- **Marine Le Pen's electronic tag is gone** (it could not be seen on the board): she keeps her cats and her appeal to the Court of Cassation. Texts, legal notice and README follow.
- Characters page: more room between a camp's name and its motto.

## [3.0.2] — 2026-11-14

Polish. Saves are untouched.

### Changed

- **New photos** for François Hollande, Édouard Philippe, Emmanuel Macron, Bruno Retailleau, Éric Zemmour, Jean Lassalle, Philippe Poutou, Dominique de Villepin, Xavier Niel (the only free photo of him with his whole head is in black and white) and Squeezie. HugoDécrypte and Élise Lucet have no other free photo on Wikimedia Commons: theirs are framed again, tighter.
- **A countdown on every card** while it recharges: the seconds left, big, over the portrait.
- **Speech bubbles** are drawn in one outline with their tail: no more white line under the arrow.
- **Characters page**: names on two lines are spaced out and readable.

## [3.0.1] — 2026-11-14

Clearer faces, clearer bodies, clearer nights. Saves are untouched.

### Changed

- **Every head re-cut.** The cutter now separates the head from its background with GrabCut (two colour models and a minimum cut) instead of a colour flood: whole faces, hair included, a smooth outline and a thinner ink line. Three photos were replaced by sharper, front-facing ones (François Hollande, Dominique de Villepin, Xavier Niel). Heads are drawn bigger on the puppets.
- **One body for everybody, and the tie tells the role.** Every named figure wears the same dark suit; the colour of the tie is the family of the card — **yellow** for votes, **red** for attack, **purple** for effect, **blue** for defence. Guests come without a tie. The caricature bodies and their props (scarf, fist, cat, umbrella…) are gone.
- **The goal says what it is.** Each piece at the end of the lanes is now a card with a plain icon and its name written under it (PARRAINAGES, SUBVENTIONS, PORTABLES, COURSES, MICROS…). "PAC" is now "farm subsidies".
- **Nothing odd on the right of the board**: the fences, rails and barriers where the crowd comes in are gone (the floor simply fades out), as are the little doors at the far left. The hopscotch of the school yard is gone; the street's shops have signs (bakery, chemist, tobacconist…); the studio screens show a "DIRECT" tag. The sign bearer's sign says "NON".
- **The speed button shows the speed**: ▷ slow, ▶ normal, ▶▶ fast.
- **No full stop at the end of sentences** across the site and the game (the legal pages keep theirs).
- Figure pages: links to photos open in a new tab; more room between the stats and the camp's trump card; "The other figures" cards are all the same size, with bigger puppets and room under the title.

## [3.0.0] — 2026-11-14

Real faces, boss fights and nine themed nights. A smaller cast that everybody knows, ballots instead of endorsements, and a goal you can see at the end of every lane. The save format changes (version 4): older saves are converted, and every night keeps its stars.

### Added

- **Real photo heads.** Every public figure wears a real photo of their head — freely licensed, from Wikimedia Commons — cut out with a white sticker edge and placed on the drawn cardboard body. Bosses change face: smiling, **angry** while they announce an attack, **struggling** when they are losing. No face is retouched: each expression is another real photo (where none exists, a cartoon anger mark or sweat drops are drawn next to the head). `npm run heads` rebuilds them from `scripts/heads.json`; the authors and licences are listed in the legal notice and on each figure's page.
- **Boss fights.** The last figure of every camp marches against the others as a boss: drawn 40% bigger, with a long health bar over the stage and powers announced a second before they land (a red "!", the angry face, flashing squares, a warning for screen readers).
  - **Marine Le Pen**: lets her cats out; her **electronic tag** beeps the first time she comes too close and pulls her back; beaten once, she **appeals to the Court of Cassation** and gets back up with 40% of her credibility.
  - **Emmanuel Macron**: **"I cross the street"** into the next lane; **Dissolution** sends every figure on 3 × 3 squares back to the voters (half their cost back, cards ready).
  - **Jean-Luc Mélenchon**: **"La République, c'est moi !"** cuts every mic in front of him over three lanes; his **hologram** holds a rally in another lane.
  - **Teddy Riner**: **Ippon** throws the figure he faces; below half, his **last fight** makes him faster and harder.
  - **Donald Trump** doubles his tariffs (to +50%) once he is in trouble.
- **Xavier Niel**, guest boss of the school blockade: "Ping: 999 ms…", then every figure in three lanes freezes. His only line is his own public post of November 2024 ("Je t'attends !! T'es où ?!").
- **A goal at the end of every lane**, different every night — the endorsement forms, the farm subsidies, the confiscated phones, the full trolleys, the microphones, French cheese and wine, the ballot boxes, the debate notes, the presidential armchair, the budget. Five pieces, one per row: each opponent who gets through carries one away. The goal is announced at the start, shown on the calendar and read in the HUD.
- **Night 3, the school blockade** (a new school-yard stage with the national motto on its front): pupils want their phones back, electric scooters race in.
- **Night 4, the street against the cost of living**, after the 17 October 2026 protests: yellow vests, pupils, unions, burning bins, motorists, minimum-wage workers — and HugoDécrypte covering the march.
- **New extras**: the star cow of the Agricultural Show (slow and very tough) and the electric scooter (very fast, fragile). A school-blockade week in Cohabitation.
- **"New!" cards for the bosses**, with what they do against you.
- Two achievements: **1v1 at the Lidl** (send Xavier Niel away) and **Second Round** (beat Marine Le Pen after her appeal).

### Changed

- **A cast everybody knows: 20 figures**, five per camp (votes, attack, defence, a one-shot, the headliner). Fabien Roussel, Bruno Le Maire, Éric Ciotti and Marine Tondelier leave the line-ups; the substitutes (Cazeneuve, Lecornu, Bertrand, Arthaud) and the guests Sylvain Durif and David Lisnard leave the game. Ségolène Royal becomes the Left's defence (**"Fra-ter-ni-té !"** heals her neighbours) and Bruno Retailleau the Right's (**zero tolerance**: whoever comes near him slows down).
- **Ballots, not money**: the currency is now **ballots** ("bulletins de vote"), with a ballot-box icon; the card family "Money" becomes **Votes**. The family-benefits office becomes **proxy votes** (refused when a document is missing).
- **Plain titles**: under each headliner the home page shows their name; every title says who they are ("The President", "The leader of La France insoumise", "The RN candidate"…) instead of a nickname like "Jupiter".
- **One look per extra**: activists, sign bearers, pundits and the campaign bus no longer take the colour of the camp that sends them.
- **Nine nights instead of eight**: the street (now the 17th of October) and every later night move up one; the debate is night 8 and the run-off night 9. The daily challenge and duel codes cover nights 2 to 9.
- Hit flashes are lighter on photo faces, so that a boss stays recognisable under fire.
- The calendar shows each night's goal; the characters page, the figure pages and `llms.txt` describe the bosses' powers; the legal notice, privacy policy, accessibility statement, README and social cards are updated.

### Fixed

- The daily-challenge scores were never read back from the save (the date pattern was missing its backslashes): they now survive a reload.

## [2.0.0] — 2026-11-13

A new night, new ways to play, substitutes and a page for everyone. The save format changes (version 3): older saves are converted, and the run-off night keeps its stars as night 8.

### Added

- **Night 7, the run-off debate**: one rival heavyweight on set, and "soundbites" raining down on the board. Tap a soundbite (or press Enter on its square) before it lands to send it back: +15 endorsements and a blow to the frontmost opponent. Left alone, it silences the figure it lands on. The run-off is now night 8.
- **Daily challenge**: the same night, camp and waves for everybody on a given day, scored, with your best of the day on the calendar.
- **Turn-based duel**: play a match, then hand over on the same device or share a link (`?duel=…`); the second player plays the same match with the score to beat.
- **Head to head on one screen**: for three minutes, one player defends with the mouse or a finger, the other sends opponents from a budget that refills — with the left-hand keys (A Z E R T / Q S D F G on AZERTY, Q W E R T / A S D F G on QWERTY) or a column of buttons aligned with the lanes.
- **Substitutes**, one per camp, fielded from the calendar instead of a starter: Bernard Cazeneuve (the Method: a sentence that goes through two opponents) for Hollande, Sébastien Lecornu (No 49.3: the whole lane stops to negotiate) for Borne, Xavier Bertrand (Fully Comprehensive: neighbours take 30% less damage) for Ciotti, Nathalie Arthaud ("Working women, working men!") for Poutou. They also turn up among rival lieutenants.
- **14 achievements**, listed on the calendar and announced on the gazette.
- **News twists**: a march against the pension reform (a union marcher in every lane) and a rival 49.3 (the next wave comes at once), on the later nights; **themed weeks** every ten waves in Cohabitation (CNews, Zucman tax, strike, cost of living, farming).
- **Duos**: two neighbours of the same camp answer each other (Macron and Philippe, Le Pen and Bardella…).
- **Background music**, synthesised like the sound effects, with its own switch in the pause menu.
- **A page per character** (34) and **per night** (9), each with its own social card, linked from the characters page, the play page and the sitemap.
- **Accessibility**: a slow speed (×½), the S key reads a summary of the board, a long press on a card shows its full description.

### Changed

- Speech bubbles and names stay readable on phones (they no longer shrink with the board).
- Code: the share picture, the home-screen tip and the game modes live in their own modules; the game stylesheet is split in three; a test keeps the grid's CSS in step with the board geometry.
- README rewritten for 2.0: ways to play, controls, substitutes, privacy, and three new screenshots (the debate, head to head, a "New!" card).

## [1.5.0] — 2026-11-13

Easier to understand, nicer on phones, and something to share. Saves are kept (new settings are added with their defaults).

### Added

- **"New!" cards**: the first time a special opponent or guest turns up, the match stops for a short card — portrait, name, what it does. Each card appears once; Escape or "Got it!" resumes the match.
- **Who turns up each night** is listed on every calendar card (a guest who only comes against one camp is only listed for that camp).
- **Hard mode**, chosen on the calendar and remembered: every wave is 30% bigger. The reference bot still wins most nights, and loses a good share of the last ones.
- **Share the result**: the end-of-match gazette is drawn as a picture (headline, stars, figures, the camp's headliner) and handed to the system share sheet; elsewhere it is downloaded and the headline and link are copied.
- **Installable and offline**: a service worker keeps a copy of the game (pages, scripts, styles, fonts) so it opens and plays offline, especially from the home screen; on phones a dismissible tip explains how to add it (with an Install button where the browser offers one).
- **New endless record** is called out on the gazette.
- **Keyboard shortcuts** are listed in the pause menu, now that the board takes the whole screen.

### Changed

- **The whole width of a notched phone**: the pages use `viewport-fit=cover`; text and controls keep clear of the notch, and the board's scenery may run under it.
- **No more heads under the buttons**: on phones the top strip keeps room for the first lane's heads.
- The extras' descriptions now live in the game's dictionary, shared by the characters page and the "New!" cards.

## [1.4.0] — 2026-11-13

Bigger puppets, a board that reaches the edges of every screen, and four newcomers. Saves are untouched.

### Added

- **David Lisnard, "the Mayor of Cannes"**, declared candidate and guest of the Agricultural Show (and of Cohabitation), against every camp. He rolls out **the red carpet**: in his lane, opponents walking behind him move one and a half times faster. Tricolour sash included.
- **Union marchers** (no union in particular), in the street, the first round, the second round and Cohabitation: whoever they debate with **goes on strike** and does nothing for as long as they stand at its door.
- **Minimum-wage workers**, everybody's favourite voter, in the street, the first round and Cohabitation: they do not stop to debate, they cross the courtyard to go and vote. Win one over on the way and he brings **15 endorsements** ("One more vote!"); let him reach the steps and you lose a poll point.
- **The Zucman tax** comes back to the vote now and then while CAC 40 bosses stand in the courtyard (the debate set, the summit, Cohabitation). One time in two it passes: each boss pays his share (+25 endorsements) and leaves into tax exile; otherwise, "Zucman tax rejected".
- All four appear in the characters page, the cast sheet, `llms.txt` and the legal notice.

### Changed

- **Bigger puppets**: every figure and opponent on the board is drawn 25% bigger (vehicles excepted), with sharper bitmaps on large, dense screens.
- **Edge to edge on every landscape screen**: the side layout (tickets on the left, board over the rest, controls on the scenery) is now used on laptops and monitors too, not only on phones and short windows. The scene goes on to the left of the steps (more of the building's front), so a wide screen shows more of it instead of a dark margin; tickets and controls grow with the screen. Upright windows keep the toolbar above the board.
- **Slimmer tickets on phones**: smaller portraits and shorter tickets.
- **Closed lanes are a public garden** (striped lawn, hedges, flowers) instead of a lawn covered with dark blotches.

## [1.3.0] — 2026-11-13

A guest who follows the money, a broadcast van that never runs out of pundits, and a bigger board on phones. Saves are untouched.

### Added

- **Élise Lucet, "the Investigator"**, guest of the first round (and of Cohabitation). She questions every camp the same way and follows the money: she walks straight past defenders and attackers to the figures that bring in endorsements, and while the interview lasts ("No comment!") they bring in nothing.
- **The CNews broadcast van**, on the TV debate set, in the second round and in Cohabitation: slow, unmoved by roaring, and it drops off a fresh pundit every 4.5 seconds. "Off air!" when it is stopped.
- Both appear in the characters page, the cast sheet, `llms.txt` and the legal notice (a television journalist and a rolling-news channel, shown against every camp alike; no channel logo is reproduced).

### Changed

- **A bigger board on phones**: the phone layout now crops the scenery around the courtyard (part of the building on the left, the end of the street on the right and, on short screens, some sky) instead of shrinking the whole picture. Squares are about 12% bigger each way. Captions and speech bubbles stay inside the visible part.

### Fixed

- **No more zooming by accident on iPhone**: two quick taps (a card, then a square) were read by Safari as a double-tap and zoomed the page. The whole game opts out of double-tap zoom; pinch-to-zoom still works.

## [1.2.0] — 2026-11-12

One look — dark — and a phone layout redrawn from scratch. Saves are untouched.

### Added

- **A new phone layout**, the way lane-defense games do it on mobile: the purse and a column of tickets on the left (portrait, surname, price and the family of the card written in full), the board over the whole height, the controls laid over the top of the scenery and a line under the last lane that describes the card just picked. Tickets and buttons grow with the screen.
- **The same layout on short, wide windows** (a small laptop, a browser with many toolbars): the board is about twice as wide as it used to be there.
- **Removal mode you cannot miss**: the board dims, every figure is washed out and gets a pulsing ✕, a red frame beats around the board and a ribbon says what the next tap does (on phones the toolbar says it, in place of the trump card and the polls).

### Changed

- **Dark only.** The night-blue look is now the only one: the light theme, the automatic mode, the theme button and its `localStorage` key are gone. The social card and the cast sheet follow.
- **"Reshuffle" is now "Remove"** ("Retirer"), with a bin icon: nobody understood the old name.
- Sharper pictures: card portraits are plain vectors at any size, and the board is drawn at up to 3× (it stopped at 2×) on dense phone screens.
- Desktop toolbar: cards share the width that is left instead of pushing the buttons to a second line; on shorter windows the toolbar takes two tidy rows and the board gives up the height of one, so the match fits the window; starting a match brings the board into view.
- Long captions near the edge of the board ("Family-benefit transfer: +50") are kept whole instead of being cut by the frame.

### Fixed

- "Back to the calendar" was unreadable on hover (dark text on a dark button).
- A long title word ("Confidentialité" at 320 px) could widen the page until the display font had loaded.
- In full screen on a phone held sideways, the last card of the column was cut by the bottom of the screen.

## [1.1.0] — 2026-11-12

A fourth camp, the news of the day, catchphrases and six stage sets. Existing saves are migrated to the new seven-level campaign.

### Added

- **A fourth playable camp, "the Others"**: Brigitte Macron (Yellow Coins), Dominique de Villepin (the UN Speech), Jean Lassalle (Résistons!), Marine Tondelier (Zone 30), Philippe Poutou (No Immunity for Workers) and Teddy Riner (Ippon), with their own trump card, the **No-Confidence Vote**.
- **Two new figures on the Left**: Raphaël Glucksmann (the Public Square) and Ségolène Royal (Bravitude). Tondelier and Poutou move to the Others.
- **Catchphrases**: every figure speaks in speech bubbles, in French and English — famous public lines ("De la poudre de perlimpinpin", "La République, c'est moi !", "Ils sont là, dans les campagnes…", "Friendly, François") alongside invented ones. Screen readers hear a figure's line when it is placed.
- **Street events**: high-school students on a blockade, yellow vests, burning bins that scorch nearby figures, and motorists who race in and then run out of petrol.
- **Farmers**: pitchforks on foot and tractors whose engines drown out every speech, at the Agricultural Show and beyond.
- **Money matters**: a tax inspector who withholds endorsements at source while he is on the board, CAC 40 bosses who bring their own pundits, and family-benefit transfers that pay out from time to time — when the file is complete.
- **Guests**: Donald Trump arrives at the international summit with his tariffs (every card costs 25% more while he is on the board); HugoDécrypte asks one question of every camp on the debate set; Squeezie rallies his followers, against the Right only, in line with his public stance of 2024; Sylvain Durif hunts for his 500 endorsements, pan flute in hand.
- **Card types**: every card is tagged Money, Attack, Effect or Defence, in words and in colour, in the game and on the characters page.
- **Reinforcements shared by every camp**: a riot police line that checks papers (stuns whoever is in contact) and a fire brigade whose hose puts out fires and pushes a whole lane back.
- **Two new levels**, "The Street Rumbles" and "The International Summit": the campaign now has seven nights.
- **Six stage sets**: village square, Agricultural Show, street, TV studio, international summit, and the Élysée at dusk and at night.
- **Forced landscape on phones**: the match goes fullscreen and locks to landscape where the browser allows it; elsewhere it is drawn a quarter turn round so the phone has to be turned. Cards sit in a column on the left of the board. A switch in the pause menu releases the orientation.
- **Security**: HSTS and a header-level CSP baseline, `GET`/`HEAD` only, `security.txt`, a slimmer nginx base image with security upgrades applied at build time, and a browser test that fails on any third-party request or cookie.

### Changed

- Portraits redrawn to be more recognisable: new hairstyles, noses, eyes, eyebrows, jaws and outfits (judogi, beret, tailored jackets), plus a signature prop for everyone.
- Up to eight cards in the toolbar (keys `1`–`8`); the toolbar adapts to its own width with container queries.
- A card's accessible name is now its visible surname, with the full description attached separately.
- Result headlines reworded so they read correctly for every camp name.

## [1.0.0] — 2026-11-12

First public release.

### Game

- Lane-defense match on a 5 × 9 courtyard, with a deterministic simulation independent from rendering.
- Three playable camps — the Left, the Centre and the Right — each facing the other two.
- 18 headline figures (six per camp), each with a distinct power:
  - **Left:** Poutou, Hollande, Roussel, Tondelier, Ruffin, Mélenchon
  - **Centre:** Bayrou, Attal, Philippe, Le Maire, Borne, Macron
  - **Right:** Sarkozy, Bardella, Ciotti, Retailleau, Zemmour, Le Pen
- Every figure can also march against the player, with its own behaviour (summoner, ranged, tank, one-shot blast, microphone cut).
- Five anonymous extras: activist, sign bearer, pundit, campaign bus and cat.
- One campaign trump card per camp: General Strike, Dissolution, Trocadéro Rally.
- Five-level campaign with progressive unlocks and star ratings, plus the endless "Cohabitation" mode.
- "Reshuffle" tool to remove a figure with a 25% refund, ×2 speed, pause.
- Satirical newspaper front page as the result screen.
- Progress, settings and records saved locally in the browser.
- Synthesised sound effects (Web Audio), muted with one button.

### Site

- Home, Play and Characters pages in French and English with localised URLs.
- Legal notice, privacy policy, terms of use and accessibility statement in both languages.
- Light, dark and automatic themes.
- Original paper-puppet artwork generated as SVG by code.

### SEO

- Canonical URLs, `hreflang` alternates, Open Graph and Twitter cards, web manifest and icons.
- JSON-LD structured data: `WebSite`, `VideoGame`, `FAQPage`, `BreadcrumbList`, `ItemList`.
- `sitemap.xml` with language alternates, `robots.txt` welcoming AI crawlers.
- `llms.txt` and `llms-full.txt` generated from the game data.

### Accessibility

- The whole game is playable with the keyboard; every courtyard square is a real button.
- Live announcements for waves, lost poll points, incoming heavyweights and results.
- Reduced-motion support, no full-screen flash, sound cues doubled visually.
- Reflows down to 320 px; dedicated layout for phones held sideways.

### Infrastructure

- Static build served by an unprivileged, read-only nginx container.
- `docker-compose.yml` ready for Coolify, with a local override for Docker Desktop.
- Per-page Content-Security-Policy with hashes, strict security headers, no access log.
- 32 simulation tests (including a balance check for every level and camp) and 121 browser tests (axe-core, SEO, keyboard play, layout).
