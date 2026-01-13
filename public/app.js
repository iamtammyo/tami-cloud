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
    setupModal();
});

function setupModal() {
    const modal = document.getElementById('transaction-modal');
    const closeBtn = document.querySelector('.modal-close');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeEditModal();
            closeEmailModal();
        }
    });

    // Setup edit form submission
    const editForm = document.getElementById('edit-transaction-form');
    if (editForm) {
        editForm.addEventListener('submit', handleEditSubmit);
    }
}

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
        // Build query parameters for date filtering
        const params = new URLSearchParams({ limit: '100' });
        if (currentTransactionDateRange.startDate) {
            params.append('start_date', currentTransactionDateRange.startDate);
        }
        if (currentTransactionDateRange.endDate) {
            params.append('end_date', currentTransactionDateRange.endDate);
        }

        const response = await fetch(`${API_BASE}/transactions?${params.toString()}`);
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

        // Determine source icon and text
        const source = tx.source || 'manual';
        const sourceIcon = source === 'gmail' ? '📧' : '✍️';
        const sourceText = source === 'gmail' ? 'Gmail' : 'Manual';

        return `
            <div class="transaction-item" onclick="showTransactionDetails(${tx.id})" style="cursor: pointer;">
                <div class="transaction-info">
                    <div class="transaction-description">${icon} ${tx.description}</div>
                    <div class="transaction-meta">${category} • ${date} • ${tx.currency} • ${sourceIcon} ${sourceText}</div>
                </div>
                <div class="transaction-amount ${tx.transaction_type}">
                    ${tx.transaction_type === 'income' ? '+' : '-'}${symbol}${formatNumber(tx.amount)}
                </div>
                <div class="transaction-actions" onclick="event.stopPropagation()">
                    <button class="btn btn-primary" onclick="editTransaction(${tx.id})" style="margin-right: 8px;">Edit</button>
                    <button class="btn btn-danger" onclick="deleteTransaction(${tx.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Load Summary
async function loadSummary() {
    try {
        // Build query parameters for date filtering
        const params = new URLSearchParams();
        if (currentDashboardDateRange.startDate) {
            params.append('start_date', currentDashboardDateRange.startDate);
        }
        if (currentDashboardDateRange.endDate) {
            params.append('end_date', currentDashboardDateRange.endDate);
        }

        const queryString = params.toString() ? `?${params.toString()}` : '';

        const response = await fetch(`${API_BASE}/transactions/summary/overview${queryString}`);
        const data = await response.json();

        if (data.success) {
            displaySummary(data.data);
        }

        const categoryResponse = await fetch(`${API_BASE}/transactions/summary/by-category${queryString}`);
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

    // Calculate and display conversions
    displayConversions(summary);
}

async function displayConversions(summary) {
    const container = document.getElementById('conversion-display');

    try {
        // Calculate total in each original currency
        const totals = {
            NGN: (summary.NGN?.net || 0),
            USD: (summary.USD?.net || 0),
            GBP: (summary.GBP?.net || 0),
            EUR: (summary.EUR?.net || 0)
        };

        // Fetch conversion rates
        const conversions = await Promise.all([
            convertCurrency(totals.USD, 'USD', 'NGN'),
            convertCurrency(totals.GBP, 'GBP', 'NGN'),
            convertCurrency(totals.EUR, 'EUR', 'NGN'),
            convertCurrency(totals.NGN, 'NGN', 'USD'),
            convertCurrency(totals.GBP, 'GBP', 'USD'),
            convertCurrency(totals.EUR, 'EUR', 'USD'),
            convertCurrency(totals.NGN, 'NGN', 'GBP'),
            convertCurrency(totals.USD, 'USD', 'GBP'),
            convertCurrency(totals.EUR, 'EUR', 'GBP'),
            convertCurrency(totals.NGN, 'NGN', 'EUR'),
            convertCurrency(totals.USD, 'USD', 'EUR'),
            convertCurrency(totals.GBP, 'GBP', 'EUR'),
        ]);

        // Calculate totals in each currency
        const totalInNGN = totals.NGN + (conversions[0] || 0) + (conversions[1] || 0) + (conversions[2] || 0);
        const totalInUSD = totals.USD + (conversions[3] || 0) + (conversions[4] || 0) + (conversions[5] || 0);
        const totalInGBP = totals.GBP + (conversions[6] || 0) + (conversions[7] || 0) + (conversions[8] || 0);
        const totalInEUR = totals.EUR + (conversions[9] || 0) + (conversions[10] || 0) + (conversions[11] || 0);

        container.innerHTML = `
            <div class="balance-item" style="background: linear-gradient(135deg, #28a74520 0%, #20c99720 100%); border: 2px solid #28a745;">
                <span class="label">Total in NGN</span>
                <span class="amount ${totalInNGN >= 0 ? 'income' : 'expense'}">₦${formatNumber(totalInNGN)}</span>
            </div>
            <div class="balance-item" style="background: linear-gradient(135deg, #007bff20 0%, #0056b320 100%); border: 2px solid #007bff;">
                <span class="label">Total in USD</span>
                <span class="amount ${totalInUSD >= 0 ? 'income' : 'expense'}">$${formatNumber(totalInUSD)}</span>
            </div>
            <div class="balance-item" style="background: linear-gradient(135deg, #6610f220 0%, #520de220 100%); border: 2px solid #6610f2;">
                <span class="label">Total in GBP</span>
                <span class="amount ${totalInGBP >= 0 ? 'income' : 'expense'}">£${formatNumber(totalInGBP)}</span>
            </div>
            <div class="balance-item" style="background: linear-gradient(135deg, #fd7e1420 0%, #ff671f20 100%); border: 2px solid #fd7e14;">
                <span class="label">Total in EUR</span>
                <span class="amount ${totalInEUR >= 0 ? 'income' : 'expense'}">€${formatNumber(totalInEUR)}</span>
            </div>
        `;
    } catch (error) {
        console.error('Failed to calculate conversions:', error);
        container.innerHTML = '<div style="text-align: center; color: #6c757d; padding: 20px;">Unable to load currency conversions. Please update exchange rates.</div>';
    }
}

async function convertCurrency(amount, from, to) {
    if (amount === 0 || from === to) return amount;

    try {
        const response = await fetch(`${API_BASE}/exchange-rates/convert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, from, to })
        });

        const data = await response.json();

        if (data.success) {
            return data.data.converted_amount;
        }
        return null;
    } catch (error) {
        console.error(`Failed to convert ${from} to ${to}:`, error);
        return null;
    }
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
        const categoryId = item.category_id;

        return `
            <div class="category-bar" onclick="${categoryId ? `viewCategoryDetails(${categoryId}, '${categoryName}')` : 'return false;'}">
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

    // Setup date preset filters
    const dashboardDatePreset = document.getElementById('dashboard-date-preset');
    if (dashboardDatePreset) {
        dashboardDatePreset.addEventListener('change', handleDashboardDatePreset);
    }

    const transactionDatePreset = document.getElementById('transaction-date-preset');
    if (transactionDatePreset) {
        transactionDatePreset.addEventListener('change', handleTransactionDatePreset);
    }

    const categoryDatePreset = document.getElementById('category-detail-date-preset');
    if (categoryDatePreset) {
        categoryDatePreset.addEventListener('change', handleCategoryDatePreset);
    }
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

// Transaction Detail Modal
function showTransactionDetails(id) {
    const transaction = transactions.find(tx => tx.id === id);
    if (!transaction) return;

    const modal = document.getElementById('transaction-modal');
    const modalBody = document.getElementById('modal-body');
    const symbol = getCurrencySymbol(transaction.currency);
    const date = new Date(transaction.transaction_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const category = transaction.category ? transaction.category.name : 'Uncategorized';
    const categoryIcon = transaction.category ? transaction.category.icon : '📌';
    const source = transaction.source || 'manual';
    const sourceIcon = source === 'gmail' ? '📧' : '✍️';
    const sourceText = source === 'gmail' ? 'Gmail' : 'Manual Entry';

    const typeText = transaction.transaction_type === 'income' ? 'Income' : 'Expense';
    const sign = transaction.transaction_type === 'income' ? '+' : '-';

    modalBody.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Amount</span>
            <span class="detail-value amount ${transaction.transaction_type}">${sign}${symbol}${formatNumber(transaction.amount)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Type</span>
            <span class="detail-value"><span class="detail-badge ${transaction.transaction_type}">${typeText}</span></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Description</span>
            <span class="detail-value">${transaction.description}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Category</span>
            <span class="detail-value">${categoryIcon} ${category}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Date</span>
            <span class="detail-value">${date}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Currency</span>
            <span class="detail-value">${transaction.currency} (${symbol})</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Source</span>
            <span class="detail-value"><span class="detail-badge source">${sourceIcon} ${sourceText}</span></span>
        </div>
        ${transaction.source === 'gmail' && transaction.source_id ? `
        <div class="detail-row">
            <span class="detail-label">Email ID</span>
            <span class="detail-value" style="font-size: 0.85em; color: #667eea;">${transaction.source_id.substring(0, 20)}...</span>
        </div>
        ` : ''}
        ${transaction.notes ? `
        <div class="detail-row">
            <span class="detail-label">Notes</span>
            <span class="detail-value">${transaction.notes}</span>
        </div>
        ` : ''}
        ${transaction.tags && transaction.tags.length > 0 ? `
        <div class="detail-row">
            <span class="detail-label">Tags</span>
            <span class="detail-value">${transaction.tags.map(tag => tag.name).join(', ')}</span>
        </div>
        ` : ''}
        <div style="margin-top: 25px; display: flex; gap: 10px; justify-content: flex-end;">
            <button class="btn btn-primary" onclick="closeModal(); editTransaction(${transaction.id});">Edit Transaction</button>
            ${transaction.source === 'gmail' && transaction.source_id ? `
            <button class="btn" style="background: #667eea; color: white;" onclick="viewSourceEmail('${transaction.source_id}')">📧 View Email</button>
            ` : ''}
        </div>
    `;

    modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('transaction-modal');
    modal.classList.remove('show');
}

// Edit Transaction Functions
function editTransaction(id) {
    const transaction = transactions.find(tx => tx.id === id);
    if (!transaction) return;

    // Populate edit form
    document.getElementById('edit-transaction-id').value = transaction.id;
    document.getElementById('edit-amount').value = transaction.amount;
    document.getElementById('edit-currency').value = transaction.currency;
    document.getElementById('edit-transaction-type').value = transaction.transaction_type;
    document.getElementById('edit-description').value = transaction.description;
    document.getElementById('edit-transaction-date').value = transaction.transaction_date;
    document.getElementById('edit-notes').value = transaction.notes || '';

    // Populate category dropdown
    const categorySelect = document.getElementById('edit-category');
    categorySelect.innerHTML = '';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = `${cat.icon || ''} ${cat.name}`;
        if (cat.id === transaction.category_id) {
            option.selected = true;
        }
        categorySelect.appendChild(option);
    });

    // Show modal
    document.getElementById('edit-modal').classList.add('show');
}

async function handleEditSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('edit-transaction-id').value;
    const data = {
        amount: parseFloat(document.getElementById('edit-amount').value),
        currency: document.getElementById('edit-currency').value,
        description: document.getElementById('edit-description').value,
        category_id: parseInt(document.getElementById('edit-category').value) || undefined,
        transaction_date: document.getElementById('edit-transaction-date').value,
        transaction_type: document.getElementById('edit-transaction-type').value,
        notes: document.getElementById('edit-notes').value || undefined
    };

    try {
        const response = await fetch(`${API_BASE}/transactions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Transaction updated successfully!', 'success');
            closeEditModal();
            await loadTransactions();
            await loadSummary();
        } else {
            showNotification(result.error || 'Failed to update transaction', 'error');
        }
    } catch (error) {
        showNotification('Failed to update transaction', 'error');
    }
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('show');
}

// View Source Email Function
async function viewSourceEmail(emailId) {
    const modal = document.getElementById('email-modal');
    const modalBody = document.getElementById('email-modal-body');

    // Show loading state
    modalBody.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #6c757d;">
            <div style="font-size: 3em; margin-bottom: 15px;">⏳</div>
            <p>Loading email content...</p>
        </div>
    `;

    modal.classList.add('show');

    try {
        const response = await fetch(`${API_BASE}/gmail/email/${emailId}`);
        const data = await response.json();

        if (data.success) {
            const email = data.data;
            const date = new Date(parseInt(email.internalDate)).toLocaleString();

            modalBody.innerHTML = `
                <div class="detail-row">
                    <span class="detail-label">From</span>
                    <span class="detail-value">${email.from || 'Unknown'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Subject</span>
                    <span class="detail-value"><strong>${email.subject}</strong></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">${date}</span>
                </div>
                <div style="margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px; max-height: 400px; overflow-y: auto;">
                    <div style="white-space: pre-wrap; font-family: monospace; font-size: 0.9em; line-height: 1.6;">
                        ${email.snippet || email.body || 'No content available'}
                    </div>
                </div>
                <div style="margin-top: 15px; text-align: center;">
                    <a href="https://mail.google.com/mail/u/0/#inbox/${emailId}" target="_blank" class="btn btn-primary">
                        Open in Gmail
                    </a>
                </div>
            `;
        } else {
            modalBody.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #dc3545;">
                    <div style="font-size: 3em; margin-bottom: 15px;">❌</div>
                    <p>${data.error || 'Failed to load email'}</p>
                    <p style="font-size: 0.9em; color: #6c757d; margin-top: 10px;">
                        Email ID: ${emailId}
                    </p>
                </div>
            `;
        }
    } catch (error) {
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #dc3545;">
                <div style="font-size: 3em; margin-bottom: 15px;">❌</div>
                <p>Failed to load email content</p>
                <p style="font-size: 0.9em; color: #6c757d; margin-top: 10px;">
                    Email ID: ${emailId}
                </p>
            </div>
        `;
    }
}

function closeEmailModal() {
    document.getElementById('email-modal').classList.remove('show');
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

// Date filtering utility functions
function getDateRange(preset) {
    const today = new Date();
    let startDate, endDate;

    switch (preset) {
        case '7':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7);
            endDate = today;
            break;
        case '30':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 30);
            endDate = today;
            break;
        case '90':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 90);
            endDate = today;
            break;
        case 'this-month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = today;
            break;
        case 'last-month':
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            endDate = new Date(today.getFullYear(), today.getMonth(), 0);
            break;
        case 'this-year':
            startDate = new Date(today.getFullYear(), 0, 1);
            endDate = today;
            break;
        default:
            return { startDate: null, endDate: null };
    }

    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
    };
}

// Dashboard date filtering
let currentDashboardDateRange = { startDate: null, endDate: null };

function handleDashboardDatePreset(e) {
    const preset = e.target.value;
    const customDatesDiv = document.getElementById('dashboard-custom-dates');

    if (preset === 'custom') {
        customDatesDiv.style.display = 'flex';
        return;
    }

    customDatesDiv.style.display = 'none';

    if (preset === '') {
        currentDashboardDateRange = { startDate: null, endDate: null };
    } else {
        currentDashboardDateRange = getDateRange(preset);
    }

    loadSummary();
}

function applyDashboardDateFilter() {
    const startDate = document.getElementById('dashboard-start-date').value;
    const endDate = document.getElementById('dashboard-end-date').value;

    currentDashboardDateRange = {
        startDate: startDate || null,
        endDate: endDate || null
    };

    loadSummary();
}

// Transaction list date filtering
let currentTransactionDateRange = { startDate: null, endDate: null };

function handleTransactionDatePreset(e) {
    const preset = e.target.value;
    const customDatesDiv = document.getElementById('transaction-custom-dates');

    if (preset === 'custom') {
        customDatesDiv.style.display = 'block';
        return;
    }

    customDatesDiv.style.display = 'none';

    if (preset === '') {
        currentTransactionDateRange = { startDate: null, endDate: null };
    } else {
        currentTransactionDateRange = getDateRange(preset);
    }

    loadTransactions();
}

function applyTransactionDateFilter() {
    const startDate = document.getElementById('transaction-start-date').value;
    const endDate = document.getElementById('transaction-end-date').value;

    currentTransactionDateRange = {
        startDate: startDate || null,
        endDate: endDate || null
    };

    loadTransactions();
}

// Category detail modal
let currentCategoryId = null;
let currentCategoryDateRange = { startDate: null, endDate: null };

async function viewCategoryDetails(categoryId, categoryName) {
    currentCategoryId = categoryId;
    currentCategoryDateRange = { startDate: null, endDate: null };

    document.getElementById('category-detail-title').textContent = `${categoryName} - Details`;
    document.getElementById('category-detail-date-preset').value = '';

    const modal = document.getElementById('category-detail-modal');
    modal.classList.add('show');

    await loadCategoryDetails();
}

async function loadCategoryDetails() {
    if (!currentCategoryId) return;

    try {
        let url = `${API_BASE}/categories/${currentCategoryId}/details`;
        const params = new URLSearchParams();

        if (currentCategoryDateRange.startDate) {
            params.append('start_date', currentCategoryDateRange.startDate);
        }
        if (currentCategoryDateRange.endDate) {
            params.append('end_date', currentCategoryDateRange.endDate);
        }

        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            displayCategoryDetails(data.data);
        }
    } catch (error) {
        showNotification('Failed to load category details', 'error');
    }
}

function displayCategoryDetails(data) {
    const { category, transactions, totals, transaction_count } = data;

    // Display totals by currency
    const totalsContainer = document.getElementById('category-totals');
    const totalsHTML = Object.entries(totals).map(([currency, amounts]) => {
        const symbol = getCurrencySymbol(currency);
        const netClass = amounts.net >= 0 ? 'income' : 'expense';

        return `
            <div class="card" style="padding: 15px; margin: 0;">
                <h4 style="color: #6c757d; font-size: 0.9em; margin-bottom: 10px;">${currency}</h4>
                <div class="balance-display" style="gap: 10px;">
                    <div class="balance-item" style="padding: 8px;">
                        <span class="label" style="font-size: 0.85em;">Income</span>
                        <span class="amount income" style="font-size: 1.1em;">${symbol}${formatNumber(amounts.income)}</span>
                    </div>
                    <div class="balance-item" style="padding: 8px;">
                        <span class="label" style="font-size: 0.85em;">Expenses</span>
                        <span class="amount expense" style="font-size: 1.1em;">${symbol}${formatNumber(amounts.expense)}</span>
                    </div>
                    <div class="balance-item net" style="padding: 8px;">
                        <span class="label" style="font-size: 0.85em;">Net</span>
                        <span class="amount ${netClass}" style="font-size: 1.1em;">${symbol}${formatNumber(Math.abs(amounts.net))}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    totalsContainer.innerHTML = totalsHTML || '<p style="color: #6c757d;">No transactions found</p>';

    // Display transactions
    const transactionsContainer = document.getElementById('category-transactions');
    if (transactions.length === 0) {
        transactionsContainer.innerHTML = '<div class="empty-state"><p>No transactions found</p></div>';
        return;
    }

    displayTransactionList(transactions, transactionsContainer);
}

function handleCategoryDatePreset(e) {
    const preset = e.target.value;

    if (preset === '') {
        currentCategoryDateRange = { startDate: null, endDate: null };
    } else {
        currentCategoryDateRange = getDateRange(preset);
    }

    loadCategoryDetails();
}

function closeCategoryDetailModal() {
    document.getElementById('category-detail-modal').classList.remove('show');
    currentCategoryId = null;
    currentCategoryDateRange = { startDate: null, endDate: null };
}
