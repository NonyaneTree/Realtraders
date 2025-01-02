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