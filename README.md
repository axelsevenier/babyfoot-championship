# ⚽ Championnat Babyfoot

Site web pour gérer un championnat de babyfoot en entreprise. Remplace le fichier Excel.

## Fonctionnalités

- **Classement général** — cumul de toute la saison avec podium
- **Saisir un match** — formulaire 2v2 avec score et date
- **Classements mensuels** — classement par mois (minimum 3 matchs)
- **Historique** — tous les matchs filtrables par mois ou joueur
- **Analyse des duos** — équilibrage des coéquipiers (URGENT / Rattraper)
- **Gestion des joueurs** — ajout / suppression

## Données

Les données sont sauvegardées dans le `localStorage` du navigateur. Elles persistent entre les sessions sur le même appareil/navigateur. Les données de mai et juin 2025 sont pré-chargées au premier lancement.

## Déploiement sur GitHub Pages (gratuit)

### 1. Créer le repo

```bash
git init
git add .
git commit -m "Initial commit — Championnat Babyfoot"
```

### 2. Pousser sur GitHub

```bash
gh repo create championnat-babyfoot --public --source=. --push
```

Ou manuellement :
1. Créer un repo sur [github.com](https://github.com/new)
2. Copier les commandes affichées et les lancer

### 3. Activer GitHub Pages

1. Aller dans **Settings > Pages** du repo
2. Source : **Deploy from a branch**
3. Branch : `main` / `(root)`
4. Cliquer **Save**

Le site sera disponible sur : `https://[ton-username].github.io/championnat-babyfoot/`

## Structure des fichiers

```
index.html   — Structure HTML
style.css    — Styles
app.js       — Logique applicative
README.md    — Ce fichier
```

## Tech stack

- HTML / CSS / JavaScript vanilla
- Aucune dépendance
- Hébergement 100% gratuit via GitHub Pages
