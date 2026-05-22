import React from "react";

import styles from "./WriteReviewModal.module.scss";

const SubmitReviewButton = () => {
  return (
    <button type="submit" className={styles.submitButton}>
      <p>Залишити відгук</p>
    </button>
  );
};

export default SubmitReviewButton;
