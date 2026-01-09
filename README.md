# Tokyo Dome Events API

A Cloudflare Worker API that provides Tokyo Dome event schedules.

## Base URL

```
https://tokyo-dome.chungjungsoo.dev
```

---

## Endpoints

### Health Check

```
GET /
```

Returns a simple ping response to verify the API is running.

**Response**

```
200 OK
Content-Type: text/plain

ping
```

---

### Get Today's Events

```
GET /today
```

Returns all events scheduled for today (JST).

**Response**

```json
200 OK
Content-Type: application/json

[
  {
    "date": "2026-01-10",
    "name": "BLACKPINK WORLD TOUR <DEADLINE> IN TOKYO",
    "start_time": "18:00"
  }
]
```

---

### Get Tomorrow's Events

```
GET /tomorrow
```

Returns all events scheduled for tomorrow (JST).

**Response**

```json
200 OK
Content-Type: application/json

[
  {
    "date": "2026-01-11",
    "name": "Naniwa Danshi 1st DOME LIVE 'VoyAGE'",
    "start_time": "18:00"
  }
]
```

---

### Get This Week's Events

```
GET /this_week
```

Returns all events from today through the upcoming Sunday (JST).

**Response**

```json
200 OK
Content-Type: application/json

[
  {
    "date": "2026-01-10",
    "name": "BLACKPINK WORLD TOUR <DEADLINE> IN TOKYO",
    "start_time": "18:00"
  },
  {
    "date": "2026-01-11",
    "name": "Naniwa Danshi 1st DOME LIVE 'VoyAGE'",
    "start_time": "18:00"
  }
]
```

---

### Get This Month's Events

```
GET /this_month
```

Returns all events for the current month (JST).

**Response**

```json
200 OK
Content-Type: application/json

[
  {
    "date": "2026-01-01",
    "name": "Hey! Say! JUMP DOME TOUR 2025-2026 S say",
    "start_time": "17:00"
  },
  {
    "date": "2026-01-25",
    "name": "Lady Gaga: The MAYHEM Ball",
    "start_time": "18:00"
  }
]
```

---

## Error Responses

### 404 Not Found

Returned when requesting an unknown endpoint.

```json
404 Not Found
Content-Type: application/json

{
  "error": "Not Found"
}
```

---

## Caching

All event endpoints are cached until midnight JST. Responses include a `Cache-Control` header with the appropriate TTL.

```
Cache-Control: public, max-age=<seconds-until-midnight-jst>
```

---

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Database**: Cloudflare D1
- **Language**: TypeScript
