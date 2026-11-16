import { db, auth } from "./firebase.js";
import { collection, getDocs, doc, getDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const tableBody = document.getElementById("reservationTableBody");
const totalReservasiBadge = document.getElementById("totalReservasi");
const logoutBtn = document.getElementById("logoutBtn");
const exportPeriodSelect = document.getElementById("exportPeriod");
const exportReferenceInput = document.getElementById("exportReference");
const exportReferenceLabel = document.getElementById("exportReferenceLabel");
const exportButton = document.getElementById("exportButton");
const exportStatus = document.getElementById("exportStatus");
let reservationRecords = [];
let exportDataLoaded = false;

function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDateLabel(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function getExportRange() {
    const period = exportPeriodSelect.value;
    const reference = exportReferenceInput.value;
    if (!reference) return null;

    if (period === "week") {
        const selectedDate = new Date(`${reference}T12:00:00`);
        if (Number.isNaN(selectedDate.getTime())) return null;
        const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        const startKey = formatLocalDate(start);
        const endKey = formatLocalDate(end);
        const lastDay = new Date(end);
        lastDay.setDate(lastDay.getDate() - 1);
        return {
            startKey,
            endKey,
            label: `${formatDateLabel(startKey)} – ${formatDateLabel(formatLocalDate(lastDay))}`,
            fileLabel: `mingguan-${startKey}-sd-${formatLocalDate(lastDay)}`
        };
    }

    if (period === "month") {
        const match = reference.match(/^(\d{4})-(\d{2})$/);
        if (!match) return null;
        const year = Number(match[1]);
        const month = Number(match[2]);
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);
        if (start.getMonth() !== month - 1 || start.getFullYear() !== year) return null;
        return {
            startKey: formatLocalDate(start),
            endKey: formatLocalDate(end),
            label: start.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
            fileLabel: `bulanan-${year}-${match[2]}`
        };
    }

    if (period === "year") {
        if (!/^\d{4}$/.test(reference)) return null;
        const year = Number(reference);
        if (year < 1900 || year > 9999) return null;
        return {
            startKey: `${year}-01-01`,
            endKey: `${year + 1}-01-01`,
            label: String(year),
            fileLabel: `tahunan-${year}`
        };
    }

    return null;
}

function updateExportControls() {
    const period = exportPeriodSelect.value;
    exportReferenceInput.removeAttribute("min");
    exportReferenceInput.removeAttribute("max");
    exportReferenceInput.removeAttribute("step");
    if (period === "week") {
        exportReferenceLabel.textContent = "Pilih tanggal";
        exportReferenceInput.type = "date";
        exportReferenceInput.value = formatLocalDate(new Date());
    } else if (period === "month") {
        exportReferenceLabel.textContent = "Pilih bulan";
        exportReferenceInput.type = "month";
        exportReferenceInput.value = formatLocalDate(new Date()).slice(0, 7);
    } else {
        exportReferenceLabel.textContent = "Pilih tahun";
        exportReferenceInput.type = "number";
        exportReferenceInput.min = "1900";
        exportReferenceInput.max = "9999";
        exportReferenceInput.step = "1";
        exportReferenceInput.value = String(new Date().getFullYear());
    }
    updateExportStatus();
}

function getRecordsForRange(range) {
    return reservationRecords.filter(reservation => {
        const createdAt = reservation.createdAt?.toDate?.();
        if (!(createdAt instanceof Date) || Number.isNaN(createdAt.getTime())) return false;
        const createdDate = formatLocalDate(createdAt);
        return createdDate >= range.startKey && createdDate < range.endKey;
    });
}

function updateExportStatus() {
    if (!exportDataLoaded) return;
    const range = getExportRange();
    if (!range) {
        exportStatus.textContent = "Pilih periode yang valid untuk menyiapkan laporan.";
        exportButton.disabled = true;
        return;
    }
    const total = getRecordsForRange(range).length;
    exportStatus.textContent = total
        ? `${total} reservasi ditemukan untuk periode ${range.label}.`
        : `Belum ada reservasi dibuat pada periode ${range.label}.`;
    exportButton.disabled = total === 0;
}

function excelDateSerial(date) {
    return Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
    ) / 86400000 + 25569;
}

function getReservationBuses(reservation) {
    if (Array.isArray(reservation.buses)) return reservation.buses.join(", ");
    if (Array.isArray(reservation.busUnits)) {
        return reservation.busUnits.map(unit => `MSM ${String(unit).padStart(3, "0")}`).join(", ");
    }
    return "";
}

function exportReservations() {
    const range = getExportRange();
    if (!range) {
        exportStatus.textContent = "Pilih periode yang valid sebelum mengekspor.";
        return;
    }

    const records = getRecordsForRange(range);
    if (records.length === 0) {
        exportStatus.textContent = `Belum ada reservasi dibuat pada periode ${range.label}.`;
        return;
    }
    if (!window.XLSX?.utils || typeof window.XLSX.writeFile !== "function") {
        console.error("Library Excel belum berhasil dimuat.");
        exportStatus.textContent = "Fitur Excel belum siap. Periksa koneksi internet lalu muat ulang halaman.";
        return;
    }

    const headers = [
        "No.",
        "Waktu reservasi dibuat",
        "Nama pemesan",
        "Nomor telepon",
        "Tanggal perjalanan",
        "Tujuan",
        "Durasi (hari)",
        "Jam jemput",
        "Lokasi penjemputan",
        "Unit bus",
        "Jumlah unit",
        "Estimasi harga (Rp)",
        "Status"
    ];
    const rows = records.map((reservation, index) => {
        const createdAt = reservation.createdAt.toDate();
        const tripDate = reservation.tanggal
            ? new Date(`${reservation.tanggal}T12:00:00`)
            : null;
        const buses = getReservationBuses(reservation);
        const busCount = Array.isArray(reservation.busUnits)
            ? reservation.busUnits.length
            : Array.isArray(reservation.buses) ? reservation.buses.length : 0;
        const duration = Number(String(reservation.durasi).match(/\d+/)?.[0]) || 0;
        const price = Number(String(reservation.harga || "").replace(/[^\d]/g, "")) || 0;

        return [
            index + 1,
            excelDateSerial(createdAt),
            reservation.nama || "",
            reservation.telepon || "",
            tripDate && !Number.isNaN(tripDate.getTime()) ? excelDateSerial(tripDate) : "",
            reservation.tujuan || "",
            duration,
            reservation.jam || "",
            reservation.penjemputan || "",
            buses,
            busCount,
            price,
            reservation.status || "pending"
        ];
    });

    const lastColumn = headers.length - 1;
    const worksheet = window.XLSX.utils.aoa_to_sheet([
        ["LAPORAN RESERVASI MSM ASYROF"],
        [`Periode: ${range.label} | Berdasarkan waktu reservasi dibuat`],
        [],
        headers,
        ...rows
    ]);
    worksheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: lastColumn } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: lastColumn } }
    ];
    worksheet["!cols"] = [
        { wch: 7 }, { wch: 23 }, { wch: 25 }, { wch: 18 }, { wch: 20 },
        { wch: 42 }, { wch: 14 }, { wch: 13 }, { wch: 30 }, { wch: 36 },
        { wch: 13 }, { wch: 22 }, { wch: 15 }
    ];
    worksheet["!rows"] = [{ hpt: 30 }, { hpt: 22 }, { hpt: 8 }, { hpt: 28 }];
    worksheet["!autofilter"] = {
        ref: `A4:${window.XLSX.utils.encode_col(lastColumn)}${rows.length + 4}`
    };

    const titleStyle = {
        fill: { patternType: "solid", fgColor: { rgb: "172436" } },
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 16 },
        alignment: { vertical: "center", horizontal: "left", indent: 1 }
    };
    const subtitleStyle = {
        fill: { patternType: "solid", fgColor: { rgb: "F8F2E6" } },
        font: { color: { rgb: "725722" }, italic: true, sz: 10 },
        alignment: { vertical: "center", horizontal: "left", indent: 1 }
    };
    const headerStyle = {
        fill: { patternType: "solid", fgColor: { rgb: "263951" } },
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
        alignment: { vertical: "center", horizontal: "center", wrapText: true },
        border: { bottom: { style: "medium", color: { rgb: "D7AE5B" } } }
    };
    const edgeStyle = {
        style: "thin",
        color: { rgb: "E6EAF0" }
    };
    const titleRowStyle = rowIndex => rowIndex === 0 ? titleStyle : subtitleStyle;
    for (let column = 0; column <= lastColumn; column++) {
        [0, 1].forEach(rowIndex => {
            const address = window.XLSX.utils.encode_cell({ r: rowIndex, c: column });
            worksheet[address] = worksheet[address] || { t: "s", v: "" };
            worksheet[address].s = titleRowStyle(rowIndex);
        });

        const headerAddress = window.XLSX.utils.encode_cell({ r: 3, c: column });
        worksheet[headerAddress].s = headerStyle;
    }

    rows.forEach((_, index) => {
        const rowIndex = index + 4;
        const rowFill = index % 2 === 0 ? "FFFFFF" : "F7F9FB";
        for (let column = 0; column <= lastColumn; column++) {
            const address = window.XLSX.utils.encode_cell({ r: rowIndex, c: column });
            const cell = worksheet[address] || { t: "s", v: "" };
            worksheet[address] = cell;
            cell.s = {
                fill: { patternType: "solid", fgColor: { rgb: rowFill } },
                font: { color: { rgb: "26364A" }, sz: 10 },
                alignment: { vertical: "center", wrapText: true },
                border: { bottom: edgeStyle }
            };
        }

        const createdAtCell = worksheet[window.XLSX.utils.encode_cell({ r: rowIndex, c: 1 })];
        createdAtCell.z = "dd mmm yyyy hh:mm";
        const tripDateCell = worksheet[window.XLSX.utils.encode_cell({ r: rowIndex, c: 4 })];
        if (tripDateCell.v !== undefined && tripDateCell.v !== "") {
            tripDateCell.z = "dd mmm yyyy";
        }
        const priceCell = worksheet[window.XLSX.utils.encode_cell({ r: rowIndex, c: 11 })];
        priceCell.z = '"Rp" #,##0';
    });

    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, "Reservasi");
    window.XLSX.writeFile(workbook, `reservasi-${range.fileLabel}.xlsx`);
    exportStatus.textContent = `${records.length} reservasi berhasil diekspor untuk periode ${range.label}.`;
}

exportPeriodSelect.addEventListener("change", updateExportControls);
exportReferenceInput.addEventListener("change", updateExportStatus);
exportReferenceInput.addEventListener("input", updateExportStatus);
exportButton.addEventListener("click", exportReservations);
updateExportControls();

function getAvailabilityData(reservation) {
    const units = Array.isArray(reservation.busUnits) && reservation.busUnits.length
        ? reservation.busUnits
        : (Array.isArray(reservation.buses) ? reservation.buses : []);
    const busUnits = [...new Set(units.map(unit => {
        const match = String(unit).match(/\d+/);
        return match ? String(Number(match[0])) : "";
    }).filter(Boolean))];
    const durationDays = Number(String(reservation.durasi).match(/\d+/)?.[0]);

    if (!reservation.tanggal || !busUnits.length || !Number.isFinite(durationDays) || durationDays < 1) {
        return null;
    }

    return {
        busUnits,
        tanggal: reservation.tanggal,
        durasi: durationDays
    };
}

async function syncBusAvailability(reservationDocs) {
    const approvedReservations = new Map(
        reservationDocs
            .filter(reservationSnapshot => reservationSnapshot.data().status === "approved")
            .map(reservationSnapshot => [
                reservationSnapshot.id,
                getAvailabilityData(reservationSnapshot.data())
            ])
            .filter(([, availability]) => availability)
    );
    const currentAvailability = await getDocs(collection(db, "busAvailability"));
    const currentById = new Map(currentAvailability.docs.map(snapshot => [snapshot.id, snapshot]));
    const operations = [];

    approvedReservations.forEach((availability, id) => {
        const existing = currentById.get(id)?.data();
        const sameUnits = existing &&
            [...(existing.busUnits || [])].map(String).sort().join(",") ===
            [...availability.busUnits].sort().join(",");
        if (!sameUnits || existing.tanggal !== availability.tanggal ||
            Number(existing.durasi) !== availability.durasi) {
            operations.push({ type: "set", ref: doc(db, "busAvailability", id), data: availability });
        }
    });

    currentAvailability.docs.forEach(snapshot => {
        if (!approvedReservations.has(snapshot.id)) {
            operations.push({ type: "delete", ref: snapshot.ref });
        }
    });

    for (let offset = 0; offset < operations.length; offset += 450) {
        const batch = writeBatch(db);
        operations.slice(offset, offset + 450).forEach(operation => {
            if (operation.type === "set") {
                batch.set(operation.ref, operation.data);
            } else {
                batch.delete(operation.ref);
            }
        });
        await batch.commit();
    }
}

// 1. Cek Autentikasi / Sesi Admin secara Real-time
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Jika admin belum login, tendang ke halaman login
        window.location.href = "login.html";
    } else {
        // Jika sudah login, muat data reservasi
        loadReservations();
    }
});

// 2. Fungsi Tombol Logout
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.href = "login.html";
        } catch (error) {
            console.error("Gagal logout:", error);
            alert("Terjadi kesalahan saat logout.");
        }
    });
}

// 3. Fungsi untuk memuat data reservasi dari Firestore
async function loadReservations() {
    try {
        const querySnapshot = await getDocs(collection(db, "reservations"));
        await syncBusAvailability(querySnapshot.docs);
        const reservationDocs = [...querySnapshot.docs].sort((first, second) => {
            const firstTime = first.data().createdAt?.toMillis?.() || 0;
            const secondTime = second.data().createdAt?.toMillis?.() || 0;
            return secondTime - firstTime;
        });
        reservationRecords = reservationDocs.map(documentSnapshot => ({
            ...documentSnapshot.data(),
            id: documentSnapshot.id
        }));
        exportDataLoaded = true;
        updateExportStatus();

        tableBody.innerHTML = "";
        let total = querySnapshot.size;
        totalReservasiBadge.innerText = `Total: ${total}`;

        if (total === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-gray-400">Belum ada data reservasi masuk.</td></tr>`;
            return;
        }

        reservationDocs.forEach((documentSnapshot) => {
            const data = documentSnapshot.data();
            const id = documentSnapshot.id;

            // Format tanggal pembuatan jika ada
            let waktuPesan = "-";
            if (data.createdAt && data.createdAt.toDate) {
                waktuPesan = data.createdAt.toDate().toLocaleString("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short"
                });
            }

            // Badge status styling
            let statusBadge = "";
            if (data.status === "approved") {
                statusBadge = `<span class="status-badge is-approved">Approved</span>`;
            } else if (data.status === "rejected") {
                statusBadge = `<span class="status-badge is-rejected">Rejected</span>`;
            } else {
                statusBadge = `<span class="status-badge is-pending">Pending</span>`;
            }

            // Susun list bus
            const listBusHtml = data.buses ? data.buses.map(b => `<div class="text-xs">• ${b}</div>`).join("") : "-";

            const row = document.createElement("tr");
            row.innerHTML = `
                <td class="reservation-cell reservation-time" data-label="Waktu pesan">${waktuPesan}</td>
                <td class="reservation-cell reservation-customer" data-label="Pemesan">
                    ${data.nama}<br>
                    <a href="https://wa.me/${data.telepon}" target="_blank" rel="noopener noreferrer" class="reservation-phone">📞 ${data.telepon}</a>
                </td>
                <td class="reservation-cell reservation-destination" data-label="Tujuan &amp; durasi">
                    <div><strong>${data.tujuan}</strong><br>${data.durasi} Hari</div>
                </td>
                <td class="reservation-cell reservation-schedule" data-label="Jadwal &amp; jemput">
                    <div>📅 ${data.tanggal}<br>Jam: ${data.jam}<br>Jemput: ${data.penjemputan}</div>
                </td>
                <td class="reservation-cell reservation-buses" data-label="Unit bus">${listBusHtml}</td>
                <td class="reservation-cell reservation-price" data-label="Total harga">${data.harga}</td>
                <td class="reservation-cell reservation-status" data-label="Status">${statusBadge}</td>
                <td class="reservation-cell reservation-action-cell" data-label="Aksi">
                    <div class="reservation-actions">
                        <button type="button" onclick="updateStatus('${id}', 'approved')" class="action-button action-approve">Setujui</button>
                        <button type="button" onclick="updateStatus('${id}', 'rejected')" class="action-button action-reject">Tolak</button>
                        <button type="button" onclick="hapusReservasi('${id}')" class="action-button action-delete">Hapus</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Gagal memuat reservasi: ", error);
        exportDataLoaded = false;
        exportButton.disabled = true;
        exportStatus.textContent = "Data reservasi gagal dimuat. Laporan Excel belum tersedia.";
        tableBody.innerHTML = `<tr><td colspan="8" class="empty-state is-error">Gagal memuat data dari database.</td></tr>`;
    }
}

// Fungsi global untuk mengubah status reservasi
window.updateStatus = async function(id, statusBuku) {
    try {
        if (!["approved", "rejected"].includes(statusBuku)) {
            throw new Error(`Status reservasi tidak valid: ${statusBuku}`);
        }

        const reservationRef = doc(db, "reservations", id);
        const reservationSnapshot = await getDoc(reservationRef);
        if (!reservationSnapshot.exists()) {
            throw new Error("Reservasi tidak ditemukan.");
        }

        const availabilityRef = doc(db, "busAvailability", id);
        const batch = writeBatch(db);
        batch.update(reservationRef, { status: statusBuku });
        if (statusBuku === "approved") {
            const availability = getAvailabilityData(reservationSnapshot.data());
            if (!availability) {
                throw new Error("Data unit, tanggal, atau durasi reservasi tidak valid.");
            }
            batch.set(availabilityRef, availability);
        } else {
            batch.delete(availabilityRef);
        }
        await batch.commit();
        alert(`Status reservasi berhasil diubah menjadi ${statusBuku}!`);
        loadReservations(); // Refresh tabel
    } catch (error) {
        console.error("Gagal update status: ", error);
        alert("Terjadi kesalahan saat mengubah status.");
    }
}

// Fungsi global untuk menghapus data reservasi
window.hapusReservasi = async function(id) {
    if (confirm("Apakah Anda yakin ingin menghapus data reservasi ini?")) {
        try {
            const batch = writeBatch(db);
            batch.delete(doc(db, "reservations", id));
            batch.delete(doc(db, "busAvailability", id));
            await batch.commit();
            alert("Reservasi berhasil dihapus.");
            loadReservations(); // Refresh tabel
        } catch (error) {
            console.error("Gagal menghapus: ", error);
            alert("Terjadi kesalahan saat menghapus data.");
        }
    }
}
