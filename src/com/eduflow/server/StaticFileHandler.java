package com.eduflow.server;

import com.eduflow.util.ResponseUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.URI;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.Map;

/**
 * Serves single-page application (SPA) static files and assets from the built frontend directory.
 * Falls back to index.html for client-side HTML5 pushState routes.
 */
public class StaticFileHandler implements HttpHandler {
    private final File baseDir;
    private static final Map<String, String> MIME_TYPES = new HashMap<>();

    static {
        MIME_TYPES.put("html", "text/html; charset=UTF-8");
        MIME_TYPES.put("htm", "text/html; charset=UTF-8");
        MIME_TYPES.put("js", "application/javascript; charset=UTF-8");
        MIME_TYPES.put("mjs", "application/javascript; charset=UTF-8");
        MIME_TYPES.put("css", "text/css; charset=UTF-8");
        MIME_TYPES.put("json", "application/json; charset=UTF-8");
        MIME_TYPES.put("svg", "image/svg+xml");
        MIME_TYPES.put("png", "image/png");
        MIME_TYPES.put("jpg", "image/jpeg");
        MIME_TYPES.put("jpeg", "image/jpeg");
        MIME_TYPES.put("gif", "image/gif");
        MIME_TYPES.put("webp", "image/webp");
        MIME_TYPES.put("ico", "image/x-icon");
        MIME_TYPES.put("woff2", "font/woff2");
        MIME_TYPES.put("woff", "font/woff");
        MIME_TYPES.put("ttf", "font/ttf");
        MIME_TYPES.put("txt", "text/plain; charset=UTF-8");
    }

    public StaticFileHandler() {
        // Probe common distribution directories
        File dir = new File("client/dist");
        if (!dir.exists() || !dir.isDirectory()) {
            dir = new File("web");
        }
        if (!dir.exists() || !dir.isDirectory()) {
            dir = new File("static");
        }
        this.baseDir = dir;
        System.out.println("[StaticServer] Serving static frontend from: " + baseDir.getAbsolutePath());
    }

    public StaticFileHandler(File baseDir) {
        this.baseDir = baseDir;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (ResponseUtil.handleOptions(exchange)) return;

        String method = exchange.getRequestMethod();
        if (!"GET".equalsIgnoreCase(method) && !"HEAD".equalsIgnoreCase(method)) {
            ResponseUtil.sendError(exchange, 405, "Method Not Allowed");
            return;
        }

        URI uri = exchange.getRequestURI();
        String rawPath = uri.getPath();

        // Do not intercept API requests
        if (rawPath.startsWith("/api/") || rawPath.startsWith("/auth/")) {
            ResponseUtil.sendError(exchange, 404, "API endpoint not found");
            return;
        }

        // Clean path and protect against directory traversal
        String requestPath = rawPath.startsWith("/") ? rawPath.substring(1) : rawPath;
        File targetFile = new File(baseDir, requestPath).getCanonicalFile();
        File canonicalBase = baseDir.getCanonicalFile();

        // Security check
        if (!targetFile.getPath().startsWith(canonicalBase.getPath())) {
            ResponseUtil.sendError(exchange, 403, "Access Denied");
            return;
        }

        // Check if direct file exists
        if (targetFile.exists() && targetFile.isFile()) {
            serveFile(exchange, targetFile);
            return;
        }

        // Single Page Application (SPA) routing fallback:
        // Any navigation request without a file extension or not found in assets -> serve index.html
        File indexFile = new File(baseDir, "index.html");
        if (indexFile.exists() && indexFile.isFile()) {
            serveFile(exchange, indexFile);
        } else {
            String fallbackHtml = """
                <!DOCTYPE html>
                <html>
                <head><title>EduFlow LMS</title></head>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1>EduFlow LMS - Java Server Active</h1>
                    <p>Build the frontend with <code>npm run build</code> in <code>client/</code> to view the web UI.</p>
                    <p>API health endpoint: <a href="/api/health">/api/health</a></p>
                </body>
                </html>
                """;
            byte[] bytes = fallbackHtml.getBytes("UTF-8");
            exchange.getResponseHeaders().set("Content-Type", "text/html; charset=UTF-8");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }
    }

    private void serveFile(HttpExchange exchange, File file) throws IOException {
        String filename = file.getName();
        String ext = "";
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex > 0 && dotIndex < filename.length() - 1) {
            ext = filename.substring(dotIndex + 1).toLowerCase();
        }

        String mime = MIME_TYPES.getOrDefault(ext, "application/octet-stream");
        exchange.getResponseHeaders().set("Content-Type", mime);

        // Cache-control headers
        if (ext.equals("html")) {
            exchange.getResponseHeaders().set("Cache-Control", "no-cache, must-revalidate");
        } else if (filename.contains("-") || ext.equals("js") || ext.equals("css")) {
            // Fingerprinted assets can be cached
            exchange.getResponseHeaders().set("Cache-Control", "public, max-age=31536000, immutable");
        }

        long length = file.length();
        if ("HEAD".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(200, -1);
            return;
        }

        exchange.sendResponseHeaders(200, length);
        try (FileInputStream fis = new FileInputStream(file);
             OutputStream os = exchange.getResponseBody()) {
            fis.transferTo(os);
        }
    }
}
