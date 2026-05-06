var options = {
	chart: {
		type: 'line',
		height: 400
	},
	series: [
		{
			name: 'Visitors',
			data: [300, 400, 350, 500, 700, 600, 800, 1000, 900, 1100, 950, 1200]
		},
		{
			name: 'New Quotation Request',
			data: [150, 250, 200, 300, 350, 400, 450, 500, 480, 510, 520, 600]
		},
		{
			name: 'Inspection Pending',
			data: [100, 150, 180, 220, 280, 290, 310, 350, 370, 390, 410, 450]
		},
		{
			name: 'Inspection Done',
			data: [80, 90, 120, 150, 160, 200, 210, 230, 250, 270, 290, 310]
		},
		{
			name: 'Final Quote Send',
			data: [60, 80, 100, 120, 140, 180, 200, 210, 220, 230, 240, 260]
		}
	],
	xaxis: {
		categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		labels: {
			style: {
				colors: 'var(--2, #000)',
				fontFamily: '"IBM Plex Sans"',
				fontSize: '16px',
				fontStyle: 'normal',
				fontWeight: 500,
				lineHeight: '20px',
				textAlign: 'right'
			}
		}
	},
	yaxis: {
		labels: {
			style: {
				colors: 'var(--2, #000)',
				fontFamily: '"IBM Plex Sans"',
				fontSize: '16px',
				fontStyle: 'normal',
				fontWeight: 500,
				lineHeight: '20px',
				textAlign: 'right'
			}
		}
	},
	stroke: {
		curve: 'smooth'
	},
	grid: {
		borderColor: '#e0e0e0',
		strokeDashArray: 5 // Dashed horizontal lines
	},
	colors: ['#008FFB', '#FF4560', '#775DD0', '#00E396', '#FEB019'],
	legend: {
		position: 'top',
		markers: {
			width: 20, // Square width
			height: 20, // Square height
			radius: 4, // Border radius for slightly rounded square
			fillColors: undefined // Default colors for each legend item
		},
	},
	tooltip: {
		shared: true,
		intersect: false
	},
	markers: {
		size: 5,
		hover: {
			sizeOffset: 6
		}
	}
}

var chart = new ApexCharts(document.querySelector("#lineChart"), options);
chart.render();



// Pay chart
var options = {
	series: [35764, 16428],
	chart: {
		type: 'donut',
		height: 350,
	},
	labels: ['Male', 'Female'],
	colors: ['#6A4CF3', '#FF9F43'],
	plotOptions: {
		pie: {
			donut: {
				size: '70%',
				labels: {
					show: true,
					total: {
						show: true,
						label: 'Total',
						formatter: function (w) {
							return w.globals.seriesTotals.reduce((a, b) => a + b, 0).toLocaleString();
						}
					}
				}
			}
		}
	},
	dataLabels: {
		enabled: false,
	},
	tooltip: {
		enabled: false
	},
	legend: {
		show: false
	},
};

var chart = new ApexCharts(document.querySelector("#chart"), options);
chart.render();
