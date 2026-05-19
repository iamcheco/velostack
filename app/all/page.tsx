import Link from "next/link";

export default function DirectoryPage() {
  return (
    <div style={{ fontFamily: "Verdana, Arial, Helvetica, sans-serif", fontSize: "12px", background: "#ffffff", minHeight: "100vh", position: "relative", zIndex: 1000 }}>
      <header style={{ background: "#cee3f8", borderBottom: "1px solid #5f99cf", padding: "5px 10px", display: "flex", gap: "10px", alignItems: "center" }}>
        <b style={{ fontSize: "16px", marginRight: "10px" }}>VeloStack Directory</b>
        <Link href="/" style={{ color: "#0000ff", textDecoration: "underline" }}>home</Link>
        <span style={{ color: "#888" }}>|</span>
        <Link href="/analyzer" style={{ color: "#0000ff", textDecoration: "underline" }}>analyzer</Link>
        <span style={{ color: "#888" }}>|</span>
        <Link href="/tracker" style={{ color: "#0000ff", textDecoration: "underline" }}>tracker</Link>
        <span style={{ color: "#888" }}>|</span>
        <Link href="/extractor" style={{ color: "#0000ff", textDecoration: "underline" }}>extractor</Link>
        <span style={{ color: "#888" }}>|</span>
        <Link href="/mechanic" style={{ color: "#0000ff", textDecoration: "underline" }}>mechanic</Link>
      </header>

      <div style={{ padding: "15px" }}>
        <h2 style={{ fontSize: "18px", color: "#336699", borderBottom: "1px solid #ddd", paddingBottom: "5px", marginBottom: "15px", fontWeight: "normal" }}>
          All Phases & Functions
        </h2>
        
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              <th style={{ padding: "5px", border: "1px solid #ccc", fontWeight: "bold" }}>Status</th>
              <th style={{ padding: "5px", border: "1px solid #ccc", fontWeight: "bold" }}>Phase</th>
              <th style={{ padding: "5px", border: "1px solid #ccc", fontWeight: "bold" }}>Link / Route</th>
              <th style={{ padding: "5px", border: "1px solid #ccc", fontWeight: "bold" }}>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ccc", fontWeight: "bold", color: "green" }}>LIVE</td>
              <td style={{ padding: "8px", border: "1px solid #ccc" }}>Phase 1</td>
              <td style={{ padding: "8px", border: "1px solid #ccc" }}><Link href="/analyzer" style={{ color: "#0000ff", textDecoration: "underline" }}>Fix & Flip Finder</Link></td>
              <td style={{ padding: "8px", border: "1px solid #ccc" }}>Paste any bike listing and get an instant deal verdict, estimated repair costs, and profit potential.</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ccc", fontWeight: "bold", color: "green" }}>LIVE</td>
              <td style={{ padding: "8px", border: "1px solid #ccc" }}>Phase 2</td>
              <td style={{ padding: "8px", border: "1px solid #ccc" }}><Link href="/tracker" style={{ color: "#0000ff", textDecoration: "underline" }}>Parts Wear Tracker</Link></td>
              <td style={{ padding: "8px", border: "1px solid #ccc" }}>Log rides via Strava or manually. Get warnings before your chain, brakes, or cassette fail.</td>
            </tr>
             <tr>
              <td style={{ padding: "8px", border: "1px solid #ccc", fontWeight: "bold", color: "green" }}>LIVE</td>
              <td style={{ padding: "8px", border: "1px solid #ccc" }}>Phase 3</td>
              <td style={{ padding: "8px", border: "1px solid #ccc" }}><Link href="/extractor" style={{ color: "#0000ff", textDecoration: "underline" }}>YouTube Skill Extractor</Link></td>
              <td style={{ padding: "8px", border: "1px solid #ccc" }}>Paste a repair video URL and get an interactive step-by-step checklist with tools and time estimate.</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ccc", color: "#888" }}>COMING SOON</td>
              <td style={{ padding: "8px", border: "1px solid #ccc" }}>Phase 4</td>
              <td style={{ padding: "8px", border: "1px solid #ccc", color: "#0000ff", textDecoration: "underline" }}>Pocket Bike Mechanic AI</td>
              <td style={{ padding: "8px", border: "1px solid #ccc" }}>Upload a photo of any bike issue. OpenCV preprocessing + AI vision gives you a diagnosis and repair steps.</td>
            </tr>
          </tbody>
        </table>
        
        <div style={{ marginTop: "20px", color: "#888", fontSize: "10px" }}>
          Use of this site constitutes acceptance of our User Agreement and Privacy Policy. © 2026 VeloStack inc. All rights reserved.
        </div>
      </div>
    </div>
  );
}
