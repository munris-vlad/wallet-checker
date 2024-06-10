<template>
    <div class="pb-5">
        <div class="min-w-full text-center header pb-4 pt-4">
            <h1 class="text-3xl">Galxe</h1>
        </div>
        <div class="min-w-full pb-4 pt-4">
            <div class="flex space-x-4 content-center items-center place-content-center">
                <button v-for="(space, index) in spaces" :key="index" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" :class="{'bg-green-700' : activeSpace === space}" @click="loadSpace(space)">{{ space }}</button>
            </div>
        </div>
        <table class="min-w-full border text-center text-sm font-light dark:border-gray-700"
            v-if="isDataLoaded && !isError">
            <thead class="border-b font-medium dark:border-gray-700">
                <tr>
                    <th v-for="(head, index) in headers" :key="index" :class="thClass" @click="sort(head)">{{ head }}
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, index) in sortedData" :key="index" class="border-b dark:border-gray-700">
                    <td :class="tdClass">{{ item['n'] }}</td>
                    <td :class="tdClass + ' text-left'">
                        <div class="flex space-x-2 pt-3 pb-2">
                            <strong>{{ item['wallet'] }}</strong>
                            <div class="h-4 w-4" v-if="item['wallet'] !== 'Total'">
                                <a target="_blank" :href="'https://debank.com/profile/' + item['Wallet']"><img
                                        class="rounded-full mb-1" :src="'/debank.png'" alt=""></a>
                            </div>
                        </div>
                    </td>
                    <td :class="tdClass">{{ item['GalxePoints'] }}</td>
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

import { sortMethods } from "@/utils/sorting"
import { formatDate } from "@/utils/formatDate"
import { thClass, tdClass } from "@/utils/tableClass"

export default {
    data() {
        return {
            appconfig: this.$appconfig,
            isDataLoaded: false,
            isError: false,
            error: '',
            data: [],
            thClass: thClass,
            tdClass: tdClass,
            sortDirection: 1,
            sortBy: 'n',
            tokens: {},
            activeSpace: 'Caldera',
            headers: [
                'n',
                'Wallet',
                'GalxePoints',
            ],
            spaces: [],
        }
    },
    created() {
        this.spaces = this.appconfig.modules.galxe.spaces
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
        formatDate,
        loadData() {
            this.$axios.get('/api/galxe?space=Caldera').then((response) => {
                this.data = response.data.sort((a, b) => a.n - b.n)
                this.isDataLoaded = true
            }).catch((error) => {
                this.isError = true
                this.error = error.toString()
            })
        },
        loadSpace(space) {
            this.activeSpace = space
            this.$axios.get(`/api/galxe?space=${this.activeSpace}`).then((response) => {
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
        processNumber(numStr) {
            const num = parseFloat(numStr)

            if (Number.isInteger(num)) {
                if (num.toFixed(0).length > 5) {
                    return num.toFixed(0).slice(0, 3) + '...'
                } else {
                    return num
                }
            }

            return parseFloat(num).toFixed(3)
        }
    },
}
</script>