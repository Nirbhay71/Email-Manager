const DATE_REGEX = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/;

export function extractDate(text){
    const match = text.match(DATE_REGEX);
    if(!match) return null;
    
    let [, day, month, year] = match;
    if(year.length === 2) year = `20${year}`;

    day = day.padStart(2, "0");
    month = month.padStart(2, "0");

    const d = Number(day);
    const m = Number(month);
    
    if(m<1 || m>12 || d<1 || d>31) return null;

    return `${year}-${month}-${day}`;
}