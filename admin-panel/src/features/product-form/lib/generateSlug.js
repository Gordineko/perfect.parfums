

export const generateSlug = (text) => {
    if (!text) return '';
    
    const cyrillicToLatinMap = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ie', 
        'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'i', 'й': 'i', 'к': 'k', 'л': 'l', 
        'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 
        'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', 
        'ю': 'iu', 'я': 'ia', ' ': '-'
    };

    return text
        .toLowerCase()
        .split('')
        .map(char => cyrillicToLatinMap[char] !== undefined ? cyrillicToLatinMap[char] : char)
        .join('')
        .replace(/[^a-z0-9\-]/g, '') // Видаляємо всі спецсимволи, залишаємо букви, цифри та дефіс
        .replace(/-+/g, '-')         // Замінюємо кілька дефісів підряд на один
        .replace(/^-|-$/g, '');      // Прибираємо дефіси на початку та в кінці
};