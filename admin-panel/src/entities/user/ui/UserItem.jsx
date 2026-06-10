import React from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteUserClick } from '../lib/userClick'; // Імпортуємо логіку

const UserItem = ({ user, onRefresh }) => {
  const navigate = useNavigate();

  // Логіка відображення імені (без змін)
  const title = user?.name || (user?.firstName || user?.lastName 
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() 
    : "Ім'я Прізвище");

  const phone = user?.phone || "Телефон";
  const share = user?.share || "0%";
  const email = user?.email || "Емаіл";
  const ordersCount = user?.orders?.length || 0;

  const totalPrice = user?.orders?.reduce((sum, order) => {
    return sum + Number(order.total || 0);
  }, 0) || 0;

  const turnoverDisplay = new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(totalPrice);

  const formatDate = (dateString) => {
    if (!dateString) return "00:00 00.00.2026";
    const date = new Date(dateString);
    return date.toLocaleString('uk-UA', {
      hour: '2-digit', minute: '2-digit',
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  };

  const dateDisplay = formatDate(user?.createdAt);

  return (
    <div className="user-item clients-grid">
      <div className="user-item__data">
        <div className="user-item__data-name">
          <p>{title}</p>
        </div>
        <div className="user-item__data-info">
          <span>{phone} • </span>
          <span>{email}</span>
        </div>
      </div>

      <div className="user-item__txt"><p>{share}</p></div>
      <div className="user-item__txt"><p>{ordersCount}</p></div>
      <div className="user-item__txt"><p>{turnoverDisplay} грн</p></div>
      <div className="user-item__txt"><p>{dateDisplay}</p></div>

      <div className="user-item__func">
        <button
          type="button"
          className="btn-edit" 
          onClick={() => navigate(`/users-rewrite/${user._id}`)}
        >
          Редагувати
        </button>

        <button
          type="button"
          className="btn-delete"
          onClick={() => deleteUserClick(user._id, onRefresh)} // ВИКЛИК ВИДАЛЕННЯ
        >
          Видалити
        </button>
      </div>
    </div>
  );
};

export default UserItem;