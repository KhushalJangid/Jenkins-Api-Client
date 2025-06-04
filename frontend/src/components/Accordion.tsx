import Accordion from "react-bootstrap/Accordion";
import PropTypes from "prop-types";
import type { BuildHistory } from "../models/BuildHistory";

export default function AccordionDisplay(props: BuildHistory) {
  return (
    <Accordion key="build-history-accordion" defaultActiveKey="0">
      {Object.entries(props.buildHistory).map(([key, value], index, _) => (
        <Accordion.Item key={index.toString()} eventKey={index.toString()}>
          <Accordion.Header>{key}</Accordion.Header>
          {value.length > 0 && (
            <Accordion.Body className="d-flex flex-column">
              {value.map((item, _) => (
                <div className="d-flex">
                  {item.passed ? (
                    <i className="bi bi-check-circle text-success my-auto mx-2 h4"></i>
                  ) : (
                    <i className="bi bi-x-circle text-danger my-auto mx-2 h4"></i>
                  )}
                  <div className="d-flex flex-column">
                    <div>{item.name}</div>
                    <p className="text-secondary small mb-2">{item.time}</p>
                  </div>
                </div>
              ))}
            </Accordion.Body>
          )}
        </Accordion.Item>
      ))}
    </Accordion>
  );
}

AccordionDisplay.propTypes = {
  buildHistory: PropTypes.object.isRequired,
};
