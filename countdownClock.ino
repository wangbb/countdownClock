/*
 * 我要用arduino nano 製作一個倒數計時器，硬體方面要整合幾個按鈕、LED矩陣、蜂鳴器。

蜂鳴器接在腳位D6；

按鈕共4個，是最普通的小型按鈕，接線腳位在D2～D5

[b1], 每按一下，倒數秒數 往上加10；

[b2], 每按一下，倒數分鐘數 往上加5；

[b3], 每按一下，倒數時間歸零；並且能夠讓鬧鐘停止聲音

[b4], 開始/暫停。



LED點矩陣，型號是MAX7219，共8＊8顆LED燈泡。是用來顯示剩餘時間的。

LED的64顆燈泡，我想分成左邊32顆，右邊32顆來看待。

左邊的32顆代表「分鐘數」；

右邊的32顆代表「秒數」（比較特別的是右邊的一顆燈泡代表的是2秒鐘；2顆燈泡沒有用上）



使用時，若使用者按下[b1]（亦即，倒數增加10秒），右方的燈泡需一次累加亮起5顆燈泡。超過60的話，需進位成1分鐘，並在左方多亮起一顆燈泡。

若使用者按下[b2]（亦即，倒數增加5分鐘），左方的燈泡需一次累加亮起5顆燈泡。上限是32顆燈泡。

按下[b3]時，倒數時間重置為0，LED螢幕消失。若倒數歸零時，蜂鳴器響起，此時按下[b3]也會停止蜂鳴器。

按下[b4]，可暫停或開始倒數。



請整理一下我的需求，看是否有缺失之處。
 */

#include "LedControl.h"

// 定義腳位
const int PIN_B1_SEC = 2;   // +10秒
const int PIN_B2_MIN = 3;   // +5分鐘
const int PIN_B3_RST = 4;   // 重置/停止鬧鐘
const int PIN_B4_STA = 5;   // 開始/暫停
const int PIN_BUZZER = 6;   // 蜂鳴器

// MAX7219 接線: DIN=11, CLK=12, CS=10
LedControl lc = LedControl(11, 12, 10, 1); 

// 計時變數
int minutes = 0;
int seconds = 0;
bool isRunning = false;
bool isAlarming = false;

// 倒數計時用計時器
unsigned long lastTickTime = 0;
unsigned long lastDebounceTime = 0;
const int debounceDelay = 200; // 按鈕去彈跳時間 (ms)

void setup() {
  // 設定按鈕為上拉電阻模式 (按下為 LOW)
  pinMode(PIN_B1_SEC, INPUT_PULLUP);
  pinMode(PIN_B2_MIN, INPUT_PULLUP);
  pinMode(PIN_B3_RST, INPUT_PULLUP);
  pinMode(PIN_B4_STA, INPUT_PULLUP);
  pinMode(PIN_BUZZER, OUTPUT);

  // 初始化 MAX7219
  lc.shutdown(0, false);       // 喚醒顯示器
  lc.setIntensity(0, 5);       // 設定亮度 (0~15)
  lc.clearDisplay(0);          // 清除螢幕
  
  Serial.begin(9600);
}

void loop() {
  handleButtons();
  
  if (isRunning) {
    countdown();
  }

  if (isAlarming) {
    alarmSignal();
  }

  updateDisplay();
}

// --- 按鈕處理邏輯 ---
void handleButtons() {
  if (millis() - lastDebounceTime < debounceDelay) return;

  // B1: +10秒
  if (digitalRead(PIN_B1_SEC) == LOW) {
    seconds += 10;
    if (seconds >= 60) {
      minutes += 1;
      seconds -= 60;
    }
    if (minutes > 32) minutes = 32; // 上限 32 分鐘
    lastDebounceTime = millis();
  }

  // B2: +5分鐘
  if (digitalRead(PIN_B2_MIN) == LOW) {
    minutes += 5;
    if (minutes > 32) minutes = 32;
    lastDebounceTime = millis();
  }

  // B3: 重置 / 停止鬧鐘
  if (digitalRead(PIN_B3_RST) == LOW) {
    minutes = 0;
    seconds = 0;
    isRunning = false;
    isAlarming = false;
    noTone(PIN_BUZZER);
    lastDebounceTime = millis();
  }

  // B4: 開始 / 暫停
  if (digitalRead(PIN_B4_STA) == LOW) {
    if (minutes > 0 || seconds > 0) {
      isRunning = !isRunning;
    }
    lastDebounceTime = millis();
  }
}

// --- 倒數核心邏輯 ---
void countdown() {
  if (millis() - lastTickTime >= 1000) {
    lastTickTime = millis();

    if (seconds == 0 && minutes == 0) {
      isRunning = false;
      isAlarming = true;
    } else {
      if (seconds == 0) {
        minutes--;
        seconds = 59;
      } else {
        seconds--;
      }
    }
  }
}

// --- 鬧鐘聲音 ---
void alarmSignal() {
  // 簡單的嗶嗶聲
  int state = (millis() / 500) % 2; 
  if (state == 1) {
    tone(PIN_BUZZER, 1000);
  } else {
    noTone(PIN_BUZZER);
  }
}

// --- 顯示處理邏輯 (8x8 矩陣填充) ---
void updateDisplay() {
  lc.clearDisplay(0);

  // 1. 顯示左側 32 顆 (分鐘) - 欄位 0, 1, 2, 3
  for (int i = 0; i < minutes; i++) {
    int col = i / 8; // 0~3
    int row = i % 8; // 0~7
    lc.setLed(0, row, col, true);
  }

  // 2. 顯示右側 30 顆 (秒數, 每 2 秒亮一顆) - 欄位 4, 5, 6, 7
  int secLeds = seconds / 2;
  for (int j = 0; j < secLeds; j++) {
    int col = 4 + (j / 8); // 4~7
    int row = j % 8;       // 0~7
    lc.setLed(0, row, col, true);
  }
}
