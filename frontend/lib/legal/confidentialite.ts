import type { Company } from './company';
import type { LegalDocument } from './types';

export const confidentialite = (C: Company): LegalDocument => ({
  title: 'Politique de confidentialité',
  description: `Politique de confidentialité et protection des données de ${C.name}.`,
  sections: [
    {
      title: 'Responsable du traitement',
      content: `Le responsable du traitement de vos données personnelles est ${C.name}${C.addressLine}. Contact : ${C.contact}.
Dernière mise à jour : ${C.lastUpdate}.`,
    },
    {
      title: 'Données collectées',
      content: `La commande se fait sans création de compte client. Nous collectons uniquement les données que vous saisissez lors d’une commande ou d’un contact :
• Identité : nom et prénom
• Contact : numéro de téléphone (et e-mail si vous le renseignez)
• Livraison : adresse, ville ou zone de livraison, commentaire éventuel
• Commande : produits, tailles, couleurs, quantités, montant, mode de paiement, statut
• Données techniques : adresse IP, type d’appareil et de navigateur, pages consultées

Nous ne conservons pas vos coordonnées bancaires. Si vous payez par un service de paiement ou de monnaie mobile, la transaction est traitée par ce prestataire.`,
    },
    {
      title: 'Finalités',
      content: `• Enregistrer, confirmer, préparer et livrer votre commande
• Vous joindre par téléphone, WhatsApp ou SMS au sujet de votre commande
• Gérer le suivi de commande, les retours et le service après-vente
• Établir les factures et respecter nos obligations comptables
• Assurer la sécurité du site et prévenir la fraude
• Établir des statistiques de ventes et améliorer le site
• Vous envoyer des offres commerciales, uniquement avec votre accord`,
    },
    {
      title: 'Base légale',
      content: `Le traitement est fondé sur l’exécution de votre commande, le respect de nos obligations légales, notre intérêt légitime à sécuriser et améliorer le site, et votre consentement pour la prospection commerciale. Conformément à la loi n° 2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel, vos données sont collectées de manière loyale, pour des finalités déterminées et limitées à ce qui est nécessaire.`,
    },
    {
      title: 'Durées de conservation',
      content: `• Données de commande et de facturation : 10 ans (obligations comptables)
• Données de contact utilisées pour la prospection : 3 ans après le dernier échange
• Données techniques de connexion : 12 mois maximum`,
    },
    {
      title: 'Destinataires',
      content: `Vos données sont accessibles à l’équipe ${C.name} habilitée à traiter les commandes, ainsi qu’aux prestataires strictement nécessaires : hébergement du site et du serveur, stockage des images, livreurs et services de paiement. Nous ne vendons ni ne louons vos données.`,
    },
    {
      title: 'Transferts hors du Sénégal',
      content: `Certains prestataires techniques (hébergement notamment) peuvent traiter des données hors du Sénégal. Nous veillons à ce que ce transfert s’accompagne de garanties adaptées, conformément à la réglementation applicable.`,
    },
    {
      title: 'Vos droits',
      content: `Vous disposez d’un droit d’accès, de rectification, d’opposition et de suppression de vos données, dans les conditions prévues par la loi. Pour les exercer, contactez-nous : ${C.contact}. Une pièce d’identité peut être demandée pour vérifier votre demande.
Vous pouvez aussi saisir la Commission de Protection des Données Personnelles (CDP) du Sénégal : www.cdp.sn.`,
    },
    {
      title: 'Sécurité',
      content: `Le site est accessible en HTTPS. L’accès à l’espace d’administration est protégé par authentification, et seules les personnes habilitées peuvent consulter les données de commande. Nous sauvegardons régulièrement la base de données.`,
    },
    {
      title: 'Modification de la politique',
      content: `Nous pouvons modifier cette politique à tout moment. La version en vigueur est celle publiée sur cette page.`,
    },
  ],
});