import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { db } from "../config/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import Webcam from "react-webcam";
import jsQR from "jsqr";
import "../styles/scan.css";

function Scan() {
  const [scanResult, setScanResult] = useState(""); // Store scanned result
  const [status, setStatus] = useState(""); // Store IN/OUT status
  const [scanning, setScanning] = useState(false); // Enable or disable scanning
  const [cameraFacing, setCameraFacing] = useState("environment"); // Toggle camera facing
  const webcamRef = useRef(null); // Reference for the webcam
  const navigate = useNavigate(); // Navigation hook

  // Verify admin access on component load
  useEffect(() => {
    const verifyAdminAccess = () => {
      const isAdminVerified = localStorage.getItem("adminVerified");
      if (!isAdminVerified) {
        toast.error("Unauthorized access. Redirecting to login.", {
          position: "top-center",
        });
        navigate("/login");
      }
    };
    verifyAdminAccess();
  }, [navigate]);

  // Handle successful scan
  const handleScan = async (data) => {
    try {
      if (!data) {
        toast.error("Invalid QR code data. Please try again.", {
          position: "top-center",
        });
        return;
      }

      const [fname, IDnumber] = data.split(" ");
      if (!fname || !IDnumber) {
        toast.error("QR code data is incomplete.", {
          position: "top-center",
        });
        return;
      }

      const q = query(
        collection(db, "scanHistory"),
        where("idNumber", "==", IDnumber),
        where("fname", "==", fname),
        where("status", "==", status)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast.error(`ID ${IDnumber} has already been marked as ${status}.`, {
          position: "top-center",
        });
        return;
      }

      const scanData = {
        firstName: fname,
        idNumber: IDnumber,
        status,
        timestamp: new Date().toLocaleString(),
      };

      await addDoc(collection(db, "scanHistory"), scanData);
      toast.success(`QR Code ${status} processed successfully!`, {
        position: "top-center",
      });

      setScanResult(data);
      setScanning(false);
    } catch (error) {
      console.error("Error processing scan:", error);
      toast.error("An error occurred while processing the scan.", {
        position: "top-center",
      });
    }
  };

  // Handle IN/OUT button click
  const handleButtonClick = (action) => {
    setStatus(action);
    setScanResult("");
    setScanning(true);
  };

  // Capture image and scan QR code
  const captureAndScan = () => {
    if (!webcamRef.current) {
      toast.error("Camera not available. Please try again.", {
        position: "top-center",
      });
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      toast.error("Failed to capture image. Please try again.", {
        position: "top-center",
      });
      return;
    }

    const image = new Image();
    image.src = imageSrc;

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);

      if (code) {
        handleScan(code.data);
      } else {
        toast.error("No QR code found. Please try again.", {
          position: "top-center",
        });
      }
    };
  };

  // Toggle camera facing mode
  const toggleCamera = () => {
    setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Handle navigation to history page
  const goToHistory = () => {
    navigate("/history");
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("adminVerified");
      toast.success("Logged out successfully.", { position: "top-center" });
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out. Please try again.", { position: "top-center" });
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

      {/* Webcam for capturing image */}
      <div className="scanner-container">
        {scanning && (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width="100%"
            videoConstraints={{ facingMode: cameraFacing }}
          />
        )}
        {!scanning && (
          <p className="scanner-message">
            Scanner is off. Click "IN" or "OUT" to start scanning.
          </p>
        )}
      </div>

      {/* Capture Image Button */}
      <div className="capture-button">
        <button onClick={captureAndScan} className="scan">Scan</button>
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

      {/* Navigate to History */}
      <div>
        <button className="history-btn" onClick={goToHistory}>
          View Scan History
        </button>
      </div>

      {/* Logout */}
      <div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Scan;
