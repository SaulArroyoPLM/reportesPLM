import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faCheckCircle, faTimes, faDownload } from "@fortawesome/free-solid-svg-icons";
import ChipInput from "../../components/ChipInput/ChipInput";
import './formato_envio.css';

function FormatoEnvio() {
    const [formData, setFormData] = useState({
        aplicacion: '',
        laboratorio: '',
        rutaArte: '',
        segmento: [],  
        periodicidad: '',
        subject: '',
        callToAction: '',
        comentarios: '',
        fechasPropuestas: '',
        numeroEnvios: '',
        correosClientes: [], 
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

        // Usa la fecha real, no la quemada
        const fechaActual = new Date().toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\//g, '/');
        
        // 👇 AQUÍ PEGAS TU BASE64 DE LA PLANTILLA
        const plantillaBase64 = "data:image/png;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADc0v8EGAAyBP5Vev7kbQAAAABJRU5ErkJggg==";

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
        max-height: 297mm;   /* 👈 evita que crezca */
        overflow: hidden;    /* 👈 evita salto de página */
    }
    table, tr, td, img, div {
        page-break-inside: avoid !important; /* 👈 evita cortes */
    }
</style>
<div class="contenido-wrapper" style="width: 210mm; min-height: 285mm;">
    <!-- IMAGEN DE FONDO (Tu plantilla con el logo) -->
    <img src="${plantillaBase64}" class="plantilla-fondo" alt="Plantilla" />
    
    <!-- CONTENIDO QUE SE ESCRIBE ENCIMA -->
    <div style="position: relative; z-index: 2; padding: 20px; padding-top: 100px;">
        
        <!-- Fecha (si quieres que aparezca, ajusta la posición) -->
        <div style="text-align: right; margin-bottom: 20px;">
            <strong>Fecha:</strong> 21/Nov/2025
        </div>

        <!-- Título -->
        <div style="color: #3f3f3f; padding: 12px; text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 20px;">
            FORMATO PARA ENVÍO DE EMAILING
        </div>

        <!-- Tabla de campos -->
        <table style="border-collapse: collapse; border: 1px solid #2c3e50;">
            <tr>
                <td style="color: #3f3f3f; padding: 8px; border: 1px solid #2c3e50; width: 35%; font-size: 11px;">
                    Aplicación/ Campaña
                </td>
                <td class="celda-larga" style="background: white; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    ${formData.aplicacion || ''}
                </td>
            </tr>
            
            <tr>
                <td style="color: #3f3f3f; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    Laboratorio/cliente:
                </td>
                <td class="celda-larga" style="background: white; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    ${formData.laboratorio || ''}
                </td>
            </tr>
            
            <tr>
                <td style="color: #3f3f3f; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    Ruta arte:
                </td>
                <td class="celda-larga" style="background: white; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                   <a href="${formData.rutaArte}" target="_blank" style="color:#007bff; text-decoration: underline;">
        ${formData.rutaArte}
    </a>
                </td>
            </tr>
            
            <tr>
                <td style="color: #3f3f3f; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    Segmento a dirigir:
                </td>
                <td class="celda-larga" style="background: white; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    ${formData.segmento || ''}
                </td>
            </tr>
            
            <tr>
                <td style="color: #3f3f3f; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    Periodicidad:
                </td>
                <td class="celda-larga" style="background: white; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    ${formData.periodicidad || ''}
                </td>
            </tr>
            
            <tr>
                <td style="color: #3f3f3f; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    Subject:
                </td>
                <td class="celda-larga" style="background: white; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    ${formData.subject || ''}
                </td>
            </tr>
            
            <tr>
                <td style="color: #3f3f3f; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    Call to action:
                </td>
                <td class="celda-larga" style="background: white; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    ${formData.callToAction || ''}
                </td>
            </tr>
            
            <tr>
                <td style="color: #3f3f3f; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    Envio de campaña:
                </td>
                <td class="celda-larga" style="background: white; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    ${formData.numeroEnvios || ''} ${formData.fechasPropuestas ? '/ ' + formData.fechasPropuestas : ''}
                </td>
            </tr>
            
            <tr>
                <td style="color: #3f3f3f; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    Correos clientes:
                </td>
                <td class="celda-larga" style="background: white; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    ${formData.correosClientes || ''}
                </td>
            </tr>
            
            <tr>
                <td style="color: #3f3f3f; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    Comentarios<br>adicionales
                </td>
                <td class="celda-larga" style="background: white; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    ${formData.comentarios || ''}
                </td>
            </tr>
            
            <tr>
                <td style="color: #3f3f3f; padding: 8px; border: 1px solid #2c3e50; font-size: 11px;">
                    Miniatura de imagen:
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
    filename: `formato_mailing_${Date.now()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
};

        // Esto genera SOLO UNA HOJA
        await html2pdf().set(opt).from(contenidoHTML).save();
        document.body.removeChild(element);


    } catch (error) {
        console.error('Error PDF:', error);
        setMensaje({ tipo: 'danger', texto: 'Error al generar el PDF' });
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


    const [emailsClientes, setEmailsClientes] = useState([]);
    const [segmentos, setSegmentos] = useState([]);
    
    const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);




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



            <Form onSubmit={handleSubmit}>
                <Row className="mt-4">
                    <Col md={12} >
                        <h5 className="titulo_formato">Información de la campaña</h5>
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
                                    <Form.Label>Ruta arte</Form.Label>
                                    <Form.Control 
                                           type="url"
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

        <ChipInput 
            items={segmentos}
            setItems={(list) => {
                setSegmentos(list);

                // actualizar formData
                setFormData(prev => ({
                    ...prev,
                    segmento: list
                }));
            }}
            placeholder="Ej: Medicina general, Enfermería..."
            badgeColor="info"
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

                <Container className="backgroundTres p-3 my-4">
                <div className="mb-4">
                    <Row>
                    <Col md={12}>
                    <h5 className="titulo_formato mb-3 ">Contenido del mailing</h5>
                    </Col>
                    </Row>
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
                </Container>  

                {/* Parámetros de envío */}
                <div className="mb-4">
                    <Row>
                    <Col md={12}>
                    <h5 className=" titulo_formato mb-3">Parámetros de envío</h5>
                    </Col>
                    </Row>
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

        <ChipInput 
             items={emailsClientes}
             setItems={(list) => {
                 setEmailsClientes(list);
 
                 // actualizar formData
                 setFormData(prev => ({
                     ...prev,
                     correosClientes: list
                 }));
             }}
             placeholder="Escribe un correo y presiona Enter"
             validate={validateEmail}        // ⬅️ validación
             badgeColor="primary"
        />

        {/* Si necesitas mandarlo como string al backend */}
        <input type="hidden" name="correosClientes" value={emailsClientes.join(",")} />
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