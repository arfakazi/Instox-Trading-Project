// leaderboard.js

function loadTeamLeaderboard() {
    const tbody = document.getElementById("teamLeaderboardBody");
    tbody.innerHTML = "";
    const leaderboard = generateTeamLeaderboard();
    leaderboard.forEach((team, idx) => {
        const stocks = Object.entries(team.totalStocks)
            .map(([stock, qty]) => `${stock}: ${qty}`)
            .join("<br>");
        const trader = getTeam(idx + 1);
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${idx + 1}</td>
            <td>${team.team}</td>
            <td>${trader}</td>
            <td>${formatCurrency(team.totalBalance)}</td>
            <td>${stocks || "-"}</td>
        `;
        tbody.appendChild(row);
    });
}

// Initialize page
window.onload = function () {
    // Check if user is logged in
    if (!initPage()) {
        return;
    }
    // Only load team leaderboard
    loadTeamLeaderboard();
};
