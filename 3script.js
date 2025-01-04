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
            try {
                // OCR processing with Tesseract.js
                const result = await Tesseract.recognize(reader.result, 'eng', {
                    logger: (m) => console.log(m),
                });
                const extractedText = result.data.text.trim();
                console.log("Extracted Text:", extractedText);
                status.innerText = `Extracted text: "${extractedText}"`;

                // Search in PDF and display results
                await searchInPDF(extractedText, reader.result);
            } catch (error) {
                console.error("Error during OCR or PDF search:", error);
                status.innerText = "An error occurred during processing.";
                resultsDiv.innerHTML = `<p>Error: ${error.message}</p>`;
            }
        };
        reader.readAsDataURL(file);
    }

    spinner.style.display = 'none';
    status.innerText = 'Processing complete!';
}

async function searchInPDF(query, imageData) {
    const pdfUrl = 'chart.pdf'; // Replace with your PDF path
    const resultsDiv = document.getElementById('results');
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');

    try {
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;

        let pdfText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            pdfText += textContent.items.map((item) => item.str).join(' ') + '\n';
        }

        console.log("PDF Content:", pdfText);

        // Fuzzy matching
        const lines = pdfText.split('\n');
        const options = {
            includeScore: true,
            threshold: 0.4,
        };
        const fuse = new Fuse(lines, options);
        const results = fuse.search(query);

        console.log("Search Query:", query);
        console.log("Search Results:", results);

        if (results.length > 0) {
            resultsDiv.innerHTML += `<p>Found ${results.length} matches:</p>`;
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
            resultsDiv.innerHTML += `<p>No matches found for: "${query}"</p>`;
        }
    } catch (error) {
        console.error("Error during PDF search:", error);
        resultsDiv.innerHTML = `<p>Error searching PDF: ${error.message}</p>`;
    }
         }
