// utils.js

// Constants
const INITIAL_BALANCE = 100000;

// === SESSION HELPERS ===
function getUser() {
    return sessionStorage.getItem("currentUser");
}

function setUser(username) {
    sessionStorage.setItem("currentUser", username);
}

function removeUser() {
    sessionStorage.removeItem("currentUser");
}

// === USER DATA ===
async function getUserData(username) {
    const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .single();

    if (!user) return { bought: [], sold: [] };

    const { data, error } = await supabase.from("transactions").select("*").eq("user_id", user.id);

    if (error) {
        console.error(error);
        return { bought: [], sold: [] };
    }

    const bought = data.filter((t) => t.type === "buy");
    const sold = data.filter((t) => t.type === "sell");

    return { bought, sold };
}

async function calculateBalance(username) {
    const data = await getUserData(username);
    const totalSpent = data.bought.reduce(
        (sum, t) => sum + parseFloat(t.price) * parseInt(t.quantity),
        0
    );
    const totalEarned = data.sold.reduce(
        (sum, t) => sum + parseFloat(t.price) * parseInt(t.quantity),
        0
    );
    return parseFloat((INITIAL_BALANCE - totalSpent + totalEarned).toFixed(2));
}

async function canAffordPurchase(username, cost) {
    const balance = await calculateBalance(username);
    return balance >= cost;
}

async function getAvailableStockQuantity(username, stockName) {
    const data = await getUserData(username);
    const boughtQty = data.bought
        .filter((t) => t.stock === stockName)
        .reduce((sum, t) => sum + parseInt(t.quantity), 0);
    const soldQty = data.sold
        .filter((t) => t.stock === stockName)
        .reduce((sum, t) => sum + parseInt(t.quantity), 0);
    return boughtQty - soldQty;
}

// === AUTH + ROLE ===
function logout() {
    removeUser();
    sessionStorage.removeItem("currentRole");
    window.location.href = "login.html";
}

function initPage() {
    const user = getUser();
    if (!user) {
        window.location.href = "login.html";
        return false;
    }

    const el = document.getElementById("userInfo");
    if (el) {
        el.innerText = `Logged in as: ${user}`;
    }

    return true;
}

function isValidNumber(value) {
    return !isNaN(value) && value > 0;
}

function formatCurrency(amount) {
    return `AED${amount.toLocaleString()}`;
}

function confirmAction(msg) {
    return confirm(msg);
}

function getRole() {
    return sessionStorage.getItem("currentRole");
}

// === TEAM REGISTRATION ===
async function registerTeamAccount(username, password) {
    // Save to users table
    const { error: userError } = await supabase
        .from("users")
        .insert([{ username, password, role: "trader" }]);

    if (userError) {
        throw userError;
    }
}

async function getTeam(teamNumber) {
    const { data, error } = await supabase
        .from("teams")
        .select("trader_username")
        .eq("team_number", teamNumber);

    if (error) {
        console.error(error);
        return null;
    }

    return data.map((d) => d.trader_username);
}

async function getAllTeams() {
    const { data, error } = await supabase
        .from("users")
        .select("username, role")
        .in("role", ["broker", "trader"]);

    if (error) {
        console.error(error);
        return [];
    }

    // Return as an array of user objects
    return data;
}

// === BROKER UTILITIES ===
function setCurrentParticipant(username) {
    sessionStorage.setItem("currentParticipant", username);
}

function getCurrentParticipant() {
    return sessionStorage.getItem("currentParticipant");
}

function removeCurrentParticipant() {
    sessionStorage.removeItem("currentParticipant");
}

// === TEAM LEADERBOARD ===
async function generateTeamLeaderboard() {
    const teams = await getAllTeams();
    const leaderboard = [];

    for (const [teamName, traders] of Object.entries(teams)) {
        for (const trader of traders) {
            const balance = await calculateBalance(trader);
            const stocks = await getStockHoldings(trader);
            leaderboard.push({
                team: teamName,
                totalBalance: balance,
                totalStocks: stocks,
            });
        }
    }

    leaderboard.sort((a, b) => b.totalBalance - a.totalBalance);
    return leaderboard;
}

async function getStockHoldings(username) {
    const data = await getUserData(username);
    const holdings = {};

    for (const t of data.bought) {
        const qty = parseInt(t.quantity);
        holdings[t.stock] = (holdings[t.stock] || 0) + qty;
    }

    for (const t of data.sold) {
        const qty = parseInt(t.quantity);
        holdings[t.stock] = (holdings[t.stock] || 0) - qty;
    }

    for (const stock in holdings) {
        if (holdings[stock] <= 0) delete holdings[stock];
    }

    return holdings;
}
