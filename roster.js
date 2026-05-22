/**
 * 2026 年 5 月與 6 月工作排班表系統 - 核心邏輯
 */

// 預設員工清單
const DEFAULT_EMPLOYEES = [
  { id: "emp_1", name: "小明" },
  { id: "emp_2", name: "小華" },
  { id: "emp_3", name: "阿強" },
  { id: "emp_4", name: "美玲" },
  { id: "emp_5", name: "佳佳" }
];

// 班別定義
const SHIFT_TYPES = {
  morning: { code: "D", name: "早班", hours: 8, label: "08-16" },
  evening: { code: "E", name: "晚班", hours: 8, label: "16-24" },
  night: { code: "N", name: "夜班", hours: 8, label: "00-08" },
  off: { code: "OFF", name: "休假", hours: 0, label: "休" }
};

// 系統狀態
const RosterState = {
  employees: [],
  shifts: {}, // Key: YYYY-MM-DD, Value: Array of { empId, type }
  currentYear: 2026,
  currentMonth: 5, // 5 = 五月, 6 = 六月
  
  // 互動狀態
  editMode: "interactive", // "interactive" (點擊彈窗) 或 "paint" (筆刷點塗)
  activePaintEmpId: null,
  activePaintShiftType: null,
  
  init() {
    this.loadFromStorage();
    if (this.employees.length === 0) {
      this.employees = [...DEFAULT_EMPLOYEES];
    }
    
    // 如果排班資料是空的，生成 5 月 & 6 月的預設輪班表
    if (Object.keys(this.shifts).length === 0) {
      this.generateMockShifts();
    }
    
    this.updateUI();
  },
  
  loadFromStorage() {
    try {
      this.employees = JSON.parse(localStorage.getItem("roster_employees")) || [];
      this.shifts = JSON.parse(localStorage.getItem("roster_shifts")) || {};
      
      const savedMonth = localStorage.getItem("roster_current_month");
      if (savedMonth) {
        this.currentMonth = parseInt(savedMonth);
      }
    } catch (e) {
      console.error("Error loading roster from storage", e);
      this.employees = [];
      this.shifts = {};
    }
  },
  
  saveToStorage() {
    localStorage.setItem("roster_employees", JSON.stringify(this.employees));
    localStorage.setItem("roster_shifts", JSON.stringify(this.shifts));
    localStorage.setItem("roster_current_month", this.currentMonth);
  },
  
  // 自動生成 5 月與 6 月的輪班排班表
  generateMockShifts() {
    const startMay = new Date(2026, 4, 1); // 5/1
    const endJune = new Date(2026, 5, 30); // 6/30
    
    let currentDate = new Date(startMay);
    let cycleIndex = 0;
    
    while (currentDate <= endJune) {
      const dateStr = formatDate(currentDate);
      const dayOfWeek = currentDate.getDay(); // 0 = 週日, 6 = 週六
      
      // 基本輪班規則：
      // 5 位員工輪流分擔：早班 (2人)、晚班 (1人)、夜班 (1人)、休假 (1人)
      // 透過簡單的循環移位來分配
      const emp1 = this.employees[cycleIndex % this.employees.length].id;
      const emp2 = this.employees[(cycleIndex + 1) % this.employees.length].id;
      const emp3 = this.employees[(cycleIndex + 2) % this.employees.length].id;
      const emp4 = this.employees[(cycleIndex + 3) % this.employees.length].id;
      const emp5 = this.employees[(cycleIndex + 4) % this.employees.length].id;
      
      this.shifts[dateStr] = [
        { empId: emp1, type: "morning" },
        { empId: emp2, type: "morning" },
        { empId: emp3, type: "evening" },
        { empId: emp4, type: "night" },
        { empId: emp5, type: "off" }
      ];
      
      // 週五與週六微調，讓大家排休多一點
      if (dayOfWeek === 5 || dayOfWeek === 6) {
        // 微調特定人員的班表以作為示範
      }
      
      cycleIndex++;
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    this.saveToStorage();
  },
  
  addEmployee(name) {
    if (!name.trim()) return;
    const newEmp = {
      id: "emp_" + Date.now(),
      name: name.trim()
    };
    this.employees.push(newEmp);
    this.saveToStorage();
    this.updateUI();
  },
  
  deleteEmployee(empId) {
    this.employees = this.employees.filter(e => e.id !== empId);
    
    // 同時將此員工在排班表中的班表移除
    for (let date in this.shifts) {
      this.shifts[date] = this.shifts[date].filter(s => s.empId !== empId);
    }
    
    // 如果刪除的員工是當前塗鴉模式選中的員工，清除選擇
    if (this.activePaintEmpId === empId) {
      this.activePaintEmpId = null;
    }
    
    this.saveToStorage();
    this.updateUI();
  },
  
  // 設定某一天某個員工的班表
  setEmployeeShift(dateStr, empId, shiftType) {
    if (!this.shifts[dateStr]) {
      this.shifts[dateStr] = [];
    }
    
    // 移除已有的該員工當天排班
    this.shifts[dateStr] = this.shifts[dateStr].filter(s => s.empId !== empId);
    
    // 如果 shiftType 不是 'none'，則新增
    if (shiftType && shiftType !== "none") {
      this.shifts[dateStr].push({ empId, type: shiftType });
    }
    
    this.saveToStorage();
    this.updateUI();
  },
  
  // 清空所有排班資料並重新生成預設
  resetRoster() {
    if (confirm("您確定要重設 5 月與 6 月的排班表嗎？這會清除您所有的手動修改。")) {
      this.shifts = {};
      this.generateMockShifts();
      this.updateUI();
    }
  },
  
  updateUI() {
    renderMonthTitle();
    renderToolsPanel();
    renderCalendarGrid();
    calculateAndRenderStats();
  }
};

// 格式化日期為 YYYY-MM-DD
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}


// ==================== UI 渲染函式 ====================

// 1. 月份標題與按鈕
function renderMonthTitle() {
  const title = document.getElementById("current-month-label");
  if (title) {
    title.textContent = `2026 年 ${RosterState.currentMonth} 月份排班表`;
  }
  
  // 切換按鈕 active 狀態
  const btnMay = document.getElementById("btn-month-may");
  const btnJune = document.getElementById("btn-month-june");
  
  if (btnMay && btnJune) {
    if (RosterState.currentMonth === 5) {
      btnMay.classList.add("active");
      btnJune.classList.remove("active");
    } else {
      btnMay.classList.remove("active");
      btnJune.classList.add("active");
    }
  }
}

// 2. 左側工具箱（員工管理、班別塗鴉）
function renderToolsPanel() {
  // A. 渲染員工名單（塗鴉選取）
  const empGroup = document.getElementById("emp-selector-group");
  if (empGroup) {
    empGroup.innerHTML = "";
    RosterState.employees.forEach(emp => {
      const btn = document.createElement("button");
      btn.className = `selector-item ${RosterState.activePaintEmpId === emp.id && RosterState.editMode === "paint" ? "active" : ""}`;
      btn.innerHTML = `<span><i class="fas fa-user"></i> ${emp.name}</span>`;
      btn.onclick = () => {
        if (RosterState.editMode !== "paint") {
          setEditMode("paint");
        }
        RosterState.activePaintEmpId = emp.id;
        if (!RosterState.activePaintShiftType) {
          RosterState.activePaintShiftType = "morning"; // 預設早班
        }
        RosterState.updateUI();
      };
      empGroup.appendChild(btn);
    });
  }

  // B. 渲染班別塗鴉選取
  const shiftGroup = document.getElementById("shift-selector-group");
  if (shiftGroup) {
    shiftGroup.innerHTML = "";
    for (let type in SHIFT_TYPES) {
      const shift = SHIFT_TYPES[type];
      const btn = document.createElement("button");
      btn.className = `selector-item ${RosterState.activePaintShiftType === type && RosterState.editMode === "paint" ? "active" : ""}`;
      btn.innerHTML = `
        <span><span class="dot dot-${type}" style="display:inline-block; margin-right:8px;"></span>${shift.name} (${shift.label})</span>
      `;
      btn.onclick = () => {
        if (RosterState.editMode !== "paint") {
          setEditMode("paint");
        }
        RosterState.activePaintShiftType = type;
        if (!RosterState.activePaintEmpId && RosterState.employees.length > 0) {
          RosterState.activePaintEmpId = RosterState.employees[0].id;
        }
        RosterState.updateUI();
      };
      shiftGroup.appendChild(btn);
    });
  }

  // C. 渲染員工管理列表（新增/刪除）
  const empList = document.getElementById("employee-list-badge-container");
  if (empList) {
    empList.innerHTML = "";
    RosterState.employees.forEach(emp => {
      const badge = document.createElement("div");
      badge.className = "employee-row-badge";
      badge.innerHTML = `
        <span>${emp.name}</span>
        <button class="btn-delete-emp" title="刪除員工與其班表"><i class="fas fa-times-circle"></i></button>
      `;
      badge.querySelector(".btn-delete-emp").onclick = (e) => {
        e.stopPropagation();
        if (confirm(`確定要刪除員工「${emp.name}」嗎？這會一併清除該員工在 5/6 月的所有班表！`)) {
          RosterState.deleteEmployee(emp.id);
        }
      };
      empList.appendChild(badge);
    });
  }
  
  // D. 塗鴉橫幅狀態
  const banner = document.getElementById("paint-banner-info");
  if (banner) {
    if (RosterState.editMode === "paint" && RosterState.activePaintEmpId && RosterState.activePaintShiftType) {
      const emp = RosterState.employees.find(e => e.id === RosterState.activePaintEmpId);
      const shift = SHIFT_TYPES[RosterState.activePaintShiftType];
      banner.style.display = "flex";
      banner.innerHTML = `<i class="fas fa-paint-brush"></i> 點按日曆，將 <b>${emp ? emp.name : ""}</b> 塗上 <b>${shift.name}</b>`;
      document.body.classList.add("paint-mode-active");
    } else {
      banner.style.display = "none";
      document.body.classList.remove("paint-mode-active");
    }
  }
}

// 3. 渲染行事曆網格
function renderCalendarGrid() {
  const grid = document.getElementById("calendar-days");
  if (!grid) return;
  grid.innerHTML = "";
  
  const year = RosterState.currentYear;
  const month = RosterState.currentMonth; // 5 或 6
  
  // 獲取該月份第一天與最後一天的日期對象
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0); // 月份從 0 開始，下個月的第 0 天就是這個月最後一天
  
  const totalDays = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay(); // 0 = 週日, 5 = 週五
  
  // A. 行事曆前面的填充空格 (上個月的尾端)
  for (let i = 0; i < startDayOfWeek; i++) {
    const paddingCell = document.createElement("div");
    paddingCell.className = "calendar-cell inactive-date";
    grid.appendChild(paddingCell);
  }
  
  // B. 渲染本月的每一天
  for (let day = 1; day <= totalDays; day++) {
    const currentDate = new Date(year, month - 1, day);
    const dateStr = formatDate(currentDate);
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    const cell = document.createElement("div");
    cell.className = `calendar-cell glass-panel ${isWeekend ? "weekend-date" : ""}`;
    
    // 行事曆格頂部（日期數字與星期）
    const cellHeader = document.createElement("div");
    cellHeader.className = "cell-header";
    
    const dayName = isWeekend ? (dayOfWeek === 0 ? "日" : "六") : "";
    cellHeader.innerHTML = `
      <span class="date-number">${day}</span>
      <span style="font-size:11px; opacity:0.6;">${dayName}</span>
    `;
    cell.appendChild(cellHeader);
    
    // 渲染該日的班表列表
    const shiftList = document.createElement("div");
    shiftList.className = "cell-shift-list";
    
    const dayShifts = RosterState.shifts[dateStr] || [];
    
    // 排序：早班 -> 晚班 -> 夜班 -> 休假
    const order = ["morning", "evening", "night", "off"];
    dayShifts.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
    
    dayShifts.forEach(shiftAssignment => {
      const emp = RosterState.employees.find(e => e.id === shiftAssignment.empId);
      if (!emp) return; // 員工已被刪除
      
      const shiftMeta = SHIFT_TYPES[shiftAssignment.type];
      const badge = document.createElement("div");
      badge.className = `shift-badge badge-${shiftAssignment.type}`;
      badge.innerHTML = `
        <span class="shift-emp-name">${emp.name}</span>
        <span class="shift-lbl">${shiftMeta.code}</span>
      `;
      shiftList.appendChild(badge);
    });
    cell.appendChild(shiftList);
    
    // 點擊事件：根據目前模式進行塗鴉或是打開編輯彈窗
    cell.onclick = () => {
      if (RosterState.editMode === "paint" && RosterState.activePaintEmpId && RosterState.activePaintShiftType) {
        RosterState.setEmployeeShift(dateStr, RosterState.activePaintEmpId, RosterState.activePaintShiftType);
      } else {
        openEditModal(dateStr);
      }
    };
    
    grid.appendChild(cell);
  }
}

// 4. 計算並渲染統計報表與警示
function calculateAndRenderStats() {
  const container = document.getElementById("employee-stats-container");
  if (!container) return;
  container.innerHTML = "";
  
  // A. 對每位員工初始化統計對象
  const stats = {};
  RosterState.employees.forEach(emp => {
    stats[emp.id] = {
      name: emp.name,
      morning: 0,
      evening: 0,
      night: 0,
      off: 0,
      totalHours: 0,
      weekendShifts: 0,
      consecutiveWorkDays: 0,
      warnings: []
    };
  });
  
  // B. 歷遍所有排班計算基礎數據
  // 我們需要以時間順序來檢查連續工作天數，因此對 5/6 月全部天數做一次排序歷遍
  const allShiftsDates = Object.keys(RosterState.shifts).sort();
  
  allShiftsDates.forEach(dateStr => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    const dayShifts = RosterState.shifts[dateStr] || [];
    
    dayShifts.forEach(s => {
      const empStats = stats[s.empId];
      if (!empStats) return; // 該員工可能已被刪除
      
      if (s.type === "morning") {
        empStats.morning++;
        empStats.totalHours += 8;
        if (isWeekend) empStats.weekendShifts++;
      } else if (s.type === "evening") {
        empStats.evening++;
        empStats.totalHours += 8;
        if (isWeekend) empStats.weekendShifts++;
      } else if (s.type === "night") {
        empStats.night++;
        empStats.totalHours += 8;
        if (isWeekend) empStats.weekendShifts++;
      } else if (s.type === "off") {
        empStats.off++;
      }
    });
  });
  
  // C. 檢查排班合理性（連續上班、重複排班警告）
  // 1. 同日重複排班警告
  for (let dateStr in RosterState.shifts) {
    const dayShifts = RosterState.shifts[dateStr] || [];
    const empDailyCount = {};
    
    dayShifts.forEach(s => {
      // 只有上班才算重複排班，休假重複不算
      if (s.type !== "off") {
        empDailyCount[s.empId] = (empDailyCount[s.empId] || 0) + 1;
      }
    });
    
    for (let empId in empDailyCount) {
      if (empDailyCount[empId] > 1 && stats[empId]) {
        const date = new Date(dateStr);
        const dayLabel = `${date.getMonth() + 1}/${date.getDate()}`;
        stats[empId].warnings.push(`${dayLabel} 同天重複排了上班！`);
      }
    }
  }
  
  // 2. 連續上班超過 6 天警告 (勞基法一例一休原則輔助)
  RosterState.employees.forEach(emp => {
    const empId = emp.id;
    let consecutiveDays = 0;
    
    // 生成 5/1 到 6/30 的排序日期
    const startMay = new Date(2026, 4, 1);
    const endJune = new Date(2026, 5, 30);
    let tempDate = new Date(startMay);
    
    while (tempDate <= endJune) {
      const dStr = formatDate(tempDate);
      const dayShifts = RosterState.shifts[dStr] || [];
      const empShift = dayShifts.find(s => s.empId === empId);
      
      // 如果有排班且不是休假 (即 morning, evening, night)
      if (empShift && empShift.type !== "off") {
        consecutiveDays++;
        if (consecutiveDays > 6) {
          const dateLabel = `${tempDate.getMonth() + 1}/${tempDate.getDate()}`;
          // 只在剛好第 7 天或累加時警告
          if (consecutiveDays === 7 && stats[empId]) {
            stats[empId].warnings.push(`連續工作超過 6 天 (至 ${dateLabel})`);
          }
        }
      } else {
        // 有休假或沒排班，中斷連續天數
        consecutiveDays = 0;
      }
      
      tempDate.setDate(tempDate.getDate() + 1);
    }
  });
  
  // D. 渲染統計卡片
  for (let empId in stats) {
    const s = stats[empId];
    const card = document.createElement("div");
    card.className = "stats-card glass-panel";
    
    let warningHTML = "";
    if (s.warnings.length > 0) {
      s.warnings.forEach(warn => {
        warningHTML += `
          <div class="stats-warning-badge">
            <i class="fas fa-exclamation-triangle"></i>
            <span>${warn}</span>
          </div>
        `;
      });
    }
    
    card.innerHTML = `
      <div class="stats-card-header">
        <span class="stats-emp-title">${s.name}</span>
        <span class="stats-hours-badge">${s.totalHours} 小時</span>
      </div>
      <div class="stats-details-row">
        <div class="stats-subbox">
          <span class="count-lbl">早班</span>
          <span class="count-val">${s.morning}</span>
        </div>
        <div class="stats-subbox">
          <span class="count-lbl">晚班</span>
          <span class="count-val">${s.evening}</span>
        </div>
        <div class="stats-subbox">
          <span class="count-lbl">夜班</span>
          <span class="count-val">${s.night}</span>
        </div>
        <div class="stats-subbox">
          <span class="count-lbl">休假</span>
          <span class="count-val" style="color:var(--shift-off-text);">${s.off}</span>
        </div>
      </div>
      <div style="font-size:12px; color:var(--text-muted); display:flex; justify-content:space-between; margin-top:2px;">
        <span>六日值班天數: <b>${s.weekendShifts} 天</b></span>
        <span>總班數: <b>${s.morning + s.evening + s.night} 班</b></span>
      </div>
      ${warningHTML}
    `;
    container.appendChild(card);
  }
}


// ==================== 彈窗編輯邏輯 ====================

let activeEditDate = null;

function openEditModal(dateStr) {
  activeEditDate = dateStr;
  const modal = document.getElementById("edit-shift-modal");
  
  const dateObj = new Date(dateStr);
  document.getElementById("modal-date-title").textContent = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日 排班調整`;
  
  const body = document.getElementById("modal-shift-edit-body");
  body.innerHTML = "";
  
  const dayShifts = RosterState.shifts[dateStr] || [];
  
  RosterState.employees.forEach(emp => {
    const currentShift = dayShifts.find(s => s.empId === emp.id);
    const selectedType = currentShift ? currentShift.type : "none";
    
    const row = document.createElement("div");
    row.className = "shift-edit-grid";
    row.innerHTML = `
      <span class="shift-edit-label">${emp.name}</span>
      <select class="shift-edit-select" data-emp-id="${emp.id}">
        <option value="none">-- 未排班 --</option>
        <option value="morning" ${selectedType === "morning" ? "selected" : ""}>早班 (08:00 - 16:00)</option>
        <option value="evening" ${selectedType === "evening" ? "selected" : ""}>晚班 (16:00 - 24:00)</option>
        <option value="night" ${selectedType === "night" ? "selected" : ""}>夜班 (00:00 - 08:00)</option>
        <option value="off" ${selectedType === "off" ? "selected" : ""}>休假 (OFF)</option>
      </select>
    `;
    body.appendChild(row);
  });
  
  modal.classList.add("active");
}

function closeEditModal() {
  document.getElementById("edit-shift-modal").classList.remove("active");
  activeEditDate = null;
}

function saveEditModal() {
  if (!activeEditDate) return;
  
  const selects = document.querySelectorAll(".shift-edit-select");
  
  RosterState.shifts[activeEditDate] = [];
  
  selects.forEach(sel => {
    const empId = sel.getAttribute("data-emp-id");
    const val = sel.value;
    
    if (val !== "none") {
      RosterState.shifts[activeEditDate].push({ empId, type: val });
    }
  });
  
  RosterState.saveToStorage();
  RosterState.updateUI();
  closeEditModal();
}


// ==================== 控制項與功能性函式 ====================

// 切換排班編輯模式
function setEditMode(mode) {
  RosterState.editMode = mode;
  
  const btnInter = document.getElementById("mode-btn-interactive");
  const btnPaint = document.getElementById("mode-btn-paint");
  
  if (btnInter && btnPaint) {
    if (mode === "interactive") {
      btnInter.classList.add("active");
      btnPaint.classList.remove("active");
      RosterState.activePaintEmpId = null;
      RosterState.activePaintShiftType = null;
    } else {
      btnInter.classList.remove("active");
      btnPaint.classList.add("active");
    }
  }
  
  RosterState.updateUI();
}

// 切換月份
function switchMonth(m) {
  RosterState.currentMonth = m;
  RosterState.saveToStorage();
  RosterState.updateUI();
}

// 導出排班表為 CSV 檔案
function exportRosterCSV() {
  // A. 建立 CSV 標頭
  let csvContent = "\ufeff"; // BOM，防止 Excel 開啟中文亂碼
  csvContent += "日期,星期,早班人員,晚班人員,夜班人員,休假人員\n";
  
  const startMay = new Date(2026, 4, 1);
  const endJune = new Date(2026, 5, 30);
  let tempDate = new Date(startMay);
  
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
  
  while (tempDate <= endJune) {
    const dStr = formatDate(tempDate);
    const dayOfWeek = tempDate.getDay();
    const weekDayStr = weekDays[dayOfWeek];
    
    const dayShifts = RosterState.shifts[dStr] || [];
    
    // 將員工姓名分類
    let morningNames = [];
    let eveningNames = [];
    let nightNames = [];
    let offNames = [];
    
    dayShifts.forEach(s => {
      const emp = RosterState.employees.find(e => e.id === s.empId);
      if (!emp) return;
      
      if (s.type === "morning") morningNames.push(emp.name);
      else if (s.type === "evening") eveningNames.push(emp.name);
      else if (s.type === "night") nightNames.push(emp.name);
      else if (s.type === "off") offNames.push(emp.name);
    });
    
    // 用分號將多個員工隔開
    csvContent += `${dStr},週${weekDayStr},"${morningNames.join(";") || "-"}","${eveningNames.join(";") || "-"}","${nightNames.join(";") || "-"}","${offNames.join(";") || "-"}"\n`;
    
    tempDate.setDate(tempDate.getDate() + 1);
  }
  
  // B. 下載檔案
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `2026年5-6月排班表.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


// ==================== 初始化事件綁定 ====================
document.addEventListener("DOMContentLoaded", () => {
  // 1. 初始化狀態
  RosterState.init();
  
  // 預設主題為 Dark
  document.body.setAttribute("data-theme", "dark");
  
  // 2. 主題切換
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const currentTheme = document.body.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    document.body.setAttribute("data-theme", newTheme);
    
    const btn = document.getElementById("theme-toggle");
    if (newTheme === "light") {
      btn.innerHTML = `<i class="fas fa-moon"></i> 深色模式`;
    } else {
      btn.innerHTML = `<i class="fas fa-sun"></i> 淺色模式`;
    }
  });
  
  // 3. 月份切換按鈕
  document.getElementById("btn-month-may").onclick = () => switchMonth(5);
  document.getElementById("btn-month-june").onclick = () => switchMonth(6);
  
  // 4. 模式切換按鈕
  document.getElementById("mode-btn-interactive").onclick = () => setEditMode("interactive");
  document.getElementById("mode-btn-paint").onclick = () => setEditMode("paint");
  
  // 5. 新增員工表單
  document.getElementById("btn-add-emp").onclick = () => {
    const input = document.getElementById("new-emp-name");
    const name = input.value;
    if (name.trim()) {
      RosterState.addEmployee(name);
      input.value = "";
    }
  };
  
  // 6. 彈窗事件
  document.getElementById("btn-modal-close").onclick = closeEditModal;
  document.getElementById("btn-modal-cancel").onclick = closeEditModal;
  document.getElementById("btn-modal-save").onclick = saveEditModal;
  
  // 點擊彈窗外部關閉
  document.getElementById("edit-shift-modal").onclick = (e) => {
    if (e.target.id === "edit-shift-modal") {
      closeEditModal();
    }
  };
  
  // 7. 匯出/重設/列印按鈕
  document.getElementById("btn-export-csv").onclick = exportRosterCSV;
  document.getElementById("btn-reset-roster").onclick = () => RosterState.resetRoster();
  document.getElementById("btn-print-roster").onclick = () => {
    window.print();
  };
});
