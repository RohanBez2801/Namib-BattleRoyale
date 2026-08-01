# Technical Architecture #

1. Monorepo Structure
lib/db: Source of truth for the PostgreSQL schema.
artifacts/api-server: The Authoritative Bridge. Mediates all combat logic and persistence.
artifacts/nbr-mobile: The visual client. Handles input capture and world rendering.

2. Authoritative Networking Model
NBR uses a Server-Authoritative model to prevent cheating:
Client: Sends "Intent to Move" or "Intent to Fire" via WebSockets.
Server: Runs a 20Hz (50ms) Game Loop. It validates world bounds and distance delta.
Sync: The server broadcasts a world_update packet containing the positions of all players, loot drops, and the Sandstorm (Storm Circle) state.

3. Data Persistence & Identity
Supabase Auth: Provides cryptographically signed JWTs.
JWT Verification Middleware: The backend rejects any match result or profile update that does not contain a valid signature from our specific Supabase project.
Drizzle ORM: Provides type-safe SQL queries, ensuring that player stats (Kills, Wins, XP) are updated atomically in the database.

4. World Rendering Engine
Camera Follow: The player is fixed at the screen center (width/2, height/2). The world translates in reverse to create the illusion of infinite movement.
Coordinate System: Uses a 5000x5000 unit world space mapped to the Namibian map grid.
