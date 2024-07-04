import React, { useState } from 'react';
// import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import { Button } from '@mui/material';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas'
import { Line, Bar, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);


const ParametersPage = () => {
  const location = useLocation();
  const [paretoF1, setParetoF1] = useState(location.state?.pareto_f1 || []);
  const [paretoF2, setParetoF2] = useState(location.state?.pareto_f2 || []);
  const [paretoFrontIndividuals, setParetoFrontIndividuals] = useState(location.state?.pareto_front_individuals || []);
  const [selectedMethod, setSelectedMethod] = useState(''); // for later use on button

  
  const handleToggle = async (method) => {
    setSelectedMethod(method);
    // switch endpoint based on what mode we select click
    let endpoint = method === 'nsga' ? 'http://localhost:5000/optimize_nsga' : 'http://localhost:5000/optimize_pso';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();

      setParetoF1(result.pareto_f1);
      setParetoF2(result.pareto_f2);
      setParetoFrontIndividuals(result.pareto_front_individuals);
    } 
    catch (error) {
      console.error('Error during optimization:', error);
    }
  };


  // Graph Params i will use
  const scatterData = {
    labels: Array.from({ length: paretoF1.length }, (_, i) => i + 1),
    datasets: [
      {
        label: 'Pareto Front',
        data: paretoF1.map((x, i) => ({ x: x, y: paretoF2[i] })),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  const barData1 = {
    labels: paretoFrontIndividuals.length > 0 ? Array.from({ length: paretoFrontIndividuals[0].length }, (_, i) => `Param ${i + 1}`) : [],
    datasets: [
      {
        label: 'Individual 1',
        data: paretoFrontIndividuals.length > 0 ? paretoFrontIndividuals[0] : [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  const barData2 = {
    labels: paretoFrontIndividuals.length > 1 ? Array.from({ length: paretoFrontIndividuals[1].length }, (_, i) => `Param ${i + 1}`) : [],
    datasets: [
      {
        label: 'Individual 2',
        data: paretoFrontIndividuals.length > 1 ? paretoFrontIndividuals[1] : [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  const barOptions = {
    scales: {
      x: { title: { display: true, text: 'Parameters' } },
      y: { title: { display: true, text: 'Values' } }
    }
  };

  const options = {
    scales: {
      x: {
        type: 'linear',
        position: 'bottom'
      },
    },
  };


  // WE INCLUDE HERE A RANDOMLY SELECTED POINT AS THE OPTIMAL, THOUGH WE WOULD
  // USUALLY HAVE TO USE SOME DECISION MAKING LOGIC TO CHOOSE FROM FRONT
  const lineData = {
    labels: paretoFrontIndividuals.length > 0 ? Array.from({ length: paretoFrontIndividuals[0].length }, (_, i) => `Param ${i + 1}`) : [],
    datasets: [
      {
        label: 'parameter OPTIMAL',
        data: paretoFrontIndividuals.length > 0 ? paretoFrontIndividuals[0] : [],
        borderColor: 'red',
        fill: false,
        borderDash: [2, 2],
        pointStyle: 'circle',
        pointRadius: 5,
        pointBorderColor: 'rgba(75, 192, 192, 0.6)',
        pointBackgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  const lineOptions = {
    scales: {
      x: { title: { display: true, text: 'Parameters' } },
      y: { title: { display: true, text: 'Values' } }
    }
  };


  const handleDownloadReport = () => {
    const doc = new jsPDF();
    doc.text('Pareto Optimization Report', 14, 16);
  
    const captureElement = async (element, doc, x, y, width, height) => {
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', x, y, width, height);
    };
  
    const addChartsAndDownload = async () => {
      const chartsElement = document.getElementById('charts');
      if (chartsElement) {
        await captureElement(chartsElement, doc, 10, 30, 180, 100); // width, height
      }
  
      // const recommendedSolutionElement = document.getElementById('recommended-solution');
      // if (recommendedSolutionElement) {
      //   await captureElement(recommendedSolutionElement, doc, 10, 140, 180, 60); // width, height
      // }
  
      const analysisSummaryElement = document.getElementById('analysis-summary');
      if (analysisSummaryElement) {
        await captureElement(analysisSummaryElement, doc, 10, 210, 180, 60); // Adjust height as necessary
      }
  
      doc.save('pareto_report.pdf');
    };
  
    addChartsAndDownload();
  };

  return (
    <div>
      <div id="charts" style={{ display: 'flex', flexDirection: 'row' }}>
        <div style={{ flex: 1, padding: '10px' }}>
          <h2>Pareto Solutions parameters</h2>
          <Bar data={barData1} options={barOptions}/>
          <Bar data={barData2} options={barOptions}/>
        </div>
      </div>
      
      {/* the buttin Controls */}
      <div>
        <div>
          <button 
            className="other-btn"
            onClick={() => handleToggle('nsga')}
            style={{ backgroundColor: selectedMethod === 'nsga' ? 'lightblue' : 'white' }}
          >
            NSGA
          </button>
          <button 
            className="other-btn"
            onClick={() => handleToggle('pso')}
            style={{ backgroundColor: selectedMethod === 'pso' ? 'lightblue' : 'white' }}
          >
            PSO
          </button>
        </div>
        <Scatter data={scatterData} options={options} />
      </div>
      
      {/* analysis and summary section */}
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        {paretoFrontIndividuals.length > 0 && (
          <div id= "analysis-summary" style={{ flex: 3, padding: '10px' }}>
            <h2>Recommended Solution</h2>
            <Line data={lineData} options={lineOptions} />
          </div>
        )}

        <div style={{ flex: 1, padding: '10px' }}>
          <h3>Download Report</h3>
          <Button variant="contained" color="primary" onClick={handleDownloadReport}>Download Report</Button>
        </div>
      </div>
    </div>
  );
};

export default ParametersPage;
