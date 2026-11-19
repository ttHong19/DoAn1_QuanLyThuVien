import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class DocGia {

    public static String getAllJson() {
        List<String> list = new ArrayList<>();
        String sql = "SELECT * FROM docgia ORDER BY MaDocGia";

        try (Connection conn = DatabaseConnection.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                list.add(String.format(
                    "{\"id\":\"%s\",\"name\":\"%s\",\"birthday\":\"%s\",\"gender\":\"%s\",\"phone\":\"%s\",\"type\":\"%s\"}",
                    esc(rs.getString("MaDocGia")),
                    esc(rs.getString("HoTen")),
                    esc(rs.getString("NgaySinh")),
                    esc(rs.getString("GioiTinh")),
                    esc(rs.getString("SDT")),
                    esc(rs.getString("LoaiDocGia"))
                ));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return "[" + String.join(",", list) + "]";
    }

    public static String add(String id, String name, String birthday, String gender, String phone, String type) {
        String sql = "INSERT INTO docgia (MaDocGia, HoTen, NgaySinh, GioiTinh, SDT, LoaiDocGia) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.setString(2, name);
            ps.setString(3, birthday);
            ps.setString(4, gender);
            ps.setString(5, phone);
            ps.setString(6, type);
            ps.executeUpdate();
            return "{\"success\":true}";
        } catch (SQLException e) {
            return "{\"success\":false,\"message\":\"" + esc(e.getMessage()) + "\"}";
        }
    }

    public static String update(String id, String name, String birthday, String gender, String phone, String type) {
        String sql = "UPDATE docgia SET HoTen=?, NgaySinh=?, GioiTinh=?, SDT=?, LoaiDocGia=? WHERE MaDocGia=?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, name);
            ps.setString(2, birthday);
            ps.setString(3, gender);
            ps.setString(4, phone);
            ps.setString(5, type);
            ps.setString(6, id);
            ps.executeUpdate();
            return "{\"success\":true}";
        } catch (SQLException e) {
            return "{\"success\":false,\"message\":\"" + esc(e.getMessage()) + "\"}";
        }
    }

    public static String delete(String id) {
        String sql = "DELETE FROM docgia WHERE MaDocGia=?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.executeUpdate();
            return "{\"success\":true}";
        } catch (SQLException e) {
            return "{\"success\":false,\"message\":\"Không thể xóa độc giả đang có phiếu mượn!\"}";
        }
    }

    private static String esc(String s) {
        return s == null ? "" : s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}