import type { Company } from './company';
import type { LegalDocument } from './types';

export const conditionsUtilisation = (C: Company): LegalDocument => ({
  title: 'Conditions d’utilisation',
  description: `Conditions d’utilisation du site ${C.name}.`,
  sections: [
    {
      title: 'Objet',
      content: `Les présentes conditions régissent l’accès et l’utilisation du site ${C.name}, boutique en ligne d’articles et d’équipements de sport. En naviguant sur le site, vous acceptez ces conditions.
Dernière mise à jour : ${C.lastUpdate}.`,
    },
    {
      title: 'Accès au site',
      content: `Le site est accessible gratuitement à toute personne disposant d’un accès à Internet. Les frais de connexion restent à votre charge. Nous pouvons suspendre ou limiter l’accès au site à tout moment, notamment pour maintenance, sans que cela ouvre droit à indemnité.`,
    },
    {
      title: 'Commandes',
      content: `La commande se fait directement sur le site, sans création de compte. Les conditions de vente, de livraison, de paiement, de retour et de remboursement sont détaillées dans nos Conditions Générales de Vente (CGV), qui s’appliquent à toute commande.`,
    },
    {
      title: 'Informations sur les produits',
      content: `Nous nous efforçons de présenter des descriptions, prix et disponibilités exacts. Les photographies sont non contractuelles et les couleurs peuvent légèrement varier selon votre écran. En cas d’erreur manifeste de prix ou de stock, nous vous contactons pour confirmer ou annuler la commande.`,
    },
    {
      title: 'Règles d’utilisation',
      content: `En utilisant le site, vous vous engagez à :
• fournir des informations exactes lors d’une commande ou d’un contact
• ne pas perturber le fonctionnement du site, ni tenter d’y accéder de manière non autorisée
• ne pas utiliser le site à des fins frauduleuses ou illégales
• ne pas copier ou extraire de manière automatisée les contenus du site

Nous pouvons refuser ou annuler une commande en cas d’abus ou de suspicion de fraude.`,
    },
    {
      title: 'Propriété intellectuelle',
      content: `Les textes, photographies, logos, graphismes et la structure du site sont la propriété de ${C.name} ou de ses partenaires et sont protégés par la législation sur la propriété intellectuelle. Toute reproduction ou exploitation sans autorisation écrite préalable est interdite.`,
    },
    {
      title: 'Responsabilité',
      content: `${C.name} ne peut être tenue responsable des interruptions du site, des dommages liés à l’utilisation d’Internet (virus, indisponibilité du réseau) ni du contenu des sites tiers vers lesquels le site peut renvoyer.`,
    },
    {
      title: 'Données personnelles et cookies',
      content: `Le traitement de vos données est décrit dans notre Politique de confidentialité. L’usage des cookies est décrit dans notre Politique de cookies.`,
    },
    {
      title: 'Modification des conditions',
      content: `Nous pouvons modifier ces conditions à tout moment. La version en vigueur est celle publiée sur cette page.`,
    },
    {
      title: 'Droit applicable et contact',
      content: `Les présentes conditions sont soumises au droit sénégalais. En cas de litige, nous recherchons d’abord une solution amiable. Pour toute question : ${C.contact}.`,
    },
  ],
});