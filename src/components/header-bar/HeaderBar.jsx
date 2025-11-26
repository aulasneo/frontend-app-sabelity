import React from "react";
import Button from "../common/Button";
import "./header.css";

const HeaderBar = ({ totalItems = 0, onOpenCart }) => {
  return (
    <div className="back-container">
      <div className="cart-container">
        <Button variant="outline-primary" onClick={onOpenCart} className="cart-button">
          <svg
            role="img"
            aria-label="cart"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            style={{ marginRight: '4px' }}
          >
            <title>Cart</title>
            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM7.17 14h9.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 21 5H6.21l-.94-2H2v2h2l3.6 7.59-1.35 2.44C5.52 15.37 6.48 17 8 17h12v-2H8l1.1-2z"/>
          </svg>
          {totalItems > 0 && (
            <span className="cart-badge">{totalItems}</span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default HeaderBar;
