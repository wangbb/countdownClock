const minutesInput = document.querySelector("#minutes");
const secondsInput = document.querySelector("#seconds");
const display = document.querySelector("#display");
const statusText = document.querySelector("#status");
const startBtn = document.querySelector("#start-btn");
const pauseBtn = document.querySelector("#pause-btn");
const resetBtn = document.querySelector("#reset-btn");
const particleLayer = document.querySelector("#particle-layer");

let totalSeconds = getInputSeconds();
let remainingSeconds = totalSeconds;
let timerId = null;
let audioContext = null;

function getInputSeconds() {
  const minutes = Math.max(0, Number(minutesInput.value) || 0);
  const seconds = Math.min(59, Math.max(0, Number(secondsInput.value) || 0));
  secondsInput.value = seconds;
  return minutes * 60 + seconds;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function updateDisplay() {
  display.textContent = formatTime(remainingSeconds);
}

function setStatus(message, isDone = false) {
  statusText.textContent = message;
  statusText.classList.toggle("done", isDone);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

function prepareAudio() {
  audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function playAlarmSound() {
  prepareAudio();

  const now = audioContext.currentTime;
  const notes = [880, 660, 880];

  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const startTime = now + index * 0.22;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.25, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.2);
  });
}

function launchParticles() {
  const colors = ["#1f7a6d", "#f2b84b", "#e85d75", "#3f83f8", "#7c5cff"];
  const particleCount = 72;

  for (let index = 0; index < particleCount; index += 1) {
    const particle = document.createElement("span");
    const angle = Math.random() * Math.PI * 2;
    const distance = 90 + Math.random() * 230;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const size = 6 + Math.random() * 9;

    particle.className = "particle";
    particle.style.setProperty("--x", `${x}px`);
    particle.style.setProperty("--y", `${y}px`);
    particle.style.setProperty("--rotate", `${Math.random() * 720}deg`);
    particle.style.setProperty("--particle-color", colors[index % colors.length]);
    particle.style.left = `${45 + Math.random() * 10}%`;
    particle.style.top = `${42 + Math.random() * 14}%`;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.animationDelay = `${Math.random() * 120}ms`;

    particleLayer.appendChild(particle);
    particle.addEventListener("animationend", () => particle.remove());
  }
}

function startTimer() {
  if (timerId) {
    return;
  }

  prepareAudio();

  if (remainingSeconds <= 0) {
    totalSeconds = getInputSeconds();
    remainingSeconds = totalSeconds;
  }

  if (remainingSeconds <= 0) {
    setStatus("請先輸入大於 0 的時間。", true);
    updateDisplay();
    return;
  }

  setStatus("倒數中...");
  startBtn.disabled = true;

  timerId = setInterval(() => {
    remainingSeconds -= 1;
    updateDisplay();

    if (remainingSeconds <= 0) {
      stopTimer();
      startBtn.disabled = false;
      setStatus("時間到！", true);
      playAlarmSound();
      launchParticles();
    }
  }, 1000);
}

function pauseTimer() {
  if (!timerId) {
    return;
  }

  stopTimer();
  startBtn.disabled = false;
  setStatus("已暫停。");
}

function resetTimer() {
  stopTimer();
  totalSeconds = getInputSeconds();
  remainingSeconds = totalSeconds;
  startBtn.disabled = false;
  setStatus("已重設。");
  updateDisplay();
}

function syncFromInputs() {
  if (timerId) {
    return;
  }

  totalSeconds = getInputSeconds();
  remainingSeconds = totalSeconds;
  setStatus("設定時間後按開始。");
  updateDisplay();
}

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);
minutesInput.addEventListener("input", syncFromInputs);
secondsInput.addEventListener("input", syncFromInputs);

updateDisplay();
