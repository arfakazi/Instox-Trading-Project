// portfolio.js

// Function to display portfolio data
function displayPortfolio() {
    const boughtTable = document.getElementById("boughtTable");
    const soldTable = document.getElementById("soldTable");
    const cashElement = document.querySelector(".card-content h2");
    const stocksElement = document.getElementById("stocksOwned");

    // Clear existing table rows except headers
    while (boughtTable.rows.length > 1) {
        boughtTable.deleteRow(1);
    }

    while (soldTable.rows.length > 1) {
        soldTable.deleteRow(1);
    }

    // Get current user
    const currentUser = getUser();
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    // Get user data
    const userData = getUserData(currentUser);

    // Calculate totals
    let totalSpent = 0;
    let totalEarned = 0;

    // Group stocks by name to show total owned
    const stocksOwned = {};

    // Process bought stocks
    userData.bought.forEach(({ stock, price, quantity, date, seller }) => {
        const row = boughtTable.insertRow();
        const total = price * quantity;
        totalSpent += total;

        // Add to stocks owned
        if (!stocksOwned[stock]) {
            stocksOwned[stock] = 0;
        }
        stocksOwned[stock] += parseInt(quantity);

        // Format date if available
        const formattedDate = date ? new Date(date).toLocaleDateString() : "N/A";
        const sellerInfo = seller ? `from ${seller}` : "";

        row.innerHTML = `
            <td>${stock}</td>
            <td>${quantity}</td>
            <td>${formatCurrency(price)}</td>
            <td>${formatCurrency(total)}</td>
            <td>${formattedDate} ${sellerInfo}</td>
        `;
    });

    // Process sold stocks
    userData.sold.forEach(({ stock, price, quantity, date, buyer }) => {
        const row = soldTable.insertRow();
        const total = price * quantity;
        totalEarned += total;

        // Subtract from stocks owned
        if (stocksOwned[stock]) {
            stocksOwned[stock] -= parseInt(quantity);
        }

        // Format date if available
        const formattedDate = date ? new Date(date).toLocaleDateString() : "N/A";
        const buyerInfo = buyer ? `to ${buyer}` : "";

        row.innerHTML = `
            <td>${stock}</td>
            <td>${quantity}</td>
            <td>${formatCurrency(price)}</td>
            <td>${formatCurrency(total)}</td>
            <td>${formattedDate} ${buyerInfo}</td>
        `;
    });

    // Display cash in hand
    const cashInHand = calculateBalance(currentUser);
    cashElement.innerText = `Cash in Hand: ${formatCurrency(cashInHand)}`;

    // Display stocks currently owned
    let stocksHtml = "<ul class='stocks-list'>";
    let hasStocks = false;

    for (const [stock, quantity] of Object.entries(stocksOwned)) {
        if (quantity > 0) {
            hasStocks = true;
            stocksHtml += `<li><span class="stock-name">${stock}</span>: <span class="stock-quantity">${quantity}</span></li>`;
        }
    }

    stocksHtml += "</ul>";

    if (!hasStocks) {
        stocksHtml = "<p>You don't own any stocks yet.</p>";
    }

    stocksElement.innerHTML = stocksHtml;
}

// Initialize page
window.onload = function () {
    // Check if user is logged in
    if (!initPage()) {
        return;
    }

    // Display portfolio data
    displayPortfolio();
};
