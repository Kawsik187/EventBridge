import React from 'react';

const CategoryPill = ({ category, active, onClick }) => {
  return (
    <button
      className={`category-pill ${active ? 'active' : ''}`}
      onClick={() => onClick(category)}
    >
      {category}
    </button>
  );
};

export default CategoryPill;
