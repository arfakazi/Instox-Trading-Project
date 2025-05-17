// purchases.js

// Ensure only brokers or admins can access
window.onload = async () => {
    if (!initPage()) return;

    const role = getRole();
    if (role !== "broker" && role !== "admin") {
        alert("Access denied. Only brokers and admins can access this page.");
        window.location.href = "index.html";
        return;
    }

    const currentUser = getUser();

    // Populate 'Sell To' dropdown
    const sellToDropdown = document.getElementById("sellToUser");
    const allUsers = await getAllTeams();
    allUsers.forEach((user) => {
        if (user.username !== currentUser) {
            const option = document.createElement("option");
            option.value = user.username;
            option.text = user.username;
            sellToDropdown.add(option);
        }
    });

    // Display current balance for selected participant
    await updateBalanceDisplay();

    // Setup input sanitization
    document.getElementById("price").addEventListener("input", function () {
        this.value = this.value.replace(/[^0-9.]/g, "");
    });
    document.getElementById("quantity").addEventListener("input", function () {
        this.value = this.value.replace(/[^0-9]/g, "");
    });

    // Setup participant dropdown
    const participantSelect = document.getElementById("participantSelect");
    const participantWarning = document.getElementById("participantWarning");

    allUsers.forEach((user) => {
        const opt = document.createElement("option");
        opt.value = user.username;
        opt.text = user.username;
        participantSelect.appendChild(opt);
    });

    const selected = getCurrentParticipant();
    if (selected) participantSelect.value = selected;

    participantSelect.addEventListener("change", function () {
        setCurrentParticipant(this.value);
        participantWarning.style.display = this.value ? "none" : "block";
        updateBalanceDisplay();
    });

    if (!participantSelect.value) participantWarning.style.display = "block";
};

// Buy stock
async function buyStock() {
    const participant = getCurrentParticipant();
    if (!participant) {
        document.getElementById("participantWarning").style.display = "block";
        return;
    }

    const stock = document.getElementById("stockSelect").value;
    const price = parseFloat(document.getElementById("price").value);
    const quantity = parseInt(document.getElementById("quantity").value);

    if (!validateTradeInputs(price, quantity)) return;

    const totalCost = price * quantity;

    if (!(await canAffordPurchase(participant, totalCost))) {
        showPopup(
            `Cannot buy stocks. Insufficient funds. You need ${formatCurrency(totalCost)}.`,
            "error"
        );
        return;
    }

    if (!confirmAction(`Buy ${quantity} of ${stock} at ${formatCurrency(price)} each?`)) return;

    const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("username", participant)
        .single();
    if (!user) return showPopup("User not found.", "error");

    const { error } = await supabase.from("transactions").insert([
        {
            user_id: user.id,
            stock,
            price,
            quantity,
            type: "buy",
            timestamp: new Date().toISOString(),
        },
    ]);

    if (error) {
        console.error(error);
        return showPopup("Error recording transaction.", "error");
    }

    showPopup(
        `Successfully bought ${quantity} of ${stock} at ${formatCurrency(price)}.`,
        "success"
    );
    updateBalanceDisplay();
}

// Sell stock
async function sellStock() {
    const participant = getCurrentParticipant();
    if (!participant) {
        document.getElementById("participantWarning").style.display = "block";
        return;
    }

    const stock = document.getElementById("stockSelect").value;
    const price = parseFloat(document.getElementById("price").value);
    const quantity = parseInt(document.getElementById("quantity").value);
    const toUser = document.getElementById("sellToUser").value;

    if (!validateTradeInputs(price, quantity)) return;

    const totalCost = price * quantity;

    const available = await getAvailableStockQuantity(participant, stock);
    if (quantity > available) {
        return showPopup(`You only have ${available} of ${stock}.`, "error");
    }

    if (!(await canAffordPurchase(toUser, totalCost))) {
        return showPopup("Buyer has insufficient funds.", "error");
    }

    if (
        !confirmAction(
            `Sell ${quantity} of ${stock} to ${toUser} at ${formatCurrency(price)} each?`
        )
    )
        return;

    const { data: sellerUser } = await supabase
        .from("users")
        .select("id")
        .eq("username", participant)
        .single();
    const { data: buyerUser } = await supabase
        .from("users")
        .select("id")
        .eq("username", toUser)
        .single();
    if (!sellerUser || !buyerUser) return showPopup("Seller or buyer not found.", "error");

    const timestamp = new Date().toISOString();

    const { error: sellError } = await supabase.from("transactions").insert([
        {
            user_id: sellerUser.id,
            stock,
            price,
            quantity,
            type: "sell",
            counterparty: toUser,
            timestamp: timestamp,
        },
        {
            user_id: buyerUser.id,
            stock,
            price,
            quantity,
            type: "buy",
            counterparty: participant,
            timestamp: timestamp,
        },
    ]);

    if (sellError) {
        console.error(sellError);
        return showPopup("Failed to complete sale.", "error");
    }

    showPopup(`Sold ${quantity} of ${stock} to ${toUser} at ${formatCurrency(price)}.`, "success");
    updateBalanceDisplay();
}

// Helpers
function validateTradeInputs(price, quantity) {
    if (!isValidNumber(price)) {
        showPopup("Please enter a valid price (greater than 0).", "error");
        return false;
    }

    if (!isValidNumber(quantity) || !Number.isInteger(quantity)) {
        showPopup("Please enter a valid quantity (positive integer).", "error");
        return false;
    }

    return true;
}

async function updateBalanceDisplay() {
    const currentUser = getCurrentParticipant();
    if (currentUser) {
        const balance = await calculateBalance(currentUser);
        const balanceElement = document.getElementById("balanceDisplay");
        if (balanceElement) {
            balanceElement.innerText = formatCurrency(balance);
        }
    }
}

function showPopup(message, type = "info") {
    const popup = document.getElementById("popupModal");
    const popupMessage = document.getElementById("popupMessage");
    const popupContent = document.querySelector(".modal-content");

    popupMessage.innerText = message;
    popupContent.className = "modal-content";
    popupContent.classList.add(`modal-${type}`);
    popup.style.display = "block";

    if (type === "success") {
        setTimeout(() => closePopup(), 5000);
    }
}

function closePopup() {
    document.getElementById("popupModal").style.display = "none";
}
