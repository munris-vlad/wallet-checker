export function sortMethods(type, head, direction) {
    return (a, b) => {
        if (a.wallet === 'Total' || b.wallet === 'Total') {
            if (a.wallet === 'Total' && b.wallet !== 'Total') {
                return 1
            } else if (a.wallet !== 'Total' && b.wallet === 'Total') {
                return -1
            } else {
                if (type === 'String') {
                    return direction === 1 ? a[head].localeCompare(b[head]) : b[head].localeCompare(a[head])
                } else if (type === 'Number') {
                    if (head === 'First tx' || head === 'Last tx') {
                        const dateA = new Date(a[head]).getTime()
                        const dateB = new Date(b[head]).getTime()
                        return direction === 1 ? dateA - dateB : dateB - dateA
                    } else {
                        return direction === 1 ? Number(b[head]) - Number(a[head]) : Number(a[head]) - Number(b[head])
                    }
                }
            }
        } else {
            if (type === 'String') {
                return direction === 1 ? a[head].localeCompare(b[head]) : b[head].localeCompare(a[head])
            } else if (type === 'Number') {
                if (head === 'First tx' || head === 'Last tx') {
                    const dateA = new Date(a[head]).getTime()
                    const dateB = new Date(b[head]).getTime()
                    return direction === 1 ? dateA - dateB : dateB - dateA
                } else {
                    return direction === 1 ? Number(b[head]) - Number(a[head]) : Number(a[head]) - Number(b[head])
                }
            }
        }
    }
}