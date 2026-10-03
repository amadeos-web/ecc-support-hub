/**
 * OBSERVATIONS FRESHDESK — générées depuis l'analyse de l'export (01/04/2026 → 02/10/2026, 1 267 tickets).
 * Numéros de tickets uniquement (aucune donnée personnelle). Fichier régénérable sans toucher aux procédures.
 */
export interface FreshdeskObservation {
  frequency: number;
  lastObserved: string;
  tickets: number[];
}

export const freshdeskObservations: Record<string, FreshdeskObservation> = {
  'cas-acces-v2-non-recu': { frequency: 164, lastObserved: '2026-09-26', tickets: [99, 100, 101, 107, 108, 123, 126, 130, 133, 136, 137, 142, 145, 148, 150, 152, 154, 160, 161, 165, 172, 173, 175, 178, 181, 185, 189, 194, 196, 197, 198, 201, 203, 205, 210, 213, 223, 226, 228, 233, 235, 238, 249, 250, 256, 260, 261, 265, 266, 269, 271, 275, 278, 279, 280, 288, 289, 291, 292, 294, 298, 305, 310, 318, 324, 326, 333, 335, 336, 339, 347, 348, 351, 353, 360, 363, 368, 371, 373, 374, 376, 380, 388, 389, 390, 393, 397, 403, 409, 414, 417, 445, 446, 447, 462, 467, 479, 598, 607, 630, 643, 654, 693, 702, 703, 704, 705, 706, 707, 708, 709, 713, 730, 731, 732, 736, 738, 772, 780, 786, 797, 800, 801, 813, 815, 819, 822, 825, 838, 845, 846, 852, 861, 887, 889, 943, 954, 965, 966, 974, 980, 1004, 1022, 1045, 1056, 1067, 1072, 1078, 1080, 1107, 1122, 1127, 1131, 1166, 1167, 1184, 1202, 1211, 1243, 1248, 1281, 1325, 1335, 1339] },
  'cas-invitation-whop-0usd': { frequency: 13, lastObserved: '2026-07-21', tickets: [287, 344, 355, 357, 410, 494, 661, 983, 1052, 1062, 1135, 1142, 1145] },
  'cas-whop-payant-v1': { frequency: 86, lastObserved: '2026-09-21', tickets: [129, 147, 158, 159, 162, 171, 182, 192, 193, 195, 202, 215, 219, 236, 237, 242, 251, 252, 267, 272, 277, 283, 296, 299, 301, 302, 315, 322, 334, 350, 362, 367, 377, 386, 398, 420, 427, 428, 429, 432, 439, 441, 533, 549, 575, 588, 593, 603, 613, 626, 631, 633, 634, 640, 664, 701, 728, 735, 741, 759, 770, 777, 778, 783, 791, 803, 826, 839, 894, 903, 926, 958, 986, 992, 998, 999, 1001, 1033, 1049, 1066, 1101, 1116, 1229, 1258, 1276, 1318] },
  'cas-acces-actif-mauvais-compte': { frequency: 11, lastObserved: '2026-05-20', tickets: [163, 183, 217, 220, 259, 273, 623, 733, 764, 774, 816] },
  'cas-absent-base-kyc': { frequency: 12, lastObserved: '2026-08-07', tickets: [134, 364, 369, 617, 697, 718, 754, 788, 993, 1031, 1182, 1189] },
  'cas-verification-kyc': { frequency: 15, lastObserved: '2026-09-29', tickets: [122, 199, 253, 325, 395, 405, 527, 886, 929, 1096, 1255, 1282, 1334, 1337, 1352] },
  'cas-desabonnement-accidentel': { frequency: 24, lastObserved: '2026-07-09', tickets: [141, 143, 157, 166, 167, 174, 179, 191, 204, 206, 212, 214, 216, 221, 222, 230, 232, 330, 365, 399, 765, 862, 977, 1121] },
  'cas-acces-perdu-appareil': { frequency: 12, lastObserved: '2026-09-24', tickets: [128, 146, 909, 1036, 1037, 1038, 1103, 1272, 1274, 1275, 1311, 1331] },
  'cas-acces-retire-sans-explication': { frequency: 10, lastObserved: '2026-09-23', tickets: [419, 454, 481, 496, 511, 637, 678, 715, 722, 1328] },
  'cas-defaut-paiement': { frequency: 11, lastObserved: '2026-09-26', tickets: [321, 387, 495, 833, 925, 1028, 1181, 1217, 1332, 1333, 1340] },
  'cas-probleme-echeancier': { frequency: 9, lastObserved: '2026-09-15', tickets: [627, 812, 829, 831, 1016, 1086, 1175, 1205, 1313] },
  'cas-preuve-virement': { frequency: 2, lastObserved: '2026-08-28', tickets: [379, 1254] },
  'cas-date-prelevement': { frequency: 3, lastObserved: '2026-06-19', tickets: [406, 672, 1030] },
  'cas-remboursement': { frequency: 10, lastObserved: '2026-09-21', tickets: [140, 155, 361, 1102, 1148, 1163, 1196, 1201, 1249, 1319] },
  'cas-lecture-videos': { frequency: 19, lastObserved: '2026-08-19', tickets: [168, 200, 209, 234, 257, 293, 316, 328, 808, 811, 821, 900, 917, 923, 1137, 1157, 1158, 1191, 1223] },
  'cas-video-telephone': { frequency: 2, lastObserved: '2026-05-20', tickets: [442, 820] },
  'cas-plusieurs-appareils': { frequency: 14, lastObserved: '2026-09-09', tickets: [144, 297, 307, 490, 546, 670, 782, 945, 1073, 1155, 1171, 1187, 1193, 1290] },
  'cas-niveau-advanced': { frequency: 5, lastObserved: '2026-04-22', tickets: [255, 276, 359, 424, 483] },
  'cas-utilisation-circle': { frequency: 3, lastObserved: '2026-08-07', tickets: [244, 248, 1190] },
  'cas-double-acces': { frequency: 18, lastObserved: '2026-09-09', tickets: [96, 121, 127, 149, 156, 184, 187, 263, 286, 411, 542, 792, 857, 897, 919, 1159, 1208, 1289] },
  'cas-membre-non-identifie': { frequency: 13, lastObserved: '2026-09-20', tickets: [188, 211, 375, 438, 493, 681, 683, 893, 1129, 1144, 1174, 1302, 1316] },
  'cas-facture': { frequency: 10, lastObserved: '2026-09-02', tickets: [396, 652, 711, 963, 1008, 1138, 1140, 1146, 1203, 1269] },
  'cas-devis': { frequency: 2, lastObserved: '2026-06-21', tickets: [1026, 1042] },
  'cas-attestation': { frequency: 1, lastObserved: '2026-08-25', tickets: [1244] },
  'cas-autre-bug': { frequency: 2, lastObserved: '2026-05-10', tickets: [488, 700] },
  'cas-hors-sujet': { frequency: 52, lastObserved: '2026-09-26', tickets: [102, 180, 303, 313, 314, 320, 327, 358, 456, 503, 513, 518, 537, 589, 648, 719, 766, 851, 863, 865, 883, 908, 924, 959, 975, 1011, 1047, 1065, 1071, 1076, 1082, 1128, 1132, 1133, 1136, 1147, 1173, 1176, 1179, 1188, 1192, 1198, 1210, 1224, 1234, 1242, 1286, 1294, 1308, 1321, 1336, 1342] },
  'cas-prospect': { frequency: 3, lastObserved: '2026-05-06', tickets: [525, 541, 650] },
};
