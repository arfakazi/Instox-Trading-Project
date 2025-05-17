// admin.js

// Check if user is admin on page load
window.onload = function () {
    // Check if user is logged in
    if (!initPage()) {
        return;
    }

    // Get current user
    const currentUser = getUser();

    // Check if user is admin
    const authData = JSON.parse(localStorage.getItem(`${currentUser}_auth`));
    if (!authData || !authData.isAdmin) {
        alert("Access Denied. Admin privileges required.");
        window.location.href = "index.html";
        return;
    }

    // Load admin panel
    loadAdminPanel();
};

// Load admin panel data
function loadAdminPanel() {
    const table = document.getElementById("adminTable");

    // Clear existing table rows except header
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }

    // Add user rows
    for (let i = 1; i <= 20; i++) {
        const userId = `Team${i}`;
        const balance = calculateBalance(userId);

        // Get user data to check activity
        const userData = getUserData(userId);
        const hasActivity = userData.bought.length > 0 || userData.sold.length > 0;

        const row = table.insertRow();
        row.innerHTML = `
            <td>${userId}</td>
            <td>${formatCurrency(balance)}</td>
            <td>${
                hasActivity
                    ? userData.bought.length + userData.sold.length + " transactions"
                    : "No activity"
            }</td>
            <td>
                <button class="secondary" onclick="resetUser('${userId}')">Reset</button>
                <button class="secondary" onclick="viewUserDetails('${userId}')">View Details</button>
            </td>
        `;
    }
}

// Reset a single user
function resetUser(userId) {
    if (
        !confirmAction(
            `Are you sure you want to reset ${userId}? This will clear all their transactions.`
        )
    ) {
        return;
    }

    // Reset user data
    saveUserData(userId, { bought: [], sold: [] });

    // Show success message
    const message = document.getElementById("statusMessage");
    message.textContent = `Reset ${userId} successfully.`;
    message.className = "success-message";
    message.style.display = "block";

    // Hide message after 3 seconds
    setTimeout(() => {
        message.style.display = "none";
    }, 3000);

    // Reload admin panel
    loadAdminPanel();
}

// Reset all users
function resetAllUsers() {
    if (
        !confirmAction(
            "Are you sure you want to reset ALL users? This will clear all transactions for all users."
        )
    ) {
        return;
    }

    // Reset all users
    for (let i = 1; i <= 20; i++) {
        const userId = `Team${i}`;
        saveUserData(userId, { bought: [], sold: [] });
    }

    // Show success message
    const message = document.getElementById("statusMessage");
    message.textContent = "All users have been reset successfully.";
    message.className = "success-message";
    message.style.display = "block";

    // Hide message after 3 seconds
    setTimeout(() => {
        message.style.display = "none";
    }, 3000);

    // Reload admin panel
    loadAdminPanel();
}

// View user details
function viewUserDetails(userId) {
    const userData = getUserData(userId);
    const balance = calculateBalance(userId);

    // Create modal content
    let content = `
        <h3>User Details: ${userId}</h3>
        <p>Current Balance: ${formatCurrency(balance)}</p>
        <h4>Transaction Summary:</h4>
        <p>Purchases: ${userData.bought.length}</p>
        <p>Sales: ${userData.sold.length}</p>
    `;

    // Show modal
    const modal = document.getElementById("detailsModal");
    const modalContent = document.getElementById("detailsContent");
    modalContent.innerHTML = content;
    modal.style.display = "block";
}

// Close modal
function closeModal() {
    document.getElementById("detailsModal").style.display = "none";
}

// --- Team Registration Logic ---
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("teamRegistrationForm");
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            const teamNumber = document.getElementById("teamNumber").value;
            const p1 = document.getElementById("participant1").value.trim();
            if (!teamNumber || !p1) return;

            // Save team using utils.js helper
            try {
                saveTeam(teamNumber, p1);
                document.getElementById(
                    "teamRegistrationStatus"
                ).innerText = `Registered Team ${teamNumber}: Trader - ${p1}`;
                form.reset();
            } catch (err) {
                document.getElementById("teamRegistrationStatus").innerText = err.message;
            }
        });
    }
});
