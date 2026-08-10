"use client";

import {
  Document,
  Page,
  Text,
  View,
  Link,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Brand, Invoice, PaymentMethod, Profile } from "./types";
import {
  formatDate,
  invoiceDueDate,
  invoiceTotal,
  itemsSorted,
  money,
} from "./format";

// Accent + type modeled on Tami's existing invoice: terracotta accent rule,
// Helvetica, generous whitespace, big total.
const ACCENT = "#c65d3b";
const INK = "#1c1a17";
const MUTED = "#7a746a";
const LINE = "#e4e0d8";

const s = StyleSheet.create({
  page: {
    paddingTop: 54,
    paddingBottom: 48,
    paddingHorizontal: 54,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: INK,
    lineHeight: 1.5,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brandName: { fontSize: 20, fontFamily: "Helvetica-Bold", letterSpacing: -0.4 },
  brandSub: { fontSize: 10, color: MUTED, marginTop: 2 },
  dateBlock: { alignItems: "flex-end" },
  invoiceLabel: {
    fontSize: 9,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  dateValue: { fontSize: 11, marginTop: 2 },

  partiesRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 34 },
  partyCol: { width: "46%" },
  partyLabel: {
    fontSize: 8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  partyName: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  partyLine: { color: MUTED, fontSize: 9.5 },

  metaRow: { flexDirection: "row", marginTop: 30, gap: 28 },
  metaItem: {},
  metaLabel: {
    fontSize: 8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  metaValue: { fontSize: 10.5, marginTop: 2 },

  totalBlock: { marginTop: 26 },
  totalLabel: {
    fontSize: 9,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  totalValue: {
    fontSize: 34,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -1,
    marginTop: 2,
  },
  termsLine: { fontSize: 9.5, color: MUTED, marginTop: 6 },

  table: { marginTop: 30 },
  theadRule: { height: 2, backgroundColor: ACCENT },
  thead: { flexDirection: "row", paddingVertical: 7 },
  th: {
    fontSize: 8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  colDesc: { width: "70%", paddingRight: 12 },
  colAmt: { width: "30%", textAlign: "right" },
  itemDesc: { fontSize: 10.5, fontFamily: "Helvetica-Bold" },
  itemDetail: { fontSize: 9, color: MUTED, marginTop: 2 },
  itemLink: { fontSize: 9, color: ACCENT, marginTop: 2 },
  itemAmt: { fontSize: 10.5 },

  totalsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
  totalsInner: { width: "45%" },
  totalsLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalsFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: ACCENT,
  },
  totalsFinalLabel: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  totalsFinalValue: { fontFamily: "Helvetica-Bold", fontSize: 13 },

  payBlock: { marginTop: 40, padding: 16, backgroundColor: "#faf7f2", borderRadius: 6 },
  payTitle: {
    fontSize: 8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  payGrid: { flexDirection: "row", flexWrap: "wrap" },
  payItem: { width: "50%", marginBottom: 4 },
  payKey: { fontSize: 8, color: MUTED },
  payVal: { fontSize: 10 },

  footer: {
    position: "absolute",
    bottom: 32,
    left: 54,
    right: 54,
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 8.5, color: MUTED },
});

export interface InvoicePdfProps {
  invoice: Invoice;
  profile: Profile;
  brand: Brand | undefined;
  paymentMethod: PaymentMethod | undefined;
}

export function InvoicePdf({ invoice, profile, brand, paymentMethod }: InvoicePdfProps) {
  const items = itemsSorted(invoice.items);
  const total = invoiceTotal(invoice);
  const due = invoiceDueDate(invoice);
  const cur = invoice.currency || profile.default_currency;

  return (
    <Document
      title={`Invoice ${invoice.number}`}
      author={profile.display_name || profile.business_name}
    >
      <Page size="A4" style={s.page}>
        {/* Header: name left, date top-right */}
        <View style={s.topRow}>
          <View>
            <Text style={s.brandName}>{profile.business_name || "Your name"}</Text>
            {profile.display_name && profile.display_name !== profile.business_name ? (
              <Text style={s.brandSub}>{profile.display_name}</Text>
            ) : null}
          </View>
          <View style={s.dateBlock}>
            <Text style={s.invoiceLabel}>Date</Text>
            <Text style={s.dateValue}>{formatDate(invoice.date)}</Text>
          </View>
        </View>

        {/* Bill To left / From right */}
        <View style={s.partiesRow}>
          <View style={s.partyCol}>
            <Text style={s.partyLabel}>Bill To</Text>
            <Text style={s.partyName}>{brand?.bill_to_name || brand?.name || "—"}</Text>
            {(brand?.address_lines || []).map((l, i) => (
              <Text key={i} style={s.partyLine}>
                {l}
              </Text>
            ))}
          </View>
          <View style={[s.partyCol, { alignItems: "flex-end" }]}>
            <Text style={s.partyLabel}>From</Text>
            <Text style={s.partyName}>{profile.business_name}</Text>
            {profile.address_lines.map((l, i) => (
              <Text key={i} style={[s.partyLine, { textAlign: "right" }]}>
                {l}
              </Text>
            ))}
            {profile.email ? (
              <Text style={[s.partyLine, { textAlign: "right" }]}>{profile.email}</Text>
            ) : null}
          </View>
        </View>

        {/* Invoice number + memo + campaign */}
        <View style={s.metaRow}>
          <View style={s.metaItem}>
            <Text style={s.metaLabel}>Invoice №</Text>
            <Text style={s.metaValue}>{invoice.number}</Text>
          </View>
          {invoice.memo ? (
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>Memo</Text>
              <Text style={s.metaValue}>{invoice.memo}</Text>
            </View>
          ) : null}
          {invoice.campaign ? (
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>Campaign</Text>
              <Text style={s.metaValue}>{invoice.campaign}</Text>
            </View>
          ) : null}
        </View>

        {/* Large total */}
        <View style={s.totalBlock}>
          <Text style={s.totalLabel}>Total ({cur})</Text>
          <Text style={s.totalValue}>{money(total, cur)}</Text>
          <Text style={s.termsLine}>
            Payment terms: Net {invoice.net_days} · Due {formatDate(due)}
          </Text>
        </View>

        {/* Line-item table with accent rule */}
        <View style={s.table}>
          <View style={s.theadRule} />
          <View style={s.thead}>
            <Text style={[s.th, s.colDesc]}>Description</Text>
            <Text style={[s.th, s.colAmt]}>Amount</Text>
          </View>
          {items.map((it) => (
            <View key={it.id} style={s.row} wrap={false}>
              <View style={s.colDesc}>
                <Text style={s.itemDesc}>{it.description}</Text>
                {it.detail ? <Text style={s.itemDetail}>{it.detail}</Text> : null}
                {it.link ? (
                  <Link src={it.link} style={s.itemLink}>
                    {it.link}
                  </Link>
                ) : null}
              </View>
              <View style={s.colAmt}>
                <Text style={s.itemAmt}>{money(it.amount, cur)}</Text>
              </View>
            </View>
          ))}

          <View style={s.totalsRow}>
            <View style={s.totalsInner}>
              <View style={s.totalsLine}>
                <Text style={{ color: MUTED }}>Subtotal</Text>
                <Text>{money(total, cur)}</Text>
              </View>
              <View style={s.totalsFinal}>
                <Text style={s.totalsFinalLabel}>Total ({cur})</Text>
                <Text style={s.totalsFinalValue}>{money(total, cur)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment details block */}
        {paymentMethod ? (
          <View style={s.payBlock} wrap={false}>
            <Text style={s.payTitle}>Payment details · {paymentMethod.label}</Text>
            <View style={s.payGrid}>
              {Object.entries(paymentMethod.details).map(([k, v]) => (
                <View key={k} style={s.payItem}>
                  <Text style={s.payKey}>{k}</Text>
                  <Text style={s.payVal}>{v}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Footer contact line */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{profile.business_name}</Text>
          <Text style={s.footerText}>{profile.email}</Text>
        </View>
      </Page>
    </Document>
  );
}
