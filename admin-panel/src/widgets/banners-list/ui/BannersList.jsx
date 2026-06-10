import CatalogPagination from '../../../features/pagination'
import ProductItem from '../../../entities/product/ui/ProductItem'
import React from 'react'
import CategoryItem from '../../../entities/category/ui/CategoryItem'
import BlogItem from '../../../entities/blog/ui/BlogItem'
import BannerItem from '../../../entities/banner/ui/BannerItem'

const BannersList = ({ data, }) => {
    console.log(data.items)
    return (
        <div className='admin-list'>
            <div className="admin-list__header">
                <p className="admin-list__header-info">{data?.items?.length || "Данні відсутні"} Банерів</p>
                <div className="admin-list__header-func">
                    <button> на сторінці</button>
                    <button>Експорт CSV</button>
                </div>
            </div>
            <div className="admin-list__content">
                <ul className="admin-list__content-titles blogs-grid">
                    <p>Заголовок</p>
                    <p>Заголовок (англ)</p>
                    <p>Видимість</p>
                    <p>Дія</p>

                </ul>
                <ul className="admin-list__content-items">
                    {data?.items?.map((banner) => (
                        <BannerItem
                            key={banner.groupId}
                            banner={banner}
                        // onDeleteClick={onDeleteClick} 
                        />
                    ))}
                </ul>
            </div>
            <div className="admin-list__pagination">
                {/* <CatalogPagination data={data.meta} /> */}
            </div>
        </div>
    )
}

export default BannersList
