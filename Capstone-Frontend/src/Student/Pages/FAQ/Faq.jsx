import React, { useState } from 'react';
import './faq.css';
import StudentSidebar from '../../Components/Sidebar';
import Logout from '../../Components/Logout';
import NotificationBox from '../../Components/NotificationBox';

const faqs = [
  {
    question: "What if I select courses that exceed the credit limit or clash with my schedule?",
    answer: "The system automatically checks credit caps (≤ 30 credits) and timetable clashes before submission."
  },
  {
    question: "Do I still need to get physical signatures from coordinators or HODs?",
    answer: "No. The portal offers a fully integrated digital approval workflow. Once you submit your application, it is automatically routed electronically to your respective Coordinators, HODs, and finally the DoAA. You can track the real-time status of these approvals from the \"Status\" tab in the sidebar."
  },
  {
    question: "Can I access the portal on mobile devices?",
    answer: "Yes, the portal is responsive and mobile-friendly. A dedicated mobile app/PWA is planned as a future enhancement."
  },
  {
    question: "Is there a way to get quick help inside the portal?",
    answer: "Yes. An AI-powered chatbot (coming soon) will answer common queries instantly. Until then, FAQs and help guides are available."
  },
  {
    question: "What documents do I need to upload with my application?",
    answer: "Typically, you will need to upload the improvement course fee receipt and any special approvals (like IEP approval for final-year students). Required documents are listed during the application process."
  }
];

const Faq = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => setOpenIndex(openIndex === index ? null : index);

  return (
    <div className="faq-page">
      <StudentSidebar />
      <Logout />

      <div className="faq-main">

        {/* Header */}
        <p className="faq-eyebrow">Scholar Assistance</p>
        <h1 className="faq-title">FAQ &amp; Help</h1>
        <p className="faq-subtitle">
          Welcome to the central knowledge base for the Improvement Course Portal.
          Find answers to common administrative questions and workflow procedures.
        </p>

        {/* Accordion */}
        <div className="faq-list">
          {faqs.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}
                onClick={() => toggle(index)}
              >
                <div className="faq-item__header">
                  <span className="faq-item__question">{item.question}</span>
                  <span className="faq-item__icon">{isOpen ? '×' : '+'}</span>
                </div>
                {isOpen && (
                  <p className="faq-item__answer">{item.answer}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact banner */}
        <div className="faq-banner">
          <span className="faq-banner__icon">?</span>
          <h3 className="faq-banner__heading">Need direct assistance?</h3>
          <p className="faq-banner__sub">
            If you cannot find your answer here, our academic coordinators are ready to help.
          </p>
          <button className="faq-banner__btn">Contact Support</button>
        </div>

      </div>

    </div>
  );
};

export default Faq;