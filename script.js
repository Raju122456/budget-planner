const STORAGE_KEY = "budgetPlannerTransactionsV1";
const GOAL_KEY = "budgetPlannerGoalV1";

let transactions = loadTransactions();
let goal = loadGoal();
let categoryChart = null;
let monthlyChart = null;

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
  const today = new Date();
  $("transactionDate").value = formatDateInput(today);
  $("monthFilter").value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  $("transactionForm").addEventListener("submit", addTransaction);
  $("goalForm").addEventListener("submit", saveGoal);
  $("monthFilter").addEventListener("change", render);
  $("clearDataBtn").addEventListener("click", clearAllData);
  $("exportBtn").addEventListener("click", exportCSV);

  render();
});

function loadTransactions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function loadGoal() {
  try {
    return JSON.parse(localStorage.getItem(GOAL_KEY)) || null;
  } catch {
    return null;
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function formatDateInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value);
}

function getSelectedMonth() {
  return $("monthFilter").value;
}

function getMonthTransactions() {
  const selected = getSelectedMonth();
  return transactions.filter(t => t.date.startsWith(selected));
}

function addTransaction(event) {
  event.preventDefault();

  const type = $("transactionType").value;
  const amount = Number($("amount").value);
  const category = $("category").value;
  const date = $("transactionDate").value;
  const note = $("note").value.trim();

  if (!Number.isFinite(amount) || amount <= 0 || !date) {
    alert("Please enter a valid amount and date.");
    return;
  }

  transactions.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    type,
    amount,
    category,
    date,
    note
  });

  saveTransactions();
  event.target.reset();
  $("transactionDate").value = date;
  render();
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
  render();
}

function saveGoal(event) {
  event.preventDefault();

  const name = $("goalName").value.trim();
  const target = Number($("goalTarget").value);
  const saved = Number($("goalSaved").value);

  if (!name || target <= 0 || saved < 0) {
    alert("Please enter valid goal details.");
    return;
  }

  goal = { name, target, saved };
  localStorage.setItem(GOAL_KEY, JSON.stringify(goal));
  renderGoal();

  event.target.reset();
  $("goalName").value = goal.name;
  $("goalTarget").value = goal.target;
  $("goalSaved").value = goal.saved;
}

function clearAllData() {
  const confirmed = confirm(
    "This will delete all transactions and the savings goal from this browser. Continue?"
  );

  if (!confirmed) return;

  transactions = [];
  goal = null;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(GOAL_KEY);
  render();
  $("goalForm").reset();
}

function render() {
  const monthTransactions = getMonthTransactions();

  const income = monthTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = monthTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expense;
  const savingRate = income > 0 ? (balance / income) * 100 : 0;

  $("totalIncome").textContent = money(income);
  $("totalExpense").textContent = money(expense);
  $("balance").textContent = money(balance);
  $("savingRate").textContent = `${Math.max(0, savingRate).toFixed(1)}%`;

  renderTable(monthTransactions);
  renderCharts();
  renderGoal();
  renderAlert(income, expense, balance);
  renderMonthlySummary(income, expense, balance);
}

function renderTable(items) {
  const table = $("transactionTable");
  table.innerHTML = "";

  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));

  $("emptyState").classList.toggle("hidden", sorted.length > 0);

  sorted.forEach(t => {
    const row = document.createElement("tr");
    const sign = t.type === "income" ? "+" : "-";

    row.innerHTML = `
      <td>${escapeHTML(t.date)}</td>
      <td><span class="type-badge ${t.type === "income" ? "type-income" : "type-expense"}">${capitalize(t.type)}</span></td>
      <td>${escapeHTML(t.category)}</td>
      <td>${escapeHTML(t.note || "—")}</td>
      <td class="${t.type === "income" ? "amount-income" : "amount-expense"}">${sign}${money(t.amount)}</td>
      <td><button class="delete-btn" data-id="${escapeHTML(t.id)}">Delete</button></td>
    `;

    row.querySelector(".delete-btn").addEventListener("click", () => deleteTransaction(t.id));
    table.appendChild(row);
  });
}

function renderGoal() {
  if (!goal) {
    $("goalDisplay").classList.add("hidden");
    return;
  }

  $("goalDisplay").classList.remove("hidden");

  const percent = Math.min(100, Math.max(0, (goal.saved / goal.target) * 100));

  $("goalTitle").textContent = goal.name;
  $("goalPercent").textContent = `${percent.toFixed(0)}%`;
  $("goalProgress").style.width = `${percent}%`;
  $("goalNumbers").textContent = `${money(goal.saved)} saved of ${money(goal.target)}`;
}

function renderAlert(income, expense, balance) {
  const alertBox = $("alertBox");

  if (expense > income && income > 0) {
    alertBox.textContent = `Overspending alert: your expenses are ${money(expense - income)} higher than your income for this month.`;
    alertBox.classList.remove("hidden");
  } else if (income === 0 && expense > 0) {
    alertBox.textContent = "Overspending alert: add your income to compare this month's spending with your available income.";
    alertBox.classList.remove("hidden");
  } else if (balance > 0 && income > 0 && (balance / income) < 0.10) {
    alertBox.textContent = "Your current savings rate is below 10%. Review the spending chart for categories you may want to monitor.";
    alertBox.classList.remove("hidden");
  } else {
    alertBox.classList.add("hidden");
  }
}

function renderMonthlySummary(income, expense, balance) {
  const month = getSelectedMonth();
  const label = month
    ? new Date(`${month}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "this month";

  if (income === 0 && expense === 0) {
    $("monthlySummary").textContent = `No transactions recorded for ${label}.`;
  } else if (balance >= 0) {
    $("monthlySummary").textContent = `In ${label}, you received ${money(income)}, spent ${money(expense)}, and have a remaining balance of ${money(balance)}.`;
  } else {
    $("monthlySummary").textContent = `In ${label}, you received ${money(income)} and spent ${money(expense)}. Your balance is ${money(balance)}.`;
  }
}

function renderCharts() {
  const monthItems = getMonthTransactions().filter(t => t.type === "expense");
  const categories = {};
  monthItems.forEach(t => {
    categories[t.category] = (categories[t.category] || 0) + t.amount;
  });

  if (categoryChart) categoryChart.destroy();

  categoryChart = new Chart($("categoryChart"), {
    type: "doughnut",
    data: {
      labels: Object.keys(categories).length ? Object.keys(categories) : ["No expenses"],
      datasets: [{
        data: Object.keys(categories).length ? Object.values(categories) : [1]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: context => {
              if (!Object.keys(categories).length) return " No expenses";
              return ` ${money(context.raw)}`;
            }
          }
        }
      }
    }
  });

  const months = getLastSixMonths();
  const incomeData = months.map(m =>
    transactions.filter(t => t.date.startsWith(m) && t.type === "income")
      .reduce((s, t) => s + t.amount, 0)
  );
  const expenseData = months.map(m =>
    transactions.filter(t => t.date.startsWith(m) && t.type === "expense")
      .reduce((s, t) => s + t.amount, 0)
  );

  if (monthlyChart) monthlyChart.destroy();

  monthlyChart = new Chart($("monthlyChart"), {
    type: "bar",
    data: {
      labels: months.map(m => formatMonthLabel(m)),
      datasets: [
        { label: "Income", data: incomeData },
        { label: "Expenses", data: expenseData }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => `₹${Number(value).toLocaleString("en-IN")}`
          }
        }
      }
    }
  });
}

function getLastSixMonths() {
  const result = [];
  const base = getSelectedMonth() || formatDateInput(new Date()).slice(0, 7);
  const [year, month] = base.split("-").map(Number);
  const date = new Date(year, month - 1, 1);

  for (let i = 5; i >= 0; i--) {
    const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return result;
}

function formatMonthLabel(month) {
  return new Date(`${month}-01T00:00:00`).toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit"
  });
}

function exportCSV() {
  const items = getMonthTransactions();

  if (!items.length) {
    alert("There are no transactions to export for this month.");
    return;
  }

  const rows = [
    ["Date", "Type", "Category", "Note", "Amount"],
    ...items.map(t => [t.date, t.type, t.category, t.note || "", t.amount])
  ];

  const csv = rows
    .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `budget-${getSelectedMonth()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
