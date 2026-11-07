# AGENTS.md

## Project
Smart Campus room availability checker; fictional room catalog, fixed current time entered by the user, availability decision only.
User story: As a student, I want to find a room that fits my group and equipment needs and check its availability so I can choose a valid booking time.

## Structure
- `src/data.ts` – room data: fictional catalog `SAMPLE_ROOMS` (id, name, capacity, equipment, blocked, own bookings) and equipment labels
- `src/types.ts` – `Room`, `Booking`, `Equipment`, `AvailabilityTarget`, `AvailabilityResult`
- `src/timeRules.ts` – shared time limits and range checks (used by the rule and the slot hint)
- `src/checkAvailability.ts` – pure booking rule `checkAvailability(room, start, end, currentTime)` (AC1–AC4)
- `src/bookingInput.ts` – form strings → rule: `parseRequest`, `checkRequest`, `formatTime`, `requestedSlotLabel`
- `src/roomFilter.ts` – pure filtering: `filterRooms`, `meetsCapacity`, `hasAllEquipment`, `parseAttendees` (F1, F2, F4)
- `src/components/` – UI presentation: `RoomFilters`, `RoomList` (cards + empty state), `BookingList`, `TimeField`, `ResultPanel`
- `src/App.tsx` – page state and wiring only; the result is derived from the selected room (F5)
- `tests/` – Vitest unit, regression and integration tests; `scripts/` – mutation and browser UI checks

## Constraints
Preserve AC1–AC6; no backend, login, payments, live APIs, database or booking creation.
- AC1: reject start >= end and past requests.
- AC2: reject durations longer than 120 minutes.
- AC3: reject a blocked room.
- AC4: reject overlaps; allow bookings touching only at endpoints.
- AC5–AC6: do not mutate booking data; retain clear desktop/mobile feedback.
- F1: capacity >= requested attendees. F2: room has ALL selected equipment.
- F3: a blocked room is never reported as available. F4: clear empty state when no room matches.
- F5: changing the selected room refreshes the result using that room's own bookings.

## Engineering rules
Prefer pure functions and minimal changes; logic modules must not import React.
Do not mutate booking fixtures; keep responsive UI feedback.
Do not weaken or delete existing assertions.

## Commands
- Install: `npm install`
- Tests: `npx vitest run` (same as `npm test`)
- Type check: `npm run typecheck`
- Build: `npm run build`
- Mutation check: `npm run test:mutants`
- Browser UI checks: `npm run build && node scripts/ui-check.mjs`

## Verification
Run existing tests and add focused regression tests.
Report changed files, rationale and test evidence.
