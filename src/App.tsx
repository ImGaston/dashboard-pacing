import { useState } from 'react';
import { UploadScreen } from './components/UploadScreen';
import { Dashboard } from './components/Dashboard';
import { parseCSV } from './utils/csvParser';
import type { Reservation } from './types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function App() {
  const [view, setView] = useState<'upload' | 'dashboard'>('upload');
  const [rawData, setRawData] = useState<Reservation[]>([]);
  const [comparisonDate, setComparisonDate] = useState<Date>(new Date());
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpload = async (filePrev: File, fileCurr: File, date: Date) => {
    setIsProcessing(true);
    try {
      const [dataPrev, dataCurr] = await Promise.all([
        parseCSV(filePrev),
        parseCSV(fileCurr)
      ]);

      const mergedData = [...dataPrev, ...dataCurr];
      setRawData(mergedData);
      setComparisonDate(date);

      setTimeout(() => {
        setIsProcessing(false);
        setView('dashboard');
      }, 500);

    } catch (error) {
      console.error("Error parsing CSV:", error);
      alert("Error parsing CSVs. Please check the file formats.");
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    setRawData([]);
    setView('upload');
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('dashboard-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#DDDAD3' // Match bone background
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4' // or [canvas.width, canvas.height] for single page
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`RevPulse_Dashboard_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export PDF.");
    }
  };

  return (
    <div className="min-h-screen bg-bone">
      {view === 'upload' ? (
        <UploadScreen onUpload={handleUpload} isProcessing={isProcessing} />
      ) : (
        <Dashboard
          rawData={rawData}
          comparisonDate={comparisonDate}
          onBack={handleBack}
          onExport={handleExportPDF}
        />
      )}
    </div>
  );
}

export default App;
