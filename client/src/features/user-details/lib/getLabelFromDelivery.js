import { getCities, getWarehouses } from "@shared/api/Nova-poshta";


export async function getCityNameByRef(areaRef, cityRef) {
    if (!cityRef) return "";
    try {
        const cities = await getCities(areaRef);
        const found = cities.find(item => item.Ref === cityRef);
        return found ? found.Description : cityRef;
    } catch (e) {
        return cityRef;
    }
}


export async function getWarehouseNameByRef(cityRef, warehouseRef) {
    if (!warehouseRef) return "";
    try {
        // Запрашиваем отделения (по умолчанию тип branch)
        const warehouses = await getWarehouses(cityRef, "branch");
        const found = warehouses.find(item => item.Ref === warehouseRef);
        return found ? found.Description : warehouseRef;
    } catch (e) {
        return warehouseRef;
    }
}