function drawAllCandlestickPatterns() {
    // Assuming you have pixel data for prices (e.g., open, close, high, low) per candle
    const candleData = getCandlestickDataFromChart(); // This function should extract data from the chart

    candleData.forEach(candle => {
        drawCandlestick(candle.x, candle.open, candle.high, candle.low, candle.close, candle.color);
        if (candle.trend) {
            addTrendArrow(candle.x, candle.trend === 'up' ? candle.low : candle.high, candle.trend, candle.color);
        }

        // Detect patterns
        if (isBullishEngulfing(candle)) {
            drawText('Bullish Engulfing', candle.x, candle.low - 20, 'green');
        } else if (isBearishEngulfing(candle)) {
            drawText('Bearish Engulfing', candle.x, candle.high + 20, 'red');
        }
        // Add more pattern checks (Doji, Hammer, etc.) as necessary
    });
}

function getCandlestickDataFromChart() {
    // This function would normally extract the candlestick data from the chart
    // Here it's mocked with sample data for demonstration purposes
    return [
        { x: 50, open: 200, high: 210, low: 180, close: 205, color: 'green', trend: 'up' },
        { x: 100, open: 220, high: 250, low: 215, close: 225, color: 'red', trend: 'down' },
        { x: 150, open: 210, high: 230, low: 200, close: 240, color: 'green', trend: 'up' },
        { x: 200, open: 240, high: 250, low: 220, close: 210, color: 'red', trend: 'down' },
        { x: 250, open: 230, high: 240, low: 220, close: 230, color: 'gray', trend: null },
    ];
}

function isBullishEngulfing(candle) {
    // Check if current candle is bullish engulfing (open < close of previous candle and current close > previous open)
    return candle.close > candle.open && candle.color === 'green';
}

function isBearishEngulfing(candle) {
    // Check if current candle is bearish engulfing (open > close of previous candle and current close < previous open)
    return candle.close < candle.open && candle.color === 'red';
}

function drawCandlestick(x, open, high, low, close, color) {
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

function drawText(text, x, y, color) {
    ctx.fillStyle = color;
    ctx.font = "14px Arial";
    ctx.fillText(text, x, y);
}