package com.eduflow.util;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

public class JwtUtil {
    private static final String SECRET = "eduflow_jwt_super_secret_key_2026_production_grade";
    private static final long EXPIRATION_MS = 30L * 24 * 60 * 60 * 1000; // 30 days
    private static final Gson gson = new Gson();

    public static String generateToken(String userId, String email, String role) {
        try {
            JsonObject header = new JsonObject();
            header.addProperty("alg", "HS256");
            header.addProperty("typ", "JWT");

            JsonObject payload = new JsonObject();
            payload.addProperty("id", userId);
            payload.addProperty("email", email);
            payload.addProperty("role", role);
            payload.addProperty("iat", System.currentTimeMillis() / 1000);
            payload.addProperty("exp", (System.currentTimeMillis() + EXPIRATION_MS) / 1000);

            String encodedHeader = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(header.toString().getBytes(StandardCharsets.UTF_8));
            String encodedPayload = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(payload.toString().getBytes(StandardCharsets.UTF_8));

            String content = encodedHeader + "." + encodedPayload;
            String signature = sign(content, SECRET);

            return content + "." + signature;
        } catch (Exception e) {
            throw new RuntimeException("Error generating token", e);
        }
    }

    public static JsonObject verifyToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return null;
        }
        if (token.startsWith("Bearer ")) {
            token = token.substring(7).trim();
        }

        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return null;
            }

            String content = parts[0] + "." + parts[1];
            String expectedSignature = sign(content, SECRET);

            if (!expectedSignature.equals(parts[2])) {
                return null; // Signature mismatch
            }

            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            JsonObject payload = gson.fromJson(payloadJson, JsonObject.class);

            if (payload.has("exp")) {
                long exp = payload.get("exp").getAsLong();
                if (System.currentTimeMillis() / 1000 > exp) {
                    return null; // Expired
                }
            }

            return payload;
        } catch (Exception e) {
            return null;
        }
    }

    private static String sign(String data, String key) throws Exception {
        Mac sha256Hmac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256Hmac.init(secretKey);
        byte[] hash = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
    }
}
