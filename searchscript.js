function detectPatterns() {
    detectMWFormations();
    detectHeadShoulders();
    detectDoubleBottom();
    detectDoubleTop();
    detectAscendingTriangle();
    detectFallingWedge();
    detectRoundedTop();
    detectRoundedBottom();
    detectRisingWedge();
    detectFallingPennant();
}

function detectDoubleTop() {
    drawText('Double Top', 200, 150, 'orange');
    drawLine(190, 150, 210, 100, 'orange', 2);
    drawLine(210, 100, 230, 150, 'orange', 2);
    drawLine(230, 150, 250, 100, 'orange', 2);
    drawLine(250, 100, 270, 150, 'orange', 2);
    addTrendArrow(250, 150, 'down', 'orange');
}

function detectDoubleBottom() {
    drawText('Double Bottom', 300, 400, 'purple');
    drawLine(280, 400, 300, 450, 'purple', 2);
    drawLine(300, 450, 320, 400, 'purple', 2);
    drawLine(320, 400, 340, 450, 'purple', 2);
    drawLine(340, 450, 360, 400, 'purple', 2);
    addTrendArrow(320, 400, 'up', 'purple');
}

function detectAscendingTriangle() {
    drawText('Ascending Triangle', 400, 350, 'green');
    drawLine(380, 350, 420, 300, 'green', 2);
    drawLine(420, 300, 440, 300, 'green', 2);
    drawLine(440, 300, 460, 350, 'green', 2);
    addTrendArrow(440, 300, 'up', 'green');
}

function detectFallingWedge() {
    drawText('Falling Wedge', 300, 450, 'blue');
    drawLine(280, 450, 320, 400, 'blue', 2);
    drawLine(320, 400, 360, 420, 'blue', 2);
    drawLine(280, 450, 360, 420, 'blue', 2); // Connects the top
    addTrendArrow(320, 400, 'up', 'blue');
}

function detectRoundedTop() {
    drawText('Rounded Top', 500, 200, 'red');
    drawLine(480, 200, 490, 190, 'red', 2);
    drawLine(490, 190, 500, 180, 'red', 2);
    drawLine(500, 180, 510, 190, 'red', 2);
    drawLine(510, 190, 520, 200, 'red', 2);
    addTrendArrow(500, 200, 'down', 'red');
}

function detectRoundedBottom() {
    drawText('Rounded Bottom', 600, 400, 'green');
    drawLine(580, 400, 590, 410, 'green', 2);
    drawLine(590, 410, 600, 420, 'green', 2);
    drawLine(600, 420, 610, 410, 'green', 2);
    drawLine(610, 410, 620, 400, 'green', 2);
    addTrendArrow(600, 420, 'up', 'green');
}

function detectRisingWedge() {
    drawText('Rising Wedge', 400, 250, 'orange');
    drawLine(380, 250, 420, 300, 'orange', 2);
    drawLine(420, 300, 460, 270, 'orange', 2);
    drawLine(380, 250, 460, 270, 'orange', 2); // Connects the bottom
    addTrendArrow(420, 270, 'down', 'orange');
}

function detectFallingPennant() {
    drawText('Falling Pennant', 250, 500, 'purple');
    drawLine(230, 500, 260, 450, 'purple', 2);
    drawLine(260, 450, 290, 470, 'purple', 2);
    drawLine(230, 500, 290, 470, 'purple', 2); // Connects the pennant
    addTrendArrow(260, 450, 'down', 'purple');
}

// Reusable Functions
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