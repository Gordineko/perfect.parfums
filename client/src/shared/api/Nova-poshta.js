const apiKey = "6ac96c751e3eb13a5d552f8f50248575";
const BASE_URL = "https://api.novaposhta.ua/v2.0/json/";

const request = async (modelName, calledMethod, methodProperties = {}) => {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey,
      modelName,
      calledMethod,
      methodProperties,
    }),
  });

  const data = await response.json();
  if (data.success) {
    return data.data || [];
  } else {
    throw new Error(data.errors?.join(", ") || "API error");
  }
};

export const getAreas = () => request("Address", "getAreas");

export const getCities = (areaRef) =>
  request("Address", "getCities", { AreaRef: areaRef });

export const getWarehouses = (cityRef, type) => {
  const methodProperties = { CityRef: cityRef };

  if (type === "postomat") {
    methodProperties.TypeOfWarehouseRef =
      "f9316480-5f2d-425d-bc2c-ac7cd29decf0";
  }

  return request("Address", "getWarehouses", methodProperties);
};
