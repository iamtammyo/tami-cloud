// API Base URL
const API_BASE = 'http://localhost:3000/api';

// State
let categories = [];
let transactions = [];
let budgets = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    loadCategories();
    loadTransactions();
    loadBudgets();
    loadSummary();
    setupForms();
    setupFilters();
    setDefaultDate();
});

// Tab Navigation
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });
}

// Set default date to today
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transaction-date').value = today;
    document.getElementById('budget-start-date').value = today;
}

// Load Categories
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories`);
        const data = await response.json();

        if (data.success) {
            categories = data.data;
            populateCategorySelects();
            displayCategories();
        }
    } catch (error) {
        showNotification('Failed to load categories', 'error');
    }
}

function populateCategorySelects() {
    const selects = ['category', 'budget-category', 'filter-category'];

    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        const hasEmpty = selectId.includes('budget') || selectId.includes('filter');

        select.innerHTML = hasEmpty ? '<option value="">All Categories</option>' : '';

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = `${cat.icon || ''} ${cat.name}`;
            select.appendChild(option);
        });
    });
}

function displayCategories() {
    const container = document.getElementById('categories-list');

    if (categories.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📁</div><p>No categories yet</p></div>';
        return;
    }

    container.innerHTML = categories.map(cat => `
        <div class="category-item" style="border-left-color: ${cat.color || '#667eea'}">
            <div class="category-icon">${cat.icon || '📁'}</div>
            <div class="category-info">
                <div class="category-name">${cat.name}</div>
                <div class="category-description">${cat.description || ''}</div>
            </div>
        </div>
    `).join('');
}

// Load Transactions
async function loadTransactions() {
    try {
        const response = await fetch(`${API_BASE}/transactions?limit=100`);
        const data = await response.json();

        if (data.success) {
            transactions = data.data;
            displayTransactions();
            displayRecentTransactions();
        }
    } catch (error) {
        showNotification('Failed to load transactions', 'error');
    }
}

function displayTransactions() {
    const container = document.getElementById('all-transactions');
    displayTransactionList(transactions, container);
}

function displayRecentTransactions() {
    const container = document.getElementById('recent-transactions');
    const recent = transactions.slice(0, 5);
    displayTransactionList(recent, container);
}

function displayTransactionList(items, container) {
    if (items.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📝</div><p>No transactions yet</p></div>';
        return;
    }

    container.innerHTML = items.map(tx => {
        const symbol = getCurrencySymbol(tx.currency);
        const date = new Date(tx.transaction_date).toLocaleDateString();
        const category = tx.category ? tx.category.name : 'Uncategorized';
        const icon = tx.category ? tx.category.icon : '📌';

        return `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-description">${icon} ${tx.description}</div>
                    <div class="transaction-meta">${category} • ${date} • ${tx.currency}</div>
                </div>
                <div class="transaction-amount ${tx.transaction_type}">
                    ${tx.transaction_type === 'income' ? '+' : '-'}${symbol}${formatNumber(tx.amount)}
                </div>
                <div class="transaction-actions">
                    <button class="btn btn-danger" onclick="deleteTransaction(${tx.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Load Summary
async function loadSummary() {
    try {
        const response = await fetch(`${API_BASE}/transactions/summary/overview`);
        const data = await response.json();

        if (data.success) {
            displaySummary(data.data);
        }

        const categoryResponse = await fetch(`${API_BASE}/transactions/summary/by-category`);
        const categoryData = await categoryResponse.json();

        if (categoryData.success) {
            displayCategorySummary(categoryData.data);
        }
    } catch (error) {
        showNotification('Failed to load summary', 'error');
    }
}

function displaySummary(summary) {
    const ngnData = summary.NGN || { income: 0, expenses: 0, net: 0 };
    const usdData = summary.USD || { income: 0, expenses: 0, net: 0 };
    const gbpData = summary.GBP || { income: 0, expenses: 0, net: 0 };
    const eurData = summary.EUR || { income: 0, expenses: 0, net: 0 };

    // NGN
    document.getElementById('ngn-income').textContent = `₦${formatNumber(ngnData.income)}`;
    document.getElementById('ngn-expenses').textContent = `₦${formatNumber(ngnData.expenses)}`;
    document.getElementById('ngn-net').textContent = `₦${formatNumber(ngnData.net)}`;
    document.getElementById('ngn-net').className = `amount ${ngnData.net >= 0 ? 'income' : 'expense'}`;

    // USD
    document.getElementById('usd-income').textContent = `$${formatNumber(usdData.income)}`;
    document.getElementById('usd-expenses').textContent = `$${formatNumber(usdData.expenses)}`;
    document.getElementById('usd-net').textContent = `$${formatNumber(usdData.net)}`;
    document.getElementById('usd-net').className = `amount ${usdData.net >= 0 ? 'income' : 'expense'}`;

    // GBP
    document.getElementById('gbp-income').textContent = `£${formatNumber(gbpData.income)}`;
    document.getElementById('gbp-expenses').textContent = `£${formatNumber(gbpData.expenses)}`;
    document.getElementById('gbp-net').textContent = `£${formatNumber(gbpData.net)}`;
    document.getElementById('gbp-net').className = `amount ${gbpData.net >= 0 ? 'income' : 'expense'}`;

    // EUR
    document.getElementById('eur-income').textContent = `€${formatNumber(eurData.income)}`;
    document.getElementById('eur-expenses').textContent = `€${formatNumber(eurData.expenses)}`;
    document.getElementById('eur-net').textContent = `€${formatNumber(eurData.net)}`;
    document.getElementById('eur-net').className = `amount ${eurData.net >= 0 ? 'income' : 'expense'}`;
}

function displayCategorySummary(data) {
    const container = document.getElementById('category-chart');

    if (data.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No data to display</p></div>';
        return;
    }

    const maxAmount = Math.max(...data.map(d => d.total));

    container.innerHTML = data.slice(0, 10).map(item => {
        const percentage = (item.total / maxAmount) * 100;
        const symbol = getCurrencySymbol(item.currency);
        const categoryName = item.category_name || 'Uncategorized';

        return `
            <div class="category-bar">
                <div class="category-label">${item.category_icon || '📌'} ${categoryName} (${item.currency})</div>
                <div class="bar-container">
                    <div class="bar-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="bar-amount">${symbol}${formatNumber(item.total)}</div>
            </div>
        `;
    }).join('');
}

// Load Budgets
async function loadBudgets() {
    try {
        const response = await fetch(`${API_BASE}/budgets?is_active=true`);
        const data = await response.json();

        if (data.success) {
            budgets = data.data;
            await displayBudgets();
        }
    } catch (error) {
        showNotification('Failed to load budgets', 'error');
    }
}

async function displayBudgets() {
    const container = document.getElementById('budgets-list');

    if (budgets.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💰</div><p>No active budgets</p></div>';
        return;
    }

    const budgetPromises = budgets.map(async budget => {
        try {
            const response = await fetch(`${API_BASE}/budgets/${budget.id}/progress`);
            const data = await response.json();

            if (data.success) {
                const progress = data.data;
                const percentage = progress.percentage;
                const symbol = getCurrencySymbol(budget.currency);

                let progressClass = '';
                if (percentage >= 90) progressClass = 'danger';
                else if (percentage >= 75) progressClass = 'warning';

                return `
                    <div class="budget-item">
                        <div class="budget-header">
                            <div class="budget-name">${budget.name} (${budget.currency})</div>
                            <div class="budget-amount">${symbol}${formatNumber(budget.amount)}</div>
                        </div>
                        <div class="budget-progress">
                            <div class="progress-bar">
                                <div class="progress-fill ${progressClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                            </div>
                            <div class="progress-text">
                                <span>Spent: ${symbol}${formatNumber(progress.spent)}</span>
                                <span>Remaining: ${symbol}${formatNumber(progress.remaining)}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            return '';
        }
    });

    const budgetHTML = await Promise.all(budgetPromises);
    container.innerHTML = budgetHTML.join('');
}

// Setup Forms
function setupForms() {
    // Transaction Form
    document.getElementById('transaction-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            amount: parseFloat(document.getElementById('amount').value),
            currency: document.getElementById('currency').value,
            description: document.getElementById('description').value,
            category_id: parseInt(document.getElementById('category').value) || undefined,
            transaction_date: document.getElementById('transaction-date').value,
            transaction_type: document.getElementById('transaction-type').value,
            notes: document.getElementById('notes').value || undefined
        };

        try {
            const response = await fetch(`${API_BASE}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                showNotification('Transaction added successfully!', 'success');
                e.target.reset();
                setDefaultDate();
                await loadTransactions();
                await loadSummary();
            } else {
                showNotification(result.error || 'Failed to add transaction', 'error');
            }
        } catch (error) {
            showNotification('Failed to add transaction', 'error');
        }
    });

    // Budget Form
    document.getElementById('budget-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            name: document.getElementById('budget-name').value,
            amount: parseFloat(document.getElementById('budget-amount').value),
            currency: document.getElementById('budget-currency').value,
            period: document.getElementById('budget-period').value,
            category_id: parseInt(document.getElementById('budget-category').value) || undefined,
            start_date: document.getElementById('budget-start-date').value
        };

        try {
            const response = await fetch(`${API_BASE}/budgets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                showNotification('Budget created successfully!', 'success');
                e.target.reset();
                setDefaultDate();
                await loadBudgets();
            } else {
                showNotification(result.error || 'Failed to create budget', 'error');
            }
        } catch (error) {
            showNotification('Failed to create budget', 'error');
        }
    });

    // Category Form
    document.getElementById('category-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            name: document.getElementById('category-name').value,
            description: document.getElementById('category-description').value || undefined,
            icon: document.getElementById('category-icon').value || undefined,
            color: document.getElementById('category-color').value
        };

        try {
            const response = await fetch(`${API_BASE}/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                showNotification('Category added successfully!', 'success');
                e.target.reset();
                await loadCategories();
            } else {
                showNotification(result.error || 'Failed to add category', 'error');
            }
        } catch (error) {
            showNotification('Failed to add category', 'error');
        }
    });
}

// Setup Filters
function setupFilters() {
    const filters = ['filter-currency', 'filter-type', 'filter-category'];

    filters.forEach(filterId => {
        document.getElementById(filterId).addEventListener('change', applyFilters);
    });
}

function applyFilters() {
    const currency = document.getElementById('filter-currency').value;
    const type = document.getElementById('filter-type').value;
    const categoryId = document.getElementById('filter-category').value;

    let filtered = [...transactions];

    if (currency) {
        filtered = filtered.filter(tx => tx.currency === currency);
    }

    if (type) {
        filtered = filtered.filter(tx => tx.transaction_type === type);
    }

    if (categoryId) {
        filtered = filtered.filter(tx => tx.category_id === parseInt(categoryId));
    }

    const container = document.getElementById('all-transactions');
    displayTransactionList(filtered, container);
}

// Delete Transaction
async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/transactions/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Transaction deleted successfully!', 'success');
            await loadTransactions();
            await loadSummary();
        } else {
            showNotification(result.error || 'Failed to delete transaction', 'error');
        }
    } catch (error) {
        showNotification('Failed to delete transaction', 'error');
    }
}

// Utility Functions
function getCurrencySymbol(currency) {
    const symbols = {
        'NGN': '₦',
        'USD': '$',
        'GBP': '£',
        'EUR': '€'
    };
    return symbols[currency] || currency;
}

function formatNumber(num) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(num);
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}
