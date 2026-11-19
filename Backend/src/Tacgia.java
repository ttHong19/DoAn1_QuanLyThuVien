import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

public class Tacgia {
    public static String getAllJson() {
        List<String> list = new ArrayList<>();
        String sql = "SELECT MaTacGia, TenTacGia FROM tacgia ORDER BY MaTacGia ASC";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                String id = esc(rs.getString("MaTacGia"));
                String name = esc(rs.getString("TenTacGia"));
                list.add(String.format("{\"id\":\"%s\",\"name\":\"%s\"}", id, name));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "[" + String.join(",", list) + "]";
    }

    private static String esc(String s) {
        return s == null ? "" : s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}