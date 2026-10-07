package com.eduflow.model;

public class Certificate {
    private String id;
    private String _id;
    private String certificateId;
    private String studentId;
    private String courseId;
    private String courseName;
    private String studentName;
    private String issuedDate;
    private String certificateUrl;
    private String verificationCode;
    private String createdAt;

    public Certificate() {}

    public Certificate(String id, String certificateId, String studentId, String courseId,
                       String courseName, String studentName, String verificationCode) {
        this.id = id;
        this._id = id;
        this.certificateId = certificateId;
        this.studentId = studentId;
        this.courseId = courseId;
        this.courseName = courseName;
        this.studentName = studentName;
        this.verificationCode = verificationCode;
    }

    public String getId() { return id != null ? id : _id; }
    public void setId(String id) { this.id = id; this._id = id; }
    public String get_id() { return _id != null ? _id : id; }
    public void set_id(String _id) { this._id = _id; this.id = _id; }

    public String getCertificateId() { return certificateId; }
    public void setCertificateId(String certificateId) { this.certificateId = certificateId; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getIssuedDate() { return issuedDate; }
    public void setIssuedDate(String issuedDate) { this.issuedDate = issuedDate; }

    public String getCertificateUrl() { return certificateUrl; }
    public void setCertificateUrl(String certificateUrl) { this.certificateUrl = certificateUrl; }

    public String getVerificationCode() { return verificationCode; }
    public void setVerificationCode(String verificationCode) { this.verificationCode = verificationCode; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
