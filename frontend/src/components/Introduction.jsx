import { useState } from "react";
import "./Introduction.css";

export default function Introduction() {

  const [openModal, setOpenModal] = useState(false);

  return (
    <section className="intro-section" id="about">

      {/* Top Center Heading */}
      <div className="intro-top">
        <h2 className="intro-main-title">Introduction</h2>
        <p className="intro-sub">
          AyuSahayak brings structured and accessible healthcare support to villages by 
          connecting trained nurses, trusted hospitals, and patients through a smart digital platform.
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="intro-container">

        {/* Left — Video */}
        <div className="intro-left">
          <div className="intro-video-box">
            <video
              className="intro-video"
              src="/AyuSahayakVideo.mp4"
              autoPlay
              loop
              controls
              playsInline
            ></video>
          </div>
        </div>

        {/* Right — Text */}
        <div className="intro-right">
          <h2 className="intro-title">
            Your <span>Healthcare</span> Companion
          </h2>

          <p className="intro-description">
            AyuSahayak ensures that trained nurses from villages can connect patients 
            to qualified hospital doctors for high-quality treatment. Whether it’s 
            primary care, digital consultations, or emergency assistance, we make 
            healthcare simple, reliable, and reachable.
          </p>

          <button 
            className="intro-btn"
            onClick={() => setOpenModal(true)}
          >
            Read More
          </button>
        </div>

      </div>

      {/* ✅ About Us Popup Modal */}
      {openModal && (
        <div className="intro-modal-overlay">
          <div className="intro-modal">

            {/* Close Button */}
            <button 
              className="modal-close-btn" 
              onClick={() => setOpenModal(false)}
            >
              ✕
            </button>

            <h2 className="modal-title">About Us</h2>

            <div className="modal-content">

              <p><strong>Mission:</strong> To ensure that every rural citizen of India has access to high-quality doctors and medical services at their convenience and at affordable prices.</p>

              <p><strong>Vision:</strong> To be the nearest, most affordable, and reliable digital healthcare destination for rural India.</p>

              <br />

              <h3>📌 Our Healthcare Modules</h3>
              <p>
                AyuSahayak uses <strong>three specialized medical modules</strong> powered by AI and trained nurses:
              </p>

              <ul>
                <li><strong>1. Skin Disease Module</strong> — Nurses upload skin images and symptoms; AI assists doctors by analyzing patterns to support diagnosis.</li>
                <li><strong>2. Wound Analysis Module</strong> — AI evaluates wound depth, type, and severity to help the doctor choose accurate treatment.</li>
                <li><strong>3. Rural AI Symptom Detection</strong> — Patients’ symptoms are analyzed to predict possible diseases and suggest supporting medications.</li>
              </ul>

              <br />

              <h3>📌 What Makes AyuSahayak Unique?</h3>
              <ul>
                <li>Bridges hospitals and rural villages through digital healthcare.</li>
                <li>Provides 24/7 nurse support and doctor availability.</li>
                <li>AI-powered modules enhance the accuracy and speed of diagnosis.</li>
                <li>Complete workflow: registration → payment → consultation → prescription → follow-up.</li>
                <li>Cloud-based storage ensures lifetime medical record preservation.</li>
              </ul>

              <br />

              <h3>⚙ Our Technology</h3>
              <p>
                Built using modern technologies such as <strong>React.js</strong> (frontend), 
                <strong>Node.js</strong> (backend), <strong>MongoDB</strong> (database), 
                <strong>Cloudinary</strong> (image storage), <strong>Razorpay</strong> (payments),
                and real-time <strong>video + chat</strong> for consultations.
              </p>

              <br />

              <h3>🏥 Our Purpose</h3>
              <p>
                AyuSahayak aims to eliminate the healthcare gap between rural and urban India.  
                By empowering nurses, supporting doctors, and simplifying healthcare access,  
                we ensure no patient is left behind due to lack of medical reach.
              </p>

              <br /><br />

            </div>

          </div>
        </div>
      )}

    </section>
  );
}