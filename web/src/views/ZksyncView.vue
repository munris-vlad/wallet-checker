<template>
    <div class="pb-5">
        <div class="min-w-full text-center header pb-4 pt-4">
            <h1 class="text-3xl">ZkSync</h1>
        </div>
        <table class="min-w-full border text-center text-sm font-light dark:border-gray-700" v-if="isDataLoaded && !isError">
            <thead class="border-b font-medium dark:border-gray-700">
                <tr>
                    <th v-for="(head, index) in headers" :key="index" :class="thClass" @click="sort(head)">{{ head }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, index) in sortedData" :key="index" class="border-b dark:border-gray-700">
                    <td :class="tdClass">{{ item['n'] }}</td>
                    <td :class="tdClass + ' text-left'"><strong>{{ item['wallet'] }}</strong></td>
                    <td :class="[tdClass, parseFloat(item['ETH']) < 0.005 ? 'text-red-500' : '']">{{ item['ETH'] }} (${{ item['ETH USDVALUE'] }})</td>
                    <td :class="tdClass">{{ item['USDC'] }}</td>
                    <td :class="tdClass">{{ item['USDT'] }}</td>
                    <td :class="tdClass">{{ item['DAI'] }}</td>
                    <td :class="tdClass">{{ item['TX Count'] }}</td>
                    <td :class="tdClass">{{ item['Volume'] > 0 ? '$'+item['Volume'] : '' }}</td>
                    <td :class="tdClass">{{ item['Contracts'] }}</td>
                    <td :class="tdClass">{{ item['Days'] }}</td>
                    <td :class="tdClass">{{ item['Weeks'] }}</td>
                    <td :class="tdClass">{{ item['Months'] }}</td>
                    <td :class="tdClass">{{ formattedDate(item['First tx']) }}</td>
                    <td :class="tdClass">{{ formattedDate(item['Last tx']) }}</td>
                    <td :class="tdClass">{{ item['Total gas spent'] }} (${{ item['Total gas spent USDVALUE'] }})</td>
                </tr>
            </tbody>
        </table>
        <div class="text-center text-2xl" v-if="!isDataLoaded && !isError">
          Data loading...
        </div>

        <div class="text-center text-2xl" v-if="isError">
          Error: {{ error }}
        </div>
    </div>
</template>

<script>
import moment from "moment"
export default {
    data() {
        return {
            isDataLoaded: false,
            isError: false,
            error: '',
            data: [],
            thClass: 'border-b border-r font-medium dark:border-gray-700 text-xs px-2 py-2',
            tdClass: 'whitespace-nowrap border-r px-3 py-2 font-regular text-xs dark:border-gray-700',
            sortDirection: 1,
            sortBy: 'n',
            headers: [
                'n',
                'Wallet',
                'ETH',
                'USDC',
                'USDT',
                'DAI',
                'TX Count',
                'Volume',
                'Contracts',
                'Days',
                'Weeks',
                'Months',
                'First tx',
                'Last tx',
                'Total gas spent'
            ]
        }
    },
    created() {
        this.loadData()
    },
    computed: {
        sortedData: {
            get() {
                return this.data
            },
            set(value) {
                this.data = value
            },
        },
    },
    methods: {
        loadData() {
            this.$axios.get('/api/zksync').then((response) => {
                this.data = response.data.sort((a, b) => a.n - b.n)
                this.isDataLoaded = true
            }).catch((error) => {
                this.isError = true
                this.error = error.toString()
            })
        },
        sort(head) {
            this.sortBy = head
            this.sortDirection *= -1
            this.sortData()
        },
        sortMethods(type, head, direction) {
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
        },
        sortData() {
            const type = this.sortBy === 'name' ? 'String' : 'Number'
            const direction = this.sortDirection
            const head = this.sortBy
            this.sortedData = this.data.slice().sort(this.sortMethods(type, head, direction))
        },
        formattedDate(date) {
            return date ? moment(date).format('DD.MM.YY') : ''
        }
    },
}
</script>

<style>
</style>
