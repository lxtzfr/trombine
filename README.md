# Trombine

Génère une planche de photos d'identité prête à imprimer sur une feuille A4.

- Format officiel 35 × 45 mm, visage de 32 à 36 mm du menton au sommet du crâne
- Plusieurs personnes par planche, nombre d'exemplaires par personne
- Recadrage avec repères (menton, sommet du crâne), rotation et redressement
- Export PDF ou PNG, traits de coupe en option
- Tout se passe dans le navigateur : les photos ne sont jamais envoyées à un serveur,
  et la planche est conservée localement (IndexedDB)

## Développement

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

TanStack Start, Mantine, icônes Tabler.

## Impression

Imprimer à 100 % (« taille réelle »), sans « ajuster à la page », sinon les photos
ne font plus 35 × 45 mm.
