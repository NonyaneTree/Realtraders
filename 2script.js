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