import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faCheckCircle, faTimes, faDownload } from "@fortawesome/free-solid-svg-icons";

function FormatoBannerReporte() {
    const [formData, setFormData] = useState({
        periodo: '',
        detalleCampana: '',
        tipoBanner: '',
        detalleBanner: '',
        inicioVigencia: '',
        terminoVigencia: '',
        miniatura: null
    });

    // Métricas del banner
    const [metricas, setMetricas] = useState({
        printsacumulados: '',
        clicalbanner: '',
        printsCTA: ''
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

    const handleMetricasChange = (e) => {
        const { name, value } = e.target;
        setMetricas(prev => ({
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
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                    }
                    
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.3);
                    
                    setFormData(prev => ({
                        ...prev,
                        miniatura: compressedBase64
                    }));
                };
                if (reader.result && typeof reader.result === 'string') {
                    img.src = reader.result;
                }
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
                        miniatura: reader.result
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
            const fechaActual = new Date().toLocaleDateString('es-MX', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).replace(/\//g, '/');

            // Base64 de la plantilla (mismo que Formato_reporte.tsx)
            const plantillaBase64 = "data:image/png;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC6n/wQYAAzyo53Fraa/AAAAAElFTkSuQmCC";

            // HTML del PDF adaptado para banners
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
                <tr>
                   <td class="title">DETALLE DE CAMPAÑAS DE: ${formData.detalleCampana || 'SIN DETALLE'}</td>
                </tr>
            </table>
        </div>
        
        <!-- Periodo -->
           <div class="periodo">Periodo: ${formData.periodo || 'Sin periodo'}</div>

        <!-- Datos de la campaña -->
        <div class="seccion-titulo">Datos de la campaña</div>

        <!-- Tabla principal de datos -->
        <table class="tabla-principal" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
                <!-- Columna izquierda: Datos del banner -->
                <td style="width: 50%; vertical-align: top; padding-right: 10px;">
                    <!-- Tipo de banner -->
                    <div class="dato-row" style="width: 100%;" >
                        <div class="tipoBanner" style="margin-right: 10px;width: 50%;  ">
                            <div class="dato-label">Tipo de banner</div>
                        <div class="dato-valor">${formData.tipoBanner || ''}</div>
                        </div>
                       <div class="tipoBanner" style="width: 50%;  ">
                          <div class="dato-label">Nombre del banner</div>
                        <div class="dato-valor">${formData.detalleBanner || ''}</div>
                      </div>
                    </div>

                    <!-- Vigencia (título de sección) -->
                    <div class="seccion-subtitulo">Vigencia</div>

                    <!-- Inicio -->
                    <div class="dato-row" style="width: 100%;" >

                      <div class="tipoBanner" style="margin-right: 10px;width: 50%;  ">
                        <div class="dato-label">Inicio</div>
                        <div class="dato-valor">${formData.inicioVigencia || ''}</div>
                    </div>
                     <div class="tipoBanner" style="width: 50%;  ">
                        <div class="dato-label">Término</div>
                        <div class="dato-valor">${formData.terminoVigencia || ''}</div>
                        </div>
                    </div>
                </td>

                <!-- Columna derecha: Arte -->
                <td style="width: 50%; vertical-align: top; padding-left: 10px;">
                    <div class="dato-label" style="margin-bottom: 10px;">Arte</div>
                    <div class="arte-container">
                        ${formData.miniatura ? 
                            `<img src="${formData.miniatura}" alt="Arte de banner" style="width: 100%; height: auto; border: 1px solid #ddd;">` : 
                            '<div style="height: 200px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; color: #999; border: 1px solid #ddd;">Sin imagen</div>'
                        }
                    </div>
                </td>
            </tr>
        </table>
 
 </td>
        </tr>
        </table>
        <div class="seccion-titulo">Objetivos del Banner</div>
        <table class="metricas-tabla" style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr>
                <td class="metrica-cell" style="width: 33.33%; padding: 5px;">
                    <div class="metrica-box">
                        <div class="metrica-header">Prints acumulados</div>
                        <div class="metrica-valor">${metricas.printsacumulados || ''}</div>
                    </div>
                </td>
                <td class="metrica-cell" style="width: 33.33%; padding: 5px;">
                    <div class="metrica-box">
                        <div class="metrica-header">Clics al banner (CTA detonado)</div>
                        <div class="metrica-valor">${metricas.clicalbanner || ''}</div>
                    </div>
                </td>
                <td class="metrica-cell" style="width: 33.33%; padding: 5px;">
                    <div class="metrica-box">
                        <div class="metrica-header">CTA</div>
                        <div class="metrica-valor">${metricas.printsCTA || ''}</div>
                    </div>
                </td>
            </tr>
        </table>
 </div>
    </div>
       
           `;
    
           const opt = {
            margin: 0,
            filename: `reporte_banner_${fechaActual.replace(/\//g, '-')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
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
                format: [297, 210],
                orientation: 'landscape'
            }
        };

          await html2pdf().set(opt).from(contenidoHTML).save();

            setMensaje({ tipo: 'success', texto: 'PDF generado perfectamente' });
        } catch (error) {
            console.error('Error generando PDF:', error);
            setMensaje({
                tipo: 'danger',
                texto: 'Error al generar PDF: ' + (error instanceof Error ? error.message : 'desconocido')
            });
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
                ...formData,
                metricas
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
                    texto: '✅ Reporte guardado exitosamente en Google Sheets' 
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
            periodo: '',
            detalleCampana: '',
            tipoBanner: '',
            detalleBanner: '',
            inicioVigencia: '',
            terminoVigencia: '',
            miniatura: null
        });
        setMetricas({
            printsacumulados: '',
            clicalbanner: '',
            printsCTA: ''
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
                        <h3 className="mb-0">Formato para Reporte Banner</h3>
                        <div>
                            <span className="fw-bold me-2">Fecha:</span>
                            <span>{getCurrentDate()}</span>
                        </div>
                    </div>
                </Col>
            </Row>
            <Row className="mt-4">
                <Col>
                    <h5 className="titulo_formato_reporte mb-3">Datos de la campaña</h5>
                </Col>
            </Row>
            <Row className="mb-4">
                <Col sm={12}>
                    <Form.Group className="mb-3">
                        <Form.Label>Periodo</Form.Label>
                        <Form.Control 
                            type="text"
                            name="periodo"
                            value={formData.periodo}
                            onChange={handleChange}
                            placeholder="Periodo de la campaña"
                        />
                    </Form.Group>
                </Col>
            </Row>
            
            {mensaje.texto && (
                <Alert variant={mensaje.tipo} onClose={() => setMensaje({ tipo: '', texto: '' })} dismissible>
                    {mensaje.texto}
                </Alert>
            )}
            
            <Form onSubmit={handleSubmit}>
                <Row>
                    <Col md={6}>
                        <Row>
                            <Col sm={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Detalle de campañas</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        name="detalleCampana"
                                        value={formData.detalleCampana}
                                        onChange={handleChange}
                                        placeholder="Detalle de la campaña"
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
                                <option value="Banner home">Banner Home</option>
                                <option value="Banner buscador smeantico">Banner Buscador Semántico</option>
                                <option value="Banner ippa">Banner IPPA</option>
                            </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col sm={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nombre del banner</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        name="detalleBanner"
                                        value={formData.detalleBanner}
                                        onChange={handleChange}
                                        placeholder="Nombre del banner"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={12}>
                                <h5 className="titulo_formato_reporte mb-3">Vigencia</h5>
                            </Col>
                            <Col sm={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Inicio</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        name="inicioVigencia"
                                        value={formData.inicioVigencia}
                                        onChange={handleChange}
                                        placeholder="Inicio de vigencia"
                                    />
                                </Form.Group>
                            </Col>
                            <Col sm={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Término</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        name="terminoVigencia"
                                        value={formData.terminoVigencia}
                                        onChange={handleChange}
                                        placeholder="Término de vigencia"
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
                                    document.getElementById('fileInput')?.click();
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

                {/* Sección: Métricas */}
                <div className="mt-5 mb-4 backgroundTres p-3">
                    <h5 className="titulo_formato_reporte mb-3">Objetivos del Banner</h5>
                    <Row className="justify-content-between">
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Prints acumulados</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="printsacumulados"
                                    value={metricas.printsacumulados}
                                    onChange={handleMetricasChange}
                                    placeholder="Número"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Clics al banner (CTA detonado)</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="clicalbanner"
                                    value={metricas.clicalbanner}
                                    onChange={handleMetricasChange}
                                    placeholder="Valor"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>CTA</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="printsCTA"
                                    value={metricas.printsCTA}
                                    onChange={handleMetricasChange}
                                    placeholder="Número"
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

export default FormatoBannerReporte;
