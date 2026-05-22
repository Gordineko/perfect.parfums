const DeleteBasket = () => {
  return (
    <>
      <svg
        className="delete-basket__figure delete-basket__figure--default"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 25 25"
        fill="none"
        aria-hidden
      >
        <path
          d="M12.5 0C19.4125 0 25 5.5875 25 12.5C25 19.4125 19.4125 25 12.5 25C5.5875 25 0 19.4125 0 12.5C0 5.5875 5.5875 0 12.5 0ZM18.75 6.25H15.625L14.375 5H10.625L9.375 6.25H6.25V8.75H18.75V6.25ZM8.75 20H16.25C16.5815 20 16.8995 19.8683 17.1339 19.6339C17.3683 19.3995 17.5 19.0815 17.5 18.75V10H7.5V18.75C7.5 19.0815 7.6317 19.3995 7.86612 19.6339C8.10054 19.8683 8.41848 20 8.75 20Z"
          fill="#64748B"
          fillOpacity="0.5"
        />
      </svg>
      <svg
        className="delete-basket__figure delete-basket__figure--hover"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <path
          d="M12 0C18.636 0 24 5.364 24 12C24 18.636 18.636 24 12 24C5.364 24 0 18.636 0 12C0 5.364 5.364 0 12 0ZM18 6H15L13.8 4.8H10.2L9 6H6V8.4H18V6ZM8.4 19.2H15.6C15.9183 19.2 16.2235 19.0736 16.4485 18.8485C16.6736 18.6235 16.8 18.3183 16.8 18V9.6H7.2V18C7.2 18.3183 7.32643 18.6235 7.55147 18.8485C7.77652 19.0736 8.08174 19.2 8.4 19.2Z"
          fill="#1A1A1A"
        />
      </svg>
    </>
  );
};

export default DeleteBasket;
