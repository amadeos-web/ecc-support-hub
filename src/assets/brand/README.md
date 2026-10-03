# Éléments de marque de la facture

Déposer ici les fichiers officiels ECC, puis les référencer dans `src/data/invoiceBrand.ts` :

- logo : PNG (fond transparent) ou JPEG, idéalement 600 px de large minimum ;
- texture de bandeau (haut / bas de page) : PNG ou JPEG très clair, ~2480 × 240 px.

Exemple dans `invoiceBrand.ts` :

```ts
import logo from '../assets/brand/logo-ecc.png?url';
import texture from '../assets/brand/texture-marbre.jpg?url';
// logo: { src: logo, ... }, band: { texture, ... }
```
