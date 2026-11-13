const detailRoot = document.getElementById("busDetail");
const requestedUnit = Number(new URLSearchParams(window.location.search).get("unit"));
const busFleet = window.busFleet;
const bus = Array.isArray(busFleet)
    ? busFleet.find(item => item.unit === requestedUnit)
    : null;

function createPhotoGallery(label, property, icon) {
    const configuredPhotos = bus[`${property}Photos`];
    const photos = Array.isArray(configuredPhotos)
        ? configuredPhotos
        : bus[property]
            ? [bus[property]]
            : [];
    const slideCount = Math.max(4, photos.length);
    const gallery = document.createElement("section");
    gallery.className = "detail-gallery-card";
    gallery.setAttribute("aria-label", `Galeri foto ${label.toLowerCase()}`);

    const title = document.createElement("h2");
    title.className = "detail-gallery-title";
    title.textContent = label;

    const slider = document.createElement("div");
    slider.className = "detail-slider";
    const viewport = document.createElement("div");
    viewport.className = "detail-slider-viewport";

    const slides = Array.from({ length: slideCount }, (_, index) => {
        const figure = document.createElement("figure");
        figure.className = "detail-photo";
        figure.setAttribute("aria-label", `Foto ${label.toLowerCase()} ${index + 1}`);
        const caption = document.createElement("figcaption");
        caption.textContent = `${label} ${index + 1}`;

        const source = photos[index];
        if (typeof source === "string" && source.trim()) {
            const image = document.createElement("img");
            image.src = source;
            image.alt = `${label} bus MSM ${String(bus.unit).padStart(3, "0")} foto ${index + 1}`;
            image.addEventListener("error", () => {
                figure.replaceChildren(createPhotoPlaceholder(label, index, icon, property), caption);
            }, { once: true });
            figure.appendChild(image);
        } else {
            figure.appendChild(createPhotoPlaceholder(label, index, icon, property));
        }

        figure.appendChild(caption);
        viewport.appendChild(figure);
        return figure;
    });

    const controls = document.createElement("div");
    controls.className = "detail-slider-controls";
    const navigation = document.createElement("div");
    navigation.className = "detail-slider-navigation";

    const previousButton = createSliderButton(
        "detail-slider-arrow",
        "fa-solid fa-arrow-left",
        `Foto ${label.toLowerCase()} sebelumnya`
    );
    const indicators = document.createElement("div");
    indicators.className = "detail-slider-indicators";
    indicators.setAttribute("role", "group");
    indicators.setAttribute("aria-label", `Pilih foto ${label.toLowerCase()}`);
    const nextButton = createSliderButton(
        "detail-slider-arrow",
        "fa-solid fa-arrow-right",
        `Foto ${label.toLowerCase()} berikutnya`
    );
    const counter = document.createElement("span");
    counter.className = "detail-slider-counter";
    counter.setAttribute("aria-live", "polite");

    let activeIndex = 0;
    const indicatorButtons = slides.map((_, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "detail-slider-indicator";
        button.setAttribute("aria-label", `Tampilkan foto ${label.toLowerCase()} ${index + 1}`);
        button.addEventListener("click", () => showSlide(index));
        indicators.appendChild(button);
        return button;
    });

    function showSlide(index) {
        activeIndex = (index + slideCount) % slideCount;
        slides.forEach((slide, slideIndex) => {
            const isActive = slideIndex === activeIndex;
            slide.classList.toggle("is-active", isActive);
            slide.hidden = !isActive;
            indicatorButtons[slideIndex].classList.toggle("is-active", isActive);
            indicatorButtons[slideIndex].setAttribute("aria-pressed", String(isActive));
        });
        counter.textContent = `${activeIndex + 1} / ${slideCount}`;
    }

    previousButton.addEventListener("click", () => showSlide(activeIndex - 1));
    nextButton.addEventListener("click", () => showSlide(activeIndex + 1));
    navigation.append(previousButton, indicators, nextButton);
    controls.append(navigation, counter);
    slider.append(viewport, controls);
    gallery.append(title, slider);
    showSlide(0);
    return gallery;
}

function createPhotoPlaceholder(label, index, icon, property) {
    const placeholder = document.createElement("div");
    placeholder.className = "detail-photo-placeholder";
    const placeholderIcon = document.createElement("i");
    placeholderIcon.className = icon;
    placeholderIcon.setAttribute("aria-hidden", "true");
    const message = document.createElement("span");
    message.textContent = `Foto ${label.toLowerCase()} ${index + 1} belum tersedia.`;
    const hint = document.createElement("small");
    hint.textContent = `Tambahkan path foto ke ${property}Photos di bus-data.js.`;
    placeholder.append(placeholderIcon, message, hint);
    return placeholder;
}

function createSliderButton(className, iconClass, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.setAttribute("aria-label", label);
    const icon = document.createElement("i");
    icon.className = iconClass;
    icon.setAttribute("aria-hidden", "true");
    button.appendChild(icon);
    return button;
}

function addSpec(list, label, value) {
    const item = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value || "Informasi belum tersedia";
    item.append(term, description);
    list.appendChild(item);
}

if (!Array.isArray(busFleet)) {
    console.error("Data armada belum dapat dimuat.");
    detailRoot.textContent = "Informasi armada belum dapat dimuat. Silakan coba lagi.";
} else if (!bus) {
    detailRoot.innerHTML = `
        <section class="detail-not-found">
            <h1>Armada tidak ditemukan</h1>
            <p>Silakan kembali ke daftar armada dan pilih unit yang tersedia.</p>
            <a class="detail-reserve-button" href="index.html#armada">Kembali ke Armada</a>
        </section>`;
} else {
    document.title = `MSM ${String(bus.unit).padStart(3, "0")} | Detail Armada`;

    const heading = document.createElement("header");
    heading.className = "detail-heading";
    heading.innerHTML = `
        <div>
            <span class="detail-eyebrow">DETAIL ARMADA</span>
            <h1>${bus.name}</h1>
        </div>
        <span class="detail-seat-badge">${bus.seatCount} SEAT</span>`;

    const gallery = document.createElement("section");
    gallery.className = "detail-gallery";
    gallery.setAttribute("aria-label", "Foto armada");
    gallery.append(
        createPhotoGallery("Eksterior", "exterior", "fa-solid fa-bus"),
        createPhotoGallery("Interior", "interior", "fa-solid fa-chair")
    );

    const specsPanel = document.createElement("section");
    specsPanel.className = "detail-panel";
    specsPanel.innerHTML = "<h2>Informasi Unit</h2>";
    const specs = document.createElement("dl");
    specs.className = "detail-specs";
    addSpec(specs, "Tipe unit", bus.type);
    addSpec(specs, "Tahun unit", bus.year);
    addSpec(specs, "Merek unit", bus.brand);
    addSpec(specs, "Kapasitas", `${bus.seatCount} seat`);

    const facilitiesPanel = document.createElement("section");
    facilitiesPanel.className = "detail-facilities-section";
    facilitiesPanel.innerHTML = "<h3>Fasilitas</h3>";
    const facilities = document.createElement("ul");
    facilities.className = "detail-facilities";
    bus.facilities.forEach(name => {
        const item = document.createElement("li");
        item.innerHTML = `<i class="fa-solid fa-check" aria-hidden="true"></i>${name}`;
        facilities.appendChild(item);
    });
    facilitiesPanel.appendChild(facilities);
    specsPanel.append(specs, facilitiesPanel);

    const content = document.createElement("div");
    content.className = "detail-content-grid";
    content.appendChild(specsPanel);

    const reserveLink = document.createElement("a");
    reserveLink.className = "detail-reserve-button";
    reserveLink.href = `index.html?unit=${bus.unit}#reservasi`;
    reserveLink.setAttribute("aria-label", `Tambah ${bus.name} ke form reservasi`);
    reserveLink.innerHTML = '<i class="fa-solid fa-plus" aria-hidden="true"></i> Tambah ke Form';
    facilitiesPanel.appendChild(reserveLink);

    detailRoot.replaceChildren(heading, gallery, content);
}
