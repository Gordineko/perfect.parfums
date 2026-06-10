import CatalogPagination from '../../../features/pagination'
import React from 'react'
import ContentItem from '../../../entities/content/ui/ContentItem'
import { ContentsList } from '../config/ContentData'

const ContentList = ({ data,  }) => {
    console.log(data)
    return (
        <div className='admin-list'>
            <div className="admin-list__header">
                <p className="admin-list__header-info">Керування контентом</p>
                
            </div>
            <div className="admin-list__content">
                {/* <ul className="admin-list__content-titles orders-grid">
                    <p>Замовлення</p>
                    <p>Час</p>
                    <p>Сума</p>
                    <p>Товари</p>
                    <p>Покупець</p>
                    <p>Доставка та оплата</p>
                    <p>Статус</p>
                    <p>Дія</p>
                    
                </ul> */}
                <ul className="admin-list__content-items content-grid">
                    {ContentsList?.map((data) => (
                        <ContentItem
                            key={data.id}
                            content={data}
                            // onDeleteClick={onDeleteClick} 
                        />
                    ))}
                </ul>
            </div>
           
        </div>
    )
}

export default ContentList
