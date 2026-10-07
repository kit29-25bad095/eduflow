package com.eduflow.model;

public class Assignment {
    private String id;
    private String _id;
    private String courseId;
    private String moduleId;
    private String title;
    private String description;
    private String instructions;
    private String dueDate;
    private int maxMarks;
    private String createdBy;

    // Attached student submission for current authenticated user
    private Submission mySubmission;

    public Assignment() {}

    public String getId() { return id != null ? id : _id; }
    public void setId(String id) { this.id = id; this._id = id; }
    public String get_id() { return _id != null ? _id : id; }
    public void set_id(String _id) { this._id = _id; this.id = _id; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getModuleId() { return moduleId; }
    public void setModuleId(String moduleId) { this.moduleId = moduleId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }

    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }

    public int getMaxMarks() { return maxMarks; }
    public void setMaxMarks(int maxMarks) { this.maxMarks = maxMarks; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public Submission getMySubmission() { return mySubmission; }
    public void setMySubmission(Submission mySubmission) { this.mySubmission = mySubmission; }
}
