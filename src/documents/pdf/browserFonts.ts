import garamond400 from './fonts/EBGaramond_400Regular.ttf?url';
import garamond500 from './fonts/EBGaramond_500Medium.ttf?url';
import didact from './fonts/DidactGothic_400Regular.ttf?url';
import inter from './fonts/Inter_400Regular.ttf?url';
import { registerPdfFonts } from './fonts';

/** Polices servies localement par l'application (aucun CDN). */
export const registerBrowserFonts = () =>
  registerPdfFonts({ 'EB Garamond': { 400: garamond400, 500: garamond500 }, 'Didact Gothic': { 400: didact }, Inter: { 400: inter } });
