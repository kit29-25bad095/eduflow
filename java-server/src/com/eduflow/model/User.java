package com.eduflow.model;

public class User {
    private String id;
    private String _id; // For JSON compatibility with React frontend
    private String name;
    private String email;
    private transient String password;
    private String googleId;
    private String authProvider = "LOCAL";
    private String role;
    private String profileImage;
    private String bio;
    private String skills;
    private String degree = "";
    private String specialization = "";
    private String institution = "";
    private String courseInterests = "";
    private String learningGoals = "";
    private boolean profileCompleted = false;
    private boolean isActive;
    private String createdAt;
    private String updatedAt;

    public User() {}

    public User(String id, String name, String email, String password, String role) {
        this.id = id;
        this._id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.authProvider = "LOCAL";
        this.isActive = true;
    }

    public String getId() { return id != null ? id : _id; }
    public void setId(String id) { this.id = id; this._id = id; }
    public String get_id() { return _id != null ? _id : id; }
    public void set_id(String _id) { this._id = _id; this.id = _id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getGoogleId() { return googleId; }
    public void setGoogleId(String googleId) { this.googleId = googleId; }

    public String getAuthProvider() { return authProvider != null ? authProvider : "LOCAL"; }
    public void setAuthProvider(String authProvider) { this.authProvider = authProvider; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }

    public String getDegree() { return degree != null ? degree : ""; }
    public void setDegree(String degree) { this.degree = degree; }

    public String getSpecialization() { return specialization != null ? specialization : ""; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getInstitution() { return institution != null ? institution : ""; }
    public void setInstitution(String institution) { this.institution = institution; }

    public String getCourseInterests() { return courseInterests != null ? courseInterests : ""; }
    public void setCourseInterests(String courseInterests) { this.courseInterests = courseInterests; }

    public String getLearningGoals() { return learningGoals != null ? learningGoals : ""; }
    public void setLearningGoals(String learningGoals) { this.learningGoals = learningGoals; }

    public boolean isProfileCompleted() { return profileCompleted; }
    public void setProfileCompleted(boolean profileCompleted) { this.profileCompleted = profileCompleted; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
