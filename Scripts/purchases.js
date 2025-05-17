// purchases.js

// Buy stock function with validation
function buyStock() {
    // Require participant selection
    const participant = getCurrentParticipant();
    if (!participant) {
        document.getElementById("participantWarning").style.display = "block";
        return;
    }
    // Replace currentUser with participant for all trading logic below
    const currentUser = participant;
    const stock = document.getElementById("stockSelect").value;
    const price = parseFloat(document.getElementById("price").value);
    const quantity = parseInt(document.getElementById("quantity").value);

    // Get current user
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    // Validate inputs
    if (!validateTradeInputs(price, quantity)) {
        return;
    }

    // Calculate total cost
    const totalCost = price * quantity;

    // Check if user has enough balance
    if (!canAffordPurchase(currentUser, totalCost)) {
        showPopup(
            `Cannot buy stocks. Insufficient funds. You need ${formatCurrency(totalCost)}.`,
            "error"
        );
        return;
    }

    // Confirm purchase
    if (
        !confirmAction(
            `Are you sure you want to buy ${quantity} of ${stock} at ${formatCurrency(
                price
            )} each (total: ${formatCurrency(totalCost)})?`
        )
    ) {
        return;
    }

    // Get user data
    const userData = getUserData(currentUser);

    // Add transaction with timestamp
    userData.bought.push({
        stock,
        price,
        quantity,
        date: new Date().toISOString(),
        transactionId: generateTransactionId(),
    });

    // Save user data
    saveUserData(currentUser, userData);

    // Show success message
    showPopup(
        `Successfully bought ${quantity} of ${stock} at ${formatCurrency(
            price
        )} each (total: ${formatCurrency(totalCost)})`,
        "success"
    );

    // Update balance display
    updateBalanceDisplay();
}

// Sell stock function with validation
function sellStock() {
    // Require participant selection
    const participant = getCurrentParticipant();
    if (!participant) {
        document.getElementById("participantWarning").style.display = "block";
        return;
    }
    const currentUser = participant;
    const stock = document.getElementById("stockSelect").value;
    const price = parseFloat(document.getElementById("price").value);
    const quantity = parseInt(document.getElementById("quantity").value);
    const toUser = document.getElementById("sellToUser").value;

    // Get current user
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    // Validate inputs
    if (!validateTradeInputs(price, quantity)) {
        return;
    }

    // Calculate total cost
    const totalCost = price * quantity;

    // Check if buyer has enough balance
    if (!canAffordPurchase(toUser, totalCost)) {
        showPopup(`Cannot sell stocks. Buyer has insufficient funds.`, "error");
        return;
    }

    // Check if seller has enough stocks
    const available = getAvailableStockQuantity(currentUser, stock);
    if (quantity > available) {
        showPopup(
            `Cannot sell ${quantity} of ${stock}. You only have ${available} available.`,
            "error"
        );
        return;
    }

    // Confirm sale
    if (
        !confirmAction(
            `Are you sure you want to sell ${quantity} of ${stock} to ${toUser} at ${formatCurrency(
                price
            )} each (total: ${formatCurrency(totalCost)})?`
        )
    ) {
        return;
    }

    // Get user data
    const sellerData = getUserData(currentUser);
    const buyerData = getUserData(toUser);

    // Generate transaction ID
    const transactionId = generateTransactionId();
    const timestamp = new Date().toISOString();

    // Record in seller's sold list
    sellerData.sold.push({
        stock,
        price,
        quantity,
        buyer: toUser,
        date: timestamp,
        transactionId,
    });

    // Record in buyer's bought list
    buyerData.bought.push({
        stock,
        price,
        quantity,
        seller: currentUser,
        date: timestamp,
        transactionId,
    });

    // Save data
    saveUserData(currentUser, sellerData);
    saveUserData(toUser, buyerData);

    // Show success message
    showPopup(
        `Successfully sold ${quantity} of ${stock} to ${toUser} at ${formatCurrency(
            price
        )} each (total: ${formatCurrency(totalCost)})`,
        "success"
    );

    // Update balance display
    updateBalanceDisplay();
}

// Validate trade inputs
function validateTradeInputs(price, quantity) {
    if (!isValidNumber(price)) {
        showPopup("Please enter a valid price (must be greater than 0).", "error");
        return false;
    }

    if (!isValidNumber(quantity) || !Number.isInteger(quantity)) {
        showPopup("Please enter a valid quantity (must be a positive integer).", "error");
        return false;
    }

    return true;
}

// Generate a unique transaction ID
function generateTransactionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// Update the balance display
function updateBalanceDisplay() {
    const currentUser = getUser();
    if (currentUser) {
        const balance = calculateBalance(currentUser);
        const balanceElement = document.getElementById("balanceDisplay");
        if (balanceElement) {
            balanceElement.innerText = formatCurrency(balance);
        }
    }
}

// Show popup with type (success, error, warning)
function showPopup(message, type = "info") {
    const popup = document.getElementById("popupModal");
    const popupMessage = document.getElementById("popupMessage");
    const popupContent = document.querySelector(".modal-content");

    // Set message
    popupMessage.innerText = message;

    // Set color based on type
    popupContent.className = "modal-content";
    popupContent.classList.add(`modal-${type}`);

    // Show popup
    popup.style.display = "block";

    // Auto-close after 5 seconds for success messages
    if (type === "success") {
        setTimeout(() => {
            closePopup();
        }, 5000);
    }
}

// Close popup
function closePopup() {
    document.getElementById("popupModal").style.display = "none";
}

// Initialize page
window.onload = () => {
    // Check if user is logged in
    if (!initPage()) {
        return;
    }

    const currentUser = getUser();

    // Populate sell to dropdown
    const sellToDropdown = document.getElementById("sellToUser");
    for (let i = 1; i <= 20; i++) {
        const id = `Team${i}`;
        if (id !== currentUser) {
            const option = document.createElement("option");
            option.value = id;
            option.text = id;
            sellToDropdown.add(option);
        }
    }

    // Display current balance
    updateBalanceDisplay();

    // Add event listeners for input validation
    document.getElementById("price").addEventListener("input", function () {
        this.value = this.value.replace(/[^0-9.]/g, "");
    });

    document.getElementById("quantity").addEventListener("input", function () {
        this.value = this.value.replace(/[^0-9]/g, "");
    });

    // --- Participant Selection Logic ---
    const participantSelect = document.getElementById("participantSelect");
    const participantWarning = document.getElementById("participantWarning");
    if (participantSelect) {
        // Populate dropdown with all registered team members
        const teams = getAllTeams();
        for (const [team, members] of Object.entries(teams)) {
            members.forEach((username) => {
                const opt = document.createElement("option");
                opt.value = username;
                opt.text = `${team} - ${username}`;
                participantSelect.appendChild(opt);
            });
        }
        // Restore previous selection if any
        const selected = getCurrentParticipant();
        if (selected) participantSelect.value = selected;

        participantSelect.addEventListener("change", function () {
            setCurrentParticipant(this.value);
            participantWarning.style.display = this.value ? "none" : "block";
        });
        // Show warning if not selected
        if (!participantSelect.value) participantWarning.style.display = "block";
    }
};
