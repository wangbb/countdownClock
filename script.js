const minutesInput = document.querySelector("#minutes");
const secondsInput = document.querySelector("#seconds");
const display = document.querySelector("#display");
const statusText = document.querySelector("#status");
const startBtn = document.querySelector("#start-btn");
const pauseBtn = document.querySelector("#pause-btn");
const resetBtn = document.querySelector("#reset-btn");

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
