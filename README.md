# Callwise — Real-Time Call Objection Handling Assistant

Callwise is a local-first, browser-based prototype of a sales/support call assistant. Its simulated call demonstrates the user experience for a live transcript, objection cues, suggested replies, sentiment, and a post-call summary. **It does not place calls, capture or stream audio, transcribe speech, or call Twilio, LiveKit, or OpenAI.** Every call and dashboard metric in this version is sample data.

## Run locally

Requires Node.js 18 or newer. No packages or API keys are needed.

```powershell
node server.mjs
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). Set `PORT` to use another port. To stop the server, press Ctrl+C. `GET /api/health` reports the demo mode and explicitly returns all three provider integrations as disabled.

Choose **Budget objection** or **Existing provider**, then select **Start simulated call**. Transcript lines appear in sequence; the objection cue surfaces coach suggestions and a sample sentiment reading. Select a response to copy it, then end the call to see a session summary. **Call insights** shows illustrative aggregate metrics and the last simulated call summary. Try the layout at desktop and mobile widths.

## Architecture

- `index.html`, `styles.css`, and `app.js` are the browser UI and local demo state machine. Transcript scenarios and sample analytics are bundled as demonstration data.
- `server.mjs` is a small Node.js static-file server and a provider-status health endpoint. It is not a call or AI backend.
- No audio, transcript, or contact data is sent to a service by the demo call flow. The UI labels simulated content so it is not mistaken for a real call.

### Provider integration boundary (not implemented)

A production version should introduce a server-side provider adapter rather than calling vendors from the browser:

1. An authenticated app backend creates a short-lived call session and asks **Twilio** to dial/connect, subject to agent authorization and the required participant consent.
2. A server-side **LiveKit** token endpoint grants the browser narrowly scoped access to a room. Twilio media is bridged to the room using a controlled server-side media connector; credentials remain on the server.
3. The browser publishes/receives live audio only after consent. A server-side worker sends authorized audio segments to **OpenAI** for transcription and analysis, then sends transcript, objection cues, and suggested responses to the authorized call participants.
4. A post-call worker computes permitted metrics and retention/deletion actions. Only reviewed, consented, policy-compliant records should be persisted.

That production architecture, its security controls, and provider calls are **future work**; none are currently wired. Do not place API keys or signing secrets in this frontend. A real integration would need server-side credentials such as Twilio account credentials and webhook validation secret, LiveKit API key/secret and URL, and an OpenAI API key. Those values must be stored in a server-side secret manager or protected environment, never committed or exposed to the client. This demo requires no provider environment variables.

## Limitations and responsible use

- The demo uses a timed, prerecorded-in-code sample transcript, not microphone input, speech recognition, or live phone audio. The “audio” visualization is decorative.
- Objection and sentiment labels are scripted examples, not model output. Sample insight figures are not measured results; the displayed coaching-impact comparison is illustrative and does not establish causation.
- No authentication, persistence, real call controls, provider webhooks, or production privacy/security controls are included.
- Before recording, transcribing, streaming, or analyzing real calls, obtain any consent required from every participant under applicable law and organizational policy. Clearly notify participants, provide a way to opt out, minimize collected data, restrict access, set retention/deletion rules, and avoid using sentiment or AI suggestions as the sole basis for consequential decisions.


