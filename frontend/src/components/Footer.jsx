import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer-section" id="contact">

      {/* Background image */}
      <div className="footer-wave"></div>

      <div className="footer-container">

        {/* Column 1 - Logo + Contact */}
        <div className="footer-col">
          <img src="/AyuSahayakNeo.png" className="footer-logo" alt="AyuSahayak" />

          <div className="footer-contact-item">
            <span className="footer-icon phone">📞</span>
            <div>
              <p className="footer-contact-title">Contact Us</p>
              <p className="footer-contact-text">+91 75669 75666</p>
            </div>
          </div>

          <div className="footer-contact-item">
            <span className="footer-icon mail">📧</span>
            <p className="footer-contact-text">support@ayusahayak.com</p>
          </div>

          <div className="footer-contact-item">
            <span className="footer-icon location">📍</span>
            <p className="footer-contact-text">
              Hyderabad, Telangana
            </p>
          </div>
        </div>

        {/* Column 2 */}
        <div className="footer-col">
          <h3 className="footer-title">Quick Links</h3>

          <ul className="footer-list">
            <li>About Us</li>
            <li>Services</li>
            <li>Team</li>
            <li>News</li>
            <li>Contact Us</li>
            <li>Testimonials</li>
          </ul>
        </div>

        {/* Column 3 */}
        <div className="footer-col">
          <h3 className="footer-title">Our Services</h3>

          <ul className="footer-list">
            <li>Video Consultation</li>
            <li>Hospitalization</li>
            <li>Home Care</li>
            <li>Pathology</li>
            <li>Emergency Care</li>
            <li>Nurse Support</li>
          </ul>
        </div>

        {/* Column 4 */}
        <div className="footer-col">
          <h3 className="footer-title">Other Facilities</h3>

          <ul className="footer-list">
            <li>Ambulance</li>
            <li>24/7 Support</li>
            <li>AI Symptom Detection</li>
            <li>Electronic Health Records</li>
            <li>Refund Policy</li>
            <li>Terms & Conditions</li>
          </ul>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <p>Copyright © 2025. AyuSahayak • All Rights Reserved.</p>
        <a href="#" className="footer-privacy">Privacy Policy</a>
      </div>

    </footer>
  );
}