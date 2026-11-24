
/* =====================================================
   SERVICENOW - CHANGE MANAGEMENT PORTAL
   Complete Frontend JavaScript
===================================================== */


/* =====================================================
   COMMON FUNCTIONS
===================================================== */

function getChanges() {
    return JSON.parse(localStorage.getItem("changeRequests") || "[]");
}

function saveChanges(requests) {
    localStorage.setItem("changeRequests", JSON.stringify(requests));
}

function getLoggedInEmployee() {
    return JSON.parse(sessionStorage.getItem("loggedInEmployee") || "null");
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function(char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[char];
    });
}

function logout() {
    if (confirm("Are you sure you want to logout?")) {
        sessionStorage.removeItem("loggedInEmployee");
        window.location.href = "login.html";
    }
}

function updateProfile(name, nameId, initialId, defaultName) {
    const nameElement = document.getElementById(nameId);
    const initialElement = document.getElementById(initialId);

    if (nameElement) {
        nameElement.textContent = name || defaultName;
    }

    if (initialElement) {
        initialElement.textContent =
            (name || defaultName).charAt(0).toUpperCase();
    }
}

function showEmptyMessage(table, message, columns = 8) {
    if (table) {
        table.innerHTML = `
            <tr>
                <td colspan="${columns}" class="empty-message">
                    ${escapeHTML(message)}
                </td>
            </tr>
        `;
    }
}


/* =====================================================
   EMPLOYEE LOGIN
===================================================== */

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const email = document.getElementById("email").value
            .trim().toLowerCase();

        const password = document.getElementById("password").value;
        const message = document.getElementById("loginMessage");

        const employees = JSON.parse(
            localStorage.getItem("employees") || "[]"
        );

        const employee = employees.find(user =>
            (user.email || "").toLowerCase() === email &&
            user.password === password
        );

        if (employee) {
            sessionStorage.setItem(
                "loggedInEmployee",
                JSON.stringify(employee)
            );

            window.location.href = "userpage.html";
        } else if (message) {
            message.textContent =
                "Invalid email or password. Please register first.";
        }
    });
}


/* =====================================================
   EMPLOYEE REGISTRATION
===================================================== */

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const name = document.getElementById("employeeName").value.trim();
        const employeeId = document.getElementById("employeeId").value.trim();
        const email = document.getElementById("registerEmail").value
            .trim().toLowerCase();

        const password = document.getElementById("registerPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const message = document.getElementById("registerMessage");

        if (password !== confirmPassword) {
            message.textContent = "Passwords do not match!";
            return;
        }

        let employees = JSON.parse(
            localStorage.getItem("employees") || "[]"
        );

        if (employees.some(user =>
            (user.email || "").toLowerCase() === email
        )) {
            message.textContent = "Email is already registered!";
            return;
        }

        if (employees.some(user =>
            (user.employeeId || "").toLowerCase() === employeeId.toLowerCase()
        )) {
            message.textContent = "Employee ID already exists!";
            return;
        }

        const newEmployee = {
            name,
            employeeId,
            email,
            password,
            role: "Employee"
        };

        employees.push(newEmployee);

        localStorage.setItem("employees", JSON.stringify(employees));

        message.style.color = "green";
        message.textContent =
            "Registration successful! Redirecting to login...";

        registerForm.reset();

        setTimeout(function() {
            window.location.href = "login.html";
        }, 1500);
    });
}


/* =====================================================
   EMPLOYEE DASHBOARD
===================================================== */

function loadDashboard() {
    const employee = getLoggedInEmployee();

    if (!employee) {
        window.location.href = "login.html";
        return;
    }

    updateProfile(
        employee.name,
        "topEmployeeName",
        "profileInitial",
        "Employee"
    );

    const welcome = document.getElementById("welcomeEmployee");

    if (welcome) {
        welcome.textContent = "Welcome, " + employee.name + "!";
    }

    const myChanges = getChanges().filter(change =>
        change.employeeId === employee.employeeId
    );

    const total = myChanges.length;

    const approved = myChanges.filter(change =>
        change.managerStatus === "Approved" ||
        ["Assess", "Authorize", "Scheduled", "Implement", "Review", "Closed"]
            .includes(change.status)
    ).length;

    const rejected = myChanges.filter(change =>
        change.status === "Rejected"
    ).length;

    const pending = myChanges.filter(change =>
        !["Rejected", "Closed"].includes(change.status)
    ).length;

    const setText = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };

    setText("totalChanges", total);
    setText("pendingChanges", pending);
    setText("approvedChanges", approved);
    setText("rejectedChanges", rejected);

    const table = document.getElementById("recentChanges");

    if (table) {
        if (myChanges.length === 0) {
            showEmptyMessage(table, "No change requests submitted yet.", 5);
        } else {
            table.innerHTML = myChanges.slice(-5).reverse().map(change => `
                <tr>
                    <td>${escapeHTML(change.changeNumber)}</td>
                    <td>${escapeHTML(change.shortDescription)}</td>
                    <td>${escapeHTML(change.type)}</td>
                    <td>${escapeHTML(change.risk)}</td>
                    <td>${escapeHTML(change.status)}</td>
                </tr>
            `).join("");
        }
    }
}

if (document.getElementById("welcomeEmployee")) {
    loadDashboard();
}


/* =====================================================
   EMPLOYEE PROFILE
===================================================== */

function showProfile() {
    const employee = getLoggedInEmployee();

    if (!employee) {
        window.location.href = "login.html";
        return;
    }

    alert(
        "Employee Profile\n\n" +
        "Name: " + employee.name + "\n" +
        "Employee ID: " + employee.employeeId + "\n" +
        "Email: " + employee.email + "\n" +
        "Role: " + employee.role
    );
}


/* =====================================================
   CREATE CHANGE REQUEST
===================================================== */

const changeForm = document.getElementById("changeForm");

if (changeForm) {
    const employee = getLoggedInEmployee();

    if (!employee) {
        window.location.href = "login.html";
    } else {
        const requestedBy = document.getElementById("requestedBy");

        if (requestedBy) requestedBy.value = employee.name;

        updateProfile(
            employee.name,
            "topEmployeeName",
            "profileInitial",
            "Employee"
        );

        let changeCounter = Number(
            localStorage.getItem("changeCounter") || "3000"
        );

        const changeNumber = "CHG00" + (changeCounter + 1);

        const changeNumberInput = document.getElementById("changeNumber");

        if (changeNumberInput) {
            changeNumberInput.value = changeNumber;
        }

        const startDateInput = document.getElementById("startDate");
        const endDateInput = document.getElementById("endDate");

        if (startDateInput && endDateInput) {
            const now = new Date();

            const localDateTime = new Date(
                now.getTime() - now.getTimezoneOffset() * 60000
            ).toISOString().slice(0, 16);

            startDateInput.min = localDateTime;
            endDateInput.min = localDateTime;

            startDateInput.addEventListener("change", function() {
                endDateInput.min = this.value;

                if (endDateInput.value &&
                    endDateInput.value < this.value) {
                    endDateInput.value = "";
                }
            });
        }

        changeForm.addEventListener("submit", function(event) {
            event.preventDefault();

            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            const message = document.getElementById("changeMessage");

            if (!startDate || !endDate ||
                new Date(endDate) <= new Date(startDate)) {
                message.style.color = "red";
                message.textContent =
                    "End date must be later than start date.";
                return;
            }

            const newChange = {
                changeNumber,

                employeeName: employee.name,
                employeeId: employee.employeeId,
                employeeEmail: employee.email,

                category: document.getElementById("category").value,
                type: document.getElementById("type").value,
                priority: document.getElementById("priority").value,
                risk: document.getElementById("risk").value,
                impact: document.getElementById("impact").value,

                assignmentGroup:
                    document.getElementById("assignmentGroup").value,

                shortDescription:
                    document.getElementById("shortDescription").value.trim(),

                description:
                    document.getElementById("description").value.trim(),

                justification:
                    document.getElementById("justification").value.trim(),

                startDate,
                endDate,

                implementationPlan:
                    document.getElementById("implementationPlan").value.trim(),

                backoutPlan:
                    document.getElementById("backoutPlan").value.trim(),

                status: "New",
                managerStatus: "Pending",
                technicalStatus: "Pending",
                cabStatus: "Pending",
                implementationStatus: "Not Started",

                submittedDate: new Date().toLocaleString()
            };

            const requests = getChanges();
            requests.push(newChange);
            saveChanges(requests);

            localStorage.setItem("changeCounter", changeCounter + 1);

            message.style.color = "green";
            message.textContent =
                "Change request submitted successfully! Request Number: " +
                changeNumber;

            changeForm.reset();

            setTimeout(function() {
                window.location.href = "mychanges.html";
            }, 1500);
        });
    }
}


/* =====================================================
   MY CHANGE REQUESTS
===================================================== */

const myChangesTable = document.getElementById("myChangesTable");

if (myChangesTable) {
    const employee = getLoggedInEmployee();

    if (!employee) {
        window.location.href = "login.html";
    } else {
        updateProfile(
            employee.name,
            "topEmployeeName",
            "profileInitial",
            "Employee"
        );

        const allChanges = getChanges();

        const employeeChanges = allChanges
            .map((change, index) => ({
                ...change,
                originalIndex: index
            }))
            .filter(change =>
                change.employeeId === employee.employeeId
            )
            .reverse();

        const setText = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        setText("myTotal", employeeChanges.length);

        setText("myPending", employeeChanges.filter(change =>
            !["Rejected", "Closed"].includes(change.status)
        ).length);

        setText("myApproved", employeeChanges.filter(change =>
            change.managerStatus === "Approved"
        ).length);

        setText("myRejected", employeeChanges.filter(change =>
            change.status === "Rejected"
        ).length);

        function displayMyChanges(changes) {
            if (changes.length === 0) {
                showEmptyMessage(
                    myChangesTable,
                    "No matching change requests found.",
                    8
                );
            } else {
                myChangesTable.innerHTML = changes.map(change => `
                    <tr>
                        <td>${escapeHTML(change.changeNumber)}</td>
                        <td>${escapeHTML(change.shortDescription)}</td>
                        <td>${escapeHTML(change.category)}</td>
                        <td>${escapeHTML(change.type)}</td>
                        <td>${escapeHTML(change.priority)}</td>
                        <td>${escapeHTML(change.risk)}</td>
                        <td>
                            <span class="status-badge status-pending">
                                ${escapeHTML(change.status)}
                            </span>
                        </td>
                        <td>
                            <button class="view-btn"
                                data-change-index="${change.originalIndex}">
                                View
                            </button>
                        </td>
                    </tr>
                `).join("");
            }

            setText(
                "requestCount",
                "Showing " + changes.length + " request(s)"
            );
        }

        function filterMyChanges() {
            const searchElement = document.getElementById("searchChange");
            const filterElement = document.getElementById("filterStatus");

            const search = searchElement
                ? searchElement.value.toLowerCase().trim()
                : "";

            const status = filterElement ? filterElement.value : "";

            const filtered = employeeChanges.filter(change => {
                const matchesSearch =
                    (change.changeNumber || "").toLowerCase().includes(search) ||
                    (change.shortDescription || "").toLowerCase().includes(search);

                const matchesStatus =
                    !status || change.status === status;

                return matchesSearch && matchesStatus;
            });

            displayMyChanges(filtered);
        }

        displayMyChanges(employeeChanges);

        document.getElementById("searchChange")
            ?.addEventListener("input", filterMyChanges);

        document.getElementById("filterStatus")
            ?.addEventListener("change", filterMyChanges);

        myChangesTable.addEventListener("click", function(event) {
            const button = event.target.closest("[data-change-index]");

            if (!button) return;

            const index = Number(button.dataset.changeIndex);
            const selectedChange = allChanges[index];

            if (!selectedChange ||
                selectedChange.employeeId !== employee.employeeId) {
                return;
            }

            const details = [
                ["Change Number", selectedChange.changeNumber],
                ["Requested By", selectedChange.employeeName],
                ["Category", selectedChange.category],
                ["Type", selectedChange.type],
                ["Priority", selectedChange.priority],
                ["Risk", selectedChange.risk],
                ["Impact", selectedChange.impact],
                ["Assignment Group", selectedChange.assignmentGroup],
                ["Short Description", selectedChange.shortDescription],
                ["Detailed Description", selectedChange.description],
                ["Business Justification", selectedChange.justification],
                ["Planned Start", selectedChange.startDate],
                ["Planned End", selectedChange.endDate],
                ["Implementation Plan", selectedChange.implementationPlan],
                ["Backout Plan", selectedChange.backoutPlan],
                ["Current State", selectedChange.status],
                ["Manager Status", selectedChange.managerStatus],
                ["Technical Status", selectedChange.technicalStatus],
                ["CAB Status", selectedChange.cabStatus]
            ];

            const content = document.getElementById("changeDetailsContent");
            const modal = document.getElementById("changeDetailsModal");

            if (content && modal) {
                content.innerHTML = `
                    <div class="detail-grid">
                        ${details.map(item => `
                            <div class="detail-item">
                                <label>${escapeHTML(item[0])}</label>
                                <p>${escapeHTML(item[1] || "Not provided")}</p>
                            </div>
                        `).join("")}
                    </div>
                `;

                modal.style.display = "block";
            }
        });
    }
}

function closeChangeDetails() {
    const modal = document.getElementById("changeDetailsModal");
    if (modal) modal.style.display = "none";
}


/* =====================================================
   MANAGER REVIEW
===================================================== */

let currentManagerChangeNumber = null;

function loadManagerRequests() {
    const table = document.getElementById("managerChangesTable");
    if (!table) return;

    const requests = getChanges();

    document.getElementById("managerTotal").textContent =
        requests.length;

    document.getElementById("managerPending").textContent =
        requests.filter(request =>
            request.managerStatus === "Pending" &&
            request.status !== "Rejected"
        ).length;

    document.getElementById("managerApproved").textContent =
        requests.filter(request =>
            request.managerStatus === "Approved"
        ).length;

    document.getElementById("managerRejected").textContent =
        requests.filter(request =>
            request.managerStatus === "Rejected"
        ).length;

    displayManagerRequests();
}

function displayManagerRequests() {
    const table = document.getElementById("managerChangesTable");
    if (!table) return;

    const requests = getChanges();

    const search = (
        document.getElementById("managerSearch")?.value || ""
    ).toLowerCase().trim();

    const filter = document.getElementById("managerFilter")?.value || "All";

    const filtered = requests.filter(request => {
        const matchesSearch =
            (request.changeNumber || "").toLowerCase().includes(search) ||
            (request.employeeName || "").toLowerCase().includes(search) ||
            (request.shortDescription || "").toLowerCase().includes(search);

        const matchesFilter =
            filter === "All" || request.status === filter;

        return matchesSearch && matchesFilter;
    });

    if (filtered.length === 0) {
        showEmptyMessage(table, "No change requests found.");
    } else {
        table.innerHTML = filtered.map(request => `
            <tr>
                <td>${escapeHTML(request.changeNumber)}</td>
                <td>${escapeHTML(request.employeeName)}</td>
                <td>${escapeHTML(request.shortDescription)}</td>
                <td>${escapeHTML(request.category)}</td>
                <td>${escapeHTML(request.priority)}</td>
                <td>${escapeHTML(request.risk)}</td>
                <td>
                    <span class="status-badge">
                        ${escapeHTML(request.status)}
                    </span>
                </td>
                <td>
                    <button type="button"
                        class="view-btn manager-view-btn"
                        data-change-number="${escapeHTML(request.changeNumber)}">
                        Review
                    </button>
                </td>
            </tr>
        `).join("");
    }

    document.getElementById("managerRequestCount").textContent =
        `Showing ${filtered.length} request(s)`;
}

function openManagerReview(changeNumber) {
    const request = getChanges().find(item =>
        item.changeNumber === changeNumber
    );

    if (!request) {
        alert("Change request not found.");
        return;
    }

    currentManagerChangeNumber = changeNumber;

    const details = [
        ["Change Number", request.changeNumber],
        ["Employee Name", request.employeeName],
        ["Employee ID", request.employeeId],
        ["Category", request.category],
        ["Change Type", request.type],
        ["Priority", request.priority],
        ["Risk", request.risk],
        ["Impact", request.impact],
        ["Assignment Group", request.assignmentGroup],
        ["Current State", request.status],
        ["Short Description", request.shortDescription],
        ["Full Description", request.description],
        ["Business Justification", request.justification],
        ["Planned Start Date", request.startDate],
        ["Planned End Date", request.endDate],
        ["Implementation Plan", request.implementationPlan],
        ["Backout Plan", request.backoutPlan]
    ];

    document.getElementById("managerReviewContent").innerHTML = `
        <div class="detail-grid">
            ${details.map(item => `
                <div class="detail-item">
                    <label>${escapeHTML(item[0])}</label>
                    <p>${escapeHTML(item[1] || "Not provided")}</p>
                </div>
            `).join("")}
        </div>
    `;

    document.getElementById("managerComments").value =
        request.managerComments || "";

    document.getElementById("managerReviewModal").style.display = "block";
}

function closeManagerReview() {
    const modal = document.getElementById("managerReviewModal");
    if (modal) modal.style.display = "none";

    currentManagerChangeNumber = null;
}

function updateManagerDecision(decision) {
    if (!currentManagerChangeNumber) {
        alert("Please select a change request first.");
        return;
    }

    const requests = getChanges();

    const index = requests.findIndex(request =>
        request.changeNumber === currentManagerChangeNumber
    );

    if (index === -1) {
        alert("Change request not found.");
        return;
    }

    const comments =
        document.getElementById("managerComments").value.trim();

    if (!comments) {
        alert("Please enter manager comments.");
        return;
    }

    if (requests[index].status !== "New") {
        alert("This request has already been reviewed.");
        return;
    }

    requests[index].managerStatus = decision;
    requests[index].managerComments = comments;
    requests[index].managerReviewedDate = new Date().toLocaleString();

    if (decision === "Approved") {
        requests[index].status = "Assess";
    } else {
        requests[index].status = "Rejected";
        requests[index].technicalStatus = "Not Required";
        requests[index].cabStatus = "Not Required";
        requests[index].implementationStatus = "Not Required";
    }

    saveChanges(requests);

    alert("Change request " + decision.toLowerCase() + " successfully!");

    closeManagerReview();
    loadManagerRequests();
}


/* =====================================================
   TECHNICAL REVIEW
===================================================== */

let currentTechnicalChangeNumber = null;

function loadTechnicalRequests() {
    const table = document.getElementById("technicalChangesTable");
    if (!table) return;

    const requests = getChanges();

    const pendingRequests = requests.filter(request =>
        request.managerStatus === "Approved" &&
        request.status === "Assess"
    );

    document.getElementById("technicalTotal").textContent =
        pendingRequests.length;

    document.getElementById("technicalPending").textContent =
        pendingRequests.filter(request =>
            request.technicalStatus === "Pending"
        ).length;

    document.getElementById("technicalApproved").textContent =
        requests.filter(request =>
            request.technicalStatus === "Approved"
        ).length;

    document.getElementById("technicalRejected").textContent =
        requests.filter(request =>
            request.technicalStatus === "Rejected"
        ).length;

    displayTechnicalRequests();
}

function displayTechnicalRequests() {
    const table = document.getElementById("technicalChangesTable");
    if (!table) return;

    const requests = getChanges();

    const search = (
        document.getElementById("technicalSearch")?.value || ""
    ).toLowerCase().trim();

    const filter =
        document.getElementById("technicalFilter")?.value || "All";

    const eligible = requests.filter(request =>
        request.managerStatus === "Approved" &&
        ["Assess", "Authorize", "Rejected"].includes(request.status)
    );

    const filtered = eligible.filter(request => {
        const matchesSearch =
            (request.changeNumber || "").toLowerCase().includes(search) ||
            (request.employeeName || "").toLowerCase().includes(search) ||
            (request.shortDescription || "").toLowerCase().includes(search);

        const matchesFilter =
            filter === "All" || request.status === filter;

        return matchesSearch && matchesFilter;
    });

    if (filtered.length === 0) {
        showEmptyMessage(table, "No technical assessment requests found.");
    } else {
        table.innerHTML = filtered.map(request => `
            <tr>
                <td>${escapeHTML(request.changeNumber)}</td>
                <td>${escapeHTML(request.shortDescription)}</td>
                <td>${escapeHTML(request.impact)}</td>
                <td>${escapeHTML(request.risk)}</td>
                <td>${escapeHTML(request.implementationPlan)}</td>
                <td>${escapeHTML(request.backoutPlan)}</td>
                <td>
                    <span class="status-badge">
                        ${escapeHTML(request.technicalStatus)}
                    </span>
                </td>
                <td>
                    <button type="button"
                        class="view-btn technical-view-btn"
                        data-change-number="${escapeHTML(request.changeNumber)}">
                        Review
                    </button>
                </td>
            </tr>
        `).join("");
    }

    document.getElementById("technicalRequestCount").textContent =
        `Showing ${filtered.length} request(s)`;
}

function openTechnicalReview(changeNumber) {
    const request = getChanges().find(item =>
        item.changeNumber === changeNumber
    );

    if (!request) {
        alert("Change request not found.");
        return;
    }

    currentTechnicalChangeNumber = changeNumber;

    const details = [
        ["Change Number", request.changeNumber],
        ["Employee Name", request.employeeName],
        ["Employee ID", request.employeeId],
        ["Category", request.category],
        ["Change Type", request.type],
        ["Priority", request.priority],
        ["Risk", request.risk],
        ["Impact", request.impact],
        ["Assignment Group", request.assignmentGroup],
        ["Current State", request.status],
        ["Short Description", request.shortDescription],
        ["Full Description", request.description],
        ["Business Justification", request.justification],
        ["Planned Start Date", request.startDate],
        ["Planned End Date", request.endDate],
        ["Implementation Plan", request.implementationPlan],
        ["Backout Plan", request.backoutPlan],
        ["Manager Comments", request.managerComments]
    ];

    document.getElementById("technicalReviewContent").innerHTML = `
        <div class="detail-grid">
            ${details.map(item => `
                <div class="detail-item">
                    <label>${escapeHTML(item[0])}</label>
                    <p>${escapeHTML(item[1] || "Not provided")}</p>
                </div>
            `).join("")}
        </div>
    `;

    document.getElementById("technicalComments").value =
        request.technicalComments || "";

    document.getElementById("technicalReviewModal").style.display = "block";
}

function closeTechnicalReview() {
    const modal = document.getElementById("technicalReviewModal");
    if (modal) modal.style.display = "none";

    currentTechnicalChangeNumber = null;
}

function updateTechnicalDecision(decision) {
    if (!currentTechnicalChangeNumber) {
        alert("Please select a request first.");
        return;
    }

    const requests = getChanges();

    const index = requests.findIndex(request =>
        request.changeNumber === currentTechnicalChangeNumber
    );

    if (index === -1) {
        alert("Change request not found.");
        return;
    }

    const comments =
        document.getElementById("technicalComments").value.trim();

    if (!comments) {
        alert("Please enter technical comments.");
        return;
    }

    if (requests[index].status !== "Assess") {
        alert("This request is no longer awaiting technical review.");
        return;
    }

    requests[index].technicalStatus = decision;
    requests[index].technicalComments = comments;
    requests[index].technicalReviewedDate = new Date().toLocaleString();

    if (decision === "Approved") {
        requests[index].status = "Authorize";
        requests[index].cabStatus = "Pending";
    } else {
        requests[index].status = "Rejected";
        requests[index].cabStatus = "Not Required";
        requests[index].implementationStatus = "Not Required";
    }

    saveChanges(requests);

    alert("Technical review " + decision.toLowerCase() + " successfully!");

    closeTechnicalReview();
    loadTechnicalRequests();
}


/* =====================================================
   CAB REVIEW
===================================================== */

let currentCABChangeNumber = null;

function loadCABRequests() {
    const table = document.getElementById("cabChangesTable");
    if (!table) return;

    const requests = getChanges();

    const pendingRequests = requests.filter(request =>
        request.technicalStatus === "Approved" &&
        request.status === "Authorize"
    );

    document.getElementById("cabTotal").textContent =
        pendingRequests.length;

    document.getElementById("cabPending").textContent =
        pendingRequests.filter(request =>
            request.cabStatus === "Pending"
        ).length;

    document.getElementById("cabApproved").textContent =
        requests.filter(request =>
            request.cabStatus === "Approved"
        ).length;

    document.getElementById("cabRejected").textContent =
        requests.filter(request =>
            request.cabStatus === "Rejected"
        ).length;

    displayCABRequests();
}

function displayCABRequests() {
    const table = document.getElementById("cabChangesTable");
    if (!table) return;

    const requests = getChanges();

    const search = (
        document.getElementById("cabSearch")?.value || ""
    ).toLowerCase().trim();

    const filter = document.getElementById("cabFilter")?.value || "All";

    const eligible = requests.filter(request =>
        request.technicalStatus === "Approved" &&
        ["Authorize", "Scheduled", "Rejected"].includes(request.status)
    );

    const filtered = eligible.filter(request => {
        const matchesSearch =
            (request.changeNumber || "").toLowerCase().includes(search) ||
            (request.employeeName || "").toLowerCase().includes(search) ||
            (request.shortDescription || "").toLowerCase().includes(search);

        const matchesFilter =
            filter === "All" || request.status === filter;

        return matchesSearch && matchesFilter;
    });

    if (filtered.length === 0) {
        showEmptyMessage(table, "No technically approved requests found.");
    } else {
        table.innerHTML = filtered.map(request => `
            <tr>
                <td>${escapeHTML(request.changeNumber)}</td>
                <td>${escapeHTML(request.employeeName)}</td>
                <td>${escapeHTML(request.shortDescription)}</td>
                <td>${escapeHTML(request.category)}</td>
                <td>${escapeHTML(request.priority)}</td>
                <td>${escapeHTML(request.risk)}</td>
                <td>${escapeHTML(request.status)}</td>
                <td>
                    <button type="button"
                        class="view-btn cab-view-btn"
                        data-change-number="${escapeHTML(request.changeNumber)}">
                        Review
                    </button>
                </td>
            </tr>
        `).join("");
    }

    document.getElementById("cabRequestCount").textContent =
        `Showing ${filtered.length} request(s)`;
}

function openCABReview(changeNumber) {
    const request = getChanges().find(item =>
        item.changeNumber === changeNumber
    );

    if (!request) {
        alert("Change request not found.");
        return;
    }

    currentCABChangeNumber = changeNumber;

    const details = [
        ["Change Number", request.changeNumber],
        ["Employee Name", request.employeeName],
        ["Employee ID", request.employeeId],
        ["Category", request.category],
        ["Change Type", request.type],
        ["Priority", request.priority],
        ["Risk", request.risk],
        ["Impact", request.impact],
        ["Assignment Group", request.assignmentGroup],
        ["Current State", request.status],
        ["Short Description", request.shortDescription],
        ["Full Description", request.description],
        ["Business Justification", request.justification],
        ["Planned Start Date", request.startDate],
        ["Planned End Date", request.endDate],
        ["Implementation Plan", request.implementationPlan],
        ["Backout Plan", request.backoutPlan],
        ["Technical Comments", request.technicalComments]
    ];

    document.getElementById("cabReviewContent").innerHTML = `
        <div class="detail-grid">
            ${details.map(item => `
                <div class="detail-item">
                    <label>${escapeHTML(item[0])}</label>
                    <p>${escapeHTML(item[1] || "Not provided")}</p>
                </div>
            `).join("")}
        </div>
    `;

    document.getElementById("cabComments").value =
        request.cabComments || "";

    document.getElementById("cabReviewModal").style.display = "block";
}

function closeCABReview() {
    const modal = document.getElementById("cabReviewModal");
    if (modal) modal.style.display = "none";

    currentCABChangeNumber = null;
}

function updateCABDecision(decision) {
    if (!currentCABChangeNumber) {
        alert("Please select a request first.");
        return;
    }

    const requests = getChanges();

    const index = requests.findIndex(request =>
        request.changeNumber === currentCABChangeNumber
    );

    if (index === -1) {
        alert("Change request not found.");
        return;
    }

    const comments = document.getElementById("cabComments").value.trim();

    if (!comments) {
        alert("Please enter CAB comments.");
        return;
    }

    if (requests[index].status !== "Authorize") {
        alert("This request is no longer awaiting CAB review.");
        return;
    }

    requests[index].cabStatus = decision;
    requests[index].cabComments = comments;
    requests[index].cabReviewedDate = new Date().toLocaleString();

    if (decision === "Approved") {
        requests[index].status = "Scheduled";
        requests[index].implementationStatus = "Pending";
    } else {
        requests[index].status = "Rejected";
        requests[index].implementationStatus = "Not Required";
    }

    saveChanges(requests);

    alert(
        decision === "Approved"
            ? "Change request authorized successfully!"
            : "Change request rejected successfully!"
    );

    closeCABReview();
    loadCABRequests();
}


/* =====================================================
   IMPLEMENTATION
===================================================== */

let currentImplementationChangeNumber = null;

// Get CAB-authorized requests
function getImplementationRequests() {
    return getChanges().filter(request =>
        request.cabStatus === "Approved" &&
        ["Scheduled", "Implement", "Review", "Closed"]
            .includes(request.status)
    );
}

// Load implementation page
function loadImplementationRequests() {
    const table = document.getElementById("implementationChangesTable");
    if (!table) return;

    const employee = getLoggedInEmployee();

    if (employee) {
        updateProfile(
            employee.name,
            "implementationName",
            "profileInitial",
            "Implementation Team"
        );
    }

    const requests = getImplementationRequests();

    document.getElementById("implementationTotal").textContent =
        requests.length;

    document.getElementById("implementationPending").textContent =
        requests.filter(request =>
            request.status === "Scheduled"
        ).length;

    document.getElementById("implementationProgress").textContent =
        requests.filter(request =>
            ["Implement", "Review"].includes(request.status)
        ).length;

    document.getElementById("implementationCompleted").textContent =
        requests.filter(request =>
            request.status === "Closed"
        ).length;

    displayImplementationRequests();
}

// Display implementation requests
function displayImplementationRequests() {
    const table = document.getElementById("implementationChangesTable");
    if (!table) return;

    const requests = getImplementationRequests();

    const search = (
        document.getElementById("implementationSearch")?.value || ""
    ).toLowerCase().trim();

    const filter =
        document.getElementById("implementationFilter")?.value || "All";

    const filtered = requests.filter(request => {
        const matchesSearch =
            (request.changeNumber || "").toLowerCase().includes(search) ||
            (request.employeeName || "").toLowerCase().includes(search) ||
            (request.shortDescription || "").toLowerCase().includes(search);

        let matchesFilter = true;

        if (filter === "Pending") {
            matchesFilter = request.status === "Scheduled";
        } else if (filter === "Implement") {
            matchesFilter = ["Implement", "Review"].includes(request.status);
        } else if (filter === "Closed") {
            matchesFilter = request.status === "Closed";
        }

        return matchesSearch && matchesFilter;
    });

    if (filtered.length === 0) {
        showEmptyMessage(table, "No CAB-authorized change requests found.");
    } else {
        table.innerHTML = filtered.map(request => {
            let action = "View";

            if (request.status === "Scheduled") action = "Start";
            if (request.status === "Implement") action = "Continue";

            return `
                <tr>
                    <td>${escapeHTML(request.changeNumber)}</td>
                    <td>${escapeHTML(request.employeeName)}</td>
                    <td>${escapeHTML(request.shortDescription)}</td>
                    <td>${escapeHTML(request.category)}</td>
                    <td>${escapeHTML(request.priority)}</td>
                    <td>${escapeHTML(request.risk)}</td>
                    <td>
                        <span class="status-badge">
                            ${escapeHTML(request.status)}
                        </span>
                    </td>
                    <td>
                        <button type="button"
                            class="view-btn implementation-view-btn"
                            data-change-number="${escapeHTML(request.changeNumber)}">
                            ${action}
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
    }

    document.getElementById("implementationRequestCount").textContent =
        `Showing ${filtered.length} request(s)`;
}

// Open implementation details
function openImplementationModal(changeNumber) {
    const request = getImplementationRequests().find(item =>
        item.changeNumber === changeNumber
    );

    if (!request) {
        alert("Implementation request not found.");
        return;
    }

    currentImplementationChangeNumber = changeNumber;

    const details = [
        ["Change Number", request.changeNumber],
        ["Employee Name", request.employeeName],
        ["Employee ID", request.employeeId],
        ["Category", request.category],
        ["Change Type", request.type],
        ["Priority", request.priority],
        ["Risk", request.risk],
        ["Impact", request.impact],
        ["Assignment Group", request.assignmentGroup],
        ["Current State", request.status],
        ["CAB Status", request.cabStatus],
        ["Short Description", request.shortDescription],
        ["Full Description", request.description],
        ["Business Justification", request.justification],
        ["Planned Start Date", request.startDate],
        ["Planned End Date", request.endDate],
        ["Implementation Plan", request.implementationPlan],
        ["Backout Plan", request.backoutPlan],
        ["CAB Comments", request.cabComments]
    ];

    document.getElementById("implementationDetails").innerHTML = `
        <div class="detail-grid">
            ${details.map(item => `
                <div class="detail-item">
                    <label>${escapeHTML(item[0])}</label>
                    <p>${escapeHTML(item[1] || "Not provided")}</p>
                </div>
            `).join("")}
        </div>
    `;

    document.getElementById("implementationComments").value =
        request.implementationComments || "";

    document.getElementById("startImplementationBtn").style.display =
        request.status === "Scheduled" ? "inline-block" : "none";

    document.getElementById("completeImplementationBtn").style.display =
        request.status === "Implement" ? "inline-block" : "none";

    document.getElementById("implementationModal").style.display = "block";
}

// Close implementation modal
function closeImplementationModal() {
    const modal = document.getElementById("implementationModal");
    if (modal) modal.style.display = "none";

    currentImplementationChangeNumber = null;
}

// Start or complete implementation
function updateImplementationStatus(newStatus) {
    if (!currentImplementationChangeNumber) {
        alert("Please select a change request first.");
        return;
    }

    const requests = getChanges();

    const index = requests.findIndex(request =>
        request.changeNumber === currentImplementationChangeNumber
    );

    if (index === -1) {
        alert("Change request not found.");
        return;
    }

    const request = requests[index];

    const comments = document
        .getElementById("implementationComments")
        .value.trim();

    if (!comments) {
        alert("Please enter implementation comments.");
        return;
    }

    if (newStatus === "Implement" && request.status !== "Scheduled") {
        alert("Only scheduled requests can be started.");
        return;
    }

    if (newStatus === "Closed" && request.status !== "Implement") {
        alert("Start implementation before completing it.");
        return;
    }

    request.status = newStatus;

    request.implementationStatus =
        newStatus === "Implement" ? "In Progress" : "Completed";

    request.implementationComments = comments;
    request.implementationUpdatedDate = new Date().toLocaleString();

    saveChanges(requests);

    alert(
        newStatus === "Implement"
            ? "Implementation started successfully!"
            : "Implementation completed successfully!"
    );

    closeImplementationModal();
    loadImplementationRequests();
}


/* =====================================================
   CLOSED CHANGES
===================================================== */

function isStaffRole(role) {
    const normalizedRole = (role || "").toLowerCase();

    const staffRoles = [
        "manager",
        "technical",
        "technical team",
        "cab",
        "implementation",
        "implementation team",
        "admin"
    ];

    return staffRoles.some(item =>
        normalizedRole.includes(item)
    );
}

function getVisibleClosedRequests() {
    const employee = getLoggedInEmployee();

    if (!employee) return [];

    let requests = getChanges().filter(request =>
        request.status === "Closed"
    );

    // Staff can view all closed requests.
    // Employees can view only their own requests.
    if (!isStaffRole(employee.role)) {
        requests = requests.filter(request =>
            request.employeeId === employee.employeeId ||
            request.employeeEmail === employee.email
        );
    }

    return requests;
}

function loadClosedChanges() {
    const table = document.getElementById("closedChangesTable");
    if (!table) return;

    const employee = getLoggedInEmployee();

    if (!employee) {
        showEmptyMessage(table, "Please login to view closed changes.");
        return;
    }

    updateProfile(
        employee.name,
        "closedName",
        "profileInitial",
        "User"
    );

    const requests = getVisibleClosedRequests();

    document.getElementById("closedTotal").textContent =
        requests.length;

    document.getElementById("closedCompleted").textContent =
        requests.length;

    displayClosedChanges(requests);
}

function displayClosedChanges(requests) {
    const table = document.getElementById("closedChangesTable");
    if (!table) return;

    const search = (
        document.getElementById("closedSearch")?.value || ""
    ).toLowerCase().trim();

    const filtered = requests.filter(request =>
        (request.changeNumber || "").toLowerCase().includes(search) ||
        (request.employeeName || "").toLowerCase().includes(search) ||
        (request.shortDescription || "").toLowerCase().includes(search)
    );

    if (filtered.length === 0) {
        showEmptyMessage(table, "No closed change requests found.");
    } else {
        table.innerHTML = filtered.map(request => `
            <tr>
                <td>${escapeHTML(request.changeNumber)}</td>
                <td>${escapeHTML(request.employeeName)}</td>
                <td>${escapeHTML(request.shortDescription)}</td>
                <td>${escapeHTML(request.category)}</td>
                <td>${escapeHTML(request.priority)}</td>
                <td>${escapeHTML(request.assignmentGroup)}</td>
                <td>${escapeHTML(
                    request.implementationUpdatedDate ||
                    request.submittedDate ||
                    "Not available"
                )}</td>
                <td>
                    <span class="status-badge status-approved">
                        Closed
                    </span>
                </td>
            </tr>
        `).join("");
    }

    const count = document.getElementById("closedRequestCount");

    if (count) {
        count.textContent = `Showing ${filtered.length} request(s)`;
    }
}


/* =====================================================
   PAGE INITIALIZATION
===================================================== */

document.addEventListener("DOMContentLoaded", function() {

    // Manager page
    if (document.getElementById("managerChangesTable")) {
        const employee = getLoggedInEmployee();

        if (employee) {
            updateProfile(
                employee.name,
                "managerName",
                "profileInitial",
                "Manager"
            );
        }

        loadManagerRequests();

        document.getElementById("managerSearch")
            ?.addEventListener("input", displayManagerRequests);

        document.getElementById("managerFilter")
            ?.addEventListener("change", displayManagerRequests);

        document.getElementById("managerChangesTable")
            .addEventListener("click", function(event) {
                const button = event.target.closest(".manager-view-btn");

                if (button) {
                    openManagerReview(button.dataset.changeNumber);
                }
            });
    }


    // Technical Review page
    if (document.getElementById("technicalChangesTable")) {
        const employee = getLoggedInEmployee();

        if (employee) {
            updateProfile(
                employee.name,
                "technicalName",
                "profileInitial",
                "Technical Team"
            );
        }

        loadTechnicalRequests();

        document.getElementById("technicalSearch")
            ?.addEventListener("input", displayTechnicalRequests);

        document.getElementById("technicalFilter")
            ?.addEventListener("change", displayTechnicalRequests);

        document.getElementById("technicalChangesTable")
            .addEventListener("click", function(event) {
                const button = event.target.closest(".technical-view-btn");

                if (button) {
                    openTechnicalReview(button.dataset.changeNumber);
                }
            });
    }


    // CAB Review page
    if (document.getElementById("cabChangesTable")) {
        const employee = getLoggedInEmployee();

        if (employee) {
            updateProfile(
                employee.name,
                "cabName",
                "profileInitial",
                "CAB Team"
            );
        }

        loadCABRequests();

        document.getElementById("cabSearch")
            ?.addEventListener("input", displayCABRequests);

        document.getElementById("cabFilter")
            ?.addEventListener("change", displayCABRequests);

        document.getElementById("cabChangesTable")
            .addEventListener("click", function(event) {
                const button = event.target.closest(".cab-view-btn");

                if (button) {
                    openCABReview(button.dataset.changeNumber);
                }
            });
    }


    // Implementation page
    if (document.getElementById("implementationChangesTable")) {
        loadImplementationRequests();

        document.getElementById("implementationSearch")
            ?.addEventListener("input", displayImplementationRequests);

        document.getElementById("implementationFilter")
            ?.addEventListener("change", displayImplementationRequests);

        document.getElementById("implementationChangesTable")
            .addEventListener("click", function(event) {
                const button = event.target.closest(
                    ".implementation-view-btn"
                );

                if (button) {
                    openImplementationModal(button.dataset.changeNumber);
                }
            });
    }


    // Closed Changes page
    if (document.getElementById("closedChangesTable")) {
        loadClosedChanges();

        document.getElementById("closedSearch")
            ?.addEventListener("input", function() {
                displayClosedChanges(getVisibleClosedRequests());
            });
    }

});
