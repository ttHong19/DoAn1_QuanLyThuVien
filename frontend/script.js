"use strict";

/* =====================================================
   1. ket noi voi bang sach mysql
===================================================== */

let books = [];

async function fetchBooks() {
  try {
    const res = await fetch(API_BOOKS);
    books = await res.json();
    renderBooks();
    updateDashboard();
  } catch (err) {
    console.error(err);
    notify("Chưa kết nối được Backend Java (cổng 8080)!", false);
  }
}
/* =====================================================
   2. ket noi voi bang doc gia mysql
===================================================== */
// const API_LOANS = "http://localhost:8080/api/loans";
const BASE_API =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:8080"
    : " https://mercy-urls-stopped-blue.trycloudflare.com";

const API_BOOKS = `${BASE_API}/api/books`;
const API_READERS = `${BASE_API}/api/readers`;
const API_LOANS = `${BASE_API}/api/loans`;
const API_AUTHORS = `${BASE_API}/api/authors`;
const API_LOAN_DETAILS = `${BASE_API}/api/loan-details`;

let readers = [];

async function fetchReaders() {
  try {
    const res = await fetch(API_READERS);
    readers = await res.json();
    renderReaders();
    updateDashboard();
  } catch (err) {
    console.error("Lỗi tải danh sách độc giả:", err);
  }
}

let loans = [];
let loanFilter = "all";

let authors = [];

async function fetchAuthors() {
  try {
    const res = await fetch(API_AUTHORS);
    authors = await res.json();
  } catch (err) {
    console.error("Lỗi tải danh sách tác giả:", err);
  }
}

async function fetchLoans() {
  try {
    const res = await fetch(API_LOANS);
    loans = await res.json();
    renderLoans();
    updateDashboard();
  } catch (err) {
    console.error("Lỗi tải danh sách phiếu mượn:", err);
  }
}

let loanDetails = [];

async function fetchLoanDetails() {
  try {
    const res = await fetch(API_LOAN_DETAILS);
    loanDetails = await res.json();
    renderDashboardLoanDetails();
  } catch (err) {
    console.error("Lỗi tải chi tiết mượn:", err);
  }
}

function renderDashboardLoanDetails() {
  const tbody = $("#loanTableBody");
  if (!tbody) return;

  if (!loanDetails.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-icon">
              <i class="fa-solid fa-box-open"></i>
            </div>
            <p>Hiện tại chưa có dữ liệu chi tiết mượn.</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = loanDetails
    .map(
      (item) => `
        <tr>
          <td><strong>${escapeHTML(item.loanId)}</strong></td>
          <td>${escapeHTML(item.bookId)}</td>
          <td>${escapeHTML(item.bookName)}</td>
          <td>${item.quantity}</td>
          <td>${escapeHTML(item.returnDate || "—")}</td>
          <td>
            <span style="
              padding: 3px 9px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 600;
              background: ${item.status === "Đã trả" ? "#e6f7f1" : "#fff4e5"};
              color: ${item.status === "Đã trả" ? "#19aa78" : "#e67e22"};
            ">
              ${escapeHTML(item.status)}
            </span>
          </td>
        </tr>
      `,
    )
    .join("");
}

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/* =====================================================
   2. HÀM HỖ TRỢ
===================================================== */

function escapeHTML(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}

function today() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function generateAutoId(prefix, list) {
  const datePart = today().replaceAll("-", ""); // VD: "20261117"
  const pattern = `${prefix}-${datePart}-`;

  let maxStt = 0;
  list.forEach((item) => {
    const id = String(item.id || "");
    if (id.startsWith(pattern)) {
      const stt = parseInt(id.slice(pattern.length), 10);
      if (!isNaN(stt) && stt > maxStt) {
        maxStt = stt;
      }
    }
  });

  const nextStt = String(maxStt + 1).padStart(3, "0"); // 1 -> "001", 2 -> "002"
  return `${pattern}${nextStt}`;
}

function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function notify(message, success = true) {
  let toast = $("#libraryToast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "libraryToast";
    document.body.appendChild(toast);
  }

  Object.assign(toast.style, {
    position: "fixed",
    right: "24px",
    bottom: "24px",
    padding: "14px 20px",
    borderRadius: "9px",
    color: "#fff",
    background: success ? "#198754" : "#dc3545",
    boxShadow: "0 6px 24px #0002",
    zIndex: "30000",
    fontSize: "14px",
  });

  toast.textContent = message;

  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => toast.remove(), 2800);
}

/* =====================================================
   3. CHUYỂN TRANG - SIDEBAR - XEM CHI TIẾT
===================================================== */

const pageTitles = {
  home: "Trang chủ",
  books: "Quản lý sách",
  readers: "Quản lý độc giả",
  borrow: "Mượn - Trả",
  search: "Tra cứu",
  account: "Thông tin tài khoản",
  settings: "Cài đặt",
};

function showPage(pageName) {
  if (!pageTitles[pageName]) return;

  $$(".page").forEach((page) => {
    page.classList.toggle("active-page", page.id === "page-" + pageName);
  });

  $$(".menu-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.page === pageName);
  });

  const title = $("#topTitle");

  if (title) {
    title.textContent = pageTitles[pageName];
  }

  // Đóng menu trên thiết bị di động sau khi chọn trang
  if (window.innerWidth <= 800) {
    $(".sidebar")?.classList.remove("open");
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =====================================================
   4. THỐNG KÊ TRANG CHỦ
===================================================== */

function updateDashboard() {
  const totalBooks = books.reduce(
    (sum, book) => sum + Number(book.quantity || 0),
    0,
  );

  const totalReaders = readers.length;

  const activeLoans = loans.filter((loan) => loan.status === "Đang mượn");

  const borrowedBooks = activeLoans.reduce(
    (sum, loan) =>
      sum +
      loan.items.reduce((count, item) => count + Number(item.quantity || 0), 0),
    0,
  );

  const returnedLoans = loans.filter((loan) => loan.status === "Đã trả");

  const returnedBooks = returnedLoans.reduce(
    (sum, loan) =>
      sum +
      loan.items.reduce((count, item) => count + Number(item.quantity || 0), 0),
    0,
  );

  const values = {
    totalBooks,
    totalReaders,
    borrowedBooks,
    returnedBooks,
    loanSlips: loans.length,
    systemBooks: totalBooks,
    systemReaders: totalReaders,
    systemBorrowed: borrowedBooks,
    systemLoans: loans.length,
  };

  Object.entries(values).forEach(([id, value]) => {
    const element = $("#" + id);
    if (element) element.textContent = value;
  });
}

/* =====================================================
   5. FORM THÊM - SỬA DÙNG CHUNG
===================================================== */

function openModal({ title, fields, initial = {}, onSubmit }) {
  $("#libraryModal")?.remove();

  const modal = document.createElement("div");
  modal.id = "libraryModal";

  Object.assign(modal.style, {
    position: "fixed",
    inset: "0",
    zIndex: "20000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "18px",
    background: "rgba(18,34,51,.62)",
  });

  const dialog = document.createElement("div");

  Object.assign(dialog.style, {
    width: "100%",
    maxWidth: "620px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxSizing: "border-box",
    padding: "26px",
    borderRadius: "14px",
    background: "#fff",
    color: "#263b4b",
    boxShadow: "0 22px 70px #0003",
  });

  const heading = document.createElement("h2");
  heading.textContent = title;
  heading.style.marginTop = "0";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "×";
  closeButton.setAttribute("aria-label", "Đóng");

  Object.assign(closeButton.style, {
    float: "right",
    border: "0",
    background: "transparent",
    fontSize: "28px",
    cursor: "pointer",
  });

  closeButton.onclick = () => modal.remove();

  const form = document.createElement("form");
  const grid = document.createElement("div");

  Object.assign(grid.style, {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "15px",
  });

  fields.forEach((field) => {
    const wrapper = document.createElement("div");

    Object.assign(wrapper.style, {
      display: "flex",
      flexDirection: "column",
      gap: "7px",
    });

    const label = document.createElement("label");
    label.textContent = field.label;
    label.htmlFor = "modal-" + field.name;
    label.style.fontWeight = "600";

    const input = document.createElement("input");
    input.id = label.htmlFor;
    input.name = field.name;
    input.type = field.type || "text";
    input.value = initial[field.name] ?? field.defaultValue ?? "";
    input.required = field.required !== false;
    input.placeholder = field.placeholder || "";

    if (field.min !== undefined) input.min = field.min;
    if (field.max !== undefined) input.max = field.max;
    if (field.step !== undefined) input.step = field.step;
    if (field.readonly) input.readOnly = true;

    Object.assign(input.style, {
      boxSizing: "border-box",
      width: "100%",
      padding: "11px",
      border: "1px solid #d7e1eb",
      borderRadius: "8px",
      fontSize: "14px",
    });

    wrapper.append(label, input);
    grid.appendChild(wrapper);
  });

  const actions = document.createElement("div");

  Object.assign(actions.style, {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "24px",
  });

  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "Hủy";
  cancel.onclick = () => modal.remove();

  const save = document.createElement("button");
  save.type = "submit";
  save.textContent = "Lưu";
  save.style.background = "#1685df";
  save.style.color = "#fff";

  [cancel, save].forEach((button) => {
    Object.assign(button.style, {
      padding: "11px 22px",
      border: "0",
      borderRadius: "22px",
      cursor: "pointer",
    });
  });

  actions.append(cancel, save);
  form.append(grid, actions);
  dialog.append(closeButton, heading, form);
  modal.appendChild(dialog);
  document.body.appendChild(modal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.remove();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());

    const result = await onSubmit(data);

    if (result !== false) modal.remove();
  });

  $("input", form)?.focus();
}

/* =====================================================
   6. QUẢN LÝ SÁCH
===================================================== */

function renderBooks(keyword = $("#bookSearch")?.value || "") {
  const term = keyword.trim().toLowerCase();

  // SỬA DÒNG NÀY: Thêm book.authorId để gõ "TG001" cũng tìm ra sách
  const rows = books.filter((book) =>
    [book.id, book.name, book.author, book.authorId, book.publisher, book.category].some(
      (value) => String(value || "").toLowerCase().includes(term),
    ),
  );

  const count = $("#bookCount");
  if (count) count.textContent = `${books.length} đầu sách`;

  const table = $("#bookTable");
  if (!table) return;

  table.innerHTML = `
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;min-width:700px">
        <thead>
          <tr>
            <th>Mã sách</th>
            <th>Tên sách</th>
            <th>Tác giả</th>
            <th>Nhà xuất bản</th>
            <th>Năm XB</th>
            <th>Thể loại</th>
            <th>Số lượng</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${
            rows.length
              ? rows
                  .map(
                    (book) => `
                      <tr>
                        <td>${escapeHTML(book.id)}</td>
                        <td>${escapeHTML(book.name)}</td>
                        <!-- SỬA DÒNG NÀY: Hiện kèm (TG001) ngay cạnh tên tác giả -->
                        <td>${escapeHTML(book.author)} <small style="color:#738593">(${escapeHTML(book.authorId || "")})</small></td>
                        <td>${escapeHTML(book.publisher)}</td>
                        <td>${book.year}</td>
                        <td>${escapeHTML(book.category)}</td>
                        <td>${book.quantity}</td>
                        <td>
                          <button
                            class="btn-edit"
                            data-action="edit-book"
                            data-id="${escapeHTML(book.id)}"
                            title="Sửa sách"
                            aria-label="Sửa sách"
                          >
                            <i class="fa-regular fa-pen-to-square"></i>
                          </button>

                          <button
                            class="btn-delete"
                            data-action="delete-book"
                            data-id="${escapeHTML(book.id)}"
                            title="Xóa sách"
                            aria-label="Xóa sách"
                          >
                            <i class="fa-regular fa-trash-can"></i>
                          </button>
                        </td>
                      </tr>
                    `,
                  )
                  .join("")
              : `
                  <tr>
                    <td colspan="8" style="text-align:center;padding:25px">
                      Không có sách phù hợp.
                    </td>
                  </tr>
                `
          }
        </tbody>
      </table>
    </div>`;
}

function openBookForm(book = null) {
  const autoId = book ? book.id : generateAutoId("S", books);
  const autoAuthorId = book ? book.authorId : generateAutoId("TG", authors);

  openModal({
    title: book ? "Sửa thông tin sách" : "Thêm sách mới",
    initial: book
      ? { ...book, authorId: autoAuthorId }
      : {
          id: autoId,
          authorId: autoAuthorId,
          year: new Date().getFullYear(),
          quantity: 1,
        },
    fields: [
      { name: "id", label: "Mã sách (Tự động)", readonly: true },
      { name: "name", label: "Tên sách" },
      { name: "authorId", label: "Mã tác giả (Tự động)", readonly: true },
      { name: "author", label: "Tên tác giả" },
      { name: "publisher", label: "Nhà xuất bản" },
      {
        name: "year",
        label: "Năm xuất bản",
        type: "number",
        min: 1000,
        max: new Date().getFullYear(),
      },
      { name: "quantity", label: "Số lượng", type: "number", min: 0, step: 1 },
      { name: "category", label: "Thể loại" },
    ],
    onSubmit: async (data) => {
      const item = {
        id: data.id.trim(),
        name: data.name.trim(),
        author: data.author.trim(),
        publisher: data.publisher.trim(),
        year: Number(data.year),
        quantity: Number(data.quantity),
        category: data.category.trim(),
      };

      if (books.some((x) => x.id === item.id && (!book || x.id !== book.id))) {
        notify("Mã sách đã tồn tại!", false);
        return false;
      }

      if (!item.id || !item.name || !item.author || !item.publisher || !item.category) {
        notify("Vui lòng điền đầy đủ thông tin.", false);
        return false;
      }

      if (!Number.isInteger(item.year) || item.year < 1000 || item.year > new Date().getFullYear()) {
        notify("Năm xuất bản không hợp lệ.", false);
        return false;
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 0) {
        notify("Số lượng không hợp lệ.", false);
        return false;
      }

      if (book) {
        const borrowed = loans
          .filter((loan) => loan.status === "Đang mượn")
          .flatMap((loan) => loan.items)
          .filter((row) => row.bookId === book.id)
          .reduce((sum, row) => sum + row.quantity, 0);

        if (item.quantity < borrowed) {
          notify(`Cần giữ ít nhất ${borrowed} cuốn đang được mượn.`, false);
          return false;
        }
      }

      try {
        const res = await fetch(API_BOOKS, {
          method: book ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        const result = await res.json();

        if (!result.success) {
          notify(result.message || "Lỗi khi lưu sách vào MySQL!", false);
          return false;
        }

        notify(book ? "Đã cập nhật sách vào MySQL." : "Đã thêm sách vào MySQL.");
        await fetchBooks();
        await fetchAuthors();
        renderLoans();
      } catch (err) {
        console.error(err);
        notify("Không kết nối được tới server Java!", false);
        return false;
      }
    },
  });

  const authorInput = $("#modal-author");
  const authorIdInput = $("#modal-authorId");

  const syncAuthorId = () => {
    const val = authorInput.value.trim().toLowerCase();
    const foundAuthor = authors.find((a) => a.name.toLowerCase() === val);
    const foundInBooks = books.find((b) => String(b.author || "").toLowerCase() === val);

    if (foundAuthor) {
      authorIdInput.value = foundAuthor.id;
    } else if (foundInBooks && foundInBooks.authorId) {
      authorIdInput.value = foundInBooks.authorId;
    } else {
      authorIdInput.value = generateAutoId("TG", authors);
    }
  };

  authorInput?.addEventListener("input", syncAuthorId);

  attachAutocomplete(
    authorInput,
    authors.map((a) => ({
      id: a.name,
      title: `Mã: ${a.id}`,
      meta: "Đã có",
    })),
    `Tác giả mới (tự sinh mã ${generateAutoId("TG", authors)})`,
  );
}

/* =====================================================
   7. QUẢN LÝ ĐỘC GIẢ
===================================================== */

function renderReaders(keyword = $("#readerSearch")?.value || "") {
  const term = keyword.trim().toLowerCase();

  const rows = readers.filter((reader) =>
    [reader.id, reader.name, reader.phone, reader.type].some((value) =>
      String(value).toLowerCase().includes(term),
    ),
  );

  const count = $("#readerCount");
  if (count) count.textContent = `${readers.length} độc giả`;

  const table = $("#readerTable");
  if (!table) return;

  table.innerHTML = `
        <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;min-width:600px">
            <thead>
                <tr>
                    <th>Mã độc giả</th>
                    <th>Họ tên</th>
                    <th>Ngày sinh</th>
                    <th>Giới tính</th>
                    <th>Điện thoại</th>
                    <th>Loại</th>
                    <th>Thao tác</th>
                </tr>
            </thead>
            <tbody>
                ${
                  rows.length
                    ? rows
                        .map(
                          (reader) => `
                    <tr>
                        <td>${escapeHTML(reader.id)}</td>
                        <td>${escapeHTML(reader.name)}</td>
                        <td>${escapeHTML(reader.birthday)}</td>
                        <td>${escapeHTML(reader.gender)}</td>
                        <td>${escapeHTML(reader.phone)}</td>
                        <td>${escapeHTML(reader.type)}</td>
                        <td>
                          <button class="btn-edit"
                            data-action="edit-reader"
                            data-id="${escapeHTML(reader.id)}"
                            title="Sửa độc giả"
                            aria-label="Sửa độc giả">
                            <i class="fa-regular fa-pen-to-square"></i>
                          </button>

                          <button class="btn-delete"
                            data-action="delete-reader"
                            data-id="${escapeHTML(reader.id)}"
                            title="Xóa độc giả"
                            aria-label="Xóa độc giả">
                            <i class="fa-regular fa-trash-can"></i>
                          </button>
                        </td>
                    </tr>
                `,
                        )
                        .join("")
                    : `
                    <tr>
                        <td colspan="7" style="text-align:center;padding:25px">
                            Không có độc giả phù hợp.
                        </td>
                    </tr>
                `
                }
            </tbody>
        </table>
        </div>`;
}

function openReaderForm(reader = null) {
  const autoId = reader ? reader.id : generateAutoId("DG", readers);

  openModal({
    title: reader ? "Sửa thông tin độc giả" : "Thêm độc giả mới",
    initial: reader || {
      id: autoId,
    },
    fields: [
      {
        name: "id",
        label: "Mã độc giả (Tự động)",
        readonly: true,
      },
      { name: "name", label: "Họ và tên" },
      { name: "birthday", label: "Ngày sinh", type: "date", max: today() },
      {
        name: "gender",
        label: "Giới tính",
        placeholder: "Chọn hoặc nhập giới tính...",
      },
      { name: "phone", label: "Số điện thoại", type: "tel" },
      {
        name: "type",
        label: "Loại độc giả",
        placeholder: "Chọn hoặc nhập loại độc giả...",
      },
    ],
    onSubmit: async (data) => {
      const item = {
        id: data.id.trim(),
        name: data.name.trim(),
        birthday: data.birthday,
        gender: data.gender.trim(),
        phone: data.phone.trim(),
        type: data.type.trim(),
      };

      if (
        !item.id ||
        !item.name ||
        !item.birthday ||
        !item.gender ||
        !item.phone ||
        !item.type
      ) {
        notify("Vui lòng điền đầy đủ thông tin.", false);
        return false;
      }

      try {
        const res = await fetch(API_READERS, {
          method: reader ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        const result = await res.json();

        if (!result.success) {
          notify(result.message || "Lỗi khi lưu độc giả vào MySQL!", false);
          return false;
        }

        notify(reader ? "Đã cập nhật độc giả." : "Đã thêm độc giả vào MySQL.");
        await fetchReaders();
        renderLoans();
      } catch (err) {
        notify("Không kết nối được tới server Java!", false);
        return false;
      }
    },
  });

  // Gắn gợi ý xổ xuống cho ô Giới tính
  attachAutocomplete(
    $("#modal-gender"),
    [
      { id: "Nam", title: "Giới tính nam" },
      { id: "Nữ", title: "Giới tính nữ" },
      { id: "Khác", title: "Giới tính khác" },
    ],
    "Không có gợi ý phù hợp",
  );

  // Gắn gợi ý xổ xuống cho ô Loại độc giả
  attachAutocomplete(
    $("#modal-type"),
    [
      { id: "Sinh viên", title: "Thẻ mượn cơ bản" },
      { id: "Giảng viên", title: "Thẻ cán bộ / giảng viên" },
      { id: "Học viên cao học", title: "Thẻ sau đại học" },
      { id: "Khách ngoài", title: "Thẻ đọc tại chỗ" },
    ],
    "Không có gợi ý phù hợp",
  );
}

/* =====================================================
8. QUẢN LÝ MƯỢN - TRẢ
===================================================== */

function renderLoans(keyword = $("#loanSearch")?.value || "") {
  const term = keyword.trim().toLowerCase();
  const todayStr = today();

  const rows = loans.filter((loan) => {
    // 1. Lọc theo 3 thẻ thống kê (Đã trả / Đang mượn / Quá hạn)
    if (loanFilter === "returned" && loan.status !== "Đã trả") return false;
    if (loanFilter === "active" && loan.status !== "Đang mượn") return false;
    if (
      loanFilter === "overdue" &&
      !(loan.status === "Đang mượn" && loan.dueDate && loan.dueDate < todayStr)
    ) {
      return false;
    }

    // 2. Lọc theo từ khóa ô tìm kiếm
    const reader = readers.find((x) => x.id === loan.readerId);
    return [loan.id, reader?.name, loan.status].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(term),
    );
  });

  const table = $("#loanTable");
  if (!table) return;

  table.innerHTML = `
        <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;min-width:600px">
            <thead>
                <tr>
                    <th>Mã phiếu</th>
                    <th>Độc giả</th>
                    <th>Ngày mượn</th>
                    <th>Hạn trả</th>
                    <th>Sách</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                </tr>
            </thead>
            <tbody>
                ${
                  rows.length
                    ? rows
                        .map((loan) => {
                          const reader = readers.find(
                            (x) => x.id === loan.readerId,
                          );

                          const summary = loan.items
                            .map((item) => {
                              const book = books.find(
                                (x) => x.id === item.bookId,
                              );
                              return `${book ? book.name : item.bookId} × ${item.quantity}`;
                            })
                            .join(", ");

                          return `
                        <tr>
                            <td>${escapeHTML(loan.id)}</td>
                            <td>${escapeHTML(reader?.name || loan.readerId)}</td>
                            <td>${escapeHTML(loan.borrowDate)}</td>
                            <td>${escapeHTML(loan.dueDate)}</td>
                            <td>${escapeHTML(summary)}</td>
                            <td>${escapeHTML(loan.status)}</td>
                            <td>
                                ${
                                  loan.status === "Đang mượn"
                                    ? `<button class="btn-edit"
                                        data-action="return-loan"
                                        data-id="${escapeHTML(loan.id)}"
                                        title="Trả sách">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle">
                                          <path d="M9 14L4 9l5-5"/>
                                          <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/>
                                        </svg>
                                      </button>`
                                    : ""
                                }
                                <button class="btn-delete"
                                    data-action="delete-loan"
                                    data-id="${escapeHTML(loan.id)}"
                                    title="Xóa phiếu">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle">
                                      <polyline points="3 6 5 6 21 6"/>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                      <line x1="10" y1="11" x2="10" y2="17"/>
                                      <line x1="14" y1="11" x2="14" y2="17"/>
                                    </svg>
                                </button>
                            </td>
                        </tr>`;
                        })
                        .join("")
                    : `
                    <tr>
                        <td colspan="7" style="text-align:center;padding:25px">
                            Không có phiếu mượn phù hợp.
                        </td>
                    </tr>
                `
                }
            </tbody>
        </table>
        </div>`;

  // Cập nhật 3 thẻ thống kê ở tab Mượn - Trả
  const returnedBooksCount = loans
    .filter((l) => l.status === "Đã trả")
    .reduce(
      (sum, l) =>
        sum + (l.items || []).reduce((s, i) => s + Number(i.quantity || 0), 0),
      0,
    );

  const activeBooksCount = loans
    .filter((l) => l.status === "Đang mượn")
    .reduce(
      (sum, l) =>
        sum + (l.items || []).reduce((s, i) => s + Number(i.quantity || 0), 0),
      0,
    );

  const overdueLoansCount = loans.filter(
    (l) => l.status === "Đang mượn" && l.dueDate && l.dueDate < todayStr,
  ).length;

  if ($("#borrowCardReturned"))
    $("#borrowCardReturned").textContent = returnedBooksCount;
  if ($("#borrowCardBooks"))
    $("#borrowCardBooks").textContent = activeBooksCount;
  if ($("#borrowCardOverdue"))
    $("#borrowCardOverdue").textContent = overdueLoansCount;
}

function attachAutocomplete(inputEl, items, emptyText) {
  if (!inputEl) return;
  inputEl.setAttribute("autocomplete", "off");

  const dropdown = document.createElement("div");
  dropdown.className = "autocomplete-dropdown";
  document.body.appendChild(dropdown);

  let activeIndex = -1;

  const normalize = (str) =>
    String(str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  function updatePosition() {
    if (!document.body.contains(inputEl)) {
      dropdown.remove();
      return;
    }
    const rect = inputEl.getBoundingClientRect();
    dropdown.style.position = "fixed";
    dropdown.style.top = rect.bottom + 4 + "px";
    dropdown.style.left = rect.left + "px";
    dropdown.style.width = rect.width + "px";
    dropdown.style.zIndex = "30000";
  }

  function renderList(keyword = "") {
    const q = normalize(keyword.trim());
    const matched = items.filter(
      (item) =>
        normalize(item.id).includes(q) || normalize(item.title).includes(q),
    );

    activeIndex = -1;

    if (!matched.length) {
      dropdown.innerHTML = `<div class="autocomplete-empty">${emptyText}</div>`;
    } else {
      dropdown.innerHTML = matched
        .slice(0, 8)
        .map(
          (item, idx) => `
          <div class="autocomplete-item" data-index="${idx}" data-value="${escapeHTML(item.id)}">
            <div class="ac-main">
              <strong>${escapeHTML(item.id)}</strong>
              <span>${escapeHTML(item.title)}</span>
            </div>
            ${item.meta ? `<small class="ac-meta">${escapeHTML(item.meta)}</small>` : ""}
          </div>`,
        )
        .join("");
    }
    updatePosition();
    dropdown.classList.add("show");
  }

  inputEl.addEventListener("focus", () => renderList(inputEl.value));
  inputEl.addEventListener("click", () => renderList(inputEl.value));
  inputEl.addEventListener("input", () => renderList(inputEl.value));

  dropdown.addEventListener("mousedown", (e) => {
    const itemEl = e.target.closest(".autocomplete-item");
    if (!itemEl) return;
    inputEl.value = itemEl.dataset.value;
    inputEl.dispatchEvent(new Event("input"));
    dropdown.classList.remove("show");
  });

  inputEl.addEventListener("keydown", (e) => {
    const list = dropdown.querySelectorAll(".autocomplete-item");
    if (!dropdown.classList.contains("show") || !list.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % list.length;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + list.length) % list.length;
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      inputEl.value = list[activeIndex].dataset.value;
      dropdown.classList.remove("show");
      return;
    } else if (e.key === "Escape") {
      dropdown.classList.remove("show");
      return;
    } else {
      return;
    }

    list.forEach((el, i) => el.classList.toggle("active", i === activeIndex));
    list[activeIndex]?.scrollIntoView({ block: "nearest" });
  });

  inputEl.addEventListener("blur", () => {
    setTimeout(() => dropdown.classList.remove("show"), 150);
  });
}

function openLoanForm() {
  if (!readers.length || !books.some((book) => book.quantity > 0)) {
    notify("Cần có độc giả và sách còn số lượng.", false);
    return;
  }

  const autoLoanId = generateAutoId("PM", loans);

  openModal({
    title: "Lập phiếu mượn sách",
    initial: {
      id: autoLoanId,
      borrowDate: today(),
      dueDate: addDays(today(), 14),
    },
    fields: [
      { name: "id", label: "Mã phiếu mượn (Tự động)", readonly: true },
      {
        name: "readerId",
        label: "Mã độc giả",
        placeholder: "Chọn hoặc nhập mã / tên độc giả...",
      },
      {
        name: "bookId",
        label: "Mã sách",
        placeholder: "Chọn hoặc nhập mã / tên sách...",
      },
      {
        name: "quantity",
        label: "Số lượng mượn",
        type: "number",
        min: 1,
        step: 1,
        defaultValue: 1,
      },
      { name: "borrowDate", label: "Ngày mượn", type: "date", max: today() },
      { name: "dueDate", label: "Hạn trả", type: "date" },
    ],
    onSubmit: async (data) => {
      const payload = {
        id: data.id.trim(),
        readerId: data.readerId.trim(),
        bookId: data.bookId.trim(),
        quantity: Number(data.quantity),
        borrowDate: data.borrowDate,
        dueDate: data.dueDate,
      };

      if (payload.dueDate < payload.borrowDate) {
        notify("Hạn trả không được sớm hơn ngày mượn.", false);
        return false;
      }

      try {
        const res = await fetch(API_LOANS, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();

        if (!result.success) {
          notify(result.message || "Không thể lập phiếu mượn!", false);
          return false;
        }

        notify("Đã lập phiếu mượn " + payload.id + ".");
        await fetchBooks();
        await fetchLoans();
      } catch (err) {
        notify("Không kết nối được tới server Java!", false);
        return false;
      }
    },
  });

  attachAutocomplete(
    $("#modal-readerId"),
    readers.map((r) => ({
      id: r.id,
      title: r.name,
      meta: r.phone || r.type || "Độc giả",
    })),
    "Không tìm thấy độc giả phù hợp",
  );

  attachAutocomplete(
    $("#modal-bookId"),
    books
      .filter((b) => Number(b.quantity) > 0)
      .map((b) => ({
        id: b.id,
        title: b.name,
        meta: `Còn: ${b.quantity} cuốn`,
      })),
    "Không tìm thấy sách còn trong kho",
  );
}

async function returnLoan(id) {
  const loan = loans.find((x) => x.id === id);

  if (!loan || loan.status !== "Đang mượn") return;

  if (!confirm("Xác nhận trả sách của phiếu " + id + "?")) return;

  try {
    const res = await fetch(API_LOANS, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, returnDate: today() }),
    });

    const result = await res.json();

    if (result.success) {
      notify("Đã ghi nhận trả sách.");
      await fetchBooks();
      await fetchLoans();
    } else {
      notify(result.message || "Lỗi khi trả sách!", false);
    }
  } catch (err) {
    console.error(err);
    notify("Không kết nối được tới server Java!", false);
  }
}

async function deleteLoan(id) {
  if (!confirm("Bạn có chắc muốn xóa phiếu mượn " + id + "?")) return;

  try {
    const res = await fetch(`${API_LOANS}?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const result = await res.json();

    if (result.success) {
      notify("Đã xóa phiếu mượn.");
      await fetchBooks();
      await fetchLoans();
    } else {
      notify(result.message || "Lỗi khi xóa phiếu mượn!", false);
    }
  } catch (err) {
    console.error(err);
    notify("Không kết nối được tới server Java!", false);
  }
}

/* =====================================================
   9. XÓA - SỬA - TRẢ SÁCH
===================================================== */

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  if (action === "edit-book") {
    const book = books.find((x) => x.id === id);
    if (book) openBookForm(book);
  }

  if (action === "delete-book") {
    const book = books.find((x) => x.id === id);
    if (!book) return;

    const borrowed = loans.some(
      (loan) =>
        loan.status === "Đang mượn" &&
        loan.items.some((item) => item.bookId === id),
    );

    if (borrowed) {
      notify("Không thể xóa sách đang được mượn.", false);
      return;
    }

    if (!confirm("Xóa sách " + book.name + "?")) return;

    fetch(`${API_BOOKS}?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          notify("Đã xóa sách khỏi MySQL.");
          fetchBooks();
          renderLoans();
        } else {
          notify(result.message || "Không thể xóa sách!", false);
        }
      })
      .catch(() => notify("Không kết nối được tới server Java!", false));
  }

  if (action === "edit-reader") {
    const reader = readers.find((x) => x.id === id);
    if (reader) openReaderForm(reader);
  }

  if (action === "delete-reader") {
    const hasLoan = loans.some(
      (loan) => loan.readerId === id && loan.status === "Đang mượn",
    );

    if (hasLoan) {
      notify("Độc giả còn phiếu mượn chưa trả.", false);
      return;
    }

    if (!confirm("Xóa độc giả này?")) return;

    fetch(`${API_READERS}?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          notify("Đã xóa độc giả khỏi MySQL.");
          fetchReaders();
          renderLoans();
        } else {
          notify(result.message || "Không thể xóa độc giả!", false);
        }
      })
      .catch(() => notify("Không kết nối được tới server Java!", false));
  }

  if (action === "return-loan") {
    returnLoan(id);
  }

  if (action === "delete-loan") {
    if (!confirm("Xóa phiếu " + id + "?")) return;
    fetch(`${API_LOANS}?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          notify("Đã xóa phiếu mượn.");
          fetchLoans();
        } else {
          notify(result.message || "Không thể xóa phiếu!", false);
        }
      })
      .catch(() => notify("Không kết nối được tới server Java!", false));
  }
});

/* =====================================================
   10. TRA CỨU SÁCH VÀ ĐỘC GIẢ
===================================================== */

function renderSearch() {
  const input = $("#searchInput");
  const results = $("#searchResults");

  if (!input || !results) return;

  const term = input.value.trim().toLowerCase();

  // SỬA DÒNG NÀY: Thêm book.authorId vào bộ lọc
  const bookResults = books.filter((book) =>
    [book.id, book.name, book.author, book.authorId].some((value) =>
      String(value || "").toLowerCase().includes(term),
    ),
  );

  const readerResults = readers.filter((reader) =>
    [reader.id, reader.name, reader.phone].some((value) =>
      String(value || "").toLowerCase().includes(term),
    ),
  );

  results.innerHTML = `
        <h3>Sách</h3>
        ${
          bookResults
            .map(
              (book) => `
            <!-- SỬA DÒNG NÀY: Hiện kèm (TG001) ở kết quả tra cứu -->
            <p>${escapeHTML(book.id)} — ${escapeHTML(book.name)} — ${escapeHTML(book.author)} (${escapeHTML(book.authorId || "")})</p>
        `,
            )
            .join("") || "<p>Không tìm thấy sách.</p>"
        }

        <h3>Độc giả</h3>
        ${
          readerResults
            .map(
              (reader) => `
            <p>${escapeHTML(reader.id)} — ${escapeHTML(reader.name)} — ${escapeHTML(reader.phone)}</p>
        `,
            )
            .join("") || "<p>Không tìm thấy độc giả.</p>"
        }
    `;
}

/* =====================================================
   11. ADMIN DROPDOWN
===================================================== */

function setupAdminDropdown() {
  const adminButton = $("#adminButton");
  const adminDropdown = $("#adminDropdown");

  if (!adminButton || !adminDropdown) return;

  adminButton.addEventListener("click", (event) => {
    event.stopPropagation();

    adminDropdown.classList.toggle("show");

    const arrow = $(".fa-chevron-down", adminButton);
    arrow?.classList.toggle("rotate");
  });

  document.addEventListener("click", (event) => {
    if (
      !adminDropdown.contains(event.target) &&
      !adminButton.contains(event.target)
    ) {
      adminDropdown.classList.remove("show");
      $(".fa-chevron-down", adminButton)?.classList.remove("rotate");
    }
  });

  // Nếu các mục trong dropdown có data-page-link,
  // sự kiện chuyển trang sẽ được xử lý ở phần bên dưới.
}

/* =====================================================
   12. TÌM KIẾM NHANH TRÊN TOPBAR
===================================================== */

function setupTopSearch() {
  const searchBox = $("#topSearchBox");
  const searchInput = $("#topSearchInput");
  const searchIcon = $("#topSearchIcon");
  const searchMenu = $("#topSearchMenu");

  if (!searchInput) return;

  function openSearchMenu() {
    searchMenu?.classList.add("show");
    searchBox?.classList.add("active");
  }

  function closeSearchMenu() {
    searchMenu?.classList.remove("show");
    searchBox?.classList.remove("active");
  }

  searchIcon?.addEventListener("click", (event) => {
    event.stopPropagation();

    if (searchMenu?.classList.contains("show")) {
      closeSearchMenu();
    } else {
      openSearchMenu();
    }
  });

  searchInput.addEventListener("focus", openSearchMenu);

  // Nhấn Enter chỉ mở lựa chọn tìm kiếm, không tự chuyển trang.
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      openSearchMenu();
    }

    if (event.key === "Escape") {
      closeSearchMenu();
    }
  });

  $$("[data-top-search-type]").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();

      const searchInputMain = $("#searchInput");
      const type = item.dataset.topSearchType;

      if (searchInputMain) {
        searchInputMain.value = searchInput.value.trim();
      }

      $$(".search-type").forEach((typeItem) => {
        typeItem.classList.toggle("active", typeItem.dataset.type === type);
      });

      showPage("search");
      renderSearch();
      closeSearchMenu();
    });
  });

  // Nếu giao diện dùng các nút .search-type thay cho
  // [data-top-search-type], vẫn cho phép chọn loại tìm kiếm.
  $$(".search-type").forEach((item) => {
    item.addEventListener("click", () => {
      $$(".search-type").forEach((other) => {
        other.classList.toggle("active", other === item);
      });
    });
  });

  document.addEventListener("click", (event) => {
    if (
      !searchBox?.contains(event.target) &&
      !searchMenu?.contains(event.target)
    ) {
      closeSearchMenu();
    }
  });
}
/* =====================================================
   13. TÀI KHOẢN VÀ CÀI ĐẶT
===================================================== */
function setupAccountAndSettings() {
  const defaultAccount = {
    username: "admin",
    password: "123456",
    fullName: "Admin",
    email: "admin@sachtot.edu.vn",
    role: "Quản trị viên thư viện",
  };

  const defaultSettings = {
    libraryName: "Sách tốt",
    defaultDays: 14,
    maxBooks: 5,
    finePerDay: 5000,
  };

  let account = JSON.parse(localStorage.getItem("lib_account")) || defaultAccount;
  let settings = JSON.parse(localStorage.getItem("lib_settings")) || defaultSettings;

  function renderAccountAndSettings() {
    if ($("#adminButton span")) $("#adminButton span").textContent = account.fullName;
    if ($(".top-logo span")) $(".top-logo span").textContent = settings.libraryName;

    if ($("#accUsername")) $("#accUsername").value = account.username;
    if ($("#accFullName")) $("#accFullName").value = account.fullName;
    if ($("#accEmail")) $("#accEmail").value = account.email;
    if ($("#accRole")) $("#accRole").value = account.role;

    if ($("#setLibraryName")) $("#setLibraryName").value = settings.libraryName;
    if ($("#setDefaultDays")) $("#setDefaultDays").value = settings.defaultDays;
    if ($("#setMaxBooks")) $("#setMaxBooks").value = settings.maxBooks;
    if ($("#setFinePerDay")) $("#setFinePerDay").value = settings.finePerDay;
  }

  renderAccountAndSettings();

  // Lưu thông tin hồ sơ
  $("#accountForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    account.fullName = $("#accFullName").value.trim();
    account.email = $("#accEmail").value.trim();
    localStorage.setItem("lib_account", JSON.stringify(account));
    renderAccountAndSettings();
    notify("Đã lưu thông tin tài khoản.");
  });

  // Đổi mật khẩu
  $("#passwordForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const oldPass = $("#oldPassword").value;
    const newPass = $("#newPassword").value;
    const confirmPass = $("#confirmPassword").value;

    if (oldPass !== account.password) {
      notify("Mật khẩu hiện tại không đúng!", false);
      return;
    }
    if (newPass !== confirmPass) {
      notify("Xác nhận mật khẩu mới không khớp!", false);
      return;
    }

    account.password = newPass;
    localStorage.setItem("lib_account", JSON.stringify(account));
    $("#passwordForm").reset();
    notify("Đã đổi mật khẩu thành công!");
  });

  // Lưu cài đặt hệ thống
  $("#settingsForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    settings = {
      libraryName: $("#setLibraryName").value.trim(),
      defaultDays: Number($("#setDefaultDays").value),
      maxBooks: Number($("#setMaxBooks").value),
      finePerDay: Number($("#setFinePerDay").value),
    };
    localStorage.setItem("lib_settings", JSON.stringify(settings));
    renderAccountAndSettings();
    notify("Đã lưu cấu hình hệ thống.");
  });

  // Đăng xuất sang trang login.html riêng
  $("#logoutButton")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!confirm("Bạn có chắc muốn đăng xuất?")) return;
    sessionStorage.removeItem("lib_logged_in");
    window.location.href = "login.html";
  });
}

/* =====================================================
   14. KHỞI ĐỘNG VÀ GẮN SỰ KIỆN
===================================================== */

function startLibrary() {
  // Sidebar: chuyển trang
  $$(".menu-item").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      showPage(item.dataset.page);
    });
  });

  // Nút xem chi tiết và các thẻ chức năng nhanh
  $$("[data-page-link]").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();

      const pageName = item.dataset.pageLink;

      if (pageTitles[pageName]) {
        showPage(pageName);

        if (pageName === "borrow") {
          // Hiển thị lại toàn bộ phiếu mượn
          loanFilter = "all";

          $$("[data-loan-filter]").forEach((card) => {
            card.classList.remove("active-filter");
          });

          renderLoans();
        }
      }
    });
  });

  // Nút thêm dữ liệu
  $("#addBookButton")?.addEventListener("click", () => openBookForm());
  $("#addReaderButton")?.addEventListener("click", () => openReaderForm());
  $("#addLoanButton")?.addEventListener("click", openLoanForm);

  // Tìm kiếm tại từng bảng
  $("#bookSearch")?.addEventListener("input", (event) => {
    renderBooks(event.target.value);
  });

  $("#readerSearch")?.addEventListener("input", (event) => {
    renderReaders(event.target.value);
  });

  $("#loanSearch")?.addEventListener("input", (event) => {
    renderLoans(event.target.value);
  });

  // Lọc danh sách khi nhấn vào các ô thống kê
  // Lọc danh sách khi nhấn vào các ô thống kê
$$("[data-loan-filter]").forEach((card) => {
  card.addEventListener("click", () => {

    const selectedFilter = card.dataset.loanFilter;

    // Bấm lại thẻ đang chọn thì hiển thị tất cả
    if (loanFilter === selectedFilter) {
      loanFilter = "all";
    } else {
      loanFilter = selectedFilter;
    }

    // Cập nhật trạng thái thẻ được chọn
    $$("[data-loan-filter]").forEach((item) => {
      item.classList.toggle(
        "active-filter",
        item.dataset.loanFilter === loanFilter
      );
    });

    renderLoans();
  });
});

  $("#searchInput")?.addEventListener("input", renderSearch);

  // Sidebar trên máy tính và điện thoại
  $("#menuToggle")?.addEventListener("click", () => {
    const sidebar = $(".sidebar");
    if (!sidebar) return;

    if (window.innerWidth <= 800) {
      sidebar.classList.toggle("open");
    } else {
      sidebar.classList.toggle("collapsed");
      $(".main")?.classList.toggle("sidebar-collapsed");
    }
  });

  // Chuông thông báo
  $("#notificationBell")?.addEventListener("click", () => {
    notify("Hệ thống quản lý thư viện đang hoạt động.");
  });

  // Tìm kiếm nhanh
  setupTopSearch();

  // Menu Admin
  setupAdminDropdown();

  // Khởi tạo dữ liệu
  fetchBooks();
  fetchReaders();
  fetchLoans();
  fetchAuthors();
  fetchLoanDetails();
  setupAccountAndSettings();
  updateDashboard();
}

/* =====================================================
   14. CHẠY ỨNG DỤNG
===================================================== */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startLibrary);
} else {
  startLibrary();
}
