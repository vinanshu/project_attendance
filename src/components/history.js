import React, { useState, useEffect } from "react";
import { db } from "../config/firebase"; // Import Firestore
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore"; // Firestore methods
import { useNavigate } from "react-router-dom"; // Import useNavigate for routing
import { signOut } from "firebase/auth"; // Import Firebase signOut
import { auth } from "../config/firebase"; // Import Firebase auth
import "../styles/history.css"; // Import the new CSS

function History() {
  const [history, setHistory] = useState([]); // Store scan history
  const [error, setError] = useState(""); // Store error messages
  const navigate = useNavigate(); // Hook for navigation

  // Handle and display error
  const handleError = (message, errorObject) => {
    setError(message); // Set the error message to display
    console.error(message, errorObject); // Log the detailed error for debugging
  };

  // Verify admin access on component load
  useEffect(() => {
    const verifyAdminAccess = () => {
      try {
        const isAdminVerified = localStorage.getItem("adminVerified");
        if (!isAdminVerified) {
          throw new Error("Unauthorized access. Redirecting to login.");
        }
        console.log("Admin access verified.");
      } catch (error) {
        handleError("Unauthorized access. Please log in.", error);
        navigate("/login"); // Redirect to login page if not verified
      }
    };

    verifyAdminAccess();
  }, [navigate]);

  // Fetch scan history from Firestore when component mounts
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "scanHistory"));
        const scan = querySnapshot.docs.map((doc) => ({
          id: doc.id, // Firestore document ID
          ...doc.data(),
        }));
        setHistory(scan); // Set the fetched history to state
      } catch (error) {
        handleError("Failed to fetch scan history. Please try again later.", error);
      }
    };

    fetchHistory();
  }, []);

  // Function to delete all scan history from Firestore
  const deleteAllHistory = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "scanHistory"));
      const deletePromises = querySnapshot.docs.map((docRef) =>
        deleteDoc(doc(db, "scanHistory", docRef.id))
      );
      await Promise.all(deletePromises); // Wait until all deletes are done

      setHistory([]); // Clear history from the state
      alert("All history deleted successfully!");
    } catch (error) {
      handleError("Failed to delete scan history. Please try again.", error);
    }
  };

  // Navigate to Scan page
  const goToScan = () => {
    try {
      navigate("/scan"); // Navigate to the Scan page
    } catch (error) {
      handleError("Failed to navigate to the Scan page.", error);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign the user out
      localStorage.removeItem("adminVerified"); // Remove admin verification status
      alert("Logged out successfully");
      navigate("/login"); // Navigate to the login page after logout
    } catch (error) {
      handleError("Failed to log out. Please try again.", error);
    }
  };

  return (
    <div className="history-container">
      <h2 className="history-title">Scan History</h2>

      {/* Display error messages */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <div className="table-container">
        {history.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ID number</th>
                <th>IN Timestamp</th>
                <th>OUT Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {history.map((scan) => (
                <tr key={scan.id}>
                  <td>{scan.firstName}</td>
                  <td>{scan.status === "IN" ? scan.timestamp : "-"}</td>
                  <td>{scan.status === "OUT" ? scan.timestamp : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: "center", fontSize: "18px" }}>No history available.</p>
        )}
      </div>

      <div className="text-center">
        <button onClick={deleteAllHistory} className="button delete-btn">
          Delete All History
        </button>
      </div>

      <div className="text-center">
        <button onClick={goToScan} className="button go-to-scan-btn">
          Go to Scan
        </button>
      </div>

      <div className="text-center">
        <button onClick={handleLogout} className="button logout-btn">
          Logout
        </button>
      </div>
    </div>
  );
}

export default History;
