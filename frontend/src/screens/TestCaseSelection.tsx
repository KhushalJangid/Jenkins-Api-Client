// import { SettingsEdit } from "@carbon/icons-react";
import { useEffect, useState } from "react";
import type { TestSuites } from "../models/TestCaseModel";
import { getTestCases } from "../models/Api";

import { Accordion, AccordionTab } from "primereact/accordion";
import { MultiSelect } from "primereact/multiselect";
import "primereact/resources/themes/bootstrap4-dark-purple/theme.css";
// import "primereact/resources/themes/bootstrap4-light-purple/theme.css";
// import 'primereact/resources/primereact.min.css';

// import { TestSuite } from "./../models/TestCaseModel";
import { CircularProgress } from "@mui/joy";

export default function TestCaseSelection(props: {
  scmUrl: string;
  scmBranch: string;
}) {
  const [selectedSuites, setSelectedSuites] = useState(null);
  const [testSuites, setTestSuites] = useState<TestSuites>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      var ts = await getTestCases(props.scmUrl, props.scmBranch);
      console.log("TestSuites", ts);
      setTestSuites(ts);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex flex-column gap-3 justify-content-center align-items-center w-100 h-100">
        <CircularProgress />
        <h4>Loading TestSuites...</h4>
      </div>
    );
  }

  return (
    <>
      <h3 className="mb-4">TestSuites</h3>
      <Accordion activeIndex={0} className="w-50">
        {testSuites &&
          Object.entries(testSuites).map(([suiteName, suite]) => (
            <AccordionTab header={suiteName} key={suiteName}>
              <p>Suite Parameters</p>
              {Object.entries(suite.parameters).map(([name, value], index) => (
                <div key={index} className="mb-3 d-flex gap-5">
                  <label className="form-label">
                    {name.substring(0, 1).toUpperCase() + name.substring(1)}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={value}
                    onChange={(e) => console.log(e)}
                  />
                </div>
              ))}

              <MultiSelect
                value={selectedSuites}
                onChange={(e) => setSelectedSuites(e.value)}
                options={suite.testCases}
                optionLabel="className"
                display="chip"
                placeholder="Select TestCases"
                maxSelectedLabels={3}
                className="w-100 md:w-20rem"
              />
            </AccordionTab>
          ))}
      </Accordion>
    </>
  );
}
