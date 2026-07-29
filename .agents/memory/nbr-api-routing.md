---
name: NBR API routing
description: How the mobile app reaches the API server in the Replit monorepo.
---

# NBR API routing

## Rule
The API base URL for the mobile app is `https://${EXPO_PUBLIC_DOMAIN}/api` — NOT `/api-server/api`.

## Why
The artifact.toml for the API server declares `paths = ["/api"]` and `localPort = 8080`. The Replit proxy routes `/api/*` directly to port 8080. The mobile dev script already sets `EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN`, so `https://${EXPO_PUBLIC_DOMAIN}/api` resolves correctly both on-device (Expo Go, same domain) and in the web preview.

## How to apply
In `artifacts/nbr-mobile/lib/api.ts`:
```ts
const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
    : "http://localhost:8080/api");
```
The `EXPO_PUBLIC_API_BASE_URL` escape hatch lets production override this without a code change.
