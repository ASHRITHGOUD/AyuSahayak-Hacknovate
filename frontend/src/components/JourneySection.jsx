import "./JourneySection.css";

export default function JourneySection() {
  return (
    <section className="journey-section">

      <div className="journey-container">

        {/* LEFT — Image */}
        <div className="journey-image-box">
          <img 
            src="/journey-Ayu.png" 
            alt="Journey to AyuSahayak"
            className="journey-image"
          />
        </div>

        {/* RIGHT — Text */}
        <div className="journey-text-box">
          <h2 className="journey-title">
            Journey to <span>AyuSahayak</span>
          </h2>

          <p className="journey-desc">
            AyuSahayak is designed to make healthcare delivery smoother, more reliable,
            and accessible for villages. Our platform connects trained nurses with 
            hospital doctors to ensure accurate diagnosis, timely support, and faster care.
          </p>

          <p className="journey-desc">
            This journey ensures that patients in rural regions get the same quality of 
            medical attention as urban areas — with structured communication and digital support.
          </p>

        </div>

      </div>

    </section>
  );
}