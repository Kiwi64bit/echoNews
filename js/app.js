let cashedResults = [];

const themeToggleBtn = document.getElementById("themeToggle");
themeToggleBtn.addEventListener("click", toggleTheme);

const newsFilter = document.getElementById("newsFilter");
const filterPopover = new bootstrap.Popover("#filters", {
    container: "body",
    title: "Error",
    content: "error",
    fallbackPlacements: ["bottom"],
    placement: "left",
    trigger: "manual",
});

const endpointSelect = newsFilter.querySelector("#endpoint");
const topHeadlinesForm = newsFilter.querySelector("#topHeadlinesForm");
const everythingForm = newsFilter.querySelector("#everythingForm");

const newsContainer = document.getElementById("newsCardsContainer");
const newsContainerTitle = document.getElementById("newsCardsContainerTitle");

endpointSelect.addEventListener("input", () => {
    const value = endpointSelect.value.trim();
    topHeadlinesForm.style.display = value === "top-headlines" ? "block" : "none";
    everythingForm.style.display = value === "everything" ? "block" : "none";
});

const debouncedFilter = debounce(form => {
    const { endpoint, filters } = getFormData(form);
    const valid = validateData(endpoint, filters);
    if (!valid.isValid) {
        updateErrorPopover(filterPopover, valid.message);
        return;
    }
    const url = buildNewsURL(endpoint, filters);
    cashedResults = fetchAndRenderArticles(url, newsContainer, "Filterd Results");
}, 200);

[topHeadlinesForm, everythingForm].forEach(form => {
    form.addEventListener("submit", event => {
        event.preventDefault();
        debouncedFilter(form);
    });
});

(async function reloadPage() {
    const categoryOptions = document.querySelectorAll(`#topHeadlinesCategory option:not([value=""])`);
    const categories = Array.from(categoryOptions).map(element => element.value);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const data = await fetchNews(buildNewsURL("top-headlines", { category: randomCategory }));
    cashedResults = data.articles;

    const carouselHeadlines = cashedResults.slice(0, 3);
    const bodyHeadlines = cashedResults.slice(3);
    updateCarousel("#carouselExampleInterval", carouselHeadlines);
    newsContainerTitle.innerHTML = randomCategory;
    renderArticles(newsContainer, bodyHeadlines);
})();
