# Marketplace UX Flow & Structure

## UX objectives

1. **Engineer workflow:** Post request → Receive offers → Negotiate → Accept → Close  
2. **Artisan workflow:** Browse matching requests → Submit offer → Negotiate → Get accepted  

---

## Page structure (React)

```
/marketplace
  → redirects to /marketplace/dashboard

/marketplace/dashboard     MarketplaceDashboard   (KPIs + recent requests/offers)
/marketplace/create        CreateRequestPage     (Engineer: post request form)
/marketplace/requests      MyRequestsPage        (Engineer: list with filters)
/marketplace/requests/:id  RequestDetailPage     (Offers list + chat link + Accept/Reject)
/marketplace/requests/:id/chat   NegotiationChat  (Chat + back link)
/marketplace/requests/:id/offer  SubmitOfferPage  (Artisan: price + message form)
/marketplace/available     AvailableRequestsPage (Artisan: matching requests + filters)
/marketplace/offers        MyOffersPage          (Artisan: my offers list)
```

---

## Component breakdown

| Component | Role |
|-----------|------|
| **MarketplaceLayout** | Wrapper: sticky header, nav tabs (Dashboard, Mes demandes, Nouvelle demande / Demandes correspondantes, Mes offres), NotificationBell, Outlet |
| **NotificationBell** | Dropdown panel, unread badge, mark-as-read, link to request |
| **RequestCard** | Title, description clamp, profession, budget, location, offers count, status badge, actions (Voir, Négocier / Proposer une offre) |
| **FilterBar** | Profession, status, location, budget filters + reset |
| **EmptyState** | Presets: no_requests, no_offers, no_matching, no_my_offers; icon + title + description + action |
| **LoadingCard / LoadingCards** | Skeleton cards for loading state |
| **MarketplaceDashboard** | KPI grid (active requests, in negotiation, pending offers, notifications) + section “Recent requests” with RequestCards |
| **RequestDetailPage** | Back link, title, status badge, meta, description, “Ouvrir la discussion”, offers list with Accept/Reject |
| **NegotiationChat** | Back link, message list (mine/theirs), input + send |
| **SubmitOfferPage** | Back link, request title, form (proposedPrice, message), submit |

---

## UI layout structure

- **Layout:** Full-viewport dark background; sticky header with logo + nav + notification bell. Main content max-width 1280px, padding 2rem.
- **Dashboard:** KPI grid (4 cards) then section “Mes demandes récentes” / “Demandes correspondantes” with card grid; “Voir tout” link.
- **Lists (My requests / Available):** Page title → FilterBar → cards grid or EmptyState.
- **Detail:** Single column: back link, title, badge, meta, description, primary action, then offers list (price, message, status, Accept/Reject).
- **Chat:** Back link, title “Discussion”, scrollable messages, fixed input row at bottom.

---

## State management strategy

- **Auth:** `localStorage` user (id, role, profession/speciality); no global store required for current scope.
- **Lists:** Local state per page (`requests`, `offers`, `messages`); fetch on mount and after mutations.
- **Notifications:** `useMarketplaceNotifications(userId)` → list, unreadCount, refresh, markAsRead, markAllAsRead; optional poll (e.g. 30s) or WebSocket for badge.
- **Filters:** Local state in list pages; filter in `useMemo` from raw list (no server-side filter for now).
- **Offers count:** Fetched per request (dashboard and My Requests) and stored in `offersCounts` state.

---

## UX flow explanation

1. **Engineer:** Dashboard shows KPIs and recent requests → “Mes demandes” for full list + filters → “Nouvelle demande” to create → After create, redirect to “Mes demandes” → Click request → Detail with offers → Accept/Reject or “Ouvrir la discussion” → Chat.
2. **Artisan:** Dashboard shows KPIs and matching requests → “Demandes correspondantes” for full list + filters → “Proposer une offre” on card or from detail → SubmitOfferPage → After submit, redirect to request detail → “Ouvrir la discussion” for chat.
3. **Notifications:** Bell shows count; panel lists items with link to request; mark read on click; optional WebSocket for real-time badge.

---

## Accessibility improvements

- **Layout:** `aria-label` on nav, `aria-current="page"` on active tab, `aria-expanded` on notification trigger and mobile menu.
- **NotificationBell:** `aria-live="polite"` on badge; panel as `role="dialog"` with `aria-label`; keyboard: focus trap optional, Escape to close recommended.
- **RequestCard:** Status badge with `aria-label` (e.g. “Statut: Ouverte”); links and buttons are focusable.
- **FilterBar:** `role="search"`, `aria-label` on filters; labels associated with inputs/selects.
- **EmptyState:** `role="status"`, `aria-label` with title.
- **Loading:** `aria-busy="true"` and `aria-label="Chargement"` on skeleton cards.
- **Main:** `id="marketplace-main"` for skip-link target if needed.
- **Contrast:** Dark theme with orange accent (#ff6b35) and light text; focus visible (outline/border) on inputs and buttons.

---

## Notification UI structure

- **Trigger:** Icon + optional badge (count); click opens panel.
- **Panel:** Header “Notifications” + “Tout marquer lu”; list of items (type, title, body); click item → mark read, navigate to request, close panel.
- **Real-time:** Poll `GET /notifications/unread-count` every 30s or connect WebSocket namespace `/marketplace` with `userId` and listen for `notification` event to refresh count and list.
