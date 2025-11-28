import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Card, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faCheckCircle, faTimes, faDownload } from "@fortawesome/free-solid-svg-icons";

function FormatoBanner() {
    const [formData, setFormData] = useState({
        tipoUsuario: '',
        email: '',
        nombreCliente: '',
        telefono: '',
        empresaOrganizacion: '',
        tipoBanner: '',
        especialidades: '',
        duracionCampana: '',
        comentarios: '',
        miniatura: null
    });

    const [dragActive, setDragActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingPDF, setLoadingPDF] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

    // URL del webhook de Make (reemplaza con la tuya)
    const MAKE_WEBHOOK_URL = 'TU_WEBHOOK_URL_AQUI';

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
                    const MAX_WIDTH = 300;
                    const MAX_HEIGHT = 200;
                    
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
                    
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.3);
                    
                    setFormData(prev => ({
                        ...prev,
                        miniatura: compressedBase64
                    }));
                };
                img.src = reader.result;
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
            const html2pdf = (await import('html2pdf.js')).default;

            const fechaActual = new Date().toLocaleDateString('es-MX', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            
            // 👇 AQUÍ PEGAS TU BASE64 DE LA PLANTILLA PARA BANNER
            const plantillaBase64 = "";

            const contenidoHTML = `
<style>
    .celda-larga {
        word-wrap: break-word !important;
        word-break: break-all !important;
        overflow-wrap: anywhere !important;
        hyphens: auto;
    }
    table { 
        table-layout: fixed; 
        width: 100%; 
        position: relative;
        z-index: 2;
    }
    td { vertical-align: top; }
    .plantilla-fondo {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
    }
    .contenido-wrapper {
        width: 210mm;
        min-height: 297mm;
        max-height: 297mm;
        overflow: hidden;
    }
    table, tr, td, img, div {
        page-break-inside: avoid !important;
    }
</style>
<div class="contenido-wrapper" style="width: 210mm; min-height: 285mm;">
    <img src="${plantillaBase64}" class="plantilla-fondo" alt="Plantilla" />
    
    <div style="position: relative; z-index: 2; padding: 20px; padding-top: 100px;">
        
        <div style="text-align: right; margin-bottom: 20px;">
            <strong>Fecha:</strong> ${fechaActual}
        </div>

        <div style="color: #3f3f3f; padding: 12px; text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 20px;">
            FORMATO PARA SUBIDA DE BANNERS
        </div>

        <table style="border-collapse: collapse; border: 1px solid #2c3e50;">
            <tr>
                <td colspan="2" style="color: #3f3f3f; padding: 8px; border: 1px solid #2c3e50; font-weight: bold; font-size: 12px; background: #f8f9fa;">
                    Información del cliente
                </td>
            </tr>
            
            <tr>
                <td style="color: #3f3f3f; padding: 8px; border: 1px solid #2c3e50; width: 35%; font-size: 11px;">
                    Tipo de usuario
                </td>
                <td class="celda-larga" style="background: white; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    ${formData.tipoUsuario || ''}
                </td>
            </tr>
            
            <tr>
                <td style="color: #3f3f3f; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    Email
                </td>
                <td class="celda-larga" style="background: white; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    ${formData.email || ''}
                </td>
            </tr>
            
            <tr>
                <td style="color: #3f3f3f; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    Nombre del cliente
                </td>
                <td class="celda-larga" style="background: white; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    ${formData.nombreCliente || ''}
                </td>
            </tr>
            
            <tr>
                <td style="color: #3f3f3f; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    Teléfono
                </td>
                <td class="celda-larga" style="background: white; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    ${formData.telefono || ''}
                </td>
            </tr>
            
            <tr>
                <td style="color: #3f3f3f; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    Empresa/Organización
                </td>
                <td class="celda-larga" style="background: white; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    ${formData.empresaOrganizacion || ''}
                </td>
            </tr>
            
            <tr>
                <td style="color: #3f3f3f; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    Tipo de Banner
                </td>
                <td class="celda-larga" style="background: white; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    ${formData.tipoBanner || ''}
                </td>
            </tr>
            
            <tr>
                <td colspan="2" style="color: #3f3f3f; padding: 8px; border: 1px solid #2c3e50; font-weight: bold; font-size: 12px; background: #f8f9fa;">
                    Contenido del mailing
                </td>
            </tr>
            
            <tr>
                <td style="color: #3f3f3f; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    Especialidades
                </td>
                <td class="celda-larga" style="background: white; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    ${formData.especialidades || ''}
                </td>
            </tr>
            
            <tr>
                <td style="color: #3f3f3f; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    Duración de la campaña
                </td>
                <td class="celda-larga" style="background: white; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    ${formData.duracionCampana || ''}
                </td>
            </tr>
            
            <tr>
                <td style="color: #3f3f3f; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    Comentarios adicionales
                </td>
                <td class="celda-larga" style="background: white; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    ${formData.comentarios || ''}
                </td>
            </tr>
            
            <tr>
                <td style="color: #3f3f3f; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    Miniatura de imagen
                </td>
                <td class="celda-larga" style="background: white; padding: 8px; border: 1px solid #2c3e50;">
                    ${formData.miniatura ? `<img src="${formData.miniatura}" style="max-width: 200px; max-height: 150px; display: block;" />` : ''}
                </td>
            </tr>
        </table>
    </div>
</div>
`;

            const element = document.createElement('div');
            element.innerHTML = contenidoHTML;
            document.body.appendChild(element);

            const opt = {
                margin: 0,
                filename: `formato_banner_${Date.now()}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(contenidoHTML).save();
            document.body.removeChild(element);

        } catch (error) {
            console.error('Error PDF:', error);
            setMensaje({ tipo: 'danger', texto: 'Error al generar el PDF' });
        } finally {
            setLoadingPDF(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMensaje({ tipo: '', texto: '' });

        try {
            const dataParaMake = {
                fecha: new Date().toISOString(),
                tipoUsuario: formData.tipoUsuario,
                email: formData.email,
                nombreCliente: formData.nombreCliente,
                telefono: formData.telefono,
                empresaOrganizacion: formData.empresaOrganizacion,
                tipoBanner: formData.tipoBanner,
                especialidades: formData.especialidades,
                duracionCampana: formData.duracionCampana,
                comentarios: formData.comentarios,
                miniatura: formData.miniatura
            };

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
                handleCancel();
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
            tipoUsuario: '',
            email: '',
            nombreCliente: '',
            telefono: '',
            empresaOrganizacion: '',
            tipoBanner: '',
            especialidades: '',
            duracionCampana: '',
            comentarios: '',
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
                        <h3 className="mb-0">Formato para subida de Banners</h3>
                        <div>
                            <span className="fw-bold me-2">Fecha:</span>
                            <span>{getCurrentDate()}</span>
                        </div>
                    </div>
                </Col>
            </Row>

            <Form onSubmit={handleSubmit}>
                {/* Información del cliente */}
                <Row className="mt-4">
                    <Col md={12}>
                        <h5 className="titulo_formato">Información del cliente</h5>
                    </Col>
                </Row>
                
                <Row>
                    <Col md={6}>
                        <Row>
                            <Col sm={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Tipo de usuario</Form.Label>
                                    <Form.Select
                                        name="tipoUsuario"
                                        value={formData.tipoUsuario}
                                        onChange={handleChange}
                                    >
                                        <option value="">Selecciona una opción</option>
                                        <option value="Profesional de la salud">Profesional de la salud</option>
                                        <option value="Estudiante">Estudiante</option>
                                        <option value="Laboratorio">Laboratorio</option>
                                        <option value="Otro">Otro</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col sm={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control 
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="correo@ejemplo.com"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nombre del cliente</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        name="nombreCliente"
                                        value={formData.nombreCliente}
                                        onChange={handleChange}
                                        placeholder="Ingresa el nombre"
                                    />
                                </Form.Group>
                            </Col>

                            <Col sm={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Teléfono</Form.Label>
                                    <Form.Control 
                                        type="tel"
                                        name="telefono"
                                        value={formData.telefono}
                                        onChange={handleChange}
                                        placeholder="55-1234-5678"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Empresa/Organización</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        name="empresaOrganizacion"
                                        value={formData.empresaOrganizacion}
                                        onChange={handleChange}
                                        placeholder="Nombre de la empresa"
                                    />
                                </Form.Group>
                            </Col>

                            <Col sm={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Tipo de Banner</Form.Label>
                                    <Form.Select
                                        name="tipoBanner"
                                        value={formData.tipoBanner}
                                        onChange={handleChange}
                                    >
                                        <option value="">Selecciona una opción</option>
                                        <option value="Banner superior">Banner superior</option>
                                        <option value="Banner lateral">Banner lateral</option>
                                        <option value="Banner inferior">Banner inferior</option>
                                        <option value="Pop-up">Pop-up</option>
                                    </Form.Select>
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
                                    document.getElementById('fileInput').click();
                                }
                            }}
                        >
                            <Card.Body className="d-flex flex-column justify-content-center align-items-center h-100">
                                {formData.miniatura ? (
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
                                            del banner o haz clic para subirlo
                                        </p>
                                        <p className="text-muted small mt-2 mb-0">
                                            Peso máximo por imagen: 3MB
                                        </p>
                                        <p className="text-muted small mb-0">
                                            Formatos aceptados: JPG, PNG, GIF y EPS/PDF para casos específicos
                                        </p>
                                        <p className="text-muted small mb-0">
                                            Verifica las dimensiones específicas para cada tipo de banner
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
                <Container className="backgroundTres p-3 my-4">
                    <div className="mb-4">
                        <Row>
                            <Col md={12}>
                                <h5 className="titulo_formato mb-3">Contenido del mailing</h5>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Especialidades:</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="especialidades"
                                        value={formData.especialidades}
                                        onChange={handleChange}
                                        placeholder="Ej: Medicina general, Pediatría..."
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Duración de la campaña:</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="duracionCampana"
                                        value={formData.duracionCampana}
                                        onChange={handleChange}
                                        placeholder="Ej: 30 días, del 1 al 31 de diciembre..."
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
                </Container>

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

export default FormatoBanner;