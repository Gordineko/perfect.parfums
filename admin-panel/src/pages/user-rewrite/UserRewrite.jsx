import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFetchUser } from '../user-rewrite/lib/useFetchUser'; // Вкажи правильний шлях
import UserForm from '../../features/user-form/ui/UserForm'; // Вкажи правильний шлях

export default function UserRewritePage() {
    const navigate = useNavigate();
    const { id: userId } = useParams();
   
    const { user, isLoading, error, isCreateMode } = useFetchUser(userId);

    console.log(user, "user data");

    return (
        <>
            <section className="section-admin section-form">
                <div className="section-form__header">
                    <h2>{isCreateMode ? 'Додавання користувача' : 'Редагування користувача'}</h2>
                    <button onClick={() => navigate(-1)}>Повернутися</button>
                </div>

                <div className="section-form__content">
                    {isLoading && <p>Завантаження...</p>}
                    {error && <p className="error-text">{error}</p>}

                    {!isLoading && !error && (
                        <UserForm
                            type={userId}
                            initialData={user}
                            isEditMode={!isCreateMode}
                        />
                    )}
                </div>
            </section>

            <button form="user-create-form" className="product-form__submit" type="submit">
                {user ? 'Зберегти' : 'Додати'}
            </button>
        </>
    );
}