// Formats a timestamp to a humanly-readable string
export function format(ms: number) {
    return Math.floor(ms/1000/60/60) + " hours and " + Math.floor(((ms - (1000 * 60 * 60 * Math.floor(ms/1000/60/60)))/1000/60)) + " minutes";
}