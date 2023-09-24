<template>
    <div class="pb-5">
        <div class="min-w-full text-center header pb-4 pt-4">
            <h1 class="text-3xl">ZkSync</h1>
        </div>
        <div class="pb-1 pt-4 pl-0" v-if="isDataLoaded && !isError">
            <div class="text-gray-500 hover:text-gray-600 px-2 cursor-pointer select-none pl-0 w-32" @click="toggleProtocol">
                <span v-if="isShowProtocols">Hide</span>
                <span v-if="!isShowProtocols">Show</span> protocols
            </div>
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
                    <td :class="tdClass + ' text-left'">
                        <div class="flex space-x-2 pt-3 pb-2">
                            <strong>{{ item['wallet'] }}</strong>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'Total'">
                                <a target="_blank" :href="'https://debank.com/profile/'+item['wallet']"><img class="rounded-full mb-1" :src="'/debank.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'Total'">
                                <a target="_blank" :href="'https://explorer.zksync.io/address/'+item['wallet']"><img class="rounded-full mb-1" :src="'/zksync-scan.png'" alt=""></a>
                            </div>
                        </div>
                        <div class="flex space-x-2 pt-3 pb-4 select-none" v-if="isShowProtocols">
                            <div class="h-4 w-4 text-center" v-for="(info, protocol) in item['Protocols']" :key="protocol" :title="protocol">
                                <a :href="info.url" target="_blank">
                                    <img class="rounded-full mb-1" :src="'/'+protocol+'.png'" :alt="protocol">
                                    <span class="text-xs protocol-text">{{ info.count }}</span>
                                </a>
                            </div>
                        </div>
                    </td>
                    <td :class="[tdClass, parseFloat(item['ETH']) < 0.005 ? 'text-red-500' : '']">{{ item['ETH'] }} (${{ item['ETH USDVALUE'] }})</td>
                    <td :class="tdClass">{{ item['USDC'] }}</td>
                    <td :class="tdClass">{{ item['USDT'] }}</td>
                    <td :class="tdClass">{{ item['DAI'] }}</td>
                    <td :class="tdClass">{{ item['TX Count'] }}</td>
                    <td :class="tdClass">{{ item['Volume'] > 0 ? '$'+item['Volume'] : '' }}</td>
                    <td :class="tdClass">{{ item['Contracts'] }}</td>
                    <td :class="tdClass">{{ item['Bridge to'] }}</td>
                    <td :class="tdClass">{{ item['Bridge from'] }}</td>
                    <td :class="tdClass">{{ item['Days'] }}</td>
                    <td :class="tdClass">{{ item['Weeks'] }}</td>
                    <td :class="tdClass">{{ item['Months'] }}</td>
                    <td :class="tdClass">{{ formatDate(item['First tx']) }}</td>
                    <td :class="tdClass">{{ formatDate(item['Last tx']) }}</td>
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

import {sortMethods} from "@/utils/sorting"
import {formatDate} from "@/utils/formatDate"
import {thClass, tdClass} from "@/utils/tableClass"

export default {
    data() {
        return {
            isDataLoaded: false,
            isError: false,
            isShowProtocols: true,
            error: '',
            data: [],
            thClass: thClass,
            tdClass: tdClass,
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
                'Bridge to',
                'Bridge from',
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
        const storedState = localStorage.getItem('show_protocols')
        if (storedState !== undefined) {
            this.isShowProtocols = storedState !== 'false'
        }
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
        formatDate,
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
        sortData() {
            const type = this.sortBy === 'name' ? 'String' : 'Number'
            const direction = this.sortDirection
            const head = this.sortBy
            this.sortedData = this.data.slice().sort(sortMethods(type, head, direction))
        },
        toggleProtocol() {
            this.isShowProtocols = !this.isShowProtocols
            localStorage.setItem('show_protocols', this.isShowProtocols)
        }
    },
}
</script>
<style>
.protocol-text {
    font-size: 0.7rem;
}
</style>
