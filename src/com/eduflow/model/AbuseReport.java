package com.eduflow.model;

public class AbuseReport {
    private String id;
    private String reviewId;
    private String courseId;
    private String courseTitle;
    private String studentId;
    private String studentName;
    private String studentEmail;
    private String studentImage;
    private boolean studentActive = true;
    private String instructorId;
    private String instructorName;
    private String instructorEmail;
    private String reason;
    private String commentSnippet;
    private String status = "pending";
    private String adminNotes = "";
    private String createdAt;

    public AbuseReport() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getReviewId() { return reviewId; }
    public void setReviewId(String reviewId) { this.reviewId = reviewId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getStudentEmail() { return studentEmail; }
    public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }

    public String getStudentImage() { return studentImage; }
    public void setStudentImage(String studentImage) { this.studentImage = studentImage; }

    public boolean isStudentActive() { return studentActive; }
    public void setStudentActive(boolean studentActive) { this.studentActive = studentActive; }

    public String getInstructorId() { return instructorId; }
    public void setInstructorId(String instructorId) { this.instructorId = instructorId; }

    public String getInstructorName() { return instructorName; }
    public void setInstructorName(String instructorName) { this.instructorName = instructorName; }

    public String getInstructorEmail() { return instructorEmail; }
    public void setInstructorEmail(String instructorEmail) { this.instructorEmail = instructorEmail; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getCommentSnippet() { return commentSnippet; }
    public void setCommentSnippet(String commentSnippet) { this.commentSnippet = commentSnippet; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
