const ReviewCounter = ({ review = 0 }) => {
  return (
    <div className="review-counter">
      <span className="review-counter__value">
        {review || 0}
      </span>
    </div>
  );
};

export default ReviewCounter;
