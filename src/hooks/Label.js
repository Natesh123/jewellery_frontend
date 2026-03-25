import React, { useRef } from "react";
import QRCode from "qrcode.react";
import { useReactToPrint } from "react-to-print";

export default function Label({ qrValue,product, netQty, grossWt, amount }) {
  const labelRef = useRef();
  const handlePrint = useReactToPrint({ content: () => labelRef.current });

  return (
    <div>
      <div
        ref={labelRef}
        style={{
          width: "13cm",
          height: "1.5cm",
          display: "flex",
          alignItems: "center",
          border: "1px solid black",
          padding: "5px",
        }}
      >
        <QRCode value={`${qrValue}`} size={50} />
        <div style={{ marginLeft: "10px", fontSize: "10px" }}>
          <div>Product: {product}</div>
          <div>Net Qty: {netQty}</div>
          <div>Gross Wt: {grossWt}</div>
          <div>Amount: ₹{amount}</div>
        </div>
      </div>
      <button onClick={handlePrint}>Print Label</button>
    </div>
  );
}
