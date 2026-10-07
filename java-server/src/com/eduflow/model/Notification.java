package com.eduflow.model;

public class Notification {
    private String id;
    private String _id;
    private String recipientId;
    private String type;
    private String title;
    private String message;
    private boolean read;
    private String createdAt;

    public Notification() {}

    public Notification(String id, String recipientId, String type, String title, String message) {
        this.id = id;
        this._id = id;
        this.recipientId = recipientId;
        this.type = type;
        this.title = title;
        this.message = message;
        this.read = false;
    }

    public String getId() { return id != null ? id : _id; }
    public void setId(String id) { this.id = id; this._id = id; }
    public String get_id() { return _id != null ? _id : id; }
    public void set_id(String _id) { this._id = _id; this.id = _id; }

    public String getRecipientId() { return recipientId; }
    public void setRecipientId(String recipientId) { this.recipientId = recipientId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
