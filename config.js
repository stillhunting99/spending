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
    { key: "groceries",   name: "Groceries + Costco", budget: 900 },
    { key: "shopping",    name: "Target/Amazon",      budget: 500 },
    { key: "restaurants", name: "Eating out",         budget: 400 },
    { key: "gas",         name: "Gas",                budget: 300 },
    { key: "household",   name: "House upkeep",       budget: 250 },
    { key: "health",      name: "Health",             budget: 150 },
    { key: "auto",        name: "Car",                budget: 150 },
    { key: "kids",        name: "Kids",               budget: 150 },
    { key: "hobbies",     name: "Fun",                budget: 150 },
    { key: "other",       name: "Gifts & other",      budget: 140 },
    { key: "clothing",    name: "Clothes & hair",     budget: 100 },
    { key: "travel",      name: "Travel",             budget:   0 }
  ],

  // Fixed monthly commitments that are NOT tapped in here (shown for context):
  //   $1,190 autopay bills: utilities 470, internet + phone 195, insurance 191,
  //          subscriptions 200, Amex annual-fee fund 134
  // + $1,800 Waldorf daycare for Ayah + Nora (Venmo)
  // +   $311 house cleaner (~2 x $150 checks)
  // The $5,000 everyday plan = 3,190 tapped in + 1,190 autopay + 620 buffer (unused -> SoFi).
  // Rent / mortgage and any loan payment are separate and not counted here.
  FIXED_BILLS: 3301
};
