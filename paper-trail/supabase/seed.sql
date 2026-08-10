-- Seed Tami's real records. Run AFTER a user has signed in at least once, then
-- replace :uid with that auth user's UUID (select id from auth.users).
--
--   psql "$DATABASE_URL" -v uid="'<your-user-uuid>'" -f supabase/seed.sql

begin;

insert into profiles (user_id, business_name, display_name, address_lines, email,
                       default_net_days, default_currency, memo_convention, next_invoice_number)
values (:uid, 'Oluwatamilore Oladipo', 'Tami Oladipo',
        array['19 Ladipo Omotesho Cole Street','Lekki Phase 1','Lagos 105102','Nigeria'],
        'oladipotamilore@gmail.com', 30, 'USD', '{Month of post} + {Brand}', 3)
on conflict (user_id) do update
  set business_name = excluded.business_name,
      display_name = excluded.display_name,
      address_lines = excluded.address_lines,
      next_invoice_number = excluded.next_invoice_number;

with pm as (
  insert into payment_methods (user_id, type, label, details, is_default)
  values (:uid, 'wise', 'Wise (USD)',
          '{"Account holder":"Oluwatamilore Oladipo","Email":"oladipotamilore@gmail.com","Currency":"USD"}',
          true)
  returning id
),
b as (
  insert into brands (user_id, name, bill_to_name, address_lines, notes, default_rate)
  values (:uid, 'Creatorbuzz Co', 'Creatorbuzz Co',
          array['84 Elm Street, Suite B','Westfield, NJ 07090','USA'],
          'Invoices go to Krizia. Contract signer is Vin Matano.', 1000)
  returning id
),
c1 as (
  insert into contacts (brand_id, name, email, role)
  select id, 'Krizia', '', 'Invoices' from b returning brand_id
),
c2 as (
  insert into contacts (brand_id, name, email, role)
  select id, 'Vin Matano', 'vin@creatorbuzz.com', 'Contracts' from b returning brand_id
),
d as (
  insert into deals (user_id, brand_id, campaign_name, status, total_value, currency,
                     payment_schedule, usage_rights_months, usage_rights_start)
  select :uid, id, 'Slate May–June 2026', 'Invoiced', 2000, 'USD',
         '[{"date":"2026-05-30","amount":1000},{"date":"2026-06-30","amount":1000}]',
         12, date '2026-05-30'
  from b returning id, brand_id
),
del1 as (
  insert into deliverables (deal_id, description, due_date, post_url, amount, delivered_at)
  select id, 'LinkedIn video, crossposted to IG (May)', date '2026-05-30',
         'https://www.linkedin.com/feed/', 1000, date '2026-05-30' from d
),
del2 as (
  insert into deliverables (deal_id, description, due_date, post_url, amount, delivered_at)
  select id, 'LinkedIn video, crossposted to IG (June)', date '2026-06-30',
         'https://www.linkedin.com/feed/', 1000, date '2026-06-30' from d
),
i1 as (
  insert into invoices (user_id, deal_id, brand_id, number, date, net_days, memo, campaign,
                        currency, status, payment_method_id, sent_at)
  select :uid, d.id, d.brand_id, '0001', date '2026-05-30', 30, 'May Slate',
         'Slate May–June 2026', 'USD', 'Sent', pm.id, date '2026-05-30'
  from d, pm returning id
),
i2 as (
  insert into invoices (user_id, deal_id, brand_id, number, date, net_days, memo, campaign,
                        currency, status, payment_method_id, sent_at)
  select :uid, d.id, d.brand_id, '0002', date '2026-06-30', 30, 'June Slate',
         'Slate May–June 2026', 'USD', 'Sent', pm.id, date '2026-06-30'
  from d, pm returning id
)
insert into invoice_items (invoice_id, description, detail, link, amount, sort_order)
select id, 'LinkedIn video, crossposted to IG', 'May deliverable — Slate campaign',
       'https://www.linkedin.com/feed/', 1000, 0 from i1
union all
select id, 'LinkedIn video, crossposted to IG', 'June deliverable — Slate campaign',
       'https://www.linkedin.com/feed/', 1000, 0 from i2;

commit;
