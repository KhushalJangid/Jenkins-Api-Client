package com.example.jenkinsapi.service;

import com.example.jenkinsapi.model.JenkinsConfig;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

// import java.io.IOException;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpHeaders;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class JenkinsClient {

    private String jenkinsUrl;
    private String username;
    private String apiToken;
    private String geminiApiKey;
    // private String crumb;
    private final ObjectMapper mapper = new ObjectMapper();
    private HttpClient client;
    private final Path configPath = Paths.get("config", "jenkins-config.json");

    private static class XmlConfig {
        String reportUrl;
        List<String> buildStages;
        String scmUrl;
        String scmBranch;
        boolean isMavenJob;

        XmlConfig(String reportUrl, List<String> buildStages) {
            this(reportUrl, buildStages, null, null, false);
        }

        XmlConfig(String reportUrl, List<String> buildStages, String scmUrl, String scmBranch, boolean isMavenJob) {
            this.reportUrl = reportUrl;
            this.buildStages = buildStages;
            this.scmUrl = scmUrl;
            this.scmBranch = scmBranch;
            this.isMavenJob = isMavenJob;
        }
    }

    @PostConstruct
    public void init() {
        client = HttpClient.newBuilder().build();
        loadConfig();
    }

    private void loadConfig() {
        try {
            if (Files.exists(configPath)) {
                JenkinsConfig config = mapper.readValue(Files.readAllBytes(configPath), JenkinsConfig.class);
                this.jenkinsUrl = config.getUrl();
                this.username = config.getUsername();
                this.apiToken = config.getApiToken();
                this.geminiApiKey = config.getGeminiApiKey();
            }
        } catch (Exception e) {
            System.err.println("Could not load config: " + e.getMessage());
        }
    }

    public boolean configure(String url, String username, String token) throws Exception {
        this.jenkinsUrl = url;
        this.username = username;
        this.apiToken = token;
        if (verifyCredentials(url, username, token)) {
            saveConfig(); // Save to file
            return true;
        } else {
            return false;
        }
    }

    private void saveConfig() {
        try {
            Files.createDirectories(configPath.getParent());
            JenkinsConfig config = new JenkinsConfig();
            config.setUrl(jenkinsUrl);
            config.setUsername(username);
            config.setApiToken(apiToken);
            mapper.writerWithDefaultPrettyPrinter().writeValue(configPath.toFile(), config);
        } catch (IOException e) {
            System.err.println("Failed to save Jenkins config: " + e.getMessage());
        }
    }

    private boolean verifyCredentials(String url, String username, String token) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url + "/api/json"))
                .header("Authorization", basicAuth())
                .GET().build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        return response.statusCode() == 200 || response.statusCode() == 201;
    }

    public List<Map<String, Object>> getAllJobNames(String folderPath) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(jenkinsUrl + encodeJenkinsPath(folderPath, true)))
                .header("Authorization", basicAuth())
                .GET().build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        JsonNode jobs = mapper.readTree(response.body()).get("jobs");
        System.out.println(jenkinsUrl + encodeJenkinsPath(folderPath, true));

        List<Map<String, Object>> names = new ArrayList<>();
        for (JsonNode job : jobs) {
            var m = new HashMap<String, Object>();
            m.put("name", job.get("name").asText());
            String[] classArray = job.get("_class").asText().split("\\.");
            String type = classArray[classArray.length - 1];
            m.put("type", type);
            m.put("isFolder", type.toLowerCase().contains("folder"));
            names.add(m);
        }
        return names;
    }

    public Map<String, Object> getJobDetails(String jobPath) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(jenkinsUrl + encodeJenkinsPath(jobPath, true)))
                .header("Authorization", basicAuth())
                .GET().build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        JsonNode jobData = mapper.readTree(response.body());

        // Extract parameters if they exist
        JsonNode actions = jobData.get("actions");
        List<Map<String, Object>> parameters = new ArrayList<>();

        for (JsonNode action : actions) {
            if (action != null && action.has("parameterDefinitions")) {
                parameters = mapper.convertValue(action.get("parameterDefinitions"),
                        new TypeReference<List<Map<String, Object>>>() {
                        });
                break;
            }
        }

        JsonNode builds = jobData.get("builds");
        List<Map<String, Object>> recentBuilds = new ArrayList<>();

        for (int i = 0; i < Math.min(5, builds.size()); i++) {
            JsonNode build = builds.get(i);
            // int buildNumber = build.get("number").asInt();

            HttpRequest getBuildRequest = HttpRequest.newBuilder()
                    .uri(URI.create(build.get("url").asText() + "api/json"))
                    .header("Authorization", basicAuth())
                    .GET().build();

            HttpResponse<String> buildResponse = client.send(getBuildRequest, HttpResponse.BodyHandlers.ofString());
            JsonNode buildData = mapper.readTree(buildResponse.body());

            Map<String, Object> simplifiedBuild = Map.of(
                    "number", buildData.get("number"),
                    "result", buildData.get("result"),
                    "timestamp", buildData.get("timestamp"),
                    "duration", buildData.get("duration"),
                    "url", buildData.get("url"),
                    "building", buildData.get("building"));

            recentBuilds.add(simplifiedBuild);
        }

        var xmlConfig = parseXmlConfig(jobPath);
        var stages = expandMavenStages(xmlConfig.buildStages);

        String branch = xmlConfig.scmBranch != null
                ? xmlConfig.scmBranch.split("/")[xmlConfig.scmBranch.split("/").length - 1]
                : null;

        Map<String, Object> result = new HashMap<>();
        result.put("name", jobData.get("name"));
        result.put("description", jobData.get("description"));
        result.put("url", jobData.get("url"));
        result.put("isMavenJob", xmlConfig.isMavenJob);
        result.put("reportUrl", xmlConfig.reportUrl);
        result.put("scmUrl", xmlConfig.scmUrl);
        result.put("scmBranch", branch);
        result.put("nextBuildNumber", jobData.get("nextBuildNumber"));
        result.put("buildable", jobData.get("buildable"));
        result.put("parameters", parameters);
        result.put("recentBuilds", recentBuilds);
        result.put("buildStages", stages.isEmpty() ? List.of("clone", "build") : stages);
        return result;
    }

    public void triggerJob(String jobName) throws Exception {
        String url = jenkinsUrl + encodeJenkinsPath(jobName, false) + "/build";
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", basicAuth())
                // .header(crumb.split(":")[0], crumb.split(":")[1])
                .POST(HttpRequest.BodyPublishers.noBody()).build();

        client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    public void triggerJobWithParams(String jobName, Map<String, String> params) throws Exception {
        StringBuilder form = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (!form.isEmpty())
                form.append("&");
            form.append(entry.getKey()).append("=").append(entry.getValue());
        }

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(jenkinsUrl + encodeJenkinsPath(jobName, false) + "/buildWithParameters"))
                .header("Authorization", basicAuth())
                .header("Content-Type", "application/x-www-form-urlencoded")
                // .header(crumb.split(":")[0], crumb.split(":")[1])
                .POST(HttpRequest.BodyPublishers.ofString(form.toString())).build();

        client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    public void triggerTemporaryJob(String jobPath, Map<String, String> params, Map<String, Object> suite)
            throws Exception {

        Path newConfig = generateSuiteXml(suite);
        System.out.println(newConfig.toString());
        System.out.println(suite);
        params.put("surefire.suiteXmlFiles", newConfig.toString());

        triggerJobWithParams(jobPath, params);

    }

    public String chatHandler(List<Map<String, Object>> query) throws Exception {
        final String API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="
                + geminiApiKey;
        String requestBody = mapper.writeValueAsString(Map.of("contents", query));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(new URI(API_URL))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        // Parse the response
        @SuppressWarnings("unchecked")
        Map<String, Object> responseMap = mapper.readValue(response.body(), Map.class);
        if (responseMap.containsKey("error")) {
            System.err.println(responseMap);
            throw new Exception("Error: unable to process the request");
        } else {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseMap.get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                Map<String, Object> candidate = candidates.get(0);
                @SuppressWarnings("unchecked")
                Map<String, Object> content = (Map<String, Object>) candidate.get("content");
                @SuppressWarnings("unchecked")
                List<Map<String, String>> parts = (List<Map<String, String>>) content.get("parts");
                return parts.get(0).get("text").trim();
            }

            return "[No response from Gemini]";
        }
    }

    public Path generateSuiteXml(Map<String, Object> testMap) throws IOException {
        StringBuilder suite = new StringBuilder();
        suite.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        suite.append("<suite name=\"DynamicSuite\">\n");

        @SuppressWarnings("unchecked")
        Map<String, String> parameters = (Map<String, String>) testMap.get("parameters");
        @SuppressWarnings("unchecked")
        List<String> classes = (List<String>) testMap.get("classes");

        // for (Map.Entry<String, List<String>> entry : testMap.entrySet()) {
        suite.append("<test name=\"DynamicTest\">\n");
        for (Map.Entry<String, String> entry : parameters.entrySet()) {
            suite.append("<parameter name=\"").append(entry.getKey()).append("\" value=\"").append(entry.getValue())
                    .append("\"/>\n");
        }
        suite.append("    <classes>\n");
        for (String clazz : classes) {
            suite.append("      <class name=\"").append(clazz).append("\"/>\n");
        }
        suite.append("    </classes>\n");
        suite.append("  </test>\n");
        // }

        suite.append("</suite>\n");

        // Save to temp file
        Path suiteXmlPath = Files.createTempFile("suite-", ".xml");
        Files.write(suiteXmlPath, suite.toString().getBytes(StandardCharsets.UTF_8));
        return suiteXmlPath;
    }

    // private String injectParameterIfMissing(String originalXml) {
    //     if (originalXml.contains("<name>SUITE_PATH</name>")) {
    //         return originalXml;
    //     }

    //     String paramDefBlock = "<hudson.model.ParametersDefinitionProperty>\n" +
    //             "  <parameterDefinitions>\n" +
    //             "    <hudson.model.StringParameterDefinition>\n" +
    //             "      <name>surefire.suiteXmlFiles</name>\n" +
    //             "      <description>Path to custom testng suite file</description>\n" +
    //             "      <defaultValue>testng.xml</defaultValue>\n" +
    //             "    </hudson.model.StringParameterDefinition>\n" +
    //             "  </parameterDefinitions>\n" +
    //             "</hudson.model.ParametersDefinitionProperty>";

    //     if (originalXml.contains("<properties/>")) {
    //         return originalXml.replace("<properties/>", "<properties>" + paramDefBlock + "</properties>");
    //     }

    //     // Otherwise insert into <properties>...</properties>
    //     return originalXml.replaceFirst("</properties>", paramDefBlock + "\n</properties>");
    // }

    public boolean hasJobStarted(String jobName, String buildNumber) {
        try {
            String url = jenkinsUrl + encodeJenkinsPath(jobName, false) + "/" + buildNumber
                    + "/logText/progressiveText";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", basicAuth())
                    .GET().build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() != 404;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public void streamConsoleLogs(SseEmitter emitter, String jobName, String buildNumber) {
        String url = jenkinsUrl + encodeJenkinsPath(jobName, false) + "/" + buildNumber + "/logText/progressiveText";
        System.out.println(url);
        try {

            String start = "0";
            boolean moreData = true;
            while (moreData) {
                System.out.println("Start" + start);
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url + "?start=" + start))
                        .header("Authorization", basicAuth())
                        .GET().build();
                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

                String body = response.body();
                String[] lines = body.split("\n");

                for (String line : lines) {
                    emitter.send(SseEmitter.event().data(line));
                }

                // Jenkins headers to check if more text exists
                HttpHeaders respHeaders = response.headers();
                start = respHeaders.firstValue("x-text-size").isPresent() ? respHeaders.firstValue("x-text-size").get()
                        : "0";
                moreData = respHeaders.firstValue("x-more-data").isPresent()
                        ? Boolean.parseBoolean(respHeaders.firstValue("x-more-data").get())
                        : false;

                Thread.sleep(1000); // poll interval
            }

            emitter.complete();
        } catch (Exception e) {
            emitter.completeWithError(e);
        }
    }

    private XmlConfig parseXmlConfig(String jobPath) {
        // Step 4: Get config.xml and parse stages
        List<String> stages = new ArrayList<>();
        boolean isMavenJob = false;
        String scmUrl = null;
        String scmBranch = null;
        String reportName = "";
        try {
            HttpRequest configRequest = HttpRequest.newBuilder()
                    .uri(URI.create(jenkinsUrl + encodeJenkinsPath(jobPath, false) + "/config.xml"))
                    .header("Authorization", basicAuth())
                    .GET().build();

            HttpResponse<InputStream> configResponse = client.send(configRequest,
                    HttpResponse.BodyHandlers.ofInputStream());

            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            Document doc = factory.newDocumentBuilder().parse(configResponse.body());

            doc.getDocumentElement().normalize();

            String text = doc.getTextContent();
            System.out.println("Config XML Text: " + text);

            // Detect Maven goals or script stages
            NodeList builders = doc.getElementsByTagName("builders");

            for (int i = 0; i < builders.getLength(); i++) {
                Node builder = builders.item(i);
                NodeList children = builder.getChildNodes();

                for (int j = 0; j < children.getLength(); j++) {
                    Node step = children.item(j);

                    if (step.getNodeName().contains("Maven")) {
                        isMavenJob = true;
                    }

                    if (step.getNodeName().contains("Maven") || step.getNodeName().contains("Shell")) {
                        String textContent = step.getTextContent().trim();
                        if (!textContent.isEmpty()) {
                            var kw = textContent.split("\n")[0].split(" ");
                            stages.add(kw[kw.length - 1]); // First line of command
                            if (textContent.contains("mvn") && !isMavenJob) {
                                isMavenJob = true;
                            }
                        }
                    }
                }
            }

            // For pipeline jobs, try getting groovy script
            NodeList definitionList = doc.getElementsByTagName("definition");
            if (definitionList.getLength() > 0) {
                Node defNode = definitionList.item(0);
                NodeList defChildren = defNode.getChildNodes();
                for (int k = 0; k < defChildren.getLength(); k++) {
                    Node child = defChildren.item(k);
                    if ("script".equals(child.getNodeName())) {
                        String script = child.getTextContent();
                        // Heuristically extract stage names
                        Matcher m = Pattern.compile("stage\\s*\\(['\"](.*?)['\"]\\)").matcher(script);
                        while (m.find()) {
                            stages.add(m.group(1));
                        }
                    }
                }
            }

            NodeList publishers = doc.getElementsByTagName("publishers");

            for (int i = 0; i < publishers.getLength(); i++) {
                Node publisherNode = publishers.item(i);
                if (publisherNode.getNodeType() == Node.ELEMENT_NODE) {
                    Element publisherElement = (Element) publisherNode;

                    NodeList htmlPublishers = publisherElement.getElementsByTagName("htmlpublisher.HtmlPublisher");
                    for (int j = 0; j < htmlPublishers.getLength(); j++) {
                        Element htmlPublisher = (Element) htmlPublishers.item(j);
                        NodeList targets = htmlPublisher.getElementsByTagName("htmlpublisher.HtmlPublisherTarget");
                        for (int k = 0; k < targets.getLength(); k++) {
                            Element target = (Element) targets.item(k);
                            reportName = getTextContent(target, "reportName");

                            System.out.println("📄 Report Name: " + reportName);
                        }
                    }
                }
            }

            NodeList scmList = doc.getElementsByTagName("scm");
            for (int i = 0; i < scmList.getLength(); i++) {
                Node scmNode = scmList.item(i);
                if (scmNode.getNodeType() == Node.ELEMENT_NODE) {
                    Element scmElement = (Element) scmNode;
                    if ("hudson.plugins.git.GitSCM".equals(scmElement.getAttribute("class"))) {
                        // Get URL
                        NodeList userRemoteConfigs = scmElement.getElementsByTagName("userRemoteConfigs");
                        if (userRemoteConfigs.getLength() > 0) {
                            Element urcElem = (Element) userRemoteConfigs.item(0);
                            NodeList urcList = urcElem.getElementsByTagName("hudson.plugins.git.UserRemoteConfig");
                            if (urcList.getLength() > 0) {
                                Element urc = (Element) urcList.item(0);
                                scmUrl = getTextContent(urc, "url");
                            }
                        }
                        // Get Branch
                        NodeList branches = scmElement.getElementsByTagName("branches");
                        if (branches.getLength() > 0) {
                            Element branchesElem = (Element) branches.item(0);
                            NodeList branchSpecs = branchesElem.getElementsByTagName("hudson.plugins.git.BranchSpec");
                            if (branchSpecs.getLength() > 0) {
                                Element branchSpec = (Element) branchSpecs.item(0);
                                scmBranch = getTextContent(branchSpec, "name");
                            }
                        }
                    }
                }
            }

            return new XmlConfig(
                    jenkinsUrl + encodeJenkinsPath(jobPath, false) + "/" + reportName,
                    stages,
                    scmUrl,
                    scmBranch,
                    isMavenJob);
        } catch (Exception e) {
            System.err.println("Failed to parse config.xml for job " + jobPath + ": " + e.getMessage());
            return new XmlConfig("", List.of());
        }
    }

    // Utility method for safe tag content extraction
    private String getTextContent(Element parent, String tagName) {
        NodeList list = parent.getElementsByTagName(tagName);
        if (list.getLength() > 0 && list.item(0).getFirstChild() != null) {
            return list.item(0).getFirstChild().getNodeValue();
        }
        return null;
    }

    private static final List<String> MAVEN_PHASES = List.of(
            "clone", "validate", "compile", "test", "package", "verify", "install", "deploy");

    public static List<String> expandMavenStages(List<String> rawGoals) {
        Set<String> expanded = new LinkedHashSet<>();

        for (String goal : rawGoals) {
            goal = goal.trim();
            int idx = MAVEN_PHASES.indexOf(goal);
            if (idx != -1) {
                expanded.addAll(MAVEN_PHASES.subList(0, idx + 1));
            } else {
                expanded.add(goal); // fallback for non-lifecycle goals
            }
        }
        return new ArrayList<>(expanded);
    }

    private String basicAuth() {
        String token = username + ":" + apiToken;
        return "Basic " + Base64.getEncoder().encodeToString(token.getBytes());
    }

    private static String encodeJenkinsPath(String jobPath, boolean json) {
        if (jobPath == null || jobPath.isEmpty()) {
            return "/api/json"; // Root Jenkins
        }

        String[] parts = jobPath.split("/");
        StringBuilder pathBuilder = new StringBuilder();
        for (String part : parts) {
            if (!part.isEmpty()) {
                pathBuilder.append("/job/").append(URLEncoder.encode(part, StandardCharsets.UTF_8));
            }
        }
        if (json) {
            pathBuilder.append("/api/json");
        }
        return pathBuilder.toString();
    }

}