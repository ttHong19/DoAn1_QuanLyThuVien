import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ApiServer {

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

        // 1. API SÁCH
        server.createContext("/api/books", exchange -> {
            if (handleCors(exchange)) return;
            String method = exchange.getRequestMethod();
            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);

            if ("GET".equalsIgnoreCase(method)) {
                sendJson(exchange, 200, Sach.getAllJson());
            } else if ("POST".equalsIgnoreCase(method)) {
                sendJson(exchange, 200, Sach.add(
                    getVal(body, "id"), getVal(body, "name"), getVal(body, "author"),
                    getVal(body, "publisher"), getInt(body, "year"), getVal(body, "category"), getInt(body, "quantity")
                ));
            } else if ("PUT".equalsIgnoreCase(method)) {
                sendJson(exchange, 200, Sach.update(
                    getVal(body, "id"), getVal(body, "name"), getVal(body, "author"),
                    getVal(body, "publisher"), getInt(body, "year"), getVal(body, "category"), getInt(body, "quantity")
                ));
            } else if ("DELETE".equalsIgnoreCase(method)) {
                sendJson(exchange, 200, Sach.delete(getQueryParam(exchange, "id")));
            }
        });

        // 2. API ĐỘC GIẢ
        server.createContext("/api/readers", exchange -> {
            if (handleCors(exchange)) return;
            String method = exchange.getRequestMethod();
            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);

            if ("GET".equalsIgnoreCase(method)) {
                sendJson(exchange, 200, DocGia.getAllJson());
            } else if ("POST".equalsIgnoreCase(method)) {
                sendJson(exchange, 200, DocGia.add(
                    getVal(body, "id"), getVal(body, "name"), getVal(body, "birthday"),
                    getVal(body, "gender"), getVal(body, "phone"), getVal(body, "type")
                ));
            } else if ("PUT".equalsIgnoreCase(method)) {
                sendJson(exchange, 200, DocGia.update(
                    getVal(body, "id"), getVal(body, "name"), getVal(body, "birthday"),
                    getVal(body, "gender"), getVal(body, "phone"), getVal(body, "type")
                ));
            } else if ("DELETE".equalsIgnoreCase(method)) {
                sendJson(exchange, 200, DocGia.delete(getQueryParam(exchange, "id")));
            }
        });

        // 3. API MƯỢN - TRẢ (phieumuon + chitietmuon)
        server.createContext("/api/loans", exchange -> {
            if (handleCors(exchange)) return;
            String method = exchange.getRequestMethod();
            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);

            if ("GET".equalsIgnoreCase(method)) {
                sendJson(exchange, 200, PhieuMuon.getAllJson());
            } else if ("POST".equalsIgnoreCase(method)) {
                sendJson(exchange, 200, PhieuMuon.add(
                    getVal(body, "id"), getVal(body, "readerId"), getVal(body, "bookId"),
                    getInt(body, "quantity"), getVal(body, "borrowDate"), getVal(body, "dueDate")
                ));
            } else if ("PUT".equalsIgnoreCase(method)) {
                sendJson(exchange, 200, PhieuMuon.returnBook(getVal(body, "id"), getVal(body, "returnDate")));
            } else if ("DELETE".equalsIgnoreCase(method)) {
                sendJson(exchange, 200, PhieuMuon.delete(getQueryParam(exchange, "id")));
            }
        });

        // 4. API TÁC GIẢ
        server.createContext("/api/authors", exchange -> {
            if (handleCors(exchange)) return;
            if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 200, Tacgia.getAllJson());
            }
        });

        // 5. API CHI TIẾT MƯỢN
        server.createContext("/api/loan-details", exchange -> {
            if (handleCors(exchange)) return;
            if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 200, Chitietmuon.getAllJson());
            }
        });

        server.setExecutor(null);
        server.start();
        System.out.println("Backend API dang chay tai: http://localhost:8080 (Books & Readers)");
    }

    private static boolean handleCors(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return true;
        }
        return false;
    }

    private static void sendJson(HttpExchange exchange, int code, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String getVal(String json, String key) {
        Pattern p = Pattern.compile("\"" + key + "\"\\s*:\\s*\"([^\"]*)\"");
        Matcher m = p.matcher(json);
        return m.find() ? m.group(1) : "";
    }

    private static int getInt(String json, String key) {
        Pattern p = Pattern.compile("\"" + key + "\"\\s*:\\s*(\\d+)");
        Matcher m = p.matcher(json);
        if (m.find()) return Integer.parseInt(m.group(1));
        String strVal = getVal(json, key);
        return strVal.isEmpty() ? 0 : Integer.parseInt(strVal);
    }

    private static String getQueryParam(HttpExchange exchange, String key) {
        String query = exchange.getRequestURI().getQuery();
        if (query == null) return "";
        for (String param : query.split("&")) {
            String[] pair = param.split("=");
            if (pair.length == 2 && pair[0].equals(key)) return pair[1];
        }
        return "";
    }
}