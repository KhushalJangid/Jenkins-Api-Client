import { useEffect, useState } from "react";
import type { TestSuites } from "../models/TestCaseModel";
import { getTestCases } from "../models/Api";
import { CircularProgress, Switch } from "@mui/joy";
import Accordion from "react-bootstrap/esm/Accordion";
import { FormControlLabel } from "@mui/material";

export default function TestCaseSelection(props: {
  scmUrl: string;
  scmBranch: string;
  // selectedSuites: { [testCase: string]: boolean };
  updateSuiteSelection: Function;
  setParameters: Function;
}) {
  const [selectedSuiteCount, setSelectedSuiteCount] = useState(0);
  const [enabled, setEnabled] = useState(false);
  const [testSuites, setTestSuites] = useState<TestSuites>();
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<Record<string, any>>();

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    const fetchData = async () => {
      const ts = await getTestCases(props.scmUrl, props.scmBranch);
      setTestSuites(ts);
      let parameters = {};
      for (let i = 0; i < Object.values(ts).length; i++) {
        parameters = { ...parameters, ...Object.values(ts)[i].parameters };
      }
      console.log(parameters);
      props.setParameters(parameters);
      setFormData(parameters);
      setLoading(false);
    };
    fetchData();
  }, [enabled]);

  if (!enabled) {
    return (
      <div className="d-flex flex-column gap-3 justify-content-center align-items-center w-100 h-100">
        <div className="d-flex align-items-center mb-4">
          <Switch
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <h3 className="mb-0 mx-3">TestSuites</h3>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="d-flex flex-column gap-3 justify-content-center align-items-center w-100 h-100">
        <div className="d-flex align-items-center mb-4">
          <Switch
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <h3 className="mb-0 mx-3">TestSuites</h3>
        </div>
        <CircularProgress />
        <h4>Loading TestSuites...</h4>
      </div>
    );
  }

  return (
    <>
      <div className="d-flex align-items-center mb-4">
        <Switch
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        <h3 className="mb-0 mx-3">TestSuites</h3>
      </div>
      {testSuites && (
        <div className="my-2">{selectedSuiteCount} TestCase(s) selected</div>
      )}
      <Accordion className="w-75">
        {testSuites &&
          Object.entries(testSuites).map(([suiteName, suite], index) => (
            <Accordion.Item eventKey={index.toString()} key={index}>
              <Accordion.Header>{suiteName}</Accordion.Header>
              <Accordion.Body>
                <p>Suite Parameters</p>
                {Object.entries(suite.parameters).map(
                  ([name, _], index) => {
                    return (
                      <div key={index} className="mb-3 d-flex gap-5">
                        <label className="form-label">
                          {name.substring(0, 1).toUpperCase() +
                            name.substring(1)}
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData ? formData[name] : ""}
                          // onChange={(e) => console.log(e)}
                          onChange={(e) => {
                            let updatedData = {
                              ...formData,
                              [name]: e.target.value,
                            };
                            props.setParameters(updatedData);
                            setFormData(updatedData);
                          }}
                        />
                      </div>
                    );
                  }
                )}
                <div className="form-check form-switch">
                  {suite.testCases.map((testCase, index) => (
                    <div key={index}>
                      <FormControlLabel
                        className="gap-5"
                        control={
                          <Switch
                            onChange={(e) => {
                              props.updateSuiteSelection(
                                e.target.checked,
                                testCase.className
                              );
                              // props.selectedSuites[testCase.className] =
                              //   e.target.checked;
                              if (e.target.checked) {
                                setSelectedSuiteCount(selectedSuiteCount + 1);
                              } else {
                                setSelectedSuiteCount(selectedSuiteCount - 1);
                              }
                              // console.log(props.selectedSuites);
                            }}
                          />
                        }
                        label={testCase.className}
                      />
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
