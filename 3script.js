document.getElementById("processButton").addEventListener("click", async () => {
    const status = document.getElementById("status");
    const results = document.getElementById("results");

    // Clear previous results
    results.innerHTML = "";
    status.textContent = "Processing PDF...";

    // Use a predefined chart.pdf file (Make sure it is in the same directory as your script)
    const pdfUrl = "chart.pdf";  // Adjust the path if the file is in a different location

    try {
        // Read PDF file
        const pdfData = await readPdf(pdfUrl);

        // Extract text from PDF
        const pdfText = await extractTextFromPdf(pdfData);

        // Display PDF text
        status.textContent = "Text extracted from PDF. Now searching...";

        // Perform OCR on images (assuming processImages() is used here)
        const ocrText = await processImages(); // Call your existing OCR function here

        // Use Fuse.js to search within the extracted PDF text
        const fuse = new Fuse(pdfText.split(" "), { includeScore: true });
        const searchResults = fuse.search(ocrText);

        // Display search results
        if (searchResults.length > 0) {
            results.innerHTML = `<h3>Matches Found:</h3><ul>${searchResults
                .map((result) => `<li>${result.item}</li>`)
                .join("")}</ul>`;
        } else {
            results.innerHTML = `<p>No matches found for: "${ocrText}"</p>`;
        }
    } catch (error) {
        status.textContent = "Error processing the PDF.";
        console.error(error);
    }
});

async function readPdf(pdfUrl) {
    const response = await fetch(pdfUrl);  // Fetch the PDF from the server
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer); // Convert the response to a Uint8Array
}

async function extractTextFromPdf(pdfData) {
    const pdf = await pdfjsLib.getDocument(pdfData).promise;
    let pdfText = "";

    for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1);
        const textContent = await page.getTextContent();
        pdfText += textContent.items.map(item => item.str).join(" ");
    }

    return pdfText;
}
