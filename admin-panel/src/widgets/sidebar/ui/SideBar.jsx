import React from 'react';
import { NavLink } from 'react-router-dom';

import { siteData } from "../../../shared/config/OwnerData"
import { sidebarLinks } from "../../../shared/config/SideBarLinks"



const SideBar = () => {
    return (
        <aside className="admin-sidebar">
            <div className="admin-sidebar__header">
                <img src={siteData.img} alt={siteData.name} />
                <p>Панель керування</p>
                </div>

            <nav>



                {sidebarLinks.map((item) => (

                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) => isActive ? 'active' : ''}
                    >
                        {item.icon && (

                            <span style={{ marginRight: 17, display: 'inline-block' }}>
                                {React.createElement(item.icon)}
                            </span>

                        )}
                        {item.title}
                    </NavLink>
                ))}
            </nav>
        </aside>
    )
}

export default SideBar

