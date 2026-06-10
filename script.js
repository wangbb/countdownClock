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

function startTimer() {
  if (timerId) {
    return;
  }

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
