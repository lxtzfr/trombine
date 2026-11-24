# Trombine

Génère des planches de photos prêtes à imprimer.

- Format des photos au choix : identité (35 × 45 mm avec repères de visage, passeport US,
  Canada, Chine…), tirages (9 × 13, 10 × 15, 13 × 18…), carrés, ou dimensions libres
- Format de la feuille au choix : A4, A3, A5, US Letter / Legal, tirages photo
  (10 × 15, 13 × 18…), ou dimensions libres ; portrait ou paysage
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
n'ont plus la bonne taille.
