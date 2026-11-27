"use strict";

(function () {
  const { questions, thirdQuestions, secondQuestions, legacyQuestions, isCorrect, points } = ChristmasQuiz;
  const banks = [legacyQuestions, secondQuestions, thirdQuestions, questions];
  const currentVersion = banks.length;
  const keyFor = version => `brain_train_christmas_quiz_2026_v${version}`;
  const app = document.getElementById("app");
  let state = null;
  const savedStates = Array(currentVersion).fill(null);
  let timer = null;
  let renderId = 0;
  const versionOf = data => data.version || 1;
  const quizQuestions = () => banks[versionOf(state) - 1];
  const mapCountryName = id => ChristmasQuizMap.countryName(id);

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function store() {
    try { localStorage.setItem(keyFor(versionOf(state)), JSON.stringify(state)); return true; }
    catch (error) {
      console.error("Could not save quiz progress.", error);
      alert("Your quiz progress could not be saved. Check your browser storage settings before continuing.");
      return false;
    }
  }
  function read(version) {
    try {
      const saved = localStorage.getItem(keyFor(version));
      if (!saved) return null;
      const data = JSON.parse(saved);
      if (typeof data.name !== "string" || !Array.isArray(data.answers) || data.answers.length > questions.length ||
          data.answers.some(a => typeof a.correct !== "boolean" || !Number.isFinite(a.elapsed) || !Number.isInteger(a.score) ||
            (a.answer !== undefined && typeof a.answer !== "string") ||
            (version !== 1 && typeof a.answer !== "string")) ||
          (version === 1 ? data.version !== undefined : data.version !== version) ||
          !(data.startedAt === null || Number.isFinite(data.startedAt))) {
        throw new Error("Stored quiz data has an invalid format.");
      }
      return data;
    } catch (error) {
      console.error("Could not read quiz progress.", error);
      app.innerHTML = `<section class="card"><h1>Quiz data could not be read</h1>
        <p>Check browser storage. Your existing data has not been overwritten.</p></section>`;
      return undefined;
    }
  }
  function clearTimer() { if (timer !== null) clearInterval(timer); timer = null; }
  function restart() {
    if (versionOf(state) === currentVersion) {
      if (!confirm("Start a new attempt? Your current quiz result on this device will be removed.")) return;
      try { localStorage.removeItem(keyFor(currentVersion)); }
      catch (error) { console.error("Could not clear quiz progress.", error); alert("Could not start a new attempt. Check browser storage."); return; }
      savedStates[currentVersion - 1] = null;
    }
    state = null;
    render();
  }
  function intro() {
    app.innerHTML = `<section class="card">
      <div class="eyebrow">A festive challenge</div>
      <h1>The Christmas Quiz 🎄</h1>
      <p class="muted">Same 30 questions for everyone. Start at zero and send your result to the host.</p>
      <ul class="rules">
        <li>Correct answer: <strong>100 points</strong>. Up to <strong>50 bonus points</strong> for speed; the bonus decreases to zero after 30 seconds.</li>
        <li>No time limit. Wrong answers score zero. Your timer keeps running if you leave or reload the page.</li>
        <li>For picture rounds, type the person's first name first. Capital letters do not matter. The film question comes next.</li>
        <li>Answers are not revealed during the quiz. Play once, without outside help, then share your score.</li>
      </ul>
      <label for="player-name">Your name</label>
      <input id="player-name" maxlength="60" autocomplete="name" placeholder="Enter your name">
      <p class="error" id="error" role="alert"></p>
      <button class="btn" data-action="start">Start quiz</button>
      <p class="muted">Results stay on your device; there is no shared leaderboard.</p>
      ${savedStates.map((s, i) => s && i < currentVersion - 1 && s.answers.length === 30 ? `<button class="btn secondary" data-action="edition" data-version="${i + 1}">View earlier result (edition ${i + 1})</button>` : "").join("")}
      <a href="../">Back to Brain Train</a>
    </section>`;
  }
  function result() {
    clearTimer();
    if (quizQuestions().some(question => question.type === "map") && (typeof ChristmasQuizMapData === "undefined" || typeof ChristmasQuizMap === "undefined")) {
      console.error("Quiz map resources could not be loaded.");
      app.innerHTML = `<section class="card"><h2>Map unavailable</h2>
        <p>Check your connection and reload the page to view your saved result.</p></section>`;
      return;
    }
    const correct = state.answers.filter(a => a.correct).length;
    const score = state.answers.reduce((sum, a) => sum + a.score, 0);
    const elapsed = state.answers.reduce((sum, a) => sum + a.elapsed, 0) / 1000;
    const edition = `edition ${versionOf(state)}`;
    const message = `Brain Train Christmas Quiz (${edition})\n${state.name}\nScore: ${score} / 4500\nCorrect: ${correct} / 30\nTotal answer time: ${elapsed.toFixed(1)} s`;
    const activeQuestions = quizQuestions();
    const review = state.answers.map((answer, i) => {
      const question = activeQuestions[i];
      const expected = question.type === "person" ? question.full : question.type === "map" ? mapCountryName(question.correct[0]) : question.correct.join(" / ");
      const chosen = answer.answer === undefined ? "Not recorded in this earlier version" : escapeHtml(question.type === "map" ? mapCountryName(answer.answer) : answer.answer);
      return `<li class="review-item ${answer.correct ? "correct" : "incorrect"}">
        <div class="review-heading"><strong>${i + 1}. ${escapeHtml(question.category)}</strong><span>${answer.correct ? "✓ Correct" : "✕ Incorrect"}</span></div>
        <p>${escapeHtml(question.prompt)}</p>
        ${question.image ? `<img class="review-picture" src="${question.image}" alt="Picture for question ${i + 1}">` : ""}
        ${question.graphic ? `<div class="review-flag">${question.graphic}</div>` : ""}
        <div>Your answer: <strong>${chosen}</strong></div>
        <div>Correct answer: <strong>${escapeHtml(expected)}</strong></div>
        ${question.note ? `<p class="muted">${escapeHtml(question.note)}</p>` : ""}
        <div class="muted">${(answer.elapsed / 1000).toFixed(1)} s · ${answer.score} points</div>
      </li>`;
    }).join("");
    app.innerHTML = `<section class="card">
      <div class="eyebrow">${versionOf(state) === currentVersion ? "Quiz complete" : "Earlier quiz complete"}</div><h1>Nice work, ${escapeHtml(state.name)}! 🎉</h1>
      <div class="score">${score}</div><div class="muted">points out of 4,500</div>
      <div class="score-grid"><div class="metric"><strong>${correct}/30</strong><span>correct answers</span></div>
        <div class="metric"><strong>${elapsed.toFixed(1)} s</strong><span>total answer time</span></div></div>
      <p>Send this result or a screenshot to your host. Scores are calculated locally and are not independently verified.</p>
      <label for="result-text">Your result</label><textarea id="result-text" readonly>${escapeHtml(message)}</textarea>
      <button class="btn" data-action="share">Share result</button>
      <button class="btn secondary" data-action="copy">Copy result</button>
      <p id="share-status" class="muted" role="status"></p>
      ${savedStates.map((s, i) => s && i + 1 !== versionOf(state) && s.answers.length === 30 ? `<button class="btn secondary" data-action="edition" data-version="${i + 1}">View ${i + 1 === currentVersion ? "current" : "earlier"} result (edition ${i + 1})</button>` : "").join("")}
      ${versionOf(state) !== currentVersion && savedStates[currentVersion - 1] && savedStates[currentVersion - 1].answers.length < 30 ? `<button class="btn secondary" data-action="edition" data-version="${currentVersion}">Return to current quiz</button>` : ""}
      <button class="btn secondary" data-action="restart">Start a new attempt</button>
      <section class="review"><h2>Answer review</h2>
        <p class="muted">${versionOf(state) !== 1 ? "See what you answered and the correct answer for each question." : "Earlier attempt: correct/incorrect results are preserved. Answers submitted before the review update were not recorded."}</p>
        <ol class="review-list">${review}</ol></section>
      <p><a href="../">Back to Brain Train</a></p>
    </section>`;
  }
  async function renderQuestion() {
    clearTimer();
    const currentRender = ++renderId;
    const index = state.answers.length;
    const activeQuestions = quizQuestions();
    const question = activeQuestions[index];
    if (question.type === "map" && (typeof ChristmasQuizMapData === "undefined" || typeof ChristmasQuizMap === "undefined")) {
      console.error("Quiz map resources could not be loaded.");
      app.innerHTML = `<section class="card"><h2>Map unavailable</h2>
        <p>Check your connection and reload the page. Your quiz progress is saved.</p></section>`;
      return;
    }
    app.innerHTML = `<section class="card"><p class="muted">Loading question…</p><p id="error" class="error" role="alert"></p></section>`;
    if (question.image) {
      try {
        await new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = resolve;
          image.onerror = () => reject(new Error("Picture could not be loaded."));
          image.src = question.image;
        });
      } catch (error) {
        console.error("Could not load question image.", error);
        if (currentRender === renderId) app.innerHTML = `<section class="card"><h2>Picture unavailable</h2>
          <p>Check your connection and try again. Your progress is saved and the timer has not started for a new question.</p>
          <button class="btn" data-action="retry">Try again</button></section>`;
        return;
      }
    }
    if (currentRender !== renderId || !state || state.answers.length !== index) return;
    const options = question.type === "map" ? ChristmasQuizMap.markup() : question.type === "choice"
      ? `<div class="choices">${question.options.map((option, i) => `<button data-action="answer" data-index="${i}">${escapeHtml(option)}</button>`).join("")}</div>`
      : `<form id="answer-form"><label for="answer">First name</label>
        <input id="answer" autocomplete="off" autocapitalize="words" maxlength="80" placeholder="Type a first name">
        <p class="error" id="error" role="alert"></p><button class="btn" type="submit">Submit answer</button></form>`;
    app.innerHTML = `<div class="topline"><span>QUESTION ${index + 1} / ${activeQuestions.length}</span><span id="clock">0.0 s</span></div>
      <div class="progress"><span style="width:${index / activeQuestions.length * 100}%"></span></div>
      <section class="card"><div class="eyebrow">${escapeHtml(question.category)}</div>
        <h2>${escapeHtml(question.prompt)}</h2>
        ${question.image ? `<img class="picture" src="${question.image}" alt="Picture for this question">` : ""}
        ${question.graphic ? `<div class="flag">${question.graphic}</div>` : ""}
        ${options}</section>`;
    if (question.type === "map") ChristmasQuizMap.bind(app, submit);
    if (state.startedAt === null) {
      state.startedAt = Date.now();
      if (!store()) { state.startedAt = null; app.innerHTML = `<section class="card"><h2>Unable to save progress</h2><button class="btn" data-action="retry">Try again</button></section>`; return; }
    }
    const updateClock = () => {
      const clock = document.getElementById("clock");
      if (clock) clock.textContent = `${(Math.max(0, Date.now() - state.startedAt) / 1000).toFixed(1)} s`;
    };
    updateClock();
    timer = setInterval(updateClock, 100);
    const form = document.getElementById("answer-form");
    if (form) form.addEventListener("submit", event => {
      event.preventDefault();
      const answer = document.getElementById("answer").value.trim();
      if (!answer) { document.getElementById("error").textContent = "Please enter a first name."; return; }
      submit(answer);
    });
  }
  function submit(answer) {
    if (!state || state.startedAt === null || state.answers.length >= questions.length) return;
    const question = quizQuestions()[state.answers.length];
    const elapsed = Math.max(0, Date.now() - state.startedAt);
    const correct = isCorrect(question, answer);
    const oldStart = state.startedAt;
    state.answers.push({ correct, elapsed, score: points(correct, elapsed), answer });
    state.startedAt = null;
    if (!store()) { state.answers.pop(); state.startedAt = oldStart; return; }
    render();
  }
  function render() {
    renderId++;
    clearTimer();
    if (!state) intro();
    else if (state.answers.length === questions.length) result();
    else renderQuestion();
  }
  app.addEventListener("click", async event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "start") {
      const name = document.getElementById("player-name").value.trim();
      if (!name) { document.getElementById("error").textContent = "Please enter your name."; return; }
      state = { version: currentVersion, name, answers: [], startedAt: null };
      if (!store()) { state = null; return; }
      savedStates[currentVersion - 1] = state;
      render();
    } else if (action === "answer") {
      const question = quizQuestions()[state.answers.length];
      const index = Number(button.dataset.index);
      if (question.type !== "choice" || !Number.isInteger(index) || index < 0 || index >= question.options.length) return;
      submit(question.options[index]);
    } else if (action === "retry") render();
    else if (action === "restart") restart();
    else if (action === "edition") {
      const version = Number(button.dataset.version);
      if (Number.isInteger(version) && version >= 1 && version <= currentVersion && savedStates[version - 1]) {
        state = savedStates[version - 1]; render();
      }
    }
    else if (action === "copy") {
      const text = document.getElementById("result-text");
      try {
        if (!navigator.clipboard) throw new Error("Clipboard API unavailable.");
        await navigator.clipboard.writeText(text.value);
        document.getElementById("share-status").textContent = "Copied. Send it to your host.";
      } catch (error) {
        console.error("Could not copy result.", error);
        text.focus(); text.select();
        document.getElementById("share-status").textContent = "Copy the selected text manually, or send a screenshot.";
      }
    } else if (action === "share") {
      if (!navigator.share) { document.getElementById("share-status").textContent = "Sharing is unavailable. Copy the result or send a screenshot."; return; }
      try { await navigator.share({ title: "Brain Train Christmas Quiz", text: document.getElementById("result-text").value }); }
      catch (error) {
        if (error.name !== "AbortError") {
          console.error("Could not share result.", error);
          document.getElementById("share-status").textContent = "Could not share. Copy the result or send a screenshot.";
        }
      }
    }
  });
  for (let version = 1; version <= currentVersion; version++) {
    savedStates[version - 1] = read(version);
    if (savedStates[version - 1] === undefined) return;
  }
  state = [...savedStates].reverse().find(Boolean) || null;
  render();
})();
