import React from 'react';

const AuthLeftSide = ({ style1 }) => {
    return (
        // Добавили style={style1} сюда 👇
        <div className='auth__logo' style={style1}>
            <div className="auth__logo-img">
                <img src={"/img/logo.svg"} alt='logo' width="300" height="300" />
            </div>
        </div>
    );
};

export default AuthLeftSide;