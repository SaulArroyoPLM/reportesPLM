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
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                }
                
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
                if (reader.result && typeof reader.result === 'string') {
                    setFormData(prev => ({
                        ...prev,
                        miniatura: reader.result as string
                    }));
                }
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
        const plantillaBase64 = "data:image/png;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC6n/wQYAAzyo53Fraa/AAAAAElFTkSuQmCC";

        const contenidoHTML = `
 <style>
     * { margin: 0; padding: 0; box-sizing: border-box; }
        body, html { margin: 0; padding: 0; width: 297mm; height: 210mm; }
                    
                  .pagina { 
            position: relative; 
            width: 297mm; 
            height: 210mm; 
            background: white;
        }

      .fondo-plantilla {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }
                    
.contenido-real {
      position: absolute;
      top: 0; left: 0;
      width: 100%;
      height: 100%;
      padding: 15mm 12mm;
      box-sizing: border-box;
      z-index: 2;
      font-family: Arial, sans-serif;
    }
        
        .header {
            border-bottom: 2px solid #0066cc;
            margin-bottom: 8px;
            padding-bottom:8px;
        }
        
        .header table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .title {
            font-size: 14px;
            font-weight: bold;
            color: #333;
            text-align: right;
        }
        
        .periodo {
            background-color: #E8F4FD;
            padding: 8px 12px;
            margin-bottom: 15px;
            font-size: 12px;
            border-left: 4px solid #4A90E2;
            color: #333;
        }
        
        .seccion-titulo {
            background-color: #E8F4FD;
            color: #4A90E2;
            font-weight: bold;
            font-size: 12px;
            padding: 8px;
            text-align: center;
            margin-bottom: 8px;
        }
        .seccion-subtitulo {
    background-color: #E8F4FD;
    color: #4A90E2;
    font-weight: bold;
    font-size: 11px;
    padding: 6px 8px;
    margin-bottom: 8px;
    margin-top: 10px;
}

.tabla-principal {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 15px;
}


        .tabla-datos {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        
        .datos-campana-col {
            vertical-align: top;
        }
        
        .dato-row {
            margin-bottom: 16px;
            height: 90px;
            display: flex;
        }
        
        .dato-label {
            color: #4A90E2;
            font-size: 11px;
            font-weight: bold;
            padding: 5px 8px;
            border-bottom: 1px solid #4A90E2;
            margin-bottom: 5px;
        }
        
        .dato-valor {
            font-size: 14px;
            padding: 5px 8px;
            border-bottom: 1px solid #ddd;
            border-top: none;
            height: 75px;
        }
        
        .arte-box {
            width: 200px;
            vertical-align: top;
            padding-left: 10px;
        }
        
        .arte-container {
            border: 1px solid #4A90E2;
            padding: 8px;
            text-align: center;
            height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .arte-container img {
            max-width: 100%;
            max-height: 160px;
        }
        
        .metricas-tabla {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 4px;
        }
        
        .metrica-cell {
            width: 33.33%;
            text-align: center;
            vertical-align: top;
        }
        
        .metrica-box {
            background-color: #E8F4FD;
            margin: 0 4px;
        }
        
        .metrica-header {
            color: #4A90E2;
            font-size: 12px;
            font-weight: bold;
            padding: 8px;
            background-color: #E8F4FD;
            border-bottom: 1px solid #4A90E2;
        }
        
        .metrica-valor {
            color: #4A90E2;
            font-size: 18px;
            font-weight: bold;
            padding: 12px;
            background-color: white;
        }
</style>
            
 <div class="pagina">
<img src="${plantillaBase64}" class="fondo-plantilla" />
 <div class="contenido-real">
 <!-- Header -->
        <div class="header">
            <table>
                <tbody><tr>
                   <td class="title">Fecha: ${fechaActual}</td>
                </tr>
            </tbody></table>
        </div>
        
        <!-- Periodo -->

        <!-- Datos de la campaña -->
        <div class="seccion-titulo">FORMATO PARA ENVÍO DE EMAILING</div>

        <!-- Tabla principal de datos -->
        <table class="tabla-principal" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tbody><tr>
                <!-- Columna izquierda: Datos del banner -->
                <td style="width: 75%; vertical-align: top; padding-right: 10px;">
                    <!-- Tipo de banner -->
                    <div class="dato-row" style="width: 100%;">
                        <div class="tipoBanner" style="margin-right: 10px;width: 33.33%;  ">
                            <div class="dato-label">Aplicación/ Campaña</div>
                        <div class="dato-valor">${formData.aplicacion || ''}</div>
                        </div>
                       <div class="tipoBanner" style="margin-right: 10px;width: 33.33%;  ">
                          <div class="dato-label">Laboratorio/cliente:</div>
                        <div class="dato-valor">${formData.laboratorio || ''}</div>
                      </div>
                       <div class="tipoBanner" style="width: 33.33%;">
                          <div class="dato-label">Ruta arte:</div>
                        <div class="dato-valor"> ${formData.rutaArte}</div>
                      </div>
                    </div>

                    <!-- Vigencia (título de sección) -->

                    <!-- Inicio -->
                     <div class="dato-row" style="width: 100%;">

                         <div class="tipoBanner" style="margin-right: 10px;width: 50%;  ">
                        <div class="dato-label">Segmento a dirigir:</div>
                        <div class="dato-valor">${Array.isArray(formData.segmento) ? formData.segmento.join(', ') : (formData.segmento || '')}</div>
                    </div>
                   <div class="tipoBanner" style="width: 50%;">
                        <div class="dato-label">Periodicidad:</div>
                        <div class="dato-valor">${formData.periodicidad || ''}</div>
                        </div>
                    </div>
                     <div class="dato-row" style="width: 100%;">
                    <div class="tipoBanner" style="width: 100%;">
                        <div class="dato-label">Subject:</div>
                        <div class="dato-valor">${formData.subject || ''}</div>
                        </div>
                    </div>
                </td>

                <!-- Columna derecha: Arte -->
                <td style="width: 35%; vertical-align: top; padding-left: 10px;">
                    <div class="dato-label" style="margin-bottom: 10px;">Miniatura de imagen:</div>
                    <div class="arte-container">
                        ${formData.miniatura ? 
                            `<img src="${formData.miniatura}" alt="Arte de mailing" style="max-width: 100%; max-height: 160px; object-fit: contain; border: 1px solid #ddd;">` : 
                            '<div style="height: 200px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; color: #999; border: 1px solid #ddd;">Sin imagen</div>'
                        }
                    </div>
                </td>
            </tr>
        </tbody></table>
 
 
        
        
        <div class="seccion-titulo">Objetivos del Banner</div>
        <table class="metricas-tabla" style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tbody><tr>
                <td class="metrica-cell" style="width: 33.33%; padding: 5px;">
                    <div class="metrica-box">
                        <div class="metrica-header">Call to action:</div>
                        <div class="metrica-valor">${formData.callToAction || ''}</div>
                    </div>
                </td>
                <td class="metrica-cell" style="width: 33.33%; padding: 5px;">
                    <div class="metrica-box">
                        <div class="metrica-header">Envio de campaña:</div>
                        <div class="metrica-valor"> ${formData.numeroEnvios || ''} ${formData.fechasPropuestas ? '/ ' + formData.fechasPropuestas : ''}</div>
                    </div>
                </td>
            </tr>
            <tr>
                 <td class="metrica-cell" style="width: 50%; padding: 5px;">
                    <div class="metrica-box">
                        <div class="metrica-header">Correos clientes:</div>
                        <div class="metrica-valor">${Array.isArray(formData.correosClientes) ? formData.correosClientes.join(', ') : (formData.correosClientes || '')}</div>
                    </div>
                </td>
                <td class="metrica-cell" style="width: 50%; padding: 5px;">
                    <div class="metrica-box">
                        <div class="metrica-header">Comentarios<br>adicionales</div>
                        <div class="metrica-valor">${formData.comentarios || ''}</div>
                    </div>
                </td>
            </tr>
        </tbody></table>
 </div>
</div>

`;

        const element = document.createElement('div');
element.innerHTML = contenidoHTML;
document.body.appendChild(element);

const opt = {
    margin: 0,
    filename: `reporte_banner_${fechaActual.replace(/\//g, '-')}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1122,
        windowHeight: 794
    },
    jsPDF: {
        unit: 'mm',
        format: [297, 210] as [number, number],
        orientation: 'landscape' as const
    }
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
            segmento: [],
            periodicidad: '',
            subject: '',
            callToAction: '',
            comentarios: '',
            fechasPropuestas: '',
            numeroEnvios: '',
            correosClientes: [],
            miniatura: null
        });
        setSegmentos([]);
        setEmailsClientes([]);
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
            validate={(value) => value.trim().length > 0}
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