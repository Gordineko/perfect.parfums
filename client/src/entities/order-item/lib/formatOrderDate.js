export const formatOrderDate = (isoString, locale = 'uk', location) => {
    console.log(locale)
    // 1. Проверка на существование данных
    if (!isoString) return "";

    const date = new Date(isoString);

    // 2. Проверка на валидность даты (Invalid Date)
    if (isNaN(date.getTime())) {
        console.error("Invalid date provided to formatOrderDate:", isoString);
        return "";
    }

    const dateOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    };

    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    };

    try {
        const lang = locale === 'ua' ? 'uk-UA' : 'en-GB';
        const formattedDate = new Intl.DateTimeFormat(lang, dateOptions).format(date);
        const formattedTime = new Intl.DateTimeFormat(lang, timeOptions).format(date);
        if (location === 'blogs') {
            if (locale === 'ua') {
              
                return `${formattedDate.replace(/\s?р\.?$/, '')}`;
            } else {
                return `${formattedDate}`;
            }
        } else {
            if (locale === 'ua') {
              
                return `Оформлено ${formattedDate.replace(/\s?р\.?$/, '')} • ${formattedTime}`;
            } else {
                return `Ordered on ${formattedDate} • ${formattedTime}`;
            }
        }

    } catch (e) {
        console.error("Formatting error:", e);
        return "";
    }
};
