const COUNTRY_DATA = {
    "EU": { "fa": "اتحادیه اروپا", "en": "European Union" },
    "AF": { "fa": "افغانستان", "en": "Afghanistan" },
    "AL": { "fa": "آلبانی", "en": "Albania" },
    "DZ": { "fa": "الجزایر", "en": "Algeria" },
    "AD": { "fa": "آندورا", "en": "Andorra" },
    "AO": { "fa": "آنگولا", "en": "Angola" },
    "AR": { "fa": "آرژانتین", "en": "Argentina" },
    "AM": { "fa": "ارمنستان", "en": "Armenia" },
    "AU": { "fa": "استرالیا", "en": "Australia" },
    "AT": { "fa": "اتریش", "en": "Austria" },
    "AZ": { "fa": "آذربایجان", "en": "Azerbaijan" },
    "BH": { "fa": "بحرین", "en": "Bahrain" },
    "BD": { "fa": "بنگلادش", "en": "Bangladesh" },
    "BY": { "fa": "بلاروس", "en": "Belarus" },
    "BE": { "fa": "بلژیک", "en": "Belgium" },
    "BR": { "fa": "برزیل", "en": "Brazil" },
    "BG": { "fa": "بلغارستان", "en": "Bulgaria" },
    "CA": { "fa": "کانادا", "en": "Canada" },
    "CL": { "fa": "شیلی", "en": "Chile" },
    "CN": { "fa": "چین", "en": "China" },
    "CO": { "fa": "کلمبیا", "en": "Colombia" },
    "HR": { "fa": "کرواسی", "en": "Croatia" },
    "CY": { "fa": "قبرس", "en": "Cyprus" },
    "CZ": { "fa": "چک", "en": "Czechia" },
    "DK": { "fa": "دانمارک", "en": "Denmark" },
    "EG": { "fa": "مصر", "en": "Egypt" },
    "EE": { "fa": "استونی", "en": "Estonia" },
    "FI": { "fa": "فنلاند", "en": "Finland" },
    "FR": { "fa": "فرانسه", "en": "France" },
    "GE": { "fa": "گرجستان", "en": "Georgia" },
    "DE": { "fa": "آلمان", "en": "Germany" },
    "GR": { "fa": "یونان", "en": "Greece" },
    "HK": { "fa": "هنگ کنگ", "en": "Hong Kong" },
    "HU": { "fa": "مجارستان", "en": "Hungary" },
    "IS": { "fa": "ایسلند", "en": "Iceland" },
    "IN": { "fa": "هند", "en": "India" },
    "ID": { "fa": "اندونزی", "en": "Indonesia" },
    "IR": { "fa": "ایران", "en": "Iran" },
    "IQ": { "fa": "عراق", "en": "Iraq" },
    "IE": { "fa": "ایرلند", "en": "Ireland" },
    "IL": { "fa": "اسرائیل", "en": "Israel" },
    "IT": { "fa": "ایتالیا", "en": "Italy" },
    "JP": { "fa": "ژاپن", "en": "Japan" },
    "JO": { "fa": "اردن", "en": "Jordan" },
    "KZ": { "fa": "قزاقستان", "en": "Kazakhstan" },
    "KW": { "fa": "کویت", "en": "Kuwait" },
    "LV": { "fa": "لتونی", "en": "Latvia" },
    "LB": { "fa": "لبنان", "en": "Lebanon" },
    "LT": { "fa": "لیتوانی", "en": "Lithuania" },
    "LU": { "fa": "لوکزامبورگ", "en": "Luxembourg" },
    "MY": { "fa": "مالزی", "en": "Malaysia" },
    "MX": { "fa": "مکزیک", "en": "Mexico" },
    "MD": { "fa": "مولداوی", "en": "Moldova" },
    "MA": { "fa": "مراکش", "en": "Morocco" },
    "NL": { "fa": "هلند", "en": "Netherlands" },
    "NZ": { "fa": "نیوزیلند", "en": "New Zealand" },
    "NG": { "fa": "نیجریه", "en": "Nigeria" },
    "NO": { "fa": "نروژ", "en": "Norway" },
    "OM": { "fa": "عمان", "en": "Oman" },
    "PK": { "fa": "پاکستان", "en": "Pakistan" },
    "PS": { "fa": "فلسطین", "en": "Palestine" },
    "PE": { "fa": "پرو", "en": "Peru" },
    "PH": { "fa": "فیلیپین", "en": "Philippines" },
    "PL": { "fa": "لهستان", "en": "Poland" },
    "PT": { "fa": "پرتغال", "en": "Portugal" },
    "QA": { "fa": "قطر", "en": "Qatar" },
    "RO": { "fa": "رومانی", "en": "Romania" },
    "RU": { "fa": "روسیه", "en": "Russia" },
    "SA": { "fa": "عربستان", "en": "Saudi Arabia" },
    "RS": { "fa": "صربستان", "en": "Serbia" },
    "SG": { "fa": "سنگاپور", "en": "Singapore" },
    "SK": { "fa": "اسلواکی", "en": "Slovakia" },
    "SI": { "fa": "اسلوونی", "en": "Slovenia" },
    "ZA": { "fa": "آفریقای جنوبی", "en": "South Africa" },
    "KR": { "fa": "کره جنوبی", "en": "South Korea" },
    "ES": { "fa": "اسپانیا", "en": "Spain" },
    "SE": { "fa": "سوئد", "en": "Sweden" },
    "CH": { "fa": "سوئیس", "en": "Switzerland" },
    "SY": { "fa": "سوریه", "en": "Syria" },
    "TW": { "fa": "تایوان", "en": "Taiwan" },
    "TH": { "fa": "تایلند", "en": "Thailand" },
    "TR": { "fa": "ترکیه", "en": "Turkey" },
    "UA": { "fa": "اوکراین", "en": "Ukraine" },
    "AE": { "fa": "امارات", "en": "UAE" },
    "GB": { "fa": "انگلستان", "en": "UK" },
    "US": { "fa": "آمریکا", "en": "USA" },
    "UZ": { "fa": "ازبکستان", "en": "Uzbekistan" },
    "VN": { "fa": "ویتنام", "en": "Vietnam" }
};

function flagFromCode(code) {
    if (!code || code.length !== 2) return '';
    const upperCode = code.toUpperCase();
    return String.fromCodePoint(...upperCode.split('').map(c => c.charCodeAt(0) + 127397));
}

export async function onRequestGet() {
    const countries = Object.entries(COUNTRY_DATA).map(([code, data]) => ({
        code,
        fa: data.fa,
        en: data.en,
        flag: flagFromCode(code)
    }));
    
    return Response.json(countries);
}
const COUNTRY_DATA = {
    "EU": { "fa": "اتحادیه اروپا", "en": "European Union" },
    "AF": { "fa": "افغانستان", "en": "Afghanistan" },
    "AL": { "fa": "آلبانی", "en": "Albania" },
    "DZ": { "fa": "الجزایر", "en": "Algeria" },
    "AD": { "fa": "آندورا", "en": "Andorra" },
    "AO": { "fa": "آنگولا", "en": "Angola" },
    "AR": { "fa": "آرژانتین", "en": "Argentina" },
    "AM": { "fa": "ارمنستان", "en": "Armenia" },
    "AU": { "fa": "استرالیا", "en": "Australia" },
    "AT": { "fa": "اتریش", "en": "Austria" },
    "AZ": { "fa": "آذربایجان", "en": "Azerbaijan" },
    "BH": { "fa": "بحرین", "en": "Bahrain" },
    "BD": { "fa": "بنگلادش", "en": "Bangladesh" },
    "BY": { "fa": "بلاروس", "en": "Belarus" },
    "BE": { "fa": "بلژیک", "en": "Belgium" },
    "BR": { "fa": "برزیل", "en": "Brazil" },
    "BG": { "fa": "بلغارستان", "en": "Bulgaria" },
    "CA": { "fa": "کانادا", "en": "Canada" },
    "CL": { "fa": "شیلی", "en": "Chile" },
    "CN": { "fa": "چین", "en": "China" },
    "CO": { "fa": "کلمبیا", "en": "Colombia" },
    "HR": { "fa": "کرواسی", "en": "Croatia" },
    "CY": { "fa": "قبرس", "en": "Cyprus" },
    "CZ": { "fa": "چک", "en": "Czechia" },
    "DK": { "fa": "دانمارک", "en": "Denmark" },
    "EG": { "fa": "مصر", "en": "Egypt" },
    "EE": { "fa": "استونی", "en": "Estonia" },
    "FI": { "fa": "فنلاند", "en": "Finland" },
    "FR": { "fa": "فرانسه", "en": "France" },
    "GE": { "fa": "گرجستان", "en": "Georgia" },
    "DE": { "fa": "آلمان", "en": "Germany" },
    "GR": { "fa": "یونان", "en": "Greece" },
    "HK": { "fa": "هنگ کنگ", "en": "Hong Kong" },
    "HU": { "fa": "مجارستان", "en": "Hungary" },
    "IS": { "fa": "ایسلند", "en": "Iceland" },
    "IN": { "fa": "هند", "en": "India" },
    "ID": { "fa": "اندونزی", "en": "Indonesia" },
    "IR": { "fa": "ایران", "en": "Iran" },
    "IQ": { "fa": "عراق", "en": "Iraq" },
    "IE": { "fa": "ایرلند", "en": "Ireland" },
    "IL": { "fa": "اسرائیل", "en": "Israel" },
    "IT": { "fa": "ایتالیا", "en": "Italy" },
    "JP": { "fa": "ژاپن", "en": "Japan" },
    "JO": { "fa": "اردن", "en": "Jordan" },
    "KZ": { "fa": "قزاقستان", "en": "Kazakhstan" },
    "KW": { "fa": "کویت", "en": "Kuwait" },
    "LV": { "fa": "لتونی", "en": "Latvia" },
    "LB": { "fa": "لبنان", "en": "Lebanon" },
    "LT": { "fa": "لیتوانی", "en": "Lithuania" },
    "LU": { "fa": "لوکزامبورگ", "en": "Luxembourg" },
    "MY": { "fa": "مالزی", "en": "Malaysia" },
    "MX": { "fa": "مکزیک", "en": "Mexico" },
    "MD": { "fa": "مولداوی", "en": "Moldova" },
    "MA": { "fa": "مراکش", "en": "Morocco" },
    "NL": { "fa": "هلند", "en": "Netherlands" },
    "NZ": { "fa": "نیوزیلند", "en": "New Zealand" },
    "NG": { "fa": "نیجریه", "en": "Nigeria" },
    "NO": { "fa": "نروژ", "en": "Norway" },
    "OM": { "fa": "عمان", "en": "Oman" },
    "PK": { "fa": "پاکستان", "en": "Pakistan" },
    "PS": { "fa": "فلسطین", "en": "Palestine" },
    "PE": { "fa": "پرو", "en": "Peru" },
    "PH": { "fa": "فیلیپین", "en": "Philippines" },
    "PL": { "fa": "لهستان", "en": "Poland" },
    "PT": { "fa": "پرتغال", "en": "Portugal" },
    "QA": { "fa": "قطر", "en": "Qatar" },
    "RO": { "fa": "رومانی", "en": "Romania" },
    "RU": { "fa": "روسیه", "en": "Russia" },
    "SA": { "fa": "عربستان", "en": "Saudi Arabia" },
    "RS": { "fa": "صربستان", "en": "Serbia" },
    "SG": { "fa": "سنگاپور", "en": "Singapore" },
    "SK": { "fa": "اسلواکی", "en": "Slovakia" },
    "SI": { "fa": "اسلوونی", "en": "Slovenia" },
    "ZA": { "fa": "آفریقای جنوبی", "en": "South Africa" },
    "KR": { "fa": "کره جنوبی", "en": "South Korea" },
    "ES": { "fa": "اسپانیا", "en": "Spain" },
    "SE": { "fa": "سوئد", "en": "Sweden" },
    "CH": { "fa": "سوئیس", "en": "Switzerland" },
    "SY": { "fa": "سوریه", "en": "Syria" },
    "TW": { "fa": "تایوان", "en": "Taiwan" },
    "TH": { "fa": "تایلند", "en": "Thailand" },
    "TR": { "fa": "ترکیه", "en": "Turkey" },
    "UA": { "fa": "اوکراین", "en": "Ukraine" },
    "AE": { "fa": "امارات", "en": "UAE" },
    "GB": { "fa": "انگلستان", "en": "UK" },
    "US": { "fa": "آمریکا", "en": "USA" },
    "UZ": { "fa": "ازبکستان", "en": "Uzbekistan" },
    "VN": { "fa": "ویتنام", "en": "Vietnam" }
};

function flagFromCode(code) {
    if (!code || code.length !== 2) return '';
    const upperCode = code.toUpperCase();
    return String.fromCodePoint(...upperCode.split('').map(c => c.charCodeAt(0) + 127397));
}

export async function onRequestGet(context) {
    const { env } = context;
    
    try {
        const customCountries = await env.KV.get('countries:list', 'json') || [];
        
        const allCountries = Object.entries(COUNTRY_DATA).map(([code, data]) => ({
            code,
            fa: data.fa,
            en: data.en,
            flag: flagFromCode(code)
        }));
        
        customCountries.forEach(country => {
            if (!allCountries.find(c => c.code === country.code)) {
                allCountries.push({
                    ...country,
                    flag: flagFromCode(country.code)
                });
            }
        });
        
        return Response.json(allCountries);
    } catch (error) {
        console.error('Countries error:', error);
        const defaultCountries = Object.entries(COUNTRY_DATA).map(([code, data]) => ({
            code,
            fa: data.fa,
            en: data.en,
            flag: flagFromCode(code)
        }));
        return Response.json(defaultCountries);
    }
}
