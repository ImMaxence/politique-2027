# Changelog

All notable changes to Politique 2027 are listed here, newest first.

Versions follow **`MAJOR.MEDIUM.MINOR`**:

| Part | Bumped when | Example |
|---|---|---|
| **MAJOR** | The game changes in a way players notice immediately or that breaks saved progress: new core mechanic, reworked campaign, new save format | `1.4.2 → 2.0.0` |
| **MEDIUM** | Something is added without breaking anything: a character, a level, a mode, a language, a page | `1.0.3 → 1.1.0` |
| **MINOR** | Fixes and polish: bug fix, balance tweak, wording, accessibility or performance improvement | `1.0.0 → 1.0.1` |

When a version is released, update `version` in `package.json` and `updated` in `src/config/site.ts` (both are shown in the footer and the legal pages).

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
