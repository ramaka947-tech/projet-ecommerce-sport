import type { Company } from './company';
import type { LegalDocument } from './types';

export const cookies = (C: Company): LegalDocument => ({
  title: 'Politique de cookies',
  description: `Politique de cookies et traceurs de ${C.name}.`,
  sections: [
    {
      title: 'Qu’est-ce qu’un cookie ?',
      content: `Un cookie est un petit fichier enregistré sur votre appareil lorsque vous consultez un site. Il permet de mémoriser des informations (panier, préférences) ou de mesurer l’audience. Le terme « cookies » désigne ici aussi les traceurs similaires, comme le stockage local du navigateur.
Dernière mise à jour : ${C.lastUpdate}.`,
    },
    {
      title: 'Ce que nous utilisons',
      content: `Le site utilise uniquement des cookies et traceurs nécessaires à son fonctionnement :
• Panier : conserver vos articles, tailles, couleurs et quantités pendant votre visite
• Commande : permettre la saisie et la validation de votre commande
• Sécurité : protéger les formulaires et la session de l’espace d’administration
• Application : mémoriser votre choix d’installer le site sur votre téléphone

Ces traceurs ne nécessitent pas votre consentement car ils sont indispensables au service que vous demandez.`,
    },
    {
      title: 'Mesure d’audience et publicité',
      content: `Nous n’utilisons pas de cookies publicitaires. Si nous ajoutons un jour un outil de mesure d’audience ou de marketing, cette page sera mise à jour et votre accord sera demandé avant tout dépôt de cookie non nécessaire.`,
    },
    {
      title: 'Gérer vos préférences',
      content: `Vous pouvez à tout moment supprimer ou bloquer les cookies dans les paramètres de votre navigateur (Chrome, Firefox, Safari, Edge). Bloquer les cookies nécessaires peut empêcher le bon fonctionnement du panier et de la commande.`,
    },
    {
      title: 'Durée de conservation',
      content: `Les cookies et données de navigation sont conservés pour la durée de votre visite ou au maximum 13 mois, selon leur nature.`,
    },
    {
      title: 'Plus d’informations',
      content: `Pour en savoir plus sur vos données, consultez notre Politique de confidentialité ou contactez-nous : ${C.contact}.`,
    },
  ],
});