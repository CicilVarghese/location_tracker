Real-Time Location Tracker

Project Overview

This is a real-time location tracking application that allows users to track their geographical position using the Geolocation API. The app leverages WebSockets for live communication between users and the server. Locations are displayed on an interactive map using Leaflet.js. User details, such as email, latitude, longitude, and location name, are dynamically updated and displayed in a floating control panel.

Features

Real-Time Location Tracking: Tracks and updates user location in real-time.
WebSocket Communication: Live data transmission between the frontend and server.
Leaflet.js Map: Interactive map for displaying the tracked locations.
User Information Panel: Displays the user's email, latitude, longitude, and location.
Responsive Design: Adapted for mobile and desktop screens.

How It Works

Geolocation API: The browser’s Geolocation API is used to get the user's latitude and longitude.
WebSocket Connection: A WebSocket connection is established between the client and server to send and receive location updates.
Leaflet.js: The user’s location is plotted on a map using the Leaflet.js library. The map is updated as new data is received.
Control Panel: A floating control panel shows the user’s email, latitude, longitude, and a dynamically fetched location name based on coordinates.
Real-Time Updates: The server receives the location data at regular intervals and broadcasts it to other connected users.
