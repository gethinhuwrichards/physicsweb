import React, { useEffect, useRef } from 'react';

export default function LandingPage({ onStart }) {
  const straplineRef = useRef(null);
  const selectLabelRef = useRef(null);
  const subjectsRef = useRef(null);
  const contentRef = useRef(null);
  const explainerRef = useRef(null);

  useEffect(() => {
    document.body.classList.add('landing-active');

    // Run animation
    const t1 = setTimeout(() => {
      straplineRef.current?.classList.add('fade-in');
      selectLabelRef.current?.classList.add('fade-in');
    }, 400);
    const t2 = setTimeout(() => subjectsRef.current?.classList.add('fade-in'), 900);
    const t3 = setTimeout(() => contentRef.current?.classList.add('slid-up'), 1800);
    const t4 = setTimeout(() => explainerRef.current?.classList.add('fade-in'), 2400);

    return () => {
      document.body.classList.remove('landing-active');
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  return (
    <section
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
      }}
    >
      <div className="landing-content" ref={contentRef}>
        <h1 className="landing-title">
          Practice <span className="landing-highlight">Papers</span>
        </h1>
        <p className="landing-strapline" ref={straplineRef}>
          Exam-style questions with instant marking and detailed mark schemes.
        </p>
        <p className="landing-select-label" ref={selectLabelRef}>Select a topic</p>
        <div className="landing-subjects" ref={subjectsRef}>
          <button className="landing-cta-btn" onClick={onStart}>
            Physics
          </button>
        </div>
        <div className="landing-features" ref={explainerRef}>
          <div className="landing-feature-card">
            <h3>Browse by Topic</h3>
            <p>Questions organised by topic and subtopic for targeted revision.</p>
          </div>
          <div className="landing-feature-card">
            <h3>Lock &amp; Mark</h3>
            <p>Lock in your answers, then mark against the official mark scheme.</p>
          </div>
          <div className="landing-feature-card">
            <h3>Track Progress</h3>
            <p>See your scores per question and track how you improve over time.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
