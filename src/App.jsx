import { useState, useMemo, useCallback, useEffect } from "react";
import { ChevronRight, ChevronLeft, Search, BookOpen, ExternalLink, AlertTriangle, DollarSign, Calendar, Users, ClipboardList, Info, Plus, Trash2, Star, CheckCircle, Clock, Pencil, Check, X } from "lucide-react";

// ============================================================
// CONFIGURATION — All guideline numbers, limits, and deadlines
// Edit this section to update rules without touching UI components
// ============================================================

const CONFIG = {

  // --- Spending Limits (per-person, per-event unless noted) ---
  spendingLimits: {
    foodAlcohol:      { label: "Food & Alcohol",            max: 70,   unit: "per person per event", notes: "Includes food + alcohol combined. Max 2 alcoholic drinks per person. Food must be served if alcohol is present." },
    generalMeeting:   { label: "General Body Meeting (GBM)", max: 15,  min: 10, unit: "per person", notes: "Minimal snacks only. Cannot be held at restaurants. No alcohol permitted." },
    standardEvent:    { label: "Standard Programming",       max: 25,   unit: "per person",          notes: "Social events, guest speakers, etc." },
    galaFormal:       { label: "Gala / Formal Events",       max: 85,   unit: "per person",          notes: "" },
    delivery:         { label: "Delivery Services",          max: 25,   unit: "per person per event", notes: "" },
    swag:             { label: "Swag / Merchandise",         max: 40,   unit: "per member per year",  notes: "For academic competitions." },
    apparel:          { label: "Apparel / Uniforms",         max: 50,   semesterCap: 2000, unit: "per member", notes: "Up to $2,000 per semester." },
    printing:         { label: "Printing",                   max: 250,  unit: "per group per year",   notes: "Cultural/Arts groups: up to $300/year." },
    digitalAds:       { label: "Digital Advertising",        max: "10%", unit: "of GAPSA-approved budget", notes: "" },
    officeSupplies:   { label: "General Office Supplies",    max: 100,  unit: "per year",             notes: "" },
    eventSupplies:    { label: "Event Supplies",             max: 2000, unit: "per year",             notes: "" },
    capitalEquipment: { label: "Capital Equipment",          max: 2000, unit: "up to 80% funded",     notes: "" },
    facilitySecurity: { label: "Facilities & Security",      max: "80%", unit: "of facility/security costs", notes: "Revenue-generating events. On-campus conferences: $2,000/year, 1 per group." },
    speakerHonoraria: { label: "Speaker Honoraria",          max: 1500, unit: "per external speaker per year", notes: "Speaker must be onboarded as an Individual Service Provider Recipient." },
    sportsEquipment:  { label: "Sports Equipment",           max: 2000, unit: "per group (or $100/member)", notes: "Must include a secure storage plan." },
    giftsPrizes:      { label: "Gifts & Prizes",             max: null, unit: "", notes: "No gift cards. Physical prizes require W-9 forms and are taxable." },
  },

  // --- Event Types (for planner) ---
  eventTypes: [
    { id: "gbm",      label: "General Body Meeting",    perPersonCap: 15, alcoholAllowed: false, description: "Snacks only — no restaurant, no alcohol" },
    { id: "standard", label: "Standard Event",          perPersonCap: 25, alcoholAllowed: true,  description: "Social events, speaker series, workshops" },
    { id: "gala",     label: "Gala / Formal",           perPersonCap: 85, alcoholAllowed: true,  description: "Formal dinners, galas, ceremonies" },
    { id: "academic", label: "Academic / Conference",   perPersonCap: 25, alcoholAllowed: true,  description: "Symposia, conferences, academic programming" },
    { id: "outreach", label: "Community Outreach",      perPersonCap: 25, alcoholAllowed: false, description: "Volunteering, fundraisers, community events" },
  ],

  // --- Vendor Database ---
  // Costs are per-person estimates; verify current pricing before submitting budget
  vendors: [
    // ── On-Campus / Penn-Affiliated ──────────────────────────
    {
      id: "bon-appetit",
      name: "Bon Appétit / Penn Dining Catering",
      category: "On-Campus Catering",
      subcategory: "catering",
      perPerson: { low: 22, high: 38 },
      minOrder: 25,
      dietary: ["vegetarian", "vegan", "gluten-free", "halal"],
      notes: "Preferred Penn vendor. Can be procured via your financial administrator. Wide range of menu packages.",
      contact: "pennfoodservices@upenn.edu",
      recommended: true,
    },
    {
      id: "houston-hall",
      name: "Houston Hall Event Services",
      category: "On-Campus Catering",
      subcategory: "catering",
      perPerson: { low: 20, high: 35 },
      minOrder: 20,
      dietary: ["vegetarian", "vegan"],
      notes: "On-campus venue + catering combo. Coordinate through Graduate Student Center.",
      contact: "gradcenter@upenn.edu",
      recommended: true,
    },

    // ── Chain / Delivery-Friendly ────────────────────────────
    {
      id: "chipotle",
      name: "Chipotle Catering",
      category: "Mexican",
      subcategory: "catering",
      perPerson: { low: 13, high: 18 },
      minOrder: 20,
      dietary: ["vegetarian", "vegan", "gluten-free"],
      notes: "Bowls, burritos, tacos. Chips & guac add ~$2/person. Easy advance ordering online.",
      url: "https://www.chipotle.com/catering",
      recommended: false,
    },
    {
      id: "panera",
      name: "Panera Bread Catering",
      category: "Sandwiches / Soup",
      subcategory: "catering",
      perPerson: { low: 10, high: 16 },
      minOrder: null,
      dietary: ["vegetarian", "vegan"],
      notes: "Boxed lunches, soup/salad. Good for daytime meetings. 24-hr advance order.",
      url: "https://www.panerabread.com/catering",
      recommended: false,
    },
    {
      id: "chick-fil-a",
      name: "Chick-fil-A Catering",
      category: "American",
      subcategory: "catering",
      perPerson: { low: 12, high: 16 },
      minOrder: null,
      dietary: [],
      notes: "Nugget trays, sandwich packages. Popular for afternoon events. Order 24-48 hrs ahead.",
      url: "https://www.chick-fil-a.com/catering",
      recommended: false,
    },
    {
      id: "wawa",
      name: "Wawa Catering (Hoagies & Platters)",
      category: "Sandwiches",
      subcategory: "catering",
      perPerson: { low: 8, high: 13 },
      minOrder: null,
      dietary: ["vegetarian"],
      notes: "Hoagie trays, breakfast items. Very budget-friendly. Order via Wawa app or in-store.",
      url: "https://www.wawa.com",
      recommended: false,
    },
    {
      id: "jersey-mikes",
      name: "Jersey Mike's Catering",
      category: "Sandwiches",
      subcategory: "catering",
      perPerson: { low: 9, high: 14 },
      minOrder: null,
      dietary: ["vegetarian"],
      notes: "Sub trays. Easy to split for large groups. Good budget option.",
      url: "https://www.jerseymikes.com/catering",
      recommended: false,
    },

    // ── Local Philadelphia ───────────────────────────────────
    {
      id: "di-brunos",
      name: "Di Bruno Bros. Catering",
      category: "Italian / Charcuterie",
      subcategory: "catering",
      perPerson: { low: 18, high: 30 },
      minOrder: 15,
      dietary: ["vegetarian", "gluten-free"],
      notes: "Antipasto, cheese boards, Italian platters. Popular for receptions and galas.",
      url: "https://www.dibruno.com/catering",
      recommended: false,
    },
    {
      id: "zahav-catering",
      name: "Federal Donuts / CookNSolo Catering",
      category: "Israeli / American",
      subcategory: "catering",
      perPerson: { low: 15, high: 22 },
      minOrder: 20,
      dietary: ["vegetarian", "halal"],
      notes: "Federal Donuts fried chicken platters are popular for large events. Must order via catering line.",
      recommended: false,
    },
    {
      id: "saads",
      name: "Saad's Halal Restaurant",
      category: "Halal / Middle Eastern",
      subcategory: "catering",
      perPerson: { low: 10, high: 16 },
      minOrder: 10,
      dietary: ["halal", "vegetarian"],
      notes: "Local University City halal spot. Platters and family-style. Great for diverse groups.",
      recommended: false,
    },
    {
      id: "district-taco",
      name: "District Taco Catering",
      category: "Mexican",
      subcategory: "catering",
      perPerson: { low: 11, high: 16 },
      minOrder: 15,
      dietary: ["vegetarian", "vegan", "gluten-free"],
      notes: "Taco bars and burrito bowls. Customizable. Popular for large casual events.",
      recommended: false,
    },
    {
      id: "snap-kitchen",
      name: "Local Food Trucks (varies)",
      category: "Food Trucks",
      subcategory: "truck",
      perPerson: { low: 10, high: 18 },
      minOrder: null,
      dietary: ["vegetarian", "vegan", "halal", "gluten-free"],
      notes: "Penn's campus hosts many food trucks. Varies widely by vendor. Coordinate truck bookings 2–3 weeks ahead via OSA.",
      recommended: false,
    },

    // ── Pizza ────────────────────────────────────────────────
    {
      id: "allegros",
      name: "Allegro's Pizza (local)",
      category: "Pizza",
      subcategory: "pizza",
      perPerson: { low: 4, high: 7 },
      minOrder: null,
      dietary: ["vegetarian"],
      notes: "Classic Philly pizza. Very budget-friendly for large groups (~3 slices/person). Popular for casual events.",
      recommended: false,
    },
    {
      id: "pizza-hut-catering",
      name: "Pizza / Pie Catering (general)",
      category: "Pizza",
      subcategory: "pizza",
      perPerson: { low: 5, high: 9 },
      minOrder: null,
      dietary: ["vegetarian"],
      notes: "Pizza is often the most cost-effective food option. Budget ~3 slices per person.",
      recommended: false,
    },

    // ── Dessert / Snacks ────────────────────────────────────
    {
      id: "insomnia",
      name: "Insomnia Cookies",
      category: "Dessert",
      subcategory: "snacks",
      perPerson: { low: 3, high: 6 },
      minOrder: null,
      dietary: ["vegetarian"],
      notes: "Cookies. Great as a supplement or for GBMs. Late-night delivery available.",
      url: "https://insomniacookies.com",
      recommended: false,
    },
    {
      id: "goldie",
      name: "Goldie (Falafel)",
      category: "Israeli / Vegetarian",
      subcategory: "catering",
      perPerson: { low: 13, high: 18 },
      minOrder: 10,
      dietary: ["vegetarian", "vegan", "halal"],
      notes: "Fully vegetarian falafel restaurant. Popular with diverse dietary needs. On campus at 3401 Walnut.",
      recommended: false,
    },
  ],

  // ── Vendor Categories (for UI grouping) ───────────────────
  vendorCategories: [
    { id: "catering",  label: "Full Catering"    },
    { id: "pizza",     label: "Pizza"            },
    { id: "truck",     label: "Food Trucks"      },
    { id: "snacks",    label: "Snacks / Dessert" },
  ],

  // --- Funding Sources ---
  funds: [
    {
      id: "sgef",
      name: "Student Group Event Fund (SGEF)",
      shortName: "SGEF",
      recommended: true,
      recommendedReason: "Primary fund for all registered student groups — most applicants start here.",
      purpose: "Open to all registered graduate student groups to host events and programs throughout the year.",
      eligibleOrgs: ["student_group", "g12", "ideal"],
      eligibleNeeds: ["group_event"],
      requiresPartner: false,
      application: "Universal Funding Application",
      applicationUrl: "https://app.smartsheet.com/b/form/ee07ef4fa1dc4f789c31167f4fa55132",
      rubricUrl: "https://penno365-my.sharepoint.com/:b:/g/personal/gapsa_pr_gapsa_upenn_edu/EWg0lqO8Xr5GjGa14nHcSuwBLYEyFXwFbOcH9cKFl5vMhA?e=qSKBe7",
      contact: "gapsa.funds@gapsa.upenn.edu",
      reviewCycle: "Monthly, rolling basis at Finance Committee meetings",
      notes: "Multi-school events receive higher priority. Funding is competitive; awards are not guaranteed.",
    },
    {
      id: "ipf",
      name: "Interschool Partnership Fund (IPF)",
      shortName: "IPF",
      recommended: true,
      recommendedReason: "Best option for G12+ governments running multi-school events — GAPSA matches dollar-for-dollar.",
      purpose: "Promotes partnership between GAPSA and G12+ student governments. GAPSA matches dollar-for-dollar investment for interschool events.",
      eligibleOrgs: ["g12"],
      eligibleNeeds: ["group_event"],
      requiresPartner: true,
      application: "IPF Application",
      applicationUrl: "https://app.smartsheet.com/b/form/817a489c0a3b4bddae7dce62e4f8e904",
      rubricUrl: null,
      contact: "gapsa.funds@gapsa.upenn.edu",
      reviewCycle: "Rolling basis",
      notes: "Must span multiple graduate schools. Follow the F.I.R.S.T.S framework. Register at least 10 days in advance.",
    },
    {
      id: "ef",
      name: "Empowerment Fund (EF)",
      shortName: "EF",
      recommended: false,
      purpose: "Annual base/operating budget allocation for IDEAL Council Member affinity groups.",
      eligibleOrgs: ["ideal"],
      eligibleNeeds: ["operating_budget"],
      requiresPartner: false,
      application: "Empowerment Fund Application",
      applicationUrl: "https://app.smartsheet.com/b/form/01983297b3dd73898f1ac0e45850bdd7",
      rubricUrl: "https://www.gapsa.upenn.edu/s/Empowerment-Rubric_25-26.pdf",
      contact: "gapsa.ideal@gapsa.upenn.edu",
      reviewCycle: "Once per semester (Aug/Sept and Dec/Jan). Reviews take 3–4 weeks.",
      notes: "Submit before using Universal Funding Application.",
    },
    {
      id: "apf",
      name: "Affinity Partnership Fund (APF)",
      shortName: "APF",
      recommended: false,
      purpose: "Facilitates collaboration among school-based affinity groups and University-wide graduate organizations. Requires at least one IDEAL Council member as primary sponsor.",
      eligibleOrgs: ["ideal", "g12"],
      eligibleNeeds: ["group_event"],
      requiresPartner: true,
      application: "APF Application",
      applicationUrl: "https://app.smartsheet.com/b/form/18e4ef7e690640499629a1aa64ba8576",
      rubricUrl: null,
      contact: "gapsa.ideal@gapsa.upenn.edu",
      reviewCycle: "Rolling basis",
      notes: "Can submit for both APF and IPF when sponsors include an IDEAL member and a G12+ government.",
    },
    {
      id: "aef",
      name: "Academic Event Fund (AEF)",
      shortName: "AEF",
      recommended: false,
      purpose: "Supports academic events such as conferences, symposia, and academic programming.",
      eligibleOrgs: ["student_group", "g12", "ideal"],
      eligibleNeeds: ["academic_event"],
      requiresPartner: false,
      application: "Universal Funding Application",
      applicationUrl: "https://app.smartsheet.com/b/form/ee07ef4fa1dc4f789c31167f4fa55132",
      rubricUrl: "https://drive.google.com/file/d/1whCtUMNMrcQJck9NOvh-fcgYCbWib5R5/view",
      contact: "gapsa.research@gapsa.upenn.edu",
      reviewCycle: "Every 2 weeks, rolling basis at Research Council meetings",
      notes: "",
    },
    {
      id: "community",
      name: "Community Outreach Fund",
      shortName: "Community",
      recommended: false,
      purpose: "Pilot fund supporting West Philadelphia community initiatives such as fundraisers and volunteering events.",
      eligibleOrgs: ["student_group", "g12", "ideal"],
      eligibleNeeds: ["community_outreach"],
      requiresPartner: false,
      application: "Universal Funding Application",
      applicationUrl: "https://app.smartsheet.com/b/form/ee07ef4fa1dc4f789c31167f4fa55132",
      rubricUrl: "https://penno365.sharepoint.com/:b:/t/VPUL-GAPSA-FINANCE/EWlf1-q8tHFOpG9qsPhNN5YBVIaebtalJQhye-dYhnJE5Q?e=gr2Oit",
      contact: "gapsa.funds@gapsa.upenn.edu",
      reviewCycle: "Monthly, rolling basis at Finance Committee meetings",
      notes: "",
    },
    {
      id: "synergy",
      name: "Synergy Fund",
      shortName: "Synergy",
      recommended: false,
      purpose: "Enhances academic, social, and cultural pursuits of G12+ governments by incentivizing intergovernmental connections.",
      eligibleOrgs: ["g12"],
      eligibleNeeds: ["group_event"],
      requiresPartner: false,
      application: "Universal Funding Application (auto-referred)",
      applicationUrl: "https://app.smartsheet.com/b/form/ee07ef4fa1dc4f789c31167f4fa55132",
      rubricUrl: null,
      contact: "gapsa.funds@gapsa.upenn.edu",
      reviewCycle: "Auto-referred via Universal Funding Application",
      notes: "",
    },
  ],

  // --- Individual Travel Grants ---
  individualGrants: {
    professional: {
      label: "Professional Student Travel Grants",
      eligible: "DMD, EdD, JD, MD, MSE, MS (non-research Master's programs)",
      covers: "Travel for conferences, case competitions, externships, internships",
      caps: {
        attendingOnly: { max: 500,  percentCap: 75, label: "Attending (not presenting)" },
        presenting:    { max: 1250, percentCap: 75, label: "Presenting / interview / internship" },
      },
      payment: "Retroactive reimbursement via Graduate Grants Office with itemized receipts.",
      perCycleLimit: 1,
      perYearLimit: 2,
    },
    research: {
      label: "Research Student Travel Grants",
      eligible: "PhD or research Master's (AM or MS) programs",
      covers: "Presenting at academic conferences, workshops, meetings",
      caps: {
        attendingOnly: { max: 1000, percentCap: 50, label: "Attending (not presenting)", avgAward: 650 },
        presenting:    { max: 2000, percentCap: null, label: "Presenting", avgAward: 1300 },
        pgla:          { max: 2000, percentCap: 70,   label: "PGLA (international conference)" },
      },
      payment: "Retroactive reimbursement via Graduate Grants Office with itemized receipts.",
      note: "GAPSA grants are terminal funding — exhaust school-level funding first.",
    },
  },

  // --- Lending Vehicle ---
  lendingVehicle: {
    g12:   { limit: "50% of prior year GAP investment",           secured: "Current year GAPSA contribution" },
    ideal: { limit: "Greater of $1,000 or 50% of prior year EF base grant", secured: "Current year EF awards" },
    sgef:  { limit: "50% of prior year revenue",                  secured: "Cash In-Kind program participation" },
    repayment: "All balances due by end of current fiscal year.",
  },

  // --- Key Deadlines (2025-26) ---
  deadlines: {
    submissionDates: [
      { date: "2025-08-24", committeeMeeting: "2025-08-26" },
      { date: "2025-09-28", committeeMeeting: "2025-09-25" },
      { date: "2025-10-28", committeeMeeting: "2025-10-30" },
      { date: "2025-11-23", committeeMeeting: "2025-12-04" },
      { date: "2026-01-25", committeeMeeting: null },
      { date: "2026-02-24", committeeMeeting: null },
      { date: "2026-03-22", committeeMeeting: null },
      { date: "2026-04-26", committeeMeeting: null },
    ],
    aarFall:                 "2025-12-15",
    aarSpring:               "2026-05-15",
    paymentRequestDeadline:  "2026-05-15",
    // Lead times (in days unless labeled)
    minLeadDays:             28,   // 4 weeks minimum
    recommendedLeadDays:     60,   // 2 months recommended
    alcoholRegistrationDays: 10,   // business days before event
    newsletterDays:          14,   // calendar days before event
    paymentRequestDays:      7,    // calendar days before event
    newVendorDays:           21,   // calendar days before event
    reimbursementWindowDays: 10,   // calendar days after purchase
  },

  // --- Compliance Thresholds ---
  compliance: {
    auditThreshold:              2500,
    auditTicketsRequired:        2,
    eventbriteThreshold:         0.4,
    financeCommitteeApprovalCap: 10000,
    costRecoveryTarget:          "1/3 of program costs",
    newsletterUrl:               "https://forms.office.com/pages/responsepage.aspx?id=nZRNbBy5RUyarmbXZEMRDdxU0Mlpl29OqwLmHdguOhFURVRLSEY5VUo5R0w3WE9YQko4T01WRkpYNy4u&route=shorturl",
    aarUrl:                      "https://app.smartsheet.com/b/form/01982f89571f76d3b87206b7ec698216",
    eventbriteRequestUrl:        "https://app.smartsheet.com/b/form/254fbd74f8b74f2ca100b9fa52de306c",
    paymentRequestUrl:           "https://app.smartsheet.com/b/form/0197a2196284785e88aa5e2c257e2c28",
    osaRegistrationUrl:          "https://osa.universitylife.upenn.edu/pennclubs/",
    alcoholRegistrationUrl:      "https://universitylife.upenn.edu/event-registration/",
    appealEmail:                 "gapsa.finance@gapsa.upenn.edu",
  },

  // --- Organization Types ---
  orgTypes: [
    { id: "g12",             label: "G12+ Student Government",     description: "School-level graduate student government" },
    { id: "ideal",           label: "IDEAL Council Member",        description: "IDEAL affinity group" },
    { id: "student_group",   label: "Registered Student Group",    description: "Any OSA-registered graduate student group" },
    { id: "individual_pro",  label: "Individual (Professional)",   description: "DMD, EdD, JD, MD, MSE, MS — seeking travel funding" },
    { id: "individual_research", label: "Individual (Research)",   description: "PhD or research Master's — seeking travel funding" },
  ],

  // --- Funding Needs ---
  fundingNeeds: [
    { id: "group_event",       label: "Group Event or Program"               },
    { id: "academic_event",    label: "Academic Event (conference, symposium)"},
    { id: "community_outreach",label: "Community Outreach"                   },
    { id: "operating_budget",  label: "Operating / Base Budget"              },
    { id: "travel_grant",      label: "Individual Travel / Conference Grant"  },
  ],
};

// ============================================================
// UTILITY HELPERS
// ============================================================

const fmt = (val) => {
  if (val === null || val === undefined) return "N/A";
  if (typeof val === "string") return val;
  return `$${Number(val).toLocaleString()}`;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const addBusinessDays = (date, days) => {
  let d = new Date(date);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() - 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) added++;
  }
  return d;
};

const fmtDate = (d, opts = {}) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", ...opts });

const getNextDeadline = () => {
  const now = new Date();
  return CONFIG.deadlines.submissionDates.find((d) => new Date(d.date) >= now)
    || CONFIG.deadlines.submissionDates[CONFIG.deadlines.submissionDates.length - 1];
};

// Given an event date, compute all key planning deadlines
const computeEventDeadlines = (eventDate) => {
  const ev = new Date(eventDate);
  const today = new Date();
  const dl = CONFIG.deadlines;

  const applicationDeadline = addDays(ev, -dl.minLeadDays);
  const recommendedDeadline = addDays(ev, -dl.recommendedLeadDays);
  const newsletterDeadline  = addDays(ev, -dl.newsletterDays);
  const alcoholDeadline     = addBusinessDays(ev, dl.alcoholRegistrationDays);
  const paymentDeadline     = addDays(ev, -dl.paymentRequestDays);
  const newVendorDeadline   = addDays(ev, -dl.newVendorDays);

  // Find which GAPSA submission cycle catches before applicationDeadline
  const gapsaSubmission = CONFIG.deadlines.submissionDates
    .slice()
    .reverse()
    .find((d) => new Date(d.date) <= applicationDeadline);

  const daysUntil = Math.round((ev - today) / 86400000);

  return { applicationDeadline, recommendedDeadline, newsletterDeadline, alcoholDeadline, paymentDeadline, newVendorDeadline, gapsaSubmission, daysUntil };
};

// ============================================================
// SHARED UI PRIMITIVES
// ============================================================

const PENN_BLUE = "#011F5B";
const PENN_RED  = "#990000";

const Badge = ({ label, color = "blue" }) => {
  const colors = {
    blue:   { bg: "#eff6ff", text: "#1e40af" },
    red:    { bg: "#fef2f2", text: "#991b1b" },
    green:  { bg: "#ecfdf5", text: "#065f46" },
    amber:  { bg: "#fffbeb", text: "#92400e" },
    purple: { bg: "#f5f3ff", text: "#5b21b6" },
  };
  const c = colors[color] || colors.blue;
  return (
    <span style={{ fontSize: 11, background: c.bg, color: c.text, padding: "3px 10px", borderRadius: 10, fontWeight: 500 }}>
      {label}
    </span>
  );
};

const Alert = ({ type = "info", children }) => {
  const styles = {
    info:    { bg: "#eff6ff", border: "#bfdbfe", icon: <Info size={15} color="#2563eb" />,    text: "#1e40af" },
    warning: { bg: "#fffbeb", border: "#fcd34d", icon: <AlertTriangle size={15} color="#d97706" />, text: "#92400e" },
    danger:  { bg: "#fef2f2", border: "#fca5a5", icon: <AlertTriangle size={15} color="#dc2626" />, text: "#7f1d1d" },
    success: { bg: "#f0fdf4", border: "#86efac", icon: <CheckCircle size={15} color="#16a34a" />,   text: "#14532d" },
  };
  const s = styles[type];
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span style={{ marginTop: 1, flexShrink: 0 }}>{s.icon}</span>
      <div style={{ fontSize: 13, color: s.text, lineHeight: 1.5 }}>{children}</div>
    </div>
  );
};

// ============================================================
// NAV BAR
// ============================================================

function NavBar({ mode, setMode }) {
  const tabs = [
    { id: "wizard",    label: "Funding Finder", icon: <Search size={15} /> },
    { id: "planner",   label: "Event Planner",  icon: <Calendar size={15} /> },
    { id: "limits",    label: "Spending Limits", icon: <DollarSign size={15} /> },
    { id: "deadlines", label: "Deadlines",       icon: <Clock size={15} /> },
    { id: "funds",     label: "All Funds",       icon: <BookOpen size={15} /> },
    { id: "forms",     label: "Forms & Links",   icon: <ClipboardList size={15} /> },
  ];
  return (
    <nav style={{ background: PENN_BLUE, borderBottom: `3px solid ${PENN_RED}` }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}>
          <div style={{ background: PENN_RED, borderRadius: 6, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 14 }}>G</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>GAPSA Finance</div>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>Funding Guide & Tools · 2025–26</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setMode(t.id)} style={{
              background: mode === t.id ? "rgba(255,255,255,0.12)" : "transparent",
              border: "none", borderBottom: mode === t.id ? "3px solid #fff" : "3px solid transparent",
              color: mode === t.id ? "#fff" : "rgba(255,255,255,0.65)",
              padding: "14px 13px 11px", cursor: "pointer", fontSize: 13,
              fontWeight: mode === t.id ? 600 : 400,
              display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s",
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

// ============================================================
// FUNDING WIZARD
// ============================================================

function StepIndicator({ current, total, labels }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
      {labels.map((label, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: i < current ? PENN_RED : i === current ? PENN_BLUE : "#e5e7eb",
              color: i <= current ? "#fff" : "#888",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 13, margin: "0 auto", transition: "all 0.2s",
            }}>
              {i < current ? "✓" : i + 1}
            </div>
            <div style={{ fontSize: 10, color: i <= current ? PENN_BLUE : "#aaa", marginTop: 4, fontWeight: i === current ? 600 : 400, maxWidth: 72, lineHeight: 1.2 }}>
              {label}
            </div>
          </div>
          {i < labels.length - 1 && <div style={{ width: 40, height: 2, background: i < current ? PENN_RED : "#e5e7eb", margin: "0 2px", marginBottom: 16, transition: "all 0.2s" }} />}
        </div>
      ))}
    </div>
  );
}

function OptionCard({ selected, onClick, title, description }) {
  return (
    <button onClick={onClick} style={{
      display: "block", width: "100%", textAlign: "left",
      padding: "14px 18px", marginBottom: 8,
      background: selected ? "#f0f4ff" : "#fff",
      border: selected ? `2px solid ${PENN_BLUE}` : "2px solid #e5e7eb",
      borderRadius: 10, cursor: "pointer", transition: "all 0.12s",
    }}>
      <div style={{ fontWeight: 600, fontSize: 14, color: PENN_BLUE }}>{title}</div>
      {description && <div style={{ fontSize: 12, color: "#666", marginTop: 3 }}>{description}</div>}
    </button>
  );
}

function FundingWizard() {
  const [step, setStep] = useState(0);
  const [orgType, setOrgType] = useState(null);
  const [need, setNeed] = useState(null);
  const [multiSchool, setMultiSchool] = useState(null);

  const isIndividual = orgType === "individual_pro" || orgType === "individual_research";
  const grantInfo = orgType === "individual_pro" ? CONFIG.individualGrants.professional
                  : orgType === "individual_research" ? CONFIG.individualGrants.research : null;

  const needOptions = useMemo(() => {
    if (!orgType) return CONFIG.fundingNeeds;
    if (isIndividual) return CONFIG.fundingNeeds.filter((n) => n.id === "travel_grant");
    return CONFIG.fundingNeeds.filter((n) => n.id !== "travel_grant");
  }, [orgType, isIndividual]);

  const showDetailsStep = need === "group_event" && (orgType === "g12" || orgType === "ideal");

  const matchedFunds = useMemo(() => {
    if (step < 3 || isIndividual) return [];
    return CONFIG.funds.filter((f) => {
      if (!f.eligibleOrgs.includes(orgType)) return false;
      if (!f.eligibleNeeds.includes(need)) return false;
      if (f.requiresPartner && !multiSchool) return false;
      return true;
    }).sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0));
  }, [step, orgType, need, multiSchool, isIndividual]);

  const canAdvance = () => {
    if (step === 0) return !!orgType;
    if (step === 1) return !!need;
    if (step === 2) return isIndividual || !showDetailsStep || multiSchool !== null;
    return false;
  };

  const advance = () => {
    if (step === 1 && (isIndividual || !showDetailsStep)) { setStep(3); return; }
    setStep(step + 1);
  };
  const back = () => {
    if (step === 3 && (isIndividual || !showDetailsStep)) { setStep(1); return; }
    setStep(step - 1);
  };
  const reset = () => { setStep(0); setOrgType(null); setNeed(null); setMultiSchool(null); };
  const nextDeadline = getNextDeadline();

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: PENN_BLUE, margin: 0 }}>Find Your Funding Path</h2>
        <p style={{ color: "#666", fontSize: 13, margin: "6px 0 0" }}>Answer a few questions to get your personalized funding plan.</p>
      </div>
      <StepIndicator current={step} total={4} labels={["Organization", "Funding Need", "Details", "Your Plan"]} />

      {step === 0 && (
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 10 }}>What type of organization are you?</p>
          {CONFIG.orgTypes.map((o) => <OptionCard key={o.id} selected={orgType === o.id} onClick={() => setOrgType(o.id)} title={o.label} description={o.description} />)}
        </div>
      )}

      {step === 1 && (
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 10 }}>What do you need funding for?</p>
          {needOptions.map((n) => <OptionCard key={n.id} selected={need === n.id} onClick={() => setNeed(n.id)} title={n.label} />)}
        </div>
      )}

      {step === 2 && showDetailsStep && (
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 10 }}>Will this event span multiple graduate schools?</p>
          <OptionCard selected={multiSchool === true}  onClick={() => setMultiSchool(true)}  title="Yes — multi-school collaboration" description="Two or more graduate schools are co-hosting or participating." />
          <OptionCard selected={multiSchool === false} onClick={() => setMultiSchool(false)} title="No — single school or group"       description="Organized by one group or school." />
        </div>
      )}

      {step === 3 && !isIndividual && (
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: PENN_BLUE, marginBottom: 14 }}>Your Funding Plan</h3>

          {matchedFunds.length === 0 ? (
            <Alert type="warning">No exact match found. Most groups can apply through the <strong>Student Group Event Fund (SGEF)</strong> via the Universal Funding Application.</Alert>
          ) : (
            <>
              <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
                {matchedFunds.length === 1 ? "This fund matches" : "These funds match"} your profile:
              </p>
              {matchedFunds.map((fund) => (
                <div key={fund.id} style={{
                  background: "#fff", borderRadius: 10, padding: 18, marginBottom: 10,
                  border: fund.recommended ? `2px solid ${PENN_BLUE}` : "1px solid #e5e7eb",
                  position: "relative",
                }}>
                  {fund.recommended && (
                    <div style={{
                      position: "absolute", top: -1, left: 16,
                      background: PENN_BLUE, color: "#fff",
                      fontSize: 11, fontWeight: 700, padding: "2px 12px",
                      borderRadius: "0 0 8px 8px", display: "flex", alignItems: "center", gap: 4,
                    }}>
                      <Star size={10} fill="#fff" /> RECOMMENDED
                    </div>
                  )}
                  <div style={{ marginTop: fund.recommended ? 12 : 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: PENN_BLUE }}>{fund.name}</div>
                    {fund.recommended && <div style={{ fontSize: 12, color: "#555", marginTop: 3, fontStyle: "italic" }}>{fund.recommendedReason}</div>}
                    <div style={{ fontSize: 13, color: "#555", marginTop: 6 }}>{fund.purpose}</div>
                    <div style={{ fontSize: 12, color: "#777", marginTop: 6 }}><strong>Review cycle:</strong> {fund.reviewCycle}</div>
                    {fund.notes && <div style={{ fontSize: 12, color: "#999", marginTop: 4, fontStyle: "italic" }}>{fund.notes}</div>}
                    <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <a href={fund.applicationUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, background: PENN_BLUE, color: "#fff", padding: "7px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                        Apply <ExternalLink size={11} />
                      </a>
                      {fund.rubricUrl && (
                        <a href={fund.rubricUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f3f4f6", color: "#333", padding: "7px 14px", borderRadius: 6, fontSize: 13, textDecoration: "none", border: "1px solid #ddd" }}>
                          View Rubric <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Timeline Checklist */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 18, marginTop: 18 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: PENN_BLUE, margin: "0 0 12px" }}>Event Timeline Checklist</h4>
            {[
              { time: "2–3 months out", task: `Submit your funding application. Next GAPSA deadline: ${fmtDate(nextDeadline.date, { month: "long", day: "numeric" })}.` },
              { time: "4 weeks out",    task: "Absolute minimum lead time. Register group with OSA. Complete Finance 101." },
              { time: "3–4 weeks out",  task: "Submit payment requests for new vendors." },
              { time: "2 weeks out",    task: "Submit event to GAPSA newsletter. Confirm alcohol registration if applicable (10 business days required)." },
              { time: "1 week out",     task: "Submit payment requests for all known expenses." },
              { time: "Day of event",   task: `Display GAPSA logo. Track attendance. Reserve 2 tickets for GAPSA reps if funded over ${fmt(CONFIG.compliance.auditThreshold)}.` },
              { time: "Within 10 days", task: "Submit any reimbursement requests with itemized receipts." },
              { time: "By semester deadline", task: "Submit After-Action Review (AAR) — Dec 15 (fall) / May 15 (spring)." },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                <div style={{ minWidth: 120, fontSize: 11, fontWeight: 600, color: PENN_RED, paddingTop: 2 }}>{item.time}</div>
                <div style={{ fontSize: 12, color: "#444", lineHeight: 1.45 }}>{item.task}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && isIndividual && grantInfo && (
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: PENN_BLUE, marginBottom: 6 }}>{grantInfo.label}</h3>
          <p style={{ fontSize: 13, color: "#666", marginBottom: 14 }}>{grantInfo.covers}</p>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16, marginBottom: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#333", marginBottom: 3 }}>Eligible Programs</div>
            <div style={{ fontSize: 13, color: "#555" }}>{grantInfo.eligible}</div>
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 8 }}>Funding Caps</p>
          {Object.values(grantInfo.caps).map((cap, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: "#555" }}>{cap.label}</span>
              <span style={{ fontWeight: 700, fontSize: 15, color: PENN_BLUE }}>
                {fmt(cap.max)}
                {cap.percentCap && <span style={{ fontSize: 11, color: "#888", marginLeft: 4 }}>(or {cap.percentCap}%)</span>}
                {cap.avgAward && <span style={{ fontSize: 11, color: "#888", marginLeft: 4 }}>· avg {fmt(cap.avgAward)}</span>}
              </span>
            </div>
          ))}
          <div style={{ marginTop: 14 }}>
            <Alert type="info"><strong>Payment:</strong> {grantInfo.payment}{grantInfo.note && <><br /><em>{grantInfo.note}</em></>}</Alert>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
        {step > 0
          ? <button onClick={back} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "1px solid #ddd", color: "#666", padding: "9px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}><ChevronLeft size={15} /> Back</button>
          : <div />}
        {step < 3
          ? <button onClick={advance} disabled={!canAdvance()} style={{ display: "flex", alignItems: "center", gap: 4, background: canAdvance() ? PENN_BLUE : "#ccc", color: "#fff", padding: "9px 22px", borderRadius: 8, cursor: canAdvance() ? "pointer" : "default", fontSize: 13, fontWeight: 600, border: "none" }}>Next <ChevronRight size={15} /></button>
          : <button onClick={reset} style={{ background: PENN_RED, color: "#fff", padding: "9px 22px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, border: "none" }}>Start Over</button>}
      </div>
    </div>
  );
}

// ============================================================
// EVENT PLANNER (multi-step calculator)
// ============================================================

const PLANNER_STEPS = ["Event Details", "Attendance", "Budget Builder", "Your Summary"];

const BUDGET_CATEGORIES = [
  { id: "food",        label: "Food & Catering",     limitKey: "foodAlcohol"      },
  { id: "alcohol",     label: "Alcoholic Beverages",  limitKey: "foodAlcohol"      },
  { id: "delivery",    label: "Delivery Services",    limitKey: "delivery"         },
  { id: "venue",       label: "Venue / Facility",     limitKey: "facilitySecurity" },
  { id: "speaker",     label: "Speaker Honoraria",    limitKey: "speakerHonoraria" },
  { id: "equipment",   label: "Equipment / Supplies", limitKey: "eventSupplies"    },
  { id: "printing",    label: "Printing",             limitKey: "printing"         },
  { id: "merchandise", label: "Merchandise / Swag",   limitKey: "swag"             },
  { id: "digital_ads", label: "Digital Advertising",  limitKey: "digitalAds"       },
  { id: "gifts",       label: "Gifts & Prizes",       limitKey: "giftsPrizes"      },
  { id: "other",       label: "Other",                limitKey: null               },
];

function VendorSuggestions({ category, attendees, onSelectVendor }) {
  const relevant = CONFIG.vendors.filter((v) => {
    if (category === "food")    return ["catering", "pizza", "truck", "snacks"].includes(v.subcategory);
    if (category === "alcohol") return false; // no vendor suggestions for alcohol
    if (category === "delivery")return ["catering", "pizza", "truck"].includes(v.subcategory);
    return false;
  });
  if (relevant.length === 0) return null;

  return (
    <div style={{ marginTop: 8, background: "#f8fafc", borderRadius: 8, padding: 12, border: "1px solid #e2e8f0" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
        Vendor Suggestions
        <span style={{ fontWeight: 400, textTransform: "none", marginLeft: 6 }}>— prices are estimates; verify before submitting</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {relevant.slice(0, 6).map((v) => {
          const midEst = Math.round(((v.perPerson.low + v.perPerson.high) / 2) * attendees);
          return (
            <button key={v.id} onClick={() => onSelectVendor(v, midEst)} style={{
              background: "#fff", border: "1px solid #e5e7eb", borderRadius: 7,
              padding: "8px 10px", cursor: "pointer", textAlign: "left",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#333" }}>{v.name}</div>
                {v.recommended && <Star size={10} color={PENN_BLUE} fill={PENN_BLUE} />}
              </div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                ~{fmt(v.perPerson.low)}–{fmt(v.perPerson.high)}/person
                {attendees > 0 && <span style={{ color: PENN_BLUE, fontWeight: 600, marginLeft: 4 }}>≈ {fmt(midEst)} total</span>}
              </div>
              <div style={{ display: "flex", gap: 3, marginTop: 4, flexWrap: "wrap" }}>
                {v.dietary.slice(0, 3).map((d) => <span key={d} style={{ fontSize: 9, background: "#ecfdf5", color: "#065f46", padding: "1px 6px", borderRadius: 6 }}>{d}</span>)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const PLANNER_STORAGE_KEY = "gapsa_planner_v1";

const loadPlannerState = () => {
  try { return JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY)) || {}; } catch { return {}; }
};

function EventPlanner() {
  const saved = useMemo(loadPlannerState, []);

  const [step,       setStep]       = useState(saved.step       ?? 0);
  const [eventDate,  setEventDate]  = useState(saved.eventDate  ?? "");
  const [eventType,  setEventType]  = useState(saved.eventType  ?? null);
  const [hasAlcohol, setHasAlcohol] = useState(saved.hasAlcohol ?? false);
  const [attendees,  setAttendees]  = useState(saved.attendees  ?? 50);
  const [lineItems,  setLineItems]  = useState(saved.lineItems  ?? []);
  const [newCat,     setNewCat]     = useState("food");
  const [newDesc,    setNewDesc]    = useState("");
  const [newAmt,     setNewAmt]     = useState("");
  const [gapsaAmount, setGapsaAmount] = useState(saved.gapsaAmount ?? "");

  const [editingId,  setEditingId]  = useState(null);
  const [editCat,    setEditCat]    = useState("");
  const [editDesc,   setEditDesc]   = useState("");
  const [editAmt,    setEditAmt]    = useState("");

  const startEdit = (li) => { setEditingId(li.id); setEditCat(li.category); setEditDesc(li.description); setEditAmt(String(li.amount)); };
  const saveEdit  = () => {
    if (!editDesc || !editAmt) return;
    setLineItems(lineItems.map(li => li.id === editingId ? { ...li, category: editCat, description: editDesc, amount: Number(editAmt) } : li));
    setEditingId(null);
  };

  useEffect(() => {
    localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(
      { step, eventDate, eventType, hasAlcohol, attendees, lineItems, gapsaAmount }
    ));
  }, [step, eventDate, eventType, hasAlcohol, attendees, lineItems, gapsaAmount]);

  const selectedType = CONFIG.eventTypes.find((e) => e.id === eventType);
  const deadlines = eventDate ? computeEventDeadlines(eventDate) : null;

  const totalBudget = lineItems.reduce((sum, li) => sum + (Number(li.amount) || 0), 0);
  const foodAlcoholTotal = lineItems.filter((li) => li.category === "food" || li.category === "alcohol").reduce((sum, li) => sum + (Number(li.amount) || 0), 0);
  // When alcohol is served at a standard event, the $70/person food+alcohol cap becomes the effective total cap.
  // For galas ($85 cap), the $70 food+alcohol cap is a sub-cap tracked separately.
  const alcoholExpandsCap = hasAlcohol && !!selectedType && selectedType.alcoholAllowed && selectedType.perPersonCap < CONFIG.spendingLimits.foodAlcohol.max;
  const effectivePerPersonCap = selectedType
    ? (alcoholExpandsCap ? CONFIG.spendingLimits.foodAlcohol.max : selectedType.perPersonCap)
    : 0;
  const maxBudget = selectedType ? effectivePerPersonCap * attendees : null;
  const maxFoodAlcohol = CONFIG.spendingLimits.foodAlcohol.max * attendees;
  const pctUsed = maxBudget ? Math.min((totalBudget / maxBudget) * 100, 100) : 0;
  const pctFoodAlcohol = Math.min((foodAlcoholTotal / maxFoodAlcohol) * 100, 100);
  // Food+alcohol sub-cap only shown for galas, where $70 < $85 event cap
  const showFoodAlcoholCap = hasAlcohol && !!selectedType && selectedType.perPersonCap > CONFIG.spendingLimits.foodAlcohol.max;
  const gapsaAmountNum = Number(gapsaAmount) || 0;

  const addLineItem = (desc, amt, cat) => {
    const category = cat || newCat;
    const description = desc || newDesc;
    const amount = amt || Number(newAmt);
    if (!description || !amount) return;
    setLineItems([...lineItems, { id: Date.now(), category, description, amount }]);
    setNewDesc(""); setNewAmt("");
  };

  const removeLineItem = (id) => setLineItems(lineItems.filter((li) => li.id !== id));

  const canAdvanceStep = () => {
    if (step === 0) return !!eventDate && !!eventType;
    if (step === 1) return attendees >= 1;
    return true;
  };

  const [copied, setCopied] = useState(false);

  const copyForApplication = () => {
    const catTotal = (id) => lineItems.filter(li => li.category === id).reduce((s, li) => s + (Number(li.amount) || 0), 0);
    const foodTotal = catTotal("food");
    const alcoholTotal = catTotal("alcohol");
    const printingTotal = catTotal("printing");
    const merchTotal = catTotal("merchandise");
    const digitalAdsTotal = catTotal("digital_ads");
    const equipTotal = catTotal("equipment");
    const giftsTotal = catTotal("gifts");
    const venueTotal = catTotal("venue");
    const deliveryTotal = catTotal("delivery");
    const speakerTotal = catTotal("speaker");
    const otherTotal = catTotal("other");

    const lines = [
      "GAPSA Universal Funding Application — Pre-filled Budget Data",
      "=".repeat(60),
      "",
      "── SECTION 3: EVENT INFORMATION ──────────────────────────",
      `Event Date:           ${eventDate ? fmtDate(eventDate, { month: "long", day: "numeric", year: "numeric" }) : "(enter date)"}`,
      `Event Type:           ${selectedType?.label || "(select type)"}`,
      `Estimated Attendance: ${attendees}`,
      `Alcohol Served:       ${hasAlcohol ? "Yes" : "No"}`,
      "",
      "── SECTION 4: BUDGET DETAILS ─────────────────────────────",
      `Total Budget:                 $${totalBudget.toFixed(2)}`,
      `Amount Requested from GAPSA:  ${gapsaAmountNum > 0 ? "$" + gapsaAmountNum.toFixed(2) : "(enter amount)"}`,
      "",
      "Itemized Budget (paste each line into the UFA form):",
      `  Food & Beverages (nonalcoholic) / Catering:  $${foodTotal.toFixed(2)}`,
      `  Alcoholic Beverages:                         $${alcoholTotal.toFixed(2)}`,
      `  Printing Costs:                              $${printingTotal.toFixed(2)}`,
      `  Merchandise / Swag:                          $${merchTotal.toFixed(2)}`,
      `  Digital Advertising:                         $${digitalAdsTotal.toFixed(2)}`,
      `  Equipment:                                   $${equipTotal.toFixed(2)}`,
      `  Gifts & Prizes:                              $${giftsTotal.toFixed(2)}`,
      `  Facilities Rental & Security:                $${venueTotal.toFixed(2)}`,
      `  Delivery Services:                           $${deliveryTotal.toFixed(2)}`,
      `  Honoraria / Speaker Fee:                     $${speakerTotal.toFixed(2)}`,
      `  Other:                                       $${otherTotal.toFixed(2)}`,
      "",
      "── LINE ITEM DETAIL ───────────────────────────────────────",
      ...lineItems.map(li => `  ${(BUDGET_CATEGORIES.find(c => c.id === li.category)?.label || li.category).padEnd(24)} ${li.description.padEnd(30)} $${Number(li.amount).toFixed(2)}`),
      "",
      "Apply here: " + CONFIG.funds[0].applicationUrl,
    ];

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const downloadSummaryPDF = () => {
    const dl = deadlines;
    const capLabel = alcoholExpandsCap ? "Food & Alcohol Cap" : "Total Event Cap";
    const deadlineRows = [
      { label: "Submit GAPSA Funding Application", url: CONFIG.funds[0].applicationUrl, date: dl?.applicationDeadline, note: dl?.gapsaSubmission ? `Next cycle: submit by ${fmtDate(dl.gapsaSubmission.date)}` : "" },
      { label: "Submit Newsletter Event Listing",  url: CONFIG.compliance.newsletterUrl, date: dl?.newsletterDeadline, note: "2 weeks before event" },
      hasAlcohol && { label: "University Life Alcohol Registration", url: CONFIG.compliance.alcoholRegistrationUrl, date: dl?.alcoholDeadline, note: "10 business days before event" },
      { label: "Submit Payment Requests",          url: CONFIG.compliance.paymentRequestUrl, date: dl?.paymentDeadline, note: "" },
      { label: "New Vendor Payment Requests Due",  url: CONFIG.compliance.paymentRequestUrl, date: dl?.newVendorDeadline, note: "3–4 weeks for new vendors" },
    ].filter(Boolean);

    const complianceItems = [
      "Display the GAPSA logo on all promotional materials.",
      hasAlcohol && "Food must be served alongside any alcohol. Maximum 2 alcoholic drinks per person.",
      gapsaAmountNum > CONFIG.compliance.auditThreshold && `Receiving over ${fmt(CONFIG.compliance.auditThreshold)} from GAPSA — reserve 2 tickets for GAPSA reps. Event subject to in-person audit.`,
      gapsaAmountNum > 0 && totalBudget > 0 && gapsaAmountNum / totalBudget > CONFIG.compliance.eventbriteThreshold && `GAPSA funding exceeds ${Math.round(CONFIG.compliance.eventbriteThreshold * 100)}% of total budget — must use Graduate Events Eventbrite for all ticketing.`,
      "Submit your After-Action Review (AAR) by Dec 15 (fall) or May 15 (spring).",
    ].filter(Boolean);

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>GAPSA Event Summary</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; padding: 40px; max-width: 680px; margin: 0 auto; font-size: 13px; }
  h1 { color: #011F5B; font-size: 22px; margin: 0 0 4px; }
  .subtitle { color: #888; font-size: 12px; margin: 0 0 24px; }
  h2 { color: #011F5B; font-size: 15px; margin: 24px 0 10px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
  .overview { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; background: #011F5B; color: #fff; border-radius: 8px; padding: 16px; margin-bottom: 8px; }
  .overview-item .label { font-size: 10px; opacity: 0.6; text-transform: uppercase; }
  .overview-item .value { font-weight: 700; font-size: 15px; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; }
  td, th { padding: 8px 10px; text-align: left; border-bottom: 1px solid #f0f0f0; font-size: 12px; }
  th { font-weight: 600; color: #888; font-size: 10px; text-transform: uppercase; background: #f8fafc; }
  td.right { text-align: right; font-weight: 600; color: #011F5B; }
  td.note { color: #aaa; font-size: 11px; }
  td.urgent { color: #990000; font-weight: 600; }
  .total-row td { font-weight: 700; border-top: 2px solid #e5e7eb; font-size: 13px; }
  .compliance li { margin-bottom: 6px; line-height: 1.5; }
  .cap-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; display: inline-block; margin-right: 10px; }
  .cap-box .cap-label { font-size: 11px; color: #888; }
  .cap-box .cap-value { font-weight: 700; font-size: 18px; color: #011F5B; }
  .gapsa-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 10px 14px; margin-bottom: 8px; }
  @media print { body { padding: 20px; } }
</style>
</head><body>
<h1>GAPSA Event Summary</h1>
<div class="subtitle">Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · University of Pennsylvania</div>

<div class="overview">
  <div class="overview-item"><div class="label">Event Date</div><div class="value">${eventDate ? fmtDate(eventDate, { month: "long", day: "numeric", year: "numeric" }) : "—"}</div></div>
  <div class="overview-item"><div class="label">Event Type</div><div class="value">${selectedType?.label || "—"}</div></div>
  <div class="overview-item"><div class="label">Attendees</div><div class="value">${attendees}</div></div>
  <div class="overview-item"><div class="label">Alcohol</div><div class="value">${hasAlcohol ? "Yes" : "No"}</div></div>
  <div class="overview-item"><div class="label">Est. Total Budget</div><div class="value">${fmt(totalBudget)}</div></div>
  <div class="overview-item"><div class="label">GAPSA Requested</div><div class="value">${gapsaAmountNum > 0 ? fmt(gapsaAmountNum) : "—"}</div></div>
</div>

<div style="margin: 10px 0 20px;">
  <div class="cap-box"><div class="cap-label">${capLabel}</div><div class="cap-value">${fmt(maxBudget)}</div><div class="cap-label">${attendees} × ${fmt(effectivePerPersonCap)}/person</div></div>
  <div class="cap-box"><div class="cap-label">Delivery Cap</div><div class="cap-value">${fmt(CONFIG.spendingLimits.delivery.max * attendees)}</div><div class="cap-label">${attendees} × ${fmt(CONFIG.spendingLimits.delivery.max)}/person</div></div>
  ${showFoodAlcoholCap ? `<div class="cap-box"><div class="cap-label">Food & Alcohol Sub-Cap</div><div class="cap-value">${fmt(maxFoodAlcohol)}</div><div class="cap-label">${attendees} × ${fmt(CONFIG.spendingLimits.foodAlcohol.max)}/person</div></div>` : ""}
</div>

${dl ? `<h2>Key Deadlines</h2>
<table>
  <thead><tr><th>Deadline</th><th>Date</th><th>Note</th></tr></thead>
  <tbody>
    ${deadlineRows.map(r => `<tr><td${r.date < new Date() ? ' class="urgent"' : ""}>${r.url ? `<a href="${r.url}" style="color:inherit">${r.label}</a>` : r.label}</td><td class="right">${fmtDate(r.date)}</td><td class="note">${r.note}</td></tr>`).join("")}
  </tbody>
</table>` : ""}

${lineItems.length > 0 ? `<h2>Budget Breakdown</h2>
<table>
  <thead><tr><th>Category</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
  <tbody>
    ${lineItems.map(li => `<tr><td>${BUDGET_CATEGORIES.find(c => c.id === li.category)?.label || li.category}</td><td>${li.description}</td><td class="right">${fmt(li.amount)}</td></tr>`).join("")}
    <tr class="total-row"><td colspan="2">Total Estimated</td><td class="right">${fmt(totalBudget)}</td></tr>
  </tbody>
</table>` : ""}

${gapsaAmountNum > 0 ? `<div class="gapsa-box" style="margin-top:20px"><strong>GAPSA Funding Requested: ${fmt(gapsaAmountNum)}</strong>${totalBudget > 0 ? ` (${Math.round((gapsaAmountNum / totalBudget) * 100)}% of total budget)` : ""}</div>` : ""}

<h2>Compliance Reminders</h2>
<ul class="compliance">
  ${complianceItems.map(item => `<li>${item}</li>`).join("")}
</ul>

<p style="margin-top:32px;font-size:11px;color:#aaa">GAPSA Finance Guide · gapsa.upenn.edu · Questions: gapsa.funds@gapsa.upenn.edu</p>
</body></html>`;

    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  // Urgency level for deadline
  const deadlineUrgency = () => {
    if (!deadlines) return null;
    if (deadlines.daysUntil < CONFIG.deadlines.minLeadDays) return "danger";
    if (deadlines.daysUntil < CONFIG.deadlines.recommendedLeadDays) return "warning";
    return "success";
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: PENN_BLUE, margin: 0 }}>Event Planner</h2>
        <p style={{ color: "#666", fontSize: 13, margin: "6px 0 0" }}>Build your event budget and get personalized deadline alerts.</p>
      </div>

      <StepIndicator current={step} total={4} labels={PLANNER_STEPS} />

      {/* ── Step 0: Event Details ── */}
      {step === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#333", display: "block", marginBottom: 8 }}>
              <Calendar size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
              Event Date
            </label>
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              style={{ padding: "10px 14px", border: "1px solid #ddd", borderRadius: 8, fontSize: 15, width: "100%", boxSizing: "border-box" }}
            />
            {deadlines && (
              <div style={{ marginTop: 10 }}>
                <Alert type={deadlineUrgency()}>
                  {deadlines.daysUntil < CONFIG.deadlines.minLeadDays
                    ? <><strong>⚠ Less than 4 weeks away!</strong> GAPSA requires applications at least {CONFIG.deadlines.minLeadDays} days before the event. Expedited review may not be possible.</>
                    : deadlines.daysUntil < CONFIG.deadlines.recommendedLeadDays
                    ? <><strong>Just enough time.</strong> You meet the minimum ({CONFIG.deadlines.minLeadDays} days), but GAPSA recommends 2–3 months of lead time. Submit your application as soon as possible.</>
                    : <><strong>Good timeline.</strong> Your event is {deadlines.daysUntil} days away — you have enough time to apply. Application deadline for this event: <strong>{fmtDate(deadlines.applicationDeadline)}</strong>.</>
                  }
                </Alert>
              </div>
            )}
          </div>

          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#333", display: "block", marginBottom: 10 }}>Event Type</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {CONFIG.eventTypes.map((et) => (
                <button key={et.id} onClick={() => { setEventType(et.id); if (!et.alcoholAllowed) setHasAlcohol(false); }} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 16px", borderRadius: 8, cursor: "pointer", textAlign: "left",
                  background: eventType === et.id ? "#f0f4ff" : "#f9fafb",
                  border: eventType === et.id ? `2px solid ${PENN_BLUE}` : "2px solid #e5e7eb",
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: PENN_BLUE }}>{et.label}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{et.description}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: PENN_RED, whiteSpace: "nowrap" }}>
                    {fmt(et.perPersonCap)}<span style={{ fontSize: 11, color: "#999", fontWeight: 400 }}>/person cap</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedType?.alcoholAllowed && (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#333", display: "block", marginBottom: 10 }}>Will alcohol be served?</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[true, false].map((val) => (
                  <button key={String(val)} onClick={() => setHasAlcohol(val)} style={{
                    flex: 1, padding: "10px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: hasAlcohol === val ? 600 : 400,
                    background: hasAlcohol === val ? PENN_BLUE : "#f8fafc",
                    color: hasAlcohol === val ? "#fff" : "#555",
                    border: hasAlcohol === val ? `2px solid ${PENN_BLUE}` : "2px solid #e5e7eb",
                  }}>
                    {val ? "Yes" : "No"}
                  </button>
                ))}
              </div>
              {hasAlcohol && (
                <div style={{ marginTop: 10 }}>
                  <Alert type="warning">
                    Alcohol events must be registered with University Life Event Registration at least <strong>10 business days</strong> before the event. Food <strong>must</strong> be served alongside alcohol. Max 2 drinks per person.
                    {" "}<a href={CONFIG.compliance.alcoholRegistrationUrl} target="_blank" rel="noreferrer" style={{ color: "#92400e" }}>Register here →</a>
                  </Alert>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Step 1: Attendance ── */}
      {step === 1 && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#333", display: "block", marginBottom: 6 }}>
            <Users size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
            Expected Attendees: <span style={{ color: PENN_RED, fontSize: 22, fontWeight: 700 }}>{attendees}</span>
          </label>
          <input type="range" min={5} max={500} step={5} value={attendees} onChange={(e) => setAttendees(Number(e.target.value))}
            style={{ width: "100%", accentColor: PENN_BLUE, margin: "12px 0" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#999", marginBottom: 20 }}><span>5</span><span>500</span></div>

          <input type="number" min={1} value={attendees} onChange={(e) => setAttendees(Number(e.target.value))}
            style={{ padding: "8px 14px", border: "1px solid #ddd", borderRadius: 8, fontSize: 15, width: 120, textAlign: "center" }}
          />

          {selectedType && (
            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: alcoholExpandsCap ? "Food & Alcohol Cap" : "Total Event Cap", val: effectivePerPersonCap * attendees, sub: `${attendees} × ${fmt(effectivePerPersonCap)}/person${alcoholExpandsCap ? " — food+alcohol cap applies" : ""}` },
                showFoodAlcoholCap && { label: "Food & Alcohol Sub-Cap", val: CONFIG.spendingLimits.foodAlcohol.max * attendees, sub: `${attendees} × ${fmt(CONFIG.spendingLimits.foodAlcohol.max)}/person (within event cap)` },
                { label: "Delivery Cap", val: CONFIG.spendingLimits.delivery.max * attendees, sub: `${attendees} × ${fmt(CONFIG.spendingLimits.delivery.max)}/person` },
              ].filter(Boolean).map((row, i) => (
                <div key={i} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, color: "#888" }}>{row.label}</div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: PENN_BLUE }}>{fmt(row.val)}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{row.sub}</div>
                </div>
              ))}
              {hasAlcohol && (
                <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, color: "#92400e" }}>Max Alcoholic Drinks</div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: "#92400e" }}>{attendees * 2}</div>
                  <div style={{ fontSize: 11, color: "#d97706" }}>2 drinks × {attendees} people</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Budget Builder ── */}
      {step === 2 && (
        <div>
          {/* Running totals */}
          <div style={{ display: "grid", gridTemplateColumns: showFoodAlcoholCap ? "1fr 1fr" : "1fr", gap: 10, marginBottom: 16 }}>
            <div style={{ background: "#fff", border: `2px solid ${totalBudget > (maxBudget || Infinity) ? PENN_RED : "#e5e7eb"}`, borderRadius: 10, padding: "12px 16px" }}>
              <div style={{ fontSize: 12, color: "#888" }}>Total Budget vs Cap</div>
              <div style={{ fontWeight: 700, fontSize: 20, color: totalBudget > (maxBudget || Infinity) ? PENN_RED : PENN_BLUE }}>{fmt(totalBudget)}</div>
              {maxBudget && <div style={{ fontSize: 11, color: "#aaa" }}>of {fmt(maxBudget)} max</div>}
              <div style={{ background: "#f0f0f0", borderRadius: 4, height: 4, marginTop: 6 }}>
                <div style={{ background: pctUsed >= 100 ? PENN_RED : pctUsed > 80 ? "#f59e0b" : "#16a34a", width: `${pctUsed}%`, height: "100%", borderRadius: 4, transition: "width 0.3s" }} />
              </div>
            </div>
            {showFoodAlcoholCap && (
              <div style={{ background: "#fff", border: `2px solid ${foodAlcoholTotal > maxFoodAlcohol ? PENN_RED : "#e5e7eb"}`, borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ fontSize: 12, color: "#888" }}>Food & Alcohol Sub-Cap</div>
                <div style={{ fontWeight: 700, fontSize: 20, color: foodAlcoholTotal > maxFoodAlcohol ? PENN_RED : PENN_BLUE }}>{fmt(foodAlcoholTotal)}</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>of {fmt(maxFoodAlcohol)} max</div>
                <div style={{ background: "#f0f0f0", borderRadius: 4, height: 4, marginTop: 6 }}>
                  <div style={{ background: pctFoodAlcohol >= 100 ? PENN_RED : pctFoodAlcohol > 80 ? "#f59e0b" : "#16a34a", width: `${pctFoodAlcohol}%`, height: "100%", borderRadius: 4, transition: "width 0.3s" }} />
                </div>
              </div>
            )}
          </div>

          {/* Add line item */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 10 }}>Add Line Item</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select value={newCat} onChange={(e) => setNewCat(e.target.value)}
                style={{ padding: "8px 10px", border: "1px solid #ddd", borderRadius: 7, fontSize: 13, background: "#fff" }}>
                {BUDGET_CATEGORIES
                  .filter((c) => c.id !== "alcohol" || hasAlcohol)
                  .map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <input placeholder="Description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                style={{ flex: 1, minWidth: 120, padding: "8px 10px", border: "1px solid #ddd", borderRadius: 7, fontSize: 13 }} />
              <input type="number" placeholder="Amount ($)" value={newAmt} onChange={(e) => setNewAmt(e.target.value)}
                style={{ width: 110, padding: "8px 10px", border: "1px solid #ddd", borderRadius: 7, fontSize: 13 }} />
              <button onClick={() => addLineItem()} style={{ background: PENN_BLUE, color: "#fff", border: "none", borderRadius: 7, padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600 }}>
                <Plus size={14} /> Add
              </button>
            </div>

            {(() => {
              const limitKey = BUDGET_CATEGORIES.find(c => c.id === newCat)?.limitKey;
              const lim = limitKey ? CONFIG.spendingLimits[limitKey] : null;
              if (!lim) return null;
              const capVal = typeof lim.max === "number"
                ? `${fmt(lim.max)} ${lim.unit}${lim.semesterCap ? ` (up to ${fmt(lim.semesterCap)}/semester)` : ""}`
                : `${lim.max} ${lim.unit}`;
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, padding: "5px 10px", background: "#eff6ff", borderRadius: 6 }}>
                  <Info size={12} color="#2563eb" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#1e40af" }}>
                    <strong>Cap:</strong> {capVal}
                    {lim.notes ? <span style={{ color: "#3b82f6" }}> — {lim.notes}</span> : null}
                  </span>
                </div>
              );
            })()}

            {/* Vendor suggestions */}
            {(newCat === "food" || newCat === "delivery") && (
              <VendorSuggestions
                category={newCat}
                attendees={attendees}
                onSelectVendor={(vendor, estimate) => {
                  setNewDesc(vendor.name);
                  setNewAmt(String(estimate));
                }}
              />
            )}
          </div>

          {/* Line items list */}
          {lineItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px 0", color: "#bbb", fontSize: 13 }}>No items yet. Add your first line item above.</div>
          ) : (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 90px 64px", padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid #eee", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase" }}>
                <div>Category</div><div>Description</div><div style={{ textAlign: "right" }}>Amount</div><div />
              </div>
              {lineItems.map((li, i) => (
                editingId === li.id ? (
                  <div key={li.id} style={{ display: "grid", gridTemplateColumns: "130px 1fr 90px 64px", padding: "6px 10px", borderBottom: i < lineItems.length - 1 ? "1px solid #f5f5f5" : "none", alignItems: "center", gap: 4, background: "#f0f4ff" }}>
                    <select value={editCat} onChange={e => setEditCat(e.target.value)}
                      style={{ padding: "5px 6px", border: "1px solid #bfdbfe", borderRadius: 6, fontSize: 12, background: "#fff", width: "100%" }}>
                      {BUDGET_CATEGORIES.filter(c => c.id !== "alcohol" || hasAlcohol).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                    <input value={editDesc} onChange={e => setEditDesc(e.target.value)}
                      style={{ padding: "5px 8px", border: "1px solid #bfdbfe", borderRadius: 6, fontSize: 13, width: "100%", boxSizing: "border-box" }} />
                    <input type="number" value={editAmt} onChange={e => setEditAmt(e.target.value)}
                      style={{ padding: "5px 8px", border: "1px solid #bfdbfe", borderRadius: 6, fontSize: 13, textAlign: "right", width: "100%", boxSizing: "border-box" }} />
                    <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                      <button onClick={saveEdit} style={{ background: "#16a34a", border: "none", borderRadius: 5, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                        <Check size={13} color="#fff" />
                      </button>
                      <button onClick={() => setEditingId(null)} style={{ background: "#e5e7eb", border: "none", borderRadius: 5, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                        <X size={13} color="#555" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={li.id} style={{ display: "grid", gridTemplateColumns: "130px 1fr 90px 64px", padding: "10px 14px", borderBottom: i < lineItems.length - 1 ? "1px solid #f5f5f5" : "none", alignItems: "center" }}>
                    <div><Badge label={BUDGET_CATEGORIES.find((c) => c.id === li.category)?.label || li.category} color="blue" /></div>
                    <div style={{ fontSize: 13, color: "#333" }}>{li.description}</div>
                    <div style={{ textAlign: "right", fontWeight: 600, fontSize: 14, color: PENN_BLUE }}>{fmt(li.amount)}</div>
                    <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                      <button onClick={() => startEdit(li)} style={{ background: "none", border: "none", cursor: "pointer", color: "#93c5fd", display: "flex", alignItems: "center" }}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => removeLineItem(li.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", display: "flex", alignItems: "center" }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 90px 64px", padding: "10px 14px", background: "#f8fafc", borderTop: "2px solid #e5e7eb" }}>
                <div /><div style={{ fontSize: 13, fontWeight: 700 }}>Total</div>
                <div style={{ textAlign: "right", fontWeight: 800, fontSize: 16, color: totalBudget > (maxBudget || Infinity) ? PENN_RED : PENN_BLUE }}>{fmt(totalBudget)}</div>
                <div />
              </div>
            </div>
          )}

          {totalBudget > (maxBudget || Infinity) && (
            <div style={{ marginTop: 10 }}>
              <Alert type="danger"><strong>Over budget!</strong> Your total ({fmt(totalBudget)}) exceeds the {selectedType?.label} cap of {fmt(maxBudget)} for {attendees} attendees. Reduce line items or get advance approval from the Finance Committee.</Alert>
            </div>
          )}
          {foodAlcoholTotal > maxFoodAlcohol && (
            <div style={{ marginTop: 10 }}>
              <Alert type="danger"><strong>Food & Alcohol over cap!</strong> {fmt(foodAlcoholTotal)} exceeds the {fmt(maxFoodAlcohol)} combined cap ({attendees} × {fmt(CONFIG.spendingLimits.foodAlcohol.max)}/person).</Alert>
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Summary ── */}
      {step === 3 && (
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: PENN_BLUE, marginBottom: 16 }}>Your Event Summary</h3>

          {/* Overview card */}
          <div style={{ background: PENN_BLUE, borderRadius: 10, padding: 20, color: "#fff", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              {[
                { label: "Event Date",  value: eventDate ? fmtDate(eventDate, { month: "long", day: "numeric", year: "numeric" }) : "—" },
                { label: "Event Type",  value: selectedType?.label || "—" },
                { label: "Attendees",   value: attendees },
                { label: "Alcohol",     value: hasAlcohol ? "Yes" : "No" },
                { label: "Est. Budget", value: fmt(totalBudget) },
                { label: "Budget Cap",  value: maxBudget ? fmt(maxBudget) : "—" },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{item.label}</div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Deadline alerts */}
          {deadlines && (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 14 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: PENN_BLUE, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={15} /> Key Deadlines for Your Event
              </h4>
              {[
                {
                  label: "Submit GAPSA Funding Application",
                  date: deadlines.applicationDeadline,
                  note: deadlines.gapsaSubmission
                    ? `Next cycle: submit by ${fmtDate(deadlines.gapsaSubmission.date)}`
                    : "Check GAPSA for open cycles",
                  url: CONFIG.funds[0].applicationUrl,
                  urgent: deadlines.applicationDeadline < new Date(),
                },
                { label: "Submit Newsletter Event Listing",  date: deadlines.newsletterDeadline,  url: CONFIG.compliance.newsletterUrl,          urgent: deadlines.newsletterDeadline < new Date() },
                hasAlcohol && { label: "University Life Alcohol Registration", date: deadlines.alcoholDeadline, note: "10 business days before event", url: CONFIG.compliance.alcoholRegistrationUrl, urgent: deadlines.alcoholDeadline < new Date() },
                { label: "Submit Payment Requests",          date: deadlines.paymentDeadline,      url: CONFIG.compliance.paymentRequestUrl,       urgent: deadlines.paymentDeadline < new Date() },
                { label: "New Vendor Payment Requests Due",  date: deadlines.newVendorDeadline,    url: CONFIG.compliance.paymentRequestUrl, note: "3–4 weeks for new vendors", urgent: deadlines.newVendorDeadline < new Date() },
              ].filter(Boolean).map((dl, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "9px 0", borderBottom: i < 3 ? "1px solid #f0f0f0" : "none" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: dl.urgent ? PENN_RED : "#333" }}>
                      {dl.url
                        ? <a href={dl.url} target="_blank" rel="noreferrer" style={{ color: dl.urgent ? PENN_RED : PENN_BLUE, textDecoration: "none", borderBottom: `1px solid ${dl.urgent ? PENN_RED : "#bfdbfe"}` }}>{dl.label} <ExternalLink size={10} style={{ verticalAlign: "middle" }} /></a>
                        : dl.label}
                    </div>
                    {dl.note && <div style={{ fontSize: 11, color: "#aaa" }}>{dl.note}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: dl.urgent ? PENN_RED : PENN_BLUE, whiteSpace: "nowrap" }}>
                      {fmtDate(dl.date)}
                    </div>
                    {dl.urgent && <div style={{ fontSize: 10, color: PENN_RED }}>PAST DUE</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Budget breakdown */}
          {lineItems.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 14 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: PENN_BLUE, margin: "0 0 12px" }}>Budget Breakdown</h4>
              {lineItems.map((li, i) => (
                <div key={li.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < lineItems.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                  <span style={{ fontSize: 13, color: "#555" }}>{li.description}</span>
                  <span style={{ fontWeight: 600, fontSize: 13, color: PENN_BLUE }}>{fmt(li.amount)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", marginTop: 6, borderTop: "2px solid #e5e7eb" }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Total Estimated</span>
                <span style={{ fontWeight: 800, fontSize: 16, color: totalBudget > (maxBudget || Infinity) ? PENN_RED : PENN_BLUE }}>{fmt(totalBudget)}</span>
              </div>
            </div>
          )}

          {/* GAPSA funding requested */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 14 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: PENN_BLUE, margin: "0 0 4px" }}>GAPSA Funding Requested</h4>
            <p style={{ fontSize: 12, color: "#888", margin: "0 0 12px" }}>How much of your budget are you requesting from GAPSA? This determines your compliance requirements.</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16, color: "#555" }}>$</span>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={gapsaAmount}
                onChange={(e) => setGapsaAmount(e.target.value)}
                style={{ width: 140, padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 15 }}
              />
              {totalBudget > 0 && gapsaAmountNum > 0 && (
                <span style={{ fontSize: 13, color: "#888" }}>= {Math.round((gapsaAmountNum / totalBudget) * 100)}% of total budget</span>
              )}
            </div>
            {gapsaAmountNum > 0 && totalBudget > 0 && gapsaAmountNum / totalBudget > CONFIG.compliance.eventbriteThreshold && (
              <div style={{ marginTop: 10 }}>
                <Alert type="warning">
                  GAPSA is funding more than {Math.round(CONFIG.compliance.eventbriteThreshold * 100)}% of your event. You must use the <strong>Graduate Events Eventbrite</strong> account for all ticketing.{" "}
                  <a href={CONFIG.compliance.eventbriteRequestUrl} target="_blank" rel="noreferrer" style={{ color: "#92400e" }}>Request access →</a>
                </Alert>
              </div>
            )}
          </div>

          {/* Compliance reminders */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: PENN_BLUE, margin: "0 0 10px" }}>Compliance Reminders</h4>
            {[
              "Display the GAPSA logo on all promotional materials.",
              hasAlcohol && "Food must be served alongside any alcohol.",
              hasAlcohol && "Maximum 2 alcoholic drinks per person.",
              gapsaAmountNum > CONFIG.compliance.auditThreshold && `Receiving over ${fmt(CONFIG.compliance.auditThreshold)} from GAPSA — reserve 2 tickets for GAPSA representatives. Event is subject to in-person audit.`,
              "Submit your After-Action Review (AAR) within the semester deadline.",
              "Do NOT use personal funds or expect reimbursement without advance approval.",
            ].filter(Boolean).map((note, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <CheckCircle size={14} color="#16a34a" style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#444" }}>{note}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nav */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
        {step > 0
          ? <button onClick={() => setStep(step - 1)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "1px solid #ddd", color: "#666", padding: "9px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}><ChevronLeft size={15} /> Back</button>
          : <div />}
        {step < 3
          ? <button onClick={() => setStep(step + 1)} disabled={!canAdvanceStep()} style={{ display: "flex", alignItems: "center", gap: 4, background: canAdvanceStep() ? PENN_BLUE : "#ccc", color: "#fff", padding: "9px 22px", borderRadius: 8, cursor: canAdvanceStep() ? "pointer" : "default", fontSize: 13, fontWeight: 600, border: "none" }}>Next <ChevronRight size={15} /></button>
          : <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={copyForApplication} style={{ display: "flex", alignItems: "center", gap: 5, background: copied ? "#ecfdf5" : "#fff", color: copied ? "#065f46" : PENN_BLUE, padding: "9px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, border: `1.5px solid ${copied ? "#16a34a" : PENN_BLUE}`, transition: "all 0.2s" }}>
                <ClipboardList size={14} /> {copied ? "Copied!" : "Copy for Application"}
              </button>
              <button onClick={downloadSummaryPDF} style={{ display: "flex", alignItems: "center", gap: 5, background: "#fff", color: "#555", padding: "9px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, border: "1.5px solid #ddd" }}>
                <ClipboardList size={14} /> Save as PDF
              </button>
              <button onClick={() => { localStorage.removeItem(PLANNER_STORAGE_KEY); setStep(0); setEventDate(""); setEventType(null); setHasAlcohol(false); setAttendees(50); setLineItems([]); setGapsaAmount(""); }} style={{ background: PENN_RED, color: "#fff", padding: "9px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, border: "none" }}>Start Over</button>
            </div>}
      </div>
    </div>
  );
}

// ============================================================
// SPENDING LIMITS REFERENCE
// ============================================================

function SpendingLimits() {
  const [search, setSearch] = useState("");
  const limits = Object.values(CONFIG.spendingLimits);
  const filtered = limits.filter((l) => l.label.toLowerCase().includes(search.toLowerCase()) || l.notes.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: PENN_BLUE, marginBottom: 4 }}>Spending Limits Quick Reference</h2>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>All per-person and per-group caps enforced by GAPSA and the University.</p>
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: 11, color: "#999" }} />
        <input type="text" placeholder="Filter categories..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", padding: "10px 10px 10px 34px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
      </div>
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 1fr", padding: "10px 16px", background: "#f8fafc", borderBottom: "2px solid #e5e7eb", fontWeight: 700, fontSize: 11, color: "#777", textTransform: "uppercase" }}>
          <div>Category</div><div style={{ textAlign: "right" }}>Limit</div><div style={{ paddingLeft: 16 }}>Details</div>
        </div>
        {filtered.map((lim, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 130px 1fr", padding: "12px 16px", borderBottom: i < filtered.length - 1 ? "1px solid #f0f0f0" : "none", alignItems: "start" }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#333" }}>{lim.label}</div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: PENN_BLUE }}>{typeof lim.max === "number" ? fmt(lim.max) : lim.max ?? "—"}</span>
              {lim.unit && <div style={{ fontSize: 11, color: "#999" }}>{lim.unit}</div>}
            </div>
            <div style={{ fontSize: 12, color: "#777", paddingLeft: 16 }}>{lim.notes}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>
        <Alert type="danger">Non-compliance may result in forfeiture of current funding, ineligibility for future rounds, or referral to the Center for Community Standards and Accountability (CSA).</Alert>
      </div>
    </div>
  );
}

// ============================================================
// DEADLINES VIEW
// ============================================================

function DeadlinesView() {
  const today = new Date();
  const nextDl = getNextDeadline();
  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: PENN_BLUE, marginBottom: 4 }}>Key Deadlines (2025–26)</h2>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>Submission deadlines for the Universal Funding Application and compliance dates.</p>
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", padding: "10px 16px", background: "#f8fafc", borderBottom: "2px solid #e5e7eb", fontWeight: 700, fontSize: 11, color: "#777", textTransform: "uppercase" }}>
          <div>Submission Deadline</div><div>Committee Meeting</div><div>Status</div>
        </div>
        {CONFIG.deadlines.submissionDates.map((dl, i) => {
          const dlDate = new Date(dl.date);
          const isPast = dlDate < today;
          const isNext = dl === nextDl;
          return (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 80px", padding: "13px 16px",
              borderBottom: i < CONFIG.deadlines.submissionDates.length - 1 ? "1px solid #f0f0f0" : "none",
              background: isNext ? "#eff6ff" : isPast ? "#fafafa" : "#fff",
              borderLeft: isNext ? `3px solid ${PENN_BLUE}` : "3px solid transparent",
            }}>
              <div style={{ fontWeight: isNext ? 700 : 500, fontSize: 14, color: isPast ? "#bbb" : "#333" }}>
                {fmtDate(dl.date)}
              </div>
              <div style={{ fontSize: 13, color: isPast ? "#ccc" : "#666" }}>
                {dl.committeeMeeting ? fmtDate(dl.committeeMeeting) : "TBD"}
              </div>
              <div>
                {isPast ? <Badge label="Past" color="blue" /> : isNext ? <Badge label="Next" color="purple" /> : <Badge label="Open" color="green" />}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ fontWeight: 600, fontSize: 14, color: PENN_BLUE, marginBottom: 10 }}>Other Key Dates</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "Fall AAR Deadline",           date: CONFIG.deadlines.aarFall },
          { label: "Spring AAR Deadline",          date: CONFIG.deadlines.aarSpring },
          { label: "FY25-26 Payment Request Cutoff", date: CONFIG.deadlines.paymentRequestDeadline },
          { label: "Reimbursement Window",         date: `Within ${CONFIG.deadlines.reimbursementWindowDays} days of purchase` },
        ].map((d, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px" }}>
            <div style={{ fontSize: 12, color: "#888" }}>{d.label}</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: PENN_RED }}>
              {d.date.includes("-") ? fmtDate(d.date, { month: "long", day: "numeric", year: "numeric" }) : d.date}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ALL FUNDS REFERENCE
// ============================================================

function FundsReference() {
  const [expanded, setExpanded] = useState(null);
  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: PENN_BLUE, marginBottom: 4 }}>All Funding Sources</h2>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>Complete directory of GAPSA funding mechanisms.</p>
      {CONFIG.funds.map((fund) => (
        <div key={fund.id} style={{ background: "#fff", border: fund.recommended ? `2px solid ${PENN_BLUE}` : "1px solid #e5e7eb", borderRadius: 10, marginBottom: 10, overflow: "hidden" }}>
          <button onClick={() => setExpanded(expanded === fund.id ? null : fund.id)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {fund.recommended && <Star size={15} color={PENN_BLUE} fill={PENN_BLUE} />}
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: PENN_BLUE }}>{fund.name}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{fund.reviewCycle}</div>
              </div>
            </div>
            <ChevronRight size={17} color="#999" style={{ transform: expanded === fund.id ? "rotate(90deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }} />
          </button>
          {expanded === fund.id && (
            <div style={{ padding: "0 20px 18px", borderTop: "1px solid #f0f0f0" }}>
              <div style={{ fontSize: 13, color: "#555", marginTop: 10 }}>{fund.purpose}</div>
              {fund.recommended && <div style={{ fontSize: 12, color: PENN_BLUE, marginTop: 6, fontStyle: "italic" }}>{fund.recommendedReason}</div>}
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {fund.eligibleOrgs.map((o) => {
                  const label = CONFIG.orgTypes.find((ot) => ot.id === o)?.label || o;
                  return <Badge key={o} label={label} color="blue" />;
                })}
                {fund.requiresPartner && <Badge label="Multi-school required" color="amber" />}
              </div>
              {fund.notes && <div style={{ fontSize: 12, color: "#999", marginTop: 8, fontStyle: "italic" }}>{fund.notes}</div>}
              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <a href={fund.applicationUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, background: PENN_BLUE, color: "#fff", padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>Apply <ExternalLink size={11} /></a>
                {fund.rubricUrl && <a href={fund.rubricUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f3f4f6", color: "#333", padding: "7px 14px", borderRadius: 6, fontSize: 12, textDecoration: "none", border: "1px solid #ddd" }}>Rubric <ExternalLink size={11} /></a>}
                <a href={`mailto:${fund.contact}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f3f4f6", color: "#333", padding: "7px 14px", borderRadius: 6, fontSize: 12, textDecoration: "none", border: "1px solid #ddd" }}>Contact</a>
              </div>
            </div>
          )}
        </div>
      ))}

      <h3 style={{ fontSize: 17, fontWeight: 700, color: PENN_BLUE, marginTop: 28, marginBottom: 10 }}>Individual Travel Grants</h3>
      {Object.entries(CONFIG.individualGrants).map(([key, grant]) => (
        <div key={key} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: PENN_BLUE }}>{grant.label}</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{grant.eligible}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {Object.values(grant.caps).map((cap, i) => (
              <div key={i} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#888" }}>{cap.label}</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: PENN_BLUE }}>{fmt(cap.max)}</div>
                {"avgAward" in cap && <div style={{ fontSize: 10, color: "#aaa" }}>avg {fmt(cap.avgAward)}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// FORMS & LINKS DIRECTORY
// ============================================================

function FormsLinks() {
  const c = CONFIG.compliance;
  const sections = [
    { category: "Applications", items: [
      { label: "Universal Funding Application",          url: "https://app.smartsheet.com/b/form/ee07ef4fa1dc4f789c31167f4fa55132" },
      { label: "IPF Application",                        url: "https://app.smartsheet.com/b/form/817a489c0a3b4bddae7dce62e4f8e904" },
      { label: "Empowerment Fund Application",           url: "https://app.smartsheet.com/b/form/01983297b3dd73898f1ac0e45850bdd7" },
      { label: "Affinity Partnership Fund Application",  url: "https://app.smartsheet.com/b/form/18e4ef7e690640499629a1aa64ba8576" },
    ]},
    { category: "Compliance & Reporting", items: [
      { label: "After-Action Review (AAR)",              url: c.aarUrl },
      { label: "Graduate Events Eventbrite Request",     url: c.eventbriteRequestUrl },
      { label: "Graduate Student Activities Payment Request", url: c.paymentRequestUrl },
      { label: "GAPSA Newsletter Submission",            url: c.newsletterUrl },
    ]},
    { category: "Registration & Policies", items: [
      { label: "OSA Group Registration (PennClubs)",     url: c.osaRegistrationUrl },
      { label: "University Life Event Registration (Alcohol)", url: c.alcoholRegistrationUrl },
    ]},
    { category: "Contacts", items: [
      { label: "Fund Management — gapsa.funds@gapsa.upenn.edu",     url: "mailto:gapsa.funds@gapsa.upenn.edu",    isEmail: true },
      { label: "IDEAL / EF — gapsa.ideal@gapsa.upenn.edu",          url: "mailto:gapsa.ideal@gapsa.upenn.edu",    isEmail: true },
      { label: "Research / AEF — gapsa.research@gapsa.upenn.edu",   url: "mailto:gapsa.research@gapsa.upenn.edu", isEmail: true },
      { label: "VP of Finance (Appeals) — gapsa.finance@gapsa.upenn.edu", url: `mailto:${c.appealEmail}`,          isEmail: true },
      { label: "Graduate Student Center — gradcenter@upenn.edu",    url: "mailto:gradcenter@upenn.edu",            isEmail: true },
    ]},
  ];
  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: PENN_BLUE, marginBottom: 4 }}>Forms & Links Directory</h2>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>Every form, application, and contact in one place.</p>
      {sections.map((section) => (
        <div key={section.category} style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: PENN_RED, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>{section.category}</h3>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
            {section.items.map((item, i) => (
              <a key={i} href={item.url} target={item.isEmail ? undefined : "_blank"} rel="noreferrer"
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", textDecoration: "none", color: "#333", borderBottom: i < section.items.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>
                <ExternalLink size={13} color="#bbb" />
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// ROOT APP
// ============================================================

export default function GAPSAFinanceWizard() {
  const [mode, setMode] = useState("wizard");
  const nextDeadline = getNextDeadline();

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", background: "#f5f6f8", minHeight: "100vh" }}>
      <NavBar mode={mode} setMode={setMode} />

      {/* Deadline Banner */}
      <div style={{ background: "#fffbeb", borderBottom: "1px solid #fcd34d", padding: "9px 20px", textAlign: "center" }}>
        <span style={{ fontSize: 13, color: "#92400e" }}>
          <Calendar size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
          <strong>Next application deadline:</strong>{" "}
          {fmtDate(nextDeadline.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          {nextDeadline.committeeMeeting && <span style={{ color: "#b45309" }}> — Committee meets {fmtDate(nextDeadline.committeeMeeting, { month: "short", day: "numeric" })}</span>}
        </span>
      </div>

      <div style={{ padding: "28px 20px 60px" }}>
        {mode === "wizard"    && <FundingWizard />}
        {mode === "planner"   && <EventPlanner />}
        {mode === "limits"    && <SpendingLimits />}
        {mode === "deadlines" && <DeadlinesView />}
        {mode === "funds"     && <FundsReference />}
        {mode === "forms"     && <FormsLinks />}
      </div>

      <div style={{ textAlign: "center", padding: "18px", borderTop: "1px solid #e5e7eb", background: "#fff", fontSize: 12, color: "#aaa" }}>
        GAPSA Division of Finance · University of Pennsylvania · 2025–26 Academic Year
      </div>
    </div>
  );
}
