document.getElementById("detectPatterns").addEventListener("click", detectPatterns);

function detectPatterns() {
    const chartData = getChartData(); // Dynamically fetch or process chart data
    const normalizedData = normalizeData(chartData); // Normalize for consistent analysis
    const detectedPatterns = analyzeChartPatterns(normalizedData);
    renderChartWithAnnotations(chartData, detectedPatterns);
}

// 1. Get Chart Data Dynamically
function getChartData() {
    // Simulate fetching data from an API or user input
    return [1200, 1220, 1210, 1230, 1250, 1205, 1180, 1190, 1215, 1225]; // Replace with real data
}

// 2. Normalize Data
function normalizeData(data) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    return data.map((point) => (point - min) / (max - min)); // Normalize to a range of [0, 1]
}

// 3. Detect Patterns
function analyzeChartPatterns(data) {
    const patterns = [];

    // Example: Detecting "Head and Shoulders" (relative values)
    for (let i = 1; i < data.length - 2; i++) {
        if (data[i - 1] < data[i] && data[i] > data[i + 1]) {
            const leftShoulder = data[i - 1];
            const head = data[i];
            const rightShoulder = data[i + 1];

            // Check relative conditions
            if (rightShoulder < head && Math.abs(rightShoulder - leftShoulder) <= 0.1) {
                patterns.push({
                    type: "Head and Shoulders",
                    index: i,
                    direction: "down",
                });
            }
        }
    }

    return patterns;
}

// 4. Render Chart with Annotations
function renderChartWithAnnotations(data, patterns) {
    const canvas = document.getElementById("chartCanvas");
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Scale data to fit canvas
    const scaledData = data.map((point) => (point / Math.max(...data)) * height);

    // Clear previous chart
    ctx.clearRect(0, 0, width, height);

    // Draw chart line
    ctx.beginPath();
    ctx.moveTo(0, height - scaledData[0]);
    scaledData.forEach((point, i) => {
        ctx.lineTo((width / data.length) * i, height - point);
    });
    ctx.strokeStyle = "black";
    ctx.stroke();

    // Highlight patterns
    patterns.forEach((pattern) => {
        const x = (width / data.length) * pattern.index;
        const y = height - scaledData[pattern.index];
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillText(pattern.type, x + 10, y - 10);

        // Draw arrow for direction
        ctx.beginPath();
        if (pattern.direction === "down") {
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + 20);
            ctx.lineTo(x - 5, y + 15);
            ctx.moveTo(x, y + 20);
            ctx.lineTo(x + 5, y + 15);
        } else {
            ctx.moveTo(x, y);
            ctx.lineTo(x, y - 20);
            ctx.lineTo(x - 5, y - 15);
            ctx.moveTo(x, y - 20);
            ctx.lineTo(x + 5, y - 15);
        }
        ctx.strokeStyle = "blue";
        ctx.stroke();
    });
}