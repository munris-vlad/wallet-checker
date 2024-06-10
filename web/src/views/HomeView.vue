<template>
    <div class="home" v-if="isDataLoaded">
        <div class="min-w-full header pb-4 pt-4 text-center">
            <h1 class="text-3xl pb-5">Wallet checker by Munris</h1>

            <table class="min-w-full border text-center text-sm font-light dark:border-gray-700">
                <thead class="border-b font-medium dark:border-gray-700">
                    <tr>
                        <th class="border-b border-r font-medium dark:border-gray-700 text-xs px-2 py-2 cursor-pointer select-none">Module</th>
                        <th class="border-b border-r font-medium dark:border-gray-700 text-xs px-2 py-2 cursor-pointer select-none">Status</th>
                        <th class="border-b border-r font-medium dark:border-gray-700 text-xs px-2 py-2 cursor-pointer select-none">Count</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(module, key) in appconfig.modules" :key="key" class="border-b dark:border-gray-700">
                        <td class="whitespace-nowrap border-r px-3 py-2 font-regular text-xs dark:border-gray-700 text-transform: capitalize">{{ key }}</td>
                        <td class="whitespace-nowrap border-r px-3 py-2 font-regular text-xs dark:border-gray-700">
                            <span v-if="module.enabled" class="text-green-500">Enabled</span>
                            <span v-else class="text-red-500">Disabled</span>
                        </td>
                        <td class="whitespace-nowrap border-r px-3 py-2 font-regular text-xs dark:border-gray-700"><span v-if="data[key + '_wallets']">{{ data[key + '_wallets'].length }}</span></td>
                    </tr>
                </tbody>
            </table>


            <ul class="pt-5">
                <li class="pt-2">Author: <a href="https://t.me/by_munris" class="text-green-500 hover:text-green-600"
                        target="_blank">by Munris</a></li>
                <li class="pt-2"><a href="https://munris.tech/donate" class="text-green-500 hover:text-green-600"
                        target="_blank">Donate</a></li>
            </ul>
        </div>
    </div>
</template>

<script>

export default {
    data() {
        return {
            appconfig: this.$appconfig,
            data: [],
            isDataLoaded: false,
        }
    },
    created() {
        this.loadData()
    },
    methods: {
        loadData() {
            this.$axios.get('/api/stats').then((response) => {
                this.data = response.data
                this.isDataLoaded = true
            }).catch((error) => {
                console.error('Ошибка при загрузке данных:', error)
            })
        },
    },
}
</script>
