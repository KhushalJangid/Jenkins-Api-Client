package com.example.jenkinsapi.controller;

// import com.example.jenkinsapi.model.TestMethodInfo;
import com.example.jenkinsapi.service.SuiteScanner;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
// import java.util.List;
import java.util.Map;
import java.util.UUID;

public class Runner {

    private final SuiteScanner scanner = new SuiteScanner();

    /**
     * Clones a repository and scans for test cases using TestNG suite XML files.
     *
     * @param remoteUrl The remote Git URL (e.g., https://github.com/user/repo.git)
     * @param branch    The branch to checkout (e.g., "main", "develop")
     * @return A list of discovered test methods
     */
    public Map<String, Map<String,Object>> cloneAndScanRepo(String remoteUrl, String branch) throws IOException, GitAPIException {
        // Create temp directory
        File tempDir = Files.createTempDirectory("repo-scan-" + UUID.randomUUID()).toFile();
        System.out.println("Cloning into: " + tempDir.getAbsolutePath());

        try {
            // Clone the repository
            Git.cloneRepository()
                    .setURI(remoteUrl)
                    .setDirectory(tempDir)
                    .setBranch(branch)
//                    .setDepth(1) // shallow clone for performance
                    .call();

            // Run scanner on the cloned repo
            var tests = scanner.scanTestNGSuites(tempDir);
            System.out.println("Found " + tests.size() + " test cases.");
            return tests;

        } finally {
            // Clean up cloned repo (optional — comment this if you want to inspect files)
            deleteDirectory(tempDir);
        }
    }

    // Utility method to delete a directory recursively
    private void deleteDirectory(File dir) {
        if (dir == null || !dir.exists()) return;
        File[] contents = dir.listFiles();
        if (contents != null) {
            for (File file : contents) {
                deleteDirectory(file);
            }
        }
        dir.delete();
    }

    // Demo usage
    public static void main(String[] args) {
        String repoUrl = "https://github.com/KhushalJangid/Mocker.git";
        String branch = "main";

        Runner runner = new Runner();
        try {
            var results = runner.cloneAndScanRepo(repoUrl, branch);
            results.forEach((k, v) -> {
                System.out.println("Suite Name: " + k);
                v.forEach((y,z)-> {
                    System.out.println(y);
                    System.out.println(z);
                });
            });
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
