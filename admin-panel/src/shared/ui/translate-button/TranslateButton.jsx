import React from 'react';
import './TranslateButton.scss';

const TranslateButton = ({ onClick, isLoading, label = 'Перекласти UA → EN' }) => (
  <button
    type="button"
    className={`btn-translate${isLoading ? ' btn-translate--loading' : ''}`}
    onClick={onClick}
    disabled={isLoading}
  >
    <span className="btn-translate__icon">🌐</span>
    <span className="btn-translate__text">
      {isLoading ? 'Перекладаємо...' : label}
    </span>
  </button>
);

export default TranslateButton;
