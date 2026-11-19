import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class PhieuMuon {

    public static String getAllJson() {
        List<String> list = new ArrayList<>();
        String sql = "SELECT p.MaPhieu, p.MaDocGia, p.NgayMuon, p.HanTra, p.TrangThai, " +
                     "c.MaSach, c.SoLuong, c.NgayTra " +
                     "FROM phieumuon p JOIN chitietmuon c ON p.MaPhieu = c.MaPhieu ORDER BY p.MaPhieu DESC";

        try (Connection conn = DatabaseConnection.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                String returnDate = rs.getString("NgayTra");
                String itemJson = String.format("[{\"bookId\":\"%s\",\"quantity\":%d}]",
                    esc(rs.getString("MaSach")), rs.getInt("SoLuong"));

                list.add(String.format(
                    "{\"id\":\"%s\",\"readerId\":\"%s\",\"borrowDate\":\"%s\",\"dueDate\":\"%s\",\"returnDate\":\"%s\",\"status\":\"%s\",\"items\":%s}",
                    esc(rs.getString("MaPhieu")),
                    esc(rs.getString("MaDocGia")),
                    esc(rs.getString("NgayMuon")),
                    esc(rs.getString("HanTra")),
                    esc(returnDate == null ? "" : returnDate),
                    esc(rs.getString("TrangThai")),
                    itemJson
                ));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return "[" + String.join(",", list) + "]";
    }

    public static String add(String id, String readerId, String bookId, int quantity, String borrowDate, String dueDate) {
        if (id == null || id.isEmpty()) {
            id = "PM" + String.format("%03d", (int)(System.currentTimeMillis() % 900) + 100);
        }
        Connection conn = null;
        try {
            conn = DatabaseConnection.getConnection();
            conn.setAutoCommit(false);

            // 1. Kiểm tra tồn kho và trừ số lượng sách
            String sqlBook = "UPDATE sach SET SoLuong = SoLuong - ? WHERE MaSach = ? AND SoLuong >= ?";
            try (PreparedStatement ps = conn.prepareStatement(sqlBook)) {
                ps.setInt(1, quantity);
                ps.setString(2, bookId);
                ps.setInt(3, quantity);
                if (ps.executeUpdate() == 0) {
                    conn.rollback();
                    return "{\"success\":false,\"message\":\"Mã sách không tồn tại hoặc số lượng trong kho không đủ!\"}";
                }
            }

            // 2. Thêm vào bảng phieumuon
            String sqlPm = "INSERT INTO phieumuon (MaPhieu, MaDocGia, NgayMuon, HanTra, TrangThai) VALUES (?, ?, ?, ?, 'Đang mượn')";
            try (PreparedStatement ps = conn.prepareStatement(sqlPm)) {
                ps.setString(1, id);
                ps.setString(2, readerId);
                ps.setString(3, borrowDate);
                ps.setString(4, dueDate);
                ps.executeUpdate();
            }

            // 3. Thêm vào bảng chitietmuon
            String sqlCt = "INSERT INTO chitietmuon (MaPhieu, MaSach, SoLuong, TrangThai) VALUES (?, ?, ?, 'Đang mượn')";
            try (PreparedStatement ps = conn.prepareStatement(sqlCt)) {
                ps.setString(1, id);
                ps.setString(2, bookId);
                ps.setInt(3, quantity);
                ps.executeUpdate();
            }

            conn.commit();
            return "{\"success\":true,\"id\":\"" + esc(id) + "\"}";
        } catch (SQLException e) {
            try { if (conn != null) conn.rollback(); } catch (SQLException ex) {}
            return "{\"success\":false,\"message\":\"Lỗi lập phiếu (kiểm tra lại mã độc giả): " + esc(e.getMessage()) + "\"}";
        } finally {
            try { if (conn != null) conn.close(); } catch (SQLException e) {}
        }
    }

    public static String returnBook(String maPhieu, String returnDate) {
        Connection conn = null;
        try {
            conn = DatabaseConnection.getConnection();
            conn.setAutoCommit(false);

            String sqlGet = "SELECT MaSach, SoLuong FROM chitietmuon WHERE MaPhieu = ? AND TrangThai = 'Đang mượn'";
            String maSach = null;
            int soLuong = 0;
            try (PreparedStatement ps = conn.prepareStatement(sqlGet)) {
                ps.setString(1, maPhieu);
                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    maSach = rs.getString("MaSach");
                    soLuong = rs.getInt("SoLuong");
                } else {
                    return "{\"success\":false,\"message\":\"Phiếu mượn không hợp lệ hoặc đã trả!\"}";
                }
            }

            try (PreparedStatement ps = conn.prepareStatement("UPDATE phieumuon SET TrangThai = 'Đã trả' WHERE MaPhieu = ?")) {
                ps.setString(1, maPhieu);
                ps.executeUpdate();
            }
            try (PreparedStatement ps = conn.prepareStatement("UPDATE chitietmuon SET TrangThai = 'Đã trả', NgayTra = ? WHERE MaPhieu = ?")) {
                ps.setString(1, returnDate);
                ps.setString(2, maPhieu);
                ps.executeUpdate();
            }
            try (PreparedStatement ps = conn.prepareStatement("UPDATE sach SET SoLuong = SoLuong + ? WHERE MaSach = ?")) {
                ps.setInt(1, soLuong);
                ps.setString(2, maSach);
                ps.executeUpdate();
            }

            conn.commit();
            return "{\"success\":true}";
        } catch (SQLException e) {
            try { if (conn != null) conn.rollback(); } catch (SQLException ex) {}
            return "{\"success\":false,\"message\":\"" + esc(e.getMessage()) + "\"}";
        } finally {
            try { if (conn != null) conn.close(); } catch (SQLException e) {}
        }
    }

    public static String delete(String maPhieu) {
        Connection conn = null;
        try {
            conn = DatabaseConnection.getConnection();
            conn.setAutoCommit(false);

            try (PreparedStatement check = conn.prepareStatement("SELECT TrangThai FROM phieumuon WHERE MaPhieu = ?")) {
                check.setString(1, maPhieu);
                ResultSet rs = check.executeQuery();
                if (!rs.next() || !"Đã trả".equals(rs.getString("TrangThai"))) {
                    return "{\"success\":false,\"message\":\"Chỉ được xóa phiếu đã trả sách!\"}";
                }
            }

            try (PreparedStatement ps1 = conn.prepareStatement("DELETE FROM chitietmuon WHERE MaPhieu = ?")) {
                ps1.setString(1, maPhieu);
                ps1.executeUpdate();
            }
            try (PreparedStatement ps2 = conn.prepareStatement("DELETE FROM phieumuon WHERE MaPhieu = ?")) {
                ps2.setString(1, maPhieu);
                ps2.executeUpdate();
            }

            conn.commit();
            return "{\"success\":true}";
        } catch (SQLException e) {
            try { if (conn != null) conn.rollback(); } catch (SQLException ex) {}
            return "{\"success\":false,\"message\":\"" + esc(e.getMessage()) + "\"}";
        } finally {
            try { if (conn != null) conn.close(); } catch (SQLException e) {}
        }
    }

    private static String esc(String s) {
        return s == null ? "" : s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}