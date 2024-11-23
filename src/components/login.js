import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { auth, db } from "../config/firebase"; // Import Firestore and Auth
import { doc, getDoc } from "firebase/firestore"; // Firestore methods
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import Logo from "../logo/logo.png"; // Import the admin image

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // To show loading state
  const [adminModalVisible, setAdminModalVisible] = useState(false); // Admin modal visibility state
  const [adminCode, setAdminCode] = useState(""); // Admin code input
  const [adminPassword, setAdminPassword] = useState(""); // Admin password input
  const navigate = useNavigate(); // useNavigate hook for navigation

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both email and password", {
        position: "bottom-center",
      });
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("User logged in Successfully");
      toast.success("User logged in Successfully", {
        position: "top-center",
      });
      navigate("/profile");
    } catch (error) {
      console.log(error.message);
      toast.error(error.message, {
        position: "bottom-center",
      });
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  const handleAdminClick = () => {
    setAdminModalVisible(true); // Show admin modal on button click
  };

  const handleAdminSubmit = async () => {
    try {
      // Fetch admin credentials from Firestore
      const docRef = doc(db, "adminCredentials", "adminAccess"); // Replace with your document ID
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const { code, password } = docSnap.data(); // Destructure Firestore data
        if (adminCode === code && adminPassword === password) {
          localStorage.setItem("adminVerified", true); // Store admin verification
          toast.success("Admin Access Granted", {
            position: "top-center",
          });
          navigate("/scan"); // Redirect to scan.js on success
        } else {
          toast.error("Invalid Admin Code or Password", {
            position: "bottom-center",
          });
        }
      } else {
        toast.error("Admin credentials not found", {
          position: "bottom-center",
        });
      }
    } catch (error) {
      console.error("Error fetching admin credentials: ", error);
      toast.error("Failed to verify admin credentials. Please try again.", {
        position: "bottom-center",
      });
    } finally {
      setAdminModalVisible(false); // Hide modal after validation
    }
  };

  return (
    <div className="back">
      <div className="login-container">
        <form onSubmit={handleSubmit}>
          <h3>Login</h3>

          <div className="mb-3">
            <label>Email address</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="d-grid">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Logging in..." : "Submit"}
            </button>
          </div>
          <p className="forgot-password text-right">
            New user <a href="/register">Register Here</a>
          </p>
        </form>

        {/* Admin Button */}
        <button className="admin-button" onClick={handleAdminClick}>
          <img src={Logo} alt="Admin" className="admin-logo" />
        </button>

        {/* Admin Modal */}
        {adminModalVisible && (
          <div className="admin-modal">
            <div className="admin-modal-content">
              <h4>Enter Admin Code</h4>
              <input
                type="text"
                placeholder="Admin Code"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
              />
              <input
                type="password"
                placeholder="Admin Password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
              <div className="admin-modal-actions">
                <button onClick={handleAdminSubmit}>Submit</button>
                <button
                  onClick={() => setAdminModalVisible(false)}
                  className="cancel"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
