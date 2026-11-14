---
title: Déclaration d'accessibilité
---

## Engagement

L'auteur s'engage à rendre **politique2027.mbonnici.fr** accessible au plus grand nombre, dans l'esprit de l'article 47 de la loi n° 2005-102 du 11 février 2005. Ce site est un projet personnel : il n'est pas soumis à l'obligation légale de publier une déclaration, qui est donc établie volontairement.

Elle couvre l'ensemble des pages publiques du site, jeu compris.

## État de conformité

Le site est **partiellement conforme** au RGAA version 4.1.2 et aux WCAG 2.2 niveau AA.

Les pages de contenu (accueil, personnages, pages légales) ne présentent pas de non-conformité connue. Le jeu, par nature visuel et en temps réel, comporte les limites décrites plus bas. Aucun audit complet des 106 critères du RGAA n'a été réalisé : le site ne peut donc pas être déclaré totalement conforme.

## Résultats des tests

Il s'agit d'une auto-évaluation réalisée par l'éditeur, sans audit par un tiers.

- **Tests automatiques** : axe-core, piloté par Playwright, sur toutes les pages publiques en français et en anglais, ainsi que sur les écrans du jeu (choix du camp, calendrier, partie en cours, pause). Aucune erreur détectée.
- **Vérifications complémentaires**, elles aussi automatisées : parcours au clavier seul (choix du camp, lancement d'une partie, placement et retrait d'une figure, pause), redistribution du contenu à 320 pixels de large et à l'équivalent d'un zoom 200 %, affichage sur téléphone tenu à l'horizontale, prise en compte de la préférence « réduire les animations ».

Le site n'a pas encore été testé avec un lecteur d'écran par une personne qui l'utilise au quotidien. Aucun taux de conformité global n'a été calculé, faute d'audit complet.

## Ce que le jeu fait pour être accessible

- **Clavier** : toutes les actions passent par de vrais boutons. Touches 1 à 7 pour choisir une figure, flèches pour se déplacer sur le terrain, Entrée ou Espace pour placer, R, U, P, F et M pour les outils. Les raccourcis ne s'activent que lorsque le focus est dans le jeu.
- **Lecteurs d'écran** : chaque case du terrain est un bouton qui décrit son contenu (figure présente, crédibilité, nombre d'adversaires dans le couloir). Les vagues, les pertes de points, les arrivées de ténors, les droits de douane et la fin de partie sont annoncés dans des zones dynamiques ; la réplique d'une figure est lue quand on la place.
- **Orientation** : sur téléphone, la partie s'affiche par défaut en paysage (tournée d'un quart de tour si l'appareil est tenu droit). Ce comportement se désactive d'un bouton dans le menu pause : le jeu suit alors l'orientation de l'appareil.
- **Zoom** : le zoom à deux doigts reste toujours possible. Seul le zoom par double tap est désactivé dans le jeu, pour qu'un enchaînement rapide de touchers (une carte, puis une case) n'agrandisse pas la page par erreur.
- **Nouveaux adversaires** : la première fois qu'un adversaire spécial apparaît, la partie s'arrête et une fenêtre de dialogue présente son effet en texte ; le focus va sur le bouton « Compris ! », Échap la ferme et la partie reprend. Chaque fiche n'apparaît qu'une fois.
- **Raccourcis clavier** : ils sont rappelés dans le menu pause (touche P ou Échap). La touche S lit un résumé du terrain (bulletins, objectif restant, adversaires par couloir). Les attaques des boss sont annoncées aux lecteurs d’écran dès qu’elles se préparent, avant de frapper.
- **Rythme** : la partie se met en pause à tout moment, et une vitesse lente (×½) s'ajoute à la vitesse normale et rapide (bouton ou touche F).
- **Débat** : les « petites phrases » du débat se renvoient en activant leur case (clic, toucher ou Entrée) ; chacune est annoncée avec sa position.
- **Fiches des cartes** : sur écran tactile, un appui long sur une carte affiche sa description complète ; au clavier et avec un lecteur d'écran, la même description est associée à la carte.
- **À deux sur un écran** : l'attaque se joue entièrement au clavier (touches de gauche) ou avec des boutons, la défense à la souris ou au doigt.
- **Difficulté** : un mode « Difficile » est proposé sur le calendrier ; le mode normal reste celui par défaut.
- **Types de cartes** : chaque carte porte son type (Argent, Attaque, Effet, Défense) en toutes lettres, en plus de la couleur.
- **Mouvement** : avec le réglage système « réduire les animations », les tremblements d'écran sont supprimés et les effets sont atténués. Aucun flash plein écran n'est utilisé.
- **Couleurs** : le site n'a qu'un thème, sombre, dont les contrastes sont vérifiés. Les camps se distinguent par leur nom et pas seulement par leur couleur ; l'information de danger est doublée d'une annonce.
- **Son** : aucun son ne démarre sans action de votre part, il se coupe d'un bouton, et chaque signal sonore a un équivalent visuel et textuel.
- **Rythme** : la pause est disponible à tout moment (elle s'active seule quand vous changez d'onglet) et la vitesse rapide est facultative.

## Contenus non accessibles

### Non-conformités

- **Zone de jeu en `<canvas>`** : la position exacte des adversaires en mouvement n'est restituée aux lecteurs d'écran que sous forme résumée (nombre d'adversaires par couloir, annonces d'événements). L'équivalent textuel n'est donc pas complet.
- **Jeu en temps réel** : une partie impose de réagir dans un temps limité. La pause permet de s'interrompre, mais pas de préparer ses placements à l'arrêt.

### Dérogations pour charge disproportionnée

Aucune dérogation n'est invoquée.

### Contenus non soumis à l'obligation

Les sites tiers vers lesquels le site renvoie (GitHub, site de l'auteur) sont hors du périmètre de cette déclaration.

## Établissement de cette déclaration

- Déclaration établie le 12 novembre 2026 avec la version 1.0.0, mise à jour avec la version 2.0.0.
- Technologies utilisées : HTML, CSS, JavaScript (Astro), SVG, Canvas et Web Audio.
- Environnement de test : navigateur Chromium récent piloté par Playwright, en affichage ordinateur et mobile.

## Retour d'information et contact

Si vous n'arrivez pas à accéder à un contenu ou à une fonctionnalité, écrivez à l'auteur par le [formulaire de contact](https://mbonnici.fr/fr/contact). Il vous orientera vers une alternative ou adaptera le site, et vous répondra dans les meilleurs délais.

## Voies de recours

Si vous constatez un défaut d'accessibilité qui vous empêche d'accéder à un contenu, que vous l'avez signalé et que vous n'avez pas obtenu de réponse satisfaisante, vous pouvez :

- écrire un message au [Défenseur des droits](https://formulaire.defenseurdesdroits.fr/) ;
- contacter le [délégué du Défenseur des droits dans votre région](https://www.defenseurdesdroits.fr/saisir/delegues) ;
- envoyer un courrier par la poste (gratuit, sans timbre) : Défenseur des droits, Libre réponse 71120, 75342 Paris CEDEX 07.
