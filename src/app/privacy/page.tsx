export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto prose">
        <h1>Privacy Policy</h1>
        <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>

        <h2>Overview</h2>
        <p>
          This privacy policy describes how we collect, use, and protect your location data when you use our service. 
          We use Google Fit API to access your location history to create a personalized map visualization.
        </p>

        <h2>Information We Collect</h2>
        <p>We collect and process the following data through the Google Fit API:</p>
        <ul>
          <li>Location history data</li>
          <li>Basic profile information</li>
        </ul>

        <h2>How We Use Your Data</h2>
        <p>Your location data is used solely to:</p>
        <ul>
          <li>Create a visualization of places you&apos;ve visited</li>
          <li>Generate a &quot;fog of war&quot; effect on unexplored areas</li>
          <li>Show your current location on the map</li>
        </ul>

        <p>We do NOT:</p>
        <ul>
          <li>Store your location data on our servers</li>
          <li>Share your data with third parties</li>
          <li>Use your data for advertising purposes</li>
          <li>Track your real-time location</li>
        </ul>

        <h2>Data Security</h2>
        <ul>
          <li>All data is processed client-side in your browser</li>
          <li>We don&apos;t maintain any server-side storage of your information</li>
          <li>We use secure OAuth 2.0 authentication for Google API access</li>
        </ul>

        <h2>Your Rights</h2>
        <p>
          You can revoke access to your Google Fit data at any time through your 
          <a href="https://myaccount.google.com/permissions" className="text-blue-600 hover:underline"> Google Account settings</a>.
        </p>

        <h2>Contact</h2>
        <p>
          If you have any questions about this privacy policy, please contact us at [your contact info].
        </p>
      </div>
    </main>
  );
} 