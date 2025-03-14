// DOM Elements - References to important elements in the document
const form = document.getElementById('transaction-form');
const transactionTable = document.querySelector('#transaction-table tbody');
const transactionCards = document.getElementById('transaction-cards');
const totalIncome = document.getElementById('total-income');
const totalExpenses = document.getElementById('total-expenses');
const netBalance = document.getElementById('net-balance');
const categoryFilter = document.getElementById('category-filter');

// Application State
let transactions = [];
let chart = null;

/**
 * Initialize or update the expenses chart
 * @param {Object} expenseData - Object containing category names as keys and expense amounts as values
 */
function initChart(expenseData) {
    const ctx = document.getElementById('expense-chart').getContext('2d');
    
    // If chart exists, destroy it before creating a new one
    if (chart) {
        chart.destroy();
    }
    
    // Check if there's data to display
    if (Object.keys(expenseData).length === 0) {
        document.getElementById('expense-chart').style.display = 'none';
        return;
    } else {
        document.getElementById('expense-chart').style.display = 'block';
    }
    
    // Color palette for chart segments
    const colorPalette = [
        '#6366f1', // Primary
        '#ef4444', // Danger
        '#10b981', // Success
        '#f59e0b', // Warning
        '#8b5cf6', // Purple
        '#ec4899', // Pink
        '#14b8a6', // Teal
        '#f97316', // Orange
        '#6b7280'  // Gray
    ];
    
    // Create new chart instance
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(expenseData),
            datasets: [{
                label: 'Expenses by Category',
                data: Object.values(expenseData),
                backgroundColor: colorPalette.slice(0, Object.keys(expenseData).length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            family: 'Poppins',
                            size: 12
                        },
                        padding: 20,
                        boxWidth: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '70%',
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 800
            }
        }
    });
}

/**
 * Format a number as currency (USD)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

/**
 * Format a date string to a more readable format
 * @param {string} dateString - Date string in ISO format
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Event listener for form submission to add a new transaction
form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const date = document.getElementById('date').value;
    const description = document.getElementById('description').value;
    const category = document.getElementById('category').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    
    // Validate form inputs
    if (!date || !description || !category || !amount || !type) {
        alert('Please fill out all fields.');
        return;
    }
    
    // Create transaction object
    const transaction = {
        id: Date.now(), // Unique ID using timestamp
        date,
        description,
        category,
        amount,
        type
    };
    
    // Add to transactions array and update UI
    transactions.push(transaction);
    renderTransactions();
    calculateSummary();
    saveToLocalStorage();
    form.reset();
    
    // Set focus to date input for next entry
    document.getElementById('date').focus();
});

/**
 * Render transactions to the DOM (table for desktop, cards for mobile)
 * @param {string} filterCategory - Optional category to filter transactions by
 */
function renderTransactions(filterCategory = '') {
    const isMobile = window.innerWidth <= 640;
    
    // Clear previous content
    transactionTable.innerHTML = '';
    transactionCards.innerHTML = '';
    
    // Filter transactions by category if specified
    const filteredTransactions = transactions.filter(
        transaction => !filterCategory || transaction.category === filterCategory
    );
    
    // Show message if no transactions found
    if (filteredTransactions.length === 0) {
        const message = document.createElement('tr');
        message.innerHTML = `<td colspan="6" class="text-center">No transactions found.</td>`;
        transactionTable.appendChild(message);
        
        const cardMessage = document.createElement('div');
        cardMessage.className = 'transaction-card';
        cardMessage.innerHTML = `<div style="justify-content: center">No transactions found.</div>`;
        transactionCards.appendChild(cardMessage);
        return;
    }
    
    // Create and append transaction elements
    filteredTransactions.forEach((transaction, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.description}</td>
            <td>${transaction.category}</td>
            <td class="${transaction.type === 'Income' ? 'income-text' : 'expense-text'}">
                ${formatCurrency(transaction.amount)}
            </td>
            <td>
                <span class="badge ${transaction.type === 'Income' ? 'income-badge' : 'expense-badge'}">
                    ${transaction.type}
                </span>
            </td>
            <td>
                <button class="delete-btn" data-id="${transaction.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        transactionTable.appendChild(row);
        
        const card = document.createElement('div');
        card.className = 'transaction-card';
        card.innerHTML = `
            <div class="card-header">
                <span class="badge ${transaction.type === 'Income' ? 'income-badge' : 'expense-badge'}">
                    ${transaction.type}
                </span>
                <span>${formatDate(transaction.date)}</span>
            </div>
            <div><span>Description:</span> ${transaction.description}</div>
            <div><span>Category:</span> ${transaction.category}</div>
            <div>
                <span>Amount:</span> 
                <span class="${transaction.type === 'Income' ? 'income-text' : 'expense-text'}">
                    ${formatCurrency(transaction.amount)}
                </span>
            </div>
            <div>
                <button class="delete-btn" data-id="${transaction.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        transactionCards.appendChild(card);
    });
    
    document.querySelectorAll('.income-text').forEach(el => {
        el.style.color = 'var(--success-color)';
        el.style.fontWeight = '600';
    });
    
    document.querySelectorAll('.expense-text').forEach(el => {
        el.style.color = 'var(--danger-color)';
        el.style.fontWeight = '600';
    });
    
    document.querySelectorAll('.badge').forEach(el => {
        el.style.padding = '0.25rem 0.5rem';
        el.style.borderRadius = 'var(--border-radius)';
        el.style.fontSize = '0.75rem';
        el.style.fontWeight = '500';
    });
    
    document.querySelectorAll('.income-badge').forEach(el => {
        el.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
        el.style.color = 'var(--success-color)';
    });
    
    document.querySelectorAll('.expense-badge').forEach(el => {
        el.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        el.style.color = 'var(--danger-color)';
    });
}

// Handle window resize events
window.addEventListener('resize', () => {
    renderTransactions(categoryFilter.value);
    
    // Resize chart if it exists
    if (chart) {
        chart.resize();
    }
});

// Event delegation for delete buttons
document.addEventListener('click', (e) => {
    if (e.target.closest('.delete-btn')) {
        const button = e.target.closest('.delete-btn');
        const id = parseInt(button.dataset.id);
        
        // Find transaction index
        const index = transactions.findIndex(t => t.id === id);
        
        if (index !== -1) {
            // Confirm deletion
            if (confirm('Are you sure you want to delete this transaction?')) {
                transactions.splice(index, 1);
                renderTransactions(categoryFilter.value);
                calculateSummary();
                saveToLocalStorage();
            }
        }
    }
});

/**
 * Calculate and update financial summary (income, expenses, balance)
 * and update the chart
 */
function calculateSummary() {
    // Calculate total income
    const income = transactions
        .filter(transaction => transaction.type === 'Income')
        .reduce((sum, transaction) => sum + transaction.amount, 0);
    
    // Calculate total expenses
    const expenses = transactions
        .filter(transaction => transaction.type === 'Expense')
        .reduce((sum, transaction) => sum + transaction.amount, 0);
    
    const balance = income - expenses;
    
    // Update summary display
    totalIncome.textContent = formatCurrency(income);
    totalExpenses.textContent = formatCurrency(expenses);
    netBalance.textContent = formatCurrency(balance);
    
    // Update balance card styling based on value
    const balanceCard = document.querySelector('.balance-card');
    if (balance < 0) {
        balanceCard.style.borderLeft = '4px solid var(--danger-color)';
        netBalance.style.color = 'var(--danger-color)';
    } else {
        balanceCard.style.borderLeft = '4px solid var(--primary-color)';
        netBalance.style.color = 'var(--primary-color)';
    }
    
    // Calculate expense data for chart
    const expenseData = transactions
        .filter(transaction => transaction.type === 'Expense')
        .reduce((categories, transaction) => {
            categories[transaction.category] = (categories[transaction.category] || 0) + transaction.amount;
            return categories;
        }, {});
    
    // Update chart with new data
    initChart(expenseData);
}

/**
 * Save transactions to localStorage for persistence
 */
function saveToLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

/**
 * Load transactions from localStorage
 */
function loadFromLocalStorage() {
    const savedTransactions = JSON.parse(localStorage.getItem('transactions')) || [];
    
    // Add ID if missing (for backward compatibility)
    transactions = savedTransactions.map(transaction => {
        if (!transaction.id) {
            transaction.id = Date.now() + Math.floor(Math.random() * 1000);
        }
        return transaction;
    });
    
    renderTransactions();
    calculateSummary();
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set today's date as default for new transactions
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    loadFromLocalStorage();
});
