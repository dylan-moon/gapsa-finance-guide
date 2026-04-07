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

  // --- Quick Resources (update URLs each year) ---
  resources: {
    preferredVendorsUrl:    "https://cms.business-services.upenn.edu/purchasing-services/purchasing-overview/",
    newVendorOnboardingUrl: "https://cms.business-services.upenn.edu/purchasing-services/vendor-resources/",
    ispOnboardingEmail:     "gradcenter@upenn.edu",
    gapsaLogoUrl:           "https://www.gapsa.upenn.edu", // Replace with direct logo asset link
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
    { id: "planner",   label: "Event Planner",  icon: <Calendar size={15} /> },
    { id: "funding",   label: "Find Funding",   icon: <Search size={15} /> },
    { id: "guide",     label: "How It Works",   icon: <Info size={15} /> },
    { id: "resources", label: "Resources",      icon: <BookOpen size={15} /> },
    { id: "cert",      label: "Certification",  icon: <CheckCircle size={15} /> },
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

// Parse a simple CSV file into an array of vendor objects.
// Handles double-quoted fields (for the dietary column which uses ; as delimiter).
function parseVendorCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const fields = [];
    let i = 0;
    while (i < line.length) {
      if (line[i] === '"') {
        const end = line.indexOf('"', i + 1);
        fields.push(end === -1 ? line.slice(i + 1) : line.slice(i + 1, end));
        i = end === -1 ? line.length : end + 2;
      } else {
        const end = line.indexOf(",", i);
        fields.push(end === -1 ? line.slice(i) : line.slice(i, end));
        i = end === -1 ? line.length : end + 1;
      }
    }
    const row = Object.fromEntries(headers.map((h, idx) => [h, (fields[idx] || "").trim()]));
    const pLow  = row.perPersonLow  ? Number(row.perPersonLow)  : null;
    const pHigh = row.perPersonHigh ? Number(row.perPersonHigh) : null;
    return {
      id:                  row.id,
      name:                row.name,
      category:            row.category,
      subcategory:         row.subcategory,
      perPerson:           (pLow && pHigh) ? { low: pLow, high: pHigh } : null,
      minOrder:            row.minOrder ? Number(row.minOrder) : null,
      dietary:             row.dietary ? row.dietary.split(";").map((d) => d.trim()).filter(Boolean) : [],
      notes:               row.notes || "",
      url:                 row.url     || undefined,
      contact:             row.contact || undefined,
      recommended:         row.recommended      === "true",
      pennApproved:        row.pennApproved      === "true",
      isSmallBusiness:     row.isSmallBusiness   === "true",
      sustainabilityLevel: row.sustainabilityLevel ? Number(row.sustainabilityLevel) : null,
      cuisines:            row.cuisines || "",
    };
  }).filter((v) => v.id && v.name);
}

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

function VendorSuggestions({ category, attendees, onSelectVendor, vendors = CONFIG.vendors }) {
  const relevant = vendors
    .filter((v) => {
      if (category === "food")     return ["catering", "pizza", "truck", "snacks"].includes(v.subcategory);
      if (category === "alcohol")  return false;
      if (category === "delivery") return ["catering", "pizza", "truck"].includes(v.subcategory);
      return false;
    })
    .sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0));
  if (relevant.length === 0) return null;

  return (
    <div style={{ marginTop: 8, background: "#f8fafc", borderRadius: 8, padding: 12, border: "1px solid #e2e8f0" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
        Vendor Suggestions
        <span style={{ fontWeight: 400, textTransform: "none", marginLeft: 6 }}>— prices are estimates; verify before submitting</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {relevant.slice(0, 6).map((v) => {
          const hasPrice = v.perPerson && v.perPerson.low > 0;
          const midEst = hasPrice ? Math.round(((v.perPerson.low + v.perPerson.high) / 2) * attendees) : 0;
          return (
            <button key={v.id} onClick={() => onSelectVendor(v, hasPrice ? midEst : "")} style={{
              background: "#fff", border: "1px solid #e5e7eb", borderRadius: 7,
              padding: "8px 10px", cursor: "pointer", textAlign: "left",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#333" }}>{v.name}</div>
                {v.recommended && <Star size={10} color={PENN_BLUE} fill={PENN_BLUE} />}
              </div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                {hasPrice
                  ? <span>~{fmt(v.perPerson.low)}–{fmt(v.perPerson.high)}/person{attendees > 0 && <span style={{ color: PENN_BLUE, fontWeight: 600, marginLeft: 4 }}>≈ {fmt(midEst)}</span>}</span>
                  : <span style={{ color: "#bbb", fontStyle: "italic" }}>contact for pricing</span>
                }
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

  const [vendors, setVendors] = useState(CONFIG.vendors);
  useEffect(() => {
    fetch("/vendors.csv")
      .then((r) => r.ok ? r.text() : Promise.reject())
      .then((text) => {
        const parsed = parseVendorCSV(text);
        if (parsed.length > 0) setVendors(parsed);
      })
      .catch(() => { /* silently fall back to CONFIG.vendors */ });
  }, []);

  const [step,       setStep]       = useState(saved.step       ?? 0);
  const [eventDate,  setEventDate]  = useState(saved.eventDate  ?? "");
  const [eventType,  setEventType]  = useState(saved.eventType  ?? null);
  const [hasAlcohol, setHasAlcohol] = useState(saved.hasAlcohol ?? false);
  const [isTicketed, setIsTicketed] = useState(saved.isTicketed ?? null);
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
      { step, eventDate, eventType, hasAlcohol, isTicketed, attendees, lineItems, gapsaAmount }
    ));
  }, [step, eventDate, eventType, hasAlcohol, isTicketed, attendees, lineItems, gapsaAmount]);

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

  const openPrefilledApplication = () => {
    const catTotal = (id) => lineItems.filter(li => li.category === id).reduce((s, li) => s + (Number(li.amount) || 0), 0);
    // Convert stored YYYY-MM-DD to MM-DD-YYYY as expected by the UFA form
    const formattedDate = eventDate
      ? eventDate.split("-").slice(1).concat(eventDate.split("-")[0]).join("-")
      : "";
    // Field labels must match the UFA form exactly (case-sensitive per Smartsheet docs)
    const params = new URLSearchParams();
    if (formattedDate)     params.set("List the dates of your event(s) or program(s)", formattedDate);
    if (attendees)         params.set("What is the estimated attendance for your event?", String(attendees));
    if (totalBudget)       params.set("What is the total budget of your event(s)?", String(Math.round(totalBudget)));
    if (gapsaAmountNum)    params.set("What portion are you requesting from GAPSA?", String(Math.round(gapsaAmountNum)));
    params.set("Food & Beverages (nonalcoholic) / Catering", String(Math.round(catTotal("food"))));
    params.set("Alcoholic Beverages",        String(Math.round(catTotal("alcohol"))));
    params.set("Printing Costs",             String(Math.round(catTotal("printing"))));
    params.set("Merchandise/Swag",           String(Math.round(catTotal("merchandise"))));
    params.set("Digital Advertising",        String(Math.round(catTotal("digital_ads"))));
    params.set("Equipment",                  String(Math.round(catTotal("equipment"))));
    params.set("Gifts & Prizes",             String(Math.round(catTotal("gifts"))));
    params.set("Facilities Rental & Security", String(Math.round(catTotal("venue"))));
    params.set("Delivery Services",          String(Math.round(catTotal("delivery"))));
    params.set("Honoraria/Speaker Fee",      String(Math.round(catTotal("speaker"))));
    if (catTotal("other") > 0) params.set("Other expenses - Please specify", String(Math.round(catTotal("other"))));
    window.open(`${CONFIG.funds[0].applicationUrl}?${params.toString()}`, "_blank");
  };

  const downloadCalendar = () => {
    if (!deadlines) return;
    const icsDate = (d) => {
      const dt = new Date(d);
      return `${dt.getFullYear()}${String(dt.getMonth()+1).padStart(2,"0")}${String(dt.getDate()).padStart(2,"0")}`;
    };
    const icsDateNext = (d) => {
      const dt = new Date(d);
      dt.setDate(dt.getDate() + 1);
      return `${dt.getFullYear()}${String(dt.getMonth()+1).padStart(2,"0")}${String(dt.getDate()).padStart(2,"0")}`;
    };
    const now = new Date().toISOString().replace(/[-:]/g,"").split(".")[0] + "Z";
    const eventLabel = eventDate ? `(${fmtDate(eventDate, { month: "short", day: "numeric" })})` : "";
    const rows = [
      { summary: `GAPSA Application Due ${eventLabel}`, date: deadlines.applicationDeadline, url: CONFIG.funds[0].applicationUrl, description: "Submit the Universal Funding Application at least 4 weeks before your event." },
      { summary: `GAPSA Newsletter Submission Due ${eventLabel}`, date: deadlines.newsletterDeadline, url: CONFIG.compliance.newsletterUrl, description: "Submit your event listing to the GAPSA newsletter (2 weeks before event)." },
      hasAlcohol && { summary: `Alcohol Event Registration Due ${eventLabel}`, date: deadlines.alcoholDeadline, url: CONFIG.compliance.alcoholRegistrationUrl, description: "Register your event with University Life — required 10 business days before any event with alcohol." },
      { summary: `Payment Requests Due ${eventLabel}`, date: deadlines.paymentDeadline, url: CONFIG.compliance.paymentRequestUrl, description: "Submit all payment requests at least 1 week before your event." },
      { summary: `New Vendor Payment Requests Due ${eventLabel}`, date: deadlines.newVendorDeadline, url: CONFIG.compliance.paymentRequestUrl, description: "Submit payment requests for any new vendors 3–4 weeks before your event." },
    ].filter(Boolean);

    const vevents = rows.map((r, i) => [
      "BEGIN:VEVENT",
      `UID:gapsa-deadline-${i}-${Date.now()}@gapsa-finance-guide`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${icsDate(r.date)}`,
      `DTEND;VALUE=DATE:${icsDateNext(r.date)}`,
      `SUMMARY:${r.summary}`,
      `DESCRIPTION:${r.description}`,
      `URL:${r.url}`,
      "BEGIN:VALARM",
      "TRIGGER:-P1D",
      "ACTION:DISPLAY",
      `DESCRIPTION:Reminder: ${r.summary}`,
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n")).join("\r\n");

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//GAPSA Finance Guide//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      vevents,
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `gapsa-event-deadlines${eventDate ? "-" + eventDate : ""}.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
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
            <label style={{ fontSize: 13, fontWeight: 600, color: "#333", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Calendar size={14} />
              Event Date
              <span style={{ color: PENN_RED, fontSize: 11, fontWeight: 700 }}>required</span>
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

          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#333", display: "block", marginBottom: 10 }}>Will this be a ticketed event?</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[true, false].map((val) => (
                <button key={String(val)} onClick={() => setIsTicketed(val)} style={{
                  flex: 1, padding: "10px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: isTicketed === val ? 600 : 400,
                  background: isTicketed === val ? PENN_BLUE : "#f8fafc",
                  color: isTicketed === val ? "#fff" : "#555",
                  border: isTicketed === val ? `2px solid ${PENN_BLUE}` : "2px solid #e5e7eb",
                }}>
                  {val ? "Yes" : "No"}
                </button>
              ))}
            </div>
            {isTicketed === true && (
              <div style={{ marginTop: 10 }}>
                <Alert type="info">
                  <strong>Ticketing rules:</strong> If GAPSA funds more than{" "}
                  <strong>{Math.round(CONFIG.compliance.eventbriteThreshold * 100)}%</strong> of your total event budget,
                  you must use the <strong>Graduate Events Eventbrite account</strong> for all ticketing — your personal or
                  club account is not permitted. Request access via the link below.
                  {" "}<a href={CONFIG.compliance.eventbriteRequestUrl} target="_blank" rel="noreferrer" style={{ color: "#1e40af" }}>Request Eventbrite access →</a>
                </Alert>
              </div>
            )}
            {isTicketed === false && (
              <div style={{ marginTop: 10 }}>
                <Alert type="success">
                  Free admission — no ticketing rules apply.
                </Alert>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 1: Attendance ── */}
      {step === 1 && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#333", display: "block", marginBottom: 6 }}>
            <Users size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
            Expected Attendees: <span style={{ color: PENN_RED, fontSize: 22, fontWeight: 700 }}>{attendees}</span>
          </label>
          <input type="range" min={5} max={150} step={5} value={Math.min(attendees, 150)} onChange={(e) => setAttendees(Number(e.target.value))}
            style={{ width: "100%", accentColor: PENN_BLUE, margin: "12px 0" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#999", marginBottom: 20 }}><span>5</span><span>150+</span></div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="number" min={1} value={attendees} onChange={(e) => setAttendees(Math.max(1, Number(e.target.value)))}
              style={{ padding: "8px 14px", border: "1px solid #ddd", borderRadius: 8, fontSize: 15, width: 120, textAlign: "center" }}
            />
            {attendees > 150 && <span style={{ fontSize: 12, color: "#888" }}>Large event — slider capped at 150</span>}
          </div>

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
                vendors={vendors}
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
                { label: "Ticketed",    value: isTicketed === null ? "—" : isTicketed ? "Yes" : "No" },
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: PENN_BLUE, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <Calendar size={15} /> Key Deadlines for Your Event
                </h4>
                <button onClick={downloadCalendar} style={{ display: "flex", alignItems: "center", gap: 5, background: "#f0f4ff", color: PENN_BLUE, border: `1px solid #bfdbfe`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  <Calendar size={12} /> Add to Calendar
                </button>
              </div>
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
              {(() => {
                const categoryActions = {
                  speaker: { text: "Speaker ISP onboarding required", url: "mailto:gradcenter@upenn.edu" },
                  alcohol:  { text: "Register with University Life", url: CONFIG.compliance.alcoholRegistrationUrl },
                  gifts:    { text: "W-9 required for physical prizes", url: null },
                };
                return lineItems.map((li, i) => {
                  const catLabel = BUDGET_CATEGORIES.find(c => c.id === li.category)?.label || li.category;
                  const action = categoryActions[li.category];
                  return (
                    <div key={li.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px 0", borderBottom: i < lineItems.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#888", marginBottom: 1 }}>{catLabel}</div>
                        <div style={{ fontSize: 13, color: "#333" }}>{li.description}</div>
                        {action && (
                          <div style={{ fontSize: 11, marginTop: 2 }}>
                            {action.url
                              ? <a href={action.url} target={action.url.startsWith("mailto") ? undefined : "_blank"} rel="noreferrer" style={{ color: PENN_BLUE, textDecoration: "none", borderBottom: "1px solid #bfdbfe", display: "inline-flex", alignItems: "center", gap: 3 }}>{action.text} <ExternalLink size={9} /></a>
                              : <span style={{ color: "#d97706" }}>{action.text}</span>
                            }
                          </div>
                        )}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 13, color: PENN_BLUE, whiteSpace: "nowrap", marginLeft: 12 }}>{fmt(li.amount)}</span>
                    </div>
                  );
                });
              })()}
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
              isTicketed && totalBudget > 0 && gapsaAmountNum / totalBudget > CONFIG.compliance.eventbriteThreshold
                && <span>Ticketed event: GAPSA funds {">"}40% of budget — must use <strong>Graduate Events Eventbrite</strong> account.{" "}<a href={CONFIG.compliance.eventbriteRequestUrl} target="_blank" rel="noreferrer" style={{ color: PENN_BLUE }}>Request access →</a></span>,
              isTicketed && totalBudget > 0 && gapsaAmountNum / totalBudget <= CONFIG.compliance.eventbriteThreshold
                && "Ticketed event with GAPSA funding ≤40% — personal or club Eventbrite account is permitted.",
              gapsaAmountNum > CONFIG.compliance.auditThreshold && `Receiving over ${fmt(CONFIG.compliance.auditThreshold)} from GAPSA — reserve 2 tickets for GAPSA representatives. Event is subject to in-person audit.`,
              <span>Submit your <a href={CONFIG.compliance.aarUrl} target="_blank" rel="noreferrer" style={{ color: PENN_BLUE }}>After-Action Review (AAR)</a> — due Dec 15 (fall) or May 15 (spring).</span>,
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
              <button onClick={openPrefilledApplication} style={{ display: "flex", alignItems: "center", gap: 5, background: PENN_BLUE, color: "#fff", padding: "9px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, border: "none" }}>
                <ExternalLink size={14} /> Open Pre-filled Application
              </button>
              <button onClick={downloadSummaryPDF} style={{ display: "flex", alignItems: "center", gap: 5, background: "#fff", color: "#555", padding: "9px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, border: "1.5px solid #ddd" }}>
                <ClipboardList size={14} /> Save as PDF
              </button>
              <button onClick={() => { localStorage.removeItem(PLANNER_STORAGE_KEY); setStep(0); setEventDate(""); setEventType(null); setHasAlcohol(false); setIsTicketed(null); setAttendees(50); setLineItems([]); setGapsaAmount(""); }} style={{ background: PENN_RED, color: "#fff", padding: "9px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, border: "none" }}>Start Over</button>
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
// PROCESS GUIDE — "How It Works"
// ============================================================

const _sgefUrl = CONFIG.funds.find((f) => f.id === "sgef").applicationUrl;

const PROCESS_PHASES = [
  {
    id: 1,
    label: "Ideation",
    time: "8–12 weeks out",
    color: "#6366f1",
    items: [
      "Define your event concept, goals, and target audience.",
      "Estimate attendance and build a rough budget.",
      <span>Decide which funding sources fit your org (<a href="#" onClick={(e) => e.preventDefault()} data-tab="funding" style={{ color: "#6366f1" }}>SGEF, IPF, AEF, etc.</a>).</span>,
      <span>Confirm your org is registered with OSA via <a href={CONFIG.compliance.osaRegistrationUrl} target="_blank" rel="noreferrer" style={{ color: "#6366f1" }}>PennClubs</a>.</span>,
      <span>Review <a href="#" onClick={(e) => e.preventDefault()} data-tab="resources" style={{ color: "#6366f1" }}>GAPSA spending limits</a> before finalizing your budget.</span>,
    ],
    links: [],
  },
  {
    id: 2,
    label: "Apply",
    time: "4–8 weeks out",
    color: "#0ea5e9",
    items: [
      <span>Submit the <a href={_sgefUrl} target="_blank" rel="noreferrer" style={{ color: "#0ea5e9" }}>Universal Funding Application (UFA)</a> — minimum {CONFIG.deadlines.minLeadDays} days before your event.</span>,
      "Build your budget using GAPSA's line-item categories (food, delivery, venue, speaker, etc.).",
      `Requests over ${fmt(CONFIG.compliance.financeCommitteeApprovalCap)} go to the full General Assembly — budget 8–12 weeks.`,
      "Watch your email for Finance Committee follow-up questions.",
    ],
    links: [],
  },
  {
    id: 3,
    label: "Prepare",
    time: "2–4 weeks out",
    color: "#10b981",
    items: [
      <span>⭐ Use <a href={CONFIG.resources.preferredVendorsUrl} target="_blank" rel="noreferrer" style={{ color: "#10b981" }}>Penn-approved preferred vendors</a> whenever possible — payments process faster and admin burden is lower.</span>,
      <span>New vendor not yet in Penn's system? <a href={CONFIG.resources.newVendorOnboardingUrl} target="_blank" rel="noreferrer" style={{ color: "#10b981" }}>Onboard them</a> early — expect 3 extra weeks for processing.</span>,
      <span>Serving alcohol? <a href={CONFIG.compliance.alcoholRegistrationUrl} target="_blank" rel="noreferrer" style={{ color: "#10b981" }}>Register with University Life</a> at least 10 business days before the event.</span>,
      <span>GAPSA funding {">"} {Math.round(CONFIG.compliance.eventbriteThreshold * 100)}% of your budget? All ticketing must use <a href={CONFIG.compliance.eventbriteRequestUrl} target="_blank" rel="noreferrer" style={{ color: "#10b981" }}>Graduate Events Eventbrite</a>.</span>,
      <span>Speaker or performer? Complete <a href={`mailto:${CONFIG.resources.ispOnboardingEmail}`} style={{ color: "#10b981" }}>ISP onboarding</a> through the Graduate Student Center before the event.</span>,
    ],
    links: [],
  },
  {
    id: 4,
    label: "Promote",
    time: "1–2 weeks out",
    color: "#f59e0b",
    items: [
      <span>Submit your event to the <a href={CONFIG.compliance.newsletterUrl} target="_blank" rel="noreferrer" style={{ color: "#f59e0b" }}>GAPSA newsletter</a> — deadline: 14 days before the event.</span>,
      "Display the GAPSA logo on all promotional materials per your funding agreement.",
      "Confirm final headcount with your caterer.",
      "Share event details with GAPSA reps if your event is subject to audit.",
    ],
    links: [],
  },
  {
    id: 5,
    label: "Event Day",
    time: "Day of event",
    color: PENN_RED,
    items: [
      "Track actual attendance — you'll need exact numbers for your AAR.",
      `If funded > ${fmt(CONFIG.compliance.auditThreshold)} from GAPSA, reserve 2 tickets for GAPSA representatives.`,
      "Collect all receipts — reimbursements require original itemized receipts.",
      "Alcohol service: food must be served alongside, max 2 drinks per person.",
    ],
    links: [],
  },
  {
    id: 6,
    label: "After",
    time: `Within ${CONFIG.deadlines.reimbursementWindowDays} days`,
    color: "#8b5cf6",
    items: [
      `Submit reimbursement requests within ${CONFIG.deadlines.reimbursementWindowDays} calendar days of each purchase.`,
      <span>File your <a href={CONFIG.compliance.aarUrl} target="_blank" rel="noreferrer" style={{ color: "#8b5cf6" }}>After-Action Report (AAR)</a> — Fall deadline: Dec 15, Spring: May 15.</span>,
      "Include actual attendance and final spending figures in your AAR.",
      "Late or incomplete AARs may affect future funding eligibility.",
    ],
    links: [],
  },
];

const PICKLEBALL_EXAMPLE = {
  org: "Graduate Racquet Club",
  event: "Spring Pickleball Social",
  meta: [
    { icon: "👥", label: "Attendees", value: "60 students" },
    { icon: "📍", label: "Venue", value: "Penn Palestra" },
    { icon: "💰", label: "Fund", value: "SGEF" },
    { icon: "🍱", label: "Caterer", value: "Bon Appétit (preferred)" },
  ],
  timeline: [
    {
      when: "3+ months before",
      icon: "🏗️",
      color: "#7c3aed",
      title: "Foundation",
      steps: [
        { text: "Confirmed OSA registration is current", tag: "admin" },
        { text: "Chose venue: Penn Palestra (indoor courts), Houston Hall backup" },
        { text: "Selected Bon Appétit / Penn Dining as caterer", tag: "preferred", tagLabel: "⭐ Preferred vendor" },
      ],
    },
    {
      when: "8 weeks before",
      icon: "📋",
      color: "#0284c7",
      title: "Apply",
      steps: [
        { text: "Submitted SGEF application via Universal Funding Application" },
        { text: "Noted preferred vendor use in application to strengthen the ask" },
      ],
      budget: [
        { label: "Food — Bon Appétit ($12/person × 60)", amount: "$720", note: "under $25 cap ✓" },
        { label: "Supplies & equipment", amount: "$300" },
        { label: "Printing & promo", amount: "$120" },
        { label: "Miscellaneous", amount: "$60" },
        { label: "Total", amount: "$1,200", total: true },
        { label: "Requested from GAPSA (75%)", amount: "$900", highlight: true },
      ],
    },
    {
      when: "6 weeks before",
      icon: "✅",
      color: "#059669",
      title: "Approved",
      steps: [],
      checks: [
        { ok: true,  text: "SGEF award: $800 from Finance Committee" },
        { ok: true,  text: "GAPSA share = 67% — under 40% Eventbrite threshold (no special account needed)" },
        { ok: true,  text: "Award under $2,500 — no in-person audit required" },
        { ok: false, text: "Requested $900 — received $800 (awards are competitive, plan for variance)" },
      ],
    },
    {
      when: "4 weeks before",
      icon: "📦",
      color: "#d97706",
      title: "Prepare",
      steps: [
        { text: "Confirmed Bon Appétit order: sandwiches + sides (min 25 people — met)" },
        { text: "Submitted event listing to GAPSA newsletter" },
        { text: "Set up Eventbrite on personal account (GAPSA share < 40%)", tag: "ok", tagLabel: "✓ No special account" },
        { text: "No alcohol → University Life registration not required", tag: "ok", tagLabel: "✓ Skipped" },
      ],
    },
    {
      when: "1 week before",
      icon: "📅",
      color: "#dc2626",
      title: "Pre-Event",
      steps: [
        { text: "Submitted payment request via Smartsheet (7-day minimum met)" },
        { text: "Sent event summary to gapsa.funds@gapsa.upenn.edu" },
      ],
    },
    {
      when: "Day of event",
      icon: "🎾",
      color: "#7c3aed",
      title: "Event Day",
      steps: [
        { text: "54 attendees arrived (close to 60 target)", tag: "stat", tagLabel: "54 / 60" },
        { text: "Bon Appétit delivery confirmed on arrival" },
        { text: "Collected all day-of receipts" },
      ],
    },
    {
      when: "Within 10 days after",
      icon: "📊",
      color: "#059669",
      title: "Close Out",
      steps: [
        { text: "Submitted all receipts for reimbursement (within 10-day window)" },
        { text: "Filed After-Action Report via Smartsheet before Dec 15 deadline" },
        { text: "Final spend: $1,140 — $60 under budget", tag: "ok", tagLabel: "✓ Under budget" },
      ],
    },
  ],
};

function ProcessGuide({ setMode }) {
  const [showExample, setShowExample] = useState(false);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      {/* Example side-drawer overlay */}
      {showExample && (
        <>
          <div
            onClick={() => setShowExample(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200 }}
          />
          <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0, width: "min(520px, 100vw)",
            background: "#fff", zIndex: 201, overflowY: "auto",
            boxShadow: "-4px 0 32px rgba(0,0,0,0.18)",
            display: "flex", flexDirection: "column",
          }}>
            {/* Drawer header */}
            <div style={{ background: PENN_BLUE, padding: "20px 24px", flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Example Walkthrough</div>
                  <div style={{ color: "#fff", fontWeight: 800, fontSize: 17 }}>{PICKLEBALL_EXAMPLE.org}</div>
                  <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 2 }}>{PICKLEBALL_EXAMPLE.event}</div>
                </div>
                <button onClick={() => setShowExample(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>
                  <X size={16} />
                </button>
              </div>
              {/* Meta stat row */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
                {PICKLEBALL_EXAMPLE.meta.map((m, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 8, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{m.icon}</span>
                    <div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", lineHeight: 1 }}>{m.label}</div>
                      <div style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{m.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Drawer body */}
            <div style={{ padding: "20px 24px", flex: 1 }}>
              {PICKLEBALL_EXAMPLE.timeline.map((phase, i) => (
                <div key={i} style={{ marginBottom: 22 }}>
                  {/* Phase header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: `${phase.color}18`, border: `2px solid ${phase.color}40`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, flexShrink: 0,
                    }}>
                      {phase.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{phase.title}</div>
                      <div style={{ fontSize: 11, color: phase.color, fontWeight: 600 }}>{phase.when}</div>
                    </div>
                  </div>

                  {/* Steps */}
                  {phase.steps.length > 0 && (
                    <div style={{ paddingLeft: 44 }}>
                      {phase.steps.map((s, j) => (
                        <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                          <div style={{ width: 5, height: 5, borderRadius: "50%", background: phase.color, marginTop: 6, flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 13, color: "#444", lineHeight: 1.55 }}>{s.text}</span>
                            {s.tag && (
                              <span style={{
                                marginLeft: 6, fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                                background: s.tag === "preferred" ? "#fef3c7" : s.tag === "ok" ? "#dcfce7" : s.tag === "stat" ? "#eff6ff" : "#f3f4f6",
                                color: s.tag === "preferred" ? "#92400e" : s.tag === "ok" ? "#166534" : s.tag === "stat" ? "#1e40af" : "#555",
                              }}>
                                {s.tagLabel}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Budget table */}
                  {phase.budget && (
                    <div style={{ marginLeft: 44, marginTop: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                      {phase.budget.map((row, j) => (
                        <div key={j} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "6px 12px",
                          borderTop: j > 0 ? "1px solid #e2e8f0" : "none",
                          background: row.total ? "#eff6ff" : row.highlight ? "#f0fdf4" : "transparent",
                          fontWeight: row.total || row.highlight ? 700 : 400,
                        }}>
                          <span style={{ fontSize: 12, color: row.total ? PENN_BLUE : row.highlight ? "#166534" : "#555" }}>{row.label}</span>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: row.total ? PENN_BLUE : row.highlight ? "#166534" : "#333" }}>{row.amount}</span>
                            {row.note && <span style={{ fontSize: 10, color: "#10b981", marginLeft: 4 }}>{row.note}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Compliance checks */}
                  {phase.checks && (
                    <div style={{ marginLeft: 44, marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                      {phase.checks.map((c, j) => (
                        <div key={j} style={{
                          display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 10px", borderRadius: 7,
                          background: c.ok ? "#f0fdf4" : "#fff7ed",
                          border: `1px solid ${c.ok ? "#86efac" : "#fed7aa"}`,
                        }}>
                          <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>{c.ok ? "✅" : "⚠️"}</span>
                          <span style={{ fontSize: 12, color: c.ok ? "#166534" : "#92400e", lineHeight: 1.5 }}>{c.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {i < PICKLEBALL_EXAMPLE.timeline.length - 1 && (
                    <div style={{ marginLeft: 17, marginTop: 10, height: 14, width: 2, background: "#e5e7eb" }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: PENN_BLUE, marginBottom: 6 }}>How the GAPSA Funding Process Works</h2>
          <p style={{ color: "#555", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            From idea to after-action report — here's the full funding lifecycle so you know what to expect at each stage.
          </p>
        </div>
        <button onClick={() => setShowExample(true)} style={{
          background: "#fff", border: `2px solid ${PENN_BLUE}`, color: PENN_BLUE,
          borderRadius: 8, padding: "8px 14px", cursor: "pointer",
          fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
          flexShrink: 0,
        }}>
          <BookOpen size={14} /> See Example →
        </button>
      </div>

      {/* Quick Resources box */}
      <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: "14px 18px", marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Quick Resources</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <a href={CONFIG.resources.preferredVendorsUrl} target="_blank" rel="noreferrer"
            style={{ fontSize: 12, fontWeight: 600, color: "#b45309", background: "#fff", border: "1px solid #fcd34d", borderRadius: 6, padding: "4px 10px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
            ⭐ Preferred Vendors <ExternalLink size={10} />
          </a>
          <a href={CONFIG.resources.newVendorOnboardingUrl} target="_blank" rel="noreferrer"
            style={{ fontSize: 12, fontWeight: 600, color: "#b45309", background: "#fff", border: "1px solid #fcd34d", borderRadius: 6, padding: "4px 10px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
            New Vendor Onboarding <ExternalLink size={10} />
          </a>
          <a href={`mailto:${CONFIG.resources.ispOnboardingEmail}`}
            style={{ fontSize: 12, fontWeight: 600, color: "#b45309", background: "#fff", border: "1px solid #fcd34d", borderRadius: 6, padding: "4px 10px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
            ISP Onboarding (Speakers) <ExternalLink size={10} />
          </a>
          <a href={CONFIG.compliance.paymentRequestUrl} target="_blank" rel="noreferrer"
            style={{ fontSize: 12, fontWeight: 600, color: "#b45309", background: "#fff", border: "1px solid #fcd34d", borderRadius: 6, padding: "4px 10px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
            Payment Request Form <ExternalLink size={10} />
          </a>
          <a href={CONFIG.resources.gapsaLogoUrl} target="_blank" rel="noreferrer"
            style={{ fontSize: 12, fontWeight: 600, color: "#b45309", background: "#fff", border: "1px solid #fcd34d", borderRadius: 6, padding: "4px 10px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
            GAPSA Website <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* Vertical timeline */}
      <div style={{ position: "relative", paddingLeft: 52 }}>
        {/* Continuous vertical line */}
        <div style={{
          position: "absolute", left: 20, top: 24, bottom: 24,
          width: 2, background: "#e5e7eb",
        }} />

        {PROCESS_PHASES.map((phase, idx) => (
          <div key={phase.id} style={{ position: "relative", marginBottom: idx < PROCESS_PHASES.length - 1 ? 28 : 0 }}>
            {/* Circle node */}
            <div style={{
              position: "absolute", left: -52, top: 16,
              width: 42, height: 42, borderRadius: "50%",
              background: phase.color, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              zIndex: 1,
            }}>
              {phase.id}
            </div>

            {/* Phase card — click delegation for data-tab inline links */}
            <div
              style={{
                background: "#fff", border: `1px solid #e5e7eb`,
                borderLeft: `4px solid ${phase.color}`,
                borderRadius: 10, padding: "16px 20px",
              }}
              onClick={(e) => {
                const tab = e.target.closest("[data-tab]")?.getAttribute("data-tab");
                if (tab) { e.preventDefault(); setMode(tab); }
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: PENN_BLUE }}>{phase.label}</span>
                <span style={{
                  fontSize: 11, fontWeight: 600, color: phase.color,
                  background: `${phase.color}18`, padding: "2px 8px", borderRadius: 20,
                }}>
                  {phase.time}
                </span>
              </div>

              <ul style={{ paddingLeft: 18, margin: 0, listStyle: "disc" }}>
                {phase.items.map((item, i) => (
                  <li key={i} style={{ fontSize: 13, color: "#444", lineHeight: 1.65, marginBottom: 3 }}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* CTA footer */}
      <div style={{ marginTop: 32, background: PENN_BLUE, borderRadius: 10, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Ready to plan your event?</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Use the Event Planner to build your budget and get personalized deadlines.</div>
        </div>
        <button onClick={() => setMode("planner")}
          style={{ background: PENN_RED, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Open Event Planner →
        </button>
      </div>
    </div>
  );
}

// ============================================================
// POLICY QUIZ
// ============================================================

const QUIZ_QUESTIONS = [
  {
    question: "What is the minimum number of days before your event that you must submit a GAPSA funding application?",
    options: ["14 days", "21 days", "28 days", "45 days"],
    correct: 2,
    explanation: `GAPSA requires applications at least ${CONFIG.deadlines.minLeadDays} days (4 weeks) before the event. Submitting 60+ days out is strongly recommended to allow time for questions and revisions.`,
  },
  {
    question: "What is the maximum combined per-person spending on food AND alcohol at an event?",
    options: ["$25/person", "$50/person", "$70/person", "$85/person"],
    correct: 2,
    explanation: `The combined food & alcohol cap is ${fmt(CONFIG.spendingLimits.foodAlcohol.max)}/person. This applies regardless of event type whenever alcohol is served. Food must be provided whenever alcohol is present.`,
  },
  {
    question: "What is the allowed per-person spending range for a General Body Meeting (GBM)?",
    options: ["Up to $5/person", "$10–$15/person", "$15–$25/person", "$25–$40/person"],
    correct: 1,
    explanation: `GBMs are limited to ${fmt(CONFIG.spendingLimits.generalMeeting.min)}–${fmt(CONFIG.spendingLimits.generalMeeting.max)}/person for minimal snacks. No alcohol is permitted, and GBMs cannot be held at restaurants.`,
  },
  {
    question: "If GAPSA funds more than what percentage of your total event budget, must you use the Graduate Events Eventbrite account for all ticketing?",
    options: ["25%", "40%", "50%", "75%"],
    correct: 1,
    explanation: `When GAPSA contributes more than ${Math.round(CONFIG.compliance.eventbriteThreshold * 100)}% of your total event budget, all ticketing must go through the Graduate Events Eventbrite account — not your org's own account.`,
  },
  {
    question: "At what GAPSA funding amount does your event become subject to an in-person audit (and require 2 tickets reserved for GAPSA reps)?",
    options: ["Over $1,000", "Over $1,500", "Over $2,500", "Over $5,000"],
    correct: 2,
    explanation: `Events receiving more than ${fmt(CONFIG.compliance.auditThreshold)} from GAPSA are subject to in-person audit. You must reserve 2 tickets for GAPSA representatives and may be visited by finance staff.`,
  },
  {
    question: "How many business days before an event with alcohol must you register with University Life?",
    options: ["3 business days", "5 business days", "7 business days", "10 business days"],
    correct: 3,
    explanation: `University Life requires alcohol event registration at least ${CONFIG.deadlines.alcoholRegistrationDays} business days before your event. Missing this deadline means you cannot legally serve alcohol at your event.`,
  },
  {
    question: "What is the Fall After-Action Report (AAR) deadline?",
    options: ["November 1", "December 1", "December 15", "January 15"],
    correct: 2,
    explanation: `The Fall AAR is due ${fmtDate(CONFIG.deadlines.aarFall, { month: "long", day: "numeric" })}. Missing this deadline can jeopardize your organization's eligibility for future GAPSA funding. The Spring deadline is May 15.`,
  },
  {
    question: "How many calendar days after a purchase do you have to submit a reimbursement request?",
    options: ["5 days", "10 days", "30 days", "60 days"],
    correct: 1,
    explanation: `Reimbursement requests must be submitted within ${CONFIG.deadlines.reimbursementWindowDays} calendar days of the purchase. Late submissions may be denied. Always keep itemized original receipts.`,
  },
  {
    question: "What is the per-person spending cap for a standard event (e.g., a social or workshop)?",
    options: ["$15/person", "$25/person", "$40/person", "$70/person"],
    correct: 1,
    explanation: `Standard events are capped at ${fmt(CONFIG.spendingLimits.standardEvent.max)}/person. If alcohol is served at a standard event, the food + alcohol combined cap of $70/person becomes the effective ceiling.`,
  },
  {
    question: "What is the per-person spending cap for a Gala or Formal event?",
    options: ["$40/person", "$60/person", "$70/person", "$85/person"],
    correct: 3,
    explanation: `Galas and formal events have a higher cap of ${fmt(CONFIG.eventTypes.find((e) => e.id === "gala").perPersonCap)}/person. Note: if alcohol is served, a separate $70/person food+alcohol sub-cap still applies within that limit.`,
  },
  {
    question: "What is the maximum GAPSA can fund for a speaker honorarium per external speaker per year?",
    options: ["$500", "$750", "$1,000", "$1,500"],
    correct: 3,
    explanation: `Speaker honoraria are capped at ${fmt(CONFIG.spendingLimits.speakerHonoraria.max)} per external speaker per year. The speaker must be onboarded as an Individual Service Provider (ISP) Recipient through the Graduate Student Center.`,
  },
  {
    question: "How far in advance does GAPSA recommend submitting your funding application for best results?",
    options: ["2 weeks", "4 weeks (minimum)", "8–12 weeks", "2–3 months (recommended)"],
    correct: 3,
    explanation: `While the minimum lead time is ${CONFIG.deadlines.minLeadDays} days (4 weeks), GAPSA strongly recommends submitting ${CONFIG.deadlines.recommendedLeadDays}+ days in advance (2–3 months). Earlier submissions allow time for questions, revisions, and budget adjustments.`,
  },
  {
    question: "How many days in advance must a payment request be submitted before the expected payment date?",
    options: ["2 days", "5 days", "7 days", "14 days"],
    correct: 2,
    explanation: `Payment requests must be submitted at least ${CONFIG.deadlines.paymentRequestDays} days before the expected payment or purchase date. For new or first-time vendors not yet in Penn's system, allow an additional 3 weeks for vendor onboarding.`,
  },
  {
    question: "If your event budget exceeds what threshold, does it require approval from the full General Assembly (not just the Finance Committee)?",
    options: ["$2,500", "$5,000", "$7,500", "$10,000"],
    correct: 3,
    explanation: `Funding requests over ${fmt(CONFIG.compliance.financeCommitteeApprovalCap)} cannot be approved by the Finance Committee alone — they must go to the full GAPSA General Assembly. This process takes 8–12 weeks, so plan accordingly.`,
  },
];

// certMode=true  → official certification: requires 100%, collects name/org, submits to Netlify
// certMode=false → practice mode: 75% pass threshold, no form, retake freely
function PolicyQuiz({ certMode = false }) {
  const [current,      setCurrent]      = useState(0);
  const [selected,     setSelected]     = useState(null);
  const [submitted,    setSubmitted]    = useState(false);
  const [score,        setScore]        = useState(0);
  const [done,         setDone]         = useState(false);
  const [answers,      setAnswers]      = useState([]);
  const [completedAt,  setCompletedAt]  = useState(null);
  // Cert form state (certMode only)
  const [certName,      setCertName]      = useState("");
  const [certOrg,       setCertOrg]       = useState("");
  const [certSubmitting,setCertSubmitting] = useState(false);
  const [certSubmitted, setCertSubmitted]  = useState(false);

  const q     = QUIZ_QUESTIONS[current];
  const total = QUIZ_QUESTIONS.length;

  function handleSelect(idx) { if (!submitted) setSelected(idx); }

  function handleSubmit() {
    if (selected === null) return;
    const wasCorrect = selected === q.correct;
    setSubmitted(true);
    if (wasCorrect) setScore((s) => s + 1);
    setAnswers((prev) => [...prev, { selected, correct: q.correct, wasCorrect }]);
  }

  function handleNext() {
    if (current + 1 >= total) {
      setDone(true);
      setCompletedAt(new Date());
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setSubmitted(false);
    }
  }

  function handleRestart() {
    setCurrent(0); setSelected(null); setSubmitted(false);
    setScore(0); setDone(false); setAnswers([]);
    setCompletedAt(null); setCertName(""); setCertOrg("");
    setCertSubmitting(false); setCertSubmitted(false);
  }

  async function handleCertSubmit() {
    if (!certName.trim() || !certOrg.trim()) return;
    setCertSubmitting(true);
    try {
      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          "form-name":      "quiz-certification",
          name:             certName.trim(),
          organization:     certOrg.trim(),
          score:            `${score}/${total}`,
          completed_at:     (completedAt || new Date()).toISOString(),
          questions_count:  String(total),
        }).toString(),
      });
    } catch (_) { /* best-effort — show cert regardless */ }
    setCertSubmitting(false);
    setCertSubmitted(true);
  }

  // ── Results screen ────────────────────────────────────────────
  if (done) {
    const passed = certMode ? score === total : score >= Math.ceil(total * 0.75);

    // Official cert: perfect score → show cert form or certificate
    if (certMode && passed) {
      if (certSubmitted) {
        return (
          <div style={{ maxWidth: 660, margin: "0 auto" }}>
            <div style={{
              background: "#fff", border: `2px solid ${PENN_BLUE}`, borderRadius: 14,
              padding: "48px 40px", textAlign: "center",
              boxShadow: "0 4px 28px rgba(1,31,91,0.10)",
            }}>
              <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: PENN_RED, fontWeight: 700, marginBottom: 4 }}>
                University of Pennsylvania
              </div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>GAPSA Division of Finance · 2025–26</div>
              <div style={{ borderTop: `1px solid #e5e7eb`, borderBottom: `1px solid #e5e7eb`, padding: "20px 0", margin: "0 0 24px" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: PENN_BLUE, marginBottom: 16 }}>
                  Treasurer Policy Certification
                </div>
                <div style={{ fontSize: 13, color: "#888", marginBottom: 6 }}>This certifies that</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: PENN_BLUE, margin: "6px 0" }}>{certName}</div>
                <div style={{ fontSize: 14, color: "#555" }}>of <strong>{certOrg}</strong></div>
                <div style={{ fontSize: 13, color: "#888", marginTop: 10, lineHeight: 1.6 }}>
                  has successfully completed the GAPSA Finance Policy Certification<br />
                  with a score of <strong>{score}/{total} (100%)</strong>
                </div>
                <div style={{ fontSize: 12, color: "#aaa", marginTop: 6 }}>
                  {completedAt?.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}
                </div>
              </div>
              <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 16px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <CheckCircle size={15} color="#10b981" />
                <span style={{ fontSize: 13, color: "#065f46", fontWeight: 600 }}>
                  Certification submitted to GAPSA Finance Division
                </span>
              </div>
              <button onClick={() => window.print()}
                style={{ background: PENN_BLUE, color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Print Certificate
              </button>
            </div>
          </div>
        );
      }

      // Cert form — collect name + org
      return (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "36px 32px" }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>🎉</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: PENN_BLUE, marginBottom: 6 }}>Perfect Score!</h2>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#10b981", marginBottom: 6 }}>{score}/{total}</div>
              <p style={{ color: "#666", fontSize: 14, margin: 0 }}>
                Enter your information below to complete your official certification.
                Your record will be submitted to GAPSA Finance.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#333", display: "block", marginBottom: 6 }}>
                Your Full Name <span style={{ color: PENN_RED }}>*</span>
              </label>
              <input value={certName} onChange={(e) => setCertName(e.target.value)}
                placeholder="e.g. Jane Smith"
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#333", display: "block", marginBottom: 6 }}>
                Organization / Club Name <span style={{ color: PENN_RED }}>*</span>
              </label>
              <input value={certOrg} onChange={(e) => setCertOrg(e.target.value)}
                placeholder="e.g. Graduate Racquet Club at Penn"
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", marginBottom: 24, fontSize: 12, color: "#888" }}>
              Completion time: {completedAt?.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}
            </div>

            <button onClick={handleCertSubmit}
              disabled={!certName.trim() || !certOrg.trim() || certSubmitting}
              style={{
                width: "100%", padding: "12px", borderRadius: 8, border: "none",
                background: !certName.trim() || !certOrg.trim() ? "#e5e7eb" : PENN_BLUE,
                color: !certName.trim() || !certOrg.trim() ? "#aaa" : "#fff",
                fontSize: 15, fontWeight: 700,
                cursor: !certName.trim() || !certOrg.trim() ? "default" : "pointer",
              }}>
              {certSubmitting ? "Submitting…" : "Submit Certification →"}
            </button>
          </div>
        </div>
      );
    }

    // Failed (either mode) or practice pass
    const pct = Math.round((score / total) * 100);
    return (
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "36px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>{passed ? "🎉" : "📚"}</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: PENN_BLUE, marginBottom: 6 }}>
            {passed ? "Great work!" : certMode ? "Not quite — 100% required" : "Keep studying!"}
          </h2>
          <div style={{ fontSize: 36, fontWeight: 800, color: passed ? "#10b981" : PENN_RED, marginBottom: 4 }}>
            {score}/{total}
          </div>
          <div style={{ color: "#666", fontSize: 14, marginBottom: certMode && !passed ? 12 : 24 }}>
            {pct}% · {passed ? "You know your GAPSA policy!" : "Review the errors below, then try again."}
          </div>
          {certMode && !passed && (
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 16px", marginBottom: 24, fontSize: 13, color: "#7f1d1d" }}>
              The official certification requires a <strong>perfect score (100%)</strong>. Review the explanations for each incorrect answer and retake when ready.
            </div>
          )}

          <div style={{ textAlign: "left", marginBottom: 28 }}>
            {QUIZ_QUESTIONS.map((qq, i) => {
              const ans = answers[i];
              if (!ans) return null;
              return (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: i < total - 1 ? "1px solid #f0f0f0" : "none" }}>
                  <div style={{ flexShrink: 0, marginTop: 2 }}>
                    {ans.wasCorrect ? <CheckCircle size={15} color="#10b981" /> : <X size={15} color={PENN_RED} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "#333", marginBottom: 2 }}>{qq.question}</div>
                    {!ans.wasCorrect && (
                      <div style={{ fontSize: 12, color: "#666" }}>
                        Your answer: <span style={{ color: PENN_RED, fontWeight: 600 }}>{qq.options[ans.selected]}</span>
                        {" · "}Correct: <span style={{ color: "#10b981", fontWeight: 600 }}>{qq.options[ans.correct]}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={handleRestart}
            style={{ background: PENN_BLUE, color: "#fff", border: "none", borderRadius: 8, padding: "11px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            {certMode ? "Try Again" : "Retake Quiz"}
          </button>
        </div>
      </div>
    );
  }

  // ── Question screen ───────────────────────────────────────────
  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      {certMode && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "8px 14px", marginBottom: 14, fontSize: 12, color: "#7f1d1d", textAlign: "center", fontWeight: 600 }}>
          Official Certification — 100% required to pass. All {total} questions must be answered correctly.
        </div>
      )}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: PENN_BLUE }}>Question {current + 1} of {total}</span>
          <span style={{ fontSize: 12, color: "#888" }}>{score} correct so far</span>
        </div>
        <div style={{ height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(current / total) * 100}%`, background: PENN_BLUE, borderRadius: 3, transition: "width 0.3s" }} />
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "28px 28px 24px" }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.5, marginBottom: 22 }}>{q.question}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
          {q.options.map((opt, idx) => {
            let bg = "#f9fafb", border = "#e5e7eb", color = "#333";
            if (submitted) {
              if (idx === q.correct)    { bg = "#f0fdf4"; border = "#10b981"; color = "#065f46"; }
              else if (idx === selected){ bg = "#fef2f2"; border = PENN_RED;  color = "#7f1d1d"; }
            } else if (selected === idx) { bg = "#eff6ff"; border = PENN_BLUE; color = PENN_BLUE; }
            return (
              <button key={idx} onClick={() => handleSelect(idx)} style={{
                width: "100%", textAlign: "left", padding: "12px 14px",
                background: bg, border: `2px solid ${border}`, borderRadius: 8,
                color, fontSize: 14, fontWeight: selected === idx || (submitted && idx === q.correct) ? 600 : 400,
                cursor: submitted ? "default" : "pointer", transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  background: submitted && idx === q.correct ? "#10b981" : submitted && idx === selected ? PENN_RED : selected === idx ? PENN_BLUE : "#e5e7eb",
                  color: submitted || selected === idx ? "#fff" : "#888",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
                }}>
                  {String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {submitted && (
          <div style={{
            background: selected === q.correct ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${selected === q.correct ? "#86efac" : "#fca5a5"}`,
            borderRadius: 8, padding: "12px 14px", marginBottom: 18,
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: selected === q.correct ? "#065f46" : "#7f1d1d" }}>
              {selected === q.correct ? "✓ Correct!" : "✗ Incorrect"}
            </div>
            <p style={{ fontSize: 13, color: "#444", lineHeight: 1.6, margin: 0 }}>{q.explanation}</p>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 12, color: "#aaa" }}>
            {certMode ? "GAPSA Policy Certification · 2025–26" : "GAPSA Policy Quiz · 2025–26"}
          </div>
          {!submitted ? (
            <button onClick={handleSubmit} disabled={selected === null} style={{
              background: selected === null ? "#e5e7eb" : PENN_BLUE,
              color: selected === null ? "#aaa" : "#fff",
              border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 14, fontWeight: 700,
              cursor: selected === null ? "default" : "pointer",
            }}>
              Submit Answer
            </button>
          ) : (
            <button onClick={handleNext} style={{ background: PENN_BLUE, color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              {current + 1 >= total ? "See Results" : "Next Question →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB WRAPPERS — composite views for the 4-tab structure
// ============================================================

// Sub-nav pill used by FundingTab and ResourcesTab
function SubNav({ options, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 3, width: "fit-content", marginBottom: 24 }}>
      {options.map((opt) => (
        <button key={opt.id} onClick={() => onChange(opt.id)} style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "7px 16px", border: "none", borderRadius: 6, cursor: "pointer",
          background: active === opt.id ? PENN_BLUE : "transparent",
          color: active === opt.id ? "#fff" : "#555",
          fontWeight: active === opt.id ? 600 : 400,
          fontSize: 13, transition: "all 0.15s",
        }}>
          {opt.icon} {opt.label}
        </button>
      ))}
    </div>
  );
}

// FundingTab — Funding Finder wizard + Browse All Funds
function FundingTab() {
  const [view, setView] = useState("wizard");
  return (
    <div>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <SubNav
          options={[
            { id: "wizard", label: "Help Me Choose", icon: <Search size={13} /> },
            { id: "browse", label: "Browse All Funds", icon: <BookOpen size={13} /> },
          ]}
          active={view}
          onChange={setView}
        />
      </div>
      {view === "wizard" ? <FundingWizard /> : <FundsReference />}
    </div>
  );
}

// ResourcesTab — Spending Limits + Forms & Links
function ResourcesTab() {
  const [section, setSection] = useState("limits");
  return (
    <div>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <SubNav
          options={[
            { id: "limits", label: "Spending Limits", icon: <DollarSign size={13} /> },
            { id: "forms",  label: "Forms & Links",   icon: <ClipboardList size={13} /> },
          ]}
          active={section}
          onChange={setSection}
        />
      </div>
      {section === "limits" ? <SpendingLimits /> : <FormsLinks />}
    </div>
  );
}

// GuideTab — How It Works timeline + Submission Calendar + Policy Quiz
function GuideTab({ setMode }) {
  return (
    <div>
      <ProcessGuide setMode={setMode} />

      {/* ── Submission Calendar ───────────────────────────────── */}
      <div style={{ maxWidth: 800, margin: "48px auto 0" }}>
        <div style={{ borderTop: "2px solid #e5e7eb", paddingTop: 36, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Calendar size={18} color={PENN_BLUE} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: PENN_BLUE, margin: 0 }}>
              2025–26 Submission Calendar
            </h3>
          </div>
          <p style={{ color: "#666", fontSize: 14, margin: 0 }}>
            Plan your application around these Finance Committee review windows.
          </p>
        </div>
        <DeadlinesView />
      </div>

      {/* ── Policy Quiz (Practice Mode) ──────────────────────── */}
      <div style={{ maxWidth: 800, margin: "48px auto 0" }}>
        <div style={{ borderTop: "2px solid #e5e7eb", paddingTop: 36, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <CheckCircle size={18} color={PENN_BLUE} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: PENN_BLUE, margin: 0 }}>
              Practice Quiz
            </h3>
          </div>
          <p style={{ color: "#666", fontSize: 14, margin: 0 }}>
            {QUIZ_QUESTIONS.length} questions covering the key rules every treasurer should know. Retake as many times as you like.
          </p>
        </div>
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#92400e", display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle size={14} color="#d97706" />
          Ready to make it official? Visit the <strong style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => setMode("cert")}>Certification tab</strong> to earn your GAPSA Treasurer Certification (100% required).
        </div>
        <PolicyQuiz />
      </div>
    </div>
  );
}

// ============================================================
// CERTIFICATION TAB
// ============================================================

function CertTab() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <CheckCircle size={22} color={PENN_BLUE} />
          <h2 style={{ fontSize: 22, fontWeight: 800, color: PENN_BLUE, margin: 0 }}>
            Treasurer Policy Certification
          </h2>
        </div>
        <p style={{ color: "#555", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
          Complete this quiz with a <strong>perfect score (100%)</strong> to receive your official GAPSA Finance Policy Certification.
          Your name, organization, and completion record will be submitted to the GAPSA Finance Division.
        </p>
      </div>

      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "14px 18px", marginBottom: 28, fontSize: 13, color: "#1e40af" }}>
        <strong>Note for treasurers:</strong> GAPSA recommends that all group treasurers complete this certification before submitting their first funding application. The certification covers spending limits, compliance rules, deadlines, and application requirements.
      </div>

      <PolicyQuiz certMode={true} />
    </div>
  );
}

// ============================================================
// ROOT APP
// ============================================================

export default function GAPSAFinanceWizard() {
  const [mode, setMode] = useState("planner");
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
        {mode === "planner"   && <EventPlanner />}
        {mode === "funding"   && <FundingTab />}
        {mode === "guide"     && <GuideTab setMode={setMode} />}
        {mode === "resources" && <ResourcesTab />}
        {mode === "cert"      && <CertTab />}
      </div>

      <div style={{ textAlign: "center", padding: "18px", borderTop: "1px solid #e5e7eb", background: "#fff", fontSize: 12, color: "#aaa" }}>
        GAPSA Division of Finance · University of Pennsylvania · 2025–26 Academic Year
      </div>
    </div>
  );
}
