document.getElementById("searchButton").addEventListener("click", async () => {
    const imageInput = document.getElementById("imageInput");
    const status = document.getElementById("status");
    const results = document.getElementById("results");

    // Clear previous results
    results.innerHTML = "";
    status.textContent = "Processing image and PDF...";

    const file = imageInput.files[0];
    if (!file) {
        status.textContent = "Please upload an image.";
        return;
    }

    try {
        // Perform OCR on the uploaded image
        const ocrText = await performOCR(file);

        // Load and extract text from the PDF
        const pdfText = await extractTextFromPdf("chart.pdf");

        // Search for similarities using Fuse.js
        const searchResults = searchInPdf(ocrText, pdfText);

        // Display results
        if (searchResults.length > 0) {
            results.innerHTML = `<h3>Matches Found:</h3><ul>${searchResults
                .map((result) => `<li>${result.item}</li>`)
                .join("")}</ul>`;
        } else {
            results.innerHTML = `<p>No matches found for the extracted text.</p>`;
        }

        status.textContent = "Search completed.";
    } catch (error) {
        console.error(error);
        status.textContent = "An error occurred while processing.";
    }
});

async function performOCR(imageFile) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = async () => {
            const worker = Tesseract.createWorker();
            await worker.load();
            await worker.loadLanguage("eng");
            await worker.initialize("eng");
            const { data: { text } } = await worker.recognize(reader.result);
            await worker.terminate();
            resolve(text.trim());
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
    });
}

async function extractTextFromPdf(pdfUrl) {
    const response = await fetch(pdfUrl);
    const pdfData = new Uint8Array(await response.arrayBuffer());
    const pdf = await pdfjsLib.getDocument(pdfData).promise;
    let pdfText = "";

    for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1);
        const textContent = await page.getTextContent();
        pdfText += textContent.items.map((item) => item.str).join(" ");
    }

    return pdfText;
}

function searchInPdf(ocrText, pdfText) {
    const fuse = new Fuse(pdfText.split(" "), { includeScore: true });
    return fuse.search(ocrText);
                                         }
