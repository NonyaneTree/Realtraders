const canvas = document.getElementById('chartCanvas');
const ctx = canvas.getContext('2d');
let uploadedImage = null;
let isDrawing = false;
let currentTool = null;
let startPoint = null;
let userElements = [];
let detectedElements = [];

// Tool modes
const TOOLS = {
    TRENDLINE: 'trendline',
    ZONE: 'zone',
    NONE: 'none'
};

// Initialize
document.getElementById('analyzeBtn').addEventListener('click', analyzeImage);
document.getElementById('clearBtn').addEventListener('click', clearCanvas);
document.getElementById('drawTrendlineBtn').addEventListener('click', () => currentTool = TOOLS.TRENDLINE);
document.getElementById('drawZoneBtn').addEventListener('click', () => currentTool = TOOLS.ZONE);
document.getElementById('undoBtn').addEventListener('click', undoLastAction);

// Image input event listener
document.getElementById('imageInput').addEventListener('change', function (e) {
    if (e.target.files && e.target.files[0]) {
        uploadedImage = URL.createObjectURL(e.target.files[0]);
        drawImageOnCanvas();
    }
});

// Main drawing functions
function drawImageOnCanvas() {
    if (!uploadedImage) return;

    const img = new Image();
    img.src = uploadedImage;
    img.onload = () => {
        const maxWidth = 900;
        const maxHeight = 500;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = height * ratio;
        }
        if (height > maxHeight) {
            const ratio = maxHeight / height;
            height = maxHeight;
            width = width * ratio;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        drawDetectedElements();
        userElements.forEach(element => {
            switch (element.type) {
                case 'pattern':
                    drawPattern(element);
                    break;
                case 'zone':
                    drawZone(element);
                    break;
                case 'trendline':
                    drawTrendline(element);
                    break;
            }
        });
    };
    img.onerror = () => {
        console.error("Failed to load image");
        alert("Error loading image. Please try another file.");
    };
}

async function analyzeImage() {
    if (!uploadedImage) {
        alert("Please upload an image first");
        return;
    }

    document.getElementById('detectedItems').innerHTML = "<h3>Analyzing Chart...</h3>";

    const formData = new FormData(document.getElementById('uploadForm'));

    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        detectedElements = data.patterns || [];
        displayDetectedElements();
        drawDetectedElements();
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('detectedItems').innerHTML =
            `<p class="error">Error analyzing image: ${error.message}</p>`;
    }
}

function displayDetectedElements() {
    const container = document.getElementById('detectedItems');
    container.innerHTML = "<h3>Detected Elements</h3>";

    if (detectedElements.length === 0 && userElements.length === 0) {
        container.innerHTML += "<p>No elements detected</p>";
        return;
    }

    detectedElements.forEach((element, index) => {
        const elementDiv = document.createElement('div');
        elementDiv.className = 'element-card';
        elementDiv.innerHTML = `
            <h4>${element.name} (${Math.round(element.confidence * 100)}%)</h4>
            <p>${element.description}</p>
            <button onclick="highlightElement('detected', ${index})">Highlight</button>
        `;
        container.appendChild(elementDiv);
    });

    userElements.forEach((element, index) => {
        const elementDiv = document.createElement('div');
        elementDiv.className = 'element-card';
        elementDiv.innerHTML = `
            <h4>User ${element.type}</h4>
            <p>${element.description || ''}</p>
            <button onclick="highlightElement('user', ${index})">Highlight</button>
            <button onclick="removeUserElement(${index})">Remove</button>
        `;
        container.appendChild(elementDiv);
    });
}

function drawDetectedElements() {
    detectedElements.forEach(element => {
        switch (element.type) {
            case 'pattern':
                drawPattern(element);
                break;
            case 'zone':
                drawZone(element);
                break;
            case 'trendline':
                drawTrendline(element);
                break;
        }
    });
}

function drawPattern(pattern) {
    if (!pattern.points) return;

    ctx.strokeStyle = 'rgba(255, 99, 132, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();

    pattern.points.forEach((point, i) => {
        if (i === 0) {
            ctx.moveTo(point[0], point[1]);
        } else {
            ctx.lineTo(point[0], point[1]);
        }
    });

    ctx.stroke();
}

function drawZone(zone) {
    ctx.strokeStyle = 'rgba(54, 162, 235, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.moveTo(0, zone.level);
    ctx.lineTo(canvas.width, zone.level);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(54, 162, 235, 0.7)';
    ctx.font = '12px Arial';
    ctx.fillText(`SR: ${zone.level.toFixed(2)}`, 10, zone.level - 5);
}

function drawTrendline(trendline) {
    if (!trendline.points || trendline.points.length < 2) return;

    ctx.strokeStyle = trendline.name.includes('Up') ?
        'rgba(75, 192, 192, 0.7)' : 'rgba(255, 159, 64, 0.7)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(trendline.points[0][0], trendline.points[0][1]);
    ctx.lineTo(trendline.points[1][0], trendline.points[1][1]);
    ctx.stroke();

    const [x1, y1] = trendline.points[0];
    const [x2, y2] = trendline.points[1];
    const slope = (y2 - y1) / (x2 - x1);

    ctx.setLineDash([5, 3]);
    ctx.beginPath();

    const leftY = y1 - slope * (x1 - 0);
    ctx.moveTo(0, leftY);
    ctx.lineTo(x1, y1);

    const rightY = y2 + slope * (canvas.width - x2);
    ctx.lineTo(canvas.width, rightY);

    ctx.stroke();
    ctx.setLineDash([]);
}

// Drawing tools implementation
function handleMouseDown(e) {
    if (currentTool === TOOLS.NONE || !uploadedImage) return;

    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    startPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function handleMouseMove(e) {
    if (!isDrawing || !startPoint) return;

    const rect = canvas.getBoundingClientRect();
    const currentPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawImageOnCanvas();
    drawDetectedElements();

    ctx.strokeStyle = currentTool === TOOLS.TRENDLINE ? 'blue' : 'red';
    ctx.lineWidth = 2;

    if (currentTool === TOOLS.TRENDLINE) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
    } else if (currentTool === TOOLS.ZONE) {
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, startPoint.y);
        ctx.lineTo(canvas.width, startPoint.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

function handleMouseUp(e) {
    if (!isDrawing || !startPoint) return;

    const rect = canvas.getBoundingClientRect();
    const endPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };

    if (currentTool === TOOLS.TRENDLINE) {
        const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x) * 180 / Math.PI;
        const trendType = angle < 0 ? 'Up Trend' : 'Down Trend';

        userElements.push({
            type: 'trendline',
            name: trendType,
            points: [[startPoint.x, startPoint.y], [endPoint.x, endPoint.y]],
            description: `User-drawn ${trendType} line`
        });
    } else if (currentTool === TOOLS.ZONE) {
        userElements.push({
            type: 'zone',
            name: 'Support/Resistance',
            level: startPoint.y,
            description: `User-marked level at ${startPoint.y.toFixed(2)}`
        });
    }

    isDrawing = false;
    startPoint = null;
    displayDetectedElements();
    drawDetectedElements();
}

function handleMouseOut() {
    isDrawing = false;
    startPoint = null;
}

// Undo and remove actions
function undoLastAction() {
    if (userElements.length > 0) {
        userElements.pop();
        redrawCanvas();
        displayDetectedElements();
    }
}

function removeUserElement(index) {
    if (index >= 0 && index < userElements.length) {
        userElements.splice(index, 1);
        redrawCanvas();
        displayDetectedElements();
    }
}

// Highlight elements
function highlightElement(type, index) {
    redrawCanvas();

    const element = type === 'user' ? userElements[index] : detectedElements[index];
    if (!element) return;

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)';
    ctx.lineWidth = 4;
    ctx.setLineDash([]);

    switch (element.type) {
        case 'pattern':
            if (element.points) {
                ctx.beginPath();
                element.points.forEach((pt, i) => {
                    if (i === 0) ctx.moveTo(pt[0], pt[1]);
                    else ctx.lineTo(pt[0], pt[1]);
                });
                ctx.stroke();
            }
            break;
        case 'zone':
            ctx.beginPath();
            ctx.moveTo(0, element.level);
            ctx.lineTo(canvas.width, element.level);
            ctx.stroke();
            break;
        case 'trendline':
            const [[x1, y1], [x2, y2]] = element.points;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            break;
    }
}

// Clear canvas
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    uploadedImage = null;
    document.getElementById('imageInput').value = '';
    detectedElements = [];
    userElements = [];
    document.getElementById('detectedItems').innerHTML = "<h3>Detected Elements</h3>";
}

// Redraw canvas function
function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawImageOnCanvas();
    drawDetectedElements();
}

// Event listeners for mouse actions
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', handleMouseUp);
canvas.addEventListener('mouseout', handleMouseOut);
 
