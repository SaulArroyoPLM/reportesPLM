import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Card, Alert, Spinner, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faCheckCircle, faTimes, faDownload, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";

function FormatoReporte() {
    const [formData, setFormData] = useState({
        detalleCampana: '',
        nombreCampana: '',
        ultimoEnvio: '',
        correosEnviados: '',
        subject: '',
        miniatura: null
    });

    // Métricas principales
    const [metricas, setMetricas] = useState({
        aperturas: '',
        porcentajeOpen: '',
        cto: '',
        ctr: ''
    });

    // Tabla de segmentos
    const [segmentos, setSegmentos] = useState([
        { id: 1, especialidad: '', usuarios: '', aperturas: '', porcentajeOpen: '', clics: '', ctr: '' }
    ]);

    // Segmentos enviados (texto libre)
    const [segmentosEnviados, setSegmentosEnviados] = useState('');

    const [dragActive, setDragActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingPDF, setLoadingPDF] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

    // URL del webhook de Make (reemplaza con la tuya)
    const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/TU_WEBHOOK_AQUI_PARA_REPORTE';

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

    // Funciones para manejar la tabla de segmentos
    const handleSegmentoChange = (id, field, value) => {
        setSegmentos(prev => prev.map(seg => 
            seg.id === id ? { ...seg, [field]: value } : seg
        ));
    };

    const agregarSegmento = () => {
        const nuevoId = Math.max(...segmentos.map(s => s.id), 0) + 1;
        setSegmentos([...segmentos, {
            id: nuevoId,
            especialidad: '',
            usuarios: '',
            aperturas: '',
            porcentajeOpen: '',
            clics: '',
            ctr: ''
        }]);
    };

    const eliminarSegmento = (id) => {
        if (segmentos.length > 1) {
            setSegmentos(prev => prev.filter(seg => seg.id !== id));
        }
    };

    const handleDownloadPDF = async () => {
        setLoadingPDF(true);
        
        try {
            const jsPDF = (await import('jspdf')).default;
            await import('jspdf-autotable');
            
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            let yPos = 20;

            // Título principal
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('Formato para reporte de emailing', pageWidth / 2, yPos, { align: 'center' });
            
            yPos += 10;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, pageWidth / 2, yPos, { align: 'center' });
            
            yPos += 15;

            // Sección: Inicio
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 102, 204);
            doc.text('Inicio', 20, yPos);
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

            addField('Detalle de campañas', formData.detalleCampana);
            addField('Nombre de la campaña', formData.nombreCampana);
            addField('Último Envío', formData.ultimoEnvio);
            addField('Correos enviados', formData.correosEnviados);

            // Subject
            yPos += 3;
            doc.setFont('helvetica', 'bold');
            doc.text('Subject:', 20, yPos);
            yPos += 5;
            doc.setFont('helvetica', 'normal');
            const subjectLines = doc.splitTextToSize(formData.subject || 'No especificado', 170);
            doc.text(subjectLines, 20, yPos);
            yPos += (subjectLines.length * 5) + 5;

            // Miniatura
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

            // Métricas
            if (yPos > 220) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 102, 204);
            doc.text('Métricas', 20, yPos);
            yPos += 8;

            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);

            addField('Aperturas', metricas.aperturas);
            addField('%Open', metricas.porcentajeOpen);
            addField('CTO', metricas.cto);
            addField('CTR', metricas.ctr);

            // Segmentos - Tabla
            if (yPos > 180) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 102, 204);
            doc.text('Segmentos', 20, yPos);
            yPos += 10;

            const tableData = segmentos.map(seg => [
                seg.especialidad || '-',
                seg.usuarios || '-',
                seg.aperturas || '-',
                seg.porcentajeOpen || '-',
                seg.clics || '-',
                seg.ctr || '-'
            ]);

            doc.autoTable({
                startY: yPos,
                head: [['Especialidad', '#Usuarios', '#Aperturas', '%Open', 'Clics', 'CTR']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [0, 102, 204] },
                margin: { left: 20, right: 20 }
            });

            yPos = doc.lastAutoTable.finalY + 10;

            // Segmentos enviados
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Segmentos enviados:', 20, yPos);
            yPos += 5;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const segEnviadosLines = doc.splitTextToSize(segmentosEnviados || 'No especificado', 170);
            doc.text(segEnviadosLines, 20, yPos);

            doc.save(`reporte_emailing_${new Date().getTime()}.pdf`);
            
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMensaje({ tipo: '', texto: '' });

        try {
            const dataParaMake = {
                fecha: new Date().toISOString(),
                ...formData,
                metricas,
                segmentos,
                segmentosEnviados
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
            detalleCampana: '',
            nombreCampana: '',
            ultimoEnvio: '',
            correosEnviados: '',
            subject: '',
            miniatura: null
        });
        setMetricas({
            aperturas: '',
            porcentajeOpen: '',
            cto: '',
            ctr: ''
        });
        setSegmentos([
            { id: 1, especialidad: '', usuarios: '', aperturas: '', porcentajeOpen: '', clics: '', ctr: '' }
        ]);
        setSegmentosEnviados('');
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
                        <h3 className="mb-0">Formato para reporte de emailing</h3>
                        <div>
                            <span className="fw-bold me-2">Fecha:</span>
                            <span>{getCurrentDate()}</span>
                        </div>
                    </div>
                </Col>
            </Row>

            {mensaje.texto && (
                <Alert variant={mensaje.tipo} onClose={() => setMensaje({ tipo: '', texto: '' })} dismissible>
                    {mensaje.texto}
                </Alert>
            )}

            <Form onSubmit={handleSubmit}>
                {/* Sección: Inicio */}
                <Row className="mt-4">
                    <Col>
                        <h5 className="text-primary mb-3">Inicio</h5>
                    </Col>
                </Row>

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
                                    <Form.Label>Nombre de la campaña:</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        name="nombreCampana"
                                        value={formData.nombreCampana}
                                        onChange={handleChange}
                                        placeholder="Nombre de la campaña"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Último Envío</Form.Label>
                                    <Form.Control 
                                        type="date"
                                        name="ultimoEnvio"
                                        value={formData.ultimoEnvio}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col sm={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Correos enviados</Form.Label>
                                    <Form.Control 
                                        type="number"
                                        name="correosEnviados"
                                        value={formData.correosEnviados}
                                        onChange={handleChange}
                                        placeholder="Cantidad de correos"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Subject</Form.Label>
                                    <Form.Control 
                                        as="textarea"
                                        rows={3}
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        placeholder="Asunto del correo enviado"
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
                                            del mailing o haz clic para subirlo
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
                <div className="mt-5 mb-4">
                    <h5 className="text-primary mb-3">Métricas</h5>
                    <Row>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Aperturas</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="aperturas"
                                    value={metricas.aperturas}
                                    onChange={handleMetricasChange}
                                    placeholder="Número"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>%Open</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="porcentajeOpen"
                                    value={metricas.porcentajeOpen}
                                    onChange={handleMetricasChange}
                                    placeholder="Ej: 25%"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>CTO</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="cto"
                                    value={metricas.cto}
                                    onChange={handleMetricasChange}
                                    placeholder="Valor"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>CTR</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="ctr"
                                    value={metricas.ctr}
                                    onChange={handleMetricasChange}
                                    placeholder="Valor"
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </div>

                {/* Sección: Segmentos (Tabla) */}
                <div className="mt-5 mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="text-primary mb-0">Segmentos</h5>
                        <Button 
                            variant="success" 
                            size="sm"
                            onClick={agregarSegmento}
                        >
                            <FontAwesomeIcon icon={faPlus} className="me-2" />
                            Agregar segmento
                        </Button>
                    </div>

                    <div className="table-responsive">
                        <Table bordered hover>
                            <thead className="table-primary">
                                <tr>
                                    <th>Especialidad</th>
                                    <th>#Usuarios</th>
                                    <th>#Aperturas</th>
                                    <th>%Open</th>
                                    <th>Clics</th>
                                    <th>CTR</th>
                                    <th style={{ width: '80px' }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {segmentos.map((segmento) => (
                                    <tr key={segmento.id}>
                                        <td>
                                            <Form.Control
                                                size="sm"
                                                type="text"
                                                value={segmento.especialidad}
                                                onChange={(e) => handleSegmentoChange(segmento.id, 'especialidad', e.target.value)}
                                                placeholder="Especialidad"
                                            />
                                        </td>
                                        <td>
                                            <Form.Control
                                                size="sm"
                                                type="number"
                                                value={segmento.usuarios}
                                                onChange={(e) => handleSegmentoChange(segmento.id, 'usuarios', e.target.value)}
                                                placeholder="0"
                                            />
                                        </td>
                                        <td>
                                            <Form.Control
                                                size="sm"
                                                type="number"
                                                value={segmento.aperturas}
                                                onChange={(e) => handleSegmentoChange(segmento.id, 'aperturas', e.target.value)}
                                                placeholder="0"
                                            />
                                        </td>
                                        <td>
                                            <Form.Control
                                                size="sm"
                                                type="text"
                                                value={segmento.porcentajeOpen}
                                                onChange={(e) => handleSegmentoChange(segmento.id, 'porcentajeOpen', e.target.value)}
                                                placeholder="0%"
                                            />
                                        </td>
                                        <td>
                                            <Form.Control
                                                size="sm"
                                                type="number"
                                                value={segmento.clics}
                                                onChange={(e) => handleSegmentoChange(segmento.id, 'clics', e.target.value)}
                                                placeholder="0"
                                            />
                                        </td>
                                        <td>
                                            <Form.Control
                                                size="sm"
                                                type="text"
                                                value={segmento.ctr}
                                                onChange={(e) => handleSegmentoChange(segmento.id, 'ctr', e.target.value)}
                                                placeholder="0%"
                                            />
                                        </td>
                                        <td className="text-center">
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => eliminarSegmento(segmento.id)}
                                                disabled={segmentos.length === 1}
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </div>

                {/* Segmentos enviados */}
                <div className="mt-4 mb-4">
                    <h5 className="text-primary mb-3">Segmentos enviados</h5>
                    <Form.Group>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            value={segmentosEnviados}
                            onChange={(e) => setSegmentosEnviados(e.target.value)}
                            placeholder="Describe los segmentos a los que se envió el mailing..."
                        />
                    </Form.Group>
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

export default FormatoReporte;