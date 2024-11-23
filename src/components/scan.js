import React, { useState, useEffect } from "react";
import QRScanner from "react-qr-scanner"; // QR scanner component
import { toast } from "react-toastify"; // For displaying toast notifications
import "react-toastify/dist/ReactToastify.css"; // Styles for toast notifications
import { db } from "../config/firebase"; // Import Firestore
import { collection, addDoc, query, where, getDocs } from "firebase/firestore"; // Firestore methods
import { useNavigate } from "react-router-dom"; // Import useNavigate for routing
import { signOut } from "firebase/auth"; // Import Firebase signOut method
import { auth } from "../config/firebase"; // Firebase authentication
import "../styles/scan.css";

function Scan() {
  const [scanResult, setScanResult] = useState(""); // Store scanned result
  const [status, setStatus] = useState(""); // Store the action (IN/OUT)
  const [scanning, setScanning] = useState(false); // Control scanner state
  const [cameraFacing, setCameraFacing] = useState("environment"); // Camera facing mode
  const [scannerError, setScannerError] = useState(null); // Store scanner errors
  const navigate = useNavigate(); // Hook for navigation

  // Verify admin access on component load
  useEffect(() => {
    const verifyAdminAccess = () => {
      const isAdminVerified = localStorage.getItem("adminVerified");
      if (!isAdminVerified) {
        toast.error("Unauthorized access. Redirecting to login.", {
          position: "top-center",
        });
        navigate("/login"); // Redirect to login page if not verified
      }
    };

    verifyAdminAccess();
  }, [navigate]);

  // Handle successful scan
  const handleScan = async (data) => {
    if (data) {
      setScanResult(data.text); // Set the scanned result

      // Extract user info from the scanned QR code text
      const [fname, IDnumber] = data.text.split(" ");

      // Check Firestore if the same ID number has already scanned for the same status (IN/OUT)
      const q = query(
        collection(db, "scanHistory"),
        where("idNumber", "==", IDnumber),
        where("status", "==", status)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // If a record already exists with the same ID number and status, prevent further scanning
        toast.error(`ID ${IDnumber} has already scanned as ${status}`, {
          position: "top-center",
        });
        return; // Prevent saving new scan
      }

      // Prepare the data to save in Firestore
      const scanData = {
        name: fname,
        idNumber: IDnumber,
        status, // IN or OUT
        timestamp: new Date().toLocaleString(),
      };

      try {
        // Save the scan data to Firestore
        await addDoc(collection(db, "scanHistory"), scanData);

        // Display success toast notification
        setStatus(`${status} - Approved`);
        setScanning(false); // Turn off scanning after processing
        toast.success(`QR Code ${status} processed successfully!`, {
          position: "top-center",
        });
      } catch (error) {
        console.error("Error saving scan data: ", error);
        toast.error("Failed to save scan data", { position: "top-center" });
      }
    }
  };

  // Handle scan error
  const handleError = (error) => {
    console.error("QRScanner Error:", error);
    setScannerError(error?.message || "Camera access failed. Please check your permissions.");
    toast.error("Camera error detected. Check console for details.", {
      position: "top-center",
    });
  };

  // Handle IN/OUT button click
  const handleButtonClick = (action) => {
    setStatus(action); // Set status to "IN" or "OUT"
    setScanResult(""); // Clear previous scan result
    setScanning(true); // Enable scanning
    setScannerError(null); // Reset scanner error
  };

  useEffect(() => {
    if (status === "IN" || status === "OUT") {
      toast.success(`QR Code ${status}`, { position: "top-center" });
    }
  }, [status]);

  // Handle camera toggle
  const toggleCamera = () => {
    setCameraFacing((prevFacing) =>
      prevFacing === "environment" ? "user" : "environment"
    );
  };

  // Handle navigation to history page
  const goToHistory = () => {
    navigate("/history"); // Navigate to history.js page
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign the user out
      localStorage.removeItem("adminVerified"); // Remove admin verification status
      alert("Logged out successfully!");
      navigate("/login"); // Navigate to the login page
    } catch (error) {
      console.error("Error logging out: ", error);
      alert("Failed to log out");
    }
  };

  return (
    <div className="scan-container">
      <h1 className="scan-title">QR Code Scanner</h1>

      {/* Buttons for IN and OUT actions */}
      <div className="action-buttons">
        <button className="in-btn" onClick={() => handleButtonClick("IN")}>
          IN
        </button>
        <button className="out-btn" onClick={() => handleButtonClick("OUT")}>
          OUT
        </button>
      </div>

      {/* QR code scanner */}
      <div className="scanner-container">
        {scanning && !scannerError && (
          <QRScanner
            delay={300}
            style={{ width: "100%" }}
            constraints={{
              video: { facingMode: { exact: cameraFacing } }, // Explicit facingMode
            }}
            onScan={handleScan}
            onError={handleError}
          />
        )}
        {!scanning && (
          <p className="scanner-message">
            Scanner is off. Please click "IN" or "OUT" to start scanning.
          </p>
        )}
        {scannerError && (
          <p className="scanner-error">{scannerError}</p>
        )}
      </div>

      {/* Toggle Camera Button */}
      <div className="toggle-camera">
        <button onClick={toggleCamera}>
          {cameraFacing === "environment" ? "Switch to Front Camera" : "Switch to Back Camera"}
        </button>
      </div>

      {/* Display scanned result and status */}
      {scanResult && <p className="scan-result">Scanned QR Code: {scanResult}</p>}
      {status && <p className="status-message">Status: {status}</p>}

      {/* Button to navigate to History page */}
      <div>
        <button className="history-btn" onClick={goToHistory}>
          Go to History
        </button>
      </div>

      {/* Logout Button */}
      <div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Scan;
