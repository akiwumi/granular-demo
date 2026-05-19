import React, { useEffect, useMemo, useState } from "react";
import { ensureSeeded, getAll, getOne, putOne, resetLocalDb } from "./db.js";

const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fallbackCategoryPlans = [
  ["Income", [6175, 6175, 6175, 6175, 6175, 6175, 6175, 6175, 6175, 6175, 6175, 6175]],
  ["Groceries", [702, 688, 721, 739, 756, 748, 771, 785, 802, 817, 829, 846]],
  ["Housing", [1125, 1125, 1125, 1125, 1125, 1125, 1125, 1125, 1125, 1125, 1125, 1125]],
  ["Council tax", [165, 165, 165, 165, 165, 165, 165, 165, 165, 165, 165, 165]],
  ["Energy", [183, 176, 162, 145, 132, 126, 121, 124, 138, 151, 168, 189]],
  ["Water", [46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46]],
  ["Broadband & mobile", [122, 122, 122, 128, 128, 128, 128, 128, 128, 134, 134, 134]],
  ["Kids allowance & school", [176, 164, 219, 188, 203, 244, 276, 312, 421, 238, 224, 386]],
  ["Pets", [158, 171, 164, 186, 205, 177, 191, 184, 213, 196, 202, 218]],
  ["Transport & car", [384, 366, 392, 411, 428, 402, 418, 451, 439, 426, 471, 488]],
  ["Clothing", [112, 96, 134, 127, 166, 148, 156, 221, 389, 172, 146, 244]],
  ["Eating out", [238, 212, 226, 241, 267, 284, 311, 339, 278, 251, 294, 368]],
  ["Subscriptions", [96, 96, 102, 102, 102, 108, 108, 108, 114, 114, 114, 121]],
  ["Holiday savings", [260, 260, 260, 260, 300, 300, 300, 300, 300, 300, 350, 350]],
  ["Credit card & bank charges", [72, 64, 81, 75, 88, 92, 84, 79, 86, 91, 96, 104]]
];

function fallbackYearlySpend() {
  const yearFactors = [[2024, 0.93, 12], [2025, 1, 12], [2026, 1.055, 5]];
  return yearFactors.flatMap(([year, factor, count]) => fallbackCategoryPlans.flatMap(([category, values]) => values.slice(0, count).map((amount, index) => ({
    id: `${year}-${category}-${index}`,
    month: months[index],
    monthIndex: index + 1,
    category,
    amount: Math.round(amount * factor),
    year
  }))));
}

const nav = [
  ["dashboard", "▦", "Dashboard"],
  ["ai", "✦", "AI Assistant"],
  ["annual", "▥", "Annual View"],
  ["monthly", "▤", "Monthly View"],
  ["finance", "↗", "Finance Dashboard"],
  ["spending", "⌕", "Spending Explorer"],
  ["receipts", "▤", "Receipts"],
  ["receipt-detail", "◫", "Receipt Detail"],
  ["item-detail", "◇", "Item Detail"],
  ["cashflow", "⌁", "Cash Flow Insights"],
  ["alerts", "!", "Expense Alerts", "3"],
  ["forecasting", "⇡", "Forecasting"],
  ["grocery", "☷", "Grocery Intelligence"],
  ["inflation", "%", "Inflation Tracker"],
  ["shrinkflation", "⇄", "Shrinkflation"],
  ["budgets", "◴", "Budgets"],
  ["calendar", "□", "Calendar"],
  ["income", "£", "Income & Savings"],
  ["charges", "⚑", "Charges & Debt"],
  ["kids", "◉", "Kids Money"],
  ["pets", "◇", "Pets"],
  ["car", "◌", "Car"],
  ["holidays", "✈", "Holidays"],
  ["household", "⌂", "Household"],
  ["reports", "▧", "Reports"],
  ["integrations", "⚙", "Integrations"],
  ["settings", "☼", "User Settings"],
  ["appsettings", "◎", "App Settings"],
  ["admin", "✎", "Admin"],
  ["faq", "?", "FAQ"],
  ["help", "ⓘ", "Help"],
  ["contact", "✉", "Contact"],
  ["videos", "▶", "Videos"],
  ["sources", "§", "Data Sources"]
];

const series = {
  cash: [76, 63, 82, 72, 104, 85, 58, 80, 76, 108, 86, 105, 98, 129],
  income: [44, 60, 42, 52, 55, 52, 77, 53, 38, 45, 52, 50],
  spend: [36, 41, 35, 38, 40, 46, 47, 37, 41, 42, 38, 42],
  alerts: [4, 7, 9, 12, 11, 15, 18, 21, 23, 26, 31, 29, 35, 34],
  forecast: [128, 122, 126, 132, 150, 139, 142, 160, 172, 181, 169, 154, 143, 136],
  optimistic: [128, 122, 126, 138, 145, 160, 171, 181, 166, 150, 142, 135]
};

const kpis = {
  dashboard: [
    ["Cash on Hand", "£128,540", "↑ 12.5% vs Apr 30, 2024", "cash"],
    ["Monthly Burn", "£42,350", "↓ 4.3% vs Apr 1 - Apr 30", "spend"],
    ["Net Cash Flow", "£18,920", "↑ 26.7% vs Apr 1 - Apr 30", "cash"],
    ["Runway", "5.3 months", "↑ 0.8 mo vs Apr 30, 2024", "forecast"],
    ["Outstanding Invoices", "£34,680", "↑ 8.2% vs Apr 30, 2024", "income", "down"]
  ],
  cashflow: [
    ["Operating Cash Flow", "£18,920", "↑ 26.7% vs Apr 1 - Apr 30", "cash"],
    ["Cash In", "£186,760", "↑ 25.4% vs Apr 1 - Apr 30", "income"],
    ["Cash Out", "£167,840", "↑ 18.7% vs Apr 1 - Apr 30", "spend", "down"],
    ["Collection Cycle", "34 days", "↓ 5 days vs Apr 1 - Apr 30", "cash"],
    ["Burn Efficiency", "1.18x", "↓ 0.12x vs Apr 1 - Apr 30", "forecast"]
  ],
  forecasting: [
    ["Forecasted Cash", "£128,540", "↑ £12,540 vs current balance", "cash"],
    ["Runway", "5.3 months", "▲ 0.8 mo vs current runway", "forecast"],
    ["Revenue Growth", "+18%", "Next 12 months monthly avg.", "optimistic"],
    ["Burn Rate", "£34,120", "↑ £1,240 vs current burn", "spend", "down"],
    ["Breakeven Date", "Dec 28, 2024", "7 months from now", "forecast"]
  ],
  alerts: [
    ["Open Alerts", "23", "↑ 27% vs Apr 1 - Apr 30", "alerts", "down"],
    ["High-Risk Alerts", "7", "↑ 40% vs Apr 1 - Apr 30", "alerts", "down"],
    ["Potential Savings", "£28,450", "↑ 18% vs Apr 1 - Apr 30", "cash"],
    ["Recurring Increases", "12", "↑ 33% vs Apr 1 - Apr 30", "forecast", "down"],
    ["Vendor Concentration", "68%", "↑ 8pp vs Apr 1 - Apr 30", "optimistic", "down"]
  ]
};

const onboardingSteps = [
  "Welcome and privacy-first local data",
  "Household setup: Liverpool family, children, pets",
  "Adult income and permissions",
  "Children allowance and top-up rules",
  "Pets, car, bills, groceries, and savings goals",
  "Import generated Liverpool demo dataset",
  "Review assumptions and start dashboard"
];

const moduleCopy = {
  spending: ["Spending Explorer", "Search by date, time, store, country, product, member, dog, payment method, amount, or receipt text.", ["Searchable purchase record", "Recent transactions", "Smart filters"]],
  receipts: ["Receipts", "Open purchases into receipt-level detail with itemised baskets and price movement.", ["Receipt detail", "Itemized basket", "OCR confidence"]],
  grocery: ["Grocery Intelligence", "Supermarket comparison, basket trends, promotions, substitutions, and staples.", ["Supermarket comparison", "Staples trend", "Corner shop premium"]],
  inflation: ["Inflation Tracker", "Household inflation vs UK CPIH with item-level price trends.", ["Household inflation", "Item price trend", "What changed this month"]],
  shrinkflation: ["Shrinkflation Tracker", "Pack-size timelines and effective unit-price increases.", ["Pack-size timeline", "Unit price impact", "Annual loss estimate"]],
  budgets: ["Budget Planner", "Monthly envelopes, annual targets, pots, and suggested changes.", ["Monthly envelope", "Annual target", "Pots"]],
  calendar: ["Calendar", "Bills, renewals, holidays, school events, pets, and car events.", ["Bills and renewals", "Agenda view", "Family filters"]],
  income: ["Income & Savings", "Adult income, child benefit, allowance schedules, and savings goals.", ["Adult income", "Savings goals", "Allowance schedule"]],
  charges: ["Charges & Debt", "Credit card interest, bank charges, fees, and repayment forecast.", ["Credit card", "Bank charges", "Avoidable fees"]],
  kids: ["Kids Money", "Allowance, top-ups, requests, balances, and purpose labels.", ["Mia and Oliver", "Money requests", "Purpose labels"]],
  pets: ["Pets", "Dog food, vet, insurance, grooming, and medication spend.", ["Poppy and Scout", "Price drift", "Upcoming care"]],
  car: ["Car", "Fuel, parking, insurance, MOT, repairs, and servicing.", ["One car", "Running cost", "Renewals"]],
  holidays: ["Holidays", "Spain target, Greece alternative, travel spending, and card fees.", ["Spain target", "Greece alternative", "Spending money"]],
  household: ["Household Profile", "Members, pets, car, location, assumptions, and privacy labels.", ["Members", "Assumptions", "Privacy"]],
  appsettings: ["App Settings", "Locale, tax assumptions, source selection, imports, exports, and feature flags.", ["Currency and locale", "Data controls", "Feature flags"]],
  admin: ["Admin And Setup", "Manipulate users, data, alerts, reports, onboarding, and seed health.", ["Setup control", "Seed health", "Onboarding editor"]],
  faq: ["FAQ", "Searchable frequently asked questions for local household finance.", ["Receipts", "Inflation", "Privacy"]],
  help: ["Help Centre", "Guides and contextual help for every major screen.", ["Getting started", "Guides", "Contextual help"]],
  videos: ["Instructional Videos", "Seeded video cards with transcripts, topics, and completion status.", ["Getting started with Granular", "Searching purchases", "Understanding shrinkflation"]],
  sources: ["Data Sources", "Public UK statistics and plausible household modelling notes.", ["Source notes", "Assumptions", "Local disclosure"]]
};

const secondaryLinks = {
  "Searchable purchase record": "spending",
  "Recent transactions": "receipts",
  "Smart filters": "spending?q=tesco",
  "Receipt detail": "receipt-detail?id=tx-001",
  "Itemized basket": "receipt-detail?id=tx-001",
  "OCR confidence": "receipt-detail?id=tx-001",
  "Supermarket comparison": "supermarket-comparison",
  "Staples trend": "staples-trend",
  "Corner shop premium": "corner-premium",
  "Household inflation": "inflation",
  "Item price trend": "annual",
  "What changed this month": "alerts",
  "Pack-size timeline": "item-detail?id=ri-011",
  "Unit price impact": "item-detail?id=ri-011",
  "Annual loss estimate": "annual",
  "Monthly envelope": "budgets",
  "Annual target": "annual",
  "Pots": "income",
  "Bills and renewals": "calendar",
  "Agenda view": "calendar",
  "Family filters": "household",
  "Adult income": "annual",
  "Savings goals": "holidays",
  "Allowance schedule": "kids",
  "Credit card": "annual",
  "Bank charges": "annual",
  "Avoidable fees": "alerts",
  "Mia and Oliver": "kids",
  "Money requests": "kids",
  "Purpose labels": "kids",
  "Poppy and Scout": "spending?q=dog",
  "Price drift": "annual",
  "Upcoming care": "calendar",
  "One car": "spending?q=shell",
  "Running cost": "annual",
  "Renewals": "calendar",
  "Spain target": "annual",
  "Greece alternative": "annual",
  "Spending money": "kids",
  "Members": "household",
  "Assumptions": "sources",
  "Privacy": "settings",
  "Currency and locale": "appsettings",
  "Data controls": "admin",
  "Feature flags": "admin",
  "Setup control": "admin",
  "Seed health": "admin",
  "Onboarding editor": "settings",
  "Source notes": "sources",
  "Local disclosure": "sources"
};

export function App() {
  const [route, setRoute] = useHashRoute();
  const [ready, setReady] = useState(false);
  const [data, setData] = useState(null);

  async function refresh() {
    const [users, session, household, transactions, receiptItems, alerts, reports, integrations, sources, yearlySpend, onboarding, assumptions, settings] = await Promise.all([
      getAll("users"),
      getOne("session", "current"),
      getOne("household", "hughes"),
      getAll("transactions"),
      getAll("receipt_items"),
      getAll("alerts"),
      getAll("reports"),
      getAll("integrations"),
      getAll("source_notes"),
      getAll("yearly_spend"),
      getOne("onboarding", "state"),
      getOne("settings", "assumptions"),
      getAll("settings")
    ]);
    const withFallback = yearlySpend.length ? yearlySpend : fallbackYearlySpend();
    setData({ users, session, household, transactions, receiptItems, alerts, reports, integrations, sources, yearlySpend: applyIncomeOverride(withFallback, settings), onboarding, assumptions, settings });
  }

  useEffect(() => {
    ensureSeeded().then(refresh).then(() => setReady(true));
  }, []);

  if (!ready || !data) return <div className="boot">Opening local database...</div>;
  const user = data.users.find((item) => item.id === data.session?.userId);
  const routeName = baseRoute(route);
  const publicRoute = ["landing", "login", "create", "onboarding"].includes(routeName);
  const safeRoute = user || publicRoute ? routeName : "landing";
  const appProps = { data, user, refresh, go: setRoute };

  if (safeRoute === "landing") return <Landing go={setRoute} login={(id) => login(id, refresh, setRoute)} />;
  if (safeRoute === "login") return <Login data={data} go={setRoute} login={(id) => login(id, refresh, setRoute)} />;
  if (safeRoute === "create") return <CreateAccount go={setRoute} refresh={refresh} />;
  if (safeRoute === "onboarding") return <Onboarding data={data} refresh={refresh} go={setRoute} />;

  return (
    <Chrome active={safeRoute} {...appProps}>
      <Screen route={route} routeName={safeRoute} {...appProps} />
    </Chrome>
  );
}

function useHashRoute() {
  const initial = () => window.location.hash.replace("#", "") || "landing";
  const [route, setRouteState] = useState(initial);
  useEffect(() => {
    const onHash = () => setRouteState(initial());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  function setRoute(next) {
    window.location.hash = next;
    setRouteState(next);
  }
  return [route, setRoute];
}

async function login(id, refresh, go) {
  await putOne("session", { id: "current", userId: id });
  const onboarding = await getOne("onboarding", "state");
  await refresh();
  go(onboarding?.complete ? "dashboard" : "onboarding");
}

function Landing({ go, login }) {
  return (
    <div className="landing-shell">
      <div className="landing-card">
        <header className="landing-nav">
          <Brand label="/ Granular.local" />
          <div className="nav-links"><span>Product</span><span>Household</span><span>Budgeting</span><span>Sources</span></div>
          <div className="landing-actions"><button className="ghost" onClick={() => go("login")}>Log in</button><button className="primary" onClick={() => login("mother")}>View demo</button></div>
        </header>
        <section className="hero">
          <div className="hero-stats"><span className="avatar">£</span><span>Receipt-level household money</span></div>
          <h1>Know<br />each pound.</h1>
          <p className="hero-copy">Granular is a local-first React app for searchable receipts, item prices, child allowance records, inflation alerts, and year-ahead cashflow.</p>
          <div className="hero-cta"><button className="primary" onClick={() => login("mother")}>Enter demo</button><button className="ghost" onClick={() => go("create")}>Create local account</button><button className="ghost" onClick={() => go("login")}>Log in</button></div>
          <div className="hero-person" />
          <div className="float-card big"><small>HOUSEHOLD INFLATION</small><h2>+6.8%</h2><p>Groceries, petrol, and pet care lead the month.</p></div>
          <div className="float-card product"><div className="shoe" /><div><h3>Tesco basket</h3><h2>£84.31</h2><span className="status warn">3 price moves</span></div></div>
        </section>
        <div className="logos"><span>Tesco</span><span>Ocado</span><span>Aldi</span><span>Ofgem</span><span>ONS</span></div>
      </div>
    </div>
  );
}

function Login({ data, go, login }) {
  return (
    <div className="auth-panel">
      <Brand label="Granular" />
      <h1>Choose demo account</h1>
      <p>Local mock login. Profile choice changes ownership, settings, filters, and notifications.</p>
      <div className="account-picks">
        {data.users.map((item) => (
          <button className="account-pick" key={item.id} onClick={() => login(item.id)}>
            <Avatar user={item} /><h3>{item.name}</h3><p>{item.role} · {item.email}</p>
          </button>
        ))}
      </div>
      <button className="secondary" onClick={() => go("create")}>Create account</button>
      <button className="ghost" onClick={() => go("landing")}>Back</button>
    </div>
  );
}

function CreateAccount({ go, refresh }) {
  const [form, setForm] = useState({ name: "", email: "", pin: "", confirm: "", role: "Household admin", household: "Hughes Family" });
  const valid = form.name.trim() && form.email.trim() && form.pin && form.pin === form.confirm;
  async function submit() {
    if (!valid) return;
    const initials = form.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
    const id = `user-${Date.now()}`;
    await putOne("users", { id, name: form.name, role: form.role, initials, colour: "#7c5ce4", email: form.email, permissions: ["budget-editor"] });
    await putOne("session", { id: "current", userId: id });
    await putOne("onboarding", { id: "state", step: 0, complete: false });
    await refresh();
    go("onboarding");
  }
  return (
    <div className="auth-panel">
      <h1>Create local account</h1>
      <p>Saved to IndexedDB in this browser only. No online authentication.</p>
      <div className="grid">
        {["name", "email", "pin", "confirm", "household"].map((key) => (
          <label className="field" key={key}>{labelFor(key)}<input type={key.includes("pin") || key === "confirm" ? "password" : "text"} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>
        ))}
        <label className="field">Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option>Household admin</option><option>Budget editor</option><option>Receipt editor</option><option>View only</option></select></label>
        <button className="primary" disabled={!valid} onClick={submit}>Start onboarding</button>
        <button className="ghost" onClick={() => go("login")}>Use demo accounts</button>
      </div>
    </div>
  );
}

function Onboarding({ data, refresh, go }) {
  const step = data.onboarding?.step || 0;
  async function next() {
    if (step >= onboardingSteps.length - 1) {
      await putOne("onboarding", { id: "state", step, complete: true });
      await refresh();
      go("dashboard");
      return;
    }
    await putOne("onboarding", { id: "state", step: step + 1, complete: false });
    await refresh();
  }
  async function back() {
    await putOne("onboarding", { id: "state", step: Math.max(0, step - 1), complete: false });
    await refresh();
  }
  async function skip() {
    await putOne("onboarding", { id: "state", step, complete: true });
    await refresh();
    go("dashboard");
  }
  return (
    <div className="onboarding">
      <section className="onboarding-card">
        <Brand label="Granular onboarding" />
        <div className="progress"><span style={{ width: `${((step + 1) / onboardingSteps.length) * 100}%` }} /></div>
        <p>Step {step + 1} of {onboardingSteps.length}</p>
        <h1>{onboardingSteps[step]}</h1>
        <p>Demo defaults are editable later in Settings. Granular keeps the household record local and models receipt items, price history, child money, card charges, and savings pots.</p>
        <div className="grid three">
          <div className="card"><h3>Household</h3><p>{data.household.members.join(", ")}</p></div>
          <div className="card"><h3>Monthly income</h3><p>Estimated from public UK/Liverpool earnings sources with net pay assumptions.</p></div>
          <div className="card"><h3>Local DB</h3><p>{data.household.dataset.transactions.toLocaleString()} transactions and {data.household.dataset.receiptItems.toLocaleString()} receipt items target scope.</p></div>
        </div>
        <div className="hero-cta"><button className="ghost" onClick={back}>Back</button><button className="primary" onClick={next}>{step === onboardingSteps.length - 1 ? "Finish" : "Next"}</button><button className="ghost" onClick={skip}>Skip safe steps</button></div>
      </section>
    </div>
  );
}

function Chrome({ active, data, user, go, refresh, children }) {
  const [globalSearch, setGlobalSearch] = useState("");
  async function logout() {
    await putOne("session", { id: "current", userId: null });
    await refresh();
    go("login");
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand label={<><div>Granular</div><small>Household Insight</small></>} />
        <nav className="nav-list">{nav.map(([id, icon, label, badge]) => <a className={`nav-item ${active === id ? "active" : ""}`} href={`#${id}`} key={id}><span>{icon}</span><span>{label}</span>{badge && <span className="badge">{badge}</span>}</a>)}</nav>
        <div className="workspace"><strong>{data.household.name}</strong><small>{data.household.location} · IndexedDB local app</small><button className="ghost" onClick={logout}>Switch account</button></div>
      </aside>
      <main className="main">
        <div className="topbar">
          <input className="search" value={globalSearch} placeholder="Search receipts, stores, items, dates..." onChange={(event) => setGlobalSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && go(`spending?q=${encodeURIComponent(globalSearch.trim())}`)} />
          <div className="toolbar"><button className="ghost" onClick={() => go(active === "annual" ? "monthly" : "annual")}>{active === "annual" ? "Monthly view" : "Annual view"}</button><button className="ghost" onClick={() => go("reports")}>Export</button><button className="profile-button" onClick={() => go("settings")}><Avatar user={user} /><span>{user.name}</span></button></div>
        </div>
        {children}
      </main>
      <nav className="bottom-nav">{[["dashboard", "Home"], ["spending", "Search"], ["calendar", "Calendar"], ["budgets", "Budgets"], ["settings", "More"]].map(([id, label]) => <a className={active === id ? "active" : ""} href={`#${id}`} key={id}>{label}</a>)}</nav>
    </div>
  );
}

function Screen(props) {
  const { routeName } = props;
  if (routeName === "dashboard") return <Dashboard {...props} />;
  if (routeName === "ai") return <AIAssistant {...props} />;
  if (routeName === "annual") return <AnnualView {...props} />;
  if (routeName === "monthly") return <MonthlyView {...props} />;
  if (routeName === "finance") return <Finance {...props} />;
  if (routeName === "spending") return <SpendingExplorer {...props} />;
  if (routeName === "receipts") return <ReceiptItems {...props} />;
  if (routeName === "receipt-detail") return <ReceiptDetailPage {...props} />;
  if (routeName === "item-detail") return <ItemDetailPage {...props} />;
  if (routeName === "graph-detail") return <GraphDetailPage {...props} />;
  if (routeName === "cashflow") return <Cashflow {...props} />;
  if (routeName === "forecasting") return <Forecasting {...props} />;
  if (routeName === "grocery") return <GroceryIntelligence {...props} />;
  if (routeName === "supermarket-comparison") return <SupermarketComparison {...props} />;
  if (routeName === "staples-trend") return <StaplesTrend {...props} />;
  if (routeName === "corner-premium") return <CornerPremium {...props} />;
  if (routeName === "budgets") return <BudgetPlanner {...props} />;
  if (routeName === "alerts") return <Alerts {...props} />;
  if (routeName === "reports") return <Reports {...props} />;
  if (routeName === "integrations") return <Integrations {...props} />;
  if (routeName === "settings") return <Settings {...props} />;
  if (routeName === "contact") return <Contact {...props} />;
  return <GenericModule {...props} />;
}

function Dashboard({ data }) {
  const years = availableYears(data);
  const [selectedYear, setSelectedYear] = useState(years.includes(2026) ? 2026 : years.at(-1));
  return (
    <>
      <PageHead title="Finance Dashboard" subtitle="Real-time overview of your household finances." action={<a className="primary link-btn" href="#receipts">+ Add receipt</a>} />
      <KpiGrid type="dashboard" />
      <div className="grid two block"><section className="card"><h2>Cash Balance Trend</h2><strong>£128,540</strong> <span className="delta">↑ 12.5%</span><Trend /></section><section className="card"><h2>AI Insight Summary <span className="status">Positive</span></h2><Insights items={["Cash flow improved this month.", "Runway remains healthy.", "Software subscriptions trending up."]} /></section></div>
      <section className="card block"><div className="toolbar-inline"><label className="field">Annual overview year<select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>{years.map((year) => <option key={year}>{year}</option>)}</select></label><a className="ghost link-btn" href="#annual">Open full Annual View</a></div></section>
      <AnnualOverview data={data} year={selectedYear} />
      <div className="grid three block"><TableCard title="Recent Transactions" rows={data.transactions.map((item) => [item.merchant, item.category, item.owner, currency.format(item.amount), item.date, item.context])} heads={["Merchant", "Category", "Owner", "Amount", "Date", "Context"]} /><TableCard title="Upcoming Bills" rows={[["Council tax", "Jun 1", "£186"], ["British Gas", "Jun 5", "£214"], ["Mersey Water", "Jun 8", "£46"], ["School lunch", "Jun 10", "£62"]]} heads={["Vendor", "Due", "Amount"]} /><section className="card"><h2>Accounts Receivable</h2><Bars rows={[["Salary", 94], ["Child benefit", 28], ["Refunds", 18], ["Interest", 8]]} /></section></div>
    </>
  );
}

function AIAssistant({ data, refresh, go }) {
  const [instruction, setInstruction] = useState("");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);
  const compactContext = useMemo(() => ({
    categories: [...new Set((data.yearlySpend || []).map((row) => row.category))],
    receiptItems: data.receiptItems.map(({ id, item, variant, seller, category, buyer, lineTotal, purchasedAt, tags }) => ({ id, item, variant, seller, category, buyer, lineTotal, purchasedAt, tags })),
    transactions: data.transactions,
    yearlySpend: data.yearlySpend,
    assumptions: data.assumptions?.values || []
  }), [data]);

  async function askAi() {
    if (!instruction.trim()) return;
    setStatus("Asking AI...");
    setResult(null);
    try {
      const response = await fetch("http://127.0.0.1:8787/api/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ instruction, context: compactContext })
      });
      const action = await response.json();
      if (!response.ok) throw new Error(action.error || "AI request failed");
      await applyAiAction(action, data, refresh, go, setResult);
      setStatus("Done");
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <>
      <PageHead title="AI Assistant" subtitle="Search and manipulate local household finance data using your OpenAI API key." />
      <section className="card">
        <label className="field">Ask for a search or data change<textarea rows="4" value={instruction} onChange={(event) => setInstruction(event.target.value)} placeholder="Examples: find Tesco purchases; set household monthly income to 6800; set Groceries annual budget to 9500; tag green jacket as school uniform" /></label>
        <div className="hero-cta"><button className="primary" onClick={askAi}>Run AI action</button><button className="ghost" onClick={() => setInstruction("find all Tesco purchases")}>Example search</button><button className="ghost" onClick={() => setInstruction("set household monthly income to 6800")}>Example income edit</button><button className="ghost" onClick={() => setInstruction("set Groceries annual budget to 9500")}>Example budget edit</button></div>
        {status && <p><strong>{status}</strong></p>}
      </section>
      {result && <section className="card block"><h2>{result.title}</h2>{result.rows?.length ? <table className="table"><tbody>{result.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} data-label={cellIndex === 0 ? "Item" : "Value"}>{cell}</td>)}</tr>)}</tbody></table> : <p>{result.message}</p>}</section>}
    </>
  );
}

async function applyAiAction(action, data, refresh, go, setResult) {
  if (action.action === "search_items") {
    const rows = filterItemRows(data.receiptItems, action.query || "").map((item) => [item.item, item.seller, item.category, currency.format(item.lineTotal), item.id]);
    setResult({ title: `Item results: ${action.query}`, rows, message: action.answer });
    return;
  }
  if (action.action === "search_receipts") {
    const query = String(action.query || "").toLowerCase();
    const rows = data.transactions.filter((tx) => [tx.merchant, tx.category, tx.owner, tx.context].join(" ").toLowerCase().includes(query)).map((tx) => [tx.merchant, tx.category, tx.owner, currency.format(tx.amount), tx.id]);
    setResult({ title: `Receipt results: ${action.query}`, rows, message: action.answer });
    return;
  }
  if (action.action === "set_budget") {
    await putOne("settings", { id: `budget-override-${action.category}`, category: action.category, amount: Number(action.amount), source: "AI assistant" });
    await refresh();
    setResult({ title: "Budget updated", rows: [[action.category, currency.format(Number(action.amount)), "Annual budget override saved locally"]], message: action.answer });
    return;
  }
  if (action.action === "set_income") {
    await putOne("settings", { id: "income-monthly-override", amount: Number(action.amount), source: "AI assistant" });
    await refresh();
    setResult({ title: "Income updated", rows: [["Monthly household income", currency.format(Number(action.amount)), "Applied to all 12 months"], ["Annual income", currency.format(Number(action.amount) * 12), "Feeds annual and monthly surplus"]], message: action.answer });
    return;
  }
  if (action.action === "tag_item") {
    const item = data.receiptItems.find((record) => record.id === action.itemId || record.item.toLowerCase().includes(String(action.query || "").toLowerCase()));
    if (!item) throw new Error("AI could not match an item to tag.");
    await putOne("receipt_items", { ...item, tags: [...new Set([...(item.tags || []), action.tag])] });
    await refresh();
    setResult({ title: "Item tagged", rows: [[item.item, item.seller, action.tag]], message: action.answer });
    return;
  }
  if (action.action === "navigate" && action.route) {
    go(action.route);
    setResult({ title: "Opened page", message: action.answer || action.route });
    return;
  }
  setResult({ title: "AI answer", message: action.answer || JSON.stringify(action) });
}

function AnnualView({ data }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const years = availableYears(data);
  const [selectedYear, setSelectedYear] = useState(years.includes(2026) ? 2026 : years.at(-1));
  const rows = (data.yearlySpend || []).filter((row) => row.year === selectedYear);
  const categories = [...new Set(rows.map((row) => row.category))];
  const itemRows = data.receiptItems.filter((item) => (selectedCategory === "All" || item.category === selectedCategory) && new Date(item.purchasedAt).getFullYear() === selectedYear);
  const itemFrequency = Object.values(itemRows.reduce((acc, item) => {
    const key = `${item.item}|${item.seller}`;
    if (!acc[key]) acc[key] = { item: item.item, seller: item.seller, category: item.category, id: item.id, annualCount: 0, annualSpend: 0, months: Object.fromEntries(months.map((month) => [month, 0])) };
    const month = months[new Date(item.purchasedAt).getMonth()];
    acc[key].annualCount += 1;
    acc[key].annualSpend += item.lineTotal;
    acc[key].months[month] += 1;
    return acc;
  }, {})).sort((a, b) => b.annualCount - a.annualCount || b.annualSpend - a.annualSpend);
  const monthTotals = months.map((month, index) => {
    const income = rows.filter((row) => row.category === "Income" && row.monthIndex === index + 1).reduce((sum, row) => sum + row.amount, 0);
    const spend = rows.filter((row) => row.category !== "Income" && row.monthIndex === index + 1).reduce((sum, row) => sum + row.amount, 0);
    return { month, income, spend, surplus: income - spend };
  });
  const annualIncome = monthTotals.reduce((sum, row) => sum + row.income, 0);
  const annualSpend = monthTotals.reduce((sum, row) => sum + row.spend, 0);
  return (
    <>
      <PageHead title="Annual View" subtitle="Month-by-month detail for every category, annual totals, item frequency, and seller drill-downs." action={<div className="hero-cta compact-actions"><a className="ghost link-btn" href="#monthly">Monthly view</a><a className="ghost link-btn" href="#budgets">Edit budgets</a><a className="ghost link-btn" href="#spending">Search items</a></div>} />
      <section className="card block"><div className="toolbar-inline"><label className="field">Year<select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>{years.map((year) => <option key={year}>{year}</option>)}</select></label><p>{selectedYear === 2026 ? "2026 contains January to May data, current to May 19, 2026." : `${selectedYear} contains a full January to December spending year.`}</p></div></section>
      <div className="grid three">
        <section className="card"><h2>Annual income</h2><div className="metric-value">{currency.format(annualIncome)}</div></section>
        <section className="card"><h2>Annual expenses</h2><div className="metric-value">{currency.format(annualSpend)}</div></section>
        <section className="card"><h2>Annual surplus</h2><div className="metric-value">{currency.format(annualIncome - annualSpend)}</div></section>
      </div>
      <section className="card block annual-matrix-card">
        <h2>Category by month matrix</h2>
        <div className="annual-table-wrap">
          <table className="table annual-table">
            <thead><tr><th>Category</th>{months.map((month) => <th key={month}>{month}</th>)}<th>Annual</th></tr></thead>
            <tbody>{categories.map((category) => {
              const values = months.map((month, index) => rows.filter((row) => row.category === category && row.monthIndex === index + 1).reduce((sum, row) => sum + row.amount, 0));
              return <tr key={category}><td data-label="Category"><strong>{category}</strong></td>{values.map((value, index) => <td key={months[index]} data-label={months[index]}>{currency.format(value)}</td>)}<td data-label="Annual"><strong>{currency.format(values.reduce((sum, value) => sum + value, 0))}</strong></td></tr>;
            })}</tbody>
            <tfoot><tr><th>Monthly surplus</th>{monthTotals.map((row) => <th key={row.month}>{currency.format(row.surplus)}</th>)}<th>{currency.format(annualIncome - annualSpend)}</th></tr></tfoot>
          </table>
        </div>
      </section>
      <section className="card block annual-matrix-card">
        <div className="toolbar-inline">
          <h2>Item purchase frequency</h2>
          <label className="field">Category<select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}><option>All</option>{categories.filter((category) => category !== "Income").map((category) => <option key={category}>{category}</option>)}</select></label>
        </div>
        <div className="annual-table-wrap">
          <table className="table annual-table">
            <thead><tr><th>Item</th><th>Seller</th><th>Category</th>{months.map((month) => <th key={month}>{month}</th>)}<th>Annual count</th><th>Annual spend</th><th>Open</th></tr></thead>
            <tbody>{itemFrequency.map((row) => <tr key={`${row.item}-${row.seller}`}><td data-label="Item"><strong>{row.item}</strong></td><td data-label="Seller">{row.seller}</td><td data-label="Category">{row.category}</td>{months.map((month) => <td key={month} data-label={month}>{row.months[month]}</td>)}<td data-label="Annual count"><strong>{row.annualCount}</strong></td><td data-label="Annual spend">{currency.format(row.annualSpend)}</td><td data-label="Open"><a className="ghost link-btn" href={`#item-detail?id=${row.id}&from=annual`}>Details</a></td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function MonthlyView({ data }) {
  const years = availableYears(data);
  const [selectedYear, setSelectedYear] = useState(years.includes(2026) ? 2026 : years.at(-1));
  const monthsForYear = months.filter((_, index) => data.yearlySpend.some((row) => row.year === selectedYear && row.monthIndex === index + 1));
  const [selectedMonth, setSelectedMonth] = useState(monthsForYear.at(-1) || "Jan");
  const [category, setCategory] = useState("All");
  const [fromDay, setFromDay] = useState(1);
  const [toDay, setToDay] = useState(selectedYear === 2026 && selectedMonth === "May" ? 19 : 31);
  const rows = data.yearlySpend.filter((row) => row.year === selectedYear && row.month === selectedMonth && (category === "All" || row.category === category));
  const dayFactor = Math.max(0, Math.min(31, toDay) - Math.max(1, fromDay) + 1) / 31;
  const adjustedRows = rows.map((row) => ({ ...row, amount: Math.round(row.amount * dayFactor) }));
  const income = adjustedRows.filter((row) => row.category === "Income").reduce((sum, row) => sum + row.amount, 0);
  const spend = adjustedRows.filter((row) => row.category !== "Income").reduce((sum, row) => sum + row.amount, 0);
  const categories = ["All", ...new Set(data.yearlySpend.filter((row) => row.category !== "Income").map((row) => row.category))];
  return (
    <>
      <PageHead title="Monthly View" subtitle="Filter a year by month, date range, and category. 2026 data runs January to May 19." action={<a className="ghost link-btn" href="#annual">Annual view</a>} />
      <section className="card block">
        <div className="toolbar-inline">
          <label className="field">Year<select value={selectedYear} onChange={(event) => { const year = Number(event.target.value); setSelectedYear(year); const available = months.filter((_, index) => data.yearlySpend.some((row) => row.year === year && row.monthIndex === index + 1)); setSelectedMonth(available.at(-1) || "Jan"); }} >{years.map((year) => <option key={year}>{year}</option>)}</select></label>
          <label className="field">Month<select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}>{monthsForYear.map((month) => <option key={month}>{month}</option>)}</select></label>
          <label className="field">From day<input className="inline-input" type="number" min="1" max="31" value={fromDay} onChange={(event) => setFromDay(Number(event.target.value))} /></label>
          <label className="field">To day<input className="inline-input" type="number" min="1" max="31" value={toDay} onChange={(event) => setToDay(Number(event.target.value))} /></label>
          <label className="field">Category<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
      </section>
      <div className="grid three block">
        <section className="card"><h2>Income</h2><div className="metric-value">{currency.format(income)}</div></section>
        <section className="card"><h2>Spend</h2><div className="metric-value">{currency.format(spend)}</div></section>
        <section className="card"><h2>Surplus</h2><div className={`metric-value ${income - spend < 0 ? "negative" : ""}`}>{currency.format(income - spend)}</div></section>
      </div>
      <TableCard title={`${selectedMonth} ${selectedYear} category detail`} rows={adjustedRows.map((row) => [row.category, currency.format(row.amount), row.source || "Planning data"])} heads={["Category", "Amount", "Source"]} />
    </>
  );
}

function Finance({ data, refresh }) {
  const modules = [["Net income", "£5,940"], ["Fixed costs", "£2,814"], ["Variable costs", "£2,356"], ["Debt", "£4,820"], ["Savings pots", "£7,440"], ["Cash buffer", "3.1 mo"], ["Holiday target", "68%"], ["Card interest", "£46"]];
  const currentMonthlyIncome = data.yearlySpend.find((row) => row.category === "Income")?.amount || 0;
  const [incomeDraft, setIncomeDraft] = useState(currentMonthlyIncome);
  async function saveIncome() {
    await putOne("settings", { id: "income-monthly-override", amount: Number(incomeDraft), source: "Manual finance control" });
    await refresh();
  }
  return (
    <>
      <PageHead title="Household Finance Control" subtitle="Net income, fixed costs, debt, savings pots, fees, and scenarios." />
      <section className="card block">
        <h2>Editable household income</h2>
        <div className="toolbar-inline">
          <label className="field">Monthly household income<input className="inline-input" type="number" value={incomeDraft} onChange={(event) => setIncomeDraft(event.target.value)} /></label>
          <button className="primary" onClick={saveIncome}>Apply income to all months</button>
          <a className="ghost link-btn" href="#annual">View annual impact</a>
        </div>
        <p>Changing income rewrites the income rows used by monthly surplus, annual surplus, budget planning, reports, and AI context.</p>
      </section>
      <div className="grid module-list">{modules.map(([title, value]) => <section className="card module-card graph-card" key={title}><div className="metric-title"><span>{title}</span></div><div className="metric-value">{value}</div><Spark id={`finance-${slug(title)}`} title={title} values={series.cash.slice(0, 8)} color="#109c92" from="finance" /></section>)}</div>
      <div className="grid two block"><section className="card"><h2>Budget burn by category</h2><Bars rows={[["Groceries", 82], ["Bills", 71], ["Kids", 64], ["Pets", 58], ["Transport", 77], ["Subscriptions", 91]]} /></section><section className="card"><h2>This month needs attention</h2><Insights items={["Cap work lunches at £45 per week.", "Increase credit-card repayment by £120.", "Move £250 from grocery underspend to Spain pot."]} /></section></div>
      <div className="block"><TableCard title="Source-backed household assumptions" rows={data.assumptions.values} heads={["Assumption", "Value", "Source basis"]} /></div>
    </>
  );
}

function SpendingExplorer({ data, go, route }) {
  const initialQuery = routeParam(route, "q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState(data.receiptItems[0]);
  const enriched = useMemo(() => data.receiptItems.map((item) => ({
    ...item,
    transaction: data.transactions.find((tx) => tx.id === item.transactionId)
  })), [data.receiptItems, data.transactions]);
  const filtered = filterItemRows(enriched, query);
  const current = selected || filtered[0];
  useEffect(() => {
    setQuery(initialQuery);
    setSelected(null);
  }, [initialQuery]);
  return (
    <>
      <PageHead title="Spending Explorer" subtitle="Search every product bought, not only purchase totals. Items link back to seller and receipt." />
      <section className="card">
        <label className="field">Find an item, seller, family member, tag, size, or category<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try grapes, green jacket, Tesco, Mia, dog treats..." /></label>
      </section>
      <div className="grid two block">
        <section className="card">
          <h2>Item-Level Purchase Record</h2>
          <table className="table">
            <thead><tr><th>Item</th><th>Seller</th><th>Buyer</th><th>Size</th><th>Line Total</th><th>Date</th></tr></thead>
            <tbody>{filtered.map((item) => (
              <tr key={item.id} onClick={() => setSelected(item)} className={current?.id === item.id ? "selected-row" : ""}>
                <td data-label="Item"><button className="text-link" onClick={(event) => { event.stopPropagation(); go(`item-detail?id=${item.id}&from=spending`); }}><strong>{item.item}</strong><br /><small>{item.variant}</small></button></td>
                <td data-label="Seller">{item.seller}</td>
                <td data-label="Buyer">{item.buyer}</td>
                <td data-label="Size">{item.quantity}</td>
                <td data-label="Line Total">{currency.format(item.lineTotal)}</td>
                <td data-label="Date">{item.purchasedAt}</td>
              </tr>
            ))}</tbody>
          </table>
        </section>
        <ItemDetail item={current} go={go} />
      </div>
    </>
  );
}

function ReceiptItems({ data, go }) {
  const grouped = data.transactions.map((tx) => ({
    ...tx,
    items: data.receiptItems.filter((item) => item.transactionId === tx.id)
  })).filter((tx) => tx.items.length);
  return (
    <>
      <PageHead title="Receipts" subtitle="Receipt totals are only the header. Every product line is stored and searchable." />
      <div className="grid two">
        {grouped.map((receipt) => (
          <section className="card" key={receipt.id}>
            <div className="metric-title"><span>{receipt.merchant}</span><span>{receipt.date}</span></div>
            <div className="metric-value">{currency.format(receipt.amount)}</div>
            <table className="table">
              <thead><tr><th>Product</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
              <tbody>{receipt.items.map((item) => <tr key={item.id}><td data-label="Product"><button className="text-link" onClick={() => go(`item-detail?id=${item.id}&from=receipts`)}><strong>{item.item}</strong><br /><small>{item.variant}</small></button></td><td data-label="Qty">{item.quantity}</td><td data-label="Unit">{currency.format(item.unitPrice)}</td><td data-label="Total">{currency.format(item.lineTotal)}</td></tr>)}</tbody>
            </table>
            <button className="ghost wide" onClick={() => go(`receipt-detail?id=${receipt.id}`)}>Open receipt detail</button>
          </section>
        ))}
      </div>
    </>
  );
}

function ItemDetail({ item, go }) {
  if (!item) return <section className="card"><h2>No item selected</h2></section>;
  return (
    <section className="card item-detail">
      <h2>{item.item}</h2>
      <p>{item.variant}</p>
      <div className="grid two">
        <div><small>Seller</small><strong>{item.seller}</strong></div>
        <div><small>Buyer</small><strong>{item.buyer}</strong></div>
        <div><small>Quantity / size</small><strong>{item.quantity}</strong></div>
        <div><small>Line total</small><strong>{currency.format(item.lineTotal)}</strong></div>
        <div><small>Unit price</small><strong>{currency.format(item.unitPrice)}</strong></div>
        <div><small>Receipt link</small><strong>{item.transactionId}</strong></div>
      </div>
      <h3>Why this matters</h3>
      <Insights items={[`You bought ${item.item} from ${item.seller}.`, `This item is tagged: ${(item.tags || []).join(", ")}.`, item.shrinkflation ? "Shrinkflation watch is active for this product." : "No shrinkflation flag on this item."]} />
      <button className="secondary wide" onClick={() => go(`receipt-detail?id=${item.transactionId}`)}>Open linked receipt and seller history</button>
      <p><small>{item.productUrl}</small></p>
    </section>
  );
}

function ReceiptDetailPage({ data, route, go }) {
  const id = routeParam(route, "id") || data.transactions[0]?.id;
  const from = routeParam(route, "from");
  const backTarget = from === "alerts" ? "alerts" : "receipts";
  const backLabel = from === "alerts" ? "Back to alerts" : "Back to receipts";
  const receipt = data.transactions.find((item) => item.id === id) || data.transactions[0];
  const items = data.receiptItems.filter((item) => item.transactionId === receipt.id);
  const categoryRows = categoryTotals(items);
  return (
    <>
      <PageHead title={`${receipt.merchant} Receipt`} subtitle={`${receipt.date} · ${receipt.owner} · ${receipt.context}`} action={<button className="ghost" onClick={() => go(backTarget)}>{backLabel}</button>} />
      <div className="grid two">
        <section className="card">
          <div className="metric-title"><span>Total</span><span>{receipt.id}</span></div>
          <div className="metric-value">{currency.format(receipt.amount)}</div>
          <TableRows rows={[
            ["Seller", receipt.merchant],
            ["Date", receipt.date],
            ["Owner", receipt.owner],
            ["Context", receipt.context],
            ["Item lines", items.length],
            ["Calculated item total", currency.format(items.reduce((sum, item) => sum + item.lineTotal, 0))]
          ]} />
        </section>
        <section className="card">
          <h2>Receipt categories feeding totals</h2>
          <Bars rows={categoryRows.map(([category, value]) => [category, Math.round(value)])} />
        </section>
      </div>
      <section className="card block">
        <h2>Item lines</h2>
        <table className="table">
          <thead><tr><th>Product</th><th>Category</th><th>Buyer</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
          <tbody>{items.map((item) => <tr key={item.id}><td data-label="Product"><button className="text-link" onClick={() => go(`item-detail?id=${item.id}&from=receipt-detail&receipt=${receipt.id}`)}><strong>{item.item}</strong><br /><small>{item.variant}</small></button></td><td data-label="Category">{item.category}</td><td data-label="Buyer">{item.buyer}</td><td data-label="Qty">{item.quantity}</td><td data-label="Unit">{currency.format(item.unitPrice)}</td><td data-label="Total">{currency.format(item.lineTotal)}</td></tr>)}</tbody>
        </table>
      </section>
    </>
  );
}

function BudgetPlanner({ data }) {
  const spendingRows = (data.yearlySpend || []).filter((row) => row.category !== "Income");
  const categories = [...new Set(spendingRows.map((row) => row.category))];
  const overrides = Object.fromEntries((data.settings || []).filter((setting) => setting.id?.startsWith("budget-override-")).map((setting) => [setting.category, setting.amount]));
  const starting = Object.fromEntries(categories.map((category) => {
    const actual = spendingRows.filter((row) => row.category === category).reduce((sum, row) => sum + row.amount, 0);
    return [category, overrides[category] || Math.round(actual * 0.96)];
  }));
  const [budgets, setBudgets] = useState(starting);
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || "Groceries");
  const visibleRows = spendingRows.filter((row) => selectedMonth === "All" || row.month === selectedMonth);
  const actualByCategory = Object.fromEntries(categories.map((category) => [category, visibleRows.filter((row) => row.category === category).reduce((sum, row) => sum + row.amount, 0)]));
  const annualActualByCategory = Object.fromEntries(categories.map((category) => [category, spendingRows.filter((row) => row.category === category).reduce((sum, row) => sum + row.amount, 0)]));
  const totalBudget = Object.values(budgets).reduce((sum, value) => sum + Number(value || 0), 0);
  const totalActual = Object.values(annualActualByCategory).reduce((sum, value) => sum + value, 0);
  const selectedItems = data.receiptItems.filter((item) => item.category === selectedCategory);
  return (
    <>
      <PageHead title="Budget Planner" subtitle="Edit annual category budgets, inspect monthly actuals, and drill down to product lines." />
      <div className="grid three">
        <section className="card"><h2>Annual actual</h2><div className="metric-value">{currency.format(totalActual)}</div><p>From 12 months of source-backed category data plus item-level receipt lines.</p></section>
        <section className="card"><h2>Editable budget</h2><div className="metric-value">{currency.format(totalBudget)}</div><p>Change category targets below. Calculations update instantly.</p></section>
        <section className="card"><h2>Variance</h2><div className={`metric-value ${totalBudget - totalActual < 0 ? "negative" : ""}`}>{currency.format(totalBudget - totalActual)}</div><p>{totalBudget - totalActual < 0 ? "Over budget" : "Under budget"} for the year.</p></section>
      </div>
      <section className="card block">
        <div className="toolbar-inline">
          <label className="field">Month<select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}><option>All</option>{months.map((month) => <option key={month}>{month}</option>)}</select></label>
          <label className="field">Category<select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        </div>
        <table className="table">
          <thead><tr><th>Category</th><th>Actual shown</th><th>Annual actual</th><th>Annual budget</th><th>Variance</th></tr></thead>
          <tbody>{categories.map((category) => {
            const annualActual = annualActualByCategory[category] || 0;
            const budget = Number(budgets[category] || 0);
            return <tr key={category} className={category === selectedCategory ? "selected-row" : ""} onClick={() => setSelectedCategory(category)}><td data-label="Category">{category}</td><td data-label="Actual shown">{currency.format(actualByCategory[category] || 0)}</td><td data-label="Annual actual">{currency.format(annualActual)}</td><td data-label="Annual budget"><input className="inline-input" type="number" value={budget} onChange={(event) => setBudgets({ ...budgets, [category]: event.target.value })} /></td><td data-label="Variance">{currency.format(budget - annualActual)}</td></tr>;
          })}</tbody>
        </table>
      </section>
      <div className="grid two block">
        <section className="card"><h2>{selectedCategory} monthly trend</h2><MonthBars rows={months.map((month, index) => [month, spendingRows.filter((row) => row.category === selectedCategory && row.monthIndex === index + 1).reduce((sum, row) => sum + row.amount, 0)])} /></section>
        <section className="card"><h2>Receipt items in {selectedCategory}</h2>{selectedItems.length ? <table className="table"><thead><tr><th>Item</th><th>Seller</th><th>Buyer</th><th>Total</th></tr></thead><tbody>{selectedItems.map((item) => <tr key={item.id}><td data-label="Item">{item.item}</td><td data-label="Seller">{item.seller}</td><td data-label="Buyer">{item.buyer}</td><td data-label="Total">{currency.format(item.lineTotal)}</td></tr>)}</tbody></table> : <p>No receipt item lines in this seed category yet.</p>}</section>
      </div>
    </>
  );
}

function ItemDetailPage({ data, route, go }) {
  const id = routeParam(route, "id") || data.receiptItems[0]?.id;
  const from = routeParam(route, "from") || "spending";
  const backTarget = from === "receipt-detail" ? `receipt-detail?id=${routeParam(route, "receipt") || data.receiptItems.find((record) => record.id === id)?.transactionId || ""}` : from;
  const item = data.receiptItems.find((record) => record.id === id) || data.receiptItems[0];
  const sellerItems = data.receiptItems.filter((record) => record.seller === item.seller);
  const categoryItems = data.receiptItems.filter((record) => record.category === item.category);
  return (
    <>
      <PageHead title={item.item} subtitle={`${item.variant} · bought from ${item.seller}`} action={<button className="ghost" onClick={() => go(backTarget)}>Back to {navLabel(from)}</button>} />
      <div className="grid two">
        <ItemDetail item={item} go={go} />
        <section className="card"><h2>Seller history</h2><TableRows rows={sellerItems.map((record) => [record.item, `${record.purchasedAt} · ${currency.format(record.lineTotal)}`])} /></section>
      </div>
      <section className="card block">
        <h2>Category contribution</h2>
        <p>This line item is included in {item.category} monthly and annual calculations.</p>
        <Bars rows={categoryTotals(categoryItems).map(([category, value]) => [category, Math.round(value * 10)])} />
      </section>
    </>
  );
}

function Cashflow() {
  return (
    <>
      <PageHead title="Cash Flow Insights" subtitle="Understand your cash movement and what drives it." />
      <KpiGrid type="cashflow" />
      <div className="grid two block"><section className="card"><h2>Cash Inflows and Outflows</h2><BarsChart /></section><section className="card"><h2>Cash Flow Breakdown</h2><Bars rows={[["Starting Cash", 78], ["Client Payments", 60], ["Payroll", -72], ["Rent", -26], ["Taxes & Fees", -18], ["Ending Cash", 88]]} /></section></div>
      <div className="grid three block"><section className="card"><h2>AI Insight</h2><Insights items={["Healthy cash position.", "Watch payroll and rent.", "Collections improved by 5 days."]} /></section><section className="card"><h2>Top Cash Drivers</h2><Bars rows={[["Client Payments", 92], ["Recurring Revenue", 49], ["Refunds", 12], ["Interest", 4]]} /></section><section className="card"><h2>Recommended Actions</h2><ActionList items={["Follow up overdue invoices", "Delay non-critical spend", "Negotiate better payment terms"]} /></section></div>
    </>
  );
}

function Forecasting({ data }) {
  const baseRows = data.yearlySpend || [];
  const [vars, setVars] = useState({
    annualGrossIncome: 74953,
    personalAllowance: 12570,
    basicRate: 20,
    higherRate: 40,
    employeeNiMain: 8,
    employeeNiUpper: 2,
    vatRate: 20,
    cpiInflation: 2.2,
    foodInflation: 3.2,
    fuelInflation: 2.8,
    utilitiesAnnual: 1641,
    councilTaxRise: 4.99,
    shrinkflationImpact: 2.0,
    mortgageBalance: 185000,
    mortgageRate: 4.75,
    mortgageTermYears: 22,
    loanMonthly: 210
  });
  const forecast = buildNextYearForecast(baseRows, vars);
  return (
    <>
      <PageHead title="Forecasting" subtitle="Project next year using editable tax, VAT, inflation, shrinkflation, mortgage, loans, and utility variables." />
      <KpiGrid type="forecasting" />
      <section className="card block">
        <h2>2026 forecast variables</h2>
        <div className="forecast-controls">
          {Object.entries(vars).map(([key, value]) => <label className="field" key={key}>{labelForForecast(key)}<input type="number" step="0.01" value={value} onChange={(event) => setVars({ ...vars, [key]: Number(event.target.value) })} /></label>)}
        </div>
      </section>
      <div className="grid three block">
        <section className="card"><h2>Forecast net income</h2><div className="metric-value">{currency.format(forecast.netIncome)}</div><p>After estimated income tax and employee NI.</p></section>
        <section className="card"><h2>Forecast expenses</h2><div className="metric-value">{currency.format(forecast.totalExpenses)}</div><p>Includes mortgage, loan, utilities, VAT estimate, and inflation.</p></section>
        <section className="card"><h2>Forecast surplus</h2><div className={`metric-value ${forecast.netIncome - forecast.totalExpenses < 0 ? "negative" : ""}`}>{currency.format(forecast.netIncome - forecast.totalExpenses)}</div><p>Updates as variables change.</p></section>
      </div>
      <div className="grid two block">
        <TableCard title="Tax and VAT separation" rows={[
          ["Gross income", currency.format(vars.annualGrossIncome), "Editable"],
          ["Income tax", currency.format(forecast.incomeTax), "GOV.UK 2026/27 rates model"],
          ["Employee NI", currency.format(forecast.ni), "GOV.UK 2026/27 employee NI model"],
          ["VAT embedded in forecast spend", currency.format(forecast.vat), `${vars.vatRate}% standard-rate estimate`],
          ["Utilities", currency.format(vars.utilitiesAnnual), "Ofgem April-Jun 2026 cap context"]
        ]} heads={["Line", "Value", "Basis"]} />
        <TableCard title="Mortgage, loans, household taxes" rows={[
          ["Mortgage balance", currency.format(vars.mortgageBalance), `${vars.mortgageRate}% over ${vars.mortgageTermYears} years`],
          ["Forecast mortgage payments", currency.format(forecast.mortgageAnnual), "Annualised repayment estimate"],
          ["Loan repayments", currency.format(vars.loanMonthly * 12), "Editable monthly loan amount"],
          ["Council tax forecast", currency.format(forecast.councilTax), `${vars.councilTaxRise}% rise from current planning value`]
        ]} heads={["Line", "Value", "Basis"]} />
      </div>
      <section className="card block annual-matrix-card">
        <h2>Following-year category forecast</h2>
        <div className="annual-table-wrap">
          <table className="table annual-table">
            <thead><tr><th>Category</th><th>2025 actual</th><th>2026 forecast</th><th>Change</th><th>Driver</th></tr></thead>
            <tbody>{forecast.categoryRows.map((row) => <tr key={row.category}><td data-label="Category">{row.category}</td><td data-label="2025 actual">{currency.format(row.actual)}</td><td data-label="2026 forecast">{currency.format(row.forecast)}</td><td data-label="Change">{currency.format(row.forecast - row.actual)}</td><td data-label="Driver">{row.driver}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
      <div className="grid two block"><section className="card"><h2>Projected Cash Balance</h2><Trend alt={series.optimistic} primary={series.forecast} /></section><section className="card"><h2>Projected Revenue vs Expenses</h2><BarsChart /></section></div>
      <div className="grid three block"><TableCard title="Forecast Assumptions" rows={[["Revenue growth", "+12%", "+18%"], ["Hiring plan", "+2", "+6"], ["Customer churn", "2.5%", "2.0%"], ["Software spend", "£4,100", "£4,800"]]} heads={["Assumption", "Current", "Next 12 Months"]} /><section className="card"><h2>AI Forecast Summary</h2><Insights items={["Expected runway: 5.3 months.", "Conservative scenario runs out of cash in Feb 2025.", "Reduce software spend by £700/mo."]} /></section><section className="card"><h2>Milestones & What-if Scenarios</h2><ActionList items={["Fundraising needed", "Hiring freeze", "Reduce burn by 10%", "Breakeven target"]} /></section></div>
    </>
  );
}

function Alerts({ data }) {
  const [filter, setFilter] = useState("All");
  const [activeAction, setActiveAction] = useState("");
  const filteredAlerts = data.alerts.filter((item) => {
    if (filter === "All") return true;
    if (filter === "Groceries") return item.category === "Groceries";
    if (filter === "Kids") return item.category === "Kids";
    if (filter === "Pets") return item.category === "Pets";
    if (filter === "Travel") return item.category === "Travel";
    return true;
  });
  const actionRows = [
    ["review-basket", "Review high-movement grocery items", "Opens Tesco receipt and flags substitute staples", "al-001"],
    ["repayment", "Schedule credit-card repayment", "Marks the finance charge as actioned and routes to charges", "al-002"],
    ["top-up-rule", "Activate Mia top-up approval rule", "Adds a parent approval step before extra teen transfers", "al-003"],
    ["pet-basket", "Plan monthly pet-food basket", "Moves dog food from emergency purchases into monthly planning", "al-004"]
  ];
  const selected = actionRows.find(([id]) => id === activeAction);
  return (
    <>
      <PageHead title="Expense Alerts" subtitle="Unusual spending and anomalies detected in your accounts." />
      <KpiGrid type="alerts" />
      <div className="chips block">{[["All", "All Alerts 23"], ["Groceries", "Groceries 8"], ["Kids", "Kids 5"], ["Pets", "Pets 6"], ["Travel", "Travel 2"]].map(([id, label]) => <button key={id} className={`chip ${filter === id ? "active" : ""}`} onClick={() => setFilter(id)}>{label}</button>)}</div>
      <div className="alerts-layout block">
        <section className="card">
          <h2>{filter} Expense Alerts</h2>
          <p>Click an alert to open the detailed receipt or charge record behind it.</p>
          <div className="table-scroll">
          <table className="table alert-table">
            <thead><tr><th>Severity</th><th>Vendor</th><th>Category</th><th>Was</th><th>Now</th><th>Change</th><th>%</th><th>Date</th><th>Status</th><th>Receipt</th></tr></thead>
            <tbody>{filteredAlerts.map((item) => (
              <tr key={item.id} className="click-row" onClick={() => { window.location.hash = `receipt-detail?id=${item.transactionId}&from=alerts`; }}>
                <td data-label="Severity">{statusCell(item.severity)}</td>
                <td data-label="Vendor">{item.vendor}</td>
                <td data-label="Category">{item.category}</td>
                <td data-label="Was">{currency.format(item.previousCharge || 0)}</td>
                <td data-label="Now">{currency.format(item.currentCharge || 0)}</td>
                <td data-label="Change"><strong>{currency.format(item.delta || 0)}</strong></td>
                <td data-label="%"><span className="status warn">+{Number(item.percentChange || 0).toFixed(1)}%</span></td>
                <td data-label="Date">{item.date}</td>
                <td data-label="Status">{statusCell(activeAction && selected?.[3] === item.id ? "Actioned" : item.status)}</td>
                <td data-label="Receipt"><a className="source-link" href={`#receipt-detail?id=${item.transactionId}&from=alerts`} onClick={(event) => event.stopPropagation()}>Open</a></td>
              </tr>
            ))}</tbody>
          </table>
          </div>
        </section>
        <section className="card">
          <h2>AI Insight Summary</h2>
          <Insights items={["Spending increased by £31 at Tesco and £46 in card charges.", "Grocery and card charges drove the cash increase.", "Mia top-ups exceeded the weekly cap by £15."]} />
          <h3>Recommended Actions</h3>
          <div className="bars action-picker">
            {actionRows.map(([id, label, description, alertId]) => (
              <label className={`insight-row radio-action ${activeAction === id ? "active" : ""}`} key={id}>
                <input type="radio" name="alert-action" checked={activeAction === id} onChange={() => setActiveAction(id)} />
                <div><strong>{label}</strong><p>{description}</p></div>
                <a className="source-link" href={`#receipt-detail?id=${data.alerts.find((item) => item.id === alertId)?.transactionId || "tx-001"}&from=alerts`} onClick={(event) => event.stopPropagation()}>Receipt</a>
              </label>
            ))}
          </div>
          {selected && <div className="action-confirm"><strong>Activated:</strong> {selected[1]}<p>{selected[2]}</p></div>}
        </section>
      </div>
    </>
  );
}

function Reports({ data }) {
  const reportDestinations = {
    "P&L Summary": "#finance",
    "Cash Flow Statement": "#cashflow",
    "Expense Breakdown": "#budgets",
    "Runway Report": "#forecasting",
    "Board Snapshot": "#sources"
  };
  return (
    <>
      <PageHead title="Reports" subtitle="Generate, share, and manage financial reports with ease." />
      <div className="grid report-cards">{Object.entries(reportDestinations).map(([title, destination]) => <section className="card mini-card" key={title}><h3>{title}</h3><p>Detailed household analysis by period and source.</p><a className="ghost link-btn" href={destination}>Generate</a></section>)}</div>
      <div className="grid two block"><TableCard title="Recent Reports" rows={data.reports.map((item) => [item.name, item.type, item.generated, item.owner, item.format, item.status])} heads={["Report Name", "Type", "Generated", "Owner", "Format", "Status"]} /><section className="card"><h2>Report Schedule</h2><ActionList items={["Weekly financial summary", "Monthly board package", "Runway report", "Expense breakdown"]} /><h2>AI Report Summary</h2><Insights items={["Financial health improving.", "Cash runway up 0.8 months.", "Operating expenses increased 18% MoM."]} /></section></div>
    </>
  );
}

function Integrations({ data }) {
  return (
    <>
      <PageHead title="Integrations" subtitle="Connect and manage your accounting, bank, loyalty, and source tools." />
      <div className="grid module-list">{data.integrations.map((item) => <section className="card" key={item.id}><h3>{item.name}</h3><p>{item.type}<br />Last synced {item.lastSync}</p><span className="status">{item.status}</span><a className="ghost link-btn wide" href={item.type === "Source" ? "#sources" : "#appsettings"}>{item.type === "Source" ? "View source" : "Manage"}</a></section>)}</div>
      <div className="grid three block"><TableCard title="Recent Sync Activity" rows={data.integrations.map((item, index) => [item.name, 40 + index * 31, item.lastSync, "Success"])} heads={["Source", "Records", "Time", "Status"]} /><section className="card"><h2>Data Coverage</h2><Bars rows={[["Accounts", 72], ["Transactions", 95], ["Invoices", 56], ["Bills", 48], ["Receipt Items", 88]]} /></section><section className="card"><h2>Secure Setup & Access</h2><p>API token stored locally for demo only.</p><input className="search" value="•••• •••• •••• 4d8f" readOnly /></section></div>
    </>
  );
}

function Settings({ user, refresh, go }) {
  const [tab, setTab] = useState("Account");
  const [avatarMode, setAvatarMode] = useState("photo");
  async function replay() {
    await putOne("onboarding", { id: "state", step: 0, complete: false });
    await refresh();
    go("onboarding");
  }
  return (
    <>
      <PageHead title="Account Settings" subtitle="Separate profile settings for mother and father." />
      <div className="card settings-layout">
        <aside className="settings-menu"><div className="nav-list">{["Account", "Notifications", "Privacy", "Permissions", "Accessibility", "Onboarding"].map((item) => <button className={`nav-item settings-tab ${tab === item ? "active" : ""}`} onClick={() => setTab(item)} key={item}>{item}</button>)}</div></aside>
        <section>
          <h2>{tab}</h2>
          {tab === "Account" && <>
            <div className="hero-cta"><Avatar user={user} mode={avatarMode} /><button className="primary" onClick={() => setAvatarMode("photo")}>Use Profile Image</button><button className="ghost" onClick={() => setAvatarMode("initials")}>Use Initials</button></div>
            <div className="field-grid block"><label className="field">First Name<input value={user.name.split(" ")[0]} readOnly /></label><label className="field">Last Name<input value={user.name.split(" ")[1]} readOnly /></label><label className="field">Email<input value={user.email} readOnly /></label><label className="field">Preferred dashboard<select defaultValue="Household" onChange={(event) => go(event.target.value === "Groceries" ? "grocery" : event.target.value === "Kids" ? "kids" : event.target.value === "Personal" ? "finance" : "dashboard")}><option>Household</option><option>Personal</option><option>Kids</option><option>Groceries</option></select></label></div>
          </>}
          {tab === "Notifications" && ["Bill reminders", "Overspend alerts", "Shrinkflation alerts", "Child allowance reminders", "Card charge warnings", "Holiday savings reminders"].map((item) => <div className="insight-row setting-switch" key={item}><strong>{item}</strong><span className="switch" /></div>)}
          {tab === "Privacy" && <TableRows rows={[["Personal spending", "Hidden from shared reports by default"], ["Shared/family labels", "Shown in household dashboards"], ["Local data", "Stored in IndexedDB only"]]} />}
          {tab === "Permissions" && <TableRows rows={user.permissions.map((permission) => [permission, "Enabled"])} />}
          {tab === "Accessibility" && <TableRows rows={[["Compact mode", "Available"], ["Larger text", "Available"], ["Reduced motion", "Available"], ["High contrast", "Available"]]} />}
          {tab === "Onboarding" && <button className="secondary" onClick={replay}>Replay onboarding</button>}
        </section>
      </div>
    </>
  );
}

function Contact({ user }) {
  const [saved, setSaved] = useState(false);
  return (
    <>
      <PageHead title="Contact" subtitle="Local mock contact page for demo purposes." />
      <section className="card">
        <div className="field-grid"><label className="field">Name<input defaultValue={user.name} /></label><label className="field">Email<input defaultValue={user.email} /></label><label className="field">Topic<select><option>Receipt issue</option><option>Budget question</option><option>Data export</option><option>Admin/setup</option></select></label><label className="field">Priority<select><option>Normal</option><option>High</option></select></label><label className="field full">Message<textarea rows="5" placeholder="Describe the local demo issue" /></label></div>
        <button className="primary" onClick={() => setSaved(true)}>Save message</button>
        <p>{saved ? "Saved locally as REF-GR-2048. View/manage messages in Admin." : "Demo disclosure: no real email backend is connected."}</p>
        {saved && <a className="ghost link-btn" href="#admin">Open Admin messages</a>}
      </section>
    </>
  );
}

function GroceryIntelligence({ data }) {
  const groceryItems = groceryRelevantItems(data.receiptItems);
  const weeklyList = [
    ["Milk", "8-10 pints", "Aldi, Tesco, corner top-up", "Breakfast, tea, cereal for 2 adults + Oliver 17 + Mia 15", "£3.90"],
    ["Bread and wraps", "3 loaves/packs", "Aldi, Tesco", "School lunches, toast, quick dinners", "£3.20"],
    ["Fruit", "Apples, bananas, grapes", "Tesco, Lidl, Asda", "Lunchbox plus after-school snacks", "£9.80"],
    ["Protein", "Chicken, mince, eggs, yoghurt", "Tesco, Ocado, Asda", "Family dinners and teen sports appetite", "£24.50"],
    ["Staple carbs", "Pasta, rice, cereal, potatoes", "Aldi, Asda, Ocado", "Bulk meals and breakfast", "£10.40"],
    ["Vegetables", "Frozen peas, mixed veg, salad", "Iceland, Sainsbury's", "Dinner sides and packed lunches", "£8.60"],
    ["Teen snacks", "Cereal bars, crisps, pizza bases", "Tesco, Lidl, corner shop", "Oliver 17 and Mia 15 school/weekend use", "£12.75"],
    ["Toiletries", "Shampoo, deodorant, toothpaste, hair spray", "Boots, Superdrug, Sainsbury's", "Teen daughter and family staples", "£8.90"],
    ["Household basics", "Toilet roll, cleaner, washing-up liquid", "Home Bargains, Lidl, B&M", "Weekly cleaning/restock", "£7.40"],
    ["Pets", "Dog food, treats, poo bags", "Tesco, Pets at Home", "Poppy and Scout", "£11.80"]
  ];
  return (
    <>
      <PageHead title="Grocery Intelligence" subtitle="Item-level food, toiletries, household staples, pets, and teen-lunch planning for two adults, Oliver 17, and Mia 15." />
      <PlanningDataSection route="grocery" data={data} />
      <div className="grid module-list">
        <section className="card module-card"><h2>Supermarket comparison</h2><p>Compares basket lines by seller, item count, staples, and average line price.</p><a className="ghost link-btn" href="#supermarket-comparison">Open</a></section>
        <section className="card module-card"><h2>Staples trend</h2><p>Shows how often staples were bought, where, and whether line prices moved.</p><a className="ghost link-btn" href="#staples-trend">Open</a></section>
        <section className="card module-card"><h2>Corner shop premium</h2><p>Explains emergency top-up cost vs planned supermarket purchases.</p><a className="ghost link-btn" href="#corner-premium">Open</a></section>
      </div>
      <div className="grid two block">
        <TableCard title="Weekly grocery list for this household" rows={weeklyList} heads={["Item group", "Typical weekly buy", "Usual sellers", "Why", "Est. weekly"]} />
        <section className="card"><h2>Recorded grocery basket mix</h2><Bars rows={categoryTotals(groceryItems).map(([category, total]) => [category, Math.round(total * 3)])} /><p>{groceryItems.length} receipt lines stored. Product lines link back to seller records.</p></section>
      </div>
      <section className="card block">
        <h2>Recent grocery and household product records</h2>
        <table className="table"><thead><tr><th>Item</th><th>Seller</th><th>Buyer</th><th>Quantity</th><th>Total</th><th>Detail</th></tr></thead><tbody>{groceryItems.slice(0, 22).map((item) => <tr key={item.id}><td data-label="Item">{item.item}</td><td data-label="Seller">{item.seller}</td><td data-label="Buyer">{item.buyer}</td><td data-label="Quantity">{item.quantity}</td><td data-label="Total">{currency.format(item.lineTotal)}</td><td data-label="Detail"><a className="source-link" href={`#item-detail?id=${item.id}&from=grocery`}>Open</a></td></tr>)}</tbody></table>
      </section>
    </>
  );
}

function SupermarketComparison({ data }) {
  const sellers = Object.entries(groceryRelevantItems(data.receiptItems).reduce((acc, item) => {
    acc[item.seller] ||= [];
    acc[item.seller].push(item);
    return acc;
  }, {})).map(([seller, items]) => {
    const total = sumMoney(items);
    const staples = [...new Set(items.flatMap((item) => [normaliseStapleName(item.item), ...(item.tags || []).filter((tag) => tag === "staple")]))].filter(Boolean);
    return [seller, items.length, currency.format(total), currency.format(total / items.length), staples.slice(0, 5).join(", ") || "Basket line", seller.toLowerCase().includes("corner") ? "Emergency top-up premium" : "Planned shop", `#spending?q=${encodeURIComponent(seller.split(" ")[0])}`];
  }).sort((a, b) => b[1] - a[1]);
  return (
    <>
      <PageHead title="Supermarket Comparison" subtitle="Seller-level comparison using product lines, not only receipt totals." action={<a className="ghost link-btn" href="#grocery">Back to Grocery Intelligence</a>} />
      <section className="card block"><table className="table"><thead><tr><th>Seller</th><th>Lines</th><th>Basket spend</th><th>Avg line</th><th>Staples seen</th><th>Interpretation</th><th>Records</th></tr></thead><tbody>{sellers.map((row) => <tr key={row[0]}>{row.slice(0, 6).map((cell, index) => <td data-label={["Seller", "Lines", "Basket spend", "Avg line", "Staples seen", "Interpretation"][index]} key={cell}>{cell}</td>)}<td data-label="Records"><a className="source-link" href={row[6]}>Open seller</a></td></tr>)}</tbody></table></section>
    </>
  );
}

function StaplesTrend({ data }) {
  const grouped = Object.entries(groceryRelevantItems(data.receiptItems).reduce((acc, item) => {
    const key = normaliseStapleName(item.item);
    if (!key) return acc;
    acc[key] ||= [];
    acc[key].push(item);
    return acc;
  }, {})).map(([name, items]) => {
    const sorted = [...items].sort((a, b) => a.purchasedAt.localeCompare(b.purchasedAt));
    const first = sorted[0];
    const latest = sorted.at(-1);
    const change = first.unitPrice ? ((latest.unitPrice - first.unitPrice) / first.unitPrice) * 100 : 0;
    return [name, items.length, currency.format(first.unitPrice), currency.format(latest.unitPrice), `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`, [...new Set(items.map((item) => item.seller))].join(", "), latest.shrinkflation ? "Shrinkflation watch" : "Stable pack", latest.id];
  }).sort((a, b) => b[1] - a[1]);
  return (
    <>
      <PageHead title="Staples Trend" subtitle="Frequency, seller spread, unit-price movement, and shrinkflation signals for repeat household staples." action={<a className="ghost link-btn" href="#grocery">Back to Grocery Intelligence</a>} />
      <section className="card block"><table className="table"><thead><tr><th>Staple</th><th>Times bought</th><th>First unit</th><th>Latest unit</th><th>Unit change</th><th>Sellers</th><th>Status</th><th>Detail</th></tr></thead><tbody>{grouped.map((row) => <tr key={row[0]}>{row.slice(0, 7).map((cell, index) => <td data-label={["Staple", "Times bought", "First unit", "Latest unit", "Unit change", "Sellers", "Status"][index]} key={`${row[0]}-${index}`}>{cell}</td>)}<td data-label="Detail"><a className="source-link" href={`#item-detail?id=${row[7]}&from=staples-trend`}>Open</a></td></tr>)}</tbody></table></section>
    </>
  );
}

function CornerPremium({ data }) {
  const rows = ["milk", "bread", "crisps"].map((key) => {
    const all = data.receiptItems.filter((item) => normaliseStapleName(item.item) === key);
    const corner = all.find((item) => item.seller.toLowerCase().includes("corner"));
    const planned = all.filter((item) => !item.seller.toLowerCase().includes("corner")).sort((a, b) => a.unitPrice - b.unitPrice)[0];
    if (!corner || !planned) return null;
    const premium = ((corner.unitPrice - planned.unitPrice) / planned.unitPrice) * 100;
    return [corner.item, corner.seller, currency.format(corner.unitPrice), planned.seller, currency.format(planned.unitPrice), `+${premium.toFixed(0)}%`, "Useful for milk/bread/snack emergencies, expensive for regular basket planning", corner.id];
  }).filter(Boolean);
  return (
    <>
      <PageHead title="Corner Shop Premium" subtitle="Emergency top-up items compared with supermarket records so the premium is visible." action={<a className="ghost link-btn" href="#grocery">Back to Grocery Intelligence</a>} />
      <section className="card block"><table className="table"><thead><tr><th>Item</th><th>Corner seller</th><th>Corner unit</th><th>Comparable seller</th><th>Comparable unit</th><th>Premium</th><th>Meaning</th><th>Detail</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}>{row.slice(0, 7).map((cell, index) => <td data-label={["Item", "Corner seller", "Corner unit", "Comparable seller", "Comparable unit", "Premium", "Meaning"][index]} key={`${row[0]}-${index}`}>{cell}</td>)}<td data-label="Detail"><a className="source-link" href={`#item-detail?id=${row[7]}&from=corner-premium`}>Open</a></td></tr>)}</tbody></table></section>
    </>
  );
}

function RecordsExplorer({ data }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const categories = ["All", ...new Set(data.transactions.map((item) => item.category))].sort();
  const rows = data.transactions.filter((item) => {
    const haystack = [item.merchant, item.category, item.owner, item.context, item.date].join(" ").toLowerCase();
    return (category === "All" || item.category === category) && (!query.trim() || haystack.includes(query.trim().toLowerCase()));
  });
  return (
    <section className="card">
      <div className="toolbar-inline"><h2>Household records</h2><input className="search compact" value={query} placeholder="Filter records..." onChange={(event) => setQuery(event.target.value)} /><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></div>
      <table className="table"><thead><tr><th>Merchant</th><th>Category</th><th>Owner</th><th>Amount</th><th>Date</th><th>Open</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td data-label="Merchant">{item.merchant}</td><td data-label="Category">{item.category}</td><td data-label="Owner">{item.owner}</td><td data-label="Amount">{currency.format(item.amount)}</td><td data-label="Date">{item.date}</td><td data-label="Open"><a className="source-link" href={`#receipt-detail?id=${item.id}`}>Receipt</a></td></tr>)}</tbody></table>
    </section>
  );
}

function GenericModule({ route, data, refresh }) {
  const routeName = baseRoute(route);
  const [title, subtitle, cards] = moduleCopy[routeName] || moduleCopy.dashboard || ["Dashboard", "", []];
  async function reset() {
    if (routeName !== "admin") return;
    await resetLocalDb();
    await refresh();
  }
  return (
    <>
      <PageHead title={title} subtitle={subtitle} action={routeName === "admin" ? <button className="danger" onClick={reset}>Reset local DB</button> : null} />
      <PlanningDataSection route={routeName} data={data} />
      <div className="grid module-list">{cards.map((title) => <section className="card module-card" key={title}><h2>{title}</h2><p>{moduleDescription(title)}</p><a className="ghost link-btn" href={`#${secondaryLinks[title] || routeName}`}>Open</a></section>)}</div>
      <div className="grid two block">
        {routeName === "sources" ? <TableCard title="Loaded Assumptions" rows={data.assumptions.values} heads={["Assumption", "Value", "Source basis"]} /> : <RecordsExplorer data={data} />}
        <section className="card"><h2>{routeName === "sources" ? "Source Notes" : "Trend"}</h2>{routeName === "sources" ? <SourceList sources={data.sources} /> : <Trend />}</section>
      </div>
    </>
  );
}

function GraphDetailPage({ data, route, go }) {
  const id = routeParam(route, "id") || "dashboard-cash-on-hand";
  const from = routeParam(route, "from") || "dashboard";
  const detail = graphDetail(id, data);
  return (
    <>
      <PageHead title={detail.title} subtitle={detail.subtitle} action={<button className="ghost" onClick={() => go(from)}>Back to {navLabel(from)}</button>} />
      <section className="card block">
        <div className="metric-title"><h2>Interactive bar graph</h2><InfoIcon text={detail.tooltip} /></div>
        <BarMiniChart values={detail.values} alt={detail.alt} tall color={detail.color} labels={detail.labels} />
      </section>
      <div className="grid two block">
        <section className="card"><h2>What is happening</h2><Insights items={detail.insights} /></section>
        <section className="card"><h2>How to use this</h2><TableRows rows={detail.explanations} /></section>
      </div>
      <section className="card block">
        <h2>Underlying values</h2>
        <table className="table"><thead><tr><th>Period</th><th>Value</th><th>Interpretation</th></tr></thead><tbody>{detail.values.map((value, index) => <tr key={`${detail.labels[index] || index}-${value}`}><td data-label="Period">{detail.labels[index] || `Point ${index + 1}`}</td><td data-label="Value">{currency.format(value)}</td><td data-label="Interpretation">{value >= average(detail.values) ? "Above average for this series" : "Below average for this series"}</td></tr>)}</tbody></table>
      </section>
    </>
  );
}

function PlanningDataSection({ route, data }) {
  const plan = {
    grocery: {
      title: "Supermarket and staple planning data",
      rows: [["Tesco / Ocado / Aldi / Lidl / Asda", "Compared by item line, not merchant total"], ["Top staples", "Grapes, apples, milk, bread, cereal, dog treats"], ["Basket inflation", "Mapped to ONS CPI and DEFRA food context"]]
    },
    shrinkflation: {
      title: "Shrinkflation planning data",
      rows: [["Cornflakes", "500g pack monitored for unit-price drift"], ["Dog treats", "420g pack shrinkflation watch"], ["Laundry pods", "24 washes tracked by cost per wash"]]
    },
    inflation: {
      title: "Inflation planning data",
      rows: [["Food", "DEFRA/ONS family food baseline"], ["Clothing", "Green jacket and school clothing item lines"], ["Fuel", "RAC petrol context plus Shell receipt line"]]
    },
    kids: {
      title: "Child money planning data",
      rows: [["Mia", "Allowance, school, clothing, pharmacy, top-ups"], ["Oliver", "Allowance, transport, school lunch, emergency money"], ["Purpose labels", "Lunchbox, bus fare, school, clothing, cinema, gaming"]]
    },
    pets: {
      title: "Pet planning data",
      rows: [["Poppy", "Vet booster, treats, insurance, food"], ["Scout", "Treats, grooming, medication"], ["Annual pet budget", "Pet category rows plus item lines"]]
    },
    car: {
      title: "Car planning data",
      rows: [["Fuel", "Shell E10 receipt item and RAC price context"], ["Renewals", "MOT, insurance, servicing in calendar"], ["Annual running cost", "Transport & car monthly category rows"]]
    },
    holidays: {
      title: "Holiday planning data",
      rows: [["Spain target", "Monthly pot contributions"], ["Greece alternative", "Scenario-ready savings comparison"], ["Spending money", "Child holiday pots and foreign fee assumptions"]]
    },
    charges: {
      title: "Charges and debt planning data",
      rows: [["Credit card", "Monthly fee/interest category rows"], ["Bank charges", "Avoidable charges tracked as alerts"], ["Repayment forecast", "Feeds annual budget variance"]]
    }
  }[route];
  if (!plan) return null;
  return <section className="card block"><h2>{plan.title}</h2><TableRows rows={plan.rows} /></section>;
}

function AnnualOverview({ data, extraItems = [], year = 2025 }) {
  const base = (data.yearlySpend || []).filter((row) => row.year === year);
  const itemRows = extraItems.map((item) => ({
    id: `detail-${item.id}`,
    month: months[new Date(item.purchasedAt).getMonth()],
    monthIndex: new Date(item.purchasedAt).getMonth() + 1,
    category: item.category,
    amount: item.lineTotal,
    source: "Receipt item line",
    year: new Date(item.purchasedAt).getFullYear()
  }));
  const rows = [...base, ...itemRows];
  const spendingRows = rows.filter((row) => row.category !== "Income");
  const annualSpend = spendingRows.reduce((sum, row) => sum + row.amount, 0);
  const annualIncome = rows.filter((row) => row.category === "Income").reduce((sum, row) => sum + row.amount, 0);
  const categoryTotalsData = Object.entries(spendingRows.reduce((acc, row) => {
    acc[row.category] = (acc[row.category] || 0) + row.amount;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]);
  const monthlyRows = months.map((month, index) => {
    const monthSpend = spendingRows.filter((row) => row.monthIndex === index + 1).reduce((sum, row) => sum + row.amount, 0);
    const monthIncome = rows.filter((row) => row.category === "Income" && row.monthIndex === index + 1).reduce((sum, row) => sum + row.amount, 0);
    return [month, currency.format(monthIncome), currency.format(monthSpend), currency.format(monthIncome - monthSpend)];
  });
  return (
    <section className="card block">
      <h2>{year} household annual view</h2>
      <div className="grid three">
        <div><small>Annual income</small><div className="metric-value">{currency.format(annualIncome)}</div></div>
        <div><small>Annual spend</small><div className="metric-value">{currency.format(annualSpend)}</div></div>
        <div><small>Projected surplus</small><div className="metric-value">{currency.format(annualIncome - annualSpend)}</div></div>
      </div>
      <div className="grid two block">
        <section><h3>Annual category totals</h3><Bars rows={categoryTotalsData.slice(0, 10).map(([category, amount]) => [category, annualSpend ? Math.round((amount / annualSpend) * 100) : 0])} /></section>
        <section><h3>Monthly breakdown</h3><table className="table"><thead><tr><th>Month</th><th>Income</th><th>Spend</th><th>Surplus</th></tr></thead><tbody>{monthlyRows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`} data-label={["Month", "Income", "Spend", "Surplus"][index]}>{cell}</td>)}</tr>)}</tbody></table></section>
      </div>
    </section>
  );
}

function categoryTotals(items) {
  return Object.entries(items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.lineTotal;
    return acc;
  }, {}));
}

function groceryRelevantItems(items) {
  const categories = new Set(["Groceries", "Toiletries", "Household", "Pets"]);
  return items.filter((item) => categories.has(item.category)).sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt));
}

function normaliseStapleName(name) {
  const text = name.toLowerCase();
  if (text.includes("grape")) return "grapes";
  if (text.includes("apple")) return "apples";
  if (text.includes("banana")) return "bananas";
  if (text.includes("milk")) return "milk";
  if (text.includes("bread")) return "bread";
  if (text.includes("cornflake") || text.includes("cereal")) return "cereal";
  if (text.includes("chicken")) return "chicken";
  if (text.includes("mince")) return "mince";
  if (text.includes("pasta")) return "pasta";
  if (text.includes("rice")) return "rice";
  if (text.includes("yoghurt")) return "yoghurt";
  if (text.includes("cheddar") || text.includes("cheese")) return "cheese";
  if (text.includes("juice")) return "juice";
  if (text.includes("pea") || text.includes("veg")) return "vegetables";
  if (text.includes("crisp")) return "crisps";
  if (text.includes("pizza")) return "pizza bases";
  if (text.includes("toilet roll")) return "toilet roll";
  if (text.includes("shampoo")) return "shampoo";
  if (text.includes("toothpaste")) return "toothpaste";
  if (text.includes("dog food")) return "dog food";
  if (text.includes("dog treat")) return "dog treats";
  return "";
}

function sumMoney(items) {
  return items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
}

function filterItemRows(items, query) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return items;
  const sellerMatches = items.filter((item) => item.seller.toLowerCase().split(/\s+/).some((part) => part === trimmed) || item.seller.toLowerCase() === trimmed || item.seller.toLowerCase().startsWith(`${trimmed} `));
  if (sellerMatches.length) return sellerMatches;
  const terms = trimmed.split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    const fields = [item.item, item.variant, item.category, item.buyer, item.quantity, ...(item.tags || [])].map((value) => String(value).toLowerCase());
    return terms.every((term) => fields.some((field) => field.split(/[^a-z0-9]+/).filter(Boolean).some((word) => word === term) || field === term || field.includes(` ${term} `)));
  });
}

function applyIncomeOverride(rows, settings) {
  const override = (settings || []).find((setting) => setting.id === "income-monthly-override");
  if (!override) return rows;
  return rows.map((row) => row.category === "Income" ? { ...row, amount: Number(override.amount), source: override.source || row.source } : row);
}

function buildNextYearForecast(rows, vars) {
  const annualByCategory = Object.entries(rows.filter((row) => row.category !== "Income").reduce((acc, row) => {
    acc[row.category] = (acc[row.category] || 0) + row.amount;
    return acc;
  }, {}));
  const categoryRows = annualByCategory.map(([category, actual]) => {
    const driver = forecastDriver(category);
    const rate = categoryInflationRate(category, vars);
    let forecast = actual * (1 + rate / 100);
    if (category === "Housing") forecast = mortgagePaymentAnnual(vars.mortgageBalance, vars.mortgageRate, vars.mortgageTermYears);
    if (category === "Energy") forecast = vars.utilitiesAnnual;
    if (category === "Council tax") forecast = actual * (1 + vars.councilTaxRise / 100);
    if (category === "Credit card & bank charges") forecast = actual + vars.loanMonthly * 12;
    return { category, actual, forecast, driver };
  });
  const incomeTax = estimateIncomeTax(vars.annualGrossIncome, vars.personalAllowance, vars.basicRate, vars.higherRate);
  const ni = estimateNi(vars.annualGrossIncome, vars.employeeNiMain, vars.employeeNiUpper);
  const vat = categoryRows.reduce((sum, row) => sum + vatPortion(row.category, row.forecast, vars.vatRate), 0);
  const mortgageAnnual = mortgagePaymentAnnual(vars.mortgageBalance, vars.mortgageRate, vars.mortgageTermYears);
  const councilTax = categoryRows.find((row) => row.category === "Council tax")?.forecast || 0;
  return {
    incomeTax,
    ni,
    vat,
    mortgageAnnual,
    councilTax,
    netIncome: vars.annualGrossIncome - incomeTax - ni,
    totalExpenses: categoryRows.reduce((sum, row) => sum + row.forecast, 0),
    categoryRows
  };
}

function estimateIncomeTax(gross, allowance, basicRate, higherRate) {
  const taxable = Math.max(0, gross - allowance);
  const basicBand = Math.min(taxable, 50270 - allowance);
  const higherBand = Math.max(0, taxable - basicBand);
  return basicBand * (basicRate / 100) + higherBand * (higherRate / 100);
}

function estimateNi(gross, mainRate, upperRate) {
  const mainBand = Math.max(0, Math.min(gross, 50270) - 12570);
  const upperBand = Math.max(0, gross - 50270);
  return mainBand * (mainRate / 100) + upperBand * (upperRate / 100);
}

function mortgagePaymentAnnual(balance, annualRate, years) {
  const monthlyRate = annualRate / 100 / 12;
  const payments = years * 12;
  if (!monthlyRate) return balance / years;
  return (balance * monthlyRate * Math.pow(1 + monthlyRate, payments)) / (Math.pow(1 + monthlyRate, payments) - 1) * 12;
}

function categoryInflationRate(category, vars) {
  if (category === "Groceries") return vars.foodInflation + vars.shrinkflationImpact;
  if (category === "Transport & car") return vars.fuelInflation;
  if (category === "Energy") return 0;
  if (category === "Council tax") return vars.councilTaxRise;
  if (["Clothing", "Pets", "Subscriptions", "Eating out"].includes(category)) return vars.cpiInflation + vars.shrinkflationImpact / 2;
  return vars.cpiInflation;
}

function vatPortion(category, amount, vatRate) {
  const vatShare = {
    "Groceries": 0.15,
    "Clothing": 1,
    "Eating out": 1,
    "Subscriptions": 1,
    "Pets": 0.85,
    "Transport & car": 0.55,
    "Broadband & mobile": 1,
    "Energy": 0.25
  }[category] || 0.2;
  return amount * vatShare * (vatRate / (100 + vatRate));
}

function forecastDriver(category) {
  return {
    "Groceries": "Food inflation + shrinkflation",
    "Housing": "Mortgage balance/rate/term",
    "Council tax": "Local tax rise assumption",
    "Energy": "Ofgem cap context",
    "Transport & car": "Fuel inflation + car running cost",
    "Credit card & bank charges": "Loan repayments + charges",
    "Clothing": "CPI + shrinkflation pressure",
    "Pets": "Pet care CPI + shrinkflation pressure"
  }[category] || "CPI assumption";
}

function labelForForecast(key) {
  return ({
    annualGrossIncome: "Annual gross household income",
    personalAllowance: "Personal allowance",
    basicRate: "Basic income tax %",
    higherRate: "Higher income tax %",
    employeeNiMain: "Employee NI main %",
    employeeNiUpper: "Employee NI upper %",
    vatRate: "VAT standard %",
    cpiInflation: "CPI inflation %",
    foodInflation: "Food inflation %",
    fuelInflation: "Fuel inflation %",
    utilitiesAnnual: "Utilities annual",
    councilTaxRise: "Council tax rise %",
    shrinkflationImpact: "Shrinkflation impact %",
    mortgageBalance: "Mortgage balance",
    mortgageRate: "Mortgage rate %",
    mortgageTermYears: "Mortgage term years",
    loanMonthly: "Loans monthly"
  })[key] || key;
}

function routeParam(route, key) {
  const [, query = ""] = route.split("?");
  return new URLSearchParams(query).get(key);
}

function baseRoute(route) {
  return route.split("?")[0];
}

function availableYears(data) {
  const years = [...new Set((data.yearlySpend || []).map((row) => row.year))].sort((a, b) => a - b);
  return years.length ? years : [2024, 2025, 2026];
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function graphUrl(id, from) {
  return `#graph-detail?id=${encodeURIComponent(id)}&from=${encodeURIComponent(from || currentRoute())}`;
}

function currentRoute() {
  return typeof window === "undefined" ? "dashboard" : window.location.hash.replace("#", "") || "dashboard";
}

function currentBaseRoute() {
  return baseRoute(currentRoute());
}

function routeFromGraphType(type) {
  return ({ dashboard: "dashboard", cashflow: "cashflow", forecasting: "forecasting", alerts: "alerts" })[type] || currentBaseRoute();
}

function navLabel(route) {
  const base = baseRoute(route);
  return nav.find(([id]) => id === base)?.[2]?.toLowerCase() || base.replace(/-/g, " ");
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function graphExplanation(title, type = "dashboard") {
  return `${title} is drawn as a live bar graph from the current ${type} values. Taller bars show larger values. Click the graph for period-by-period values, interpretation, and the exact return path back to this workflow.`;
}

function graphDetail(id, data) {
  const labels = months;
  const groceryRows = (data.yearlySpend || []).filter((row) => row.category === "Groceries" && row.year === 2025).sort((a, b) => a.monthIndex - b.monthIndex);
  const spendRows = (data.yearlySpend || []).filter((row) => row.category !== "Income" && row.year === 2025);
  const monthlySpend = months.map((month, index) => spendRows.filter((row) => row.monthIndex === index + 1).reduce((sum, row) => sum + row.amount, 0));
  if (id.includes("cash-flow") || id.includes("income-expense")) {
    return {
      title: "Cash inflows and outflows",
      subtitle: "Monthly income bars compared with expense bars, using the current local dataset.",
      tooltip: "Green bars are money in. Red comparison bars are money out. A widening gap means more available cashflow.",
      values: series.income.map((value) => value * 1000),
      alt: series.spend.map((value) => value * 1000),
      color: "#17a972",
      labels,
      insights: ["Income is consistently above expenses in this model.", "Expense spikes align with school, grocery, pet, and transport months.", "Use budget controls when red bars narrow the gap."],
      explanations: [["Live source", "Series comes from current app state and forecast controls where available."], ["Click path", "Back button returns to the page that opened this graph."], ["Action", "Use budget, income, and forecast controls to change the underlying data."]]
    };
  }
  if (id.includes("forecast") || id.includes("runway") || id.includes("projected")) {
    return {
      title: "Forecast and runway bars",
      subtitle: "Forward-looking monthly values, shown as bars so peaks and drops are easier to read.",
      tooltip: "Bars show projected cash position. Secondary bars show optimistic scenario where available.",
      values: series.forecast.map((value) => value * 1000),
      alt: series.optimistic.map((value) => value * 1000),
      color: "#7c5ce4",
      labels,
      insights: ["Base cash position weakens after seasonal expense pressure.", "Optimistic scenario stays higher when revenue and spending controls improve.", "Forecast values respond to editable inflation, tax, loan, mortgage, and utility assumptions."],
      explanations: [["Controls", "Change forecast variables on the Forecasting page."], ["Risk", "Watch months where bars fall below the household buffer."], ["Return", "Back button returns to Forecasting if that was the source."]]
    };
  }
  if (id.includes("bars") || id.includes("budget") || id.includes("category") || id.includes("coverage")) {
    return {
      title: "Category bar breakdown",
      subtitle: "Category totals and operational coverage rendered as comparable bars.",
      tooltip: "Each bar is a category contribution. Larger bars mean higher spend, usage, or coverage depending on the source page.",
      values: monthlySpend.length ? monthlySpend : series.cash.map((value) => value * 1000),
      color: "#1d72e8",
      labels,
      insights: ["Housing and groceries form the largest recurring pressure.", "School, clothing, pets, and transport create uneven months.", "Use monthly filters to inspect specific category movement."],
      explanations: [["Granularity", "Receipt items feed category totals where line-item data exists."], ["Manipulation", "Budget changes update variance immediately."], ["Drill-down", "Use receipts and spending search for product-level evidence."]]
    };
  }
  if (id.includes("grocery")) {
    return {
      title: "Grocery trend bars",
      subtitle: "Monthly grocery spend for the household plan.",
      tooltip: "Bars show monthly grocery pressure. Higher bars usually reflect teen lunches, supermarket stock-ups, and household staples.",
      values: groceryRows.map((row) => row.amount),
      color: "#17a972",
      labels: groceryRows.map((row) => row.month),
      insights: ["Grocery spend rises across the year in the model.", "Teen snacks, packed lunches, toiletries, and pet crossover items explain some spikes.", "Supermarket comparison and staples trend explain item-level movement."],
      explanations: [["Family model", "Two adults, Oliver 17, Mia 15, and two dogs."], ["Source", "DEFRA/ONS grocery baseline plus generated receipt lines."], ["Action", "Open Grocery Intelligence for seller and staple views."]]
    };
  }
  return {
    title: "Household finance bar graph",
    subtitle: "A live bar version of the selected dashboard graph.",
    tooltip: "Bars replace decorative lines. Larger bars mean higher values, and detail rows explain the movement.",
    values: series.cash.map((value) => value * 1000),
    color: "#1d72e8",
    labels,
    insights: ["The graph now shows magnitude instead of abstract movement.", "Click-through keeps workflow context and returns to the source page.", "Values update when app state changes, such as income, budget, or forecast edits."],
    explanations: [["Workflow", "Graph detail receives a from-route and returns to it."], ["Interpretation", "Above-average bars mark pressure or stronger performance."], ["Next step", "Use the source page controls to change data and watch bars update."]]
  };
}

function TableRows({ rows }) {
  return <table className="table"><tbody>{rows.map(([a, b]) => <tr key={`${a}-${b}`}><td data-label="Name">{a}</td><td data-label="Value">{b}</td></tr>)}</tbody></table>;
}

function SourceList({ sources }) {
  return <div className="bars">{sources.map((item) => <div className="insight-row" key={item.id}><div className="icon-dot">§</div><div><strong>{item.source}</strong><p>{item.note}</p>{item.url && <a className="source-link" href={item.url} target="_blank" rel="noreferrer">Open source</a>}</div></div>)}</div>;
}

function moduleDescription(title) {
  const descriptions = {
    "Source notes": "Official UK source links, access notes, and the assumption each source informs.",
    "Assumptions": "The values currently loaded into the local app database.",
    "Local disclosure": "Shows which data is real source-backed and which records are generated household examples.",
    "Itemized basket": "Every product line is stored separately from the purchase total.",
    "Recent transactions": "Purchase headers with seller, owner, date, context, and linked item lines.",
    "Credit card": "Card balance, interest assumptions, repayments, and charge alerts.",
    "Mia and Oliver": "Child-specific balances, allowance, top-ups, and parent-paid spending."
  };
  return descriptions[title] || "Stored and read through the local IndexedDB repository with working internal links.";
}

function InfoIcon({ text }) {
  return <span className="info-tip" tabIndex="0" aria-label={text}>ⓘ<span>{text}</span></span>;
}

function BarMiniChart({ values, alt = null, color = "#1d72e8", tall = false, compact = false, labels = [] }) {
  const all = alt ? [...values, ...alt] : values;
  const max = Math.max(...all, 1);
  const height = tall ? 260 : compact ? 58 : 180;
  const base = height - 28;
  const barGap = compact ? 4 : 10;
  const barWidth = Math.max(7, (680 - values.length * barGap) / Math.max(values.length, 1));
  return (
    <svg className={compact ? "spark bar-spark" : "chart bar-chart"} viewBox={`0 0 720 ${height}`} preserveAspectRatio="none">
      {[0, 1, 2, 3].map((line) => <line key={line} x1="28" y1={28 + line * ((base - 18) / 3)} x2="700" y2={28 + line * ((base - 18) / 3)} stroke="#edf1f5" />)}
      {values.map((value, index) => {
        const x = 34 + index * (barWidth + barGap);
        const barHeight = Math.max(4, (value / max) * (base - 24));
        const altHeight = alt ? Math.max(4, ((alt[index] || 0) / max) * (base - 24)) : 0;
        return <g key={`${index}-${value}`}><rect x={x} y={base - barHeight} width={barWidth} height={barHeight} rx="5" fill={color} opacity=".86" />{alt && <rect x={x + barWidth * .5} y={base - altHeight} width={Math.max(5, barWidth * .42)} height={altHeight} rx="4" fill="#17a972" opacity=".82" />} {!compact && <text x={x} y={height - 6} fontSize="11" fill="#667085" transform={`rotate(-35 ${x} ${height - 6})`}>{labels[index] || months[index % months.length] || index + 1}</text>}</g>;
      })}
    </svg>
  );
}

function KpiGrid({ type }) {
  return <div className="grid kpis">{(kpis[type] || kpis.dashboard).map(([title, value, delta, key, down]) => {
    const graphId = `${type}-${slug(title)}`;
    return <section className="card graph-card" key={title}><div className="metric-title"><span>{title}</span></div><div className="metric-value">{value}</div><div className={`delta ${down ? "down" : ""}`}>{delta}</div><Spark id={graphId} title={title} values={series[key] || series.cash} color={down ? "#ef4c5f" : key === "forecast" ? "#7c5ce4" : "#1d72e8"} from={routeFromGraphType(type)} /></section>;
  })}</div>;
}

function Spark({ id = "spark", title = "Trend", values, color = "#1d72e8", from = currentBaseRoute() }) {
  return <a className="graph-link" href={graphUrl(id, from)} aria-label={`Open ${title} graph detail`}><span className="graph-info"><InfoIcon text={graphExplanation(title, from)} /></span><BarMiniChart values={values} color={color} compact /></a>;
}

function Trend({ primary = series.cash, alt = null, id = "trend", from = currentBaseRoute() }) {
  return <a className="graph-link" href={graphUrl(id, from)} aria-label="Open trend graph detail"><span className="graph-info"><InfoIcon text={graphExplanation("Trend", from)} /></span><BarMiniChart values={primary} alt={alt} color="#1d72e8" tall /></a>;
}

function BarsChart({ id = "income-expense-bars", from = currentBaseRoute() }) {
  const labels = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];
  return <a className="graph-link" href={graphUrl(id, from)} aria-label="Open bar graph detail"><span className="graph-info"><InfoIcon text={graphExplanation("Income versus expenses", from)} /></span><svg className="chart" viewBox="0 0 720 280">{[0, 1, 2, 3, 4].map((item) => <line key={item} x1="45" y1={35 + item * 45} x2="700" y2={35 + item * 45} stroke="#edf1f5" />)}{labels.map((label, index) => { const x = 58 + index * 53; return <g key={label}><rect x={x} y={220 - series.income[index] * 2.1} width="16" height={series.income[index] * 2.1} rx="3" fill="#31b77c" opacity=".85" /><rect x={x + 22} y={220 - series.spend[index] * 2.1} width="16" height={series.spend[index] * 2.1} rx="3" fill="#ef4c5f" opacity=".78" /><text x={x} y="250" fontSize="11" fill="#667085" transform={`rotate(-35 ${x} 250)`}>{label}</text></g>; })}</svg></a>;
}

function MonthBars({ rows, id = "month-bars", from = currentBaseRoute() }) {
  const max = Math.max(...rows.map(([, value]) => value), 1);
  return <a className="graph-link" href={graphUrl(id, from)}><span className="graph-info"><InfoIcon text={graphExplanation("Monthly category trend", from)} /></span><div className="month-bars">{rows.map(([month, value]) => <div className="month-bar" key={month}><span>{month}</span><div><i style={{ height: `${Math.max(8, (value / max) * 150)}px` }} /></div><strong>{currency.format(value)}</strong></div>)}</div></a>;
}

function Insights({ items }) {
  return <div className="insight">{items.map((item, index) => <div className="insight-row" key={item}><div className={`icon-dot ${index === 1 ? "warn" : ""}`}>{index === 0 ? "✓" : index === 1 ? "!" : "↗"}</div><div><strong>{item}</strong><p>{index === 0 ? "Compared to last month, driven by better control and cleaner categorisation." : "Linked records and assumptions are available in the detail view."}</p></div></div>)}</div>;
}

function Bars({ rows, id = "bars", from = currentBaseRoute() }) {
  return <a className="graph-link" href={graphUrl(id, from)}><span className="graph-info"><InfoIcon text={graphExplanation("Breakdown", from)} /></span><div className="bars">{rows.map(([name, value]) => <div className="bar-row" key={name}><span>{name}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${Math.min(Math.abs(value), 100)}%`, background: value < 0 ? "#ef4c5f" : "#17a972" }} /></div><strong>{value < 0 ? "-" : ""}{Math.abs(value)}%</strong></div>)}</div></a>;
}

function ActionList({ items }) {
  return <div className="bars">{items.map((item, index) => <div className="insight-row action-row" key={item}><div className={`icon-dot ${index % 2 ? "warn" : ""}`}>{index + 1}</div><strong>{item}</strong><span>›</span></div>)}</div>;
}

function TableCard({ title, rows, heads }) {
  return <section className="card"><h2>{title}</h2><table className="table"><thead><tr>{heads.map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, index) => <td data-label={heads[index] || ""} key={`${rowIndex}-${index}`}>{statusCell(cell)}</td>)}</tr>)}</tbody></table></section>;
}

function statusCell(value) {
  const text = String(value);
  if (["High"].includes(text)) return <span className="status bad">{text}</span>;
  if (["Medium", "Warning", "Scheduled", "Investigating"].includes(text)) return <span className="status warn">{text}</span>;
  if (["Complete", "Positive", "Success", "New", "Actioned"].includes(text)) return <span className="status">{text}</span>;
  return text;
}

function PageHead({ title, subtitle, action }) {
  return <div className="page-head"><div><h1>{title}</h1><p>{subtitle}</p></div><div>{action}</div></div>;
}

function Brand({ label }) {
  return <div className="brand"><div className="mark">↗</div><span>{label}</span></div>;
}

function Avatar({ user, mode = "photo" }) {
  return <div className={`avatar ${mode === "photo" ? "avatar-photo" : ""} avatar-${user.avatar || user.id}`} style={{ backgroundColor: `${user.colour}22`, color: user.colour }}>{mode === "photo" ? <span>{user.initials}</span> : user.initials}</div>;
}

function labelFor(key) {
  return ({ name: "Name", email: "Email", pin: "PIN", confirm: "Confirm PIN", household: "Household name" })[key] || key;
}
