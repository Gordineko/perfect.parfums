import { Arrow, useModals } from "@shared";

const WriteReviewButton = () => {
  const { setIsModalOpen } = useModals();

  const handleClick = () => {
    setIsModalOpen("write-review");
  };

  return (
    <button
      className="write-review-button"
      type="button"
      onClick={handleClick}
    >
      <p>Написати відгук</p>

      <Arrow />
    </button>
  );
};

export default WriteReviewButton;
