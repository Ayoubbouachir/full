# Smart Matching System — API Flow & Architecture

## Folder structure (backend)

```
back-end/src/
  users/
    entities/user.entity.ts          # + profession, rating, location
  service-requests/
    entities/service-request.entity.ts
    dto/create-service-request.dto.ts
    service-requests.controller.ts
    service-requests.service.ts
    matching.service.ts
    service-requests.module.ts
  offers/
    entities/offer.entity.ts
    dto/create-offer.dto.ts
    offers.controller.ts
    offers.service.ts
    offers.module.ts
  negotiation/
    entities/negotiation-message.entity.ts
    dto/create-negotiation-message.dto.ts
    negotiation.controller.ts
    negotiation.service.ts
    negotiation.module.ts
  notifications/
    entities/notification.entity.ts
    notifications.controller.ts
    notifications.service.ts
    notifications.module.ts
  marketplace/
    marketplace.gateway.ts           # WebSocket namespace /marketplace
    marketplace.module.ts
```

## Authentication (headers)

All authenticated endpoints expect:

- `x-user-id`: current user `_id` (string)
- `x-user-role`: `Engineer` | `Artisan` (for accept/reject)
- `x-profession`: artisan profession (for GET /service-requests/available)

Frontend: after login, store `user._id` and `user.role` and send them on every request.

## API Endpoints

| Method | Path | Role | Description |
|--------|------|------|--------------|
| POST | /service-requests | Engineer | Create request (body: title, description, requiredProfession, location?, budgetRange?) |
| GET | /service-requests/my | Engineer | My requests |
| GET | /service-requests/available | Artisan | Requests matching my profession (header x-profession) |
| GET | /service-requests/:id | Both | Request detail |
| POST | /offers | Artisan | Submit offer (body: requestId, proposedPrice, message?) |
| GET | /offers/request/:requestId | Both | Offers for a request |
| GET | /offers/my | Artisan | My offers |
| POST | /offers/:id/accept | Engineer | Accept offer |
| POST | /offers/:id/reject | Engineer | Reject offer |
| POST | /negotiation/message | Both | Send message (body: requestId, content) |
| GET | /negotiation/request/:requestId | Both | Chat history for request |
| GET | /notifications | Both | My notifications (x-unread-only: true optional) |
| GET | /notifications/unread-count | Both | Badge count |
| POST | /notifications/:id/read | Both | Mark one read |
| POST | /notifications/read-all | Both | Mark all read |

## Workflow

1. **Engineer** creates ServiceRequest → status `open` → **MatchingService** finds artisans (profession + location) → **Notifications** created for each → WebSocket optional.
2. **Artisan** sees list via GET /service-requests/available (matching profession).
3. **Artisan** submits Offer → request status → `in_negotiation` → engineer gets notification + WebSocket `new_offer`.
4. **Engineer** and **Artisan** chat via POST /negotiation/message; other party gets notification + WebSocket `new_message`.
5. **Engineer** accepts one offer → offer status `accepted`, request status `closed` → artisan notification + WebSocket `status_change`. Reject → offer `rejected`, notification.

## WebSocket (Socket.IO)

- **Namespace:** `/marketplace`
- **Connect with query:** `?userId=<_id>`
- **Events from server:**
  - `new_offer` — engineer (payload: offer)
  - `new_message` — participant (payload: message)
  - `status_change` — participants (payload: { requestId, status })
  - `notification` — user (payload: notification)
- **Client → server:** `subscribe_request` with `{ requestId }` to join room for a request.

## State management (frontend suggestion)

- **Auth:** Context or Redux storing `user` (id, role, profession).
- **Requests (engineer):** list from GET /service-requests/my; refetch after create.
- **Available (artisan):** list from GET /service-requests/available; refetch on focus or timer.
- **Offers:** GET /offers/request/:id for request detail page; GET /offers/my for artisan.
- **Notifications:** GET /notifications + GET /notifications/unread-count; poll or WebSocket to refresh badge.
- **Chat:** GET /negotiation/request/:id for history; append optimistically on send; WebSocket for incoming.

## Security (to add)

- JWT guard: validate token and set `req.user` (id, role).
- Role guard: restrict by role (e.g. only Engineer for POST /service-requests, only Artisan for POST /offers).
- Ownership: only request engineer can accept/reject; only matched artisan can submit offer (enforced in OffersService).
