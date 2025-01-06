function detectSupportResistance() {
    // Fetch pixel data from the canvas (chart image)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const priceData = extractPriceLevels(imageData);

    // Dynamically calculate support and resistance levels
    const levels = calculateSupportResistance(priceData);

    // Draw calculated support and resistance
    drawSupportResistance(levels.support, 'green', 'Support');
    drawSupportResistance(levels.resistance, 'red', 'Resistance');

    // Detect and draw trendlines dynamically
    const trendlines = calculateTrendlines(priceData);
    drawTrendlines(trendlines);
}

function extractPriceLevels(imageData) {
    // Mock: Replace this with actual pixel analysis or data parsing
    // Returns an array of simulated price levels
    return [150, 180, 200, 300, 320, 450, 500];
}

function calculateSupportResistance(data) {
    // Analyze data to find clusters of levels (simulate grouping close price levels)
    const support = [];
    const resistance = [];
    const tolerance = 10; // Group close prices together

    data.forEach((level, index) => {
        if (index % 2 === 0) {
            // Alternate as support and resistance for simplicity
            support.push(level);
        } else {
            resistance.push(level);
        }
    });

    return { support, resistance };
}

function calculateTrendlines(data) {
    // Identify key trendline points dynamically
    const trendlines = [];
    const threshold = 50; // Example threshold to identify significant moves

    for (let i = 1; i < data.length; i++) {
        const startX = (i - 1) * 100;
        const endX = i * 100;
        const startY = canvas.height - data[i - 1];
        const endY = canvas.height - data[i];

        if (Math.abs(endY - startY) > threshold) {
            trendlines.push({
                startX,
                startY,
                endX,
                endY,
                color: endY < startY ? 'blue' : 'orange', // Downtrend: blue, Uptrend: orange
                direction: endY < startY ? 'down' : 'up',
            });
        }
    }

    return trendlines;
}

function drawSupportResistance(levels, color, label) {
    levels.forEach((y) => {
        drawLine(0, canvas.height - y, canvas.width, canvas.height - y, color, 2);
        drawText(`${label} Zone`, 10, canvas.height - y - 5, color);
    });
}

function drawTrendlines(trendlines) {
    trendlines.forEach((line) => {
        drawLine(line.startX, line.startY, line.endX, line.endY, line.color, 2);
        const arrowX = line.endX;
        const arrowY = line.endY;
        addTrendArrow(arrowX, arrowY, line.direction, line.color);
    });
}

function drawLine(x1, y1, x2, y2, color, width) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
}

function drawText(text, x, y, color) {
    ctx.fillStyle = color;
    ctx.font = "14px Arial";
    ctx.fillText(text, x, y);
}

function addTrendArrow(x, y, direction, color) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    if (direction === 'up') {
        ctx.lineTo(x - 5, y + 10);
        ctx.lineTo(x + 5, y + 10);
    } else if (direction === 'down') {
        ctx.lineTo(x - 5, y - 10);
        ctx.lineTo(x + 5, y - 10);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}