import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faCheckCircle, faTimes, faDownload } from "@fortawesome/free-solid-svg-icons";

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
        miniatura: null as string | null
    });

    const [dragActive, setDragActive] = useState(false);
    const [loading, setLoading] = useState(false); 
    const [loadingPDF, setLoadingPDF] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' }); 

    // URL del webhook de Make (reemplaza con la tuya)
   const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/ohn9salf7uf6pxqpsuy31bpd47rslzcx';


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
        const reader = new FileReader();
        reader.onloadend = () => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // 👇 REDUCE MÁS EL TAMAÑO
                const MAX_WIDTH = 300;  // Antes: 800
                const MAX_HEIGHT = 200; // Antes: 600
                
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // 👇 REDUCE MÁS LA CALIDAD
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.3); // Antes: 0.7
                
                setFormData(prev => ({
                    ...prev,
                    miniatura: compressedBase64
                }));
            };
            img.src = reader.result as string;
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
                    miniatura: reader.result as string
                }));
            };
            reader.readAsDataURL(file);
        }
    };
    const handleRemoveImage = (e) => {
        e.stopPropagation();
        setFormData(prev => ({
            ...prev,
            miniatura: null
        }));
    };

    const handleDownloadPDF = async () => {
        setLoadingPDF(true);
        
        try {
            // Importar jsPDF dinámicamente
            const jsPDF = (await import('jspdf')).default;
            
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            let yPos = 20;

            // Título principal
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('Formato para envío de mailing', pageWidth / 2, yPos, { align: 'center' });
            
            yPos += 10;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, pageWidth / 2, yPos, { align: 'center' });
            
            yPos += 15;

            // Información de la campaña
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 102, 204); // Azul
            doc.text('Información de la campaña', 20, yPos);
            yPos += 8;

            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');

            const addField = (label, value) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.setFont('helvetica', 'bold');
                doc.text(`${label}:`, 20, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(value || 'No especificado', 70, yPos);
                yPos += 7;
            };

            addField('Aplicación/Campaña', formData.aplicacion);
            addField('Laboratorio/cliente', formData.laboratorio);
            addField('Ruta arte', formData.rutaArte);
            addField('Segmento a dirigir', formData.segmento);
            addField('Periodicidad', formData.periodicidad);

            // Imagen miniatura
            if (formData.miniatura) {
                yPos += 5;
                doc.setFont('helvetica', 'bold');
                doc.text('Miniatura:', 20, yPos);
                yPos += 5;
                
                try {
                    const imgWidth = 80;
                    const imgHeight = 60;
                    doc.addImage(formData.miniatura, 'JPEG', 20, yPos, imgWidth, imgHeight);
                    yPos += imgHeight + 10;
                } catch (e) {
                    doc.setFont('helvetica', 'normal');
                    doc.text('Imagen incluida (ver archivo original)', 20, yPos);
                    yPos += 7;
                }
            }

            // Contenido del mailing
            yPos += 5;
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 102, 204);
            doc.text('Contenido del mailing', 20, yPos);
            yPos += 8;

            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');

            // Subject (con texto largo)
            doc.setFont('helvetica', 'bold');
            doc.text('Subject:', 20, yPos);
            yPos += 5;
            doc.setFont('helvetica', 'normal');
            const subjectLines = doc.splitTextToSize(formData.subject || 'No especificado', 170);
            doc.text(subjectLines, 20, yPos);
            yPos += (subjectLines.length * 5) + 5;

            // Call to action
            doc.setFont('helvetica', 'bold');
            doc.text('Call to action:', 20, yPos);
            yPos += 5;
            doc.setFont('helvetica', 'normal');
            const ctaLines = doc.splitTextToSize(formData.callToAction || 'No especificado', 170);
            doc.text(ctaLines, 20, yPos);
            yPos += (ctaLines.length * 5) + 5;

            // Comentarios
            doc.setFont('helvetica', 'bold');
            doc.text('Comentarios adicionales:', 20, yPos);
            yPos += 5;
            doc.setFont('helvetica', 'normal');
            const comentariosLines = doc.splitTextToSize(formData.comentarios || 'No especificado', 170);
            doc.text(comentariosLines, 20, yPos);
            yPos += (comentariosLines.length * 5) + 10;

            // Parámetros de envío
            if (yPos > 240) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 102, 204);
            doc.text('Parámetros de envío', 20, yPos);
            yPos += 8;

            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');

            addField('Fechas propuestas', formData.fechasPropuestas);
            addField('Número de envíos', formData.numeroEnvios);
            addField('Correos de clientes', formData.correosClientes);

            // Guardar PDF
            doc.save(`formato_mailing_${new Date().getTime()}.pdf`);
            
            setMensaje({ 
                tipo: 'success', 
                texto: '✅ PDF descargado exitosamente' 
            });
        } catch (error) {
            console.error('Error al generar PDF:', error);
            setMensaje({ 
                tipo: 'danger', 
                texto: '❌ Error al generar el PDF' 
            });
        } finally {
            setLoadingPDF(false);
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
                        <Form.Label className="mb-2">Miniatura de imagen</Form.Label>
                        <Card 
                            className={`text-center p-4 ${dragActive ? 'border-primary bg-light' : ''}`}
                            style={{ 
                                cursor: formData.miniatura ? 'default' : 'pointer',
                                border: dragActive ? '2px dashed #0d6efd' : '2px dashed #dee2e6',
                                minHeight: '300px',
                                transition: 'all 0.3s ease'
                            }}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => {
                                if (!formData.miniatura) {
                                    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
                                    fileInput?.click();
                                }
                            }}
                        >
                            <Card.Body className="d-flex flex-column justify-content-center align-items-center h-100">
                                {formData.miniatura ? (
                                    // PREVIEW DE LA IMAGEN
                                    <div className="position-relative w-100 h-100 d-flex flex-column align-items-center justify-content-center">
                                        <div className="position-relative">
                                            <img 
                                                src={formData.miniatura} 
                                                alt="Preview" 
                                                className="img-fluid"
                                                style={{ 
                                                    maxWidth: '100%', 
                                                    maxHeight: '240px', 
                                                    objectFit: 'contain',
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                className="position-absolute rounded-circle"
                                                style={{
                                                    top: '-8px',
                                                    right: '-8px',
                                                    width: '32px',
                                                    height: '32px',
                                                    padding: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                                onClick={handleRemoveImage}
                                            >
                                                <FontAwesomeIcon icon={faTimes} size="sm" />
                                            </Button>
                                        </div>
                                        <div className="mt-4 d-flex align-items-center gap-2 text-success fw-semibold">
                                            <FontAwesomeIcon icon={faCheckCircle} />
                                            <span>Imagen cargada correctamente</span>
                                        </div>
                                        <p className="text-muted small mt-2 mb-0">
                                            Haz clic en la X para cambiar la imagen
                                        </p>
                                    </div>
                                ) : (
                                    // ZONA DE SUBIDA
                                    <div className="d-flex flex-column align-items-center justify-content-center h-100 py-4">
                                        <FontAwesomeIcon 
                                            icon={faUpload} 
                                            className="text-primary mb-3"
                                            style={{ width: '60px', height: '60px' }}
                                        />
                                        <p className="text-dark fw-semibold mb-1">
                                            Arrastra y suelta aquí el archivo
                                        </p>
                                        <p className="text-secondary mb-2">
                                            del mailing o haz clic para subirlo
                                        </p>
                                        <p className="text-muted small mt-2 mb-0">
                                            Formatos: JPG, PNG, GIF
                                        </p>
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
                        <Button 
    variant="outline-primary" 
    onClick={handleDownloadPDF} 
    disabled={loading || loadingPDF}
>
    {loadingPDF ? (
        <>
            <Spinner size="sm" className="me-2" />
            Generando PDF...
        </>
    ) : (
        <>
            <FontAwesomeIcon icon={faDownload} className="me-2" />
            Descargar PDF
        </>
    )}
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