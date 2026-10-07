package com.eduflow.util;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.util.HashMap;
import java.util.Map;

public class Config {
    private static final Map<String, String> envMap = new HashMap<>();

    static {
        loadEnvFile(new File(".env"));
        loadEnvFile(new File("../.env"));
    }

    private static void loadEnvFile(File file) {
        if (!file.exists()) return;
        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;
                int idx = line.indexOf('=');
                if (idx > 0) {
                    String key = line.substring(0, idx).trim();
                    String val = line.substring(idx + 1).trim();
                    if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.substring(1, val.length() - 1);
                    }
                    envMap.putIfAbsent(key, val);
                }
            }
        } catch (Exception ignored) {}
    }

    public static String get(String key, String defaultValue) {
        String sysEnv = System.getenv(key);
        if (sysEnv != null && !sysEnv.trim().isEmpty()) {
            return sysEnv.trim();
        }
        String mapVal = envMap.get(key);
        if (mapVal != null && !mapVal.trim().isEmpty()) {
            return mapVal.trim();
        }
        return defaultValue;
    }

    public static String get(String key) {
        return get(key, "");
    }
}
