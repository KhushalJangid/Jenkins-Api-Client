// import { SettingsEdit } from "@carbon/icons-react};
// import { FormControlLabel, Switch } from "@mui/material";
import { useEffect, useState } from "react";
import type { TestSuites } from "../models/TestCaseModel";
import { getTestCases } from "../models/Api";

// import { Accordion, AccordionTab } from "primereact/accordion";
// import { MultiSelect } from "primereact/multiselect";
import "primereact/resources/themes/bootstrap4-dark-purple/theme.css";
// import "primereact/resources/themes/bootstrap4-light-purple/theme.css";
// import 'primereact/resources/primereact.min.css';

// import { TestSuite } from "./../models/TestCaseModel";
import { CircularProgress, Switch } from "@mui/joy";
import Accordion from "react-bootstrap/esm/Accordion";
import { FormControlLabel } from "@mui/material";

export default function TestCaseSelection(props: {
  scmUrl: string;
  scmBranch: string;
}) {
  // const [selectedSuites, setSelectedSuites] = useState(null);
  // const [selectedSuites, setSelectedSuites] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [testSuites, setTestSuites] = useState<TestSuites>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    const fetchData = async () => {
      var ts = await getTestCases(props.scmUrl, props.scmBranch);
      console.log("TestSuites", ts);
      setTestSuites(ts);
      setLoading(false);
    };
    fetchData();
  }, [enabled]);

  if (!enabled) {
    return (
      <div className="d-flex flex-column gap-3 justify-content-center align-items-center w-100 h-100">
        <div className="d-flex align-items-center mb-4">
          <h3 className="mb-0 me-3">TestSuites</h3>
          <FormControlLabel
            control={<Switch checked={enabled} onChange={e => setEnabled(e.target.checked)} />}
            label="Enable"
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="d-flex flex-column gap-3 justify-content-center align-items-center w-100 h-100">
        <div className="d-flex align-items-center mb-4">
          <h3 className="mb-0 me-3">TestSuites</h3>
          <FormControlLabel
            control={<Switch checked={enabled} onChange={e => setEnabled(e.target.checked)} />}
            label="Enable"
          />
        </div>
        <CircularProgress />
        <h4>Loading TestSuites...</h4>
      </div>
    );
  }

  return (
    <>
      <div className="d-flex align-items-center mb-4">
        <h3 className="mb-0 me-3">TestSuites</h3>
        <FormControlLabel
          control={<Switch checked={enabled} onChange={e => setEnabled(e.target.checked)} />}
          label="Enable"
        />
      </div>
      <Accordion className="w-75">
        {testSuites &&
          Object.entries(testSuites).map(([suiteName, suite], index) => (
            <Accordion.Item eventKey={index.toString()} key={index}>
              <Accordion.Header>{suiteName}</Accordion.Header>
              <Accordion.Body>
                <p>Suite Parameters</p>
                {Object.entries(suite.parameters).map(
                  ([name, value], index) => (
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
                  )
                )}

                {/* <MultiSelect
                  value={selectedSuites}
                  onChange={(e) => setSelectedSuites(e.value)}
                  options={suite.testCases}
                  optionLabel="className"
                  display="chip"
                  placeholder="Select TestCases"
                  maxSelectedLabels={3}
                  className="w-100 md:w-20rem"
                /> */}
                {/* <select
                  className="form-select"
                  multiple
                  aria-label="multiple select example"
                >
                  {suite.testCases.map((testCase, index) => (
                    <option key={index}>{testCase.className}</option>
                  ))}
                </select> */}
                <div className="form-check form-switch">
                  {suite.testCases.map((testCase, index) => (
                    <div key={index}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id={testCase.className}
                        key={index}
                      />
                      <label className="form-check-label" htmlFor={testCase.className}>
                        {testCase.className}
                      </label>
                    </div>
                  ))}
                </div>
              </Accordion.Body>
            </Accordion.Item>
          ))}
      </Accordion>
    </>
  );
}
