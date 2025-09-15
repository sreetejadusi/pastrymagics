## Supabase setup

Create a new Supabase project and set env vars in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

Run this SQL in Supabase SQL editor to create tables and policies:

```sql
-- Orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null,
  name text not null,
  phone text not null,
  table_number text,
  status text not null default 'placed',
  total numeric not null default 0,
  payment text not null default 'pay-at-counter',
  created_at timestamp with time zone default now()
);

-- Order items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  item_id text not null,
  name text not null,
  price numeric not null,
  qty int not null
);

-- Cakes
create table if not exists public.cakes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  weight_kg int not null,
  icing text not null,
  flavour text not null,
  cake_type text not null,
  shape text not null,
  message text,
  reference_image text,
  created_at timestamp with time zone default now()
);

-- Basic RLS (open for anon, restrict writes per project needs)
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.cakes enable row level security;

create policy "read_all_orders" on public.orders for select using (true);
create policy "insert_orders" on public.orders for insert with check (true);

create policy "read_all_items" on public.order_items for select using (true);
create policy "insert_items" on public.order_items for insert with check (true);

create policy "read_all_cakes" on public.cakes for select using (true);
create policy "insert_cakes" on public.cakes for insert with check (true);
```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
