# Sport Shop — Site e-commerce d'articles de sport

Plateforme e-commerce complète (boutique + back-office admin) pour la vente
d'articles et équipements de sport.

## Structure du projet

\`\`\`
sport-shop/
├── frontend/    # Next.js — boutique publique + interface admin
├── backend/     # NestJS — API REST
└── docker-compose.yml
\`\`\`

## Stack technique

- **Frontend** : Next.js, TypeScript, Tailwind CSS
- **Backend** : NestJS, TypeScript
- **Base de données** : PostgreSQL
- **ORM** : Prisma (ou TypeORM)
- **Stockage images** : Cloudinary / AWS S3
- **Auth admin** : JWT

## Prérequis

- Node.js ≥ 18
- pnpm (ou npm/yarn)
- PostgreSQL (ou Docker)

## Installation

\`\`\`bash
# Cloner le repo
git clone <url-du-repo>
cd sport-shop

# Backend
cd backend
cp .env.example .env
pnpm install
pnpm run start:dev

# Frontend (autre terminal)
cd frontend
cp .env.example .env.local
pnpm install
pnpm run dev
\`\`\`

## Variables d'environnement

Voir `.env.example` dans chaque dossier pour la liste complète des variables
nécessaires (DB_URL, JWT_SECRET, CLOUDINARY_*, etc.)

## Statut du projet

🚧 En cours de développement — MVP

## Licence

Projet privé — Client uniquement