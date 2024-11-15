import React, { useState, useEffect } from "react";
import { db } from '../config/firebase'; // Import Firestore
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore"; // Firestore methods
import { useNavigate } from "react-router-dom"; // Import useNavigate for routing
import { signOut } from "firebase/auth"; // Import Firebase signOut
import { auth } from "../config/firebase"; // Import Firebase auth
import "../styles/history.css"; // Import the new CSS

function History() {
  const [history, setHistory] = useState([]); // Store scan history
  const navigate = useNavigate(); // Hook for navigation

  // Fetch scan history from Firestore when component mounts
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "scanHistory"));
        const scans = querySnapshot.docs.map(doc => ({
          id: doc.id, // Corrected to use Firestore doc ID
          ...doc.data(),
        }));
        setHistory(scans); // Set the fetched history to state
      } catch (error) {
        console.error("Error fetching documents: ", error);
      }
    };

    fetchHistory();
  }, []); // Empty dependency array means this runs once when the component mounts

  // Function to delete all scan history from Firestore
  const deleteAllHistory = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "scanHistory"));
      const deletePromises = querySnapshot.docs.map(docRef =>
        deleteDoc(doc(db, "scanHistory", docRef.id))
      );
      await Promise.all(deletePromises); // Wait until all deletes are done

      setHistory([]); // Clear history from the state
      alert("All history deleted successfully!");
    } catch (error) {
      console.error("Error deleting history: ", error);
      alert("Failed to delete history.");
    }
  };

  // Navigate to Scan page
  const goToScan = () => {
    navigate("/scan"); // Navigate to the Scan page
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign the user out
      alert("Logged out successfully");
      navigate("/login"); // Navigate to the login page after logout
    } catch (error) {
      console.error("Error logging out: ", error);
      alert("Failed to log out");
    }
  };

  return (
    <div className="history-container">
      <h2 className="history-title">Scan History</h2>

      <div className="table-container">
        {history.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ID Number</th>
                <th>IN Timestamp</th>
                <th>OUT Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {history.map((scan) => (
                <tr key={scan.id}>
                  <td>{scan.idNumber}</td>
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
  