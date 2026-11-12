/* ================= MOBILE MENU ================= */

const menuButton = document.getElementById("menuButton");
const navMenu = document.getElementById("navMenu");

if (menuButton && navMenu) {
    menuButton.addEventListener("click", () => {
        navMenu.classList.toggle("active");
    });

    document.querySelectorAll("#navMenu a").forEach(link => {
        link.addEventListener("click", () => {
            navMenu.classList.remove("active");
        });
    });
}


/* ================= HERO BACKGROUND SLIDER ================= */

const slides = document.querySelectorAll('.hero-slider .slide');
if (slides.length > 0) {
    let currentSlide = 0;
    const slideInterval = 5000; // 5 detik per foto

    function nextSlide() {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }

    setInterval(nextSlide, slideInterval);
}


/* ================= PILIH BUS ================= */

const seatFilter = document.getElementById("seatFilter");
const busGrid = document.getElementById("busGrid");
const busFilterStatus = document.getElementById("busFilterStatus");

if (seatFilter && busGrid && busFilterStatus) {
    const busCards = Array.from(busGrid.querySelectorAll(".bus-card"));

    busCards.forEach(card => {
        const unit = card.querySelector(".bus-info h3")?.textContent.match(/\d+/)?.[0];
        if (!unit) return;

        const detailLink = document.createElement("a");
        detailLink.className = "bus-card-link";
        detailLink.href = `bus-detail.html?unit=${unit}`;
        detailLink.setAttribute("aria-label", `Lihat detail bus ${card.querySelector(".bus-info h3").textContent.trim()}`);
        card.prepend(detailLink);
        card.querySelector(".detail-button").innerHTML = 'Lihat Detail <i class="fas fa-arrow-right"></i>';
    });

    seatFilter.querySelectorAll("option[value]").forEach(option => {
        if (!option.value) return;

        const matchingBuses = busCards.filter(card => {
            const seatCount = card.querySelector(".seat-badge")?.textContent.match(/\d+/)?.[0];
            return seatCount === option.value;
        }).length;

        option.textContent = `${option.value} Seat (${matchingBuses} bus)`;
    });

    seatFilter.addEventListener("change", () => {
        const selectedSeat = seatFilter.value;

        if (!selectedSeat) {
            busGrid.hidden = true;
            busFilterStatus.textContent = "Pilih kapasitas untuk melihat daftar armada.";
            return;
        }

        let visibleCount = 0;
        busCards.forEach(card => {
            const seatCount = card.querySelector(".seat-badge")?.textContent.match(/\d+/)?.[0];
            const matches = seatCount === selectedSeat;
            card.hidden = !matches;
            if (matches) visibleCount += 1;
        });

        busGrid.hidden = false;
        busFilterStatus.textContent = `${visibleCount} bus dengan kapasitas ${selectedSeat} seat.`;
    });
}

function selectBus(busName) {
    const unit = busName.match(/Unit\s+(\d+)/i)?.[1];
    if (!unit) {
        console.error("Tidak dapat membuka detail bus: nomor unit tidak ditemukan.");
        return;
    }

    window.location.href = `bus-detail.html?unit=${unit}`;
}


/* ================= RESERVASI FORM (WHATSAPP) ================= */

const reservationForm = document.getElementById("reservationForm");
const reservationBusList = document.getElementById("busList");
const addReservationBusButton = document.getElementById("addBusButton");
const reservationDestinationSelect = document.getElementById("tujuan");
const reservationDurationSelect = document.getElementById("durasi");
const reservationPriceInput = document.getElementById("harga");
const busFleet = window.busFleet;

const reservationPriceList = [
    { id: "jakarta-city", destination: "Dalam Kota, Jakarta Area (City Tour)", rates: { 1: [3400000, 2600000], 2: [5200000, 4200000] } },
    { id: "gadog-purwakarta", destination: "Gadog, Cisarua, Lido, Cijeruk, Pancawati, Purwakarta", rates: { 1: [4000000, 3200000], 2: [6700000, 5200000] } },
    { id: "bandung-area", destination: "Bandung, Lembang, Subang, Ciater, Sukabumi, Cianjur, Anyer, Carita", rates: { 1: [4700000, 4000000], 2: [7900000, 6500000] } },
    { id: "jatinangor-pelabuhan-ratu", destination: "Jatinangor, Pengalengan, Ciwidey, Pelabuhan Ratu", rates: { 1: [5500000, 4500000], 2: [8500000, 7000000] } },
    { id: "tanjung-lesung", destination: "Tanjung Lesung", rates: { 1: [6200000, 5000000], 2: [9200000, 7500000] } },
    { id: "panjalu-pamijahan", destination: "Panjalu, Haruman, Pemalang, Pekalongan, Cirebon, Pamijahan", rates: { 1: [6800000, 5700000], 2: [9800000, 8300000] } },
    { id: "pangandaran", destination: "Pangandaran", rates: { 3: [13000000, 11000000] } },
    { id: "yogyakarta-palembang-muria", destination: "Yogyakarta, Palembang, Muria", rates: { 3: [14200000, 10900000], 4: [18200000, 12900000] } },
    { id: "ziarah-wali-bangkalan", destination: "Ziarah Wali Songo, Madura Bangkalan", rates: { 5: [24700000, 17300000] } },
    { id: "bali", destination: "Bali", rates: { 8: [38300000, 25800000] } },
    { id: "depok-bogor", destination: "Depok, Tangerang, Ciputat, Parung, Karawang, Bogor", rates: { 1: [3700000, 3000000], 2: [6200000, 4700000] } },
    { id: "gunung-mas-ciloto", destination: "Gunung Mas, Puncak Pass, Cibodas, Cipanas, Ciloto", rates: { 1: [4200000, 3400000], 2: [7200000, 5500000] } },
    { id: "ziarah-banten-soreang", destination: "Ziarah Banten, Al-Jabar, Al-Mumtaz, Soreang", rates: { 1: [5000000, 4200000], 2: [8200000, 6700000] } },
    { id: "indramayu-al-kamil", destination: "Indramayu, Garut, Cirebon, Kuningan, Sumedang, Al-Kamil", rates: { 1: [5700000, 4700000], 2: [8700000, 7300000] } },
    { id: "brebes-guci", destination: "Brebes, Tegal, Guci", rates: { 2: [9500000, 7800000] } },
    { id: "cirebon-demak-kudus", destination: "Cirebon, Demak, Kudus", rates: { 2: [10000000, 8500000] } },
    { id: "purwokerto-purbalingga", destination: "Purwokerto, Wonosobo, Dieng, Lampung, Semarang, Purbalingga", rates: { 2: [10200000, 8700000], 3: [13700000, 12200000] } },
    { id: "yogyakarta-bromo", destination: "Yogyakarta, Malang, Batu, Bromo", rates: { 4: [19200000, 13700000], 5: [23700000, 16700000] } },
    { id: "ziarah-wali-sumenep", destination: "Ziarah Wali Songo, Madura Kalianget, Sumenep", rates: { 6: [27300000, 20300000] } },
    { id: "lombok", destination: "Lombok", rates: { 10: [45300000, 30300000] } }
];

const busPriceClassBySeat = {
    35: "medium",
    39: "medium",
    46: "big",
    50: "big",
    59: "big"
};
const formatRupiah = amount => `Rp ${amount.toLocaleString("id-ID")}`;

function getReservationBusSelects() {
    return Array.from(reservationBusList?.querySelectorAll(".reservation-bus-select") || []);
}

function syncReservationBusOptions() {
    const selects = getReservationBusSelects();
    const selectedUnits = selects.map(select => select.value || select.dataset.requestedUnit || "").filter(Boolean);

    selects.forEach(select => {
        const selectedUnit = select.value || select.dataset.requestedUnit || "";
        const unavailableUnits = new Set(selectedUnits.filter(unit => unit !== selectedUnit));
        select.replaceChildren(new Option("Pilih unit bus", ""));

        busFleet.forEach(bus => {
            if (!unavailableUnits.has(String(bus.unit))) {
                select.add(new Option(`${bus.name} (${bus.seatCount} Seat)`, bus.unit));
            }
        });

        select.value = selectedUnit;
        delete select.dataset.requestedUnit;
    });

    const canAddBus = selects.length < busFleet.length;
    if (addReservationBusButton) {
        addReservationBusButton.disabled = !canAddBus;
    }

    reservationBusList?.querySelectorAll(".remove-bus-button").forEach(button => {
        button.disabled = selects.length === 1;
    });
}

function addReservationBus(unit = "") {
    const row = document.createElement("div");
    row.className = "reservation-bus-row";

    const select = document.createElement("select");
    select.className = "reservation-bus-select";
    select.setAttribute("aria-label", `Pilih unit bus ${getReservationBusSelects().length + 1}`);
    select.required = true;
    if (unit) select.dataset.requestedUnit = unit;
    select.addEventListener("change", () => {
        syncReservationBusOptions();
        updateReservationPrice();
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-bus-button";
    removeButton.setAttribute("aria-label", "Hapus unit bus");
    removeButton.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i>';
    removeButton.addEventListener("click", () => {
        row.remove();
        syncReservationBusOptions();
        updateReservationPrice();
    });

    row.append(select, removeButton);
    reservationBusList.appendChild(row);
    syncReservationBusOptions();
    updateReservationPrice();
}

function getReservationBusPrices() {
    const route = reservationPriceList.find(item => item.id === reservationDestinationSelect?.value);
    const duration = Number(reservationDurationSelect?.value);
    const selects = getReservationBusSelects();

    if (!route || !duration || selects.length === 0 || selects.some(select => !select.value)) {
        return null;
    }

    const buses = selects.map(select => {
        const bus = busFleet.find(item => String(item.unit) === select.value);
        const priceClass = busPriceClassBySeat[bus?.seatCount];
        const classRate = priceClass === "big" ? 0 : priceClass === "medium" ? 1 : -1;
        const unitPrice = classRate < 0 ? null : route.rates[duration]?.[classRate];

        return bus && unitPrice ? { bus, unitPrice } : null;
    });

    return buses.every(Boolean) ? buses : null;
}

function updateReservationPrice() {
    if (!reservationPriceInput) return;

    const busPrices = getReservationBusPrices();
    const totalPrice = busPrices?.reduce((total, item) => total + item.unitPrice, 0);
    if (!Number.isSafeInteger(totalPrice)) {
        reservationPriceInput.value = "";
        return;
    }

    reservationPriceInput.value = formatRupiah(totalPrice);
}

const reservationParams = new URLSearchParams(window.location.search);
const requestedUnit = reservationParams.get("unit");
const requestedSeat = reservationParams.get("seat");

if (reservationBusList) {
    if (!Array.isArray(busFleet)) {
        console.error("Data armada belum dapat dimuat untuk form reservasi.");
        addReservationBusButton.disabled = true;
        const message = document.createElement("p");
        message.textContent = "Data armada tidak tersedia. Silakan coba lagi.";
        reservationBusList.appendChild(message);
    } else {
        const requestedBus = busFleet.find(bus => String(bus.unit) === requestedUnit)
            || busFleet.find(bus => bus.seatCount === Number(requestedSeat));
        addReservationBus(requestedBus ? String(requestedBus.unit) : "");
        addReservationBusButton.addEventListener("click", () => addReservationBus());
    }
}

if (reservationForm && reservationDestinationSelect && reservationDurationSelect) {
    reservationPriceList.forEach(route => {
        reservationDestinationSelect.add(new Option(route.destination, route.id));
    });

    reservationDestinationSelect.addEventListener("change", () => {
        const route = reservationPriceList.find(item => item.id === reservationDestinationSelect.value);
        reservationDurationSelect.replaceChildren(new Option(
            route ? "Pilih durasi perjalanan" : "Pilih tujuan terlebih dahulu",
            ""
        ));

        if (route) {
            Object.keys(route.rates).forEach(days => {
                reservationDurationSelect.add(new Option(`${days} Hari`, days));
            });
        }

        reservationDurationSelect.disabled = !route;
        updateReservationPrice();
    });

    [reservationDurationSelect].forEach(input => {
        input?.addEventListener("change", updateReservationPrice);
    });

    reservationForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const nama = document.getElementById("nama").value;
        const tanggal = document.getElementById("tanggal").value;
        const tujuan = document.getElementById("tujuan").value;
        const durasi = document.getElementById("durasi").value;
        const penjemputan = document.getElementById("penjemputan").value;
        const jam = document.getElementById("jam").value;
        const telepon = document.getElementById("telepon").value;
        const harga = document.getElementById("harga").value;
        const route = reservationPriceList.find(item => item.id === tujuan);
        const busPrices = getReservationBusPrices();

        if (!route || !busPrices || !harga) {
            window.alert("Pilih tujuan, durasi, dan harga yang tersedia untuk setiap unit bus.");
            return;
        }

        /* FORMAT TANGGAL */
        const dateObject = new Date(tanggal);
        const options = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        };
        const tanggalFormatted = dateObject.toLocaleDateString("id-ID", options);

        /* PESAN WHATSAPP */
        const message =
`🚌 *PT. AFA WISATA | MSM ASYROF*

📝 *CUSTOMER RESERVASI FORM*

━━━━━━━━━━━━━━━━━━━━

👤 *Nama Pemesan*
${nama}

🗓️ *Hari, Tanggal*
${tanggalFormatted}

🚩 *Lokasi Tujuan*
${route.destination}

🗓️ *Durasi*
${durasi} Hari

🏠 *Lokasi Penjemputan*
${penjemputan}

⏰ *Jam Standby*
${jam}

🚌 *Unit Bus (Seat)*
${busPrices.map(({ bus, unitPrice }, index) => `${index + 1}. ${bus.name} (${bus.seatCount} Seat) — ${formatRupiah(unitPrice)}`).join("\n")}

📝 *Jumlah Unit*
${busPrices.length} Unit

☎️ *No. Telpon*
${telepon}

💰 *Estimasi Harga Total*
${harga}

━━━━━━━━━━━━━━━━━━━━

Mohon informasi ketersediaan unit dan konfirmasi reservasi.

Terima kasih 🙏`;

        /* NOMOR ADMIN & KIRIM */
        const nomorAdmin = "6281298801827"; // Ganti dengan nomor WhatsApp admin Anda
        const whatsappURL = "https://wa.me/" + nomorAdmin + "?text=" + encodeURIComponent(message);

        window.open(whatsappURL, "_blank");
    });
}


/* ================= ANIMASI ANGKA BERGERAK (COUNTER) & RESET KE 0 PER HARI ================= */

document.addEventListener("DOMContentLoaded", function() {
    // 1. Logika Pengunjung Real-Time & Reset ke 0 Per Hari
    const visitorCounterEl = document.querySelector('.counter[data-target="1010"]');
    
    if (visitorCounterEl) {
        const today = new Date().toISOString().slice(0, 10); // Format: YYYY-MM-DD
        const lastVisitDate = localStorage.getItem("msm_visit_date");
        
        // Ambil jumlah pengunjung hari ini, default-nya mulai dari 0 jika belum ada/sudah ganti hari
        let dailyVisitors = parseInt(localStorage.getItem("msm_daily_visitors")) || 0;

        if (lastVisitDate !== today) {
            // Jika sudah berganti hari, reset total pengunjung hari ini menjadi 0 (atau langsung dihitung 1 untuk pengunjung pertama)
            localStorage.setItem("msm_visit_date", today);
            dailyVisitors = 1; // Langsung dihitung 1 untuk pengunjung pertama hari ini
            localStorage.setItem("msm_daily_visitors", dailyVisitors);
            
            // Hapus session storage agar pengunjung baru di hari ini terhitung kembali
            sessionStorage.removeItem("has_visited_today");
        } else {
            // Jika masih hari yang sama dan ini tab/sesi baru browser
            if (!sessionStorage.getItem("has_visited_today")) {
                dailyVisitors += 1; // Tambah 1 pengunjung
                sessionStorage.setItem("has_visited_today", "true");
                localStorage.setItem("msm_daily_visitors", dailyVisitors);
            }
        }

        // Ubah atribut data-target HTML secara otomatis sesuai hitungan harian
        visitorCounterEl.setAttribute('data-target', dailyVisitors);
    }

    // 2. Animasi Counter (Angka Bergerak)
    const counters = document.querySelectorAll('.counter');
    if (counters.length === 0) return;

    let hasAnimated = false;

    function runCounter() {
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target') || 0;
            const duration = 2000; // 2 detik
            const stepTime = 25;   // Kecepatan update ms
            const steps = duration / stepTime;
            const increment = target / steps;
            
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    counter.innerText = target.toLocaleString('id-ID');
                    clearInterval(timer);
                } else {
                    counter.innerText = Math.ceil(current).toLocaleString('id-ID');
                }
            }, stepTime);
        });
    }

    // Deteksi saat section statistik masuk ke area layar (Viewport)
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !hasAnimated) {
                    runCounter();
                    hasAnimated = true;
                }
            });
        }, { threshold: 0.3 });

        observer.observe(statsSection);
    }
});
