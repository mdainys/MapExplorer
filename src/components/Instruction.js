import React from "react";

const Instruction = ({ instruction }) => {
  return (
    <div style={{ margin: "10px 0", fontSize: "16px" }}>
      <strong>Step:</strong> {instruction}
    </div>
  );
};

export default Instruction;
