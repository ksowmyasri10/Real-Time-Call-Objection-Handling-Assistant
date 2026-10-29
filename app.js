const scenarios = {
  budget: {
    name: "Morgan Chen",
    initials: "MC",
    company: "Northstar Labs",
    title: "New opportunity",
    lines: [
      { speaker: "Jordan", initials: "JD", role: "agent", text: "Thanks for making time, Morgan. What would make a new support platform worthwhile for your team?", time: "00:08" },
      { speaker: "Morgan", initials: "MC", role: "contact", text: "We’re looking to reduce our first-response time without adding more work for the team.", time: "00:16" },
      { speaker: "Jordan", initials: "JD", role: "agent", text: "That makes sense. Where are you seeing the biggest delays today?", time: "00:24" },
      { speaker: "Morgan", initials: "MC", role: "contact", text: "Mostly overnight. But honestly, your pricing is higher than we had planned for.", time: "00:33", objection: "Budget concern detected" },
      { speaker: "Jordan", initials: "JD", role: "agent", text: "I hear you. Could we look at the time your team might save and see whether a smaller starting plan fits?", time: "00:44" },
      { speaker: "Morgan", initials: "MC", role: "contact", text: "A smaller plan could work. What would that include?", time: "00:55", positive: true },
      { speaker: "Jordan", initials: "JD", role: "agent", text: "We can start with the overnight queue and review results together after a month.", time: "01:07" },
      { speaker: "Morgan", initials: "MC", role: "contact", text: "That feels like a reasonable way to test it.", time: "01:19", positive: true },
    ],
    objection: "“Your pricing is higher than we had planned for.”",
    label: "BUDGET CONCERN",
    primary: "I hear you. Could we look at the time your team might save and see whether a smaller starting plan fits?",
    alternatives: [
      "Would it help to compare the cost with the time your team currently spends on overnight coverage?",
      "Which outcomes would you need to see to feel confident the investment is worthwhile?",
    ],
    sentiment: "Cautiously open",
    score: 62,
    category: "Budget",
  },
  incumbent: {
    name: "Alex Rivera",
    initials: "AR",
    company: "Evergreen Health",
    title: "Renewal conversation",
    lines: [
      { speaker: "Jordan", initials: "JD", role: "agent", text: "How is your current setup supporting the team during busy periods?", time: "00:08" },
      { speaker: "Alex", initials: "AR", role: "contact", text: "We have a provider in place and the team already knows how to use it.", time: "00:17" },
      { speaker: "Jordan", initials: "JD", role: "agent", text: "It’s helpful that you have a familiar process. What’s working especially well?", time: "00:26" },
      { speaker: "Alex", initials: "AR", role: "contact", text: "Our agents know it, but our weekend response times still slip.", time: "00:35" },
      { speaker: "Jordan", initials: "JD", role: "agent", text: "That’s useful context. Is the weekend gap something you’re actively hoping to improve?", time: "00:44" },
      { speaker: "Alex", initials: "AR", role: "contact", text: "Possibly, but switching providers sounds like a lot of disruption.", time: "00:53", objection: "Existing provider concern detected" },
      { speaker: "Jordan", initials: "JD", role: "agent", text: "That’s a fair concern. Would a limited pilot let you compare weekend coverage without replacing what already works?", time: "01:04" },
      { speaker: "Alex", initials: "AR", role: "contact", text: "I’d be open to a low-risk comparison.", time: "01:16", positive: true },
    ],
    objection: "“Switching providers sounds like a lot of disruption.”",
    label: "EXISTING PROVIDER",
    primary: "That’s a fair concern. Would a limited pilot let you compare weekend coverage without replacing what already works?",
    alternatives: [
      "What would need to stay unchanged for a trial to feel low-risk for your team?",
      "We could map a gradual rollout around your existing workflow. Would that be worth exploring?",
    ],
    sentiment: "Open to exploring",
    score: 71,
    category: "Existing provider",
  },
};

const $ = (selector) => document.querySelector(selector);
const transcript = $("#transcript");
const coachContent = $("#coachContent");
$("#currentDate").textContent = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
}).format(new Date()).toUpperCase();
const waveform = $("#waveform");
let state = "idle";
let tick = null;
let elapsed = 0;
let nextLine = 0;
let toastTimeout = null;
let selectedReplyCount = 0;
let lastReport = null;

for (let index = 0; index < 38; index += 1) {
  const bar = document.createElement("i");
  bar.style.setProperty("--bar-height", `${5 + ((index * 17 + 3) % 18)}px`);
  bar.style.setProperty("--delay", `${(index % 8) * -0.11}s`);
  waveform.append(bar);
}

function currentScenario() {
  return scenarios[$("#scenarioSelect").value] || scenarios.budget;
}

function switchPage(page) {
  const insights = page === "insights";
  $("#livePage").classList.toggle("hidden", insights);
  $("#insightsPage").classList.toggle("hidden", !insights);
  $("#breadcrumbCurrent").textContent = insights ? "Call insights" : "Live workspace";
  document.querySelectorAll(".nav-item").forEach((item) => {
    const active = item.dataset.page === page;
    item.classList.toggle("active", active);
    if (active) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("visible"), 2600);
}

function addTranscriptLine(line) {
  $("#emptyTranscript")?.remove();
  const element = document.createElement("article");
  element.className = "transcript-line";
  const avatar = document.createElement("span");
  avatar.className = `avatar ${line.role === "agent" ? "speaker-agent" : "speaker-contact"}`;
  avatar.textContent = line.initials;
  const content = document.createElement("div");
  content.className = "line-content";
  const metadata = document.createElement("div");
  metadata.className = "line-meta";
  const speaker = document.createElement("strong");
  speaker.textContent = line.speaker;
  const time = document.createElement("span");
  time.textContent = line.time;
  metadata.append(speaker, time);
  const text = document.createElement("p");
  text.textContent = line.text;
  content.append(metadata, text);
  if (line.objection) {
    const badge = document.createElement("span");
    badge.className = "objection-tag";
    badge.textContent = `✦ ${line.objection}`;
    content.append(badge);
    renderCoach();
  } else if (line.positive) {
    setSentiment("Positive", "The customer sounds open to the next step.", 82);
  }
  element.append(avatar, content);
  transcript.append(element);
  transcript.scrollTop = transcript.scrollHeight;
}

function setSentiment(label, description, score) {
  const reading = $(".sentiment-reading");
  const face = $(".sentiment-face");
  const meter = $(".sentiment-meter");
  const note = $("#sentimentNote");
  if (!reading) return;
  reading.textContent = label;
  face.textContent = label === "Positive" ? "☺" : "◡";
  face.style.color = label === "Positive" ? "#3d9d72" : "#d69a36";
  const segments = Math.max(1, Math.ceil(score / 20));
  [...meter.children].forEach((segment, index) => {
    segment.style.background = index < segments ? (score >= 75 ? "#60b98c" : "#e5b455") : "#f1eadb";
  });
  note.textContent = description;
}

function renderCoach() {
  const scenario = currentScenario();
  coachContent.replaceChildren();
  const objection = document.createElement("div");
  objection.className = "coach-objection";
  const title = document.createElement("div");
  title.className = "objection-title";
  title.innerHTML = `<span>✦ ${scenario.label}</span><span class="confidence">DEMO CUE</span>`;
  const quote = document.createElement("p");
  quote.className = "objection-quote";
  quote.textContent = scenario.objection;
  objection.append(title, quote);

  const suggested = document.createElement("section");
  const label = document.createElement("p");
  label.className = "coach-section-label";
  label.textContent = "SUGGESTED RESPONSE";
  const card = document.createElement("div");
  card.className = "suggestion-card";
  const reply = document.createElement("p");
  reply.textContent = scenario.primary;
  const useButton = document.createElement("button");
  useButton.type = "button";
  useButton.textContent = "Use this response →";
  useButton.addEventListener("click", () => selectReply(scenario.primary));
  card.append(reply, useButton);
  suggested.append(label, card);

  const alternatives = document.createElement("section");
  const alternativeLabel = document.createElement("p");
  alternativeLabel.className = "coach-section-label";
  alternativeLabel.textContent = "ALTERNATIVES";
  const options = document.createElement("div");
  options.className = "alternative-replies";
  scenario.alternatives.forEach((text) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.addEventListener("click", () => selectReply(text));
    options.append(button);
  });
  alternatives.append(alternativeLabel, options);

  const sentiment = document.createElement("section");
  sentiment.innerHTML = `<p class="coach-section-label">CUSTOMER SENTIMENT</p><div class="sentiment-row"><span class="sentiment-title"><span class="sentiment-face">◡</span> Live conversation</span><span class="sentiment-reading">${scenario.sentiment}</span></div><div class="sentiment-meter" aria-label="Sentiment score ${scenario.score} out of 100">${"<i></i>".repeat(5)}</div><p id="sentimentNote" style="margin:7px 0 0;color:#969dad;font-size:8px;line-height:1.5">Listening for shifts in tone and engagement.</p>`;
  coachContent.append(objection, suggested, alternatives, sentiment);
  $("#coachStatus").textContent = "COACHING";
  $("#coachStatus").classList.add("active");
}

async function selectReply(text) {
  selectedReplyCount += 1;
  try {
    await navigator.clipboard.writeText(text);
    showToast("Suggested response copied. Make it your own before replying.");
  } catch {
    showToast("Suggestion selected. Make it your own before replying.");
  }
}

function updateTimer() {
  elapsed += 1;
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");
  $("#callTimer").textContent = `${minutes}:${seconds}`;
}

function updateContact() {
  const scenario = currentScenario();
  $("#contactName").textContent = scenario.name;
  $("#contactAvatar").textContent = scenario.initials;
  $("#contactDetail").innerHTML = `${scenario.company} <span class="inline-dot">·</span> ${scenario.title}`;
}

function startCall() {
  if (state === "active") return;
  state = "active";
  elapsed = 0;
  nextLine = 0;
  selectedReplyCount = 0;
  transcript.replaceChildren();
  updateContact();
  $("#callTimer").textContent = "00:00";
  $("#connectionLabel").textContent = "Demo call in progress";
  $("#connectionDot").classList.add("connected");
  $("#callStatusText").textContent = "Simulated";
  $("#callStatusDot").classList.add("active");
  $("#audioStrip").classList.add("active");
  $("#audioLabel").textContent = "SIMULATED AUDIO";
  $("#audioQuality").textContent = "Demo";
  $("#transcriptLive").innerHTML = "<span></span> Simulated transcript";
  $("#transcriptLive").classList.add("active");
  $("#startCallButton").classList.add("hidden");
  $("#endCallButton").classList.remove("hidden");
  $("#coachStatus").textContent = "LISTENING";
  $("#coachStatus").classList.add("active");
  coachContent.innerHTML = '<div class="coach-welcome"><div class="welcome-orbit"><span>✦</span></div><strong>Listening to the conversation</strong><p>In this demo, the transcript plays from a sample script. No audio is captured or streamed.</p></div>';
  addTranscriptLine({ speaker: "Jordan", initials: "JD", role: "agent", text: "The simulated call has started. Sample transcript is playing.", time: "00:00" });
  addTranscriptLine(currentScenario().lines[nextLine]);
  nextLine += 1;
  tick = setInterval(() => {
    updateTimer();
    if (elapsed % 4 === 0 && nextLine < currentScenario().lines.length) {
      addTranscriptLine(currentScenario().lines[nextLine]);
      nextLine += 1;
    }
    if (nextLine >= currentScenario().lines.length) {
      clearInterval(tick);
      tick = setInterval(updateTimer, 1000);
    }
  }, 1000);
  showToast("Demo call started. Sample conversation is playing.");
}

function endCall() {
  if (state !== "active") return;
  state = "idle";
  clearInterval(tick);
  const scenario = currentScenario();
  const objectionSeen = nextLine > 0 && scenario.lines.slice(0, nextLine).some((line) => line.objection);
  lastReport = {
    duration: $("#callTimer").textContent,
    category: objectionSeen ? scenario.category : "No objection observed",
    suggestions: selectedReplyCount,
    lines: nextLine,
  };
  $("#connectionLabel").textContent = "Ready to connect";
  $("#connectionDot").classList.remove("connected");
  $("#callStatusText").textContent = "Call ended";
  $("#callStatusDot").classList.remove("active");
  $("#audioStrip").classList.remove("active");
  $("#audioLabel").textContent = "AUDIO STREAM";
  $("#audioQuality").textContent = "—";
  $("#transcriptLive").innerHTML = "<span></span> Call ended";
  $("#transcriptLive").classList.remove("active");
  $("#startCallButton").classList.remove("hidden");
  $("#endCallButton").classList.add("hidden");
  $("#coachStatus").textContent = "STANDING BY";
  $("#coachStatus").classList.remove("active");
  const report = $("#reportBanner");
  report.hidden = false;
  report.textContent = `Last demo call: ${scenario.name} · ${lastReport.duration} · ${lastReport.category} · ${lastReport.suggestions ? "A response was selected" : "No response selected"}. This is simulated sample data, not a real call report.`;
  $("#callsToday").textContent = "13";
  $("#objectionsHandled").textContent = objectionSeen ? "9" : "8";
  showToast("Demo call ended. View Call insights for the sample summary.");
}

$("#startCallButton").addEventListener("click", startCall);
$("#endCallButton").addEventListener("click", endCall);
$("#scenarioSelect").addEventListener("change", () => {
  if (state === "active") {
    showToast("End the demo call before switching scenarios.");
    $("#scenarioSelect").value = Object.keys(scenarios).find((key) => scenarios[key].name === $("#contactName").textContent) || "budget";
    return;
  }
  updateContact();
});
document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => switchPage(button.dataset.page));
});
$("#helpButton").addEventListener("click", () => {
  showToast("See README.md and docs/interview-guide.pdf for the architecture and demo walkthrough.");
});
