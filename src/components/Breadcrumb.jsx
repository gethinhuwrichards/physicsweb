import React from 'react';

export default function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb-nav">
      <div className="breadcrumb">
        {items.map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="breadcrumb-sep">&rarr;</span>}
            {item.onClick ? (
              <button className="breadcrumb-link" onClick={item.onClick}>
                {item.label}
              </button>
            ) : (
              <span className="breadcrumb-current">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
}
