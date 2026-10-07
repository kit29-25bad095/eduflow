package com.eduflow.server;

import com.eduflow.dao.NotificationDAO;
import com.eduflow.dao.UserDAO;
import com.eduflow.model.User;
import com.eduflow.util.*;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class AuthHandler implements HttpHandler {
    private final UserDAO userDAO = new UserDAO();
    private final NotificationDAO notificationDAO = new NotificationDAO();
    private final Gson gson = new Gson();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (ResponseUtil.handleOptions(exchange)) return;

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod().toUpperCase();

        try {
            if ("/api/auth/login".equals(path) && "POST".equals(method)) {
                handleLogin(exchange);
            } else if ("/api/auth/register".equals(path) && "POST".equals(method)) {
                handleRegister(exchange);
            } else if (("/api/auth/google".equals(path) || "/auth/google".equals(path)) && "GET".equals(method)) {
                handleGoogleOAuthRedirect(exchange);
            } else if (("/api/auth/google/callback".equals(path) || "/auth/google/callback".equals(path)) && "GET".equals(method)) {
                handleGoogleOAuthCallback(exchange);
            } else if ("/api/auth/google/consent".equals(path) && "GET".equals(method)) {
                handleGoogleConsentScreen(exchange);
            } else if ("/api/auth/google/status".equals(path) && "GET".equals(method)) {
                handleGoogleStatus(exchange);
            } else if ("/api/auth/google".equals(path) && "POST".equals(method)) {
                handleGoogleLogin(exchange);
            } else if ("/api/auth/me".equals(path) && "GET".equals(method)) {
                handleGetMe(exchange);
            } else if ("/api/auth/profile".equals(path) && "PUT".equals(method)) {
                handleUpdateProfile(exchange);
            } else if ("/api/auth/change-password".equals(path) && "PUT".equals(method)) {
                handleChangePassword(exchange);
            } else if ("/api/auth/forgot-password".equals(path) && "POST".equals(method)) {
                ResponseUtil.sendSuccess(exchange, 200, null, "Password reset instructions sent (mock for security).");
            } else {
                ResponseUtil.sendError(exchange, 404, "Auth endpoint not found: " + path, "NOT_FOUND");
            }
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtil.sendError(exchange, 500, "Server error: " + e.getMessage(), "SERVER_ERROR");
        }
    }

    private void handleLogin(HttpExchange exchange) throws IOException, SQLException {
        String body = ResponseUtil.readRequestBody(exchange);
        JsonObject json = ResponseUtil.getGson().fromJson(body, JsonObject.class);
        if (json == null || !json.has("email") || !json.has("password")) {
            ResponseUtil.sendError(exchange, 400, "Please provide email and password", "MISSING_CREDENTIALS");
            return;
        }

        String email = json.get("email").getAsString().trim().toLowerCase();
        String password = json.get("password").getAsString();

        User user = userDAO.findByEmail(email);
        if (user == null || user.getPassword() == null || user.getPassword().isEmpty() || !PasswordUtil.checkPassword(password, user.getPassword())) {
            ResponseUtil.sendError(exchange, 401, "Invalid email or password", "INVALID_CREDENTIALS");
            return;
        }

        if (!user.isActive()) {
            ResponseUtil.sendError(exchange, 403, "Your account has been deactivated. Please contact support.", "ACCOUNT_DEACTIVATED");
            return;
        }

        String token = JwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());

        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("user", user);

        ResponseUtil.sendSuccess(exchange, 200, data, "Logged in successfully");
    }

    private void handleRegister(HttpExchange exchange) throws IOException, SQLException {
        String body = ResponseUtil.readRequestBody(exchange);
        JsonObject json = ResponseUtil.getGson().fromJson(body, JsonObject.class);
        if (json == null || !json.has("name") || !json.has("email") || !json.has("password")) {
            ResponseUtil.sendError(exchange, 400, "Please provide name, email, and password", "MISSING_FIELDS");
            return;
        }

        String name = json.get("name").getAsString().trim();
        String email = json.get("email").getAsString().trim().toLowerCase();
        String password = json.get("password").getAsString();
        String role = json.has("role") ? json.get("role").getAsString().trim() : "student";

        if ("admin".equalsIgnoreCase(role)) {
            ResponseUtil.sendError(exchange, 403, "Admin accounts cannot be registered publicly.", "ADMIN_REGISTRATION_FORBIDDEN");
            return;
        }

        if (userDAO.findByEmail(email) != null) {
            ResponseUtil.sendError(exchange, 400, "An account with this email address already exists.", "EMAIL_ALREADY_EXISTS");
            return;
        }

        User newUser = new User();
        newUser.setName(name);
        newUser.setEmail(email);
        newUser.setPassword(password);
        newUser.setRole("instructor".equalsIgnoreCase(role) ? "instructor" : "student");
        newUser.setAuthProvider("LOCAL");

        User created = userDAO.createUser(newUser);
        String token = JwtUtil.generateToken(created.getId(), created.getEmail(), created.getRole());

        notificationDAO.createNotification(created.getId(), "SYSTEM", "Welcome to EduFlow LMS!", "Welcome " + created.getName() + "! Your account has been initialized.");

        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("user", created);

        ResponseUtil.sendSuccess(exchange, 201, data, "Account registered successfully");
    }

    private void handleGoogleOAuthRedirect(HttpExchange exchange) throws IOException {
        String state = "state_" + UUID.randomUUID().toString().substring(0, 8);
        if (GoogleAuthService.isConfigured()) {
            String url = GoogleAuthService.getAuthorizationUrl(state);
            exchange.getResponseHeaders().set("Location", url);
            exchange.sendResponseHeaders(302, -1);
        } else {
            exchange.getResponseHeaders().set("Location", "/api/auth/google/consent?state=" + state);
            exchange.sendResponseHeaders(302, -1);
        }
    }

    private void handleGoogleOAuthCallback(HttpExchange exchange) throws IOException, SQLException {
        Map<String, String> query = ResponseUtil.parseQueryParams(exchange);
        String clientUrl = Config.get("CLIENT_URL", "http://localhost:5555");

        if (query.containsKey("error")) {
            String error = query.get("error");
            exchange.getResponseHeaders().set("Location", clientUrl + "/login?error=" + ("access_denied".equals(error) ? "google_cancelled" : "google_failed"));
            exchange.sendResponseHeaders(302, -1);
            return;
        }

        String code = query.get("code");
        if (code == null || code.trim().isEmpty()) {
            exchange.getResponseHeaders().set("Location", clientUrl + "/login?error=missing_code");
            exchange.sendResponseHeaders(302, -1);
            return;
        }

        String googleId = "";
        String email = "";
        String name = "Google User";
        String profileImage = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80";

        try {
            if (code.startsWith("sim_oauth_")) {
                // Decode simulated OAuth token
                String base64Data = code.substring("sim_oauth_".length());
                String jsonStr = new String(Base64.getUrlDecoder().decode(base64Data), StandardCharsets.UTF_8);
                JsonObject info = gson.fromJson(jsonStr, JsonObject.class);
                email = info.get("email").getAsString().trim().toLowerCase();
                name = info.has("name") ? info.get("name").getAsString().trim() : "Google User";
                googleId = info.has("id") ? info.get("id").getAsString() : "g_" + System.currentTimeMillis();
                if (info.has("profileImage")) profileImage = info.get("profileImage").getAsString();
            } else {
                // Real Google Cloud OAuth 2.0 exchange
                JsonObject tokens = GoogleAuthService.exchangeCodeForTokens(code);
                String accessToken = tokens.get("access_token").getAsString();
                JsonObject profile = GoogleAuthService.fetchGoogleUserProfile(accessToken);

                googleId = profile.has("sub") ? profile.get("sub").getAsString() : "";
                email = profile.get("email").getAsString().trim().toLowerCase();
                name = profile.has("name") ? profile.get("name").getAsString() : "Google User";
                if (profile.has("picture")) profileImage = profile.get("picture").getAsString();
            }
        } catch (Exception e) {
            System.err.println("[Google OAuth Error] Token exchange failed: " + e.getMessage());
            exchange.getResponseHeaders().set("Location", clientUrl + "/login?error=token_exchange_failed");
            exchange.sendResponseHeaders(302, -1);
            return;
        }

        // Database logic via JDBC
        User user = userDAO.findByEmail(email);
        if (user != null) {
            // Existing user: Link Google ID and update provider
            userDAO.linkGoogleAccount(user.getId(), googleId, profileImage);
            user = userDAO.findById(user.getId());
        } else {
            // New user: Automatically create account with default role STUDENT
            User newUser = new User();
            newUser.setName(name);
            newUser.setEmail(email);
            newUser.setPassword(null); // No password required for Google auth
            newUser.setGoogleId(googleId);
            newUser.setAuthProvider("GOOGLE");
            newUser.setRole("student"); // Strict: default role is STUDENT
            newUser.setProfileImage(profileImage);
            user = userDAO.createUser(newUser);

            notificationDAO.createNotification(user.getId(), "SYSTEM", "Welcome to EduFlow LMS!",
                    "You have registered via Google OAuth. Explore our comprehensive catalog to get started!");
        }

        // Generate application JWT session
        String token = JwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());

        // Redirect to client callback handler with token
        exchange.getResponseHeaders().set("Location", clientUrl + "/oauth-callback?token=" + token);
        exchange.sendResponseHeaders(302, -1);
    }

    private void handleGoogleConsentScreen(HttpExchange exchange) throws IOException {
        String query = exchange.getRequestURI().getQuery();
        String state = "eduflow";
        if (query != null && query.contains("state=")) {
            state = query.substring(query.indexOf("state=") + 6);
            if (state.contains("&")) state = state.substring(0, state.indexOf("&"));
        }

        String html = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <title>Sign in with Google - EduFlow LMS</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <script src="https://cdn.tailwindcss.com"></script>
              <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
              <style>body { font-family: 'Roboto', sans-serif; }</style>
            </head>
            <body class="bg-slate-100 min-h-screen flex items-center justify-center p-4">
              <div class="bg-white rounded-3xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
                <div class="p-8 text-center space-y-4 border-b border-slate-100">
                  <div class="flex justify-center">
                    <svg class="w-10 h-10" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                  </div>
                  <div>
                    <h1 class="text-xl font-bold text-slate-800">Sign in with Google</h1>
                    <p class="text-xs text-slate-500 mt-1">Choose an account to continue to <span class="font-semibold text-slate-700">EduFlow LMS</span></p>
                  </div>
                </div>

                <div class="p-6 space-y-3">
                  <!-- Account 1 -->
                  <button onclick="authorize('student1@eduflow.com', 'Alex Johnson', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')"
                    class="w-full flex items-center gap-3.5 p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" class="w-10 h-10 rounded-full object-cover">
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-bold text-slate-800">Alex Johnson</div>
                      <div class="text-[11px] text-slate-500">student1@eduflow.com</div>
                    </div>
                    <span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Student</span>
                  </button>

                  <!-- Account 2 -->
                  <button onclick="authorize('sarah.lin@eduflow.com', 'Dr. Sarah Lin', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80')"
                    class="w-full flex items-center gap-3.5 p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left">
                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80" class="w-10 h-10 rounded-full object-cover">
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-bold text-slate-800">Dr. Sarah Lin</div>
                      <div class="text-[11px] text-slate-500">sarah.lin@eduflow.com</div>
                    </div>
                    <span class="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Instructor</span>
                  </button>

                  <!-- Custom Email -->
                  <div class="pt-3 border-t border-slate-100">
                    <div class="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Use another Google account</div>
                    <div class="space-y-2">
                      <input id="customEmail" type="email" placeholder="name@gmail.com" class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500">
                      <input id="customName" type="text" placeholder="Full Name" class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500">
                      <button onclick="authorizeCustom()" class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm">
                        Continue to EduFlow
                      </button>
                    </div>
                  </div>

                  <div class="pt-2 text-center">
                    <a href="/api/auth/google/callback?error=access_denied" class="text-xs text-slate-400 hover:text-slate-600 underline">Cancel</a>
                  </div>
                </div>

                <div class="p-4 bg-slate-50 text-center border-t border-slate-100">
                  <p class="text-[10px] text-slate-400">To enable production Google OAuth, configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env</p>
                </div>
              </div>

              <script>
                function authorize(email, name, img) {
                  const data = { email, name, profileImage: img, id: 'g_' + Math.floor(Math.random() * 900000 + 100000) };
                  const b64 = btoa(JSON.stringify(data));
                  window.location.href = '/api/auth/google/callback?code=sim_oauth_' + b64 + '&state=STATE_PLACEHOLDER';
                }
                function authorizeCustom() {
                  const email = document.getElementById('customEmail').value.trim();
                  const name = document.getElementById('customName').value.trim() || email.split('@')[0];
                  if (!email) { alert('Please enter your Google email'); return; }
                  authorize(email, name, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');
                }
              </script>
            </body>
            </html>
        """.replace("STATE_PLACEHOLDER", state);

        exchange.getResponseHeaders().set("Content-Type", "text/html; charset=UTF-8");
        byte[] bytes = html.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private void handleGoogleStatus(HttpExchange exchange) throws IOException {
        Map<String, Object> data = new HashMap<>();
        data.put("configured", GoogleAuthService.isConfigured());
        data.put("clientId", Config.get("GOOGLE_CLIENT_ID", ""));
        data.put("redirectUri", Config.get("GOOGLE_REDIRECT_URI", "http://localhost:5555/api/auth/google/callback"));
        ResponseUtil.sendSuccess(exchange, 200, data, null);
    }

    private void handleGoogleLogin(HttpExchange exchange) throws IOException, SQLException {
        String body = ResponseUtil.readRequestBody(exchange);
        JsonObject json = ResponseUtil.getGson().fromJson(body, JsonObject.class);
        if (json == null || !json.has("email")) {
            ResponseUtil.sendError(exchange, 400, "Google account email is required", "MISSING_FIELDS");
            return;
        }

        String email = json.get("email").getAsString().trim().toLowerCase();
        String name = json.has("name") ? json.get("name").getAsString().trim() : "Google User";
        String googleId = json.has("googleId") ? json.get("googleId").getAsString() : "";
        String profileImage = json.has("profileImage") ? json.get("profileImage").getAsString() : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80";

        User user = userDAO.findByEmail(email);
        if (user == null) {
            User newUser = new User();
            newUser.setName(name);
            newUser.setEmail(email);
            newUser.setPassword(null);
            newUser.setGoogleId(googleId);
            newUser.setAuthProvider("GOOGLE");
            newUser.setRole("student");
            newUser.setProfileImage(profileImage);
            user = userDAO.createUser(newUser);

            notificationDAO.createNotification(user.getId(), "SYSTEM", "Connected via Google Sign-In",
                    "Welcome " + user.getName() + "! Your account was signed in with Google.");
        } else {
            if (!user.isActive()) {
                ResponseUtil.sendError(exchange, 403, "Your account has been deactivated. Please contact support.", "ACCOUNT_DEACTIVATED");
                return;
            }
            if (googleId != null && !googleId.isEmpty()) {
                userDAO.linkGoogleAccount(user.getId(), googleId, profileImage);
            }
        }

        String token = JwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("user", user);

        ResponseUtil.sendSuccess(exchange, 200, data, "Signed in with Google successfully");
    }

    private void handleGetMe(HttpExchange exchange) throws IOException, SQLException {
        String token = ResponseUtil.getAuthToken(exchange);
        JsonObject claims = JwtUtil.verifyToken(token);
        if (claims == null) {
            ResponseUtil.sendError(exchange, 401, "Not authorized to access this route", "UNAUTHORIZED");
            return;
        }

        String userId = claims.get("id").getAsString();
        User user = userDAO.findById(userId);
        if (user == null) {
            ResponseUtil.sendError(exchange, 404, "User not found", "USER_NOT_FOUND");
            return;
        }

        ResponseUtil.sendSuccess(exchange, 200, user, null);
    }

    private void handleUpdateProfile(HttpExchange exchange) throws IOException, SQLException {
        String token = ResponseUtil.getAuthToken(exchange);
        JsonObject claims = JwtUtil.verifyToken(token);
        if (claims == null) {
            ResponseUtil.sendError(exchange, 401, "Not authorized", "UNAUTHORIZED");
            return;
        }

        String userId = claims.get("id").getAsString();
        String body = ResponseUtil.readRequestBody(exchange);
        JsonObject json = ResponseUtil.getGson().fromJson(body, JsonObject.class);

        String name = json.has("name") ? json.get("name").getAsString() : null;
        String bio = json.has("bio") ? json.get("bio").getAsString() : null;
        String skills = json.has("skills") ? json.get("skills").getAsString() : null;
        String profileImage = json.has("profileImage") ? json.get("profileImage").getAsString() : null;

        userDAO.updateProfile(userId, name, bio, skills, profileImage);
        User updated = userDAO.findById(userId);
        ResponseUtil.sendSuccess(exchange, 200, updated, "Profile updated successfully");
    }

    private void handleChangePassword(HttpExchange exchange) throws IOException, SQLException {
        String token = ResponseUtil.getAuthToken(exchange);
        JsonObject claims = JwtUtil.verifyToken(token);
        if (claims == null) {
            ResponseUtil.sendError(exchange, 401, "Not authorized", "UNAUTHORIZED");
            return;
        }

        String userId = claims.get("id").getAsString();
        String body = ResponseUtil.readRequestBody(exchange);
        JsonObject json = ResponseUtil.getGson().fromJson(body, JsonObject.class);

        if (json == null || !json.has("currentPassword") || !json.has("newPassword")) {
            ResponseUtil.sendError(exchange, 400, "Please provide current and new password", "MISSING_FIELDS");
            return;
        }

        User user = userDAO.findById(userId);
        if (user == null || user.getPassword() == null || !PasswordUtil.checkPassword(json.get("currentPassword").getAsString(), user.getPassword())) {
            ResponseUtil.sendError(exchange, 400, "Current password is incorrect", "INCORRECT_PASSWORD");
            return;
        }

        userDAO.updatePassword(userId, json.get("newPassword").getAsString());
        ResponseUtil.sendSuccess(exchange, 200, null, "Password updated successfully");
    }
}
