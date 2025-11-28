import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar.jsx';
import Footer from './components/Fotter/Fotter.jsx';
import Home from './pages/Home/Home.jsx';
import FormatoEnvio from './pages/Formato_envio/Formato_envio.tsx';
import FormatoReporte from './pages/Formato_reporte/Formato_reporte.tsx'
import FormatoBanner from './pages/Formato_banner/fomato_banner.jsx';
import './App.css'

function App() {
  return (
    
      <>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} /> 
         <Route path="/formato-envio" element={<FormatoEnvio />} />
         <Route path="/formato-reporte" element={<FormatoReporte />} />
         <Route path="/formato-banner" element={<FormatoBanner />} />
        </Routes>
        <Footer />
      </>
    
  );
}

export default App;