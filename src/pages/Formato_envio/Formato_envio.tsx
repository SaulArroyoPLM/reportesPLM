import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import Upgrade from "../../img/iconos_menu/upgrade_24dps.svg";

function FormatoEnvio() {
    const [formData, setFormData] = useState({
        aplicacion: '',
        laboratorio: '',
        rutaArte: '',
        segmento: '',
        periodicidad: '',
        subject: '',
        callToAction: '',
        comentarios: '',
        fechasPropuestas: '',
        numeroEnvios: '',
        correosClientes: '',
        miniatura: null
    });

    const [dragActive, setDragActive] = useState(false);
    const [loading, setLoading] = useState(false); // 👈 Para mostrar loading
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' }); // 👈 Para mensajes

    // URL del webhook de Make (reemplaza con la tuya)
    const MAKE_WEBHOOK_URL = 'https://hook.us1.make.com/TU_WEBHOOK_AQUI';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Convertir imagen a base64
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    miniatura: reader.result // Base64 de la imagen
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    miniatura: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    // 🔥 FUNCIÓN PARA ENVIAR A MAKE
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMensaje({ tipo: '', texto: '' });

        try {
            // Preparar datos para enviar
            const dataParaMake = {
                fecha: new Date().toISOString(),
                aplicacion: formData.aplicacion,
                laboratorio: formData.laboratorio,
                rutaArte: formData.rutaArte,
                segmento: formData.segmento,
                periodicidad: formData.periodicidad,
                subject: formData.subject,
                callToAction: formData.callToAction,
                comentarios: formData.comentarios,
                fechasPropuestas: formData.fechasPropuestas,
                numeroEnvios: formData.numeroEnvios,
                correosClientes: formData.correosClientes,
                miniatura: formData.miniatura // Base64 de la imagen
            };

            // Enviar a Make
            const response = await fetch(MAKE_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataParaMake)
            });

            if (response.ok) {
                setMensaje({ 
                    tipo: 'success', 
                    texto: '✅ Formato guardado exitosamente en Google Sheets' 
                });
                handleCancel(); // Limpiar formulario
            } else {
                setMensaje({ 
                    tipo: 'danger', 
                    texto: '❌ Error al guardar. Intenta nuevamente.' 
                });
            }
        } catch (error) {
            console.error('Error:', error);
            setMensaje({ 
                tipo: 'danger', 
                texto: '❌ Error de conexión con el servidor' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            aplicacion: '',
            laboratorio: '',
            rutaArte: '',
            segmento: '',
            periodicidad: '',
            subject: '',
            callToAction: '',
            comentarios: '',
            fechasPropuestas: '',
            numeroEnvios: '',
            correosClientes: '',
            miniatura: null
        });
        setMensaje({ tipo: '', texto: '' });
    };

    const getCurrentDate = () => {
        const today = new Date();
        return today.toLocaleDateString('es-MX');
    };

    return (
        <Container className="mt-4 mb-5">
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h3 className="mb-0">Formato para envío de mailing</h3>
                        <div>
                            <span className="fw-bold me-2">Fecha:</span>
                            <span>{getCurrentDate()}</span>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* 👇 Mostrar mensajes de éxito o error */}
            {mensaje.texto && (
                <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje({ tipo: '', texto: '' })}>
                    {mensaje.texto}
                </Alert>
            )}

            <Form onSubmit={handleSubmit}>
                <Row className="mt-4">
                    <Col>
                        <p className="titulo_formato">Información de la campaña</p>
                    </Col>
                </Row>
                
                <Row>
                    <Col md={6}>
                        <Row>
                            <Col sm={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Aplicación/ Campaña</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        name="aplicacion"
                                        value={formData.aplicacion}
                                        onChange={handleChange}
                                        placeholder="Ingresa la aplicación o campaña"
                                    />
                                </Form.Group>
                            </Col>

                            <Col sm={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Laboratorio/cliente:</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        name="laboratorio"
                                        value={formData.laboratorio}
                                        onChange={handleChange}
                                        placeholder="Ingresa el laboratorio o cliente"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Ruta arte <span className="text-danger">*</span></Form.Label>
                                    <Form.Control 
                                        type="text"
                                        name="rutaArte"
                                        value={formData.rutaArte}
                                        onChange={handleChange}
                                        placeholder="Ingresa la ruta del arte"
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col sm={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Segmento a dirigir:</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        name="segmento"
                                        value={formData.segmento}
                                        onChange={handleChange}
                                        placeholder="Ingresa el segmento objetivo"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Periodicidad:</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        name="periodicidad"
                                        value={formData.periodicidad}
                                        onChange={handleChange}
                                        placeholder="Ej: Semanal, mensual, trimestral"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Col>

                    <Col md={6}>
                        <Form.Label>Miniatura de imagen</Form.Label>
                        <Card 
                            className={`text-center p-4 ${dragActive ? 'border-primary' : ''}`}
                            style={{ 
                                cursor: 'pointer',
                                border: dragActive ? '2px dashed #0d6efd' : '2px dashed #dee2e6'
                            }}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('fileInput').click()}
                        >
                            <Card.Body className="d-flex flex-column justify-content-center align-items-center">
                                <Card.Img 
                                    className="logo_upgrade mb-3" 
                                    src={Upgrade} 
                                    alt="Logo Upgrade"
                                    style={{ width: '80px', height: '80px' }}
                                />
                                <Card.Text>
                                    Arrastra y suelta aquí el archivo<br />
                                    del mailing o haz clic para subirlo
                                </Card.Text>
                                {formData.miniatura && (
                                    <div className="mt-3 text-success">
                                        ✅ <strong>Imagen cargada correctamente</strong>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                        <input
                            id="fileInput"
                            type="file"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                            accept="image/*"
                        />
                    </Col>
                </Row>
                {/* Contenido del mailing */}
                <div className="mb-4">
                    <h5 className="mb-3 text-primary">Contenido del mailing</h5>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Subject:</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    placeholder="Ingresa el asunto del correo"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Call to action:</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="callToAction"
                                    value={formData.callToAction}
                                    onChange={handleChange}
                                    placeholder="Ingresa el llamado a la acción"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Comentarios adicionales</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    name="comentarios"
                                    value={formData.comentarios}
                                    onChange={handleChange}
                                    placeholder="Agrega cualquier comentario adicional"
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </div>

                {/* Parámetros de envío */}
                <div className="mb-4">
                    <h5 className="mb-3 text-primary">Parámetros de envío</h5>
                    <Row className="mb-3">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Fechas propuestas:</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="fechasPropuestas"
                                    value={formData.fechasPropuestas}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Número de envíos:</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="numeroEnvios"
                                    value={formData.numeroEnvios}
                                    onChange={handleChange}
                                    placeholder="Ej: 1000"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Correos de los clientes:</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="correosClientes"
                                    value={formData.correosClientes}
                                    onChange={handleChange}
                                    placeholder="Separados por coma"
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </div>

                {/* Botones */}
                <Row className="mt-4">
                    <Col className="d-flex justify-content-end gap-3">
                        <Button variant="outline-secondary" onClick={handleCancel} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Spinner size="sm" className="me-2" />
                                    Guardando...
                                </>
                            ) : (
                                'Guardar'
                            )}
                        </Button>
                    </Col>
                </Row>
            </Form>
        </Container>
    );
}

export default FormatoEnvio;