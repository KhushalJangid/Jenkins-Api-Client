package com.example.jenkinsapi.controller;

import com.example.jenkinsapi.model.*;
import com.example.jenkinsapi.service.JenkinsClient;

// import java.io.IOException;
import java.util.HashMap;
// import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/jenkins")
@CrossOrigin(origins = "http://localhost:5173")
public class JenkinsController {

    private final Map<String, Map<String, String>> sessionStore = new ConcurrentHashMap<>();

    @Autowired
    private JenkinsClient client;

    @PostMapping("/config")
    public ResponseEntity<?> configure(@RequestBody JenkinsConfig config) throws Exception {
        boolean status = client.configure(config.getUrl(), config.getUsername(), config.getApiToken());
        if (status) {
            return ResponseEntity.ok("Configured successfully.");
        } else {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/jobs")
    public ResponseEntity<?> listJobs(@RequestBody JobPathProvider request) throws Exception {
        System.out.println(request.getPath());
        return ResponseEntity.ok(client.getAllJobNames(request.getPath()));
    }

    @PostMapping("/job/get")
    public ResponseEntity<?> getJob(@RequestBody JobPathProvider request) {
        try {
            Map<String, Object> jobDetails = client.getJobDetails(request.getPath());
            return ResponseEntity.ok(jobDetails);
        } catch (Exception e) {
            System.err.println(e.toString());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch job details"));
        }
    }

    @PostMapping("/jobs/trigger")
    public ResponseEntity<?> triggerJob(@RequestBody BuildRequest request) throws Exception {
        if (request.getParameters() == null || request.getParameters().isEmpty()) {
            client.triggerJob(request.getJob());
        } else {
            client.triggerJobWithParams(request.getJob(), request.getParameters());
        }
        System.out.println("job " + request.getJob() + " Triggered");
        return ResponseEntity.ok("Triggered.");
    }

    @PostMapping("/logs/status")
    public boolean checkBuildStart(@RequestBody JobPathProvider request) {
        return client.hasJobStarted(request.getPath(), Integer.toString(request.getBuildNumber()));
    }

    @PostMapping("/logs/session")
    public Map<String, String> startSession(@RequestBody JobPathProvider request) {
        String sessionId = UUID.randomUUID().toString();
        sessionStore.put(sessionId,
                Map.of(
                        "jobPath", request.getPath(),
                        "buildNumber", Integer.toString(request.getBuildNumber())
                )
        ); // Store request temporarily
        return Map.of("sessionId", sessionId);
    }

    @GetMapping(value = "/logs/stream/{sessionId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamLogs(@PathVariable("sessionId") UUID sessionId) {
        SseEmitter emitter = new SseEmitter(0L); // no timeout
        String jobPath = sessionStore.get(sessionId.toString()).get("jobPath");
        String buildNumber = sessionStore.get(sessionId.toString()).get("buildNumber");
        new Thread(() -> {
            client.streamConsoleLogs(emitter, jobPath, buildNumber);
        }).start();

        return emitter;
    }

    @PostMapping("/testcases/list")
    public Map<String, Map<String,Object>> getTestCases(@RequestBody ScmProvider request) {
        Runner runner = new Runner();
        try {
            Map<String, Map<String,Object>> results = runner.cloneAndScanRepo(request.getScmUrl(), request.getBranchName());
            results.forEach((k, v) -> {
                System.out.println("Suite Name: " + k);
                v.forEach((y,z)-> {
                    System.out.println(y);
                    System.out.println(z);
                });
            });
            return results;
        } catch (Exception e) {
            e.printStackTrace();
            return new HashMap<>();
        }
    }
}
