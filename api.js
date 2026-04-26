// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';
let authToken = localStorage.getItem('authToken');

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

// Auth API
const auth = {
  login: (username, password) => apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),
  register: (username, password, email) => apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, email }),
  }),
};

// Clients API
const clients = {
  getAll: () => apiCall('/clients'),
  create: (data) => apiCall('/clients', { method: 'POST', body: JSON.stringify(data) }),
  getById: (id) => apiCall(`/clients/${id}`),
  update: (id, data) => apiCall(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/clients/${id}`, { method: 'DELETE' }),
};

// Invoices API
const invoices = {
  getAll: () => apiCall('/invoices'),
  create: (data) => apiCall('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  recordPayment: (id, amount) => apiCall(`/invoices/${id}/payment`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  }),
};

// Jobs API
const jobs = {
  getAll: () => apiCall('/jobs'),
  create: (data) => apiCall('/jobs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// Expenses API
const expenses = {
  getAll: () => apiCall('/expenses'),
  create: (data) => apiCall('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  getByCategory: (category) => apiCall(`/expenses/category/${category}`),
};

// Dashboard API
const dashboard = {
  getSummary: () => apiCall('/dashboard/summary'),
};

// Login handler
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.querySelector('button[onclick*="Login"]') || document.querySelector('[class*="login"]');
  
  if (loginBtn) {
    loginBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const username = document.querySelector('input[placeholder*="username"]')?.value;
      const password = document.querySelector('input[placeholder*="password"]')?.value;

      if (username && password) {
        try {
          const result = await auth.login(username, password);
          authToken = result.token;
          localStorage.setItem('authToken', authToken);
          console.log('✅ Login successful:', result.user);
          // Redirect to dashboard
          loadDashboard();
        } catch (error) {
          console.error('❌ Login failed:', error);
          alert('Invalid credentials');
        }
      }
    });
  }

  // Load dashboard data
  async function loadDashboard() {
    try {
      const summary = await dashboard.getSummary();
      updateDashboard(summary);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  }

  // Update dashboard UI with data
  function updateDashboard(data) {
    document.querySelectorAll('[data-field]').forEach(el => {
      const field = el.getAttribute('data-field');
      if (data[field]) {
        el.textContent = field === 'revenue' || field === 'expenses' || field === 'netProfit' || field === 'outstanding'
          ? `GH₵ ${data[field].toLocaleString()}`
          : data[field];
      }
    });
  }

  // Auto-load dashboard if logged in
  if (authToken) {
    loadDashboard();
  }
});
