import Navbar from "../../components/Navbar";
import HeroSlider from "../../components/HeroSlider";
import Introduction from "../../components/Introduction";
import JourneySection from "../../components/JourneySection";
import ServicesSection from "../../components/ServicesSection";
import AffordableSection from "../../components/AffordableSection";
import Footer from "../../components/Footer";
import "./Home.css";

export default function Home() {
  return (
    <div className="home-page">
      <Navbar />
      <HeroSlider />
      <Introduction />
      <JourneySection />
      <ServicesSection />
      <AffordableSection />
      <Footer />
    </div>
  );
}