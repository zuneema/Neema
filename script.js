// ====================
// CONFIGURATION
// ====================

let API_CONFIG = {
  url: localStorage.getItem('gs_api_url') || '',
  password: localStorage.getItem('gs_api_password') || 'admin123',
  isConfigured: localStorage.getItem('gs_api_configured') === 'true'
};

// ====================
// LOGIN FUNCTIONALITY
// ====================

if (document.getElementById('loginForm')) {
  const loginForm = document.getElementById('loginForm');
  const errorMessage = document.getElementById('errorMessage');
  
  const ADMIN_USERNAME = 'admin';
  const ADMIN_PASSWORD = 'password123';
  
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem('adminLoggedIn', 'true');
      localStorage.setItem('adminUsername', username);
      window.location.href = 'dashboard.html';
    } else {
      errorMessage.textContent = 'Invalid username or password!';
      errorMessage.style.display = 'block';
      loginForm.style.animation = 'shake 0.5s';
      setTimeout(() => { loginForm.style.animation = ''; }, 500);
    }
  });
}

// ====================
// DASHBOARD FUNCTIONALITY
// ====================

if (document.getElementById('studentTable')) {
  // Check login
  if (!localStorage.getItem('adminLoggedIn')) {
    window.location.href = 'index.html';
  }
  
  // Setup admin display
  document.getElementById('adminName').textContent = localStorage.getItem('adminUsername') || 'Administrator';
  
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', function() {
    localStorage.clear();
    window.location.href = 'index.html';
  });
  
  // Data storage
  let studentData = [];
  
  // Modal elements
  const editModal = document.getElementById('editModal');
  const configModal = document.getElementById('configModal');
  const editForm = document.getElementById('editForm');
  
  // ====================
  // GOOGLE SHEETS API FUNCTIONS (FREE VERSION)
  // ====================
  
  // Test connection to Google Apps Script
  async function testConnection() {
    if (!API_CONFIG.url) {
      return { success: false, message: "Please enter the Apps Script URL" };
    }
    
    try {
      const testUrl = `${API_CONFIG.url}?action=getAllData&password=${encodeURIComponent(API_CONFIG.password)}`;
      
      // Use a proxy to avoid CORS issues
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      const response = await fetch(proxyUrl + testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, message: "Connected successfully!", data: data };
      } else {
        return { success: false, message: "Connection failed. Check URL and password." };
      }
    } catch (error) {
      console.error('Connection test error:', error);
      return { success: false, message: `Error: ${error.message}` };
    }
  }
  
  // Fetch data from Google Sheets via Apps Script
  async function fetchFromGoogleSheets() {
    if (!API_CONFIG.isConfigured || !API_CONFIG.url) {
      console.log("Google Sheets not configured, using local data");
      return false;
    }
    
    try {
      showLoading(true);
      
      const url = `${API_CONFIG.url}?action=getAllData&password=${encodeURIComponent(API_CONFIG.password)}`;
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      
      const response = await fetch(proxyUrl + url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.data) {
          studentData = result.data.map(item => ({
            id: item.id || generateId(),
            name: item.name || '',
            phone: item.phone || '',
            email: item.email || '',
            course: item.course || '',
            query: item.query || '',
            status: item.status || 'PENDING',
            date: item.date || new Date().toLocaleDateString(),
            rowIndex: item.rowIndex // Store for updates
          }));
          
          localStorage.setItem('studentData_cache', JSON.stringify(studentData));
          localStorage.setItem('lastSync', new Date().toISOString());
          
          loadTableData();
          showNotification('Data synced from Google Sheets!', 'success');
          return true;
        }
      }
      
      return false;
      
    } catch (error) {
      console.error('Error fetching from Google Sheets:', error);
      return false;
    } finally {
      showLoading(false);
    }
  }
  
  // Save data to Google Sheets
  async function saveToGoogleSheets(action, recordData, rowIndex = null) {
    if (!API_CONFIG.isConfigured || !API_CONFIG.url) {
      console.log("Google Sheets not configured, saving locally only");
      return { success: true, localOnly: true };
    }
    
    try {
      const params = new URLSearchParams({
        action: action,
        password: API_CONFIG.password,
        ...recordData
      });
      
      if (rowIndex) {
        params.append('rowIndex', rowIndex);
      }
      
      const url = API_CONFIG.url;
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      
      // For POST requests
      const response = await fetch(proxyUrl + url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      });
      
      if (response.ok) {
        const result = await response.json();
        return { success: true, data: result };
      } else {
        return { success: false, message: "Failed to save to Google Sheets" };
      }
      
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
      return { success: false, message: error.message };
    }
  }
  
  // ====================
  // LOCAL STORAGE FUNCTIONS (Fallback)
  // ====================
  
  function loadFromLocalStorage() {
    const savedData = localStorage.getItem('studentData_cache');
    if (savedData) {
      studentData = JSON.parse(savedData);
      loadTableData();
      showNotification('Loaded from local cache', 'info');
      return true;
    }
    return false;
  }
  
  function saveToLocalStorage() {
    localStorage.setItem('studentData_cache', JSON.stringify(studentData));
  }
  
  // ====================
  // TABLE FUNCTIONS
  // ====================
  
  function loadTableData() {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    studentData.forEach((student, index) => {
      const row = document.createElement('tr');
      
      let statusClass = '';
      if (student.status === 'PENDING') statusClass = 'status-pending';
      if (student.status === 'IN PROGRESS') statusClass = 'status-inprogress';
      if (student.status === 'RESOLVED') statusClass = 'status-resolved';
      
      row.innerHTML = `
        <td>${student.id}</td>
        <td>${student.name}</td>
        <td>${student.phone}</td>
        <td>${student.email}</td>
        <td>${student.course}</td>
        <td>${student.query}</td>
        <td><span class="status-badge ${statusClass}">${student.status}</span></td>
        <td>${student.date}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn edit-btn" data-index="${index}">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="action-btn delete-btn" data-index="${index}">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
    
    document.getElementById('rowCount').textContent = studentData.length;
    
    // Add event listeners
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = this.getAttribute('data-index');
        openEditModal(index);
      });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = this.getAttribute('data-index');
        deleteRecord(index);
      });
    });
  }
  
  function openEditModal(index) {
    const student = studentData[index];
    
    document.getElementById('modalTitle').textContent = 'Edit Record';
    document.getElementById('editId').value = index;
    document.getElementById('editRowIndex').value = student.rowIndex || '';
    document.getElementById('editName').value = student.name;
    document.getElementById('editPhone').value = student.phone;
    document.getElementById('editEmail').value = student.email;
    document.getElementById('editCourse').value = student.course;
    document.getElementById('editQuery').value = student.query;
    document.getElementById('editStatus').value = student.status;
    
    editModal.style.display = 'flex';
  }
  
  // Close modals
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function() {
      editModal.style.display = 'none';
      editForm.reset();
    });
  });
  
  document.querySelectorAll('.close-config').forEach(btn => {
    btn.addEventListener('click', function() {
      configModal.style.display = 'none';
    });
  });
  
  // Save data (tries Google Sheets first, falls back to local)
  editForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const index = document.getElementById('editId').value;
    const rowIndex = document.getElementById('editRowIndex').value;
    const isNew = index === 'new';
    
    const recordData = {
      name: document.getElementById('editName').value,
      phone: document.getElementById('editPhone').value,
      email: document.getElementById('editEmail').value,
      course: document.getElementById('editCourse').value,
      query: document.getElementById('editQuery').value,
      status: document.getElementById('editStatus').value,
      date: isNew ? new Date().toLocaleString() : studentData[index].date
    };
    
    if (isNew) {
      // Generate ID for new record
      recordData.id = generateId();
      
      // Try to save to Google Sheets
      const gsResult = await saveToGoogleSheets('addRecord', recordData);
      
      if (gsResult.success) {
        // If Google Sheets save successful, fetch fresh data
        if (!gsResult.localOnly) {
          await fetchFromGoogleSheets();
        } else {
          // Local only
          studentData.unshift({ ...recordData, rowIndex: studentData.length + 2 });
          saveToLocalStorage();
          loadTableData();
        }
      } else {
        // Fallback to local
        studentData.unshift({ ...recordData, rowIndex: studentData.length + 2 });
        saveToLocalStorage();
        loadTableData();
      }
    } else {
      // Update existing record
      const updateRowIndex = rowIndex || studentData[index].rowIndex;
      
      // Try Google Sheets
      const gsResult = await saveToGoogleSheets('updateRecord', recordData, updateRowIndex);
      
      if (gsResult.success) {
        // Update local data
        studentData[index] = { ...studentData[index], ...recordData };
        
        if (!gsResult.localOnly) {
          // Refresh from Google Sheets if connected
          await fetchFromGoogleSheets();
        } else {
          // Local only
          saveToLocalStorage();
          loadTableData();
        }
      } else {
        // Local only
        studentData[index] = { ...studentData[index], ...recordData };
        saveToLocalStorage();
        loadTableData();
      }
    }
    
    editModal.style.display = 'none';
    editForm.reset();
    
    showNotification(isNew ? 'Record added!' : 'Record updated!', 'success');
  });
  
  // Delete record
  async function deleteRecord(index) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    const student = studentData[index];
    
    if (student.rowIndex) {
      // Try Google Sheets
      const gsResult = await saveToGoogleSheets('deleteRecord', {}, student.rowIndex);
      
      if (!gsResult.success) {
        if (!confirm('Failed to delete from Google Sheets. Delete locally only?')) return;
      }
    }
    
    // Remove from local data
    studentData.splice(index, 1);
    saveToLocalStorage();
    loadTableData();
    
    showNotification('Record deleted!', 'success');
  }
  
  // Add new record button
  document.getElementById('addNewBtn').addEventListener('click', function() {
    editForm.reset();
    document.getElementById('modalTitle').textContent = 'Add New Record';
    document.getElementById('editId').value = 'new';
    document.getElementById('editRowIndex').value = '';
    document.getElementById('editName').value = '';
    document.getElementById('editPhone').value = '';
    document.getElementById('editEmail').value = '';
    document.getElementById('editCourse').value = 'Computer Science';
    document.getElementById('editQuery').value = '';
    document.getElementById('editStatus').value = 'PENDING';
    
    editModal.style.display = 'flex';
    document.getElementById('editName').focus();
  });
  
  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', async function() {
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
    
    if (API_CONFIG.isConfigured) {
      await fetchFromGoogleSheets();
    } else {
      loadFromLocalStorage();
    }
    
    this.innerHTML = '<i class="fas fa-check"></i> Refreshed';
    setTimeout(() => {
      this.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
    }, 1500);
  });
  
  // ====================
  // CONFIGURATION MODAL
  // ====================
  
  // Show config modal on first visit
  if (!API_CONFIG.isConfigured) {
    setTimeout(() => {
      configModal.style.display = 'flex';
    }, 1000);
  }
  
  // Test connection button
  document.getElementById('testConnection').addEventListener('click', async function() {
    const statusEl = document.getElementById('configStatus');
    statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing connection...';
    statusEl.className = 'status-message info';
    
    API_CONFIG.url = document.getElementById('apiUrl').value;
    API_CONFIG.password = document.getElementById('apiPassword').value;
    
    const result = await testConnection();
    
    if (result.success) {
      statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Connection successful!';
      statusEl.className = 'status-message success';
    } else {
      statusEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${result.message}`;
      statusEl.className = 'status-message error';
    }
  });
  
  // Save config button
  document.getElementById('saveConfig').addEventListener('click', function() {
    API_CONFIG.url = document.getElementById('apiUrl').value;
    API_CONFIG.password = document.getElementById('apiPassword').value;
    
    if (API_CONFIG.url && API_CONFIG.password) {
      API_CONFIG.isConfigured = true;
      
      localStorage.setItem('gs_api_url', API_CONFIG.url);
      localStorage.setItem('gs_api_password', API_CONFIG.password);
      localStorage.setItem('gs_api_configured', 'true');
      
      configModal.style.display = 'none';
      showNotification('Google Sheets connected!', 'success');
      
      // Load data from Google Sheets
      fetchFromGoogleSheets();
    } else {
      showNotification('Please enter both URL and password', 'error');
    }
  });
  
  // ====================
  // HELPER FUNCTIONS
  // ====================
  
  function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
  
  function showLoading(show) {
    let loader = document.getElementById('globalLoader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'globalLoader';
      loader.innerHTML = '<div class="loader"></div>';
      loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255,255,255,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        display: none;
      `;
      
      const loaderStyle = document.createElement('style');
      loaderStyle.textContent = `
        .loader {
          border: 5px solid #f3f3f3;
          border-top: 5px solid #667eea;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(loaderStyle);
      
      document.body.appendChild(loader);
    }
    
    loader.style.display = show ? 'flex' : 'none';
  }
  
  function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      border-radius: 5px;
      box-shadow: 0 3px 10px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  // Add animation styles
  const animationStyles = document.createElement('style');
  animationStyles.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    .status-message {
      padding: 10px;
      border-radius: 5px;
      margin: 10px 0;
    }
    .status-message.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    .status-message.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    .status-message.info {
      background: #d1ecf1;
      color: #0c5460;
      border: 1px solid #bee5eb;
    }
    .setup-steps ol {
      margin: 15px 0;
      padding-left: 20px;
    }
    .setup-steps li {
      margin-bottom: 8px;
    }
  `;
  document.head.appendChild(animationStyles);
  
  // ====================
  // INITIAL LOAD
  // ====================
  
  // Initial data load
  if (API_CONFIG.isConfigured) {
    fetchFromGoogleSheets();
  } else {
    // Load sample data if no local data exists
    if (!loadFromLocalStorage()) {
      // Default sample data
      studentData = [
        {
          id: '1',
          name: 'Anomy',
          phone: '324324234',
          email: 'ergerg@gmail.com',
          course: 'Other',
          query: 'fghfhertetdfg',
          status: 'IN PROGRESS',
          date: '2026-01-19',
          rowIndex: 2
        },
        {
          id: '2',
          name: 'Anomy',
          phone: '234234',
          email: 'ergerg@gmail.com',
          course: 'Computer Science',
          query: 'fsf',
          status: 'PENDING',
          date: '2026-01-19',
          rowIndex: 3
        },
        {
          id: '3',
          name: 'edge',
          phone: '345345',
          email: 'ergerg@gmail.com',
          course: 'Computer Science',
          query: 'fghfgh',
          status: 'PENDING',
          date: '2026-01-19',
          rowIndex: 4
        }
      ];
      
      saveToLocalStorage();
      loadTableData();
    }
  }
}
