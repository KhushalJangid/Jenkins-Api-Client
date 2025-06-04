package com.example.jenkinsapi.model;

import java.util.Map;

public class BuildRequest {
    private String job;
    private Map<String, String> parameters;

    public String getJob() { return job; }
    public void setJob(String job) { this.job = job; }

    public Map<String, String> getParameters() { return parameters; }
    public void setParameters(Map<String, String> parameters) { this.parameters = parameters; }
}
