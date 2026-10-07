package com.eduflow.model;

public class Lesson {
    private String id;
    private String _id;
    private String moduleId;
    private String courseId;
    private String title;
    private String description;
    private String videoUrl;
    private String content;
    private int duration;
    private int order;
    private boolean isPreview;

    public Lesson() {}

    public Lesson(String id, String moduleId, String courseId, String title, String videoUrl, int duration, boolean isPreview) {
        this.id = id;
        this._id = id;
        this.moduleId = moduleId;
        this.courseId = courseId;
        this.title = title;
        this.videoUrl = videoUrl;
        this.duration = duration;
        this.isPreview = isPreview;
    }

    public String getId() { return id != null ? id : _id; }
    public void setId(String id) { this.id = id; this._id = id; }
    public String get_id() { return _id != null ? _id : id; }
    public void set_id(String _id) { this._id = _id; this.id = _id; }

    public String getModuleId() { return moduleId; }
    public void setModuleId(String moduleId) { this.moduleId = moduleId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public int getDuration() { return duration; }
    public void setDuration(int duration) { this.duration = duration; }

    public int getOrder() { return order; }
    public void setOrder(int order) { this.order = order; }

    public boolean isPreview() { return isPreview; }
    public void setPreview(boolean preview) { isPreview = preview; }
}
