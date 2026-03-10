const STORAGE_KEY = "ipt_demo_v1";
let currentUser = null;
let deleteTarget = { type: null, index: null };

let editTarget = { type: null, index: null }; 

const routes = {
  "/profile": renderProfile,
  "/accounts": renderAccounts,
  "/employees": renderEmployees,
  "/departments": renderDepartments,
  "/requests": renderRequests
};

function loadFromStorage() {
  const data = localStorage.getItem(STORAGE_KEY);

  if (data) {
    window.db = JSON.parse(data);
  } else {
    window.db = {
      accounts: [
        {
          firstName: "Admin",
          lastname: "User",
          email: "admin@example.com",
          password: "Password123!",
          role: "Admin",
          verified: true,
        },
      ],
      departments: [
        {
          deptName: "Engineering",
          deptDesc: "Software Team",
        },
        {
          deptName: "HR",
          deptDesc: "Human Resources",
        },
      ],
      employees: [],
      requests: []
    };

    saveToStorage();
  }

  const savedToken = localStorage.getItem("auth_token");
  if (savedToken) {
    const activeUser = window.db.accounts.find((ac) => ac.email === savedToken);

    if (activeUser) {
      currentUser = activeUser;
      console.log(currentUser);
      setAuthState(true, currentUser);
    }
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

function handleRouting() {
  const hash = window.location.hash || "#/home";
  let cleanHash = hash.replace("/", "");

  const protectedRoutes = ["#profile", "#accounts", "#employees", "#departments", "#requests"];

  if (protectedRoutes.includes(cleanHash) && !currentUser) {
    showToast("Please log in to access this page.", "warning");
    return navigateTo("");
  }

  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
  });

  const targetPage = document.querySelector(cleanHash);

  if (
    targetPage &&
    targetPage.classList.contains("role-admin") &&
    !document.body.classList.contains("is-admin")
  ) {
    showToast("Access denied! Admins only.", "danger");
    return navigateTo("#/profile");
  }
  
  if (targetPage) {
    targetPage.classList.add("active");
  }

  if (cleanHash === "#login") {
    const loginAlert = document.getElementById("login-verified-alert");
    
    if (sessionStorage.getItem("just_verified") === "true") {
      loginAlert.classList.remove("d-none"); 
      sessionStorage.removeItem("just_verified"); 
    } else {
      loginAlert.classList.add("d-none"); 
    }
  }

  let routeKey = cleanHash.replace("#", "/");

  if (routes[routeKey]) {
    routes[routeKey]();
  }
}

function handleRegistration(event) {
  event.preventDefault();

  const form = document.getElementById("registrationForm");
  const firstName = document.getElementById("reg-first-name").value;
  const lastName = document.getElementById("reg-last-name").value;
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;

  if (password.length < 6) {
    showToast("Password must be at least 6 characters long!", "warning");
    return;
  }

  const doesEmailExist = window.db.accounts.some((ac) => ac.email === email);

  if (doesEmailExist) {
    showToast("This email is already registered!", "danger");
    return;
  }

  const registeredAccount = {
    firstName,
    lastName,
    email,
    password,
    role: "User",
    verified: false,
  };

  window.db.accounts.push(registeredAccount);
  localStorage.setItem("unverified_email", email);
  saveToStorage();

  if (form) {
    form.reset();
  }

  showToast("Registration successful! Please verify your email.", "success");
  navigateTo("#/verify-email");
}

function handleEmailVerification() {
  const email = localStorage.getItem("unverified_email");
  const targetAccount = window.db.accounts.find((ac) => ac.email === email);

  if (targetAccount) {
    targetAccount.verified = true;

    localStorage.setItem("accounts_db", JSON.stringify(window.db.accounts));
    localStorage.removeItem("unverified_email");
    
    sessionStorage.setItem("just_verified", "true");
    
    navigateTo("#/login");
  }
}

function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("log-email").value;
  const password = document.getElementById("log-password").value;

  const accountValid = window.db.accounts.find(
    (ac) => ac.email === email && ac.password === password && ac.verified,
  );
  
  if (accountValid) {
    console.log(accountValid.role);
    localStorage.setItem("auth_token", accountValid.email);
    currentUser = accountValid;
    setAuthState(true, currentUser);
    
    showToast(`Welcome back, ${currentUser.firstName}! Logged in successfully.`, "success");
    
    navigateTo("#/profile");
  } else {
    showToast("Invalid credentials or unverified email!", "danger");
  }
}

function setAuthState(isAuth, user) {
  if (isAuth) {
    document.body.classList.remove("not-authenticated");
    document.body.classList.add("authenticated");
    
    const navUsername = document.getElementById("nav-username");
    if (navUsername) {
      navUsername.innerText = user.role;
    }

    if (user.role.toLowerCase() === "admin") {
      document.body.classList.add("is-admin");
    }
  } else {
    document.body.classList.remove("authenticated");
    document.body.classList.remove("is-admin");
    document.body.classList.add("not-authenticated");
  }
}

function navigateTo(hash) {
  window.location.hash = hash;
}

// --> 2. RESET editTarget WHEN CLOSING FORMS
function toggleAccountForm() {
  const formContainer = document.getElementById("account-form-container");
  formContainer.classList.toggle("d-none");

  if (!formContainer.classList.contains("d-none")) {
    document.querySelector("#account-form-container form").reset();
  } else {
    editTarget = { type: null, index: null }; // Reset when hiding
  }
}

function toggleEmployeeForm() {
  const formContainer = document.getElementById("employee-form-container");
  formContainer.classList.toggle("d-none");

  if (!formContainer.classList.contains("d-none")) {
    document.querySelector("#employee-form-container form").reset();
    populateDepartmentDropdown();
  } else {
    editTarget = { type: null, index: null }; // Reset when hiding
  }
}

function toggleDeptForm() {
  const formContainer = document.getElementById("dept-form-container");
  formContainer.classList.toggle("d-none");

  if (!formContainer.classList.contains("d-none")) {
    document.querySelector("#dept-form-container form").reset();
  } else {
    editTarget = { type: null, index: null }; // Reset when hiding
  }
}

function addRow() {
  const itemList = document.getElementById("modal-item-list");
  const newRow = document.createElement("div");
  newRow.className = "d-flex gap-2 mb-2 align-items-center";

  const removeBtnId = "remove-btn-" + Date.now();

  newRow.innerHTML = `
        <input type="text" class="form-control" placeholder="Item name" />
        <input type="number" class="form-control w-25" value="1" />
        <button type="button" class="btn btn-outline-danger px-2" id="${removeBtnId}">
            x
        </button>
    `;

  itemList.appendChild(newRow);

  document.getElementById(removeBtnId).addEventListener("click", function() {
    newRow.remove();
  });
}

function handleEmployeeSubmit(event) {
  event.preventDefault();

  const employeeId = document.getElementById("emp-id").value;
  const employeeEmail = document.getElementById("emp-email").value;
  const employeePosition = document.getElementById("emp-position").value;
  const employeeDepartment = document.getElementById("emp-dept").value;
  const employeeHiredDate = document.getElementById("emp-hire-date").value;

  if (!employeeId || !employeeEmail || !employeePosition || !employeeDepartment || !employeeHiredDate) {
    showToast("Please fill out all employee fields!", "warning");
    return;
  }

  // Check if ID exists, BUT ignore it if we are just editing the SAME row
  const existingIndex = window.db.employees.findIndex((em) => em.id === employeeId);
  if (existingIndex !== -1 && existingIndex !== editTarget.index) {
   showToast("This Employee ID already exists!", "danger");
   return;
  }

  const insertEmployee = {
    id: employeeId,
    email: employeeEmail,
    position: employeePosition,
    department: employeeDepartment,
    hireDate: employeeHiredDate,
  };

  // --> 3. CHECK IF WE ARE EDITING OR ADDING
  if (editTarget.type === "employees" && editTarget.index !== null) {
    window.db.employees[editTarget.index] = insertEmployee;
    showToast("Employee updated successfully!", "success");
  } else {
    window.db.employees.push(insertEmployee);
    showToast("Employee saved successfully!", "success");
  }

  saveToStorage();
  renderEmployees();
  toggleEmployeeForm(); 
}

function handleDeptSubmit(event) {
  event.preventDefault();

  const departmentName = document.getElementById("dept-name").value.trim();
  const departmentDescription = document.getElementById("dept-desc").value.trim();

  if (!departmentName || !departmentDescription) {
    showToast("Please fill out all department fields!", "warning");
    return;
  }

  const insertDepartment = {
    deptName: departmentName,
    deptDesc: departmentDescription,
  };

  // --> 3. CHECK IF WE ARE EDITING OR ADDING
  if (editTarget.type === "departments" && editTarget.index !== null) {
    window.db.departments[editTarget.index] = insertDepartment;
    showToast("Department updated successfully!", "success");
  } else {
    window.db.departments.push(insertDepartment);
    showToast("Department saved successfully!", "success");
  }

  saveToStorage();
  renderDepartments();
  toggleDeptForm(); 
}

function handleAccountSubmit(event) {
  event.preventDefault();

  const firstName = document.getElementById("acc-first-name").value;
  const lastName = document.getElementById("acc-last-name").value;
  const email = document.getElementById("acc-email").value;
  const password = document.getElementById("acc-password").value;
  const role = document.getElementById("acc-role").value;
  const verified = document.getElementById("acc-verified").checked;

  if (!firstName || !lastName || !email || !password) {
    showToast("Please fill out all account fields!", "warning");
    return;
  }

  if (password.length < 6) {
    showToast("Password must be at least 6 characters long!", "warning");
    return;
  }

  const existingIndex = window.db.accounts.findIndex((ac) => ac.email === email);
  if (existingIndex !== -1 && existingIndex !== editTarget.index) {
    showToast("This email is already registered!", "danger");
    return;
  }

  if (!verified) {
    localStorage.setItem("unverified_email", email);
  }

  const insertAccount = {
    firstName,
    lastName,
    email,
    password,
    role,
    verified,
  };

  if (editTarget.type === "accounts" && editTarget.index !== null) {
    window.db.accounts[editTarget.index] = insertAccount;
    showToast("Account updated successfully!", "success");
  } else {
    window.db.accounts.push(insertAccount);
    showToast("Account saved successfully!", "success");
  }

  saveToStorage();
  renderAccounts();
  toggleAccountForm(); 
}

function handleLogout() {
  localStorage.removeItem("auth_token");
  currentUser = null;
  setAuthState(false, currentUser);
  navigateTo("");
  
  showToast("Logged out successfully.", "success");
}

function submitRequest() {
  const itemList = document.getElementById("modal-item-list");
  const rows = itemList.querySelectorAll(".d-flex");
  const items = [];

  rows.forEach(row => {
    const inputs = row.querySelectorAll("input");
    const itemName = inputs[0].value.trim();
    const quantity = parseInt(inputs[1].value, 10);

    if (itemName && quantity > 0) {
      items.push({ name: itemName, quantity: quantity });
    }
  });

  if (items.length === 0) {
    showToast("Please add at least one valid item.", "warning");
    return;
  }

  const newRequest = {
    id: "REQ-" + Math.floor(1000 + Math.random() * 9000), 
    userEmail: currentUser ? currentUser.email : "Unknown",
    date: new Date().toISOString().split("T")[0], 
    type: "Equipment",
    status: "Pending",
    items: items
  };

  window.db.requests.push(newRequest);
  saveToStorage();

  const modalElement = document.getElementById("requestModal");
  const modalInstance = bootstrap.Modal.getInstance(modalElement);
  modalInstance.hide();

  document.getElementById("newRequestForm").reset();
  
  itemList.innerHTML = `
    <div class="d-flex gap-2 mb-2 align-items-center">
      <input type="text" class="form-control" placeholder="Item name" />
      <input type="number" class="form-control w-25" value="1" />
      <button type="button" class="btn btn-outline-secondary px-2" id="initial-add-row-btn">
        +
      </button>
    </div>
  `;
  
  document.getElementById("initial-add-row-btn").addEventListener("click", addRow);
  renderRequests();
  showToast("Request submitted successfully!", "success");
}

function renderProfile() {
   if(currentUser){
      document.getElementById("profile-name").textContent = `${currentUser.firstName} ${currentUser.lastname || currentUser.lastName || ''}`;
      document.getElementById("profile-email").textContent = currentUser.email;
      document.getElementById("profile-role").textContent = currentUser.role;
   }
}

function renderAccounts() {
  const tbody = document.getElementById("account-list-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (window.db.accounts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-secondary">No accounts found.</td></tr>`;
    return;
  }

  window.db.accounts.forEach((ac, index) => {
    const lName = ac.lastName || ac.lastname || "";
    tbody.innerHTML += `
      <tr>
        <td>${ac.firstName} ${lName}</td>
        <td>${ac.email}</td>
        <td>${ac.role}</td>
        <td><span class="${ac.verified ? "text-success" : "text-danger"}">${ac.verified ? "✅" : "❌"}</span></td>
        <td>
          <div class="d-flex gap-1">
            <button class="btn btn-sm btn-outline-primary px-2" id="edit-acc-${index}">Edit</button>
            <button class="btn btn-sm btn-outline-danger px-2" id="del-acc-${index}">Delete</button>
          </div>
        </td>
      </tr>
    `;
  });

  window.db.accounts.forEach((ac, index) => {
    document.getElementById(`edit-acc-${index}`).addEventListener("click", function() {
      editItem('accounts', index);
    });
    
    document.getElementById(`del-acc-${index}`).addEventListener("click", function() {
      if (currentUser && currentUser.email === ac.email) {
        showToast("Action Denied: You cannot delete your own account!", "danger");
        return; 
      }
      
      confirmDelete('accounts', index);
    });
  });
}

function renderEmployees() {
  const tbody = document.getElementById("employee-list-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (window.db.employees.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-secondary">No employees found.</td></tr>`;
    return;
  }

  window.db.employees.forEach((em, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${em.id}</td>
        <td>${em.email}</td>
        <td>${em.position}</td>
        <td>${em.department}</td>
        <td>
          <div class="d-flex gap-1">
            <button class="btn btn-sm btn-outline-primary" id="edit-emp-${index}">Edit</button>
            <button class="btn btn-sm btn-outline-danger" id="del-emp-${index}">Delete</button>
          </div>
        </td>
      </tr>
    `;
  });

  window.db.employees.forEach((em, index) => {
    document.getElementById(`edit-emp-${index}`).addEventListener("click", function() {
      editItem('employees', index);
    });
    document.getElementById(`del-emp-${index}`).addEventListener("click", function() {
      confirmDelete('employees', index);
    });
  });
}

function renderDepartments() {
  const tbody = document.getElementById("dept-list-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (window.db.departments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-secondary">No departments found.</td></tr>`;
    return;
  }

  window.db.departments.forEach((d, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${d.deptName}</td>
        <td class="text-secondary">${d.deptDesc}</td>   
        <td>
          <div class="d-flex gap-1">
            <button class="btn btn-sm btn-outline-primary px-2" id="edit-dept-${index}">Edit</button>
            <button class="btn btn-sm btn-outline-danger" id="del-dept-${index}">Delete</button>          
          </div>
        </td>
      </tr>
    `;
  });

  window.db.departments.forEach((d, index) => {
    document.getElementById(`edit-dept-${index}`).addEventListener("click", function() {
      editItem('departments', index);
    });
    document.getElementById(`del-dept-${index}`).addEventListener("click", function() {
      confirmDelete('departments', index);
    });
  });
}

function renderRequests() {
  const emptyState = document.getElementById("requests-empty");
  const tableContainer = document.getElementById("requests-table-container");
  const tbody = document.getElementById("request-list-body");

  if (!tbody) return;

  let requestsToRender = [];
  const isAdmin = currentUser && currentUser.role.toLowerCase() === "admin";

  if (isAdmin) {
    requestsToRender = window.db.requests;
    document.querySelector("#requests h2").innerText = "All Requests"; 
  } else {
    requestsToRender = window.db.requests.filter(req => req.userEmail === currentUser.email);
    document.querySelector("#requests h2").innerText = "My Requests";
  }

  if (requestsToRender.length === 0) {
    emptyState.classList.remove("d-none");
    tableContainer.classList.add("d-none");
    return;
  }

  emptyState.classList.add("d-none");
  tableContainer.classList.remove("d-none");
  tbody.innerHTML = "";

  requestsToRender.forEach((req, displayIndex) => {
    const itemsHTML = req.items.map(item => `&bull; ${item.quantity}x ${item.name}`).join('<br>');
    
    let badgeClass = "bg-warning text-dark"; 
    if (req.status === "Approved") badgeClass = "bg-success";
    if (req.status === "Rejected") badgeClass = "bg-danger";

    let actionButtons = "";
    
    if (isAdmin) {
      if (req.status === "Pending") {
        actionButtons += `<button class="btn btn-sm btn-outline-success px-2 me-1" id="approve-req-${req.id}">Approve</button>`;
        actionButtons += `<button class="btn btn-sm btn-outline-danger px-2" id="reject-req-${req.id}">Reject</button>`;
      } else {
        actionButtons += `<span class="text-secondary small">Processed</span>`;
      }
    } else {
      if (req.status === "Pending") {
        const realIndex = window.db.requests.findIndex(r => r.id === req.id);
        actionButtons += `<button class="btn btn-sm btn-outline-danger px-2" id="del-req-${realIndex}">Delete</button>`;
      } else {
        actionButtons += `<span class="text-secondary small">Locked</span>`;
      }
    }

    tbody.innerHTML += `
      <tr>
        <td><strong>${req.id}</strong></td>
        <td class="text-secondary">${req.date}</td>
        <td>${req.userEmail}</td>
        <td><small>${itemsHTML}</small></td>
        <td><span class="badge ${badgeClass}">${req.status}</span></td>
        <td>
          <div class="d-flex align-items-center">
            ${actionButtons}
          </div>
        </td>
      </tr>
    `;
  });

  // Attach event listeners
  requestsToRender.forEach((req) => {
    if (isAdmin && req.status === "Pending") {
      document.getElementById(`approve-req-${req.id}`).addEventListener("click", function() {
        updateRequestStatus(req.id, 'Approved');
      });
      document.getElementById(`reject-req-${req.id}`).addEventListener("click", function() {
        updateRequestStatus(req.id, 'Rejected');
      });
    } else if (!isAdmin && req.status === "Pending") {
      const realIndex = window.db.requests.findIndex(r => r.id === req.id);
      document.getElementById(`del-req-${realIndex}`).addEventListener("click", function() {
        confirmDelete('requests', realIndex);
      });
    }
  });
}

function updateRequestStatus(requestId, newStatus) {
  const requestToUpdate = window.db.requests.find(req => req.id === requestId);
  
  if (requestToUpdate) {
    requestToUpdate.status = newStatus;
    saveToStorage();
    renderRequests();
    
    showToast(`Request ${newStatus.toLowerCase()} successfully!`, "success");
  }
}

function confirmDelete(type, index) {
  deleteTarget = { type, index };
  const modal = new bootstrap.Modal(
    document.getElementById("deleteConfirmModal"),
  );
  modal.show();
}

function executeDelete() {
  const { type, index } = deleteTarget;

  window.db[type].splice(index, 1);
  saveToStorage();

  if (type === "employees") renderEmployees();
  if (type === "accounts") renderAccounts();
  if (type === "departments") renderDepartments();
  if (type === "requests") renderRequests();

  const modal = bootstrap.Modal.getInstance(
    document.getElementById("deleteConfirmModal"),
  );
  modal.hide();
  
  showToast("Item deleted successfully!", "success");
}

function editItem(type, index) {
  editTarget = { type: type, index: index }; 
  const item = window.db[type][index];

  if (type === "employees") {
    toggleEmployeeForm(); 
    document.getElementById("emp-id").value = item.id;
    document.getElementById("emp-email").value = item.email;
    document.getElementById("emp-position").value = item.position;
    document.getElementById("emp-dept").value = item.department;
    document.getElementById("emp-hire-date").value = item.hireDate;
  } else if (type === "departments") {
    toggleDeptForm();
    document.getElementById("dept-name").value = item.deptName;
    document.getElementById("dept-desc").value = item.deptDesc;
  } else if (type === "accounts") {
    toggleAccountForm();
    document.getElementById("acc-first-name").value = item.firstName;
    document.getElementById("acc-last-name").value = item.lastName || item.lastname;
    document.getElementById("acc-email").value = item.email;
    document.getElementById("acc-password").value = item.password;
    document.getElementById("acc-role").value = item.role;
    document.getElementById("acc-verified").checked = item.verified;
  }
}

function populateDepartmentDropdown() {
  const deptSelect = document.getElementById("emp-dept");
  if (!deptSelect) return;

  deptSelect.innerHTML = `<option value="" disabled selected>Select a department...</option>`;

  window.db.departments.forEach(dept =>
    deptSelect.innerHTML += `<option value="${dept.deptName}">${dept.deptName}</option>`
  );
}

function showToast(message, type = "danger") {
  const toastEl = document.getElementById("appToast");
  const toastMessage = document.getElementById("toastMessage");

  toastEl.className = `toast align-items-center border-0 bg-${type}`;
  toastMessage.innerText = message;

  const toastInstance = new bootstrap.Toast(toastEl);
  toastInstance.show();
}

window.addEventListener("hashchange", handleRouting);
window.addEventListener("load", handleRouting);

window.addEventListener("DOMContentLoaded", function() {
  
  document.getElementById("registrationForm")?.addEventListener("submit", handleRegistration);
  document.getElementById("login-form")?.addEventListener("submit", handleLogin);
  
  document.querySelector("#employee-form-container form")?.addEventListener("submit", handleEmployeeSubmit);
  document.querySelector("#dept-form-container form")?.addEventListener("submit", handleDeptSubmit);
  document.querySelector("#account-form-container form")?.addEventListener("submit", handleAccountSubmit);

  document.getElementById("logout-btn")?.addEventListener("click", handleLogout);
  document.getElementById("verify-email-btn")?.addEventListener("click", handleEmailVerification);
  
  document.getElementById("add-employee-btn")?.addEventListener("click", toggleEmployeeForm);
  document.getElementById("add-dept-btn")?.addEventListener("click", toggleDeptForm);
  document.getElementById("add-account-btn")?.addEventListener("click", toggleAccountForm);

  document.getElementById("execute-delete-btn")?.addEventListener("click", executeDelete);
  document.getElementById("submit-request-btn")?.addEventListener("click", submitRequest);
  document.getElementById("initial-add-row-btn")?.addEventListener("click", addRow);

  document.getElementById("cancel-employee-btn")?.addEventListener("click", toggleEmployeeForm);
  document.getElementById("cancel-dept-btn")?.addEventListener("click", toggleDeptForm);
  document.getElementById("cancel-account-btn")?.addEventListener("click", toggleAccountForm);

  loadFromStorage();
});