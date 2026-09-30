// ==================================================
// DỮ LIỆU TẠM THỜI
// Sau này dữ liệu này sẽ lấy từ Java Backend
// ==================================================

const dashboardData = {
    totalBooks: 0,
    totalReaders: 0,
    borrowedBooks: 0,
    loanSlips: 0
};


// ==================================================
// HIỂN THỊ THỐNG KÊ
// ==================================================

function updateDashboard(data) {

    document.getElementById("totalBooks").textContent =
        data.totalBooks;

    document.getElementById("totalReaders").textContent =
        data.totalReaders;

    document.getElementById("borrowedBooks").textContent =
        data.borrowedBooks;

    document.getElementById("loanSlips").textContent =
        data.loanSlips;


    // Thông tin hệ thống

    document.getElementById("systemBooks").textContent =
        data.totalBooks;

    document.getElementById("systemReaders").textContent =
        data.totalReaders;

    document.getElementById("systemBorrowed").textContent =
        data.borrowedBooks;

    document.getElementById("systemLoans").textContent =
        data.loanSlips;
}


updateDashboard(dashboardData);


// ==================================================
// TÊN CÁC TRANG
// ==================================================

const pageTitles = {

    home: "Trang chủ",

    books: "Quản lý sách",

    readers: "Quản lý độc giả",

    borrow: "Mượn - Trả",

    search: "Tra cứu"

};


// ==================================================
// LẤY MENU + CÁC PAGE
// ==================================================

const menuItems =
    document.querySelectorAll(".menu-item");

const pages =
    document.querySelectorAll(".page");

const topTitle =
    document.getElementById("topTitle");


// ==================================================
// HÀM CHUYỂN TRANG
// ==================================================

function showPage(pageName) {

    // ----------------------------------------------
    // 1. Ẩn toàn bộ page
    // ----------------------------------------------

    pages.forEach(function (page) {

        page.classList.remove("active-page");

    });


    // ----------------------------------------------
    // 2. Hiện page được chọn
    // ----------------------------------------------

    const selectedPage =
        document.getElementById(
            "page-" + pageName
        );

    if (selectedPage) {

        selectedPage.classList.add(
            "active-page"
        );

    }


    // ----------------------------------------------
    // 3. Đổi trạng thái menu
    // ----------------------------------------------

    menuItems.forEach(function (item) {

        item.classList.remove("active");

    });


    const selectedMenu =
        document.querySelector(
            '.menu-item[data-page="' +
            pageName +
            '"]'
        );

    if (selectedMenu) {

        selectedMenu.classList.add("active");

    }


    // ----------------------------------------------
    // 4. Đổi chữ trên topbar
    // ----------------------------------------------

    topTitle.textContent =
        pageTitles[pageName];


    // ----------------------------------------------
    // 5. Cuộn lên đầu
    // ----------------------------------------------

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ==================================================
// CLICK MENU BÊN TRÁI
// ==================================================

menuItems.forEach(function (item) {

    item.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            const pageName =
                item.getAttribute("data-page");

            showPage(pageName);

        }
    );

});


// ==================================================
// CÁC NÚT "XEM CHI TIẾT"
// VÀ 4 Ô CHỨC NĂNG NHANH
// ==================================================

const pageLinks =
    document.querySelectorAll(
        "[data-page-link]"
    );


pageLinks.forEach(function (link) {

    link.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            const pageName =
                link.getAttribute(
                    "data-page-link"
                );

            showPage(pageName);

        }
    );

});


// ==================================================
// NÚT MENU MOBILE
// ==================================================

const menuToggle =
    document.getElementById(
        "menuToggle"
    );

const sidebar =
    document.querySelector(
        ".sidebar"
    );


menuToggle.addEventListener(
    "click",
    function () {

        sidebar.classList.toggle(
            "open"
        );

    }
);


// ==================================================
// CHỌN LOẠI TRA CỨU
// ==================================================

const searchTypes =
    document.querySelectorAll(
        ".search-type"
    );


searchTypes.forEach(function (button) {

    button.addEventListener(
        "click",
        function () {

            searchTypes.forEach(
                function (item) {

                    item.classList.remove(
                        "active"
                    );

                }
            );

            button.classList.add(
                "active"
            );

        }
    );

});


// ==================================================
// NÚT TÌM KIẾM
// ==================================================

const searchButton =
    document.getElementById(
        "searchButton"
    );


const searchInput =
    document.getElementById(
        "searchInput"
    );


searchButton.addEventListener(
    "click",
    function () {

        const keyword =
            searchInput.value.trim();

        if (keyword === "") {

            alert(
                "Vui lòng nhập thông tin cần tìm kiếm."
            );

            return;
        }


        alert(
            "Chức năng tìm kiếm sẽ được kết nối với Java + MySQL ở bước backend."
        );

    }
);


// ==================================================
// ENTER ĐỂ TÌM KIẾM
// ==================================================

searchInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            searchButton.click();

        }

    }
);

// ==================================================
// ADMIN DROPDOWN
// ==================================================

const adminButton = document.getElementById("adminButton");
const adminDropdown = document.getElementById("adminDropdown");
const adminArrow = adminButton.querySelector(".fa-chevron-down");

adminButton.addEventListener("click", function (event) {
    event.stopPropagation();
    adminDropdown.classList.toggle("show");
    adminArrow.classList.toggle("rotate");
});

// Bấm ra ngoài thì đóng menu
document.addEventListener("click", function () {
    adminDropdown.classList.remove("show");
    adminArrow.classList.remove("rotate");
});




// ==================================================
// CHUẨN BỊ CHO JAVA BACKEND
// ==================================================
//
// SAU NÀY khi Spring Boot/Java chạy:
//
// fetch("http://localhost:8080/api/dashboard")
//
//     .then(response => response.json())
//
//     .then(data => {
//
//         updateDashboard(data);
//
//     });
//
// Lúc đó:
// HTML/JS
//      ↓
// Java Backend :8080
//      ↓
// JDBC
//      ↓
// MySQL :3306
//
// Hiện tại CHƯA bật đoạn fetch này.
// ==================================================