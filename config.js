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

  // 5) Monthly targets, from your spending plan (SPENDING-CUT-PLAN.md).
  //    Edit any number here and both phones pick it up.
  //    These twelve are the things you actually tap in as you spend.
  //    Autopay bills (rent, insurance, phone, utilities, subscriptions)
  //    are NOT logged here — they're the FIXED_BILLS figure below.
  CATEGORIES: [
    { key: "groceries",   name: "Groceries",  budget: 700 },
    { key: "restaurants", name: "Eating out", budget: 600 },
    { key: "gas",         name: "Gas",        budget: 300 },
    { key: "shopping",    name: "Shopping",   budget: 450 },
    { key: "health",      name: "Health",     budget: 250 },
    { key: "auto",        name: "Car",        budget: 200 },
    { key: "other",       name: "Other",      budget: 120 },
    { key: "kids",        name: "Kids",       budget: 100 },
    { key: "household",   name: "Household",  budget:  87 },
    { key: "clothing",    name: "Clothes",    budget:  75 },
    { key: "hobbies",     name: "Fun",        budget:  50 },
    { key: "travel",      name: "Travel",     budget:   0 }
  ],

  // Autopay bills that live outside this app, shown for context so the
  // numbers reconcile with the plan. 2,932 logged + 793 fixed = 3,725/mo.
  FIXED_BILLS: 793
};
