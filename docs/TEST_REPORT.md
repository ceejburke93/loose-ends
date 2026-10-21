# Loose Ends: handoff test

Tested October 20, 2026 against the public hosted app at https://loose-ends-household.gladbasil10.chatgpt.site/.

## Result

The automated owner and recipient walkthrough passed. This was a simulation using two separate browser tabs and separate role links on the same computer. It was not an independent human usability test or a test on two physical devices.

Repository sync verification: all 50 unit tests passed, TypeScript completed without errors, and the diff whitespace check passed. The repository's application files were compared with the deployed source; matching files were preserved and missing shared UI/configuration source was included.

The hosted integration suite also passed all 27 API checks. These cover separate roles, shared updates, denied permissions, stale writes, completion, and revoked or invalidated links.

## Browser walkthrough

Using a fresh fictional household record:

1. Sam reported the leaking washer, water shutoff, a 2–4 pm technician window, and a 1 pm departure.
2. Alex's availability after 3 pm left an uncovered hour visible.
3. Sam approved a draft. The app continued to say that no message had been sent and kept the appointment separate from the request.
4. Sam recorded a fictional technician confirmation for 3–4 pm.
5. Sam offered the handoff. Responsibility stayed with Sam while acceptance was pending.
6. Alex opened the separate recipient link and acknowledged the brief. Reading did not accept the handoff.
7. Alex explicitly accepted. Ownership changed to Alex, and Sam's view reflected the acceptance.
8. Alex recorded a visit. The repair remained open.
9. Alex recorded a pending part. The unresolved next step remained visible.
10. Alex explicitly confirmed the washer was working. The repair closed.
11. Sam opened the handoff brief and saw five updates since the last read, including acceptance and the outcome. Reloading retained the completed record.
12. A 390 × 844 mobile viewport displayed the completed thread without visible horizontal overflow.

## Limits and remaining evidence

An actual outside person should still try the recipient link without coaching. The most useful question is whether they can identify the current owner, remaining action, and difference between reading and accepting. No claim of independent user validation should be made yet.

Expiry handling was not tested by waiting seven days during this session. Revocation and invalidation were exercised by the hosted API suite. The mobile check used browser viewport emulation, not a physical phone.

The video is a narrated walkthrough assembled from actual screenshots taken during this browser test. It uses synthetic narration and fictional household details. It is not a continuous screen recording. No bearer links or access keys appear in the deliverables.

Loose Ends is an Alexa+ web simulation with rules-based conversation handling. It does not connect to an Alexa device, invoke a live language model, or send messages to a technician.
