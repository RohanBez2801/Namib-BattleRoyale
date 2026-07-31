# Namib Battle Royale (NBR)
**Namibia's Arena. Your Legend.**

Namib Battle Royale is a commercial-quality, mobile-first multiplayer experience developed in TypeScript. The game celebrates Namibia’s iconic landscapes—from the towering dunes of Sossusvlei to the rusted shipwrecks of the Skeleton Coast—providing a high-fidelity competitive arena for a global audience.

---

## 🎭 The Factions of Namibia
*Choose your origin. Master the desert.*

*   **🟠 Ovambo** – *Northern Namibia:* High endurance and community coordination.
*   **🔴 Herero** – *Central Namibia:* Resilient warriors with a deep heritage.
*   **🟤 Himba** – *Kunene Region:* Masters of desert survival and traditional tracking.
*   **🟣 Damara** – *Erongo Region:* Expert navigators of rocky terrain.
*   **🔵 Nama** – *Southern Namibia:* Agile skirmishers of the southern plains.
*   **🟢 San** – *Kalahari:* Unmatched stealth and poison-craft specialists.
*   **teal Kavango** – *Kavango Region:* Specialists in river-border combat.
*   **🟦 Caprivian** – *Zambezi Region:* Tactical specialists of the lush wetlands.
*   **🟫 Baster** – *Rehoboth:* Tenacious defenders with precise aim.
*   **🏙️ Urban Style** – *Windhoek City:* Modern street-smart combatants.

---

## 🚀 Project Status: Milestone 4 Complete
*   **Current Completion:** ~25%
*   **Core Engine:** Authoritative Server Loop (20Hz) with real-time Socket.io synchronization.
*   **Visuals:** Centered-camera world rendering with functional Minimap and HUD.
*   **Security:** Signed Supabase JWT identity verification.

---

## 🛠 Tech Stack
*   **Monorepo:** pnpm Workspaces
*   **Visuals:** React Native / Expo (SDK 54)
*   **Engine:** Node.js / Express 5 / Socket.io
*   **Database:** Supabase / PostgreSQL / Drizzle ORM
*   **Security:** RS256 JWT Verification

---

## 💻 Local Windows Setup (Standard Operating Procedure)

### Prerequisites
*   **Node.js:** v24+
*   **PNPM:** `npm install -g pnpm`
*   **Database:** Access to Supabase Connection String.

### Installation
Open PowerShell in the root directory and run:

```powershell
# 1. Install dependencies in Windows-Hoisted mode
pnpm install --shamefully-hoist --ignore-scripts

# 2. Build shared internal libraries
pnpm run typecheck:libs
```

---

## 🎮 Running the Game

### Tab 1: The Brain (API & Logic)
Navigate to the server folder and initialize the authoritative logic:

```powershell
cd artifacts/api-server
$env:DATABASE_URL="postgresql://postgres:[PASS]@[HOST]:5432/postgres"
$env:SUPABASE_JWT_SECRET="your_secret"
$env:NODE_ENV="development"
pnpm run build
pnpm run start
```

### Tab 2: The Visuals (Mobile)
Navigate to the mobile folder and start the Metro Bundler:

```powershell
cd artifacts/nbr-mobile
npx expo start --lan
```

> **Note:** Scan the QR code with the **Expo Go** app on your mobile device. Ensure your phone and PC are connected to the same Wi-Fi network.
