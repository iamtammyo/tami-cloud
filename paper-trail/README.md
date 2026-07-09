# Paper Trail

A creator back office — invoicing, brand-deal tracking, and partnership admin in one place.
Built for Tami first, architected so any creator can sign up later.

> The paper trail behind every brand deal.

## What's here (M1 + deals spine)

- **Dashboard** — outstanding / overdue / paid headline numbers, income-by-month and
  income-by-brand charts, a "needs attention" list (overdue invoices, deliverables due
  soon, delivered-but-not-invoiced deals, usage rights expiring), and a recent-activity feed.
- **Invoices** — create (blank or auto-filled from a deal), edit, duplicate, mark sent /
  mark paid, sequential numbering, status filters, and a studio-quality **client-side PDF**
  (generated in-browser with `@react-pdf/renderer` — no server round-trip).
- **Deals** — kanban + table pipeline (Pitched → … → Paid / Dead), deliverables with post
  links and delivered toggles, a contract vault (PDF upload + payment schedule + usage-rights
  window + exclusivity notes), and one-click *create invoice from deal*.
- **Brands** — client directory with contacts, notes, default rate, and per-brand history.
- **Settings** — profile, multiple payment methods (one default), and invoice defaults
  (net terms, currency, memo convention, next invoice number).

Tami's real records are seeded on first run (see `src/lib/seed.ts`).

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · Zod · Recharts · `@react-pdf/renderer`.
Supabase (Postgres + Auth + Storage) is wired for later — see below.

## Run

```bash
cd paper-trail
npm install
npm run dev            # http://localhost:3000
```

No configuration needed. The app runs **local-first**: all data is a swappable store
(`src/lib/store.tsx`) persisted to `localStorage`, seeded with Tami's records. To wipe and
re-seed, clear the `paper-trail.v1` key (or call `resetToSeed()`).

## Going multi-user with Supabase

Everything is designed so opening the app to any creator is a config change, not a rewrite:

1. Create a Supabase project and run `supabase/schema.sql` (tables + **row-level security**
   scoped to `auth.uid()` from day one, plus a `contracts` storage bucket).
2. Optionally seed Tami's data with `supabase/seed.sql` (pass her auth UUID as `:uid`).
3. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `NEXT_PUBLIC_DATA_BACKEND=supabase` (see `.env.local.example`).
4. Implement the Supabase adapter behind the same mutator interface exposed by
   `src/lib/store.tsx`. `/login` already renders the magic-link form when Supabase is enabled.

## The invoice PDF

`src/lib/invoice-pdf.tsx` reconstructs the approved invoice layout from the build plan:
date top-right, Bill To (left) / From (right), invoice number + memo + campaign, a large
`Total (USD)` figure, payment terms + due date, a line-item table with an accent rule and
clickable post links, subtotal/total, a payment-details block, and a footer contact line —
terracotta accent, Helvetica type, generous whitespace.

> Note: the plan referenced `Invoices/invoice_generator.py` / `slate_may_june_2026.json` as
> the source design, but those files aren't in the repo. The layout here is reconstructed
> from the written spec (§4.4) — drop those files in and it can be matched pixel-for-pixel.

## Data model

See `src/lib/types.ts` and `supabase/schema.sql`. Tables: `profiles`, `payment_methods`,
`brands`, `contacts`, `deals`, `deliverables`, `invoices`, `invoice_items` — all RLS-scoped
to the owning user.
