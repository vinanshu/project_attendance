import { createUserWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { auth, db } from "../config/firebase";
import { setDoc, doc, getDocs, collection, query, where } from "firebase/firestore";
import { toast } from "react-toastify";
import QRCode from "qrcode";  // Import the qrcode library
import "../styles/register.css";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [IDnumber, setIDnumber] = useState("");
  const [course, setCourse] = useState(""); 
  const [year, setYear] = useState("");      
  const [section, setSection] = useState(""); 
  const [error, setError] = useState(""); 

  const handleRegister = async (e) => {
    e.preventDefault();

    if (IDnumber.length !== 10) {
      setError("ID number must be exactly 10 characters.");
      return; 
    } else {
      setError(""); 
    }

    const usersRef = collection(db, "Users");
    const q = query(usersRef, where("ID", "==", IDnumber));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      setError("This ID number is already taken.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      const user = auth.currentUser;
      
      if (user) {
        // Generate QR code data
        const qrCodeData = `ID: ${IDnumber} - User: ${fname} ${lname} - Email: ${email} Year: ${year} Course: ${course} Section: ${section}`;

        // Generate the QR code as a data URL
        QRCode.toDataURL(qrCodeData, async (err, qrCodeUrl) => {
          if (err) {
            toast.error("Error generating QR code.", {
              position: "bottom-center",
            });
            return;
          }

          // Save user data and QR code URL to Firestore
          await setDoc(doc(db, "Users", user.uid), {
            email: user.email,
            firstName: fname,
            lastName: lname,
            ID: IDnumber,
            course: course,
            year: year,
            section: section,
            password: password,
            qrCode: qrCodeUrl,  // Store the QR code URL in Firestore
          });

          // Success message
          toast.success("User Registered Successfully!!", {
            position: "top-center",
          });
        });
      }
    } catch (error) {
      console.log(error.message);
      toast.error(error.message, {
        position: "bottom-center",
      });
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <h3>Sign Up</h3>
      {/* Form fields for registration */}
      <div className="mb-3">
        <label>First name</label>
        <input
          type="text"
          className="form-control"
          placeholder="First name"
          value={fname}
          onChange={(e) => setFname(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label>Last name</label>
        <input
          type="text"
          className="form-control"
          placeholder="Last name"
          value={lname}
          onChange={(e) => setLname(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label>Email address</label>
        <input
          type="email"
          className="form-control"
          placeholder="Enter email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label>ID number</label>
        <input
          type="text"
          className="form-control"
          placeholder="Enter ID number"
          value={IDnumber}
          onChange={(e) => setIDnumber(e.target.value)}
          maxLength={10}
          pattern="^[0-9]{10}$"
          required
        />
        
        <div className="mb-3">
        <label>Password</label>
        <input
          type="password"
          className="form-control"
          placeholder="Enter password"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
        {error && <div className="text-danger">{error}</div>}
      </div>
      {/* Other form fields */}
      <div className="mb-3">
        <label>Course</label>
        <select
          className="form-control"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          required
        >
          <option value="">Select Course</option>
          <option value="IT">IT</option>
          <option value="TCM">TCM</option>
          <option value="EMT">EMT</option>
        </select>
      </div>
      {/* Year and section selection */}
      <div className="mb-3">
        <label>Year</label>
        <select
          className="form-control"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          required
        >
          <option value="">Select Year</option>
          <option value="1st">1ST</option>
          <option value="2nd">2ND</option>
          <option value="3rd">3RD</option>
          <option value="4th">4TH</option>
        </select>
        
      </div>
      <div className="mb-3">
        <label>Section</label>
        <select
          className="form-control"
          value={section}
          onChange={(e) => setSection(e.target.value)}
          required
        >
          <option value="">Select Section</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
          <option value="E">E</option>
          <option value="F">F</option>
          <option value="G">G</option>
        </select>
      </div>
      
      <div className="d-grid">
        <button type="submit" className="btn btn-primary">
          Sign Up
        </button>
      </div>
      <p className="forgot-password text-right">
        Already registered <a href="/login">Login</a>
      </p>
    </form>
  );
}

export default Register;
