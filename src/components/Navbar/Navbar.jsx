import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar as BsNavbar, Dropdown, Container } from 'react-bootstrap';
import './Navbar.css';
import logo from '../../img/plm_blanco_10.svg';
import colombiaFlag from '../../img/iconos_menu/colombia.png';
import mexicoFlag from '../../img/iconos_menu/mexico.png';
import centroamericaFlag from '../../img/iconos_menu/centroamerica.png';
import { faGlobe, faUser, faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";


function Navbar() {

    
    const handleCountrySelect = (country) => {
    console.log('País seleccionado:', country);
    // Aquí manejas el cambio de país
  };


    return (
    <>
   {/* Navbar móvil */}
      <BsNavbar className="colorCuatro navbar-mobile px-3 backgroundUno d-lg-none" variant="dark">
        <button className="navbar-toggler" type="button" id="openMenu">
          <FontAwesomeIcon icon={faBars} />
        </button>
        
        <Link className="navbar-brand mx-auto" to="/">
          <img src={logo} alt="Logo" height="40" />
        </Link>

        <Dropdown align="end" className="p-2">
          <Dropdown.Toggle as="a" className="nav-link" id="countryDropdownMobile">
            <FontAwesomeIcon icon={faGlobe} />
          </Dropdown.Toggle>

          <Dropdown.Menu className="m-3 banderas">
            <Dropdown.Item onClick={() => handleCountrySelect('co')}>
              <img src="https://flagcdn.com/w40/co.png" alt="Colombia" /> Colombia
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleCountrySelect('mx')}>
              <img src="https://flagcdn.com/w40/mx.png" alt="México" /> México
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleCountrySelect('ca')}>
              <img src="https://flagcdn.com/w40/gt.png" alt="Centroamérica" /> Centroamérica
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        <div className="d-flex align-items-center gap-3">
          <Link to="/perfil" className="nav-link">
            <FontAwesomeIcon icon={faUser} />
          </Link>
        </div>
      </BsNavbar>


    <BsNavbar expand="lg" className="colorCuatro navbar-desktop backgroundUno" style={{height: '80px'}}>
        <Container>
          <Link className="navbar-brand" to="/">
            <img src={logo} alt="Logo" height="40" />
          </Link>
          
          <div className="d-flex">
            <Dropdown>
              <Dropdown.Toggle as="a" className="nav-link p-3" id="countryDropdownDesktop">
                <FontAwesomeIcon icon={faGlobe} />
              </Dropdown.Toggle>

              <Dropdown.Menu className="banderas">
                <Dropdown.Item onClick={() => handleCountrySelect('co')}>
                  <img src={colombiaFlag} alt="Colombia" /> Colombia
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleCountrySelect('mx')}>
                  <img src={mexicoFlag} alt="México" /> México
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleCountrySelect('ca')}>
                  <img src={centroamericaFlag} alt="Centroamérica" /> Centroamérica
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <Link to="/perfil" className="nav-link p-3">
              <FontAwesomeIcon icon={faUser} />
            </Link>
          </div>
        </Container>
      </BsNavbar>
    </>
  );
}

export default Navbar;