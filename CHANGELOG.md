# Changelog

All notable changes to Politique 2027 are listed here, newest first.

Versions follow **`MAJOR.MEDIUM.MINOR`**:

| Part | Bumped when | Example |
|---|---|---|
| **MAJOR** | The game changes in a way players notice immediately or that breaks saved progress: new core mechanic, reworked campaign, new save format | `1.4.2 → 2.0.0` |
| **MEDIUM** | Something is added without breaking anything: a character, a level, a mode, a language, a page | `1.0.3 → 1.1.0` |
| **MINOR** | Fixes and polish: bug fix, balance tweak, wording, accessibility or performance improvement | `1.0.0 → 1.0.1` |

When a version is released, update `version` in `package.json` and `updated` in `src/config/site.ts` (both are shown in the footer and the legal pages).

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
