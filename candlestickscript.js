function drawAllCandlestickPatterns() {
    const canvas = document.getElementById('chartCanvas');
    const ctx = canvas.getContext('2d');
    const candleData = getCandlestickDataFromChart(); // Extract candlestick data

    const { scaledData, scaleFactor } = scaleDataToCanvas(candleData, canvas); // Scale data to fit the canvas

    scaledData.forEach(candle => {
        drawCandlestick(ctx, candle.x, candle.open, candle.high, candle.low, candle.close, candle.color, scaleFactor);
        if (candle.trend) {
            addTrendArrow(ctx, candle.x, candle.trend === 'up' ? candle.low : candle.high, candle.trend, candle.color, scaleFactor);
        }

        // Detect patterns and annotate
        if (isBullishEngulfing(candle)) {
            drawText(ctx, 'Bullish Engulfing', candle.x, candle.low - 20 * scaleFactor, 'green');
        } else if (isBearishEngulfing(candle)) {
            drawText(ctx, 'Bearish Engulfing', candle.x, candle.high + 20 * scaleFactor, 'red');
        } else if (isDoji(candle)) {
            drawText(ctx, 'Doji', candle.x, candle.low - 20 * scaleFactor, 'blue');
        } else if (isHammer(candle)) {
            drawText(ctx, 'Hammer', candle.x, candle.low - 20 * scaleFactor, 'purple');
        } else if (isMorningStar(candleData, candle)) {
            drawText(ctx, 'Morning Star', candle.x, candle.low - 20 * scaleFactor, 'gold');
        } else if (isStopHunt(candle)) {
            drawText(ctx, 'Stop Hunt', candle.x, candle.high + 20 * scaleFactor, 'orange');
        }
    });
}

// Example candlestick data
function getCandlestickDataFromChart() {
    return [
        { x: 0, open: 200, high: 210, low: 180, close: 205, color: 'green', trend: 'up' },
        { x: 1, open: 220, high: 250, low: 215, close: 225, color: 'red', trend: 'down' },
        { x: 2, open: 210, high: 230, low: 200, close: 240, color: 'green', trend: 'up' },
        { x: 3, open: 240, high: 250, low: 220, close: 210, color: 'red', trend: 'down' },
        { x: 4, open: 230, high: 240, low: 220, close: 230, color: 'gray', trend: null },
    ];
}

// Scale data to fit canvas
function scaleDataToCanvas(data, canvas) {
    const maxHigh = Math.max(...data.map(d => d.high));
    const minLow = Math.min(...data.map(d => d.low));
    const scaleFactor = canvas.height / (maxHigh - minLow);
    return {
        scaledData: data.map(c => ({
            ...c,
            open: (c.open - minLow) * scaleFactor,
            high: (c.high - minLow) * scaleFactor,
            low: (c.low - minLow) * scaleFactor,
            close: (c.close - minLow) * scaleFactor,
            x: c.x * (canvas.width / data.length),
        })),
        scaleFactor,
    };
}

// Pattern detection
function isBullishEngulfing(candle) {
    return candle.close > candle.open && candle.color === 'green';
}

function isBearishEngulfing(candle) {
    return candle.close < candle.open && candle.color === 'red';
}

function isDoji(candle) {
    return Math.abs(candle.open - candle.close) < 2;
}

function isHammer(candle) {
    return candle.close > candle.open && (candle.low - Math.min(candle.open, candle.close)) > 2 * Math.abs(candle.open - candle.close);
}

function isMorningStar(data, candle) {
    const index = data.indexOf(candle);
    if (index < 2) return false;
    const prev1 = data[index - 1];
    const prev2 = data[index - 2];
    return prev2.close < prev2.open && isDoji(prev1) && candle.close > candle.open;
}

function isStopHunt(candle) {
    return candle.high - candle.open > 1.5 * (candle.open - candle.low);
}

// Drawing functions
function drawCandlestick(ctx, x, open, high, low, close, color, scaleFactor) {
    const bodyTop = Math.min(open, close);
    const bodyBottom = Math.max(open, close);

    ctx.fillStyle = color;
    ctx.fillRect(x - 5, bodyTop, 10, bodyBottom - bodyTop);

    ctx.beginPath();
    ctx.moveTo(x, high);
    ctx.lineTo(x, low);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
}

function addTrendArrow(ctx, x, y, direction, color, scaleFactor) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    if (direction === 'up') {
        ctx.lineTo(x - 5, y + 10 * scaleFactor);
        ctx.lineTo(x + 5, y + 10 * scaleFactor);
    } else if (direction === 'down') {
        ctx.lineTo(x - 5, y - 10 * scaleFactor);
        ctx.lineTo(x + 5, y - 10 * scaleFactor);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

function drawText(ctx, text, x, y, color) {
    ctx.fillStyle = color;
    ctx.font = "14px Arial";
    ctx.fillText(text, x, y);
            }
