package com.eduflow.model;

public class Enrollment {
    private String id;
    private String _id;
    private String studentId;
    private String courseId;
    private String status;
    private String enrolledAt;
    private String completedAt;
    private String lastAccessedAt;

    private Course course;
    private int progress;
    private int completedLessons;
    private int totalLessons;

    public Enrollment() {}

    public String getId() { return id != null ? id : _id; }
    public void setId(String id) { this.id = id; this._id = id; }
    public String get_id() { return _id != null ? _id : id; }
    public void set_id(String _id) { this._id = _id; this.id = _id; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getEnrolledAt() { return enrolledAt; }
    public void setEnrolledAt(String enrolledAt) { this.enrolledAt = enrolledAt; }

    public String getCompletedAt() { return completedAt; }
    public void setCompletedAt(String completedAt) { this.completedAt = completedAt; }

    public String getLastAccessedAt() { return lastAccessedAt; }
    public void setLastAccessedAt(String lastAccessedAt) { this.lastAccessedAt = lastAccessedAt; }

    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }

    public int getProgress() { return progress; }
    public void setProgress(int progress) { this.progress = progress; }

    public int getCompletedLessons() { return completedLessons; }
    public void setCompletedLessons(int completedLessons) { this.completedLessons = completedLessons; }

    public int getTotalLessons() { return totalLessons; }
    public void setTotalLessons(int totalLessons) { this.totalLessons = totalLessons; }
}
