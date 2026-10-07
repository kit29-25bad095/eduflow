package com.eduflow.model;

import java.util.ArrayList;
import java.util.List;

public class Module {
    private String id;
    private String _id;
    private String courseId;
    private String title;
    private String description;
    private int order;
    private List<Lesson> lessons = new ArrayList<>();

    public Module() {}

    public Module(String id, String courseId, String title, String description, int order) {
        this.id = id;
        this._id = id;
        this.courseId = courseId;
        this.title = title;
        this.description = description;
        this.order = order;
    }

    public String getId() { return id != null ? id : _id; }
    public void setId(String id) { this.id = id; this._id = id; }
    public String get_id() { return _id != null ? _id : id; }
    public void set_id(String _id) { this._id = _id; this.id = _id; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getOrder() { return order; }
    public void setOrder(int order) { this.order = order; }

    public List<Lesson> getLessons() { return lessons; }
    public void setLessons(List<Lesson> lessons) { this.lessons = lessons; }
}
