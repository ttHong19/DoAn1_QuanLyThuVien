
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseConnection {

    // Thông tin kết nối database
    private static final String URL =
            "jdbc:mysql://localhost:3306/quanlythuvien"
            + "?useUnicode=true&characterEncoding=UTF-8"
            + "&serverTimezone=Asia/Ho_Chi_Minh";

    private static final String USER = "root";
    private static final String PASSWORD = "";

    // Phương thức kết nối MySQL
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }

    // Kiểm tra kết nối database
    public static void main(String[] args) {
        try {
            Connection con = getConnection();

            System.out.println("Ket noi database thanh cong!");

            con.close();

        } catch (SQLException e) {
            System.out.println("Ket noi database that bai!");
            System.out.println("Loi: " + e.getMessage());
        }
    }
}
