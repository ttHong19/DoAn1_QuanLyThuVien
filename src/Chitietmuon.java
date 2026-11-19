import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class Chitietmuon {

    public static String getAllJson() {
        List<String> list = new ArrayList<>();
        String sql = "SELECT ct.MaPhieu, ct.MaSach, s.TenSach, ct.SoLuong, ct.NgayTra, ct.TrangThai " +
                     "FROM chitietmuon ct JOIN sach s ON ct.MaSach = s.MaSach " +
                     "ORDER BY ct.MaPhieu DESC, ct.MaSach ASC";

        try (Connection conn = DatabaseConnection.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                String ngayTra = rs.getString("NgayTra");
                list.add(String.format(
                    "{\"loanId\":\"%s\",\"bookId\":\"%s\",\"bookName\":\"%s\",\"quantity\":%d,\"returnDate\":\"%s\",\"status\":\"%s\"}",
                    esc(rs.getString("MaPhieu")),
                    esc(rs.getString("MaSach")),
                    esc(rs.getString("TenSach")),
                    rs.getInt("SoLuong"),
                    ngayTra == null ? "" : esc(ngayTra),
                    esc(rs.getString("TrangThai"))
                ));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return "[" + String.join(",", list) + "]";
    }

    private static String esc(String s) {
        return s == null ? "" : s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}