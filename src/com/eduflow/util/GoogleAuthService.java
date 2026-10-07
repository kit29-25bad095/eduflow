package com.eduflow.util;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

public class GoogleAuthService {
    private static final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private static final Gson gson = new Gson();

    public static boolean isConfigured() {
        String clientId = Config.get("GOOGLE_CLIENT_ID");
        String clientSecret = Config.get("GOOGLE_CLIENT_SECRET");
        return clientId != null && !clientId.isEmpty() && clientSecret != null && !clientSecret.isEmpty();
    }

    public static String getAuthorizationUrl(String state) {
        String clientId = Config.get("GOOGLE_CLIENT_ID");
        String redirectUri = Config.get("GOOGLE_REDIRECT_URI", "http://localhost:5555/api/auth/google/callback");

        try {
            return "https://accounts.google.com/o/oauth2/v2/auth?" +
                    "client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8) +
                    "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8) +
                    "&response_type=code" +
                    "&scope=" + URLEncoder.encode("openid email profile", StandardCharsets.UTF_8) +
                    "&access_type=offline" +
                    "&prompt=select_account" +
                    "&state=" + URLEncoder.encode(state != null ? state : "eduflow_state", StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Error building Google OAuth URL", e);
        }
    }

    public static JsonObject exchangeCodeForTokens(String code) throws Exception {
        String clientId = Config.get("GOOGLE_CLIENT_ID");
        String clientSecret = Config.get("GOOGLE_CLIENT_SECRET");
        String redirectUri = Config.get("GOOGLE_REDIRECT_URI", "http://localhost:5555/api/auth/google/callback");

        String form = "code=" + URLEncoder.encode(code, StandardCharsets.UTF_8) +
                "&client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8) +
                "&client_secret=" + URLEncoder.encode(clientSecret, StandardCharsets.UTF_8) +
                "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8) +
                "&grant_type=authorization_code";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://oauth2.googleapis.com/token"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new RuntimeException("Google token exchange failed HTTP " + response.statusCode() + ": " + response.body());
        }

        return gson.fromJson(response.body(), JsonObject.class);
    }

    public static JsonObject fetchGoogleUserProfile(String accessToken) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://www.googleapis.com/oauth2/v3/userinfo"))
                .header("Authorization", "Bearer " + accessToken)
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new RuntimeException("Google userinfo fetch failed HTTP " + response.statusCode() + ": " + response.body());
        }

        return gson.fromJson(response.body(), JsonObject.class);
    }
}
