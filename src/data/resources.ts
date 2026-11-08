/**
 * RESSOURCES — documents prêts à partager avec les membres (téléchargeables depuis la page « Resources »).
 * Les documents eux-mêmes sont en français (destinés aux membres) ; les libellés de la page sont en anglais (agent).
 * Pour ajouter une ressource : déposer le fichier dans src/assets/resources/ et l'ajouter ici.
 */
import guideWhopPdf from '../assets/resources/Guide-acces-Whop-ECC.pdf?url';
import guideWhopCover from '../assets/resources/guide-whop-cover.jpg';

export interface Resource {
  id: string;
  title: string;
  description: string;
  /** Format affiché à l'agent (ex. « PDF · French · 6 pages »). */
  meta: string;
  fileUrl: string;
  fileName: string;
  cover?: string;
}

export const resources: Resource[] = [
  {
    id: 'guide-whop',
    title: 'Whop access guide',
    description: 'Step-by-step guide for members: logging in to Whop, finding the ECC course, and fixing common problems. Attach it to your reply when a member cannot find their way on Whop.',
    meta: 'PDF · French · 6 pages',
    fileUrl: guideWhopPdf,
    fileName: 'Guide-acces-Whop-ECC.pdf',
    cover: guideWhopCover,
  },
];
