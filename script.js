  // =====================================
// DATA LAYANAN SALON
// =====================================

const services = [
    { id: 1, name: "Make Up", price: 150000, image: "makeup.jpg" },
    { id: 2, name: "Hair Styling", price: 75000, image: "hair.jpg" },
    { id: 3, name: "Creambath", price: 60000, image: "creambath.jpg" },
    { id: 4, name: "Pedicure", price: 50000, image: "pedicure.jpg" },
    { id: 5, name: "Manicure", price: 50000, image: "manicure.jpg..webp" },
    { id: 6, name: "Facial", price: 100000, image: "facial.jpg" }
];

let orders = [];
let lastReceipt = "";
let activeTransactionId = null;

// =====================================
// AMBIL RIWAYAT DARI LOCAL STORAGE
// =====================================

function loadHistory() {
    try {
        const saved = localStorage.getItem("salonHistory");
        const parsed = saved ? JSON.parse(saved) : [];

        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

let transactionHistory = loadHistory();

function saveHistory() {
    localStorage.setItem(
        "salonHistory",
        JSON.stringify(transactionHistory)
    );
}

// =====================================
// FUNGSI BANTU
// =====================================

function rupiah(number) {
    return "Rp" + Number(number).toLocaleString("id-ID");
}

function parseMoney(value) {
    return Number(String(value).replace(/\D/g, "")) || 0;
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

// =====================================
// MENAMPILKAN LAYANAN
// =====================================

function renderServices() {
    const container = document.getElementById("serviceList");

    container.innerHTML = services.map(service => `
        <div class="service">
            <img
                src="${service.image}"
                class="service-image"
                alt="${escapeHTML(service.name)}"
                onerror="this.style.display='none'"
            >

            <h3>${escapeHTML(service.name)}</h3>
            <p>${rupiah(service.price)}</p>

            <button onclick="addOrder(${service.id})">
                Tambah Pesanan
            </button>
        </div>
    `).join("");
}

// =====================================
// TAMBAH PESANAN
// =====================================

function addOrder(id) {
    const service = services.find(item => item.id === id);
    if (!service) return;

    const existing = orders.find(item => item.id === id);

    if (existing) {
        existing.qty++;
    } else {
        orders.push({
            id: service.id,
            name: service.name,
            price: service.price,
            qty: 1
        });
    }

    renderOrders();
}

// =====================================
// EDIT PESANAN
// =====================================

function editOrder(id, field, value) {
    const order = orders.find(item => item.id === id);
    if (!order) return;

    if (field === "qty") {
        order.qty = Math.max(1, parseInt(value, 10) || 1);
    }

    if (field === "price") {
        order.price = parseMoney(value);
    }

    renderOrders();
}

// =====================================
// HAPUS PESANAN
// =====================================

function removeOrder(id) {
    orders = orders.filter(item => item.id !== id);
    renderOrders();
}

// =====================================
// HITUNG TOTAL
// =====================================

function getTotals() {
    const subtotal = orders.reduce(
        (sum, item) => sum + item.price * item.qty,
        0
    );

    const discountPercent = Math.min(
        100,
        Math.max(
            0,
            Number(document.getElementById("discount").value) || 0
        )
    );

    const discount = subtotal * discountPercent / 100;
    const total = subtotal - discount;

    return { subtotal, discount, total };
}

// =====================================
// MENAMPILKAN PESANAN
// =====================================

function renderOrders() {
    const container = document.getElementById("orderList");

    if (orders.length === 0) {
        container.innerHTML = "<p>Belum ada pesanan.</p>";
    } else {
        container.innerHTML = orders.map(item => `
            <div class="order-item">
                <div>
                    <b>${escapeHTML(item.name)}</b>
                    <p>Harga: ${rupiah(item.price)}</p>
                </div>

                <label>
                    Jumlah
                    <input
                        type="number"
                        min="1"
                        value="${item.qty}"
                        onchange="editOrder(${item.id}, 'qty', this.value)"
                    >
                </label>

                <label>
                    Edit Harga
                    <input
                        type="text"
                        value="${item.price.toLocaleString('id-ID')}"
                        onchange="editOrder(${item.id}, 'price', this.value)"
                    >
                </label>

                <b>${rupiah(item.price * item.qty)}</b>

                <button class="danger"
                    onclick="removeOrder(${item.id})">
                    Hapus
                </button>
            </div>
        `).join("");
    }

    updateTotals();
}

// =====================================
// UPDATE TOTAL DAN KEMBALIAN
// =====================================

function updateTotals() {
    const { subtotal, discount, total } = getTotals();

    document.getElementById("subtotal").textContent = rupiah(subtotal);
    document.getElementById("discountAmount").textContent = rupiah(discount);
    document.getElementById("total").textContent = rupiah(total);

    const cash = parseMoney(
        document.getElementById("cashReceived").value
    );

    document.getElementById("change").textContent =
        rupiah(Math.max(0, cash - total));
}

// =====================================
// MEMBUAT ISI STRUK
// =====================================

function makeReceipt() {
    const customer =
        document.getElementById("customerName").value.trim()
        || "Pelanggan";

    const { subtotal, discount, total } = getTotals();

    const cash = parseMoney(
        document.getElementById("cashReceived").value
    );

    const details = orders.map(item =>
        `${item.name}\n${item.qty} x ${rupiah(item.price)} = ${rupiah(item.qty * item.price)}`
    ).join("\n\n");

    return `
================================
          SALON CANTIKA
        STRUK PEMBAYARAN
================================
Tanggal: ${new Date().toLocaleString("id-ID")}
Pelanggan: ${customer}

--------------------------------
${details}
--------------------------------
Subtotal: ${rupiah(subtotal)}
Diskon: ${rupiah(discount)}
TOTAL: ${rupiah(total)}
Uang diterima: ${rupiah(cash)}
Kembalian: ${rupiah(cash - total)}
================================
          Terima kasih!
================================
`.trim();
}

// =====================================
// PEMBAYARAN DAN SIMPAN RIWAYAT
// =====================================

document.getElementById("checkoutBtn").addEventListener("click", () => {
    if (orders.length === 0) {
        alert("Tambahkan layanan terlebih dahulu!");
        return;
    }

    const { total } = getTotals();

    const cash = parseMoney(
        document.getElementById("cashReceived").value
    );

    if (cash < total) {
        document.getElementById("paymentMessage").textContent =
            "Uang pembayaran masih kurang!";
        return;
    }

    // Buat ID transaksi yang unik
    const transactionId =
        Date.now().toString() + Math.random().toString(36).slice(2, 7);

    lastReceipt = makeReceipt();
    activeTransactionId = transactionId;

    const customer =
        document.getElementById("customerName").value.trim()
        || "Pelanggan";

    // Simpan transaksi baru ke riwayat
    transactionHistory.unshift({
        id: transactionId,
        date: new Date().toLocaleString("id-ID"),
        customer: customer,
        total: total,
        receipt: lastReceipt
    });

    saveHistory();
    renderHistory();

    document.getElementById("receiptEditor").value = lastReceipt;
    document.getElementById("receiptArea").hidden = false;

    document.getElementById("paymentMessage").textContent =
        "Pembayaran berhasil! Transaksi tersimpan di riwayat.";

    document.getElementById("receiptMessage").textContent = "";
});

// =====================================
// LIHAT STRUK TERAKHIR
// =====================================

document.getElementById("viewReceiptBtn").addEventListener("click", () => {
    if (!lastReceipt) {
        alert("Belum ada struk. Silakan lakukan pembayaran.");
        return;
    }

    document.getElementById("receiptEditor").value = lastReceipt;
    document.getElementById("receiptArea").hidden = false;
});

// =====================================
// SIMPAN EDITAN STRUK
// =====================================

document.getElementById("saveReceiptBtn").addEventListener("click", () => {
    const edited = document.getElementById("receiptEditor").value.trim();

    if (!edited) {
        alert("Isi struk tidak boleh kosong!");
        return;
    }

    lastReceipt = edited;

    const transaction = transactionHistory.find(
        item => item.id === activeTransactionId
    );

    if (transaction) {
        transaction.receipt = edited;
        saveHistory();
        renderHistory();
    }

    document.getElementById("receiptMessage").textContent =
        "Perubahan struk berhasil disimpan!";
});

// =====================================
// HAPUS ISI STRUK
// =====================================

document.getElementById("deleteReceiptBtn").addEventListener("click", () => {
    if (!lastReceipt) return;

    if (!confirm("Yakin ingin menghapus isi struk ini?")) return;

    const transaction = transactionHistory.find(
        item => item.id === activeTransactionId
    );

    if (transaction) {
        transaction.receipt = "";
        saveHistory();
        renderHistory();
    }

    lastReceipt = "";
    document.getElementById("receiptEditor").value = "";
    document.getElementById("receiptArea").hidden = true;
    document.getElementById("receiptMessage").textContent =
        "Isi struk dihapus. Data transaksi tetap ada di riwayat.";
});

// =====================================
// DOWNLOAD STRUK
// =====================================

document.getElementById("downloadReceiptBtn").addEventListener("click", () => {
    const receipt = document.getElementById("receiptEditor").value.trim();

    if (!receipt) {
        alert("Tidak ada isi struk untuk diunduh!");
        return;
    }

    const blob = new Blob([receipt], {
        type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "struk-salon.txt";
    link.click();

    URL.revokeObjectURL(url);
});

// =====================================
// TAMPILKAN RIWAYAT TRANSAKSI
// =====================================

function renderHistory() {
    const container = document.getElementById("historyList");

    if (transactionHistory.length === 0) {
        container.innerHTML = "<p>Belum ada riwayat transaksi.</p>";
        return;
    }

    container.innerHTML = transactionHistory.map(item => `
        <div class="history-item">
            <h3>Transaksi #${escapeHTML(item.id)}</h3>

            <p>Tanggal: ${escapeHTML(item.date)}</p>
            <p>Pelanggan: ${escapeHTML(item.customer)}</p>
            <p>Total: <b>${rupiah(item.total)}</b></p>

            <div class="history-actions">
                ${
                    item.receipt
                    ? `<button onclick="viewHistory('${item.id}')">
                           Lihat / Edit Struk
                       </button>`
                    : `<p>Isi struk sudah dihapus.</p>`
                }

                <button class="danger"
                    onclick="deleteHistory('${item.id}')">
                    Hapus Riwayat
                </button>
            </div>
        </div>
    `).join("");
}

// =====================================
// LIHAT STRUK DARI RIWAYAT LAMA
// =====================================

function viewHistory(id) {
    const transaction = transactionHistory.find(
        item => item.id === id
    );

    if (!transaction) return;

    if (!transaction.receipt) {
        alert("Isi struk transaksi ini sudah dihapus.");
        return;
    }

    activeTransactionId = transaction.id;
    lastReceipt = transaction.receipt;

    document.getElementById("receiptEditor").value =
        transaction.receipt;

    document.getElementById("receiptArea").hidden = false;

    document.getElementById("receiptArea").scrollIntoView({
        behavior: "smooth"
    });
}

// =====================================
// HAPUS RIWAYAT TRANSAKSI
// =====================================

function deleteHistory(id) {
    if (!confirm("Yakin ingin menghapus riwayat transaksi ini?")) {
        return;
    }

    transactionHistory = transactionHistory.filter(
        item => item.id !== id
    );

    saveHistory();
    renderHistory();

    if (activeTransactionId === id) {
        activeTransactionId = null;
        lastReceipt = "";

        document.getElementById("receiptEditor").value = "";
        document.getElementById("receiptArea").hidden = true;
    }
}

// =====================================
// RESET PESANAN SAAT INI
// RIWAYAT TIDAK IKUT DIHAPUS
// =====================================

document.getElementById("resetBtn").addEventListener("click", () => {
    if (!confirm("Reset pesanan yang sedang dibuat?")) return;

    orders = [];

    document.getElementById("customerName").value = "";
    document.getElementById("discount").value = 0;
    document.getElementById("cashReceived").value = "";
    document.getElementById("paymentMessage").textContent = "";

    renderOrders();

    // Riwayat transaksi sengaja tidak dihapus.
});

// =====================================
// EVENT INPUT
// =====================================

document.getElementById("discount").addEventListener(
    "input",
    updateTotals
);

document.getElementById("cashReceived").addEventListener(
    "input",
    updateTotals
);

// =====================================
// TAMPILKAN SEMUA DATA SAAT DIBUKA
// =====================================

renderServices();
renderOrders();
renderHistory();