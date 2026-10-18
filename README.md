# Loose Ends
An interactive Alexa+ experience simulation for household handoffs.

## Run
Serve dist with any static HTTP server, for example `python3 -m http.server 8080 --directory dist`, then open http://localhost:8080.

## Prototype scope
A scripted washer repair scenario with local browser persistence, coverage conflict detection, message approval simulation, shared-context handoff, and explicit resolution. No external messages, real Alexa integration, live LLM, or multi-user synchronization. Suggested replies demonstrate supported inputs; typed input uses scenario-specific rules. The private hosted preview requires owner access.

## Demo
1. Report the washer leak using the suggested update.
2. Say Alex can cover after 3.
3. Draft and approve the demo message.
4. Ask for a handoff.
5. Report the technician came.
6. Report a replacement part is pending, then confirm the washer works to close it.

Prototype source and hosted assets are in dist/.
