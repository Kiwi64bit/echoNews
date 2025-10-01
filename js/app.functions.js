function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-bs-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-bs-theme", newTheme);
    localStorage.setItem("preferredTheme", newTheme);
}

function toggleShow(targetSelector) {
    const targetElement = document.querySelector(targetSelector);
    targetElement.classList.toggle("show");
}

function timeSince(publishedAt) {
    const published = new Date(publishedAt);
    const now = new Date();

    const seconds = Math.floor((now - published) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30.4368);
    const years = Math.floor(days / 365.2422);

    if (years > 0) return `${years} year${years > 1 ? "s" : ""} ago`;
    if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
    if (weeks > 0) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
}

function createNewsCard({ source, author, title, description, url, urlToImage, publishedAt, content }) {
    const fallbackImage = "https://placehold.co/400x300?text=Image+Unavailable";
    const newsCard = document.createElement("div");
    newsCard.classList.add(..."news-card p-3 rounded-3 w-100".split(" "));
    newsCard.innerHTML += `
        <div class="news-image rounded-3 overflow-hidden">
            <a target="_blank" href="${url}" class="custom-image-link">
                <img src="${urlToImage ?? fallbackImage}" onerror="this.src='${fallbackImage}'"
                alt="" class="img-fluid">
            </a>
        </div>
        <div class="news-text flex-grow-1 p-2 d-flex flex-column">
            <a target="_blank" href="${url}" class="custom-text-link">
                <h6 class="fw-bold mb-2">${title}</h6>
            </a>
            <p class="mb-3 text-truncate">by ${author ?? "an unknown author"}</p>
            <a target="_blank" href="${url}" class="custom-text-link flex-grow-1">
                <p class="fw-thin">
                    ${description ?? "no description"}
                </p>
            </a>
            <h6 class="fw-normal d-flex align-items-end column-gap-2">
                <span class="fw-medium">${source.name ?? "unknown source"}</span>
                <span>•</span>
                <span>${timeSince(publishedAt)}</span>
            </h6>
        </div>`;

    return newsCard;
}

function renderArticles(containerElement, articles = []) {
    containerElement.innerHTML = "";

    if (!articles.length) {
        containerElement.innerHTML = `<h2 class="w-100 text-center">No results found.</h2>`;
        return;
    }

    for (const article of articles) {
        const newsCard = createNewsCard(article);
        const wrapper = document.createElement("div");
        wrapper.classList.add("col");
        wrapper.appendChild(newsCard);
        containerElement.appendChild(wrapper);
    }
}

function updateCarousel(carouselSelector, data) {
    const fallbackImage = "https://placehold.co/400x300?text=Image+Unavailable";
    const carousel = document.querySelector(carouselSelector);
    const carouselItems = carousel.querySelectorAll(".carousel-inner .carousel-item");
    carouselItems.forEach((element, index) => {
        const carouselLink = element.querySelector("a.custom-text-link");
        const carouselImage = element.querySelector("img");
        const carouselTitle = element.querySelector(".title");
        carouselLink.href = data[index].url;
        carouselImage.src = data[index].urlToImage ?? fallbackImage;
        carouselImage.onerror = () => (carouselImage.src = fallbackImage);
        carouselTitle.textContent = data[index].title;
    });
}

async function fetchAndRenderArticles(url, containerElement, title) {
    const titleElement = document.querySelector("#newsCardsContainerTitle");
    try {
        const data = await fetchNews(url);
        const articles = data.articles;
        titleElement.textContent = title;
        renderArticles(containerElement, articles);
        return articles;
    } catch (error) {
        titleElement.textContent = "";
        containerElement.innerHTML = `
        <h2 class="w-100 text-center">Couldn't fetch data <br> error: ${error}</h2>`;
        return [];
    }
}

function getFormData(form) {
    const formData = new FormData(form);
    const filters = {};
    let endpoint = "everything";

    for (const [key, value] of formData.entries()) {
        if (key === "endpoint") {
            endpoint = value;
            continue;
        }
        if (value.trim()) {
            filters[key] = value.trim();
        }
    }
    return { endpoint, filters };
}

function buildNewsURL(endpoint, filters, baseURL = "https://newsapi.org/v2/") {
    const newsURL = new URL(endpoint, baseURL);

    for (const [key, value] of Object.entries(filters)) {
        newsURL.searchParams.set(key, value);
    }

    return newsURL;
}

function updateErrorPopover(popover, message = "error", delay = 3000) {
    if (popover._element.getAttribute("data-show") !== "true") {
        popover.setContent({
            ".popover-header": "Error",
            ".popover-body": message,
        });
        popover.show();
        popover._element.setAttribute("data-show", "true");
        setTimeout(() => {
            popover.hide();
            popover._element.addEventListener("hidden.bs.popover", function removeShow() {
                popover._element.setAttribute("data-show", "false");
                popover._element.removeEventListener("hidden.bs.popover", removeShow);
            });
        }, delay);
    }
}

function validateData(endpoint, dataObj) {
    if (!endpoint || !dataObj || Object.entries(dataObj).length == 0) {
        return { isValid: false, message: "you must provide at least one parameter." };
    }
    if (endpoint === "top-headlines") {
        if (dataObj.q || dataObj.category || dataObj.country) {
            return { isValid: true, message: "" };
        } else {
            return { isValid: false, message: "you must provide at least one parameter." };
        }
    }
    if (endpoint === "everything") {
        if (dataObj.q) {
            return { isValid: true, message: "" };
        } else {
            return { isValid: false, message: "search is too broad! you must provide at least one keyword" };
        }
    }
}

async function fetchNews(url) {
    const response = await fetch(url, {
        headers: { "X-Api-Key": "b32bb6c6e07e4403b88379c686cc5571" },
    });

    if (!response.ok) {
        throw response.status;
    }

    return response.json();
}

function debounce(mainFunc, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            mainFunc.apply(this, args);
        }, delay);
    };
}
