package com.example.jenkinsapi.model;

import java.util.List;

public class ParameterDefinition {
    private String name;
    private List<String> choices;

    public ParameterDefinition() {}

    public ParameterDefinition(String name, List<String> choices) {
        this.name = name;
        this.choices = choices;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public List<String> getChoices() { return choices; }
    public void setChoices(List<String> choices) { this.choices = choices; }
}
