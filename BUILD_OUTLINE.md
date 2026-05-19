# Granular Dummy App Build Outline

## Product Direction

Build a local-first interactive household spending mockup for Granular. The app should show what users see: receipt-level and item-level household spending, searchable purchase history, budget planning, inflation/shrinkflation tracking, and yearly cashflow for a UK family.

The mockup should follow the existing Granular documents:

- Receipt-first and local-first.
- Item-level spending, not merchant-only summaries.
- Searchable household purchase record.
- Inflation-sensitive household focus.
- Purchase-aware budgeting across groceries, bills, transport, pets, children, clothing, clubs, holidays, credit cards, and bank charges.
- Optional connected-bank feel, but data remains local.

## Household Scenario

Create one realistic household in Liverpool:

- Two adults, one male earner and one female earner.
- Two dummy app logins: mother and father.
- Two children: girl aged 12, boy aged 16.
- Weekly or monthly allowance/pocket money for each child, tracked separately by child.
- Two dogs: golden labrador and jack russell.
- One car.
- Annual package holiday saving target for Spain, with Greece used as an occasional alternative.
- Grocery shopping across Tesco, Ocado, Aldi, Lidl, Asda, Sainsbury's, Boots, Home Bargains, B&M, and corner shops.
- UK household calendar year dataset, January to December.

Income assumptions should use the latest available UK/Liverpool earnings source at build time, preferably ONS ASHE/Nomis resident earnings by local authority and sex. Use median annual gross earnings where available, then estimate monthly net income using UK tax, National Insurance, pension contribution, and child benefit assumptions.

## Research Sources To Use

Use real UK sources to shape dummy values. Store citations in the app under a "Data Sources" panel.

- ONS ASHE / Nomis: Liverpool male and female average or median earnings.
- ONS Family Spending: category-level UK household spending.
- ONS CPIH/CPI item indices: food, fuel, clothing, restaurants, recreation, pets, insurance, holidays.
- ONS average retail prices or price quote datasets where useful.
- Bank of England household interest rates: credit card and overdraft reference rates.
- FCA / MoneyHelper / Moneyfacts style sources: common bank and card fee assumptions.
- Liverpool City Council: council tax bands and local council tax context.
- Ofgem: household energy cap and energy bill assumptions.
- DEFRA / AHDB / ONS: food price movement where useful.
- RAC / AA / Confused.com / ABI: fuel, car insurance, and maintenance benchmarks.
- PDSA / ABI / UK pet insurance sources: dog food, vet, insurance, flea/worm treatment.
- ABTA / ONS travel spending: package holiday assumptions.
- UK supermarket online prices used only as illustrative seed values, not live scraped prices unless explicitly added later.

## Local Data Model

Use a local database only. Recommended: SQLite.

Core entities:

- `household_members`: adults, children, pets.
- `users`: local mock login identity for mother and father.
- `user_profiles`: display name, avatar image, avatar colour, role, settings, privacy preferences.
- `sessions`: local mock login sessions.
- `account_creation_drafts`: local create-account form state, validation status, selected demo mode.
- `permissions`: household admin, budget editor, receipt editor, view-only settings.
- `onboarding_steps`: editable onboarding screens, order, title, body copy, enabled state.
- `onboarding_responses`: completed steps, household assumptions, user choices, skipped steps.
- `accounts`: current account, savings pot, credit card.
- `income`: monthly salary entries, child benefit, interest, refunds.
- `allowances`: child allowance schedule, amount, payer, child, frequency, linked transactions.
- `child_money_accounts`: child-specific cash, debit/prepaid, savings, school card, and informal parent-held balances.
- `child_money_transfers`: allowance, top-up, repayment, gift money, emergency money, and parent-paid child spending, always with a purpose label.
- `child_money_requests`: child asks for more money, reason, amount, requested date, parent decision, approved amount, linked transfer.
- `merchants`: retailers, supermarkets, petrol stations, schools, clubs, vets, insurers.
- `transactions`: merchant-level purchase, payment method, account, store, date, time, country.
- `receipts`: receipt metadata, OCR/import status, confidence, linked transaction.
- `receipt_items`: product/service line items, quantity, unit, pack size, category, VAT, discounts.
- `budgets`: monthly and annual targets by category.
- `price_history`: item price, unit price, pack size, store, date.
- `shrinkflation_events`: item, old size, new size, price change, effective unit-price rise.
- `calendar_events`: bills, school trips, clubs, holidays, birthdays, MOT, insurance renewals.
- `charges`: overdraft, credit card interest, late fee, foreign transaction fee, cash withdrawal fee.
- `savings_goals`: Spain holiday, emergency fund, Christmas, school uniform.
- `support_articles`: FAQ and help content, topic, status, last updated.
- `instructional_videos`: title, topic, thumbnail, local/demo video URL, transcript, duration, related feature.
- `contact_messages`: local mock contact requests, category, user, status, created date, reference number.
- `expense_alert_rules`: threshold, category, merchant, child, account, frequency, severity, enabled state.
- `expense_alerts`: generated alert, trigger value, comparison value, status, linked transaction/report.
- `reports`: report definition, section, filters, date range, generated date, owner, format.
- `report_exports`: generated PDF/XLSX metadata, local file path, format, status, created date.
- `source_notes`: source name, URL, date accessed, what it informed.

## Dummy Dataset Scope

Generate a full 12-month household dataset.

Minimum target:

- 1,500 to 2,500 transaction rows.
- 5,000 to 9,000 receipt item rows.
- Every transaction has date, time, merchant, country, category, payment method, and household context.
- Grocery shops have realistic baskets, not generic totals.
- Some records are exact item purchases, some are bill/service obligations.
- Include refunds, loyalty discounts, substitutions, offers, and card charges.
- Include child allowance transfers for both children, with spending tagged back to the child where relevant.
- Include ad hoc money given to the kids when they run out, including reason, date/time, parent, approved amount, and whether it was cash, bank transfer, card top-up, or parent-paid purchase.
- Every child money transfer must include a made-up but realistic purpose label, so no transfer appears as a vague unlabeled payment.

Required categories:

- Income and benefits.
- Child allowance / pocket money.
- Child top-ups, emergency money, gifts, repayments, and parent-paid child spending.
- Rent or mortgage.
- Council tax.
- Gas and electricity.
- Water.
- Broadband and mobile.
- TV/streaming/subscriptions.
- Groceries.
- Household essentials.
- Toiletries and pharmacy.
- School costs.
- Kids' clubs and activities.
- Clothing and activity wear.
- Work lunches and coffees.
- Petrol.
- Parking and public transport.
- Car insurance, MOT, repairs, servicing.
- Pet food, vet, insurance, grooming, medication.
- Eating out and takeaways.
- Holidays and holiday savings.
- Gifts, birthdays, Christmas.
- Credit card repayment, interest, and fees.
- Bank charges.
- Emergency and irregular expenses.

## Inflation And Shrinkflation Modelling

Inflation:

- Map each item/category to an annual price index or plausible UK inflation assumption.
- Apply monthly price drift to recurring items.
- Show separate views for absolute price, unit price, and basket inflation.
- Compare household-specific inflation against headline CPI/CPIH.

Shrinkflation:

- Track products where pack size drops while shelf price stays flat or rises.
- Show effective unit-price increase.
- Example item types: crisps multipacks, chocolate bars, cereal, dog treats, laundry pods, toilet roll, cheese, coffee, orange juice.
- Each shrinkflation event should show before/after size, old unit price, new unit price, and annual household impact.

## User-Facing App Screens

Mobile must be a first-class version, not a squeezed desktop dashboard. The app should work well on iPhone and Android-sized screens, with desktop adding density rather than mobile losing function.

0. Login And Account Selection

- Public landing page appears before login.
- Landing page introduces Granular as an item-level household spending app, with concise product sections and demo entry points.
- Landing page CTAs: "Log in", "Create account", "View demo", "See how it works".
- Local mock login screen.
- Create account page for local demo accounts.
- Two dummy users: mother and father.
- Avatar picture shown for mother, father, daughter, son, golden labrador, and jack russell.
- Optional demo PIN/password for each user.
- "Continue as mother" and "Continue as father" quick demo buttons.
- Login state changes visible profile, settings, notifications, purchase ownership, and default dashboard filters.
- No online authentication.

0a. Create Account

- Local-only account creation.
- Fields: name, email, password/PIN, confirm password/PIN, avatar, role, household name.
- Option to create a new household or join existing local demo household.
- Demo disclosure: account is stored locally only.
- Validation: required fields, matching password/PIN, unique local email/name.
- After create account, user enters onboarding.

0b. Required Onboarding Sequence

- Onboarding should run after first account creation and remain replayable/editable in Settings.
- Step 1: Welcome and privacy-first/local-data explanation.
- Step 2: Household setup: location, household name, adults, children, pets.
- Step 3: Adult profiles: names, avatars, roles, income assumptions, permissions.
- Step 4: Children setup: ages, school/activity context, allowance schedule, top-up rules.
- Step 5: Pets setup: dog profiles, food, insurance, vet assumptions.
- Step 6: Accounts setup: current accounts, savings pots, credit card, child money accounts, cash pots.
- Step 7: Income setup: salary frequency, estimated net income, child benefit, other income.
- Step 8: Regular bills: housing, council tax, energy, water, broadband, mobiles, insurance, subscriptions.
- Step 9: Grocery setup: preferred supermarkets, corner shops, staple basket, dietary notes if needed.
- Step 10: Transport setup: car, fuel, insurance, MOT, maintenance, parking.
- Step 11: Savings goals: holiday, emergency fund, Christmas, school uniform.
- Step 12: Alerts setup: overspend, price changes, shrinkflation, child top-ups, card charges, bills.
- Step 13: Import/demo data choice: use generated Liverpool family dataset or start empty.
- Step 14: Review and finish: summary of assumptions, edit links, start dashboard.
- Each step has back, next, skip where safe, save draft, and progress indicator.
- Admin can edit onboarding step order, wording, enabled state, and default answers.

1. Dashboard

- First logged-in screen.
- Quick overview only: monthly cashflow, budget status, upcoming bills, card charges, child money alerts, inflation/shrinkflation alerts, holiday savings progress.
- Each summary block links to a detailed page.
- Monthly cashflow.
- Income vs spending.
- Budget status.
- Current savings rate.
- Upcoming bills.
- Biggest price movers.
- Shrinkflation alerts.
- Credit card and bank charge warnings.
- Expense alerts summary.

1a. Finance Dashboard

- Dedicated finance overview for deeper financial control.
- Net income, fixed costs, variable costs, debt, savings, cash buffer, and forecast.
- Monthly surplus/shortfall.
- Budget burn rate by category.
- Credit card balance, interest, and repayment forecast.
- Bank charges and avoidable fees.
- Holiday savings, emergency fund, Christmas fund, and school uniform pot.
- Household savings rate and projected end-of-year balance.
- "This month needs attention" panel with alerts and recommended actions.
- Scenario controls: reduce groceries, change holiday savings, increase card repayment, cap work lunches, cap kids top-ups.

2. Spending Explorer

- Search by date, time, store, country, product, category, household member, dog, payment method, amount, or receipt text.
- Filter by merchant, category, month, card/account, supermarket, and item.
- Open any purchase into receipt-level detail.

3. Receipt Detail

- Receipt header: store, branch, date/time, payment method, total, VAT, discounts.
- Itemized basket.
- Unit prices.
- Price movement since previous purchase.
- Shrinkflation flag where relevant.
- Category allocation.
- Warranty/proof-of-purchase notes where relevant.

4. Grocery Intelligence

- Supermarket comparison.
- Basket repeat-price trend.
- Tesco vs Ocado vs discount shops.
- Corner-shop premium view.
- Promotions and substitutions.
- Top 20 household staples by annual spend.

5. Inflation Tracker

- Household inflation vs UK CPI/CPIH reference.
- Category inflation.
- Item-level price trend charts.
- Unit-price view.
- "What changed this month?" panel.

6. Shrinkflation Tracker

- Pack-size timeline.
- Unit-price impact.
- Annual loss estimate.
- Household affected-items list.

7. Budget Planner

- Monthly budget by category.
- Annual budget by category.
- Envelope/pot view.
- Suggested changes based on trends.
- Forecast end-of-year surplus or shortfall.

8. Calendar

- Bills, renewals, holidays, school events, kids' activities, pet expenses, car events.
- Click an event to see linked transactions.
- Month and agenda views.

9. Income And Savings

- Adult income breakdown.
- Net monthly income.
- Child benefit assumptions.
- Child allowance schedule and annual total by child.
- Holiday savings pot.
- Emergency fund.
- Credit card repayment forecast.

10. Charges And Debt

- Credit card purchases, repayments, interest, fees.
- Bank account charges.
- Foreign transaction fees for holidays.
- Cash withdrawal fees.
- Missed/late payment scenario if included.

11. Household Profile

- Members, ages, pets, car, location, data assumptions.
- Edit assumptions locally.
- Child allowance amount, frequency, payer, and linked spending tags.
- Child money section under each child:
- Scheduled allowance history.
- One-off top-ups.
- "Asked for more" requests.
- Approved, declined, and partially approved requests.
- Current child balance by account.
- Spending funded by allowance vs parent-paid spending.
- Reasons for extra money: lunch, bus, school trip, cinema, sports, clothes, gaming, emergency, friends, lost money, savings goal.
- Purpose labels shown on each transfer: "cinema with friends", "school canteen top-up", "bus fare after football", "birthday gift for friend", "new football socks", "dance hoodie", "phone data add-on", "gaming credit", "after-school snack", "swimming locker coin", "train into town", "lost lunch money", "Spain holiday spending money".

12. User Settings

- Separate profile settings for mother and father.
- Name, display initials, avatar image, avatar colour, preferred dashboard view.
- Personal income settings.
- Linked local accounts/cards shown per user.
- Notification preferences: bill reminders, overspend alerts, shrinkflation alerts, inflation alerts, holiday savings reminders, child allowance reminders, card charge warnings.
- Privacy settings: hide personal spending from household view, mark transactions as shared/family/personal.
- Budget permissions: household admin, budget editor, receipt editor.
- Default filters: household, personal, kids, pets, car, groceries, or charges.
- Accessibility settings: compact mode, larger text, reduced motion, high contrast.
- Replay onboarding from settings.
- Edit onboarding answers: household members, incomes, accounts, budgets, children, pets, car, supermarkets, holiday target, alert preferences.

13. App Settings

- Currency: GBP default.
- Locale: UK.
- Tax year assumptions.
- Inflation source selection.
- Default budget method: monthly envelope, annual target, or category trend.
- Child allowance defaults and reminder day.
- Data import/export controls for local files.
- Backup and restore local database.
- Reset dummy data.
- Re-run seed generation with different assumptions.
- Toggle demo features on/off.
- Manage merchants, categories, tags, and household members.
- Manage source links shown in Data Sources.
- Edit onboarding flow content, order, enabled steps, and default demo answers.
- Audit log of local changes made during the demo.

14. Admin And Setup

- Local admin area for manipulating all app features.
- Create/edit/delete dummy users.
- Assign roles and permissions.
- Upload or choose avatar pictures for all users, children, and pets.
- Edit household assumptions.
- Edit income, tax, benefits, pension, and savings assumptions.
- Edit child allowance amount, frequency, child account, and payer.
- Create and manage multiple accounts for each adult, child, pet, savings goal, credit card, cash pot, prepaid card, or demo account.
- Configure child money accounts: cash wallet, prepaid card, bank account, school card, savings pot, holiday spending money.
- Configure child top-up rules: weekly cap, monthly cap, approval required, auto-approve small amount, require reason, notify parent.
- Add, approve, decline, or edit child money requests.
- Maintain allowed purpose labels for child money transfers, with admin able to add custom labels.
- Configure expense alert rules and severity levels.
- Configure report templates, included sections, default filters, and export formats.
- Add or remove merchants and supermarket chains.
- Add products, pack sizes, shrinkflation events, and price histories.
- Add recurring bills and calendar events.
- Configure credit card APR, overdraft rate, card fees, and bank charges.
- Configure holiday target, destination, month, and foreign transaction assumptions.
- Configure chart modules shown on dashboard.
- Toggle feature flags: inflation tracker, shrinkflation tracker, calendar, receipt OCR mock, supermarket comparison, debt payoff, holiday planner, child allowance tracking.
- Manage FAQ entries, help articles, instructional video cards, and contact-message statuses.
- Manage landing page content, onboarding steps, and demo copy.
- Run validation checks: missing receipt items, uncategorised spend, broken links, impossible dates, negative prices, duplicate records, missing allowance transfers, child account balance mismatches.
- View seed-data health summary.

15. Expense Alerts

- Dedicated alerts page with active, acknowledged, resolved, and muted alerts.
- Alert types:
- Category overspend.
- Merchant overspend.
- Grocery basket price jump.
- Item price increase.
- Shrinkflation event.
- Child asks for more money too often.
- Child top-up exceeds weekly/monthly cap.
- Credit card interest spike.
- Bank charge incurred.
- Holiday savings behind target.
- Bill higher than usual.
- Subscription renewal.
- Unusual store/country/payment method.
- Alerts link to the underlying transaction, receipt, child money request, budget, or report.
- User can acknowledge, mute, resolve, or edit alert rule.
- Alert rules can be personal to mother/father or shared household rules.

16. Reports

- Reports can be generated from different sections of the app.
- Report builder supports date range, household member, child, merchant, category, account, country, payment method, alert status, and supermarket filters.
- Report formats: on-screen, Excel/XLSX, PDF.
- Reports save locally and appear in report history.
- Suggested reports:
- Monthly household finance summary.
- Annual household spending report.
- Grocery price inflation report.
- Shrinkflation impact report.
- Child allowance and top-up report by child.
- Credit card and bank charges report.
- Supermarket comparison report.
- Holiday savings and travel spending report.
- Pet spending report.
- Car running cost report.
- School and kids activities report.
- Clothing and activity wear report.
- Work lunches and coffees report.
- Tax/income assumptions report.
- Unusual spending and alerts report.
- Each report includes charts, totals, key transactions, assumptions, and source notes where relevant.
- Excel exports include separate tabs for summary, transactions, receipt items, charts data, assumptions, and sources.
- PDF exports include branded report cover, executive summary, charts, tables, and appendix.

17. FAQ

- Searchable frequently asked questions.
- Topics: receipts, itemisation, budgets, inflation, shrinkflation, credit card charges, child allowance, privacy, local data, imports, exports, admin setup.
- Each answer can link to the relevant app screen.
- FAQ entries can be edited in Admin.

18. Help Centre

- Searchable help articles.
- Getting started guide.
- "How to read your dashboard".
- "How to find a receipt".
- "How inflation and shrinkflation are calculated".
- "How budgets and forecasts work".
- "How child allowance is tracked".
- "How to reset or export local data".
- Contextual help links from each major screen.

19. Contact

- Local mock contact page for demo purposes.
- Contact form fields: name, email, user account, topic, message, priority.
- Topics: account, receipt issue, incorrect price, missing store, budget question, data export, admin/setup.
- Submitted messages save locally to `contact_messages`.
- Show confirmation and reference number.
- Admin can view and mark contact messages as open, in progress, resolved.
- Include non-functional demo disclosure if no real email backend is connected.

20. Instructional Videos

- Dedicated page for short instructional videos.
- Videos can be local demo files, embedded placeholders, or seeded cards until real videos exist.
- Include title, duration, transcript, topic, related screen link, and completion status.
- Suggested videos:
- Getting started with Granular.
- Searching purchases by date, store, item, or country.
- Reading an itemised receipt.
- Tracking grocery inflation.
- Understanding shrinkflation.
- Setting monthly budgets.
- Managing child allowance.
- Reviewing card charges and bank fees.
- Planning holiday savings.
- Using admin/setup.
- Exporting or resetting local data.

21. Data Sources

- Source list with links.
- "Dummy data generated from public UK statistics and plausible household modelling" disclosure.

## Mobile-Friendly Version

Build a dedicated responsive mobile experience for all pages and core user tasks.

Every page must have a mobile layout:

- Landing.
- Login.
- Create account.
- Onboarding.
- Dashboard.
- Finance Dashboard.
- Search.
- Receipts.
- Receipt Detail.
- Grocery Intelligence.
- Inflation.
- Shrinkflation.
- Expense Alerts.
- Budgets.
- Calendar.
- Reports.
- Income & Savings.
- Charges & Debt.
- Kids Money.
- Pets.
- Car.
- Holidays.
- Household Profile.
- User Settings.
- App Settings.
- Admin.
- FAQ.
- Help.
- Contact.
- Instructional Videos.
- Data Sources.

Mobile layout:

- Bottom tab navigation: Home, Search, Calendar, Budgets, More.
- More tab includes Settings, Household, Admin, FAQ, Help, Contact, Videos, Data Sources, and account switcher.
- Profile switcher available from the dashboard header.
- Sticky month selector and household filter where needed.
- Compact dashboard with swipeable summary panels.
- Charts collapse into tappable cards with drill-down screens.
- Tables become grouped lists with expandable rows.
- Receipt detail opens as a full-screen sheet.
- Item price history opens as a bottom drawer.
- Filters use mobile-friendly sheets, chips, toggles, and segmented controls.
- Search stays prominent, with quick filters for date, store, item, amount, and category.
- Login/create-account/onboarding forms use one-column layouts, large inputs, clear validation, and sticky primary action buttons.
- Long onboarding steps break into short screens instead of oversized forms.

Desktop/tablet navigation:

- Public landing page before login.
- After login, top nav contains the most important pages: Dashboard, Search, Budgets, Calendar, Inflation, Settings.
- After login, top nav contains the most important pages: Dashboard, Finance, Search, Budgets, Calendar, Reports, Settings.
- Left side menu contains detailed sections: Receipts, Grocery Intelligence, Inflation, Shrinkflation, Expense Alerts, Income & Savings, Charges & Debt, Kids Money, Pets, Car, Holidays, Household Profile, Admin, FAQ, Help, Contact, Videos, Data Sources.
- Dashboard stays quick and scannable; deeper detail lives behind top nav or side menu links.
- Active nav state visible in both top nav and side menu.
- Side menu collapses on tablet and mobile.

Mobile core flows:

- Open landing page, then login.
- Create a local account from mobile and complete onboarding.
- Save onboarding progress and return later.
- Log in as mother or father and see user-specific settings.
- Switch account locally from profile menu.
- Find a purchase by typing "Tesco chicken March", "Spain card fee", "dog food", or a date.
- Tap a calendar bill or shopping trip and open the linked receipt.
- Review an inflation alert and jump to the affected item history.
- Compare Tesco vs Ocado basket changes in a simplified chart.
- Edit a monthly budget and see the forecast update immediately.
- Adjust holiday savings or credit card repayment with sliders.
- Check allowance paid to each child and see child-linked spending.
- Open each child profile and review all money given, requests for more, parent decisions, and current balances.
- Add a quick top-up when a child runs out of money.
- Quick top-up requires a purpose label before saving.
- Replay or edit onboarding from Settings.
- Review expense alerts and jump to the linked receipt, child transfer, or budget.
- Generate a mobile-friendly report summary and export full PDF/XLSX from Reports.
- Inspect shrinkflation as before/after pack size and unit-price cards.

Mobile chart behaviour:

- Use one main insight per chart card.
- Tap to expand for full chart.
- Horizontal scroll only for intentional timelines.
- Use tooltips on tap, not hover.
- Provide month-by-month list fallback below complex charts.
- Keep labels short and readable at 320px width.

Mobile receipt behaviour:

- Receipt header remains sticky while scrolling items.
- Items grouped by category.
- Unit price, price change, and shrinkflation flags visible without opening desktop-style columns.
- Tap item to open item history.
- Tap payment row to see account/card charges.

Mobile performance:

- Preload dashboard summary only.
- Lazy-load receipt items, chart details, and long search results.
- Keep local database queries indexed for date, merchant, category, item name, country, and amount.
- Avoid large chart renders on first load.

Mobile accessibility:

- Minimum 44px touch targets.
- Keyboard-accessible controls.
- Clear focus states.
- Good contrast for warnings, savings, and overspend states.
- No hover-only interactions.
- Text must not overflow on small screens.
- Forms must not be hidden behind the mobile keyboard.
- Error messages remain visible after validation.
- Sticky headers and footers must not cover form fields or chart labels.

Mobile screen support:

- Small phones: 320px wide.
- Common phones: 360px, 375px, 390px, 414px, 430px wide.
- Large phones/foldables: 480px to 600px wide.
- Tablets: 768px and 1024px wide.
- Desktop: 1280px and above.
- Test portrait and landscape where layouts materially change.
- No page may rely on desktop hover or wide tables to complete a task.

## Interactivity Requirements

- All navigation links work.
- Search returns real seeded records.
- Calendar events open linked purchases/bills.
- Charts respond to date range, category, merchant, and household-member filters.
- Receipt rows open detail drawers.
- Item rows open price-history panels.
- Budget edits recalculate monthly forecast instantly.
- Child allowance edits recalculate household cashflow, child spending, and calendar reminders.
- Child top-up edits recalculate each child balance, parent cashflow, child category spend, and request history.
- Expense alert rules recalculate alert state and dashboard warning counts.
- Report filters recalculate preview totals before export.
- Inflation toggle switches between shelf price, unit price, and household weighted impact.
- Shrinkflation toggle shows pack-size adjusted price.
- Credit card payoff slider recalculates interest and payoff month.
- Holiday savings slider recalculates monthly required saving.
- Supermarket comparison can switch between all shops, Tesco only, Ocado only, discount shops, or corner shops.

## Chart Set

- Monthly income vs spending line/area chart.
- Category stacked bar by month.
- Grocery basket price index.
- Top item price movers.
- Shrinkflation impact waterfall.
- Supermarket spend comparison.
- Calendar heatmap of spending.
- Credit card balance and interest forecast.
- Holiday savings progress.
- Net worth / cash buffer trend.
- Pet spending trend.
- Children activity and clothing trend.
- Child allowance paid vs child-linked spending trend.
- Child account balance and top-up request trend.
- Fuel price and mileage trend.
- Expense alerts by severity and month.
- Finance dashboard cash buffer forecast.
- Report-ready chart data for Excel/PDF export.

## Calculation Rules

- Monthly net income = gross income minus tax, NI, pension, and other assumptions.
- Monthly surplus = net income plus benefits minus all spend and charges.
- Savings rate = savings contributions divided by net income.
- Child allowance total = scheduled allowance transfers plus one-off top-ups, grouped by child.
- Child-linked spending = allowance-funded spending plus parent-paid purchases tagged to each child.
- Child available balance = starting balance plus allowances, top-ups, gifts, and repayments minus child spending and transfers out.
- Child extra-money rate = ad hoc top-ups divided by scheduled allowance for the month.
- Request approval rate = approved child money requests divided by total requests.
- Alert trigger = current value compared with configured rule threshold or previous-period baseline.
- Report totals = filtered transactions plus receipt item allocations plus linked charges/transfers.
- Unit price = item price divided by normalized quantity.
- Basket inflation = current basket total compared with same basket at earlier prices.
- Household inflation = weighted item/category price movement by household spend.
- Shrinkflation impact = new unit price minus old unit price, multiplied by annual usage.
- Credit card interest = average daily or monthly balance multiplied by APR assumption.
- Holiday target = remaining target divided by months remaining.
- Budget variance = actual spend minus planned spend.

## Visual Design Direction

Use a serious household-finance product feel: dense, calm, trustworthy, practical. Avoid a marketing landing page. The first screen should be the working dashboard.

Design cues:

- Financial ledger precision mixed with modern consumer clarity.
- Compact controls, strong tables, clear charts.
- Muted neutral base with controlled accent colours for alerts and savings.
- No decorative hero section.
- No card-inside-card layout.
- Receipts and item rows should feel tangible and inspectable.

## Build Phases

Phase 1: Research and assumptions

- Collect current source links.
- Fix household assumptions.
- Define income, tax, benefit, and category baselines.

Phase 2: Data generation plan

- Define merchants, products, categories, bills, calendar events.
- Generate one-year local dataset.
- Validate totals against UK household spending benchmarks.

Phase 3: Local app shell

- Set up local-only web app.
- Add SQLite database.
- Seed dummy data.
- Add local mock login and two parent accounts.
- Build dashboard, navigation, and global filters.
- Add public landing page, login page, create-account page, and onboarding replay/edit flow.

Phase 4: Detail views

- Receipt explorer.
- Purchase detail.
- Item price history.
- Calendar.
- Budget planner.

Phase 5: Advanced analytics

- Inflation tracker.
- Shrinkflation tracker.
- Credit card and charges forecasts.
- Holiday savings planner.
- Supermarket comparison.
- User settings, app settings, admin/setup, and child allowance controls.
- Multiple account setup and child money request tracking.
- Landing page, login flow, avatar profiles, top navigation, side navigation, and editable onboarding.
- Finance dashboard, expense alerts, report builder, PDF export, and Excel export.

Phase 6: Verification

- Test every link and interaction.
- Confirm charts use real seeded data.
- Confirm all searches return detailed purchases.
- Check mobile and desktop layouts.
- Verify every page at 320px, 360px, 390px, 430px, 768px, 1024px, and desktop widths.
- Test touch-only flows for search, receipt detail, budget edit, calendar event, and chart drill-down.
- Test touch-only flows for landing, login, create account, onboarding, settings, admin, reports, and exports.
- Confirm mobile keyboard does not block auth or onboarding forms.
- Add source disclosure and data assumptions.

## Acceptance Criteria

- User can search any purchase by date/time, merchant, country, item, category, or payment method.
- User sees a landing page before login.
- User can log in after the landing page.
- User can create a local account from a create-account page.
- New accounts enter a complete onboarding sequence.
- Onboarding can save progress, finish, replay, and be edited from Settings/Admin.
- Every user, child, and pet has an avatar picture.
- Dashboard gives a quick overview and links to detail pages.
- Most important pages are available in top nav.
- Detailed pages are available in the left side menu.
- Onboarding can be replayed and edited from Settings.
- User can open any receipt and inspect item-level detail.
- User can see household spending for the full year.
- User can compare supermarket prices and item trends.
- User can see inflation and shrinkflation separately.
- User can edit budget assumptions and see recalculated forecasts.
- User can view income, savings, card charges, and holiday planning.
- User can open a dedicated finance dashboard for cashflow, debt, savings, charges, and forecasts.
- User can create, view, acknowledge, mute, and resolve expense alerts.
- User can generate section reports from filters.
- User can export reports as Excel/XLSX and PDF local files.
- User can inspect calendar-linked spending.
- User can log in as mother or father.
- User settings are distinct between the two dummy users.
- App settings allow local configuration of budget, data, display, import/export, and demo features.
- Admin/setup can manipulate users, permissions, assumptions, merchants, products, price histories, shrinkflation events, charges, child allowance, and feature flags.
- Child allowance is visible by child, date, payer, amount, and linked spending.
- Each child has a dedicated money section showing every allowance, top-up, request, approval/decline, spending link, and current balance.
- Every child money transfer has a visible purpose label.
- Admin can create and configure multiple local accounts for adults, children, savings pots, cards, cash, and demo scenarios.
- FAQ, Help, Contact, and Instructional Videos pages are present and reachable from navigation.
- FAQ and Help are searchable and link back to relevant app features.
- Contact form saves local demo submissions and shows a reference number.
- Instructional video page supports video cards, transcripts, related links, and completion state.
- All data is local.
- All source links are visible inside the app.
- App feels like a real Granular prototype, not a generic finance dashboard.
- Mobile version supports every core task: search, receipt detail, calendar, budget edit, inflation, shrinkflation, charges, and savings planning.
- Every page has a mobile-friendly version and works across small phones, common phones, large phones, tablets, and desktop.
- No mobile screen requires horizontal scrolling except intentional timeline/chart views.
