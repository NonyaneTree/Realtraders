async function searchInPDF(query, imageData) {
    const pdfUrl = 'chart.pdf'; // Replace with your PDF path
    const resultsDiv = document.getElementById('results');
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    const pdf = await pdfjsLib.getDocument(pdfUrl).promise;

    let pdfText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        pdfText += textContent.items.map((item) => item.str).join(' ') + '\n';
    }

    // Fuzzy matching
    const lines = pdfText.split('\n');
    const options = {
        includeScore: true,
        threshold: 0.4,
    };
    const fuse = new Fuse(lines, options);
    const results = fuse.search(query);

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
}