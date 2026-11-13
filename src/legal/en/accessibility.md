---
title: Accessibility statement
---

## Commitment

The author is committed to making **politique2027.mbonnici.fr** accessible to as many people as possible, in the spirit of Article 47 of French law no. 2005-102 of 11 February 2005. This site is a personal project: it is not legally required to publish a statement, so this one is made voluntarily.

It covers every public page of the site, including the game.

## Conformance status

The site is **partially compliant** with RGAA version 4.1.2 (the French accessibility standard) and with WCAG 2.2 level AA.

The content pages (home, characters, legal pages) have no known non-conformity. The game, which is visual and real-time by nature, has the limits described below. No full audit of the 106 RGAA criteria has been carried out, so the site cannot be declared fully compliant.

## Test results

This is a self-assessment by the publisher, with no third-party audit.

- **Automated tests**: axe-core, driven by Playwright, on every public page in French and English, and on the game screens (camp choice, calendar, match in progress, pause). No error detected.
- **Additional checks**, also automated: a keyboard-only journey (choosing a camp, starting a match, placing and removing a figure, pausing), reflow at 320 pixels wide and at the equivalent of 200% zoom, display on a phone held sideways, and support for the "reduce motion" preference.

The site has not yet been tested with a screen reader by someone who uses one every day. No overall conformance rate has been calculated, for lack of a full audit.

## What the game does to be accessible

- **Keyboard**: every action goes through real buttons. Keys 1 to 8 pick a figure, arrows move around the field, Enter or Space places, and R, U, P, F and M drive the tools. Shortcuts only work while focus is inside the game.
- **Screen readers**: each square of the field is a button that describes its content (figure present, credibility, number of opponents in the lane). Waves, lost points, incoming heavyweights, tariffs and the end of the match are announced in live regions; a figure's catchphrase is read out when it is placed.
- **Orientation**: on a phone the match is shown in landscape by default (turned a quarter turn if the device is held upright). One button in the pause menu switches this off: the game then follows the device's orientation.
- **Zoom**: pinch-to-zoom always works. Only double-tap zoom is turned off inside the game, so that two quick taps (a card, then a square) do not enlarge the page by accident.
- **Card types**: every card carries its type (Money, Attack, Effect, Defence) in words as well as in colour.
- **Motion**: with the system "reduce motion" setting, screen shake is removed and effects are toned down. No full-screen flash is used.
- **Colour**: the site has a single, dark theme, whose contrast is checked. Camps are told apart by name and not by colour alone; danger information is backed by an announcement.
- **Sound**: no sound starts without an action from you, one button mutes it, and every audio cue has a visual and textual equivalent.
- **Pace**: pause is available at any time (it triggers by itself when you switch tabs) and the fast speed is optional.

## Content that is not accessible

### Non-conformities

- **`<canvas>` play area**: the exact position of moving opponents is only conveyed to screen readers in summary form (number of opponents per lane, event announcements). The text alternative is therefore not complete.
- **Real-time game**: a match requires reacting within a limited time. Pause lets you stop, but not plan your placements while stopped.

### Disproportionate burden

No exemption is claimed.

### Content outside the scope

Third-party sites the site links to (GitHub, the author's website) are outside the scope of this statement.

## Preparation of this statement

- Statement prepared on 12 November 2026 with version 1.0.0, updated with version 1.4.0.
- Technologies used: HTML, CSS, JavaScript (Astro), SVG, Canvas and Web Audio.
- Test environment: a recent Chromium browser driven by Playwright, in desktop and mobile layouts.

## Feedback and contact

If you cannot access a piece of content or a feature, write to the author through the [contact form](https://mbonnici.fr/en/contact). He will point you to an alternative or adapt the site, and reply as soon as possible.

## Enforcement

If you notice an accessibility defect that prevents you from accessing content, have reported it and have not received a satisfactory answer, you may:

- send a message to the [Défenseur des droits](https://formulaire.defenseurdesdroits.fr/) (the French rights ombudsman);
- contact the [Défenseur des droits delegate in your region](https://www.defenseurdesdroits.fr/saisir/delegues);
- send a letter by post (free of charge, no stamp needed): Défenseur des droits, Libre réponse 71120, 75342 Paris CEDEX 07, France.
