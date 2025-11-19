import { useRef, useState, useEffect } from "react";
import "./ServicesSection.css";

export default function ServicesSection() {

  const CARD_WIDTH = 350;
  const scrollRef = useRef(null);

  const originalCards = [
    { title: "Video Consultation", img: "/consultation.jpg", desc: "India’s best doctors across various specialties provide video consultation at affordable prices on the AyuSahayak platform." },
    { title: "Hospitalization", img: "/hospital.jpg", desc: "We help patients get admitted to the nearest licensed hospital and assist through all the formalities of the process." },
    { title: "Pathology", img: "/pathology.jpg", desc: "Samples are collected from centers and tested at partnered labs. No need for patients to deliver samples." },
    { title: "Ambulance", img: "/ambulance.jpg", desc: "Emergency and non-emergency ambulances are available for safe and quick patient transport." }
  ];

  // DUPLICATE LIST FOR INFINITE LOOP
  const cards = [...originalCards, ...originalCards];

  const [index, setIndex] = useState(originalCards.length);

  useEffect(() => {
    scrollRef.current.scrollLeft = index * CARD_WIDTH;
  }, [index]);

  const smoothScrollTo = (newIndex) => {
    scrollRef.current.style.scrollBehavior = "smooth";
    setIndex(newIndex);

    setTimeout(() => {
      scrollRef.current.style.scrollBehavior = "auto";

      // infinite loop reset
      if (newIndex >= originalCards.length * 2 - 1) {
        setIndex(originalCards.length - 1);
      }
      if (newIndex <= 0) {
        setIndex(originalCards.length);
      }
    }, 350);
  };

  const scrollRight = () => smoothScrollTo(index + 1);
  const scrollLeft = () => smoothScrollTo(index - 1);

  return (
    <section className="services-section">
      <div className="services-top">
        <h2 className="services-title">Our Services</h2>
        <p className="services-sub">
          AyuSahayak provides a complete set of healthcare support services for rural communities.
        </p>
      </div>

      <div className="slider-wrapper">

        <button className="arrow-btn left" onClick={scrollLeft}>❮</button>

        <div className="services-row" ref={scrollRef}>
          {cards.map((item, i) => (
            <div className="service-card" key={i}>
              <div className="service-img-box">
                <img src={item.img} alt={item.title} />
              </div>

              <div className="service-bottom">
                <h3 className="service-name">{item.title}</h3>
                <p className="service-desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button className="arrow-btn right" onClick={scrollRight}>❯</button>

      </div>
    </section>
  );
}
