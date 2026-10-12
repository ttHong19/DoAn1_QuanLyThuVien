"use strict";

/* =====================================================
   1. DỮ LIỆU MẪU
===================================================== */

let books = [
  {
    id: "S001",
    name: "Lập trình Java cơ bản",
    author: "Nguyễn Văn A",
    publisher: "NXB Giáo dục",
    year: 2023,
    category: "Công nghệ thông tin",
    quantity: 10,
  },
  {
    id: "S002",
    name: "Cơ sở dữ liệu",
    author: "Trần Văn B",
    publisher: "NXB Đại học",
    year: 2024,
    category: "Công nghệ thông tin",
    quantity: 8,
  },
  {
    id: "S003",
    name: "Mạng máy tính",
    author: "Lê Văn C",
    publisher: "NXB Giáo dục",
    year: 2022,
    category: "Mạng máy tính",
    quantity: 6,
  },
];

let readers = [
  {
    id: "DG001",
    name: "Nguyễn Thị Hoa",
    birthday: "2005-03-15",
    gender: "Nữ",
    phone: "0987654321",
    type: "Sinh viên",
  },
  {
    id: "DG002",
    name: "Trần Văn Nam",
    birthday: "2004-08-20",
    gender: "Nam",
    phone: "0912345678",
    type: "Sinh viên",
  },
];

let loans = [];
let nextLoanNumber = 1;

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
      sum + loan.items.reduce((count, item) => count + item.quantity, 0),
    0,
  );

  const values = {
    totalBooks,
    totalReaders,
    borrowedBooks,
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

  const rows = books.filter((book) =>
    [book.id, book.name, book.author, book.publisher, book.category].some(
      (value) => String(value).toLowerCase().includes(term),
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
                        <td>${escapeHTML(book.author)}</td>
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
  openModal({
    title: book ? "Sửa thông tin sách" : "Thêm sách mới",
    initial: book || {
      year: new Date().getFullYear(),
      quantity: 1,
    },
    fields: [
      {
        name: "id",
        label: "Mã sách",
        placeholder: "VD: S004",
        readonly: !!book,
      },
      { name: "name", label: "Tên sách" },
      { name: "author", label: "Tác giả" },
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
    onSubmit: (data) => {
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

      if (
        !item.id ||
        !item.name ||
        !item.author ||
        !item.publisher ||
        !item.category
      ) {
        notify("Vui lòng điền đầy đủ thông tin.", false);
        return false;
      }

      if (
        !Number.isInteger(item.year) ||
        item.year < 1000 ||
        item.year > new Date().getFullYear()
      ) {
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

        const index = books.findIndex((x) => x.id === book.id);
        if (index !== -1) books[index] = item;

        notify("Đã cập nhật sách.");
      } else {
        books.push(item);
        notify("Đã thêm sách thành công.");
      }

      renderBooks();
      renderLoans();
      updateDashboard();
    },
  });
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
                ${rows.length
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
  openModal({
    title: reader ? "Sửa thông tin độc giả" : "Thêm độc giả mới",
    initial: reader || {},
    fields: [
      {
        name: "id",
        label: "Mã độc giả",
        placeholder: "VD: DG003",
        readonly: !!reader,
      },
      { name: "name", label: "Họ và tên" },
      { name: "birthday", label: "Ngày sinh", type: "date", max: today() },
      { name: "gender", label: "Giới tính" },
      { name: "phone", label: "Số điện thoại", type: "tel" },
      { name: "type", label: "Loại độc giả" },
    ],
    onSubmit: (data) => {
      const item = {
        id: data.id.trim(),
        name: data.name.trim(),
        birthday: data.birthday,
        gender: data.gender,
        phone: data.phone.trim(),
        type: data.type.trim(),
      };

      if (
        readers.some((x) => x.id === item.id && (!reader || x.id !== reader.id))
      ) {
        notify("Mã độc giả đã tồn tại!", false);
        return false;
      }

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

      if (item.birthday > today()) {
        notify("Ngày sinh không thể ở tương lai.", false);
        return false;
      }

      if (reader) {
        const index = readers.findIndex((x) => x.id === reader.id);
        if (index !== -1) readers[index] = item;
      } else {
        readers.push(item);
      }

      renderReaders();
      renderLoans();
      updateDashboard();

      notify(reader ? "Đã cập nhật độc giả." : "Đã thêm độc giả.");
    },
  });
}

/* =====================================================
   8. QUẢN LÝ MƯỢN - TRẢ
===================================================== */

function renderLoans(keyword = $("#loanSearch")?.value || "") {
  const term = keyword.trim().toLowerCase();

  const rows = loans.filter((loan) => {
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
                ${rows.length
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
                                ${loan.status === "Đang mượn"
              ? `
                                    <button data-action="return-loan"
                                        data-id="${escapeHTML(loan.id)}">Trả sách</button>
                                `
              : ""
            }
                                <button class="btn-delete"
                                    data-action="delete-loan"
                                    data-id="${escapeHTML(loan.id)}">Xóa</button>
                            </td>
                        </tr>`;
        })
        .join("")
      : `
                    <tr>
                        <td colspan="7" style="text-align:center;padding:25px">
                            Chưa có phiếu mượn.
                        </td>
                    </tr>
                `
    }
            </tbody>
        </table>
        </div>`;
}

function openLoanForm() {
  if (!readers.length || !books.some((book) => book.quantity > 0)) {
    notify("Cần có độc giả và sách còn số lượng.", false);
    return;
  }

  openModal({
    title: "Lập phiếu mượn sách",
    initial: {
      borrowDate: today(),
      dueDate: today(),
    },
    fields: [
      { name: "readerId", label: "Mã độc giả", placeholder: "Nhập mã độc giả" },
      { name: "bookId", label: "Mã sách", placeholder: "Nhập mã sách" },
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
    onSubmit: (data) => {
      const reader = readers.find((x) => x.id === data.readerId.trim());
      const book = books.find((x) => x.id === data.bookId.trim());
      const quantity = Number(data.quantity);

      if (!reader || !book) {
        notify("Mã độc giả hoặc mã sách không tồn tại.", false);
        return false;
      }

      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > book.quantity
      ) {
        notify(
          `Số lượng mượn không hợp lệ. Sách còn ${book.quantity} cuốn.`,
          false,
        );
        return false;
      }

      if (data.borrowDate > today() || data.dueDate < data.borrowDate) {
        notify("Ngày mượn hoặc hạn trả không hợp lệ.", false);
        return false;
      }

      const id = "PM" + String(nextLoanNumber++).padStart(3, "0");

      loans.push({
        id,
        readerId: reader.id,
        borrowDate: data.borrowDate,
        dueDate: data.dueDate,
        returnDate: "",
        status: "Đang mượn",
        items: [{ bookId: book.id, quantity }],
      });

      book.quantity -= quantity;

      renderBooks();
      renderLoans();
      updateDashboard();
      notify("Đã lập phiếu " + id + ".");
    },
  });
}

function returnLoan(id) {
  const loan = loans.find((x) => x.id === id);

  if (!loan || loan.status !== "Đang mượn") return;

  if (!confirm("Xác nhận trả sách của phiếu " + id + "?")) return;

  loan.status = "Đã trả";
  loan.returnDate = today();

  loan.items.forEach((item) => {
    const book = books.find((x) => x.id === item.bookId);
    if (book) book.quantity += item.quantity;
  });

  renderBooks();
  renderLoans();
  updateDashboard();

  notify("Đã ghi nhận trả sách.");
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

    books = books.filter((x) => x.id !== id);

    renderBooks();
    renderLoans();
    updateDashboard();

    notify("Đã xóa sách.");
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

    readers = readers.filter((x) => x.id !== id);

    renderReaders();
    renderLoans();
    updateDashboard();

    notify("Đã xóa độc giả.");
  }

  if (action === "return-loan") {
    returnLoan(id);
  }

  if (action === "delete-loan") {
    const loan = loans.find((x) => x.id === id);
    if (!loan) return;

    if (loan.status === "Đang mượn") {
      notify("Hãy ghi nhận trả sách trước khi xóa phiếu.", false);
      return;
    }

    if (!confirm("Xóa phiếu " + id + "?")) return;

    loans = loans.filter((x) => x.id !== id);

    renderLoans();
    updateDashboard();

    notify("Đã xóa phiếu.");
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

  const bookResults = books.filter((book) =>
    [book.id, book.name, book.author].some((value) =>
      String(value).toLowerCase().includes(term),
    ),
  );

  const readerResults = readers.filter((reader) =>
    [reader.id, reader.name, reader.phone].some((value) =>
      String(value).toLowerCase().includes(term),
    ),
  );

  results.innerHTML = `
        <h3>Sách</h3>
        ${bookResults
      .map(
        (book) => `
            <p>${escapeHTML(book.id)} — ${escapeHTML(book.name)} — ${escapeHTML(book.author)}</p>
        `,
      )
      .join("") || "<p>Không tìm thấy sách.</p>"
    }

        <h3>Độc giả</h3>
        ${readerResults
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
   13. KHỞI ĐỘNG VÀ GẮN SỰ KIỆN
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
  renderBooks();
  renderReaders();
  renderLoans();
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
