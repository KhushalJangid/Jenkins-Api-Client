package com.example.jenkinsapi.model;

import java.util.List;
import java.util.Map;

public class ChatRequest {
    private List<Map<String, Object>> history;

    public List<Map<String, Object>> getHistory() {
        return history;
    }

    public void setHistory(List<Map<String, Object>> history) {
        this.history = history;
    }

}
