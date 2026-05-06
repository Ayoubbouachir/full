# Marketplace Design Spec — Engineers & Artisans

**Goal:** Modern, intuitive, professional marketplace (Upwork / Malt / Fiverr / LinkedIn Services style) with clear engineer and artisan workflows.

---

## 🎯 UX objectives

| Role | Workflow |
|------|----------|
| **Engineer** | Post request → Receive offers → Negotiate → Accept → Close |
| **Artisan** | Browse matching requests → Submit offer → Negotiate → Get accepted |

---

## 1️⃣ Dashboard overview

**Purpose:** Single entry point with KPIs and quick access to recent activity.

- **KPI summary (4 tiles):**
  - **Active requests** — count of requests with status `open` (engineer) or visible matching requests (artisan).
  - **In negotiation** — count of requests with status `in_negotiation` (both roles).
  - **Pending offers** — for engineer: offers awaiting accept/reject; for artisan: my offers with status `pending`.
  - **Notifications** — unread notification count (links to bell panel).
- **Recent activity:** Short list of requests (engineer: “Mes demandes récentes”; artisan: “Demandes correspondantes”) with card preview, offers count, and “Voir tout” link to list page.
- **Layout:** KPI row (grid 4 cols), then one section with card grid; max-width content, consistent padding.

**Implementation:** `MarketplaceDashboard` + KPI fetch + recent requests with offers count. Role-based copy and data.

---

## 2️⃣ Request card design

**Purpose:** Scannable, actionable cards in list and dashboard (Upwork job card / Malt mission card style).

Each card must show:

| Element | Description |
|---------|-------------|
| **Title** | Link to request detail. |
| **Status badge** | `open` / `in_negotiation` / `closed` — color-coded (e.g. green / amber / gray). |
| **Budget** | From `budgetRange` (e.g. “500–1000 DT”). |
| **Deadline** | Optional field: display “À pourvoir avant le &lt;date&gt;” if backend supports `deadline`; else “Publié le &lt;date&gt;”. |
| **Offers count** | For engineer: “X offres”; hide or N/A for artisan in “available” list. |
| **Meta** | Profession, location (icon + text). |
| **Description** | One- or two-line clamp. |
| **Action buttons** | Primary: “Voir” (both); “Négocier” (engineer, if offers > 0); “Proposer une offre” (artisan). |

**Layout:** Card with clear header (title + badge), meta row, description, then actions. Hover state and consistent spacing.

**Implementation:** `RequestCard` with props `request`, `offersCount`, `showActions`, `mode` ('engineer' | 'artisan'). Add optional `deadline` when API provides it.

---

## 3️⃣ Negotiation UI

**Purpose:** Clear offer context + chat + decisive actions (Malt/Fiverr conversation + deal panel).

- **Offer summary panel (sidebar or top block):**
  - Request title, status.
  - For engineer: list of offers with proposed price, short message, status (pending / accepted / rejected); **fixed-position Accept / Reject** for pending offers (sticky so always visible while scrolling).
  - For artisan: my offer summary (price, message, status).
- **Chat + price history:**
  - Single thread: negotiation messages (text + optional “price proposed: X”).
  - Distinct bubbles (mine / theirs), timestamps.
  - Optional “price history” strip or inline cues when price changed.
- **Fixed Accept / Reject:**
  - Engineer view: per pending offer, buttons fixed (e.g. right sidebar or sticky bar) so they remain on screen; loading state and optimistic update.
- **Real-time updates:**
  - WebSocket (e.g. `marketplace` namespace) for new messages and offer status changes so the UI updates without refresh; optional fallback polling.

**Page structure:** Request detail = summary + offers + link “Ouvrir la discussion”. Negotiation page = back link + offer summary panel + chat area + fixed actions.

**Implementation:** `RequestDetailPage` (offers list + Accept/Reject); `NegotiationChat` (messages + input). Add optional sidebar component for “offer summary” and wire WebSocket in chat.

---

## 4️⃣ Smart notifications

**Purpose:** User never misses an important event (new offer, acceptance, message, etc.).

| Feature | Description |
|---------|-------------|
| **Toast popup** | Transient message (e.g. “Nouvelle offre reçue sur &lt;titre&gt;”) on new notification; auto-dismiss 4–6 s; optional “Voir” action. |
| **Badge counter** | On notification bell: unread count; cap at 99+. Update on fetch and on WebSocket. |
| **Real-time WebSocket** | Backend emits to user (e.g. by `userId`); frontend listens and updates list + count + toasts. |
| **Read/unread** | List shows read vs unread (e.g. background or weight); “Tout marquer lu”; mark single as read on click. |

**Notification UI structure:**

- **Trigger:** Icon (bell) + badge (count). `aria-label` and `aria-expanded` for accessibility.
- **Panel (dropdown):** “Notifications” title; “Tout marquer lu”; list of items (type, title, body, link to request); click → mark read, navigate, close panel.
- **Toasts:** Global container (e.g. top-right); one toast per event; dismiss on timer or click.

**Implementation:** `NotificationBell` (panel + badge + mark read). Add `Toast` component + context or event bus for WebSocket-driven toasts; connect WebSocket in `useMarketplaceNotifications` or layout.

---

## 5️⃣ Filters & search

**Purpose:** Find requests by profession, budget, location, status (Upwork/Malt filters).

- **Filters:**
  - **Profession** — dropdown (e.g. Plombier, Électricien, Maçon).
  - **Budget range** — min/max inputs or preset ranges (e.g. 0–500, 500–1000, 1000+ DT).
  - **Location** — text input or dropdown (e.g. Tunis, Sfax, etc.).
  - **Status** — open / in_negotiation / closed (engineer list).
- **Search:** Optional search by title/description (client-side filter or future API `?q=`).
- **Reset:** “Réinitialiser” clears all filters.

**Placement:** Filter bar below page title on list pages (Mes demandes, Demandes correspondantes). Filters apply to client-side list (or server when API supports query params).

**Implementation:** `FilterBar` with controlled inputs; parent holds filter state and filters list in `useMemo`.

---

## 6️⃣ Loading and empty states

**Purpose:** No blank screens; clear next steps.

| State | When | Message / Action |
|-------|------|-------------------|
| **Loading** | Fetching requests/offers | Skeleton cards (same layout as RequestCard) with pulse animation. |
| **No offers yet** | Engineer opens request, 0 offers | “Aucune offre pour le moment” + “Partager le lien” or wait. |
| **No matching request** | Artisan filtered list empty | “Aucune demande ne correspond à vos critères” + adjust filters or “Voir tout”. |
| **No requests** | Engineer has no requests | “Vous n’avez pas encore de demande” + CTA “Créer une demande”. |
| **Waiting for response** | Artisan has pending offers | Empty state or list: “En attente de réponse” with short explanation. |
| **No notifications** | Bell panel empty | “Aucune notification” in panel. |

**Implementation:** `LoadingCard` / `LoadingCards`; `EmptyState` with presets (e.g. `no_requests`, `no_offers`, `no_matching`, `no_my_offers`, `no_notifications`); use on dashboard and list pages.

---

## 🔹 Design style

- **Theme:** Dark premium — dark background (#1a1a2e / similar), light text, accent (e.g. orange #ff6b35) for primary actions and key info.
- **Motion:** Subtle transitions (e.g. 200–300 ms) on hover, panel open/close, toast in/out; skeleton pulse for loading.
- **Hierarchy:** Clear headings (h1 page title, h2 section); cards stand out from background; primary button for main action.
- **Layout:** Card-based; consistent border-radius and shadow; generous whitespace.
- **Typography:** Modern sans-serif; clear size scale (title > section > body > meta).
- **Spacing:** Consistent padding/margin (e.g. 8px grid); list gaps and card padding aligned.

---

## 📐 Improved React page structure

```
/marketplace
  → redirect to /marketplace/dashboard

/marketplace/dashboard          MarketplaceDashboard    (KPIs + recent requests)
/marketplace/create             CreateRequestPage      (Engineer: form)
/marketplace/requests           MyRequestsPage         (Engineer: list + filters)
/marketplace/requests/:id       RequestDetailPage      (Summary + offers + Accept/Reject + chat link)
/marketplace/requests/:id/chat  NegotiationChat         (Offer summary + chat + fixed actions)
/marketplace/requests/:id/offer SubmitOfferPage        (Artisan: price + message)
/marketplace/available          AvailableRequestsPage  (Artisan: list + filters)
/marketplace/offers             MyOffersPage           (Artisan: my offers)
```

**Layout:** All under `MarketplaceLayout` (sticky header, role-based nav, notification bell, main content).

---

## 🧩 Component breakdown

| Component | Responsibility |
|-----------|----------------|
| **MarketplaceLayout** | Shell: logo, nav (Dashboard, Mes demandes, Nouvelle demande / Demandes correspondantes, Mes offres), NotificationBell, mobile menu, Outlet. |
| **NotificationBell** | Trigger + badge, dropdown panel, list, mark read / mark all read, link to request. |
| **RequestCard** | Title (link), status badge, description clamp, meta (profession, budget, location, deadline if any, offers count), action buttons. |
| **FilterBar** | Profession, status, location, budget filters + reset; `role="search"`. |
| **EmptyState** | Preset (no_requests, no_offers, no_matching, no_my_offers, no_notifications); icon, title, description, CTA. |
| **LoadingCard / LoadingCards** | Skeleton cards for request list loading. |
| **MarketplaceDashboard** | KPI grid + “Recent requests” section with RequestCards + “Voir tout”. |
| **RequestDetailPage** | Back link, title, badge, meta, description, “Ouvrir la discussion”, offers list with Accept/Reject (fixed position recommended). |
| **NegotiationChat** | Back link, offer summary block, message list, input + send; optional WebSocket. |
| **SubmitOfferPage** | Back link, request title, form (proposedPrice, message), submit. |
| **MyOffersPage** | List of artisan’s offers with status and link to request. |
| **Toast** (optional) | Global toasts for “new offer”, “offer accepted”, etc.; driven by WebSocket or notification hook. |

---

## 📐 UI layout structure

- **Global:** Full-viewport dark background; sticky header (logo left, nav center/right, bell right); main `max-width: 1280px`, padding 2rem, margin auto.
- **Dashboard:** [KPI grid 4 cols] → [Section “Mes demandes récentes” / “Demandes correspondantes”] → card grid (2–3 cols) → “Voir tout”.
- **List pages:** [Page title] → [FilterBar] → [Card grid or EmptyState].
- **Request detail:** [Back] → [Title + badge] → [Meta row] → [Description] → [Primary CTA] → [Offers list with fixed Accept/Reject].
- **Negotiation chat:** [Back] → [Offer summary panel] + [Chat area: messages + fixed input].
- **Forms (create request, submit offer):** Centered form; labels above inputs; primary button at end.

---

## State management strategy

- **Auth:** Current user (id, role, profession) from `localStorage`; no global auth store required for current scope.
- **Lists:** Local state per page (`requests`, `offers`, `messages`); fetch on mount; refetch after create/accept/reject.
- **Notifications:** `useMarketplaceNotifications(userId)` — list, unreadCount, refresh, markAsRead, markAllAsRead; optional WebSocket to push updates and trigger toasts.
- **Filters:** Local state in list pages; derive filtered list with `useMemo` from raw list (or server query when API supports it).
- **Offers count:** Fetched per request (dashboard / My Requests) and stored in component state or a small cache.
- **Real-time:** Prefer WebSocket for notifications and chat; fallback polling (e.g. 30s) for notification count.

---

## UX flow explanation

**Engineer:**  
Dashboard → see KPIs and recent requests → “Mes demandes” for full list (with filters) → “Nouvelle demande” to create → after create, redirect to “Mes demandes” → open a request → see offers → Accept or Reject (fixed UI) or “Ouvrir la discussion” → chat; when accepted, request closes.

**Artisan:**  
Dashboard → see KPIs and matching requests → “Demandes correspondantes” for full list (with filters) → “Proposer une offre” from card or detail → submit price + message → redirect to request or “Mes offres” → “Ouvrir la discussion” for chat → wait for accept/reject; notifications inform of new messages or acceptance.

**Notifications:** Bell shows count; panel lists items with link to request; toasts for high-signal events; mark read on click; WebSocket for real-time.

---

## Accessibility improvements

- **Layout:** `aria-label` on nav; `aria-current="page"` on active tab; `aria-expanded` on notification trigger and mobile menu; skip link target `id="marketplace-main"` if needed.
- **NotificationBell:** Badge with `aria-live="polite"`; panel `role="dialog"` with `aria-label`; Escape to close; focus management when opening/closing.
- **RequestCard:** Status badge `aria-label` (e.g. “Statut: Ouverte”); all links/buttons focusable; keyboard navigable.
- **FilterBar:** `role="search"`; visible labels linked to inputs/selects; `aria-label` where needed.
- **EmptyState:** `role="status"`; `aria-label` with title.
- **Loading:** Skeleton cards `aria-busy="true"` and `aria-label="Chargement"`.
- **Contrast:** Dark theme with sufficient contrast (WCAG AA); focus visible (outline or border) on all interactive elements.
- **Toasts:** `role="alert"` and `aria-live="assertive"` for important toasts so screen readers announce them.

---

## Notification UI structure (summary)

| Part | Implementation |
|------|----------------|
| **Trigger** | Icon + badge (count); click opens panel; `aria-expanded`, `aria-haspopup`. |
| **Panel** | Dialog: title “Notifications”, “Tout marquer lu”, scrollable list; each item: type, title, body, link to request; click → mark read, navigate, close. |
| **Badge** | Update on load and on WebSocket (or poll); show 0 when none. |
| **Toasts** | Separate layer; one toast per event; “Nouvelle offre”, “Offre acceptée”, etc.; auto-dismiss + optional “Voir”; `role="alert"`. |
| **Read/unread** | List item class/style for read vs unread; PATCH/GET for mark read; WebSocket can push read state. |

---

## Implementation status (reference)

- **Done:** MarketplaceLayout, NotificationBell (panel + badge + mark read), RequestCard (budget, offers count, status badge, actions), FilterBar, EmptyState, LoadingCard(s), MarketplaceDashboard (KPIs + recent), RequestDetailPage (offers + Accept/Reject), NegotiationChat, SubmitOfferPage, MyOffersPage, dark theme in Marketplace.css.
- **Optional next:** Toast component + WebSocket toasts; WebSocket in NegotiationChat for real-time messages; `deadline` on request (backend + card); fixed-position Accept/Reject bar on detail page; server-side filters (profession, budget, location, status).

This spec is the single reference for the marketplace UX and can be used for implementation and design review.
