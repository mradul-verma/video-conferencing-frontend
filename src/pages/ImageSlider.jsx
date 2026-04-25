import React, { useState, useEffect, useCallback } from "react";
import "./ImageSlider.css";

const images = [
  "/image1.jpg",
  "/image2.jpg",
  "/image3.jpg",
  "/image4.jpg",
  "/image5.jpg",
];

const SLIDE_INTERVAL = 3000;

const ImageSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalImages = images.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalImages);
  }, [totalImages]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? totalImages - 1 : prevIndex - 1
    );
  }, [totalImages]);

  useEffect(() => {
    const timer = setTimeout(nextSlide, SLIDE_INTERVAL);
    return () => clearTimeout(timer);
  }, [currentIndex, nextSlide]);

  return (
    <div className="slider-container">
      <h2>Image Carousel</h2>
      <div className="carousel-wrapper">
        <button className="nav-button left" onClick={prevSlide} aria-label="Previous Slide">
          &#10094;
        </button>
        <img
          src={images[currentIndex]}
          alt={`Slide ${currentIndex + 1}`}
          className="slider-image"
        />
        <button className="nav-button right" onClick={nextSlide} aria-label="Next Slide">
          &#10095;
        </button>
      </div>
      <div className="indicator-wrapper">
        {images.map((_, idx) => (
          <span
            key={idx}
            className={`indicator-dot ${idx === currentIndex ? "active" : ""}`}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageSlider;
