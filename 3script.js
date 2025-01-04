document.getElementById("processButton").addEventListener("click", async () => {
    const pdfInput = document.getElementById("pdfInput");
    const status = document.getElementById("status");
    const results = document.getElementById("results");

    // Clear previous results
    status.textContent = "Processing PDF...";
    results.innerHTML = "";

    if (pdfInput.files.length === 0) {
        status.textContent = "Please upload a PDF file.";
        return;
    }

    const file = pdfInput.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
        try {
            const pdf = await pdfjsLib.getDocument({ data: reader.result }).promise;
            let fullText = "";

            // Extract text from all pages
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                fullText += textContent.items.map(item => item.str).join(" ");
            }

            // Known candlestick patterns
            const candlestickPatterns = ["Doji", "Hammer", "Engulfing", "Shooting Star", "Morning Star"];
            
            // Search for patterns
            const fuse = new Fuse(candlestickPatterns, { includeScore: true, threshold: 0.3 });
            const matches = fuse.search(fullText);

            if (matches.length > 0) {
                const matchedPatterns = matches.map(match => match.item).join(", ");
                results.innerHTML = `<h2>Identified Patterns:</h2><p>${matchedPatterns}</p>`;
            } else {
                results.innerHTML = `<h2>No Candlestick Patterns Identified</h2>`;
            }

            status.textContent = "Processing complete!";
        } catch (error) {
            status.textContent = "Error processing PDF.";
            console.error(error);
        }
    };

    reader.readAsArrayBuffer(file);
});
