import React, { useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";

function Profile() {
  const [userDetails, setUserDetails] = useState(null);
  const [scanHistory, setScanHistory] = useState([]); // State to store scan history
  const [showHistory, setShowHistory] = useState(false); // State to toggle history display
  const [showDownloadOptions, setShowDownloadOptions] = useState(false); // State for QR options
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "Users", user.uid); // Fetch user by UID
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserDetails(docSnap.data());
          } else {
            console.log("User data not found in Firestore");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserDetails(null);
        navigate("/login"); // Redirect to login if no user
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch scan history from Firestore
  const fetchScanHistory = async () => {
    if (!userDetails || !userDetails.ID) return;

    try {
      const q = query(
        collection(db, "scanHistory"),
        where("idNumber", "==", userDetails.ID)
      );
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map((doc) => doc.data());
      setScanHistory(history);
      setShowHistory(true); // Show history after fetching
    } catch (error) {
      console.error("Error fetching scan history:", error);
    }
  };

  const toggleHistory = async () => {
    if (showHistory) {
      setShowHistory(false); // Hide history
    } else {
      await fetchScanHistory(); // Fetch and show history
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login"); // Redirect to login after logout
      console.log("User logged out successfully!");
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  // Handle QR Code click
  const handleQRCodeClick = () => {
    setShowDownloadOptions(true); // Show download/cancel options
  };

  // Handle QR Code download
  const downloadQRCode = () => {
    if (userDetails?.qrCode) {
      const link = document.createElement("a");
      link.href = userDetails.qrCode;
      link.download = "QRCode.png";
      link.click();
    }
    setShowDownloadOptions(false); // Hide options after download
  };

  return (
    <div className="profile-container">
      {userDetails ? (
        <>
          <h3 className="profile-header">Welcome {userDetails.firstName}</h3>
          <div className="profile-info">
            <p>Email: {userDetails.email}</p>
            <p>First Name: {userDetails.firstName}</p>
            <p>Last Name: {userDetails.lastName}</p>
            <p>ID number: {userDetails.ID}</p>
            {userDetails.qrCode && (
              <div className="qr-code-container">
                <h5>Your QR Code:</h5>
                <img
                  src={userDetails.qrCode}
                  alt="User QR Code"
                  onClick={handleQRCodeClick}
                />
              </div>
            )}
          </div>
          <div className="button-container">
            <button className="btn btn-primary" onClick={toggleHistory}>
              {showHistory ? "Hide History" : "Show History"}
            </button>
            <button className="btn btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>

          {/* Display scan history */}
          {showHistory && (
            <div className="attendance-history">
              <h4>My Attendance</h4>
              {scanHistory.length > 0 ? (
                <ul>
                  {scanHistory.map((record, index) => (
                    <li key={index}>
                      {record.timestamp} - <span>{record.status}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-history">No attendance available.</p>
              )}
            </div>
          )}

          {/* QR Code download options */}
          {showDownloadOptions && (
            <div className="qr-code-modal">
              <div className="modal-content">
                <h5>Download QR Code?</h5>
                <button className="btn btn-success" onClick={downloadQRCode}>
                  Download
                </button>
                <button
                  className="btn btn-danger cancel"
                  onClick={() => setShowDownloadOptions(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default Profile;
