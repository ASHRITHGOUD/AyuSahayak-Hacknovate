import "./AffordableSection.css";

export default function AffordableSection() {
  return (
    <section className="affordable-section">

      {/* Full Background */}
      <img src="/affordable.jpg" className="affordable-bg" alt="" />

      {/* TEXT CONTENT */}
      <div className="affordable-text">
        <h2 className="affordable-title">
          Affordable and Reliable <br /> Healthcare Solutions
        </h2>

        <p className="affordable-para">
          At AyuSahayak, we understand the importance of affordability and
          reliability in healthcare. That’s why we offer cost-effective
          solutions without compromising on quality, ensuring that patients in
          rural areas can access the care they need without financial strain.
        </p>
      </div>

    </section>
  );
}