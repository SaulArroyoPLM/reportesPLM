import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import './Home.css';
import logoreportes from '../../img/logo_reportes.png';
import Docicono from '../../img/iconos_menu/docs_24dps_uno.svg';
import Dociconodos from '../../img/iconos_menu/docs_24dps_dos.svg';
import { Container, Row, Col, Button, Modal } from 'react-bootstrap';


function Home() {
    const navigate = useNavigate(); // 👈 Hook para navegar
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);

 const handleBannerClick = () => {
  console.log('Generar reporte de Banner');
  setShowBannerModal(true);  // 👈 ABRE EL MODAL
};

const handleFormatoBanner = () => {
  console.log("Formato Banner seleccionado");
  setShowBannerModal(false);
  navigate('/formato-banner');
};

const handleSubirBanner = () => {
  console.log("Subir Banner seleccionado");
  setShowBannerModal(false);
  navigate('/subir-banner');
};
const handleCloseBanner = () => {
  setShowBannerModal(false);
};

  const handleMailingClick = () => {
    setShowOptionsModal(true);
  };

  const handleCloseOptions = () => {
    setShowOptionsModal(false);
  };

  const handleFormatoEnvio = () => {
    console.log('Formato para envío de emailing seleccionado');
    setShowOptionsModal(false);
     navigate('/formato-envio'); // 👈 Navega a la nueva página
  };

  const handleFormatoReporte = () => {
    console.log('Formato para reporte de emailing seleccionado');
    setShowOptionsModal(false);
    navigate('/formato-reporte'); // 👈 Navega a otra página
  };

  return (
   <>
   <Container fluid style={{backgroundColor: '#00329D'}}> 
    <Container>
        <Row className="align-items-center justify-content-between">
            <Col xs={12} className="logo_reportes">
                 <img 
                  src={logoreportes}
                  alt="Logo Reportes" />
            </Col>
        </Row>
    </Container>
   </Container>

   <Container className="pt-5">
    <div className="d-block colorUno fw-normal">
        <p className="backgroundTres fw-bold pt-3 pb-3" style={{textAlign:'center'}}>
            Ingresa a la herramienta para registrar datos y generar reportes de dos maneras disponibles:
        </p>
    </div>
   </Container>

   <Container>
    <Row>
        <Col md={6} className="mx-auto border p-3 mt-4" style={{maxWidth:'500px'}}>
            <div className="mx-auto w-100">
                <h2 className="colorsiete backgroundDiez fw-bold text-center borderTop border-bottom p-3">
                    Generar reporte de Banner
                </h2>
                <p className="colorUno fw-normal text-center pt-2">
                     Registra un banner nuevo y genera un reporte automático con toda la información capturada.
                </p>
                <Button 
                  variant="primary" 
                  className="mx-auto d-block mt-4"
                  onClick={handleBannerClick}
                >
                    Comenzar
                </Button>
            </div>
        </Col>

        <Col md={6} className="mx-auto border p-3 mt-4" style={{maxWidth:'500px'}}>
            <div className="mx-auto w-100">
                <h2 className="colorsiete backgroundDiez fw-bold text-center borderTop border-bottom p-3">
                   Generar reporte de Mailing
                </h2>
                <p className="colorUno fw-normal text-center pt-2">
                    Sube un mailing y obtén un reporte completo con los detalles de la campaña.
                </p>
                <Button 
                  variant="primary" 
                  className="mx-auto d-block mt-4"
                  onClick={handleMailingClick}
                >
                    Comenzar
                </Button>
            </div>
        </Col>
    </Row>
   </Container>

   <Container fluid className="backgroundTres">
    <Container className="mt-5 pt-5 pb-5 text-center">
        <p className="d-block d-md-none">
            <span className="fw-bold">Importante:</span> Este sistema es de uso interno.<br />
            Asegúrate de ingresar información correcta y actualizada, ya que los reportes se generan automáticamente con los datos proporcionados.
        </p>

        <p className="d-none d-md-block">
            <span className="fw-bold">Importante:</span> Este sistema es de uso interno.<br />
            Asegúrate de ingresar información correcta y actualizada, ya que los reportes se generan automáticamente con los datos proporcionados.
        </p>
    </Container>
   </Container>

   {/* Modal de Opciones para Mailing */}
   <Modal 
     show={showOptionsModal} 
     onHide={handleCloseOptions} 
     centered 
     size="lg"
     className="options-modal"
   >
    <Modal.Header closeButton>
    </Modal.Header>
    <Modal.Body>
      <Row className="g-4 px-3">
        <Col md={6}>
          <div className="btn-option text-center" onClick={handleFormatoEnvio}>
            <div className="btn-text" style={{color: 'white'}}>
                <div>
                <img className="Docicono"
                  src={Dociconodos}
                  alt="Logo Formato" />
              </div>
              Formato para envío de emailing
              
            </div>
          </div>
        </Col>
        <Col md={6}>
          <div className="btn-option_dos text-center" onClick={handleFormatoReporte}>
            <div className="btn-text" style={{color: '#0d6efd'}}>
<div>
                <img  className="Docicono"
                  src={Docicono}
                  alt="Logo Formato" />
              </div>
              Formato para reporte de emailing
            </div>
          </div>
        </Col>
      </Row>
    </Modal.Body>
   </Modal>
{/* Modal de Opciones para Banner */}
{/* Modal de Opciones para Banner */}
<Modal 
  show={showBannerModal} 
  onHide={handleCloseBanner} 
  centered 
  size="lg"
  className="options-modal"
>
  <Modal.Header closeButton />

  <Modal.Body>
    <Row className="g-4 px-3">
      <Col md={6}>
        <div className="btn-option text-center" onClick={handleFormatoBanner}>
          <div className="btn-text" style={{ color: 'white' }}>
            <img className="Docicono" src={Dociconodos} alt="Logo Banner" />
            Crear reporte de Banner
          </div>
        </div>
      </Col>

      <Col md={6}>
        <div className="btn-option_dos text-center" onClick={handleSubirBanner}>
          <div className="btn-text" style={{ color: '#0d6efd' }}>
            <img className="Docicono" src={Docicono} alt="Logo Banner" />
            Subir Banner y generar reporte
          </div>
        </div>
      </Col>
    </Row>
  </Modal.Body>
</Modal>


   </>
  );
}

export default Home;