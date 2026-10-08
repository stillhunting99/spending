/* ===========================================================================
   YOUR SETTINGS — this is the only file you need to edit.
   Fill in the two values from Supabase, save, done.
   =========================================================================== */

window.CONFIG = {

  // 1) Supabase → Project Settings → Data API → Project URL
  //    Looks like: https://abcdefghijklm.supabase.co
  SUPABASE_URL: "https://vwajrcymlqrsqgmkcgyk.supabase.co",

  // 2) Supabase → Project Settings → API Keys → anon / public
  //    It is a long string starting with "eyJ..." or "sb_publishable_..."
  //    This one is SAFE to publish — the database is locked down in schema.sql.
  SUPABASE_ANON_KEY: "sb_publishable_QHelFS6CbS4ZJxUfbj2s0Q_yIkad5-B",

  // 3) Household code — LEAVE THIS EMPTY when you publish.
  //    This is the only thing protecting your data, so it must not live in a
  //    public repo. It travels in the private link instead:
  //        https://you.github.io/spending/#h=YOUR-CODE
  //    The phone remembers it after the first open, and iOS keeps it when the
  //    page is added to the home screen. Fill it in only for local testing.
  HOUSEHOLD: "",

  // 4) Who uses this. The app asks which one you are the first time it opens.
  PEOPLE: ["Aymon", "Kellie"],

  // 5) Monthly targets: the $5,000-a-month everyday plan (Circle Drive Plan, Sep 2026).
  //    Edit any number here and both phones pick it up.
  //    These twelve are the things you actually tap in as you spend.
  //    Autopay bills are NOT logged here; they're the FIXED_BILLS figure below.
  CATEGORIES: [
    { key: "groceries",   name: "Groceries + Costco",         budget: 1000 },
    { key: "restaurants", name: "Eating out",                 budget:   400 },
    { key: "shopping",    name: "Target/Amazon",              budget:   650 },
    { key: "gas",         name: "Gas",                        budget:   275 },
    { key: "hobbies",     name: "Fun (golf, drinks, events)", budget:   150 },
    { key: "health",      name: "Health",                     budget:   125 },
    { key: "household",   name: "House stuff",                budget:   150 },
    { key: "kids",        name: "Kids",                       budget:   150 },
    { key: "clothing",    name: "Clothes & hair",             budget:   125 },
    { key: "travel",      name: "Travel (cash part)",         budget:   250 },
    { key: "auto",        name: "Car (tolls, parking, Uber)", budget:    75 },
    { key: "other",       name: "Gifts & other",              budget:   150 }
  ],

  // Fixed monthly commitments that are NOT tapped in here (shown for context):
  //   $1,762 autopay bills + set-asides (utilities, insurance, subscriptions, phone/internet, gym,
  //          car repairs, home repairs, Amex fees, medical) — see the Our Budget page
  // + $1,800 Waldorf daycare for Ayah + Nora (Venmo)
  // +   $311 house cleaner (~2 x $150 checks)
  // Everyday budget = 3,500 tapped in (matches the Command Center: ~$3,000 on the Platinum + ~$500 at Costco),
  // + 1,762 autopay/set-asides = 5,262/mo. Tightened 2026-10-07 from 4,000.
  // Rent / mortgage and any loan payment are separate and not counted here.
  FIXED_BILLS: 3873
};
