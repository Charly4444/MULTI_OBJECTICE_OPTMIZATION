import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register the necessary components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ViewsPage = () => {

  const navigate = useNavigate();

  const [data1, setData1] = useState(null);
  const [data2, setData2] = useState(null);
  const [data3, setData3] = useState(null);
  const [data4, setData4] = useState(null);

  const handleOptimizer = async () => {
    // by default i will handle with nsga to load with pareto
    let endpoint = 'http://localhost:5000/optimize_nsga';
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const result = await response.json();
        navigate('/parameters', { state: result });
    } catch (error) {
        console.error('Error during optimization:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetching JSON data from Flask server :: HAD TO TAKE THIS TURN
        const json1 = await fetch('http://localhost:5000/static/dataviews/data_objout_1.json').then(res=>res.json());
        const json2 = await fetch('http://localhost:5000/static/dataviews/data_objout_2.json').then(res=>res.json());
        // 
        const json3 = await fetch('http://localhost:5000/static/dataviews/data_objout_model_1.json').then(res=>res.json());
        const json4 = await fetch('http://localhost:5000/static/dataviews/data_objout_model_2.json').then(res=>res.json());
        
        // Slice the data arrays to get the first 100 data points
        const data1Slice = json1.out.slice(0, 70);
        const data2Slice = json2.out.slice(0, 70);
        const data3Slice = json3.out_model.slice(0, 70);
        const data4Slice = json4.out_model.slice(0, 70);

        setData1({
          labels: Array.from({ length: data1Slice.length }, (_, i) => i + 1),
          datasets: [
            {
              label: 'Objective 1',
              data: data1Slice,
              fill: false,
              backgroundColor: 'rgb(75, 192, 192)',
              borderColor: 'rgba(75, 192, 192, 0.2)',
            },
          ],
        });

        setData2({
          labels: Array.from({ length: data2Slice.length }, (_, i) => i + 1),
          datasets: [
            {
              label: 'Objective 2',
              data: data2Slice,
              fill: false,
              backgroundColor: 'rgb(153, 102, 255)',
              borderColor: 'rgba(153, 102, 255, 0.2)',
            },
          ],
        });

        setData3({
          labels: Array.from({ length: data3Slice.length }, (_, i) => i + 1),
          datasets: [
            {
              label: 'Objective 1 model',
              data: data3Slice,
              fill: false,
              backgroundColor: 'rgb(75, 192, 192)',
              borderColor: 'rgba(75, 192, 192, 0.2)',
            },
          ],
        });

        setData4({
          labels: Array.from({ length: data4Slice.length }, (_, i) => i + 1),
          datasets: [
            {
              label: 'Objective 2 model',
              data: data4Slice,
              fill: false,
              backgroundColor: 'rgb(153, 102, 255)',
              borderColor: 'rgba(153, 102, 255, 0.2)',
            },
          ],
        });

      } catch (error) {
        console.error('Error fetching data:', error);
        // Handle error state if necessary
      }
    };

    fetchData();
  }, []);

  if (!data1 || !data2 || !data3 || !data4) {
    return <div>Loading...</div>;
  }

  return (
    <div className="views-page">
      <div className="top-section">
        <div className="left">
          <div className="chart">
            <Line data={data3} />
          </div>
          <div className="chart">
            <Line data={data4} />
          </div>
        </div>
        <div className="right">
          <div className="chart">
            <Line data={data1} />
          </div>
          <div className="chart">
            <Line data={data2} />
          </div>
        </div>
      </div>
      <div className="bottom-section">
        <h3>Proceed with Optimization</h3>
        <button className='other-btn' style={{fontSize: '15px', padding: '8px 8px', backgroundColor: '#f913a'}} onClick={handleOptimizer}>Optimize</button>
      </div>
    </div>
  );
};

export default ViewsPage;
