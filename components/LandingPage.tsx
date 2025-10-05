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
          <a href="main.html"><button className="font Home b1">Home</button></a>
        </div>
        <div className="Logs">
          {/* login and signup */}
          <a><button className="font b1">Anonymous</button></a>
          <a><button className="font b1">Log In</button></a>
        </div>
      </div>

      {/* Main Content */}
      <div className="MainContent">
        <div className="text">
          <h1 className="font head">Therapy, Reinvented</h1>
          <p className="font sub">Experience compassionate AI therapy with advanced voice recognition and facial expression analysis. Your mental health journey starts here.</p>
        </div>
<<<<<<< HEAD
        <img src="./assets/urban-vintage-78A265wPiO4-unsplash.jpg" />
        <Link to="/therapy" className="Jump1"><p className="button1">Start Now</p></Link>
=======

        <video className="hero-video" autoPlay muted loop playsInline>
          <source src="./assets/Screen Recording 2025-10-04 at 22.04.53.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <Link to="/chatbot">
          <button className="Jump1">
            <p className="button1">Start Your Journey</p>
          </button>
        </Link>
>>>>>>> 452486482d02d81111a1d1de5812032b536c99e4
      </div>

      {/* Second content */}
      <div className="SecondContent">
        <div className="feature1">
<<<<<<< HEAD
          <img className="imgspec" src="./assets/natalia-sobolivska-Amgsioct30s-unsplash.jpg" />
          <p>Talk instead of type, making therapy more natural and accessible.</p>
        </div>
        <div className="feature2">
          <img className="imgspec" src="./assets/anh-tuan-to-YK8BGJlfgq4-unsplash.jpg" />
          <p>Detect focus during mindfulness exercises (optional for users).</p>
        </div>
        <div className="feature3">
          <img className="imgspec" src="./assets/ennio-dybeli-KDdNjUQwzSw-unsplash.jpg" />
          <p>Extra protection for those who want it, even without signing in.</p>
=======
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
>>>>>>> 452486482d02d81111a1d1de5812032b536c99e4
        </div>
      </div>

      {/* third content */}
      <div>
        <div className="ThirdContent">
          <div className="text3">
            <h2>Your Privacy is Our Foundation</h2>
            <p className="textBot3">We believe mental health support should be accessible, private, and safe. Our platform requires no sign-in, collects no personal data, and provides professional-grade tools to support you when you need them most.</p>
          </div>
          <img className="img3" src="./assets/nofacebetter.jpg" />
        </div>
      </div>
    </>
  );
};

export default LandingPage;