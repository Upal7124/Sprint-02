let salary = 0;
let expenses = [];
let totalExpense = 0;
let balance = 0;
let expenseChart;
let currentRate = 1;
const expenseForm = document.querySelector("#expenseForm");
const currencySelect = document.querySelector("#currencySelect");
const salaryInput = document.querySelector("#salaryInput");
const expenseNameInput = document.querySelector("#expenseName");
const expenseAmountInput = document.querySelector("#expenseAmount");

const salaryDisplay = document.querySelector("#salaryDisplay");
const balanceDisplay = document.querySelector("#balanceDisplay");
const balanceCard = document.querySelector("#balanceCard");
const expenseList = document.querySelector("#expenseList");
const totalExpenseDisplay = document.querySelector("#totalExpenseDisplay");
expenseForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const expenseName = expenseNameInput.value.trim();
  const expenseAmount = Number(expenseAmountInput.value);
  if (!validateExpense(salary, expenseName, expenseAmount)) {
    return;
  }
  const expense = {
    name: expenseName,
    amount: expenseAmount,
  };
  expenses.push(expense);
  localStorage.setItem("expenses", JSON.stringify(expenses));
  renderExpenses();
  updateBalance();
  expenseNameInput.value = "";
  expenseAmountInput.value = "";
});
const salaryForm = document.querySelector("#salaryForm");
salaryForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const salaryValue = Number(salaryInput.value);
  if (isNaN(salaryValue) || salaryValue <= 0) {
    alert("Salary must be greater than 0");
    return;
  }
  salary = salaryValue;
  localStorage.setItem("salary", salary);
  salaryDisplay.textContent = `₹${salary}`;
  updateBalance();
});
function updateBalance() {
  for (let i = 0; i < expenses.length; i++) {
    totalExpense += expenses[i].amount;
  }
  totalExpenseDisplay.textContent = `₹${totalExpense}`;
  balance = salary - totalExpense;
  balanceDisplay.textContent = `₹${balance}`;
  if (!expenseChart) {
    createChart(balance, totalExpense);
  } else {
    updateChart(balance, totalExpense);
  }

  let threshold = salary * 0.1;
  if (balance < threshold) {
    balanceCard.classList.add("danger");
    alert("Balance too low");
  } else {
    balanceCard.classList.remove("danger");
  }
  updateCurrency();
}
function renderExpenses() {
  expenseList.textContent = "";

  if (expenses.length === 0) {
    expenseList.textContent = "No expenses added yet.";
    return;
  }

  const currency = currencySelect.value;

  for (let i = 0; i < expenses.length; i++) {
    const expense = expenses[i];

    const li = document.createElement("li");
    const btn = document.createElement("button");

    let displayAmount;
    let symbol;

    if (currency === "INR") {
      displayAmount = expense.amount;
      symbol = "₹";
    } else {
      displayAmount = (expense.amount * currentRate).toFixed(2);
      symbol = currency + " ";
    }

    li.textContent = `${expense.name} - ${symbol}${displayAmount}`;

    btn.textContent = "Delete";

    btn.addEventListener("click", function () {
      expenses.splice(i, 1);

      localStorage.setItem("expenses", JSON.stringify(expenses));

      renderExpenses();
      updateBalance();
    });

    li.appendChild(btn);
    expenseList.appendChild(li);
  }
}
function validateExpense(salary, expenseName, expenseAmount) {
  if (salary === 0) {
    alert("Enter Salary first");
    return false;
  }
  if (expenseName === "") {
    alert("Please enter an expense name.");
    return false;
  }
  if (expenseAmount <= 0 || isNaN(expenseAmount)) {
    alert("Enter valid Input");
    return false;
  }
  return true;
}
const chartCanvas = document.querySelector("#expenseChart");
function createChart(balance, totalExpense) {
  expenseChart = new Chart(chartCanvas.getContext("2d"), {
    type: "pie",
    data: {
      labels: ["Remaining Balance", "Total Expenses"],
      datasets: [
        {
          data: [balance, totalExpense],
          backgroundColor: ["#4CAF50", "#F44336"],
        },
      ],
    },
  });
}
function updateChart(balance, totalExpense) {
  expenseChart.data.datasets[0].data = [balance, totalExpense];

  expenseChart.update();
}
const storedSalary = localStorage.getItem("salary");
const storedExpenses = localStorage.getItem("expenses");
if (storedSalary !== null) {
  salary = Number(storedSalary);
  salaryDisplay.textContent = `₹${salary}`;
}
if (storedExpenses != null) {
  expenses = JSON.parse(storedExpenses);
}
updateBalance();
renderExpenses();
const downloadBtn = document.querySelector("#downloadBtn");
downloadBtn.addEventListener("click", downloadReport);
function downloadReport() {
  const { jsPDF } = window.jspdf;

  const doc = new jsPDF();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);

  doc.text("Cash Flow Report", 20, 20);

  doc.setFontSize(12);

  doc.text("-------------------------------------", 20, 28);

  doc.text(`Salary : ₹${salary}`, 20, 40);

  let totalExpense = 0;

  for (let i = 0; i < expenses.length; i++) {
    totalExpense += expenses[i].amount;
  }

  doc.text(`Total Expense : ₹${totalExpense}`, 20, 50);

  const balance = salary - totalExpense;

  doc.text(`Remaining Balance : ₹${balance}`, 20, 60);

  doc.text("-------------------------------------", 20, 70);

  doc.setFont("helvetica", "bold");

  doc.text("Expense List", 20, 82);

  doc.setFont("helvetica", "normal");

  let y = 95;

  if (expenses.length === 0) {
    doc.text("No Expenses Added.", 20, y);
  } else {
    expenses.forEach((expense, index) => {
      doc.text(`${index + 1}. ${expense.name} - ₹${expense.amount}`, 20, y);

      y += 10;
    });
  }

  doc.setDrawColor(0);

  doc.line(20, y + 5, 190, y + 5);

  doc.setFont("helvetica", "bold");

  doc.text(`Final Balance : ₹${balance}`, 20, y + 18);

  doc.save("CashFlow_Report.pdf");
}
async function updateCurrency() {
  const currency = currencySelect.value;

  if (currency === "INR") {
    currentRate = 1;
    renderExpenses();
    salaryDisplay.textContent = `₹${salary}`;
    totalExpenseDisplay.textContent = `₹${totalExpense}`;
    balanceDisplay.textContent = `₹${balance}`;
    return;
  }

  const response = await fetch(
    `https://api.frankfurter.dev/v1/latest?base=INR&symbols=${currency}`,
  );

  const data = await response.json();
  console.log(data);
  const rate = data.rates[currency];
  currentRate = rate;
  renderExpenses();

  salaryDisplay.textContent = `${currency} ${(salary * rate).toFixed(2)}`;
  totalExpenseDisplay.textContent = `${currency} ${(totalExpense * rate).toFixed(2)}`;
  balanceDisplay.textContent = `${currency} ${(balance * rate).toFixed(2)}`;
}
currencySelect.addEventListener("change", updateCurrency);
