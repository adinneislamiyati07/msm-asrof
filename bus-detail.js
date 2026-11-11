const detailRoot = document.getElementById("busDetail");
const requestedUnit = Number(new URLSearchParams(window.location.search).get("unit"));
const busFleet = window.busFleet;
const bus = Array.isArray(busFleet)
    ? busFleet.find(item => item.unit === requestedUnit)
    : null;

function createPhoto(label, source, icon) {
    const figure = document.createElement("figure");
    figure.className = "detail-photo";
    const caption = document.createElement("figcaption");
    caption.textContent = label;

    if (source) {
        const image = document.createElement("img");
        image.src = source;
        image.alt = `${label} bus MSM ${String(bus.unit).padStart(3, "0")}`;
        image.addEventListener("error", () => {
            figure.innerHTML = "";
            const placeholder = document.createElement("div");
            placeholder.className = "detail-photo-placeholder";
            placeholder.innerHTML = `<i class="${icon}" aria-hidden="true"></i><span>Foto ${label.toLowerCase()} belum tersedia.</span>`;
            figure.replaceChildren(placeholder, caption);
        }, { once: true });
        figure.appendChild(image);
    } else {
        const placeholder = document.createElement("div");
        placeholder.className = "detail-photo-placeholder";
        placeholder.innerHTML = `<i class="${icon}" aria-hidden="true"></i><span>Foto ${label.toLowerCase()} belum tersedia.</span>`;
        figure.appendChild(placeholder);
    }

    figure.appendChild(caption);
    return figure;
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
        createPhoto("Eksterior", bus.exterior, "fa-solid fa-bus"),
        createPhoto("Interior", bus.interior, "fa-solid fa-chair")
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
    specsPanel.appendChild(specs);

    const facilitiesPanel = document.createElement("section");
    facilitiesPanel.className = "detail-panel";
    facilitiesPanel.innerHTML = "<h2>Fasilitas</h2>";
    const facilities = document.createElement("ul");
    facilities.className = "detail-facilities";
    bus.facilities.forEach(name => {
        const item = document.createElement("li");
        item.innerHTML = `<i class="fa-solid fa-check" aria-hidden="true"></i>${name}`;
        facilities.appendChild(item);
    });
    facilitiesPanel.appendChild(facilities);

    const content = document.createElement("div");
    content.className = "detail-content-grid";
    content.append(specsPanel, facilitiesPanel);

    const reserveLink = document.createElement("a");
    reserveLink.className = "detail-reserve-button";
    reserveLink.href = `index.html?seat=${bus.seatCount}#reservasi`;
    reserveLink.innerHTML = '<i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Reservasi Kapasitas Ini';
    facilitiesPanel.appendChild(reserveLink);

    detailRoot.replaceChildren(heading, gallery, content);
}
