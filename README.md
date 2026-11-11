# Kayan Business Compass

A business operations workspace designed to help teams organize day-to-day work in one place.

**Project preview:** https://id-preview--b1c5f7a8-c016-4eaa-845c-d3f8071a003a.lovable.app

## Overview

Kayan brings common business workflows together, including:

- Client and company records
- Tasks and team collaboration
- Invoices and invoice items
- Inventory and expense tracking
- Company membership, roles, and access approval
- Subscription and payment-review workflows

The available modules and access rules are evolving. Review and test the application in a non-production environment before using it with real business or customer data.

## Technology

- React and TypeScript
- TanStack Start and TanStack Router
- Vite
- Supabase (authentication and database)
- Drizzle ORM / Drizzle Kit
- Tailwind CSS
- Vitest

## Getting started

### Requirements

- [Bun](https://bun.sh/) (recommended; the repository includes `bun.lock`)
- A Supabase project with the required schema and database functions. The current repository does not yet include a complete, standalone database migration set; the schema is managed through the connected Lovable/Supabase project.

### Install and run

```bash
git clone https://github.com/androfady340-source/remix-of-kayan-business-compass.git
cd remix-of-kayan-business-compass
bun install
cp .env.example .env
```

Fill in the local environment values, then start the development server:

```bash
bun run dev
```

## Environment variables

Copy `.env.example` to `.env` and configure the values for your own Supabase project.

| Variable | Purpose |
| --- | --- |
| `SUPABASE_PROJECT_ID` | Supabase project identifier |
| `SUPABASE_URL` | Supabase project URL used by server-side code |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
| `VITE_SUPABASE_PROJECT_ID` | Project identifier exposed to the Vite client build |
| `VITE_SUPABASE_URL` | Supabase URL exposed to the Vite client build |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key exposed to the Vite client build |

Never put a Supabase `service_role` key, database password, access token, or any other privileged secret in client-side variables or commit them to Git.

## Useful commands

```bash
bun run dev       # Start local development
bun run build     # Create a production build
bun run lint      # Run ESLint
bun run test      # Run the test suite
bun run preview   # Preview the production build
```

## Deployment and security

Deployment requires correctly configured runtime environment variables and a Supabase project whose Row Level Security policies and database functions have been reviewed. Do not assume that a successful frontend build proves database authorization or production readiness.

Before handling real users or payments, verify authentication, company-level data isolation, role permissions, subscription enforcement, and administrative RPC access.

## License

No license has been added yet. Until a license is included, the source remains under the default copyright terms; do not assume permission to reuse or redistribute it.

## Project status

This repository is connected to Lovable. Changes made in the Lovable editor are synchronized to the connected GitHub branch, and commits pushed to the connected branch may sync back to Lovable. Avoid force-pushing or rewriting published Git history.
