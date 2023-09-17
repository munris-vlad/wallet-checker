import moment from "moment"

export function formatDate(date) {
    return date ? moment(date).format('DD.MM.YY') : ''
}