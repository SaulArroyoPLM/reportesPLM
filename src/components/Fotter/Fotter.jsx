import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import './footer.css';
import logofotter from '../../img/logo_slogan.png';


function Fotter() {
    return (
        <>
        <footer class="estiloFooter">
             <Container fluid>
                <div class="border-footer mt-4 pt-4 pb-4 w-100">
                    <Link to="/">
                        <img 
                            className="d-block mx-auto logo-footer"
                            src={logofotter}
                            alt="Logo PLM"
                        />
                    </Link>
                </div>
             </Container>
        </footer>
        </>
    );
}
export default Fotter;