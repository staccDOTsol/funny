ble # World Map Explorer

An interactive map application that shows your visited places with a fog of war effect covering unexplored areas. Uses Google Maps Timeline data to reveal places you've been to.

## Features

- Google Sign-In integration
- Loads your location history from Google Maps Timeline
- Interactive fog of war effect
- Search functionality with Places API
- Dark theme map style
- Responsive design

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up Google Cloud Project:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Maps JavaScript API
     - Places API
     - Google Maps Timeline API
     - OAuth 2.0 API

4. Configure OAuth 2.0:
   - In Google Cloud Console, go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - Your production domain (if deploying)
   - Save the Client ID

5. Get Maps API Key:
   - In Google Cloud Console, go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Restrict the API key to:
     - Maps JavaScript API
     - Places API

6. Create `.env.local` file in the project root:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key_here
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_oauth_client_id_here
```

7. Run the development server:
```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Sign in with your Google account
2. The map will automatically load and display your visited places
3. Use the search box to find specific places
4. Click anywhere on the map to reveal more areas

## Important Notes

- The application requires access to your Google Maps Timeline data
- Make sure you have Location History enabled in your Google Account settings
- The fog of war effect shows areas you've visited with your Google Account's location history
