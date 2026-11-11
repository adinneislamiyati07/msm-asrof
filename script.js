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
const reservationBusSelect = document.getElementById("bus");
const requestedSeat = new URLSearchParams(window.location.search).get("seat");

if (reservationBusSelect && requestedSeat) {
    const seatOption = Array.from(reservationBusSelect.options)
        .find(option => option.value === `Bus ${requestedSeat} Seat`);
    if (seatOption) {
        reservationBusSelect.value = seatOption.value;
    }
}

if (reservationForm) {
    reservationForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const nama = document.getElementById("nama").value;
        const tanggal = document.getElementById("tanggal").value;
        const tujuan = document.getElementById("tujuan").value;
        const penjemputan = document.getElementById("penjemputan").value;
        const jam = document.getElementById("jam").value;
        const bus = document.getElementById("bus").value;
        const jumlah = document.getElementById("jumlah").value;
        const telepon = document.getElementById("telepon").value;
        const harga = document.getElementById("harga").value;

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
${tujuan}

🏠 *Lokasi Penjemputan*
${penjemputan}

⏰ *Jam Standby*
${jam}

🚌 *Unit Bus (Seat)*
${bus}

📝 *Jumlah Unit*
${jumlah} Unit

☎️ *No. Telpon*
${telepon}

🎟️ *Harga*
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


/* ================= ANIMASI ANGKA BERGERAK (COUNTER) ================= */

document.addEventListener("DOMContentLoaded", function() {
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