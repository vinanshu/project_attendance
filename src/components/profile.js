import React, { useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";

function Profile() {
  const [userDetails, setUserDetails] = useState(null);
  const [scanHistory, setScanHistory] = useState([]); // State to store scan history
  const [showHistory, setShowHistory] = useState(false); // State to toggle history display
  const [screenshotWarning, setScreenshotWarning] = useState(false); // State for warning
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

  // Detect screenshot attempt (using visibilitychange for browsers)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setScreenshotWarning(true); // Display the warning if the page is hidden (screenshot attempt)
      } else {
        setScreenshotWarning(false); // Hide the warning if the page becomes visible again
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div className="profile-container">
      {userDetails ? (
        <>
          {screenshotWarning && (
            <div className="screenshot-warning">
              <p>Warning: Taking screenshots may violate our policy.</p>
            </div>
          )}

          <h3 className="profile-header">Welcome {userDetails.firstName}</h3>
          <div className="profile-info">
            <p><strong>Email: </strong>{userDetails.email}</p>
            <p><strong>First Name: </strong> {userDetails.firstName}</p>
            <p><strong>Last Name:  </strong>{userDetails.lastName}</p>
            <p><strong>ID number: </strong> {userDetails.ID}</p>
            <p><strong>Year: </strong> {userDetails.year}</p>
            <p><strong>Course: </strong> {userDetails.course}</p>
            <p><strong>Section: </strong> {userDetails.section}</p>
            {userDetails.qrCode && (
              <div className="qr-code-container">
                <h5>Your QR Code:</h5>
                <img
                  src={userDetails.qrCode}
                  alt="User QR Code"
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
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default Profile;
