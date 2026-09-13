"use client";

import React, { forwardRef } from "react";

const PrintableBill = forwardRef<HTMLDivElement, any>(({ billData }, ref) => {
  if (!billData) return null;

  return (
    <div ref={ref}>
      <h2>Gairigaon Hill Top Resort</h2>
      <p>Guest: {billData?.booking?.guestName}</p>
      <p>Total: ₹{billData?.grandTotal}</p>
    </div>
  );
});

PrintableBill.displayName = "PrintableBill";
export default PrintableBill;
