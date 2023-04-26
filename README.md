Tilgjengeliggjøre feature toggles fra unleash som self-service

# Forutsetninger

## Installert

- docker
- docker-compose
- node >16
- npm

# Lokal utvikling

1. Kjør `npm install` som installerer avhengigheter
1. Sett opp miljøvariabler

   - Lag fil med navn `.env` i `server/` mappen
   - Sett opp miljøvariabler i `.env` fil

   ```env
   UNLEASH_TOKEN=<Admin token fra http://localhost:4242/admin/api/create-token>
   UNLEASH_SERVER=http://localhost:4242
   UNLEASH_PROJECT=default
   UNLEASH_TAG=<unleash tag for releases and kill-switch>
   ```

1. Start miljø

   - Start unleash: `docker-compose up` (kan nås på http://localhost:4242, user: admin pw:unleash4all)
   - Start backend: `npm run start:server` (starter på http://localhost:8080)
   - Start frontend `npm run start:client` (kan nås på localhost:5173)

1. Lag ny toggle http://localhost:4242/projects/default/create-toggle
   - Toggle type: _RELEASE_ eller _KILL SWITCH_
   - Project: default (eller samme som env. `UNLEASH_PROJECT`)
   - Description: <Det som skal vises til brukeren>
1. Enable feature toggle for `development`
1. Legg til tag (må matche enten `UNLEASH_TAG`)
1. Legg til **UserIDs** strategi for toggle
1. Gå inn på `https://localhost:5173` og se at toggle vises
