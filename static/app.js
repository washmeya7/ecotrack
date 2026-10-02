/* =========================================================
CARBON FOOTPRINT + ECO SCORE HISTORY
========================================================= */

function saveEnvironmentalHistory(carbon, ecoScore) {

let history = [];

try {

    history = JSON.parse(
        localStorage.getItem("ecotrack_history") || "[]"
    );

    if (!Array.isArray(history)) {
        history = [];
    }

} catch (error) {

    console.warn("History data error:", error);

    history = [];
}


const todayKey = new Intl.DateTimeFormat("en-CA", {
timeZone: "Asia/Kolkata",
year: "numeric",
month: "2-digit",
day: "2-digit"

}).format(new Date());
/* Find today's existing entry */

const existingIndex = history.findIndex(function(item) {

    return item &&
        item.date === todayKey;

});


/* Get existing values */

let currentCarbon = null;
let currentEcoScore = null;


if (existingIndex !== -1) {

    currentCarbon =
        history[existingIndex].carbon;

    currentEcoScore =
        history[existingIndex].ecoScore;
}


/* Update only values that are provided */

if (
    carbon !== null &&
    carbon !== undefined &&
    Number.isFinite(Number(carbon))
) {

    currentCarbon =
        Number(carbon);

}


if (
    ecoScore !== null &&
    ecoScore !== undefined &&
    Number.isFinite(Number(ecoScore))
) {

    currentEcoScore =
        Number(ecoScore);

}


const entry = {

    date: todayKey,

    carbon:
        currentCarbon !== null
            ? Number(currentCarbon)
            : null,

    ecoScore:
        currentEcoScore !== null
            ? Number(currentEcoScore)
            : null

};


/* Update today's entry */

if (existingIndex !== -1) {

    history[existingIndex] = entry;

} else {

    history.push(entry);

}


/* Keep latest 30 records */

history = history.slice(-30);


localStorage.setItem(
    "ecotrack_history",
    JSON.stringify(history)
);


console.log(
    "Environmental history saved:",
    entry
);


/* Update history display */

renderEnvironmentalHistory(history);

}

/* =========================================================
RENDER ENVIRONMENTAL HISTORY
========================================================= */

function renderEnvironmentalHistory(history) {

const container =
    document.getElementById("environmentalHistory");

if (!container) {
    return;
}


if (!Array.isArray(history) || history.length === 0) {

    container.innerHTML = `
        <div class="history-empty">
            🌱 Calculate your Carbon Footprint or Eco Score
            to start building your history.
        </div>
    `;

    return;
}


const latestHistory =
    history.slice().reverse();


container.innerHTML = latestHistory.map(function(item) {

    const carbon =
        item.carbon !== null &&
        item.carbon !== undefined
            ? Number(item.carbon).toFixed(1) + " kg CO₂e"
            : "Not calculated";


    const ecoScore =
        item.ecoScore !== null &&
        item.ecoScore !== undefined
            ? Math.round(Number(item.ecoScore)) + "/100"
            : "Not calculated";


    return `

        <div class="history-row">

            <div class="history-date">
                📅 ${item.date}
            </div>

            <div class="history-value">
                <span>🌍 Carbon Footprint</span>
                <strong>${carbon}</strong>
            </div>

            <div class="history-value">
                <span>🌱 Eco Score</span>
                <strong>${ecoScore}</strong>
            </div>

        </div>

    `;

}).join("");

}

/* =========================================================
LOAD ENVIRONMENTAL HISTORY
========================================================= */

document.addEventListener(
"DOMContentLoaded",
function () {

    let history = [];

    try {

        history = JSON.parse(
            localStorage.getItem(
                "ecotrack_history"
            ) || "[]"
        );

        if (!Array.isArray(history)) {
            history = [];
        }

    } catch (error) {

        history = [];

    }

    renderEnvironmentalHistory(history);

}

);
/* =========================================================
ECOTRACK - ECO SCORE + CARBON CALCULATOR
========================================================= */

function getValue(id) {
const element = document.getElementById(id);

if (!element) {
    console.warn("Input not found:", id);
    return 0;
}

const value = parseFloat(element.value);

return Number.isFinite(value) && value >= 0 ? value : 0;

}

/* =========================================================
MAIN CALCULATION
========================================================= */

function calculateFootprint() {

// Get lifestyle values
const transportation = getValue("transportation");
const electricity = getValue("electricity");
const food = getValue("food");
const shopping = getValue("shopping");
const homeEnergy = getValue("home_energy");
const travel = getValue("travel");


/* =====================================================
   CARBON ESTIMATION
   ===================================================== */

const transportCO2 =
    transportation * 0.21 * 4.33;

const electricityCO2 =
    electricity * 0.42;

const foodCO2 =
    food * 0.02;

const shoppingCO2 =
    shopping * 0.01;

const homeEnergyCO2 =
    homeEnergy * 2;

const travelCO2 =
    travel * 90;


const total =
    transportCO2 +
    electricityCO2 +
    foodCO2 +
    shoppingCO2 +
    homeEnergyCO2 +
    travelCO2;


const carbonTotal =
    Math.max(0, total);


/* =====================================================
   ECO SCORE
   ===================================================== */

/*
   Each category receives a score from 0-100.

   Lower consumption = better score.
*/

const transportationScore =
    calculateCategoryScore(
        transportation,
        400
    );

const electricityScore =
    calculateCategoryScore(
        electricity,
        500
    );

const foodScore =
    calculateCategoryScore(
        food,
        15000
    );

const shoppingScore =
    calculateCategoryScore(
        shopping,
        15000
    );

const homeEnergyScore =
    calculateCategoryScore(
        homeEnergy,
        100
    );

const travelScore =
    calculateCategoryScore(
        travel,
        20
    );


/*
   Overall Eco Score

   Different categories have different weights.
*/

const ecoScore = Math.round(
    transportationScore * 0.25 +
    electricityScore * 0.20 +
    foodScore * 0.15 +
    shoppingScore * 0.15 +
    homeEnergyScore * 0.15 +
    travelScore * 0.10
);


/* =====================================================
   UPDATE CARBON RESULT
   ===================================================== */

const carbonResult =
    document.getElementById("carbonResult");

if (carbonResult) {
    carbonResult.textContent =
        carbonTotal.toFixed(1);
}


/* =====================================================
   UPDATE ECO SCORE
   ===================================================== */

updateEcoScore(ecoScore);


/* =====================================================
   UPDATE BREAKDOWN
   ===================================================== */

updateBreakdown({
    transportation: transportationScore,
    electricity: electricityScore,
    food: foodScore,
    shopping: shoppingScore,
    homeEnergy: homeEnergyScore,
    travel: travelScore
});

showRecommendations({

ecoScore,

transportation,
electricity,
food,
shopping,
homeEnergy,
travel,

transportationScore,
electricityScore,
foodScore,
shoppingScore,
homeEnergyScore,
travelScore

});

/* =====================================================
   SAVE RESULT
   ===================================================== */

const result = {
    ecoScore: ecoScore,
    carbon: carbonTotal,

    transportation,
    electricity,
    food,
    shopping,
    homeEnergy,
    travel,

    date: new Date().toISOString()
};

/* SAVE CARBON FOOTPRINT HISTORY */

saveEnvironmentalHistory(carbonTotal, ecoScore)



console.log("Eco Score:", ecoScore);
console.log("Carbon Footprint:", carbonTotal);

}

/* =========================================================
CATEGORY SCORE
========================================================= */

function calculateCategoryScore(value, idealLimit) {

if (value <= 0) {
    return 100;
}

let score =
    100 - ((value / idealLimit) * 100);

score =
    Math.max(0, Math.min(100, score));

return Math.round(score);

}

/* =========================================================
ECO SCORE DISPLAY
========================================================= */

function updateEcoScore(score) {

const scoreElement =
    document.getElementById("ecoScore");

const levelElement =
    document.getElementById("ecoLevel");


if (scoreElement) {
    scoreElement.textContent = score;
}


if (levelElement) {

    let level = "";

    if (score >= 80) {
        level = "🌿 Excellent Eco Warrior";
    }
    else if (score >= 60) {
        level = "🌱 Good Eco Citizen";
    }
    else if (score >= 40) {
        level = "🌍 Getting Greener";
    }
    else if (score >= 20) {
        level = "🌤️ Needs Improvement";
    }
    else {
        level = "⚠️ High Environmental Impact";
    }

    levelElement.textContent = level;
}

}

/* =========================================================
BREAKDOWN
========================================================= */

function updateBreakdown(scores) {

const breakdown =
    document.getElementById("breakdown");

if (!breakdown) {
    return;
}


breakdown.innerHTML = `

    <div class="score-row">
        <span>🚗 Transportation</span>
        <strong>${scores.transportation}/100</strong>
    </div>

    <div class="score-row">
        <span>⚡ Electricity</span>
        <strong>${scores.electricity}/100</strong>
    </div>

    <div class="score-row">
        <span>🍽️ Food</span>
        <strong>${scores.food}/100</strong>
    </div>

    <div class="score-row">
        <span>🛍️ Shopping</span>
        <strong>${scores.shopping}/100</strong>
    </div>

    <div class="score-row">
        <span>🏠 Home Energy</span>
        <strong>${scores.homeEnergy}/100</strong>
    </div>

    <div class="score-row">
        <span>✈️ Travel</span>
        <strong>${scores.travel}/100</strong>
    </div>

`;

}

/* =========================================================
AI ECO RECOMMENDATION ENGINE
CONNECTED TO CURRENT ECO SCORE
========================================================= */

function showRecommendations(data) {

const container =
    document.getElementById("recommendations");

const scoreElement =
    document.getElementById("aiRecommendationScore");

const overviewElement =
    document.getElementById("aiRecommendationOverview");

if (!container) {
    return;
}


/* =========================
   MASTER ECO SCORE
========================= */

const ecoScore =
    Number(data.ecoScore) || 0;


/* =========================
   CURRENT CATEGORY SCORES
========================= */

const areas = [

    {
        key: "transport",
        name: "Transport",
        icon: "🚗",
        score: Number(data.transportScore) || 0,
        value: Number(data.transport) || 0
    },

    {
        key: "electricity",
        name: "Electricity",
        icon: "⚡",
        score: Number(data.energyScore) || 0,
        value: Number(data.electricity) || 0
    },

    {
        key: "water",
        name: "Water",
        icon: "💧",
        score: Number(data.waterScore) || 0,
        value: Number(data.water) || 0
    },

    {
        key: "waste",
        name: "Waste",
        icon: "♻️",
        score: Number(data.wasteScore) || 0,
        value: Number(data.waste) || 0
    }

];


/* =========================
   UPDATE AI SCORE
========================= */

if (scoreElement) {
    scoreElement.textContent = ecoScore;
}


/* =========================
   OVERALL MESSAGE
========================= */

if (overviewElement) {

    if (ecoScore >= 90) {

        overviewElement.textContent =
            "Excellent! Your eco habits are outstanding. Keep maintaining them.";

    } else if (ecoScore >= 75) {

        overviewElement.textContent =
            "Great progress! Your lifestyle is eco-friendly, with a few areas to improve.";

    } else if (ecoScore >= 50) {

        overviewElement.textContent =
            "Good start! EcoTrack found some areas where small changes can improve your score.";

    } else {

        overviewElement.textContent =
            "Your environmental impact can be improved. Start with the priority actions below.";

    }
}


/* =========================
   FIND WEAKEST AREAS
========================= */

areas.sort(function(a, b) {

    return a.score - b.score;

});


/* =========================
   CREATE RECOMMENDATIONS
========================= */

const recommendations = [];


areas.forEach(function(area) {

    if (recommendations.length >= 3) {
        return;
    }


    if (area.score >= 20) {
        return;
    }


    let recommendation;


    /* TRANSPORT */

    if (area.key === "transport") {

        recommendation = {

            icon: "🚲",

            title: "Reduce Transport Impact",

            text:
                `Your transport activity is ${area.value}. Try walking, cycling or using public transport for some trips.`,

            priority:
                area.score < 13
                    ? "High Priority"
                    : "Recommended"

        };

    }


    /* ELECTRICITY */

    else if (area.key === "electricity") {

        recommendation = {

            icon: "💡",

            title: "Reduce Electricity Usage",

            text:
                `Your electricity usage is ${area.value}. Switch off unused appliances and use energy-efficient devices.`,

            priority:
                area.score < 13
                    ? "High Priority"
                    : "Recommended"

        };

    }


    /* WATER */

    else if (area.key === "water") {

        recommendation = {

            icon: "💧",

            title: "Save Water",

            text:
                `Your water usage is ${area.value}. Take shorter showers, fix leaks and avoid unnecessary water use.`,

            priority:
                area.score < 13
                    ? "High Priority"
                    : "Recommended"

        };

    }


    /* WASTE */

    else if (area.key === "waste") {

        recommendation = {

            icon: "♻️",

            title: "Reduce Waste",

            text:
                `Your daily waste is ${area.value}. Recycle more, avoid single-use products and reduce unnecessary waste.`,

            priority:
                area.score < 13
                    ? "High Priority"
                    : "Recommended"

        };

    }


    if (recommendation) {

        recommendations.push(recommendation);

    }

});


/* =========================
   EXCELLENT SCORE
========================= */

if (
    ecoScore >= 80 &&
    recommendations.length === 0
) {

    container.innerHTML = `

        <div class="ai-excellent-card">

            <div class="icon">
                🌿
            </div>

            <h3>
                Excellent Eco Performance!
            </h3>

            <p>
                Your Eco Score is ${ecoScore}/100.
                Keep maintaining your sustainable habits.
            </p>

        </div>

    `;

    return;
}


/* =========================
   FALLBACK
========================= */

if (recommendations.length === 0) {

    container.innerHTML = `

        <div class="ai-excellent-card">

            <div class="icon">
                🌱
            </div>

            <h3>
                Keep Going!
            </h3>

            <p>
                Continue improving your daily environmental habits.
            </p>

        </div>

    `;

    return;
}


/* =========================
   DISPLAY RECOMMENDATIONS
========================= */

container.innerHTML = "";


recommendations.forEach(function(item) {

    const card =
        document.createElement("div");

    card.className =
        "ai-recommendation-card";


    card.innerHTML = `

        <div class="ai-recommendation-icon">
            ${item.icon}
        </div>

        <div class="ai-recommendation-content">

            <h3>
                ${item.title}
            </h3>

            <p>
                ${item.text}
            </p>

            <span class="ai-recommendation-priority">
                ${item.priority}
            </span>

        </div>

        <button
            class="ai-recommendation-action"
            onclick="scrollToGamification()"
        >
            Take Action
        </button>

    `;


    container.appendChild(card);

});

}

/* =========================================================
LOAD SAVED RESULT
========================================================= */

document.addEventListener(
"DOMContentLoaded",
function () {

    const saved =
        localStorage.getItem(
            "ecotrack_last_result"
        );


    if (!saved) {
        return;
    }


    try {

        const data =
            JSON.parse(saved);


        if (data.ecoScore !== undefined) {

            updateEcoScore(
                Number(data.ecoScore)
            );
        }


        if (data.carbon !== undefined) {

            const carbonResult =
                document.getElementById(
                    "carbonResult"
                );

            if (carbonResult) {

                carbonResult.textContent =
                    Number(data.carbon).toFixed(1);
            }
        }


    }
    catch (error) {

        console.error(
            "Could not load saved EcoTrack result.",
            error
        );
    }

}

);
/* =========================================
ECOTRACK ECO SCORE SYSTEM
========================================= */



function calculateEcoScore() {

// =========================
// GET INPUTS
// =========================

const electricity =
    Number(document.getElementById("ecoElectricity").value) || 0;

const water =
    Number(document.getElementById("ecoWater").value) || 0;

const transport =
    Number(document.getElementById("ecoTransport").value) || 0;

const waste =
    Number(document.getElementById("ecoWaste").value) || 0;


// =========================
// ENERGY — 25 POINTS
// =========================

let energyScore;

if (electricity <= 100) {
    energyScore = 25;
} else if (electricity <= 150) {
    energyScore = 22;
} else if (electricity <= 200) {
    energyScore = 18;
} else if (electricity <= 300) {
    energyScore = 13;
} else if (electricity <= 400) {
    energyScore = 8;
} else {
    energyScore = 3;
}


// =========================
// WATER — 25 POINTS
// =========================

let waterScore;

if (water <= 80) {
    waterScore = 25;
} else if (water <= 120) {
    waterScore = 22;
} else if (water <= 160) {
    waterScore = 18;
} else if (water <= 200) {
    waterScore = 13;
} else if (water <= 250) {
    waterScore = 8;
} else {
    waterScore = 3;
}


// =========================
// TRANSPORT — 25 POINTS
// =========================

let transportScore;

if (transport <= 5) {
    transportScore = 25;
} else if (transport <= 10) {
    transportScore = 22;
} else if (transport <= 20) {
    transportScore = 18;
} else if (transport <= 30) {
    transportScore = 13;
} else if (transport <= 50) {
    transportScore = 8;
} else {
    transportScore = 3;
}


// =========================
// WASTE — 25 POINTS
// =========================

let wasteScore;

if (waste <= 0.5) {
    wasteScore = 25;
} else if (waste <= 1) {
    wasteScore = 22;
} else if (waste <= 1.5) {
    wasteScore = 18;
} else if (waste <= 2) {
    wasteScore = 13;
} else if (waste <= 3) {
    wasteScore = 8;
} else {
    wasteScore = 3;
}


// =========================
// TOTAL
// =========================

const totalScore =
    energyScore +
    waterScore +
    transportScore +
    wasteScore;

    const dashboardScore = document.getElementById("dashboardScore");

if (dashboardScore) {
    dashboardScore.textContent = totalScore;
}
const aiScore = document.getElementById("aiRecommendationScore");

if (aiScore) {
    aiScore.textContent = totalScore;
}
console.log("INPUTS:", electricity, water, transport, waste);
console.log("SCORES:", energyScore, waterScore, transportScore, wasteScore);
console.log("TOTAL SCORE:", totalScore);

// =========================
// CATEGORY SCORES
// =========================

document.getElementById("energyScore").textContent =
    energyScore + "/25";

document.getElementById("waterScore").textContent =
    waterScore + "/25";

document.getElementById("transportScore").textContent =
    transportScore + "/25";

document.getElementById("wasteScore").textContent =
    wasteScore + "/25";


// =========================
// PROGRESS BARS
// =========================

document.getElementById("energyProgress").style.width =
    (energyScore / 25 * 100) + "%";

document.getElementById("waterProgress").style.width =
    (waterScore / 25 * 100) + "%";

document.getElementById("transportProgress").style.width =
    (transportScore / 25 * 100) + "%";

document.getElementById("wasteProgress").style.width =
    (wasteScore / 25 * 100) + "%";


// =========================
// FINAL ECO SCORE
// =========================

document.getElementById("finalEcoScore").textContent =
    totalScore;


// =========================
// SCORE LEVEL
// =========================

let level = "";

if (totalScore >= 90) {

    level = "🌿 Excellent Eco Warrior";

} else if (totalScore >= 75) {

    level = "🌱 Great Eco Citizen";

} else if (totalScore >= 50) {

    level = "🌍 Good Eco Citizen";

} else if (totalScore >= 25) {

    level = "🌤️ Needs Improvement";

} else {

    level = "⚠️ High Environmental Impact";
}


document.getElementById("finalEcoLevel").textContent =
    level;


// =========================
// MESSAGE
// =========================

const message =
    document.getElementById("ecoScoreMessage");

if (totalScore >= 90) {

    message.textContent =
        "🌍 Excellent! You're highly eco-friendly.";

} else if (totalScore >= 75) {

    message.textContent =
        "🌿 Great job! Your environmental impact is low.";

} else if (totalScore >= 50) {

    message.textContent =
        "🌱 Good start! There is room for improvement.";

} else {

    message.textContent =
        "⚠️ Your environmental impact can be improved.";
}


// =========================
// TIP
// =========================

document.getElementById("ecoTip").textContent =
    "💡 Try reducing electricity, saving water, using public transport and recycling more.";


// =========================
// SHOW RESULT
// =========================

document.getElementById("ecoScoreResult").style.display =
    "block";


// =========================
// SAVE
// =========================

/* ==============================
SAVE ECO SCORE
============================== */

const ecoResult = {
ecoScore: totalScore,
electricity: electricity,
water: water,
transport: transport,
waste: waste,

energyScore: energyScore,
waterScore: waterScore,
transportScore: transportScore,
wasteScore: wasteScore,

date: new Date().toISOString()

};

localStorage.setItem(
"ecotrack_eco_score",
JSON.stringify(ecoResult)
);

localStorage.setItem(
"ecotrack_last_result",
JSON.stringify(ecoResult)
);

/* ==============================
SAVE WEEKLY SCORE
============================== */

saveWeeklyScore(totalScore);

// ECOPOINTS
const ecoPoints = totalScore * 10;

// SAVE ECO SCORE + ECOPOINTS TO FIREBASE
fetch("/api/save-eco-data", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
    eco_score: Math.round(totalScore),
    carbon: null
})

})
.then(response => response.json())
.then(data => {
console.log("Eco data saved:", data);
})
.catch(error => {
console.error("Eco data save error:", error);
});

/* SAVE ECO SCORE TO HISTORY */

saveEnvironmentalHistory(
null,
totalScore
);
/* ==============================
UPDATE AI RECOMMENDATIONS
============================== */

showRecommendations({

ecoScore: totalScore,

electricity: electricity,
water: water,
transport: transport,
waste: waste,

energyScore: energyScore,
waterScore: waterScore,
transportScore: transportScore,
wasteScore: wasteScore

});

console.log("Eco Score:", totalScore);
/* ==============================
UPDATE ECO DASHBOARD
============================== */

const dashboard =
document.getElementById("ecoDashboard");

if (dashboard) {

dashboard.style.display = "block";


/* ECO SCORE */
document.getElementById(
    "dashboardScore"
).textContent = totalScore;

/* ECOPOINTS */



document.getElementById(
    "dashboardPoints"
).textContent = ecoPoints;



/* ECO LEVEL */

let dashboardLevel = "";

if (totalScore >= 80) {

    dashboardLevel =
        "🌿 Excellent Eco Warrior";

} else if (totalScore >= 60) {

    dashboardLevel =
        "🌱 Good Eco Citizen";

} else if (totalScore >= 40) {

    dashboardLevel =
        "🌍 Eco Friendly Beginner";

} else {

    dashboardLevel =
        "⚠️ Needs Improvement";
}


document.getElementById(
    "dashboardLevel"
).textContent = dashboardLevel;


/* TRANSPORT */

updateDashboardImpact(
    "dashboardTransport",
    "transportImpactBar",
    transportScore
);


/* ELECTRICITY */

updateDashboardImpact(
    "dashboardElectricity",
    "electricityImpactBar",
    energyScore
);


/* WATER */

updateDashboardImpact(
    "dashboardWater",
    "waterImpactBar",
    waterScore
);


/* WASTE */

updateDashboardImpact(
    "dashboardWaste",
    "wasteImpactBar",
    wasteScore
);
    // CATEGORY PROGRESS
updateCategoryProgress(
    transportScore,
    electricityScore,
    waterScore,
    wasteScore
);



}
}
/* ==============================
DASHBOARD IMPACT FUNCTION
============================== */

function updateDashboardImpact(
textId,
barId,
score
) {

const text =
    document.getElementById(textId);

const bar =
    document.getElementById(barId);

if (!text || !bar) {
    return;
}


const percentage =
    (score / 25) * 100;

bar.style.width =
    percentage + "%";


if (score >= 20) {

    text.textContent =
        "Low Impact";

} else if (score >= 13) {

    text.textContent =
        "Medium Impact";

} else {

    text.textContent =
        "High Impact";
}

}
/* =========================================================
ECOTRACK - CARBON CHART + PROGRESS + WEEKLY
========================================================= */

let carbonBreakdownChart = null;
let weeklyProgressChart = null;

/* =========================================================
CARBON BREAKDOWN CHART
========================================================= */

function updateCarbonBreakdownChart(breakdown) {

const canvas =
    document.getElementById("carbonBreakdownChart");

if (!canvas) return;


const values = [

    Number(breakdown.transportation) || 0,

    Number(breakdown.electricity) || 0,

    Number(breakdown.food) || 0,

    Number(breakdown.shopping) || 0,

    Number(breakdown.home_energy) || 0,

    Number(breakdown.travel) || 0

];


/* Update text */

document.getElementById("carbonTransport").textContent =
    values[0].toFixed(2) + " kg";

document.getElementById("carbonElectricity").textContent =
    values[1].toFixed(2) + " kg";

document.getElementById("carbonFood").textContent =
    values[2].toFixed(2) + " kg";

document.getElementById("carbonShopping").textContent =
    values[3].toFixed(2) + " kg";

document.getElementById("carbonHome").textContent =
    values[4].toFixed(2) + " kg";

document.getElementById("carbonTravel").textContent =
    values[5].toFixed(2) + " kg";


/* Destroy old chart */

if (carbonBreakdownChart) {
    carbonBreakdownChart.destroy();
}


/* Create chart */

carbonBreakdownChart = new Chart(
    canvas,
    {
        type: "doughnut",

        data: {

            labels: [
                "Transportation",
                "Electricity",
                "Food",
                "Shopping",
                "Home Energy",
                "Travel"
            ],

            datasets: [
                {
                    data: values,

                    borderWidth: 2
                }
            ]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            cutout: "55%",

            plugins: {

                legend: {
                    position: "bottom"
                }
            }
        }
    }
);

}

/* =========================================================
CATEGORY PROGRESS
========================================================= */

function updateCategoryProgress(
transport,
electricity,
water,
waste
) {

setProgress(
    "progressTransport",
    "progressTransportText",
    transport
);

setProgress(
    "progressElectricity",
    "progressElectricityText",
    electricity
);

setProgress(
    "progressWater",
    "progressWaterText",
    water
);

setProgress(
    "progressWaste",
    "progressWasteText",
    waste
);

}

function setProgress(
barId,
textId,
score
) {

const bar =
    document.getElementById(barId);

const text =
    document.getElementById(textId);

if (!bar || !text) return;


let value =
    Number(score) || 0;


value =
    Math.max(
        0,
        Math.min(25, value)
    );


text.textContent =
    Math.round(value) + " / 25";


bar.style.width =
    ((value / 25) * 100) + "%";

}

/* =========================================================
WEEKLY PROGRESS
========================================================= */

function updateWeeklyProgress(score) {

// If score is not passed, get the last saved Eco Score
if (score === undefined || score === null || score === "") {
    try {
        const savedResult = localStorage.getItem("ecotrack_last_result");

        if (savedResult) {
            const result = JSON.parse(savedResult);

            if (result && result.score !== undefined) {
                score = result.score;
            }
        }
    } catch (error) {
        console.warn("Could not load saved Eco Score:", error);
    }
}

// Convert score safely
const numericScore = Number(score);

if (!Number.isFinite(numericScore)) {
    console.warn("Invalid Eco Score:", score);
    return;
}

let history = [];

try {
    history = JSON.parse(
        localStorage.getItem("ecotrack_weekly_progress") || "[]"
    );

    if (!Array.isArray(history)) {
        history = [];
    }
} catch (error) {
    console.warn("Weekly progress data error:", error);
    history = [];
}

// Today
const today = new Date();

const dateLabel = today.toISOString().split("T")[0];

// If today's score already exists, update it
const todayIndex = history.findIndex(
    item => item.date === dateLabel
);

if (todayIndex !== -1) {

    history[todayIndex].score = Math.round(numericScore);

} else {

    history.push({
        date: dateLabel,
        score: Math.round(numericScore)
    });

}

// Keep only latest 7 records
history = history.slice(-7);

// Save weekly progress
localStorage.setItem(
    "ecotrack_weekly_progress",
    JSON.stringify(history)
);

// Update chart
renderWeeklyProgress(history);

}
/* =========================================================
WEEKLY CHART
========================================================= */

function renderWeeklyProgress(history) {

const canvas = document.getElementById("weeklyProgressChart");

if (!canvas) {
    console.warn("weeklyProgressChart canvas not found");
    return;
}

/* Make sure history is valid */
if (!Array.isArray(history)) {
    history = [];
}

/* Destroy previous chart */
if (weeklyProgressChart) {
    weeklyProgressChart.destroy();
    weeklyProgressChart = null;
}

/*
   Create 7-day display.
   If there is no data yet, chart will still be visible.
*/

const last7Days = [];

for (let i = 6; i >= 0; i--) {

    const date = new Date();

    date.setDate(date.getDate() - i);

    last7Days.push(date);
}

const labels = last7Days.map(date => {

    return date.toLocaleDateString("en-US", {
        weekday: "short"
    });

});


const scores = last7Days.map(date => {

    const dateKey = date.toISOString().split("T")[0];

    const matchingEntries = history.filter(item => {

        if (!item || !item.date) {
            return false;
        }

        const itemDate =
            new Date(item.date)
                .toISOString()
                .split("T")[0];

        return itemDate === dateKey;
    });

    if (matchingEntries.length === 0) {
        return 0;
    }

    const latest =
        matchingEntries[matchingEntries.length - 1];

    return Math.max(
        0,
        Math.min(100, Number(latest.score) || 0)
    );
});


/* Calculate average */
const realScores = history
    .map(item => Number(item.score))
    .filter(score => Number.isFinite(score));

let average = 0;

if (realScores.length > 0) {

    average = Math.round(
        realScores.reduce(
            (sum, value) => sum + value,
            0
        ) / realScores.length
    );
}


/* Update average number */

const averageElement =
    document.getElementById("weeklyAverageScore");

if (averageElement) {
    averageElement.textContent = average;
}


/* Create chart */

weeklyProgressChart = new Chart(
    canvas,
    {
        type: "line",

        data: {
            labels: labels,

            datasets: [
                {
                    label: "Eco Score",

                    data: scores,

                    borderWidth: 3,

                    tension: 0.35,

                    fill: false,

                    pointRadius: 5,

                    pointHoverRadius: 7
                }
            ]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            scales: {

                y: {
                    min: 0,
                    max: 100,

                    ticks: {
                        stepSize: 20
                    },

                    title: {
                        display: true,
                        text: "Eco Score"
                    }
                },

                x: {
                    title: {
                        display: true,
                        text: "Day"
                    }
                }
            },

            plugins: {

                legend: {
                    display: true
                },

                tooltip: {
                    enabled: true
                }
            }
        }
    }
);
/* Progress message */

const message =
    document.getElementById("weeklyProgressMessage");

if (message && realScores.length > 0) {

    const first = realScores[0];
    const last = realScores[realScores.length - 1];

    if (last > first) {

        message.textContent =
            "📈 Great! Your Eco Score is improving.";

    } else if (last < first) {

        message.textContent =
            "🌱 Keep going! You can improve your Eco Score.";

    } else {

        message.textContent =
            "🌿 Your Eco Score is stable. Keep building good habits.";
    }

} else if (message) {

    message.textContent =
        "🌱 Calculate your Eco Score to start tracking your weekly progress.";
}

}

/* =========================================================
LOAD WEEKLY PROGRESS FROM FIREBASE
========================================================= */

async function loadWeeklyProgressFromServer() {

try {

    const response = await fetch("/api/eco-history", {
        method: "GET",
        credentials: "same-origin"
    });

    const data = await response.json();

    if (!data.success) {
        console.warn("Could not load Eco History:", data.message);
        renderWeeklyProgress([]);
        return;
    }

    const serverHistory = Array.isArray(data.history)
        ? data.history
        : [];

    /* Convert Firebase history to chart format */

    const history = serverHistory
        .filter(item =>
            item &&
            item.date &&
            item.ecoScore !== null &&
            item.ecoScore !== undefined
        )
        .map(item => ({
            date: String(item.date).split("T")[0],
            score: Number(item.ecoScore)
        }))
        .sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );

    /* Merge Firebase history with local weekly scores.
       Firebase records are loaded first; local scores fill missing dates
       and preserve a score saved moments before the server refresh. */

    let localHistory = [];

    try {
        localHistory = JSON.parse(
            localStorage.getItem("ecotrack_weekly_progress") || "[]"
        );

        if (!Array.isArray(localHistory)) {
            localHistory = [];
        }
    } catch (error) {
        localHistory = [];
    }

    const mergedByDate = new Map();

    history.forEach(item => {
        if (!item || !item.date) return;

        const date = String(item.date).split("T")[0];
        const score = Number(item.score);

        if (Number.isFinite(score)) {
            mergedByDate.set(date, { date, score });
        }
    });

    localHistory.forEach(item => {
        if (!item || !item.date) return;

        const date = String(item.date).split("T")[0];
        const score = Number(item.score);

        if (Number.isFinite(score)) {
            mergedByDate.set(date, { date, score });
        }
    });

    const latestHistory = Array.from(mergedByDate.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-7);

    /* Save merged data as local cache */

    localStorage.setItem(
        "ecotrack_weekly_progress",
        JSON.stringify(latestHistory)
    );

    /* Draw chart */

    renderWeeklyProgress(latestHistory);

    console.log(
        "Weekly Eco Score loaded from Firebase:",
        latestHistory
    );

} catch (error) {

    console.error(
        "Weekly Eco Score loading error:",
        error
    );

    /* Fallback to local cache */

    try {

        const cached =
            JSON.parse(
                localStorage.getItem(
                    "ecotrack_weekly_progress"
                ) || "[]"
            );

        renderWeeklyProgress(
            Array.isArray(cached) ? cached : []
        );

    } catch (cacheError) {

        renderWeeklyProgress([]);

    }
}

}

/* Load when page opens */

document.addEventListener(
"DOMContentLoaded",
function () {

    loadWeeklyProgressFromServer();

}

);

/* =====================================================
ECOTRACK GAMIFICATION SYSTEM
===================================================== */

const GAME_STORAGE_KEY = "ecotrack_gamification";

const challengePoints = {
car: 20,
energy: 30,
water: 25,
recycle: 35,
bestAction: 5
};

const badgeNames = [
"First Step",
"Eco Warrior",
"Green Hero",
"Planet Champion"
];

function getGameData() {

const saved =
    localStorage.getItem(GAME_STORAGE_KEY);

const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
}).format(new Date());

if (saved) {

    try {

        const data = JSON.parse(saved);

        // ==========================================
        // NEW DAY → RESET ONLY DAILY CHALLENGES
        // ==========================================

        if (data.lastChallengeDate !== today) {

            data.completedChallenges = [];

            data.lastChallengeDate = today;

            saveGameData(data);
        }

        return data;

    } catch (error) {

        console.error(
            "Could not load gamification data.",
            error
        );
    }
}

// ==========================================
// FIRST TIME GAMIFICATION DATA
// ==========================================

const newData = {
    points: 0,
    streak: 0,
    badges: [],
    completedChallenges: [],
    lastChallengeDate: today
};

saveGameData(newData);

return newData;

}



function saveGameData(data) {

localStorage.setItem(
    GAME_STORAGE_KEY,
    JSON.stringify(data)
);

}



function completeChallenge(challenge) {

const data = getGameData();


/* Already completed */

if (
    data.completedChallenges.includes(challenge)
) {

    return;

}


const points =
    challengePoints[challenge] || 0;


data.points += points;


data.completedChallenges.push(
    challenge
);


data.streak += 1;


checkBadges(data);


saveGameData(data);
// SAVE GAMIFICATION ECOPOINTS TO USER ACCOUNT

fetch("/api/add-ecopoints", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
points: points
})
})
.then(response => response.json())
.then(result => {
if (result.success) {
console.log("Gamification EcoPoints saved:", result.eco_points);
} else {
console.error("EcoPoints save failed:", result.message);
}
})
.catch(error => {
console.error("EcoPoints server error:", error);
});

updateGamification();


const button =
    document.getElementById(
        "challenge-" + challenge
    );


if (button) {

    button.textContent = "✓ Completed";

    button.classList.add("completed");

    button.disabled = true;

}


alert(
    "🎉 Challenge completed!\n\n+" +
    points +
    " EcoPoints earned!"
);

}



function getGameLevel(points) {

if (points >= 500) {

    return {
        name: "🌍 Planet Champion",
        next: 1000,
        previous: 500
    };

}


if (points >= 250) {

    return {
        name: "🌳 Green Hero",
        next: 500,
        previous: 250
    };

}


if (points >= 100) {

    return {
        name: "🌿 Eco Warrior",
        next: 250,
        previous: 100
    };

}


return {
    name: "🌱 Eco Beginner",
    next: 100,
    previous: 0
};

}



function checkBadges(data) {

if (
    data.points >= 20 &&
    !data.badges.includes("First Step")
) {

    data.badges.push("First Step");

}


if (
    data.points >= 100 &&
    !data.badges.includes("Eco Warrior")
) {

    data.badges.push("Eco Warrior");

}


if (
    data.points >= 250 &&
    !data.badges.includes("Green Hero")
) {

    data.badges.push("Green Hero");

}


if (
    data.points >= 500 &&
    !data.badges.includes("Planet Champion")
) {

    data.badges.push("Planet Champion");

}

}



function updateGamification() {

const data = getGameData();


/* LEVEL */

const level =
    getGameLevel(data.points);


const levelElement =
    document.getElementById("gameLevel");


if (levelElement) {

    levelElement.textContent =
        level.name;

}


/* POINTS */

const pointsElement =
    document.getElementById("gamePoints");


const xpElement =
    document.getElementById("gameXP");


if (pointsElement) {

    pointsElement.textContent =
        data.points;

}


if (xpElement) {

    xpElement.textContent =
        data.points;

}


/* NEXT XP */

const nextXP =
    document.getElementById("gameNextXP");


if (nextXP) {

    nextXP.textContent =
        level.next;

}


/* XP BAR */

const xpBar =
    document.getElementById("gameXPBar");


if (xpBar) {

    const progress =
        level.next === level.previous
            ? 100
            : (
                (data.points - level.previous) /
                (level.next - level.previous)
            ) * 100;


    xpBar.style.width =
        Math.max(
            0,
            Math.min(100, progress)
        ) + "%";

}


/* STREAK */

const streakElement =
    document.getElementById("gameStreak");


if (streakElement) {

    streakElement.textContent =
        data.streak;

}


/* BADGES */

const badgeElement =
    document.getElementById("gameBadges");


if (badgeElement) {

    badgeElement.textContent =
        data.badges.length;

}


updateBadges(data);

restoreChallenges(data);

}



function updateBadges(data) {

const container =
    document.getElementById(
        "badgeContainer"
    );


if (!container) {
    return;
}


container.innerHTML = "";


badgeNames.forEach(function (badge) {

    const unlocked =
        data.badges.includes(badge);


    const div =
        document.createElement("div");


    div.className =
        unlocked
            ? "unlocked-badge"
            : "locked-badge";


    div.innerHTML = `

        <div style="font-size:30px;">
            ${unlocked ? "🏅" : "🔒"}
        </div>

        <span>
            ${badge}
        </span>

    `;


    container.appendChild(div);

});

}



function restoreChallenges(data) {

data.completedChallenges.forEach(
    function (challenge) {

        const button =
            document.getElementById(
                "challenge-" + challenge
            );


        if (button) {

            button.textContent =
                "✓ Completed";

            button.classList.add(
                "completed"
            );

            button.disabled = true;

        }

    }
);

}



/* LOAD GAMIFICATION */

document.addEventListener(
"DOMContentLoaded",
function () {

    updateGamification();

}

);
/* =========================================================
AI RECOMMENDATION → GAMIFICATION
========================================================= */

function scrollToGamification() {

const gamification =
    document.querySelector(
        ".gamification-section"
    );

if (!gamification) {
    return;
}


gamification.scrollIntoView({
    behavior: "smooth",
    block: "start"
});

}



function saveWeeklyScore(score) {

const numericScore = Number(score);

if (!Number.isFinite(numericScore)) {
    console.warn("Invalid weekly score:", score);
    return;
}

let history = [];

try {
    history = JSON.parse(
        localStorage.getItem("ecotrack_weekly_progress") || "[]"
    );

    if (!Array.isArray(history)) {
        history = [];
    }

} catch (error) {
    console.warn("Weekly history error:", error);
    history = [];
}


// ==============================
// TODAY
// ==============================

const today = new Date();

const todayKey =
    today.getFullYear() + "-" +
    String(today.getMonth() + 1).padStart(2, "0") + "-" +
    String(today.getDate()).padStart(2, "0");


// ==============================
// CHECK IF TODAY ALREADY EXISTS
// ==============================

const existingIndex = history.findIndex(function(item) {

    if (!item || !item.date) {
        return false;
    }

    return String(item.date).split("T")[0] === todayKey;
});


// ==============================
// UPDATE TODAY'S SCORE
// ==============================

if (existingIndex !== -1) {

    history[existingIndex] = {
        date: todayKey,
        score: Math.round(numericScore)
    };

} else {

    history.push({
        date: todayKey,
        score: Math.round(numericScore)
    });

}


// ==============================
// KEEP LAST 7 RECORDS
// ==============================

history = history.slice(-7);


// ==============================
// SAVE
// ==============================

localStorage.setItem(
    "ecotrack_weekly_progress",
    JSON.stringify(history)
);


console.log(
    "Weekly score saved:",
    numericScore,
    history
);


// ==============================
// UPDATE WEEKLY CHART IMMEDIATELY
// ==============================

renderWeeklyProgress(history);

}
/* =========================================================
WEEKLY CHART
========================================================= */

function renderWeeklyProgress(history) {

const canvas =
    document.getElementById(
        "weeklyProgressChart"
    );

if (!canvas) {
    return;
}


if (!Array.isArray(history)) {
    history = [];
}


/* =========================
   DESTROY OLD CHART
========================= */

if (weeklyProgressChart) {

    weeklyProgressChart.destroy();

    weeklyProgressChart = null;
}
function getLocalDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* =========================
   CREATE LAST 7 DAYS
========================= */

const last7Days = [];

for (let i = 6; i >= 0; i--) {

    const date = new Date();

    date.setHours(0, 0, 0, 0);

    date.setDate(
        date.getDate() - i
    );

    last7Days.push(date);
}


/* =========================
   LABELS
========================= */

const labels =
    last7Days.map(function(date) {

        return date.toLocaleDateString(
            "en-US",
            {
                weekday: "short"
            }
        );

    });


/* =========================
   SCORES
========================= */

const scores =
    last7Days.map(function(date) {
const dateKey = getLocalDateKey(date);


        const entry =
            history.find(function(item) {

                if (!item || !item.date) {
                    return false;
                }

                return String(item.date)
                    .split("T")[0] === dateKey;

            });


        if (!entry) {
            return 0;
        }


        return Math.max(
            0,
            Math.min(
                100,
                Number(entry.score) || 0
            )
        );

    });


/* =========================
   WEEKLY AVERAGE
   ONLY COUNT DAYS WITH SCORES
========================= */

const recordedScores =
    scores.filter(function(score, index) {

        return (
            score > 0 ||
            history.some(function(item) {

                if (!item || !item.date) {
                    return false;
                }

               const dateKey = getLocalDateKey(last7Days[index]);

                return String(item.date)
                    .split("T")[0] === dateKey;

            })
        );

    });


let average = 0;


if (recordedScores.length > 0) {

    const total =
        recordedScores.reduce(
            function(sum, value) {
                return sum + value;
            },
            0
        );


    average =
        Math.round(
            total / recordedScores.length
        );
}


/* =========================
   UPDATE AVERAGE
========================= */

const averageElement =
    document.getElementById(
        "weeklyAverageScore"
    );


if (averageElement) {

    averageElement.textContent =
        average;
}


/* =========================
   CREATE CHART
========================= */

weeklyProgressChart =
    new Chart(
        canvas,
        {

            type: "line",

            data: {

                labels: labels,

                datasets: [

                    {

                        label: "Eco Score",

                        data: scores,

                        borderWidth: 3,

                        tension: 0.35,

                        fill: false,

                        pointRadius: 5,

                        pointHoverRadius: 7

                    }

                ]

            },


            options: {

                responsive: true,

                maintainAspectRatio: false,


                scales: {

                    y: {

                        min: 0,

                        max: 100,

                        ticks: {

                            stepSize: 20

                        },

                        title: {

                            display: true,

                            text: "Eco Score"

                        }

                    },


                    x: {

                        title: {

                            display: true,

                            text: "Day"

                        }

                    }

                },


                plugins: {

                    legend: {

                        display: true

                    },

                    tooltip: {

                        enabled: true

                    }

                }

            }

        }
    );


/* =========================
   PROGRESS MESSAGE
========================= */

const message =
    document.getElementById(
        "weeklyProgressMessage"
    );


if (message) {

    if (recordedScores.length === 0) {

        message.textContent =
            "🌱 Calculate your Eco Score to start tracking your weekly progress.";

    }

    else if (recordedScores.length === 1) {

        message.textContent =
            "🌱 Your first Eco Score this week is recorded! Keep going.";

    }

    else {

        const first =
            recordedScores[0];

        const last =
            recordedScores[
                recordedScores.length - 1
            ];


        if (last > first) {

            message.textContent =
                "📈 Great! Your Eco Score is improving.";

        }

        else if (last < first) {

            message.textContent =
                "🌱 Keep going! You can improve your Eco Score.";

        }

        else {

            message.textContent =
                "🌿 Your Eco Score is stable. Keep building good habits.";

        }

    }

}

}

/* =========================================================
LOAD WEEKLY PROGRESS WHEN PAGE OPENS
========================================================= */

document.addEventListener(
"DOMContentLoaded",
function() {

    let history = [];

    try {

        history =
            JSON.parse(
                localStorage.getItem(
                    "ecotrack_weekly_progress"
                ) || "[]"
            );

        if (!Array.isArray(history)) {
            history = [];
        }

    } catch (error) {

        console.warn(
            "Could not load weekly progress:",
            error
        );

        history = [];
    }


    renderWeeklyProgress(history);

}

);
/* =========================================================
LOAD SAVED ECO SCORE ON DASHBOARD
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

const savedResult = localStorage.getItem(
    "ecotrack_last_result"
);

if (!savedResult) {
    return;
}

try {

    const result = JSON.parse(savedResult);

    const savedScore = Number(
        result.ecoScore
    ) || 0;
/* ==============================
LOAD AI RECOMMENDATIONS
============================== */

showRecommendations({

ecoScore: savedScore,

electricity: result.electricity,
water: result.water,
transport: result.transport,
waste: result.waste,

energyScore: result.energyScore,
waterScore: result.waterScore,
transportScore: result.transportScore,
wasteScore: result.wasteScore

});

    /* UPDATE DASHBOARD ECO SCORE */

    const dashboardScore = document.getElementById(
        "dashboardScore"
    );

    if (dashboardScore && dashboardScore.textContent === "0") {
    dashboardScore.textContent = savedScore;
}

    /* UPDATE ECOPOINTS */

   const dashboardPoints = document.getElementById(
    "dashboardPoints"
);

if (dashboardPoints) {
    dashboardPoints.textContent = savedScore * 10;
}


/* UPDATE IMPACTS */

updateDashboardImpact(
    "dashboardTransport",
    "transportImpactBar",
    Number(result.transportScore) || 0
);

updateDashboardImpact(
    "dashboardElectricity",
    "electricityImpactBar",
    Number(result.energyScore) || 0
);

updateDashboardImpact(
    "dashboardWater",
    "waterImpactBar",
    Number(result.waterScore) || 0
);

updateDashboardImpact(
    "dashboardWaste",
    "wasteImpactBar",
    Number(result.wasteScore) || 0
);


    /* UPDATE LEVEL */

    const dashboardLevel = document.getElementById(
        "dashboardLevel"
    );

    if (dashboardLevel) {

        if (savedScore >= 90) {
            dashboardLevel.textContent =
                "🌍 Excellent Eco Warrior";
        }

        else if (savedScore >= 75) {
            dashboardLevel.textContent =
                "🌿 Great Eco Citizen";
        }

        else if (savedScore >= 50) {
            dashboardLevel.textContent =
                "🌱 Good Eco Citizen";
        }

        else if (savedScore >= 25) {
            dashboardLevel.textContent =
                "🌤️ Getting Greener";
        }

        else {
            dashboardLevel.textContent =
                "⚠️ Needs Improvement";
        }

    }


    console.log(
        "Dashboard loaded saved Eco Score:",
        savedScore
    );

}

catch (error) {

    console.error(
        "Could not load saved Eco Score:",
        error
    );

}
});
/* =========================================================
ECOWEATHER - WEATHER + ECO IMPACT SYSTEM
========================================================= */

async function loadEcoWeather() {

const locationElement = document.getElementById("weatherLocation");

try {

    // Get user's approximate location
    const position = await new Promise((resolve, reject) => {

        if (!navigator.geolocation) {
            reject(new Error("Geolocation not supported"));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 600000
            }
        );

    });

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    /*
     * Open-Meteo is used for weather data.
     * No API key is required.
     */

    const weatherURL =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${latitude}` +
        `&longitude=${longitude}` +
        `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m` +
        `&hourly=precipitation_probability` +
        `&forecast_days=1` +
        `&timezone=auto`;

    const response = await fetch(weatherURL);

    if (!response.ok) {
        throw new Error("Weather data unavailable");
    }

    const data = await response.json();

    const current = data.current;

    const temperature = Number(current.temperature_2m);
    const humidity = Number(current.relative_humidity_2m);
    const precipitation = Number(current.precipitation);
    const windSpeed = Number(current.wind_speed_10m);

    const currentHour = new Date(current.time).getHours();

    let rainProbability = 0;

    if (
        data.hourly &&
        Array.isArray(data.hourly.precipitation_probability)
    ) {

        rainProbability =
            Number(
                data.hourly.precipitation_probability[currentHour]
            ) || 0;

    }


    /* -------------------------------------------------
       WEATHER CONDITION
    ------------------------------------------------- */

    const weatherInfo = getWeatherInfo(current.weather_code);


    /* -------------------------------------------------
       UPDATE NORMAL WEATHER INFORMATION
    ------------------------------------------------- */

    document.getElementById("weatherIcon").textContent =
        weatherInfo.icon;

    document.getElementById("weatherTemp").textContent =
        `${Math.round(temperature)}°C`;

    document.getElementById("weatherCondition").textContent =
        weatherInfo.text;

    document.getElementById("weatherHumidity").textContent =
        `${humidity}%`;

    document.getElementById("weatherRain").textContent =
        `${rainProbability}%`;

    document.getElementById("weatherWind").textContent =
        `${Math.round(windSpeed)} km/h`;


    /* -------------------------------------------------
       ECO INSIGHTS
    ------------------------------------------------- */

    updateWeatherEcoInsights(
        temperature,
        rainProbability,
        windSpeed
    );


    /* -------------------------------------------------
       LOCATION NAME
    ------------------------------------------------- */

    await getWeatherLocation(
        latitude,
        longitude
    );

} catch (error) {

    console.warn("EcoWeather:", error);

    if (locationElement) {
        locationElement.textContent =
            "📍 Location unavailable";
    }

    document.getElementById("weatherCondition").textContent =
        "Weather unavailable";

    document.getElementById("greenTravelTip").textContent =
        "Allow location access to get eco travel suggestions.";

    document.getElementById("waterSavingTip").textContent =
        "Weather data is required for water-saving suggestions.";

    document.getElementById("energySavingTip").textContent =
        "Weather data is required for energy-saving suggestions.";

    document.getElementById("ecoOpportunityScore").textContent =
        "--";

    document.getElementById("ecoOpportunityText").textContent =
        "Enable location access to calculate your Eco Opportunity.";

    document.getElementById("bestEcoAction").textContent =
        "Allow location access to receive today's eco action.";

}
}

/* =========================================================
WEATHER CODE → ICON + TEXT
========================================================= */

function getWeatherInfo(code) {

const weather = {
    0: {
        icon: "☀️",
        text: "Clear sky"
    },

    1: {
        icon: "🌤️",
        text: "Mainly clear"
    },

    2: {
        icon: "⛅",
        text: "Partly cloudy"
    },

    3: {
        icon: "☁️",
        text: "Cloudy"
    },

    45: {
        icon: "🌫️",
        text: "Foggy"
    },

    48: {
        icon: "🌫️",
        text: "Foggy"
    },

    51: {
        icon: "🌦️",
        text: "Light drizzle"
    },

    53: {
        icon: "🌦️",
        text: "Drizzle"
    },

    55: {
        icon: "🌧️",
        text: "Heavy drizzle"
    },

    61: {
        icon: "🌦️",
        text: "Light rain"
    },

    63: {
        icon: "🌧️",
        text: "Rain"
    },

    65: {
        icon: "🌧️",
        text: "Heavy rain"
    },

    71: {
        icon: "🌨️",
        text: "Light snow"
    },

    73: {
        icon: "🌨️",
        text: "Snow"
    },

    75: {
        icon: "❄️",
        text: "Heavy snow"
    },

    80: {
        icon: "🌦️",
        text: "Rain showers"
    },

    81: {
        icon: "🌧️",
        text: "Rain showers"
    },

    82: {
        icon: "⛈️",
        text: "Heavy rain showers"
    },

    95: {
        icon: "⛈️",
        text: "Thunderstorm"
    },

    96: {
        icon: "⛈️",
        text: "Thunderstorm with hail"
    },

    99: {
        icon: "⛈️",
        text: "Heavy thunderstorm"
    }
};

return weather[code] || {
    icon: "🌤️",
    text: "Weather information"
};

}

/* =========================================================
WEATHER → ECO INSIGHTS
========================================================= */

function updateWeatherEcoInsights(
temperature,
rainProbability,
windSpeed
) {

const greenTravelTip =
    document.getElementById("greenTravelTip");

const waterSavingTip =
    document.getElementById("waterSavingTip");

const energySavingTip =
    document.getElementById("energySavingTip");


/* -------------------------------------------------
   GREEN TRAVEL
------------------------------------------------- */

let travelTip = "";

if (
    temperature >= 18 &&
    temperature <= 30 &&
    rainProbability < 40
) {

    travelTip =
        "Great weather! Walk or cycle for short trips to reduce transport emissions.";

} else if (rainProbability >= 60) {

    travelTip =
        "Rain is likely. Consider public transport instead of a private vehicle.";

} else if (temperature > 35) {

    travelTip =
        "It's very hot. Prefer public transport or shared travel and avoid unnecessary trips.";

} else {

    travelTip =
        "Choose walking, cycling or public transport whenever practical.";

}


/* -------------------------------------------------
   WATER SAVING
------------------------------------------------- */

let waterTip = "";

if (rainProbability >= 60) {

    waterTip =
        "Rain is likely. Skip unnecessary garden watering and let nature provide the water.";

} else if (rainProbability >= 30) {

    waterTip =
        "Rain is possible. Delay garden watering if the soil is already moist.";

} else {

    waterTip =
        "No significant rain expected. Water plants efficiently and avoid overwatering.";

}


/* -------------------------------------------------
   ENERGY SAVING
------------------------------------------------- */

let energyTip = "";

if (temperature >= 35) {

    energyTip =
        "High heat detected. Reduce unnecessary cooling and keep AC temperature around 24–26°C.";

} else if (temperature <= 18) {

    energyTip =
        "Cool weather today. Use natural ventilation instead of unnecessary heating where possible.";

} else {

    energyTip =
        "Comfortable temperature. Use natural ventilation and reduce unnecessary appliance use.";

}


greenTravelTip.textContent = travelTip;
waterSavingTip.textContent = waterTip;
energySavingTip.textContent = energyTip;


/* -------------------------------------------------
   ECO OPPORTUNITY SCORE
------------------------------------------------- */

let ecoOpportunity = 50;


// Pleasant weather = more opportunity for green travel
if (
    temperature >= 18 &&
    temperature <= 30 &&
    rainProbability < 40
) {
    ecoOpportunity += 20;
}


// Rain gives water-saving opportunity
if (rainProbability >= 60) {
    ecoOpportunity += 15;
}


// Moderate wind can support natural ventilation
if (
    windSpeed >= 8 &&
    temperature >= 20 &&
    temperature <= 32
) {
    ecoOpportunity += 10;
}


// Very hot weather reduces outdoor opportunities
if (temperature >= 35) {
    ecoOpportunity -= 10;
}


ecoOpportunity =
    Math.max(
        0,
        Math.min(100, ecoOpportunity)
    );


document.getElementById(
    "ecoOpportunityScore"
).textContent = ecoOpportunity;


/* -------------------------------------------------
   ECO OPPORTUNITY MESSAGE
------------------------------------------------- */

let opportunityText = "";

if (ecoOpportunity >= 80) {

    opportunityText =
        "Excellent conditions for sustainable choices today!";

} else if (ecoOpportunity >= 65) {

    opportunityText =
        "Good opportunity to make a few climate-friendly choices today.";

} else if (ecoOpportunity >= 50) {

    opportunityText =
        "There are still simple ways to reduce your environmental impact today.";

} else {

    opportunityText =
        "Weather conditions are challenging, but small indoor eco-actions can still help.";

}


document.getElementById(
    "ecoOpportunityText"
).textContent = opportunityText;


/* -------------------------------------------------
   BEST ECO ACTION
------------------------------------------------- */

let bestAction = "";

if (
    temperature >= 18 &&
    temperature <= 30 &&
    rainProbability < 40
) {

    bestAction =
        "🚲 Walk or cycle for a short-distance trip instead of using a car.";

} else if (rainProbability >= 60) {

    bestAction =
        "💧 Skip unnecessary outdoor watering and conserve rainwater where possible.";

} else if (temperature >= 35) {

    bestAction =
        "⚡ Reduce cooling energy by keeping AC around 24–26°C and avoiding unnecessary appliances.";

} else {

    bestAction =
        "🌱 Choose one low-carbon action today — walk, save energy or reduce water waste.";

}


document.getElementById(
    "bestEcoAction"
).textContent = bestAction;
const challengeAction =
document.getElementById("bestEcoActionChallenge");
if (challengeAction) {
challengeAction.textContent = bestAction;
}

}

/* =========================================================
LOCATION NAME
========================================================= */

async function getWeatherLocation(
latitude,
longitude
) {

const locationElement =
    document.getElementById("weatherLocation");

try {

    const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&count=1&language=en&format=json`
    );

    if (!response.ok) {
        throw new Error("Location unavailable");
    }

    const data = await response.json();

    if (
        data.results &&
        data.results.length > 0
    ) {

        const location =
            data.results[0];

        const name =
            location.name || "Your Location";

        locationElement.textContent =
            `📍 ${name}`;

    } else {

        locationElement.textContent =
            "📍 Your Location";

    }

} catch (error) {

    locationElement.textContent =
        "📍 Your Location";

}
}

/* =========================================================
START ECOWEATHER
========================================================= */

document.addEventListener(
"DOMContentLoaded",
function () {

    loadEcoWeather();

}

);
/* =========================================================
7-DAY ECO FORECAST
========================================================= */

async function loadEcoForecast() {

const forecastGrid = document.getElementById("ecoForecastGrid");
const forecastLocation = document.getElementById("forecastLocation");

if (!forecastGrid) return;

try {

    // Get user's location
    const position = await new Promise((resolve, reject) => {

        if (!navigator.geolocation) {
            reject(new Error("Geolocation not supported"));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 600000
            }
        );

    });

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;


    // 7-day weather forecast
    const weatherURL =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${latitude}` +
        `&longitude=${longitude}` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max` +
        `&forecast_days=7` +
        `&timezone=auto`;


    const response = await fetch(weatherURL);

    if (!response.ok) {
        throw new Error("7-day weather data unavailable");
    }

    const data = await response.json();

    if (!data.daily || !data.daily.time) {
        throw new Error("Forecast data missing");
    }


    // Location name
    await getForecastLocation(latitude, longitude);


    // Clear loading message
    forecastGrid.innerHTML = "";


    // Create 7 forecast cards
    for (let i = 0; i < data.daily.time.length; i++) {

        const date = data.daily.time[i];

        const maxTemp =
            Number(data.daily.temperature_2m_max[i]);

        const minTemp =
            Number(data.daily.temperature_2m_min[i]);

        const rainChance =
            Number(data.daily.precipitation_probability_max[i] || 0);

        const windSpeed =
            Number(data.daily.wind_speed_10m_max[i] || 0);

        const weatherCode =
            Number(data.daily.weather_code[i]);


        const weatherInfo =
            getForecastWeatherInfo(weatherCode);


        const ecoData =
            calculateDailyEcoOpportunity(
                maxTemp,
                rainChance,
                windSpeed
            );


        const dayName =
            getForecastDayName(date, i);


        const formattedDate =
            formatForecastDate(date);


        const card =
            document.createElement("div");

        card.className =
            "eco-forecast-card";


        card.innerHTML = `

            <div class="forecast-day">
                <strong>${dayName}</strong>
                <span>${formattedDate}</span>
            </div>


            <div class="forecast-weather">

                <div class="forecast-icon">
                    ${weatherInfo.icon}
                </div>

                <div class="forecast-temp">

                    <strong>
                        ${Math.round(maxTemp)}°C
                    </strong>

                    <span>
                        ${Math.round(minTemp)}°C
                    </span>

                </div>

            </div>


            <div class="forecast-condition">
                ${weatherInfo.text}
            </div>


            <div class="forecast-details">

                <div>
                    🌧️
                    <span>
                        Rain
                        <strong>${rainChance}%</strong>
                    </span>
                </div>

                <div>
                    💨
                    <span>
                        Wind
                        <strong>${Math.round(windSpeed)} km/h</strong>
                    </span>
                </div>

            </div>


            <div class="forecast-eco-score">

                <span>⭐ Eco Opportunity</span>

                <strong>
                    ${ecoData.score}/100
                </strong>

            </div>


            <div class="forecast-action">

                <small>
                    Best Eco Action
                </small>

                <p>
                    ${ecoData.action}
                </p>

            </div>


            <div class="forecast-tip">

                ${ecoData.tip}

            </div>

        `;


        forecastGrid.appendChild(card);

    }


} catch (error) {

    console.warn("Eco Forecast:", error);

    forecastGrid.innerHTML = `

        <div class="forecast-error">

            🌱

            <strong>
                7-day Eco Forecast unavailable
            </strong>

            <p>
                Allow location access to receive
                weather-based eco recommendations.
            </p>

        </div>

    `;

    if (forecastLocation) {
        forecastLocation.textContent =
            "📍 Location unavailable";
    }

}
}

/* =========================================================
FORECAST WEATHER ICONS
========================================================= */

function getForecastWeatherInfo(code) {

const weatherMap = {

    0: {
        icon: "☀️",
        text: "Clear sky"
    },

    1: {
        icon: "🌤️",
        text: "Mainly clear"
    },

    2: {
        icon: "⛅",
        text: "Partly cloudy"
    },

    3: {
        icon: "☁️",
        text: "Cloudy"
    },

    45: {
        icon: "🌫️",
        text: "Foggy"
    },

    48: {
        icon: "🌫️",
        text: "Foggy"
    },

    51: {
        icon: "🌦️",
        text: "Light drizzle"
    },

    53: {
        icon: "🌦️",
        text: "Drizzle"
    },

    55: {
        icon: "🌧️",
        text: "Heavy drizzle"
    },

    61: {
        icon: "🌦️",
        text: "Light rain"
    },

    63: {
        icon: "🌧️",
        text: "Rain"
    },

    65: {
        icon: "🌧️",
        text: "Heavy rain"
    },

    71: {
        icon: "🌨️",
        text: "Light snow"
    },

    73: {
        icon: "🌨️",
        text: "Snow"
    },

    75: {
        icon: "❄️",
        text: "Heavy snow"
    },

    80: {
        icon: "🌦️",
        text: "Rain showers"
    },

    81: {
        icon: "🌧️",
        text: "Rain showers"
    },

    82: {
        icon: "⛈️",
        text: "Heavy rain showers"
    },

    95: {
        icon: "⛈️",
        text: "Thunderstorm"
    },

    96: {
        icon: "⛈️",
        text: "Thunderstorm with hail"
    },

    99: {
        icon: "⛈️",
        text: "Heavy thunderstorm"
    }

};


return weatherMap[code] || {
    icon: "🌤️",
    text: "Weather information"
};

}

/* =========================================================
DAILY ECO OPPORTUNITY
========================================================= */

function calculateDailyEcoOpportunity(
temperature,
rainChance,
windSpeed
) {

let score = 50;

let action = "";
let tip = "";


/* GOOD WEATHER */

if (
    temperature >= 18 &&
    temperature <= 30 &&
    rainChance < 40
) {

    score += 20;

    action =
        "🚲 Walk or cycle for short trips.";

    tip =
        "Great conditions for low-carbon transportation.";

}


/* RAIN */

else if (rainChance >= 60) {

    score += 15;

    action =
        "💧 Skip unnecessary outdoor watering.";

    tip =
        "Use the rainy conditions to reduce garden water use.";

}


/* HOT WEATHER */

else if (temperature >= 35) {

    score -= 10;

    action =
        "⚡ Reduce cooling energy use.";

    tip =
        "Keep AC around 24–26°C and avoid unnecessary appliances.";

}


/* COLD WEATHER */

else if (temperature <= 18) {

    score += 5;

    action =
        "🏠 Use natural daylight and avoid unnecessary heating.";

    tip =
        "Reduce heating demand where comfortable.";

}


/* MODERATE WEATHER */

else {

    score += 5;

    action =
        "🌱 Choose one low-carbon action today.";

    tip =
        "Save energy, water or choose greener transportation.";

}


/* WIND */

if (
    windSpeed >= 8 &&
    temperature >= 20 &&
    temperature <= 32
) {

    score += 10;

}


score =
    Math.max(
        0,
        Math.min(100, score)
    );


return {
    score: score,
    action: action,
    tip: tip
};

}

/* =========================================================
FORECAST DATE
========================================================= */

function getForecastDayName(dateString, index) {

if (index === 0) {
    return "Today";
}

if (index === 1) {
    return "Tomorrow";
}

const date =
    new Date(dateString + "T12:00:00");

return date.toLocaleDateString(
    "en-US",
    {
        weekday: "short"
    }
);

}

function formatForecastDate(dateString) {

const date =
    new Date(dateString + "T12:00:00");

return date.toLocaleDateString(
    "en-US",
    {
        day: "numeric",
        month: "short"
    }
);

}

/* =========================================================
FORECAST LOCATION
========================================================= */

async function getForecastLocation(
latitude,
longitude
) {

const locationElement =
    document.getElementById("forecastLocation");

if (!locationElement) return;


try {

    const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&count=1&language=en&format=json`
    );


    if (!response.ok) {
        throw new Error("Location unavailable");
    }


    const data =
        await response.json();


    if (
        data.results &&
        data.results.length > 0
    ) {

        const location =
            data.results[0];

        const name =
            location.name || "Your Location";


        locationElement.textContent =
            `📍 ${name}`;

    } else {

        locationElement.textContent =
            "📍 Your Location";

    }


} catch (error) {

    locationElement.textContent =
        "📍 Your Location";

}

}

/* =========================================================
START 7-DAY FORECAST
========================================================= */

document.addEventListener(
"DOMContentLoaded",
function () {

    loadEcoForecast();

}

);