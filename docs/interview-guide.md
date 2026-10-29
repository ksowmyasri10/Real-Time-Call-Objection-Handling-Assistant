# Callwise: Interview Walkthrough

## 30-second introduction

Callwise is a browser-based prototype for helping a sales or support agent respond thoughtfully during a customer call. It demonstrates a call cockpit with a live-transcript experience, objection recognition, suggested and alternative replies, a sentiment indicator, and a post-call summary. This implementation deliberately runs in simulated mode: it does not place a phone call, capture audio, or invoke Twilio, LiveKit, or OpenAI.

## The problem and user journey

Agents can miss a customer concern while navigating notes or product information. The concept is to keep the agent focused on the conversation while bringing relevant coaching into the same workspace.

1. The agent chooses a budget or existing-provider example and starts a simulated call.
2. Sample dialogue appears in the transcript. A scripted objection cue reveals a suggested response, alternatives, and an illustrative sentiment reading.
3. The agent can select a suggestion to copy it, adapt it in their own words, and end the call.
4. A short demo summary appears in Call insights. Aggregate charts are explicitly illustrative.

The flow is deterministic so an interviewer can reliably see the important UI states without provider accounts, phone numbers, or API keys.

## Architecture and technology

The front end is plain HTML, CSS, and JavaScript. `app.js` owns the local call state machine, scripted scenarios, transcript rendering, and coaching state. `styles.css` provides the responsive desktop/mobile layout and accessible interaction states. `server.mjs` uses Node's built-in HTTP modules to serve static assets and expose a provider-status health check; no dependency installation is needed.

In the current demo, the browser is the source of all scripted call data. The server does not process calls. A production design would move session authorization and vendor credentials to a backend:

```text
Browser ── authenticated session ──> Application backend
  │                                      ├── Twilio: initiate/connect telephone call
  │                                      ├── LiveKit: scoped room tokens and media room
  │                                      └── OpenAI: authorized transcription/analysis
  └── consented audio + live transcript/coaching events <── backend/room
```

A server-side media bridge would connect telephone media to the LiveKit room. A worker could send consented audio segments to OpenAI and publish transcript and analysis events back to authorized participants. A separate post-call pipeline would apply retention rules and calculate reviewed metrics. The diagram describes a future design, not wired functionality in this repository.

## Demo and verification

Run `node server.mjs`, then open `http://127.0.0.1:4173`. Choose a scenario, start the demo call, watch transcript lines arrive, observe the objection coaching, select a reply, end the call, and visit Call insights. `GET /api/health` should identify the mode as `simulated` and report Twilio, LiveKit, and OpenAI as disabled.

## Engineering decisions and trade-offs

- **No dependencies:** the core demo can be run quickly on a clean machine and doesn't require external credentials.
- **Simulation over fake integration:** the timed conversation gives a useful product walkthrough while clearly distinguishing the prototype from real telephony, streaming, and model inference.
- **Provider boundary:** real credentials and vendor calls belong on an authenticated backend. The front end must never receive API secrets.
- **Sample analytics are labeled:** demo figures are illustrative and should not be presented as measured business impact.
- **Privacy by default:** the local demo captures and stores no call audio. A real release needs informed participant consent, access controls, retention/deletion rules, and policy review.

## Production roadmap

1. Define authentication, roles, consent capture, call-session authorization, and audit events.
2. Build backend adapters for Twilio call control and verified webhooks, LiveKit scoped tokens and audio bridging, and OpenAI transcription/analysis.
3. Add a streaming event protocol, reconnection/backpressure handling, observability, and failure states.
4. Validate transcript/objection quality with representative data and human review; test latency, security, and accessibility.
5. Add configurable retention, deletion, access controls, and legal/policy review before real call recording or analysis.

## Responsible-use note

Do not record, transcribe, stream, or analyze real calls without obtaining the participant consent required by applicable law and company policy. Provide clear notice and opt-out, minimize data, limit access, define retention and deletion, and do not treat AI-generated sentiment or response suggestions as definitive judgments.
