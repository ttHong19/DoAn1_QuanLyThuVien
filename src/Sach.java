import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class Sach {

    // Lấy danh sách sách từ MySQL (kết hợp bảng sach và tacgia)
    public static String getAllJson() {
        List<String> list = new ArrayList<>();
        String sql = "SELECT s.MaSach, s.TenSach, s.MaTacGia, t.TenTacGia, s.NXB, s.NamXB, s.TheLoai, s.SoLuong " +
                     "FROM sach s JOIN tacgia t ON s.MaTacGia = t.MaTacGia ORDER BY s.MaSach";

        try (Connection conn = DatabaseConnection.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                list.add(String.format(
                    "{\"id\":\"%s\",\"name\":\"%s\",\"authorId\":\"%s\",\"author\":\"%s\",\"publisher\":\"%s\",\"year\":%d,\"category\":\"%s\",\"quantity\":%d}",
                    esc(rs.getString("MaSach")),
                    esc(rs.getString("TenSach")),
                    esc(rs.getString("MaTacGia")),
                    esc(rs.getString("TenTacGia")),
                    esc(rs.getString("NXB")),
                    rs.getInt("NamXB"),
                    esc(rs.getString("TheLoai")),
                    rs.getInt("SoLuong")
                ));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return "[" + String.join(",", list) + "]";
    }

    // Tự tìm mã tác giả hoặc tự tạo mới nếu chưa có
    private static String getOrCreateAuthorId(Connection conn, String authorName) throws SQLException {
        String cleanName = authorName.trim();
        String findSql = "SELECT MaTacGia FROM tacgia WHERE LOWER(TenTacGia) = LOWER(?) LIMIT 1";
        try (PreparedStatement ps = conn.prepareStatement(findSql)) {
            ps.setString(1, cleanName);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return rs.getString("MaTacGia");
        }

        // Sinh mã theo format TG-YYYYMMDD-STT (VD: TG-20261118-001)
        String datePart = java.time.LocalDate.now().toString().replace("-", "");
        String prefix = "TG-" + datePart + "-";
        int maxStt = 0;

        String maxSql = "SELECT MaTacGia FROM tacgia WHERE MaTacGia LIKE ?";
        try (PreparedStatement ps = conn.prepareStatement(maxSql)) {
            ps.setString(1, prefix + "%");
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                String id = rs.getString("MaTacGia");
                try {
                    int stt = Integer.parseInt(id.substring(prefix.length()));
                    if (stt > maxStt) maxStt = stt;
                } catch (NumberFormatException ignored) {}
            }
        }
        String newId = prefix + String.format("%03d", maxStt + 1);

        String insertSql = "INSERT INTO tacgia (MaTacGia, TenTacGia) VALUES (?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(insertSql)) {
            ps.setString(1, newId);
            ps.setString(2, cleanName);
            ps.executeUpdate();
        }
        return newId;
    }

    // Thêm sách mới vào MySQL
    public static String add(String id, String name, String author, String publisher, int year, String category, int quantity) {
        try (Connection conn = DatabaseConnection.getConnection()) {
            String maTacGia = getOrCreateAuthorId(conn, author);
            String sql = "INSERT INTO sach (MaSach, TenSach, MaTacGia, NXB, NamXB, TheLoai, SoLuong) VALUES (?, ?, ?, ?, ?, ?, ?)";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, id);
                ps.setString(2, name);
                ps.setString(3, maTacGia);
                ps.setString(4, publisher);
                ps.setInt(5, year);
                ps.setString(6, category);
                ps.setInt(7, quantity);
                ps.executeUpdate();
                return "{\"success\":true}";
            }
        } catch (SQLException e) {
            return "{\"success\":false,\"message\":\"" + esc(e.getMessage()) + "\"}";
        }
    }

    // Sửa thông tin sách
    public static String update(String id, String name, String author, String publisher, int year, String category, int quantity) {
        try (Connection conn = DatabaseConnection.getConnection()) {
            String maTacGia = getOrCreateAuthorId(conn, author);
            String sql = "UPDATE sach SET TenSach=?, MaTacGia=?, NXB=?, NamXB=?, TheLoai=?, SoLuong=? WHERE MaSach=?";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, name);
                ps.setString(2, maTacGia);
                ps.setString(3, publisher);
                ps.setInt(4, year);
                ps.setString(5, category);
                ps.setInt(6, quantity);
                ps.setString(7, id);
                ps.executeUpdate();
                return "{\"success\":true}";
            }
        } catch (SQLException e) {
            return "{\"success\":false,\"message\":\"" + esc(e.getMessage()) + "\"}";
        }
    }

    // Xóa sách
    public static String delete(String id) {
        String sql = "DELETE FROM sach WHERE MaSach=?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.executeUpdate();
            return "{\"success\":true}";
        } catch (SQLException e) {
            return "{\"success\":false,\"message\":\"Không thể xóa sách này!\"}";
        }
    }

    private static String esc(String s) {
        return s == null ? "" : s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}