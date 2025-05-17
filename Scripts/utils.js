// utils.js

// Constants
const INITIAL_BALANCE = 100000;

// ------------------------
// Connect to the SupaBase database
// ------------------------

const SUPABASE_URL = "https://rnxeqexgzgismtnnfemv.supabase.co"; // Replace with your actual URL
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJueGVxZXhnemdpc210bm5mZW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0ODI4ODMsImV4cCI6MjA2MzA1ODg4M30.-mAHroO8q7hKoN9_5wwkkPNwY-A4rWKrwVwb2Nr-zoM"; // From API settings

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ------------------------
// 🔹 USER SESSION HELPERS
// ------------------------

function getUser() {
    return localStorage.getItem("currentUser");
}

function setUser(username) {
    localStorage.setItem("currentUser", username);
}

function removeUser() {
    localStorage.removeItem("currentUser");
}

// ------------------------
// 🔹 USER DATA MANAGEMENT
// ------------------------

function getUserData(user) {
    return JSON.parse(localStorage.getItem(user)) || { bought: [], sold: [] };
}

function saveUserData(user, data) {
    localStorage.setItem(user, JSON.stringify(data));
}

function calculateBalance(user) {
    const data = getUserData(user);
    const totalSpent = data.bought.reduce(
        (sum, entry) => sum + parseFloat(entry.price) * parseInt(entry.quantity),
        0
    );
    const totalEarned = data.sold.reduce(
        (sum, entry) => sum + parseFloat(entry.price) * parseInt(entry.quantity),
        0
    );
    return parseFloat((INITIAL_BALANCE - totalSpent + totalEarned).toFixed(2));
}

function canAffordPurchase(user, cost) {
    return calculateBalance(user) >= cost;
}

function getAvailableStockQuantity(user, stockName) {
    const data = getUserData(user);
    const totalBought = data.bought
        .filter((entry) => entry.stock === stockName)
        .reduce((sum, entry) => sum + parseInt(entry.quantity), 0);
    const totalSold = data.sold
        .filter((entry) => entry.stock === stockName)
        .reduce((sum, entry) => sum + parseInt(entry.quantity), 0);
    return totalBought - totalSold;
}

// ------------------------
// 🔹 AUTH + ROLE CONTROL
// ------------------------

function logout() {
    removeUser();
    localStorage.removeItem("currentRole");
    window.location.href = "login.html";
}

function initPage() {
    const user = getUser();
    if (!user) {
        window.location.href = "login.html";
        return false;
    }

    const userInfoElement = document.getElementById("userInfo");
    if (userInfoElement) {
        userInfoElement.innerText = `Logged in as: ${user}`;
    }
    return true;
}

function isValidNumber(value) {
    return !isNaN(value) && value > 0;
}

function formatCurrency(amount) {
    return `AED${amount.toLocaleString()}`;
}

function confirmAction(message) {
    return confirm(message);
}

function getRole() {
    return localStorage.getItem("currentRole");
}

// ------------------------
// 🔹 TEAM REGISTRATION
// ------------------------

// Save a single user/team trader
function saveTeam(teamNumber, traderUsername) {
    const teamKey = `team_${teamNumber}`;
    localStorage.setItem(teamKey, traderUsername);
}

function getTeam(teamNumber) {
    return localStorage.getItem(`team_${teamNumber}`) || null;
}

function getAllTeams() {
    const teams = {};
    for (let i = 1; i <= 30; i++) {
        const key = `team_${i}`;
        const trader = localStorage.getItem(key);
        if (trader) {
            const teamName = `Team ${i}`;
            if (!teams[teamName]) {
                teams[teamName] = [];
            }
            teams[teamName].push(trader);
        }
    }
    return teams;
}

// ------------------------
// 🔹 BROKER UTILITIES
// ------------------------

function setCurrentParticipant(participantUsername) {
    localStorage.setItem("currentParticipant", participantUsername);
}

function getCurrentParticipant() {
    return localStorage.getItem("currentParticipant");
}

function removeCurrentParticipant() {
    localStorage.removeItem("currentParticipant");
}

// ------------------------
// 🔹 TEAM LEADERBOARD
// ------------------------

function generateTeamLeaderboard() {
    const leaderboard = [];

    for (let i = 1; i <= 30; i++) {
        const trader = getTeam(i);
        if (!trader) continue;

        const teamBalance = calculateBalance(trader);
        const stockTotals = getStockHoldings(trader);

        leaderboard.push({
            team: `Team ${i}`,
            totalBalance: parseFloat(teamBalance.toFixed(2)),
            totalStocks: stockTotals,
        });
    }

    leaderboard.sort((a, b) => b.totalBalance - a.totalBalance);
    return leaderboard;
}

function getStockHoldings(user) {
    const data = getUserData(user);
    const holdings = {};

    data.bought.forEach((entry) => {
        const qty = parseInt(entry.quantity);
        holdings[entry.stock] = (holdings[entry.stock] || 0) + qty;
    });

    data.sold.forEach((entry) => {
        const qty = parseInt(entry.quantity);
        holdings[entry.stock] = (holdings[entry.stock] || 0) - qty;
    });

    // Remove zero or negative holdings
    for (const stock in holdings) {
        if (holdings[stock] <= 0) delete holdings[stock];
    }

    return holdings;
}

// ------------------------
// 🔹 TEAM ACCOUNT CREATION
// ------------------------

function registerTeamAccount(teamNumber, username, password) {
    if (!username || !password) {
        throw new Error("Username and password are required.");
    }

    // Save trader to team
    saveTeam(teamNumber, username);

    // Save credentials
    localStorage.setItem(
        `team_auth_${username}`,
        JSON.stringify({
            teamNumber,
            username,
            password,
        })
    );
}

function getTeamAuth(username) {
    return JSON.parse(localStorage.getItem(`team_auth_${username}`));
}
