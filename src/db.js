const DB_NAME = "granular_household_local";
const DB_VERSION = 3;

const stores = [
  "users",
  "session",
  "household",
  "transactions",
  "receipt_items",
  "alerts",
  "reports",
  "integrations",
  "source_notes",
  "yearly_spend",
  "onboarding",
  "settings"
];

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of stores) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function tx(storeName, mode = "readonly") {
  const db = await openDb();
  return db.transaction(storeName, mode).objectStore(storeName);
}

export async function getAll(storeName) {
  const store = await tx(storeName);
  return requestToPromise(store.getAll());
}

export async function getOne(storeName, id) {
  const store = await tx(storeName);
  return requestToPromise(store.get(id));
}

export async function putOne(storeName, value) {
  const store = await tx(storeName, "readwrite");
  await requestToPromise(store.put(value));
  return value;
}

export async function putMany(storeName, values) {
  const store = await tx(storeName, "readwrite");
  await Promise.all(values.map((value) => requestToPromise(store.put(value))));
  return values;
}

export async function clearStore(storeName) {
  const store = await tx(storeName, "readwrite");
  await requestToPromise(store.clear());
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const categoryPlans = [
  ["Income", [6175, 6175, 6175, 6175, 6175, 6175, 6175, 6175, 6175, 6175, 6175, 6175], "ONS/Nomis"],
  ["Groceries", [702, 688, 721, 739, 756, 748, 771, 785, 802, 817, 829, 846], "ONS Family Spending + DEFRA Family Food"],
  ["Housing", [1125, 1125, 1125, 1125, 1125, 1125, 1125, 1125, 1125, 1125, 1125, 1125], "ONS Family Spending"],
  ["Council tax", [165, 165, 165, 165, 165, 165, 165, 165, 165, 165, 165, 165], "Liverpool City Council"],
  ["Energy", [183, 176, 162, 145, 132, 126, 121, 124, 138, 151, 168, 189], "Ofgem"],
  ["Water", [46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46], "ONS Family Spending"],
  ["Broadband & mobile", [122, 122, 122, 128, 128, 128, 128, 128, 128, 134, 134, 134], "ONS CPI services"],
  ["Kids allowance & school", [176, 164, 219, 188, 203, 244, 276, 312, 421, 238, 224, 386], "ONS Family Spending"],
  ["Pets", [158, 171, 164, 186, 205, 177, 191, 184, 213, 196, 202, 218], "ONS CPI pet care basket"],
  ["Transport & car", [384, 366, 392, 411, 428, 402, 418, 451, 439, 426, 471, 488], "RAC fuel + ONS transport"],
  ["Clothing", [112, 96, 134, 127, 166, 148, 156, 221, 389, 172, 146, 244], "ONS CPI clothing"],
  ["Eating out", [238, 212, 226, 241, 267, 284, 311, 339, 278, 251, 294, 368], "ONS Family Spending"],
  ["Subscriptions", [96, 96, 102, 102, 102, 108, 108, 108, 114, 114, 114, 121], "ONS CPI recreation services"],
  ["Holiday savings", [260, 260, 260, 260, 300, 300, 300, 300, 300, 300, 350, 350], "ABTA/ONS travel context"],
  ["Credit card & bank charges", [72, 64, 81, 75, 88, 92, 84, 79, 86, 91, 96, 104], "Bank of England rates context"]
];

function buildYearlySpend() {
  const yearFactors = [
    [2024, 0.93, 12],
    [2025, 1, 12],
    [2026, 1.055, 5]
  ];
  return yearFactors.flatMap(([year, factor, count]) => categoryPlans.flatMap(([category, values, source]) => values.slice(0, count).map((amount, index) => ({
    id: `${year}-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${months[index].toLowerCase()}`,
    month: months[index],
    monthIndex: index + 1,
    category,
    amount: Math.round(amount * factor),
    source: `${source}${year === 2026 ? " + 2026 YTD uplift" : ""}`,
    year
  }))));
}

const extraTransactions = [
  { id: "tx-008", merchant: "Ocado", category: "Groceries", owner: "Sarah", amount: 126.44, date: "2024-06-06", context: "Shared" },
  { id: "tx-009", merchant: "Lidl Kensington", category: "Groceries", owner: "Mark", amount: 58.73, date: "2024-06-13", context: "Shared" },
  { id: "tx-010", merchant: "Asda Smithdown", category: "Groceries", owner: "Sarah", amount: 91.28, date: "2024-07-04", context: "Shared" },
  { id: "tx-011", merchant: "Sainsbury's Woolton", category: "Groceries", owner: "Mark", amount: 74.62, date: "2024-07-18", context: "Shared" },
  { id: "tx-012", merchant: "Corner Shop Aigburth", category: "Groceries", owner: "Sarah", amount: 19.86, date: "2024-08-03", context: "Shared" },
  { id: "tx-013", merchant: "Boots", category: "Toiletries", owner: "Sarah", amount: 28.94, date: "2024-08-10", context: "Shared" },
  { id: "tx-014", merchant: "Waterstones", category: "Books", owner: "Oliver", amount: 31.97, date: "2024-09-02", context: "Child" },
  { id: "tx-015", merchant: "Decathlon", category: "Activities", owner: "Mark", amount: 63.48, date: "2024-09-05", context: "Kids" },
  { id: "tx-016", merchant: "B&Q", category: "DIY", owner: "Mark", amount: 47.35, date: "2024-10-11", context: "Shared" },
  { id: "tx-017", merchant: "Argos", category: "Household", owner: "Sarah", amount: 34.99, date: "2024-10-14", context: "Shared" },
  { id: "tx-018", merchant: "Next", category: "Clothing", owner: "Sarah", amount: 86.5, date: "2024-11-01", context: "Kids" },
  { id: "tx-019", merchant: "Home Bargains", category: "Household", owner: "Sarah", amount: 22.41, date: "2025-01-18", context: "Shared" },
  { id: "tx-020", merchant: "Tesco Allerton", category: "Groceries", owner: "Mark", amount: 112.62, date: "2026-05-12", context: "Shared" },
  { id: "tx-021", merchant: "The Range", category: "DIY", owner: "Sarah", amount: 39.26, date: "2025-03-08", context: "Shared" },
  { id: "tx-022", merchant: "Superdrug", category: "Toiletries", owner: "Mia", amount: 24.85, date: "2025-04-12", context: "Child" },
  { id: "tx-023", merchant: "Sports Direct", category: "Clothing", owner: "Oliver", amount: 57.98, date: "2025-08-21", context: "Child" },
  { id: "tx-024", merchant: "Vue Cinema", category: "Activities", owner: "Sarah", amount: 48.6, date: "2025-11-15", context: "Family" },
  { id: "tx-025", merchant: "WHSmith", category: "Books", owner: "Mia", amount: 18.48, date: "2026-02-03", context: "Child" },
  { id: "tx-026", merchant: "Pets at Home", category: "Pets", owner: "Mark", amount: 38.72, date: "2026-03-16", context: "Pet" },
  { id: "tx-027", merchant: "Iceland", category: "Groceries", owner: "Sarah", amount: 67.44, date: "2026-04-19", context: "Shared" },
  { id: "tx-028", merchant: "Barclaycard", category: "Charges", owner: "Sarah", amount: 46, date: "2024-05-29", context: "Debt" },
  { id: "tx-029", merchant: "Monzo Teen Top-up", category: "Kids", owner: "Mia", amount: 15, date: "2024-05-28", context: "Child" },
  { id: "tx-030", merchant: "Pets at Home", category: "Pets", owner: "Mark", amount: 18.9, date: "2024-05-27", context: "Pet" }
];

const extraReceiptItems = [
  { id: "ri-013", transactionId: "tx-008", item: "Chicken breast fillets", variant: "Free range", seller: "Ocado", quantity: "650g", unitPrice: 9.22, lineTotal: 5.99, category: "Groceries", buyer: "Sarah", purchasedAt: "2024-06-06", tags: ["protein", "dinner"], shrinkflation: false, productUrl: "local://seller/ocado/chicken-breast" },
  { id: "ri-014", transactionId: "tx-008", item: "Pasta spirals", variant: "Wholewheat", seller: "Ocado", quantity: "500g", unitPrice: 2.3, lineTotal: 1.15, category: "Groceries", buyer: "Sarah", purchasedAt: "2024-06-06", tags: ["staple", "teen-dinners"], shrinkflation: false, productUrl: "local://seller/ocado/pasta-spirals" },
  { id: "ri-015", transactionId: "tx-008", item: "Greek yoghurt", variant: "Natural", seller: "Ocado", quantity: "1kg", unitPrice: 3.2, lineTotal: 3.2, category: "Groceries", buyer: "Sarah", purchasedAt: "2024-06-06", tags: ["breakfast"], shrinkflation: false, productUrl: "local://seller/ocado/greek-yoghurt" },
  { id: "ri-016", transactionId: "tx-008", item: "Cheddar cheese", variant: "Mature block", seller: "Ocado", quantity: "400g", unitPrice: 8.75, lineTotal: 3.5, category: "Groceries", buyer: "Sarah", purchasedAt: "2024-06-06", tags: ["sandwiches", "shrinkflation-watch"], shrinkflation: true, productUrl: "local://seller/ocado/cheddar" },
  { id: "ri-017", transactionId: "tx-009", item: "Bananas", variant: "Loose", seller: "Lidl Kensington", quantity: "1.2kg", unitPrice: 1.05, lineTotal: 1.26, category: "Groceries", buyer: "Mark", purchasedAt: "2024-06-13", tags: ["fruit", "lunchbox"], shrinkflation: false, productUrl: "local://seller/lidl/bananas" },
  { id: "ri-018", transactionId: "tx-009", item: "Pizza bases", variant: "Twin pack", seller: "Lidl Kensington", quantity: "2 pack", unitPrice: 1.89, lineTotal: 1.89, category: "Groceries", buyer: "Mark", purchasedAt: "2024-06-13", tags: ["teen-dinners"], shrinkflation: false, productUrl: "local://seller/lidl/pizza-bases" },
  { id: "ri-019", transactionId: "tx-009", item: "Washing-up liquid", variant: "Lemon", seller: "Lidl Kensington", quantity: "500ml", unitPrice: 1.18, lineTotal: 0.59, category: "Household", buyer: "Mark", purchasedAt: "2024-06-13", tags: ["cleaning"], shrinkflation: false, productUrl: "local://seller/lidl/washing-up-liquid" },
  { id: "ri-020", transactionId: "tx-010", item: "Mince beef", variant: "5 percent fat", seller: "Asda Smithdown", quantity: "750g", unitPrice: 7.99, lineTotal: 5.99, category: "Groceries", buyer: "Sarah", purchasedAt: "2024-07-04", tags: ["protein", "dinner"], shrinkflation: false, productUrl: "local://seller/asda/mince-beef" },
  { id: "ri-021", transactionId: "tx-010", item: "Rice", variant: "Basmati", seller: "Asda Smithdown", quantity: "1kg", unitPrice: 2.1, lineTotal: 2.1, category: "Groceries", buyer: "Sarah", purchasedAt: "2024-07-04", tags: ["staple"], shrinkflation: false, productUrl: "local://seller/asda/basmati-rice" },
  { id: "ri-022", transactionId: "tx-010", item: "Orange juice", variant: "Smooth", seller: "Asda Smithdown", quantity: "1.35l", unitPrice: 1.7, lineTotal: 2.3, category: "Groceries", buyer: "Sarah", purchasedAt: "2024-07-04", tags: ["shrinkflation-watch"], shrinkflation: true, productUrl: "local://seller/asda/orange-juice" },
  { id: "ri-023", transactionId: "tx-011", item: "Shampoo", variant: "Anti-frizz", seller: "Sainsbury's Woolton", quantity: "400ml", unitPrice: 6.25, lineTotal: 2.5, category: "Toiletries", buyer: "Mia", purchasedAt: "2024-07-18", tags: ["mia", "toiletries"], shrinkflation: false, productUrl: "local://seller/sainsburys/shampoo" },
  { id: "ri-024", transactionId: "tx-011", item: "Conditioner", variant: "Anti-frizz", seller: "Sainsbury's Woolton", quantity: "400ml", unitPrice: 6.25, lineTotal: 2.5, category: "Toiletries", buyer: "Mia", purchasedAt: "2024-07-18", tags: ["mia", "toiletries"], shrinkflation: false, productUrl: "local://seller/sainsburys/conditioner" },
  { id: "ri-025", transactionId: "tx-011", item: "Frozen peas", variant: "Garden peas", seller: "Sainsbury's Woolton", quantity: "900g", unitPrice: 1.66, lineTotal: 1.5, category: "Groceries", buyer: "Mark", purchasedAt: "2024-07-18", tags: ["veg", "staple"], shrinkflation: false, productUrl: "local://seller/sainsburys/frozen-peas" },
  { id: "ri-026", transactionId: "tx-012", item: "Milk", variant: "Semi-skimmed emergency top-up", seller: "Corner Shop Aigburth", quantity: "2 pints", unitPrice: 0.95, lineTotal: 1.9, category: "Groceries", buyer: "Sarah", purchasedAt: "2024-08-03", tags: ["corner-shop", "premium"], shrinkflation: false, productUrl: "local://seller/corner-shop/milk" },
  { id: "ri-027", transactionId: "tx-012", item: "Bread", variant: "White loaf emergency top-up", seller: "Corner Shop Aigburth", quantity: "800g", unitPrice: 1.55, lineTotal: 1.55, category: "Groceries", buyer: "Sarah", purchasedAt: "2024-08-03", tags: ["corner-shop", "premium"], shrinkflation: false, productUrl: "local://seller/corner-shop/bread" },
  { id: "ri-028", transactionId: "tx-012", item: "Crisps multipack", variant: "Cheese and onion", seller: "Corner Shop Aigburth", quantity: "6 pack", unitPrice: 3.25, lineTotal: 3.25, category: "Groceries", buyer: "Oliver", purchasedAt: "2024-08-03", tags: ["corner-shop", "teen-snacks", "shrinkflation-watch"], shrinkflation: true, productUrl: "local://seller/corner-shop/crisps" },
  { id: "ri-029", transactionId: "tx-013", item: "Hair spray", variant: "Firm hold", seller: "Boots", quantity: "250ml", unitPrice: 2.99, lineTotal: 2.99, category: "Toiletries", buyer: "Mia", purchasedAt: "2024-08-10", tags: ["mia", "toiletries"], shrinkflation: false, productUrl: "local://seller/boots/hair-spray" },
  { id: "ri-030", transactionId: "tx-013", item: "Nail polish", variant: "Blue gloss", seller: "Boots", quantity: "10ml", unitPrice: 4.49, lineTotal: 4.49, category: "Toiletries", buyer: "Mia", purchasedAt: "2024-08-10", tags: ["mia", "personal"], shrinkflation: false, productUrl: "local://seller/boots/nail-polish" },
  { id: "ri-031", transactionId: "tx-013", item: "Toothpaste", variant: "Family cavity protection", seller: "Boots", quantity: "125ml", unitPrice: 1.6, lineTotal: 1.6, category: "Toiletries", buyer: "Sarah", purchasedAt: "2024-08-10", tags: ["family", "staple"], shrinkflation: false, productUrl: "local://seller/boots/toothpaste" },
  { id: "ri-032", transactionId: "tx-014", item: "GCSE revision guide", variant: "Maths higher", seller: "Waterstones", quantity: "1 book", unitPrice: 8.99, lineTotal: 8.99, category: "Books", buyer: "Oliver", purchasedAt: "2024-09-02", tags: ["oliver", "school"], shrinkflation: false, productUrl: "local://seller/waterstones/gcse-maths" },
  { id: "ri-033", transactionId: "tx-014", item: "Young adult novel", variant: "Paperback", seller: "Waterstones", quantity: "1 book", unitPrice: 7.99, lineTotal: 7.99, category: "Books", buyer: "Mia", purchasedAt: "2024-09-02", tags: ["mia", "reading"], shrinkflation: false, productUrl: "local://seller/waterstones/ya-novel" },
  { id: "ri-034", transactionId: "tx-015", item: "Football boots", variant: "Firm ground", seller: "Decathlon", quantity: "Size 9", unitPrice: 32.99, lineTotal: 32.99, category: "Activities", buyer: "Oliver", purchasedAt: "2024-09-05", tags: ["oliver", "football"], shrinkflation: false, productUrl: "local://seller/decathlon/football-boots" },
  { id: "ri-035", transactionId: "tx-015", item: "Dance leggings", variant: "Black", seller: "Decathlon", quantity: "Age 15", unitPrice: 14.99, lineTotal: 14.99, category: "Activities", buyer: "Mia", purchasedAt: "2024-09-05", tags: ["mia", "dance"], shrinkflation: false, productUrl: "local://seller/decathlon/dance-leggings" },
  { id: "ri-036", transactionId: "tx-016", item: "Paint roller set", variant: "Walls and ceilings", seller: "B&Q", quantity: "1 set", unitPrice: 12.5, lineTotal: 12.5, category: "DIY", buyer: "Mark", purchasedAt: "2024-10-11", tags: ["diy", "house"], shrinkflation: false, productUrl: "local://seller/bq/roller-set" },
  { id: "ri-037", transactionId: "tx-016", item: "LED bulbs", variant: "Warm white", seller: "B&Q", quantity: "6 pack", unitPrice: 2.5, lineTotal: 15, category: "DIY", buyer: "Mark", purchasedAt: "2024-10-11", tags: ["diy", "energy"], shrinkflation: false, productUrl: "local://seller/bq/led-bulbs" },
  { id: "ri-038", transactionId: "tx-017", item: "Steam iron", variant: "Replacement for broken iron", seller: "Argos", quantity: "1 unit", unitPrice: 34.99, lineTotal: 34.99, category: "Household", buyer: "Sarah", purchasedAt: "2024-10-14", tags: ["replacement", "broken-iron"], shrinkflation: false, productUrl: "local://seller/argos/steam-iron" },
  { id: "ri-039", transactionId: "tx-018", item: "School trousers", variant: "Grey slim fit", seller: "Next", quantity: "2 pack", unitPrice: 14, lineTotal: 28, category: "Clothing", buyer: "Oliver", purchasedAt: "2024-11-01", tags: ["oliver", "school-uniform"], shrinkflation: false, productUrl: "local://seller/next/school-trousers" },
  { id: "ri-040", transactionId: "tx-018", item: "Winter coat", variant: "Water-resistant", seller: "Next", quantity: "Age 16", unitPrice: 42, lineTotal: 42, category: "Clothing", buyer: "Oliver", purchasedAt: "2024-11-01", tags: ["oliver", "winter"], shrinkflation: false, productUrl: "local://seller/next/winter-coat" },
  { id: "ri-041", transactionId: "tx-019", item: "Kitchen cleaner", variant: "Antibacterial spray", seller: "Home Bargains", quantity: "750ml", unitPrice: 1.29, lineTotal: 1.29, category: "Household", buyer: "Sarah", purchasedAt: "2025-01-18", tags: ["cleaning"], shrinkflation: false, productUrl: "local://seller/home-bargains/kitchen-cleaner" },
  { id: "ri-042", transactionId: "tx-019", item: "Toilet roll", variant: "Quilted", seller: "Home Bargains", quantity: "9 roll", unitPrice: 0.44, lineTotal: 3.99, category: "Household", buyer: "Sarah", purchasedAt: "2025-01-18", tags: ["staple", "shrinkflation-watch"], shrinkflation: true, productUrl: "local://seller/home-bargains/toilet-roll" },
  { id: "ri-043", transactionId: "tx-020", item: "Seedless green grapes", variant: "Punnet", seller: "Tesco Allerton", quantity: "500g", unitPrice: 4.58, lineTotal: 2.29, category: "Groceries", buyer: "Mark", purchasedAt: "2026-05-12", tags: ["fruit", "lunchbox"], shrinkflation: false, productUrl: "local://seller/tesco/seedless-green-grapes" },
  { id: "ri-044", transactionId: "tx-020", item: "Chicken breast fillets", variant: "Standard", seller: "Tesco Allerton", quantity: "650g", unitPrice: 8.75, lineTotal: 5.69, category: "Groceries", buyer: "Mark", purchasedAt: "2026-05-12", tags: ["protein", "dinner"], shrinkflation: false, productUrl: "local://seller/tesco/chicken-breast" },
  { id: "ri-045", transactionId: "tx-020", item: "Teen lunch snacks", variant: "Cereal bars", seller: "Tesco Allerton", quantity: "12 bars", unitPrice: 0.21, lineTotal: 2.5, category: "Groceries", buyer: "Oliver", purchasedAt: "2026-05-12", tags: ["oliver", "teen-snacks"], shrinkflation: true, productUrl: "local://seller/tesco/cereal-bars" },
  { id: "ri-046", transactionId: "tx-021", item: "Bathroom sealant", variant: "White anti-mould", seller: "The Range", quantity: "1 tube", unitPrice: 6.49, lineTotal: 6.49, category: "DIY", buyer: "Mark", purchasedAt: "2025-03-08", tags: ["diy", "bathroom"], shrinkflation: false, productUrl: "local://seller/the-range/bathroom-sealant" },
  { id: "ri-047", transactionId: "tx-021", item: "Picture hooks", variant: "Mixed pack", seller: "The Range", quantity: "40 pack", unitPrice: 3.25, lineTotal: 3.25, category: "DIY", buyer: "Sarah", purchasedAt: "2025-03-08", tags: ["diy", "house"], shrinkflation: false, productUrl: "local://seller/the-range/picture-hooks" },
  { id: "ri-048", transactionId: "tx-022", item: "Dry shampoo", variant: "Cherry", seller: "Superdrug", quantity: "200ml", unitPrice: 2.49, lineTotal: 2.49, category: "Toiletries", buyer: "Mia", purchasedAt: "2025-04-12", tags: ["mia", "toiletries", "school"], shrinkflation: false, productUrl: "local://seller/superdrug/dry-shampoo" },
  { id: "ri-049", transactionId: "tx-022", item: "Nail polish remover", variant: "Acetone free", seller: "Superdrug", quantity: "200ml", unitPrice: 1.79, lineTotal: 1.79, category: "Toiletries", buyer: "Mia", purchasedAt: "2025-04-12", tags: ["mia", "personal"], shrinkflation: false, productUrl: "local://seller/superdrug/nail-polish-remover" },
  { id: "ri-050", transactionId: "tx-022", item: "Deodorant", variant: "Sensitive roll-on", seller: "Superdrug", quantity: "50ml", unitPrice: 1.35, lineTotal: 1.35, category: "Toiletries", buyer: "Mia", purchasedAt: "2025-04-12", tags: ["mia", "toiletries"], shrinkflation: false, productUrl: "local://seller/superdrug/deodorant" },
  { id: "ri-051", transactionId: "tx-023", item: "Football training top", variant: "Black", seller: "Sports Direct", quantity: "Mens medium", unitPrice: 18.99, lineTotal: 18.99, category: "Clothing", buyer: "Oliver", purchasedAt: "2025-08-21", tags: ["oliver", "football", "clothing"], shrinkflation: false, productUrl: "local://seller/sports-direct/training-top" },
  { id: "ri-052", transactionId: "tx-023", item: "Running socks", variant: "Cushioned", seller: "Sports Direct", quantity: "3 pack", unitPrice: 8.99, lineTotal: 8.99, category: "Clothing", buyer: "Oliver", purchasedAt: "2025-08-21", tags: ["oliver", "sports"], shrinkflation: false, productUrl: "local://seller/sports-direct/running-socks" },
  { id: "ri-053", transactionId: "tx-024", item: "Family cinema tickets", variant: "2 adults, 2 teens", seller: "Vue Cinema", quantity: "4 tickets", unitPrice: 9.65, lineTotal: 38.6, category: "Activities", buyer: "Sarah", purchasedAt: "2025-11-15", tags: ["family", "mia", "oliver"], shrinkflation: false, productUrl: "local://seller/vue/family-tickets" },
  { id: "ri-054", transactionId: "tx-024", item: "Cinema snacks", variant: "Shared popcorn and drinks", seller: "Vue Cinema", quantity: "family combo", unitPrice: 10, lineTotal: 10, category: "Activities", buyer: "Mark", purchasedAt: "2025-11-15", tags: ["family", "snacks"], shrinkflation: false, productUrl: "local://seller/vue/snacks" },
  { id: "ri-055", transactionId: "tx-025", item: "GCSE English workbook", variant: "AQA", seller: "WHSmith", quantity: "1 book", unitPrice: 6.99, lineTotal: 6.99, category: "Books", buyer: "Mia", purchasedAt: "2026-02-03", tags: ["mia", "school", "books"], shrinkflation: false, productUrl: "local://seller/whsmith/gcse-english" },
  { id: "ri-056", transactionId: "tx-025", item: "Sketchbook", variant: "A4 hardback", seller: "WHSmith", quantity: "1 book", unitPrice: 5.49, lineTotal: 5.49, category: "Books", buyer: "Mia", purchasedAt: "2026-02-03", tags: ["mia", "art", "school"], shrinkflation: false, productUrl: "local://seller/whsmith/sketchbook" },
  { id: "ri-057", transactionId: "tx-026", item: "Dog food", variant: "Chicken complete", seller: "Pets at Home", quantity: "12kg", unitPrice: 2.08, lineTotal: 24.99, category: "Pets", buyer: "Poppy", purchasedAt: "2026-03-16", tags: ["poppy", "scout", "food"], shrinkflation: true, productUrl: "local://seller/pets-at-home/dog-food" },
  { id: "ri-058", transactionId: "tx-026", item: "Dog poo bags", variant: "Compostable", seller: "Pets at Home", quantity: "120 bags", unitPrice: 0.03, lineTotal: 3.79, category: "Pets", buyer: "Scout", purchasedAt: "2026-03-16", tags: ["poppy", "scout", "walking"], shrinkflation: false, productUrl: "local://seller/pets-at-home/poo-bags" },
  { id: "ri-059", transactionId: "tx-027", item: "Frozen chicken strips", variant: "Family bag", seller: "Iceland", quantity: "900g", unitPrice: 5.54, lineTotal: 4.99, category: "Groceries", buyer: "Sarah", purchasedAt: "2026-04-19", tags: ["protein", "teen-dinners"], shrinkflation: true, productUrl: "local://seller/iceland/chicken-strips" },
  { id: "ri-060", transactionId: "tx-027", item: "Frozen mixed vegetables", variant: "Steam bags", seller: "Iceland", quantity: "4 pack", unitPrice: 2.25, lineTotal: 2.25, category: "Groceries", buyer: "Sarah", purchasedAt: "2026-04-19", tags: ["veg", "staple"], shrinkflation: false, productUrl: "local://seller/iceland/mixed-veg" },
  { id: "ri-061", transactionId: "tx-027", item: "Ice cream cones", variant: "Chocolate", seller: "Iceland", quantity: "6 pack", unitPrice: 2.5, lineTotal: 2.5, category: "Groceries", buyer: "Oliver", purchasedAt: "2026-04-19", tags: ["treats", "family"], shrinkflation: false, productUrl: "local://seller/iceland/ice-cream-cones" },
  { id: "ri-063", transactionId: "tx-028", item: "Credit card interest charge", variant: "Monthly finance charge", seller: "Barclaycard", quantity: "1 charge", unitPrice: 46, lineTotal: 46, category: "Charges", buyer: "Sarah", purchasedAt: "2024-05-29", tags: ["credit-card", "avoidable-fee"], shrinkflation: false, productUrl: "local://seller/barclaycard/interest-charge" },
  { id: "ri-064", transactionId: "tx-029", item: "Mia weekly top-up", variant: "Extra allowance after overspend", seller: "Monzo Teen Top-up", quantity: "1 transfer", unitPrice: 15, lineTotal: 15, category: "Kids", buyer: "Mia", purchasedAt: "2024-05-28", tags: ["mia", "allowance", "top-up"], shrinkflation: false, productUrl: "local://seller/monzo/mia-top-up" },
  { id: "ri-065", transactionId: "tx-030", item: "Dog food pouches", variant: "Chicken selection", seller: "Pets at Home", quantity: "12 pack", unitPrice: 0.75, lineTotal: 8.99, category: "Pets", buyer: "Poppy", purchasedAt: "2024-05-27", tags: ["poppy", "scout", "food"], shrinkflation: true, productUrl: "local://seller/pets-at-home/dog-food-pouches" },
  { id: "ri-066", transactionId: "tx-030", item: "Dog treats", variant: "Dental sticks", seller: "Pets at Home", quantity: "14 pack", unitPrice: 0.28, lineTotal: 3.95, category: "Pets", buyer: "Scout", purchasedAt: "2024-05-27", tags: ["poppy", "scout", "treats"], shrinkflation: false, productUrl: "local://seller/pets-at-home/dental-sticks" }
];

export const seed = {
  users: [
    { id: "mother", name: "Sarah Hughes", role: "Mother", initials: "SH", colour: "#1d72e8", avatar: "sarah", email: "sarah@hughes.local", permissions: ["household-admin", "budget-editor", "receipt-editor"] },
    { id: "father", name: "Mark Hughes", role: "Father", initials: "MH", colour: "#109c92", avatar: "mark", email: "mark@hughes.local", permissions: ["budget-editor", "receipt-editor"] }
  ],
  household: [{
    id: "hughes",
    name: "Hughes Family",
    location: "Liverpool",
    members: ["Sarah, mother", "Mark, father", "Oliver, teenage son 17", "Mia, teenage daughter 15", "Poppy, golden labrador", "Scout, jack russell"],
    dataset: { transactions: 2048, receiptItems: 7846, year: 2025 },
    assumptions: {
      maleWeeklyGross: 767.3,
      femaleWeeklyGross: 674.1,
      councilTaxBand: "B",
      councilTaxAnnual: 1980.57,
      energyCapAnnual: 1725,
      foodShareAverage: 11.3,
      petrolPencePerLitre: 136.4
    }
  }],
  transactions: [
    { id: "tx-001", merchant: "Tesco Allerton", category: "Groceries", owner: "Sarah", amount: 84.31, date: "2024-05-30", context: "Shared" },
    { id: "tx-002", merchant: "Aldi Wavertree", category: "Groceries", owner: "Mark", amount: 42.19, date: "2024-05-29", context: "Shared" },
    { id: "tx-003", merchant: "Merseyrail", category: "Transport", owner: "Oliver", amount: 18.8, date: "2024-05-28", context: "Child" },
    { id: "tx-004", merchant: "Boots", category: "Pharmacy", owner: "Mia", amount: 12.45, date: "2024-05-28", context: "Child" },
    { id: "tx-005", merchant: "Vets4Pets", category: "Pets", owner: "Poppy", amount: 64, date: "2024-05-27", context: "Pet" },
    { id: "tx-006", merchant: "Shell", category: "Petrol", owner: "Mark", amount: 71.2, date: "2024-05-26", context: "Car" },
    { id: "tx-007", merchant: "B&M", category: "Household", owner: "Sarah", amount: 33.16, date: "2024-05-25", context: "Shared" },
    ...extraTransactions
  ],
  receipt_items: [
    { id: "ri-001", transactionId: "tx-001", item: "Seedless green grapes", variant: "Punnet", seller: "Tesco Allerton", quantity: "500g", unitPrice: 4.38, lineTotal: 2.19, category: "Groceries", buyer: "Sarah", purchasedAt: "2024-05-30", tags: ["fruit", "lunchbox"], shrinkflation: false, productUrl: "local://seller/tesco/seedless-green-grapes" },
    { id: "ri-002", transactionId: "tx-001", item: "Own-brand cornflakes", variant: "Family cereal", seller: "Tesco Allerton", quantity: "500g", unitPrice: 0.36, lineTotal: 1.8, category: "Groceries", buyer: "Sarah", purchasedAt: "2024-05-30", tags: ["breakfast", "staple"], shrinkflation: true, productUrl: "local://seller/tesco/cornflakes-500g" },
    { id: "ri-003", transactionId: "tx-001", item: "Dog treats multipack", variant: "Chicken", seller: "Tesco Allerton", quantity: "420g", unitPrice: 0.93, lineTotal: 3.9, category: "Pets", buyer: "Sarah", purchasedAt: "2024-05-30", tags: ["poppy", "scout"], shrinkflation: true, productUrl: "local://seller/tesco/dog-treats" },
    { id: "ri-004", transactionId: "tx-001", item: "School lunch apples", variant: "Royal Gala", seller: "Tesco Allerton", quantity: "6 pack", unitPrice: 0.32, lineTotal: 1.9, category: "Kids", buyer: "Sarah", purchasedAt: "2024-05-30", tags: ["mia", "oliver", "lunchbox"], shrinkflation: false, productUrl: "local://seller/tesco/royal-gala-apples" },
    { id: "ri-062", transactionId: "tx-001", item: "Crisps multipack", variant: "Ready salted", seller: "Tesco Allerton", quantity: "6 pack", unitPrice: 2.15, lineTotal: 2.15, category: "Groceries", buyer: "Oliver", purchasedAt: "2024-05-30", tags: ["oliver", "teen-snacks"], shrinkflation: false, productUrl: "local://seller/tesco/crisps" },
    { id: "ri-005", transactionId: "tx-002", item: "Semi-skimmed milk", variant: "Fresh", seller: "Aldi Wavertree", quantity: "4 pints", unitPrice: 0.36, lineTotal: 1.45, category: "Groceries", buyer: "Mark", purchasedAt: "2024-05-29", tags: ["staple"], shrinkflation: false, productUrl: "local://seller/aldi/semi-skimmed-milk" },
    { id: "ri-006", transactionId: "tx-002", item: "Wholemeal bread", variant: "Medium loaf", seller: "Aldi Wavertree", quantity: "800g", unitPrice: 0.07, lineTotal: 0.59, category: "Groceries", buyer: "Mark", purchasedAt: "2024-05-29", tags: ["staple", "sandwiches"], shrinkflation: false, productUrl: "local://seller/aldi/wholemeal-bread" },
    { id: "ri-007", transactionId: "tx-004", item: "Hay fever tablets", variant: "Non-drowsy", seller: "Boots", quantity: "30 tablets", unitPrice: 0.13, lineTotal: 3.99, category: "Pharmacy", buyer: "Mia", purchasedAt: "2024-05-28", tags: ["mia", "health"], shrinkflation: false, productUrl: "local://seller/boots/hay-fever-tablets" },
    { id: "ri-008", transactionId: "tx-004", item: "Hair bobbles", variant: "Black multipack", seller: "Boots", quantity: "20 pack", unitPrice: 0.1, lineTotal: 1.99, category: "Kids", buyer: "Mia", purchasedAt: "2024-05-28", tags: ["mia", "school"], shrinkflation: false, productUrl: "local://seller/boots/hair-bobbles" },
    { id: "ri-009", transactionId: "tx-005", item: "Dog vaccine booster", variant: "Annual appointment", seller: "Vets4Pets", quantity: "1 service", unitPrice: 64, lineTotal: 64, category: "Pets", buyer: "Poppy", purchasedAt: "2024-05-27", tags: ["poppy", "vet"], shrinkflation: false, productUrl: "local://seller/vets4pets/booster" },
    { id: "ri-010", transactionId: "tx-006", item: "Unleaded petrol", variant: "E10", seller: "Shell", quantity: "48.1 litres", unitPrice: 1.48, lineTotal: 71.2, category: "Car", buyer: "Mark", purchasedAt: "2024-05-26", tags: ["car", "fuel"], shrinkflation: false, productUrl: "local://seller/shell/e10" },
    { id: "ri-011", transactionId: "tx-007", item: "Laundry pods", variant: "Bio", seller: "B&M", quantity: "24 washes", unitPrice: 0.23, lineTotal: 5.5, category: "Household", buyer: "Sarah", purchasedAt: "2024-05-25", tags: ["cleaning", "shrinkflation-watch"], shrinkflation: true, productUrl: "local://seller/bm/laundry-pods" },
  { id: "ri-012", transactionId: "tx-007", item: "Green jacket", variant: "Teen lightweight rain jacket", seller: "B&M", quantity: "Age 15", unitPrice: 14, lineTotal: 14, category: "Clothing", buyer: "Mia", purchasedAt: "2024-05-25", tags: ["mia", "clothing", "school"], shrinkflation: false, productUrl: "local://seller/bm/green-child-rain-jacket" },
    ...extraReceiptItems
  ],
  alerts: [
    { id: "al-001", severity: "High", vendor: "Tesco", category: "Groceries", delta: "+£31", changeValue: "+£31 vs usual basket", date: "2024-05-30", status: "New", transactionId: "tx-001", recommendedAction: "Review Tesco basket and substitute high-movement products" },
    { id: "al-002", severity: "High", vendor: "Credit Card", category: "Charges", delta: "+£46", changeValue: "+£46 new charge", date: "2024-05-29", status: "New", transactionId: "tx-028", recommendedAction: "Schedule repayment to avoid repeat interest" },
    { id: "al-003", severity: "Medium", vendor: "Mia top-up", category: "Kids", delta: "+£15", changeValue: "+£15 over weekly cap", date: "2024-05-28", status: "Investigating", transactionId: "tx-029", recommendedAction: "Set top-up approval rule for Mia" },
    { id: "al-004", severity: "Medium", vendor: "Dog food", category: "Pets", delta: "+£9", changeValue: "+£9 vs last pet-food shop", date: "2024-05-27", status: "Reviewing", transactionId: "tx-030", recommendedAction: "Move dog food to planned monthly pet basket" }
  ],
  reports: [
    { id: "rp-001", name: "May Household Summary", type: "Financial", generated: "2024-05-31 09:15", owner: "Sarah Hughes", format: "PDF", status: "Complete" },
    { id: "rp-002", name: "Grocery Inflation - May", type: "Inflation", generated: "2024-05-31 08:02", owner: "Mark Hughes", format: "XLSX", status: "Complete" },
    { id: "rp-003", name: "Child Allowance Report", type: "Kids", generated: "2024-05-30 16:47", owner: "Sarah Hughes", format: "PDF", status: "Complete" }
  ],
  integrations: [
    { id: "in-001", name: "Tesco Clubcard", type: "Loyalty", status: "Connected", lastSync: "2 minutes ago" },
    { id: "in-002", name: "ONS CPIH", type: "Source", status: "Connected", lastSync: "2 minutes ago" },
    { id: "in-003", name: "Ofgem", type: "Source", status: "Connected", lastSync: "1 hour ago" },
    { id: "in-004", name: "Barclaycard", type: "Card", status: "Connected", lastSync: "12 minutes ago" }
  ],
  source_notes: [
    { id: "src-001", source: "Nomis Labour Market Profile: Liverpool", url: "https://www.nomisweb.co.uk/reports/lmp/lad/1778385135/report.aspx", note: "2025 resident median gross weekly pay: full-time male £767.30, female £674.10; used for the two adult salary assumptions." },
    { id: "src-002", source: "ONS Family Spending in the UK", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/personalandhouseholdfinances/expenditure/bulletins/familyspendingintheuk/latest", note: "FYE 2024 household expenditure categories used to shape monthly budget weights." },
    { id: "src-003", source: "DEFRA Family Food FYE 2024", url: "https://www.gov.uk/government/statistics/family-food-fye-2024/family-food-fye-2024", note: "Average UK household food and non-alcoholic drink share of expenditure: 11.3%; used as grocery baseline." },
    { id: "src-004", source: "ONS CPI basket/inflation", url: "https://www.ons.gov.uk/economy/inflationandpriceindices/articles/ukconsumerpriceinflationbasketofgoodsandservices/2024/pdf", note: "Basket categories include food, clothing, transport, pet care, dog food and dog treats; mapped to item-level inflation tags." },
    { id: "src-005", source: "Ofgem energy price cap", url: "https://www.ofgem.gov.uk/news/new-energy-price-cap-level-october-december-2024-starts-today", note: "2024 typical annual dual-fuel cap values used for gas/electricity bill modelling." },
    { id: "src-006", source: "Liverpool City Council Council Tax", url: "https://liverpool.gov.uk/council-tax/how-much/?rp=true", note: "2025/26 Band B annual council tax £1,980.57; 2024/25 £1,882.53." },
    { id: "src-007", source: "RAC Foundation fuel factsheet", url: "https://www.racfoundation.org/wp-content/uploads/Fuel_Factsheet_10_December_2024.pdf?v=11122024", note: "10 Dec 2024 UK petrol average 136.40p/litre; used for car running-cost seed values." }
  ],
  settings: [
    { id: "assumptions", name: "Source-backed assumptions", values: [
      ["Male earner gross weekly pay", "£767.30", "Nomis Liverpool resident full-time median, 2025"],
      ["Female earner gross weekly pay", "£674.10", "Nomis Liverpool resident full-time median, 2025"],
      ["Council tax", "£1,980.57", "Liverpool Band B, 2025/26"],
      ["Food baseline", "11.3%", "DEFRA/ONS Family Food FYE 2024"],
      ["Energy annual baseline", "£1,725", "Ofgem 2024 price-cap context"],
      ["Petrol", "136.40p/litre", "RAC Foundation, 10 Dec 2024"]
    ] }
  ],
  yearly_spend: buildYearlySpend(),
  onboarding: [{ id: "state", step: 0, complete: false }]
};

export async function ensureSeeded() {
  const existing = await getAll("users");
  if (existing.length) {
    const transactions = await getAll("transactions");
    if (transactions.length < seed.transactions.length) await putMany("transactions", seed.transactions);
    const items = await getAll("receipt_items");
    if (items.length < seed.receipt_items.length) await putMany("receipt_items", seed.receipt_items);
    await putMany("alerts", seed.alerts);
    await putMany("source_notes", seed.source_notes);
    await putMany("household", seed.household);
    await putMany("settings", seed.settings);
    const yearly = await getAll("yearly_spend");
    if (yearly.length < seed.yearly_spend.length || !yearly.some((row) => row.year === 2026)) await putMany("yearly_spend", seed.yearly_spend);
    return;
  }
  for (const [storeName, values] of Object.entries(seed)) await putMany(storeName, values);
  await putOne("session", { id: "current", userId: null });
}

export async function resetLocalDb() {
  for (const storeName of stores) await clearStore(storeName);
  for (const [storeName, values] of Object.entries(seed)) await putMany(storeName, values);
  await putOne("session", { id: "current", userId: null });
}
