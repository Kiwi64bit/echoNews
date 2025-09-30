let cashedResults = [];

const newsContainerTitle = document.getElementById("newsCardsContainerTitle");

const categoryOptions = Array.from(document.querySelectorAll(`#topHeadlinesCategory option:not([value=""])`)).map(
    element => element.value
);
const randomCategory = categoryOptions[Math.floor(Math.random() * categoryOptions.length)];

newsContainerTitle.textContent = randomCategory.toLocaleUpperCase();
fetchNews(buildNewsURL("top-headlines", { category: randomCategory }))
    .then(data => {
        cashedResults = data.articles;
        renderArticles("#newsCardsContainer", cashedResults);
    })
    .catch(error => {
        let errorMessage = error;
        newsContainerTitle.textContent = "";
        document.querySelector("#newsCardsContainer").innerHTML = `
        <h2 class="w-100 text-center">Couldn't fetch data <br> error code: ${errorMessage}</h2>`;
    });

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

endpointSelect.addEventListener("input", () => {
    const value = endpointSelect.value.trim();
    topHeadlinesForm.style.display = value === "top-headlines" ? "block" : "none";
    everythingForm.style.display = value === "everything" ? "block" : "none";
});

const debouncedFilter = debounce(async form => {
    const { endpoint, filters } = getFormData(form);
    const valid = validateData(endpoint, filters);
    if (!valid.isValid) {
        updateErrorPopover(filterPopover, valid.message);
        return;
    }

    try {
        const url = buildNewsURL(endpoint, filters);
        const data = await fetchNews(url);
        cashedResults = data.articles;
        newsContainerTitle.textContent = "Filtered Results";
        renderArticles("#newsCardsContainer", cashedResults);
    } catch (error) {
        let errorMessage = error;
        newsContainerTitle.textContent = "";
        document.querySelector("#newsCardsContainer").innerHTML = `
        <h2 class="w-100 text-center">Couldn't fetch data <br> error code: ${errorMessage}</h2>`;
    }
}, 200);

[topHeadlinesForm, everythingForm].forEach(form => {
    form.addEventListener("submit", async event => {
        event.preventDefault();
        debouncedFilter(form);
    });
});
