import Breadcrumb from "react-bootstrap/Breadcrumb";
import { useLocation } from "react-router-dom";

function BreadcrumbExample() {
  const location = useLocation();
  const fullPath = decodeURIComponent(
    location.pathname
      .replace("/folder/", "/Root/")
      .replace("/job/", "/Root/")
      .replace("/log/", "/Root/")
  );
  const pathParts = fullPath.split("/").filter((part) => part); // Split and filter out empty parts
  return (
    <div className="breadcrumb bg-body-secondary m-0 px-5 w-100 pb-2 pt-1">
      {pathParts.map((part, index) => (
        <Breadcrumb.Item
          key={index}
          href={
            index === pathParts.length - 1
              ? undefined
              : `/folder/${pathParts.slice(1, index + 1).join("/")}`
          }
          active={index === pathParts.length - 1}
        >
          {part}
        </Breadcrumb.Item>
      ))}
    </div>
  );
}

export default BreadcrumbExample;
