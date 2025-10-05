import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <>
      {/* Moving Banner */}
      <div className="marquee-banner">
        <ul>
          <li>You're not alone</li>
          <li>One day at a time</li>
          <li>Be gentle with yourself. You're doing the best you can</li>
          <li>Self-care is not selfish; it's how you take your power back.</li>
          <li>Sometimes the bravest thing you can do is ask for help</li>
        </ul>
      </div>

      {/* Navigation Bar */}
      <div className="Nav">
        <div>
          <Link to="/"><button className="font Home b1">Home</button></Link>
        </div>
        <div className="Logs">
          {/* login and signup */}
          <button className="font b1">Anonymous</button>
          <button className="font b1">Log In</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="MainContent">
        <div className="text">
          <h1 className="font head">Therapy, Reinvented</h1>
          <p className="font sub">Experience compassionate AI therapy with advanced voice recognition and facial expression analysis. Your mental health journey starts here.</p>
        </div>

        <video className="hero-video" autoPlay muted loop playsInline>
          <source src="./assets/Screen Recording 2025-10-04 at 22.04.53.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <Link to="/chatbot">
          <button className="Jump1">
            <p className="button1">Start Your Journey</p>
          </button>
        </Link>
      </div>

      {/* Second content */}
      <div className="SecondContent">
        <div className="feature1">
          <img className="imgspec" src="./assets/natalia-sobolivska-Amgsioct30s-unsplash.jpg" alt="Voice therapy" />
          <p>Natural voice interaction makes therapy more accessible and comfortable for everyone.</p>
        </div>
        <div className="feature2">
          <img className="imgspec" src="./assets/anh-tuan-to-YK8BGJlfgq4-unsplash.jpg" alt="Focus detection" />
          <p>Advanced facial expression analysis provides deeper insights into your emotional state.</p>
        </div>
        <div className="feature3">
          <img className="imgspec" src="./assets/ennio-dybeli-KDdNjUQwzSw-unsplash.jpg" alt="Privacy protection" />
          <p>Complete privacy protection with end-to-end encryption and anonymous access.</p>
        </div>
      </div>

      {/* third content */}
      <div>
        <div className="ThirdContent">
          <div className="text3">
            <h2>Your Privacy is Our Foundation</h2>
            <p className="textBot3">We believe mental health support should be accessible, private, and safe. Our platform requires no sign-in, collects no personal data, and provides professional-grade tools to support you when you need them most.</p>
          </div>
          <img className="img3" src="./assets/nofacebetter.jpg" alt="Privacy illustration" />
        </div>
      </div>

      {/* Footer */}
      <footer>
        <div className="footer-col">
          <p>Our GitHub</p>
          <p className="fab fa-github"></p>
          <a href="https://github.com/Rubber-Duck-Productions" target="_blank" rel="noopener noreferrer">Rubber Duck Productions</a>
        </div>
        <div className="footer-col">
          <p>Our Story</p>
          <a href="AboutUs.html">Learn More</a>
        </div>
        <div className="footer-col">
          <p>Home</p>
          <Link to="/">Return Home</Link>
        </div>
        <div className="footer-col">
          <p>Chatbot</p>
          <Link to="/chatbot">Try Now</Link>
        </div>
        <div className="footer-bottom">
          <p><i className="far fa-copyright"></i> 2025 Rubber Duck Productions. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
};

export default LandingPage;