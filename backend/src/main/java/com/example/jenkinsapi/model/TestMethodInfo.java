package com.example.jenkinsapi.model;

public class TestMethodInfo {
    private String className;
    private String methodName; // null means all methods in the class

    public TestMethodInfo(String className, String methodName) {
        this.className = className;
        this.methodName = methodName;
    }

    // Getters and setters (or use Lombok @Data)
    public String getClassName() { return className; }
    public String getMethodName() { return methodName; }
    public void setClassName(String className) { this.className = className; }
    public void setMethodName(String methodName) { this.methodName = methodName; }
}
