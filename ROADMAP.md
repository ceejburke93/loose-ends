# Submission status

## Implemented
- Conversation and state handling no longer inserts preset facts for every input.
- Negated completion and unavailable people handled safely.
- Pending, draft-specific approval with invalidation after plan changes.
- A genuine server-backed handoff between separate browser clients.
- Recipient acceptance/decline, attributed outcomes, history, revision checks, expiring/revocable access.
- Automated state/access regression tests and live API integration checks.
- Completed narrated demo with actual app screens, fictional details, captions, and the Yaps Asa preset voice.
- Published repository test report distinguishing automated role tests from an outside human test.
- Local browser walkthrough of coordinator → recipient → completion → coordinator reload.

## Still needed for the hackathon
- Complete the Devpost draft and select the Alexa+ simulated-experience path.
- Upload the completed 2:57 English demo to the video host required by the submission form, and add its public URL to Devpost. The MP4, captions, and transcript are committed in `docs/demo/`.
- Write project description, Built With, actual tool feedback, and observed friction log.
- Validate the final hosted demo with an external person on another device.
- Recheck remaining accessibility and unusual conversational phrasing.
- Decide whether to add a real language model or MCP integration; neither is represented as implemented here.

The primary project alone does not qualify for the Open Source mini-challenge. No AWS mini-challenge entry is claimed without a documented qualifying integration.

## Added for the demo
- Brief with source links, explicit unanswered questions, and a named next step.
- Persistent reading positions for each link role, with changes since the last read.
- Browser read-aloud where supported.
- Timed guided story using actual shared records and independent recipient acceptance.
