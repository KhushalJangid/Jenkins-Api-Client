export type BuildHistory = {
  [key: string]: { // prop name
    [key: string]:  // Job name
      {
        [key: string]: any; // Build details
      }[]; // array of builds
  };
};

// Map of build history <JobName, [ Map of Job Details<String, String> ]>
