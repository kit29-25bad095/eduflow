package com.eduflow.model;

import java.util.ArrayList;
import java.util.List;

public class Quiz {
    private String id;
    private String courseId;
    private String moduleId;
    private String title;
    private String description;
    private int passingScore;
    private int orderNum;
    private String createdAt;

    private List<QuizQuestion> questions = new ArrayList<>();
    private QuizAttempt userAttempt; // populated for the viewing student

    public Quiz() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getModuleId() { return moduleId; }
    public void setModuleId(String moduleId) { this.moduleId = moduleId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getPassingScore() { return passingScore > 0 ? passingScore : 70; }
    public void setPassingScore(int passingScore) { this.passingScore = passingScore; }

    public int getOrderNum() { return orderNum; }
    public void setOrderNum(int orderNum) { this.orderNum = orderNum; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public List<QuizQuestion> getQuestions() { return questions; }
    public void setQuestions(List<QuizQuestion> questions) { this.questions = questions; }

    public QuizAttempt getUserAttempt() { return userAttempt; }
    public void setUserAttempt(QuizAttempt userAttempt) { this.userAttempt = userAttempt; }
}
