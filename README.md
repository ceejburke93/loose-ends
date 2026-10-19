# Loose Ends

Your household remembers, so you don’t have to explain everything twice.

Loose Ends is a working web simulation for the Alexa+ hackathon track. A coordinator records a household repair, identifies a coverage gap, and creates a private link for another person. Responsibility transfers only when that recipient accepts. A visit does not close the repair: somebody must confirm the result.

## What works

- Structured repair facts and editable times; supported conversational updates use the values actually provided.
- Negation-aware updates: “not fixed” leaves a repair open; “Alex cannot cover” does not assign coverage.
- Draft-specific message approval; changed plans invalidate prior approval.
- Server-backed shared records with revision checks to prevent overwriting concurrent edits.
- Separate coordinator and recipient links; only the recipient link can accept or decline its handoff.
- Shared, attributed history with updates every three seconds while the page is visible.
- Recipient outcomes, pending parts, explicit completion, and reopening.
- Hashed access keys, 24-hour recipient links, revocation, and seven-day notebook expiry.

## Try the two-person demo

1. Start a household thread as **Sam**, and choose **Start the washer story**.
2. Open **Find a time that works**, then save **Alex** as available after **3 p.m.** Notice that the technician’s **2–4 p.m.** window leaves a gap.
3. Optionally draft and approve a technician message. It is clearly marked **not sent**; the appointment is unchanged.
4. Choose **Offer the handoff** to create a recipient link. Give that link to a second person, or use **Open recipient view in a separate tab**.
5. As Alex, choose **I’ll take the follow-up**. Sam’s page updates to show Alex owns it.
6. As Alex, record **The technician came**, then **Waiting on a part**. It stays open.
7. Choose **I confirm it’s working again**. Sam sees the repair close, with Alex’s attributed event. Reload either page to verify persistence.
8. In a separate trial, revoke a recipient link or change the plan. The old recipient link can no longer read or update the record.

Use fictional names and household information. Link possession grants the displayed role; names are not verified identities. The coordinator link must not be shared with the recipient.

## Run locally

Requires Node.js 22.13 or later. No API keys are required.

```sh
npm ci
npm run db:generate # only after changing db/schema.ts; do not regenerate existing migrations
npm run build
```

For a fresh checkout, skip `db:generate`: the initial migration is already included. Apply it locally:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_regular_cloak.sql
npm run dev -- --hostname 127.0.0.1 --port 5173
```

Open the URL printed by the server. Local and production databases are separate. Shared-device testing needs the hosted demo; `127.0.0.1` is only the machine running the server. The GitHub hosting manifest declares the D1 binding without the private Sites project identity. Sites provisioning supplies the actual hosted binding and applies committed migrations during deployment.

## Checks

```sh
npm test
npx tsc --noEmit
# With local preview running:
node tests/api.integration.mjs
```

The rule/state tests cover negation, parsing, draft approval, ownership, outcomes, permissions, and expiry. The live API checks use separate access keys against actual shared storage and verify stale-write rejection and revoked links.

## Limits

This is a **rules-based Alexa+ simulation**, not a live Alexa integration or a language model. Supported repair phrases and exact-time forms are provided; unsupported messages do not invent facts. Unqualified hours 1–7 are interpreted as afternoon, so include am/pm or use the time form when ambiguous. Overnight appointment windows are not supported. No SMS or email is sent. People must report technician confirmation themselves. Link-based access is suitable for a fictional demo, not a substitute for production household authentication. Notebooks become inaccessible at seven days; expired data is removed in bounded cleanup when new notebooks are created, rather than on a guaranteed deletion schedule.

## Architecture

React UI and Vinext routes on a Cloudflare Worker, Cloudflare D1 shared storage, a pure state-transition module, and bearer capabilities stored only as hashes in the database. Client links keep their raw key in the URL fragment and per-tab session storage. Requests send it in an Authorization header. No notebook listing endpoint is exposed. Writes compare the expected revision before committing; guests cannot edit coordinator plans. Production creation has a hashed, time-bucketed IP quota.

MIT licensed. Built with AI assistance; product behavior, implementation, and limitations are documented rather than presented as a live Alexa service.

## Handoff brief and guided story

Each notebook now has a compact brief with **On record**, **Still needs an answer**, and **Next**. Facts link to attributed timeline updates. They are reported facts, not independent verification. **I’ve read this** saves a role-specific reading position on the server; later updates appear as a change list without pretending that reading equals acceptance. New invitations reset the recipient’s reading position.

**Take the two-minute guided demo** starts a fresh fictional notebook and walks through the real state transitions. It deliberately pauses at the handoff: a separate recipient link must accept. The optional **Read brief aloud** uses the browser’s speech synthesis when supported; it is not an Alexa voice or an Alexa device connection.


## The thread experience

The main view makes responsibility visible as a thread between two people. It remains in the original person’s hands until the recipient accepts. Select **Noticed**, **Held**, **Passed on**, or **Tied up** to inspect that part of the saved situation. The next decision appears beside the thread. Availability and link sharing open focused dialogs.

Use **The handoff** for the source-linked brief and **Updates & history** for conversation and the saved event record. A source button opens the matching history entry while preserving the private access link. The visual thread reflects saved state; it is not a drag-to-assign control.
