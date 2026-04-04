// Radar Chart updater for SABSA Risk Matrix (IG4)
// Requires Chart.js and a canvas with id 'riskRadar'

let riskRadarChart;

export function updateRadarChart(score) {
    const ctx = document.getElementById('riskRadar').getContext('2d');
    const data = {
        labels: ['Identidad', 'Infraestructura', 'Aplicaciones', 'Datos', 'Operaciones'],
        datasets: [{
            label: 'Nivel de Riesgo',
            data: [score, score, score, score, score],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2
        }]
    };
    const options = {
        scale: {
            min: 0,
            max: 100,
            ticks: { stepSize: 20 }
        },
        plugins: {
            legend: { display: false }
        }
    };
    if (riskRadarChart) {
        riskRadarChart.data.datasets[0].data = [score, score, score, score, score];
        riskRadarChart.update();
    } else {
        riskRadarChart = new Chart(ctx, { type: 'radar', data, options });
    }
}
