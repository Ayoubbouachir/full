# Marketplace (Engineer / Artisan matching) — Frontend

## Route structure (to add in App.js)

```js
<Route path="marketplace" element={<MarketplaceLayout />}>
  <Route path="create" element={<CreateRequestPage />} />
  <Route path="requests" element={<MyRequestsPage />} />
  <Route path="requests/:requestId" element={<RequestDetailPage />} />
  <Route path="requests/:requestId/chat" element={<NegotiationChat />} />
  <Route path="available" element={<AvailableRequestsPage />} />
  <Route path="offers" element={<MyOffersPage />} />
  <Route path="requests/:requestId/offer" element={<SubmitOfferPage />} />
</Route>
```

## Pages

- **CreateRequestPage** — Engineer: form (title, description, requiredProfession, location, budgetRange) → POST /service-requests.
- **MyRequestsPage** — Engineer: list from GET /service-requests/my, link to detail + chat.
- **AvailableRequestsPage** — Artisan: list from GET /service-requests/available (x-profession from user.profession or user.speciality), link to submit offer.
- **RequestDetailPage** — Engineer: GET /service-requests/:id, GET /offers/request/:id, show offers; buttons Accept / Reject; link to NegotiationChat.
- **SubmitOfferPage** — Artisan: form (proposedPrice, message) → POST /offers with requestId.
- **MyOffersPage** — Artisan: GET /offers/my.
- **NegotiationChat** — Both: GET /negotiation/request/:requestId, POST /negotiation/message; optional WebSocket for live messages.

## Notification bell

Use `useMarketplaceNotifications(userId)`:

- `list` — notifications
- `unreadCount` — badge
- `markAsRead(id)`, `markAllAsRead()`, `refresh`, `fetchUnreadCount`

Connect WebSocket to `wss://<api>/marketplace?userId=<id>` and on `notification` event call `fetchUnreadCount()` and optionally `refresh()`.

## API base

All requests send header `x-user-id: user._id`. For accept/reject add `x-user-role: user.role`.
