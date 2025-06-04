import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import ThemeToggle from './ThemeToggle';
// import NavDropdown from 'react-bootstrap/NavDropdown';
import BreadcrumbExample from './Crumbs';

function TopNav() {
  return (
    <Navbar expand="lg" className="fixed-top d-flex flex-column p-0">
      <div className="bg-body-tertiary m-0 px-5 w-100 d-flex">
        <Navbar.Brand href="#home">JJM</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className='justify-content-end'>
          <Nav className="ml-auto">
            <Nav.Link href="/" className='mx-2'>Home</Nav.Link>
            <Nav.Link href="#" className='mx-2'>
              <i className='bi bi-person mx-2'></i>
              {localStorage.getItem('jenkinsUsername') || 'Username'}
            </Nav.Link>
             <ThemeToggle />
          </Nav>
        </Navbar.Collapse>
      </div>
      <BreadcrumbExample/>
    </Navbar>
  );
}

export default TopNav;