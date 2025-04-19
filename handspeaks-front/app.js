document.getElementById('connect-btn').addEventListener('click', () => {
    alert('Connecting to smartwatch...');
    // Add WebBLE or other connection logic here
});

// Simulate sensor data update every 2 seconds
setInterval(() => {
    document.getElementById('acceleration').textContent = `X: ${Math.random().toFixed(2)} Y: ${Math.random().toFixed(2)} Z: ${Math.random().toFixed(2)}`;
    document.getElementById('gyroscope').textContent = `X: ${Math.random().toFixed(2)} Y: ${Math.random().toFixed(2)} Z: ${Math.random().toFixed(2)}`;
    document.getElementById('gravity').textContent = `X: ${Math.random().toFixed(2)} Y: ${Math.random().toFixed(2)} Z: ${Math.random().toFixed(2)}`;
}, 2000);
