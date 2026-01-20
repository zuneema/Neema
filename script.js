// ====================
// LOGIN FUNCTIONALITY
// ====================

if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    
    // Default admin credentials
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD = 'password123';
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            // Store login status in localStorage
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminUsername', username);
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            errorMessage.textContent = 'Invalid username or password!';
            errorMessage.style.display = 'block';
            
            // Shake animation for error
            loginForm.style.animation = 'shake 0.5s';
            setTimeout(() => {
                loginForm.style.animation = '';
            }, 500);
        }
    });
}

// ====================
// DASHBOARD FUNCTIONALITY
// ====================

if (document.getElementById('studentTable')) {
    // Check if user is logged in
    if (!localStorage.getItem('adminLoggedIn')) {
        window.location.href = 'index.html';
    }
    
    // Display admin name
    const adminName = localStorage.getItem('adminUsername') || 'Administrator';
    document.getElementById('adminName').textContent = adminName;
    
    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminUsername');
        window.location.href = 'index.html';
    });
    
    // Sample data - in a real app, this would come from a database
    let studentData = [
        {
            id: '1',
            name: 'Anomy',
            phone: '324324234',
            email: 'ergerg@gmail.com',
            course: 'Other',
            query: 'fghfhertetdfg',
            status: 'IN PROGRESS',
            date: '2026-19T18'
        },
        {
            id: '2',
            name: 'Anomy',
            phone: '234234',
            email: 'ergerg@gmail.com',
            course: 'Computer Science',
            query: 'fsf',
            status: 'PENDING',
            date: '2026-19T18'
        },
        {
            id: '1768893363749',
            name: 'edge',
            phone: '345345',
            email: 'ergerg@gmail.com',
            course: 'Computer Science',
            query: 'fghfgh',
            status: 'PENDING',
            date: '2026-19T18'
        }
    ];
    
    // Modal elements
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editForm');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    
    // Load data into table
    function loadTableData() {
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';
        
        studentData.forEach((student, index) => {
            const row = document.createElement('tr');
            
            // Status badge class
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
        
        // Update row count
        document.getElementById('rowCount').textContent = studentData.length;
        
        // Add event listeners to edit/delete buttons
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
    
    // Open edit modal
    function openEditModal(index) {
        const student = studentData[index];
        
        document.getElementById('editId').value = index;
        document.getElementById('editName').value = student.name;
        document.getElementById('editPhone').value = student.phone;
        document.getElementById('editEmail').value = student.email;
        document.getElementById('editCourse').value = student.course;
        document.getElementById('editQuery').value = student.query;
        document.getElementById('editStatus').value = student.status;
        
        editModal.style.display = 'flex';
    }
    
    // Close modal
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            editModal.style.display = 'none';
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === editModal) {
            editModal.style.display = 'none';
        }
    });
    
    // Save edited data
    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const index = document.getElementById('editId').value;
        
        // Update the data
        studentData[index] = {
            ...studentData[index],
            name: document.getElementById('editName').value,
            phone: document.getElementById('editPhone').value,
            email: document.getElementById('editEmail').value,
            course: document.getElementById('editCourse').value,
            query: document.getElementById('editQuery').value,
            status: document.getElementById('editStatus').value
        };
        
        // Reload table
        loadTableData();
        
        // Close modal
        editModal.style.display = 'none';
        
        // Show success message
        alert('Record updated successfully!');
    });
    
    // Delete record
    function deleteRecord(index) {
        if (confirm('Are you sure you want to delete this record?')) {
            studentData.splice(index, 1);
            loadTableData();
            alert('Record deleted successfully!');
        }
    }
    
    // Add new record
    document.getElementById('addNewBtn').addEventListener('click', function() {
        // Create a new empty record
        const newRecord = {
            id: Date.now().toString(),
            name: 'New Student',
            phone: '0000000000',
            email: 'new@example.com',
            course: 'Computer Science',
            query: 'New query',
            status: 'PENDING',
            date: new Date().toISOString().split('T')[0]
        };
        
        studentData.unshift(newRecord);
        loadTableData();
        
        // Open edit modal for the new record
        setTimeout(() => {
            openEditModal(0);
        }, 100);
    });
    
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', function() {
        loadTableData();
        this.innerHTML = '<i class="fas fa-check"></i> Refreshed';
        setTimeout(() => {
            this.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        }, 1500);
    });
    
    // Initial load
    loadTableData();
}

// Shake animation for login error
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);
