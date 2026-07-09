import type { Database } from "./types";

// Tami's real records — the app is usable from day one with these seeded.
export function seedData(): Database {
  return {
    profile: {
      business_name: "Oluwatamilore Oladipo",
      display_name: "Tami Oladipo",
      address_lines: [
        "19 Ladipo Omotesho Cole Street",
        "Lekki Phase 1",
        "Lagos 105102",
        "Nigeria",
      ],
      email: "oladipotamilore@gmail.com",
      default_net_days: 30,
      default_currency: "USD",
      memo_convention: "{Month of post} + {Brand}",
      next_invoice_number: 3,
    },
    payment_methods: [
      {
        id: "pm_wise",
        type: "wise",
        label: "Wise (USD)",
        details: {
          "Account holder": "Oluwatamilore Oladipo",
          Email: "oladipotamilore@gmail.com",
          Currency: "USD",
        },
        is_default: true,
      },
      {
        id: "pm_bank",
        type: "bank",
        label: "Bank transfer",
        details: {
          "Account name": "Oluwatamilore Oladipo",
          Bank: "—",
          "Account number": "—",
          "SWIFT / Routing": "—",
        },
        is_default: false,
      },
    ],
    brands: [
      {
        id: "brand_creatorbuzz",
        name: "Creatorbuzz Co",
        bill_to_name: "Creatorbuzz Co",
        address_lines: ["84 Elm Street, Suite B", "Westfield, NJ 07090", "USA"],
        notes: "Invoices go to Krizia. Contract signer is Vin Matano.",
        default_rate: 1000,
        contacts: [
          { id: "c_krizia", name: "Krizia", email: "", role: "Invoices" },
          {
            id: "c_vin",
            name: "Vin Matano",
            email: "vin@creatorbuzz.com",
            role: "Contracts",
          },
        ],
      },
    ],
    deals: [
      {
        id: "deal_slate",
        brand_id: "brand_creatorbuzz",
        campaign_name: "Slate May–June 2026",
        status: "Invoiced",
        total_value: 2000,
        currency: "USD",
        contract_file_url: null,
        contract_file_name: null,
        payment_schedule: [
          { date: "2026-05-30", amount: 1000 },
          { date: "2026-06-30", amount: 1000 },
        ],
        usage_rights_months: 12,
        usage_rights_start: "2026-05-30",
        exclusivity_notes: "",
        created_at: "2026-05-01",
        deliverables: [
          {
            id: "del_may",
            description: "LinkedIn video, crossposted to IG (May)",
            due_date: "2026-05-30",
            post_url: "https://www.linkedin.com/feed/",
            amount: 1000,
            delivered_at: "2026-05-30",
          },
          {
            id: "del_june",
            description: "LinkedIn video, crossposted to IG (June)",
            due_date: "2026-06-30",
            post_url: "https://www.linkedin.com/feed/",
            amount: 1000,
            delivered_at: "2026-06-30",
          },
        ],
      },
    ],
    invoices: [
      {
        id: "inv_0001",
        deal_id: "deal_slate",
        brand_id: "brand_creatorbuzz",
        number: "0001",
        date: "2026-05-30",
        net_days: 30,
        memo: "May Slate",
        campaign: "Slate May–June 2026",
        currency: "USD",
        status: "Sent",
        payment_method_id: "pm_wise",
        sent_at: "2026-05-30",
        paid_at: null,
        items: [
          {
            id: "it_0001",
            description: "LinkedIn video, crossposted to IG",
            detail: "May deliverable — Slate campaign",
            link: "https://www.linkedin.com/feed/",
            amount: 1000,
            sort_order: 0,
          },
        ],
      },
      {
        id: "inv_0002",
        deal_id: "deal_slate",
        brand_id: "brand_creatorbuzz",
        number: "0002",
        date: "2026-06-30",
        net_days: 30,
        memo: "June Slate",
        campaign: "Slate May–June 2026",
        currency: "USD",
        status: "Sent",
        payment_method_id: "pm_wise",
        sent_at: "2026-06-30",
        paid_at: null,
        items: [
          {
            id: "it_0002",
            description: "LinkedIn video, crossposted to IG",
            detail: "June deliverable — Slate campaign",
            link: "https://www.linkedin.com/feed/",
            amount: 1000,
            sort_order: 0,
          },
        ],
      },
    ],
  };
}
