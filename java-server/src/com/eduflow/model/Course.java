package com.eduflow.model;

import java.util.List;

public class Course {
    private String id;
    private String _id;
    private String title;
    private String slug;
    private String description;
    private String shortDescription;
    private String thumbnail;
    private String category;
    private String level;
    private String language;
    private double price;
    private String instructorId;
    private String duration;
    private String status;
    private double ratingAvg;
    private int ratingCount;
    private int enrolledCount;
    private String createdAt;

    // Associated populated entities for frontend compatibility
    private User instructor;
    private List<Module> modules;
    private Rating rating;
    private int assignmentCount;
    private boolean isEnrolled;

    public static class Rating {
        public double average;
        public int count;
        public Rating(double average, int count) {
            this.average = average;
            this.count = count;
        }
    }

    public Course() {}

    public String getId() { return id != null ? id : _id; }
    public void setId(String id) { this.id = id; this._id = id; }
    public String get_id() { return _id != null ? _id : id; }
    public void set_id(String _id) { this._id = _id; this.id = _id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getShortDescription() { return shortDescription; }
    public void setShortDescription(String shortDescription) { this.shortDescription = shortDescription; }

    public String getThumbnail() { return thumbnail; }
    public void setThumbnail(String thumbnail) { this.thumbnail = thumbnail; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public String getInstructorId() { return instructorId; }
    public void setInstructorId(String instructorId) { this.instructorId = instructorId; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public double getRatingAvg() { return ratingAvg; }
    public void setRatingAvg(double ratingAvg) { this.ratingAvg = ratingAvg; }

    public int getRatingCount() { return ratingCount; }
    public void setRatingCount(int ratingCount) { this.ratingCount = ratingCount; }

    public int getEnrolledCount() { return enrolledCount; }
    public void setEnrolledCount(int enrolledCount) { this.enrolledCount = enrolledCount; }

    public User getInstructor() { return instructor; }
    public void setInstructor(User instructor) { this.instructor = instructor; }

    public List<Module> getModules() { return modules; }
    public void setModules(List<Module> modules) { this.modules = modules; }

    public Rating getRating() {
        if (rating == null) {
            rating = new Rating(ratingAvg, ratingCount);
        }
        return rating;
    }
    public void setRating(Rating rating) { this.rating = rating; }

    public int getAssignmentCount() { return assignmentCount; }
    public void setAssignmentCount(int assignmentCount) { this.assignmentCount = assignmentCount; }

    public boolean isEnrolled() { return isEnrolled; }
    public void setEnrolled(boolean enrolled) { isEnrolled = enrolled; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
