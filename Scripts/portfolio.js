// portfolio.js

document.addEventListener("DOMContentLoaded", async () => {
    if (!initPage()) return;

    const role = sessionStorage.getItem("currentRole");
    if (role !== "trader" && role !== "admin") {
        window.location.href = "index.html";
        return;
    }

    await displayPortfolio();
});

async function displayPortfolio() {
    const boughtTable = document.getElementById("boughtTable");
    const soldTable = document.getElementById("soldTable");
    const cashElement = document.querySelector(".card-content h2");
    const stocksElement = document.getElementById("stocksOwned");

    // Clear existing table rows except headers
    while (boughtTable.rows.length > 1) boughtTable.deleteRow(1);
    while (soldTable.rows.length > 1) soldTable.deleteRow(1);

    const currentUser = getUser();
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    // Fetch user ID
    const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("username", currentUser)
        .single();

    if (userError || !userRecord) {
        console.error("User not found in database.");
        return;
    }

    const userId = userRecord.id;

    // Fetch transactions
    const { data: transactions, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false });

    if (txError) {
        console.error("Error fetching transactions:", txError.message);
        return;
    }

    // Categorize transactions
    const bought = transactions.filter((t) => t.type === "buy");
    const sold = transactions.filter((t) => t.type === "sell");

    let totalSpent = 0;
    let totalEarned = 0;
    const stocksOwned = {};

    // Process buys
    for (const tx of bought) {
        const { stock, quantity, price, created_at, counterparty } = tx;
        const total = quantity * price;
        totalSpent += total;

        if (!stocksOwned[stock]) stocksOwned[stock] = 0;
        stocksOwned[stock] += quantity;

        const row = boughtTable.insertRow();
        row.innerHTML = `
            <td>${stock}</td>
            <td>${quantity}</td>
            <td>${formatCurrency(price)}</td>
            <td>${formatCurrency(total)}</td>
            <td>${new Date(created_at).toLocaleDateString()} from ${counterparty || "Market"}</td>
        `;
    }

    // Process sells
    for (const tx of sold) {
        const { stock, quantity, price, created_at, counterparty } = tx;
        const total = quantity * price;
        totalEarned += total;

        if (!stocksOwned[stock]) stocksOwned[stock] = 0;
        stocksOwned[stock] -= quantity;

        const row = soldTable.insertRow();
        row.innerHTML = `
            <td>${stock}</td>
            <td>${quantity}</td>
            <td>${formatCurrency(price)}</td>
            <td>${formatCurrency(total)}</td>
            <td>${new Date(created_at).toLocaleDateString()} to ${counterparty || "Market"}</td>
        `;
    }

    // Calculate cash in hand
    const balance = INITIAL_BALANCE + totalEarned - totalSpent;
    cashElement.innerText = `Cash in Hand: ${formatCurrency(balance)}`;

    // Display owned stocks
    const ownedList = Object.entries(stocksOwned)
        .filter(([_, qty]) => qty > 0)
        .map(
            ([stock, qty]) =>
                `<li><span class="stock-name">${stock}</span>: <span class="stock-quantity">${qty}</span></li>`
        );

    if (ownedList.length > 0) {
        stocksElement.innerHTML = `<ul class='stocks-list'>${ownedList.join("")}</ul>`;
    } else {
        stocksElement.innerHTML = `<p>You don't own any stocks yet.</p>`;
    }
}
