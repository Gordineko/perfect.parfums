import React from 'react';
import { useModals } from '../../../../app/context/modals-context';

const ModalConfirm = ({ onConfirm, title = "Підтвердіть дію" }) => {
    const { isModalOpen, setIsModalOpen } = useModals();
   
    if (isModalOpen !== 'confirm') {
        return null;
    }
   
    const handleAccept = () => {
        if (onConfirm) {
            onConfirm(); 
        }
        setIsModalOpen(null); 
    };

    return (
        <>
            <div
                className="overlay"
                onClick={() => setIsModalOpen(null)}
               
            />
            <div className='confirm-modal'>
                <h1 className="confirm-modal__title">{title}</h1>
              
                <div className="confirm-modal__buttons">
                    <button type="button" onClick={handleAccept} className="confirm-modal__btn confirm-modal__btn-accept">
                        Прийняти
                    </button>
                    <button type="button" onClick={() => setIsModalOpen(null)} className="confirm-modal__btn confirm-modal__btn-reject">
                        Відхилити
                    </button>
                </div>
            </div>
        </>
    );
}

export default ModalConfirm;