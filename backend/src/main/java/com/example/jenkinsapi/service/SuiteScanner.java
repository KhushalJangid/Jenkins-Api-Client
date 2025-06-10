package com.example.jenkinsapi.service;

//import com.example.jenkinsapi.model.TestMethodInfo;

import org.w3c.dom.*;

import javax.xml.parsers.*;
import java.io.*;
import java.util.*;
//import java.util.stream.Collectors;

public class SuiteScanner {

    public Map<String, Map<String, Object>> scanTestNGSuites(File repoRoot) {
        List<File> suiteFiles = findSuiteFiles(repoRoot);
        Map<String, Map<String, Object>> testcases = new HashMap<>();
        System.out.println(suiteFiles);

        for (File xml : suiteFiles) {
            try {
                var result = parseTestNGSuite(xml);
                var tc = (List<Map<String,String>>) result.values().stream().findFirst().get().get("testCases");
                if (!tc.isEmpty()) {
                    testcases.putAll(result);
                }
            } catch (Exception e) {
                System.err.println("Error parsing " + xml.getName() + ": " + e.getMessage());
            }
        }

        return testcases;
    }

    private List<File> findSuiteFiles(File dir) {
        List<File> suiteFiles = new ArrayList<>();
        File[] files = dir.listFiles();
        if (files == null) return suiteFiles;

        for (File file : files) {
            if (file.isDirectory()) {
                suiteFiles.addAll(findSuiteFiles(file));
            } else if (isXmlSuite(file) || isYamlSuite(file)) {
                suiteFiles.add(file);
            }
        }
        return suiteFiles;
    }

    /*
     * Parses suite files and returns the contents as a Map of structure:
     * {
     *   "suiteName": {
     *       "parameters:{
     *           "name": "value"
     *       },
     *       "testCases": []
     *   }
     * }
     *
     * */
    private Map<String, Map<String, Object>> parseTestNGSuite(File xmlFile) throws Exception {
        List<Map<String, String>> testMethods = new ArrayList<>();
        Map<String, Map<String, Object>> result = new HashMap<>();
        Map<String, String> parameterMap = new HashMap<>();

        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        factory.setValidating(false); // disables DTD validation
        factory.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.parse(xmlFile);
        doc.getDocumentElement().normalize();

        NodeList parameters = doc.getElementsByTagName("parameter");

        for (int i = 0; i < parameters.getLength(); i++) {
            Element parameter = (Element) parameters.item(i);
            parameterMap.put(parameter.getAttribute("name"), parameter.getAttribute("value"));
        }

        NodeList classes = doc.getElementsByTagName("class");
        for (int i = 0; i < classes.getLength(); i++) {
            Element classElem = (Element) classes.item(i);
            String className = classElem.getAttribute("name");

            NodeList includes = classElem.getElementsByTagName("include");
            if (includes.getLength() > 0) {
                for (int j = 0; j < includes.getLength(); j++) {
                    Element methodElem = (Element) includes.item(j);
                    String methodName = methodElem.getAttribute("name");
                    testMethods.add(Map.of("className", className, "methodName", methodName));
                }
            } else {
                // No specific methods listed — assume full class
                testMethods.add(Map.of("className", className, "methodName", "__all__"));
            }
        }
        String suiteName = ((Element) doc.getElementsByTagName("suite").item(0)).getAttribute("name");

        result.put(suiteName, Map.of("parameters", parameterMap, "testCases", testMethods));

        return result;
    }

    private boolean isXmlSuite(File file) {
        if (!file.getName().toLowerCase().endsWith(".xml")) return false;

        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            int linesToCheck = 20;

            while ((line = reader.readLine()) != null && linesToCheck-- > 0) {
                String trimmed = line.trim().toLowerCase();
                if ((trimmed.contains("<suite ") && trimmed.contains("name=")) ||     // TestNG
                        trimmed.contains("<testsuite") ||                                // JUnit
                        trimmed.contains("<testsuites>") ||                              // JUnit Aggregated
                        (trimmed.contains("<test") && trimmed.contains("classname="))) { // General
                    return true;
                }
            }
        } catch (IOException e) {
            System.err.println("Failed to read XML: " + file.getName() + " - " + e.getMessage());
        }
        return false;
    }

    private boolean isYamlSuite(File file) {
        if (!file.getName().toLowerCase().endsWith(".yml") && !file.getName().toLowerCase().endsWith(".yaml")) {
            return false;
        }

        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            int linesToCheck = 20;

            while ((line = reader.readLine()) != null && linesToCheck-- > 0) {
                String trimmed = line.trim().toLowerCase();
                if (trimmed.startsWith("suite:") || trimmed.startsWith("tests:") || trimmed.contains("testcases:")) {
                    return true;
                }
            }
        } catch (IOException e) {
            System.err.println("Failed to read YAML: " + file.getName() + " - " + e.getMessage());
        }
        return false;
    }
}
