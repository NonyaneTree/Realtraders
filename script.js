// Check search limit
function checkSearchLimit() {
    const searches = JSON.parse(localStorage.getItem('searches')) || [];
    const now = Date.now();
    const twelveHoursAgo = now - 12 * 60 * 60 * 1000;

    // Remove expired searches
    const validSearches = searches.filter((timestamp) => timestamp > twelveHoursAgo);
    localStorage.setItem('searches', JSON.stringify(validSearches));

    if (validSearches.length >= 4) {
        alert('You’ve reached the limit of 4 searches in the last 12 hours.');
        return false;
    }

    // Log this search
    validSearches.push(now);
    localStorage.setItem('searches', JSON.stringify(validSearches));
    return true;
}

// Process uploaded images
async function processImages() {
    if (!checkSearchLimit()) return;

    const files = document.getElementById('imageInput').files;
    const status = document.getElementById('status');
    const spinner = document.getElementById('spinner');
    const resultsDiv = document.getElementById('results');

    if (files.length === 0) {
        status.innerText = 'Please upload at least one image.';
        return;
    }

    status.innerText = 'Processing images...';
    spinner.style.display = 'block';
    resultsDiv.innerHTML = '';

    for (const file of files) {
        const reader = new FileReader();
        reader.onload = async () => {
            const result = await Tesseract.recognize(reader.result, 'eng', {
                logger: (m) => console.log(m),
            });
            const extractedText = result.data.text.trim();
            status.innerText = `Extracted text: "${extractedText}"`;

            // Search in PDF and display results
            await searchInPDF(extractedText, reader.result);
        };
        reader.readAsDataURL(file);
    }

    spinner.style.display = 'none';
    status.innerText = 'Processing complete!';
}

// Search in PDF
async function searchInPDF(query, imageData) {
    const pdfUrl = 'chart.pdf'; // Ensure the path is correct
    const resultsDiv = document.getElementById('results');
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');

    resultsDiv.innerHTML = 'Searching...';
    let pdfText = '';

    try {
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            pdfText += textContent.items.map((item) => item.str).join(' ') + '\n';
        }

        console.log('Extracted Text:', pdfText);

        // Fuzzy matching
        const lines = pdfText.split('\n');
        const options = {
            includeScore: true,
            threshold: 0.4,
        };
        const fuse = new Fuse(lines, options);
        const results = fuse.search(query);

        if (results.length > 0) {
            resultsDiv.innerHTML = `<p>Found ${results.length} matches:</p>`;
            results.forEach((result, index) => {
                resultsDiv.innerHTML += `<p>${index + 1}. Match: "${result.item}" (Score: ${result.score.toFixed(2)})</p>`;
            });

            // Overlay matches on the image
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                ctx.font = '20px Arial';
                ctx.fillStyle = 'red';

                results.forEach((result, index) => {
                    ctx.fillText(result.item, 10, 30 * (index + 1));
                });

                canvas.style.display = 'block';
            };
            img.src = imageData;
        } else {
            resultsDiv.innerHTML = `<p>No matches found for: "${query}"</p>`;
        }
    } catch (error) {
        console.error('Error processing PDF:', error);
        resultsDiv.innerHTML = `<p>Error processing PDF: ${error.message}</p>`;
    }
}