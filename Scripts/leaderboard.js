// leaderboard.js

document.addEventListener("DOMContentLoaded", () => {
    loadTeamLeaderboard();
});

async function loadTeamLeaderboard() {
    const tbody = document.getElementById("teamLeaderboardBody");
    tbody.innerHTML = "";

    const users = await getAllTeams();
    const leaderboard = [];

    // Collect each trader's team and financial data
    for (const user of users) {
        const username = user.username;

        // Skip non-traders
        if (user.role !== "trader") continue;

        const balance = await calculateBalance(username);
        const stocks = await getStockHoldings(username);

        // No teams table, so just use username or a placeholder
        const teamNumber = username; // or "-" if you want to leave it blank

        leaderboard.push({
            team: teamNumber,
            trader: username,
            totalBalance: balance,
            totalStocks: stocks,
        });
    }

    // Sort leaderboard by total balance descending
    leaderboard.sort((a, b) => b.totalBalance - a.totalBalance);

    // Populate table rows
    leaderboard.forEach((entry, idx) => {
        const stocks =
            Object.entries(entry.totalStocks)
                .map(([stock, qty]) => `${stock}: ${qty}`)
                .join("<br>") || "-";

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${idx + 1}</td>
            <td>${entry.team}</td>
            <td>${entry.trader}</td>
            <td>${formatCurrency(entry.totalBalance)}</td>
            <td>${stocks}</td>
        `;
        tbody.appendChild(row);
    });
}
