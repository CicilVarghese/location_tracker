const socket = io();
const deviceId = navigator.userAgent; // Use user agent as a unique identifier for each device

// References to the DOM elements where we will display the latitude and longitude
const latitudeElement = document.getElementById('latitude');
const longitudeElement = document.getElementById('longitude');
const locationElement = document.getElementById('location');

// Emit the device ID upon connection
socket.on("connect", () => {
    console.log(`Connected with email: ${userEmail}`);
    socket.emit("register_device", { email: userEmail });
});

if (navigator.geolocation) {
    console.log("Geolocation API is available.");

    let lastEmitTime = 0; // To track the last emission time
    let latestPosition = null; // To store the latest position received

    navigator.geolocation.watchPosition(
        (position) => {
            latestPosition = position;

            const currentTime = Date.now();
            const timeDiff = currentTime - lastEmitTime;

            if (timeDiff >= 5000) {
                const { latitude: lat, longitude: long } = latestPosition.coords;
                console.log("Sending Position:", lat, long);

                // Emit location data including token and Django server URL
                socket.emit("send_location", { 
                    email: userEmail, 
                    lat, 
                    long, 
                    token: token,  // Include token
                    djangoServerURL: djangoServerURL  // Include Django server URL
                });

                lastEmitTime = currentTime;
            } else {
                console.log(`Throttled: Skipping socket.emit. Time since last: ${timeDiff} ms`);
            }
        },
        (error) => {
            console.log("Geolocation error:", error);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 0, // No caching
            timeout: 5000,
        }
    );
} else {
    console.log("Geolocation is not supported by this browser.");
}

// Rest of the code (map, markers, etc.) remains the same

const map = L.map("map").setView([0, 0], 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const markers = {};

socket.on("receive-location", (data) => {
    const { id, email, lat, long } = data;
    console.log(`Received location from ${email}: Latitude ${lat}, Longitude ${long}`);

    // Update the location details in the frontend (latitude, longitude, location)
    latitudeElement.textContent = lat.toFixed(6); // Limiting decimal places for readability
    longitudeElement.textContent = long.toFixed(6); // Limiting decimal places for readability
    

    // Update the marker on the map or add a new marker
    if (markers[id]) {
        markers[id].setLatLng([lat, long]);
    } else {
        markers[id] = L.marker([lat, long]).addTo(map).bindPopup(email).openPopup();
    }

    // Center the map around the latest location
    map.setView([lat, long], 16);
});

socket.on("disconnect", () => {
    console.log("Disconnected from server");
});

socket.on("user_disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});
